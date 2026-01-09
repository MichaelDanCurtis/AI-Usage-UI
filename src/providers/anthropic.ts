import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit, Quota } from '../types/index.js';
import logger from '../utils/logger.js';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface OAuthUsageResponse {
  five_hour: {
    utilization: number;
    resets_at: string;
  };
  seven_day: {
    utilization: number;
    resets_at: string;
  };
}

interface LocalStatsCache {
  version: number;
  lastComputedDate: string;
  dailyActivity: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
  }>;
  dailyModelTokens: Array<{
    date: string;
    tokensByModel: Record<string, number>;
  }>;
  modelUsage: Record<string, {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
    costUSD: number;
  }>;
  totalSessions: number;
  totalMessages: number;
}

// Claude subscription tiers with estimated limits
// Reference: https://www.anthropic.com/pricing (Claude Max plans)
interface ClaudeTier {
  name: string;
  monthlyCost: number;
  fiveHourMessages: number;      // Estimated messages per 5-hour window
  weeklyMessages: number;        // Estimated messages per 7-day rolling window
  sessionsPerMonth: number;      // Guideline for monthly sessions
}

const CLAUDE_TIERS: Record<string, ClaudeTier> = {
  pro: {
    name: 'Claude Pro',
    monthlyCost: 20,
    fiveHourMessages: 45,        // ~45 messages per 5-hour window
    weeklyMessages: 500,         // Estimated weekly limit
    sessionsPerMonth: 50,
  },
  max_5x: {
    name: 'Claude Max 5x',
    monthlyCost: 100,
    fiveHourMessages: 225,       // 5x Pro limits
    weeklyMessages: 2500,
    sessionsPerMonth: 250,
  },
  max_20x: {
    name: 'Claude Max 20x',
    monthlyCost: 200,
    fiveHourMessages: 900,       // ~900 messages per 5-hour window
    weeklyMessages: 10000,       // Estimated weekly limit
    sessionsPerMonth: 1000,
  },
};

// Default tier - can be configured via environment variable
const DEFAULT_CLAUDE_TIER = process.env.CLAUDE_TIER || 'max_20x';

export class AnthropicProvider extends BaseProvider {
  private oauthToken: string | null = null;
  private localStatsPath: string;
  private conversationsPath: string;
  private tier: ClaudeTier;

  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.anthropic.com' });
    this.oauthToken = this.getOAuthToken();
    this.localStatsPath = join(homedir(), '.claude', 'stats-cache.json');
    this.conversationsPath = join(homedir(), '.claude', 'projects');

    // Get tier from environment or use default
    const tierKey = (process.env.CLAUDE_TIER || DEFAULT_CLAUDE_TIER).toLowerCase();
    this.tier = CLAUDE_TIERS[tierKey] || CLAUDE_TIERS.max_20x;

