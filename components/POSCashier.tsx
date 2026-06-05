"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Printer,
  X, CheckCircle2, Package, User, DollarSign, Banknote,
  CreditCard, ArrowRight, AlertCircle, Hash, Grid3x3,
  List, Tag, TrendingUp
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface POSCashierProps {
  products: any[];
  onTransactionComplete: () => void;
}

const CATEGORIES = [
  { id: "all", label: "Semua", icon: Grid3x3 },
  { id: "frozen", label: "Frozen", icon: Package },
  { id: "atk", label: "ATK", icon: Tag },
  { id: "other", label: "Lainnya", icon: List },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function POSCashier({ products, onTransactionComplete }: POSCashierProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cashInput, setCashInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "all" || p.category === category;
      return matchSearch && matchCategory;
    });
  }, [products, search, category]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const cashValue = Number(cashInput) || 0;
  const changeAmount = Math.max(0, cashValue - subtotal);
  const isPaymentValid = cashValue >= subtotal;

  const addToCart = (product: any) => {
    const currentInCart = cart.find(item => item.id === product.id)?.qty || 0;
    if (currentInCart + 1 > (product.stock || 0)) {
      alert(`Stok tidak cukup! Sisa: ${product.stock || 0}`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    const product = products.find(p => p.id === id);
    setCart(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newQty = item.qty + delta;
        if (newQty > (product?.stock || 0)) {
          alert(`Stok tidak cukup! Sisa: ${product?.stock || 0}`);
          return item;
        }
        return { ...item, qty: Math.max(1, newQty) };
      })
    );
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    if (cart.length > 0 && !confirm("Kosongkan keranjang?")) return;
    setCart([]);
    setCashInput("");
  };

  const handleQuickAmount = (amount: number) => {
    setCashInput(String(amount));
  };

  const handleExactAmount = () => {
    setCashInput(String(subtotal));
  };

  const processPayment = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && cashValue < subtotal) {
      alert("Uang pelanggan kurang dari total belanja!");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_name: customerName.trim() || "Pembeli POS",
          customer_phone: "-",
          delivery_method: "pickup",
          payment_method: paymentMethod === "cash" ? "Tunai" : "Transfer",
          status: "completed",
          subtotal: subtotal,
          shipping_cost: 0,
          grand_total: subtotal,
          is_offline: true,
        }])
        .select();

      if (orderError) throw orderError;

      const orderId = orderData[0].id;

      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        qty: item.qty,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product && typeof product.stock === "number") {
          const newStock = Math.max(0, product.stock - item.qty);
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.id);
        }
      }

      setLastOrder({
        id: orderId,
        items: [...cart],
        subtotal: subtotal,
        total: subtotal,
        cash: paymentMethod === "cash" ? cashValue : 0,
        change: paymentMethod === "cash" ? changeAmount : 0,
        paymentMethod: paymentMethod === "cash" ? "Tunai" : "Transfer",
        customerName: customerName.trim() || "Pembeli POS",
        date: new Date().toISOString(),
      });

      setCart([]);
      setCashInput("");
      setCustomerName("");
      setShowSuccess(true);
      onTransactionComplete();
    } catch (error: any) {
      alert("Gagal memproses transaksi: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    if (!lastOrder) return;
    const w = window.open("", "_blank");
    if (!w) return;

    const itemsHtml = lastOrder.items
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:4px 0">${item.name} x${item.qty}</td>
            <td style="text-align:right;padding:4px 0">Rp ${(item.price * item.qty).toLocaleString("id-ID")}</td>
          </tr>`
      )
      .join("");

    w.document.write(`
      <html><head><title>Struk #${lastOrder.id}</title>
      <style>
        @page{size:80mm auto;margin:0}
        body{font-family:'Courier New',monospace;width:80mm;margin:0;padding:12px;color:#000;font-size:11px;line-height:1.3}
        .hdr{text-align:center;margin-bottom:8px;border-bottom:1px dashed #000;padding-bottom:8px}
        .hdr h2{margin:0 0 3px;font-size:14px;text-transform:uppercase}
        .hdr p{margin:1px 0;font-size:9px}
        table{width:100%;border-collapse:collapse}
        th{border-bottom:1px solid #000;padding:4px 0;text-align:left;font-size:10px}
        .tot{margin-top:8px;border-top:1px dashed #000;padding-top:4px}
        .tr{display:flex;justify-content:space-between;margin:2px 0}
        .gr{font-weight:bold;font-size:13px;border-top:1px solid #000;padding-top:4px;margin-top:4px}
        .ft{margin-top:16px;border-top:1px dashed #000;padding-top:8px;text-align:center;font-size:9px}
      </style></head><body>
      <div class="hdr">
        <h2>HIJRAH TOKO</h2>
        <p>Frozen Food & ATK</p>
        <p>${new Date(lastOrder.date).toLocaleString("id-ID")}</p>
        <p>#${lastOrder.id}</p>
      </div>
      <p style="margin:4px 0"><strong>${lastOrder.customerName}</strong></p>
      <table><tr><th>Item</th><th style="text-align:right">Total</th></tr>${itemsHtml}</table>
      <div class="tot">
        <div class="tr"><span>Subtotal</span><span>Rp ${lastOrder.subtotal.toLocaleString("id-ID")}</span></div>
        ${lastOrder.paymentMethod === "Tunai" ? `<div class="tr"><span>Tunai</span><span>Rp ${lastOrder.cash.toLocaleString("id-ID")}</span></div><div class="tr"><span>Kembali</span><span>Rp ${lastOrder.change.toLocaleString("id-ID")}</span></div>` : ""}
        <div class="tr gr"><span>Total</span><span>Rp ${lastOrder.total.toLocaleString("id-ID")}</span></div>
        <div class="tr" style="font-size:9px;color:#666"><span>${lastOrder.paymentMethod}</span></div>
      </div>
      <div class="ft">
        <p>Terima kasih telah berbelanja</p>
        <p>di Hijrah Toko</p>
      </div>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <>
      {showSuccess && lastOrder && (
        <div className="pos-success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="pos-success-modal" onClick={e => e.stopPropagation()}>
            <div className="pos-success-icon">
              <CheckCircle2 size={48} strokeWidth={2} />
            </div>
            <h2>Transaksi Berhasil!</h2>
            <p className="pos-success-id"># {lastOrder.id}</p>
            <div className="pos-success-detail">
              <div className="ps-row"><span>Total</span><strong>Rp {lastOrder.total.toLocaleString("id-ID")}</strong></div>
              <div className="ps-row"><span>Pembayaran</span><span>{lastOrder.paymentMethod}</span></div>
              {lastOrder.paymentMethod === "Tunai" && (
                <>
                  <div className="ps-row"><span>Tunai</span><span>Rp {lastOrder.cash.toLocaleString("id-ID")}</span></div>
                  <div className="ps-row"><span>Kembalian</span><strong className="change">Rp {lastOrder.change.toLocaleString("id-ID")}</strong></div>
                </>
              )}
            </div>
            <div className="pos-success-items">
              {lastOrder.items.map((item: any, i: number) => (
                <div key={i} className="psi-row">
                  <span>{item.name} <strong>x{item.qty}</strong></span>
                  <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className="pos-success-actions">
              <button type="button" className="pos-btn pos-btn-secondary" onClick={printReceipt}>
                <Printer size={16} /> Cetak Struk
              </button>
              <button type="button" className="pos-btn pos-btn-primary" onClick={() => setShowSuccess(false)}>
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-layout">
        {/* ── LEFT: Product Catalog ── */}
        <div className="pos-catalog">
          <div className="pos-catalog-header">
            <h2><Package size={18} /> Katalog Produk</h2>
            <div className="pos-header-actions">
              <button
                type="button"
                className={`pos-view-toggle ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid"
              >
                <Grid3x3 size={15} />
              </button>
              <button
                type="button"
                className={`pos-view-toggle ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          <div className="pos-search-bar">
            <Search size={15} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari nama produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="pos-search-clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="pos-categories">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`pos-cat-btn ${category === cat.id ? "active" : ""}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
            <span className="pos-cat-count">{filteredProducts.length} item</span>
          </div>

          <div className={`pos-product-grid ${viewMode}`}>
            {filteredProducts.length === 0 ? (
              <div className="pos-empty-catalog">
                <Package size={32} />
                <p>Tidak ada produk ditemukan</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`pos-product-card ${(product.stock || 0) <= 0 ? "pos-product-out" : ""}`}
                  onClick={() => (product.stock || 0) > 0 && addToCart(product)}
                >
                  <div className="pos-product-img">
                    {product.img ? (
                      <img src={product.img} alt={product.name} />
                    ) : (
                      <Package size={22} />
                    )}
                    {(product.stock || 0) <= 0 && (
                      <span className="pos-badge-out">Habis</span>
                    )}
                    {(product.stock || 0) > 0 && (product.stock || 0) <= 3 && (
                      <span className="pos-badge-low">{product.stock}</span>
                    )}
                  </div>
                  <div className="pos-product-info">
                    <strong className="pos-product-name">{product.name}</strong>
                    <span className="pos-product-price">Rp {product.price.toLocaleString("id-ID")}</span>
                    <span className={`pos-product-stock ${(product.stock || 0) <= 3 ? "low" : ""}`}>
                      Stok: {product.stock || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="pos-add-btn"
                    disabled={(product.stock || 0) <= 0}
                    onClick={e => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Transaction Panel ── */}
        <div className="pos-transaction">
          <div className="pos-trans-header">
            <h2><ShoppingCart size={18} /> Transaksi</h2>
            <div className="pos-trans-badge">{totalItems} item</div>
          </div>

          {/* Cart Items */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-empty-cart">
                <ShoppingCart size={40} />
                <p>Keranjang kosong</p>
                <span>Pilih produk dari katalog</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pos-cart-row">
                  <div className="pos-cart-info">
                    <strong className="pos-cart-name">{item.name}</strong>
                    <span className="pos-cart-price">Rp {item.price.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pos-cart-qty">
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="pos-qty-val">{item.qty}</span>
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      className="pos-qty-remove"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <span className="pos-cart-subtotal">
                    Rp {(item.price * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Customer & Payment */}
          {cart.length > 0 && (
            <div className="pos-payment-area">
              <div className="pos-customer-input">
                <User size={14} />
                <input
                  type="text"
                  placeholder="Nama pelanggan (opsional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div className="pos-payment-methods">
                <button
                  type="button"
                  className={`pos-pm-btn ${paymentMethod === "cash" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote size={15} />
                  Tunai
                </button>
                <button
                  type="button"
                  className={`pos-pm-btn ${paymentMethod === "transfer" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("transfer")}
                >
                  <CreditCard size={15} />
                  Transfer
                </button>
              </div>

              {paymentMethod === "cash" && (
                <div className="pos-cash-section">
                  <div className="pos-cash-input-row">
                    <label>Uang Pelanggan</label>
                    <div className="pos-cash-input-wrap">
                      <span className="pos-currency">Rp</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={cashInput}
                        onChange={e => setCashInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pos-quick-amounts">
                    {QUICK_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        className="pos-qa-btn"
                        onClick={() => handleQuickAmount(amount)}
                      >
                        Rp {amount.toLocaleString("id-ID")}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pos-qa-btn exact"
                      onClick={handleExactAmount}
                    >
                      <DollarSign size={13} /> Pas
                    </button>
                  </div>

                  {cashValue > 0 && (
                    <div className={`pos-change ${changeAmount > 0 ? "" : "zero"}`}>
                      <span>Kembalian</span>
                      <strong>Rp {changeAmount.toLocaleString("id-ID")}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pos-summary">
                <div className="pos-sum-row">
                  <span>Subtotal ({totalItems} item)</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="pos-sum-row total">
                  <span>Total</span>
                  <strong>Rp {subtotal.toLocaleString("id-ID")}</strong>
                </div>
              </div>

              <button
                type="button"
                className={`pos-pay-btn ${paymentMethod === "cash" && !isPaymentValid ? "disabled" : ""}`}
                disabled={isProcessing || (paymentMethod === "cash" && !isPaymentValid)}
                onClick={processPayment}
              >
                {isProcessing ? (
                  <>
                    <span className="pos-spinner" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Bayar Rp {subtotal.toLocaleString("id-ID")}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button type="button" className="pos-clear-btn" onClick={clearCart}>
                <Trash2 size={13} /> Kosongkan
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
