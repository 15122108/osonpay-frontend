import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

export default function Login() {
  const { t, lang, changeLang } = useLang();
  const { login } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const otpRefs = useRef<any[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function formatDisplay(raw: string) {
    const d = raw.slice(0, 9);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  const digits = phone.replace(/\D/g, '');
  const fullPhone = `+998${digits}`;
  const isOk = digits.length === 9;

  function startTimer() {
    setCountdown(180);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function sendOTP() {
    if (!isOk) return;
    setLoading(true);
    try {
      await api.sendOTP(fullPhone);
      setStep('otp');
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(val: string, idx: number) {
    const c = val.replace(/\D/g, '').slice(-1);
    const n = [...otp];
    n[idx] = c;
    setOtp(n);
    if (c && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (n.join('').length === 6) setTimeout(() => verifyOTP(n.join('')), 100);
  }

  function handleOtpBack(idx: number) {
    if (!otp[idx] && idx > 0) {
      const n = [...otp];
      n[idx - 1] = '';
      setOtp(n);
      otpRefs.current[idx - 1]?.focus();
    }
  }

  async function verifyOTP(code: string) {
    setLoading(true);
    try {
      const res = await api.verifyOTP(fullPhone, code, name || 'Foydalanuvchi');
      if (!res.hasPin && !name.trim()) {
        setTempToken(res.token);
        setLoading(false);
        setStep('name');
        return;
      }
      await login(res.token, res.user, res.hasPin);
      router.replace(res.hasPin ? '/(auth)/pin-lock' : '/(auth)/create-pin');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function submitName() {
    if (!name.trim() || !tempToken) return;
    setLoading(true);
    try {
      await api.updateProfile(name.trim());
      await login(tempToken, { phone: fullPhone, fullName: name.trim() }, false);
      router.replace('/(auth)/create-pin');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  const fmtTimer = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <View style={s.langRow}>
          {(['uz', 'ru', 'en'] as const).map(l => (
            <TouchableOpacity
              key={l}
              style={[s.langBtn, lang === l && s.langOn]}
              onPress={() => changeLang(l)}
            >
              <Text style={[s.langTxt, lang === l && s.langOnTxt]}>
                {l === 'uz' ? 'UZ' : l === 'ru' ? 'RU' : 'EN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.body}>
          <View style={s.logo}>
            <LinearGradient
              colors={['#7B2FBE', '#C44AFF', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoBox}
            >
              <Text style={s.logoP}>OS</Text>
            </LinearGradient>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }}>
              <Text style={s.logoOson}>Oson</Text>
              <Text style={s.logoPay}>Pay</Text>
            </View>
            <Text style={s.logoTag}>TEZ • OSON • ISHONCHLI</Text>
          </View>

          {step === 'phone' && (
            <View style={s.card}>
              <Text style={s.cardH}>{t('enterPhone')}</Text>
              <View style={s.phoneRow}>
                <View style={s.prefix}>
                  <Text style={s.prefixTxt}>+998</Text>
                </View>
                <TextInput
                  style={s.phoneIn}
                  value={formatDisplay(digits)}
                  onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 9))}
                  keyboardType="phone-pad"
                  placeholder="90 000 00 00"
                  placeholderTextColor={C.t3}
                  autoFocus
                  maxLength={12}
                />
              </View>
              <View style={s.badge}>
                <Text style={s.badgeTxt}>SMS orqali xavfsiz tasdiqlash</Text>
              </View>
              <TouchableOpacity
                onPress={sendOTP}
                disabled={loading || !isOk}
                style={[s.btn, !isOk && { opacity: 0.35 }]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnTxt}>{t('continue')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={s.card}>
              <Text style={s.cardH}>{t('enterCode')}</Text>
              <Text style={s.cardSub}>
                +998 {formatDisplay(digits)} ga kod yuborildi
              </Text>
              <View style={s.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={r => (otpRefs.current[i] = r)}
                    style={[s.otpCell, d && s.otpCellOn]}
                    value={d}
                    onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') handleOtpBack(i);
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>
              {loading && (
                <View style={s.loadRow}>
                  <ActivityIndicator color={C.primary} size="small" />
                  <Text style={s.loadTxt}>Tekshirilmoqda...</Text>
                </View>
              )}
              <View style={s.otpFoot}>
                <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
                  <Text style={s.linkTxt}>Raqamni o'zgartirish</Text>
                </TouchableOpacity>
                {countdown > 0 ? (
                  <Text style={s.timerTxt}>{fmtTimer}</Text>
                ) : (
                  <TouchableOpacity onPress={sendOTP} disabled={loading}>
                    <Text style={[s.linkTxt, { color: C.orange }]}>Qayta yuborish</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {step === 'name' && (
            <View style={s.card}>
              <Text style={s.cardH}>{t('enterName')}</Text>
              <Text style={s.cardSub}>Birinchi marta ro'yxatdan o'tyapsiz</Text>
              <TextInput
                style={s.nameIn}
                value={name}
                onChangeText={setName}
                placeholder={t('namePlaceholder')}
                placeholderTextColor={C.t3}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submitName}
              />
              <TouchableOpacity
                onPress={submitName}
                disabled={loading || !name.trim()}
                style={[s.btn, !name.trim() && { opacity: 0.35 }]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.btnTxt}>{t('start')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  kav: { flex: 1 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: S.lg, paddingTop: S.sm, gap: S.sm },
  langBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  langOn: { backgroundColor: C.primaryBg, borderColor: C.primary },
  langTxt: { fontSize: 12, color: C.t3, fontWeight: '600' },
  langOnTxt: { color: C.primaryLight },
  body: { flex: 1, paddingHorizontal: 16, justifyContent: 'center', gap: 20 },
  logo: { alignItems: 'center', gap: 6 },
  logoBox: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoP: { fontSize: 30, fontWeight: '900', color: '#FFD580' },
  logoOson: { fontSize: 22, fontWeight: '900', color: C.t1 },
  logoPay: { fontSize: 22, fontWeight: '900', color: C.orange },
  logoTag: { fontSize: 9, color: C.t3, letterSpacing: 2, marginTop: 2 },
  card: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, gap: 12 },
  cardH: { fontSize: 16, fontWeight: '800', color: C.t1 },
  cardSub: { fontSize: 12, color: C.t2, lineHeight: 17 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.md, borderWidth: 1, borderColor: C.border, height: 50, overflow: 'hidden' },
  prefix: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: C.border, height: '100%' },
  prefixTxt: { fontSize: 14, fontWeight: '700', color: C.t2 },
  phoneIn: { flex: 1, paddingHorizontal: 12, fontSize: 16, fontWeight: '600', color: C.t1, letterSpacing: 0.5 },
  badge: { backgroundColor: 'rgba(0,200,150,0.07)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(0,200,150,0.18)' },
  badgeTxt: { fontSize: 11, color: C.success, textAlign: 'center' },
  btn: { borderRadius: R.md, overflow: 'hidden' },
  btnGrad: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  otpRow: { flexDirection: 'row', gap: 7 },
  otpCell: { flex: 1, height: 50, borderRadius: R.md, backgroundColor: C.elevated, borderWidth: 1.5, borderColor: C.border, fontSize: 20, fontWeight: '800', color: C.t1, textAlign: 'center' },
  otpCellOn: { borderColor: C.primary, backgroundColor: C.primaryBg },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  loadTxt: { fontSize: 12, color: C.t2 },
  otpFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkTxt: { fontSize: 12, color: C.t3, fontWeight: '500' },
  timerTxt: { fontSize: 12, color: C.t2, fontWeight: '700' },
  nameIn: { backgroundColor: C.elevated, borderRadius: R.md, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 50, fontSize: 15, color: C.t1, fontWeight: '500' },
});