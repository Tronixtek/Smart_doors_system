const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const ttlockRoot = path.resolve(workspaceRoot, 'react-native-ttlock');

const config = getDefaultConfig(projectRoot);

// Only watch the local TTLock package, not the whole workspace.
config.watchFolders = [ttlockRoot];

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules', 'expo', 'node_modules'),
  path.resolve(projectRoot, 'node_modules', 'react-native', 'node_modules'),
];

// Avoid resolving deps from parent folders (prevents RN version mismatch).
config.resolver.disableHierarchicalLookup = true;

// Add support for the react-native-ttlock source and pin core deps to app versions.
config.resolver.extraNodeModules = {
  'react-native-ttlock': ttlockRoot,
  react: path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
  'react-native-reanimated': path.resolve(projectRoot, 'node_modules', 'react-native-reanimated'),
};

module.exports = config;
