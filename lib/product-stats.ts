export type SoldCountsMap = Record<number, number>;

/**
 * Hitung jumlah produk yang benar-benar terjual (online + offline/POS).
 *
 * Data diambil dari API route `/api/product-sold-counts` yang aggregate
 * qty di tabel order_items (filter status != 'cancelled') lewat
 * service_role key — bypass RLS untuk read-only aggregate.
 *
 * API ini return data minimal (product_id → total_sold) tanpa info
 * customer/order, jadi aman diexpose ke public.
 *
 * Cache:
 * - Server: in-memory 60 detik (di route handler)
 * - Client: tidak di-cache (selalu fetch fresh saat mount)
 */
export async function fetchRealSoldCounts(): Promise<SoldCountsMap> {
  try {
    const res = await fetch('/api/product-sold-counts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Jangan cache di browser; server sudah punya cache sendiri
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('fetchRealSoldCounts HTTP error:', res.status);
      return {};
    }

    const json = await res.json();
    const counts: SoldCountsMap = {};
    for (const [k, v] of Object.entries(json.counts || {})) {
      const pid = Number(k);
      const sold = Number(v);
      if (Number.isFinite(pid) && Number.isFinite(sold)) {
        counts[pid] = sold;
      }
    }
    return counts;
  } catch (err) {
    console.error('fetchRealSoldCounts exception:', err);
    return {};
  }
}

/**
 * Gabungkan sold_count statis dengan data penjualan riil.
 * Nilai akhir = max(staticSoldCount, realSoldCount) agar
 * produk lama yang punya baseline tinggi tidak "turun" angkanya.
 *
 * - Produk baru yg memang baru laku → angka real langsung akurat
 * - Produk lama yg punya sold_count statis tinggi (mis. 49+)
 *   dari periode sebelumnya → tidak tiba-tiba turun ke 5 kalau
 *   order_items cuma catat 5 orderan terakhir
 */
export function mergeSoldCount(
  product: any,
  realCounts: SoldCountsMap
): number {
  const pid = Number(product.id);
  const real = realCounts[pid] || 0;
  const staticCount = Number(product.sold_count || 0);
  return Math.max(real, staticCount);
}
