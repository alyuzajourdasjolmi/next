import { supabase } from './supabase';

export type SoldCountsMap = Record<number, number>;

/**
 * Hitung jumlah produk yang benar-benar terjual (online + offline/POS)
 * dengan menjumlahkan qty di tabel order_items yang aktif.
 *
 * Order dengan status 'cancelled' di-delete dari orders (CASCADE),
 * sehingga semua order_items yang tersisa otomatis valid.
 * POS offline dan orderan online sama-sama insert ke order_items,
 * jadi totalnya sudah merepresentasikan penjualan riil.
 */
export async function fetchRealSoldCounts(): Promise<SoldCountsMap> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, qty, orders!inner(status)');

    if (error) {
      console.error('fetchRealSoldCounts error:', error);
      return {};
    }
    if (!data) return {};

    const counts: SoldCountsMap = {};
    for (const item of data as any[]) {
      const status = item.orders?.status;
      if (status === 'cancelled') continue;
      const pid = Number(item.product_id);
      if (!Number.isFinite(pid)) continue;
      counts[pid] = (counts[pid] || 0) + Number(item.qty || 0);
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
