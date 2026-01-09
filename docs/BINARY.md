# AI Usage Monitor - Binary Distribution

## Quick Start

The AI Usage Monitor is distributed as a single standalone binary with no dependencies required.

### Prerequisites

You only need your API keys/tokens configured as environment variables:

```bash
export ANTHROPIC_API_KEY="your-key"
export OPENROUTER_API_KEY="your-key"
export GITHUB_TOKEN="your-token"
export WARP_TOKEN="your-token"
# ... etc
```

See the main [README.md](./README.md) for the complete list of supported environment variables.

### Running the Binary

Simply execute the binary:

```bash
./ai-usage-monitor
```

The server will start on `http://localhost:3010` by default.

### Building from Source

If you want to build the binary yourself:

```bash
# Install dependencies
bun install

# Build the binary
bun run build

# The binary will be created as ./ai-usage-monitor
```

### Binary Details

- **Size**: ~58MB (includes Bun runtime + all dependencies)
- **Platform**: macOS ARM64 (for this build)
- **No external dependencies**: Everything is bundled in the single executable

### Cross-Platform Builds

To build for different platforms:

```bash
# macOS ARM64 (M1/M2/M3)
bun build src/server.ts --compile --outfile ai-usage-monitor-macos-arm64

# macOS x64
bun build src/server.ts --compile --target=bun-darwin-x64 --outfile ai-usage-monitor-macos-x64

# Linux x64
bun build src/server.ts --compile --target=bun-linux-x64 --outfile ai-usage-monitor-linux-x64

# Windows x64
bun build src/server.ts --compile --target=bun-windows-x64 --outfile ai-usage-monitor-windows-x64.exe
```

### Configuration

The binary reads configuration from:
1. Environment variables
2. `.env` file in the current working directory

All static assets (HTML, CSS, JS) are bundled into the binary.

### Port Configuration

You can change the port using the `PORT` environment variable:

```bash
PORT=8080 ./ai-usage-monitor
```
