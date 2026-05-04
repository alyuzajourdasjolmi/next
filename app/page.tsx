"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  Moon, 
  Sun, 
  User as UserIcon, 
  LogOut, 
  MapPin, 
  Phone, 
  MessageSquare,
  Package,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';



const WA_NUMBER = "6285263965031";
const STORE_NAME = "Hijrah Toko";
const STORE_COORDINATES = { lat: -0.5940091, lon: 100.2129566 };
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
      orderInfo.deliveryMethod === 'pickup' ? `Jadwal Ambil: ${orderInfo.pickupDate}` : 'Jadwal: Segera (Diantar)', '',
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
    <motion.a 
      href="#" 
      className="nav-logo"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="brand-logo" />
      <span className="brand-text">Hijrah<span>Toko</span></span>
    </motion.a>
    
    <ul className="nav-links">
      <li><a href="#home" className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
      <li className="dropdown">
        <a href="#produk" className="dropbtn">
          Produk <ChevronDown className="chevron" size={16} />
        </a>
        <div className="dropdown-content">
          <a href="#frozen" onClick={(e) => navToCategory(e, 'frozen')}>🧊 Frozen Food</a>
          <a href="#atk" onClick={(e) => navToCategory(e, 'atk')}>📝 ATK</a>
          <a href="#other" onClick={(e) => navToCategory(e, 'other')}>📦 Lainnya</a>
        </div>
      </li>
      <li><a href="#testimoni" className={activeSection === 'testimoni' ? 'active' : ''}>Testimoni</a></li>
      <li><a href="#inbox" className={activeSection === 'inbox' ? 'active' : ''}>Lacak</a></li>
      <li><a href="#kontak" className={activeSection === 'kontak' ? 'active' : ''}>Kontak</a></li>
    </ul>

    <div className="nav-right">
      <div className="nav-actions">
        {user ? (
          <div className="user-dropdown">
            <div className="user-profile-trigger">
              <div className="user-avatar">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || <UserIcon size={18} />}
              </div>
              <span className="user-name-short">{user.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
            </div>
            <div className="user-menu-content">
              <div className="user-menu-header">
                <strong>{user.user_metadata?.full_name || 'Pelanggan'}</strong>
                <p>{user.email}</p>
              </div>
              <div className="user-menu-divider"></div>
              <a href="#inbox" onClick={() => document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' })}>
                <Package size={16} /> Pesanan Saya
              </a>
              <a href="/admin">
                <CheckCircle2 size={16} /> Dashboard Admin
              </a>
              <div className="user-menu-divider"></div>
              <button className="user-logout-btn" onClick={handleLogout}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-login-pill" onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}>
            Masuk
          </button>
        )}
      </div>

      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <button className="cart-btn" onClick={() => document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' })}>
        <ShoppingCart size={20} />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span 
              className="cart-count"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <button className="mobile-toggle" onClick={() => setMobileNavOpen(true)}>
        <Menu size={24} />
      </button>
    </div>
  </div>
</nav>

{/*  Mobile Nav  */}
<AnimatePresence>
  {mobileNavOpen && (
    <motion.div 
      className="mobile-nav open"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="mobile-nav-content">
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand">
            <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" />
            <span>Hijrah Toko</span>
          </div>
          <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="mobile-nav-scroll">
          <ul className="mobile-nav-links">
            <li><a href="#home" onClick={() => setMobileNavOpen(false)}>🏠 Home</a></li>
            <li><a href="#produk" onClick={() => setMobileNavOpen(false)}>📦 Produk</a></li>
            <li><a href="#testimoni" onClick={() => setMobileNavOpen(false)}>⭐ Testimoni</a></li>
            <li><a href="#checkout" onClick={() => setMobileNavOpen(false)}>🛒 Checkout</a></li>
            <li><a href="#inbox" onClick={() => setMobileNavOpen(false)}>🔍 Lacak Pesanan</a></li>
            <li><a href="#lokasi" onClick={() => setMobileNavOpen(false)}>📍 Lokasi</a></li>
            <li><a href="#kontak" onClick={() => setMobileNavOpen(false)}>📞 Kontak</a></li>
          </ul>
        </div>

        <div className="mobile-nav-footer">
          {user ? (
            <div className="mobile-user-info">
              <div className="user-details">
                <div className="user-avatar">
                   {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <strong>{user.user_metadata?.full_name || 'User'}</strong>
                  <p>{user.email}</p>
                </div>
              </div>
              <button className="mobile-logout-btn" onClick={handleLogout}>
                Keluar
              </button>
            </div>
          ) : (
            <button className="mobile-auth-btn" onClick={() => { setAuthModal({ isOpen: true, mode: 'login' }); setMobileNavOpen(false); }}>
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/*  Hero  */}
<section className="hero" id="home">
  <div className="hero-container">
    <motion.div 
      className="hero-content"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="hero-brand-badge">
        <TrendingUp size={16} />
        <span>Toko Terpercaya & Berkualitas</span>
      </div>
      <h1>
        Solusi <span className="highlight">Dapur & Kantor</span> <br />
        Dalam Satu Genggaman.
      </h1>
      <p>
        Hijrah Toko menghadirkan pilihan frozen food premium dan kebutuhan kantor terlengkap. 
        Belanja praktis, pengiriman cepat, harga bersahabat.
      </p>
      <div className="hero-buttons">
        <motion.a 
          href="#produk" 
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart size={18} /> Belanja Sekarang
        </motion.a>
        <motion.a 
          href="https://wa.me/6285263965031" 
          className="btn-secondary" 
          target="_blank"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare size={18} /> Tanya Admin
        </motion.a>
      </div>
    </motion.div>
    
    <motion.div 
      className="hero-image"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <img src="/assets/images/hero-banner-new.jpg" alt="Hijrah Toko Products" />
      <div className="hero-floating-card top-right">
        <Star className="text-yellow-400" fill="currentColor" size={16} />
        <span>Top Rated Store</span>
      </div>
    </motion.div>
  </div>
</section>

{/*  Stats  */}
<div className="stats-bar">
  <div className="stats-container">
    {[
      { label: 'Produk Tersedia', value: '500+', icon: <Package size={24} /> },
      { label: 'Pelanggan Puas', value: '1000+', icon: <UserIcon size={24} /> },
      { label: 'Rating Toko', value: '⭐ 4.9', icon: <Star size={24} /> },
      { label: 'Respon Cepat', value: '24 Jam', icon: <Clock size={24} /> },
    ].map((item, i) => (
      <motion.div 
        key={i}
        className="stat-item"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="stat-icon" style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
          {item.icon}
        </div>
        <h3>{item.value}</h3>
        <p>{item.label}</p>
      </motion.div>
    ))}
  </div>
</div>

{/*  Products Section  */}
<section className="section" id="produk">
  <div className="section-header">
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      Katalog Produk
    </motion.h2>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
    >
      Pilihan terbaik untuk kebutuhan dapur premium dan peralatan kantor modern Anda.
    </motion.p>
    <div className="underline"></div>
  </div>

  <div className="filter-tabs">
    {[
      { id: 'all', label: 'Semua', icon: '🏪' },
      { id: 'frozen', label: 'Frozen Food', icon: '🧊' },
      { id: 'atk', label: 'ATK', icon: '📝' },
      { id: 'other', label: 'Lainnya', icon: '📦' },
    ].map((tab) => (
      <button 
        key={tab.id}
        className={`filter-btn ${activeTab === tab.id ? 'active' : ''}`} 
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.icon} {tab.label}
      </button>
    ))}
  </div>

  {loadingProducts ? (
    <div className="loading-state">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{ width: 40, height: 40, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }}
      />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Memuat koleksi terbaik kami...</p>
    </div>
  ) : (
    <div className="products-grid">
      <AnimatePresence mode="popLayout">
        {productsData
          .filter((p: any) => activeTab === 'all' || p.category === activeTab)
          .map((p: any, i: number) => (
            <motion.div 
              layout
              key={p.id} 
              className="product-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <span className={`card-badge badge-${p.category}`}>
                {p.category === 'frozen' ? 'Frozen' : p.category === 'atk' ? 'ATK' : 'Lainnya'}
              </span>
              <div className="card-img-wrap" onClick={() => setSelectedProduct(p)}>
                <img src={p.img} alt={p.name} className="card-img" loading="lazy" />
                <div className="card-overlay">
                  <Search size={24} color="white" />
                  <span>Detail</span>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h3 onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>{p.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                   <span className="sold-label">Terjual {soldCounts[p.id] || 0}+</span>
                   <div style={{ display: 'flex', color: '#FACC15' }}>
                     {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                   </div>
                </div>
                <p className="desc">{p.desc.length > 70 ? p.desc.substring(0, 70) + '...' : p.desc}</p>
              </div>
              <div className="card-footer">
                <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
                <button type="button" className="btn-wa" onClick={() => addToCart(p.id)}>
                  <ShoppingCart size={16} />
                  Tambah
                </button>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )}
</section>

{/*  Features  */}
<section className="section features-section" id="features">
  <div className="section-header">
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      Kenapa Memilih Kami?
    </motion.h2>
    <div className="underline"></div>
  </div>
  <div className="features-grid">
    {[
      { title: "Kualitas Terjamin", desc: "Produk frozen food higienis dan ATK bermerek berkualitas tinggi.", icon: <CheckCircle2 size={32} /> },
      { title: "Harga Bersahabat", desc: "Penawaran harga terbaik untuk eceran maupun kebutuhan kantor.", icon: <Star size={32} /> },
      { title: "Pengiriman Cepat", desc: "Layanan antar cepat ke alamat Anda untuk wilayah sekitarnya.", icon: <Truck size={32} /> },
      { title: "Respon Kilat", desc: "Admin siaga membantu pesanan Anda melalui WhatsApp 24 jam.", icon: <MessageSquare size={32} /> }
    ].map((f, i) => (
      <motion.div 
        key={i} 
        className="feature-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="feature-icon">{f.icon}</div>
        <h3>{f.title}</h3>
        <p>{f.desc}</p>
      </motion.div>
    ))}
  </div>
</section>

{/*  Testimonials  */}
<section className="section" id="testimoni" style={{ background: 'var(--bg-main)' }}>
  <div className="section-header">
    <h2>Apa Kata Mereka?</h2>
    <p>Kepuasan pelanggan adalah prioritas utama Hijrah Toko.</p>
    <div className="underline"></div>
  </div>
  <div className="products-grid">
    {reviews.map((rev, i) => (
      <motion.div 
        key={i} 
        className="checkout-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        style={{ padding: '2rem' }}
      >
        <div style={{ display: 'flex', color: '#FACC15', marginBottom: '1rem', gap: '0.25rem' }}>
          {[...Array(rev.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
        </div>
        <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          "{rev.text}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ width: '40px', height: '40px' }}>{rev.name.charAt(0)}</div>
          <div>
            <strong style={{ display: 'block' }}>{rev.name}</strong>
            <small style={{ color: 'var(--text-light)' }}>{rev.date}</small>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
</section>

{/*  Checkout  */}
<section className="section checkout-section" id="checkout">
  <div className="section-header">
    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>Selesaikan Pesanan</motion.h2>
    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
      Lengkapi detail pesanan Anda untuk konfirmasi instan via WhatsApp.
    </motion.p>
    <div className="underline"></div>
  </div>

  <div className="checkout-grid">
    <motion.div 
      className="checkout-card"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <div className="checkout-card-head">
        <h3><ShoppingCart size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Keranjang Belanja</h3>
        {cart.length > 0 && <button className="btn-secondary btn-small" onClick={clearCart}>Bersihkan</button>}
      </div>
      
      {cart.length === 0 ? (
        <div className="empty-cart" style={{ border: '2px dashed var(--border-main)', padding: '4rem 2rem' }}>
          <Package size={48} strokeWidth={1} style={{ marginBottom: '1rem', color: 'var(--text-light)' }} />
          <p>Wah, keranjangmu masih kosong!</p>
          <a href="#produk" className="btn-primary btn-small" style={{ marginTop: '1rem' }}>Mulai Belanja</a>
        </div>
      ) : (
        <div className="cart-items">
          <AnimatePresence>
            {cart.map((item: any) => (
              <motion.div 
                key={item.id} 
                className="cart-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div style={{ flex: 1 }}>
                  <h4>{item.name}</h4>
                  <p style={{ color: 'var(--primary)', fontWeight: '700' }}>Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                </div>
                <div className="cart-item-actions">
                  <button onClick={() => changeQuantity(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQuantity(item.id, 1)}>+</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="cart-summary" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-surface-soft)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <strong>Rp {subtotal.toLocaleString('id-ID')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ongkir ({orderInfo.deliveryMethod})</span>
              <strong>{shipInfo.finalCost ? `Rp ${shipInfo.finalCost.toLocaleString('id-ID')}` : 'Rp 0'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed var(--border-main)' }}>
              <span style={{ fontWeight: '700' }}>Total Pembayaran</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Rp {grandTotal.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </div>
      )}
    </motion.div>

    <motion.div 
      className="checkout-card"
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <h3><UserIcon size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Data Pengiriman</h3>
      
      {!user ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <AlertCircle size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
          <h4 style={{ marginBottom: '1rem' }}>Login Diperlukan</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Silakan login terlebih dahulu untuk melanjutkan proses pemesanan.</p>
          <button className="btn-primary" onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}>Masuk Sekarang</button>
        </div>
      ) : (
        <form onSubmit={submitOrder} className="order-form" style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>Nama Penerima</label>
            <input type="text" required value={orderInfo.customerName} onChange={e => setOrderInfo({...orderInfo, customerName: e.target.value})} disabled />
          </div>
          
          <div className="form-group">
            <label>Metode Pengambilan</label>
            <div className="option-grid">
              <label className={`option-card ${orderInfo.deliveryMethod === 'pickup' ? 'active' : ''}`}>
                <input type="radio" name="deliveryMethod" value="pickup" checked={orderInfo.deliveryMethod === 'pickup'} onChange={e => setOrderInfo({...orderInfo, deliveryMethod: e.target.value})} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Package size={20} />
                  <div>
                    <strong>Ambil di Kedai</strong>
                    <small style={{ display: 'block' }}>Gratis biaya pengiriman</small>
                  </div>
                </div>
              </label>
              <label className={`option-card ${orderInfo.deliveryMethod === 'delivery' ? 'active' : ''}`}>
                <input type="radio" name="deliveryMethod" value="delivery" checked={orderInfo.deliveryMethod === 'delivery'} onChange={e => setOrderInfo({...orderInfo, deliveryMethod: e.target.value})} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Truck size={20} />
                  <div>
                    <strong>Kirim ke Alamat</strong>
                    <small style={{ display: 'block' }}>Otomatis hitung ongkir</small>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {orderInfo.deliveryMethod === 'delivery' ? (
              <motion.div 
                key="delivery"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="form-group"
              >
                <label>Alamat Pengiriman</label>
                <div style={{ marginBottom: '1rem' }}>
                  <button type="button" className="btn-secondary btn-small" onClick={useCurrentLocation} disabled={isLocating}>
                    {isLocating ? '📍 Mencari...' : '📍 Gunakan Lokasi Saat Ini'}
                  </button>
                </div>
                <textarea 
                  required 
                  placeholder="Masukkan alamat lengkap (No. Rumah, RT/RW, Patokan)" 
                  rows={3} 
                  value={orderInfo.customerAddress} 
                  onChange={e => setOrderInfo({...orderInfo, customerAddress: e.target.value})}
                />
                {shipInfo.status === 'ok' && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid var(--primary)', color: 'var(--primary-dark)', fontSize: '0.9rem' }}
                  >
                    <strong>✅ Ongkir Dihitung:</strong> {shipInfo.detail}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="pickup"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="form-group"
              >
                <label>Rencana Tanggal Pengambilan</label>
                <input type="date" required value={orderInfo.pickupDate} onChange={e => setOrderInfo({...orderInfo, pickupDate: e.target.value})} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group">
            <label>Metode Pembayaran</label>
            <select value={orderInfo.paymentMethod} onChange={e => setOrderInfo({...orderInfo, paymentMethod: e.target.value})}>
              <option value="COD">Tunai / COD (Bayar di Tempat)</option>
              <option value="Mandiri">Transfer Bank Mandiri</option>
              <option value="BSI">Transfer Bank BSI</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.25rem' }}>
            <MessageSquare size={20} /> Konfirmasi Pesanan via WhatsApp
          </button>
        </form>
      )}
    </motion.div>
  </div>
</section>

{/*  Inbox & Tracking  */}
<section className="section" id="inbox" style={{ background: 'var(--bg-surface-soft)' }}>
  <div className="section-header">
    <h2>Lacak Pesanan</h2>
    <p>Pantau status pesanan Anda secara realtime di sini.</p>
    <div className="underline"></div>
  </div>
  
  <div className="nav-container" style={{ maxWidth: '800px' }}>
    <motion.div 
      className="inbox-card active"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="inbox-icon" style={{ background: 'var(--primary)', color: 'white' }}>
          {inbox.icon === '📨' ? <Clock size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{inbox.title || 'Pesanan Anda'}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{inbox.message || 'Status terbaru pesanan Anda akan muncul di sini.'}</p>
        </div>
      </div>

      {userOrders.length > 0 && (
        <div className="order-history" style={{ marginTop: '2rem' }}>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Riwayat Pesanan Terakhir</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {userOrders.slice(0, 3).map((order) => (
              <div key={order.id} style={{ padding: '1.25rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '1rem' }}>Order #{order.id.toString().slice(-6).toUpperCase()}</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • Rp {order.grand_total.toLocaleString('id-ID')}
                  </span>
                </div>
                <button className="btn-secondary btn-small" onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo Admin, saya ingin bertanya status pesanan saya #${order.id}`)}`, '_blank')}>
                   Bantuan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-main)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Lacak pesanan lainnya dengan nomor WhatsApp:</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            placeholder="Contoh: 08123456789" 
            value={trackingPhone}
            onChange={(e) => setTrackingPhone(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={() => fetchUserOrders(trackingPhone)}>Lacak</button>
        </div>
      </div>
    </motion.div>
  </div>
</section>

{/*  Location Section  */}
<section className="section" id="lokasi">
  <div className="section-header">
    <h2>Lokasi Toko</h2>
    <p>Kami berlokasi strategis di Padang Pariaman, siap melayani Anda.</p>
    <div className="underline"></div>
  </div>
  <div className="nav-container">
    <div className="location-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', overflow: 'hidden', padding: 0 }}>
       <div style={{ padding: '3rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="inbox-icon" style={{ background: 'var(--bg-surface-soft)', color: 'var(--primary)' }}><MapPin size={24} /></div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Padang Pariaman</h3>
              <p style={{ color: 'var(--text-muted)' }}>Sumatera Barat, Indonesia</p>
            </div>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Alamat</h4>
              <p style={{ fontWeight: '600' }}>Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Jam Buka</h4>
              <p style={{ fontWeight: '600' }}>Senin - Minggu: 08:00 - 21:00 WIB</p>
            </div>
         </div>
         <a href="https://maps.app.goo.gl/..." target="_blank" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <MapPin size={18} /> Buka di Google Maps
         </a>
       </div>
       <div style={{ minHeight: '400px' }}>
         <iframe 
          title="Map Hijrah Toko"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.288219502685!2d100.21038167425103!3d-0.5940037352848971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4ba03e9900001%3A0x6e9f1680d2830f36!2sHijrah%20Toko!5e0!3m2!1sid!2sid!4v1714578000000!5m2!1sid!2sid" 
          width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
         ></iframe>
       </div>
    </div>
  </div>
</section>

{/*  Footer  */}
<footer className="footer" id="kontak" style={{ background: 'var(--accent)', color: 'white', padding: '6rem 2rem 3rem' }}>
  <div className="nav-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem' }}>
    <div className="footer-col">
      <div className="nav-logo" style={{ marginBottom: '1.5rem' }}>
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" className="brand-logo" />
        <span className="brand-text" style={{ color: 'white' }}>Hijrah<span>Toko</span></span>
      </div>
      <p style={{ color: 'var(--text-light)', lineHeight: '1.8' }}>
        Hijrah Toko adalah pusat penyedia frozen food premium dan alat tulis kantor terlengkap. Kami berkomitmen memberikan kualitas terbaik dan layanan cepat untuk Anda.
      </p>
    </div>
    
    <div className="footer-col">
      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Tautan Cepat</h4>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <li><a href="#home" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Beranda</a></li>
        <li><a href="#produk" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Katalog Produk</a></li>
        <li><a href="#testimoni" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Testimoni</a></li>
        <li><a href="#lokasi" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Lokasi Kami</a></li>
      </ul>
    </div>
    
    <div className="footer-col">
      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Hubungi Kami</h4>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-light)' }}>
          <Phone size={20} className="text-primary" />
          <span>+62 852-6396-5031</span>
        </li>
        <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-light)' }}>
          <MessageSquare size={20} className="text-primary" />
          <span>hijrahtoko@gmail.com</span>
        </li>
        <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-light)' }}>
          <MapPin size={20} className="text-primary" />
          <span>Padang Pariaman, Sumatera Barat</span>
        </li>
      </ul>
    </div>
  </div>
  
  <div style={{ maxWidth: '1280px', margin: '4rem auto 0', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>
    <p>&copy; {new Date().getFullYear()} Hijrah Toko. Seluruh hak cipta dilindungi. Built with ❤️ for your home and office.</p>
  </div>
</footer>

{/*  Modals  */}
<AnimatePresence>
  {authModal.isOpen && (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        className="checkout-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ maxWidth: '480px', width: '100%', padding: '3rem', position: 'relative' }}
      >
        <button onClick={() => setAuthModal({ ...authModal, isOpen: false })} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
          <X size={24} />
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
            <UserIcon size={32} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{authModal.mode === 'login' ? 'Masuk' : 'Buat Akun'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{authModal.mode === 'login' ? 'Senang melihat Anda kembali!' : 'Mulai pengalaman belanjamu sekarang.'}</p>
        </div>

        <form onSubmit={handleAuth} className="order-form">
          {authModal.mode === 'register' && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} placeholder="Nama Anda" />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} placeholder="email@contoh.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.1rem' }} disabled={authLoading}>
            {authLoading ? 'Memproses...' : (authModal.mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {authModal.mode === 'login' ? (
            <p>Belum punya akun? <button onClick={() => setAuthModal({...authModal, mode: 'register'})} style={{ color: 'var(--primary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginLeft: '0.5rem' }}>Daftar di sini</button></p>
          ) : (
            <p>Sudah punya akun? <button onClick={() => setAuthModal({...authModal, mode: 'login'})} style={{ color: 'var(--primary)', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginLeft: '0.5rem' }}>Login di sini</button></p>
          )}
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* Product Detail Modal */}
<AnimatePresence>
  {selectedProduct && (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        className="product-card"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        style={{ maxWidth: '1000px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', padding: 0, overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', background: '#F1F5F9' }}>
          <img src={selectedProduct.img} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span className={`card-badge badge-${selectedProduct.category}`} style={{ position: 'static' }}>{selectedProduct.category}</span>
            <span className="sold-label" style={{ background: 'var(--bg-surface-soft)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.75rem' }}>⭐ 4.9 Rating</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.03em' }}>{selectedProduct.name}</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2.5rem' }}>{selectedProduct.desc}</p>
          
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Harga Spesial</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '800' }}>Rp {selectedProduct.price.toLocaleString('id-ID')}</strong>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Status Stok</span>
                  <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Tersedia</strong>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '1.25rem' }} onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}>
                <ShoppingCart size={20} /> Tambah ke Keranjang
              </button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo Admin, saya tertarik dengan ${selectedProduct.name}`)}`, '_blank')}>
                <MessageSquare size={20} /> Chat
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
</>
  );
}
