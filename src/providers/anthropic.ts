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

export class AnthropicProvider extends BaseProvider {
  private oauthToken: string | null = null;
  private localStatsPath: string;

  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.anthropic.com' });
    this.oauthToken = this.getOAuthToken();
    this.localStatsPath = join(homedir(), '.claude', 'stats-cache.json');
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
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheRead = 0;
    let totalCacheCreation = 0;

    // Build model breakdown
    const modelBreakdown: Array<{ model: string; requests: number; tokens: number; cost: number }> = [];

    for (const [model, usage] of Object.entries(stats.modelUsage)) {
      const inputTokens = usage.inputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
      const outputTokens = usage.outputTokens;
      const modelTokens = inputTokens + outputTokens;

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCacheRead += usage.cacheReadInputTokens;
      totalCacheCreation += usage.cacheCreationInputTokens;

      // Estimate cost based on model
      let cost = 0;
      if (model.includes('opus')) {
        cost = (inputTokens / 1000000) * 15 + (outputTokens / 1000000) * 75;
      } else if (model.includes('sonnet')) {
        cost = (inputTokens / 1000000) * 3 + (outputTokens / 1000000) * 15;
      } else if (model.includes('haiku')) {
        cost = (inputTokens / 1000000) * 0.25 + (outputTokens / 1000000) * 1.25;
      }

      // Format model name for display
      let displayName = model;
      if (model.includes('opus')) displayName = 'Claude Opus';
      else if (model.includes('sonnet')) displayName = 'Claude Sonnet';
      else if (model.includes('haiku')) displayName = 'Claude Haiku';

      modelBreakdown.push({
        model: displayName,
        requests: 0, // We don't have per-model request counts
        tokens: modelTokens,
        cost: Math.round(cost * 100) / 100
      });
    }

    totalTokens = totalInputTokens + totalOutputTokens;

    // Calculate cache efficiency
    const totalCacheTokens = totalCacheRead + totalCacheCreation;
    const cacheHitRate = totalCacheTokens > 0 ? Math.round((totalCacheRead / totalCacheTokens) * 100) : 0;

    // Get today's activity
    const todayActivity = stats.dailyActivity.find(d => d.date === stats.lastComputedDate);
    const todayMessages = todayActivity?.messageCount || 0;
    const todaySessions = todayActivity?.sessionCount || 0;
    const todayToolCalls = todayActivity?.toolCallCount || 0;

    // Total market value (what it would cost at API rates)
    const marketValue = modelBreakdown.reduce((sum, m) => sum + m.cost, 0);

    // Actual subscription cost (Pro = $20, Max = $100)
    // TODO: Could make this configurable in the future
    const subscriptionCost = 20; // Claude Pro monthly

    logger.info(`Local stats: ${stats.totalMessages} messages, ${totalTokens} tokens, market value ~$${marketValue.toFixed(2)}, cache hit: ${cacheHitRate}%`);

    return {
      id: this.id,
      name: this.name,
      requests: stats.totalMessages,
      cost: subscriptionCost, // Actual cost paid
      tokens: totalTokens,
      status: 'active',
      lastUpdated: new Date(),
      rateLimit: {
        limit: stats.totalMessages + 1000,
        remaining: 1000,
        reset: new Date(Date.now() + 5 * 3600000),
        percentage: 50,
      },
      modelBreakdown: modelBreakdown.sort((a, b) => b.cost - a.cost),
      codingMetrics: {
        sessions: stats.totalSessions,
        toolCalls: todayToolCalls,
        cacheHitRate: cacheHitRate,
        cacheReadTokens: totalCacheRead,
        cacheCreationTokens: totalCacheCreation,
        marketValue: Math.round(marketValue * 100) / 100,
        subscriptionCost: subscriptionCost,
      },
    };
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
