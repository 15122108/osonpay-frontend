import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'uz' | 'ru' | 'en';

const T: Record<Lang, Record<string, string>> = {
  uz: {
    welcome: 'Xush kelibsiz',
    enterPhone: 'Telefon raqamingizni kiriting',
    sendCode: 'Kod yuborish',
    enterCode: 'SMS kodni kiriting',
    enterName: 'Ismingizni kiriting',
    verify: 'Tasdiqlash',
    createPin: 'PIN-kod yarating',
    confirmPin: 'PIN-kodni tasdiqlang',
    createPinDesc: '4 ta raqamli PIN-kod',
    enterPin: 'PIN-kodni kiriting',
    pinMismatch: "PIN kodlar mos kelmadi",
    pinSuccess: "PIN-kod o'rnatildi",
    pinCode: 'PIN-kod',
    biometric: 'Biometrik kirish',
    forgotPin: "PIN-kodni unutdingizmi?",
    mainBalance: 'Asosiy balans',
    send: 'Yuborish',
    receive: 'Qabul',
    topup: "To'ldirish",
    payment: "To'lov",
    recentTx: "So'nggi tranzaksiyalar",
    seeAll: 'Barchasi',
    myCards: 'Mening kartalarim',
    addCard: "Karta qo'shish",
    noCards: "Kartalar yo'q",
    noCardsDesc: 'Birinchi kartangizni qo\'shing',
    history: 'Tarix',
    search: 'Qidirish',
    all: 'Barchasi',
    noTx: "Tranzaksiyalar yo'q",
    profile: 'Profil',
    language: 'Til',
    security: 'Xavfsizlik',
    passport: 'Pasport',
    notifications: 'Bildirishnomalar',
    logout: 'Chiqish',
    logoutConfirm: 'Rostdan ham chiqmoqchimisiz?',
    cancel: 'Bekor qilish',
    sendTo: 'Kimga yuborish',
    amount: 'Summa',
    note: 'Izoh',
    continue: 'Davom etish',
    recipient: 'Qabul qiluvchi',
    fee: 'Komissiya',
    freeTransfer: 'Bepul',
    total: 'Jami',
    confirm: 'Tasdiqlash',
    ok: 'OK',
    error: 'Xatolik',
    success: 'Muvaffaqiyatli',
    save: 'Saqlash',
    start: 'Boshlash',
    passportSeries: 'Pasport seriyasi',
    passportNumber: 'Pasport raqami',
    birthDate: "Tug'ilgan sana",
    fullName: "To'liq ism",
    namePlaceholder: 'FAMILIYA ISM',
  },
  ru: {
    welcome: 'Добро пожаловать',
    enterPhone: 'Введите номер телефона',
    sendCode: 'Отправить код',
    enterCode: 'Введите SMS код',
    enterName: 'Введите ваше имя',
    verify: 'Подтвердить',
    createPin: 'Создайте PIN-код',
    confirmPin: 'Подтвердите PIN-код',
    createPinDesc: '4-значный PIN-код',
    enterPin: 'Введите PIN-код',
    pinMismatch: 'PIN-коды не совпадают',
    pinSuccess: 'PIN-код установлен',
    pinCode: 'PIN-код',
    biometric: 'Биометрический вход',
    forgotPin: 'Забыли PIN-код?',
    mainBalance: 'Основной баланс',
    send: 'Отправить',
    receive: 'Получить',
    topup: 'Пополнить',
    payment: 'Оплата',
    recentTx: 'Последние транзакции',
    seeAll: 'Все',
    myCards: 'Мои карты',
    addCard: 'Добавить карту',
    noCards: 'Нет карт',
    noCardsDesc: 'Добавьте первую карту',
    history: 'История',
    search: 'Поиск',
    all: 'Все',
    noTx: 'Нет транзакций',
    profile: 'Профиль',
    language: 'Язык',
    security: 'Безопасность',
    passport: 'Паспорт',
    notifications: 'Уведомления',
    logout: 'Выйти',
    logoutConfirm: 'Вы уверены что хотите выйти?',
    cancel: 'Отмена',
    sendTo: 'Кому отправить',
    amount: 'Сумма',
    note: 'Заметка',
    continue: 'Продолжить',
    recipient: 'Получатель',
    fee: 'Комиссия',
    freeTransfer: 'Бесплатно',
    total: 'Итого',
    confirm: 'Подтвердить',
    ok: 'OK',
    error: 'Ошибка',
    success: 'Успешно',
    save: 'Сохранить',
    start: 'Начать',
    passportSeries: 'Серия паспорта',
    passportNumber: 'Номер паспорта',
    birthDate: 'Дата рождения',
    fullName: 'Полное имя',
    namePlaceholder: 'ФАМИЛИЯ ИМЯ',
  },
  en: {
    welcome: 'Welcome',
    enterPhone: 'Enter your phone number',
    sendCode: 'Send code',
    enterCode: 'Enter SMS code',
    enterName: 'Enter your name',
    verify: 'Verify',
    createPin: 'Create PIN',
    confirmPin: 'Confirm PIN',
    createPinDesc: '4-digit PIN code',
    enterPin: 'Enter PIN',
    pinMismatch: 'PIN codes do not match',
    pinSuccess: 'PIN code set',
    pinCode: 'PIN code',
    biometric: 'Biometric login',
    forgotPin: 'Forgot PIN?',
    mainBalance: 'Main balance',
    send: 'Send',
    receive: 'Receive',
    topup: 'Top up',
    payment: 'Payment',
    recentTx: 'Recent transactions',
    seeAll: 'See all',
    myCards: 'My cards',
    addCard: 'Add card',
    noCards: 'No cards',
    noCardsDesc: 'Add your first card',
    history: 'History',
    search: 'Search',
    all: 'All',
    noTx: 'No transactions',
    profile: 'Profile',
    language: 'Language',
    security: 'Security',
    passport: 'Passport',
    notifications: 'Notifications',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    sendTo: 'Send to',
    amount: 'Amount',
    note: 'Note',
    continue: 'Continue',
    recipient: 'Recipient',
    fee: 'Fee',
    freeTransfer: 'Free',
    total: 'Total',
    confirm: 'Confirm',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    start: 'Start',
    passportSeries: 'Passport series',
    passportNumber: 'Passport number',
    birthDate: 'Date of birth',
    fullName: 'Full name',
    namePlaceholder: 'LAST NAME FIRST NAME',
  },
};

interface LangCtx {
  lang: Lang;
  t: (key: string) => string;
  changeLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({} as LangCtx);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('uz');

  useEffect(() => {
    AsyncStorage.getItem('lang').then(l => {
      if (l === 'uz' || l === 'ru' || l === 'en') setLang(l);
    });
  }, []);

  function t(key: string): string {
    return T[lang][key] || T['uz'][key] || key;
  }

  async function changeLang(l: Lang) {
    setLang(l);
    await AsyncStorage.setItem('lang', l);
  }

  return (
    <Ctx.Provider value={{ lang, t, changeLang }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
