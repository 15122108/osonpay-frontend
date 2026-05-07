import React, { useState, useEffect, useCallback, useRef } from ‘react’;
import {
View, Text, ScrollView, TouchableOpacity, StyleSheet,
SafeAreaView, RefreshControl, ActivityIndicator, FlatList, Animated, Dimensions,
} from ‘react-native’;
import { LinearGradient } from ‘expo-linear-gradient’;
import { router } from ‘expo-router’;
import { C, S, R, formatMoney } from ‘../../constants/theme’;
import { api } from ‘../../services/api’;
import { useAuth } from ‘../../hooks/useAuth’;
import { useLang } from ‘../../hooks/useLang’;

const { width } = Dimensions.get(‘window’);

const BANNERS = [
{ id: ‘1’, title: “10% keshbek bilan”, sub: “Barcha to’lovlarda”, color: C.gBrand },
{ id: ‘2’, title: “+50 000 so’m bonus”, sub: “Do’stingizni taklif qiling”, color: C.gPrimary },
{ id: ‘3’, title: “Kartangizni bog’lang”, sub: “Va keshbek oling”, color: C.gSuccess },
];

const QUICK_SERVICES = [
{ icon: ‘📱’, label: ‘Mobil\noperatorlar’, badge: ‘1%’ },
{ icon: ‘🌐’, label: ‘Internet\nprovayderlar’, badge: ‘1%’ },
{ icon: ‘⚡️’, label: “Kommunal\nto’lovlar”, badge: ‘1%’ },
{ icon: ‘🏦’, label: ‘Bank\nxizmatlari’, badge: null },
];

