// app/modals/transaction.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Share, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { C, S, R, formatMoney, formatDate } from '../../constants/theme';
import { api } from '../../services/api';

const STATUS_COLOR: Record<string, string> = {
  completed: C.success, pending: C.warning, failed: C.danger,
};
const STATUS_LABEL: Record<string, string> = {
  completed: '✓ Muvaffaqiyatli', pending: '⏳ Kutilmoqda', failed: '✕ Xato',
};
const TYPE_ICON:  Record<string, string> = { send: '↑', receive: '↓', payment: '⊙', topup: '+' };
const TYPE_COLOR: Record<string, string> = {
  send: C.primary, receive: C.success, payment: C.danger, topup: C.warning,
};

export default function Transaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tx, setTx]         = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getTransaction(id)
      .then(d => setTx(d))
      .catch(e => Alert.alert('Xatolik', e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function shareReceipt() {
    if (!tx) return;
    await Share.share({
      message: `OSON PAY chek\n\nSumma: ${formatMoney(tx.amount)} UZS\nKimga: ${tx.receiver_name || tx.receiver_phone || '—'}\nSana: ${formatDate(tx.created_at)}\nID: ${tx.id}`,
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={s.headerBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={s.emptyTxt}>Tranzaksiya topilmadi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = tx.type === 'receive' || tx.type === 'topup';
  const color    = TYPE_COLOR[tx.type] || C.primary;
  const statusColor = STATUS_COLOR[tx.status] || C.success;

  const rows = [
    { label: 'Holat',      value: STATUS_LABEL[tx.status] || tx.status, valueColor: statusColor },
    { label: 'Sana',       value: formatDate(tx.created_at) },
    ...(tx.sender_name   ? [{ label: 'Yuboruvchi', value: tx.sender_name }]   : []),
    ...(tx.receiver_name ? [{ label: 'Qabul qiluvchi', value: tx.receiver_name }] : []),
    ...(tx.receiver_phone ? [{ label: 'Telefon', value: tx.receiver_phone }] : []),
    ...(tx.card_number   ? [{ label: 'Karta', value: `**** ${tx.card_number.slice(-4)}` }] : []),
    ...(tx.note          ? [{ label: 'Izoh', value: tx.note }] : []),
    { label: 'Komissiya',  value: tx.fee ? `${formatMoney(tx.fee)} UZS` : 'Bepul', valueColor: tx.fee ? C.t1 : C.success },
    { label: 'ID',         value: tx.id, mono: true },
  ];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={s.headerBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tranzaksiya</Text>
        <TouchableOpacity onPress={shareReceipt} hitSlop={8}>
          <Text style={{ fontSize: 20 }}>⬆️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Amount hero */}
        <View style={s.hero}>
          <View style={[s.heroIcon, { backgroundColor: color + '20' }]}>
            <Text style={[s.heroIconTxt, { color }]}>{TYPE_ICON[tx.type] || '·'}</Text>
          </View>
          <Text style={[s.heroAmt, { color: isCredit ? C.success : C.t1 }]}>
            {isCredit ? '+' : '-'}{formatMoney(tx.amount)} UZS
          </Text>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[s.statusTxt, { color: statusColor }]}>
              {STATUS_LABEL[tx.status] || tx.status}
            </Text>
          </View>
        </View>

        {/* Detail rows */}
        <View style={s.card}>
          {rows.map((row, i) => (
            <View key={i} style={[s.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text
                style={[s.rowValue, row.valueColor && { color: row.valueColor }, row.mono && s.mono]}
                numberOfLines={row.mono ? 1 : 2}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Chek yuklab olish */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={shareReceipt} activeOpacity={0.8}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionGrad}>
              <Text style={s.actionTxt}>📄 Chekni ulashish</Text>
            </LinearGradient>
          </TouchableOpacity>

          {tx.type === 'send' && (
            <TouchableOpacity
              style={s.repeatBtn}
              onPress={() => router.push({ pathname: '/modals/send', params: { phone: tx.receiver_phone, amount: tx.amount } })}
              activeOpacity={0.8}
            >
              <Text style={s.repeatTxt}>🔁 Qayta yuborish</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBtn:   { fontSize: 22, color: C.t2, width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.t1 },
  hero:        { alignItems: 'center', paddingVertical: S.xl, gap: S.md },
  heroIcon:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  heroIconTxt: { fontSize: 32, fontWeight: '800' },
  heroAmt:     { fontSize: 36, fontWeight: '900' },
  statusBadge: { paddingHorizontal: S.md, paddingVertical: 6, borderRadius: R.full },
  statusTxt:   { fontSize: 14, fontWeight: '700' },
  card:        { marginHorizontal: S.lg, backgroundColor: C.elevated, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLabel:    { fontSize: 13, color: C.t3, flex: 1 },
  rowValue:    { fontSize: 14, fontWeight: '600', color: C.t1, flex: 2, textAlign: 'right' },
  mono:        { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  actions:     { paddingHorizontal: S.lg, marginTop: S.lg, gap: S.sm },
  actionBtn:   { borderRadius: R.xl, overflow: 'hidden' },
  actionGrad:  { height: 54, alignItems: 'center', justifyContent: 'center' },
  actionTxt:   { color: '#FFF', fontWeight: '800', fontSize: 16 },
  repeatBtn:   { backgroundColor: C.elevated, borderRadius: R.xl, height: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  repeatTxt:   { color: C.primaryLight, fontWeight: '700', fontSize: 16 },
  empty:       { alignItems: 'center', paddingTop: 80, gap: S.md },
  emptyTxt:    { color: C.t3, fontSize: 16 },
});

// Platform import
import { Platform } from 'react-native';
