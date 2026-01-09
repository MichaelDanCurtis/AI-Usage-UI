import { BaseProvider } from './base.js';
import { ProviderUsage, Quota } from '../types/index.js';
import logger from '../utils/logger.js';

interface OpenRouterActivityItem {
  date: string;
  model_permaslug: string;
  model: string;
  usage: number;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
  provider_name: string;
}

interface OpenRouterCredits {
  total_credits: number;
  total_usage: number;
}

export class OpenRouterProvider extends BaseProvider {
  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://openrouter.ai/api/v1' });
  }

  get id(): string {
    return 'openrouter';
  }

  get name(): string {
    return 'OpenRouter';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching OpenRouter usage data');

      // Fetch credits (balance info)
      const credits = await this.fetchCredits();
      
      // Fetch activity for model breakdown
      const activity = await this.fetchActivity();
      
      // Aggregate activity data
      const { totalRequests, totalCost, totalTokens, modelBreakdown } = this.aggregateActivity(activity);

      const usage: ProviderUsage = {
        id: this.id,
        name: this.name,
        requests: totalRequests,
        cost: totalCost,
        tokens: totalTokens,
        status: 'active',
        lastUpdated: new Date(),
      };

      // Add credit balance as quota
      if (credits) {
        const remaining = credits.total_credits - credits.total_usage;
        const usagePercent = credits.total_credits > 0 
          ? Math.round((credits.total_usage / credits.total_credits) * 100)
          : 0;
        
        usage.quota = {
          monthlyLimit: credits.total_credits,
          monthlyUsed: credits.total_usage,
          resetDate: new Date(), // Credits don't reset
          percentage: usagePercent,
        };

        // Store credits info for display
        usage.codingMetrics = {
          credits: {
            total: credits.total_credits,
            used: credits.total_usage,
            remaining: remaining,
          }
        };
      }

      // Add top 10 models breakdown
      if (modelBreakdown.length > 0) {
        usage.modelBreakdown = modelBreakdown.slice(0, 10);
      }

      logger.info(`OpenRouter usage: ${totalRequests} requests, $${totalCost.toFixed(2)} cost, ${modelBreakdown.length} models`);
      return usage;
    } catch (error) {
      logger.error({ error }, `Error fetching usage for ${this.id}:`);
      return this.createErrorUsage(error);
    }
  }

  private async fetchCredits(): Promise<OpenRouterCredits | null> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        logger.warn(`OpenRouter credits API returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.data as OpenRouterCredits;
    } catch (error) {
      logger.error({ error }, 'Error fetching OpenRouter credits:');
      return null;
    }
  }

  private async fetchActivity(): Promise<OpenRouterActivityItem[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/activity', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        logger.warn(`OpenRouter activity API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      return (data.data || []) as OpenRouterActivityItem[];
    } catch (error) {
      logger.error({ error }, 'Error fetching OpenRouter activity:');
      return [];
    }
  }

  private aggregateActivity(activity: OpenRouterActivityItem[]): {
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    modelBreakdown: Array<{ model: string; requests: number; tokens: number; cost: number }>;
  } {
    const modelMap = new Map<string, { requests: number; tokens: number; cost: number }>();
    
    let totalRequests = 0;
    let totalCost = 0;
    let totalTokens = 0;

    for (const item of activity) {
      totalRequests += item.requests;
      totalCost += item.usage;
      totalTokens += item.prompt_tokens + item.completion_tokens;

      // Aggregate by model (use the friendly model name)
      const modelName = item.model || item.model_permaslug;
      const existing = modelMap.get(modelName) || { requests: 0, tokens: 0, cost: 0 };
      
      modelMap.set(modelName, {
        requests: existing.requests + item.requests,
        tokens: existing.tokens + item.prompt_tokens + item.completion_tokens,
        cost: existing.cost + item.usage,
      });
    }

    // Convert to array and sort by cost (highest first)
    const modelBreakdown = Array.from(modelMap.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost);

    return { totalRequests, totalCost, totalTokens, modelBreakdown };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'OpenRouter health check failed:');
      return false;
    }
  }
}
