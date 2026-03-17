import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'COSPEC Técnicos',
  slug: 'cospec-tecnicos',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1e3a8a',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1e3a8a',
    },
    package: 'com.cospec.tecnicos',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.cospec.tecnicos',
  },
  extra: {
    apiUrl: process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001/api',
    eas: {
      projectId: 'TBD',
    },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-sqlite'],
  scheme: 'cospec',
});
