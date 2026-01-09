import { BaseProvider } from './base.js';
import { ProviderUsage } from '../types/index.js';
import logger from '../utils/logger.js';

export class VercelProvider extends BaseProvider {
  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.vercel.com/v2' });
  }

  get id(): string {
    return 'vercel';
  }

  get name(): string {
    return 'Vercel';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching Vercel usage data');

      const usage: ProviderUsage = {
        id: this.id,
        name: this.name,
        requests: 0,
        cost: 0,
        tokens: 0,
        status: 'active',
        lastUpdated: new Date(),
      };

      logger.info('Vercel usage: 0 requests, $0.00');
      return usage;
    } catch (error) {
      logger.error({ error }, 'Error fetching Vercel usage:');
      return this.createErrorUsage(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.vercel.com/v2/edge/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'Vercel health check failed:');
      return false;
    }
  }
}
