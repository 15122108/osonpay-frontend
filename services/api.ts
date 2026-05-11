// services/api.ts
// Backend: FastAPI (Python) — barcha endpoint yo'llari haqiqiy backend bilan mos

import * as SecureStore from 'expo-secure-store';

const BASE = 'https://osonpay-backend-1.onrender.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await SecureStore.getItemAsync('app_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? json.detail ?? json.message ?? 'Xatolik yuz berdi');
  }
  return json;
}

export const api = {

  // ─────────────────────────────────────────────────────────────────
  // AUTH  →  /api/auth/...
  // ─────────────────────────────────────────────────────────────────

  /** SMS kod yuborish */
  sendCode: (phone: string) =>
    request<{ success: boolean; isNewUser: boolean; devCode?: string }>(
      '/api/auth/send-otp',
      { method: 'POST', body: JSON.stringify({ phone }) }
    ),

  /** SMS kodni tasdiqlash → token olish */
  verifyCode: (phone: string, code: string, fullName = 'Foydalanuvchi') =>
    request<{ success: boolean; token: string; hasPin: boolean; user: any }>(
      '/api/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, code, fullName }) }
    ),

  /** PIN o'rnatish (login dan keyin) */
  setPin: (pin: string) =>
    request<{ success: boolean }>(
      '/api/auth/set-pin',
      { method: 'POST', body: JSON.stringify({ pin }) }
    ),

  /** PIN bilan kirish */
  verifyPin: (phone: string, pin: string) =>
    request<{ success: boolean; token: string }>(
      '/api/auth/verify-pin',
      { method: 'POST', body: JSON.stringify({ phone, pin }) }
    ),

  /** Profil ma'lumotlari */
  getProfile: () =>
    request<{ success: boolean; user: {
      id: string; phone: string; full_name: string;
      balance: number; currency: string;
      is_verified: boolean; language: string;
      pin_hash: boolean;
    } }>('/api/auth/profile'),

  /** Profil yangilash */
  updateProfile: (data: { fullName?: string }) =>
    request<{ success: boolean }>(
      '/api/auth/profile',
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  /** Til o'rnatish */
  setLanguage: (language: string) =>
    request<{ success: boolean }>(
      '/api/auth/language',
      { method: 'PUT', body: JSON.stringify({ language }) }
    ),

  /** Chiqish */
  logout: () =>
    request<{ success: boolean }>(
      '/api/auth/logout',
      { method: 'POST' }
    ),


  // ─────────────────────────────────────────────────────────────────
  // KARTALAR  →  /api/cards/...
  // ─────────────────────────────────────────────────────────────────

  /** Kartalar ro'yxati */
  getCards: () =>
    request<{ success: boolean; cards: {
      id: string; card_number_masked: string; card_holder: string;
      expiry_month: string; expiry_year: string; card_type: string;
      is_default: boolean; color_from: string; color_to: string;
    }[] }>('/api/cards'),

  /** Karta qo'shish */
  addCard: (data: {
    cardNumber: string; cardHolder: string;
    expiryMonth: string; expiryYear: string;
    cardType?: string;
  }) =>
    request<{ success: boolean; card: any }>(
      '/api/cards',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  /** Asosiy karta qilish */
  setDefaultCard: (id: string) =>
    request<{ success: boolean }>(
      `/api/cards/${id}/default`,
      { method: 'PUT' }
    ),

  /** Kartani o'chirish */
  deleteCard: (id: string) =>
    request<{ success: boolean }>(
      `/api/cards/${id}`,
      { method: 'DELETE' }
    ),

  /** Karta orqali o'tkazma */
  cardTransfer: (params: {
    fromCardId: string; toCard: string; amount: number;
  }) =>
    request<{ success: boolean; reference: string; transaction: any }>(
      '/api/cards/transfer',
      {
        method: 'POST',
        body: JSON.stringify({
          from_card_id: params.fromCardId,
          to_card_number: params.toCard,
          amount: params.amount,
        }),
      }
    ),

  /** Mening QR kodim */
  getQR: () =>
    request<{ success: boolean; qr_data: string }>('/api/cards/qr'),

  /** QR orqali to'lov */
  payByQR: (qr_data: string, amount: number) =>
    request<{ success: boolean; reference: string; transaction: any }>(
      '/api/cards/qr/pay',
      { method: 'POST', body: JSON.stringify({ qr_data, amount }) }
    ),

  /** QR kodni parse qilish */
  parseQR: (qr_data: string) => {
    try {
      const data = JSON.parse(qr_data);
      return Promise.resolve({
        merchant_id: data.user_id ?? '',
        merchant_name: data.name ?? 'Foydalanuvchi',
        phone: data.phone ?? '',
        amount: data.amount,
      });
    } catch {
      return Promise.reject(new Error("Noto'g'ri QR kod"));
    }
  },


  // ─────────────────────────────────────────────────────────────────
  // TRANZAKSIYALAR  →  /api/transactions/...
  // ─────────────────────────────────────────────────────────────────

  /** Telefon raqami orqali pul yuborish */
  sendMoney: (params: {
    fromCardId?: string; phone: string; amount: number; note?: string;
  }) =>
    request<{ success: boolean; transaction: any; fraud_risk?: string }>(
      '/api/transactions/send',
      {
        method: 'POST',
        body: JSON.stringify({
          receiverPhone: params.phone,
          amount: params.amount,
          description: params.note,
        }),
      }
    ),

  /** Tranzaksiyalar tarixi */
  getHistory: (page = 1, type?: string, period?: string) => {
    const p = new URLSearchParams({ page: String(page) });
    if (type) p.append('type', type);
    return request<{
      transactions: any[]; total: number; page: number; limit: number;
    }>(`/api/transactions?${p}`);
  },

  /** Bitta tranzaksiya */
  getTransaction: (id: string) =>
    request<any>(`/api/transactions/${id}`),

  /** Statistika */
  getStats: () => {
    // Tranzaksiyalar tarixidan statistika hisoblash
    return api.getHistory(1).then(data => ({
      stats: {
        total_in: 0,
        total_out: 0,
        total_count: data.total ?? 0,
        cashback: 0,
      }
    }));
  },


  // ─────────────────────────────────────────────────────────────────
  // TO'LDIRISH  →  /api/payments/topup/...
  // ─────────────────────────────────────────────────────────────────

  /** To'ldirish boshlash → PayTech redirect URL */
  initTopup: (amount: number) =>
    request<{
      success: boolean;
      redirect_url: string;
      reference: string;
      payment_id: string;
    }>(
      '/api/payments/topup/init',
      { method: 'POST', body: JSON.stringify({ amount }) }
    ).then(r => ({
      redirectUrl: r.redirect_url,
      paymentId: r.payment_id,
      reference: r.reference,
    })),

  /** To'lov holatini tekshirish */
  checkPaymentStatus: (paymentId: string) =>
    request<{
      success: boolean;
      status: string;
      amount: number;
      reference: string;
    }>(`/api/payments/status/${paymentId}`)
    .then(r => ({
      status: r.status.toLowerCase() as
        'pending' | 'completed' | 'failed' | 'cancelled' | 'declined',
    })),


  // ─────────────────────────────────────────────────────────────────
  // KONTAKTLAR  →  tranzaksiyalar tarixidan olinadi
  // ─────────────────────────────────────────────────────────────────

  /** Saqlangan kontaktlar (tranzaksiyalar tarixidan) */
  getContacts: async () => {
    try {
      const data = await api.getHistory(1);
      const seen = new Set<string>();
      const contacts: any[] = [];
      for (const tx of data.transactions ?? []) {
        if (tx.receiver_phone && !seen.has(tx.receiver_phone)) {
          seen.add(tx.receiver_phone);
          const name: string = tx.receiver_name ?? tx.receiver_phone;
          contacts.push({
            id: tx.receiver_id ?? tx.receiver_phone,
            initials: name.slice(0, 2).toUpperCase(),
            name,
            phone: tx.receiver_phone,
            color: '#8B2FC9',
          });
        }
      }
      return contacts.slice(0, 10);
    } catch {
      return [];
    }
  },


  // ─────────────────────────────────────────────────────────────────
  // TO'LOVLAR  →  /api/payments/...
  // ─────────────────────────────────────────────────────────────────

  /** Saqlangan to'lovlar */
  getSavedPayments: () =>
    request<any[]>('/api/payments/saved').catch(() => []),

  /** Mening uyim (manzillar) */
  getMyHome: () =>
    request<any[]>('/api/payments/home').catch(() => []),

  /** Xizmatlar ro'yxati */
  getServices: () =>
    request<any[]>('/api/payments/services').catch(() => []),


  // ─────────────────────────────────────────────────────────────────
  // KYC  →  /api/kyc/...
  // ─────────────────────────────────────────────────────────────────

  /** KYC ma'lumotlarini yuborish */
  submitKYC: (data: {
    passport_series: string; passport_number: string;
    birth_date: string; full_name: string;
  }) =>
    request<{ success: boolean; message: string }>(
      '/api/kyc',
      {
        method: 'POST',
        body: JSON.stringify({
          passportSeries: data.passport_series,
          passportNumber: data.passport_number,
          birthDate: data.birth_date,
          fullName: data.full_name,
        }),
      }
    ),

  /** KYC holatini ko'rish */
  getKYC: () =>
    request<{ success: boolean; kyc: any | null }>('/api/kyc'),

};
