import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Switch,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { C, S, R } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';
import { api } from '../../services/api';

// ── Proper types (any o'rniga) ────────────────────────────────────────────────
interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  showArrow?: boolean;
  isLast?: boolean;
}
interface MenuToggleProps {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}
type Lang = 'uz' | 'ru' | 'en';

const BIO_KEY = 'bio_enabled';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const [bio, setBio] = useState(false);

  // FIX 1: bio AsyncStorage/SecureStore'da saqlanadi — app qayta ochilganda saqlanadi
  useEffect(() => {
    SecureStore.getItemAsync(BIO_KEY).then(v => {
      if (v === 'true') setBio(true);
    });
  }, []);

  async function toggleBio(v: boolean) {
    if (v) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biometrikani yoqish',
      });
      if (result.success) {
        setBio(true);
        await SecureStore.setItemAsync(BIO_KEY, 'true');
      }
    } else {
      setBio(false);
      await SecureStore.setItemAsync(BIO_KEY, 'false');
    }
  }

  // FIX 2: 'en' tipi ham qo'shildi
  function handleLangChange(l: Lang) {
    changeLang(l);
    api.setLanguage(l).catch(() => {});
  }

  function handleLogout() {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const kycStatus = user?.kyc_status ?? 'unverified';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          {/* FIX 3: backBtn onPress yo'q edi */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('profile')}</Text>
          {/* FIX 4: editBtn onPress yo'q edi */}
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => router.push('/modals/edit-profile')}
            hitSlop={8}
          >
            <Text style={s.editTxt}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileName}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
          <View style={s.verifiedBadge}>
            <Text style={{ fontSize: 16, color: C.primary }}>✓</Text>
          </View>
        </View>

        <View style={s.infoCardsRow}>
          <TouchableOpacity style={s.infoCard} activeOpacity={0.7}>
            <View style={[s.infoCardIcon, { backgroundColor: C.primaryBg }]}>
              <Text style={[s.infoCardIconTxt, { color: C.primary }]}>me+</Text>
            </View>
            <Text style={s.infoCardTitle}>payme plus</Text>
            <Text style={s.infoCardSub}>Bitta obuna —{'\n'}ko'plab imkoniyatlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.infoCard} activeOpacity={0.7}>
            <View style={[s.infoCardIcon, { backgroundColor: C.warningBg }]}>
              <Text style={{ fontSize: 22 }}>⬡</Text>
            </View>
            <Text style={s.infoCardBig}>0</Text>
            <Text style={s.infoCardSub}>payme{'\n'}people'dagi ba...</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.mibBanner} activeOpacity={0.8}>
          <View style={s.mibIcon}><Text style={{ fontSize: 32 }}>📩</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.mibTitle}>MIB jarimalari{'\n'}haqida xabarnomalar</Text>
            <Text style={s.mibSub}>Bepul va batafsil</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Sozlamalar</Text>

        {/* FIX 5: har bir groupdagi oxirgi item'ga isLast={true} — pastki border yo'qoladi */}
        <View style={s.menuGroup}>
          <MenuItem icon="🖼" label="Mavzu" value="Tizimli" showArrow onPress={() => {}} />
          <MenuItem icon="⊞" label="Vidjetlar sozlamasi" showArrow onPress={() => {}} isLast />
        </View>

        <View style={s.menuGroup}>
          <MenuItem icon="🔒" label="Xavfsizlik" showArrow onPress={() => router.push('/(auth)/create-pin')} />
          <MenuItem icon="🛡" label="Ruxsat" showArrow onPress={() => {}} isLast />
        </View>

        <View style={s.menuGroup}>
          <MenuItem icon="🏷" label="Harakatlar" showArrow onPress={() => {}} />
          <MenuItem
            icon="🌐"
            label="Ilova tili"
            value={lang === 'uz' ? "O'zbekcha" : lang === 'ru' ? 'Русский' : 'English'}
            showArrow
            onPress={() => {
              Alert.alert('Tilni tanlang', '', [
                { text: "O'zbekcha", onPress: () => handleLangChange('uz') },
                { text: 'Русский', onPress: () => handleLangChange('ru') },
                { text: 'English', onPress: () => handleLangChange('en') },
                { text: 'Bekor', style: 'cancel' },
              ]);
            }}
          />
          {/* FIX 6: showArrow qo'shildi — oxirgi element ham navigatsiyaga ishora qiladi */}
          <MenuItem icon="🎧" label="Qo'llab-quvvatlash xizmati" showArrow onPress={() => {}} isLast />
        </View>

        <View style={s.menuGroup}>
          <MenuItem icon="↪️" label="Profilni almashtirish" showArrow onPress={() => {}} isLast />
        </View>

        <View style={s.menuGroup}>
          <MenuItem icon="🔑" label={t('pinCode')} showArrow onPress={() => router.push('/(auth)/create-pin')} />
          <MenuToggle icon="👆" label={t('biometric')} value={bio} onChange={toggleBio} isLast />
        </View>

        <View style={s.menuGroup}>
          <MenuItem
            icon="🪪"
            label="Pasport (KYC)"
            value={kycStatus === 'verified' ? '✅' : '⏳'}
            showArrow
            onPress={() => router.push('/modals/kyc')}
            isLast
          />
        </View>

        <View style={s.linksSection}>
          {/* FIX 7: link'larga onPress placeholder qo'shildi */}
          {[
            "Ma'lumotlarni qayta ishlashga rozilik",
            'Ommaviy oferta',
            'Maxfiylik siyosati',
            "P2P o'tkazmalar uchun oferta",
          ].map(txt => (
            <TouchableOpacity key={txt} onPress={() => {}}>
              <Text style={s.linkTxt}>{txt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.version}>Talqin 2.0.0</Text>

        <View style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={s.logoutTxt}>🚪 {t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, value, onPress, showArrow = false, isLast = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[s.menuItem, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={s.menuIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={{ fontSize: 13, color: C.t3 }}>{value}</Text>}
        {showArrow && <Text style={{ fontSize: 20, color: C.t4 }}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

function MenuToggle({ icon, label, value, onChange, isLast = false }: MenuToggleProps) {
  return (
    <View style={[s.menuItem, isLast && { borderBottomWidth: 0 }]}>
      <View style={s.menuIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={s.menuLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md },
  backBtn: { width: 36 },
  backTxt: { fontSize: 28, color: C.t2 },
  title: { fontSize: 18, fontWeight: '700', color: C.t1 },
  editBtn: { width: 36, alignItems: 'flex-end' },
  editTxt: { fontSize: 18 },
  profileSection: { paddingHorizontal: S.lg, marginBottom: S.lg, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  profileName: { fontSize: 28, fontWeight: '900', color: C.t1 },
  verifiedBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryBg, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  infoCardsRow: { flexDirection: 'row', paddingHorizontal: S.lg, gap: S.md, marginBottom: S.md },
  infoCard: { flex: 1, backgroundColor: C.elevated, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border, gap: 6 },
  infoCardIcon: { width: 44, height: 44, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  infoCardIconTxt: { fontSize: 14, fontWeight: '900' },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: C.t1 },
  infoCardBig: { fontSize: 22, fontWeight: '900', color: C.t1 },
  infoCardSub: { fontSize: 12, color: C.t3, lineHeight: 16 },
  mibBanner: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginHorizontal: S.lg, marginBottom: S.lg, backgroundColor: C.elevated, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border },
  mibIcon: { width: 56, height: 56, backgroundColor: C.card, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  mibTitle: { fontSize: 15, fontWeight: '700', color: C.t1, lineHeight: 20 },
  mibSub: { fontSize: 12, color: C.t3, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.t1, paddingHorizontal: S.lg, marginBottom: S.sm, marginTop: S.sm },
  menuGroup: { marginHorizontal: S.lg, marginBottom: S.md, backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  menuIcon: { width: 34, height: 34, backgroundColor: C.card, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', marginRight: S.md },
  menuLabel: { flex: 1, fontSize: 15, color: C.t1 },
  linksSection: { paddingHorizontal: S.lg, marginTop: S.md, gap: S.md },
  linkTxt: { fontSize: 14, color: C.primaryLight },
  version: { textAlign: 'center', fontSize: 12, color: C.t3, marginTop: S.xl },
  logoutBtn: { backgroundColor: C.dangerBg, borderRadius: R.lg, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.dangerBorder },
  logoutTxt: { color: C.danger, fontWeight: '700', fontSize: 15 },
});