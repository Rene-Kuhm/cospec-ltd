import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext } from '../src/context/AuthContext';
import { ConnectivityProvider } from '../src/context/ConnectivityContext';
import { NotificationsProvider } from '../src/context/NotificationsContext';
import { router, useSegments } from 'expo-router';
import { theme } from '../src/theme';

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
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="reclamo/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen
          name="reclamo/[id]/resolver"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ConnectivityProvider>
            <RootNavigator />
          </ConnectivityProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
