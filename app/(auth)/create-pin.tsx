// app/(auth)/create-pin.tsx
// 1-qadam: PIN kiriting
// 2-qadam: Qayta kiriting (tasdiqlash)
// 3-qadam: Biometrik taklif (FaceID/Touch ID)

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Vibration, Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';
import { KEYS } from '../../constants/theme';

const PIN_LENGTH = 4;
type Step = 'enter' | 'confirm' | 'bio';

export default function CreatePin() {
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [bioType, setBioType] = useState<'face' | 'fingerprint' | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = Array.from({ length: PIN_LENGTH }, () => useRef(new Animated.Value(1)).current);

  const STEP_TITLES: Record<Step, string> = {
    enter: 'PIN-kod yarating',
    confirm: 'PIN-kodni tasdiqlang',
    bio: bioType === 'face' ? 'Face ID yoqish' : 'Touch ID yoqish',
  };
  const STEP_SUBS: Record<Step, string> = {
    enter: `${PIN_LENGTH} xonali PIN kiriting`,
    confirm: 'Xavfsizlik uchun qayta kiriting',
    bio: `${bioType === 'face' ? 'Face ID' : 'Touch ID'} bilan tezroq kiring`,
  };

  async function pressDigit(digit: string) {
    if (step === 'bio') return;
    if (pin.length >= PIN_LENGTH) return;

    Animated.sequence([
      Animated.timing(dotAnims[pin.length], { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.timing(dotAnims[pin.length], { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      await handleComplete(newPin);
    }
  }

  async function handleComplete(entered: string) {
    if (step === 'enter') {
      setFirstPin(entered);
      setPin('');
      // Bio mavjudligini tekshir
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBioType('face');
        } else {
          setBioType('fingerprint');
        }
      }
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (entered !== firstPin) {
        shake();
        Vibration.vibrate(300);
        setPin('');
        Alert.alert('', "PIN-kodlar mos kelmadi. Qaytadan urinib ko'ring.");
        setStep('enter');
        setFirstPin('');
        return;
      }

      // PIN saqlash
      await SecureStore.setItemAsync(KEYS.PIN, entered);

      if (bioType) {
        setPin('');
        setStep('bio');
      } else {
        goToApp();
      }
    }
  }

  async function enableBio() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `${bioType === 'face' ? 'Face ID' : 'Touch ID'} ni yoqish`,
      cancelLabel: 'Keyinroq',
      disableDeviceFallback: true,
    });

    if (result.success) {
      await SecureStore.setItemAsync(KEYS.BIO, 'true');
    }
    goToApp();
  }

  function skipBio() {
    SecureStore.setItemAsync(KEYS.BIO, 'false');
    goToApp();
  }

  function goToApp() {
    router.replace('/(tabs)');
  }

  function pressDelete() {
    if (step === 'bio') return;
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

  const KEYS_LAYOUT = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.top}>
        {/* Logo */}
        <Text style={s.logo}>P</Text>

        {/* Step indicator */}
        <View style={s.stepDots}>
          {(['enter', 'confirm', ...(bioType ? ['bio'] : [])] as Step[]).map((st, i) => (
            <View
              key={st}
              style={[s.stepDot, (step === st || ['enter', 'confirm'].indexOf(step) > i) && s.stepDotActive]}
            />
          ))}
        </View>

        <Text style={s.title}>{STEP_TITLES[step]}</Text>
        <Text style={s.sub}>{STEP_SUBS[step]}</Text>

        {/* PIN Dots - faqat enter/confirm da ko'rinadi */}
        {step !== 'bio' && (
          <Animated.View style={[s.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <Animated.View
                key={i}
                style={[s.dot, i < pin.length && s.dotFilled, { transform: [{ scale: dotAnims[i] }] }]}
              />
            ))}
          </Animated.View>
        )}

        {/* Bio taklif */}
        {step === 'bio' && (
          <View style={s.bioBox}>
            <Text style={s.bioEmoji}>{bioType === 'face' ? '🪪' : '👆'}</Text>
            <Text style={s.bioTitle}>
              {bioType === 'face' ? 'Face ID bilan kirish' : 'Touch ID bilan kirish'}
            </Text>
            <Text style={s.bioDesc}>
              Keyingi kirishda PIN o'rniga {bioType === 'face' ? 'yuzingiz' : 'barmoq izingiz'} bilan tezroq kiring
            </Text>
            <TouchableOpacity style={s.bioEnableBtn} onPress={enableBio}>
              <Text style={s.bioEnableTxt}>
                {bioType === 'face' ? 'Face ID' : 'Touch ID'} ni yoqish
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.bioSkipBtn} onPress={skipBio}>
              <Text style={s.bioSkipTxt}>Keyinroq</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Keyboard - faqat enter/confirm da ko'rinadi */}
      {step !== 'bio' && (
        <View style={s.keyboard}>
          {KEYS_LAYOUT.map((row, ri) => (
            <View key={ri} style={s.keyRow}>
              {row.map((key, ki) => {
                if (key === '') return <View key={ki} style={s.key} />;
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
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, justifyContent: 'space-between' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 20, paddingHorizontal: S.xl },
  logo: { fontSize: 28, fontWeight: '900', color: C.primary, marginBottom: 8 },
  stepDots: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.primary, width: 20 },
  title: { fontSize: 20, fontWeight: '700', color: C.t1, textAlign: 'center' },
  sub: { fontSize: 14, color: C.t3, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 20, marginTop: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.primary, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: C.primary },
  bioBox: { alignItems: 'center', gap: 12, marginTop: 16 },
  bioEmoji: { fontSize: 72 },
  bioTitle: { fontSize: 20, fontWeight: '700', color: C.t1, textAlign: 'center' },
  bioDesc: { fontSize: 14, color: C.t3, textAlign: 'center', lineHeight: 20 },
  bioEnableBtn: {
    marginTop: 8, backgroundColor: C.primary, borderRadius: R.xl,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  bioEnableTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  bioSkipBtn: { paddingVertical: 10 },
  bioSkipTxt: { color: C.t3, fontSize: 14 },
  keyboard: { paddingHorizontal: S.xl, paddingBottom: 20, gap: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  key: { flex: 1, height: 72, borderRadius: R.xl, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  keyTxt: { fontSize: 26, fontWeight: '400', color: C.t1 },
  delIcon: { fontSize: 22, color: C.t2 },
});