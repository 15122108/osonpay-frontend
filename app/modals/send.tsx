import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useLang } from '../../hooks/useLang';

// ─── Payme ────────────────────────────────────────────────────────────────────
// BUG FIX 1: Payme to'g'ridan-to'g'ri frontend'dan chaqirilmaydi.
// Barcha Payme so'rovlari faqat backend orqali o'tishi kerak (xavfsizlik uchun).
// Backend endpoint'lari:
//   POST /api/transfer/phone   { phone, amount, note }
//   POST /api/transfer/card    { fromCardId, toCard, amount }
//   GET  /api/cards            → foydalanuvchi kartalari
//   GET  /api/contacts         → saqlangan kontaktlar
// ─────────────────────────────────────────────────────────────────────────────

const QUICK = [50_000, 100_000, 250_000, 500_000, 1_000_000];

type Card = { id: string; number: string; balance: number; color: string[] };
type Contact = { id: string; initials: string; name: string; phone: string; color: string };
type Step = 'input' | 'amount' | 'confirm';
type Mode = 'phone' | 'card';

export default function Send() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('phone');
  const [step, setStep] = useState<Step>('input');
  const [phone, setPhone] = useState('998');
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // BUG FIX 2: fromCardId hech qachon o'rnatilmagan — endi karta tanlash UI bor
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [fromCard, setFromCard] = useState<Card | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);

  // BUG FIX 3: SAVED_CONTACTS hardcoded edi — endi API'dan keladi
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadCards();
    loadContacts();
  }, []);

  async function loadCards() {
    setCardsLoading(true);
    try {
      const data = await api.getCards();          // GET /api/cards
      setMyCards(data);
      if (data.length > 0) setFromCard(data[0]);  // default: birinchi karta
    } catch {
      Alert.alert(t('error'), 'Kartalarni yuklab bo\'lmadi');
    } finally {
      setCardsLoading(false);
    }
  }

  async function loadContacts() {
    try {
      const data = await api.getContacts();       // GET /api/contacts
      setContacts(data);
    } catch {
      // kontaktlar bo'lmasa jimgina o'tamiz
    }
  }

  // BUG FIX 4: template literal xato edi → `+${...}` to'g'rilandi
  const digits = phone.replace(/\D/g, '');
  const e164 = `+${digits.startsWith('998') ? digits : '998' + digits}`;

  // BUG FIX 5: dispPhone template literal'lari singan edi — to'liq tuzatildi
  function dispPhone(d = digits.slice(0, 12)) {
    if (d.length <= 3) return `+${d}`;
    if (d.length <= 5) return `+${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    if (d.length <= 10) return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function maskCard(num: string) {
    const clean = num.replace(/\D/g, '');
    return `**** **** **** ${clean.slice(-4)}`;
  }

  // BUG FIX 6: fromCardId bo'sh string uzatilayotgan edi — endi fromCard.id ishlatiladi
  async function send() {
    if (!fromCard) {
      Alert.alert(t('error'), 'Karta tanlanmagan');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'phone') {
        await api.sendMoney({
          fromCardId: fromCard.id,
          phone: e164,
          amount: Number(amount),
          note: note || undefined,
        });
        Alert.alert('✅', `${formatMoney(Number(amount))} UZS yuborildi!`, [
          { text: t('ok'), onPress: () => router.back() },
        ]);
      } else {
        await api.cardTransfer({
          fromCardId: fromCard.id,
          toCard: cardNumber.replace(/\s/g, ''),
          amount: Number(amount),
        });
        Alert.alert('✅', `${formatMoney(Number(amount))} UZS karta orqali yuborildi!`, [
          { text: t('ok'), onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputValid = mode === 'phone'
    ? digits.length >= 12
    : cardNumber.replace(/\D/g, '').length === 16;

  function goBack() {
    if (step === 'input') router.back();
    else if (step === 'amount') setStep('input');
    else setStep('amount');
  }

  // ── Karta tanlash komponenti ─────────────────────────────────────────────
  function CardSelector() {
    if (cardsLoading) return <ActivityIndicator size="small" color={C.primary} />;
    if (!myCards.length) return null;
    return (
      <View style={s.section}>
        <Text style={s.label}>Qaysi kartadan:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
          {myCards.map(card => (
            <TouchableOpacity
              key={card.id}
              onPress={() => setFromCard(card)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={card.color as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.miniCard, fromCard?.id === card.id && s.miniCardOn]}
              >
                <Text style={s.miniCardNum}>{maskCard(card.number)}</Text>
                <Text style={s.miniCardBal}>{formatMoney(card.balance)} UZS</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={goBack} hitSlop={8}>
            <Text style={s.headerBtn}>{step === 'input' ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Pul o'tkazmasi</Text>
          <View style={s.infoBtn}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>i</Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={s.modeRow}>
          {(['phone', 'card'] as Mode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.modeBtn, mode === m && s.modeBtnOn]}
              onPress={() => { setMode(m); setStep('input'); }}
            >
              <Text style={[s.modeTxt, mode === m && s.modeTxtOn]}>
                {m === 'phone' ? '📱 Telefon' : '💳 Karta'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ─── STEP: INPUT ────────────────────────────────────────────── */}
          {step === 'input' && (
            <View style={s.form}>
              {/* Qaysi kartadan yuborish — BUG FIX 2 */}
              <CardSelector />

              <Text style={s.label}>Kimga:</Text>
              <Text style={s.sublabel}>
                {mode === 'phone' ? 'Telefon yoki karta raqami' : 'Qabul qiluvchi karta raqami'}
              </Text>

              <View style={s.phoneBox}>
                <Text style={{ fontSize: 20 }}>💳</Text>
                {mode === 'phone' ? (
                  <TextInput
                    style={s.phoneInput}
                    value={dispPhone()}
                    onChangeText={v => setPhone(v.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    placeholder="+998 XX XXX XX XX"
                    placeholderTextColor={C.t3}
                    autoFocus
                  />
                ) : (
                  <TextInput
                    style={s.phoneInput}
                    value={formatCard(cardNumber)}
                    onChangeText={v => setCardNumber(v.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={C.t3}
                    autoFocus
                    maxLength={19}
                  />
                )}
                <TouchableOpacity style={s.qrIcon} hitSlop={8}>
                  <Text style={{ fontSize: 20 }}>⊞</Text>
                </TouchableOpacity>
              </View>

              {/* Kontaktlar — BUG FIX 3: API dan keladi */}
              {contacts.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.contactsRow}
                >
                  {contacts.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={s.contactWrap}
                      activeOpacity={0.7}
                      onPress={() => { setMode('phone'); setPhone(c.phone); }}
                    >
                      <View style={[s.contactAvatar, { backgroundColor: c.color }]}>
                        <Text style={s.contactInitials}>{c.initials}</Text>
                        <View style={s.contactVerified}>
                          <Text style={{ fontSize: 8, color: '#FFF' }}>✓</Text>
                        </View>
                      </View>
                      <Text style={s.contactName} numberOfLines={1}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={s.contactWrap} activeOpacity={0.7}>
                    <View style={s.addContactBtn}>
                      <Text style={{ fontSize: 20, color: C.primary }}>+</Text>
                    </View>
                    <Text style={s.contactName}>Qo'shish</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}

              {/* BUG FIX 7: bu optionlar mode'ni o'zgartirmas, step'ga navigate qilmaydi —
                  endi to'g'ri ishlaydi: telefon/karta tanlash uchun mode'ni o'zgartiradi */}
              <Text style={s.allLabel}>Barchasi</Text>
              <View style={s.optionsGroup}>
                <TouchableOpacity
                  style={s.optionRow}
                  onPress={() => setMode('phone')}
                >
                  <View style={s.optionIcon}><Text style={{ fontSize: 20 }}>📞</Text></View>
                  <Text style={s.optionLabel}>Telefon raqami bo'yicha</Text>
                  <Text style={s.optionArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.optionRow, { borderBottomWidth: 0 }]}
                  onPress={() => setMode('card')}
                >
                  <View style={s.optionIcon}><Text style={{ fontSize: 20 }}>💳</Text></View>
                  <Text style={s.optionLabel}>Karta raqami bo'yicha</Text>
                  <Text style={s.optionArrow}>›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={s.greetRow} activeOpacity={0.7}>
                <View style={s.optionIcon}><Text style={{ fontSize: 20 }}>🎉</Text></View>
                <Text style={s.optionLabel}>Tabriknoma qo'shish</Text>
                <Text style={s.optionArrow}>+</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep('amount')}
                disabled={!inputValid || !fromCard}
                style={[s.btnWrap, (!inputValid || !fromCard) && { opacity: 0.4 }]}
                activeOpacity={0.8}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  <Text style={s.btnTxt}>{t('continue')} →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── STEP: AMOUNT ───────────────────────────────────────────── */}
          {step === 'amount' && (
            <View style={s.form}>
              <View style={s.recipientRow}>
                <Text style={{ fontSize: 20 }}>{mode === 'phone' ? '📱' : '💳'}</Text>
                <Text style={s.recipientPhone}>
                  {mode === 'phone' ? dispPhone() : formatCard(cardNumber)}
                </Text>
              </View>

              {fromCard && (
                <View style={s.balanceHint}>
                  <Text style={s.balanceHintTxt}>
                    Balans: {formatMoney(fromCard.balance)} UZS ({maskCard(fromCard.number)})
                  </Text>
                </View>
              )}

              <Text style={s.label}>{t('amount')}</Text>
              <View style={s.amtBox}>
                <TextInput
                  style={s.amtInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.t3}
                  autoFocus
                />
                <Text style={s.amtCur}>UZS</Text>
              </View>

              {/* Yetarli mablag' tekshiruvi */}
              {fromCard && Number(amount) > fromCard.balance && (
                <Text style={s.errorTxt}>⚠️ Balans yetarli emas</Text>
              )}

              <View style={s.quickAmts}>
                {QUICK.map(q => (
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

              {mode === 'phone' && (
                <>
                  <Text style={s.label}>{t('note')}</Text>
                  <TextInput
                    style={s.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder={t('note')}
                    placeholderTextColor={C.t3}
                  />
                </>
              )}

              <TouchableOpacity
                onPress={() => setStep('confirm')}
                disabled={!amount || Number(amount) < 1000 || (fromCard ? Number(amount) > fromCard.balance : false)}
                style={[
                  s.btnWrap,
                  (!amount || Number(amount) < 1000 || (fromCard ? Number(amount) > fromCard.balance : false)) && { opacity: 0.4 },
                ]}
                activeOpacity={0.8}
              >
                <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  <Text style={s.btnTxt}>{t('continue')} →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── STEP: CONFIRM ──────────────────────────────────────────── */}
          {step === 'confirm' && (
            <View style={s.form}>
              <View style={s.confirmCard}>
                {[
                  {
                    label: 'Kimdan',
                    value: fromCard ? `${maskCard(fromCard.number)} · ${formatMoney(fromCard.balance)} UZS` : '—',
                  },
                  {
                    label: t('recipient'),
                    value: mode === 'phone' ? dispPhone() : formatCard(cardNumber),
                  },
                  {
                    label: t('amount'),
                    value: `${formatMoney(Number(amount))} UZS`,
                    highlight: true,
                  },
                  ...(note && mode === 'phone' ? [{ label: t('note'), value: note }] : []),
                  { label: t('fee'), value: t('freeTransfer') },
                ].map((row, i, arr) => (
                  <View key={i} style={[s.confRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={s.confLabel}>{row.label}</Text>
                    <Text style={[
                      s.confVal,
                      (row as any).highlight && { color: C.orange, fontSize: 18, fontWeight: '800' },
                    ]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>{t('total')}</Text>
                  <Text style={s.totalAmt}>{formatMoney(Number(amount))} UZS</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={send}
                disabled={loading}
                style={[s.btnWrap, loading && { opacity: 0.7 }]}
                activeOpacity={0.8}
              >
                <LinearGradient colors={C.gSuccess} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                  {loading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={s.btnTxt}>✓ {t('confirm')}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBtn: { fontSize: 22, color: C.t2, width: 36, textAlign: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.t1 },
  infoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  modeRow: { flexDirection: 'row', margin: S.lg, backgroundColor: C.elevated, borderRadius: R.lg, padding: 4, gap: 4 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: R.md, alignItems: 'center' },
  modeBtnOn: { backgroundColor: C.primary },
  modeTxt: { fontSize: 14, fontWeight: '600', color: C.t3 },
  modeTxtOn: { color: '#FFF' },
  content: { padding: S.lg, paddingBottom: 40 },
  form: { gap: S.md },
  section: { gap: S.sm },
  label: { fontSize: 14, fontWeight: '700', color: C.t1 },
  sublabel: { fontSize: 12, color: C.t3, marginTop: -8 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 58 },
  phoneInput: { flex: 1, fontSize: 16, fontWeight: '500', color: C.t1 },
  qrIcon: { padding: 4 },
  contactsRow: { gap: S.md, paddingVertical: 4 },
  contactWrap: { alignItems: 'center', gap: 6, width: 64 },
  contactAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  contactInitials: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  contactVerified: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },
  contactName: { fontSize: 11, color: C.t2, textAlign: 'center' },
  addContactBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primaryBg, borderWidth: 2, borderColor: C.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  allLabel: { fontSize: 15, fontWeight: '700', color: C.primaryLight, textAlign: 'center' },
  optionsGroup: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.md, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: C.border },
  optionIcon: { width: 40, height: 40, backgroundColor: C.card, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.t1 },
  optionArrow: { fontSize: 20, color: C.t3 },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.elevated, borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: 16, borderWidth: 1, borderColor: C.border },
  btnWrap: { borderRadius: R.xl, overflow: 'hidden', marginTop: S.sm },
  btn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  // Karta tanlash
  miniCard: { borderRadius: R.lg, padding: S.md, width: 160, height: 72, justifyContent: 'flex-end', opacity: 0.7 },
  miniCardOn: { opacity: 1, borderWidth: 2, borderColor: '#FFF' },
  miniCardNum: { fontSize: 12, color: '#FFF', fontWeight: '600', marginBottom: 4 },
  miniCardBal: { fontSize: 13, color: '#FFF', fontWeight: '800' },
  balanceHint: { backgroundColor: C.primaryBg, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.sm },
  balanceHintTxt: { fontSize: 12, color: C.primaryLight, fontWeight: '600' },
  errorTxt: { fontSize: 13, color: C.danger, fontWeight: '600' },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.elevated, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.primaryBorder },
  recipientPhone: { fontSize: 16, fontWeight: '600', color: C.t1 },
  amtBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: S.md, height: 70 },
  amtInput: { flex: 1, fontSize: 40, fontWeight: '900', color: C.t1 },
  amtCur: { fontSize: 16, color: C.t3, fontWeight: '600' },
  quickAmts: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  quickBtnOn: { backgroundColor: C.orangeBg, borderColor: C.orange },
  quickTxt: { fontSize: 13, color: C.t2, fontWeight: '500' },
  quickTxtOn: { color: C.orange, fontWeight: '700' },
  noteInput: { backgroundColor: C.elevated, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, paddingHorizontal: S.md, height: 50, color: C.t1, fontSize: 15 },
  confirmCard: { backgroundColor: C.elevated, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  confLabel: { fontSize: 13, color: C.t3 },
  confVal: { fontSize: 15, fontWeight: '600', color: C.t1, maxWidth: '60%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.t1 },
  totalAmt: { fontSize: 20, fontWeight: '900', color: C.t1 },
});
