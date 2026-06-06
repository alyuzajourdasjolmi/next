export const WA_NUMBER = '6285263965031';
export const STORE_NAME = 'Hijrah Toko';
export const ADMIN_EMAIL = 'admin.hijrahtoko@gmail.com';
export const STORE_COORDINATES = { lat: -0.5940091, lon: 100.2129566 };
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
  subtotal: number
): ShipInfo {
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
    haversineDistanceKm(STORE_COORDINATES.lat, STORE_COORDINATES.lon, lat, lon).toFixed(2)
  );
  if (dist > SHIPPING_MAX_KM) {
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
  if (dist <= SHIPPING_NEAR_MAX_KM) {
    cost = SHIPPING_NEAR_BASE;
    detail = `0 - 2 km: tarif dasar Rp ${SHIPPING_NEAR_BASE.toLocaleString('id-ID')}.`;
  } else {
    const extraDist = dist - SHIPPING_NEAR_MAX_KM;
    const extraCost = Math.ceil(extraDist) * SHIPPING_FAR_PER_KM;
    cost = SHIPPING_FAR_BASE + extraCost;
    detail = `> 2 km: tarif dasar Rp ${SHIPPING_FAR_BASE.toLocaleString('id-ID')} + ${Math.ceil(
      extraDist
    )} km x Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')}.`;
  }

  let discount = 0;
  if (subtotal >= 250000) discount = 10000;
  else if (subtotal >= 200000) discount = 7000;
  else if (subtotal >= 150000) discount = 3000;

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
