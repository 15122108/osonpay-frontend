// app/(tabs)/index.tsx — Asosiy ekran
// Barcha ma'lumotlar API dan keladi — hardcoded hech narsa yo'q

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator,
  FlatList, Animated, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

const { width } = Dimensions.get('window');
const CARD_W = width - S.lg * 2;

// Bannerlar — marketing content, statik (o'zgarmaydi)
const BANNERS = [
  { id: '1', title: "10% keshbek bilan",   sub: "Barcha to'lovlarda",         colors: C.gBrand   },
  { id: '2', title: "+50 000 so'm bonus",   sub: "Do'stingizni taklif qiling", colors: C.gPrimary },
  { id: '3', title: "Kartangizni bog'lang", sub: "Va keshbek oling",           colors: C.gSuccess },
];

// Xizmat kategoriyalari — statik (Payme kabi o'zgarmaydi)
const QUICK_SERVICES = [
  { id: '1', icon: '📱', label: "Mobil\noperatorlar",    badge: '1%' },
  { id: '2', icon: '🌐', label: "Internet\nprovayderlar", badge: '1%' },
  { id: '3', icon: '⚡', label: "Kommunal\nto'lovlar",   badge: '1%' },
  { id: '4', icon: '🏦', label: "Bank\nxizmatlari",      badge: null },
];

const TX_COLOR: Record<string, string> = {
  send: C.primary, receive: C.success, payment: C.danger, topup: C.warning,
};
const TX_ICON: Record<string, string> = {
  send: '↑', receive: '↓', payment: '⊙', topup: '+',
};

