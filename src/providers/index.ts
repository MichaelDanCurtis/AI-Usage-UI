import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { OpenRouterProvider } from './openrouter-provider.js';
import { CopilotProvider } from './copilot.js';
import { GoogleAIProvider } from './google.js';
import { ZaiProvider } from './zai.js';
import { VercelProvider } from './vercel.js';
import { WarpProvider } from './warp.js';
import { AntigravityProvider } from './antigravity.js';
import { Provider } from '../types/index.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function hasCopilotLocalAuth(): boolean {
  const copilotAppsPath = join(homedir(), '.config', 'github-copilot', 'apps.json');
  return existsSync(copilotAppsPath);
}

function hasWarpInstalled(): boolean {
  const warpPath = join(homedir(), 'Library', 'Application Support', 'dev.warp.Warp-Stable');
  const warpConfigPath = join(homedir(), '.warp');
  return existsSync(warpPath) || existsSync(warpConfigPath);
}

function hasAntigravity(): boolean {
  const geminiPath = join(homedir(), '.gemini', 'antigravity');
  return existsSync(geminiPath);
}

export function createProviders(env: any): Provider[] {
  const providers: Provider[] = [];

  providers.push(new AnthropicProvider(env.anthropicApiKey || ''));

  if (env.openaiApiKey) {
    providers.push(new OpenAIProvider(env.openaiApiKey));
  }

  if (env.googleAiApiKey) {
    providers.push(new GoogleAIProvider(env.googleAiApiKey));
  }

  if (env.openrouterApiKey) {
    providers.push(new OpenRouterProvider(env.openrouterApiKey));
  }

  if (env.vercelToken) {
    providers.push(new VercelProvider(env.vercelToken));
  }

  // Warp.dev provider (uses keychain or env token)
  if (env.warpToken || hasWarpInstalled()) {
    providers.push(new WarpProvider(env.warpToken || ''));
  }

  if (env.githubToken || hasCopilotLocalAuth()) {
    providers.push(new CopilotProvider(env.githubToken || ''));
  }

  if (hasAntigravity()) {
    providers.push(new AntigravityProvider());
  }

  if (env.zaiApiKey) {
    providers.push(new ZaiProvider(env.zaiApiKey));
  }

  return providers;
}

export {
  AnthropicProvider,
  OpenAIProvider,
  OpenRouterProvider,
  CopilotProvider,
  GoogleAIProvider,
  ZaiProvider,
  VercelProvider,
  WarpProvider,
  AntigravityProvider,
};
