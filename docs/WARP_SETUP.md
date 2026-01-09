# Warp.dev Setup Guide

This guide explains how to set up Warp.dev integration for the AI Usage Monitor.

## What You Need

- **macOS only**: Warp currently stores authentication tokens in the macOS Keychain
- **Warp installed**: Download from [warp.dev](https://warp.dev)
- **Warp account**: You must be signed into Warp

## Quick Setup (Recommended)

### Option 1: Automatic Extraction Script

We provide a script that automatically extracts your Warp token:

```bash
./scripts/extract-warp-token.sh
```

This script will:
1. ✓ Check if Warp is installed
2. ✓ Check if you're logged into Warp
3. ✓ Extract the Firebase ID token from macOS Keychain
4. ✓ Check if the token is expired
5. ✓ Save the token to your `.env` file

Then start the server:

```bash
bun run dev
```

### Option 2: Manual Extraction

If you prefer to extract the token manually:

```bash
# Extract the token
security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['id_token']['id_token'])"
```

Copy the output (a JWT token starting with `eyJ...`) and add it to your `.env` file:

```env
WARP_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5...
```

## How It Works

### Authentication Flow

1. **Warp Authentication**: When you sign into Warp, it authenticates with Google/GitHub/etc.
2. **Firebase Token**: Warp exchanges this for a Firebase ID token (JWT)
3. **Keychain Storage**: The token is stored in macOS Keychain under service `dev.warp.Warp-Stable`, account `User`
4. **GraphQL API**: This token is used to authenticate with Warp's GraphQL API at `https://app.warp.dev/graphql/v2`

### Token Details

- **Format**: JWT (JSON Web Token) - looks like `eyJhbGci...`
- **Expires**: Tokens expire after a few hours
- **Storage**: macOS Keychain (`dev.warp.Warp-Stable` service, `User` account)
- **Purpose**: Authenticates requests to Warp's GraphQL API

## Token Expiration & Automatic Refresh

The Warp provider now handles token expiration automatically:

### How It Works
1. **ID tokens** expire after ~1 hour
2. **Refresh tokens** are used to get new ID tokens automatically
3. The server caches tokens in memory and refreshes proactively (5 min before expiry)
4. You don't need to do anything - it just works

### When Manual Intervention Is Needed
The **only** scenario where you need to restart Warp:
- You haven't used Warp OR run this server for **6+ months**
- Firebase refresh tokens expire after prolonged inactivity
- The server logs will clearly tell you: `WARP REFRESH TOKEN EXPIRED OR REVOKED`

**To fix**: Restart Warp (Cmd+Q, then reopen). This refreshes the keychain tokens.

### Normal Usage
As long as you're using Warp regularly (even just having it open), the tokens stay fresh. The monitoring server will automatically refresh tokens indefinitely without any manual steps.

## Troubleshooting

### Error: "No Warp authentication found in Keychain"

**Problem**: You're not logged into Warp, or Warp hasn't stored credentials yet.

**Solution**:
1. Open Warp terminal
2. Make sure you're signed in (look for your profile picture in the top-right)
3. If not signed in, click your profile icon and sign in
4. Wait a few seconds for authentication to complete
5. Run the extraction script again

### Error: "Warp is not installed"

**Problem**: Warp is not installed on your system.

**Solution**:
1. Download Warp from [warp.dev](https://warp.dev)
2. Install and open Warp
3. Sign in to your account
4. Run the extraction script

### Error: "Could not extract Firebase ID token"

**Problem**: The token format in Keychain has changed (rare).

**Solution**:
1. Check if you can see the raw data:
   ```bash
   security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w
   ```
2. If you see JSON data with an `id_token` field, the format is still valid
3. Open an issue on GitHub with the error details

### Token expires too frequently

**Problem**: You used to have to re-extract the token often.

**Solution**: This is now fixed! The server automatically refreshes tokens using Firebase's refresh token API. You should never need to manually extract tokens unless:
- You haven't used Warp for 6+ months (refresh token expired)
- There's a Warp authentication issue (check if you're logged into Warp)

## Platform Limitations

### macOS Only

Warp token extraction currently only works on macOS because:
- Warp stores tokens in the macOS Keychain
- The `security` command is macOS-specific
- Warp itself is macOS-only (Linux support is coming)

### Future Support

When Warp adds Linux support, we'll update the extraction script to support:
- Linux keyring (`libsecret`)
- Alternative token storage methods

## Security Notes

### Keep Your Token Private

⚠️ **IMPORTANT**: Your Warp token is like a password!

- ✓ DO: Keep your `.env` file private
- ✓ DO: Add `.env` to `.gitignore` (already done)
- ✗ DON'T: Commit tokens to version control
- ✗ DON'T: Share tokens publicly

### Token Scope

The Firebase ID token can:
- ✓ Read your Warp usage data (credits, limits)
- ✓ Access your Warp profile information
- ✗ Cannot modify your Warp settings
- ✗ Cannot access your terminal history

## API Information

### GraphQL Endpoint

```
POST https://app.warp.dev/graphql/v2?op=GetRequestLimitInfo
```

### Headers Required

```
Content-Type: application/json
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
x-warp-client-id: warp-app
x-warp-client-version: v0.2026.01.07.08.13.stable_01
```

### Response Data

```json
{
  "data": {
    "user": {
      "user": {
        "requestLimitInfo": {
          "requestLimit": 1500,
          "requestsUsedSinceLastRefresh": 264,
          "nextRefreshTime": "2026-01-22T03:55:29.804154Z",
          "isUnlimited": false,
          "requestLimitRefreshDuration": "MONTHLY"
        }
      }
    }
  }
}
```

## Advanced Usage

### Scripting Token Extraction

You can automate token extraction in your deployment scripts:

```bash
#!/bin/bash
# Deploy script with automatic token refresh
./scripts/extract-warp-token.sh
bun run build
./ai-usage-monitor
```

### Monitoring Token Expiration

Check token expiration time:

```bash
security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['id_token']['expiration_time'])"
```

### Manual Token Refresh

If you need to force a token refresh:

1. Quit Warp completely
2. Open Warp again
3. Use it for a few seconds (run a command, open settings, etc.)
4. Extract the token again

## Support

### Getting Help

- **Issues**: Open an issue on GitHub
- **Questions**: Check existing issues first
- **Contributions**: PRs welcome!

### Useful Commands

```bash
# Check if Warp is installed
ls /Applications/Warp.app

# Check if you're logged in
security find-generic-password -s "dev.warp.Warp-Stable" -a "User" > /dev/null && echo "Logged in" || echo "Not logged in"

# View raw token data
security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w | python3 -m json.tool

# Extract just the token
./scripts/extract-warp-token.sh
```
