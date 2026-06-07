import { supabase } from './supabase';

export type SoldCountsMap = Record<number, number>;

/**
 * Hitung jumlah produk yang benar-benar terjual (online + offline/POS)
 * dengan menjumlahkan qty di tabel order_items.
 *
 * Pakai RPC `get_product_sold_counts()` (SECURITY DEFINER) yang
 * aggregate qty per product_id dan filter order berstatus 'cancelled'.
 * Order yang dibatalkan di-delete dari orders (CASCADE), tapi filter
 * ini tetap dipasang untuk safety (mis. order cancelled yg masih ada
 * karena proses delete-nya tertunda).
 *
 * RLS biasa tidak mengizinkan anon membaca order_items langsung
 * (policy "Public read own order_items" cuma untuk own order),
 * tapi SECURITY DEFINER function bypass RLS — function ini aman
 * diexpose karena return data minimal: product_id + total_sold saja,
 * tanpa info customer/order.
 */
export async function fetchRealSoldCounts(): Promise<SoldCountsMap> {
  try {
    const { data, error } = await supabase.rpc('get_product_sold_counts');

    if (error) {
      console.error('fetchRealSoldCounts RPC error:', error);
      return {};
    }
    if (!data) return {};

    const counts: SoldCountsMap = {};
    for (const row of data as any[]) {
      const pid = Number(row.product_id);
      const sold = Number(row.total_sold || 0);
      if (!Number.isFinite(pid) || !Number.isFinite(sold)) continue;
      counts[pid] = sold;
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
 * Pakai Math.max (bukan replace) supaya:
 * 1. Produk baru yg memang baru laku → angka real langsung akurat
 * 2. Produk lama yg punya sold_count statis tinggi (mis. 49+)
 *    dari periode sebelumnya → tidak tiba-tiba turun ke 5 kalau
 *    order_items cuma catat 5 orderan terakhir
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
