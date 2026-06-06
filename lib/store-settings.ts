export const STORAGE_KEY = 'hijrahTokoSettings';

export type DaySchedule = {
  active: boolean;
  open: string;
  close: string;
};

export type StoreSettings = {
  storeName: string;
  storeDesc: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lon: number;
  shippingNearMaxKm: number;
  shippingMaxKm: number;
  shippingNearBase: number;
  shippingFarBase: number;
  shippingFarPerKm: number;
  shippingDiscounts: { min: number; amount: number }[];
  minOrder: number;
  schedule: Record<string, DaySchedule>;
  primaryColor: string;
  themeDefault: 'dark' | 'light';
  logoUrl: string;
  heroUrls: { hero1: string; hero2: string; hero3: string };
};

export const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Senin: { active: true, open: '08:00', close: '21:00' },
  Selasa: { active: true, open: '08:00', close: '21:00' },
  Rabu: { active: true, open: '08:00', close: '21:00' },
  Kamis: { active: true, open: '08:00', close: '21:00' },
  Jumat: { active: true, open: '08:00', close: '21:00' },
  Sabtu: { active: true, open: '08:00', close: '21:00' },
  Minggu: { active: false, open: '08:00', close: '18:00' },
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Hijrah Toko',
  storeDesc: 'Pusat frozen food & ATK terlengkap di Padang Pariaman',
  whatsapp: '6285263965031',
  phone: '0852-6396-5031',
  email: 'admin.hijrahtoko@gmail.com',
  address: 'Padang Pariaman, Sumatera Barat',
  lat: -0.5940091,
  lon: 100.2129566,
  shippingNearMaxKm: 2,
  shippingMaxKm: 20,
  shippingNearBase: 5000,
  shippingFarBase: 15000,
  shippingFarPerKm: 3000,
  shippingDiscounts: [
    { min: 250000, amount: 10000 },
    { min: 200000, amount: 7000 },
    { min: 150000, amount: 3000 },
  ],
  minOrder: 0,
  schedule: DEFAULT_SCHEDULE,
  primaryColor: '#dc2626',
  themeDefault: 'dark',
  logoUrl: '/assets/images/logo-hijrah-toko.png',
  heroUrls: {
    hero1: '/assets/images/hero-toko.png',
    hero2: '/assets/images/hero-app.png',
    hero3: '/assets/images/nura.png',
  },
};

export function loadSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage full or unavailable */
  }
}
