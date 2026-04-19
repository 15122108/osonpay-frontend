import AsyncStorage from '@react-native-async-storage/async-storage';

// ← Render.com dagi backend URL
export const BASE_URL = 'https://osonpay-backend-1.onrender.com/api';

async function req(method: string, path: string, body?: any) {
  const token = await AsyncStorage.getItem('token');
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  try {
    const res  = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || 'Xatolik yuz berdi');
    return data;
  } catch (e: any) {
    if (e.message === 'Network request failed')
      throw new Error('Internet aloqasini tekshiring');
    throw e;
  }
}

export const api = {
  // Auth — faqat Eskiz SMS
  sendOTP:   (phone: string) =>
    req('POST', '/auth/send-otp', { phone }),

  verifyOTP: (phone: string, code: string, fullName?: string) =>
    req('POST', '/auth/verify-otp', { phone, code, fullName }),

  setPin:    (pin: string) =>
    req('POST', '/auth/set-pin', { pin }),

  verifyPin: (phone: string, pin: string) =>
    req('POST', '/auth/verify-pin', { phone, pin }),

  getProfile:    ()             => req('GET',  '/auth/profile'),
  updateProfile: (fullName: string) => req('PUT', '/auth/profile', { fullName }),
  setLanguage:   (language: string) => req('PUT', '/auth/language', { language }),
  logout:        ()             => req('POST', '/auth/logout'),

  // Transactions
  sendMoney: (receiverPhone: string, amount: number, description?: string) =>
    req('POST', '/transactions/send', { receiverPhone, amount, description }),

  // ✅ TO'G'RILANDI: /transactions/topup (avval /transactions/popup edi — xato)
  topUp: (amount: number) =>
    req('POST', '/transactions/topup', { amount }),

  getHistory:   (page = 1, type?: string) =>
    req('GET', `/transactions?page=${page}${type ? `&type=${type}` : ''}`),
  getStats:     ()          => req('GET', '/transactions/stats'),
  getTransaction: (id: string) => req('GET', `/transactions/${id}`),
  saveFcmToken: (token: string, platform: string) =>
    req('POST', '/transactions/fcm-token', { token, platform }),

  // Cards
  getCards:      ()           => req('GET',    '/cards'),
  addCard:       (data: any)  => req('POST',   '/cards', data),
  setDefaultCard:(id: string) => req('PUT',    `/cards/${id}/default`, {}),
  deleteCard:    (id: string) => req('DELETE', `/cards/${id}`),

  // Payments (PayTech — karta orqali to'ldirish)
  initTopup:          (amount: number)     => req('POST', '/payments/topup/init', { amount }),
  checkPaymentStatus: (paymentId: string)  => req('GET',  `/payments/topup/status/${paymentId}`),

  // KYC
  submitKYC: (data: any) => req('POST', '/kyc', data),
  getKYC:    ()          => req('GET',  '/kyc'),
};

export const Auth = {
  save: async (token: string, user: any) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  getToken: () => AsyncStorage.getItem('token'),
  getUser:  async () => {
    const u = await AsyncStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  clear: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  isLoggedIn: async () => !!(await AsyncStorage.getItem('token')),
};