export default function Home() {
const { user, refresh } = useAuth();
const { t } = useLang();
const [txs, setTxs] = useState<any[]>([]);
const [stats, setStats] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [balanceHidden, setBalanceHidden] = useState(false);
const [bannerIdx, setBannerIdx] = useState(0);
const bannerRef = useRef<FlatList>(null);
const fadeAnim = useRef(new Animated.Value(1)).current;

async function load() {
try {
const [th, ts] = await Promise.all([api.getHistory(1), api.getStats()]);
setTxs(th.transactions?.slice(0, 5) || []);
setStats(ts.stats);
} catch {} finally {
setLoading(false);
}
}

useEffect(() => { load(); }, []);

useEffect(() => {
const timer = setInterval(() => {
const next = (bannerIdx + 1) % BANNERS.length;
setBannerIdx(next);
bannerRef.current?.scrollToIndex({ index: next, animated: true });
}, 3500);
return () => clearInterval(timer);
}, [bannerIdx]);

const onRefresh = useCallback(async () => {
setRefreshing(true);
await Promise.all([refresh(), load()]);
setRefreshing(false);
}, []);

function toggleBalance() {
Animated.sequence([
Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
]).start();
setBalanceHidden(h => !h);
}

const ACTIONS = [
{ label: t(‘send’), icon: ‘↑’, grad: C.gBrand, route: ‘/modals/send’ },
{ label: t(‘receive’), icon: ‘↓’, grad: C.gSuccess, route: ‘/modals/receive’ },
{ label: t(‘topup’), icon: ‘+’, grad: C.gOrange, route: ‘/modals/topup’ },
{ label: t(‘payment’), icon: ‘⊙’, grad: C.gPrimary, route: ‘/modals/payments’ },
];

return (
<SafeAreaView style={s.root}>
<ScrollView
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
contentContainerStyle={{ paddingBottom: 100 }}
showsVerticalScrollIndicator={false}
>
{/* Header */}
<View style={s.header}>
<View style={s.headerLeft}>
<View style={s.avatar}>
<Text style={s.avatarTxt}>{user?.fullName?.slice(0, 2)?.toUpperCase() || ‘OP’}</Text>
</View>
<View style={s.mascot}>
<Text style={{ fontSize: 28 }}>🧑‍💼</Text>
</View>
</View>
<View style={s.headerRight}>
<TouchableOpacity style={s.iconBtn}><Text style={{ fontSize: 20 }}>🔍</Text></TouchableOpacity>
<TouchableOpacity style={s.iconBtn}><Text style={{ fontSize: 20 }}>🔔</Text></TouchableOpacity>
</View>
</View>

```
    {/* Balance */}
    <View style={s.balSection}>
      <Text style={s.balLabel}>{t('mainBalance')}</Text>
      <View style={s.balRow}>
        <TouchableOpacity onPress={toggleBalance} style={s.eyeBtn}>
          <Text style={{ fontSize: 20 }}>{balanceHidden ? '👁' : '🙈'}</Text>
        </TouchableOpacity>
        <Animated.Text style={[s.balAmount, { opacity: fadeAnim }]}>
          {balanceHidden ? '●●●●●' : `${formatMoney(user?.balance || 0)} so'm`}
        </Animated.Text>
        <TouchableOpacity style={s.moreBtn}>
          <Text style={s.moreDots}>···</Text>
        </TouchableOpacity>
      </View>
      {stats && (
        <Text style={s.balSub}>Maydagi chiqim {formatMoney(stats.total_out || 0)} so'm</Text>
      )}
    </View>

    {/* Quick actions */}
    <View style={s.actionsRow}>
      {ACTIONS.map(a => (
        <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)} activeOpacity={0.8} style={s.actionWrap}>
          <LinearGradient colors={a.grad} style={s.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.actionIcon}>{a.icon}</Text>
          </LinearGradient>
          <Text style={s.actionLbl}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Keshbek banner */}
    {stats && (
      <TouchableOpacity style={s.keshbekBanner} activeOpacity={0.8}>
        <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.keshbekGrad}>
          <Text style={s.keshbekTxt}>
            🎁 {formatMoney(stats.total_count * 180)} me+ keshbekingiz bor {'›'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )}

    {/* Banner slider */}
    <FlatList
      ref={bannerRef}
      data={BANNERS}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={i => i.id}
      style={s.bannerList}
      onMomentumScrollEnd={e => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / (width - S.lg * 2));
        setBannerIdx(idx);
      }}
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.9} style={{ width: width - S.lg * 2, marginHorizontal: 0 }}>
          <LinearGradient colors={item.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bannerCard}>
            <View>
              <Text style={s.bannerTitle}>{item.title}</Text>
              <Text style={s.bannerSub}>{item.sub}</Text>
            </View>
            <Text style={{ fontSize: 40 }}>✈️</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    />
    <View style={s.bannerDots}>
      {BANNERS.map((_, i) => (
        <View key={i} style={[s.dot, i === bannerIdx && s.dotActive]} />
      ))}
    </View>

    {/* Pul o'tkazish section */}
    <View style={s.section}>
      <Text style={s.sectionTitle}>Pul o'tkazish</Text>
      <View style={s.transferInput}>
        <Text style={{ fontSize: 18, color: C.t3 }}>💳</Text>
        <Text style={s.transferPlaceholder}>Karta yoki telefon raqami</Text>
        <TouchableOpacity style={s.qrSmall}><Text style={{ fontSize: 18 }}>⊞</Text></TouchableOpacity>
      </View>
    </View>

    {/* Xizmatlar to'lovi */}
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>Xizmatlar to'lovi</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cards' as any)}>
          <Text style={s.seeAll}>Yana</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
        {QUICK_SERVICES.map((sv, i) => (
          <TouchableOpacity key={i} style={s.serviceCard} activeOpacity={0.7}>
            {sv.badge && (
              <View style={s.serviceBadge}>
                <Text style={s.serviceBadgeTxt}>{sv.badge}</Text>
              </View>
            )}
            <Text style={{ fontSize: 28, marginBottom: 6 }}>{sv.icon}</Text>
            <Text style={s.serviceLabel}>{sv.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* Recent transactions */}
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{t('recentTx')}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/history' as any)}>
          <Text style={s.seeAll}>{t('seeAll')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
      ) : txs.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 36 }}>📭</Text>
          <Text style={s.emptyTxt}>Tranzaksiyalar yo'q</Text>
        </View>
      ) : (
        <View style={s.txGroup}>
          {txs.map(tx => {
            const isCredit = tx.receiver_id === user?.id;
            const amt = parseFloat(tx.amount);
            const name = isCredit ? (tx.sender_name || 'Tizim') : (tx.receiver_name || 'Tizim');
            const typeColor: any = { send: C.primary, receive: C.success, payment: C.danger, topup: C.warning };
            const typeIcon: any = { send: '↑', receive: '↓', payment: '⊙', topup: '+' };
            return (
              <TouchableOpacity
                key={tx.id}
                style={s.txRow}
                onPress={() => router.push({ pathname: '/modals/transaction', params: { id: tx.id } })}
                activeOpacity={0.7}
              >
                <View style={[s.txIcon, { backgroundColor: (typeColor[tx.type] || C.primary) + '20' }]}>
                  <Text style={[s.txIconTxt, { color: typeColor[tx.type] || C.primary }]}>
                    {typeIcon[tx.type] || '·'}
                  </Text>
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txName}>{name}</Text>
                  <Text style={s.txTime}>
                    {new Date(tx.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={[s.txAmt, { color: isCredit ? C.success : C.t1 }]}>
                  {isCredit ? '+' : '-'}{formatMoney(amt)} so'm
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  </ScrollView>
</SafeAreaView>
```

);
}

const s = StyleSheet.create({
root: { flex: 1, backgroundColor: C.bg },
header: {
flexDirection: ‘row’, justifyContent: ‘space-between’, alignItems: ‘center’,
paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md,
},
headerLeft: { flexDirection: ‘row’, alignItems: ‘center’, gap: S.sm },
avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: ‘center’, justifyContent: ‘center’ },
avatarTxt: { fontSize: 14, fontWeight: ‘800’, color: ‘#FFF’ },
mascot: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.elevated, alignItems: ‘center’, justifyContent: ‘center’, borderWidth: 1, borderColor: C.border },
headerRight: { flexDirection: ‘row’, gap: S.sm },
iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.elevated, alignItems: ‘center’, justifyContent: ‘center’, borderWidth: 1, borderColor: C.border },
balSection: { paddingHorizontal: S.lg, marginBottom: S.md },
balLabel: { fontSize: 14, color: C.t2, marginBottom: 4 },
balRow: { flexDirection: ‘row’, alignItems: ‘center’, gap: S.sm },
eyeBtn: { padding: 4 },
balAmount: { fontSize: 32, fontWeight: ‘900’, color: C.t1, flex: 1 },
moreBtn: { padding: 8 },
moreDots: { fontSize: 22, color: C.t3 },
balSub: { fontSize: 12, color: C.t3, marginTop: 4 },
actionsRow: { flexDirection: ‘row’, justifyContent: ‘space-around’, paddingHorizontal: S.lg, marginBottom: S.md },
actionWrap: { alignItems: ‘center’, gap: 6 },
actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: ‘center’, justifyContent: ‘center’ },
actionIcon: { fontSize: 22, color: ‘#FFF’, fontWeight: ‘800’ },
actionLbl: { fontSize: 11, color: C.t2, textAlign: ‘center’, fontWeight: ‘500’ },
keshbekBanner: { marginHorizontal: S.lg, borderRadius: R.lg, overflow: ‘hidden’, marginBottom: S.md },
keshbekGrad: { paddingHorizontal: S.md, paddingVertical: 10 },
keshbekTxt: { color: ‘#FFF’, fontWeight: ‘700’, fontSize: 13 },
bannerList: { paddingHorizontal: S.lg, marginBottom: S.sm },
bannerCard: { borderRadius: R.xl, padding: S.lg, flexDirection: ‘row’, justifyContent: ‘space-between’, alignItems: ‘center’, minHeight: 110 },
bannerTitle: { fontSize: 18, fontWeight: ‘800’, color: ‘#FFF’, marginBottom: 4 },
bannerSub: { fontSize: 12, color: ‘rgba(255,255,255,0.8)’ },
bannerDots: { flexDirection: ‘row’, justifyContent: ‘center’, gap: 6, marginBottom: S.md },
dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
dotActive: { width: 18, backgroundColor: C.primary },
section: { paddingHorizontal: S.lg, marginBottom: S.lg },
sectionHead: { flexDirection: ‘row’, justifyContent: ‘space-between’, alignItems: ‘center’, marginBottom: S.md },
sectionTitle: { fontSize: 16, fontWeight: ‘700’, color: C.t1, marginBottom: S.sm },
seeAll: { color: C.primaryLight, fontSize: 14, fontWeight: ‘600’ },
transferInput: { flexDirection: ‘row’, alignItems: ‘center’, gap: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, paddingHorizontal: S.md, height: 52, borderWidth: 1, borderColor: C.border },
transferPlaceholder: { flex: 1, color: C.t3, fontSize: 14 },
qrSmall: { padding: 4 },
serviceCard: { width: 100, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, alignItems: ‘center’, borderWidth: 1, borderColor: C.border },
serviceBadge: { position: ‘absolute’, top: 6, right: 6, backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: 6, paddingVertical: 2 },
serviceBadgeTxt: { color: ‘#FFF’, fontSize: 9, fontWeight: ‘800’ },
serviceLabel: { fontSize: 11, color: C.t2, textAlign: ‘center’, lineHeight: 15 },
txGroup: { gap: 8 },
txRow: { flexDirection: ‘row’, alignItems: ‘center’, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: ‘center’, justifyContent: ‘center’, marginRight: S.md },
txIconTxt: { fontSize: 20, fontWeight: ‘800’ },
txInfo: { flex: 1 },
txName: { fontSize: 14, fontWeight: ‘600’, color: C.t1, marginBottom: 3 },
txTime: { fontSize: 11, color: C.t3 },
txAmt: { fontSize: 14, fontWeight: ‘800’ },
empty: { alignItems: ‘center’, paddingVertical: 40, gap: 12 },
emptyTxt: { color: C.t3, fontSize: 14 },
});