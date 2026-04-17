import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { C } from '../../constants/theme';
import { useLang } from '../../hooks/useLang';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={s.icon}>
      <Text style={[s.emoji, { opacity: focused ? 1 : 0.4 }]}>{emoji}</Text>
      {focused && <View style={s.dot} />}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLang();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: s.bar, tabBarShowLabel: false, tabBarActiveTintColor: C.primary, tabBarInactiveTintColor: C.t3 }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} /> }} />
      <Tabs.Screen name="cards" options={{ tabBarIcon: ({ focused }) => <Icon emoji="💳" focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: C.surface, borderTopWidth: 0.5, borderTopColor: C.border, height: Platform.OS === 'ios' ? 85 : 65, paddingTop: 8 },
  icon: { alignItems: 'center', gap: 3 },
  emoji: { fontSize: 24 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },
});
