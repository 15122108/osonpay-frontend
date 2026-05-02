import { Tabs } from 'expo-router';
import { C } from '../../constants/theme';
import { Text, View } from 'react-native';

function Icon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏠',
    cards: '💳',
    history: '📋',
    profile: '👤',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
        {icons[label] ?? '●'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
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
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.t3,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ focused }) => <Icon label="index" focused={focused} />,
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
