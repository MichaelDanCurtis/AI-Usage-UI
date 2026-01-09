# Warp Token Troubleshooting

## Status: SOLVED ✅

Automatic token refresh is now working. You should rarely need this guide.

## How It Works Now

1. Server reads tokens from macOS Keychain on first request
2. Caches the refresh token in memory
3. Automatically refreshes ID tokens before they expire (5 min buffer)
4. Keeps working indefinitely without manual intervention

## When You Still Need To Restart Warp

**Only one scenario**: You haven't used Warp OR this server for **6+ months**.

Firebase refresh tokens expire after prolonged inactivity. When this happens:

### Symptoms
- Warp card shows `status: "inactive"`
- Server logs show: `WARP REFRESH TOKEN EXPIRED OR REVOKED`
- Automatic refresh fails

### Solution
```bash
# 1. Quit Warp completely (Cmd+Q)
# 2. Reopen Warp
# 3. Wait a few seconds for auth to complete
# 4. The server will automatically pick up fresh tokens
```

No need to run extraction scripts or restart the server.

## Technical Details

- Token location: macOS Keychain → Service: `dev.warp.Warp-Stable`, Account: `User`
- ID Token: Firebase JWT, expires in ~1 hour
- Refresh Token: Used to get new ID tokens, expires after ~6 months of inactivity
- Firebase API Key: `AIzaSyBdy3O3S9hrdayLJxJ7mriBR4qgUaUygAs` (extracted from Warp binary)

## Code Implementation

The `WarpProvider` (`src/providers/warp.ts`):
1. Checks for valid cached token (with 5 min buffer)
2. If expiring soon, refreshes proactively using cached refresh token
3. Falls back to keychain if no cache
4. Stores refresh token from keychain for future refreshes
5. Logs clear error message if refresh token is expired/revoked

## Last Updated
2026-01-09
