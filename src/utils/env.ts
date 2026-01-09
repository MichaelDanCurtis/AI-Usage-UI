import { Environment } from '../types/index.js';
import { ConfigStorage } from '../services/config-storage.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const configStorage = new ConfigStorage();

function hasCopilotLocalAuth(): boolean {
  const copilotAppsPath = join(homedir(), '.config', 'github-copilot', 'apps.json');
  return existsSync(copilotAppsPath);
}

function hasWarpInstalled(): boolean {
  const warpPath = join(homedir(), 'Library', 'Application Support', 'dev.warp.Warp-Stable');
  return existsSync(warpPath);
}

function hasAntigravity(): boolean {
  const geminiPath = join(homedir(), '.gemini', 'antigravity');
  return existsSync(geminiPath);
}

export function loadEnv(): Environment {
  const monitoredApisEnv = process.env.MONITORED_APIS;
  let monitoredApis: string[];

  if (monitoredApisEnv) {
    monitoredApis = monitoredApisEnv.split(',').map(api => api.trim()).filter(api => api.length > 0);
  } else {
    const savedProviders = configStorage.getAllProviders();
    monitoredApis = savedProviders.length > 0 ? savedProviders : [];
  }

  if (!monitoredApis.includes('anthropic')) {
    monitoredApis.unshift('anthropic');
  }

  if (!monitoredApis.includes('copilot') && hasCopilotLocalAuth()) {
    monitoredApis.push('copilot');
  }

  // Auto-detect Warp.dev if installed
  if (!monitoredApis.includes('warp') && hasWarpInstalled()) {
    monitoredApis.push('warp');
  }

  // Auto-detect Antigravity (Gemini) if present
  if (!monitoredApis.includes('antigravity') && hasAntigravity()) {
    monitoredApis.push('antigravity');
  }

  const config = configStorage.getConfig();

  return {
    port: parseInt(process.env.PORT || '3010', 10),
    host: process.env.HOST || '0.0.0.0',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || config.anthropic,
    openrouterApiKey: process.env.OPENROUTER_API_KEY || config.openrouter,
    githubToken: process.env.GITHUB_TOKEN || config.github,
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY || config.googleAi,
    zaiApiKey: process.env.ZAI_API_KEY || config.zai,
    vercelToken: process.env.VERCEL_TOKEN || config.vercel,
    openaiApiKey: process.env.OPENAI_API_KEY || config.openai,
    warpToken: process.env.WARP_TOKEN || config.warp,
    cacheTtl: parseInt(process.env.CACHE_TTL || '300', 10),
    logLevel: (process.env.LOG_LEVEL as Environment['logLevel']) || 'info',
    monitoringEnabled: process.env.MONITORING_ENABLED !== 'false',
    monitoredApis,
  };
}

export function validateEnv(env: Environment): void {
  const requiredKeys: (keyof Environment)[] = [];
  const missingKeys: string[] = [];

  for (const key of requiredKeys) {
    if (!env[key]) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    console.warn(`Warning: Missing optional environment variables: ${missingKeys.join(', ')}`);
  }
}