    logger.info(`Anthropic provider initialized with tier: ${this.tier.name}`);
  }

  get id(): string {
    return 'anthropic';
  }

  get name(): string {
    return 'Anthropic Claude';
  }

  private getOAuthToken(): string | null {
    try {
      const credentialsJson = execSync(
        'security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null',
        { encoding: 'utf-8' }
      ).trim();

      const credentials = JSON.parse(credentialsJson);
      const token = credentials?.claudeAiOauth?.accessToken;

      if (token) {
        logger.info('Successfully retrieved OAuth token from Keychain');
        return token;
      }

      return null;
    } catch (error) {
      logger.debug('Could not retrieve OAuth token from Keychain');
      return null;
    }
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching Anthropic usage data');

      if (this.oauthToken) {
        const oauthUsage = await this.fetchOAuthUsage();
        if (oauthUsage.status === 'active' && oauthUsage.rateLimit) {
          return oauthUsage;
        }
      }

      const localStats = this.readLocalStats();
      if (localStats) {
        return this.buildUsageFromLocalStats(localStats);
      }

      return await this.fetchApiKeyUsage();
    } catch (error) {
      logger.error({ error }, `Error fetching usage for ${this.id}:`);
      return this.createErrorUsage(error);
    }
  }

  private readLocalStats(): LocalStatsCache | null {
    try {
      if (!existsSync(this.localStatsPath)) {
        logger.debug('Local stats cache not found');
        return null;
      }

      const content = readFileSync(this.localStatsPath, 'utf-8');
      const stats: LocalStatsCache = JSON.parse(content);
      logger.info('Successfully read local Claude stats cache');
      return stats;
    } catch (error) {
      logger.warn('Could not read local stats cache');
      return null;
    }
  }

  private buildUsageFromLocalStats(stats: LocalStatsCache): ProviderUsage {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheRead = 0;
    let totalCacheCreation = 0;
    let totalMarketValue = 0;

    // Build model breakdown
    const modelBreakdown: Array<{ model: string; requests: number; tokens: number; cost: number }> = [];

    for (const [model, usage] of Object.entries(stats.modelUsage)) {
      // Actual API tokens (not cache)
      const baseInputTokens = usage.inputTokens;
      const outputTokens = usage.outputTokens;
      const cacheReadTokens = usage.cacheReadInputTokens;
      const cacheCreationTokens = usage.cacheCreationInputTokens;

      totalInputTokens += baseInputTokens;
      totalOutputTokens += outputTokens;
      totalCacheRead += cacheReadTokens;
      totalCacheCreation += cacheCreationTokens;

      // Calculate market value (what it would cost at API rates)
      // Cache reads are 90% discounted, cache writes are 25% more expensive
      // Reference: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
      let inputRate = 0;
      let outputRate = 0;
      let cacheReadRate = 0;
      let cacheWriteRate = 0;

      if (model.includes('opus')) {
        // Opus 4: $15/M input, $75/M output, cache read $1.50/M, cache write $18.75/M
        inputRate = 15;
        outputRate = 75;
        cacheReadRate = 1.50;
        cacheWriteRate = 18.75;
      } else if (model.includes('sonnet')) {
        // Sonnet 4: $3/M input, $15/M output, cache read $0.30/M, cache write $3.75/M
        inputRate = 3;
        outputRate = 15;
        cacheReadRate = 0.30;
        cacheWriteRate = 3.75;
      } else if (model.includes('haiku')) {
        // Haiku: $0.25/M input, $1.25/M output, cache read $0.025/M, cache write $0.30/M
        inputRate = 0.25;
        outputRate = 1.25;
        cacheReadRate = 0.025;
        cacheWriteRate = 0.30;
      }

      const modelCost =
        (baseInputTokens / 1_000_000) * inputRate +
        (outputTokens / 1_000_000) * outputRate +
        (cacheReadTokens / 1_000_000) * cacheReadRate +
        (cacheCreationTokens / 1_000_000) * cacheWriteRate;

      totalMarketValue += modelCost;

      // Total tokens for this model (actual API usage)
      const modelTokens = baseInputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;

      // Format model name for display
      let displayName = model;
      if (model.includes('opus')) displayName = 'Claude Opus 4';
      else if (model.includes('sonnet')) displayName = 'Claude Sonnet 4';
      else if (model.includes('haiku')) displayName = 'Claude Haiku';

      modelBreakdown.push({
        model: displayName,
        requests: 0, // We don't have per-model request counts
        tokens: modelTokens,
        cost: Math.round(modelCost * 100) / 100
      });
    }

    // Total tokens = all tokens processed (input + output + cache)
    const totalTokens = totalInputTokens + totalOutputTokens + totalCacheRead + totalCacheCreation;

    // Calculate cache efficiency
    const totalCacheTokens = totalCacheRead + totalCacheCreation;
    const cacheHitRate = totalCacheTokens > 0 ? Math.round((totalCacheRead / totalCacheTokens) * 100) : 0;

    // Sum up all activity (not just today)
    let totalToolCalls = 0;
    stats.dailyActivity.forEach(day => {
      totalToolCalls += day.toolCallCount;
    });

    // Market value rounded
    const marketValue = Math.round(totalMarketValue * 100) / 100;

    // Calculate estimated usage against tier limits
    const fiveHourUsage = this.calculateFiveHourUsage(stats);
    const weeklyUsage = this.calculateWeeklyUsage(stats);

    logger.info(`Anthropic [${this.tier.name}]: ${stats.totalMessages} msgs, ${stats.totalSessions} sessions, ${totalToolCalls} tool calls`);
    logger.info(`Anthropic tokens: ${(totalInputTokens/1000).toFixed(1)}K in, ${(totalOutputTokens/1000).toFixed(1)}K out, ${(totalCacheRead/1_000_000).toFixed(1)}M cache read, ${(totalCacheCreation/1_000_000).toFixed(1)}M cache write`);
    logger.info(`Anthropic market value: $${marketValue.toFixed(2)} | Cache hit rate: ${cacheHitRate}%`);
    logger.info(`Anthropic limits: 5hr: ${fiveHourUsage.used}/${fiveHourUsage.limit} (${fiveHourUsage.percentage}%) | 7d: ${weeklyUsage.used}/${weeklyUsage.limit} (${weeklyUsage.percentage}%)`);

    return {
      id: this.id,
      name: this.name,
      requests: stats.totalMessages,
      cost: this.tier.monthlyCost, // Actual subscription cost
      tokens: totalTokens,
      status: 'active',
      lastUpdated: new Date(),
      planName: this.tier.name,
      rateLimit: {
        limit: fiveHourUsage.limit,
        remaining: fiveHourUsage.remaining,
        reset: fiveHourUsage.reset,
        percentage: 100 - fiveHourUsage.percentage, // percentage remaining
      },
      quota: {
        monthlyLimit: weeklyUsage.limit,
        monthlyUsed: weeklyUsage.used,
        resetDate: weeklyUsage.reset,
        percentage: weeklyUsage.percentage,
      },
      modelBreakdown: modelBreakdown.sort((a, b) => b.cost - a.cost),
      codingMetrics: {
        sessions: stats.totalSessions,
        toolCalls: totalToolCalls,
        cacheHitRate: cacheHitRate,
        cacheReadTokens: totalCacheRead,
        cacheCreationTokens: totalCacheCreation,
        marketValue: marketValue,
        subscriptionCost: this.tier.monthlyCost,
      },
    };
  }

  /**
   * Calculate estimated 5-hour window usage based on recent activity
   * Uses daily activity data to estimate messages in the current 5-hour window
   */
  private calculateFiveHourUsage(stats: LocalStatsCache): { used: number; limit: number; remaining: number; percentage: number; reset: Date } {
    const now = new Date();
    const fiveHoursMs = 5 * 60 * 60 * 1000;

    // Get recent daily activity to estimate current window usage
    // Since we only have daily granularity, we'll estimate based on today's activity
    const todayActivity = stats.dailyActivity.find(d => d.date === stats.lastComputedDate);
    const todayMessages = todayActivity?.messageCount || 0;

    // Estimate 5-hour window usage as a fraction of daily usage
    // Assume relatively even distribution throughout the day
    // If user is actively using right now, weight recent activity higher
    const hoursInDay = 24;
    const fiveHourFraction = 5 / hoursInDay;

    // Use today's messages as a proxy, scaled by time of day
    const currentHour = now.getHours();
    const hoursElapsedToday = currentHour + (now.getMinutes() / 60);

    // If we're early in the day, scale up; if late, scale down
    let estimatedFiveHourMessages: number;
    if (hoursElapsedToday < 5) {
      // Early in day - use actual today count (likely close to 5-hour window)
      estimatedFiveHourMessages = todayMessages;
    } else {
      // Later in day - estimate based on daily rate
      const hourlyRate = todayMessages / Math.max(hoursElapsedToday, 1);
      estimatedFiveHourMessages = Math.round(hourlyRate * 5);
    }

    const limit = this.tier.fiveHourMessages;
    const used = Math.min(estimatedFiveHourMessages, limit);
    const remaining = Math.max(0, limit - used);
    const percentage = Math.round((used / limit) * 100);

    // Reset time: 5 hours from now (rolling window)
    const reset = new Date(now.getTime() + fiveHoursMs);

    return { used, limit, remaining, percentage, reset };
  }

  /**
   * Calculate estimated 7-day rolling window usage
   */
  private calculateWeeklyUsage(stats: LocalStatsCache): { used: number; limit: number; remaining: number; percentage: number; reset: Date } {
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now.getTime() - sevenDaysMs);

    // Sum up messages from the last 7 days of daily activity
    let weeklyMessages = 0;
    stats.dailyActivity.forEach(day => {
      const dayDate = new Date(day.date);
      if (dayDate >= sevenDaysAgo) {
        weeklyMessages += day.messageCount;
      }
    });

    const limit = this.tier.weeklyMessages;
    const used = Math.min(weeklyMessages, limit);
    const remaining = Math.max(0, limit - used);
    const percentage = Math.round((used / limit) * 100);

    // Reset time: rolling, so oldest day's messages will drop off
    // Find the oldest day in the window and calculate when it expires
    const oldestDayInWindow = stats.dailyActivity
      .filter(d => new Date(d.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    let reset = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: tomorrow
    if (oldestDayInWindow) {
      const oldestDate = new Date(oldestDayInWindow.date);
      reset = new Date(oldestDate.getTime() + sevenDaysMs);
    }

    return { used, limit, remaining, percentage, reset };
  }

  private async fetchOAuthUsage(): Promise<ProviderUsage> {
    try {
      const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.oauthToken}`,
          'anthropic-beta': 'oauth-2025-04-20',
          'User-Agent': 'claude-code/2.0.31',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        if (errorBody.includes('scope')) {
          logger.debug('OAuth token lacks user:profile scope - trying local stats');
        } else {
          logger.warn(`OAuth usage API returned ${response.status}`);
        }

        const localStats = this.readLocalStats();
        if (localStats) {
          return this.buildUsageFromLocalStats(localStats);
        }

        return await this.fetchApiKeyUsage();
      }

      const data: OAuthUsageResponse = await response.json();

      const fiveHourPercent = Math.round(data.five_hour.utilization * 100);
      const sevenDayPercent = Math.round(data.seven_day.utilization * 100);

      logger.info(`Anthropic OAuth usage - 5hr: ${fiveHourPercent}%, 7d: ${sevenDayPercent}%`);

      return {
        id: this.id,
        name: this.name,
        requests: 0,
        cost: 0,
        tokens: 0,
        status: 'active',
        lastUpdated: new Date(),
        rateLimit: {
          limit: 100,
          remaining: 100 - fiveHourPercent,
          reset: new Date(data.five_hour.resets_at),
          percentage: 100 - fiveHourPercent,
        },
        quota: {
          monthlyLimit: 100,
          monthlyUsed: sevenDayPercent,
          resetDate: new Date(data.seven_day.resets_at),
          percentage: sevenDayPercent,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching OAuth usage:');

      const localStats = this.readLocalStats();
      if (localStats) {
        return this.buildUsageFromLocalStats(localStats);
      }

      return await this.fetchApiKeyUsage();
    }
  }

  private async fetchApiKeyUsage(): Promise<ProviderUsage> {
    if (!this.config.apiKey) {
      return {
        id: this.id,
        name: this.name,
        requests: 0,
        cost: 0,
        tokens: 0,
        status: 'error',
        lastUpdated: new Date(),
      };
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      const rateLimit = this.parseRateLimitHeaders(response);

      logger.info(`Anthropic API key rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);

      // API Key usage does not provide historical totals, only current rate limit.
      // We return 0 requests to avoid misleading the user with "instantaneous load" numbers.
      return {
        id: this.id,
        name: this.name,
        requests: 0,
        cost: 0,
        tokens: 0,
        status: 'active',
        lastUpdated: new Date(),
        rateLimit,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching API key usage:');
      return {
        id: this.id,
        name: this.name,
        requests: 0,
        cost: 0,
        tokens: 0,
        status: 'error',
        lastUpdated: new Date(),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (existsSync(this.localStatsPath)) {
      return true;
    }

    if (this.oauthToken) {
      try {
        const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.oauthToken}`,
            'anthropic-beta': 'oauth-2025-04-20',
            'User-Agent': 'claude-code/2.0.31',
          },
        });
        if (response.ok) return true;
      } catch { }
    }

    if (this.config.apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        return response.ok;
      } catch { }
    }

    return false;
  }

  private parseRateLimitHeaders(response: Response): RateLimit {
    const limit = parseInt(response.headers.get('anthropic-ratelimit-requests-limit') || '50', 10);
    const remaining = parseInt(response.headers.get('anthropic-ratelimit-requests-remaining') || limit.toString(), 10);
    const resetTime = response.headers.get('anthropic-ratelimit-requests-reset');

    return {
      limit,
      remaining,
      reset: resetTime ? new Date(resetTime) : new Date(Date.now() + 60000),
      percentage: Math.round((remaining / limit) * 100),
    };
  }
}
