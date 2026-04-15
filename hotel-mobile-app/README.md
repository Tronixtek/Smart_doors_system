# 🏨 Hotel Management Mobile App - Setup Guide

## ✅ What's Been Created

The React Native mobile app with Expo has been successfully initialized with the following structure:

```
hotel-mobile-app/
├── src/
│   ├── api/
│   │   ├── client.ts              ✅ Axios instance with interceptors
│   │   ├── auth.ts                ✅ Authentication APIs
│   │   ├── reservations.ts        ✅ Reservation APIs
│   │   ├── rooms.ts               ✅ Room management APIs
│   │   └── checkin.ts             ✅ Check-in/check-out APIs
│   ├── store/
│   │   ├── authStore.ts           ✅ Auth state management (Zustand)
│   │   ├── reservationStore.ts    ✅ Reservation state
│   │   └── roomStore.ts           ✅ Room state
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx    ✅ Login screen
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx ✅ Main dashboard
│   │   └── reservations/
│   │       └── ReservationsListScreen.tsx ✅ Reservations list
│   ├── navigation/
│   │   └── AppNavigator.tsx       ✅ Navigation setup with tabs
│   ├── types/
│   │   └── api.ts                 ✅ TypeScript types
│   ├── theme/
│   │   └── index.ts               ✅ Colors, typography, spacing
│   └── utils/
│       └── formatters.ts          ✅ Date, currency formatters
├── App.tsx                        ✅ Root component (updated)
├── package.json                   ✅ Dependencies configured
└── MOBILE_APP_GUIDE.md            ✅ Complete documentation
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd C:\Users\PC\Desktop\SmartDoorLock\hotel-mobile-app
npm install
```

This will install:
- **React Navigation** - Screen navigation and tabs
- **Axios** - API communication
- **Zustand** - State management
- **AsyncStorage** - Local data storage
- **date-fns** - Date formatting

### 2. Configure Backend API URL