export default function Home() {
  const { user, refresh } = useAuth();
  const { t } = useLang();

  const [txs, setTxs]                       = useState<any[]>([]);
  const [stats, setStats]                    = useState<any>(null);
  const [savedPayments, setSavedPayments]    = useState<any[]>([]);  // API dan
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [balHidden, setBalHidden]            = useState(false);
  const [bannerIdx, setBannerIdx]            = useState(0);

  const bannerRef    = useRef<FlatList>(null);
  const bannerIdxRef = useRef(0);
  const fadeAnim     = useRef(new Animated.Value(1)).current;

  async function load() {
    try {
      const [th, ts, sp] = await Promise.all([
        api.getHistory(1),
        api.getStats(),
        api.getSavedPayments(),   // ← foydalanuvchining o'z saqlangan to'lovlari
      ]);
      setTxs(th.transactions?.slice(0, 5) || []);
      setStats(ts?.stats || null);
      setSavedPayments(sp || []);
    } catch (e: any) {
      Alert.alert(t('error'), e.message ?? "Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Banner auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (bannerIdxRef.current + 1) % BANNERS.length;
      bannerIdxRef.current = next;
      setBannerIdx(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), load()]);
    setRefreshing(false);
  }, []);

  function toggleBalance() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setBalHidden(h => !h);
  }

  const ACTIONS = [
    { label: t('send'),    icon: '↑', grad: C.gBrand,   route: '/modals/send'     },
    { label: t('receive'), icon: '↓', grad: C.gSuccess,  route: '/modals/receive'  },
    { label: t('topup'),   icon: '+', grad: C.gOrange,   route: '/modals/topup'    },
    { label: t('payment'), icon: '⊙', grad: C.gPrimary,  route: '/modals/payments' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)}>
              <LinearGradient colors={C.gBrand} style={s.avatar}>
                <Text style={s.avatarTxt}>
                  {user?.fullName?.slice(0, 2)?.toUpperCase() || 'OP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={s.mascot}><Text style={{ fontSize: 26 }}>🧑‍💼</Text></View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/modals/search' as any)}>
              <Text style={{ fontSize: 18 }}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/modals/notifications' as any)}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Balance ─────────────────────────────────────────── */}
        <Text style={s.balLabel}>{t('mainBalance')}</Text>
        <View style={s.balRow}>
          <TouchableOpacity onPress={toggleBalance} hitSlop={8}>
            <Text style={{ fontSize: 22 }}>{balHidden ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
          <Animated.Text style={[s.balAmt, { opacity: fadeAnim }]}>
            {balHidden ? '●●●●●' : `${formatMoney(user?.balance)} so'm`}
          </Animated.Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={s.balDots}>···</Text>
          </TouchableOpacity>
        </View>
        {stats && (
          <Text style={s.balSub}>
            Maydagi chiqim: {formatMoney(stats.total_out || 0)} so'm
          </Text>
        )}

        {/* ── Quick Actions ────────────────────────────────────── */}
        <View style={s.actionsRow}>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={s.actionWrap}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={a.grad} style={s.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.actionIcon}>{a.icon}</Text>
              </LinearGradient>
              <Text style={s.actionLbl}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Keshbek Banner ──────────────────────────────────── */}
        {stats?.cashback > 0 && (
          <TouchableOpacity style={s.keshbekWrap} activeOpacity={0.85}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.keshbekGrad}>
              <Text style={s.keshbekTxt}>
                🎁 {formatMoney(stats.cashback)} so'm keshbekingiz bor {'›'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Banner slider ────────────────────────────────────── */}
        <FlatList
          ref={bannerRef}
          data={BANNERS}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          style={{ paddingHorizontal: S.lg, marginBottom: S.sm }}
          getItemLayout={(_, idx) => ({ length: CARD_W, offset: CARD_W * idx, index: idx })}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
            bannerIdxRef.current = idx;
            setBannerIdx(idx);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} style={{ width: CARD_W }}>
              <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bannerCard}>
                <View>
                  <Text style={s.bannerTitle}>{item.title}</Text>
                  <Text style={s.bannerSub}>{item.sub}</Text>
                </View>
                <Text style={{ fontSize: 38 }}>✈️</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
        <View style={s.bannerDots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[s.dot, i === bannerIdx && s.dotActive]} />
          ))}
        </View>

        {/* ── Pul o'tkazish ────────────────────────────────────── */}
        <View style={s.sec}>
          <Text style={s.secTitle}>Pul o'tkazish</Text>
          <TouchableOpacity
            style={s.transferBox}
            onPress={() => router.push('/modals/send' as any)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, color: C.t3 }}>💳</Text>
            <Text style={s.transferPh}>Karta yoki telefon raqami</Text>
            <Text style={{ fontSize: 18 }}>⊞</Text>
          </TouchableOpacity>
        </View>

        {/* ── Saqlangan to'lovlar — API DAN ───────────────────── */}
        {savedPayments.length > 0 && (
          <View style={s.sec}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Saqlangan to'lovlar</Text>
              <TouchableOpacity onPress={() => router.push('/modals/payments' as any)}>
                <Text style={s.seeAll}>Yana</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
              {savedPayments.map(p => (
                <TouchableOpacity key={p.id} style={s.savedCard} activeOpacity={0.7}>
                  {p.badge && <View style={s.badge}><Text style={s.badgeTxt}>{p.badge}</Text></View>}
                  <Text style={{ fontSize: 24 }}>{p.icon || '💳'}</Text>
                  <Text style={s.savedName} numberOfLines={2}>{p.name}</Text>
                  <Text style={s.savedSub} numberOfLines={1}>{p.sub}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Xizmatlar to'lovi ────────────────────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Xizmatlar to'lovi</Text>
            <TouchableOpacity onPress={() => router.push('/modals/payments' as any)}>
              <Text style={s.seeAll}>Yana</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {QUICK_SERVICES.map(sv => (
              <TouchableOpacity key={sv.id} style={s.svcCard} activeOpacity={0.7}
                onPress={() => router.push('/modals/payments' as any)}>
                {sv.badge && <View style={s.badge}><Text style={s.badgeTxt}>{sv.badge}</Text></View>}
                <Text style={{ fontSize: 26, marginBottom: 6 }}>{sv.icon}</Text>
                <Text style={s.svcLabel}>{sv.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Oxirgi tranzaksiyalar — API DAN ─────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>{t('recentTx')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history' as any)}>
              <Text style={s.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
          ) : txs.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={s.emptyTxt}>{t('noTx')}</Text>
            </View>
          ) : (
            <View style={s.txGroup}>
              {txs.map(tx => {
                const isCredit = tx.receiver_id === user?.id;
                const name     = isCredit
                  ? (tx.sender_name   || 'Tizim')
                  : (tx.receiver_name || 'Tizim');
                const color    = TX_COLOR[tx.type] || C.primary;
                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={s.txRow}
                    onPress={() => router.push({ pathname: '/modals/transaction', params: { id: tx.id } })}
                    activeOpacity={0.7}
                  >
                    <View style={[s.txIcon, { backgroundColor: color + '20' }]}>
                      <Text style={[s.txIconTxt, { color }]}>{TX_ICON[tx.type] || '·'}</Text>
                    </View>
                    <View style={s.txInfo}>
                      <Text style={s.txName}>{name}</Text>
                      <Text style={s.txTime}>
                        {new Date(tx.created_at).toLocaleDateString('uz-UZ', {
                          day: 'numeric', month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text style={[s.txAmt, { color: isCredit ? C.success : C.t1 }]}>
                      {isCredit ? '+' : '-'}{formatMoney(tx.amount)} so'm
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Vidjetlarni sozlash ──────────────────────────────── */}
        <View style={{ paddingHorizontal: S.lg, marginTop: S.sm }}>
          <TouchableOpacity style={s.widgetBtn} activeOpacity={0.8}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
            <Text style={s.widgetTxt}>Vidjetlarni sozlash</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 14, fontWeight: '800', color: '#FFF' },
  mascot:      { width: 44, height: 44, borderRadius: 22, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerRight: { flexDirection: 'row', gap: S.sm },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  balLabel:    { fontSize: 14, color: C.t2, paddingHorizontal: S.lg, marginBottom: 4 },
  balRow:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg, marginBottom: 4 },
  balAmt:      { fontSize: 30, fontWeight: '900', color: C.t1, flex: 1 },
  balDots:     { fontSize: 22, color: C.t3, padding: 4 },
  balSub:      { fontSize: 12, color: C.t3, paddingHorizontal: S.lg, marginBottom: S.md },
  actionsRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: S.lg, marginBottom: S.md },
  actionWrap:  { alignItems: 'center', gap: 6 },
  actionBtn:   { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  actionIcon:  { fontSize: 22, color: '#FFF', fontWeight: '800' },
  actionLbl:   { fontSize: 11, color: C.t2, textAlign: 'center', fontWeight: '500' },
  keshbekWrap: { marginHorizontal: S.lg, borderRadius: R.lg, overflow: 'hidden', marginBottom: S.md },
  keshbekGrad: { paddingHorizontal: S.md, paddingVertical: 10 },
  keshbekTxt:  { color: '#FFF', fontWeight: '700', fontSize: 13 },
  bannerCard:  { borderRadius: R.xl, padding: S.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 100 },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  bannerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  bannerDots:  { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: S.md },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive:   { width: 18, backgroundColor: C.primary },
  sec:         { paddingHorizontal: S.lg, marginBottom: S.lg },
  secHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  secTitle:    { fontSize: 16, fontWeight: '700', color: C.t1, marginBottom: S.sm },
  seeAll:      { color: C.primaryLight, fontSize: 14, fontWeight: '600' },
  transferBox: { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, paddingHorizontal: S.md, height: 52, borderWidth: 1, borderColor: C.border },
  transferPh:  { flex: 1, color: C.t3, fontSize: 14 },
  savedCard:   { position: 'relative', width: 110, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.sm, borderWidth: 1, borderColor: C.border, gap: 4 },
  savedName:   { fontSize: 11, fontWeight: '600', color: C.t1, lineHeight: 15 },
  savedSub:    { fontSize: 11, color: C.primaryLight, fontWeight: '600' },
  badge:       { position: 'absolute', top: 6, right: 6, backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: 5, paddingVertical: 2 },
  badgeTxt:    { color: '#FFF', fontSize: 8, fontWeight: '800' },
  svcCard:     { position: 'relative', width: 96, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  svcLabel:    { fontSize: 10, color: C.t2, textAlign: 'center', lineHeight: 14 },
  txGroup:     { gap: 8 },
  txRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  txIcon:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  txIconTxt:   { fontSize: 18, fontWeight: '800' },
  txInfo:      { flex: 1 },
  txName:      { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 3 },
  txTime:      { fontSize: 11, color: C.t3 },
  txAmt:       { fontSize: 14, fontWeight: '800' },
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTxt:    { color: C.t3, fontSize: 14 },
  widgetBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
  widgetTxt:   { color: C.primaryLight, fontWeight: '700', fontSize: 14 },
});
