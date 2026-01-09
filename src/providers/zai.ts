import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit, Quota } from '../types/index.js';
import logger from '../utils/logger.js';

interface ZaiLimitInfo {
  type: string;
  unit: number;
  number: number;
  usage: number;      // This is the limit amount
  currentValue: number; // This is what's been used
  remaining: number;
  percentage: number;
  usageDetails?: Array<{
    modelCode: string;
    usage: number;
  }>;
}

interface ZaiQuotaResponse {
  code: number;
  msg: string;
  data: {
    limits: ZaiLimitInfo[];
  };
  success: boolean;
}

export class ZaiProvider extends BaseProvider {
  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.z.ai' });
  }

  get id(): string {
    return 'zai';
  }

  get name(): string {
    return 'Z.ai (GLM Coding Plan)';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching Z.ai usage data');

      // Fetch quota limits (5-hour and 5-day)
      const quotaData = await this.fetchQuotaLimit();

      return this.buildUsage(quotaData);
    } catch (error) {
      logger.error({ error }, 'Error fetching Z.ai usage:');
      return this.createErrorUsage(error);
    }
  }

  private async fetchQuotaLimit(): Promise<ZaiQuotaResponse | null> {
    try {
      const response = await fetch('https://api.z.ai/api/monitor/usage/quota/limit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn(`Z.ai quota API returned ${response.status}`);
        return null;
      }

      const data: ZaiQuotaResponse = await response.json();
      
      // Find the TIME_LIMIT entry
      const timeLimit = data.data?.limits?.find(l => l.type === 'TIME_LIMIT');
      if (timeLimit) {
        logger.info(`Z.ai 5-hour quota: ${timeLimit.currentValue}/${timeLimit.usage} (${timeLimit.percentage}%)`);
      }
      
      return data;
    } catch (error) {
      logger.debug('Could not fetch Z.ai quota');
      return null;
    }
  }

  private buildUsage(quota: ZaiQuotaResponse | null): ProviderUsage {
    // Z.ai Code plan is $20/month flat rate
    const planCost = 20;

    // Find the time limit and token limit from the response
    const timeLimit = quota?.data?.limits?.find(l => l.type === 'TIME_LIMIT');
    const tokenLimit = quota?.data?.limits?.find(l => l.type === 'TOKENS_LIMIT');

    let rateLimit: RateLimit | undefined;
    if (timeLimit) {
      // percentage should be "remaining %" for dashboard compatibility
      rateLimit = {
        limit: timeLimit.usage,           // Total allowed (4000)
        remaining: timeLimit.remaining,    // Remaining
        reset: new Date(Date.now() + 5 * 60 * 60 * 1000), // Resets in 5 hours (rolling)
        percentage: 100 - timeLimit.percentage,  // Remaining percentage (inverted from API's used %)
      };
    }

    let quotaInfo: Quota | undefined;
    if (tokenLimit) {
      quotaInfo = {
        monthlyLimit: tokenLimit.usage,
        monthlyUsed: tokenLimit.currentValue,
        resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 day rolling
        percentage: tokenLimit.percentage,  // This one is "used %" which quota expects
      };
    }

    // Build model breakdown from usageDetails if available
    const modelBreakdown = timeLimit?.usageDetails?.filter(d => d.usage > 0).map(d => ({
      model: d.modelCode,
      requests: d.usage,
      tokens: 0,
      cost: 0, // Flat rate plan
    }));

    const totalRequests = timeLimit?.currentValue || 0;
    const totalTokens = tokenLimit?.currentValue || 0;

    const usage: ProviderUsage = {
      id: this.id,
      name: this.name,
      planName: 'Code Plan',
      requests: totalRequests,
      cost: planCost,
      tokens: totalTokens,
      status: 'active',
      lastUpdated: new Date(),
    };

    if (rateLimit) {
      usage.rateLimit = rateLimit;
    }

    if (quotaInfo) {
      usage.quota = quotaInfo;
    }

    if (modelBreakdown && modelBreakdown.length > 0) {
      usage.modelBreakdown = modelBreakdown;
    }

    logger.info(`Z.ai usage: ${totalRequests} requests, ${totalTokens} tokens`);
    return usage;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try quota endpoint first
      const response = await fetch('https://api.z.ai/api/monitor/usage/quota/limit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) return true;

      // Fallback to models endpoint
      const modelsResponse = await fetch('https://api.z.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return modelsResponse.ok;
    } catch (error) {
      logger.error({ error }, 'Z.ai health check failed:');
      return false;
    }
  }
}
