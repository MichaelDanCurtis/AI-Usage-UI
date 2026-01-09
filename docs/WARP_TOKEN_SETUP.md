# Warp Token Setup - Quick Guide

## For macOS Users

### Automatic Setup (Recommended)

Run this one command to extract your Warp token:

```bash
./scripts/extract-warp-token.sh
```

That's it! The script will:
- ✓ Check if Warp is installed and you're logged in
- ✓ Extract your Firebase ID token from Keychain
- ✓ Save it to your `.env` file automatically
- ✓ Check if the token is expired

Then start the app:

```bash
bun run dev
```

### Manual Setup

If you prefer to do it manually:

1. Extract the token:
```bash
security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['id_token']['id_token'])"
```

2. Add to `.env`:
```env
WARP_TOKEN=eyJhbGci...
```

### When the Token Expires

Warp tokens expire after a few hours. When you see auth errors:

```bash
./scripts/extract-warp-token.sh
```

No need to restart the server!

## For Non-macOS Users

Unfortunately, Warp token extraction currently only works on macOS because:
- Warp is macOS-only (Linux support coming soon)
- Tokens are stored in the macOS Keychain

When Warp supports Linux, we'll update the script to support it too!

## Troubleshooting

### "No Warp authentication found"
- Open Warp terminal
- Make sure you're signed in
- Run the script again

### "Token is expired"
- Use Warp for a few seconds (run any command)
- Run the extraction script again

### Need more help?
See the [detailed setup guide](docs/WARP_SETUP.md)

## Security

⚠️ **Important**: Your Warp token is sensitive!

- ✓ Keep `.env` file private (already in `.gitignore`)
- ✗ Don't commit tokens to version control
- ✗ Don't share tokens publicly

## How It Works

1. Warp stores a Firebase ID token in macOS Keychain
2. The script extracts this JWT token
3. The app uses it to authenticate with Warp's GraphQL API
4. This gives us access to your usage data (credits used/remaining)

Read more: [docs/WARP_SETUP.md](docs/WARP_SETUP.md)
