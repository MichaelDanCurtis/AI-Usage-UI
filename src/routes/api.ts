import { UsageHistoryStore, DailyTotals } from '../services/usage-history.js';
import { ConfigStorage } from '../services/config-storage.js';
import { MonitoringConfigManager } from '../services/monitoring-config.js';
import { DataAggregator } from '../services/aggregator.js';
import logger from '../utils/logger.js';
import { ApiResponse, ErrorResponse, UsageData, MonitoringConfig, ProviderUsage } from '../types/index.js';

const historyStore = new UsageHistoryStore();
const configStorage = new ConfigStorage();

export interface ApiRoutes {
  getUsage(req: Request): Promise<Response>;
  getProviderUsage(req: Request): Promise<Response>;
  getHealth(req: Request): Promise<Response>;
  getProviders(req: Request): Promise<Response>;
  getMonitoringConfig(req: Request): Promise<Response>;
  updateMonitoringConfig(req: Request): Promise<Response>;
  toggleMonitoring(req: Request): Promise<Response>;
  addMonitoredApi(req: Request): Promise<Response>;
  removeMonitoredApi(req: Request): Promise<Response>;
  getApiKeys(req: Request): Promise<Response>;
  setApiKey(req: Request): Promise<Response>;
  deleteApiKey(req: Request): Promise<Response>;
  reloadProviders(req: Request): Promise<Response>;
}

function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, status: number = 500): Response {
  const response: ErrorResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(response, status);
}

export function createApiRoutes(aggregator: DataAggregator, monitoringConfig: MonitoringConfigManager): ApiRoutes {
  return {
    async getUsage(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '7', 10);

        logger.info(`Fetching usage data for ${days} days`);

        const usage = await aggregator.fetchAllUsage(days);
        const history = historyStore.getDailyUsage(days);

        const response: ApiResponse<UsageData & { history?: DailyTotals }> = {
          success: true,
          data: {
            ...usage,
            history,
          },
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error fetching usage data');
        return errorResponse('Failed to fetch usage data');
      }
    },

    async getProviderUsage(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const pathname = url.pathname;
        const providerId = pathname.split('/').pop();
        const days = parseInt(url.searchParams.get('days') || '7', 10);

        if (!providerId) {
          return errorResponse('Provider ID required', 400);
        }

        logger.info(`Fetching usage for provider: ${providerId}`);

        const usage = await aggregator.fetchProviderUsageById(providerId, days);

        if (!usage) {
          return errorResponse(`Provider not found: ${providerId}`, 404);
        }

        const response: ApiResponse<ProviderUsage> = {
          success: true,
          data: usage,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error fetching provider usage');
        return errorResponse('Failed to fetch provider usage');
      }
    },

    async getHealth(req: Request): Promise<Response> {
      try {
        const healthMap = await aggregator.checkProviderHealth();
        const healthObj: Record<string, boolean> = {};

        for (const [key, value] of healthMap) {
          healthObj[key] = value;
        }

        const response: ApiResponse<Record<string, boolean>> = {
          success: true,
          data: healthObj,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error checking provider health');
        return errorResponse('Failed to check provider health');
      }
    },

    async getProviders(req: Request): Promise<Response> {
      try {
        const healthMap = await aggregator.checkProviderHealth();
        const healthObj: Record<string, boolean> = {};

        for (const [key, value] of healthMap) {
          healthObj[key] = value;
        }

        const response: ApiResponse<Record<string, boolean>> = {
          success: true,
          data: healthObj,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error fetching providers');
        return errorResponse('Failed to fetch providers');
      }
    },

    async getMonitoringConfig(req: Request): Promise<Response> {
      try {
        const config = monitoringConfig.getConfig();

        const response: ApiResponse<MonitoringConfig> = {
          success: true,
          data: config,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error fetching monitoring config');
        return errorResponse('Failed to fetch monitoring config');
      }
    },

    async updateMonitoringConfig(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const updatedConfig = monitoringConfig.updateConfig(body);

        const response: ApiResponse<MonitoringConfig> = {
          success: true,
          data: updatedConfig,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error updating monitoring config');
        return errorResponse('Failed to update monitoring config');
      }
    },

    async toggleMonitoring(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const enabled = body.enabled ?? !monitoringConfig.isEnabled();
        const updatedConfig = monitoringConfig.setEnabled(enabled);

        const response: ApiResponse<MonitoringConfig> = {
          success: true,
          data: updatedConfig,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error toggling monitoring');
        return errorResponse('Failed to toggle monitoring');
      }
    },

    async addMonitoredApi(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const apiName = body.api || body.apiName;

        if (!apiName) {
          return errorResponse('API name required', 400);
        }

        const updatedConfig = monitoringConfig.addApi(apiName);

        const response: ApiResponse<MonitoringConfig> = {
          success: true,
          data: updatedConfig,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error adding monitored API');
        return errorResponse('Failed to add monitored API');
      }
    },

    async removeMonitoredApi(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const apiName = body.api || body.apiName;

        if (!apiName) {
          return errorResponse('API name required', 400);
        }

        const updatedConfig = monitoringConfig.removeApi(apiName);

        const response: ApiResponse<MonitoringConfig> = {
          success: true,
          data: updatedConfig,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error removing monitored API');
        return errorResponse('Failed to remove monitored API');
      }
    },

    async getApiKeys(req: Request): Promise<Response> {
      try {
        const providers = configStorage.getAllProviders();
        const keysInfo: Record<string, { configured: boolean; masked: string | null }> = {};

        for (const provider of ['anthropic', 'openai', 'openrouter', 'github', 'google', 'zai', 'vercel', 'anthropic_oauth', 'copilot_oauth']) {
          const hasKey = configStorage.hasApiKey(provider);
          const key = configStorage.getApiKey(provider);
          keysInfo[provider] = {
            configured: hasKey,
            masked: key ? `${key.substring(0, 8)}...${key.slice(-4)}` : null,
          };
        }

        const response: ApiResponse<Record<string, { configured: boolean; masked: string | null }>> = {
          success: true,
          data: keysInfo,
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error fetching API keys');
        return errorResponse('Failed to fetch API keys');
      }
    },

    async setApiKey(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { provider, apiKey } = body;

        if (!provider || !apiKey) {
          return errorResponse('Provider and API key required', 400);
        }

        configStorage.setApiKey(provider, apiKey);

        const response: ApiResponse<{ provider: string; updated: boolean }> = {
          success: true,
          data: { provider, updated: true },
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error setting API key');
        return errorResponse('Failed to set API key');
      }
    },

    async deleteApiKey(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { provider } = body;

        if (!provider) {
          return errorResponse('Provider required', 400);
        }

        configStorage.removeApiKey(provider);

        const response: ApiResponse<{ provider: string; deleted: boolean }> = {
          success: true,
          data: { provider, deleted: true },
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error deleting API key');
        return errorResponse('Failed to delete API key');
      }
    },

    async reloadProviders(req: Request): Promise<Response> {
      try {
        configStorage.reloadConfig();

        const response: ApiResponse<{ reloaded: boolean }> = {
          success: true,
          data: { reloaded: true },
          timestamp: new Date().toISOString(),
        };

        return jsonResponse(response);
      } catch (error) {
        logger.error({ error }, 'Error reloading providers');
        return errorResponse('Failed to reload providers');
      }
    },
  };
}
