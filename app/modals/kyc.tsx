// app/modals/kyc.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

type Step = 'form' | 'pending' | 'verified';

export default function KYC() {
  const { t } = useLang();
  const [step, setStep]           = useState<Step>('form');
  const [series, setSeries]       = useState('');
  const [number, setNumber]       = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fullName, setFullName]   = useState('');
  const [loading, setLoading]     = useState(false);

  function fmtDate(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    if (d.length >= 5) return `${d.slice(0,2)}.${d.slice(2,4)}.${d.slice(4)}`;
    if (d.length >= 3) return `${d.slice(0,2)}.${d.slice(2)}`;
    return d;
  }

  const isValid = series.length >= 2 && number.length >= 7 && birthDate.replace(/\D/g,'').length === 8 && fullName.trim().length >= 3;

  async function submit() {
    setLoading(true);
    try {
      await api.submitKYC({
        passport_series: series.toUpperCase(),
        passport_number: number,
        birth_date:      birthDate,
        full_name:       fullName.trim(),
      });
      setStep('pending');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={s.headerBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pasport (KYC)</Text>
        <View style={{ width: 36 }} />
      </View>

      {step === 'form' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Info banner */}
            <View style={s.infoBanner}>
              <Text style={{ fontSize: 20 }}>🛡</Text>
              <Text style={s.infoTxt}>Ma'lumotlaringiz xavfsiz saqlanadi va faqat tasdiqlash uchun ishlatiladi</Text>
            </View>

            {[
              { label: t('passportSeries'), value: series, onChange: (v: string) => setSeries(v.replace(/[^A-Za-z]/g,'').toUpperCase().slice(0,2)), placeholder: 'AA', maxLen: 2, keyboard: 'default' as const },
              { label: t('passportNumber'), value: number, onChange: (v: string) => setNumber(v.replace(/\D/g,'').slice(0,7)), placeholder: '1234567', maxLen: 7, keyboard: 'numeric' as const },
              { label: t('birthDate'),      value: birthDate, onChange: (v: string) => setBirthDate(fmtDate(v)), placeholder: 'KK.OO.YYYY', maxLen: 10, keyboard: 'numeric' as const },
              { label: t('fullName'),       value: fullName, onChange: (v: string) => setFullName(v.toUpperCase()), placeholder: 'FAMILIYA ISM OTASINING ISM', maxLen: 60, keyboard: 'default' as const },
            ].map(field => (
              <View key={field.label} style={s.field}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={s.fieldInput}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.t3}
                  keyboardType={field.keyboard}
                  maxLength={field.maxLen}
                  autoCapitalize="characters"
                />
              </View>
            ))}

            <TouchableOpacity
              style={[s.btnWrap, !isValid && { opacity: 0.4 }]}
              disabled={!isValid || loading}
              onPress={submit}
              activeOpacity={0.8}
            >
              <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>Yuborish →</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'pending' && (
        <View style={s.resultBox}>
          <Text style={{ fontSize: 80 }}>⏳</Text>
          <Text style={s.resultTitle}>Tekshirilmoqda</Text>
          <Text style={s.resultDesc}>Ma'lumotlaringiz tekshirilmoqda. Bu 1-3 ish kuni davom etishi mumkin.</Text>
          <TouchableOpacity style={s.btnWrap} onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnTxt}>Tushunarli</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {step === 'verified' && (
        <View style={s.resultBox}>
          <Text style={{ fontSize: 80 }}>✅</Text>
          <Text style={s.resultTitle}>Tasdiqlandi!</Text>
          <Text style={s.resultDesc}>Hisobingiz muvaffaqiyatli tasdiqlandi.</Text>
          <TouchableOpacity style={s.btnWrap} onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient colors={C.gSuccess} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnTxt}>✓ Davom etish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBtn:   { fontSize: 22, color: C.t2, width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.t1 },
  content:     { padding: S.lg, gap: S.md, paddingBottom: 40 },
  infoBanner:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.primaryBg, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.primaryBorder },
  infoTxt:     { flex: 1, fontSize: 13, color: C.primaryLight, lineHeight: 18 },
  field:       { gap: 6 },
  fieldLabel:  { fontSize: 13, color: C.t3, fontWeight: '600' },
  fieldInput:  { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, height: 52, color: C.t1, fontSize: 16 },
  btnWrap:     { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btn:         { height: 56, alignItems: 'center', justifyContent: 'center' },
  btnTxt:      { fontSize: 17, fontWeight: '800', color: '#FFF' },
  resultBox:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl, gap: S.lg },
  resultTitle: { fontSize: 26, fontWeight: '900', color: C.t1 },
  resultDesc:  { fontSize: 15, color: C.t3, textAlign: 'center', lineHeight: 22 },
});