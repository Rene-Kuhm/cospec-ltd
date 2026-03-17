import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuthContext } from '../src/context/AuthContext';
import { ConnectivityProvider } from '../src/context/ConnectivityContext';
import { router, useSegments } from 'expo-router';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !inLoginScreen) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}
      >
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="reclamo/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="reclamo/[id]/resolver" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConnectivityProvider>
        <RootNavigator />
      </ConnectivityProvider>
    </AuthProvider>
  );
}
