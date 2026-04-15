# Quick Start Guide - JWT Refresh Token Integration

This guide will help you quickly test the JWT refresh token integration between the backend and mobile app.

## Prerequisites Check

✅ Node.js installed (v16+)  
✅ MongoDB installed and running  
✅ Expo CLI installed (`npm install -g expo-cli`)  
✅ Expo Go app on mobile device (or iOS Simulator/Android Emulator)

## Backend Setup (5 minutes)

### 1. Start MongoDB

```powershell
# Windows - Start MongoDB service
net start MongoDB

# OR if running manually:
mongod --dbpath C:\data\db
```

### 2. Start Backend Server

```powershell
cd C:\Users\PC\Desktop\SmartDoorLock\backend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
Server running on port 3000
MongoDB connected successfully
Database seeded successfully
Token cleanup scheduled
```

### 3. Verify Backend

Open new PowerShell:

```powershell
# Test login
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@hotel.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "e8f7d9c...",
  "user": {
    "id": "...",
    "email": "admin@hotel.com",
    "role": "admin"
  }
}
```

✅ If you see this response, backend is ready!

## Mobile App Setup (5 minutes)

### 1. Get Your Computer's IP Address

```powershell
ipconfig

# Look for IPv4 Address under your active network adapter
# Example: 192.168.1.100
```

### 2. Update Mobile App API URL

**Option A: Testing on Real Device (Recommended)**

Edit `hotel-mobile-app\src\api\client.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR_IP_ADDRESS:3000/api/v1'  // Replace with your IP
  : 'https://api.yourhotel.com/api/v1';
```

Example:
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api/v1'
  : 'https://api.yourhotel.com/api/v1';
```

**Option B: Testing on iOS Simulator**

```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.yourhotel.com/api/v1';
```

**Option C: Testing on Android Emulator**

```typescript
const API_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api/v1'
  : 'https://api.yourhotel.com/api/v1';
```

### 3. Install Dependencies

```powershell
cd C:\Users\PC\Desktop\SmartDoorLock\hotel-mobile-app

# Install dependencies (first time only)
npm install
```

### 4. Start Expo Development Server

```powershell
npx expo start
```

**Expected output:**
```
Metro waiting on exp://192.168.1.100:8081
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```

### 5. Open App on Device

**On Real Device:**
1. Open Expo Go app
2. Scan QR code shown in terminal
3. Wait for app to load

**On iOS Simulator:**
1. Press `i` in terminal
2. Wait for simulator to open

**On Android Emulator:**
1. Press `a` in terminal
2. Wait for emulator to open

## Testing the Integration (10 minutes)

### Test 1: Basic Login ✅

1. **In mobile app:**
   - Email: `admin@hotel.com`
   - Password: `admin123`
   - Tap "Login"

2. **Expected:**
   - Login successful
   - Navigate to main screen
   - User info displayed

3. **Verify in terminal:**
   - Shake device → "Debug" → Chrome opens
   - Console should show: "Login successful"

### Test 2: API Calls Work ✅

1. **In mobile app:**
   - Navigate to "Rooms" (or any screen that fetches data)
   
2. **Expected:**
   - Rooms list displayed
   - No errors

3. **Verify in backend terminal:**
   ```
   GET /api/v1/rooms → 200 OK
   User: admin@hotel.com
   ```

### Test 3: Automatic Token Refresh ✅

**Quick Test (2 minutes):**

1. **Edit backend token expiry:**
   ```powershell
   # Edit: backend\src\utils\jwt.ts
   # Line ~20: Change expiresIn: '15m' to '10s'
   ```

2. **Restart backend:**
   ```powershell
   # Ctrl+C to stop
   npm run dev
   ```

3. **In mobile app:**
   - Login again with fresh credentials
   - Wait 11 seconds
   - Navigate to "Rooms" or any screen

4. **Expected:**
   - Rooms load successfully
   - No "Unauthorized" error shown
   - User stays logged in

5. **Verify in backend terminal:**
   ```
   GET /api/v1/rooms → 401 Unauthorized
   POST /api/v1/auth/refresh → 200 OK
   Token refreshed for user: admin@hotel.com
   GET /api/v1/rooms → 200 OK
   ```

6. **Verify in app console (Chrome DevTools):**
   ```
   Request failed with 401, attempting to refresh token
   Token refreshed successfully
   Retrying request with new token
   ```

✅ **Success!** Token automatically refreshed without user noticing

### Test 4: Logout Works ✅

1. **In mobile app:**
   - Navigate to Profile/Settings
   - Tap "Logout"

2. **Expected:**
   - Redirected to login screen
   - All data cleared

3. **Verify in backend terminal:**
   ```
   POST /api/v1/auth/logout → 200 OK
   Refresh token revoked for user: admin@hotel.com
   ```

## Common Issues & Solutions

### ❌ "Network request failed"

**Problem:** Mobile app can't reach backend

**Solutions:**
1. Check backend is running (`npm run dev`)
2. Check IP address is correct
3. Check firewall allows port 3000
4. Try `http://` not `https://` for local testing
5. Make sure both devices on same WiFi network

