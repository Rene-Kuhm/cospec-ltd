import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        tabBarStyle: { backgroundColor: '#ffffff' },
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
