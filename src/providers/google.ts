import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit, ModelBreakdown } from '../types/index.js';
import logger from '../utils/logger.js';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface LocalUsageCache {
  lastUpdated: string;
  dailyStats: Array<{
    date: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    models: Record<string, {
      requests: number;
      inputTokens: number;
      outputTokens: number;
    }>;
  }>;
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
  };
}

// Pricing per 1M tokens (as of 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
  'default': { input: 0.10, output: 0.40 },
};

export class GoogleAIProvider extends BaseProvider {
  private cachedRateLimit: RateLimit | null = null;
  private localCachePath: string;

  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://generativelanguage.googleapis.com/v1beta' });
    this.localCachePath = join(homedir(), '.config', 'google-ai', 'usage-cache.json');
  }

  get id(): string {
    return 'google';
  }

  get name(): string {
    return 'Google AI (Gemini)';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching Google AI usage data');

      // Fetch current rate limits from a lightweight API call
      const rateLimitData = await this.fetchRateLimitInfo();

      // Read local usage cache if available
      const localUsage = this.readLocalCache();

      return this.buildUsage(rateLimitData, localUsage);
    } catch (error) {
      logger.error({ error }, `Error fetching usage for ${this.id}:`);
      return this.createErrorUsage(error);
    }
  }

  private async fetchRateLimitInfo(): Promise<{ rateLimit: RateLimit; models: string[] } | null> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google AI API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rateLimit = this.parseRateLimitHeaders(response);

      // Extract available models
      const models = data.models?.map((m: any) => m.name.replace('models/', '')) || [];

      logger.info(`Google AI: ${rateLimit.remaining}/${rateLimit.limit} requests remaining, ${models.length} models available`);

      return { rateLimit, models };
    } catch (error) {
      logger.error({ error }, 'Error fetching Google AI rate limit:');
      return null;
    }
  }

  private readLocalCache(): LocalUsageCache | null {
    try {
      if (!existsSync(this.localCachePath)) {
        return null;
      }

      const content = readFileSync(this.localCachePath, 'utf-8');
      const cache: LocalUsageCache = JSON.parse(content);
      logger.debug('Read Google AI local usage cache');
      return cache;
    } catch (error) {
      logger.debug('Could not read Google AI usage cache');
      return null;
    }
  }

  // Method to track usage locally (can be called by application code)
  public trackRequest(model: string, inputTokens: number, outputTokens: number): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      let cache = this.readLocalCache() || {
        lastUpdated: new Date().toISOString(),
        dailyStats: [],
        totals: { requests: 0, inputTokens: 0, outputTokens: 0 },
      };

      // Find or create today's entry
      let todayStats = cache.dailyStats.find(d => d.date === today);
      if (!todayStats) {
        todayStats = { date: today, requests: 0, inputTokens: 0, outputTokens: 0, models: {} };
        cache.dailyStats.push(todayStats);
      }

      // Update stats
      todayStats.requests++;
      todayStats.inputTokens += inputTokens;
      todayStats.outputTokens += outputTokens;

      if (!todayStats.models[model]) {
        todayStats.models[model] = { requests: 0, inputTokens: 0, outputTokens: 0 };
      }
      todayStats.models[model].requests++;
      todayStats.models[model].inputTokens += inputTokens;
      todayStats.models[model].outputTokens += outputTokens;

      // Update totals
      cache.totals.requests++;
      cache.totals.inputTokens += inputTokens;
      cache.totals.outputTokens += outputTokens;
      cache.lastUpdated = new Date().toISOString();

      // Keep only last 30 days
      cache.dailyStats = cache.dailyStats
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      // Write cache
      const dir = join(homedir(), '.config', 'google-ai');
      if (!existsSync(dir)) {
        require('node:fs').mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.localCachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      logger.debug('Could not track Google AI usage');
    }
  }

  private buildUsage(
    rateLimitData: { rateLimit: RateLimit; models: string[] } | null,
    localUsage: LocalUsageCache | null
  ): ProviderUsage {
    const totalRequests = localUsage?.totals.requests || 0;
    const totalInputTokens = localUsage?.totals.inputTokens || 0;
    const totalOutputTokens = localUsage?.totals.outputTokens || 0;
    const totalTokens = totalInputTokens + totalOutputTokens;

    // Calculate cost based on usage
    let totalCost = 0;
    const modelBreakdown: ModelBreakdown[] = [];

    if (localUsage) {
      // Aggregate model usage across all days
      const modelTotals: Record<string, { requests: number; input: number; output: number }> = {};

      for (const day of localUsage.dailyStats) {
        for (const [model, stats] of Object.entries(day.models)) {
          if (!modelTotals[model]) {
            modelTotals[model] = { requests: 0, input: 0, output: 0 };
          }
          modelTotals[model].requests += stats.requests;
          modelTotals[model].input += stats.inputTokens;
          modelTotals[model].output += stats.outputTokens;
        }
      }

      for (const [model, stats] of Object.entries(modelTotals)) {
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
        const inputCost = (stats.input / 1_000_000) * pricing.input;
        const outputCost = (stats.output / 1_000_000) * pricing.output;
        const modelCost = inputCost + outputCost;
        totalCost += modelCost;

        modelBreakdown.push({
          model,
          requests: stats.requests,
          tokens: stats.input + stats.output,
          cost: Math.round(modelCost * 100) / 100,
        });
      }
    }

    const rateLimit = rateLimitData?.rateLimit || {
      limit: 60,
      remaining: 60,
      reset: new Date(Date.now() + 86400000),
      percentage: 100,
    };

    this.cachedRateLimit = rateLimit;

    const usage: ProviderUsage = {
      id: this.id,
      name: this.name,
      requests: totalRequests,
      cost: Math.round(totalCost * 100) / 100,
      tokens: totalTokens,
      status: 'active',
      lastUpdated: new Date(),
      rateLimit,
    };

    if (modelBreakdown.length > 0) {
      usage.modelBreakdown = modelBreakdown.sort((a, b) => b.requests - a.requests);
    }

    logger.info(`Google AI: ${totalRequests} requests, ${totalTokens} tokens, $${usage.cost.toFixed(2)}`);
    return usage;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
        { method: 'GET' }
      );

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'Google AI health check failed:');
      return false;
    }
  }

  private parseRateLimitHeaders(response: Response): RateLimit {
    // Google AI uses various rate limit headers
    const limit = parseInt(
      response.headers.get('x-ratelimit-limit') ||
      response.headers.get('x-ratelimit-dailyrequests') ||
      '60',
      10
    );
    const remaining = parseInt(
      response.headers.get('x-ratelimit-remaining') ||
      response.headers.get('x-ratelimit-remainingrequests') ||
      limit.toString(),
      10
    );
    const resetTime = response.headers.get('x-ratelimit-reset');

    return {
      limit,
      remaining,
      reset: resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 86400000),
      percentage: Math.round((remaining / limit) * 100),
    };
  }
}
