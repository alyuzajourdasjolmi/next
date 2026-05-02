"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';



const WA_NUMBER = "6285263965031";
const STORE_NAME = "Hijrah Toko";
const STORE_COORDINATES = { lat: -0.5843105, lon: 100.2442436 };
const SHIPPING_NEAR_MAX_KM = 2;
const SHIPPING_MAX_KM = 20;
const SHIPPING_NEAR_BASE = 5000;
const SHIPPING_FAR_BASE = 15000;
const SHIPPING_FAR_PER_KM = 3000;
const SHIPPING_SERVICE_FEE = 10000;

const PAYMENT_INFO = {
  COD: "Pembayaran dilakukan saat barang diterima atau saat ambil di kedai.",
  Mandiri: "Transfer Bank Mandiri ke 1230012345678 a.n. Hijrah Toko. Mohon kirim bukti transfer setelah pembayaran.",
  BSI: "Transfer Bank BSI ke 7123456789 a.n. Hijrah Toko. Mohon kirim bukti transfer setelah pembayaran."
};

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [theme, setTheme] = useState('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [cart, setCart] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [inbox, setInbox] = useState({ title: '', message: '', icon: '📨' });
  const [trackingPhone, setTrackingPhone] = useState('');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [soldCounts, setSoldCounts] = useState<any>({});
  const [isLocating, setIsLocating] = useState(false);

  const [orderInfo, setOrderInfo] = useState({
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'COD',
    customerAddress: '',
    customerLatitude: '',
    customerLongitude: '',
    customerMapsLink: ''
  });

  const [user, setUser] = useState<any>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({ isOpen: false, mode: 'login' });
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', phone: '', address: '' });
  const [authLoading, setAuthLoading] = useState(false);
  
  // Refs for realtime listener to avoid stale closures
  const trackingPhoneRef = useRef(trackingPhone);
  const customerPhoneRef = useRef(orderInfo.customerPhone);
  const userOrdersRef = useRef(userOrders);

  useEffect(() => {
    trackingPhoneRef.current = trackingPhone;
  }, [trackingPhone]);

  useEffect(() => {
    customerPhoneRef.current = orderInfo.customerPhone;
  }, [orderInfo.customerPhone]);

  useEffect(() => {
    userOrdersRef.current = userOrders;
  }, [userOrders]);

  const [reviews, setReviews] = useState([
    { name: "Budi Santoso", rating: 5, text: "Pelayanan sangat cepat, frozen food sampai dalam keadaan masih beku sempurna!", date: "2023-10-01" },
    { name: "Siti Aminah", rating: 4, text: "ATK nya lumayan lengkap, harga juga bersahabat. Recommended banget buat anak sekolahan.", date: "2023-10-15" },
    { name: "Rina Wijaya", rating: 5, text: "Toko andalan kalau lagi butuh cemilan cepet. Bakso sapinya enak pol!", date: "2023-11-05" }
  ]);
  const [reviewForm, setReviewForm] = useState({ name: '', text: '', rating: 5 });

  useEffect(() => {
    setIsClient(true);
    
    // Fetch data from Supabase
    const fetchData = async () => {
      try {
        console.log('Fetching products from Supabase...');
        const { data: products, error: productsError } = await supabase.from('products').select('*').order('id', { ascending: true });
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
          // Fallback to hardcoded data if Supabase fails
          const fallbackProducts = [
            { id: 1, name: "Nugget Ayam", desc: "Nugget ayam crispy premium, 500gr. Cocok untuk camilan keluarga.", price: 32000, category: "frozen", img: "/assets/images/nugget.png" },
            { id: 2, name: "Sosis Sapi", desc: "Sosis sapi berkualitas, 300gr. Praktis untuk bekal dan masakan.", price: 28000, category: "frozen", img: "/assets/images/sosis.png" },
            { id: 3, name: "Bakso Sapi", desc: "Bakso sapi kenyal isi 25 butir. Bahan pilihan, tanpa pengawet.", price: 35000, category: "frozen", img: "/assets/images/bakso.png" },
            { id: 4, name: "Dimsum Ayam", desc: "Dimsum ayam isi udang, 10 pcs. Tinggal kukus, siap saji!", price: 25000, category: "frozen", img: "/assets/images/nugget.png" },
            { id: 5, name: "Kentang Goreng", desc: "Kentang goreng crinkle cut 1kg. Renyah dan lezat.", price: 42000, category: "frozen", img: "/assets/images/sosis.png" },
            { id: 6, name: "Otak-otak", desc: "Otak-otak ikan tenggiri, 10 pcs. Bumbu rempah khas.", price: 22000, category: "frozen", img: "/assets/images/bakso.png" },
            { id: 7, name: "Buku Tulis", desc: "Buku tulis 58 lembar, sampul tebal. Tersedia bergaris dan kotak.", price: 5000, category: "atk", img: "/assets/images/buku-tulis.png" },
            { id: 8, name: "Pulpen Pilot", desc: "Pulpen Pilot 0.5mm, tinta smooth. Nyaman digunakan menulis lama.", price: 8000, category: "atk", img: "/assets/images/pulpen.png" },
            { id: 9, name: "Kertas HVS A4", desc: "Kertas HVS A4 70gsm, 500 lembar/rim. Untuk print dan fotokopi.", price: 48000, category: "atk", img: "/assets/images/buku-tulis.png" },
            { id: 10, name: "Pensil 2B", desc: "Pensil 2B Faber Castell, 12 pcs/box. Cocok untuk ujian.", price: 24000, category: "atk", img: "/assets/images/pulpen.png" },
            { id: 11, name: "Map Plastik", desc: "Map plastik kancing F4, tebal dan tahan lama. Aneka warna.", price: 3500, category: "atk", img: "/assets/images/buku-tulis.png" },
            { id: 12, name: "Spidol Snowman", desc: "Spidol whiteboard Snowman, 12 warna. Mudah dihapus.", price: 36000, category: "atk", img: "/assets/images/pulpen.png" },
            { id: 13, name: "Tisu Wajah", desc: "Tisu wajah lembut, 250 sheets.", price: 12000, category: "other", img: "/assets/images/buku-tulis.png" },
            { id: 14, name: "Botol Minum", desc: "Botol minum plastik BPA Free 1L.", price: 25000, category: "other", img: "/assets/images/pulpen.png" }
          ];
          setProductsData(fallbackProducts);
          console.log('Using fallback products data');
        } else {
          console.log('Products loaded successfully:', products);
          setProductsData(products);

          // Calculate sold counts
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, qty');
          
          if (!itemsError && items) {
            const counts = items.reduce((acc: any, item: any) => {
              acc[item.product_id] = (acc[item.product_id] || 0) + item.qty;
              return acc;
            }, {});
            setSoldCounts(counts);
          }
        }
        
        const { data: revs, error: revsError } = await supabase.from('reviews').select('*').order('id', { ascending: true });
        if (revsError) {
          console.error('Error fetching reviews:', revsError);
        } else {
          setReviews(revs);
        }
      } catch (err) {
        console.error('Unexpected error in fetchData:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Pre-fill order info if user is logged in
        setOrderInfo(prev => ({
          ...prev,
          customerName: session.user.user_metadata?.full_name || prev.customerName,
          customerPhone: session.user.user_metadata?.phone || session.user.phone || prev.customerPhone,
          customerAddress: session.user.user_metadata?.address || prev.customerAddress
        }));
        fetchUserOrders(session.user.id, false);
      }
    };

    fetchData();
    checkSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setOrderInfo(prev => ({
          ...prev,
          customerName: session.user.user_metadata?.full_name || prev.customerName,
          customerPhone: session.user.user_metadata?.phone || session.user.phone || prev.customerPhone,
          customerAddress: session.user.user_metadata?.address || prev.customerAddress
        }));
        fetchUserOrders(session.user.id, false);
      } else {
        setUserOrders([]);
      }
    });
    setTheme(localStorage.getItem('hijrahTokoTheme') || 'light');
    setCart(JSON.parse(localStorage.getItem('hijrahTokoCart') || '[]'));
    setOrderInfo(JSON.parse(localStorage.getItem('hijrahTokoOrderInfo') || '{}'));
    setInbox(JSON.parse(localStorage.getItem('hijrahTokoInbox') || '{"title":"","message":"","icon":"📨"}'));
    

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['home','produk','features','testimoni','checkout','lokasi','inbox','kontak'];
      let current = '';
      sections.forEach(id => {
        const s = document.getElementById(id);
        if (s && window.scrollY >= s.offsetTop - 200) current = id;
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 100);

    // Setup Realtime subscription for tracking orders
    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const currentTrackingPhone = trackingPhoneRef.current?.trim();
        const currentCustomerPhone = customerPhoneRef.current?.trim();
        const orderPhone = payload.new.customer_phone?.trim();
        const isAlreadyInList = userOrdersRef.current.some(o => o.id === payload.new.id);

        if (orderPhone === currentTrackingPhone || orderPhone === currentCustomerPhone || isAlreadyInList) {
          console.log('Match found! Updating UI for order:', payload.new.id);
          
          setUserOrders(current => 
            current.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          );
          
          let title = '';
          let message = '';
          let icon = '📨';

          switch (payload.new.status) {
            case 'confirmed':
              title = '✅ Pesanan Dikonfirmasi';
              message = `Pesanan Anda telah dikonfirmasi dan sedang masuk antrean pengerjaan.`;
              icon = '✅';
              break;
            case 'processing':
              title = '⏳ Pesanan Sedang Diproses';
              message = `Pesanan Anda sedang diproses dan disiapkan oleh tim kami.`;
              icon = '⏳';
              break;
            case 'shipped':
              title = '🚚 Pesanan Sedang Dikirim';
              message = `Pesanan Anda sedang dalam perjalanan menuju lokasi Anda. Mohon ditunggu!`;
              icon = '🚚';
              break;
            case 'completed':
              title = '✨ Pesanan Selesai';
              message = `Pesanan Anda telah selesai. Terima kasih telah berbelanja di Hijrah Toko!`;
              icon = '✨';
              break;
            case 'cancelled':
              title = '❌ Pesanan Dibatalkan';
              message = `Mohon maaf, pesanan Anda telah dibatalkan. Hubungi admin untuk informasi lebih lanjut.`;
              icon = '❌';
              break;
            default:
              title = '📋 Update Status Pesanan';
              message = `Status pesanan Anda saat ini adalah: ${payload.new.status}.`;
          }

          const newInbox = { title, message, icon };
          setInbox(newInbox);
          localStorage.setItem('hijrahTokoInbox', JSON.stringify(newInbox));
          
          if (payload.new.status !== payload.old?.status) {
             const inboxEl = document.getElementById('inbox');
             if (inboxEl) inboxEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      supabase.removeChannel(ordersSubscription);
      authSubscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authModal.mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
        setAuthModal({ ...authModal, isOpen: false });
      } else {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.name,
              phone: authForm.phone,
              address: authForm.address
            }
          }
        });
        if (error) throw error;
        alert('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) atau langsung login.');
        setAuthModal({ ...authModal, mode: 'login', isOpen: true });
      }
    } catch (error: any) {
      alert('Authentication failed: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserOrders([]);
  };

  useEffect(() => {
    if (isClient) {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      localStorage.setItem('hijrahTokoTheme', theme);
    }
  }, [theme, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem('hijrahTokoCart', JSON.stringify(cart));
  }, [cart, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem('hijrahTokoOrderInfo', JSON.stringify(orderInfo));
  }, [orderInfo, isClient]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const addToCart = (id: number) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    const product = productsData.find(p => p.id === id);
    if (!product) return;
    setCart((prev: any) => {
      const existing = prev.find((item: any) => item.id === id);
      if (existing) return prev.map((item: any) => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart((prev: any) => prev.map((item: any) => item.id === id ? { ...item, qty: item.qty + delta } : item).filter((item: any) => item.qty > 0));
  };

  const clearCart = () => setCart([]);

  const getCartSubtotal = () => cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum: number, item: any) => sum + item.qty, 0);

  const calculateShipping = () => {
    const subtotal = getCartSubtotal();
    if (orderInfo.deliveryMethod === 'pickup') {
      return { distanceKm: 0, shippingCost: 0, discount: 0, finalCost: 0, detail: 'Ambil di kedai, tidak dikenakan ongkir.', status: 'ok' };
    }
    const lat = Number(orderInfo.customerLatitude);
    const lon = Number(orderInfo.customerLongitude);
    if (!lat || !lon || !orderInfo.customerMapsLink) {
      return { distanceKm: null, shippingCost: null, discount: 0, finalCost: null, detail: 'Pilih lokasi terlebih dahulu untuk menghitung ongkir otomatis.', status: 'missing-location' };
    }
    const dist = Number(haversineDistanceKm(STORE_COORDINATES.lat, STORE_COORDINATES.lon, lat, lon).toFixed(2));
    if (dist > SHIPPING_MAX_KM) return { distanceKm: dist, shippingCost: null, discount: 0, finalCost: null, detail: 'Lokasi terlalu jauh, silakan hubungi admin untuk pengiriman khusus.', status: 'too-far' };
    
    let cost, detail;
    if (dist <= SHIPPING_NEAR_MAX_KM) {
      cost = SHIPPING_NEAR_BASE + SHIPPING_SERVICE_FEE;
      detail = `0 - 2 km: tarif dasar Rp ${SHIPPING_NEAR_BASE.toLocaleString('id-ID')} + biaya tambahan Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}.`;
    } else {
      const extraDist = dist - SHIPPING_NEAR_MAX_KM;
      const extraCost = Math.ceil(extraDist) * SHIPPING_FAR_PER_KM;
      cost = SHIPPING_FAR_BASE + extraCost + SHIPPING_SERVICE_FEE;
      detail = `> 2 km: tarif dasar Rp ${SHIPPING_FAR_BASE.toLocaleString('id-ID')} + ${Math.ceil(extraDist)} km x Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')} + biaya tambahan Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}.`;
    }

    let discount = 0;
    if (subtotal >= 250000) discount = 10000;
    else if (subtotal >= 200000) discount = 7000;
    else if (subtotal >= 150000) discount = 3000;

    const finalCost = Math.max(cost - discount, 0);
    if (discount) detail += ` Diskon ongkir Rp ${discount.toLocaleString('id-ID')} diterapkan berdasarkan subtotal belanja Rp ${subtotal.toLocaleString('id-ID')}.`;

    return { distanceKm: dist, shippingCost: cost, discount, finalCost, detail, status: 'ok' };
  };

  const shipInfo = calculateShipping();
  const subtotal = getCartSubtotal();
  const grandTotal = subtotal + (shipInfo.finalCost || 0);

  const useCurrentLocation = () => {
    if (orderInfo.deliveryMethod !== 'delivery') {
      alert('Pilih metode "Diantarkan ke Alamat" terlebih dahulu.');
      return;
    }
    if (!navigator.geolocation) {
      alert('Browser ini tidak mendukung geolocation.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos: any) => {
      const { latitude, longitude } = pos.coords;
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      let address = `Koordinat: ${latitude}, ${longitude}`;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if(data.display_name) address = data.display_name;
      } catch (e) {
        console.error("Geocoding error:", e);
      }

      setOrderInfo(prev => ({ 
        ...prev, 
        customerLatitude: latitude, 
        customerLongitude: longitude, 
        customerMapsLink: link, 
        customerAddress: address 
      }));
      setIsLocating(false);
    }, (err) => {
      setIsLocating(false);
      alert('Izin lokasi ditolak atau gagal mengambil koordinat.');
      console.error("Location error:", err);
    }, { enableHighAccuracy: true });
  };

  const submitReview = async (e: any) => {
    e.preventDefault();
    if (!user) {
      alert('Anda harus login untuk memberikan ulasan.');
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    const newReview = { 
      name: user.user_metadata?.full_name || reviewForm.name, 
      text: reviewForm.text, 
      rating: reviewForm.rating, 
      date: new Date().toISOString().split('T')[0],
      user_id: user.id
    };
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select();

      if (error) throw error;

      if (data) {
        setReviews([data[0], ...reviews]);
        setReviewForm({ name: '', text: '', rating: 5 });
        alert('Terima kasih atas ulasan Anda!');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Gagal mengirim ulasan. Silakan coba lagi.');
    }
  };

  const submitOrder = async (e: any) => {
    e.preventDefault();
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'login' });
      alert('Silakan login terlebih dahulu untuk melakukan pemesanan.');
      return;
    }
    if (!cart.length) return alert('Keranjang masih kosong.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'missing-location') return alert('Gunakan lokasi terlebih dahulu.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'too-far') return alert('Lokasi terlalu jauh.');

    const itemsText = cart.map((item: any) => `${item.name} x ${item.qty}`).join('\n');
    const msg = [
      `PESANAN BARU - ${STORE_NAME}`, '',
      `Nama Pemesan: ${orderInfo.customerName}`,
      `Metode: ${orderInfo.deliveryMethod === 'pickup' ? 'Ambil di Kedai' : 'Diantarkan'}`, '',
      'List Barang:', itemsText, '',
      `Pembayaran: ${orderInfo.paymentMethod}`,
      `Jadwal: ${orderInfo.pickupDate}`, '',
      'Rincian Biaya:',
      `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`,
      `Jarak Tempuh: ${shipInfo.distanceKm || '-'}`,
      `Ongkir: Rp ${(shipInfo.shippingCost || 0).toLocaleString('id-ID')}`,
      `Diskon Ongkir: Rp ${shipInfo.discount.toLocaleString('id-ID')}`,
      `Total Bayar: Rp ${grandTotal.toLocaleString('id-ID')}`, '',
      `Lokasi: ${orderInfo.deliveryMethod === 'delivery' ? orderInfo.customerMapsLink : 'Tidak diperlukan'}`
    ].join('\n');

    // Save order to Supabase
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: orderInfo.customerName,
          customer_phone: orderInfo.customerPhone,
          delivery_method: orderInfo.deliveryMethod,
          customer_address: orderInfo.customerAddress,
          payment_method: orderInfo.paymentMethod,
          pickup_date: orderInfo.pickupDate,
          subtotal: subtotal,
          shipping_cost: shipInfo.shippingCost || 0,
          shipping_discount: shipInfo.discount,
          grand_total: grandTotal,
          status: 'pending',
          user_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (order) {
        const orderItems = cart.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          qty: item.qty,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Add to tracking
        setTrackingPhone(orderInfo.customerPhone);
        fetchUserOrders(orderInfo.customerPhone, false);
      }
    } catch (error: any) {
      console.error('Error saving order:', error);
      alert('Gagal menyimpan pesanan ke database: ' + error.message);
      return; // Stop if db save fails
    }

    const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    
    const inboxData = {
      title: 'Pesanan sedang diproses',
      message: `Terima kasih, ${orderInfo.customerName}! Pesanan Anda telah kami simpan dan sedang diteruskan ke Admin via WhatsApp.`,
      icon: '⏳'
    };
    setInbox(inboxData);
    localStorage.setItem('hijrahTokoInbox', JSON.stringify(inboxData));
    
    clearCart();
    window.open(whatsappUrl, '_blank');
    document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserOrders = async (identifier: string, showAlert: boolean = true) => {
    if (!identifier) return;
    setIsTracking(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)');
      
      // If identifier is a UUID (user.id), use user_id, else use customer_phone
      if (identifier.length > 20 && identifier.includes('-')) {
        query = query.eq('user_id', identifier);
      } else {
        query = query.eq('customer_phone', identifier);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserOrders(data || []);
      if (data && data.length > 0) {
        if (showAlert) document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (showAlert) alert('Tidak ditemukan pesanan dengan nomor telepon/ID tersebut.');
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      if (showAlert) alert('Gagal melacak pesanan.');
    } finally {
      setIsTracking(false);
    }
  };

  const navToCategory = (e: any, cat: string) => {
    e.preventDefault();
    document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(cat);
    setMobileNavOpen(false);
  };

  if (!isClient) return null;

  return (
    <>

{/*  Navbar  */}
<nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
  <div className="nav-container">
    <a href="#" className="nav-logo">
      <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="brand-logo" />
      <span className="brand-text">Hijrah<span>Toko</span></span>
    </a>
    <ul className="nav-links">
      <li><a href="#home" className="active">Home</a></li>
      <li className="dropdown">
        <a href="#produk" className="dropbtn">Produk <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
        <div className="dropdown-content">
          <a href="#frozen" onClick={(e) => navToCategory(e, 'frozen')}>🧊 Frozen Food</a>
          <a href="#atk" onClick={(e) => navToCategory(e, 'atk')}>📝 ATK</a>
          <a href="#other" onClick={(e) => navToCategory(e, 'other')}>📦 Other</a>
        </div>
      </li>
      <li><a href="#testimoni">Testimoni</a></li>
      <li><a href="#inbox">Lacak</a></li>
      <li><a href="#kontak">Kontak</a></li>
    </ul>
    <div className="nav-right">
      <div className="nav-actions">
        {user ? (
          <div className="user-dropdown">
            <div className="user-profile-trigger">
              <span className="user-avatar">👤</span>
              <span className="user-name-short">{user.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
            </div>
            <div className="user-menu-content">
              <div className="user-menu-header">
                <strong>{user.user_metadata?.full_name || 'Pelanggan'}</strong>
                <p>{user.email}</p>
              </div>
              <div className="user-menu-divider"></div>
              <a href="#inbox" onClick={() => document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' })}>📦 Pesanan Saya</a>
              <a href="/admin">🛡️ Dashboard Admin</a>
              <div className="user-menu-divider"></div>
              <button className="user-logout-btn" onClick={handleLogout}>🚪 Keluar</button>
            </div>
          </div>
        ) : (
          <button className="btn-login-pill" onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}>Masuk</button>
        )}
      </div>

      <button className="theme-toggle" id="themeToggle" type="button" aria-label="Ubah tema" onClick={toggleTheme}>
        <span className="theme-icon" id="themeIcon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
      <button className="cart-btn" onClick={() => document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' })}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>
        <span className="cart-count" id="cartCount">{cartCount}</span>
      </button>
      <button className="mobile-toggle" id="mobileToggle" aria-label="Menu" onClick={() => setMobileNavOpen(true)}>
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

{/*  Mobile Nav  */}
<div className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`} id="mobileNav">
  <div className="mobile-nav-content">
    <div className="mobile-nav-header">
      <div className="mobile-nav-brand">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" />
        <span>Hijrah Toko</span>
      </div>
      <button className="mobile-nav-close" id="mobileClose" onClick={() => setMobileNavOpen(false)}>&times;</button>
    </div>

    <div className="mobile-nav-scroll">
      <ul className="mobile-nav-links">
        <li><a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>🏠 Home</a></li>
        <li className="dropdown">
          <a href="#produk" className="dropbtn"><span>📦 Produk</span></a>
          <div className="dropdown-content">
            <a href="#frozen" onClick={(e) => navToCategory(e, 'frozen')}>🧊 Frozen Food</a>
            <a href="#atk" onClick={(e) => navToCategory(e, 'atk')}>📝 ATK</a>
            <a href="#other" onClick={(e) => navToCategory(e, 'other')}>📦 Other</a>
          </div>
        </li>
        <li><a href="#testimoni" className={activeSection === 'testimoni' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>⭐ Testimoni</a></li>
        <li><a href="#checkout" className={activeSection === 'checkout' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>🛒 Checkout</a></li>
        <li><a href="#inbox" className={activeSection === 'inbox' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>🔍 Lacak Pesanan</a></li>
        <li><a href="#lokasi" className={activeSection === 'lokasi' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>📍 Lokasi Kami</a></li>
        <li><a href="#kontak" className={activeSection === 'kontak' ? 'active' : ''} onClick={() => setMobileNavOpen(false)}>📞 Kontak</a></li>
        {user && (
          <li><a href="/admin" onClick={() => setMobileNavOpen(false)} style={{ color: 'var(--mint)' }}>🛡️ Admin Panel</a></li>
        )}
      </ul>
    </div>

    <div className="mobile-nav-footer">
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>{user.user_metadata?.full_name || 'User'}</strong>
              <small style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>{user.email}</small>
            </div>
          </div>
          <button 
            className="mobile-auth-btn" 
            style={{ background: '#FEE2E2', color: '#EF4444', boxShadow: 'none' }}
            onClick={() => { handleLogout(); setMobileNavOpen(false); }}
          >
            🚪 Logout
          </button>
        </div>
      ) : (
        <button className="mobile-auth-btn" onClick={() => { setAuthModal({ isOpen: true, mode: 'login' }); setMobileNavOpen(false); }}>
          🔑 Login / Daftar
        </button>
      )}
    </div>
  </div>
</div>

{/*  Hero  */}
<section className="hero" id="home">
  <div className="hero-container">
    <div className="hero-content fade-in">
      <div className="hero-brand-badge">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="hero-logo" />
        <span>Brand Resmi Hijrah Toko</span>
      </div>
      <h1>Solusi <span className="highlight">Dapur & Meja Kerja</span> dalam Satu Pintu.</h1>
      <p>Hijrah Toko menyediakan frozen food berkualitas dan alat tulis kantor lengkap dengan harga terjangkau. Belanja mudah, langsung via WhatsApp!</p>
      <div className="hero-buttons">
        <a href="#produk" className="btn-primary">🛒 Lihat Produk</a>
        <a href="https://wa.me/6285263965031" className="btn-secondary" target="_blank">💬 Hubungi Kami</a>
      </div>
    </div>
    <div className="hero-image fade-in">
      <img src="/assets/images/hero-banner-new.jpg" alt="Hijrah Toko Products" />
    </div>
  </div>
</section>

{/*  Stats  */}
<div className="stats-bar">
  <div className="stats-container">
    <div className="stat-item fade-in"><h3>500+</h3><p>Produk Tersedia</p></div>
    <div className="stat-item fade-in"><h3>1000+</h3><p>Pelanggan Puas</p></div>
    <div className="stat-item fade-in"><h3>⭐ 4.9</h3><p>Rating Toko</p></div>
    <div className="stat-item fade-in"><h3>24 Jam</h3><p>Respon Cepat</p></div>
  </div>
</div>

{/*  Products Section  */}
<section className="section" id="produk">
  <div className="section-header fade-in">
    <h2>Produk Kami</h2>
    <p>Pilihan lengkap untuk kebutuhan dapur dan kantor Anda</p>
    <div className="underline"></div>
  </div>
  <div className="filter-tabs fade-in">
    <button className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>🏪 Semua</button>
    <button className={`filter-btn ${activeTab === 'frozen' ? 'active' : ''}`} onClick={() => setActiveTab('frozen')}>🧊 Frozen Food</button>
    <button className={`filter-btn ${activeTab === 'atk' ? 'active' : ''}`} onClick={() => setActiveTab('atk')}>📝 ATK</button>
    <button className={`filter-btn ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>📦 Other</button>
  </div>
  {loadingProducts && <div style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Memuat produk...</div>}
  <div className="products-grid" id="productsGrid">
    {productsData.filter((p: any) => activeTab === 'all' || p.category === activeTab).map((p: any, i: number) => (
      <div key={p.id} className="product-card fade-in visible" style={{ transitionDelay: `${i * 0.08}s` }} data-category={p.category}>
        <span className={`card-badge badge-${p.category}`}>
          {p.category === 'frozen' ? '🧊 Frozen Food' : p.category === 'atk' ? '📝 ATK' : '📦 Other'}
        </span>
        <div className="card-img-wrap" onClick={() => setSelectedProduct(p)}>
          <img src={p.img} alt={p.name} className="card-img" loading="lazy" />
          <div className="card-overlay"><span>🔍 Lihat Detail</span></div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <h3 onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>{p.name}</h3>
            <span className="sold-label">Terjual {soldCounts[p.id] || 0}</span>
          </div>
          <p className="desc">{p.desc.length > 60 ? p.desc.substring(0, 60) + '...' : p.desc}</p>
        </div>
        <div className="card-footer">
          <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
          <button type="button" className="btn-wa" onClick={() => addToCart(p.id)}>
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.606l4.584-1.47A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.332-.726-6.033-1.96l-.424-.316-2.727.874.892-2.654-.346-.55A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Tambah
          </button>
        </div>
      </div>
    ))}
  </div>
</section>

{/*  Features  */}
<section className="section features-section" id="features">
  <div className="section-header fade-in">
    <h2>Kenapa Hijrah Toko?</h2>
    <p>Keunggulan berbelanja di toko kami</p>
    <div className="underline"></div>
  </div>
  <div className="features-grid">
    <div className="feature-card fade-in">
      <div className="feature-icon">🚚</div>
      <h3>Pengiriman Cepat</h3>
      <p>Pesanan diantar langsung ke alamat Anda dengan cepat dan aman</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">💰</div>
      <h3>Harga Bersahabat</h3>
      <p>Harga kompetitif dengan kualitas produk yang terjamin</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">✅</div>
      <h3>Produk Berkualitas</h3>
      <p>Semua produk terjamin kualitas dan keamanannya</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">💬</div>
      <h3>Order via WhatsApp</h3>
      <p>Pemesanan mudah langsung melalui WhatsApp</p>
    </div>
  </div>
</section>

{/*  Testimoni  */}
<section className="section testimoni-section" id="testimoni">
  <div className="section-header fade-in">
    <h2>Testimoni Pelanggan</h2>
    <p>Apa kata mereka yang sudah berbelanja di Hijrah Toko?</p>
    <div className="underline"></div>
  </div>
  <div className="testimoni-grid">
    <div className="testimoni-list fade-in" id="testimoniList">
    {reviews.map((r: any, i: number) => (
      <div key={i} className="testimoni-card">
        <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
        <h4>{r.name}</h4>
        <p>{r.text}</p>
        <small style={{ color: 'var(--gray)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
          {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </small>
      </div>
    ))}
  </div>
    <div className="testimoni-form-card fade-in">
      <h3>Berikan Ulasan Anda</h3>
      <p style={{"color":"var(--gray)","fontSize":"0.9rem","marginBottom":"1rem"}}>Bagaimana pengalaman Anda berbelanja di sini?</p>
      
      {!user ? (
        <div className="login-required-checkout" style={{ padding: '2rem 1rem' }}>
          <div className="lock-icon">📝</div>
          <h4>Login untuk Mengulas</h4>
          <p>Silakan masuk ke akun Anda untuk membagikan pengalaman belanja Anda di Hijrah Toko.</p>
          <button className="btn-primary" onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}>
            Masuk Sekarang
          </button>
        </div>
      ) : (
        <form id="reviewForm" className="order-form" onSubmit={submitReview}>
          <div className="star-rating-input" id="starInput">
            {[1, 2, 3, 4, 5].map(val => (
              <span key={val} className={`star ${val <= reviewForm.rating ? 'active' : ''}`} onClick={() => setReviewForm({...reviewForm, rating: val})}>★</span>
            ))}
          </div>
          <input type="hidden" id="reviewRating" value={reviewForm.rating} />
          <div className="form-group">
            <label htmlFor="reviewName">Nama</label>
            <input type="text" id="reviewName" placeholder="Nama Anda" required disabled value={user.user_metadata?.full_name || reviewForm.name} />
          </div>
          <div className="form-group">
            <label htmlFor="reviewText">Ulasan</label>
            <textarea id="reviewText" rows={3} placeholder="Tuliskan ulasan Anda tentang toko atau produk kami" required value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})}></textarea>
          </div>
          <button className="btn-primary" type="submit" style={{"width":"100%","justifyContent":"center","marginTop":"0.5rem"}}>Kirim Ulasan</button>
        </form>
      )}
    </div>
  </div>
</section>

{/*  Checkout  */}
<section className="section checkout-section" id="checkout">
  <div className="section-header fade-in">
    <h2>Checkout Pesanan</h2>
    <p>Periksa keranjang, isi data pemesan, lalu kirim pesanan langsung ke WhatsApp admin.</p>
    <div className="underline"></div>
  </div>
  <div className="checkout-grid">
    <div className="checkout-card fade-in">
      <div className="checkout-card-head">
        <div>
          <h3>Keranjang Anda</h3>
          <p>Daftar barang tersimpan otomatis meski halaman di-refresh.</p>
        </div>
        <button className="btn-secondary btn-small" type="button" onClick={clearCart}>Kosongkan</button>
      </div>
      <div className="cart-items" id="cartItems">
    {!cart.length ? (
      <div className="empty-cart">Keranjang masih kosong. Tambahkan produk dari katalog di atas.</div>
    ) : (
      cart.map((item: any) => (
        <div key={item.id} className="cart-item">
          <div>
            <h4>{item.name}</h4>
            <p>Rp {item.price.toLocaleString('id-ID')} x {item.qty}</p>
          </div>
          <div className="cart-item-actions">
            <button type="button" onClick={() => changeQuantity(item.id, -1)}>-</button>
            <span>{item.qty}</span>
            <button type="button" onClick={() => changeQuantity(item.id, 1)}>+</button>
          </div>
        </div>
      ))
    )}
  </div>
      <div className="cart-summary">
        <div>
          <span>Total Item</span>
          <strong id="checkoutItemCount">{cartCount} Item</strong>
        </div>
        <div className="total-price">
          <span>Subtotal</span>
          <strong id="checkoutTotal">Rp {getCartSubtotal().toLocaleString('id-ID')}</strong>
        </div>
      </div>
    </div>

    <div className="checkout-card fade-in">
      <div className="checkout-card-head form-head">
        <div>
          <h3>Data Pemesan</h3>
          <p>Lengkapi informasi agar admin bisa memproses pesanan Anda.</p>
        </div>
      </div>
      
      {!user ? (
        <div className="login-required-checkout">
          <div className="lock-icon">🔒</div>
          <h4>Login Diperlukan</h4>
          <p>Anda harus masuk ke akun Anda untuk dapat mengisi data pemesan dan menyelesaikan pembelian.</p>
          <button className="btn-primary" onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}>
            Masuk Sekarang
          </button>
          <p className="register-hint">Belum punya akun? <span onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}>Daftar di sini</span></p>
        </div>
      ) : (
        <form id="orderForm" className="order-form" onSubmit={submitOrder}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerName">Nama Lengkap</label>
              <input type="text" id="customerName" name="customerName" placeholder="Masukkan nama" required value={orderInfo.customerName} onChange={e => setOrderInfo({...orderInfo, customerName: e.target.value})} />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone">Nomor Telepon</label>
              <input type="tel" id="customerPhone" name="customerPhone" placeholder="08xxxxxxxxxx" required value={orderInfo.customerPhone} onChange={e => setOrderInfo({...orderInfo, customerPhone: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pickupDate">Tanggal Pengambilan / Pengiriman</label>
            <input type="date" id="pickupDate" name="pickupDate" required value={orderInfo.pickupDate} onChange={e => setOrderInfo({...orderInfo, pickupDate: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Metode Pengambilan</label>
            <div className="option-grid">
              <label className="option-card">
                <input type="radio" name="deliveryMethod" value="pickup" checked={orderInfo.deliveryMethod === "pickup"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "pickup"})} />
                <span>Ambil di Kedai</span>
                <small>Tanpa ongkir, ambil langsung ke toko.</small>
              </label>
              <label className="option-card">
                <input type="radio" name="deliveryMethod" value="delivery" checked={orderInfo.deliveryMethod === "delivery"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "delivery"})} />
                <span>Diantarkan ke Alamat</span>
                <small>Ongkir dihitung otomatis dari lokasi Anda.</small>
              </label>
            </div>
          </div>

          <div id="deliveryFields" className={`delivery-fields ${orderInfo.deliveryMethod === 'delivery' ? '' : 'hidden'}`}>
            <div className="form-group">
              <label htmlFor="customerAddress">Alamat Lengkap / Lokasi</label>
              <textarea id="customerAddress" name="customerAddress" rows={4} placeholder="Masukkan alamat lengkap atau gunakan lokasi saat ini" value={orderInfo.customerAddress} onChange={e => setOrderInfo({...orderInfo, customerAddress: e.target.value})}></textarea>
            </div>
            <div className="location-tools">
              <button className="btn-secondary" type="button" id="useLocationBtn" onClick={useCurrentLocation} disabled={isLocating}>
                {isLocating ? '⌛ Sedang Mengambil Lokasi...' : '📍 Gunakan Lokasi Saya'}
              </button>
              <p className="location-status" id="locationStatus">
                {orderInfo.customerLatitude ? `✅ Lokasi Berhasil Diambil (${Number(orderInfo.customerLatitude).toFixed(4)}, ${Number(orderInfo.customerLongitude).toFixed(4)})` : '❌ Lokasi belum diambil.'}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Metode Pembayaran</label>
            <div className="option-grid">
              <label className="option-card">
                <input type="radio" name="paymentMethod" value="COD" checked={orderInfo.paymentMethod === "COD"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "COD"})} />
                <span>COD (Bayar di Tempat)</span>
                <small>Bayar saat barang diterima atau diambil.</small>
              </label>
              <label className="option-card">
                <input type="radio" name="paymentMethod" value="Mandiri" checked={orderInfo.paymentMethod === "Mandiri"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "Mandiri"})} />
                <span>Transfer Bank Mandiri</span>
                <small>Transfer ke rekening Mandiri.</small>
              </label>
              <label className="option-card">
                <input type="radio" name="paymentMethod" value="BSI" checked={orderInfo.paymentMethod === "BSI"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "BSI"})} />
                <span>Transfer Bank BSI</span>
                <small>Transfer ke rekening BSI.</small>
              </label>
            </div>
          </div>
          <div className="payment-instructions" id="paymentInstructions">
            <h4>Instruksi Pembayaran</h4>
            <p id="paymentInstructionText">{PAYMENT_INFO[orderInfo.paymentMethod as keyof typeof PAYMENT_INFO]}</p>
          </div>

          <div className="cost-breakdown">
            <div><span>Subtotal Barang</span><strong id="subtotalPrice">Rp {getCartSubtotal().toLocaleString('id-ID')}</strong></div>
            <div><span>Ongkos Kirim</span><strong id="shippingCost">{shipInfo.shippingCost === null ? 'Pilih Alamat' : `Rp ${shipInfo.shippingCost.toLocaleString('id-ID')}`}</strong></div>
            {shipInfo.discount > 0 && (
              <div style={{ color: '#059669' }}><span>Diskon Ongkir</span><strong id="shippingDiscount">- Rp {shipInfo.discount.toLocaleString('id-ID')}</strong></div>
            )}
            <div className="total-row">
              <span>Total Bayar</span>
              <strong id="grandTotal">Rp {grandTotal.toLocaleString('id-ID')}</strong>
            </div>
          </div>
          <div className="shipping-meta">
            <p id="distanceInfo">Jarak tempuh: {shipInfo.distanceKm === null ? '-' : `${shipInfo.distanceKm.toLocaleString('id-ID')} km`}</p>
            <p id="shippingDetail">{shipInfo.detail}</p>
          </div>
          <input type="hidden" id="customerLatitude" name="customerLatitude" />
          <input type="hidden" id="customerLongitude" name="customerLongitude" />
          <input type="hidden" id="customerMapsLink" name="customerMapsLink" />
          <button className="btn-primary submit-order-btn" type="submit">Kirim Pesanan</button>
        </form>
      )}
    </div>
  </div>
