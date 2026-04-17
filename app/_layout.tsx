import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';

SplashScreen.preventAutoHideAsync();

function Nav() {
  const { loading, isLoggedIn, user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    if (!isLoggedIn) {
      // Token yo'q — loginga
      router.replace('/(auth)/login');
    } else if (!user?.hasPin) {
      // Login bo'lgan lekin PIN yo'q — PIN yaratishga
      router.replace('/(auth)/create-pin');
    } else {
      // Login bo'lgan, PIN bor — to'g'ridan tabsga
      router.replace('/(tabs)');
    }
  }, [loading, isLoggedIn, user?.hasPin]);

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0D0A14' },
      animation: 'slide_from_right'
    }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/create-pin" />
      <Stack.Screen name="(auth)/pin-lock" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modals/send"        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/receive"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/topup"       options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/addcard"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/kyc"         options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={s.root}>
        <StatusBar style="light" backgroundColor="#0D0A14" />
        <Nav />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

const s = StyleSheet.create({ root: { flex: 1 } });