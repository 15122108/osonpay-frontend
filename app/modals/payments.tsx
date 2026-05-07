import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { C, S, R } from '../../constants/theme';

const SAVED_PAYMENTS = [
  { id: '1', name: 'Mening telefon...', sub: '+99899941...', icon: '📶', badge: '1%' },
  { id: '2', name: 'Uzonline', sub: "5 100 so'm", icon: '🌐', badge: '1%' },
  { id: '3', name: "HUDUDGAZTA'...", sub: "55 799.51 so'...", icon: '🔥', badge: '1%' },
];

// FIX: Removed unused `debt` property
const MY_HOME = [
  { id: '1', title: 'Navoiy viloyati Navbaxor tumani...' },
];

const SERVICES = [
  { id: '1', icon: '📋', label: "Ko'p\nqo'llaniladigan", badge: '1%' },
  { id: '2', icon: '📱', label: 'Mobil\noperatorlar', badge: '1%' },
  { id: '3', icon: '🌐', label: 'Internet\nprovayderlar', badge: '1%' },
  { id: '4', icon: '🏠', label: 'Kommunal', badge: null },
];

// FIX: Extracted reusable Badge component to avoid duplication
const Badge = ({ label, style, textStyle }) => (
  <View style={[s.badge, style]}>
    <Text style={[s.badgeTxt, textStyle]}>{label}</Text>
  </View>
);