</section>

{/*  Location  */}
<section className="section location-section" id="lokasi">
  <div className="section-header fade-in">
    <h2>Lokasi Kami</h2>
    <p>Lihat posisi toko dan rute menuju Hijrah Toko melalui peta di bawah ini.</p>
    <div className="underline"></div>
  </div>
  <div className="location-card fade-in">
    <div className="location-info">
      <h3>Hijrah Toko</h3>
      <p>Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik, Kabupaten Padang Pariaman, Sumatera Barat 25574</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Plus Code: C647+95W</p>
      <a className="btn-secondary" href="https://www.google.com/maps/place/Hijrah+TOKO/@-0.5843105,100.2442436,19z" target="_blank" rel="noopener noreferrer">Buka di Google Maps</a>
    </div>
    <div className="map-embed">
      <iframe
        title="Lokasi Hijrah Toko"
        src="https://www.google.com/maps?q=-0.5843105,100.2442436&z=17&output=embed"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

{/*  Inbox Notification & Order Tracking  */}
<section className="section inbox-section" id="inbox">
  <div className="section-header fade-in">
    <h2>Lacak & Notifikasi</h2>
    <p>Pantau status pesanan Anda secara realtime di sini.</p>
    <div className="underline"></div>
  </div>

  <div className="inbox-container">
    {/* Realtime Notification Card */}
    <div className={`inbox-card fade-in ${inbox.title ? 'active' : ''}`} id="inboxCard" style={{ marginBottom: '2rem' }}>
      <div className="inbox-icon">{inbox.icon || '📨'}</div>
      <div>
        <h3 id="inboxTitle">{inbox.title || 'Belum ada notifikasi baru'}</h3>
        <p id="inboxMessage">{inbox.message || 'Silakan lakukan pemesanan atau lacak nomor HP Anda.'}</p>
      </div>
    </div>

    {/* Tracking Form */}
    <div className="testimoni-form-card fade-in" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
      <h3>Lacak Riwayat Pesanan</h3>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="tel" 
            placeholder="Masukkan nomor HP Anda (contoh: 0812...)" 
            value={trackingPhone} 
            onChange={(e) => setTrackingPhone(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && fetchUserOrders(trackingPhone, true)}
          />
          <button className="btn-primary" onClick={() => fetchUserOrders(trackingPhone, true)} disabled={isTracking}>
            {isTracking ? '...' : 'Lacak'}
          </button>
        </div>
      </div>
    </div>

    {/* Order History List */}
    {userOrders.length > 0 && (
      <div className="user-orders-list fade-in">
        {userOrders.map((order: any) => (
          <div key={order.id} className="checkout-card" style={{ marginBottom: '1rem', padding: '1.25rem', borderLeft: `5px solid ${
            order.status === 'shipped' ? '#3730A3' : order.status === 'completed' ? '#065F46' : 'var(--mint)'
          }` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>Pesanan #{order.id.toString().slice(-4)}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{new Date(order.created_at).toLocaleString('id-ID')}</p>
              </div>
              <span className={`status-pill status-${order.status}`} style={{ margin: 0 }}>
                {order.status.toUpperCase()}
              </span>
            </div>
            
            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              <p><strong>Status:</strong> {
                order.status === 'pending' ? 'Menunggu konfirmasi admin.' :
                order.status === 'confirmed' ? 'Pesanan dikonfirmasi.' :
                order.status === 'processing' ? 'Pesanan sedang diproses/disiapkan.' :
                order.status === 'shipped' ? '📦 Pesanan sedang dalam perjalanan!' :
                order.status === 'completed' ? 'Pesanan telah selesai diterima.' :
                'Pesanan dibatalkan.'
              }</p>
              <div style={{ marginTop: '0.5rem', background: 'var(--hero-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.product_name} x {item.qty}</span>
                    <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Bayar</span>
                  <span>Rp {order.grand_total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>

{/*  Location  */}
<section className="section" id="lokasi" style={{ background: 'var(--surface-soft)' }}>
  <div className="section-header fade-in">
    <h2>Lokasi Kami</h2>
    <p>Kunjungi toko fisik kami untuk melihat produk secara langsung atau ambil pesanan Anda.</p>
    <div className="underline"></div>
  </div>
  <div className="container fade-in">
    <div className="location-card">
      <div className="location-info-pills">
        <div className="info-pill">
          <span>📍</span>
          <p>Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik</p>
        </div>
        <div className="info-pill">
          <span>🕒</span>
          <p>Buka Setiap Hari: 08:00 - 21:00</p>
        </div>
      </div>
      <div className="map-frame-wrap">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.658742838734!2d100.210691214753!3d0.5939346995666792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd527877c8e9b67%3A0xe8c1f3c3a3a3a3a3!2sHijrah%20TOKO!5e0!3m2!1sid!2sid!4v1714545678901!5m2!1sid!2sid" 
          width="100%" 
          height="450" 
          style={{ border: 0, borderRadius: '16px' }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="https://maps.app.goo.gl/P2zZpP8p6P8p6P8p6" target="_blank" className="btn-primary" style={{ display: 'inline-flex' }}>
          🌐 Buka di Google Maps
        </a>
      </div>
    </div>
  </div>
</section>

{/*  Footer  */}
<footer className="footer" id="kontak">
  <div className="footer-grid">
    <div className="footer-brand">
      <div className="footer-brand-head">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="footer-logo" />
        <h4>Hijrah Toko</h4>
      </div>
      <p>Toko serba ada yang menyediakan frozen food berkualitas dan alat tulis kantor lengkap untuk kebutuhan Anda sehari-hari.</p>
      <div className="social-links">
        <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
        <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
        <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
      </div>
    </div>
    <div>
      <h4>Menu</h4>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#produk">Produk</a></li>
        <li><a href="#frozen" >Frozen Food</a></li>
        <li><a href="#atk" >ATK</a></li>
        <li><a href="#other" >Other</a></li>
        <li><a href="#testimoni">Testimoni</a></li>
      </ul>
    </div>
    <div>
      <h4>Jam Operasional</h4>
      <ul>
        <li>Senin - Sabtu</li>
        <li>08:00 - 21:00 WIB</li>
        <li style={{"marginTop":"0.5rem"}}>Minggu</li>
        <li>09:00 - 17:00 WIB</li>
      </ul>
    </div>
    <div>
      <h4>Kontak</h4>
      <ul>
        <li>📍 Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik, Kab. Padang Pariaman, Sumatera Barat</li>
        <li>📱 0852-6396-5031</li>
        <li>📧 hijrahtoko@gmail.com</li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <p>&copy; 2026 Hijrah Toko. All rights reserved. | <a href="/admin" style={{ color: 'inherit', opacity: 0.5, fontSize: '0.7rem' }}>Admin</a></p>
  </div>
</footer>

{/*  Scroll to Top  */}
<button className={`scroll-top ${scrolled ? 'visible' : ''}`} id="scrollTop" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
</button>


{/* Product Detail Modal */}
{selectedProduct && (
  <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
      <div className="modal-grid">
        <div className="modal-image">
          <img src={selectedProduct.img} alt={selectedProduct.name} />
        </div>
        <div className="modal-info">
          <span className={`card-badge badge-${selectedProduct.category}`} style={{ position: 'static', display: 'inline-block', marginBottom: '1rem' }}>
            {selectedProduct.category.toUpperCase()}
          </span>
          <h1>{selectedProduct.name}</h1>
          <div className="modal-meta">
            <span className="modal-price">Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
            <div className="modal-stats">
              <span className="stat-pill">⭐ 4.9</span>
              <span className="stat-pill">Terjual {soldCounts[selectedProduct.id] || 0}</span>
            </div>
          </div>
          <div className="modal-desc">
            <h4>Deskripsi Produk</h4>
            <p>{selectedProduct.desc}</p>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}>
              🛒 Tambah ke Keranjang
            </button>
            <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo Admin, saya ingin bertanya tentang produk: ${selectedProduct.name}`)}`} 
               target="_blank" className="btn-secondary">
              💬 Tanya Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* Auth Modal */}
{authModal.isOpen && (
  <div className="modal-overlay" onClick={() => setAuthModal({ ...authModal, isOpen: false })}>
    <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setAuthModal({ ...authModal, isOpen: false })}>&times;</button>
      <div className="auth-header">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" className="auth-logo" />
        <h2>{authModal.mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h2>
        <p>{authModal.mode === 'login' ? 'Silakan login untuk kemudahan bertransaksi.' : 'Daftar sekarang untuk mulai belanja di Hijrah Toko.'}</p>
      </div>
      
      <form onSubmit={handleAuth} className="order-form">
        {authModal.mode === 'register' && (
          <>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                placeholder="Masukkan nama lengkap" 
                required 
                value={authForm.name} 
                onChange={e => setAuthForm({ ...authForm, name: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Nomor Telepon (WhatsApp)</label>
              <input 
                type="tel" 
                placeholder="0812..." 
                required 
                value={authForm.phone} 
                onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Alamat Lengkap</label>
              <textarea 
                placeholder="Masukkan alamat pengiriman Anda" 
                required 
                rows={2}
                value={authForm.address} 
                onChange={e => setAuthForm({ ...authForm, address: e.target.value })} 
              />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            placeholder="nama@email.com" 
            required 
            value={authForm.email} 
            onChange={e => setAuthForm({ ...authForm, email: e.target.value })} 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            required 
            value={authForm.password} 
            onChange={e => setAuthForm({ ...authForm, password: e.target.value })} 
          />
        </div>
        <button className="btn-primary auth-submit" type="submit" disabled={authLoading}>
          {authLoading ? 'Memproses...' : (authModal.mode === 'login' ? 'Masuk' : 'Daftar')}
        </button>
      </form>
      
      <div className="auth-footer">
        {authModal.mode === 'login' ? (
          <p>Belum punya akun? <span onClick={() => setAuthModal({ ...authModal, mode: 'register' })}>Daftar Sekarang</span></p>
        ) : (
          <p>Sudah punya akun? <span onClick={() => setAuthModal({ ...authModal, mode: 'login' })}>Login di Sini</span></p>
        )}
      </div>
    </div>
  </div>
)}

    </>
  );
}
