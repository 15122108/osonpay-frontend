import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

const SERVICES = [
  { id: 'electricity', name: 'Elektr energiya', icon: '⚡', color: ['#F7971E', '#FFD200'] },
  { id: 'gas', name: 'Gaz', icon: '🔥', color: ['#FF416C', '#FF4B2B'] },
  { id: 'water', name: 'Suv', icon: '💧', color: ['#1A6DFF', '#00C6FF'] },
  { id: 'internet', name: 'Internet', icon: '🌐', color: ['#7B2FBE', '#C44AFF'] },
  { id: 'phone', name: 'Mobil aloqa', icon: '📱', color: ['#00C896', '#0099AA'] },
  { id: 'tv', name: 'Kabel TV', icon: '📺', color: ['#FF3B5C', '#FF8C00'] },
  { id: 'education', name: "Ta'lim", icon: '🎓', color: ['#4776E6', '#8E54E9'] },
  { id: 'tax', name: 'Soliq', icon: '🏛', color: ['#373B44', '#4286f4'] },
  { id: 'fine', name: 'Jarima', icon: '🚔', color: ['#DC2424', '#4A569D'] },
  { id: 'housing', name: 'Uy-joy', icon: '🏠', color: ['#00C896', '#00A877'] },
  { id: 'insurance', name: "Sug'urta", icon: '🛡', color: ['#11998E', '#38EF7D'] },
  { id: 'charity', name: "Xayriya", icon: '❤️', color: ['#FF416C', '#FF4B2B'] },
];

export default function Payments() {
  const { t } = useLang();
  const [selected, setSelected] = useState<any>(null);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'pay'>('select');

  async function pay() {
    if (!account || !amount || Number(amount) < 1000) {
      Alert.alert('Xato', "To'g'ri ma'lumot kiriting");
      return;
    }
    setLoading(true);
    try {
      await api.topUp(Number(amount));
      Alert.alert('✅', `${selected.name} uchun ${formatMoney(Number(amount))} UZS to'landi!`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Xato', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'pay' && selected) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep('select')}>
            <Text style={s.back}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{selected.name}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <LinearGradient colors={selected.color} style={s.serviceCard}>
            <Text style={s.serviceIcon}>{selected.icon}</Text>
            <Text style={s.serviceName}>{selected.name}</Text>
          </LinearGradient>

          <View style={s.form}>
            <Text style={s.label}>Hisob raqam / ID</Text>
            <TextInput
              style={s.input}
              value={account}
              onChangeText={setAccount}
              placeholder="Hisob raqamingizni kiriting"
              placeholderTextColor={C.t3}
              keyboardType="numeric"
              autoFocus
            />

            <Text style={s.label}>Summa (UZS)</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={C.t3}
              keyboardType="numeric"
            />

            <View style={s.quickAmts}>
              {[10000, 20000, 50000, 100000].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.quickBtn, amount === String(q) && s.quickBtnOn]}
                  onPress={() => setAmount(String(q))}
                >
                  <Text style={[s.quickTxt, amount === String(q) && s.quickTxtOn]}>
                    {formatMoney(q)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={pay}
              disabled={loading || !account || Number(amount) < 1000}
              style={[s.btn, (!account || Number(amount) < 1000) && { opacity: 0.4 }]}
            >
              <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={s.btnTxt}>To'lash {amount ? formatMoney(Number(amount)) : ''} UZS</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>To'lovlar</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {SERVICES.map(service => (
          <TouchableOpacity
            key={service.id}
            style={s.serviceBtn}
            onPress={() => { setSelected(service); setStep('pay'); }}
          >
            <LinearGradient colors={service.color as any} style={s.serviceBtnGrad}>
              <Text style={s.serviceBtnIcon}>{service.icon}</Text>
            </LinearGradient>
            <Text style={s.serviceBtnName}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  back: { fontSize: 22, color: C.t2, width: 36, textAlign: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.t1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: S.lg, gap: S.md },
  serviceBtn: { width: '30%', alignItems: 'center', gap: 8 },
  serviceBtnGrad: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  serviceBtnIcon: { fontSize: 28 },
  serviceBtnName: { fontSize: 11, color: C.t2, textAlign: 'center', fontWeight: '500' },
  content: { padding: S.lg, gap: S.md },
  serviceCard: { borderRadius: R.xl, padding: S.xl, alignItems: 'center', gap: S.sm },
  serviceIcon: { fontSize: 48 },
  serviceName: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  form: { gap: S.md },
  label: { fontSize: 12, color: C.t3, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 54, color: C.t1, fontSize: 16, fontWeight: '600' },
  quickAmts: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  quickBtnOn: { backgroundColor: C.orangeBg, borderColor: C.orange },
  quickTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  quickTxtOn: { color: C.orange, fontWeight: '700' },
  btn: { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btnGrad: { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
