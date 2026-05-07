export const C = {
  bg: '#0D0A14',
  surface: '#130F1E',
  elevated: '#1C1628',
  card: '#221A30',
  border: '#2E2040',
  // Brand
  primary: '#8B2FC9',
  primaryLight: '#A855F7',
  primaryBg: 'rgba(139,47,201,0.15)',
  primaryBorder: 'rgba(139,47,201,0.35)',
  orange: '#FF6B00',
  orangeLight: '#FF8C2A',
  orangeBg: 'rgba(255,107,0,0.15)',
  // Status
  success: '#00C896',
  successBg: 'rgba(0,200,150,0.15)',
  successBorder: 'rgba(0,200,150,0.3)',
  warning: '#F5A623',
  warningBg: 'rgba(245,166,35,0.15)',
  // FIX 1: warningBorder yo'q edi — ba'zi screenlarda ishlatilgan
  warningBorder: 'rgba(245,166,35,0.35)',
  danger: '#FF3B5C',
  dangerBg: 'rgba(255,59,92,0.15)',
  dangerBorder: 'rgba(255,59,92,0.3)',
  // FIX 2: info ranglari yo'q edi — History va boshqa screenlarda kerak
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.15)',
  infoBorder: 'rgba(59,130,246,0.3)',
  infoLight: '#60A5FA',
  // Text
  t1: '#FFFFFF',
  t2: '#B0A0C8',
  t3: '#6A5A80',
  t4: '#3D2E50',
  // Gradients
  gBrand:   ['#7B2FBE', '#FF6B00'] as [string, string],
  gPrimary: ['#8B2FC9', '#C44FFF'] as [string, string],
  gOrange:  ['#FF6B00', '#FF9A3C'] as [string, string],
  gSuccess: ['#00C896', '#00A878'] as [string, string],
  gCard1:   ['#7B2FBE', '#FF6B00'] as [string, string],
  gCard2:   ['#1A1A60', '#4040CC'] as [string, string],
  gCard3:   ['#006650', '#00C896'] as [string, string],
};

export const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 9999 };

// FIX 3: NaN, undefined, null, string bo'lsa "0" qaytaradi
// Avvalgi versiya: Number(undefined) = NaN → toLocaleString('ru-RU') = "не число"
export function formatMoney(n: number | string | null | undefined): string {
  const num = Number(n);
  if (!isFinite(num) || isNaN(num)) return '0';   // ← asosiy fix
  const v = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (v >= 1_000_000_000) return `${sign}${(v / 1_000_000_000).toFixed(2)} mlrd`;
  if (v >= 1_000_000)     return `${sign}${(v / 1_000_000).toFixed(2)} mln`;
  if (v >= 1_000)         return `${sign}${Math.round(v / 1_000)} ming`;
  return `${sign}${v.toLocaleString('ru-RU')}`;
}

export function formatPhone(phone: string): string {
  const p = (phone ?? '').replace(/\D/g, '');
  if (p.length === 12)
    return `+${p.slice(0,3)} ${p.slice(3,5)} ${p.slice(5,8)} ${p.slice(8,10)} ${p.slice(10,12)}`;
  return phone ?? '';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// FIX 4: maskCard — undefined/qisqa raqam berilsa crash bermasdi
export function maskCard(card: string | null | undefined): string {
  if (!card) return '**** **** **** ****';
  const clean = card.replace(/\D/g, '');
  return `**** **** **** ${clean.slice(-4) || '****'}`;
}

// FIX 5: expiry formatlash — Cards.tsx da "55/5" muammosi
// API dan expiry_month=5, expiry_year=2025 kabi kelishi mumkin
export function formatExpiry(month: string | number, year: string | number): string {
  const m = String(month ?? '').padStart(2, '0');   // "5" → "05"
  const y = String(year ?? '').slice(-2);            // "2025" → "25", "25" → "25"
  if (!m || m === '00' || !y) return '--/--';
  return `${m}/${y}`;
}