export default function Payments() {
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={s.back}>✕</Text>
        </TouchableOpacity>
        <Text style={s.title}>To'lov</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.searchBox}>
        <Text style={{ fontSize: 16, color: C.t3 }}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Izlash"
          placeholderTextColor={C.t3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Saqlangan to'lovlar */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Saqlangan to'lovlar</Text>
            <TouchableOpacity onPress={() => {}} hitSlop={8}>
              <Text style={s.seeAll}>Yana</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {SAVED_PAYMENTS.map(p => (
              <TouchableOpacity key={p.id} style={s.savedCard} activeOpacity={0.7} onPress={() => {}}>
                {/* FIX: Used shared Badge component */}
                {p.badge && <Badge label={p.badge} style={s.absTopRight} />}
                {/* FIX: Removed conflicting marginBottom — gap on parent handles spacing */}
                <Text style={{ fontSize: 26 }}>{p.icon}</Text>
                <Text style={s.savedName} numberOfLines={2}>{p.name}</Text>
                <Text style={s.savedSub} numberOfLines={1}>{p.sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Xizmatlar to'lovi */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Xizmatlar to'lovi</Text>
            <TouchableOpacity onPress={() => {}} hitSlop={8}>
              <Text style={s.seeAll}>Yana</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {SERVICES.map(sv => (
              <TouchableOpacity key={sv.id} style={s.serviceCard} activeOpacity={0.7} onPress={() => {}}>
                {/* FIX: Used shared Badge component */}
                {sv.badge && <Badge label={sv.badge} style={s.absTopRight} />}
                <Text style={{ fontSize: 28, marginBottom: 6 }}>{sv.icon}</Text>
                <Text style={s.svLabel}>{sv.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mening uyim */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Mening uyim</Text>
            <TouchableOpacity onPress={() => {}} hitSlop={8}>
              <Text style={s.seeAll}>Yana</Text>
            </TouchableOpacity>
          </View>
          {MY_HOME.map(h => (
            <TouchableOpacity key={h.id} style={s.homeCard} activeOpacity={0.7} onPress={() => {}}>
              <Text style={{ fontSize: 28 }}>🏠</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.homeTitle} numberOfLines={1}>{h.title}</Text>
                <View style={s.noDeptBadge}>
                  <Text style={s.noDeptTxt}>Qarzlar yo'q</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, color: C.t4 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Joylarda to'lov */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Joylarda to'lov</Text>
            <TouchableOpacity onPress={() => {}} hitSlop={8}>
              <Text style={s.seeAll}>Yana</Text>
            </TouchableOpacity>
          </View>
          {/* FIX: Removed alignItems:'center' — conflicts with flexWrap:'wrap' on small screens */}
          <View style={s.geoWarning}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={s.geoTxt}>To'g'ri ishlashi uchun geolokatsiyani yoqish lozim</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={s.geoBtn}>Yoqish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Topolmadingizmi */}
        <View style={s.section}>
          <View style={s.notFoundBox}>
            <Text style={s.notFoundTxt}>
              Izlaganingizni topolmadingizmi?{'\n'}Bizga yozing — qo'shishga harakat qil...
            </Text>
            <TouchableOpacity style={s.notFoundBtn} onPress={() => {}}>
              <Text style={s.notFoundBtnTxt}>Bizga yozing</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.lg, paddingVertical: S.md,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  back: { fontSize: 22, color: C.t2, width: 32 },
  title: { fontSize: 18, fontWeight: '700', color: C.t1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    margin: S.lg, backgroundColor: C.elevated, borderRadius: R.full,
    paddingHorizontal: S.md, height: 46, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.t1, fontSize: 14 },
  section: { paddingHorizontal: S.lg, marginBottom: S.lg },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: S.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.t1 },
  seeAll: { color: C.primaryLight, fontSize: 14, fontWeight: '600' },

  // FIX: Added position:'relative' explicitly; removed conflicting gap:4 (parent gap handles spacing)
  savedCard: {
    position: 'relative',
    width: 120, backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.md, borderWidth: 1, borderColor: C.border, gap: S.sm,
  },
  savedName: { fontSize: 12, fontWeight: '600', color: C.t1, lineHeight: 16 },
  savedSub: { fontSize: 11, color: C.primaryLight, fontWeight: '600' },

  // FIX: Added position:'relative' explicitly
  serviceCard: {
    position: 'relative',
    width: 100, backgroundColor: C.elevated, borderRadius: R.lg,
    padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  svLabel: { fontSize: 11, color: C.t2, textAlign: 'center', lineHeight: 15 },

  // FIX: Shared badge style replacing savedBadge & svBadge duplicates
  badge: {
    backgroundColor: C.primary, borderRadius: R.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  absTopRight: { position: 'absolute', top: 8, right: 8 },

  homeCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.elevated, borderRadius: R.xl,
    padding: S.md, borderWidth: 1, borderColor: C.border,
  },
  homeTitle: { fontSize: 14, fontWeight: '600', color: C.t1, marginBottom: 6 },
  noDeptBadge: {
    backgroundColor: C.primaryBg, borderRadius: R.full,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  noDeptTxt: { color: C.primaryLight, fontSize: 12, fontWeight: '600' },

  // FIX: Removed alignItems:'center' — breaks layout when flexWrap:'wrap' is active
  geoWarning: {
    backgroundColor: C.warningBg, borderRadius: R.xl, padding: S.md,
    gap: S.sm, borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', flexWrap: 'wrap',
  },
  geoTxt: { fontSize: 13, color: C.warning, fontWeight: '500', flex: 1 },
  geoBtn: { color: C.warning, fontWeight: '800', fontSize: 15 },

  notFoundBox: {
    backgroundColor: C.elevated, borderRadius: R.xl, padding: S.lg,
    alignItems: 'center', gap: S.md, borderWidth: 1, borderColor: C.border,
  },
  notFoundTxt: { fontSize: 14, color: C.t2, textAlign: 'center', lineHeight: 20 },
  // FIX: Replaced S.sm + 4 arithmetic with a plain constant to avoid runtime issues if S is undefined
  notFoundBtn: {
    backgroundColor: C.primaryBg, borderRadius: R.lg,
    paddingHorizontal: S.xl, paddingVertical: 12,
    borderWidth: 1, borderColor: C.primaryBorder,
  },
  notFoundBtnTxt: { color: C.primaryLight, fontWeight: '700', fontSize: 14 },
});
