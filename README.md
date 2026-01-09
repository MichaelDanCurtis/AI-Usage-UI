# AI Usage Monitor

A single-binary Bun application that monitors AI usage across multiple providers with a beautiful graphite-themed dashboard.

![AI Usage Monitor](https://img.shields.io/badge/Bun-1.0.0-white) ![License](https://img.shields.io/badge/license-MIT-green)




<img width="1183" height="1770" alt="Screenshot 2026-01-09 at 12 17 11 PM" src="https://github.com/user-attachments/assets/da4176e8-6710-48bf-af06-fdb9f41f13f0" />

## Features


- 📊 **Real-time Dashboard**: Beautiful graphite-themed UI with live usage data
- 🔌 **Multi-Provider Support**: Anthropic Claude, OpenRouter, GitHub Copilot, Google AI, Z.ai, Vercel, and Warp.dev
- ⚡ **High Performance**: Built with Bun for lightning-fast execution
- 💾 **Smart Caching**: Reduces API calls with configurable TTL (default 5 minutes)
- 🔄 **Auto-Refresh**: Automatically updates data every 5 minutes
- 📈 **Visual Analytics**: Interactive charts showing usage trends and distributions
- 🚀 **Single Binary**: Compile to a standalone executable for easy deployment
- 🛡️ **Error Resilient**: Gracefully handles provider failures without crashing

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- API keys for the AI providers you want to monitor

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-usage-monitor
```

2. Install dependencies:
```bash
bun install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GITHUB_TOKEN=your_github_token_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
ZAI_API_KEY=your_zai_api_key_here
VERCEL_TOKEN=your_vercel_token_here
```

5. (Optional) If using OpenRouter or Z.ai via the API key storage system:
```bash
cp data/api-keys.json.example data/api-keys.json
```

Edit `data/api-keys.json` with your keys:
```json
{
  "openrouter": "sk-or-v1-your-key-here",
  "zai": "your-zai-api-key-here"
}
```

6. Run in development mode:
```bash
bun run dev
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## Building for Production

### Create a Single Binary

```bash
bun run build
```

This creates a standalone `ai-usage-monitor` binary that includes all dependencies.

### Run the Binary

```bash
./ai-usage-monitor
```

The binary will:
- Start the HTTP server on port 3000 (configurable via `PORT` env var)
- Serve the dashboard at `http://localhost:3000`
- Fetch usage data from configured providers
- Cache results for 5 minutes (configurable via `CACHE_TTL` env var)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|----------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `HOST` | No | `localhost` | HTTP server hostname |
| `ANTHROPIC_API_KEY` | No | - | Anthropic Claude API key |
| `OPENROUTER_API_KEY` | No | - | OpenRouter API key |
| `GITHUB_TOKEN` | No | - | GitHub Personal Access Token (for Copilot) |
| `GOOGLE_AI_API_KEY` | No | - | Google AI (Gemini) API key |
| `ZAI_API_KEY` | No | - | Z.ai API key |
| `VERCEL_TOKEN` | No | - | Vercel API token |
| `CACHE_TTL` | No | `300` | Cache time-to-live in seconds |
| `LOG_LEVEL` | No | `info` | Logging level (trace, debug, info, warn, error, fatal) |

### Provider Setup

#### Anthropic Claude
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

#### OpenRouter
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign in or create an account
3. Generate a new API key
4. Add to `.env`: `OPENROUTER_API_KEY=sk-or-...`

#### GitHub Copilot
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate a new Personal Access Token
3. Select scopes: `read:org` and `read:user`
4. Add to `.env`: `GITHUB_TOKEN=ghp_...`

#### Google AI (Gemini)
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add to `.env`: `GOOGLE_AI_API_KEY=AIza...`

#### Z.ai
1. Contact Z.ai for API access
2. Obtain your API key
3. Add to `.env`: `ZAI_API_KEY=your_key_here`

#### Vercel
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token
3. Add to `.env`: `VERCEL_TOKEN=your_token_here`

#### Warp.dev (macOS only)
Warp requires special setup since it uses Firebase authentication stored in the macOS Keychain.

**Quick Setup:**
```bash
./scripts/extract-warp-token.sh
```

This will automatically extract your Warp token and add it to `.env`.

**Requirements:**
- macOS (Warp stores tokens in macOS Keychain)
- Warp installed and you must be signed in
- Token expires periodically - re-run the script when needed

**For detailed instructions**, see [docs/WARP_SETUP.md](docs/WARP_SETUP.md)

## API Endpoints

### GET /api/usage
Get aggregated usage data from all providers.

**Query Parameters:**
- `days` (optional): Number of days to fetch data for (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 2400000,
      "totalCost": 847.32,
      "totalTokens": 847000000,
      "avgLatency": 1.2,
      "requestChange": 12.5,
      "costChange": 8.3,
      "tokenChange": 23.1,
      "latencyChange": -5.4
    },
    "providers": [
      {
        "id": "anthropic",
        "name": "Anthropic Claude",
        "requests": 847000,
        "cost": 234.50,
        "tokens": 284000000,
        "status": "active",
        "lastUpdated": "2026-01-08T14:00:00Z"
      }
    ],
    "timeline": [
      {
        "date": "Jan 1",
        "requests": 320000,
        "cost": 95.00
      }
    ],
    "lastUpdated": "2026-01-08T14:30:00Z"
  },
  "timestamp": "2026-01-08T14:30:00Z"
}
```

### GET /api/usage/:providerId
Get usage data for a specific provider.

**Query Parameters:**
- `days` (optional): Number of days to fetch data for (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "anthropic",
    "name": "Anthropic Claude",
    "requests": 847000,
    "cost": 234.50,
    "tokens": 284000000,
    "status": "active",
    "lastUpdated": "2026-01-08T14:00:00Z"
  },
  "timestamp": "2026-01-08T14:30:00Z"
}
```

