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
  });

  const [activeTab, setActiveTab] = useState<"orders" | "products" | "users">(
    "orders"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof ORDER_STATUSES)[number]>(
    "all"
  );
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && session.user.email !== ADMIN_EMAIL) {
        alert("Akses ditolak: halaman ini khusus admin utama.");
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(session?.user || null);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && session.user.email !== ADMIN_EMAIL) {
        alert("Akses ditolak: akun ini tidak memiliki izin admin.");
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(session?.user || null);
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
        `Apakah Anda yakin ingin menghapus data profil "${name}"? Ini juga akan menghapus riwayat pesanan mereka.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.filter((entry) => entry.id !== userId));
      alert("Profil pengguna berhasil dihapus.");
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

      setProductForm({ name: "", desc: "", price: 0, category: "frozen", img: "" });
      setEditingProductId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Gagal menyimpan produk.");
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
    { id: "orders" as const, label: "Pesanan", icon: ClipboardList },
    { id: "products" as const, label: "Produk", icon: Box },
    { id: "users" as const, label: "Pengguna", icon: Users },
  ];

  if (!user) {
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-card">
          <div className="admin-auth-logo">
            <img src="/assets/images/logo-hijrah-toko.png" alt="Hijrah Toko" />
          </div>
          <h1>Admin Portal</h1>
          <p>Masuk untuk mengelola pesanan, produk, dan pelanggan.</p>

          <form onSubmit={handleLogin} className="admin-auth-form">
            <label>
              Email Admin
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin.hijrahtoko@gmail.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                required
              />
            </label>

            <button className="admin-btn admin-btn-primary admin-auth-submit" type="submit">
              {isLoginLoading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Dashboard"
              )}
            </button>
          </form>

          <small>Hanya akun admin utama yang diizinkan masuk.</small>
        </div>

        <style jsx>{`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-v2">
      <aside className="admin-v2-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" />
          <div>
            <strong>Hijrah Toko</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-sidebar-link ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
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
            <span>Kembali ke Toko</span>
          </Link>
          <button type="button" className="admin-sidebar-link danger" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="admin-v2-main">
        <header className="admin-topbar">
          <div>
            <h1>Ringkasan Dashboard</h1>
            <p>Anda login sebagai {user.email}</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {loading ? "Memuat..." : "Refresh Data"}
          </button>
        </header>

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
                                {order.delivery_method === "delivery" && order.customer_address ? (
                                  <small>{order.customer_address}</small>
                                ) : null}
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
                                <option value="cancelled">Batalkan (hapus)</option>
                              </select>
                            </td>
                            <td>
                              <strong className="order-total">
                                Rp {order.grand_total.toLocaleString("id-ID")}
                              </strong>
                            </td>
                            <td>
                              <div className="admin-action-row">
                                {order.status === "pending" && (
                                  <button
                                    type="button"
                                    className="icon-action success"
                                    title="Konfirmasi cepat"
                                    onClick={() => updateOrderStatus(order.id, "confirmed")}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="icon-action info"
                                  title="Cetak struk"
                                  onClick={() => printReceipt(order)}
                                >
                                  <Printer size={16} />
                                </button>
                                {order.status !== "cancelled" && order.status !== "completed" && (
                                  <button
                                    type="button"
                                    className="icon-action danger"
                                    title="Batalkan pesanan"
                                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
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
                    {editingProductId ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={() => {
                          setEditingProductId(null);
                          setProductForm({
                            name: "",
                            desc: "",
                            price: 0,
                            category: "frozen",
                            img: "",
                          });
                        }}
                      >
                        Batalkan Edit
                      </button>
                    ) : null}
                  </div>

                  <form onSubmit={saveProduct} className="admin-form">
                    <label>
                      Nama Produk
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Contoh: Bakso Sapi Premium"
                        required
                      />
                    </label>

                    <label>
                      Deskripsi
                      <textarea
                        rows={3}
                        value={productForm.desc}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, desc: event.target.value }))
                        }
                        placeholder="Tuliskan deskripsi singkat produk"
                        required
                      />
                    </label>

                    <div className="admin-form-grid">
                      <label>
                        Harga (Rp)
                        <input
                          type="number"
                          min={0}
                          value={productForm.price}
                          onChange={(event) =>
                            setProductForm((prev) => ({
                              ...prev,
                              price: Number(event.target.value) || 0,
                            }))
                          }
                          required
                        />
                      </label>

                      <label>
                        Kategori
                        <select
                          value={productForm.category}
                          onChange={(event) =>
                            setProductForm((prev) => ({
                              ...prev,
                              category: event.target.value,
                            }))
                          }
                        >
                          <option value="frozen">Frozen Food</option>
                          <option value="atk">ATK</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      URL Gambar
                      <input
                        type="text"
                        value={productForm.img}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, img: event.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </label>

                    <label className="upload-trigger">
                      <Upload size={16} />
                      Upload Gambar
                      <input type="file" onChange={handleFileUpload} accept="image/*" hidden />
                    </label>

                    {isUploading ? (
                      <div className="upload-progress">
                        <span style={{ width: `${uploadProgress}%` }} />
                      </div>
                    ) : null}

                    <button type="submit" className="admin-btn admin-btn-primary">
                      {editingProductId ? "Perbarui Produk" : "Simpan Produk"}
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
                          <th>Kategori</th>
                          <th>Harga</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="admin-product-cell">
                                <img
                                  src={product.img}
                                  alt={product.name}
                                  onError={(event) => {
                                    event.currentTarget.src = "https://via.placeholder.com/56";
                                  }}
                                />
                                <div>
                                  <strong>{product.name}</strong>
                                  <small>{String(product.desc || "").slice(0, 70)}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`category-pill ${product.category}`}>
                                {String(product.category).toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <strong>Rp {product.price.toLocaleString("id-ID")}</strong>
                            </td>
                            <td>
                              <div className="admin-action-row">
                                <button
                                  type="button"
                                  className="icon-action info"
                                  title="Edit produk"
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setProductForm({
                                      name: product.name,
                                      desc: product.desc,
                                      price: product.price,
                                      category: product.category,
                                      img: product.img,
                                    });
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-action danger"
                                  title="Hapus produk"
                                  onClick={() => deleteProduct(product.id)}
                                >
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
                        <th>WhatsApp</th>
                        <th>Alamat</th>
                        <th>Bergabung</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="avatar">
                                <UserCircle2 size={18} />
                              </div>
                              <div>
                                <strong>{entry.full_name || "Tanpa Nama"}</strong>
                                <small>{entry.email || "-"}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <a
                              href={`https://wa.me/${entry.phone?.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="wa-link"
                            >
                              {entry.phone || "-"}
                            </a>
                          </td>
                          <td>{entry.address || "-"}</td>
                          <td>
                            {entry.created_at
                              ? new Date(entry.created_at).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td>
                            <div className="admin-action-row">
                              <button
                                type="button"
                                className="icon-action info"
                                title="Lihat pesanan pengguna"
                                onClick={() => {
                                  setSearchTerm(entry.phone || entry.full_name || "");
                                  setStatusFilter("all");
                                  setActiveTab("orders");
                                }}
                              >
                                <Search size={16} />
                              </button>
                              <button
                                type="button"
                                className="icon-action danger"
                                title="Hapus pengguna"
                                onClick={() => deleteUser(entry.id, entry.full_name || "Tanpa Nama")}
                              >
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
          </>
        )}
      </main>

      <style jsx>{`
        .admin-v2 {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px 1fr;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        }

        .admin-auth-page {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #ffe4e6 0%, #f8fafc 45%, #eef2ff 100%);
          display: grid;
          place-items: center;
          padding: 1.5rem;
        }

        .admin-auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.45);
          display: grid;
          gap: 1rem;
        }

        .admin-auth-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-auth-logo img {
          width: 52px;
          height: 52px;
          object-fit: contain;
        }

        .admin-auth-card h1 {
          font-size: 1.5rem;
          font-weight: 800;
          text-align: center;
          color: #0f172a;
          margin: 0;
        }

        .admin-auth-card p {
          margin: 0;
          color: #64748b;
          text-align: center;
        }

        .admin-auth-card small {
          color: #94a3b8;
          text-align: center;
        }

        .admin-auth-form {
          display: grid;
          gap: 0.85rem;
        }

        .admin-auth-form label {
          display: grid;
          gap: 0.45rem;
          color: #475569;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .admin-auth-form input {
          width: 100%;
          padding: 0.8rem 0.95rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          font-family: inherit;
        }

        .admin-auth-form input:focus {
          outline: none;
          border-color: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.15);
        }

        .admin-auth-submit {
          margin-top: 0.5rem;
          width: 100%;
          justify-content: center;
        }

        .admin-v2-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
          border-right: 1px solid #1e293b;
          padding: 1.5rem 1.15rem;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 1.5rem;
        }

        .admin-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.5rem;
        }

        .admin-sidebar-brand img {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff;
          padding: 0.2rem;
          object-fit: contain;
        }

        .admin-sidebar-brand strong {
          display: block;
          font-size: 1rem;
          color: #f8fafc;
          line-height: 1.2;
        }

        .admin-sidebar-brand span {
          font-size: 0.77rem;
          color: #94a3b8;
        }

        .admin-sidebar-nav,
        .admin-sidebar-footer {
          display: grid;
          gap: 0.35rem;
        }

        .admin-sidebar-link {
          width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.75rem 0.85rem;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #cbd5e1;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .admin-sidebar-link:hover {
          background: #1e293b;
          color: #fff;
        }

        .admin-sidebar-link.active {
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #fff;
          box-shadow: 0 12px 24px -16px rgba(225, 29, 72, 0.85);
        }

        .admin-sidebar-link.danger {
          color: #fca5a5;
        }

        .admin-sidebar-link.danger:hover {
          background: rgba(127, 29, 29, 0.3);
          color: #fee2e2;
        }

        .admin-v2-main {
          padding: 1.6rem;
          display: grid;
          gap: 1rem;
          align-content: start;
        }

        .admin-topbar {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1rem 1.15rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          backdrop-filter: blur(8px);
        }

        .admin-topbar h1 {
          margin: 0;
          font-size: 1.25rem;
          color: #0f172a;
        }

        .admin-topbar p {
          margin: 0.2rem 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .admin-kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .admin-kpi-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 0.95rem;
          display: grid;
          gap: 0.45rem;
        }

        .admin-kpi-card.featured {
          background: linear-gradient(135deg, #fff1f2, #ffe4e6);
          border-color: #fecdd3;
        }

        .admin-kpi-card h3 {
          margin: 0;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .admin-kpi-card strong {
          color: #0f172a;
          font-size: 1.1rem;
          line-height: 1.2;
        }

        .kpi-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon.green {
          background: #dcfce7;
          color: #166534;
        }
        .kpi-icon.amber {
          background: #fef3c7;
          color: #92400e;
        }
        .kpi-icon.blue {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .kpi-icon.slate {
          background: #e2e8f0;
          color: #334155;
        }
        .kpi-icon.rose {
          background: #ffe4e6;
          color: #be123c;
        }

        .admin-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 1rem;
          box-shadow: 0 14px 30px -28px rgba(15, 23, 42, 0.45);
        }

        .admin-panel-header {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .admin-panel-header h2 {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 1.02rem;
          color: #0f172a;
        }

        .admin-panel-header.split {
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .panel-chip {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 0.3rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .admin-chart {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          align-items: end;
          gap: 0.8rem;
          min-height: 220px;
          padding: 0.5rem 0.25rem 0;
        }

        .admin-bar-wrapper {
          display: grid;
          justify-items: center;
          gap: 0.4rem;
        }

        .admin-bar-wrapper span {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 700;
        }

        .admin-bar-wrapper small {
          color: #475569;
          font-size: 0.78rem;
          text-transform: uppercase;
          font-weight: 700;
        }

        .admin-bar {
          width: 100%;
          max-width: 42px;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(180deg, #fb7185, #e11d48);
          transition: transform 0.2s ease;
        }

        .admin-bar:hover {
          transform: scaleX(1.06);
        }

        .admin-toolbar {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .admin-searchbox {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
          height: 42px;
        }

        .admin-searchbox input {
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          width: 100%;
          font-family: inherit;
        }

        .admin-status-filter {
          height: 42px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          padding: 0 0.85rem;
          font-family: inherit;
          font-weight: 600;
        }

        .admin-table-wrap {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 960px;
        }

        .admin-table th {
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          padding: 0.75rem 0.65rem;
        }

        .admin-table td {
          border-bottom: 1px solid #f1f5f9;
          padding: 0.75rem 0.65rem;
          vertical-align: top;
          color: #0f172a;
          font-size: 0.9rem;
        }

        .admin-empty-row {
          text-align: center;
          color: #64748b;
          padding: 2rem 1rem !important;
        }

        .admin-customer-cell {
          display: grid;
          gap: 0.25rem;
        }

        .admin-customer-cell strong {
          font-size: 0.92rem;
        }

        .admin-customer-cell span {
          color: #e11d48;
          font-weight: 700;
          font-size: 0.82rem;
        }

        .admin-customer-cell small {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .admin-order-items {
          display: grid;
          gap: 0.45rem;
        }

        .delivery-pill {
          width: fit-content;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1e3a8a;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .admin-order-items ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.2rem;
        }

        .admin-order-items li {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          color: #334155;
          font-size: 0.82rem;
        }

        .admin-order-items small {
          color: #64748b;
          font-size: 0.74rem;
        }

        .status-select {
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 0.45rem 0.6rem;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          background: #fff;
          min-width: 145px;
        }

        .status-select.status-pending {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #9a3412;
        }
        .status-select.status-confirmed {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .status-select.status-processing {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }
        .status-select.status-shipped {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #3730a3;
        }
        .status-select.status-completed {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #047857;
        }
        .status-select.status-cancelled {
          background: #fef2f2;
          border-color: #fecaca;
          color: #b91c1c;
        }

        .order-total {
          color: #be123c;
          font-size: 0.95rem;
        }

        .admin-action-row {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .icon-action {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .icon-action.success {
          background: #dcfce7;
          border-color: #86efac;
          color: #166534;
        }

        .icon-action.info {
          background: #e0f2fe;
          border-color: #bae6fd;
          color: #075985;
        }

        .icon-action.danger {
          background: #fee2e2;
          border-color: #fecaca;
          color: #b91c1c;
        }

        .icon-action:hover {
          transform: translateY(-1px);
        }

        .admin-product-layout {
          display: grid;
          grid-template-columns: minmax(320px, 420px) 1fr;
          gap: 1rem;
        }

        .admin-form {
          display: grid;
          gap: 0.8rem;
        }

        .admin-form label {
          display: grid;
          gap: 0.35rem;
          font-size: 0.82rem;
          color: #475569;
          font-weight: 700;
        }

        .admin-form input,
        .admin-form textarea,
        .admin-form select {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          padding: 0.7rem 0.85rem;
          font-family: inherit;
        }

        .admin-form input:focus,
        .admin-form textarea:focus,
        .admin-form select:focus {
          outline: none;
          border-color: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.15);
          background: #fff;
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .upload-trigger {
          width: fit-content;
          display: inline-flex !important;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0.55rem 0.8rem;
          cursor: pointer;
          color: #334155 !important;
        }

        .upload-trigger:hover {
          background: #e2e8f0;
        }

        .upload-progress {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .upload-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #fb7185, #e11d48);
          transition: width 0.3s ease;
        }

        .admin-product-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .admin-product-cell img {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
          background: #fff;
        }

        .admin-product-cell strong {
          display: block;
        }

        .admin-product-cell small {
          color: #64748b;
          font-size: 0.75rem;
        }

        .category-pill {
          display: inline-flex;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .category-pill.frozen {
          background: #ffe4e6;
          color: #be123c;
          border-color: #fecdd3;
        }

        .category-pill.atk {
          background: #e2e8f0;
          color: #334155;
          border-color: #cbd5e1;
        }

        .category-pill.other {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }

        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .admin-user-cell .avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          background: #f8fafc;
        }

        .admin-user-cell strong {
          display: block;
        }

        .admin-user-cell small {
          color: #64748b;
          font-size: 0.75rem;
        }

        .wa-link {
          color: #0f766e;
          text-decoration: none;
          font-weight: 700;
        }

        .wa-link:hover {
          text-decoration: underline;
        }

        .admin-loading-state {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          color: #64748b;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0.8rem 1rem;
          width: fit-content;
        }

        .admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: 10px;
          border: 1px solid transparent;
          padding: 0.6rem 0.9rem;
          font-size: 0.84rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .admin-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .admin-btn-primary {
          background: linear-gradient(135deg, #e11d48, #be123c);
          color: #fff;
          box-shadow: 0 12px 24px -16px rgba(225, 29, 72, 0.75);
        }

        .admin-btn-primary:hover:enabled {
          transform: translateY(-1px);
        }

        .admin-btn-secondary {
          background: #fff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .admin-btn-secondary:hover:enabled {
          background: #f8fafc;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1280px) {
          .admin-kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .admin-product-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .admin-v2 {
            grid-template-columns: 1fr;
          }
          .admin-v2-sidebar {
            position: static;
            height: auto;
            grid-template-rows: auto auto auto;
          }
          .admin-sidebar-nav {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .admin-sidebar-footer {
            grid-template-columns: 1fr 1fr;
          }
          .admin-topbar {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .admin-toolbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .admin-v2-main {
            padding: 0.9rem;
          }
          .admin-panel,
          .admin-topbar {
            padding: 0.85rem;
            border-radius: 14px;
          }
          .admin-sidebar-nav {
            grid-template-columns: 1fr;
          }
          .admin-sidebar-footer {
            grid-template-columns: 1fr;
          }
          .admin-kpi-grid {
            grid-template-columns: 1fr;
          }
          .admin-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
