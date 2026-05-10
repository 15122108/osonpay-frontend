// app/modals/topup.tsx
// O'rnatish: npx expo install react-native-webview

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

const QUICK = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

type Step = 'amount' | 'webview' | 'success' | 'failed';

export default function TopUp() {
  const { t }        = useLang();
  const { refresh }  = useAuth();
  const [amount, setAmount]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [step, setStep]               = useState<Step>('amount');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [paymentId, setPaymentId]     = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // To'lov holatini polling orqali tekshirish
  useEffect(() => {
    if (step === 'webview' && paymentId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.checkPaymentStatus(paymentId);
          if (res.status === 'completed') {
            clearInterval(pollRef.current!);
            await refresh();
            setStep('success');
          } else if (
            res.status === 'failed' ||
            res.status === 'cancelled' ||
            res.status === 'declined'
          ) {
            clearInterval(pollRef.current!);
            setStep('failed');
          }
        } catch {}
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, paymentId]);

  async function startTopup() {
    const amt = Number(amount);
    if (!amt || amt < 1000) {
      Alert.alert(t('error'), 'Minimum 1 000 UZS kiriting');
      return;
    }
    setLoading(true);
    try {
      const res = await api.initTopup(amt);
      setRedirectUrl(res.redirectUrl);
      setPaymentId(res.paymentId);
      setStep('webview');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleWebViewNav(navState: any) {
    const url: string = navState.url || '';
    if (url.startsWith('osonpay://') || url.includes('/api/payments/return')) {
      // Qaytish URLi — polling davom etadi, natija keladi
    }
  }

  // ── Muvaffaqiyatli ────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.resultWrap}>
          <Text style={s.resultIcon}>✅</Text>
          <Text style={s.resultTitle}>To'lov muvaffaqiyatli!</Text>
          <Text style={s.resultSub}>
            {formatMoney(Number(amount))} UZS hisobingizga o'tkazildi
          </Text>
          <TouchableOpacity style={s.resultBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient colors={C.gSuccess} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.resultBtnGrad}>
              <Text style={s.resultBtnTxt}>Bosh sahifaga</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Muvaffaqiyatsiz ───────────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.resultWrap}>
          <Text style={s.resultIcon}>❌</Text>
          <Text style={s.resultTitle}>To'lov amalga oshmadi</Text>
          <Text style={s.resultSub}>
            Karta ma'lumotlarini tekshiring yoki qayta urinib ko'ring
          </Text>
          <TouchableOpacity style={s.resultBtn} onPress={() => setStep('amount')} activeOpacity={0.8}>
            <LinearGradient colors={C.gOrange} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.resultBtnGrad}>
              <Text style={s.resultBtnTxt}>Qayta urinish</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }} hitSlop={8}>
            <Text style={{ color: C.t3, fontSize: 14 }}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── WebView (to'lov sahifasi) ──────────────────────────────────────────
  if (step === 'webview') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.webHeader}>
          <TouchableOpacity
            onPress={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setStep('amount');
            }}
            hitSlop={8}
          >
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>To'lov</Text>
          <ActivityIndicator color={C.primary} size="small" />
        </View>
        <WebView
          source={{ uri: redirectUrl }}
          onNavigationStateChange={handleWebViewNav}
          style={{ flex: 1, backgroundColor: C.bg }}
          startInLoadingState
          renderLoading={() => (
            <View style={s.webLoading}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={{ color: C.t3, marginTop: 12 }}>Yuklanmoqda...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // ── Summa kiritish ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>Hisob to'ldirish</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.iconWrap}>
            <LinearGradient colors={C.gOrange} style={s.iconCircle}>
              <Text style={{ fontSize: 36, color: '#FFF', fontWeight: '900' }}>+</Text>
            </LinearGradient>
          </View>

          <Text style={s.label}>Summa</Text>
          <View style={s.amtBox}>
            <TextInput
              style={s.amtInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={C.t3}
              autoFocus
            />
            <Text style={s.amtCur}>UZS</Text>
          </View>

          {/* Tez miqdorlar */}
          <View style={s.quickAmts}>
            {QUICK.map(q => (
              <TouchableOpacity
                key={q}
                style={[s.quickBtn, amount === String(q) && s.quickBtnOn]}
                onPress={() => setAmount(String(q))}
                activeOpacity={0.7}
              >
                <Text style={[s.quickTxt, amount === String(q) && s.quickTxtOn]}>
                  {formatMoney(q)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info */}
          <View style={s.infoBox}>
            <Text style={s.infoTxt}>💳 UzCard va Humo qo'llab-quvvatlanadi</Text>
            <Text style={s.infoTxt}>✅ Komissiyasiz</Text>
            <Text style={s.infoTxt}>⚡ Bir zumda</Text>
          </View>

          <TouchableOpacity
            onPress={startTopup}
            disabled={loading || !amount || Number(amount) < 1000}
            style={[s.btnWrap, (!amount || Number(amount) < 1000) && { opacity: 0.4 }]}
            activeOpacity={0.8}
          >
            <LinearGradient colors={C.gOrange} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnTxt}>
                  {amount && Number(amount) >= 1000
                    ? `${formatMoney(Number(amount))} UZS to'ldirish`
                    : 'Miqdor kiriting'
                  }
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  webHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  close:         { fontSize: 20, color: C.t2, width: 36, textAlign: 'center' },
  title:         { fontSize: 17, fontWeight: '700', color: C.t1 },
  content:       { padding: S.lg, gap: S.md, paddingBottom: 40 },
  iconWrap:      { alignItems: 'center', marginBottom: S.md },
  iconCircle:    { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  label:         { fontSize: 12, color: C.t3, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  amtBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 70 },
  amtInput:      { flex: 1, fontSize: 40, fontWeight: '900', color: C.t1 },
  amtCur:        { fontSize: 16, color: C.t3, fontWeight: '600' },
  quickAmts:     { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  quickBtn:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  quickBtnOn:    { backgroundColor: C.orangeBg, borderColor: C.orange },
  quickTxt:      { fontSize: 13, color: C.t2, fontWeight: '500' },
  quickTxtOn:    { color: C.orange, fontWeight: '700' },
  infoBox:       { backgroundColor: C.successBg, borderRadius: R.lg, padding: S.md, gap: 6, borderWidth: 1, borderColor: C.successBorder },
  infoTxt:       { fontSize: 13, color: C.success },
  btnWrap:       { borderRadius: R.xl, overflow: 'hidden' },
  btn:           { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt:        { fontSize: 17, fontWeight: '800', color: '#FFF' },
  webLoading:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  resultWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.md },
  resultIcon:    { fontSize: 64, marginBottom: S.md },
  resultTitle:   { fontSize: 22, fontWeight: '800', color: C.t1, textAlign: 'center' },
  resultSub:     { fontSize: 14, color: C.t2, textAlign: 'center' },
  resultBtn:     { width: '100%', borderRadius: R.xl, overflow: 'hidden', marginTop: S.lg },
  resultBtnGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  resultBtnTxt:  { fontSize: 16, fontWeight: '800', color: '#FFF' },
});