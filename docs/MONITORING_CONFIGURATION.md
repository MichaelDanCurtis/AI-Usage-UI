# API Monitoring Configuration

This document describes the comprehensive configuration and transparency features for API monitoring in the AI Usage Monitor application.

## Overview

The AI Usage Monitor now provides full control over which APIs are tracked, with a global toggle to enable or disable the monitoring service. All monitoring status is transparently exposed through the API endpoints.

## Server Configuration

The application runs on **port 3010** by default. You can start the server with:

```bash
bun run src/server.ts
```

The server will be available at `http://localhost:3010`

## Environment Variables

Configure monitoring behavior through environment variables in your `.env` file:

### Server Configuration
- `PORT` - Server port (default: 3010)
- `HOST` - Server hostname (default: 0.0.0.0)

### Monitoring Configuration
- `MONITORING_ENABLED` - Enable or disable monitoring globally (default: true)
- `MONITORED_APIS` - Comma-separated list of APIs to monitor (default: all available)

Example:
```env
PORT=3010
HOST=0.0.0.0
MONITORING_ENABLED=true
MONITORED_APIS=anthropic,openrouter,github,google,zai,vercel
```

## Available API Providers

The following API providers can be monitored:
- `anthropic` - Anthropic Claude
- `openrouter` - OpenRouter
- `github` - GitHub Copilot
- `google` - Google AI (Gemini)
- `zai` - Z.ai
- `vercel` - Vercel

## API Endpoints

### Get Usage Data with Monitoring Status

**Endpoint:** `GET /api/usage`

**Description:** Returns usage data along with the current monitoring configuration.

**Base URL:** `http://localhost:3010`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 0,
      "totalCost": 0,
      "totalTokens": 0,
      "avgLatency": 1.47
    },
    "providers": [],
    "timeline": [],
    "lastUpdated": "2026-01-08T18:05:33.336Z",
    "monitoring": {
      "enabled": true,
      "monitoredApis": [
        "anthropic",
        "openrouter",
        "github",
        "google",
        "zai",
        "vercel"
      ],
      "lastUpdated": "2026-01-08T18:04:27.407Z"
    }
  },
  "timestamp": "2026-01-08T18:05:38.571Z"
}
```

When monitoring is disabled, the response will contain empty data:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 0,
      "totalCost": 0,
      "totalTokens": 0,
      "avgLatency": 0
    },
    "providers": [],
    "timeline": [],
    "lastUpdated": "2026-01-08T18:05:52.630Z",
    "monitoring": {
      "enabled": false,
      "monitoredApis": [...],
      "lastUpdated": "2026-01-08T18:05:48.093Z"
    }
  }
}
```

### Get Monitoring Configuration

**Endpoint:** `GET /api/monitoring/config`

**Description:** Returns the current monitoring configuration.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "monitoredApis": [
      "anthropic",
      "openrouter",
      "github",
      "google",
      "zai",
      "vercel"
    ],
    "lastUpdated": "2026-01-08T18:04:27.407Z"
  },
  "timestamp": "2026-01-08T18:05:44.930Z"
}
```

### Update Monitoring Configuration

**Endpoint:** `POST /api/monitoring/config`

**Description:** Update multiple monitoring configuration settings at once.

**Request Body:**
```json
{
  "enabled": true,
  "addApis": ["custom-api"],
  "removeApis": ["openrouter"]
}
```

**Response:** Returns the updated configuration.

### Toggle Monitoring

**Endpoint:** `POST /api/monitoring/toggle`

**Description:** Enable or disable monitoring globally.

**Request Body:**
```json
{
  "enabled": false
}
```

Or omit the `enabled` field to toggle the current state:
```json
{}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "enabled": false,
    "monitoredApis": [...],
    "lastUpdated": "2026-01-08T18:05:48.093Z"
  }
}
```

### Add API to Monitoring

**Endpoint:** `POST /api/monitoring/add`

**Description:** Add a new API to the list of monitored APIs.

**Request Body:**
```json
{
  "apiName": "custom-api"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "monitoredApis": [
      "anthropic",
      "openrouter",
      "github",
      "google",
      "zai",
      "vercel",
      "custom-api"
    ],
    "lastUpdated": "2026-01-08T18:06:04.136Z"
  }
}
```

### Remove API from Monitoring

**Endpoint:** `POST /api/monitoring/remove`

**Description:** Remove an API from the list of monitored APIs.

**Request Body:**
```json
{
  "apiName": "openrouter"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "monitoredApis": [
      "anthropic",
      "github",
      "google",
      "zai",
      "vercel"
    ],
    "lastUpdated": "2026-01-08T18:06:08.757Z"
  }
}
```

## Usage Examples

### Example 1: Check current monitoring status
```bash
curl http://localhost:3010/api/monitoring/config
```

### Example 2: Disable monitoring
```bash
curl -X POST http://localhost:3010/api/monitoring/toggle
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Example 3: Add a custom API to monitor
```bash
curl -X POST http://localhost:3010/api/monitoring/add
  -H "Content-Type: application/json" \
  -d '{"apiName": "my-custom-api"}'
```

### Example 4: Remove an API from monitoring
```bash
curl -X POST http://localhost:3010/api/monitoring/remove
  -H "Content-Type: application/json" \
  -d '{"apiName": "github"}'
```

### Example 5: Get usage data with monitoring status
```bash
curl http://localhost:3010/api/usage | python3 -m json.tool
```

## Monitoring Behavior

### When Monitoring is Enabled
- Only APIs in the `monitoredApis` list will be queried for usage data
- Usage data is aggregated from all monitored providers
- Results are cached according to the `CACHE_TTL` setting

### When Monitoring is Disabled
- No API providers are queried
- The `/api/usage` endpoint returns empty data
- The monitoring configuration is still accessible and can be modified

### Adding/Removing APIs
- Adding an API that doesn't exist in the providers list will include it in the configuration, but it won't be queried
- Removing an API stops it from being queried for usage data
- Changes take effect immediately on the next API request

## Implementation Details

### MonitoringConfigManager
The [`MonitoringConfigManager`](src/services/monitoring-config.ts) class manages the monitoring configuration state, including:
- Enabled/disabled status
- List of monitored APIs
- Last updated timestamp
- Methods to add, remove, and update APIs

### Integration with DataAggregator
The [`DataAggregator`](src/services/aggregator.ts) uses the monitoring configuration to:
- Check if monitoring is enabled before fetching data
- Filter providers based on the monitored APIs list
- Return empty data when monitoring is disabled

### API Routes
All monitoring configuration endpoints are implemented in [`src/routes/api.ts`](src/routes/api.ts), providing RESTful interfaces for managing the configuration.

## Best Practices

1. **Start with all APIs enabled** to get a complete picture of your usage
2. **Disable monitoring** when you don't need real-time data to reduce API calls
3. **Remove unused APIs** from monitoring to reduce unnecessary requests
4. **Check the monitoring status** regularly to ensure your configuration is as expected
5. **Use environment variables** for initial configuration, then use API endpoints for runtime changes

## Troubleshooting

### Monitoring not working
- Check that `MONITORING_ENABLED` is set to `true` in your environment
- Verify the API is in the `monitoredApis` list
- Check server logs for any errors

### APIs not being monitored
- Ensure the API name matches exactly (case-sensitive)
- Verify the API is in the `monitoredApis` list
- Check that the provider is configured with valid API keys

### Empty usage data
- Verify monitoring is enabled
- Check that at least one API is in the monitored list
- Ensure API keys are configured for the monitored providers
