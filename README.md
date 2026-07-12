# Mako Access

Mako Access is a multi-tenant Access Control as a Service (ACaaS) platform built on TTLock smart locks.

## What This Project Includes

- `mako-access-backend` - Express + TypeScript + MongoDB API (multi-tenant: Organization, AccessPoint, Lock, LockKey, AccessLog)
- `mako-access-mobile` - Expo/React Native app (org setup, lock registration, access points)
- `mako-access-landing` - React marketing landing page (Tailwind, framer-motion)
- `react-native-ttlock` - local TTLock native bridge package, shared by `mako-access-mobile`
- `Mako_project` - marketing assets (Firebase-hosted static site, product images/video)

## Quick Start

### 1. Start the backend

```bash
cd mako-access-backend
npm install
npm run dev
```

### 2. Run the mobile app

```bash
cd mako-access-mobile
npm install
npm start
```

### 3. Run the landing page

```bash
cd mako-access-landing
npm install
npm start
```

## Note

The previous Hotel/Office product (`backend`, `hotel-mobile-app`, `mako-sec-web`) and its documentation have been archived to `../SmartDoorLock_Archive/` and are no longer part of this repository.
