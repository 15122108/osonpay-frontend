import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

type CardItem = {
  id: string;
  card_number_masked: string;
  card_holder: string;
  expiry_month: string;
  expiry_year: string | number;
  balance: number;
  card_type?: string;
  color_from?: string;
  color_to?: string;
  is_default?: boolean;
};

const SERVIS_SECTIONS = [
  {
    title: 'Asosiy xizmatlar',
    items: [
      { icon: '🚇', label: 'Metro va avtobus', sub: "Payme'ning o'zida oddiy to'lov" },
      { icon: '⏱', label: "Keyinroq to'lash", sub: "Hozir to'lang, keyin qaytarasiz" },
      { icon: '💎', label: 'payme plus', sub: "Komissiyasiz pul o'tkazmalari" },
      { icon: '🛡', label: 'MIB jarimalari', sub: 'Jarimalarni tekshiring' },
      { icon: '✈️', label: '10% Keshbek bilan aviachiptalar', sub: null },
      { icon: '🎟', label: 'payme tickets', sub: 'Turli tadbirlar uchun chiptalar' },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { icon: '🏦', label: "Hisob raqamiga to'lov", sub: null },
      { icon: '🤲', label: 'Xayriya', sub: null },
      { icon: '💳', label: 'Visa+', sub: 'Telefon raqami orqali Visa' },
      { icon: '🏛', label: "Ma'lumotnomalar va davlat xizmatlari", sub: null },
      { icon: '🔔', label: 'Eslatmalar', sub: "To'lov haqida bildirishnoma" },
      { icon: '🌟', label: 'Hayotiy vaziyatlar', sub: 'Muhim hayotiy voqealar' },
    ],
  },
];

