// app/modals/payments.tsx
// MUHIM: Birorta ham hardcoded ma'lumot yo'q.
// Barcha to'lovlar, manzillar, xizmatlar — API dan keladi.

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

interface SavedPayment {
  id: string;
  name: string;
  sub: string;
  icon?: string;
  badge?: string;
}

interface HomeAddress {
  id: string;
  title: string;
  region?: string;
  hasDebt?: boolean;
  debtAmount?: number;
}

interface Service {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  badge?: string;
}

export default function Payments() {
  const { t } = useLang();
  const [search, setSearch]         = useState('');
  const [saved, setSaved]           = useState<SavedPayment[]>([]);
  const [homes, setHomes]           = useState<HomeAddress[]>([]);
  const [services, setServices]     = useState<Service[]>([]);
  const [loadingSaved, setLS]       = useState(true);
  const [loadingHomes, setLH]       = useState(true);
  const [loadingServices, setLSvc]  = useState(true);

  useEffect(() => {
    // Saqlangan to'lovlar — faqat shu foydalanuvchining o'ziniki
    api.getSavedPayments()
      .then(d => setSaved(d || []))
      .catch(() => setSaved([]))
      .finally(() => setLS(false));

    // Mening uyim — foydalanuvchi qo'shgan manzillar
    api.getMyHome()
      .then(d => setHomes(d || []))
      .catch(() => setHomes([]))
      .finally(() => setLH(false));

    // Xizmatlar — backenddan keladi
    api.getServices()
      .then(d => setServices(d || []))
      .catch(() => setServices([]))
      .finally(() => setLSvc(false));
  }, []);

  // Qidiruv filtri
  const filteredSaved = saved.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={s.back}>✕</Text>
        </TouchableOpacity>
        <Text style={s.title}>To'lov</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Qidiruv */}
      <View style={s.searchBox}>
        <Text style={{ fontSize: 15, color: C.t3 }}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Izlash"
          placeholderTextColor={C.t3}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Text style={{ color: C.t3 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Saqlangan to'lovlar (API dan) ─────────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Saqlangan to'lovlar</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={s.more}>Yana</Text>
            </TouchableOpacity>
          </View>

          {loadingSaved ? (
            <ActivityIndicator color={C.primary} />
          ) : filteredSaved.length === 0 ? (
            // Hali saqlangan to'lov yo'q
            <TouchableOpacity style={s.emptyBox} activeOpacity={0.7}>
              <Text style={s.emptyTxt}>+ Birinchi to'lovni saqlang</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
              {filteredSaved.map(p => (
                <TouchableOpacity key={p.id} style={s.savedCard} activeOpacity={0.7}>
                  {p.badge && (
                    <View style={s.badge}><Text style={s.badgeTxt}>{p.badge}</Text></View>
                  )}
                  <Text style={{ fontSize: 24 }}>{p.icon || '💳'}</Text>
                  <Text style={s.savedName} numberOfLines={2}>{p.name}</Text>
                  <Text style={s.savedSub} numberOfLines={1}>{p.sub}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Xizmatlar to'lovi (API dan) ───────────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Xizmatlar to'lovi</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={s.more}>Yana</Text>
            </TouchableOpacity>
          </View>

          {loadingServices ? (
            <ActivityIndicator color={C.primary} />
          ) : services.length === 0 ? (
            <Text style={{ color: C.t3, fontSize: 13 }}>Xizmatlar yuklanmadi</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
              {services.map(sv => (
                <TouchableOpacity
                  key={sv.id}
                  style={s.svcCard}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/modals/service-detail', params: { id: sv.id } } as any)}
                >
                  {sv.badge && (
                    <View style={s.badge}><Text style={s.badgeTxt}>{sv.badge}</Text></View>
                  )}
                  <Text style={{ fontSize: 26, marginBottom: 6 }}>{sv.icon || '💳'}</Text>
                  <Text style={s.svcLabel} numberOfLines={2}>{sv.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Mening uyim (API dan) ─────────────────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Mening uyim</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={s.more}>Yana</Text>
            </TouchableOpacity>
          </View>

          {loadingHomes ? (
            <ActivityIndicator color={C.primary} />
          ) : homes.length === 0 ? (
            // Foydalanuvchi hali manzil qo'shmagan
            <TouchableOpacity style={s.addHomeBtn} activeOpacity={0.7}>
              <Text style={s.addHomeTxt}>+ Manzil qo'shish</Text>
            </TouchableOpacity>
          ) : (
            homes.map(h => (
              <TouchableOpacity key={h.id} style={s.homeCard} activeOpacity={0.7}>
                <Text style={{ fontSize: 26 }}>🏠</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.homeTitle} numberOfLines={1}>{h.title}</Text>
                  {h.hasDebt ? (
                    <View style={s.debtBadge}>
                      <Text style={s.debtTxt}>
                        Qarz: {h.debtAmount ? `${h.debtAmount} so'm` : 'bor'}
                      </Text>
                    </View>
                  ) : (
                    <View style={s.noDebtBadge}>
                      <Text style={s.noDebtTxt}>Qarzlar yo'q</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 18, color: C.t4 }}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Joylarda to'lov ───────────────────────────────────── */}
        <View style={s.sec}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Joylarda to'lov</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={s.more}>Yana</Text>
            </TouchableOpacity>
          </View>
          <View style={s.geoBox}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={s.geoTxt}>To'g'ri ishlashi uchun geolokatsiyani yoqish lozim</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={s.geoBtn}>Yoqish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Topolmadingizmi ───────────────────────────────────── */}
        <View style={s.sec}>
          <View style={s.notFoundBox}>
            <Text style={s.notFoundTxt}>
              Izlaganingizni topolmadingizmi?{'\n'}Bizga yozing — qo'shishga harakat qilamiz
            </Text>
            <TouchableOpacity style={s.notFoundBtn} hitSlop={8}>
              <Text style={s.notFoundBtnTxt}>Bizga yozing</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  back:           { fontSize: 22, color: C.t2, width: 32 },
  title:          { fontSize: 18, fontWeight: '700', color: C.t1 },
  searchBox:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, margin: S.lg, backgroundColor: C.elevated, borderRadius: R.full, paddingHorizontal: S.md, height: 44, borderWidth: 1, borderColor: C.border },
  searchInput:    { flex: 1, color: C.t1, fontSize: 14 },
  sec:            { paddingHorizontal: S.lg, marginBottom: S.lg },
  secHead:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  secTitle:       { fontSize: 16, fontWeight: '700', color: C.t1 },
  more:           { color: C.primaryLight, fontSize: 14, fontWeight: '600' },
  savedCard:      { position: 'relative', width: 110, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.sm, borderWidth: 1, borderColor: C.border, gap: 4 },
  savedName:      { fontSize: 11, fontWeight: '600', color: C.t1, lineHeight: 15 },
  savedSub:       { fontSize: 11, color: C.primaryLight, fontWeight: '600' },
  badge:          { position: 'absolute', top: 6, right: 6, backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: 5, paddingVertical: 2 },
  badgeTxt:       { color: '#FFF', fontSize: 8, fontWeight: '800' },
  svcCard:        { position: 'relative', width: 96, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  svcLabel:       { fontSize: 10, color: C.t2, textAlign: 'center', lineHeight: 14 },
  homeCard:       { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.elevated, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border, marginBottom: S.sm },
  homeTitle:      { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 6 },
  debtBadge:      { backgroundColor: C.dangerBg, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  debtTxt:        { color: C.danger, fontSize: 12, fontWeight: '600' },
  noDebtBadge:    { backgroundColor: C.primaryBg, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  noDebtTxt:      { color: C.primaryLight, fontSize: 12, fontWeight: '600' },
  addHomeBtn:     { backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  addHomeTxt:     { color: C.primaryLight, fontWeight: '600', fontSize: 14 },
  emptyBox:       { backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  emptyTxt:       { color: C.primaryLight, fontWeight: '600', fontSize: 13 },
  geoBox:         { backgroundColor: C.warningBg, borderRadius: R.xl, padding: S.md, gap: S.sm, borderWidth: 1, borderColor: C.warningBorder, flexDirection: 'row', flexWrap: 'wrap' },
  geoTxt:         { fontSize: 13, color: C.warning, fontWeight: '500', flex: 1 },
  geoBtn:         { color: C.warning, fontWeight: '800', fontSize: 14 },
  notFoundBox:    { backgroundColor: C.elevated, borderRadius: R.xl, padding: S.lg, alignItems: 'center', gap: S.md, borderWidth: 1, borderColor: C.border },
  notFoundTxt:    { fontSize: 14, color: C.t2, textAlign: 'center', lineHeight: 20 },
  notFoundBtn:    { backgroundColor: C.primaryBg, borderRadius: R.lg, paddingHorizontal: S.xl, paddingVertical: 12, borderWidth: 1, borderColor: C.primaryBorder },
  notFoundBtnTxt: { color: C.primaryLight, fontWeight: '700', fontSize: 14 },
});