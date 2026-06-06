"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
  Star,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Bell,
  Mouse,
  ChefHat,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Wifi,
  Shield,
  Smartphone,
  Bot,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddressSelector from '../components/AddressSelector';
import AddressManager from '../components/AddressManager';



const WA_NUMBER = "6285263965031";
const STORE_NAME = "Hijrah Toko";
const ADMIN_EMAIL = "admin.hijrahtoko@gmail.com";
const STORE_COORDINATES = { lat: -0.5940091, lon: 100.2129566 };
const SHIPPING_NEAR_MAX_KM = 2;
const SHIPPING_MAX_KM = 20;
const SHIPPING_NEAR_BASE = 5000;
const SHIPPING_FAR_BASE = 15000;
const SHIPPING_FAR_PER_KM = 3000;

const PAYMENT_INFO = {
  COD: "Pembayaran dilakukan saat barang diterima atau saat ambil di kedai.",
  Mandiri: "Transfer Bank Mandiri ke 1230012345678 a.n. Hijrah Toko.\n\n⚠️ PENTING: Tolong kirim bukti pembayaran jika tidak maka admin tidak akan mengirim barangnya.",
  BSI: "Transfer Bank BSI ke 7123456789 a.n. Hijrah Toko.\n\n⚠️ PENTING: Tolong kirim bukti pembayaran jika tidak maka admin tidak akan mengirim barangnya."
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

// Google Maps API has been replaced with Leaflet

type Review = {
  id?: number | string;
  name: string;
  rating: number;
  text: string;
  date: string;
};

export default function Home() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const homeAnchor = (hash: string) => isHome ? hash : `/${hash}`;

  const [isClient, setIsClient] = useState(false);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [theme, setTheme] = useState('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [inbox, setInbox] = useState({ title: '', message: '', icon: '📨' });
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [soldCounts, setSoldCounts] = useState<any>({});
  const [isLocating, setIsLocating] = useState(false);
  const [cartToast, setCartToast] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const isLocatingRef = useRef(false);

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

  // Refs for realtime listener to avoid stale closures
  const userIdRef = useRef<string | null>(null);
  const userOrdersRef = useRef(userOrders);

  useEffect(() => {
    userOrdersRef.current = userOrders;
  }, [userOrders]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  const [reviews, setReviews] = useState<Review[]>([
    { name: "Budi Santoso", rating: 5, text: "Pelayanan sangat cepat, frozen food sampai dalam keadaan masih beku sempurna!", date: "2023-10-01" },
    { name: "Siti Aminah", rating: 4, text: "ATK nya lumayan lengkap, harga juga bersahabat. Recommended banget buat anak sekolahan.", date: "2023-10-15" },
    { name: "Rina Wijaya", rating: 5, text: "Toko andalan kalau lagi butuh cemilan cepet. Bakso sapinya enak pol!", date: "2023-11-05" }
  ]);
  const [reviewForm, setReviewForm] = useState({ text: '', rating: 5 });

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
        const userData = session.user;
        setUser(userData);
        // Pre-fill order info strictly from user metadata
        setOrderInfo(prev => ({
          ...prev,
          customerName: userData.user_metadata?.full_name || prev.customerName,
          customerPhone: userData.user_metadata?.phone || userData.phone || prev.customerPhone,
          customerAddress: userData.user_metadata?.address || prev.customerAddress
        }));
        fetchUserOrders(userData.id, false);
      } else {
        setUserOrders([]);
        setInbox({
          title: 'Login untuk lacak pesanan',
          message: 'Silakan login untuk melihat status pesanan sesuai akun Anda.',
          icon: '📨'
        });
      }
    };

    fetchData();
    checkSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userData = session.user;
        setUser(userData);
        setOrderInfo(prev => ({
          ...prev,
          customerName: userData.user_metadata?.full_name || prev.customerName,
          customerPhone: userData.user_metadata?.phone || userData.phone || prev.customerPhone,
          customerAddress: userData.user_metadata?.address || prev.customerAddress
        }));
        fetchUserOrders(userData.id, false);
      } else {
        setUser(null);
        setUserOrders([]);
        setInbox({
          title: 'Login untuk lacak pesanan',
          message: 'Silakan login untuk melihat status pesanan sesuai akun Anda.',
          icon: '📨'
        });
      }
    });
    setTheme(localStorage.getItem('hijrahTokoTheme') || 'light');

    // PWA Install Prompt Detection
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hero auto‑slide every 6 seconds (now three slides including NURA AI)
    const heroTimer = setInterval(() => {
      setHeroPaused(paused => {
        if (!paused) setHeroSlide(prev => (prev + 1) % 3);
        return paused;
      });
    }, 6000);

    // Initial cart load (will be overridden by user-specific useEffect if logged in)
    const initialCart = localStorage.getItem('hijrahTokoCart_guest') || '[]';
    setCart(JSON.parse(initialCart));

    const savedOrderInfo = JSON.parse(localStorage.getItem('hijrahTokoOrderInfo') || '{}');
    setOrderInfo(prev => {
      const merged = { ...prev, ...savedOrderInfo };
      // Always prioritize user metadata if available
      if (user?.user_metadata?.full_name) merged.customerName = user.user_metadata.full_name;
      if (user?.user_metadata?.phone || user?.phone) merged.customerPhone = user.user_metadata?.phone || user.phone;
      if (user?.user_metadata?.address) merged.customerAddress = user.user_metadata.address;
      return merged;
    });
    setInbox(JSON.parse(localStorage.getItem('hijrahTokoInbox') || '{"title":"","message":"","icon":"📨"}'));


    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['home', 'produk', 'features', 'testimoni', 'checkout', 'lokasi', 'inbox', 'kontak'];
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
        const currentUserId = userIdRef.current;
        const isAlreadyInList = userOrdersRef.current.some(o => o.id === payload.new.id);

        if (currentUserId && (payload.new.user_id === currentUserId || isAlreadyInList)) {
          console.log('Match found! Updating UI for order:', payload.new.id);

          setUserOrders(current => {
            const existingOrder = current.find(o => o.id === payload.new.id);
            if (existingOrder) {
              return current.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o);
            }
            return [payload.new, ...current];
          });

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
      clearInterval(heroTimer);
    };
  }, []);

  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(''), 2500);
    return () => clearTimeout(t);
  }, [cartToast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserOrders([]);
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Browser Anda tidak mendukung fitur notifikasi push.');
      return;
    }

    try {
      // 1. Request Notification Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Izin notifikasi ditolak.');
        return;
      }

      // 2. Register Service Worker and wait for it to be ready
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      // Helper function to convert VAPID key
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // 3. Subscribe to PushManager
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BBT4uu_E_FOpIUL3L02eWjVngna7ASi5gDDAG1w_k_a7-lc0VXHhhXKimWTGlhKLGRydjgAmDt9mIJmNz-GctjE';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // 4. Send subscription to server
      const role = user?.email === ADMIN_EMAIL ? 'admin' : 'customer';
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          user_id: user?.id || null,
          role
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save subscription');
      }
      alert('Berhasil mengaktifkan notifikasi push!');
    } catch (error: any) {
      console.error('Push subscription error:', error);
      alert('Gagal mengaktifkan notifikasi: ' + error.message);
    }
  };

  useEffect(() => {
    if (isClient) {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      localStorage.setItem('hijrahTokoTheme', theme);
    }
  }, [theme, isClient]);

  useEffect(() => {
    if (isClient) {
      const cartKey = user ? `hijrahTokoCart_${user.id}` : 'hijrahTokoCart_guest';
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, user, isClient]);

  // Load user-specific cart when user logs in
  useEffect(() => {
    if (isClient && user) {
      const cartKey = `hijrahTokoCart_${user.id}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } else if (isClient && !user) {
      const savedCart = localStorage.getItem('hijrahTokoCart_guest');
      setCart(JSON.parse(savedCart || '[]'));
    }
  }, [user, isClient]);

  useEffect(() => {
    if (user) {
      setOrderInfo(prev => ({
        ...prev,
        customerName: user.user_metadata?.full_name || prev.customerName,
        customerPhone: user.user_metadata?.phone || user.phone || prev.customerPhone,
        customerAddress: user.user_metadata?.address || prev.customerAddress
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isClient) localStorage.setItem('hijrahTokoOrderInfo', JSON.stringify(orderInfo));
  }, [orderInfo, isClient]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const addToCart = (id: number) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    if ((product.stock || 0) <= 0) {
      alert('Maaf, stok produk ini sedang habis!');
      return;
    }
    setCart((prev: any) => {
      const existing = prev.find((item: any) => item.id === id);
      if (existing) return prev.map((item: any) => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartToast('✓ Ditambahkan ke keranjang');
  };

  const changeQuantity = (id: number, delta: number) => {
    const product = productsData.find(p => p.id === id);
    setCart((prev: any) => prev.map((item: any) => {
      if (item.id === id) {
        if (delta > 0 && product && (item.qty + delta) > (product.stock || 0)) {
          alert(`Maaf, stok ${product.name} tidak mencukupi!`);
          return item;
        }
        return { ...item, qty: item.qty + delta };
      }
      return item;
    }).filter((item: any) => item.qty > 0));
  };

  const clearCart = () => setCart([]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Masih ada prompt — langsung install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Prompt tidak tersedia — tampilkan panduan manual
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isIOS || isSafari) {
        alert('📱 Install di iOS/Safari:\n\n1. Tap tombol Share (kotak + panah)\n2. Scroll bawah → "Add to Home Screen"\n3. Tap "Add"');
      } else {
        alert('💻 Install di Chrome/Edge:\n\n1. Klik ikon  ⊕  atau menu (⋮) di address bar\n2. Pilih "Install Hijrah Toko"\n3. Klik "Install"\n\nATAU jika sudah terinstall:\nBuka chrome://apps → klik kanan Hijrah Toko → Remove → kembali ke web ini');
      }
    }
  };

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
      cost = SHIPPING_NEAR_BASE;
      detail = `0 - 2 km: tarif dasar Rp ${SHIPPING_NEAR_BASE.toLocaleString('id-ID')}.`;
    } else {
      const extraDist = dist - SHIPPING_NEAR_MAX_KM;
      const extraCost = Math.ceil(extraDist) * SHIPPING_FAR_PER_KM;
      cost = SHIPPING_FAR_BASE + extraCost;
      detail = `> 2 km: tarif dasar Rp ${SHIPPING_FAR_BASE.toLocaleString('id-ID')} + ${Math.ceil(extraDist)} km x Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')}.`;
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
  const reviewDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pelanggan';
  const visibleUserOrders = userOrders.filter((order: any) => order.status !== 'cancelled');
  // Define the three hero slides we want to display: Store intro, App install promo, and NURA AI
  const heroSlideLabels = ['Belanja Lengkap', 'Install Cepat', 'NURA AI'];

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

    // Gunakan getCurrentPosition langsung agar lebih cepat (tidak menunggu warmup)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      let address = `Koordinat: ${latitude}, ${longitude}`;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
          headers: {
            'Accept-Language': 'id',
            'User-Agent': 'HijrahTokoWeb/1.3'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.display_name) address = data.display_name;
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }

      // Pastikan state diupdate secara sinkron
      setOrderInfo(prev => ({
        ...prev,
        customerLatitude: latitude.toString(),
        customerLongitude: longitude.toString(),
        customerMapsLink: link,
        customerAddress: address
      }));

      setIsLocating(false);
      alert('Lokasi berhasil diperbarui!');
    }, (err) => {
      setIsLocating(false);
      let errorMsg = 'Gagal mengambil lokasi.';
      if (err.code === 1) errorMsg = 'Izin lokasi ditolak.';
      else if (err.code === 2) errorMsg = 'Lokasi tidak tersedia.';
      else if (err.code === 3) errorMsg = 'Waktu habis.';
      alert(errorMsg);
    }, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    });
  };

  const submitReview = async (e: any) => {
    e.preventDefault();
    if (!user) {
      alert('Anda harus login untuk memberikan ulasan.');
      window.location.href = '/auth';
      return;
    }
    const reviewText = reviewForm.text.trim();
    if (!reviewText) {
      alert('Ulasan tidak boleh kosong.');
      return;
    }
    const newReview = {
      name: reviewDisplayName,
      text: reviewText,
      rating: reviewForm.rating,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select();

      if (error) throw error;

      if (data) {
        setReviews((prev) => [data[0], ...prev]);
        setReviewForm({ text: '', rating: 5 });
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
      window.location.href = '/auth';
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
      orderInfo.deliveryMethod === 'pickup' ? `Jadwal Ambil: ${orderInfo.pickupDate}` : `Alamat Kirim: ${orderInfo.customerAddress}\nJadwal: Segera (Diantar)`, '',
      'Rincian Biaya:',
      `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`,
      `Jarak Tempuh: ${shipInfo.distanceKm || '-'} km`,
      `Ongkir: Rp ${(shipInfo.shippingCost || 0).toLocaleString('id-ID')}`,
      `Diskon Ongkir: Rp ${shipInfo.discount.toLocaleString('id-ID')}`,
      `Total Bayar: Rp ${grandTotal.toLocaleString('id-ID')}`, '',
      `Link Lokasi: ${orderInfo.deliveryMethod === 'delivery' ? orderInfo.customerMapsLink : 'Tidak diperlukan'}`
    ].join('\n');

    // Save order to Supabase
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: orderInfo.customerName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pelanggan',
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

        // --- UPDATE STOCK IN DATABASE ---
        for (const item of cart) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();

          if (product && typeof product.stock === 'number') {
            const newStock = Math.max(0, product.stock - item.qty);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id);
          }
        }

        // Refresh order list for akun yang sedang login
        fetchUserOrders(user.id, false);
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

  const fetchUserOrders = async (accountUserId?: string, showAlert: boolean = true) => {
    const targetUserId = accountUserId || user?.id;
    if (!targetUserId) {
      setUserOrders([]);
      setInbox({
        title: 'Login untuk lacak pesanan',
        message: 'Silakan login untuk melihat status pesanan sesuai akun Anda.',
        icon: '📨'
      });
      return;
    }
    setIsTracking(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserOrders(data || []);

      const availableOrders = (data || []).filter((order: any) => order.status !== 'cancelled');

      if (availableOrders.length > 0) {
        const latestOrder = availableOrders[0];
        const statusTitleMap: Record<string, string> = {
          pending: 'Pesanan menunggu konfirmasi',
          confirmed: 'Pesanan dikonfirmasi',
          processing: 'Pesanan sedang diproses',
          shipped: 'Pesanan sedang dikirim',
          completed: 'Pesanan selesai'
        };

        const inboxData = {
          title: statusTitleMap[latestOrder.status] || 'Status pesanan diperbarui',
          message: `Order #${latestOrder.id.toString().slice(-6).toUpperCase()} dengan status ${latestOrder.status.toUpperCase()}.`,
          icon: latestOrder.status === 'completed' ? '✅' : '📨'
        };
        setInbox(inboxData);
        localStorage.setItem('hijrahTokoInbox', JSON.stringify(inboxData));

        if (showAlert) document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const unavailableInbox = {
          title: 'Pesanan tidak tersedia',
          message: 'Akun ini belum memiliki pesanan aktif atau semua pesanan telah dibatalkan.',
          icon: '📦'
        };
        setInbox(unavailableInbox);
        localStorage.setItem('hijrahTokoInbox', JSON.stringify(unavailableInbox));
        if (showAlert) alert('Pesanan tidak tersedia untuk akun ini.');
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
            <li><Link href={homeAnchor('#home')} className={activeSection === 'home' ? 'active' : ''}>Home</Link></li>
            <li className="dropdown">
              <Link href={homeAnchor('#produk')} className="dropbtn">
                Produk <ChevronDown className="chevron" size={16} />
              </Link>
              <div className="dropdown-content">
                <Link href={homeAnchor('#frozen')} onClick={(e) => navToCategory(e, 'frozen')}>🧊 Frozen Food</Link>
                <Link href={homeAnchor('#atk')} onClick={(e) => navToCategory(e, 'atk')}>📝 ATK</Link>
                <Link href={homeAnchor('#other')} onClick={(e) => navToCategory(e, 'other')}>📦 Lainnya</Link>
              </div>
            </li>
            <li><Link href={homeAnchor('#testimoni')} className={activeSection === 'testimoni' ? 'active' : ''}>Testimoni</Link></li>
            <li><Link href="/features" className={pathname === '/features' ? 'active' : ''}>Fitur</Link></li>
            <li><Link href="/pricing" className={pathname === '/pricing' ? 'active' : ''}>Harga</Link></li>
            <li><Link href="/about" className={pathname === '/about' ? 'active' : ''}>Tentang</Link></li>
            <li><Link href={homeAnchor('#inbox')} className={activeSection === 'inbox' ? 'active' : ''}>Lacak</Link></li>
            <li><Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>Kontak</Link></li>
            <li className="nav-item-desktop-only">
              <button className="tutorial-btn" onClick={(e) => { e.preventDefault(); setTutorialStep(0); setIsTutorialOpen(true); }}>
                <HelpCircle size={16} /> <span style={{ marginLeft: '6px' }}>Cara Pesan</span>
              </button>
            </li>
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
                    <Link href="/profile">
                      <UserIcon size={16} /> Profil Saya
                    </Link>
                    <a href={homeAnchor('#inbox')} onClick={() => document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Package size={16} /> Pesanan Saya
                    </a>
                    <button className="user-menu-item-btn" onClick={() => setShowProfileManager(true)}>
                      <MapPin size={16} /> Kelola Alamat
                    </button>
                    {user?.email === ADMIN_EMAIL && (
                      <a href="/dashboard">
                        <CheckCircle2 size={16} /> Dashboard Admin
                      </a>
                    )}
                    <button className="user-menu-item-btn" onClick={subscribeToPush}>
                      <Bell size={16} /> Aktifkan Notifikasi
                    </button>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item-btn" onClick={handleLogout} style={{ color: 'var(--text-muted)' }}>
                      <LogOut size={16} /> Ganti Akun
                    </button>
                    <button className="user-logout-btn" onClick={handleLogout}>
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-login-pill">
                  Masuk
                </Link>
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
                  <li><Link href={homeAnchor('#home')} onClick={() => setMobileNavOpen(false)}>🏠 Home</Link></li>
                  <li><Link href={homeAnchor('#produk')} onClick={() => setMobileNavOpen(false)}>📦 Produk</Link></li>
                  <li><Link href={homeAnchor('#testimoni')} onClick={() => setMobileNavOpen(false)}>⭐ Testimoni</Link></li>
                  <li><Link href={homeAnchor('#checkout')} onClick={() => setMobileNavOpen(false)}>🛒 Checkout</Link></li>
                  <li><Link href={homeAnchor('#inbox')} onClick={() => setMobileNavOpen(false)}>🔍 Lacak Pesanan</Link></li>
                  <li><Link href="/features" onClick={() => setMobileNavOpen(false)}>✨ Fitur</Link></li>
                  <li><Link href="/pricing" onClick={() => setMobileNavOpen(false)}>💰 Harga</Link></li>
                  <li><Link href="/about" onClick={() => setMobileNavOpen(false)}>ℹ️ Tentang</Link></li>
                  <li><Link href={homeAnchor('#lokasi')} onClick={() => setMobileNavOpen(false)}>📍 Lokasi</Link></li>
                  <li><Link href="/contact" onClick={() => setMobileNavOpen(false)}>📞 Kontak</Link></li>
                  {user && user?.email === ADMIN_EMAIL && (
                    <li style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>⚙️ Dashboard Admin</Link>
                    </li>
                  )}
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
                  <Link href="/login" className="mobile-auth-btn" onClick={() => setMobileNavOpen(false)}>
                    Masuk / Daftar
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="hero hero-v2" id="home"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Progress bar */}
        <div className="hero-progress-track" aria-hidden="true">
          <motion.div
            className="hero-progress-bar"
            key={`progress-${heroSlide}-${heroPaused}`}
            initial={{ width: '0%' }}
            animate={{ width: heroPaused ? '0%' : '100%' }}
            transition={{ duration: heroPaused ? 0 : 6, ease: 'linear' }}
          />
        </div>

        <AnimatePresence mode="wait">

          {/* ── SLIDE 1: Foto Toko ── */}
          {heroSlide === 0 && (
            <motion.div key="slide-toko" className="hero-slide hero-slide-toko"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Full bleed background */}
              <div className="hero-bg-image" style={{ inset: 0, width: '100%', height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none', transform: 'none', top: 0, right: 0, bottom: 0, left: 0 }}>
                <Image src="/assets/images/hero-toko.jpeg" alt="Toko Hijrah TOKO" fill priority unoptimized sizes="100vw"
                  style={{ objectFit: 'cover', objectPosition: 'center' }} />
                {/* Gradient gelap dari kiri */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)' }} />
              </div>

              <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                <motion.div className="hero-content-new hero-slide-toko"
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                  <div className="hero-eyebrow-v2">
                    <Sparkles size={14} />
                    <span>Satu Pintu Solusi Anda</span>
                  </div>
                  <h1 className="hero-title-new">HIJRAH<span>TOKO</span></h1>
                  <p className="hero-desc-new">
                    Menghadirkan kenyamanan belanja <strong>Frozen Food</strong> premium dan kelengkapan <strong>ATK</strong> dalam satu genggaman modern.
                  </p>
                  <div className="hero-actions-new">
                    <motion.a href={homeAnchor('#produk')} className="btn-hero-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      Jelajahi Produk <ShoppingCart size={18} />
                    </motion.a>
                    <motion.a href="https://wa.me/6285263965031" className="btn-hero-outline" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <MessageSquare size={18} /> Hubungi Admin
                    </motion.a>
                  </div>

                  {/* Trust row */}
                  <div className="hero-trust-row">
                    <div className="hero-trust-item">
                      <div className="hero-trust-avatars">
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>A</span>
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>B</span>
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>C</span>
                      </div>
                      <div>
                        <strong>1.000+</strong>
                        <span>Pelanggan puas</span>
                      </div>
                    </div>
                    <div className="hero-trust-divider"></div>
                    <div className="hero-trust-item">
                      <div className="hero-trust-rating">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" stroke="#f59e0b" />)}
                      </div>
                      <div>
                        <strong>4.9 / 5.0</strong>
                        <span>Rating toko</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── SLIDE 2: Promo Install App ── */}
          {heroSlide === 1 && (
            <motion.div key="slide-promo" className="hero-slide hero-slide-app"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Full bleed image di kanan */}
              <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <Image src="/assets/images/hero-aplikasi.jpeg" alt="Frozen Food" fill unoptimized sizes="100vw"
                  style={{ objectFit: 'cover', objectPosition: 'right center' }} />
                {/* Gradient kuat dari kiri */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.1) 100%)' }} />
              </div>

              <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                <motion.div className="hero-content-new hero-content-app"
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
                >
                  <div className="hero-eyebrow-v2">
                    <Smartphone size={14} />
                    <span>Pengalaman Belanja Lebih Mudah</span>
                  </div>

                  {/* Title */}
                  <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(1.6rem, 3.2vw, 2.75rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                    Belanja Frozen Food<br />
                    Favorit, <span style={{ color: 'var(--primary)' }}>Lebih Cepat</span><br />
                    di Aplikasi <span style={{ color: 'var(--primary)' }}>HijrahToko!</span>
                  </h1>

                  <p className="hero-desc-new" style={{ marginBottom: '1.5rem' }}>
                    Install <strong>HijrahToko</strong> di layar utama Anda untuk pengalaman belanja yang lebih cepat, praktis, dan hemat kuota.
                  </p>

                  {/* Feature pills — 2x2 grid lebih rapi */}
                  <div className="hero-features-row">
                    {[
                      { Icon: Zap, title: 'Akses Cepat', desc: 'Sekali klik, langsung belanja' },
                      { Icon: Wifi, title: 'Bisa Offline', desc: 'Jelajahi tanpa internet' },
                      { Icon: Bell, title: 'Notifikasi Promo', desc: 'Info promo terbaru' },
                      { Icon: Shield, title: 'Aman & Ringan', desc: 'Hemat kuota' },
                    ].map((b, i) => (
                      <div key={i} className="hero-feature-pill">
                        <div className="hero-feature-pill-icon"><b.Icon size={16} /></div>
                        <div className="hero-feature-pill-text">
                          <strong>{b.title}</strong>
                          <p>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Install banner */}
                  <div className="hero-install-banner-v2">
                    <div className="hero-install-banner-left">
                      <div className="hero-install-banner-icon"><Download size={22} /></div>
                      <div>
                        <strong>Install Aplikasi <span style={{ color: 'var(--primary)' }}>HijrahToko</span></strong>
                        <p>Nikmati belanja lebih praktis seperti aplikasi native.</p>
                      </div>
                    </div>
                    <motion.button className="btn-hero-primary" onClick={handleInstallClick}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={{ whiteSpace: 'nowrap', flexShrink: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Install Sekarang <Download size={16} />
                    </motion.button>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🔒 Aman &amp; terpercaya. Tidak memakan banyak ruang penyimpanan.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── SLIDE 3: NURA AI ── */}
          {heroSlide === 2 && (
            <motion.div key="slide-chef" className="hero-slide hero-slide-nura"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="hero-nura-glow hero-nura-glow-1"></div>
              <div className="hero-nura-glow hero-nura-glow-2"></div>

              <div className="hero-nura-visual">
                <div className="hero-nura-glow-ring"></div>
                <Image
                  src="/assets/images/nura.png"
                  alt="NURA - Asisten Belanja Cerdas HijrahToko"
                  width={820}
                  height={820}
                  unoptimized
                  className="hero-nura-img"
                />
                <div className="hero-nura-spark hero-nura-spark-1">✦</div>
                <div className="hero-nura-spark hero-nura-spark-2">✦</div>
                <div className="hero-nura-spark hero-nura-spark-3">✦</div>
              </div>

              <div className="hero-container-new">
                <motion.div className="hero-content-new hero-content-nura"
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
                >
                  <div className="hero-eyebrow-v2 hero-eyebrow-nura">
                    <Bot size={14} />
                    <span>Meet Your New Shopping Buddy</span>
                  </div>

                  <h1 className="hero-nura-title">NURA</h1>

                  <div className="hero-nura-subtitle">
                    <p>Asisten Belanja Cerdas</p>
                    <p className="hero-nura-brand">HijrahToko</p>
                  </div>

                  <p className="hero-desc-new hero-desc-nura">
                    Nura siap membantu pengalaman belanja Anda menjadi lebih mudah, cepat, dan menyenangkan — kapan saja, 24/7.
                  </p>

                  <div className="hero-feature-grid hero-feature-grid-nura">
                    {[
                      { icon: Zap, title: 'Cepat & Responsif', desc: 'Selalu siap membantu kapan saja.' },
                      { icon: ShoppingCart, title: 'Belanja Lebih Mudah', desc: 'Rekomendasi produk terbaik.' },
                      { icon: Bell, title: 'Informasi Akurat', desc: 'Promo & info pesanan real-time.' },
                      { icon: Shield, title: 'Aman & Terpercaya', desc: 'Data Anda aman bersama kami.' },
                    ].map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <div key={i} className="hero-feature-card hero-feature-card-nura">
                          <div className="hero-feature-card-icon hero-feature-card-icon-nura">
                            <Icon size={16} />
                          </div>
                          <div>
                            <strong>{f.title}</strong>
                            <p>{f.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hero-actions-new">
                    <Link href="/chef" className="btn-hero-primary btn-nura" >
                      <Bot size={18} /> Chat dengan Nura
                    </Link>
                    <motion.a href={homeAnchor('#produk')} className="btn-hero-outline btn-nura-outline"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <ShoppingCart size={18} /> Lihat Produk
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Slider Controls ── */}
        <div className="hero-controls-v2">
          <div className="hero-dots-v2">
            {heroSlideLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                className={`hero-dot-v2 ${heroSlide === i ? 'active' : ''}`}
                onClick={() => setHeroSlide(i)}
                aria-label={label}
              >
                <span className="hero-dot-v2-fill" />
              </button>
            ))}
          </div>
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

        <div className="section-search-bar" style={{ maxWidth: '600px', margin: '0 auto 2.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', display: 'flex', zIndex: 2, pointerEvents: 'none' }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Cari camilan, sosis, buku, atau lainnya..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1.1rem 3.5rem 1.1rem 3.5rem',
              borderRadius: '50px',
              border: '2px solid var(--border-main)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1
            }}
            className="search-input-focus"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex' }}
            >
              <X size={20} />
            </button>
          )}
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
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer-card">
                <div className="shimmer-img" />
                <div className="shimmer-body">
                  <div className="shimmer-line" />
                  <div className="shimmer-line thin" />
                  <div className="shimmer-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="products-grid">
            <AnimatePresence mode="popLayout">
              {productsData
                .filter((p: any) => {
                  const matchesTab = activeTab === 'all' || p.category === activeTab;
                  const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.desc.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesTab && matchesSearch;
                })
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
                      <Image
                        src={p.img}
                        alt={p.name}
                        fill
                        unoptimized={typeof p.img === 'string' && p.img.startsWith('/')}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="card-img"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="card-overlay">
                        <Search size={24} color="white" />
                        <span>Detail</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-title-wrap">
                        <h3 onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>{p.name}</h3>
                      </div>
                      <div className="card-meta-row">
                        <span className="sold-label">Terjual {soldCounts[p.id] || 0}+</span>
                        <div style={{ display: 'flex', color: '#FACC15' }}>
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="desc">{p.desc.length > 70 ? p.desc.substring(0, 70) + '...' : p.desc}</p>
                    </div>
                    <div className="card-footer">
                      <div className="card-price-block">
                        <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
                        <span className="card-stock-label" style={{ color: (p.stock || 0) <= 5 ? '#ef4444' : 'var(--text-light)' }}>
                          {(p.stock || 0) <= 0 ? 'Stok Habis' : `Stok: ${p.stock}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {p.category === 'frozen' && (
                          <Link
                            href={`/chef?recipe=${encodeURIComponent(p.name)}`}
                            className="btn-icon-card"
                            title="Tanya Resep"
                            aria-label="Tanya Resep"
                          >
                            <ChefHat size={15} />
                          </Link>
                        )}
                        <button
                          type="button"
                          className="btn-icon-card btn-icon-card-primary"
                          onClick={() => addToCart(p.id)}
                          disabled={(p.stock || 0) <= 0}
                          title={(p.stock || 0) <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                          aria-label={`Tambah ${p.name}`}
                        >
                          {(p.stock || 0) <= 0 ? <X size={15} /> : <Plus size={16} />}
                        </button>
                      </div>
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
        <div className="testimoni-grid">
          <div className="testimoni-list">
            {reviews.length === 0 && (
              <div className="testimoni-card">
                <p>Belum ada ulasan. Jadilah yang pertama memberikan testimoni.</p>
              </div>
            )}
            {reviews.map((rev, i) => (
              <motion.div
                key={rev.id ?? `${rev.name}-${rev.date}-${i}`}
                className="testimoni-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div style={{ display: 'flex', color: '#FACC15', marginBottom: '0.75rem', gap: '0.25rem' }}>
                  {[...Array(rev.rating || 0)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p style={{ fontStyle: 'italic', marginBottom: '1.25rem' }}>
                  &ldquo;{rev.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                    {(rev.name || 'P').charAt(0)}
                  </div>
                  <div>
                    <strong style={{ display: 'block' }}>{rev.name || 'Pelanggan'}</strong>
                    <small style={{ color: 'var(--text-light)' }}>{rev.date}</small>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="testimoni-form-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3>Tulis Ulasan Anda</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Ulasan hanya bisa dikirim oleh pengguna yang sudah login.
            </p>

            {!user ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem' }}>
                <AlertCircle size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Silakan login terlebih dahulu untuk mengirim ulasan.
                </p>
                <Link href="/login" className="btn-primary">
                  Login Untuk Ulasan
                </Link>
              </div>
            ) : (
              <form onSubmit={submitReview} className="order-form">
                <div className="form-group">
                  <label>Nama Pengguna</label>
                  <input type="text" value={reviewDisplayName} disabled />
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-rating-input" role="radiogroup" aria-label="Rating ulasan">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`star ${reviewForm.rating >= value ? 'active' : ''}`}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                        aria-label={`Beri rating ${value}`}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', display: 'flex' }}
                      >
                        <Star size={30} fill={reviewForm.rating >= value ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ulasan</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Bagikan pengalaman belanja Anda di Hijrah Toko..."
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, text: e.target.value }))}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Kirim Ulasan
                </button>
              </form>
            )}
          </motion.div>
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
                <a href={homeAnchor('#produk')} className="btn-primary btn-small" style={{ marginTop: '1rem' }}>Mulai Belanja</a>
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
                        <button type="button" className="qty-btn" onClick={() => changeQuantity(item.id, -1)} aria-label={`Kurangi ${item.name}`}>
                          -
                        </button>
                        <span className="qty-value">{item.qty}</span>
                        <button type="button" className="qty-btn" onClick={() => changeQuantity(item.id, 1)} aria-label={`Tambah ${item.name}`}>
                          +
                        </button>
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
                <Link href="/login" className="btn-primary">Masuk Sekarang</Link>
              </div>
            ) : (
              <form onSubmit={submitOrder} className="order-form" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label>Nama Penerima</label>
                  <input
                    type="text"
                    required
                    value={orderInfo.customerName || user?.user_metadata?.full_name || ''}
                    readOnly
                    style={{
                      background: 'var(--bg-surface-soft)',
                      cursor: 'not-allowed',
                      opacity: 0.8,
                      border: '1px solid var(--border-main)',
                      fontWeight: '600'
                    }}
                    title="Nama diambil dari profil akun dan tidak dapat diubah"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    * Nama otomatis diambil dari data pendaftaran akun Anda.
                  </small>
                </div>

                <div className="form-group">
                  <label>Metode Pengambilan</label>
                  <div className="option-grid">
                    <label className={`option-card ${orderInfo.deliveryMethod === 'pickup' ? 'active' : ''}`}>
                      <input type="radio" name="deliveryMethod" value="pickup" checked={orderInfo.deliveryMethod === 'pickup'} onChange={e => setOrderInfo({ ...orderInfo, deliveryMethod: e.target.value })} />
                      <div className="option-icon-wrap">
                        <Package size={24} />
                      </div>
                      <div className="option-content">
                        <strong>Ambil di Kedai</strong>
                        <small>Gratis biaya pengiriman</small>
                      </div>
                    </label>
                    <label className={`option-card ${orderInfo.deliveryMethod === 'delivery' ? 'active' : ''}`}>
                      <input type="radio" name="deliveryMethod" value="delivery" checked={orderInfo.deliveryMethod === 'delivery'} onChange={e => setOrderInfo({ ...orderInfo, deliveryMethod: e.target.value })} />
                      <div className="option-icon-wrap">
                        <Truck size={24} />
                      </div>
                      <div className="option-content">
                        <strong>Kirim ke Alamat</strong>
                        <small>Otomatis hitung ongkir</small>
                      </div>
                    </label>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {orderInfo.deliveryMethod === 'delivery' ? (
                    <motion.div
                      key="delivery"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="form-group"
                    >
                      <label>Alamat Pengiriman</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <button type="button" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.85rem' }} onClick={() => setIsAddressModalOpen(true)}>
                          <MapPin size={16} /> Alamat Tersimpan
                        </button>
                        <button type="button" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.85rem' }} onClick={useCurrentLocation} disabled={isLocating}>
                          {isLocating ? '📍 Mencari...' : '📍 Lokasi Saat Ini'}
                        </button>
                      </div>

                      {orderInfo.customerAddress ? (
                        <div className="address-display-table" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alamat Terpilih / Terdeteksi</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.5 }}>{orderInfo.customerAddress}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(225, 29, 72, 0.05)', color: 'var(--primary)', borderRadius: '12px', marginBottom: '16px', border: '1px dashed rgba(225, 29, 72, 0.3)', fontSize: '0.9rem' }}>
                          Silakan pilih <b>Alamat Tersimpan</b> atau gunakan <b>Lokasi Saat Ini</b> untuk menghitung ongkos kirim.
                        </div>
                      )}

                      {shipInfo.status === 'ok' && (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="shipping-info-alert"
                        >
                          <h5><CheckCircle2 size={18} /> Ongkir Berhasil Dihitung</h5>
                          <p style={{ marginBottom: '0.5rem' }}>{shipInfo.detail}</p>
                          {shipInfo.distanceKm && shipInfo.distanceKm > 30 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 'bold' }}>
                              ⚠️ Lokasi terdeteksi cukup jauh. Jika Anda menggunakan PC, lokasi mungkin kurang akurat. Pastikan memilih alamat tersimpan jika ada.
                            </div>
                          )}
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
                      <input type="date" required value={orderInfo.pickupDate} onChange={e => setOrderInfo({ ...orderInfo, pickupDate: e.target.value })} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select value={orderInfo.paymentMethod} onChange={e => setOrderInfo({ ...orderInfo, paymentMethod: e.target.value })}>
                    <option value="COD">Tunai / COD (Bayar di Tempat)</option>
                    <option value="Mandiri">Transfer Bank Mandiri</option>
                    <option value="BSI">Transfer Bank BSI</option>
                  </select>
                </div>

                <AnimatePresence>
                  {orderInfo.paymentMethod !== 'COD' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="shipping-info-alert"
                      style={{ background: 'var(--bg-surface-soft)', borderLeft: '4px solid var(--primary)' }}
                    >
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} /> Tutorial Pembayaran
                      </h4>
                      <p style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-line',
                        color: 'var(--text-main)',
                        fontWeight: '500'
                      }}>
                        {PAYMENT_INFO[orderInfo.paymentMethod as keyof typeof PAYMENT_INFO]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Ringkasan Pesanan (Table) */}
                <div className="order-summary-table" style={{
                  marginTop: '2rem',
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: 'var(--bg-surface-soft)',
                  borderRadius: '20px',
                  border: '1px solid var(--border-main)'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} color="var(--primary)" /> Ringkasan Pesanan
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nama Penerima</span>
                      <span style={{ fontWeight: '600' }}>{orderInfo.customerName || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Metode</span>
                      <span style={{ fontWeight: '600' }}>{orderInfo.deliveryMethod === 'pickup' ? 'Ambil di Kedai' : 'Kirim ke Alamat'}</span>
                    </div>
                    {orderInfo.deliveryMethod === 'delivery' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-main)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Alamat Pengiriman:</span>
                        <span style={{ fontWeight: '500', fontSize: '0.85rem', lineHeight: '1.4' }}>{orderInfo.customerAddress || 'Belum diisi'}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-main)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Pembayaran</span>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem' }}>
                  <MessageSquare size={20} /> Konfirmasi Pesanan via WhatsApp
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {isTutorialOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTutorialOpen(false)}
            style={{ zIndex: 10000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div
              className="tutorial-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '100%', position: 'relative' }}
            >
              <button className="modal-close" onClick={() => setIsTutorialOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>

              <div className="tutorial-content">
                <div className="tutorial-header" style={{ marginBottom: '1.5rem' }}>
                  <h3>Panduan Pemesanan</h3>
                  <div className="tutorial-progress">
                    Langkah {tutorialStep + 1} dari 5
                  </div>
                </div>

                <div className="tutorial-body">
                  <AnimatePresence mode="wait">
                    {tutorialStep === 0 && (
                      <motion.div key="step0" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }} className="tutorial-step">
                        <div className="tutorial-icon"><ShoppingCart size={40} style={{ color: 'var(--primary)' }} /></div>
                        <h4>1. Pilih Produk</h4>
                        <p>Pilih produk yang Anda butuhkan di bagian <b>Produk</b>, lalu klik tombol <b>Tambah ke Keranjang</b>. Pastikan Anda sudah login.</p>
                      </motion.div>
                    )}
                    {tutorialStep === 1 && (
                      <motion.div key="step1" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }} className="tutorial-step">
                        <div className="tutorial-icon"><Package size={40} style={{ color: 'var(--primary)' }} /></div>
                        <h4>2. Cek Keranjang</h4>
                        <p>Klik ikon keranjang di pojok kanan atas atau gulir ke bawah ke bagian <b>Checkout</b> untuk melihat pesanan Anda.</p>
                      </motion.div>
                    )}
                    {tutorialStep === 2 && (
                      <motion.div key="step2" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }} className="tutorial-step">
                        <div className="tutorial-icon"><MapPin size={40} style={{ color: 'var(--primary)' }} /></div>
                        <h4>3. Detail Pengiriman</h4>
                        <p>Pilih metode pengiriman: <b>Ambil di Kedai</b> atau <b>Diantarkan ke Alamat</b>. Jika diantar, atur lokasi Anda agar ongkos kirim otomatis terhitung.</p>
                      </motion.div>
                    )}
                    {tutorialStep === 3 && (
                      <motion.div key="step3" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }} className="tutorial-step">
                        <div className="tutorial-icon"><CheckCircle2 size={40} style={{ color: 'var(--primary)' }} /></div>
                        <h4>4. Pilih Pembayaran</h4>
                        <p>Pilih metode pembayaran (COD atau Transfer Bank). Periksa total pesanan Anda, lalu klik <b>Pesan Sekarang</b> untuk mengonfirmasi via WhatsApp Admin.</p>
                      </motion.div>
                    )}
                    {tutorialStep === 4 && (
                      <motion.div key="step4" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }} className="tutorial-step">
                        <div className="tutorial-icon"><Truck size={40} style={{ color: 'var(--primary)' }} /></div>
                        <h4>5. Lacak Pesanan</h4>
                        <p>Pantau pesanan Anda di menu <b>Lacak</b>. Notifikasi akan muncul saat pesanan Diproses, Dikirim, hingga Selesai.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="tutorial-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    className="btn-outline"
                    onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                    disabled={tutorialStep === 0}
                    style={{ opacity: tutorialStep === 0 ? 0.5 : 1, cursor: tutorialStep === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={20} /> Sebelumnya
                  </button>
                  {tutorialStep < 4 ? (
                    <button
                      className="btn-primary"
                      onClick={() => setTutorialStep(prev => Math.min(4, prev + 1))}
                    >
                      Selanjutnya <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => { setIsTutorialOpen(false); setTutorialStep(0); }}
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Inbox & Tracking  */}
      <section className="section" id="inbox" style={{ background: 'var(--bg-surface-soft)' }}>
        <div className="section-header">
          <h2>Lacak Pesanan</h2>
          <p>Pantau status pesanan Anda secara realtime di sini.</p>
          <div className="underline"></div>
        </div>

        <div className="section-content">
          <motion.div
            className="inbox-card active tracking-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="tracking-header">
              <div className="inbox-icon tracking-main-icon">
                {inbox.icon === '📨' ? <Clock size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div className="tracking-header-copy">
                <h3>{inbox.title || 'Pesanan Anda'}</h3>
                <p>{inbox.message || 'Status terbaru pesanan Anda akan muncul di sini.'}</p>
              </div>
            </div>

            {!user && (
              <div className="tracking-login-required">
                <p>Silakan login untuk melihat status pesanan sesuai akun Anda.</p>
                <Link href="/login" className="btn-primary">
                  Login Sekarang
                </Link>
              </div>
            )}

            {user && visibleUserOrders.length > 0 && (
              <div className="order-history">
                <h4 className="tracking-section-title">Riwayat Pesanan Anda</h4>
                <div className="tracking-order-list">
                  {visibleUserOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="tracking-order-row">
                      <div className="tracking-order-meta">
                        <div className="tracking-order-head">
                          <strong>Order #{order.id.toString().slice(-6).toUpperCase()}</strong>
                          <span className={`tracking-status-badge status-${order.status}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="tracking-order-subtitle">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • Rp {order.grand_total.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button className="btn-primary btn-small tracking-help-btn" onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Halo Admin, saya ingin bertanya status pesanan saya #${order.id}`)}`, '_blank')}>
                        Bantuan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && visibleUserOrders.length === 0 && (
              <div className="tracking-empty-state">
                <h4>Pesanan tidak tersedia</h4>
                <p>Akun ini belum memiliki pesanan aktif atau seluruh pesanan telah dibatalkan.</p>
              </div>
            )}

            <div className="tracking-search-box">
              <p>Data ditampilkan khusus untuk akun yang sedang login:</p>
              <div className="tracking-search-row">
                <input
                  type="text"
                  value={user?.email || 'Silakan login'}
                  className="tracking-input"
                  disabled
                />
                <button className="btn-primary tracking-search-btn" onClick={() => fetchUserOrders(user?.id)} disabled={!user || isTracking}>
                  {isTracking ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/*  Location Section  */}
      <section className="section location-section" id="lokasi">
        <div className="section-header">
          <h2>Lokasi Toko</h2>
          <p>Kami berlokasi strategis di Padang Pariaman, siap melayani Anda.</p>
          <div className="underline"></div>
        </div>
        <div className="section-content">
          <div className="location-card-wrapper">
            <div className="location-info-side">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div className="inbox-icon" style={{ background: 'var(--bg-surface-soft)', color: 'var(--primary)', flexShrink: 0 }}><MapPin size={24} /></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Padang Pariaman</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sumatera Barat, Indonesia</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Alamat</h4>
                  <p style={{ fontWeight: '600', margin: 0 }}>Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik.</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Jam Buka</h4>
                  <p style={{ fontWeight: '600', margin: 0 }}>Senin - Minggu: 08:00 - 21:00 WIB</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href="https://www.google.com/maps/place/Hijrah+TOKO/@-0.5940091,100.2129566,17z/data=!3m1!4b1!4m6!3m5!1s0x2fd4e1d5048135eb:0xdc1dba685f9fa4f4!8m2!3d-0.5940091!4d100.2129566!16s%2Fg%2F11sddqc7n9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <MapPin size={18} /> Buka di Google Maps
                </a>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Map Hijrah Toko"]') as HTMLIFrameElement;
                    if (iframe) {
                      iframe.src = iframe.src;
                    }
                  }}
                  className="btn-secondary"
                  style={{ padding: '1rem', minWidth: '50px' }}
                  title="Pusatkan Peta"
                >
                  <MapPin size={18} />
                </button>
              </div>
            </div>
            <div className="location-map-side">
              <iframe
                title="Map Hijrah Toko"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.2882195026853!2d100.21038167425103!3d-0.5940091352848971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4e1d5048135eb%3A0xdc1dba685f9fa4f4!2sHijrah%20TOKO!5e0!3m2!1sid!2sid!4v1714578000000!5m2!1sid!2sid"
                width="100%"
                height="500"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="footer" id="kontak">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="nav-logo" style={{ marginBottom: '1.5rem' }}>
              <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" className="brand-logo" />
              <span className="brand-text" style={{ color: '#ffffff' }}>Hijrah<span style={{ color: 'var(--primary)' }}>Toko</span></span>
            </div>
            <p>
              Hijrah Toko adalah pusat penyedia frozen food premium dan alat tulis kantor terlengkap. Kami berkomitmen memberikan kualitas terbaik dan layanan cepat untuk Anda.
            </p>
          </div>

          <div className="footer-col">
            <h4>Tautan Cepat</h4>
            <ul>
              <li><Link href={homeAnchor('#home')}>Beranda</Link></li>
              <li><Link href={homeAnchor('#produk')}>Katalog Produk</Link></li>
              <li><Link href="/features">Fitur</Link></li>
              <li><Link href="/pricing">Harga</Link></li>
              <li><Link href="/about">Tentang Kami</Link></li>
              <li><Link href={homeAnchor('#testimoni')}>Testimoni</Link></li>
              <li><Link href={homeAnchor('#lokasi')}>Lokasi Kami</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Hubungi Kami</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={20} />
                <span>+62 852-6396-5031</span>
              </li>
              <li>
                <MessageSquare size={20} />
                <span>hijrahtoko@gmail.com</span>
              </li>
              <li>
                <MapPin size={20} />
                <span>Padang Pariaman, Sumatera Barat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hijrah Toko. Seluruh hak cipta dilindungi. Built with ❤️ for your home and office.</p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              className="product-card modal-grid"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
            >
              <div className="modal-img-container">
                <Image
                  src={selectedProduct.img}
                  alt={selectedProduct.name}
                  fill
                  unoptimized={typeof selectedProduct.img === 'string' && selectedProduct.img.startsWith('/')}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                />
                <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)', cursor: 'pointer' }}>
                  <X size={20} color="#0f172a" />
                </button>
              </div>
              <div className="modal-body-padding">
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
                      <strong style={{
                        color: (selectedProduct.stock || 0) > 0 ? '#059669' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        {(selectedProduct.stock || 0) > 0 ? (
                          <><CheckCircle2 size={16} /> {selectedProduct.stock} Tersisa</>
                        ) : (
                          <>Stok Habis</>
                        )}
                      </strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn-primary"
                      style={{
                        flex: 2,
                        justifyContent: 'center',
                        padding: '1.25rem',
                        opacity: (selectedProduct.stock || 0) > 0 ? 1 : 0.6,
                        cursor: (selectedProduct.stock || 0) > 0 ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => { if ((selectedProduct.stock || 0) > 0) { addToCart(selectedProduct.id); setSelectedProduct(null); } }}
                      disabled={(selectedProduct.stock || 0) <= 0}
                    >
                      <ShoppingCart size={20} /> {(selectedProduct.stock || 0) > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
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

      {/*  Address Selector Modal  */}
      {isAddressModalOpen && user && (
        <AddressSelector
          userPhone={user.user_metadata?.phone || ''}
          onSelect={(address) => {
            setOrderInfo(prev => ({
              ...prev,
              customerAddress: address.full_address,
              customerLatitude: address.latitude?.toString() || '',
              customerLongitude: address.longitude?.toString() || '',
              customerMapsLink: address.maps_link || `https://www.google.com/maps?q=${address.latitude},${address.longitude}`
            }));
          }}
          onClose={() => setIsAddressModalOpen(false)}
          onAddNew={() => {
            setIsAddressModalOpen(false);
            setShowProfileManager(true);
          }}
        />
      )}

      {/*  Profile / Address Manager Modal  */}
      {showProfileManager && user && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            className="checkout-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ maxWidth: '800px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
          >
            <button onClick={() => setShowProfileManager(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <AddressManager
              userId={user.id}
              userPhone={user.user_metadata?.phone || user.phone || ''}
            />
          </motion.div>
        </div>
      )}

      {/* PWA Install Button */}
      <motion.button
        className="pwa-install-button"
        onClick={handleInstallClick}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Install Hijrah Toko sebagai aplikasi"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--primary)',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '50px',
          border: 'none',
          fontSize: '1rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        <Package size={20} />
        <span>Install App</span>
      </motion.button>

      {/* Cart Toast */}
      <AnimatePresence>
        {cartToast && (
          <motion.div
            className="cart-toast"
            initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.92 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -10, x: '-50%', scale: 0.95 }}
          >
            <CheckCircle2 size={18} />
            <span>{cartToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        /* ============================================
           STORE PAGE — Scoped Style Tweaks
           ============================================ */

        /* ── Hero ── */
        .hero {
          min-height: 85vh !important;
        }
        .hero-title-new {
          font-size: clamp(2rem, 5vw, 3.5rem) !important;
          font-weight: 800 !important;
          letter-spacing: -0.03em !important;
          line-height: 1.15 !important;
        }
        .hero-desc-new {
          font-size: clamp(0.95rem, 1.6vw, 1.1rem) !important;
          line-height: 1.7 !important;
          opacity: 0.85 !important;
        }
        .btn-hero-primary {
          padding: 0.85rem 2rem !important;
          border-radius: 999px !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          transition: all 0.25s !important;
          box-shadow: 0 6px 20px -4px rgba(225,29,72,0.3) !important;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 30px -6px rgba(225,29,72,0.4) !important;
        }
        .btn-hero-outline {
          padding: 0.85rem 2rem !important;
          border-radius: 999px !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          border: 1.5px solid rgba(255,255,255,0.3) !important;
          transition: all 0.25s !important;
        }
        .btn-hero-outline:hover {
          border-color: #fff !important;
          transform: translateY(-2px) !important;
        }
        .hero-scroll-new { bottom: 2rem !important; }

        /* ── Buttons ── */
        .btn-primary {
          border-radius: 12px !important;
          padding: 0.75rem 1.5rem !important;
          font-weight: 700 !important;
          transition: all 0.25s !important;
          box-shadow: 0 4px 14px -2px rgba(225,29,72,0.25) !important;
        }
        .btn-primary:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 24px -4px rgba(225,29,72,0.35) !important;
        }
        .btn-secondary {
          border-radius: 12px !important;
          padding: 0.75rem 1.5rem !important;
          font-weight: 600 !important;
          border: 1.5px solid var(--border-main) !important;
          transition: all 0.25s !important;
        }
        .btn-secondary:hover {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          background: var(--primary-light) !important;
        }
        .btn-wa {
          border-radius: 999px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 600 !important;
          gap: 0.5rem !important;
        }

        /* ── Section Headers ── */
        .section-header h2 {
          font-size: clamp(1.5rem, 3vw, 2rem) !important;
          font-weight: 800 !important;
          letter-spacing: -0.03em !important;
        }
        .underline {
          width: 48px !important;
          height: 3px !important;
          border-radius: 2px !important;
          background: var(--primary) !important;
        }

        /* ── Product Cards ── */
        .product-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          background: var(--bg-surface) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03) !important;
          transition: all 0.3s ease !important;
          overflow: hidden !important;
        }
        .product-card:hover {
          box-shadow: 0 8px 30px -8px rgba(0,0,0,0.08) !important;
          transform: translateY(-3px) !important;
          border-color: rgba(225,29,72,0.15) !important;
        }
        .card-img-wrap {
          border-radius: 16px 16px 0 0 !important;
        }
        .card-body {
          padding: 1rem 1.15rem 1.15rem !important;
        }
        .card-title-wrap strong {
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.01em !important;
        }
        .card-meta-row {
          gap: 0.5rem !important;
          margin-top: 0.15rem !important;
        }
        .price {
          font-size: 1.05rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
        }
        .card-footer .btn-wa {
          padding: 0.55rem 1rem !important;
          border-radius: 10px !important;
          font-size: 0.8rem !important;
        }

        /* ── Features ── */
        .feature-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          padding: 2rem 1.5rem !important;
          transition: all 0.3s !important;
        }
        .feature-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 30px -8px rgba(0,0,0,0.06) !important;
          border-color: var(--primary) !important;
        }
        .feature-icon {
          width: 52px !important; height: 52px !important;
          border-radius: 14px !important;
          margin-bottom: 1rem !important;
        }

        /* ── Testimonials ── */
        .testimoni-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          padding: 1.25rem 1.5rem !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03) !important;
        }
        .testimoni-form-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          padding: 1.5rem !important;
        }
        .star-rating-input .star {
          font-size: 1.5rem !important;
          cursor: pointer !important;
          transition: transform 0.15s !important;
        }
        .star-rating-input .star:hover { transform: scale(1.2); }

        /* ── Checkout ── */
        .checkout-card {
          border-radius: 18px !important;
          border: 1px solid var(--border-main) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03) !important;
        }
        .checkout-card-head {
          font-weight: 700 !important;
          font-size: 1rem !important;
          padding: 1.15rem 1.25rem !important;
        }
        .cart-item {
          border-radius: 12px !important;
          padding: 0.75rem 1rem !important;
          background: var(--bg-surface-soft) !important;
          border: 1px solid var(--border-light) !important;
        }
        .qty-btn {
          width: 30px !important; height: 30px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border-main) !important;
          background: var(--bg-surface) !important;
          transition: all 0.15s !important;
        }
        .qty-btn:hover { background: var(--primary-light) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
        .qty-value { font-weight: 700 !important; min-width: 1.5rem !important; }

        .option-card {
          border-radius: 12px !important;
          border: 1.5px solid var(--border-main) !important;
          padding: 0.85rem 1rem !important;
          transition: all 0.2s !important;
        }
        .option-card.active {
          border-color: var(--primary) !important;
          background: var(--primary-light) !important;
          box-shadow: 0 0 0 3px rgba(225,29,72,0.08) !important;
        }
        .option-card:hover { border-color: var(--primary) !important; }

        .form-group input, .form-group select, .form-group textarea {
          border-radius: 11px !important;
          border: 1.5px solid var(--border-main) !important;
          padding: 0.75rem 1rem !important;
          font-size: 0.9rem !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary) !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(225,29,72,0.06) !important;
        }

        .submit-order-btn {
          border-radius: 12px !important;
          padding: 0.9rem !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          box-shadow: 0 6px 20px -4px rgba(225,29,72,0.25) !important;
          transition: all 0.25s !important;
        }
        .submit-order-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 30px -6px rgba(225,29,72,0.35) !important;
        }

        /* ── Filter Tabs ── */
        .filter-btn {
          padding: 0.5rem 1.15rem !important;
          border-radius: 999px !important;
          font-weight: 600 !important;
          font-size: 0.82rem !important;
          border: 1.5px solid var(--border-main) !important;
          transition: all 0.2s !important;
        }
        .filter-btn.active {
          background: var(--primary) !important;
          color: #fff !important;
          border-color: var(--primary) !important;
          box-shadow: 0 4px 12px rgba(225,29,72,0.2) !important;
        }
        .filter-btn:hover:not(.active) {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
        }

        /* ── Inbox / Tracking ── */
        .inbox-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          transition: all 0.2s !important;
        }
        .inbox-card.active {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(225,29,72,0.08) !important;
        }
        .tracking-card {
          border-radius: 16px !important;
          border: 1px solid var(--border-main) !important;
          padding: 1.5rem !important;
        }
        .tracking-order-row {
          border-radius: 12px !important;
          padding: 0.85rem 1rem !important;
          background: var(--bg-surface-soft) !important;
          border: 1px solid var(--border-light) !important;
        }
        .tracking-search-box input {
          border-radius: 10px !important;
          border: 1.5px solid var(--border-main) !important;
          padding: 0.7rem 1rem !important;
        }

        /* ── Stats Bar ── */
        .stats-bar {
          background: var(--bg-surface) !important;
          border-top: 1px solid var(--border-main) !important;
          border-bottom: 1px solid var(--border-main) !important;
        }
        .stat-item { padding: 1.25rem 1rem !important; }
        .stat-icon {
          width: 40px !important; height: 40px !important;
          border-radius: 10px !important;
        }

        /* ── Location Card ── */
        .location-card {
          border-radius: 18px !important;
          border: 1px solid var(--border-main) !important;
          overflow: hidden !important;
        }

        /* ── Footer ── */
        .footer {
          border-top: 1px solid var(--border-main) !important;
        }
        .footer-col h4 { font-weight: 700 !important; font-size: 0.9rem !important; }

        /* ── Modal ── */
        .modal-overlay {
          background: rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(6px) !important;
          -webkit-backdrop-filter: blur(6px) !important;
        }
        .modal-content {
          border-radius: 20px !important;
          border: 1px solid var(--border-main) !important;
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.2) !important;
        }

        /* ── Mobile Nav ── */
        .mobile-nav {
          background: rgba(255,255,255,0.92) !important;
          backdrop-filter: blur(24px) !important;
        }
        body.dark-mode .mobile-nav {
          background: rgba(15,23,42,0.92) !important;
        }
        .mobile-nav-content { padding: 1.25rem !important; }
        .mobile-nav-header { padding-bottom: 0.75rem !important; }
        .mobile-nav-links a {
          border-radius: 10px !important;
          padding: 0.65rem 0.85rem !important;
        }

        /* ── Search ── */
        .section-search-bar input {
          border-radius: 999px !important;
          border: 1.5px solid var(--border-main) !important;
          padding: 0.9rem 3.5rem 0.9rem 3.5rem !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .section-search-bar input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(225,29,72,0.06) !important;
          outline: none !important;
        }

        /* ── Sorting / Filter Select ── */
        .sort-select, .filter-tabs select {
          border-radius: 10px !important;
          border: 1.5px solid var(--border-main) !important;
          padding: 0.55rem 1rem !important;
          font-family: inherit !important;
        }
      `}</style>
    </>
  );
}






