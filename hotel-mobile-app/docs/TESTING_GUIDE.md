# Mobile App Testing Guide

Complete testing guide for the JWT refresh token integration in the React Native mobile app.

## Prerequisites

1. **Backend Server Running:**
   ```bash
   cd backend
   npm run dev
   # Server should be at http://localhost:3000
   ```

2. **MongoDB Running:**
   ```bash
   # MongoDB should be at mongodb://localhost:27017
   # Database: hotel_management
   ```

3. **Test Users Seeded:**
   - admin@hotel.com / admin123 (Admin)
   - frontdesk@hotel.com / staff123 (Front Desk)
   - manager@hotel.com / staff123 (Manager)
   - housekeeping@hotel.com / staff123 (Housekeeping)

## Setup Mobile App

### 1. Install Dependencies
```bash
cd hotel-mobile-app
npm install
```

### 2. Update API URL

Edit `src/api/client.ts`:
```typescript
// For testing on real device:
const API_URL = 'http://YOUR_COMPUTER_IP:3000/api';

// For iOS Simulator:
const API_URL = 'http://localhost:3000/api';

// For Android Emulator:
const API_URL = 'http://10.0.2.2:3000/api';
```

### 3. Start Development Server
```bash
npx expo start
```

## Test Cases

### Test 1: Login with Token Pair

**Objective:** Verify login returns both access and refresh tokens

**Steps:**
1. Open mobile app
2. Enter credentials: `admin@hotel.com` / `admin123`
3. Tap "Login"

**Expected Result:**
- Login successful
- Navigate to main screen
- Console shows: "Login successful", accessToken, refreshToken

**Verify:**
```typescript
// In React Native Debugger or Flipper
AsyncStorage.getItem('authToken').then(console.log);
AsyncStorage.getItem('refreshToken').then(console.log);
AsyncStorage.getItem('user').then(console.log);
```

**Pass Criteria:**
- ✅ All three storage keys have values
- ✅ User object has correct email and role
- ✅ Tokens are JWT format (three dot-separated parts)

---

### Test 2: API Call with Valid Token

**Objective:** Verify API calls work with access token

**Steps:**
1. Login as admin
2. Navigate to "Rooms" screen
3. Observe room list

**Expected Result:**
- GET /api/rooms succeeds
- Rooms displayed in UI
- No errors

**Verify Network:**
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
  Status: 200 OK
  Body: [{ roomNumber, type, status, ... }]
```

**Pass Criteria:**
- ✅ Rooms list displayed
- ✅ Authorization header includes Bearer token
- ✅ Response successful

---

### Test 3: Automatic Token Refresh

**Objective:** Verify app automatically refreshes expired access token

**Option A: Wait for Expiry (15 minutes)**
1. Login as admin
2. Wait 16 minutes (access token expires)
3. Navigate to "Rooms" screen

**Option B: Manual Expiry (Quick Test)**
1. Login as admin
2. In backend, update token expiry to 10 seconds:
   ```typescript
   // backend/src/utils/jwt.ts
   expiresIn: '10s' // Temporarily change from '15m'
   ```
3. Wait 11 seconds
4. Navigate to "Rooms" screen

**Expected Result:**
- First request fails with 401
- App automatically calls POST /api/auth/refresh
- New tokens received
- Original request retried automatically
- Rooms displayed successfully
- User doesn't see any errors

**Verify Network:**
```
1. GET /api/rooms
   Status: 401 Unauthorized
   
2. POST /api/auth/refresh
   Body: { refreshToken: "..." }
   Response: { accessToken: "...", refreshToken: "..." }
   
3. GET /api/rooms (retry)
   Status: 200 OK
   Body: [rooms...]
```

**Verify Storage:**
```typescript
// New tokens should be different from original
AsyncStorage.getItem('authToken').then(console.log);
AsyncStorage.getItem('refreshToken').then(console.log);
```

**Pass Criteria:**
- ✅ No "Unauthorized" error shown to user
- ✅ Rooms displayed successfully
- ✅ Console shows token refresh occurred
- ✅ New tokens stored in AsyncStorage
- ✅ New tokens different from original

---

### Test 4: Concurrent Requests During Refresh

**Objective:** Verify multiple simultaneous API calls queue correctly

**Setup:**
1. Set access token expiry to 10 seconds (backend)
2. Login as admin
3. Wait 11 seconds

**Steps:**
4. Quickly navigate between multiple screens:
   - Tap "Rooms"
   - Tap "Reservations"
   - Tap "Profile"

**Expected Result:**
- All three requests hit 401 simultaneously
- Only ONE refresh request made (not three)
- All three requests queued
- All three requests retry after token refresh
- All three succeed

**Verify Network:**
```
Concurrent 401 errors:
1. GET /api/rooms → 401
2. GET /api/reservations → 401
3. GET /api/auth/me → 401

