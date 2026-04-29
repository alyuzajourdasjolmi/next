const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add import
code = code.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, 
  "import React, { useState, useEffect, useRef } from 'react';\nimport { supabase } from '../lib/supabase';");

// 2. Remove static productsData and add state for it inside Home()
code = code.replace(/const productsData = \[\s+[\s\S]*?\];/, '');
code = code.replace(/const \[isClient, setIsClient\] = useState\(false\);/, 
  "const [isClient, setIsClient] = useState(false);\n  const [productsData, setProductsData] = useState<any[]>([]);\n  const [loadingProducts, setLoadingProducts] = useState(true);");

// 3. Add fetch logic in useEffect
const useEffectRegex = /useEffect\(\(\) => \{\n    setIsClient\(true\);/;
code = code.replace(useEffectRegex, 
  `useEffect(() => {
    setIsClient(true);
    
    // Fetch data from Supabase
    const fetchData = async () => {
      const { data: products } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (products) setProductsData(products);
      setLoadingProducts(false);

      const { data: revs } = await supabase.from('reviews').select('*').order('id', { ascending: true });
      if (revs) setReviews(revs);
    };
    fetchData();`);

// Remove old review localstorage load
code = code.replace(/const savedReviews = JSON.parse\(localStorage.getItem\('hijrahTokoReviews'\) \|\| '\[\]'\);\s+if\(savedReviews\.length\) \{\s+setReviews\(prev => \[\.\.\.prev, \.\.\.savedReviews\]\);\s+\}/, '');

// 4. Update submitReview
code = code.replace(/const submitReview = \(e: any\) => \{\s+e\.preventDefault\(\);\s+const newReview = \{ \.\.\.reviewForm, date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \};\s+const saved = JSON\.parse\(localStorage\.getItem\('hijrahTokoReviews'\) \|\| '\[\]'\);\s+localStorage\.setItem\('hijrahTokoReviews', JSON\.stringify\(\[\.\.\.saved, newReview\]\)\);\s+setReviews\(\(prev: any\) => \[\.\.\.prev, newReview\]\);\s+setReviewForm\(\{ name: '', text: '', rating: 5 \}\);\s+alert\('Terima kasih atas ulasan Anda!'\);\s+\};/, 
  `const submitReview = async (e: any) => {
    e.preventDefault();
    const newReview = { ...reviewForm, date: new Date().toISOString().split('T')[0] };
    const { data, error } = await supabase.from('reviews').insert([newReview]).select();
    if (error) {
      alert('Gagal mengirim ulasan.');
      console.error(error);
    } else if (data) {
      setReviews((prev: any) => [...prev, ...data]);
      setReviewForm({ name: '', text: '', rating: 5 });
      alert('Terima kasih atas ulasan Anda!');
    }
  };`);

// 5. Update submitOrder to save order and order items to Supabase
// First find where the whatsapp URL opens.
const waOpenRegex = /window\.open\(waUrl, '_blank'\);\n    setCart\(\[\]\);\n    setOrderInfo\(\{ \.\.\.orderInfo, customerName: '', customerPhone: '', customerAddress: '' \}\);\n    setShipInfo\(\{ status: 'idle', distanceKm: null, shippingCost: null, discount: 0, detail: '' \}\);\n    setInbox\(\{ title: 'Pesanan Diterima', message: 'Pesanan Anda sedang diproses oleh Admin kami via WhatsApp.' \}\);\n    document\.getElementById\('inbox'\)\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);/;

const supabaseOrderLogic = `
    // Save to Supabase orders
    const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
      customer_name: orderInfo.customerName,
      customer_phone: orderInfo.customerPhone,
      delivery_method: orderInfo.deliveryMethod,
      customer_address: orderInfo.customerAddress || null,
      payment_method: orderInfo.paymentMethod,
      pickup_date: orderInfo.deliveryMethod === 'pickup' ? orderInfo.pickupDate : null,
      subtotal: subtotal,
      shipping_cost: shipCost,
      shipping_discount: shipDisc,
      grand_total: finalTotal
    }]).select();

    if (!orderError && orderData && orderData.length > 0) {
      const orderId = orderData[0].id;
      const orderItems = cart.map((item: any) => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        qty: item.qty,
        price: item.price
      }));
      await supabase.from('order_items').insert(orderItems);
    }

    window.open(waUrl, '_blank');
    setCart([]);
    setOrderInfo({ ...orderInfo, customerName: '', customerPhone: '', customerAddress: '' });
    setShipInfo({ status: 'idle', distanceKm: null, shippingCost: null, discount: 0, detail: '' });
    setInbox({ title: 'Pesanan Diterima', message: 'Pesanan Anda sedang diproses oleh Admin kami via WhatsApp.' });
    document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
`;

code = code.replace(waOpenRegex, supabaseOrderLogic);

// Add async to submitOrder
code = code.replace(/const submitOrder = \(e: any\) => \{/, "const submitOrder = async (e: any) => {");

// Show loading indicator for products
code = code.replace(/<div className="products-grid" id="productsGrid">\s+\{productsData\.filter\(/, 
  `{loadingProducts && <div style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Memuat produk...</div>}
  <div className="products-grid" id="productsGrid">
    {productsData.filter(`);


fs.writeFileSync('app/page.tsx', code);
