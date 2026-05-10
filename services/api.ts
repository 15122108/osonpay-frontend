// services/api.ts
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://your-backend.com/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const SecureStore = (await import('expo-secure-store')).default ?? await import('expo-secure-store');
  const token = await SecureStore.getItemAsync('app_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Xatolik yuz berdi');
  return json;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  sendCode:   (phone: string) =>
    request<{ success: boolean }>('/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyCode: (phone: string, code: string) =>
    request<{ token: string; user: any }>('/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () =>
    request<any>('/profile'),

  updateProfile: (data: { fullName?: string;[key: string]: any }) =>
    request<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  setLanguage: (lang: string) =>
    request<void>('/profile/language', { method: 'PUT', body: JSON.stringify({ lang }) }),

  // ── Cards ─────────────────────────────────────────────────────────────────
  getCards: () =>
    request<any[]>('/cards'),

  addCardRequest: (data: { number: string; expiry_month: string; expiry_year: string }) =>
    request<{ token: string }>('/cards/request', { method: 'POST', body: JSON.stringify(data) }),

  addCardConfirm: (data: { number: string; sms_code: string; color_from?: string; color_to?: string; card_holder?: string }) =>
    request<any>('/cards/confirm', { method: 'POST', body: JSON.stringify(data) }),

  setDefaultCard: (id: string) =>
    request<void>(`/cards/${id}/default`, { method: 'PUT' }),

  deleteCard: (id: string) =>
    request<void>(`/cards/${id}`, { method: 'DELETE' }),

  // ── Transfers ─────────────────────────────────────────────────────────────
  sendMoney: (params: { fromCardId: string; phone: string; amount: number; note?: string }) =>
    request<{ transactionId: string }>('/transfer/phone', { method: 'POST', body: JSON.stringify(params) }),

  cardTransfer: (params: { fromCardId: string; toCard: string; amount: number }) =>
    request<{ transactionId: string }>('/transfer/card', { method: 'POST', body: JSON.stringify(params) }),

  // ── History ───────────────────────────────────────────────────────────────
  getHistory: (page = 1, type?: string, period?: string) => {
    const p = new URLSearchParams({ page: String(page) });
    if (type)   p.append('type', type);
    if (period) p.append('period', period);
    return request<{ transactions: any[]; total: number }>(`/history?${p}`);
  },

  getTransaction: (id: string) =>
    request<any>(`/history/${id}`),

  getStats: () =>
    request<{ stats: any }>('/history/stats'),

  // ── Contacts ──────────────────────────────────────────────────────────────
  getContacts: () =>
    request<any[]>('/contacts'),

  // ── Payments ──────────────────────────────────────────────────────────────
  getSavedPayments: () =>
    request<any[]>('/payments/saved'),

  getMyHome: () =>
    request<any[]>('/payments/home'),

  getServices: () =>
    request<any[]>('/payments/services'),

  payByQR: (qrData: string, amount: number) =>
    request<{ transactionId: string }>('/payments/qr', { method: 'POST', body: JSON.stringify({ qr_data: qrData, amount }) }),

  // ── QR ────────────────────────────────────────────────────────────────────
  getQR: () =>
    request<{ qr_data: string }>('/qr'),

  // ── KYC ───────────────────────────────────────────────────────────────────
  submitKYC: (data: { passport_series: string; passport_number: string; birth_date: string; full_name: string }) =>
    request<{ status: string }>('/kyc', { method: 'POST', body: JSON.stringify(data) }),

  // ── Topup (hisob to'ldirish) ───────────────────────────────────────────
  initTopup: (amount: number) =>
    request<{ redirectUrl: string; paymentId: string }>('/topup/init', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  checkPaymentStatus: (paymentId: string) =>
    request<{ status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'declined' }>(`/topup/status/${paymentId}`),

  // ── QR to'lov parse ───────────────────────────────────────────────────
  parseQR: (qrData: string) =>
    request<{ merchant_id: string; merchant_name: string; amount?: number }>('/qr/parse', {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData }),
    }),
};
