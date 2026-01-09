import logger from '../utils/logger.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface ApiKeyConfig {
  anthropic?: string;
  openai?: string;
  openrouter?: string;
  github?: string;
  googleAi?: string;
  zai?: string;
  vercel?: string;
}

// Use CWD for compiled binary compatibility
const CONFIG_FILE = join(process.cwd(), 'data/api-keys.json');
const DATA_DIR = join(process.cwd(), 'data');

export class ConfigStorage {
  private config: ApiKeyConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): ApiKeyConfig {
    try {
      if (existsSync(CONFIG_FILE)) {
        const data = readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error({ error }, 'Error loading API config');
    }

    return {};
  }

  private saveConfig(): void {
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.info('API config saved successfully');
    } catch (error) {
      logger.error({ error }, 'Error saving API config');
      throw new Error('Failed to save API configuration');
    }
  }

  getConfig(): ApiKeyConfig {
    return { ...this.config };
  }

  getApiKey(provider: string): string | undefined {
    const keyMap: Record<string, keyof ApiKeyConfig> = {
      anthropic: 'anthropic',
      openai: 'openai',
      openrouter: 'openrouter',
      github: 'github',
      google: 'googleAi',
      googleai: 'googleAi',
      zai: 'zai',
      vercel: 'vercel',
    };

    const configKey = keyMap[provider.toLowerCase()];
    return configKey ? this.config[configKey] : undefined;
  }

  setApiKey(provider: string, apiKey: string): void {
    const providerLower = provider.toLowerCase();
    const trimmedKey = apiKey.trim();

    if (!this.isValidApiKey(trimmedKey)) {
      throw new Error(`Invalid API key format for ${provider}`);
    }

    const keyMap: Record<string, keyof ApiKeyConfig> = {
      anthropic: 'anthropic',
      openai: 'openai',
      openrouter: 'openrouter',
      github: 'github',
      google: 'googleAi',
      googleai: 'googleAi',
      zai: 'zai',
      vercel: 'vercel',
    };

    const configKey = keyMap[providerLower];
    if (configKey) {
      this.config[configKey] = trimmedKey as any;
      this.saveConfig();
      logger.info(`API key updated for ${provider}`);
    }
  }

  removeApiKey(provider: string): void {
    const providerLower = provider.toLowerCase();
    const keyMap: Record<string, keyof ApiKeyConfig> = {
      anthropic: 'anthropic',
      openai: 'openai',
      openrouter: 'openrouter',
      github: 'github',
      google: 'googleAi',
      googleai: 'googleAi',
      zai: 'zai',
      vercel: 'vercel',
    };

    const configKey = keyMap[providerLower];
    if (configKey && this.config[configKey]) {
      delete this.config[configKey];
      this.saveConfig();
      logger.info(`API key removed for ${provider}`);
    }
  }

  hasApiKey(provider: string): boolean {
    return this.getApiKey(provider) !== undefined;
  }

  getAllProviders(): string[] {
    const providerMap: Record<keyof ApiKeyConfig, string> = {
      anthropic: 'anthropic',
      openai: 'openai',
      openrouter: 'openrouter',
      github: 'github',
      googleAi: 'google',
      zai: 'zai',
      vercel: 'vercel',
    };

    return Object.entries(this.config)
      .filter(([key, value]) => value !== undefined)
      .map(([key]) => providerMap[key as keyof ApiKeyConfig]);
  }

  private isValidApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.length < 10) {
      return false;
    }

    const patterns: Record<string, RegExp> = {
      anthropic: /^sk-ant-/,
      openai: /^sk-/,
      openrouter: /^sk-or-/,
      github: /^ghp_|^gho_|^ghu_|^ghs_|^ghr_/,
      google: /^AIza/,
      zai: /^.{10,}$/,
      vercel: /^.{10,}$/,
    };

    return Object.values(patterns).some(pattern => pattern.test(apiKey)) || apiKey.length >= 20;
  }

  reloadConfig(): void {
    this.config = this.loadConfig();
    logger.info('API config reloaded from disk');
  }
}