**Test backend access:**
```powershell
# On your computer
curl http://YOUR_IP:3000/api/v1/auth/health

# Should return: 200 OK
```

### ❌ "Invalid credentials" or "User not found"

**Problem:** Database not seeded

**Solution:**
```powershell
cd backend

# Re-seed database
npm run seed

# OR restart server (auto-seeds on startup)
npm run dev
```

### ❌ Token refresh not triggering

**Problem:** Access token hasn't expired yet

**Solution:**
1. Set token expiry to 10 seconds (backend/src/utils/jwt.ts)
2. Restart backend
3. Login again
4. Wait 11+ seconds

### ❌ App won't connect to backend on real device

**Problem:** Firewall blocking connections

**Solution:**
```powershell
# Windows Firewall - Allow Node.js
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=3000

# OR manually open Windows Defender Firewall
# Allow an app → Browse → Select node.exe → Allow Private networks
```

### ❌ Expo won't start

**Problem:** Port conflict or cache issues

**Solution:**
```powershell
# Clear Expo cache
npx expo start -c

# OR use different port
npx expo start --port 8082
```

## Test Accounts

All passwords are the same as the role name + "123":

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@hotel.com | admin123 | Admin | All access |
| manager@hotel.com | staff123 | Manager | Manage rooms, reservations, staff |
| frontdesk@hotel.com | staff123 | Front Desk | Check-in, reservations, view rooms |
| housekeeping@hotel.com | staff123 | Housekeeping | Update room status |

## Verify Everything is Working

Run through this checklist:

- [ ] Backend server running on port 3000
- [ ] MongoDB connected and seeded
- [ ] Mobile app connects to backend
- [ ] Can login with admin@hotel.com
- [ ] Can view rooms list
- [ ] Can view reservations
- [ ] Token auto-refresh works (after waiting or with 10s expiry)
- [ ] Logout works and revokes token
- [ ] Can login again after logout

If all checked, integration is working! 🎉

## What's Happening Behind the Scenes?

### On Login:
```
Mobile App → POST /api/v1/auth/login
Backend → Generates 15min accessToken + 7day refreshToken
Backend → Stores refreshToken in MongoDB
Mobile App → Stores both tokens in AsyncStorage
```

### On API Call:
```
Mobile App → GET /api/v1/rooms with Bearer accessToken
Backend → Validates accessToken
Backend → Returns rooms data
```

### When Access Token Expires:
```
Mobile App → GET /api/v1/rooms with expired accessToken
Backend → 401 Unauthorized

(Automatic refresh kicks in)
Mobile App → POST /api/v1/auth/refresh with refreshToken
Backend → Validates refreshToken from MongoDB
Backend → Generates NEW accessToken + refreshToken
Backend → Revokes OLD refreshToken
Backend → Returns new tokens

Mobile App → Stores new tokens
Mobile App → Retries GET /api/v1/rooms with NEW accessToken
Backend → 200 OK with rooms data
```

**User sees:** Seamless experience, no interruption!

## Next Steps

Once basic testing works:

1. **Read Full Docs:**
   - [`JWT_REFRESH_INTEGRATION.md`](./JWT_REFRESH_INTEGRATION.md)
   - [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)

2. **Run Complete Test Suite:**
   - Test all 11 test cases in TESTING_GUIDE.md
   - Verify all scenarios work

3. **Production Preparation:**
   - Change token expiry back to 15m
   - Update API_URL to production server
   - Add error tracking (Sentry)
   - Test on real devices

4. **TTLock Integration (Future):**
   - Fix Android native build issues
   - Integrate with room assignments
   - Test with real smart locks

## Getting Help

If you encounter issues:

1. **Check terminal logs:**
   - Backend terminal shows all API requests
   - Expo terminal shows Metro bundler logs

2. **Check browser console:**
   - Shake device → "Debug"
   - Chrome DevTools → Console tab
   - Look for error messages

3. **Check network traffic:**
   - Chrome DevTools → Network tab
   - See all API requests/responses
   - Check Authorization headers

4. **Check database:**
   ```powershell
   mongosh
   use hotel_management
   db.refreshtokens.find().pretty()
   db.users.find().pretty()
   ```

## Summary

You've successfully integrated JWT refresh token authentication with automatic token refresh! The mobile app now:

✅ Logs in with email/password  
✅ Stores access token (15 min) + refresh token (7 days)  
✅ Makes API calls with access token  
✅ **Automatically refreshes expired tokens**  
✅ Queues concurrent requests during refresh  
✅ Rotates refresh tokens for security  
✅ Revokes tokens on logout  
✅ Provides seamless user experience  

Users can now stay logged in for 7 days without interruption! 🎉
