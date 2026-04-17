import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Vibration } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

function PinDots({ pin, total = 4 }: { pin: string; total?: number }) {
  return (
    <View style={ps.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[ps.dot, i < pin.length && ps.dotFilled]} />
      ))}
    </View>
  );
}

function NumPad({ onPress, onDelete }: { onPress: (n: string) => void; onDelete: () => void }) {
  const nums = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <View style={ps.pad}>
      {nums.map((n, i) => (
        <TouchableOpacity
          key={i}
          style={[ps.key, n===''&&{opacity:0}]}
          onPress={() => n==='⌫' ? onDelete() : n && onPress(n)}
          activeOpacity={0.7}
        >
          <Text style={ps.keyTxt}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function CreatePinScreen() {
  const { t } = useLang();
  const { setHasPin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create'|'confirm'>('create');
  const [loading, setLoading] = useState(false);

  function handleNum(n: string) {
    if (step === 'create') {
      if (pin.length < 4) {
        const np = pin + n;
        setPin(np);
        if (np.length === 4) setTimeout(() => setStep('confirm'), 300);
      }
    } else {
      if (confirmPin.length < 4) {
        const np = confirmPin + n;
        setConfirmPin(np);
        if (np.length === 4) setTimeout(() => checkPin(np), 300);
      }
    }
  }

  async function checkPin(cp: string) {
    if (cp !== pin) {
      Vibration.vibrate(400);
      Alert.alert(t('error'), t('pinMismatch'));
      setConfirmPin('');
      setStep('create');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      await api.setPin(pin);
      // Muhim: hasPin ni true qilib belgilaymiz — qayta PIN so'ramaslik uchun
      setHasPin(true);
      Alert.alert('✅', t('pinSuccess'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={ps.root}>
      <View style={ps.inner}>
        <View style={ps.header}>
          <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:1}} style={ps.logoSmall}>
            <Text style={{fontSize:24,fontWeight:'900',color:'#FFB347'}}>P</Text>
          </LinearGradient>
          <Text style={ps.title}>{step==='create' ? t('createPin') : t('confirmPin')}</Text>
          <Text style={ps.sub}>{t('createPinDesc')}</Text>
        </View>
        <PinDots pin={step==='create' ? pin : confirmPin} />
        <NumPad
          onPress={handleNum}
          onDelete={() => {
            if (step==='create') setPin(p => p.slice(0,-1));
            else setConfirmPin(p => p.slice(0,-1));
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export function PinLockScreen() {
  const { t } = useLang();
  const { user, login, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function tryBiometric() {
    try {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Oson Pay',
        fallbackLabel: 'PIN kiriting'
      });
      if (r.success) router.replace('/(tabs)');
    } catch {}
  }

  async function handleNum(n: string) {
    if (loading || pin.length >= 4) return;
    const np = pin + n;
    setPin(np);
    if (np.length === 4) {
      setLoading(true);
      try {
        const r = await api.verifyPin(user?.phone || '', np);
        await login(r.token, user, true);
        router.replace('/(tabs)');
      } catch {
        Vibration.vibrate(400);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        if (newAttempts >= 5) {
          Alert.alert(t('error'), "Ko'p noto'g'ri urinish. Qayta kirish kerak.", [
            { text: t('logout'), onPress: logout }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <SafeAreaView style={ps.root}>
      <View style={ps.inner}>
        <View style={ps.header}>
          <LinearGradient colors={C.gBrand} start={{x:0,y:0}} end={{x:1,y:1}} style={ps.logoSmall}>
            <Text style={{fontSize:24,fontWeight:'900',color:'#FFB347'}}>P</Text>
          </LinearGradient>
          <Text style={ps.title}>{t('enterPin')}</Text>
          {user?.fullName ? <Text style={ps.sub}>{user.fullName}</Text> : null}
        </View>
        <PinDots pin={pin} />
        <NumPad
          onPress={handleNum}
          onDelete={() => setPin(p => p.slice(0,-1))}
        />
        <TouchableOpacity style={ps.bioBtn} onPress={tryBiometric}>
          <Text style={ps.bioTxt}>👆 {t('biometric')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={ps.logoutBtn}>
          <Text style={ps.logoutTxt}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.lg, gap: S.xl },
  header: { alignItems: 'center', gap: S.sm },
  logoSmall: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: C.t1, textAlign: 'center' },
  sub: { fontSize: 14, color: C.t2, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 20 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12 },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  keyTxt: { fontSize: 28, fontWeight: '600', color: C.t1 },
  bioBtn: { backgroundColor: C.primaryBg, paddingHorizontal: S.xl, paddingVertical: S.sm, borderRadius: R.full, borderWidth: 1, borderColor: C.primaryBorder },
  bioTxt: { color: C.primaryLight, fontWeight: '600', fontSize: 15 },
  logoutBtn: { padding: S.md },
  logoutTxt: { color: C.t3, fontSize: 13 },
});

export default CreatePinScreen;
