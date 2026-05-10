// app/modals/addcard.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

const CARD_COLORS = [
  C.gBrand, C.gPrimary, C.gSuccess, C.gOrange, C.gCard2, C.gCard3,
];

export default function AddCard() {
  const { t } = useLang();
  const [cardNum, setCardNum]     = useState('');
  const [expiry, setExpiry]       = useState('');
  const [holder, setHolder]       = useState('');
  const [colorIdx, setColorIdx]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState<'info' | 'sms'>('info');
  const [smsCode, setSmsCode]     = useState('');

  function fmtCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0,2)}/${d.slice(2)}`;
    return d;
  }

  const cardDigits  = cardNum.replace(/\D/g, '');
  const expiryDigits = expiry.replace(/\D/g, '');
  const isValid = cardDigits.length === 16 && expiryDigits.length === 4;

  async function requestSms() {
    if (!isValid) return;
    setLoading(true);
    try {
      await api.addCardRequest({
        number: cardDigits,
        expiry_month: expiryDigits.slice(0, 2),
        expiry_year:  '20' + expiryDigits.slice(2),
      });
      setStep('sms');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  async function confirmCard() {
    if (smsCode.length < 4) return;
    setLoading(true);
    try {
      await api.addCardConfirm({
        number: cardDigits,
        sms_code: smsCode,
        color_from: CARD_COLORS[colorIdx][0],
        color_to:   CARD_COLORS[colorIdx][1],
        card_holder: holder.trim() || undefined,
      });
      Alert.alert('✅', 'Karta muvaffaqiyatli qo\'shildi!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => step === 'sms' ? setStep('info') : router.back()} hitSlop={8}>
            <Text style={s.headerBtn}>{step === 'sms' ? '←' : '✕'}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Karta qo'shish</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.content}>
          {/* Card Preview */}
          <LinearGradient colors={CARD_COLORS[colorIdx]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cardPreview}>
            <View style={s.cardTop}>
              <Text style={s.cardBankTxt}>OSON PAY</Text>
              <Text style={s.cardTypeTxt}>UZCARD</Text>
            </View>
            <Text style={s.cardNumTxt}>
              {cardDigits.length >= 4
                ? `${cardDigits.slice(0,4).replace(/./g,'●')} ${cardDigits.slice(4,8).replace(/./g,'●')} ${cardDigits.slice(8,12).replace(/./g,'●')} ${cardDigits.slice(12,16) || '●●●●'}`
                : '●●●● ●●●● ●●●● ●●●●'
              }
            </Text>
            <View style={s.cardBot}>
              <Text style={s.cardHolderTxt}>{holder || 'ISM FAMILIYA'}</Text>
              <Text style={s.cardExpTxt}>{expiry || 'MM/YY'}</Text>
            </View>
          </LinearGradient>

          {/* Color picker */}
          <View style={s.colorRow}>
            {CARD_COLORS.map((grad, i) => (
              <TouchableOpacity key={i} onPress={() => setColorIdx(i)} activeOpacity={0.8}>
                <LinearGradient colors={grad} style={[s.colorDot, i === colorIdx && s.colorDotOn]} />
              </TouchableOpacity>
            ))}
          </View>

          {step === 'info' ? (
            <View style={s.form}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Karta raqami</Text>
                <TextInput
                  style={s.fieldInput}
                  value={fmtCard(cardNum)}
                  onChangeText={v => setCardNum(v.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={C.t3}
                  maxLength={19}
                  autoFocus
                />
              </View>
              <View style={s.row2}>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Amal qilish muddati</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={fmtExpiry(expiry)}
                    onChangeText={v => setExpiry(v.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholder="MM/YY"
                    placeholderTextColor={C.t3}
                    maxLength={5}
                  />
                </View>
                <View style={[s.field, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Karta egasi (ixtiyoriy)</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={holder}
                    onChangeText={v => setHolder(v.toUpperCase())}
                    placeholder="ISM FAMILIYA"
                    placeholderTextColor={C.t3}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[s.btnWrap, !isValid && { opacity: 0.4 }]}
                disabled={!isValid || loading}
                onPress={requestSms}
                activeOpacity={0.8}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>Davom etish →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.form}>
              <Text style={s.smsTitle}>SMS-kodni kiriting</Text>
              <Text style={s.smsSub}>Kartaga ulangan raqamga SMS yuborildi</Text>
              <TextInput
                style={s.smsInput}
                value={smsCode}
                onChangeText={v => setSmsCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="numeric"
                placeholder="● ● ● ● ● ●"
                placeholderTextColor={C.t3}
                maxLength={6}
                autoFocus
                textAlign="center"
              />
              <TouchableOpacity
                style={[s.btnWrap, smsCode.length < 4 && { opacity: 0.4 }]}
                disabled={smsCode.length < 4 || loading}
                onPress={confirmCard}
                activeOpacity={0.8}
              >
                <LinearGradient colors={C.gSuccess} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>✓ Tasdiqlash</Text>}
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
  root:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBtn:     { fontSize: 22, color: C.t2, width: 36 },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: C.t1 },
  content:       { flex: 1, padding: S.lg, gap: S.md },
  cardPreview:   { borderRadius: R.xl, padding: S.lg, height: 190, justifyContent: 'space-between' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBankTxt:   { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  cardTypeTxt:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  cardNumTxt:    { color: '#FFF', fontSize: 16, letterSpacing: 3, textAlign: 'center' },
  cardBot:       { flexDirection: 'row', justifyContent: 'space-between' },
  cardHolderTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1 },
  cardExpTxt:    { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  colorRow:      { flexDirection: 'row', gap: S.sm, justifyContent: 'center' },
  colorDot:      { width: 28, height: 28, borderRadius: 14 },
  colorDotOn:    { borderWidth: 3, borderColor: '#FFF', transform: [{ scale: 1.15 }] },
  form:          { gap: S.md },
  field:         { gap: 6 },
  fieldLabel:    { fontSize: 13, color: C.t3, fontWeight: '600' },
  fieldInput:    { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, height: 52, color: C.t1, fontSize: 16 },
  row2:          { flexDirection: 'row', gap: S.sm },
  smsTitle:      { fontSize: 20, fontWeight: '800', color: C.t1 },
  smsSub:        { fontSize: 14, color: C.t3 },
  smsInput:      { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, height: 64, color: C.t1, fontSize: 28, letterSpacing: 10 },
  btnWrap:       { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btn:           { height: 56, alignItems: 'center', justifyContent: 'center' },
  btnTxt:        { fontSize: 17, fontWeight: '800', color: '#FFF' },
});