import { Tabs } from 'expo-router';
import { Text, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S } from '../../constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={ti.wrap}>
      <Text style={[ti.icon, focused && ti.iconActive]}>{icon}</Text>
      <Text style={[ti.label, focused && ti.labelActive]}>{label}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2, paddingTop: 4 },
  icon: { fontSize: 22, opacity: 0.45 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: C.t3, fontWeight: '500' },
  labelActive: { color: C.primary, fontWeight: '700' },
});

export default function TabLayout() {
  // FIX 2: iPhone home indicator uchun pastki bo'shliq dinamik hisoblanadi
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          // FIX 1: C.surface mavjud emas — C.bg ga o'zgartirildi
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 0.5,
          // FIX 2: height hardcoded 80 edi — insets bilan dinamik
          height: tabBarHeight,
          paddingBottom: insets.bottom || 8,
          // FIX 3: Android'da elevation soyasi olib tashlandi (borderTopWidth bilan ziddiyat)
          elevation: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Asosiy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" label="Kartalar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🕐" label="Kirim-chiqim" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
