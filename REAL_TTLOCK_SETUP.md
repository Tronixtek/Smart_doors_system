# 🔐 Real TTLock Hardware Integration Guide

## Current Status
✅ **Configuration updated** - App is now set to use real TTLock SDK  
✅ **Native wrapper created** - TTLock native modules integrated  
✅ **Bluetooth permissions added** - Android permissions configured  

⚠️ **Next Step Required:** Create development build (native modules don't work with Expo Go)

---

## Prerequisites

Before proceeding, make sure you have:

- ✅ **Physical TTLock devices** (smart locks)
- ✅ **Android phone** with Bluetooth enabled
- ✅ **USB cable** to connect phone to computer
- ✅ **Android Studio** installed (optional, for debugging)
- ✅ **Phone in Developer Mode** with USB debugging enabled

---

## Step-by-Step Setup

### Step 1: Link TTLock Native Module

The TTLock SDK needs to be properly linked to your project.

```powershell
cd hotel-mobile-app

# Copy TTLock Android module
New-Item -ItemType Directory -Force -Path "android\app\src\main\java\com\ttlock"
Copy-Item -Path "..\react-native-ttlock\android\src\main\java\*" -Destination "android\app\src\main\java\" -Recurse -Force
```

### Step 2: Create Native Project Structure

Run Expo prebuild to generate native Android/iOS folders:

```powershell
cd hotel-mobile-app
npx expo prebuild
```

**Expected output:**
```
✔ Created native Android project
✔ Created native iOS project
```

This creates:
- `android/` folder with native Android code
- `ios/` folder with native iOS code (optional)

### Step 3: Install TTLock SDK

Add the react-native-ttlock package properly:

```powershell
# Still in hotel-mobile-app directory
npm install file:../react-native-ttlock --legacy-peer-deps
```

### Step 4: Update Android build.gradle

Add TTLock dependencies to Android project:

**File:** `hotel-mobile-app/android/app/build.gradle`

Add this inside `dependencies`:
```gradle
dependencies {
    // ... existing dependencies
    
    // TTLock SDK dependencies
    implementation 'com.ttlock:sdk:3.4.7'
    implementation 'no.nordicsemi.android:dfu:1.11.1'
}
```

### Step 5: Enable Developer Mode on Phone

On your Android phone:

1. Open **Settings** → **About phone**
2. Tap **Build number** 7 times
3. Go back to **Settings** → **Developer options**
4. Enable **USB debugging**
5. Connect phone via USB
6. Accept "Allow USB debugging?" prompt

### Step 6: Build and Install

**Option A: Direct Install (Recommended)**

```powershell
cd hotel-mobile-app
npx expo run:android
```

This will:
- Build the APK
- Install on connected phone
- Start the app automatically

**Option B: EAS Build (Cloud)**

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform android

# Download and install the APK when ready
```

### Step 7: Grant Bluetooth Permissions

When the app starts for the first time:

1. App will request **Location permission** → **Allow**
2. App may request **Bluetooth permission** → **Allow**

*(Location is required for Bluetooth scanning on Android)*

---

## Testing with Real Locks

Once the app is installed:

### 1. Prepare TTLock Device

- Install fresh batteries
- Follow TTLock manual to reset lock (if needed)
- Place lock within 5 meters of phone

### 2. Scan for Locks

1. Open app → Login
2. Go to **More** tab
3. Tap **"🔐 TTLock Management"**
4. Tap **"🔍 Start Scanning"**
5. Wait 10-30 seconds

**Expected result:**
- Real TTLock devices appear in the list
- Shows: Lock name, MAC address, battery %, signal strength

### 3. Initialize New Lock

1. Tap on a lock with **"⚠ Not Initialized"** status
2. Confirm initialization
3. Wait for process to complete (10-20 seconds)
4. Enter room number (e.g., "101")
5. Lock is now ready to use

**What happens:**
- App becomes admin of the lock
- Receives `lockData` (encryption keys)
- Can now create passcodes and control the lock

### 4. Test Unlock

1. In "Managed Locks" section
2. Tap **"🔓 Test"** on a lock
3. Phone connects via Bluetooth
4. Lock should unlock with a click sound

### 5. Create Guest Key (Passcode)

1. Go to **Check-In** tab
2. Select a reservation
3. Assign room with initialized lock
4. Enable **"Generate Digital Key"** checkbox
5. Complete check-in

**Result:**
- 6-digit passcode created on the lock
- Valid from check-in to check-out time
- Guest can enter code on lock keypad to unlock

---

## Troubleshooting

### ❌ "TTLock module not available"

**Problem:** Native module not linked

**Solutions:**
```powershell
# Rebuild the app
cd hotel-mobile-app
npx expo run:android
```

### ❌ "No locks found during scan"

**Problem:** Bluetooth or permissions issue

**Solutions:**
1. Check phone Bluetooth is ON
2. Grant Location permission (Settings → Apps → Hotel Management)
3. Move closer to lock (< 5 meters)
4. Replace lock batteries
5. Reset lock and try again

### ❌ "Initialization failed"

**Problem:** Lock already initialized by another device

**Solutions:**
1. Factory reset the lock (check TTLock manual)
2. Or use existing lockData if you have it

### ❌ "Connect timeout"

**Problem:** Out of range or interference

**Solutions:**
1. Move phone closer to lock
2. Remove interference (turn off other Bluetooth devices)
3. Try again

### ❌ Build errors

**Problem:** Dependencies or native module issues

**Solutions:**
```powershell
# Clean and rebuild
cd hotel-mobile-app\android
.\gradlew clean
cd ..
npx expo run:android
```

---

## Switching Back to Mock Mode

If you need to test without hardware:

**Edit:** `hotel-mobile-app/src/config.ts`

```typescript
export const config = {
  useMockTTLock: true,  // ← Change back to true
  // ...
};
```

Then restart the app.

---

## Production Checklist

Before deploying to staff:

- [ ] All room locks initialized and mapped
- [ ] lockData backed up securely
- [ ] Battery levels monitored
- [ ] Staff trained on initialization process
- [ ] Backup key generation procedure documented
- [ ] Emergency unlock procedure in place
- [ ] Lock firmware updated to latest version

---

## Next Steps After Successful Integration

1. **Map all rooms** - Initialize lock for each room
2. **Backend storage** - Save lockData to database
3. **Battery monitoring** - Alert when battery < 20%
4. **Audit logs** - Track all lock operations
5. **Guest app** (optional) - Let guests unlock via Bluetooth

---

## Quick Reference

| Action | Steps |
|--------|-------|
| Build app | ` npx expo run:android` |
| Scan locks | More → TTLock Management → Start Scanning |
| Initialize | Tap lock → Initialize → Enter room number |
| Test unlock | Managed Locks → Test button |
| Create key | Check-In → Enable "Generate Digital Key" |
| Check logs | Look for "🔐 Using Real TTLock SDK" in console |

---

## Support

If you encounter issues:

1. Check logs: `npx expo start` shows console output
2. Verify Bluetooth permissions in phone Settings
3. Try mock mode first to isolate hardware issues
4. Consult TTLock documentation: `react-native-ttlock/README.md`

---

**🎯 Ready to build?** Run:

```powershell
cd hotel-mobile-app
npx expo prebuild
npx expo run:android
```

Then test with your physical TTLock devices!
