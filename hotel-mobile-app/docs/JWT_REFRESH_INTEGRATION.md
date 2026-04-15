# JWT Refresh Token Integration - Mobile App

This document explains the JWT refresh token implementation in the React Native mobile app.

## Overview

The mobile app now supports automatic token refresh using JWT refresh tokens. When the access token expires (15 minutes), the app automatically uses the refresh token to get a new access/refresh token pair without requiring the user to log in again.

## Architecture

### Token Storage

Tokens are stored in AsyncStorage:
- `authToken` - Access token (15 min expiry)
- `refreshToken` - Refresh token (7 days expiry)
- `user` - User profile data

### Token Lifecycle

```
1. User Login
   ↓
2. Receive accessToken (15m) + refreshToken (7d)
   ↓
3. Store both tokens in AsyncStorage
   ↓
4. Use accessToken for API requests
   ↓
5. Access token expires (401 error)
   ↓
6. Automatically use refreshToken to get new tokens
   ↓
7. Retry original request with new accessToken
   ↓
8. Continue seamlessly (user doesn't notice)
```

## Implementation Details

### 1. Auth Store (`src/store/authStore.ts`)

**New State:**
```typescript
{
  token: string | null;          // Access token
  refreshToken: string | null;   // Refresh token
  user: User | null;
  isAuthenticated: boolean;
}
```

**New Methods:**
- `setTokens(accessToken, refreshToken)` - Update tokens in state and storage
- Updated `login()` - Stores both tokens
- Updated `logout()` - Revokes refresh token on server
- Updated `loadUser()` - Loads both tokens from storage

### 2. API Client (`src/api/client.ts`)

**Automatic Token Refresh:**

The response interceptor now:
1. Detects 401 errors
2. Checks if we're already refreshing (prevents multiple refresh calls)
3. Uses refresh token to get new access/refresh token pair
4. Updates AsyncStorage with new tokens
5. Retries the original failed request
6. Queues concurrent requests waiting for token refresh

**Request Queueing:**

When multiple requests hit 401 simultaneously:
- Only one refresh call is made
- Other requests are queued
- All requests retry once token is refreshed

### 3. Auth API (`src/api/auth.ts`)

**Updated Methods:**

```typescript
// Login - returns accessToken + refreshToken
login(credentials) → { accessToken, refreshToken, user }

// Refresh - exchanges refresh token for new pair
refreshToken(refreshToken) → { accessToken, refreshToken }

// Logout - revokes refresh token on server
logout(refreshToken) → void
```

### 4. Token Manager Utility (`src/utils/tokenManager.ts`)

Helper functions:
- `getAccessToken()` - Get access token from storage
- `getRefreshToken()` - Get refresh token from storage
- `setTokens()` - Store both tokens
- `clearAuth()` - Clear all auth data
- `hasTokens()` - Check if tokens exist
- `decodeJWT()` - Decode token payload
- `isTokenExpired()` - Check if token expired
- `getTokenExpiryTime()` - Get seconds until expiry

## Usage Examples

### Login
```typescript
import { useAuthStore } from './store/authStore';

const auth = useAuthStore();

await auth.login({
  email: 'admin@hotel.com',
  password: 'admin123'
});

// Tokens automatically stored
// User authenticated
```

### Making API Calls

No changes needed! The API client handles everything:

```typescript
// This request will automatically refresh token if needed
const rooms = await roomsAPI.getRooms();
```

### Manual Token Refresh

Usually not needed (automatic), but available:

```typescript
import { authAPI } from './api/auth';
import { tokenManager } from './utils/tokenManager';

const refreshToken = await tokenManager.getRefreshToken();
const newTokens = await authAPI.refreshToken(refreshToken);
// New tokens automatically stored
```

### Logout

```typescript
await auth.logout();
// Revokes refresh token on server
// Clears all local auth data
```

## Testing the Integration

### 1. Test Login
```typescript
// Should receive both tokens
const response = await auth.login({
  email: 'admin@hotel.com',
  password: 'admin123'
});

console.log('Access Token:', response.accessToken);
console.log('Refresh Token:', response.refreshToken);
```

### 2. Test Token Expiry
```typescript
// Wait 15+ minutes or manually set expired token
// Try any API call - should auto-refresh
const rooms = await roomsAPI.getRooms();
// Should succeed without error
```

### 3. Test Logout
```typescript
await auth.logout();
// Should revoke token on server
// Should clear all tokens from AsyncStorage
```

## Error Handling

### Token Refresh Fails
- User redirected to login screen
- All auth data cleared
- Error logged to console

### Network Error During Refresh
- Original request fails
- User sees error message
- Can retry manually

### Invalid Refresh Token
- Auth cleared
- User redirected to login

## Security Considerations

1. **Short-lived access tokens** (15 min) limit damage if stolen
2. **Token rotation** - Old refresh token revoked when used
3. **Secure storage** - Tokens stored in AsyncStorage (encrypted on device)
4. **Automatic cleanup** - Server removes expired tokens every 24h
5. **Server-side revocation** - Logout revokes refresh token on server

## Migration Notes

### Breaking Changes

If you have existing logged-in users:

**Old response:**
```json
{ "token": "...", "user": {...} }
```

**New response:**
```json
{ "accessToken": "...", "refreshToken": "...", "user": {...} }
```

### Migration Strategy

Users will need to log in again after app update:
1. Old `token` storage key won't match new `accessToken`
2. Missing `refreshToken` will fail authentication
3. User automatically redirected to login screen

Alternatively, migrate existing tokens:
```typescript
// One-time migration
const oldToken = await AsyncStorage.getItem('token');
if (oldToken && !await AsyncStorage.getItem('authToken')) {
  // Treat old token as access token
  await AsyncStorage.setItem('authToken', oldToken);
  await AsyncStorage.removeItem('token');
  // User will login again when this expires
}
```

## Troubleshooting

### Issue: "Invalid or expired refresh token"
**Cause:** Refresh token expired (7 days) or revoked
**Solution:** User must login again

### Issue: Token refresh stuck in loop
**Cause:** Server not returning new tokens correctly
**Solution:** Check server `/auth/refresh` endpoint response format

### Issue: Concurrent requests all fail with 401
**Cause:** Request queueing not working
**Solution:** Check `isRefreshing` flag and `refreshSubscribers` array

### Issue: Login successful but can't access protected routes
**Cause:** Tokens not stored correctly
**Solution:** Check AsyncStorage in `login()` method

## Performance

- **Token refresh:** ~200-500ms (one-time overhead when token expires)
- **Request queueing:** Minimal overhead (in-memory array)
- **Storage I/O:** Async operations don't block UI
- **Memory:** ~2KB for tokens + user data

## Future Enhancements

1. **Biometric re-authentication** - Require fingerprint for sensitive operations
2. **Token expiry warnings** - Show countdown before session expires
3. **Background refresh** - Refresh tokens proactively before expiry
4. **Offline mode** - Cache data for offline access with expired tokens
5. **Multi-device sync** - Revoke tokens on one device when logging out from another
