-- ============================================
-- RLS POLICIES — Hijrah Toko
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Products: public read, admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admin write products" ON products;

CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admin write products" ON products
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');
          
-- Reviews: public read & insert, admin delete
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON reviews; 
DROP POLICY IF EXISTS "Admin delete reviews" ON reviews;

CREATE POLICY "Public read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Public insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin delete reviews" ON reviews
  FOR DELETE USING (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Orders: public read by own phone, public insert, admin all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read own orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Admin all orders" ON orders;

CREATE POLICY "Public read own orders" ON orders
  FOR SELECT USING (
    customer_phone = current_setting('app.customer_phone', true)
    OR auth.email() = 'admin.hijrahtoko@gmail.com'
  );

CREATE POLICY "Public insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin all orders" ON orders
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Order items: public read by own order, public insert, admin all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read own order_items" ON order_items;
DROP POLICY IF EXISTS "Public insert order_items" ON order_items;
DROP POLICY IF EXISTS "Admin all order_items" ON order_items;

CREATE POLICY "Public read own order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_phone = current_setting('app.customer_phone', true)
    )
    OR auth.email() = 'admin.hijrahtoko@gmail.com'
  );

CREATE POLICY "Public insert order_items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin all order_items" ON order_items
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- User addresses: own read/write, admin all
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Admin all addresses" ON user_addresses;

CREATE POLICY "User own addresses" ON user_addresses
  FOR ALL USING (
    user_phone = current_setting('app.customer_phone', true)
  )
  WITH CHECK (
    user_phone = current_setting('app.customer_phone', true)
  );

CREATE POLICY "Admin all addresses" ON user_addresses
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Push subscriptions: insert anyone, delete own, admin all
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Admin all push_subscriptions" ON push_subscriptions;

CREATE POLICY "Public insert push_subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin all push_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Banners: public read, admin write
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read banners" ON banners;
DROP POLICY IF EXISTS "Admin write banners" ON banners;

CREATE POLICY "Public read banners" ON banners
  FOR SELECT USING (true);

CREATE POLICY "Admin write banners" ON banners
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Profiles: own read/write, admin all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User own profiles" ON profiles;
DROP POLICY IF EXISTS "Admin all profiles" ON profiles;

CREATE POLICY "User own profiles" ON profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin all profiles" ON profiles
  FOR ALL USING (auth.email() = 'admin.hijrahtoko@gmail.com')
  WITH CHECK (auth.email() = 'admin.hijrahtoko@gmail.com');

-- Grant base permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
