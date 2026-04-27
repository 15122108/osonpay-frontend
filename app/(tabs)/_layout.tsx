import { useEffect, useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { LangProvider } from '../../hooks/useLang';

SplashScreen.preventAutoHideAsync();

function Nav() {
  const { loading, isLoggedIn, user } = useAuth();
  const appState = useRef(AppState.currentState);
  const pathname = usePathname();

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        isLoggedIn &&
        user?.hasPin &&
        pathname !== '/(auth)/pin-lock'
      ) {
        router.replace('/(auth)/pin-lock');
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isLoggedIn, user?.hasPin, pathname]);

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    if (!isLoggedIn) {
      router.replace('/(auth)/login');
    } else if (!user?.hasPin) {
      router.replace('/(auth)/create-pin');
    } else {
      router.replace('/(auth)/pin-lock');
    }
  }, [loading, isLoggedIn, user?.hasPin]);

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0D0A14' },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/create-pin" />
      <Stack.Screen name="(auth)/pin-lock" options={{ gestureEnabled: false }} />
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
      <LangProvider>
        <GestureHandlerRootView style={s.root}>
          <StatusBar style="light" backgroundColor="#0D0A14" />
          <Nav />
        </GestureHandlerRootView>
      </LangProvider>
    </AuthProvider>
  );
}

const s = StyleSheet.create({ root: { flex: 1 } });