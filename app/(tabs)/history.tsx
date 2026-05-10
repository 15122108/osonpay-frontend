import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, TextInput, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

const PERIODS = ["Bu oy", "O'tgan oy", "3 oy", "Yil"];
const CATEGORIES = ["Barchasi", "Kirim", "Chiqim", "To'lov", "To'ldirish"];

// FIX 1: Komponent ichida har render'da qayta yaratilardi — tashqariga chiqarildi
const TYPE_MAP: Record<string, string | undefined> = {
  Barchasi: undefined,
  Kirim: 'receive',
  Chiqim: 'send',
  "To'lov": 'payment',
  "To'ldirish": 'topup',
};

const PERIOD_MAP: Record<string, string> = {
  "Bu oy": 'this_month',
  "O'tgan oy": 'last_month',
  "3 oy": '3_months',
  "Yil": 'this_year',
};

const typeIcon: Record<string, string> = {
  send: '↑', receive: '↓', payment: '⊙', topup: '+', withdraw: '↧',
};
const typeColor: Record<string, string> = {
  send: C.primary, receive: C.success, payment: C.danger, topup: C.warning,
};
const statusColor: Record<string, string> = {
  completed: C.success, pending: C.warning, failed: C.danger,
};

export default function History() {
  const { user } = useAuth();
  const { t } = useLang();
  // FIX 2: promoBtn bottom: 90 hardcoded edi — tab bar balandligi dinamik
  const insets = useSafeAreaInsets();

  const [txs, setTxs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodModal, setPeriodModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Bu oy");
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [stats, setStats] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);

  // FIX 3: catch bloki bo'sh edi + period ham API ga uzatiladi
  const load = useCallback(async (f = filter, period = selectedPeriod) => {
    try {
      const [th, ts] = await Promise.all([
        api.getHistory(1, f, PERIOD_MAP[period]),
        api.getStats(),
      ]);
      setTxs(th.transactions || []);
      setStats(ts.stats);
    } catch (e: any) {
      Alert.alert(t('error'), e.message ?? "Tarixni yuklab bo'lmadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, selectedPeriod]);

  // FIX 4: selectedPeriod o'zgarganda ham API qayta chaqiriladi
  useEffect(() => {
    setLoading(true);
    load(filter, selectedPeriod);
  }, [filter, selectedPeriod]);

  // FIX 5: `||` operatorlari singan edi
  const displayed = txs.filter(tx =>
    !search || (tx.sender_name || tx.receiver_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Kirim-chiqim</Text>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setShowStats(v => !v)}>
            <Text style={{ fontSize: 18 }}>📊</Text>
          </TouchableOpacity>
          {/* FIX 6: yuklab olish tugmasida onPress yo'q edi */}
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/modals/export-history' as any)}>
            <Text style={{ fontSize: 18 }}>⬇</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStats && stats && (
        <View style={s.statsPanel}>
          {[
            { label: 'Kirim', val: `+${formatMoney(stats.total_in)}`, color: C.success },
            { label: 'Chiqim', val: `-${formatMoney(stats.total_out)}`, color: C.danger },
            { label: 'Jami', val: `${stats.total_count} ta`, color: C.primary },
          ].map((st, i) => (
            <View key={i} style={s.statItem}>
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        <TouchableOpacity style={s.filterChip} onPress={() => setPeriodModal(true)}>
          <Text style={s.filterChipTxt}>📅 {selectedPeriod}</Text>
          <Text style={s.dropIcon}>▾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.filterChip, selectedCategory !== 'Barchasi' && s.filterChipActive]}
          onPress={() => setCategoryModal(true)}
        >
          <Text style={[s.filterChipTxt, selectedCategory !== 'Barchasi' && s.filterChipTxtActive]}>
            🗂 {selectedCategory}
          </Text>
          <Text style={[s.dropIcon, selectedCategory !== 'Barchasi' && { color: C.primaryLight }]}>▾</Text>
        </TouchableOpacity>
        {["Kartalar va xizmatlar", "Kompaniyalar", "Oluvchilar va yuboruvchilar"].map(label => (
          <TouchableOpacity key={label} style={s.filterChip} onPress={() => {}}>
            <Text style={s.filterChipTxt}>{label}</Text>
            <Text style={s.dropIcon}>▾</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.searchBox}>
        <Text style={{ fontSize: 16, color: C.t3 }}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder={t('search')}
          placeholderTextColor={C.t3}
          value={search}
          onChangeText={setSearch}
        />
        {search
          ? <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}><Text style={{ color: C.t3 }}>✕</Text></TouchableOpacity>
          : null
        }
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.primary}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🔍</Text>
            <Text style={s.emptyTitle}>Tanlangan filtrlar bo'yicha{'\n'}tranzaksiya topilmadi</Text>
            <Text style={s.emptyDesc}>Filtrlarni o'zgartirib ko'ring{'\n'}yoki o'chiring</Text>
            <TouchableOpacity
              onPress={() => {
                setFilter(undefined);
                setSearch('');
                setSelectedCategory('Barchasi');
                setSelectedPeriod("Bu oy");
              }}
            >
              <Text style={s.clearFilters}>Filtrlarni o'chirish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayed.map(tx => {
            const isCredit = tx.receiver_id === user?.id;
            const amt = parseFloat(tx.amount);
            // FIX 7: `||` operatorlari singan edi
            const name = isCredit ? (tx.sender_name || 'Tizim') : (tx.receiver_name || 'Tizim');
            const color = typeColor[tx.type] || C.primary;
            return (
              <TouchableOpacity
                key={tx.id}
                style={s.txCard}
                onPress={() => router.push({ pathname: '/modals/transaction', params: { id: tx.id } })}
                activeOpacity={0.7}
              >
                <View style={[s.txIcon, { backgroundColor: color + '18' }]}>
                  <Text style={[s.txIconTxt, { color }]}>{typeIcon[tx.type] || '·'}</Text>
                </View>
                <View style={s.txMid}>
                  <Text style={s.txName}>{name}</Text>
                  <Text style={s.txDate}>
                    {new Date(tx.created_at).toLocaleDateString('uz-UZ', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={s.txRight}>
                  <Text style={[s.txAmt, { color: isCredit ? C.success : C.t1 }]}>
                    {isCredit ? '+' : '-'}{formatMoney(amt)} so'm
                  </Text>
                  <View style={[s.statusBadge, { backgroundColor: (statusColor[tx.status] || C.success) + '20' }]}>
                    <Text style={[s.statusTxt, { color: statusColor[tx.status] || C.success }]}>
                      {tx.status === 'completed' ? '✓' : tx.status === 'pending' ? '⏳' : '✕'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FIX 2: bottom dinamik — tab bar + safe area insets */}
      <TouchableOpacity
        style={[s.promoBtn, { bottom: 56 + insets.bottom + S.md }]}
        activeOpacity={0.8}
      >
        <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.promoGrad}>
          <Text style={s.promoTxt}>Yanada ko'proq imkoniyatlar {'>'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={periodModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setPeriodModal(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Davr tanlash</Text>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.modalItem, selectedPeriod === p && s.modalItemActive]}
                onPress={() => { setSelectedPeriod(p); setPeriodModal(false); }}
              >
                <Text style={[s.modalItemTxt, selectedPeriod === p && s.modalItemTxtActive]}>{p}</Text>
                {selectedPeriod === p && <Text style={{ color: C.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={categoryModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setCategoryModal(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Toifa tanlash</Text>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.modalItem, selectedCategory === c && s.modalItemActive]}
                onPress={() => { setSelectedCategory(c); setFilter(TYPE_MAP[c]); setCategoryModal(false); }}
              >
                <Text style={[s.modalItemTxt, selectedCategory === c && s.modalItemTxtActive]}>{c}</Text>
                {selectedCategory === c && <Text style={{ color: C.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.sm },
  title: { fontSize: 22, fontWeight: '800', color: C.t1 },
  headerIcons: { flexDirection: 'row', gap: S.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  statsPanel: { flexDirection: 'row', marginHorizontal: S.lg, marginBottom: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  statLbl: { fontSize: 11, color: C.t3 },
  filterRow: { paddingHorizontal: S.lg, gap: S.sm, paddingBottom: S.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  filterChipTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  filterChipTxtActive: { color: C.primaryLight, fontWeight: '700' },
  dropIcon: { fontSize: 10, color: C.t3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginHorizontal: S.lg, marginBottom: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, paddingHorizontal: S.md, height: 44, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.t1, fontSize: 14 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  txIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  txIconTxt: { fontSize: 20, fontWeight: '800' },
  txMid: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 3 },
  txDate: { fontSize: 11, color: C.t3 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmt: { fontSize: 14, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.full },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: S.lg },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.t1, textAlign: 'center', marginBottom: 10, lineHeight: 24 },
  emptyDesc: { fontSize: 13, color: C.t3, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  clearFilters: { color: C.primaryLight, fontSize: 15, fontWeight: '600' },
  promoBtn: { position: 'absolute', left: S.lg, right: S.lg, borderRadius: R.lg, overflow: 'hidden' },
  promoGrad: { paddingVertical: 16, alignItems: 'center' },
  promoTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  // FIX 8: C.surface → C.bg, R.xxl → R.xl (theme'da mavjud emas edi)
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.t1, marginBottom: S.md },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: S.md, borderRadius: R.lg },
  modalItemActive: { backgroundColor: C.primaryBg },
  modalItemTxt: { fontSize: 15, color: C.t2 },
  modalItemTxtActive: { color: C.primaryLight, fontWeight: '700' },
});