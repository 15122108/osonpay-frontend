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
  danger: '#FF3B5C',
  dangerBg: 'rgba(255,59,92,0.15)',
  dangerBorder: 'rgba(255,59,92,0.3)',
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

export function formatMoney(n: number | string): string {
  const v = Math.abs(Number(n));
  if (v >= 1_000_000_000) return ${(v / 1_000_000_000).toFixed(2)} mlrd;
  if (v >= 1_000_000) return ${(v / 1_000_000).toFixed(2)} mln;
  if (v >= 1_000) return ${(v / 1_000).toFixed(0)} ming;
  return v.toLocaleString('ru-RU');
}

export function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, '');
  if (p.length === 12)
    return +${p.slice(0,3)} ${p.slice(3,5)} ${p.slice(5,8)} ${p.slice(8,10)} ${p.slice(10,12)};
  return phone;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function maskCard(card: string): string {
  return **** **** **** ${card.slice(-4)};
}