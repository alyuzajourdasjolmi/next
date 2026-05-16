"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Box,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Edit3,
  Home,
  Loader2,
  LogOut,
  Package,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Trash2,
  Upload,
  UserCircle2,
  Users,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
  Menu,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../style.css";

const ADMIN_EMAIL = "admin.hijrahtoko@gmail.com";

const ORDER_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

const ORDER_STATUS_LABEL: Record<string, string> = {
  all: "Semua Status",
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    desc: "",
    price: 0,
    category: "frozen",
    img: "",
    stock: 0,
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "products" | "users" | "analytics" | "cashier" | "reviews">(
    "dashboard"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof ORDER_STATUSES)[number]>(
    "all"
  );
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [isPosProcessing, setIsPosProcessing] = useState(false);
  const [cashAmount, setCashAmount] = useState<number | string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        if (session.user.email !== ADMIN_EMAIL) {
          setIsUnauthorized(true);
          setUser(null);
        } else {
          setUser(session.user);
          setIsUnauthorized(false);
        }
      } else {
        setUser(null);
        setIsUnauthorized(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (session.user.email !== ADMIN_EMAIL) {
          setIsUnauthorized(true);
          setUser(null);
        } else {
          setUser(session.user);
          setIsUnauthorized(false);
        }
      } else {
        setUser(null);
        setIsUnauthorized(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      setReviews(reviewsData || []);

      if (!usersError) {
        setUsers(usersData || []);
      } else {
        const uniqueCustomers = Array.from(
          new Set((ordersData || []).map((order: any) => order.customer_phone))
        ).map((phone) => {
          const lastOrder = (ordersData || []).find(
            (order: any) => order.customer_phone === phone
          );
          return {
            id: lastOrder?.user_id || phone,
            full_name: lastOrder?.customer_name,
            phone,
            address: lastOrder?.customer_address,
            email: "N/A (Data Pesanan)",
            created_at: lastOrder?.created_at,
          };
        });
        setUsers(uniqueCustomers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return alert("Tidak ada data pesanan untuk di-export.");
    
    const headers = ["ID Pesanan", "Nama Pelanggan", "No HP", "Total", "Status", "Tanggal"];
    const csvContent = [
      headers.join(","),
      ...orders.map(order => 
        `"${order.id}","${order.customer_name}","${order.customer_phone}","${order.grand_total}","${order.status}","${new Date(order.created_at).toLocaleDateString('id-ID')}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email !== ADMIN_EMAIL) {
      alert("Email ini tidak terdaftar sebagai administrator.");
      return;
    }

    setIsLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Login gagal: " + error.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const printReceipt = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = (order.order_items || [])
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 5px 0;">${item.product_name} x${item.qty}</td>
        <td style="text-align: right; padding: 5px 0;">Rp ${(item.price * item.qty).toLocaleString("id-ID")}</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk #${order.id}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0;
              padding: 10px;
              color: #000;
              font-size: 12px;
              line-height: 1.2;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
            .header p { margin: 2px 0; font-size: 10px; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
            .total-section { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .grand-total { font-weight: bold; font-size: 14px; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px; }
            .footer { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; text-align: center; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HIJRAH TOKO</h1>
            <p>Frozen Food & Alat Tulis Kantor</p>
            <p>Admin: ${ADMIN_EMAIL}</p>
          </div>
          <div class="info">
            <p><strong>No. Pesanan: #${order.id}</strong></p>
            <p>Tanggal: ${new Date(order.created_at).toLocaleString("id-ID")}</p>
            <p>Pelanggan: ${order.customer_name}</p>
            <p>No. WA: ${order.customer_phone}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal</span>
              <span>Rp ${order.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div class="total-row">
              <span>Ongkos Kirim</span>
              <span>Rp ${(order.shipping_cost || 0).toLocaleString("id-ID")}</span>
            </div>
            ${
              order.shipping_discount > 0
                ? `<div class="total-row"><span>Diskon Ongkir</span><span>-Rp ${order.shipping_discount.toLocaleString("id-ID")}</span></div>`
                : ""
            }
            <div class="total-row grand-total">
              <span>GRAND TOTAL</span>
              <span>Rp ${order.grand_total.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div class="info" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px;">
            <p>Metode Bayar: ${order.payment_method}</p>
            <p>Pengambilan: ${order.delivery_method === "pickup" ? "Ambil di Toko" : "Diantarkan"}</p>
            ${order.customer_address ? `<p>Alamat: ${order.customer_address}</p>` : ""}
          </div>
          <div class="footer">
            <p>Terima kasih telah berbelanja di Hijrah Toko.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      if (status === "cancelled") {
        if (
          !confirm(
            "Pesanan ini akan dibatalkan dan dihapus permanen dari database. Lanjutkan?"
          )
        ) {
          return;
        }

        const { error } = await supabase.from("orders").delete().eq("id", orderId);
        if (error) throw error;

        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        return;
      }

      const originalOrders = [...orders];
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );

      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) {
        setOrders(originalOrders);
        throw error;
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      alert(
        "Gagal memperbarui status pesanan: " +
          (error.message || "Error tidak diketahui")
      );
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Gagal menghapus produk.");
    }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus user "${name}" secara permanen? SELURUH data profil, riwayat pesanan, dan akun login mereka akan dihapus total dari sistem.`
      )
    ) {
      return;
    }

    try {
      // 1. Putuskan tautan user_id dari pesanan agar riwayat tidak ikut terhapus
      // Kita bungkus try-catch karena kolom user_id mungkin belum ada di tabel orders
      try {
        await supabase.from("orders").update({ user_id: null }).eq("user_id", userId);
      } catch (err) {
        console.log("Kolom user_id mungkin belum ada di tabel orders, melewati...");
      }

      // 2. Panggil API server untuk menghapus user dari Authentication & Profiles
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus user dari server.");
      }

      setUsers((prev) => prev.filter((entry) => entry.id !== userId));
      alert("User berhasil dihapus sepenuhnya dari sistem (Authentication & Profil).");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus user: " + error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      setProductForm((prev) => ({ ...prev, img: publicUrl }));
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("Gagal mengunggah gambar: " + error.message);
      setIsUploading(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        const { error } = await supabase
          .from("products")
          .update(productForm)
          .eq("id", editingProductId);
        if (error) throw error;
        alert("Produk berhasil diperbarui.");
      } else {
        const { error } = await supabase.from("products").insert(productForm);
        if (error) throw error;
        alert("Produk berhasil ditambahkan.");
      }

      setProductForm({ name: "", desc: "", price: 0, category: "frozen", img: "", stock: 0 });
      setEditingProductId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert("Gagal menyimpan produk: " + (error.message || "Pastikan kolom 'stock' sudah ada di database"));
    }
  };

  const addToPosCart = (product: any) => {
    setPosCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updatePosQty = (id: number, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromPosCart = (id: number) => {
    setPosCart(prev => prev.filter(item => item.id !== id));
  };

  const processPosOrder = async () => {
    if (posCart.length === 0) return;
    setIsPosProcessing(true);

    try {
      const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      // 1. Create Offline Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: 'Pembelian Offline',
          customer_phone: '0000',
          delivery_method: 'pickup',
          payment_method: 'Tunai',
          status: 'completed',
          subtotal: subtotal,
          shipping_cost: 0,
          grand_total: subtotal,
          is_offline: true // New flag
        }])
        .select();

      if (orderError) throw orderError;

      const orderId = orderData[0].id;

      // 2. Insert Order Items
      const orderItems = posCart.map(item => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        qty: item.qty,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Update Stocks
      for (const item of posCart) {
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct && typeof currentProduct.stock === 'number') {
          const newStock = Math.max(0, currentProduct.stock - item.qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }
      }

      alert('Transaksi offline berhasil dicatat!');
      setPosCart([]);
      setCashAmount("");
      fetchData(); // Refresh data and stocks
    } catch (error: any) {
      console.error('POS Error:', error);
      alert('Gagal memproses transaksi: ' + error.message);
    } finally {
      setIsPosProcessing(false);
    }
  };

  const totalRevenue = orders
    .filter((order) => order.status === "completed" || order.status === "confirmed")
    .reduce((sum, order) => sum + order.grand_total, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = orders
    .filter((order) => {
      const created = new Date(order.created_at);
      return (
        (order.status === "completed" || order.status === "confirmed") &&
        created.getMonth() === currentMonth &&
        created.getFullYear() === currentYear
      );
    })
    .reduce((sum, order) => sum + order.grand_total, 0);

  const revenueHistory = useMemo(() => {
    const last6Months: any[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const name = date.toLocaleDateString("id-ID", { month: "short" });
      last6Months.push({ key, name, total: 0 });
    }

    orders.forEach((order) => {
      if (order.status !== "completed" && order.status !== "confirmed") return;
      const created = new Date(order.created_at);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const monthRow = last6Months.find((month) => month.key === key);
      if (monthRow) monthRow.total += order.grand_total;
    });

    return last6Months;
  }, [orders]);

  const maxRevenue = Math.max(...revenueHistory.map((month) => month.total), 1);

  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const totalProducts = products.length;
  const totalUsers = users.length;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    { id: "cashier" as const, label: "Kasir (POS)", icon: ShoppingCart },
    { id: "orders" as const, label: "Pesanan", icon: ClipboardList },
    { id: "products" as const, label: "Produk", icon: Box },
    { id: "users" as const, label: "Pengguna", icon: Users },
    { id: "reviews" as const, label: "Ulasan", icon: Edit3 },
    { id: "analytics" as const, label: "Analitik", icon: BarChart3 },
  ];

if (isUnauthorized) {
  return (
    <div className="admin-unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon-wrap">
          <div className="icon-pulse" />
          <div className="icon-inner">
            <X size={32} strokeWidth={3} />
          </div>
        </div>
        
        <div className="unauthorized-text">
          <h1>Akses Dibatasi</h1>
          <p>Maaf, akun <strong>{user?.email}</strong> tidak memiliki otoritas untuk mengakses area administrasi ini.</p>
        </div>

        <div className="unauthorized-actions">
          <a href="/" className="btn-action-primary">
            <Home size={18} />
            Kembali ke Beranda
          </a>
        </div>

        <div className="unauthorized-footer">
          Keamanan Hijrah Toko &copy; 2026
        </div>
      </div>

      <style jsx>{`
        .admin-unauthorized-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          background-image: 
            radial-gradient(at 0% 0%, rgba(225, 29, 72, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(30, 64, 175, 0.15) 0px, transparent 50%);
          padding: 2rem;
          font-family: 'DM Sans', sans-serif;
        }

        .unauthorized-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .unauthorized-icon-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-inner {
          position: relative;
          z-index: 2;
          width: 64px;
          height: 64px;
          background: #e11d48;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 20px -5px rgba(225, 29, 72, 0.5);
        }

        .icon-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #e11d48;
          border-radius: 20px;
          opacity: 0.3;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0; }
        }

        .unauthorized-text h1 {
          color: white;
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .unauthorized-text p {
          color: #94a3b8;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .unauthorized-text strong {
          color: #e2e8f0;
        }

        .unauthorized-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-action-primary {
          width: 100%;
          padding: 1rem;
          background: #e11d48;
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action-primary:hover {
          background: #be123c;
          transform: translateY(-2px);
        }

        .btn-action-secondary {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          text-decoration: none;
          border-radius: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .btn-action-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .unauthorized-footer {
          font-size: 0.75rem;
          color: #475569;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

if (!user) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
        }

        @media (max-width: 768px) {
          .login-page { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 2.5rem 1.5rem; }
        }

        /* LEFT PANEL */
        .login-left {
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 3rem;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(204,16,16,0.13) 0%, transparent 65%);
          top: -120px; left: -120px;
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(204,16,16,0.07) 0%, transparent 65%);
          bottom: -60px; right: -40px;
          pointer-events: none;
        }
        .login-logo-ring {
          width: 140px; height: 140px;
          border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2.25rem;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px rgba(204,16,16,0.15), 0 16px 48px rgba(0,0,0,0.6);
          overflow: hidden;
          flex-shrink: 0;
        }
        .login-logo-ring img {
          width: 100%; height: 100%;
          object-fit: cover; border-radius: 50%;
        }
        .login-brand-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px; color: #fff;
          font-weight: 400; text-align: center;
          line-height: 1.25; margin-bottom: 0.6rem;
        }
        .login-brand-title strong { font-weight: 600; }
        .login-red-rule {
          width: 36px; height: 2px;
          background: #cc1010;
          margin: 1.4rem auto;
          border-radius: 2px;
        }
        .login-brand-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          text-align: center;
          line-height: 1.7;
          max-width: 230px;
          font-weight: 300;
        }
        .login-feature-list {
          list-style: none;
          margin-top: 2rem; padding: 0;
          display: flex; flex-direction: column; gap: 0.85rem;
          width: 100%; max-width: 250px;
        }
        .login-feature-list li {
          display: flex; align-items: center; gap: 12px;
          font-size: 12.5px; color: rgba(255,255,255,0.38);
          font-weight: 300;
        }
        .login-feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%; background: #cc1010;
          flex-shrink: 0;
        }

        /* RIGHT PANEL */
        .login-right {
          background: #111111;
          border-left: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 4rem 3.5rem;
        }
        .login-form-wrap {
          width: 100%; max-width: 380px;
        }
        .login-eyebrow {
          font-size: 10.5px; color: #cc1010;
          letter-spacing: 2.5px; text-transform: uppercase;
          font-weight: 500; margin-bottom: 10px;
          font-family: 'DM Sans', sans-serif;
        }
        .login-heading {
          font-family: 'Playfair Display', serif;
          font-size: 30px; color: #fff;
          font-weight: 400; line-height: 1.2;
          margin-bottom: 6px;
        }
        .login-sub {
          font-size: 13px; color: rgba(255,255,255,0.38);
          margin-bottom: 2.25rem;
          font-weight: 300;
          font-family: 'DM Sans', sans-serif;
        }
        .login-field { margin-bottom: 1.2rem; }
        .login-field label {
          display: block;
          font-size: 10.5px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 8px;
          font-family: 'DM Sans', sans-serif;
        }
        .login-field input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-field input::placeholder { color: rgba(255,255,255,0.2); }
        .login-field input:hover { border-color: rgba(255,255,255,0.14); }
        .login-field input:focus {
          border-color: rgba(204,16,16,0.45);
          background: rgba(204,16,16,0.05);
        }
        .login-submit {
          width: 100%; padding: 14px;
          background: #cc1010;
          border: none; border-radius: 8px;
          color: #fff; font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500; cursor: pointer;
          transition: background 0.2s, transform 0.1s, opacity 0.2s;
          margin-top: 0.4rem;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .login-submit:hover:not(:disabled) { background: #a00d0d; }
        .login-submit:active:not(:disabled) { transform: scale(0.99); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-footer-note {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 11.5px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          line-height: 1.7;
          font-family: 'DM Sans', sans-serif;
        }
        .login-footer-note span { color: rgba(204,16,16,0.6); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-page">
        {/* Left Panel */}
        <div className="login-left">
          <div className="login-logo-ring">
            <img src="/assets/images/logo-hijrah-toko.png" alt="Hijrah Toko" />
          </div>
          <div className="login-brand-title">
            Portal<br /><strong>Admin</strong>
          </div>
          <div className="login-red-rule" />
          <p className="login-brand-desc">
            Kelola bisnis frozen food & ATK Anda dari satu dashboard terpusat.
          </p>
          <ul className="login-feature-list">
            <li><div className="login-feature-dot" />Manajemen pesanan real-time</li>
            <li><div className="login-feature-dot" />Kelola produk &amp; stok</li>
            <li><div className="login-feature-dot" />Data pelanggan terpusat</li>
            <li><div className="login-feature-dot" />Laporan &amp; analitik penjualan</li>
          </ul>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          <div className="login-form-wrap">
            <p className="login-eyebrow">Admin Only</p>
            <h1 className="login-heading">Selamat<br />Datang Kembali</h1>
            <p className="login-sub">Masuk untuk melanjutkan ke dashboard</p>

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label>Email Admin</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="masukkan email admin"
                  required
                />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
              </div>
              <button
                className="login-submit"
                type="submit"
                disabled={isLoginLoading}
              >
                {isLoginLoading ? (
                  <><Loader2 size={16} className="spin" /> Memproses...</>
                ) : (
                  "Masuk Dashboard"
                )}
              </button>
            </form>

            <div className="login-footer-note">
              Hanya akun admin utama yang diizinkan masuk.<br />
              Butuh bantuan? Hubungi <span>admin.hijrahtoko@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


return (
  <div className={`admin-v2 ${isSidebarOpen ? "sidebar-open" : ""}`}>
    {isSidebarOpen && (
      <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
    )}

    <aside className={`admin-v2-sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="admin-sidebar-brand">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" />
        <div>
          <strong>Hijrah Toko</strong>
          <span>Admin Portal</span>
        </div>
        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-link">
          <Home size={18} />
          <span>Ke Toko</span>
        </Link>
        <button type="button" className="admin-sidebar-link danger" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <main className="admin-v2-main">
      <header className="admin-topbar">
        <div className="topbar-left">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title-wrap">
            <h1>{navItems.find(i => i.id === activeTab)?.label || "Dashboard"}</h1>
            <p className="admin-user-info">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>{loading ? "Memuat..." : "Refresh Data"}</span>
        </button>
      </header>

      <div className="content-body">
        <section className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span className="kpi-icon green">
              <DollarSign size={18} />
            </span>
            <h3>Omzet Total</h3>
            <strong>Rp {totalRevenue.toLocaleString("id-ID")}</strong>
          </article>
          <article className="admin-kpi-card">
            <span className="kpi-icon amber">
              <AlertCircle size={18} />
            </span>
            <h3>Pesanan Pending</h3>
            <strong>{pendingOrders}</strong>
          </article>
          <article className="admin-kpi-card">
            <span className="kpi-icon blue">
              <Package size={18} />
            </span>
            <h3>Total Produk</h3>
            <strong>{totalProducts}</strong>
          </article>
          <article className="admin-kpi-card">
            <span className="kpi-icon slate">
              <Users size={18} />
            </span>
            <h3>Total Pengguna</h3>
            <strong>{totalUsers}</strong>
          </article>
          <article className="admin-kpi-card featured">
            <span className="kpi-icon rose">
              <TrendingUp size={18} />
            </span>
            <h3>Omzet Bulan Ini</h3>
            <strong>Rp {monthlyRevenue.toLocaleString("id-ID")}</strong>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>
              <BarChart3 size={18} />
              Tren Pendapatan 6 Bulan
            </h2>
          </div>
          <div className="admin-chart">
            {revenueHistory.map((month) => (
              <div key={month.key} className="admin-bar-wrapper">
                <span>Rp {(month.total / 1000).toFixed(0)}k</span>
                <div
                  className="admin-bar"
                  style={{ height: `${Math.max((month.total / maxRevenue) * 150, 8)}px` }}
                  title={`Rp ${month.total.toLocaleString("id-ID")}`}
                />
                <small>{month.name}</small>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <section className="admin-loading-state">
            <Loader2 size={20} className="spin" />
            <p>Memuat data dashboard...</p>
          </section>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <section className="admin-panel">
                <div className="admin-panel-header split">
                  <h2>
                    <Home size={18} />
                    Ringkasan Dashboard
                  </h2>
                  <span className="panel-chip">Hari Ini</span>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {products.filter(p => (p.stock || 0) <= 5).length > 0 && (
                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} /> Peringatan Stok Menipis
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b', fontSize: '0.9rem' }}>
                        {products.filter(p => (p.stock || 0) <= 5).map(p => (
                          <li key={p.id}>
                            <strong>{p.name}</strong> - Sisa stok: {p.stock || 0}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Pesanan Hari Ini</h4>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                        {orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
                      </p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Produk Aktif</h4>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                        {products.length}
                      </p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Total Pelanggan</h4>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                        {users.length}
                      </p>
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Pesanan Terbaru</h4>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                          <div>
                            <strong>{order.customer_name}</strong>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{order.grand_total.toLocaleString('id-ID')}</p>
                          </div>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            background: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                            color: order.status === 'completed' ? '#166534' : '#92400e'
                          }}>
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "cashier" && (
              <section className="admin-pos-layout">
                <article className="admin-panel">
                  <div className="admin-panel-header split">
                    <h2>
                      <ShoppingCart size={18} />
                      Katalog Kasir
                    </h2>
                    <div className="admin-search-minimal">
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder="Cari produk..." 
                        value={posSearchTerm}
                        onChange={(e) => setPosSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pos-grid">
                    {products
                      .filter(p => p.name.toLowerCase().includes(posSearchTerm.toLowerCase()))
                      .map(product => (
                        <div key={product.id} className={`pos-card ${(product.stock || 0) <= 0 ? 'out-of-stock' : ''}`}>
                          <img src={product.img} alt={product.name} />
                          <div className="pos-card-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1 }}>
                              <strong>{product.name}</strong>
                              <span className="price">Rp {product.price.toLocaleString('id-ID')}</span>
                              <span className={`stock ${product.stock <= 5 ? 'low' : ''}`}>
                                Stok: {product.stock || 0}
                              </span>
                            </div>
                            <button 
                              onClick={() => addToPosCart(product)}
                              disabled={product.stock <= 0}
                              className="btn-add-pos"
                            >
                              {product.stock <= 0 ? 'Habis' : 'Tambah'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </article>

                <article className="admin-panel">
                  <div className="admin-panel-header">
                    <h2>Detail Transaksi</h2>
                  </div>
                  
                  <div className="pos-cart-list">
                    {posCart.length === 0 ? (
                      <div className="pos-empty">Keranjang kosong</div>
                    ) : (
                      posCart.map(item => (
                        <div key={item.id} className="pos-cart-item">
                          <div className="item-info">
                            <strong>{item.name}</strong>
                            <span>Rp {item.price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="item-qty-ctrl">
                            <button onClick={() => updatePosQty(item.id, -1)}><MinusCircle size={16}/></button>
                            <span>{item.qty}</span>
                            <button onClick={() => updatePosQty(item.id, 1)}><PlusCircle size={16}/></button>
                            <button className="remove" onClick={() => removeFromPosCart(item.id)}><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pos-summary">
                    <div className="summary-row">
                      <span>Total</span>
                      <strong>Rp {posCart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString('id-ID')}</strong>
                    </div>

                    <div className="pos-calc">
                      <div className="calc-field">
                        <label>Uang Pelanggan (Rp)</label>
                        <input 
                          type="number" 
                          placeholder="Masukkan jumlah..." 
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                        />
                      </div>
                      <div className="calc-result">
                        <span>Kembalian</span>
                        <strong className={Number(cashAmount) - posCart.reduce((s, i) => s + (i.price * i.qty), 0) < 0 ? 'negative' : ''}>
                          Rp {(Number(cashAmount) > 0 
                            ? Math.max(0, Number(cashAmount) - posCart.reduce((s, i) => s + (i.price * i.qty), 0)) 
                            : 0).toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    <button 
                      className="btn-process-pos" 
                      disabled={posCart.length === 0 || isPosProcessing || (Number(cashAmount) < posCart.reduce((s, i) => s + (i.price * i.qty), 0))}
                      onClick={processPosOrder}
                    >
                      {isPosProcessing ? 'Memproses...' : 'Proses Pembayaran'}
                    </button>
                  </div>
                </article>
              </section>
            )}

            {activeTab === "orders" && (
              <section className="admin-panel">
                <div className="admin-panel-header split">
                  <h2>
                    <ClipboardList size={18} />
                    Manajemen Pesanan
                  </h2>
                  <span className="panel-chip">{filteredOrders.length} pesanan</span>
                </div>

                <div className="admin-toolbar">
                  <label className="admin-searchbox">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Cari nama atau nomor WhatsApp..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </label>

                  <select
                    className="admin-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as (typeof ORDER_STATUSES)[number])
                    }
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pelanggan</th>
                        <th>Pesanan</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="admin-empty-row">
                            Tidak ada pesanan sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <div className="admin-customer-cell">
                                <strong>{order.customer_name}</strong>
                                <span>{order.customer_phone}</span>
                                <small>
                                  {new Date(order.created_at).toLocaleString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div className="admin-order-items">
                                <span className="delivery-pill">
                                  {order.delivery_method === "pickup"
                                    ? "Ambil di Toko"
                                    : "Diantar"}
                                </span>
                                <ul>
                                  {(order.order_items || []).slice(0, 3).map((item: any) => (
                                    <li key={`${order.id}-${item.id || item.product_id}`}>
                                      <span>{item.product_name}</span>
                                      <strong>x{item.qty}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                            <td>
                              <select
                                className={`status-select status-${order.status}`}
                                value={order.status}
                                onChange={(event) =>
                                  updateOrderStatus(order.id, event.target.value)
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Dikonfirmasi</option>
                                <option value="processing">Diproses</option>
                                <option value="shipped">Dikirim</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Batalkan</option>
                              </select>
                            </td>
                            <td>
                              <strong className="order-total">
                                Rp {order.grand_total.toLocaleString("id-ID")}
                              </strong>
                            </td>
                            <td>
                              <div className="admin-action-row">
                                <button
                                  type="button"
                                  className="icon-action info"
                                  title="Cetak struk"
                                  onClick={() => printReceipt(order)}
                                >
                                  <Printer size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-action danger"
                                  title="Hapus"
                                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "products" && (
              <section className="admin-product-layout">
                <article className="admin-panel">
                  <div className="admin-panel-header split">
                    <h2>
                      <Edit3 size={18} />
                      {editingProductId ? "Edit Produk" : "Tambah Produk"}
                    </h2>
                  </div>

                  <form onSubmit={saveProduct} className="admin-form">
                    <label>
                      Nama Produk
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Deskripsi
                      <textarea
                        rows={3}
                        value={productForm.desc}
                        onChange={(e) => setProductForm(p => ({ ...p, desc: e.target.value }))}
                        required
                      />
                    </label>
                    <div className="admin-form-grid">
                      <label>
                        Harga
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                          required
                        />
                      </label>
                      <label>
                        Kategori
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))}
                        >
                          <option value="frozen">Frozen Food</option>
                          <option value="atk">ATK</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </label>
                      <label>
                        Stok
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm(p => ({ ...p, stock: Number(e.target.value) }))}
                          required
                        />
                      </label>
                    </div>
                    <label>
                      URL Gambar
                      <input
                        type="text"
                        value={productForm.img}
                        onChange={(e) => setProductForm(p => ({ ...p, img: e.target.value }))}
                      />
                    </label>
                    <label className="upload-trigger">
                      <Upload size={16} /> Upload Gambar
                      <input type="file" onChange={handleFileUpload} accept="image/*" hidden />
                    </label>
                    {isUploading && (
                      <div className="upload-progress">
                        <span style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    <button type="submit" className="admin-btn admin-btn-primary">
                      {editingProductId ? "Simpan Perubahan" : "Tambah Produk"}
                    </button>
                  </form>
                </article>

                <article className="admin-panel">
                  <div className="admin-panel-header split">
                    <h2>
                      <Package size={18} />
                      Katalog Produk
                    </h2>
                    <span className="panel-chip">{products.length} item</span>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Harga</th>
                          <th>Stok</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td>
                              <div className="admin-product-cell">
                                <img src={product.img} alt="" />
                                <div>
                                  <strong>{product.name}</strong>
                                  <small>{product.category}</small>
                                </div>
                              </div>
                            </td>
                            <td>Rp {product.price.toLocaleString('id-ID')}</td>
                            <td>{product.stock}</td>
                            <td>
                              <div className="admin-action-row">
                                <button 
                                  className="icon-action info"
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setProductForm({ ...product });
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button className="icon-action danger" onClick={() => deleteProduct(product.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>
            )}

            {activeTab === "users" && (
              <section className="admin-panel">
                <div className="admin-panel-header split">
                  <h2>
                    <Users size={18} />
                    Manajemen Pengguna
                  </h2>
                  <span className="panel-chip">{users.length} terdaftar</span>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pengguna</th>
                        <th>Kontak</th>
                        <th>Alamat & Info</th>
                        <th>Terdaftar Sejak</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(entry => (
                        <tr key={entry.id}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="avatar"><UserCircle2 size={18} /></div>
                              <div>
                                <strong>{entry.full_name || "Tanpa Nama"}</strong>
                                <small>{entry.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <a href={`https://wa.me/${entry.phone?.replace(/[^0-9]/g, '')}`} target="_blank" className="wa-link">
                                {entry.phone || "-"}
                              </a>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '200px', lineHeight: '1.4' }}>
                              {entry.address || "Belum ada alamat"}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              }) : "-"}
                            </div>
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <button className="icon-action danger" title="Hapus Pengguna" onClick={() => deleteUser(entry.id, entry.full_name)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "reviews" && (
              <section className="admin-panel">
                <div className="admin-panel-header split">
                  <h2>
                    <Edit3 size={18} />
                    Ulasan & Rating
                  </h2>
                  <span className="panel-chip">{reviews.length} ulasan</span>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pelanggan</th>
                        <th>Rating</th>
                        <th>Ulasan</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length === 0 ? (
                        <tr><td colSpan={4} className="admin-empty-row">Belum ada ulasan.</td></tr>
                      ) : (
                        reviews.map(review => (
                          <tr key={review.id}>
                            <td><strong>{review.name}</strong></td>
                            <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>{"⭐".repeat(review.rating)}</td>
                            <td style={{ fontSize: '0.9rem', color: '#475569' }}>{review.text}</td>
                            <td>{new Date(review.date).toLocaleDateString('id-ID')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "analytics" && (
              <section className="admin-panel">
                <div className="admin-panel-header split">
                  <h2>
                    <BarChart3 size={18} />
                    Laporan Penjualan
                  </h2>
                  <button onClick={handleExportCSV} className="admin-btn admin-btn-primary">
                    <Upload size={16} style={{ transform: 'rotate(180deg)' }} />
                    Export CSV
                  </button>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                  <p style={{ margin: 0, color: '#64748b' }}>Gunakan tombol di atas untuk mengunduh laporan seluruh data transaksi dalam format CSV untuk pembukuan.</p>
                </div>
              </section>
            )}
          </>
        )}
        </div>
      </main>
      <style jsx>{`
        /* --- GLOBAL ADMIN RESET --- */
        :global(body) {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #f8fafc;
        }

        .admin-v2 {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
        }

        /* --- SIDEBAR SYSTEM --- */
        .admin-v2-sidebar {
          width: 280px;
          height: 100vh;
          background: #0f172a;
          color: #f8fafc;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-sidebar-brand {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .admin-sidebar-brand img {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #fff;
          padding: 4px;
        }

        .admin-sidebar-brand strong {
          font-size: 1.1rem;
          display: block;
        }

        .admin-sidebar-brand span {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .mobile-close-btn {
          display: none;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          padding: 8px;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }

        .admin-sidebar-nav {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow-y: auto;
        }

        .admin-sidebar-link {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          color: #cbd5e1;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
          text-align: left;
        }

        .admin-sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .admin-sidebar-link.active {
          background: #e11d48;
          color: #fff;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
        }

        .admin-sidebar-link.danger { color: #f87171; }
        .admin-sidebar-link.danger:hover { background: rgba(220, 38, 38, 0.1); }

        .admin-sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: grid;
          gap: 0.25rem;
        }

        /* --- MAIN CONTENT AREA --- */
        .admin-v2-main {
          flex: 1;
          margin-left: 280px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .admin-topbar {
          background: #fff;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .mobile-menu-btn {
          display: none;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
        }

        .topbar-title-wrap h1 {
          font-size: 1.25rem;
          margin: 0;
          color: #0f172a;
          font-weight: 800;
        }

        .admin-user-info {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .content-body {
          padding: 1.5rem;
          display: grid;
          gap: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        /* --- KPI GRID --- */
        .admin-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .admin-kpi-card {
          background: #fff;
          padding: 1.25rem;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .admin-kpi-card.featured {
          background: #fff1f2;
          border-color: #fecdd3;
        }

        .admin-kpi-card h3 {
          margin: 0;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .admin-kpi-card strong {
          font-size: 1.25rem;
          color: #0f172a;
          font-weight: 800;
        }

        .kpi-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
        }

        .kpi-icon.rose { background: #ffe4e6; color: #e11d48; }
        .kpi-icon.green { background: #dcfce7; color: #166534; }
        .kpi-icon.blue { background: #dbeafe; color: #1d4ed8; }
        .kpi-icon.amber { background: #fef3c7; color: #92400e; }
        .kpi-icon.slate { background: #f1f5f9; color: #475569; }

        /* --- PANELS & TABLES --- */
        .admin-panel {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }

        .admin-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .admin-panel-header h2 {
          font-size: 1.1rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
        }

        .admin-table-wrap {
          margin: 0 -1.5rem;
          padding: 0 1.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .admin-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }

        /* --- BUTTONS --- */
        .admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          font-family: inherit;
        }

        .admin-btn-primary { background: #0f172a; color: #fff; }
        .admin-btn-primary:hover { background: #334155; }
        
        .admin-btn-secondary { background: #fff; border-color: #cbd5e1; color: #475569; }
        .admin-btn-secondary:hover:enabled { background: #f8fafc; }

        .icon-action {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid transparent;
          transition: 0.2s;
        }
        .icon-action.info { background: #eff6ff; color: #1d4ed8; }
        .icon-action.danger { background: #fef2f2; color: #dc2626; }

        /* --- CHART --- */
        .admin-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 1rem;
          height: 200px;
          padding: 1rem 0;
          overflow-x: auto;
        }
        .admin-bar-wrapper {
          min-width: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .admin-bar {
          width: 40px;
          background: #e11d48;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }
        .admin-bar-wrapper span { font-size: 0.7rem; color: #64748b; }
        .admin-bar-wrapper small { font-size: 0.75rem; font-weight: 600; }

        /* --- POS SPECIFIC --- */
        .admin-pos-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          align-items: start;
        }

        .pos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
        }

        .pos-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }
        .pos-card.out-of-stock {
          opacity: 0.9;
        }
        .pos-card.out-of-stock img {
          filter: grayscale(1);
          opacity: 0.6;
        }
        .pos-card.out-of-stock::before {
          content: "HABIS";
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: white;
          padding: 0.25rem 0.5rem;
          font-size: 0.6rem;
          font-weight: 800;
          border-radius: 4px;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .pos-card img { width: 100%; height: 100px; object-fit: cover; }
        .pos-card-info { padding: 0.75rem; flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .pos-card-info strong { 
          font-size: 0.8rem; 
          color: #1e293b; 
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.4em;
          line-height: 1.2em;
          margin-bottom: 0.25rem;
        }
        .pos-card-info .price { color: #e11d48; font-weight: 700; font-size: 0.9rem; }
        .pos-card-info .stock { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .pos-card-info .stock.low { color: #f59e0b; }
        .btn-add-pos {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #0f172a;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          width: 100%;
        }
        .pos-card.out-of-stock .btn-add-pos {
          background: #94a3b8;
          cursor: not-allowed;
        }

        /* --- FORM STYLES --- */
        .admin-form {
          display: grid;
          gap: 1.25rem;
          margin-top: 1rem;
        }
        .admin-form label {
          display: grid;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }
        .admin-form input, .admin-form select, .admin-form textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          font-family: inherit;
          background: #f8fafc;
          transition: all 0.2s;
        }
        .admin-form input:focus, .admin-form select:focus, .admin-form textarea:focus {
          border-color: #e11d48;
          outline: none;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }
        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .upload-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 2px dashed #cbd5e1;
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .upload-trigger:hover {
          border-color: #e11d48;
          color: #e11d48;
          background: #fff1f2;
        }
        .upload-progress {
          height: 6px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .upload-progress span {
          display: block;
          height: 100%;
          background: #e11d48;
          transition: width 0.3s;
        }

        /* --- TABLE CELLS --- */
        .admin-product-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .admin-product-cell img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }
        .admin-product-cell strong {
          display: block;
          font-size: 0.9rem;
          color: #0f172a;
        }
        .admin-product-cell small {
          color: #64748b;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .admin-user-cell .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .admin-user-cell strong {
          display: block;
          font-size: 0.9rem;
          color: #0f172a;
        }
        .admin-user-cell small {
          color: #64748b;
          font-size: 0.75rem;
        }

        .wa-link {
          color: #10b981;
          font-weight: 600;
          text-decoration: none;
        }
        .wa-link:hover { text-decoration: underline; }

        .admin-action-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .panel-chip {
          padding: 0.25rem 0.75rem;
          background: #f1f5f9;
          color: #475569;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .admin-search-minimal {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .admin-search-minimal input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          color: #1e293b;
        }

        .admin-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .admin-searchbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          flex: 1;
          min-width: 250px;
        }
        .admin-searchbox input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
        }
        .admin-status-filter {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-family: inherit;
          font-size: 0.9rem;
          min-width: 150px;
          outline: none;
        }

        .admin-customer-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .admin-customer-cell strong { color: #0f172a; font-size: 0.9rem; }
        .admin-customer-cell span { color: #475569; font-size: 0.8rem; }
        .admin-customer-cell small { color: #94a3b8; font-size: 0.75rem; }

        .admin-order-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .delivery-pill {
          padding: 0.2rem 0.5rem;
          background: #e0f2fe;
          color: #0284c7;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .admin-order-items ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 100%;
        }
        .admin-order-items li {
          font-size: 0.8rem;
          color: #475569;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }
        .admin-order-items li strong { color: #0f172a; }

        .status-select {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          border: 1px solid transparent;
          font-size: 0.8rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          padding-right: 2rem;
        }
        .status-select.status-pending { background-color: #fef3c7; color: #92400e; border-color: #fde68a; }
        .status-select.status-confirmed { background-color: #e0f2fe; color: #0284c7; border-color: #bae6fd; }
        .status-select.status-processing { background-color: #f3e8ff; color: #7e22ce; border-color: #e9d5ff; }
        .status-select.status-shipped { background-color: #ffedd5; color: #c2410c; border-color: #fed7aa; }
        .status-select.status-completed { background-color: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .status-select.status-cancelled { background-color: #fee2e2; color: #b91c1c; border-color: #fecaca; }

        .order-total { font-size: 0.95rem; color: #0f172a; }

        /* --- POS CART --- */
        .pos-cart-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
        }
        .pos-empty {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.9rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px dashed #cbd5e1;
        }
        .pos-cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .item-info {
          display: flex;
          flex-direction: column;
        }
        .item-info strong { font-size: 0.85rem; color: #0f172a; }
        .item-info span { font-size: 0.8rem; color: #e11d48; font-weight: 600; }
        .item-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .item-qty-ctrl button {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 4px;
        }
        .item-qty-ctrl button:hover { background: #e2e8f0; color: #0f172a; }
        .item-qty-ctrl button.remove { color: #ef4444; }
        .item-qty-ctrl button.remove:hover { background: #fee2e2; }
        .item-qty-ctrl span { font-size: 0.9rem; font-weight: 600; min-width: 1.5rem; text-align: center; }

        .pos-summary {
          border-top: 2px dashed #e2e8f0;
          padding-top: 1.5rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        .summary-row strong { color: #e11d48; font-size: 1.25rem; }

        .pos-calc {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 12px;
        }
        .calc-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .calc-field label { font-size: 0.8rem; font-weight: 600; color: #475569; }
        .calc-field input {
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-family: inherit;
          font-size: 1rem;
        }
        .calc-result {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .calc-result span { font-size: 0.9rem; font-weight: 600; color: #475569; }
        .calc-result strong { font-size: 1.1rem; color: #10b981; }
        .calc-result strong.negative { color: #ef4444; }

        .btn-process-pos {
          width: 100%;
          padding: 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-process-pos:hover:not(:disabled) { background: #059669; }
        .btn-process-pos:disabled { background: #94a3b8; cursor: not-allowed; }

        .admin-sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .admin-v2-sidebar { transform: translateX(-100%); }
          .admin-v2-sidebar.open { transform: translateX(0); }
          .admin-v2-main { margin-left: 0; }
          .mobile-menu-btn, .mobile-close-btn { display: flex; }
          .admin-pos-layout { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .admin-topbar { flex-wrap: wrap; }
          .admin-user-info { display: none; }
          .admin-kpi-grid { grid-template-columns: 1fr; }
          .admin-btn span { display: none; }
        }
      `}</style>
    </div>
  );
}
