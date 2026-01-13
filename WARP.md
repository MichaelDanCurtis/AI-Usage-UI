# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

AI Usage Monitor is a single-binary Bun application that aggregates usage data from multiple AI providers (Anthropic, OpenRouter, GitHub Copilot, Google AI, Z.ai, Vercel, Warp.dev) and displays it in a graphite-themed dashboard.

## Commands

```bash
# Development
bun run dev              # Start dev server on localhost:3000

# Build
bun run build            # Compile to single binary: ./ai-usage-monitor

# Production
./ai-usage-monitor       # Run compiled binary

# Type checking
bun run tsc --noEmit     # Check TypeScript errors

# Testing
bun test                 # Run tests
```

## Architecture

### Provider Pattern

All AI providers extend `BaseProvider` in `src/providers/base.ts`:

```typescript
export class NewProvider extends BaseProvider {
  get id(): string { return 'provider-id'; }
  get name(): string { return 'Provider Name'; }
  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> { ... }
}
```

Providers are auto-registered in `src/providers/index.ts` based on available credentials (env vars or local auth files).

### Service Layer

- **CacheManager** (`src/services/cache.ts`): LRU cache with configurable TTL
- **DataAggregator** (`src/services/aggregator.ts`): Orchestrates provider calls, handles parallel fetching with `Promise.allSettled`
- **MonitoringConfigManager** (`src/services/monitoring-config.ts`): Controls which providers are active

### Server

`src/server.ts` uses Bun's native HTTP server (`Bun.serve`). Routes are manually matched (no framework).

Static files are served from `public/` (dashboard HTML, CSS, JS).

### Types

All TypeScript interfaces are in `src/types/index.ts`. Key types:
- `ProviderUsage`: Response shape from providers
- `Provider`: Interface all providers implement
- `Environment`: Typed env config

## Adding a New Provider

1. Create `src/providers/newprovider.ts` extending `BaseProvider`
2. Export from `src/providers/index.ts`
3. Add initialization logic in `createProviders()` function
4. Add env var to `.env.example` and `Environment` interface

## Provider Authentication

Some providers use local auth files instead of/in addition to env vars:
- **Copilot**: `~/.config/github-copilot/apps.json`
- **Warp**: macOS Keychain (use `./scripts/extract-warp-token.sh`)
- **Antigravity**: `~/.gemini/antigravity`

## Environment Variables

Key variables in `.env`:
- `PORT`, `HOST`: Server binding
- `CACHE_TTL`: Cache duration in seconds (default 300)
- `MONITORING_ENABLED`: Toggle all monitoring
- `MONITORED_APIS`: Comma-separated provider IDs to enable
- Provider-specific: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_AI_API_KEY`, `ZAI_API_KEY`, `VERCEL_TOKEN`, `WARP_TOKEN`
