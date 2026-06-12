export const WA_NUMBER = '6285263965031';
export const STORE_NAME = 'Hijrah Toko';
export const ADMIN_EMAIL = 'admin.hijrahtoko@gmail.com';
export const STORE_COORDINATES = { lat: -0.5940091, lon: 100.2129566 };
export const STORE_ADDRESS = 'Jl. Raya Padang Pariaman, Nagari Sintuk, Kec. Sintuk Toboh Gadang, Kab. Padang Pariaman, Sumatera Barat 25584';
export const STORE_PHONE = '+62 852-6396-5031';
export const STORE_HOURS = 'Senin–Sabtu: 08.00–20.00 WIB';
export const SHIPPING_NEAR_MAX_KM = 2;
export const SHIPPING_MAX_KM = 20;
export const SHIPPING_NEAR_BASE = 5000;
export const SHIPPING_FAR_BASE = 15000;
export const SHIPPING_FAR_PER_KM = 3000;

export const PAYMENT_INFO: Record<string, string> = {
  COD: 'Pembayaran dilakukan saat barang diterima atau saat ambil di kedai.',
  Mandiri: 'Transfer Bank Mandiri ke 1230012345678 a.n. Hijrah Toko.\n\n⚠️ PENTING: Tolong kirim bukti pembayaran jika tidak maka admin tidak akan mengirim barangnya.',
  BSI: 'Transfer Bank BSI ke 7123456789 a.n. Hijrah Toko.\n\n⚠️ PENTING: Tolong kirim bukti pembayaran jika tidak maka admin tidak akan mengirim barangnya.',
};

export const PAYMENT_METHODS = [
  { value: 'COD', label: 'Bayar di Tempat (COD)' },
  { value: 'Mandiri', label: 'Transfer Bank Mandiri' },
  { value: 'BSI', label: 'Transfer Bank BSI' },
];

export type ShipInfo = {
  distanceKm: number | null;
  shippingCost: number | null;
  discount: number;
  finalCost: number | null;
  detail: string;
  status: 'ok' | 'missing-location' | 'too-far' | 'pickup';
};

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => v * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function calculateShipping(
  deliveryMethod: 'pickup' | 'delivery',
  lat: number | null,
  lon: number | null,
  hasMapsLink: boolean,
  subtotal: number,
  overrides?: {
    storeLat?: number;
    storeLon?: number;
    nearMaxKm?: number;
    maxKm?: number;
    nearBase?: number;
    farBase?: number;
    farPerKm?: number;
    discounts?: { min: number; amount: number }[];
  }
): ShipInfo {
  const storeLat = overrides?.storeLat ?? STORE_COORDINATES.lat;
  const storeLon = overrides?.storeLon ?? STORE_COORDINATES.lon;
  const nearMaxKm = overrides?.nearMaxKm ?? SHIPPING_NEAR_MAX_KM;
  const maxKm = overrides?.maxKm ?? SHIPPING_MAX_KM;
  const nearBase = overrides?.nearBase ?? SHIPPING_NEAR_BASE;
  const farBase = overrides?.farBase ?? SHIPPING_FAR_BASE;
  const farPerKm = overrides?.farPerKm ?? SHIPPING_FAR_PER_KM;
  const discounts = overrides?.discounts ?? [
    { min: 250000, amount: 10000 },
    { min: 200000, amount: 7000 },
    { min: 150000, amount: 3000 },
  ];

  if (deliveryMethod === 'pickup') {
    return {
      distanceKm: 0,
      shippingCost: 0,
      discount: 0,
      finalCost: 0,
      detail: 'Ambil di kedai, tidak dikenakan ongkir.',
      status: 'pickup',
    };
  }
  if (!lat || !lon || !hasMapsLink) {
    return {
      distanceKm: null,
      shippingCost: null,
      discount: 0,
      finalCost: null,
      detail: 'Pilih lokasi terlebih dahulu untuk menghitung ongkir otomatis.',
      status: 'missing-location',
    };
  }
  const dist = Number(
    haversineDistanceKm(storeLat, storeLon, lat, lon).toFixed(2)
  );
  if (dist > maxKm) {
    return {
      distanceKm: dist,
      shippingCost: null,
      discount: 0,
      finalCost: null,
      detail: 'Lokasi terlalu jauh, silakan hubungi admin untuk pengiriman khusus.',
      status: 'too-far',
    };
  }

  let cost: number;
  let detail: string;
  if (dist <= nearMaxKm) {
    cost = nearBase;
    detail = `0 - ${nearMaxKm} km: tarif dasar Rp ${nearBase.toLocaleString('id-ID')}.`;
  } else {
    const extraDist = dist - nearMaxKm;
    const extraCost = Math.ceil(extraDist) * farPerKm;
    cost = farBase + extraCost;
    detail = `> ${nearMaxKm} km: tarif dasar Rp ${farBase.toLocaleString('id-ID')} + ${Math.ceil(
      extraDist
    )} km x Rp ${farPerKm.toLocaleString('id-ID')}.`;
  }

  const sortedDiscounts = [...discounts].sort((a, b) => b.min - a.min);
  let discount = 0;
  for (const d of sortedDiscounts) {
    if (subtotal >= d.min) {
      discount = d.amount;
      break;
    }
  }

  const finalCost = Math.max(cost - discount, 0);
  if (discount) {
    detail += ` Diskon ongkir Rp ${discount.toLocaleString(
      'id-ID'
    )} diterapkan berdasarkan subtotal belanja Rp ${subtotal.toLocaleString('id-ID')}.`;
  }

  return {
    distanceKm: dist,
    shippingCost: cost,
    discount,
    finalCost,
    detail,
    status: 'ok',
  };
}
