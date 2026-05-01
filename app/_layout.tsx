import { Tabs } from 'expo-router';
import { C } from '../../constants/theme';
import { Text } from 'react-native';

function Icon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    cards: '💳',
    history: '📋',
    profile: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '●'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.primaryLight,
        tabBarInactiveTintColor: C.t3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ focused }) => <Icon label="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Kartalar',
          tabBarIcon: ({ focused }) => <Icon label="cards" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Tarix',
          tabBarIcon: ({ focused }) => <Icon label="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <Icon label="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
