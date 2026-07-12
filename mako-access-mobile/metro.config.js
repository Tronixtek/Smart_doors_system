const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const ttlockRoot = path.resolve(projectRoot, '../react-native-ttlock');

const config = getDefaultConfig(projectRoot);

// Watch the local TTLock package at the repo root.
config.watchFolders = [ttlockRoot];

// Resolve the package to the local source during development.
config.resolver.extraNodeModules = {
  'react-native-ttlock': path.resolve(ttlockRoot, 'src', 'index.tsx'),
  'react': path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
};

module.exports = config;