Single refresh call:
4. POST /api/auth/refresh → 200 (new tokens)

All retried successfully:
5. GET /api/rooms → 200
6. GET /api/reservations → 200
7. GET /api/auth/me → 200
```

**Pass Criteria:**
- ✅ Only one POST /api/auth/refresh call
- ✅ All three original requests retried
- ✅ All screens load successfully
- ✅ No duplicate refresh calls

---

### Test 5: Token Rotation

**Objective:** Verify old refresh token revoked when used

**Steps:**
1. Login as admin
2. Note refresh token: `REFRESH_TOKEN_1`
3. Wait for access token to expire (or use 10s expiry)
4. Make API call to trigger refresh
5. Note new refresh token: `REFRESH_TOKEN_2`

**Backend Verification:**
```bash
# In MongoDB
use hotel_management

# Check old token revoked
db.refreshtokens.findOne({ token: "REFRESH_TOKEN_1" })
# Should have: revoked: true, revokedAt: [timestamp]

# Check new token valid
db.refreshtokens.findOne({ token: "REFRESH_TOKEN_2" })
# Should have: revoked: false, expiresAt: [future date]
```

**Try to Use Old Token:**
```bash
# Manual test with curl
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN_1"}'

# Expected: 401 Unauthorized
# Message: "Invalid or expired refresh token"
```

**Pass Criteria:**
- ✅ Old refresh token revoked in database
- ✅ New refresh token valid
- ✅ Cannot reuse old refresh token
- ✅ Token rotation working correctly

---

### Test 6: Logout Revokes Refresh Token

**Objective:** Verify logout revokes refresh token on server

**Steps:**
1. Login as admin
2. Note refresh token from storage
3. Navigate to Profile/Settings
4. Tap "Logout"

**Expected Result:**
- Loading indicator shown
- POST /api/auth/logout called with refreshToken
- Redirect to login screen
- All storage cleared

**Backend Verification:**
```bash
# Check token revoked
db.refreshtokens.findOne({ token: "NOTED_REFRESH_TOKEN" })
# Should have: revoked: true, revokedAt: [timestamp]
```

**Try to Use Revoked Token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"NOTED_REFRESH_TOKEN"}'

# Expected: 401 Unauthorized
```

**Pass Criteria:**
- ✅ Logout API called
- ✅ Token revoked in database
- ✅ AsyncStorage cleared
- ✅ Redirected to login screen
- ✅ Cannot use old refresh token

---

### Test 7: Refresh Token Expired

**Objective:** Verify app handles expired refresh token gracefully

**Setup:**
1. In backend, set refresh token expiry to 1 minute:
   ```typescript
   // backend/src/utils/jwt.ts
   const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
   ```
2. Login as admin
3. Wait 2 minutes

**Steps:**
4. Make any API call (rooms, reservations)

**Expected Result:**
- Access token fails (401)
- App attempts token refresh
- Refresh token also expired
- Refresh fails with 401
- App calls `clearAuthAndRedirect()`
- User redirected to login screen
- All storage cleared

**Pass Criteria:**
- ✅ Graceful error handling
- ✅ No error alerts shown
- ✅ Redirected to login automatically
- ✅ Can login again successfully

---

### Test 8: Invalid Refresh Token

**Objective:** Verify app handles invalid/corrupted refresh token

**Steps:**
1. Login as admin
2. Manually corrupt refresh token in storage:
   ```typescript
   AsyncStorage.setItem('refreshToken', 'invalid-token-12345');
   ```
3. Wait for access token to expire
4. Make any API call

**Expected Result:**
- Refresh attempt with invalid token
- Server returns 401
- App clears auth and redirects to login

**Pass Criteria:**
- ✅ No app crash
- ✅ Redirected to login
- ✅ User can login again

---

### Test 9: Network Error During Refresh

**Objective:** Verify app handles network errors during token refresh

**Steps:**
1. Login as admin
2. Enable airplane mode or disconnect WiFi
3. Wait for token to expire
4. Make API call

**Expected Result:**
- Initial request fails (network error)
- Refresh attempt fails (network error)
- User sees network error message
- App doesn't clear auth data
- When network restored, user can retry

**Pass Criteria:**
- ✅ Network error shown to user
- ✅ Auth data NOT cleared
- ✅ User can retry after network restored
- ✅ No app crash

---

### Test 10: Token Refresh on App Restart

**Objective:** Verify app loads tokens from storage on restart

**Steps:**
1. Login as admin
2. Close app completely (swipe away)
3. Reopen app

**Expected Result:**
- App loads tokens from AsyncStorage
- User remains authenticated
- Navigates directly to main screen (not login)
- First API call uses stored access token

