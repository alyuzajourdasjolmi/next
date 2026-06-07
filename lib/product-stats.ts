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
 * Pakai data penjualan riil saja (dari order_items via API route).
 *
 * Kolom `sold_count` statis di tabel products diabaikan — data
 * tersebut bukan dari transaksi sebenarnya, melainkan input manual
 * yang tidak akurat. Setelah ada orderan pertama, nilai ini akan
 * di-update otomatis dari real count.
 *
 * Return 0 kalau belum ada orderan untuk produk ini. UI bisa
 * sembunyikan label "terjual" kalau nilainya 0 (lihat ProductCard).
 */
export function mergeSoldCount(
  product: any,
  realCounts: SoldCountsMap
): number {
  const pid = Number(product.id);
  return realCounts[pid] || 0;
}
