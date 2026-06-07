-- ============================================
-- SOLUSI: Aggregate sold count per product
-- (Read-only, aman diexpose ke public/anon)
-- ============================================
--
-- Masalah: RLS policy "Public read own order_items" di setup_rls.sql
-- hanya izinkan user baca order_items milik sendiri (berdasarkan
-- customer_phone). Akibatnya anon/public tidak bisa hitung total
-- terjual per produk dari tabel order_items.
--
-- Solusi: Function SECURITY DEFINER yang aggregate qty per product
-- (exclude cancelled orders). Function ini bypass RLS karena
-- SECURITY DEFINER, tapi return data minimal (product_id + total_sold)
-- tanpa info customer/order. Aman untuk konsumsi publik.
-- ============================================

-- Function 1: total sold per product (online + POS offline)
-- Catatan: order dengan status 'cancelled' di-delete dari orders
-- (lihat dashboard transactions), tapi kalau ada yang belum dihapus
-- kita filter juga di sini untuk safety.
CREATE OR REPLACE FUNCTION public.get_product_sold_counts()
RETURNS TABLE (product_id bigint, total_sold bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.product_id::bigint AS product_id,
    SUM(oi.qty)::bigint AS total_sold
  FROM order_items oi
  LEFT JOIN orders o ON o.id = oi.order_id
  WHERE o.id IS NULL OR o.status IS DISTINCT FROM 'cancelled'
  GROUP BY oi.product_id;
END;
$$;

-- Izinkan anon & authenticated memanggil function
GRANT EXECUTE ON FUNCTION public.get_product_sold_counts() TO anon, authenticated;

-- (Opsional) View di atas function untuk query SQL langsung
-- Note: view ini cuma meneruskan hasil function, tetap aman karena
-- function-nya SECURITY DEFINER.
CREATE OR REPLACE VIEW public.product_sold_stats
WITH (security_invoker = false) AS
  SELECT product_id, total_sold FROM public.get_product_sold_counts();

GRANT SELECT ON public.product_sold_stats TO anon, authenticated;

-- (Opsional) Kalau ada produk yang dihapus dari tabel products tapi
-- row order_items masih nyangkut, function akan return orphan.
-- Tidak masalah — query di aplikasi filter by product_id yang valid.