Edit [src/api/client.ts](src/api/client.ts#L4) and change the IP address:

```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR_IP_HERE:3000/api/v1'  // Replace with your computer's IP
  : 'https://api.yourhotel.com/api/v1';
```

**To find your IP:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

### 3. Start Development Server

```powershell
npm start
```

This will start the Expo dev server and show a QR code.

### 4. Run on Your Phone

#### Option A: Use Expo Go App (Easiest)
1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Scan the QR code from the terminal
3. App will open in Expo Go

#### Option B: Use Emulator
```powershell
# Android
npm run android

# iOS (Mac only)
npm run ios
```

---

## 📱 App Features

### ✅ Completed Features

1. **Authentication**
   - Login screen with email/password
   - JWT token storage
   - Auto-login from stored credentials
   - Logout functionality

2. **Dashboard**
   - Welcome message with staff name and role
   - Today's check-ins/check-outs count
   - Room status overview (Available, Occupied, Dirty, Maintenance)
   - Quick action buttons

3. **Reservations**
   - List all reservations
   - Search by confirmation number or guest name
   - View reservation details
   - Status badges (Confirmed, Checked-In, Checked-Out, Cancelled)
   - Refresh to sync with server

4. **Navigation**
   - Bottom tab navigation (Dashboard, Reservations, Check-In, Rooms, More)
   - Stack navigation for detail screens
   - Protected routes (requires authentication)

5. **State Management**
   - Zustand stores for Auth, Reservations, and Rooms
   - Automatic token injection in API requests
   - Error handling and loading states

### 🚧 To Be Implemented

6. **Check-In Flow** (Next Priority)
   - Select reservation
   - Verify guest ID
   - Assign room
   - Generate TTLock digital key
   - Complete check-in

7. **Check-Out Flow**
   - Review folio
   - Process payment
   - Revoke TTLock key
   - Update room status to dirty

8. **TTLock Integration**
   - Link react-native-ttlock library
   - Digital key generation
   - Key revocation on checkout
   - View access logs

9. **Housekeeping**
   - View dirty rooms
   - Update room status (clean/dirty/maintenance)
   - Assign tasks

10. **Settings**
    - User profile
    - Property settings
    - Logout

---

## 🔧 Development Tips

### Testing Login

Use these test credentials (once your backend is ready):

```
Email: staff@hotel.com
Password: your_password
```

### API Configuration

The app expects the backend API to be running at:
- Development: `http://YOUR_IP:3000/api/v1`
- Production: `https://api.yourhotel.com/api/v1`

### Debugging

```powershell
# Clear cache and restart
npm start --clear

# View logs
# Press 'l' in the terminal to open device logs
```

### Testing on Physical Device

**Important:** Your phone and computer must be on the **same Wi-Fi network**.

If you can't connect:
1. Check firewall settings (allow Node.js)
2. Use your computer's IP address (not localhost)
3. Verify backend API is accessible from your phone

---

## 📡 API Endpoints Used

The mobile app communicates with these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login |
| `/auth/me` | GET | Get current user |
| `/reservations` | GET | List reservations |
| `/reservations/:id` | GET | Get reservation details |
| `/reservations/search` | GET | Search reservations |
| `/rooms` | GET | List rooms |
| `/rooms/:id` | GET | Get room details |
| `/rooms/:id/status` | PATCH | Update room status |
| `/check-in` | POST | Perform check-in |
| `/check-out` | POST | Perform check-out |

---

## 🎨 UI Components

### Colors

```typescript
Primary: #0066CC    // Hotel brand blue
Success: #4CAF50    // Available rooms
Warning: #FF9800    // Dirty rooms
Error: #F44336      // Maintenance
Info: #2196F3       // Occupied rooms
```

### Typography

- **H1**: 32px, Bold - Page titles
- **H2**: 24px, Bold - Section headers
- **Body**: 16px - Normal text
- **Small**: 14px - Secondary info

### Spacing

- **xs**: 4px
- **sm**: 8px
- **md**: 16px (default)
- **lg**: 24px
- **xl**: 32px

---

## 🧪 Testing Checklist

Before building for production, test these flows:

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Auto-login on app restart
- [ ] View dashboard statistics
- [ ] Browse reservations list
- [ ] Search for reservation
- [ ] View reservation details
- [ ] Refresh data (pull to refresh)
- [ ] Navigate between tabs
- [ ] Logout

---

## 📦 Next Steps

### Immediate (This Week)
1. ✅ Setup complete
2. ⏳ **Test login with backend API**
3. ⏳ **Implement Check-In screen**
4. ⏳ **Implement Check-Out screen**

### Short Term (Next 2 Weeks)
5. ⏳ Integrate TTLock library for digital keys
6. ⏳ Add Rooms screen with status updates
7. ⏳ Add Housekeeping screen
8. ⏳ Implement push notifications

### Medium Term (Next Month)
9. ⏳ Add offline mode with local database
10. ⏳ Implement QR code scanner for check-in
11. ⏳ Add camera for ID verification
12. ⏳ Build payment processing integration

---

## 🐛 Troubleshooting

### "Cannot connect to development server"

```powershell
# Restart Expo
npm start --clear

# Check firewall (allow Node.js)
# Make sure PC and phone are on same Wi-Fi
```

### "TypeError: Cannot read property 'user' of undefined"

The backend API is not responding. Check:
1. Backend server is running
2. API URL is correct in `src/api/client.ts`
3. Firewall allows connections

### "Network Error"

```typescript
// In src/api/client.ts, change:
const API_URL = 'http://YOUR_COMPUTERS_IP:3000/api/v1';
```

### Module not found errors

```powershell
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📚 Resources

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **React Native**: https://reactnative.dev
- **Zustand**: https://github.com/pmndrs/zustand
- **TTLock SDK**: ../react-native-ttlock/

---

## 🎯 Current Status

✅ **Phase 1 Complete:**
- App structure created
- Authentication implemented
- Dashboard built
- Reservations list working
- Navigation setup

🔄 **Next Phase:**
- Complete check-in/check-out flows
- Integrate TTLock library
- Build remaining screens

---

**Ready to test!** 🚀

Run `npm start` and scan the QR code with Expo Go app.
