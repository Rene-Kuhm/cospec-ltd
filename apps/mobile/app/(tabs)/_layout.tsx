import { Tabs } from 'expo-router';
import { theme } from '../../src/theme';
import { useNotifications } from '../../src/hooks/useNotifications';

export default function TabLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSoft,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#0c1628',
          borderTopColor: theme.colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reclamos',
          headerTitle: 'Mesa tecnica',
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          title: 'Avisos',
          headerTitle: 'Notificaciones',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Perfil operativo',
        }}
      />
    </Tabs>
  );
}
