// app/(auth)/pin-lock.tsx
// Payme kabi: app ochilganda avtomatik FaceID/biometrik so'raydi,
// muvaffaqiyatsiz bo'lsa PIN klaviatura chiqadi.

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Vibration, Alert, Image,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';
import { KEYS } from '../_layout';

const PIN_LENGTH = 4;

export default function PinLock() {
  const [pin, setPin] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState<'face' | 'fingerprint' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = Array.from({ length: PIN_LENGTH }, () => useRef(new Animated.Value(1)).current);

  useEffect(() => {
    setupBio();
  }, []);

  async function setupBio() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const bioEnabled = await SecureStore.getItemAsync(KEYS.BIO);

    if (hasHardware && isEnrolled && bioEnabled === 'true') {
      setBioAvailable(true);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBioType('face');
      } else {
        setBioType('fingerprint');
      }
      // Avtomatik biometrik so'rash (Payme kabi)
      setTimeout(() => triggerBio(), 300);
    }
  }

  async function triggerBio() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ilovaga kirish',
      cancelLabel: 'PIN kiriting',
      disableDeviceFallback: true, // Faqat biometrik, sistema fallback yo'q
    });

    if (result.success) {
      unlockApp();
    }
    // Muvaffaqiyatsiz bo'lsa — PIN klaviatura ko'rinishda qoladi
  }

  function unlockApp() {
    router.replace('/(tabs)');
  }

  function pressDigit(digit: string) {
    if (pin.length >= PIN_LENGTH) return;

    // Dot animatsiyasi
    Animated.sequence([
      Animated.timing(dotAnims[pin.length], { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.timing(dotAnims[pin.length], { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      verifyPin(newPin);
    }
  }

  async function verifyPin(entered: string) {
    const saved = await SecureStore.getItemAsync(KEYS.PIN);

    if (entered === saved) {
      unlockApp();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      shake();
      Vibration.vibrate(300);
      setPin('');

      if (newAttempts >= 5) {
        // 5 marta noto'g'ri — logout
        Alert.alert(
          'Kirish bloklandi',
          "5 marta noto'g'ri PIN kiritdingiz. Qayta kirish kerak.",
          [{ text: 'OK', onPress: () => logout() }],
        );
      }
    }
  }

  function pressDelete() {
    setPin(p => p.slice(0, -1));
  }

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function logout() {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.PIN);
    router.replace('/(auth)/login');
  }

  const KEYS_LAYOUT = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.top}>
        {/* Logo */}
        <View style={s.logoBox}>
          <Text style={s.logoTxt}>P</Text>
        </View>

        <Text style={s.title}>PIN-kodni kiriting</Text>

        {/* Dots */}
        <Animated.View style={[s.dots, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                s.dot,
                i < pin.length && s.dotFilled,
                { transform: [{ scale: dotAnims[i] }] },
              ]}
            />
          ))}
        </Animated.View>

        {attempts > 0 && attempts < 5 && (
          <Text style={s.errorTxt}>
            Noto'g'ri PIN. {5 - attempts} ta urinish qoldi
          </Text>
        )}
      </View>

      {/* Keyboard */}
      <View style={s.keyboard}>
        {KEYS_LAYOUT.map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map(key => {
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={s.key}
                    onPress={bioAvailable ? triggerBio : undefined}
                    activeOpacity={bioAvailable ? 0.6 : 1}
                  >
                    {bioAvailable && (
                      <Text style={s.bioIcon}>
                        {bioType === 'face' ? '🪪' : '👆'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={key}
                    style={s.key}
                    onPress={pressDelete}
                    onLongPress={() => setPin('')}
                    activeOpacity={0.6}
                  >
                    <Text style={s.delIcon}>⌫</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={s.key}
                  onPress={() => pressDigit(key)}
                  activeOpacity={0.6}
                >
                  <Text style={s.keyTxt}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Chiqish */}
      <TouchableOpacity style={s.logoutBtn} onPress={() => {
        Alert.alert('Chiqish', "Hisobdan chiqmoqchimisiz?", [
          { text: 'Bekor', style: 'cancel' },
          { text: 'Chiqish', style: 'destructive', onPress: logout },
        ]);
      }}>
        <Text style={s.logoutTxt}>Boshqa hisob</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, justifyContent: 'space-between' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingTop: 20 },
  logoBox: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoTxt: { fontSize: 28, fontWeight: '900', color: C.primary },
  title: { fontSize: 18, fontWeight: '600', color: C.t1 },
  dots: { flexDirection: 'row', gap: 20, marginTop: 8 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: C.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: C.primary },
  errorTxt: { fontSize: 13, color: C.danger, fontWeight: '500' },
  keyboard: { paddingHorizontal: S.xl, paddingBottom: 20, gap: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  key: {
    flex: 1, height: 72, borderRadius: R.xl,
    backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  keyTxt: { fontSize: 26, fontWeight: '400', color: C.t1 },
  bioIcon: { fontSize: 28 },
  delIcon: { fontSize: 22, color: C.t2 },
  logoutBtn: { alignItems: 'center', paddingBottom: 30, paddingTop: 8 },
  logoutTxt: { color: C.t3, fontSize: 14 },
});
