import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit } from '../types/index.js';
import logger from '../utils/logger.js';

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.openai.com/v1' });
  }

  get id(): string {
    return 'openai';
  }

  get name(): string {
    return 'OpenAI';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching OpenAI usage data');

      const response = await fetch('https://api.openai.com/v1/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        }
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      const data = await response.json();

      const usage: ProviderUsage = {
        id: this.id,
        name: this.name,
        requests: data.data?.total_requests || 0,
        cost: data.data?.total_cost || 0,
        tokens: data.data?.total_tokens || 0,
        status: 'active',
        lastUpdated: new Date(),
      };

      logger.info(`OpenAI usage: ${usage.requests} requests, $${usage.cost.toFixed(2)}`);
      return usage;
    } catch (error) {
      logger.error({ error }, `Error fetching usage for ${this.id}:`);
      return this.createErrorUsage(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'OpenAI health check failed:');
      return false;
    }
  }
}