**Pass Criteria:**
- ✅ User stays logged in
- ✅ No login screen shown
- ✅ API calls work immediately
- ✅ Tokens loaded from storage

---

### Test 11: Different User Roles

**Objective:** Verify token refresh works for all user roles

**Test for each role:**

**Admin:**
```
Login: admin@hotel.com / admin123
Test: GET /api/rooms (should see all rooms)
```

**Manager:**
```
Login: manager@hotel.com / staff123
Test: GET /api/reservations (should see all)
```

**Front Desk:**
```
Login: frontdesk@hotel.com / staff123
Test: POST /api/reservations (can create)
Test: POST /api/rooms (should fail - no permission)
```

**Housekeeping:**
```
Login: housekeeping@hotel.com / staff123
Test: GET /api/rooms (can view)
Test: PUT /api/rooms/:id (can update status)
```

**For each:**
- Wait for token to expire
- Verify auto-refresh works
- Verify permissions maintained after refresh

**Pass Criteria:**
- ✅ Token refresh works for all roles
- ✅ Permissions preserved after refresh
- ✅ Role-specific routes work correctly

---

## Test Summary Checklist

After completing all tests:

- [ ] ✅ Login returns both tokens
- [ ] ✅ API calls work with valid token
- [ ] ✅ Auto-refresh on token expiry
- [ ] ✅ Concurrent requests queue correctly
- [ ] ✅ Old refresh token revoked (rotation)
- [ ] ✅ Logout revokes token on server
- [ ] ✅ Expired refresh token handled
- [ ] ✅ Invalid token handled
- [ ] ✅ Network errors handled gracefully
- [ ] ✅ Tokens persist on app restart
- [ ] ✅ All user roles work correctly

## Debugging Tips

### View Console Logs

**React Native Debugger:**
```bash
# Chrome DevTools
Open app → Shake device → Debug → Chrome opens
Check Console tab
```

**Flipper:**
```bash
# Better debugging experience
npx expo install react-native-flipper
# View network requests, AsyncStorage, logs
```

### Monitor Network Traffic

**Reactotron:**
```bash
npm install --save-dev reactotron-react-native
# See all API calls in real-time
```

**Charles Proxy:**
- Intercept HTTP traffic
- View request/response bodies
- Monitor token refresh flow

### Check AsyncStorage

```typescript
// Add temporary debug button
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const values = await AsyncStorage.multiGet(keys);
  console.log('AsyncStorage:', values);
};
```

### Backend Logs

```bash
# In backend terminal
# Watch for refresh token requests
# Should see: POST /api/auth/refresh
# Should see: "Token refreshed for user: [email]"
```

## Common Issues

### Issue: "Network request failed"
**Cause:** Wrong API_URL or backend not running
**Fix:** Check firewall, IP address, backend running on port 3000

### Issue: Token refresh not triggered
**Cause:** Access token not expired yet
**Fix:** Temporarily set expiry to 10 seconds in backend

### Issue: Infinite refresh loop
**Cause:** Server returning old tokens or wrong format
**Fix:** Check `/auth/refresh` endpoint returns new tokens

### Issue: "Cannot read property 'token' of null"
**Cause:** User state not loaded
**Fix:** Add null checks, ensure `loadUser()` called on app start

## Performance Testing

### Token Refresh Latency
- Measure time from 401 to successful retry
- Should be < 500ms on good network

### Concurrent Request Handling
- Send 10 simultaneous requests with expired token
- Verify only 1 refresh call
- Verify all 10 requests succeed

### Storage Performance
- Measure AsyncStorage read/write time
- Should be < 50ms per operation

## Security Testing

### Token Theft Simulation
1. Capture access token
2. Try to use from different client
3. Verify expires in 15 minutes
4. Verify refresh token not exposed in requests

### XSS Prevention
- Verify tokens only in AsyncStorage (not in JS variables long-term)
- Verify tokens not logged to console in production

### Man-in-the-Middle
- Test with HTTPS in production
- Verify tokens encrypted in transit

## Production Checklist

Before releasing to production:

- [ ] Change token expiry back to 15m (not 10s)
- [ ] Update API_URL to production server
- [ ] Remove debug console.logs
- [ ] Test on real devices (iOS + Android)
- [ ] Test with slow network (3G)
- [ ] Test with intermittent network
- [ ] Add error tracking (Sentry)
- [ ] Add analytics for refresh frequency
- [ ] Test app store build (not Expo Go)
- [ ] Verify HTTPS used
- [ ] Test on various device models
- [ ] Test on various OS versions

## Next Steps

After all tests pass:

1. **Document findings** - Note any issues found
2. **Fix bugs** - Address any failing tests
3. **Code review** - Review implementation with team
4. **Deploy to staging** - Test in staging environment
5. **User acceptance testing** - Have QA team test
6. **Production deployment** - Deploy to app stores