export default function Cards() {
  const { t } = useLang();
  const [tab, setTab] = useState<'cards' | 'services'>('cards');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState('');
  const [scanModal, setScanModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanAmount, setScanAmount] = useState('');
  const [scanLoading, setScanLoading] = useState(false);

  // FIX 1: catch bloki bo'sh edi — xato ko'rsatiladi; api.getCards() to'g'ridan array qaytaradi
  const load = useCallback(async () => {
    try {
      const data = await api.getCards();
      setCards(data || []);
    } catch (e: any) {
      Alert.alert(t('error'), e.message ?? 'Kartalarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function showQR() {
    try {
      const r = await api.getQR();
      setQrData(r.qr_data);
      setQrModal(true);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    }
  }

  // FIX 2: `||` operatorlari singan edi (dokument artefakti)
  async function payByQR() {
    if (!scanInput || !scanAmount || Number(scanAmount) < 1000) {
      Alert.alert(t('error'), "QR ma'lumot va summa kiriting (min 1 000 UZS)");
      return;
    }
    setScanLoading(true);
    try {
      await api.payByQR(scanInput, Number(scanAmount));
      // FIX 3: template literal singan edi
      Alert.alert('✅', `${formatMoney(Number(scanAmount))} UZS to'landi!`);
      closeScanModal();
      load();
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setScanLoading(false);
    }
  }

  // FIX 4: modal yopilganda input'lar reset qilinmayotgan edi
  function closeScanModal() {
    setScanModal(false);
    setScanInput('');
    setScanAmount('');
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.tabRow}>
        {(['cards', 'services'] as const).map(t_ => (
          <TouchableOpacity
            key={t_}
            style={[s.tabBtn, tab === t_ && s.tabBtnActive]}
            onPress={() => setTab(t_)}
          >
            <Text style={[s.tabTxt, tab === t_ && s.tabTxtActive]}>
              {t_ === 'cards' ? '💳 Kartalarim' : '⊞ Servislar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CARDS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'cards' && (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={C.primary}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <Text style={s.title}>{t('myCards')}</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => router.push('/modals/addcard' as any)}>
              <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtnGrad}>
                <Text style={s.addBtnTxt}>+ {t('addCard')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.qrRow}>
            <TouchableOpacity style={s.qrBtn} onPress={showQR}>
              <Text style={s.qrBtnIcon}>📲</Text>
              <Text style={s.qrBtnTxt}>QR kod</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.qrBtn} onPress={() => setScanModal(true)}>
              <Text style={s.qrBtnIcon}>⊞</Text>
              <Text style={s.qrBtnTxt}>QR to'lov</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.qrBtn} onPress={() => router.push('/modals/send' as any)}>
              <Text style={s.qrBtnIcon}>↑</Text>
              <Text style={s.qrBtnTxt}>O'tkazma</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
          ) : cards.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 60, marginBottom: S.md }}>💳</Text>
              <Text style={s.emptyTitle}>{t('noCards')}</Text>
              <Text style={s.emptyTxt}>{t('noCardsDesc')}</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/modals/addcard' as any)}>
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyBtnGrad}>
                  <Text style={s.emptyBtnTxt}>{t('addCard')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.list}>
              {cards.map(card => (
                <View key={card.id}>
                  {/* FIX 5: `||` operatorlari singan edi */}
                  <LinearGradient
                    colors={[card.color_from || '#7B2FBE', card.color_to || '#FF6B00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.card}
                  >
                    <View style={s.cardTop}>
                      <View>
                        <Text style={s.cardBalLbl}>Balans</Text>
                        <Text style={s.cardBal}>{formatMoney(card.balance)} UZS</Text>
                      </View>
                      <View style={s.cardTypeBadge}>
                        <Text style={s.cardType}>{(card.card_type || 'UZCARD').toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={s.cardNum}>•••• •••• •••• {card.card_number_masked?.slice(-4)}</Text>
                    <View style={s.cardBot}>
                      <Text style={s.cardHolder}>{card.card_holder}</Text>
                      {/* FIX 6: expiry_year raqam bo'lishi mumkin — String() bilan xavfsiz */}
                      <Text style={s.cardExp}>
                        {card.expiry_month}/{String(card.expiry_year ?? '').slice(-2)}
                      </Text>
                    </View>
                    {card.is_default && (
                      <View style={s.defTag}><Text style={s.defTxt}>Asosiy</Text></View>
                    )}
                    <View style={[s.deco, { width: 180, height: 180, top: -60, right: -40 }]} />
                  </LinearGradient>

                  <View style={s.cardActions}>
                    {!card.is_default && (
                      <TouchableOpacity
                        style={s.cardAction}
                        onPress={async () => { await api.setDefaultCard(card.id); load(); }}
                      >
                        <Text style={s.cardActionTxt}>⭐️ Asosiy</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[s.cardAction, s.cardActionDanger]}
                      onPress={() =>
                        Alert.alert("O'chirish", "Rostdan ham o'chirasizmi?", [
                          { text: 'Bekor', style: 'cancel' },
                          {
                            text: "O'chirish",
                            style: 'destructive',
                            onPress: async () => { await api.deleteCard(card.id); load(); },
                          },
                        ])
                      }
                    >
                      <Text style={[s.cardActionTxt, { color: C.danger }]}>🗑 O'chirish</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── SERVICES TAB ───────────────────────────────────────────────────── */}
      {tab === 'services' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {SERVIS_SECTIONS.map((sec, si) => (
            <View key={si} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <View style={s.serviceGroup}>
                {/* FIX 7: oxirgi serviceRow da ham border bor edi */}
                {sec.items.map((item, ii) => (
                  <TouchableOpacity
                    key={ii}
                    style={[s.serviceRow, ii === sec.items.length - 1 && { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                  >
                    <View style={s.serviceIcon}>
                      <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.serviceLabel}>{item.label}</Text>
                      {item.sub && <Text style={s.serviceSub}>{item.sub}</Text>}
                    </View>
                    <Text style={s.serviceArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── QR Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={qrModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>📲 Mening QR kodim</Text>
            <Text style={s.modalDesc}>Bu QR kodni skanerlang va to'lov qiling</Text>
            {qrData
              ? <View style={s.qrBox}><QRCode value={qrData} size={220} backgroundColor="white" /></View>
              : <ActivityIndicator color={C.primary} />
            }
            <TouchableOpacity style={s.modalClose} onPress={() => setQrModal(false)}>
              <Text style={s.modalCloseTxt}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Scan Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={scanModal} transparent animationType="slide">
        {/* FIX 8: TextInput klaviatura ostida qolmasdi — KeyboardAvoidingView qo'shildi */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={s.modalBg}>
            <View style={s.modalBox}>
              <Text style={s.modalTitle}>🔍 QR orqali to'lov</Text>
              <TextInput
                style={s.modalInput}
                value={scanInput}
                onChangeText={setScanInput}
                placeholder="QR kod ma'lumoti"
                placeholderTextColor={C.t3}
                multiline
              />
              <TextInput
                style={s.modalInput}
                value={scanAmount}
                onChangeText={setScanAmount}
                placeholder="Summa (UZS)"
                placeholderTextColor={C.t3}
                keyboardType="numeric"
              />
              <TouchableOpacity style={s.modalBtn} onPress={payByQR} disabled={scanLoading}>
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.modalBtnGrad}>
                  {scanLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={s.modalBtnTxt}>✓ To'lash</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
              {/* FIX 4: closeScanModal — input'larni ham tozalaydi */}
              <TouchableOpacity style={s.modalClose} onPress={closeScanModal}>
                <Text style={s.modalCloseTxt}>Bekor qilish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  tabRow: { flexDirection: 'row', margin: S.lg, backgroundColor: C.elevated, borderRadius: R.lg, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: R.md, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C.primary },
  tabTxt: { fontSize: 14, fontWeight: '600', color: C.t3 },
  tabTxtActive: { color: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingBottom: S.md },
  title: { fontSize: 20, fontWeight: '800', color: C.t1 },
  addBtn: { borderRadius: R.full, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 9 },
  addBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  qrRow: { flexDirection: 'row', paddingHorizontal: S.lg, gap: S.sm, marginBottom: S.md },
  qrBtn: { flex: 1, backgroundColor: C.elevated, borderRadius: R.lg, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  qrBtnIcon: { fontSize: 22 },
  qrBtnTxt: { color: C.t2, fontWeight: '600', fontSize: 12 },
  list: { paddingHorizontal: S.lg, gap: S.md },
  card: { borderRadius: R.xl, padding: S.lg, minHeight: 190, overflow: 'hidden', justifyContent: 'space-between', marginBottom: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBalLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  cardBal: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  cardTypeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.full },
  cardType: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  cardNum: { color: 'rgba(255,255,255,0.8)', fontSize: 14, letterSpacing: 2 },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between' },
  cardHolder: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 2 },
  cardExp: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  defTag: { position: 'absolute', top: S.md, left: S.md, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full },
  defTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  deco: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardActions: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  cardAction: { flex: 1, backgroundColor: C.elevated, borderRadius: R.md, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cardActionDanger: { borderColor: C.dangerBorder },
  cardActionTxt: { color: C.t2, fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: S.xl },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.t1, marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: C.t3, marginBottom: S.xl, textAlign: 'center' },
  emptyBtn: { borderRadius: R.xl, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: S.xl, paddingVertical: 14 },
  emptyBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  section: { paddingHorizontal: S.lg, marginBottom: S.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.t1, marginBottom: S.sm },
  serviceGroup: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: S.md },
  serviceIcon: { width: 44, height: 44, backgroundColor: C.card, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: 15, fontWeight: '600', color: C.t1, marginBottom: 2 },
  serviceSub: { fontSize: 12, color: C.t3 },
  serviceArrow: { fontSize: 20, color: C.t4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, gap: S.md },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.t1, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: C.t3, textAlign: 'center' },
  qrBox: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: R.xl, padding: S.lg, alignSelf: 'center' },
  modalInput: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, height: 50, color: C.t1, fontSize: 15 },
  modalBtn: { borderRadius: R.xl, overflow: 'hidden' },
  modalBtnGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
  modalBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  modalClose: { alignItems: 'center', paddingVertical: S.md },
  modalCloseTxt: { color: C.t3, fontSize: 15 },
});
