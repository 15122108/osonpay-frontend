// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { LangProvider } from '../hooks/useLang';
import { KEYS } from '../constants/keys';
import { C } from '../constants/theme';

// Root layout — AuthProvider + LangProvider barcha ekranlarni o'raydi
// Shunday qilib useAuth() va useLang() hamma joyda ishlaydi

function RootLayoutNav() {
  const auth = useAuthProvider();

  useEffect(() => {
    if (!auth.loading) {
      checkAuth();
    }
  }, [auth.loading]);

  async function checkAuth() {
    try {
      const [token, pin] = await Promise.all([
        SecureStore.getItemAsync(KEYS.TOKEN),
        SecureStore.getItemAsync(KEYS.PIN),
      ]);

      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      if (!pin) {
        router.replace('/(auth)/create-pin');
        return;
      }
      router.replace('/(auth)/pin-lock');
    } catch {
      router.replace('/(auth)/login');
    }
  }

  if (auth.loading) {
    return (
      <View style={s.splash}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  // LangProvider eng tashqarida — til hamma joyda ishlaydi
  return (
    <LangProvider>
      <RootLayoutNav />
    </LangProvider>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
