# Hotel Management Mobile App

## 📱 Overview

Enterprise-grade mobile application for hotel staff to manage operations including:
- Front desk check-in/check-out
- Reservation management
- Room status tracking
- TTLock digital key generation
- Housekeeping coordination
- Guest services

**Target Users:** Hotel staff (Front Desk, Housekeeping, Management)

---

## 🛠 Tech Stack

- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (54.x) - Development platform and tooling
- **TypeScript** - Type safety
- **React Navigation** - Screen navigation
- **Axios** - API communication
- **Zustand** - State management
- **react-native-ttlock** - TTLock SDK integration for access control
- **React Native Paper** - Material Design UI components

---

## 📁 Project Structure

```
hotel-mobile-app/
├── App.tsx                 # Root component
├── index.ts                # Entry point
├── app.json                # Expo config
├── package.json
├── tsconfig.json
│
├── src/
│   ├── api/                # API clients
│   │   ├── client.ts       # Axios instance
│   │   ├── auth.ts         # Authentication APIs
│   │   ├── reservations.ts # Reservation APIs
│   │   ├── rooms.ts        # Room management APIs
│   │   └── ttlock.ts       # TTLock integration
│   │
│   ├── components/         # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── room/
│   │   │   ├── RoomCard.tsx
│   │   │   └── RoomStatusBadge.tsx
│   │   └── reservation/
│   │       ├── ReservationCard.tsx
│   │       └── GuestInfo.tsx
│   │
│   ├── screens/            # App screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SplashScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── reservations/
│   │   │   ├── ReservationsListScreen.tsx
│   │   │   ├── ReservationDetailScreen.tsx
│   │   │   └── CreateReservationScreen.tsx
│   │   ├── checkin/
│   │   │   ├── CheckInScreen.tsx
│   │   │   └── CheckOutScreen.tsx
│   │   ├── rooms/
│   │   │   ├── RoomsListScreen.tsx
│   │   │   └── RoomDetailScreen.tsx
│   │   ├── housekeeping/
│   │   │   └── HousekeepingScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   │
│   ├── navigation/         # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   │
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts
│   │   ├── reservationStore.ts
│   │   └── roomStore.ts
│   │
│   ├── types/              # TypeScript types
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── navigation.ts
│   │
│   ├── utils/              # Utilities
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── theme/              # Styling
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
│
├── assets/                 # Images, fonts, etc.
│   ├── images/
│   └── fonts/
│
└── __tests__/              # Tests
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)
- Android Studio or Xcode (for emulators)

### Installation

```bash
# Navigate to mobile app
cd hotel-mobile-app

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Setup

Create `.env` file:

```env
API_URL=http://localhost:3000/api/v1
# For physical device testing, use your computer's IP:
# API_URL=http://192.168.1.100:3000/api/v1

TTLOCK_CLIENT_ID=your_client_id
TTLOCK_CLIENT_SECRET=your_client_secret
```

---

## 📱 Core Features

### 1. Authentication

- **Login**: Staff login with email/password
- **JWT Token Management**: Secure authentication
- **Role-Based Access**: Different permissions for different roles

### 2. Dashboard

- **Today's Arrivals**: Upcoming check-ins
- **Today's Departures**: Scheduled check-outs
- **Room Status Overview**: Available, occupied, maintenance
- **Quick Actions**: Fast access to common tasks

### 3. Reservations

- **List View**: All reservations with filters
- **Search**: By guest name, confirmation number
- **Create/Edit**: Modify reservation details
- **Status Management**: Confirmed, checked-in, checked-out

### 4. Check-In/Check-Out

- **Check-In Flow**:
  1. Verify guest identity
  2. Assign room
  3. Generate TTLock digital key
  4. Send key to guest via app/card
  
- **Check-Out Flow**:
  1. Review folio
  2. Process payment
  3. Revoke digital key
  4. Update room status to "dirty"

### 5. Room Management

- **Room Status**: Available, Occupied, Dirty, Maintenance
- **Housekeeping Assignment**: Assign rooms to staff
- **Maintenance Tracking**: Report and track issues

### 6. TTLock Integration

- **Digital Key Generation**: Create time-limited access codes
- **Remote Lock Control**: Lock/unlock doors remotely
- **Access Logs**: Track room entry/exit
- **Key Revocation**: Disable keys on checkout

---

## 🔐 Security

- JWT token storage in secure storage
- API requests authenticated with bearer tokens
- HTTPS for production API calls
- Sensitive data encrypted locally

