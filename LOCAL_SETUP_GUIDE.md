# Pure MERN Stack - Local Setup Guide (No Docker)

## 🎯 Goal: Get Development Environment Running Locally

**Stack:** MongoDB + Express.js + React + Node.js  
**No Docker Required:** Everything runs directly on your PC

---

## Prerequisites Installation

### 1. Install Node.js (v20 LTS)

**Windows:**
```powershell
# Download from https://nodejs.org
# Or use winget:
winget install OpenJS.NodeJS.LTS

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

### 2. Install MongoDB Community Server

**Windows:**
```powershell
# Option 1: Download installer from mongodb.com
# https://www.mongodb.com/try/download/community

# Option 2: Use winget
winget install MongoDB.Server

# Verify installation
mongod --version

# Start MongoDB service
net start MongoDB

# If service doesn't start automatically, run:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Create Data Directory:**
```powershell
# Create MongoDB data directory
New-Item -ItemType Directory -Force -Path C:\data\db
```

### 3. Install MongoDB Compass (GUI - Optional but Recommended)

```powershell
# Download from https://www.mongodb.com/products/compass
# Or use winget:
winget install MongoDB.Compass

# Connection string: mongodb://localhost:27017
```

### 4. Install Git

```powershell
winget install Git.Git

# Verify
git --version
```

### 5. Install VS Code (if not installed)

```powershell
winget install Microsoft.VisualStudioCode
```

---

## Project Initialization

### Create Project Structure

```powershell
# Navigate to your workspace
cd C:\Users\PC\Desktop\SmartDoorLock

# Create main project directory
New-Item -ItemType Directory -Force -Path hotel-management-system
cd hotel-management-system

# Create backend and frontend directories
New-Item -ItemType Directory -Force -Path backend, frontend
```

---

## Backend Setup (Express.js + MongoDB)

### Initialize Backend

```powershell
cd backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install express-validator cookie-parser helmet compression
npm install axios

# Install dev dependencies
npm install -D typescript @types/express @types/node @types/bcryptjs
npm install -D @types/jsonwebtoken @types/cors @types/cookie-parser
npm install -D nodemon ts-node eslint prettier

# Initialize TypeScript
npx tsc --init
```

### Backend Folder Structure

```powershell
# Create folder structure
New-Item -ItemType Directory -Force -Path src\config
New-Item -ItemType Directory -Force -Path src\models
New-Item -ItemType Directory -Force -Path src\routes
New-Item -ItemType Directory -Force -Path src\controllers
New-Item -ItemType Directory -Force -Path src\services
New-Item -ItemType Directory -Force -Path src\middleware
New-Item -ItemType Directory -Force -Path src\utils
New-Item -ItemType Directory -Force -Path src\types

# Create main files
New-Item -ItemType File -Path src\server.ts
New-Item -ItemType File -Path src\app.ts
New-Item -ItemType File -Path .env
New-Item -ItemType File -Path .env.example
New-Item -ItemType File -Path .gitignore
```

### Backend Files

#### `package.json` - Update scripts:

```json
{
  "name": "hotel-management-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "cookie-parser": "^1.4.6",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.16",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.3",
    "ts-node": "^10.9.2",
    "eslint": "^8.56.0",
    "prettier": "^3.2.5"
  }
}
```

#### `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hotel_management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-67890
JWT_REFRESH_EXPIRES_IN=7d

# TTLock API
TTLOCK_CLIENT_ID=your_ttlock_client_id
TTLOCK_CLIENT_SECRET=your_ttlock_client_secret
TTLOCK_API_URL=https://euapi.ttlock.com

# Email (for later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

#### `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
```

#### `.gitignore`:

```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
```

#### `src/config/database.ts`:

```typescript
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';
    
    await mongoose.connect(uri);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
```

#### `src/server.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing server...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

#### `src/app.ts`:

```typescript
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Performance middleware
app.use(compression());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes (we'll add these later)
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({ message: 'Hotel Management API v1' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
```

### Test Backend

```powershell
# Make sure MongoDB is running
# Check: MongoDB Compass can connect to mongodb://localhost:27017

# Install dependencies
npm install

# Start development server
npm run dev

# You should see:
# ✅ MongoDB Connected Successfully
# 🚀 Server running on port 3000
```

**Test in browser:** http://localhost:3000/health

---

## Frontend Setup (React + Vite)

### Initialize Frontend

```powershell
# Go back to project root
cd ..

# Create React app with Vite
npm create vite@latest frontend -- --template react-ts

cd frontend

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom axios
npm install antd @ant-design/icons
npm install zustand  # State management (simpler than Redux)

# Install dev dependencies
npm install -D @types/node
```

### Frontend Folder Structure

```
frontend/
├── public/
├── src/
│   ├── api/              # API calls
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   ├── layouts/          # Layout components
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── package.json
└── vite.config.ts
```

### Frontend Files

#### `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

#### `src/api/client.ts`:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Hotel Management System</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Test Frontend

```powershell
# Start development server
npm run dev

# You should see:
# VITE ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

**Open browser:** http://localhost:5173

---

## MongoDB Sample Data

### Create Sample Data Script

Create `backend/scripts/seed.ts`:

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management';
    await mongoose.connect(uri);
    
    console.log('Connected to MongoDB');
    
    // Clear existing data (optional)
    await mongoose.connection.db.dropDatabase();
    console.log('Database cleared');
    
    // Add sample data here (we'll create models first)
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
```

---

## Development Workflow

### Start Everything Locally

**Terminal 1 - MongoDB:**
```powershell
# Check if MongoDB service is running
net start MongoDB

# Or start manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Terminal 2 - Backend:**
```powershell
cd C:\Users\PC\Desktop\SmartDoorLock\hotel-management-system\backend
npm run dev
```

**Terminal 3 - Frontend:**
```powershell
cd C:\Users\PC\Desktop\SmartDoorLock\hotel-management-system\frontend
npm run dev
```

**MongoDB Compass:**
- Connection: `mongodb://localhost:27017`
- Database: `hotel_management`

---

## Next Steps

1. ✅ **MongoDB installed and running**
2. ✅ **Backend server running** (http://localhost:3000)
3. ✅ **Frontend running** (http://localhost:5173)
4. ✅ **Can connect to MongoDB Compass**

### What We'll Build Next:

1. **User model** (MongoDB schema with Mongoose)
2. **Authentication APIs** (register, login, JWT)
3. **Login page** (React form)
4. **Protected routes**
5. **User dashboard**

---

## Troubleshooting

### MongoDB Won't Start

```powershell
# Check if service exists
sc query MongoDB

# If not found, install as service:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --install --serviceName MongoDB --dbpath "C:\data\db"

# Start service
net start MongoDB
```

### Port Already in Use

```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Module Not Found Errors

```powershell
# Clear npm cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

---

## Project Structure Summary

```
hotel-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── models/           # Mongoose schemas (next)
│   │   ├── routes/           # Express routes (next)
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation
│   │   ├── utils/            # Helpers
│   │   ├── server.ts
│   │   └── app.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Ready to Build!

Everything is set up for pure MERN development without Docker:

✅ **MongoDB** - Local installation  
✅ **Express.js** - TypeScript backend ready  
✅ **React** - Vite frontend ready  
✅ **Node.js** - v20 LTS  

**Next:** Create MongoDB schemas and build authentication module!

Want me to create the User model and authentication system next? 🚀
