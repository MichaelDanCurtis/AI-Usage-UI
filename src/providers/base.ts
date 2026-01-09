import { Provider, ProviderUsage, ProviderConfig } from '../types/index.js';
import logger from '../utils/logger.js';

export abstract class BaseProvider implements Provider {
  protected config: ProviderConfig;
  protected timeout: number;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  abstract fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage>;

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchUsage(new Date(Date.now() - 86400000), new Date());
      return true;
    } catch (error) {
      logger.error({ error }, `${this.id} health check failed`);
      return false;
    }
  }

  get id(): string {
    return this.config.apiKey || 'unknown';
  }

  get name(): string {
    return 'Base Provider';
  }

  protected async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  protected createErrorUsage(error: any): ProviderUsage {
    logger.error(`Error fetching usage for ${this.name}:`, error);
    return {
      id: this.id,
      name: this.name,
      requests: 0,
      cost: 0,
      status: 'error',
      lastUpdated: new Date(),
    };
  }
}
