// Metro config for Turborepo monorepo
// Required: workspace packages are symlinked by pnpm
// Metro needs to watch parent directories to resolve @cospec/* packages

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure Metro resolves workspace symlinks correctly
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
