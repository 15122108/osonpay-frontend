import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Vibration, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
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

function NumPad({
  onPress, onDelete, onBiometric, showBiometric = false, loading = false,
}: {
  onPress: (n: string) => void;
  onDelete: () => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
  loading?: boolean;
}) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showBiometric ? 'bio' : '', '0', 'del'],
  ];

  if (loading) {
    return <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 32 }} />;
  }

  return (
    <View style={ps.pad}>
      {rows.map((row, ri) => (
        <View key={ri} style={ps.row}>
          {row.map((n, ci) => {
            if (n === '') return <View key={ci} style={ps.keyEmpty} />;
            if (n === 'bio') {
              return (
                <TouchableOpacity key={ci} style={ps.key} onPress={onBiometric} activeOpacity={0.6}>
                  <Text style={{ fontSize: 28 }}>👆</Text>
                </TouchableOpacity>
              );
            }
            if (n === 'del') {
              return (
                <TouchableOpacity key={ci} style={ps.key} onPress={onDelete} activeOpacity={0.6}>
                  <Text style={ps.deleteIcon}>⌫</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity key={ci} style={ps.key} onPress={() => onPress(n)} activeOpacity={0.6}>
                <Text style={ps.keyTxt}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function CreatePinScreen() {
  const { t } = useLang();
  const { setHasPin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNum(n: string) {
    setError('');
    if (step === 'create') {
      if (pin.length >= 4) return;
      const np = pin + n;
      setPin(np);
      if (np.length === 4) setTimeout(() => setStep('confirm'), 300);
    } else {
      if (confirmPin.length >= 4) return;
      const np = confirmPin + n;
      setConfirmPin(np);
      if (np.length === 4) setTimeout(() => checkPin(np), 300);
    }
  }

  async function checkPin(cp: string) {
    if (cp !== pin) {
      Vibration.vibrate(400);
      setError(t('pinMismatch'));
      setConfirmPin('');
      setStep('create');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      await api.setPin(pin);
      setHasPin(true);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
      setPin('');
      setConfirmPin('');
      setStep('create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={ps.root}>
      <View style={ps.inner}>
        <View style={ps.logoWrap}>
          <View style={ps.logo}>
            <Text style={ps.logoTxt}>OS</Text>
          </View>
        </View>
        <Text style={ps.title}>
          {step === 'create' ? t('createPin') : t('confirmPin')}
        </Text>
        <Text style={ps.sub}>{t('createPinDesc')}</Text>
        <PinDots pin={step === 'create' ? pin : confirmPin} />
        {error ? <Text style={ps.error}>{error}</Text> : <View style={{ height: 20 }} />}
        <NumPad
                  onPress={handleNum}
                  onDelete={() => {
                    setError('');
                    if (step === 'create') setPin(p => p.slice(0, -1));
                    else setConfirmPin(p => p.slice(0, -1));
                  }}
                  loading={loading}
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
          const [error, setError] = useState('');
          const [hasBiometric, setHasBiometric] = useState(false);

          useEffect(() => {
            checkBiometric();
          }, []);

          async function checkBiometric() {
            try {
              const has = await LocalAuthentication.hasHardwareAsync();
              const enrolled = await LocalAuthentication.isEnrolledAsync();
              setHasBiometric(has && enrolled);
              if (has && enrolled) tryBiometric();
            } catch {}
          }

          async function tryBiometric() {
            try {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Oson Pay ga kirish',
                fallbackLabel: 'PIN kiriting',
                cancelLabel: 'Bekor qilish',
              });
              if (result.success) router.replace('/(tabs)');
            } catch {}
          }

          async function handleNum(n: string) {
            if (loading || pin.length >= 4) return;
            setError('');
            const np = pin + n;
            setPin(np);
            if (np.length === 4) {
              setLoading(true);
              try {
                const r = await api.verifyPin(user?.phone ?? '', np);
                await login(r.token, r.user ?? user, true);
                router.replace('/(tabs)');
              } catch {
                Vibration.vibrate([0, 100, 50, 100]);
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPin('');
                if (newAttempts >= 5) {
                  Alert.alert(
                    'Bloklandi',
                    "Ko'p notogri urinish. Qayta kirish kerak.",
                    [{ text: 'Chiqish', onPress: logout }]
                  );
                } else {
                  setError(`Notogri PIN. ${5 - newAttempts} ta urinish qoldi`);
                }
              } finally {
                setLoading(false);
              }
            }
          }

          return (
            <SafeAreaView style={ps.root}>
              <TouchableOpacity style={ps.logoutTop} onPress={logout}>
                <Text style={ps.logoutTopTxt}>{t('logout')}</Text>
              </TouchableOpacity>
              <View style={ps.inner}>
                <View style={ps.logoWrap}>
                  <View style={ps.logo}>
                    <Text style={ps.logoTxt}>OS</Text>
                  </View>
                </View>
                <Text style={ps.title}>{t('enterPin')}</Text>
                {user?.fullName ? <Text style={ps.sub}>{user.fullName}</Text> : null}
                <PinDots pin={pin} />
                {error ? <Text style={ps.error}>{error}</Text> : <View style={{ height: 20 }} />}
                <NumPad
                  onPress={handleNum}
                  onDelete={() => {
                    setError('');
                    setPin(p => p.slice(0, -1));
                  }}
                  onBiometric={tryBiometric}
                  showBiometric={hasBiometric}
                  loading={loading}
                />
                <TouchableOpacity
                  style={ps.forgotBtn}
                  onPress={() => {
                    Alert.alert(
                      t('forgotPin'),
                      'Qayta SMS orqali kirish kerak',
                      [
                        { text: t('cancel'), style: 'cancel' },
                        { text: 'Qayta kirish', onPress: logout },
                      ]
                    );
                  }}
                >
                  <Text style={ps.forgotTxt}>{t('forgotPin')}</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          );
        }

        const ps = StyleSheet.create({
          root: { flex: 1, backgroundColor: C.bg },
          inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl, gap: S.lg },
          logoutTop: { position: 'absolute', top: 56, left: 20, zIndex: 10 },
          logoutTopTxt: { color: C.primaryLight, fontSize: 15, fontWeight: '500' },
          logoWrap: { alignItems: 'center', marginBottom: S.sm },
          logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
          logoTxt: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
            title: { fontSize: 22, fontWeight: '800', color: C.t1, textAlign: 'center' },
            sub: { fontSize: 14, color: C.t2, textAlign: 'center' },
            dots: { flexDirection: 'row', gap: 20, marginVertical: S.md },
            dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.elevated, borderWidth: 2, borderColor: C.border },
            dotFilled: { backgroundColor: C.primary, borderColor: C.primary },
            error: { color: C.danger, fontSize: 13, textAlign: 'center' },
            pad: { width: '100%', gap: 12 },
            row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
            key: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
            keyEmpty: { width: 84, height: 84 },
            keyTxt: { fontSize: 28, fontWeight: '500', color: C.t1 },
            deleteIcon: { fontSize: 22, color: C.t2 },
            forgotBtn: { marginTop: S.lg },
            forgotTxt: { color: C.primaryLight, fontSize: 15, fontWeight: '500' },
          });

          export default CreatePinScreen;