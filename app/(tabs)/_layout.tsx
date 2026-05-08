// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '../../constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={ti.wrap}>
      <Text style={[ti.icon, focused && ti.iconOn]}>{icon}</Text>
      <Text style={[ti.label, focused && ti.labelOn]}>{label}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:    { alignItems: 'center', gap: 2, paddingTop: 6 },
  icon:    { fontSize: 22, opacity: 0.4 },
  iconOn:  { opacity: 1 },
  label:   { fontSize: 10, color: C.t3, fontWeight: '500' },
  labelOn: { color: C.primaryLight, fontWeight: '700' },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 0.5,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom || 8,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Asosiy" focused={focused} /> }}
      />
      <Tabs.Screen
        name="send"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="↩" label="O'tkazma" focused={focused} /> }}
      />
      <Tabs.Screen
        name="payments"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" label="To'lov" focused={focused} /> }}
      />
      <Tabs.Screen
        name="services"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⊞" label="Servislar" focused={focused} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🕐" label="Kirim-chiqim" focused={focused} /> }}
      />
    </Tabs>
  );
}
