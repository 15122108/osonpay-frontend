// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { C } from '../constants/theme';

// Kalitlar
export const KEYS = {
  PIN: 'app_pin',
  TOKEN: 'app_token',
  BIO: 'app_bio',
};

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const [token, pin] = await Promise.all([
        SecureStore.getItemAsync(KEYS.TOKEN),
        SecureStore.getItemAsync(KEYS.PIN),
      ]);

      if (!token) {
        // Hech qachon login qilmagan → login ekrani
        router.replace('/(auth)/login');
        return;
      }

      if (!pin) {
        // Token bor, lekin PIN yo'q → PIN yaratish
        router.replace('/(auth)/create-pin');
        return;
      }

      // Token ham, PIN ham bor → PIN/FaceID so'rash
      router.replace('/(auth)/pin-lock');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <View style={s.splash}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