### GET /api/health
Check health status of all configured providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "anthropic": true,
    "openrouter": true,
    "copilot": false,
    "google": true,
    "zai": true,
    "vercel": true
  },
  "timestamp": "2026-01-08T14:30:00Z"
}
```

### GET /api/providers
List all configured providers and their health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "anthropic": true,
    "openrouter": true,
    "copilot": false,
    "google": true,
    "zai": true,
    "vercel": true
  },
  "timestamp": "2026-01-08T14:30:00Z"
}
```

## Development

### Project Structure

```
ai-usage-monitor/
├── src/
│   ├── providers/          # AI provider integrations
│   │   ├── base.ts        # Base provider class
│   │   ├── anthropic.ts    # Anthropic Claude
│   │   ├── openrouter.ts   # OpenRouter
│   │   ├── copilot.ts      # GitHub Copilot
│   │   ├── google.ts       # Google AI
│   │   ├── zai.ts         # Z.ai
│   │   ├── vercel.ts      # Vercel
│   │   └── index.ts       # Provider factory
│   ├── services/           # Business logic
│   │   ├── cache.ts       # Cache manager
│   │   └── aggregator.ts  # Data aggregator
│   ├── routes/             # API routes
│   │   └── api.ts        # API handlers
│   ├── types/              # TypeScript types
│   │   └── index.ts      # Type definitions
│   ├── utils/              # Utilities
│   │   ├── env.ts        # Environment loader
│   │   └── logger.ts     # Logger
│   └── server.ts           # Main server
├── public/                 # Static files
│   ├── index.html         # Dashboard HTML
│   ├── css/
│   │   └── styles.css     # Styles
│   └── js/
│       └── dashboard.js    # Dashboard JS
├── plans/                 # Architecture docs
│   ├── architecture.md     # System architecture
│   └── implementation-plan.md
├── package.json
├── tsconfig.json
├── bunfig.toml
├── .env.example
└── README.md
```

### Adding a New Provider

1. Create a new provider file in `src/providers/`:
```typescript
import { BaseProvider } from './base.js';
import { ProviderUsage } from '../types/index.js';

export class NewProvider extends BaseProvider {
  constructor(apiKey: string) {
    super({ apiKey, baseUrl: 'https://api.example.com' });
  }

  get id(): string {
    return 'newprovider';
  }

  get name(): string {
    return 'New Provider';
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    // Implement API call and return usage data
  }
}
```

2. Export the provider in `src/providers/index.ts`:
```typescript
export { NewProvider } from './newprovider.js';
```

3. Add the provider to the factory function:
```typescript
if (env.newProviderApiKey) {
  providers.push(new NewProvider(env.newProviderApiKey));
}
```

4. Add environment variable to `.env.example`:
```env
NEW_PROVIDER_API_KEY=your_key_here
```

## Troubleshooting

### Provider Not Showing Up

- Ensure the API key is set in `.env`
- Check the server logs for errors
- Verify the API key is valid and has the required permissions

### Dashboard Shows "Offline"

- Check if the server is running
- Verify the browser can connect to `http://localhost:3000`
- Check browser console for JavaScript errors

### High API Usage

- Increase `CACHE_TTL` to cache data longer
- Reduce the auto-refresh interval in `public/js/dashboard.js`
- Disable auto-refresh by commenting out `startAutoRefresh()`

### Build Fails

- Ensure Bun is up to date: `bun upgrade`
- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Check TypeScript errors: `bun run tsc --noEmit`

## Performance

- **Startup Time**: < 1 second
- **API Response Time**: < 100ms (cached), < 2s (uncached)
- **Memory Usage**: ~50MB (typical)
- **Binary Size**: ~40MB (includes all dependencies)

## Security

- API keys are loaded from environment variables only
- No API keys are logged or exposed in responses
- CORS is configured for same-origin requests
- Input validation on all API endpoints

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [documentation](docs/) folder
- Review the [architecture plans](plans/)

## Acknowledgments

- Dashboard design inspired by modern graphite themes
- Built with [Bun](https://bun.sh/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons from [Heroicons](https://heroicons.com/)
