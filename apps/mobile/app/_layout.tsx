import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from '../src/context/AuthContext';
import { ConnectivityProvider } from '../src/context/ConnectivityContext';
import { router, useSegments } from 'expo-router';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';
    if (!isAuthenticated && inTabsGroup) router.replace('/login');
    else if (isAuthenticated && !inTabsGroup) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, segments]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
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
