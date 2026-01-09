import { Provider, UsageData, ProviderUsage, Summary, TimelineData } from '../types/index.js';
import { CacheManager } from './cache.js';
import { MonitoringConfigManager } from './monitoring-config.js';
import { UsageHistoryStore } from './usage-history.js';
import logger from '../utils/logger.js';
import { format, subDays, startOfDay } from 'date-fns';

export class DataAggregator {
  private providers: Provider[];
  private cache: CacheManager;
  private monitoringConfig: MonitoringConfigManager;
  private historyStore: UsageHistoryStore;

  constructor(providers: Provider[], cache: CacheManager, monitoringConfig: MonitoringConfigManager) {
    this.providers = providers;
    this.cache = cache;
    this.monitoringConfig = monitoringConfig;
    this.historyStore = new UsageHistoryStore();
  }

  async fetchAllUsage(days: number = 7): Promise<UsageData> {
    // Check if monitoring is enabled
    if (!this.monitoringConfig.isEnabled()) {
      logger.info('Monitoring is disabled, returning empty data');
      return {
        summary: {
          totalRequests: 0,
          totalCost: 0,
          totalTokens: 0,
          avgLatency: 0,
        },
        providers: [],
        timeline: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const cacheKey = `usage:${days}d`;

    // Check cache first
    const cached = this.cache.get<UsageData>(cacheKey);
    if (cached) {
      logger.info('Returning cached usage data');
      return cached;
    }

    // Filter providers based on monitoring configuration
    const monitoredProviders = this.providers.filter(provider =>
      this.monitoringConfig.isApiMonitored(provider.id)
    );

    logger.info(`Fetching usage data from ${monitoredProviders.length} monitored providers`);

    // Fetch data from monitored providers in parallel
    const providerPromises = monitoredProviders.map(provider =>
      this.fetchProviderUsageData(provider, days)
    );

    const results = await Promise.allSettled(providerPromises);

    // Process results
    const providers: ProviderUsage[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        providers.push(result.value);
      } else if (result.status === 'rejected') {
        logger.error('Provider fetch failed:', result.reason);
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(providers);

    // Generate timeline data
    const timeline = this.generateTimeline(days);

    const usageData: UsageData = {
      summary,
      providers,
      timeline,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    this.cache.set(cacheKey, usageData);

    logger.info(`Aggregated data: ${summary.totalRequests} requests, $${summary.totalCost.toFixed(2)}`);
    return usageData;
  }

  async fetchProviderUsageById(providerId: string, days: number = 7): Promise<ProviderUsage | null> {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      logger.warn(`Provider not found: ${providerId}`);
      return null;
    }

    const cacheKey = `usage:${providerId}:${days}d`;
    const cached = this.cache.get<ProviderUsage>(cacheKey);
    if (cached) {
      logger.info(`Returning cached data for ${providerId}`);
      return cached;
    }

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const usage = await provider.fetchUsage(startDate, endDate);
      this.cache.set(cacheKey, usage);

      return usage;
    } catch (error) {
      logger.error({ error }, `Failed to fetch usage for ${providerId}:`);
      return null;
    }
  }

  private async fetchProviderUsageData(provider: Provider, days: number): Promise<ProviderUsage> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    return await provider.fetchUsage(startDate, endDate);
  }

  private calculateSummary(providers: ProviderUsage[]): Summary {
    const totalRequests = providers.reduce((sum, p) => sum + p.requests, 0);
    const totalCost = providers.reduce((sum, p) => sum + p.cost, 0);
    const totalTokens = providers.reduce((sum, p) => sum + (p.tokens || 0), 0);

    const avgLatency = 1.2;

    return {
      totalRequests,
      totalCost,
      totalTokens,
      avgLatency,
      requestChange: 0,
      costChange: 0,
      tokenChange: 0,
      latencyChange: 0,
    };
  }

  private generateTimeline(days: number): TimelineData[] {
    const hours = days * 24;
    const history = this.historyStore.getHistory(hours);

    if (history.length === 0) {
      const timeline: TimelineData[] = [];
      const now = new Date();

      for (let i = days; i >= 0; i--) {
        const date = startOfDay(subDays(now, i));
        timeline.push({
          date: format(date, 'MMM d'),
          requests: 0,
          cost: 0,
        });
      }

      return timeline;
    }

    const dailyData: Map<string, { requests: number; cost: number }> = new Map();

    for (const entry of history) {
      const dateKey = format(new Date(entry.timestamp), 'MMM d');
      const existing = dailyData.get(dateKey) || { requests: 0, cost: 0 };

      for (const [, usage] of Object.entries(entry.providers)) {
        existing.requests += usage.requests;
        existing.cost += usage.cost;
      }

      dailyData.set(dateKey, existing);
    }

    const timeline: TimelineData[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const dateKey = format(date, 'MMM d');
      const data = dailyData.get(dateKey) || { requests: 0, cost: 0 };

      timeline.push({
        date: dateKey,
        requests: data.requests,
        cost: Math.round(data.cost * 100) / 100,
      });
    }

    return timeline;
  }

  async checkProviderHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>();

    for (const provider of this.providers) {
      try {
        const isHealthy = await provider.healthCheck();
        healthMap.set(provider.id, isHealthy);
      } catch (error) {
        logger.error({ error }, `Health check failed for ${provider.id}:`);
        healthMap.set(provider.id, false);
      }
    }

    return healthMap;
  }
}
