# TTLock Integration Guide

## Overview

The hotel management app is now integrated with the **TTLock SDK** for smart lock management. This guide explains how to use the TTLock features for managing hotel room locks.

## 🔐 What is TTLock?

TTLock is a smart lock system that allows you to:
- Control door locks via Bluetooth
- Create temporary digital keys (passcodes) for guests
- Remotely unlock/lock doors
- Monitor battery levels
- Manage lock access

## 📱 Features Implemented

### 1. Lock Scanning
- Scan for nearby TTLock devices via Bluetooth
- View lock status, battery level, and signal strength
- Identify initialized vs uninitialized locks

### 2. Lock Initialization
- Initialize new locks (one-time setup)
- Store `lockData` for each lock (required for all operations)
- Associate locks with hotel rooms

### 3. Digital Key Generation
- Create temporary 6-digit passcodes for guests
- Set validity period (check-in to check-out dates)
- Guest uses passcode to unlock door

### 4. Lock Control
- Unlock doors remotely via Bluetooth
- Lock doors remotely
- Check lock state (locked/unlocked)

### 5. Key Revocation
- Delete passcodes after guest check-out
- Automatic expiration based on time period

## 🚀 How to Use TTLock Features

### Step 1: Access Lock Management

1. Open the app and login
2. Go to **More** tab (bottom navigation)
3. Tap **"🔐 TTLock Management"**

### Step 2: Scan for Locks

1. In Lock Management screen, tap **"🔍 Start Scanning"**
2. Wait for nearby TTLock devices to appear (up to 30 seconds)
3. View discovered locks with their details:
   - Lock name
   - MAC address
   - Battery level
   - Signal strength (RSSI)
   - Initialization status

### Step 3: Initialize New Locks

**Important:** Locks must be initialized before use!

1. Find an **"⚠ Not Initialized"** lock in the scan results
2. Tap **"Initialize Lock"** button
3. Wait for initialization to complete
4. Save the `lockData` (see Backend Integration below)
5. Status changes to **"✓ Initialized"**

### Step 4: Test Lock Operations

Once initialized, you can:

#### Unlock Door
- Tap **"🔓 Unlock"** button
- Door unlocks via Bluetooth

#### Lock Door
- Tap **"🔒 Lock"** button
- Door locks via Bluetooth

#### Create Digital Key
- Tap **"🔑 Create Key"** button
- A 6-digit passcode is generated
- Valid for 24 hours (for testing)
- Guest can use this code to unlock the door

### Step 5: Guest Check-In Flow

When checking in a guest:

1. Go to **Check-In** screen
2. Select reservation
3. Select room (room must have associated lockData)
4. Enable **"Generate Digital Key"** checkbox
5. Complete check-in
6. System generates passcode valid from check-in to check-out date
7. Display/send passcode to guest

### Step 6: Guest Check-Out Flow

When checking out a guest:

1. Go to **Check-Out** screen
2. Select reservation
3. Enable **"Revoke Digital Key"** checkbox
4. Complete check-out
5. System deletes the passcode from lock

## 🔧 Technical Implementation

### TTLock Service Methods

Located at: `src/services/ttlockService.ts`

```typescript
// Scan for locks
const stopScan = ttlockService.scanLocks((lock) => {
  console.log('Found lock:', lock);
});

// Initialize lock (one-time, returns lockData)
const lockData = await ttlockService.initLock(lockMac, lockVersion);

// Store lockData for future use
ttlockService.setLockData(roomId, lockData);

// Create passcode for guest
const keyData = await ttlockService.generateDigitalKey({
  lockId: roomLockMac,
  lockName: 'Room 101',
  guestName: 'John Doe',
  checkInDate: new Date(),
  checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  roomNumber: '101'
});
// Returns: { keyId, lockId, keyCode: '123456', startDate, endDate, keyType }

// Delete passcode
await ttlockService.revokeDigitalKey({
  keyId: key.keyId,
  lockId: roomLockMac,
  keyCode: '123456'
});

// Unlock door
await ttlockService.unlockDoor(roomLockMac);

// Lock door
await ttlockService.lockDoor(roomLockMac);

// Get lock state
const state = await ttlockService.getLockState(roomLockMac);
// Returns: 0=locked, 1=unlocked, 2=unknown
```

### Lock Data Storage

**Critical:** You must store `lockData` in your backend database!

When you initialize a lock, you receive a `lockData` string. This is required for ALL future operations with that lock.

**Recommended Backend Schema:**
```typescript
// Add to Room model
interface Room {
  id: string;
  roomNumber: string;
  lockMac: string;        // MAC address of physical lock
  lockData: string;       // Encrypted lock data from TTLock
  lockVersion: string;    // Lock version info (JSON string)
  lockInitialized: boolean;
  lockLastSync: Date;
  // ... other room fields
}

// Digital keys tracking
interface DigitalKey {
  id: string;
  reservationId: string;
  roomId: string;
  lockMac: string;
  keyCode: string;        // 6-digit passcode
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  revokedAt: Date | null;
}
```

### Backend API Extensions Needed

Add these endpoints to support TTLock:

```typescript
// POST /api/v1/rooms/:roomId/init-lock
// Initialize lock and save lockData
{
  lockMac: string,
  lockVersion: string,
  lockData: string
}

// GET /api/v1/rooms/:roomId/lock-data
// Retrieve lockData for mobile app
Response: { lockData: string }

// POST /api/v1/reservations/:id/digital-key
// Save generated digital key
{
  keyCode: string,
  startDate: Date,
  endDate: Date
}

// DELETE /api/v1/reservations/:id/digital-key
// Mark key as revoked
```