---

## 🎨 UI/UX Guidelines

### Design Principles

1. **Mobile-First**: Optimized for small screens
2. **Touch-Friendly**: Large tap targets (minimum 44x44 pt)
3. **Fast**: Quick load times, optimistic updates
4. **Offline-Capable**: Cache data for offline viewing
5. **Accessible**: Screen reader support, high contrast

### Color Scheme

- **Primary**: Blue (#0066CC) - Hotel brand color
- **Success**: Green (#4CAF50) - Available rooms
- **Warning**: Orange (#FF9800) - Dirty rooms
- **Danger**: Red (#F44336) - Maintenance
- **Info**: Light Blue (#2196F3) - Occupied rooms

---

## 📊 State Management

### Zustand Stores

**Auth Store:**
```typescript
{
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
}
```

**Reservation Store:**
```typescript
{
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  fetchReservations: () => Promise<void>;
  createReservation: (data) => Promise<void>;
  updateReservation: (id, data) => Promise<void>;
}
```

**Room Store:**
```typescript
{
  rooms: Room[];
  fetchRooms: () => Promise<void>;
  updateRoomStatus: (id, status) => Promise<void>;
}
```

---

## 🔌 API Integration

### Base Configuration

```typescript
// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: process.env.API_URL,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Logout and redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🏨 TTLock Integration

### Setup

```bash
# Link the TTLock library
cd hotel-mobile-app
npm link ../react-native-ttlock
```

### Usage Example

```typescript
// src/services/ttlockService.ts
import { TtLock } from 'react-native-ttlock';

export const generateDigitalKey = async (
  lockId: string,
  guestName: string,
  checkInDate: Date,
  checkOutDate: Date
) => {
  try {
    const keyData = await TtLock.createCustomPasscode({
      lockId,
      passcode: generateRandomCode(),
      startDate: checkInDate.getTime(),
      endDate: checkOutDate.getTime(),
    });
    
    return keyData;
  } catch (error) {
    console.error('Failed to generate key:', error);
    throw error;
  }
};

export const revokeKey = async (lockId: string, passcodeId: string) => {
  try {
    await TtLock.deletePasscode(lockId, passcodeId);
  } catch (error) {
    console.error('Failed to revoke key:', error);
    throw error;
  }
};
```

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo-status-bar": "~3.0.9",
    
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    
    "react-native-paper": "^5.12.0",
    "react-native-vector-icons": "^10.0.0",
    
    "axios": "^1.6.0",
    "zustand": "^5.0.0",
    
    "@react-native-async-storage/async-storage": "^2.0.0",
    "react-native-dotenv": "^3.4.0",
    
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0"
  }
}
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 🚢 Deployment

### Build for Production

**Android:**
```bash
# Build APK
eas build --platform android --profile production

# Build AAB for Google Play
eas build --platform android --profile production --type app-bundle
```

**iOS:**
```bash
# Build IPA
eas build --platform ios --profile production
```

### Environment Configs

**development.env:**
```env
API_URL=http://192.168.1.100:3000/api/v1
```

**production.env:**
```env
API_URL=https://api.yourhotel.com/api/v1
```

---

## 📝 Development Workflow

1. **Pull latest code**: `git pull origin main`
2. **Install dependencies**: `npm install`
3. **Start dev server**: `npm start`
4. **Test on device**: Scan QR code with Expo Go
5. **Make changes**: Edit code, hot reload automatically
6. **Test features**: Verify functionality
7. **Commit**: `git commit -m "Add feature"`
8. **Push**: `git push origin feature-branch`

---

## 🐛 Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
npx expo start --clear
```

**Module not found:**
```bash
rm -rf node_modules
npm install
```

**Android build fails:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS build fails:**
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## 📞 Support

- **Technical Issues**: Check Expo docs or Stack Overflow
- **TTLock Integration**: Refer to TTLock API documentation
- **Backend API**: Contact backend team

---

## 🎯 Next Steps

1. ✅ **Project setup complete**
2. 🔄 **Install navigation and UI libraries**
3. 🔄 **Create authentication screens**
4. 🔄 **Build dashboard**
5. 🔄 **Implement reservation management**
6. 🔄 **Integrate TTLock SDK**
7. 🔄 **Add housekeeping features**
8. 🔄 **Testing and refinement**

---

**Ready to build an enterprise-grade hotel management mobile app!** 🚀
