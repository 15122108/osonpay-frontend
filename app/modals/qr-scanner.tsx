// app/modals/qr-scanner.tsx
// Haqiqiy kamera orqali QR kod skanerlash
// expo-camera ishlatiladi: npx expo install expo-camera

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, S, R } from '../../constants/theme';
import { api } from '../../services/api';

export default function QRScanner() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  // mode = 'pay' (to'lov) | 'receive' (qabul - faqat o'z QR ni ko'rsatish)

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [torchOn, setTorchOn]           = useState(false);
  const lastScanned                     = useRef('');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  async function handleBarCodeScanned({ data }: BarcodeScanningResult) {
    // Bir xil QR ni qayta-qayta o'qishdan saqlanish
    if (scanned || data === lastScanned.current) return;
    lastScanned.current = data;
    setScanned(true);
    Vibration.vibrate(200);

    if (mode === 'pay') {
      // QR orqali to'lov — backendga yuborish
      setLoading(true);
      try {
        const result = await api.parseQR(data);
        // QR ichidan merchant ma'lumotlari keladi
        // To'lov ekraniga o'tkazamiz
        router.replace({
          pathname: '/modals/qr-pay',
          params: {
            merchant_id:   result.merchant_id,
            merchant_name: result.merchant_name,
            amount:        result.amount ?? '',
            qr_data:       data,
          },
        });
      } catch (e: any) {
        Alert.alert('Xatolik', e.message, [{
          text: 'Qayta urinish',
          onPress: () => { setScanned(false); lastScanned.current = ''; },
        }]);
        setLoading(false);
      }
    } else {
      // Boshqa foydalanuvchiga to'lov — telefon/karta ekraniga
      router.replace({
        pathname: '/modals/send',
        params: { qr_data: data },
      });
    }
  }

  // Ruxsat so'ralmoqda
  if (!permission) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Ruxsat berilmagan
  if (!permission.granted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={s.headerBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>QR skaner</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text style={s.permTitle}>Kameraga ruxsat kerak</Text>
          <Text style={s.permSub}>QR kodni skanerlash uchun kamerangizga ruxsat bering</Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.8}>
            <LinearGradient colors={C.gBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.permBtnGrad}>
              <Text style={s.permBtnTxt}>Ruxsat berish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.cameraRoot}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        {/* Top */}
        <View style={s.overlayTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.overlayBtn} hitSlop={8}>
            <Text style={{ fontSize: 22, color: '#FFF' }}>✕</Text>
          </TouchableOpacity>
          <Text style={s.overlayTitle}>
            {mode === 'pay' ? 'QR orqali to\'lov' : 'QR skanerlash'}
          </Text>
          <TouchableOpacity onPress={() => setTorchOn(t => !t)} style={s.overlayBtn} hitSlop={8}>
            <Text style={{ fontSize: 22 }}>{torchOn ? '🔦' : '🔆'}</Text>
          </TouchableOpacity>
        </View>

        {/* Scanner frame */}
        <View style={s.frameWrap}>
          <View style={s.frame}>
            {/* Burchaklar */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            {/* Scan chizig'i */}
            {!scanned && <View style={s.scanLine} />}
          </View>
        </View>

        {/* Bottom */}
        <View style={s.overlayBottom}>
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={C.primary} />
              <Text style={{ color: '#FFF', fontSize: 14, marginTop: 8 }}>Tekshirilmoqda...</Text>
            </View>
          ) : scanned ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={C.primary} />
              <Text style={{ color: '#FFF', fontSize: 14, marginTop: 8 }}>Yuklanmoqda...</Text>
            </View>
          ) : (
            <Text style={s.hint}>QR kodni ramka ichiga oling</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const FRAME = 240;
const CORNER = 24;
const BORDER = 3;

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  cameraRoot:   { flex: 1, backgroundColor: '#000' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl, gap: S.md },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingVertical: S.md },
  headerBtn:    { fontSize: 22, color: C.t2, width: 36 },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: C.t1 },
  permTitle:    { fontSize: 20, fontWeight: '700', color: C.t1, textAlign: 'center' },
  permSub:      { fontSize: 14, color: C.t3, textAlign: 'center', lineHeight: 20 },
  permBtn:      { borderRadius: R.xl, overflow: 'hidden', width: '100%' },
  permBtnGrad:  { height: 54, alignItems: 'center', justifyContent: 'center' },
  permBtnTxt:   { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // Camera overlay
  overlay:      { flex: 1 },
  overlayTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingTop: 56, paddingBottom: S.lg, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  overlayTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Frame
  frameWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame:        {
    width: FRAME, height: FRAME,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },

  // Burchaklar
  corner:       { position: 'absolute', width: CORNER, height: CORNER },
  cornerTL:     { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: C.primary, borderTopLeftRadius: 4 },
  cornerTR:     { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: C.primary, borderTopRightRadius: 4 },
  cornerBL:     { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: C.primary, borderBottomLeftRadius: 4 },
  cornerBR:     { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: C.primary, borderBottomRightRadius: 4 },

  // Scan line
  scanLine:     { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: C.primary, opacity: 0.8, top: FRAME / 2 },

  overlayBottom: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: S.xl, alignItems: 'center', paddingBottom: 48 },
  hint:          { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
  loadingBox:    { alignItems: 'center' },
});
