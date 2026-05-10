// app/modals/receive.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { C, S, R, formatMoney } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function Receive() {
  const { user } = useAuth();
  const [qrData, setQrData]   = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'qr' | 'link'>('qr');

  useEffect(() => {
    api.getQR()
      .then(d => setQrData(d.qr_data))
      .catch(e => Alert.alert('Xatolik', e.message))
      .finally(() => setLoading(false));
  }, []);

  async function shareQR() {
    try {
      await Share.share({
        message: `OSON PAY orqali menga pul yuboring:\n${qrData}`,
        title: 'Pul qabul qilish',
      });
    } catch {}
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={s.headerBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pul qabul qilish</Text>
        <TouchableOpacity onPress={shareQR} hitSlop={8}>
          <Text style={{ fontSize: 20 }}>⬆️</Text>
        </TouchableOpacity>
      </View>

      {/* Tab */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'qr' && s.tabBtnOn]} onPress={() => setTab('qr')}>
          <Text style={[s.tabTxt, tab === 'qr' && s.tabTxtOn]}>📲 QR kod</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'link' && s.tabBtnOn]} onPress={() => setTab('link')}>
          <Text style={[s.tabTxt, tab === 'link' && s.tabTxtOn]}>🔗 Havola</Text>
        </TouchableOpacity>
      </View>

      {tab === 'qr' ? (
        <View style={s.qrSection}>
          {/* User info */}
          <View style={s.userCard}>
            <LinearGradient colors={C.gBrand} style={s.avatar}>
              <Text style={s.avatarTxt}>{user?.fullName?.slice(0,2)?.toUpperCase() || 'OP'}</Text>
            </LinearGradient>
            <View>
              <Text style={s.userName}>{user?.fullName || 'Foydalanuvchi'}</Text>
              <Text style={s.userPhone}>{user?.phone || ''}</Text>
            </View>
          </View>

          {/* QR */}
          <View style={s.qrWrap}>
            {loading ? (
              <ActivityIndicator color={C.primary} size="large" />
            ) : qrData ? (
              <>
                <View style={s.qrBox}>
                  <QRCode value={qrData} size={220} backgroundColor="white" color="black" />
                </View>
                <Text style={s.qrHint}>QR kodni skanerlang va to'lov qiling</Text>
              </>
            ) : (
              <Text style={{ color: C.t3 }}>QR kod yuklanmadi</Text>
            )}
          </View>

          {/* Share button */}
          <TouchableOpacity style={s.shareBtn} onPress={shareQR} activeOpacity={0.8}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.shareGrad}>
              <Text style={s.shareTxt}>⬆️ QR kodni ulashish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.linkSection}>
          <View style={s.linkCard}>
            <Text style={s.linkLabel}>Havola</Text>
            <Text style={s.linkValue} numberOfLines={2}>{qrData || '...'}</Text>
          </View>
          <TouchableOpacity style={s.shareBtn} onPress={shareQR} activeOpacity={0.8}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.shareGrad}>
              <Text style={s.shareTxt}>⬆️ Havolani ulashish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerBtn:   { fontSize: 22, color: C.t2, width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.t1 },
  tabRow:      { flexDirection: 'row', margin: S.lg, backgroundColor: C.elevated, borderRadius: R.lg, padding: 4, gap: 4 },
  tabBtn:      { flex: 1, paddingVertical: 10, borderRadius: R.md, alignItems: 'center' },
  tabBtnOn:    { backgroundColor: C.primary },
  tabTxt:      { fontSize: 14, fontWeight: '600', color: C.t3 },
  tabTxtOn:    { color: '#FFF' },
  qrSection:   { flex: 1, paddingHorizontal: S.lg, gap: S.lg, alignItems: 'center' },
  userCard:    { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.elevated, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border, width: '100%' },
  avatar:      { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 16, fontWeight: '800', color: '#FFF' },
  userName:    { fontSize: 16, fontWeight: '700', color: C.t1 },
  userPhone:   { fontSize: 13, color: C.t3 },
  qrWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md },
  qrBox:       { backgroundColor: '#FFF', borderRadius: R.xl, padding: S.lg },
  qrHint:      { fontSize: 14, color: C.t3, textAlign: 'center' },
  shareBtn:    { width: '100%', borderRadius: R.xl, overflow: 'hidden', marginBottom: S.lg },
  shareGrad:   { height: 54, alignItems: 'center', justifyContent: 'center' },
  shareTxt:    { color: '#FFF', fontWeight: '800', fontSize: 16 },
  linkSection: { flex: 1, paddingHorizontal: S.lg, gap: S.md },
  linkCard:    { backgroundColor: C.elevated, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, gap: S.sm },
  linkLabel:   { fontSize: 13, color: C.t3, fontWeight: '600' },
  linkValue:   { fontSize: 14, color: C.primaryLight, fontWeight: '600' },
});