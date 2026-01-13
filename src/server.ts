import { loadEnv, validateEnv } from './utils/env.js';
import { createProviders } from './providers/index.js';
import { CacheManager } from './services/cache.js';
import { DataAggregator } from './services/aggregator.js';
import { MonitoringConfigManager } from './services/monitoring-config.js';
import { createApiRoutes } from './routes/api.js';
import logger from './utils/logger.js';

// Load environment variables
const env = loadEnv();
validateEnv(env);

// Initialize services
const cache = new CacheManager(env.cacheTtl);
const providers = createProviders(env);
const monitoringConfig = new MonitoringConfigManager(env.monitoredApis, env.monitoringEnabled);
const aggregator = new DataAggregator(providers, cache, monitoringConfig);
const apiRoutes = createApiRoutes(aggregator, monitoringConfig);

// Log startup info
logger.info('Starting AI Usage Monitor...');
logger.info(`Server will run on http://${env.host}:${env.port}`);
logger.info(`Monitoring enabled: ${env.monitoringEnabled}`);
logger.info(`Monitored APIs: ${env.monitoredApis.join(', ')}`);
logger.info(`Configured providers: ${providers.map(p => p.name).join(', ') || 'None (using mock data)'}`);

// Create Bun server
const server = Bun.serve({
  port: env.port,
  hostname: env.host,
  idleTimeout: 60, // 60 seconds timeout for slow API calls

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API routes
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/usage' || pathname === '/api/usage/') {
        return apiRoutes.getUsage(req);
      }

      if (pathname.startsWith('/api/usage/')) {
        return apiRoutes.getProviderUsage(req);
      }

      if (pathname === '/api/health' || pathname === '/api/health/') {
        return apiRoutes.getHealth(req);
      }

      if (pathname === '/api/providers' || pathname === '/api/providers/') {
        return apiRoutes.getProviders(req);
      }

      // Monitoring configuration endpoints
      if (pathname === '/api/monitoring/config' || pathname === '/api/monitoring/config/') {
        if (req.method === 'GET') {
          return apiRoutes.getMonitoringConfig(req);
        } else if (req.method === 'POST') {
          return apiRoutes.updateMonitoringConfig(req);
        }
      }

      if (pathname === '/api/monitoring/toggle' || pathname === '/api/monitoring/toggle/') {
        if (req.method === 'POST') {
          return apiRoutes.toggleMonitoring(req);
        }
      }

      if (pathname === '/api/monitoring/add' || pathname === '/api/monitoring/add/') {
        if (req.method === 'POST') {
          return apiRoutes.addMonitoredApi(req);
        }
      }

      if (pathname === '/api/monitoring/remove' || pathname === '/api/monitoring/remove/') {
        if (req.method === 'POST') {
          return apiRoutes.removeMonitoredApi(req);
        }
      }

      // API key management endpoints
      if (pathname === '/api/config/keys' || pathname === '/api/config/keys/') {
        if (req.method === 'GET') {
          return apiRoutes.getApiKeys(req);
        } else if (req.method === 'POST') {
          return apiRoutes.setApiKey(req);
        } else if (req.method === 'DELETE') {
          return apiRoutes.deleteApiKey(req);
        }
      }

      if (pathname === '/api/config/keys/reload' || pathname === '/api/config/keys/reload/') {
        if (req.method === 'POST') {
          return apiRoutes.reloadProviders(req);
        }
      }

      // 404 for unknown API routes
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API endpoint not found',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Serve static files
    if (pathname === '/' || pathname === '/index.html') {
      try {
        const file = Bun.file('./public/index.html');
        return new Response(file, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      } catch (error) {
        logger.error({ error }, 'Error serving index.html:');
        return new Response('Dashboard not found', { status: 404 });
      }
    }

    // Serve setup wizard
    if (pathname === '/setup' || pathname === '/setup.html') {
      try {
        const file = Bun.file('./public/setup.html');
        return new Response(file, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      } catch (error) {
        logger.error({ error }, 'Error serving setup.html:');
        return new Response('Setup page not found', { status: 404 });
      }
    }

    // Serve CSS
    if (pathname === '/css/styles.css') {
      try {
        const file = Bun.file('./public/css/styles.css');
        return new Response(file, {
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
          },
        });
      } catch (error) {
        return new Response('CSS not found', { status: 404 });
      }
    }

    if (pathname === '/css/setup.css') {
      try {
        const file = Bun.file('./public/css/setup.css');
        return new Response(file, {
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
          },
        });
      } catch (error) {
        return new Response('CSS not found', { status: 404 });
      }
    }

    // Serve JavaScript
    if (pathname === '/js/dashboard.js') {
      try {
        const file = Bun.file('./public/js/dashboard.js');
        return new Response(file, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
          },
        });
      } catch (error) {
        return new Response('JavaScript not found', { status: 404 });
      }
    }

    if (pathname === '/js/setup.js') {
      try {
        const file = Bun.file('./public/js/setup.js');
        return new Response(file, {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
          },
        });
      } catch (error) {
        return new Response('JavaScript not found', { status: 404 });
      }
    }

    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
});

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

logger.info(`Server is running on http://${server.hostname}:${server.port}`);
logger.info('Press Ctrl+C to stop');