### Updating Check-In/Check-Out

Before check-in operations:
```typescript
// Load lockData from backend
const room = await roomsAPI.getRoom(roomId);
ttlockService.setLockData(room.lockMac, room.lockData);

// Then generate key
const keyData = await ttlockService.generateDigitalKey({...});

// Save to backend
await checkInAPI.saveDigitalKey(reservationId, keyData);
```

## 📋 Important Notes

### Bluetooth Requirements
- **Bluetooth must be enabled** on mobile device
- **Physical proximity required** - device must be within ~10 meters of lock
- Concrete walls/metal doors may reduce range

### Lock Battery
- Battery level shown in scan results
- Low battery (<20%) should trigger maintenance alert
- Replace batteries before they die (guest lockout risk)

### Security Considerations
- `lockData` contains sensitive encryption keys - store securely in backend
- Use HTTPS for all API calls
- Never expose lockData in client-side logs
- Passcodes are 6 random digits - reasonably secure for short stays
- Automatically revoke keys after checkout
- Set reasonable validity periods (check-in to check-out + 1 hour grace)

### Troubleshooting

**"Lock not found during scan"**
- Ensure lock is powered on and has batteries
- Check Bluetooth is enabled on phone
- Move closer to lock
- Remove and reinstall lock batteries

**"Initialization failed"**
- Lock may already be initialized by another device
- Try factory reset on lock (check TTLock manual)
- Ensure lock firmware is up to date

**"Unable to unlock door"**
- Check Bluetooth is still enabled
- Ensure you're within range
- Verify lockData is correct for this lock
- Try re-scanning and reconnecting

**"Passcode doesn't work"**
- Check passcode was created successfully
- Verify dates are correct (not expired)
- Guest must enter code on lock keypad
- Some locks require pressing "#" after code

## 🔄 Switching Between Mock and Real TTLock

The app now supports **easy switching** between mock (testing) and real (production) TTLock implementations!

### Configuration

Edit [`src/config.ts`](hotel-mobile-app/src/config.ts):

```typescript
export const config = {
  useMockTTLock: true,  // true = Mock, false = Real TTLock SDK
  // ...
};
```

### Mock Mode (Development)
**When:** Testing without hardware, UI development, demo purposes

**Features:**
- Simulates all TTLock operations
- Returns fake locks (Room 101, Room 102)
- Generates random 6-digit passcodes
- All operations return success
- No Bluetooth required
- Works with Expo Go

**How to Enable:**
```typescript
// src/config.ts
useMockTTLock: true
```

Then just run:
```bash
cd hotel-mobile-app
npm start
```

### Real Mode (Production)
**When:** Using actual TTLock hardware

**Requirements:**
- Physical TTLock devices
- Bluetooth enabled
- Development build (native modules)

**How to Enable:**

1. Update config:
```typescript
// src/config.ts
useMockTTLock: false
```

2. Build development version:
```bash
cd hotel-mobile-app
npx expo prebuild
npx expo run:android
```

**Import Structure:**
```typescript
// src/services/index.ts - Auto-selects implementation
import ttlockService from '../services';  // ← Use this everywhere

// Under the hood:
// If useMockTTLock === true  → ttlockService.mock.ts
// If useMockTTLock === false → ttlockService.ts (real SDK)
```

### API Differences

**Mock Implementation:**
- Promise-based API
- Instant responses
- No Bluetooth required
- Always succeeds

**Real Implementation:**
- Callback-based (wrapped in Promises)
- Requires Bluetooth connection
- Can fail (out of range, low battery, etc.)
- Requires `lockData` from initialization

### Testing Both Implementations

**Test your code with mock first:**
```typescript
// 1. Set useMockTTLock: true
// 2. npm start
// 3. Test all UI flows
// 4. Verify logic works
```

**Then test with real hardware:**
```typescript
// 1. Set useMockTTLock: false
// 2. npx expo run:android
// 3. Test with physical locks
// 4. Handle real errors (range, battery, etc.)
```

## 📚 Additional Resources

- [TTLock Official Documentation](https://www.npmjs.com/package/react-native-ttlock)
- TTLock SDK GitHub: `react-native-ttlock` folder in project
- Example app: `react-native-ttlock/example/`

## 🎯 Next Steps

1. **Backend Integration**
   - Add lockData storage to Room model
   - Create API endpoints for lock management
   - Implement digital key tracking

2. **Lock Association**
   - Scan and initialize all hotel room locks
   - Associate each lock with room number in database
   - Store lockData securely

3. **Production Deployment**
   - Test with real TTLock hardware
   - Validate Bluetooth permissions on iOS/Android
   - Set up battery monitoring alerts
   - Create admin interface for lock management

4. **Guest App (Optional)**
   - Build separate guest app
   - Allow guests to use digital keys from their phone
   - Support Bluetooth unlock (no passcode needed)

## ✅ Testing Checklist

- [ ] Bluetooth enabled on device
- [ ] TTLock hardware available and powered
- [ ] Can scan and find locks
- [ ] Can initialize new lock
- [ ] lockData saved to backend
- [ ] Can unlock door via app
- [ ] Can lock door via app
- [ ] Can create passcode
- [ ] Guest can use passcode on lock keypad
- [ ] Passcode expires after period
- [ ] Can revoke passcode
- [ ] Battery level displayed correctly
- [ ] Works from ~5 meters away

---

**Ready to test?** Go to More → TTLock Management and start scanning!
