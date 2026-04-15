# SmartDoor System

SmartDoor System is a multi-use-case smart access platform built around TTLock-enabled doors, a Node/Express backend, and a React Native mobile app.

Right now the project supports two application modes inside the same mobile app:

- `Hotel Mode` for reservations, check-in/check-out, room operations, and lock credential management
- `Office Mode` for spaces, people, visits, and office access workflows

The goal is to keep one shared smart-door platform while allowing the product experience to switch by business use case.

## What This Project Includes

- `backend` - Express + TypeScript + MongoDB API
- `hotel-mobile-app` - Expo/React Native Android app
- `react-native-ttlock` - local TTLock native bridge package
- `backups` - local safety backups for important working copies

## Core Features

- JWT-based authentication with refresh tokens
- Hotel dashboard and operational flows
- Office dashboard and parallel office access flows
- TTLock lock registration and management
- Passcode issuance and revocation
- IC card support in the mobile lock flow
- Shared lock and credential platform across use cases
- Mock TTLock support for development without hardware
- VPS-ready backend deployment support

## Product Modes

### Hotel Mode

- Dashboard
- Reservations
- Check-in / Check-out
- Rooms
- Housekeeping / Maintenance / Staff flows
- TTLock-based room access management

### Office Mode

- Office dashboard
- People directory
- Office spaces
- Visits
- Office-specific access workflows
- Shared TTLock platform under an office-facing app shell

## Tech Stack

### Mobile

- React Native
- Expo dev client
- TypeScript
- React Navigation
- Zustand
- Axios

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT authentication

### Lock Integration

- TTLock native module
- Mock TTLock implementation for development/testing

## Project Structure

```text
SmartDoorLock/
|-- backend/
|-- hotel-mobile-app/
|-- react-native-ttlock/
|-- backups/
|-- GETTING_STARTED.md
|-- LOCAL_SETUP_GUIDE.md
|-- HOTEL_SYSTEM_ARCHITECTURE.md
|-- OFFICE_PIVOT_PLAN.md
|-- TTLOCK_INTEGRATION.md
`-- README.md
```

## Quick Start

### 1. Start the backend

```powershell
cd backend
npm install
npm run dev
```

Backend default URL:

- `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`

Default seeded credentials:

- `admin@hotel.com`
- `admin123`

### 2. Configure the mobile app

Create `hotel-mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api/v1
```

If you are testing on a real Android phone over USB against your local backend, `adb reverse` is usually the simplest route:

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
```

### 3. Start the mobile app

```powershell
cd hotel-mobile-app
npm install
npx expo start --dev-client -c
```

### 4. Run on Android

For a dev build:

```powershell
cd hotel-mobile-app
npx expo run:android --device
```

For a release APK:

```powershell
cd hotel-mobile-app/android
$env:NODE_ENV='production'
.\gradlew.bat app:assembleRelease -x lint -x test --no-daemon --no-parallel --max-workers=1
```

APK output:

- `hotel-mobile-app/android/app/build/outputs/apk/release/app-release.apk`

## Switching Between Hotel And Office

Inside the app:

1. Open `More`
2. Tap `Switch Application Mode`
3. Choose `Hotel Mode` or `Office Mode`

The app shell, tabs, and use-case-specific screens change with the selected mode.

## TTLock Notes

- The mobile app uses a local `react-native-ttlock` package for native lock operations.
- A mock TTLock implementation also exists for development without physical hardware.
- Real lock flows are handled from the mobile side, while issued credentials are also stored in the backend.

Helpful docs in this repo:

- `TTLOCK_INTEGRATION.md`
- `REAL_TTLOCK_SETUP.md`
- `TTLOCK_SETUP_COMPLETE.md`

## Deployment

The backend has already been prepared for VPS deployment with:

- environment-based configuration
- CORS configuration
- `systemd` service support
- Nginx reverse-proxy support

Deployment references:

- `backend/DEPLOY_VPS.md`
- `backend/deploy/smartdoor-backend.service`
- `backend/deploy/nginx-smartdoor-api.conf`

For production mobile builds, set:

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.example/api/v1
```

## Helpful Repo Docs

- `GETTING_STARTED.md`
- `LOCAL_SETUP_GUIDE.md`
- `PROJECT_STRUCTURE.md`
- `HOTEL_SYSTEM_ARCHITECTURE.md`
- `OFFICE_PIVOT_PLAN.md`
- `MERN_IMPLEMENTATION_GUIDE.md`

## Current Status

This repository is currently a working private beta codebase with:

- hotel use case implemented
- office use case implemented as a parallel app mode
- TTLock integration in place
- backend ready for VPS deployment
- Android app buildable and installable for on-device testing

## License

No license has been added yet. Treat this repository as private/proprietary until a license is explicitly included.
