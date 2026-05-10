// app/(auth)/login.tsx
// Foydalanuvchi ro'yxatdan o'tganda yoki kirganida:
// 1. Telefon raqami kiritiladi
// 2. SMS kod tasdiqlanadi
// 3. Yangi foydalanuvchi bo'lsa — ism kiritiladi
// 4. User ma'lumotlari auth context ga saqlanadi
// 5. PIN ekraniga yo'naltiriladi

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { C, S, R } from '../../constants/theme';
import { KEYS } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

type Step = 'phone' | 'code' | 'name';

export default function Login() {
  const { t }       = useLang();
  const { saveUser } = useAuth();  // ← user ni auth context ga saqlash

  const [step, setStep]       = useState<Step>('phone');
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [verifiedUser, setVerifiedUser] = useState<any>(null); // token kelgandan keyin saqlash

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startTimer() {
    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  // Telefon raqamini formatlash
  const digits = phone.replace(/\D/g, '');
  function dispPhone(d = digits.slice(0, 12)) {
    if (!d) return '';
    if (d.length <= 3)  return `+${d}`;
    if (d.length <= 5)  return `+${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8)  return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5)}`;
    if (d.length <= 10) return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8)}`;
    return `+${d.slice(0,3)} ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10,12)}`;
  }

  // 1-bosqich: SMS yuborish
  async function sendCode() {
    if (digits.length < 12) {
      Alert.alert(t('error'), t('enterPhone')); return;
    }
    setLoading(true);
    try {
      await api.sendCode(`+${digits}`);
      fadeAnim.setValue(0);
      setStep('code');
      startTimer();
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  // 2-bosqich: SMS kodni tasdiqlash
  async function verifyCode() {
    if (code.length < 4) {
      Alert.alert(t('error'), t('enterCode')); return;
    }
    setLoading(true);
    try {
      const res = await api.verifyCode(`+${digits}`, code);

      // Token ni saqlash
      await SecureStore.setItemAsync(KEYS.TOKEN, res.token);

      if (res.user?.fullName) {
        // Mavjud foydalanuvchi — ismi bor
        // Auth context ga saqlaymiz
        saveUser(res.user);
        // PIN bor bo'lsa pin-lock, yo'q bo'lsa create-pin
        const pin = await SecureStore.getItemAsync(KEYS.PIN);
        router.replace(pin ? '/(auth)/pin-lock' : '/(auth)/create-pin');
      } else {
        // Yangi foydalanuvchi — ismi yo'q, kiritishni so'raymiz
        setVerifiedUser(res.user);
        fadeAnim.setValue(0);
        setStep('name');
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  // 3-bosqich: Ism saqlash (yangi foydalanuvchi)
  async function saveName() {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterName')); return;
    }
    setLoading(true);
    try {
      // Backendga ismni saqlash
      const updatedUser = await api.updateProfile({ fullName: name.trim() });

      // Auth context ga yangilangan user ni saqlash
      saveUser({ ...verifiedUser, fullName: name.trim(), ...updatedUser });

      // PIN yaratish ekraniga o'tish
      router.replace('/(auth)/create-pin');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  async function resendCode() {
    if (timer > 0) return;
    setLoading(true);
    try {
      await api.sendCode(`+${digits}`);
      startTimer();
      setCode('');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.inner}>

          {/* Logo */}
          <View style={s.logoWrap}>
            <LinearGradient colors={C.gBrand} style={s.logoBox}>
              <Text style={s.logoTxt}>P</Text>
            </LinearGradient>
            <Text style={s.appName}>OSON PAY</Text>
          </View>

          <Animated.View style={[s.card, { opacity: fadeAnim }]}>

            {/* ── 1-bosqich: Telefon ─────────────────────────── */}
            {step === 'phone' && (
              <>
                <Text style={s.stepTitle}>{t('welcome')} 👋</Text>
                <Text style={s.stepSub}>{t('enterPhone')}</Text>
                <View style={s.inputBox}>
                  <Text style={s.flag}>🇺🇿</Text>
                  <TextInput
                    style={s.input}
                    value={dispPhone()}
                    onChangeText={v => setPhone(v.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    placeholder="+998 XX XXX XX XX"
                    placeholderTextColor={C.t3}
                    autoFocus
                    maxLength={18}
                  />
                </View>
                <TouchableOpacity
                  style={[s.btnWrap, (digits.length < 12 || loading) && { opacity: 0.4 }]}
                  disabled={digits.length < 12 || loading}
                  onPress={sendCode}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={s.btnTxt}>{t('sendCode')} →</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* ── 2-bosqich: SMS kod ─────────────────────────── */}
            {step === 'code' && (
              <>
                <TouchableOpacity
                  onPress={() => { setStep('phone'); setCode(''); }}
                  hitSlop={8}
                  style={s.backBtn}
                >
                  <Text style={s.backTxt}>← {dispPhone()}</Text>
                </TouchableOpacity>
                <Text style={s.stepTitle}>{t('enterCode')}</Text>
                <Text style={s.stepSub}>
                  {dispPhone()} ga SMS yuborildi
                </Text>
                <TextInput
                  ref={codeInputRef}
                  style={[s.input, s.codeInput]}
                  value={code}
                  onChangeText={v => {
                    const clean = v.replace(/\D/g, '').slice(0, 6);
                    setCode(clean);
                    // 6 raqam to'liq kirilganda avtomatik tasdiqlash
                    if (clean.length === 6) setTimeout(() => verifyCode(), 100);
                  }}
                  keyboardType="numeric"
                  placeholder="● ● ● ● ● ●"
                  placeholderTextColor={C.t3}
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity onPress={resendCode} disabled={timer > 0}>
                  <Text style={[s.resendTxt, timer > 0 && { color: C.t3 }]}>
                    {timer > 0
                      ? `Qayta yuborish: ${timer}s`
                      : 'Qayta yuborish'
                    }
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnWrap, (code.length < 4 || loading) && { opacity: 0.4 }]}
                  disabled={code.length < 4 || loading}
                  onPress={verifyCode}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={s.btnTxt}>{t('verify')} →</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* ── 3-bosqich: Ism (yangi foydalanuvchi) ─────────── */}
            {step === 'name' && (
              <>
                <Text style={s.stepTitle}>{t('enterName')} 👤</Text>
                <Text style={s.stepSub}>
                  Bu ism ilovada va to'lovlarda ko'rinadi
                </Text>
                <TextInput
                  style={[s.input, s.nameInput]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor={C.t3}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <TouchableOpacity
                  style={[s.btnWrap, (!name.trim() || loading) && { opacity: 0.4 }]}
                  disabled={!name.trim() || loading}
                  onPress={saveName}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={s.btnTxt}>{t('continue')} →</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bg },
  inner:     { flex: 1, justifyContent: 'center', paddingHorizontal: S.lg, gap: S.xl },
  logoWrap:  { alignItems: 'center', gap: S.sm },
  logoBox:   { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoTxt:   { fontSize: 36, fontWeight: '900', color: '#FFF' },
  appName:   { fontSize: 22, fontWeight: '900', color: C.t1, letterSpacing: 2 },
  card:      { backgroundColor: C.elevated, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, gap: S.md },
  backBtn:   { marginBottom: -S.sm },
  backTxt:   { color: C.primaryLight, fontSize: 14, fontWeight: '600' },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.t1 },
  stepSub:   { fontSize: 14, color: C.t3, marginTop: -S.sm },
  inputBox:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 56 },
  flag:      { fontSize: 22 },
  input:     { flex: 1, fontSize: 18, fontWeight: '600', color: C.t1 },
  codeInput: { flex: undefined, backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 60, textAlign: 'center', fontSize: 24, letterSpacing: 8, color: C.t1 },
  nameInput: { flex: undefined, backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 56, fontSize: 18, color: C.t1 },
  resendTxt: { color: C.primaryLight, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  btnWrap:   { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btn:       { height: 56, alignItems: 'center', justifyContent: 'center' },
  btnTxt:    { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
