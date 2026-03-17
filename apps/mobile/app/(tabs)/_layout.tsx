import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: '#ffffff' },
        sceneStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reclamos',
          headerTitle: 'COSPEC — Reclamos',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tabs>
  );
}
