"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Package,
  ShoppingCart,
  Trash2,
  User,
  Clock,
  Banknote,
  CreditCard,
  Printer,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  DollarSign,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface POSCashierProps {
  products: any[];
  onTransactionComplete: () => void;
}

const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "frozen", label: "Frozen" },
  { id: "atk", label: "ATK" },
  { id: "other", label: "Lainnya" },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function POSCashier({ products, onTransactionComplete }: POSCashierProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit">("cash");
  const [cashInput, setCashInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const txInfo = useMemo(() => {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return {
      id: `TRX-${y}${m}${d}-${hh}${mm}`,
      time: `${hh}.${mm}`,
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const discountAmount = Math.round(subtotal * (discount / 100));
  const afterDiscount = subtotal - discountAmount;
  const ppnAmount = Math.round(afterDiscount * 0.11);
  const total = afterDiscount + ppnAmount;
  const cashValue = Number(cashInput) || 0;
  const changeAmount = cashValue - total;

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const addToCart = (product: any) => {
    const inCart = cart.find((i) => i.id === product.id)?.qty || 0;
    if (inCart + 1 > (product.stock || 0)) {
      alert(`Stok tidak cukup! Sisa: ${product.stock || 0}`);
      return;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    const product = products.find((p) => p.id === id);
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nq = i.qty + delta;
        if (nq > (product?.stock || 0)) {
          alert(`Stok tidak cukup! Sisa: ${product?.stock || 0}`);
          return i;
        }
        return { ...i, qty: Math.max(1, nq) };
      })
    );
  };

  const removeItem = (id: number) => setCart((p) => p.filter((i) => i.id !== id));

  const clearCart = () => {
    if (cart.length > 0 && !confirm("Kosongkan keranjang?")) return;
    setCart([]);
    setCashInput("");
  };

  const processPayment = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && cashValue < total) {
      alert("Uang pelanggan kurang dari total belanja!");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerName.trim() || "Pembeli POS",
            customer_phone: "-",
            delivery_method: "pickup",
            payment_method: paymentMethod === "cash" ? "Tunai" : paymentMethod === "qris" ? "QRIS" : "Debit",
            status: "completed",
            subtotal: subtotal,
            shipping_cost: 0,
            grand_total: total,
            is_offline: true,
          },
        ])
        .select();

      if (orderError) throw orderError;

      const orderId = orderData[0].id;

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((item) => ({
          order_id: orderId,
          product_id: item.id,
          product_name: item.name,
          qty: item.qty,
          price: item.price,
        }))
      );

      if (itemsError) throw itemsError;

      for (const item of cart) {
        await supabase
          .from("products")
          .update({ stock: (item.stock || 0) - item.qty })
          .eq("id", item.id);
      }

      setLastOrder({
        id: orderId,
        date: new Date().toISOString(),
        customerName: customerName.trim() || "Pembeli POS",
        items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal,
        discount: discountAmount,
        ppn: ppnAmount,
        total,
        paymentMethod: paymentMethod === "cash" ? "Tunai" : paymentMethod === "qris" ? "QRIS" : "Debit",
        cash: cashValue,
        change: paymentMethod === "cash" ? changeAmount : 0,
      });
      setShowSuccess(true);
      setCart([]);
      setCashInput("");
      setCustomerName("");
      setDiscount(0);
      onTransactionComplete();
    } catch (err: any) {
      alert("Gagal memproses: " + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    if (!lastOrder) return;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;

    const itemsHtml = lastOrder.items
      .map(
        (it: any) =>
          `<tr><td>${it.name} x${it.qty}</td><td style="text-align:right">Rp ${(it.price * it.qty).toLocaleString("id-ID")}</td></tr>`
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
        ${lastOrder.discount > 0 ? `<div class="tr"><span>Diskon</span><span>- Rp ${lastOrder.discount.toLocaleString("id-ID")}</span></div>` : ""}
        <div class="tr"><span>PPN (11%)</span><span>Rp ${lastOrder.ppn.toLocaleString("id-ID")}</span></div>
        <div class="tr gr"><span>Total</span><span>Rp ${lastOrder.total.toLocaleString("id-ID")}</span></div>
        ${lastOrder.paymentMethod === "Tunai" ? `<div class="tr"><span>Tunai</span><span>Rp ${lastOrder.cash.toLocaleString("id-ID")}</span></div><div class="tr"><span>Kembali</span><span>Rp ${lastOrder.change.toLocaleString("id-ID")}</span></div>` : ""}
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
        <div className="pos-modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-icon">
              <CheckCircle2 size={48} strokeWidth={2} />
            </div>
            <h2>Transaksi Berhasil!</h2>
            <p className="pos-modal-id"># {lastOrder.id}</p>
            <div className="pos-modal-details">
              <div className="pos-md-row">
                <span>Total</span>
                <strong>Rp {lastOrder.total.toLocaleString("id-ID")}</strong>
              </div>
              <div className="pos-md-row">
                <span>Pembayaran</span>
                <span>{lastOrder.paymentMethod}</span>
              </div>
              {lastOrder.paymentMethod === "Tunai" && (
                <>
                  <div className="pos-md-row">
                    <span>Tunai</span>
                    <span>Rp {lastOrder.cash.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pos-md-row">
                    <span>Kembalian</span>
                    <strong className="pos-md-green">
                      Rp {lastOrder.change.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </>
              )}
            </div>
            <div className="pos-modal-items">
              {lastOrder.items.map((item: any, i: number) => (
                <div key={i} className="pos-mi-row">
                  <span>
                    {item.name} <strong>x{item.qty}</strong>
                  </span>
                  <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className="pos-modal-actions">
              <button type="button" className="pos-m-btn secondary" onClick={printReceipt}>
                <Printer size={16} /> Cetak Struk
              </button>
              <button type="button" className="pos-m-btn primary" onClick={() => setShowSuccess(false)}>
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-wrapper">
        <div className="pos-top">
          <div className="pos-search">
            <Search size={18} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="pos-search-x" onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="pos-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pos-cat ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="pos-main">
          <div className="pos-grid">
            {filteredProducts.length === 0 ? (
              <div className="pos-grid-empty">
                <Package size={40} />
                <p>Tidak ada produk ditemukan</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`pos-card ${(product.stock || 0) <= 0 ? "out" : ""}`}
                  onClick={() => (product.stock || 0) > 0 && addToCart(product)}
                >
                  <div className="pos-card-icon">
                    {product.img ? (
                      <img src={product.img} alt={product.name} />
                    ) : (
                      <Package size={28} />
                    )}
                  </div>
                  <h3 className="pos-card-name">{product.name}</h3>
                  <span className={`pos-card-cat cat-${product.category}`}>
                    {product.category === "frozen"
                      ? "Frozen"
                      : product.category === "atk"
                      ? "ATK"
                      : "Lainnya"}
                  </span>
                  <span className="pos-card-price">Rp {product.price.toLocaleString("id-ID")}</span>
                  <span
                    className={`pos-card-stock ${
                      (product.stock || 0) <= 0
                        ? "out"
                        : (product.stock || 0) <= 10
                        ? "low"
                        : ""
                    }`}
                  >
                    Stok: {product.stock || 0}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart">
            <div className="pos-cart-head">
              <div className="pos-cart-title">
                <ShoppingCart size={18} />
                <h2>Keranjang</h2>
                <span className="pos-cart-badge">{totalItems} item</span>
              </div>
              <button type="button" className="pos-cart-clear" onClick={clearCart}>
                <Trash2 size={14} /> Hapus
              </button>
            </div>

            <div className="pos-cart-meta">
              <span># {txInfo.id}</span>
              <span>
                <User size={12} /> admin.
              </span>
              <span>
                <Clock size={12} /> {txInfo.time}
              </span>
            </div>

            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={36} />
                  <p>Keranjang kosong</p>
                  <span>Pilih produk dari katalog</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pos-ci">
                    <div className="pos-ci-img">
                      {item.img ? <img src={item.img} alt="" /> : <Package size={18} />}
                    </div>
                    <div className="pos-ci-info">
                      <strong>{item.name}</strong>
                      <span>
                        Rp {item.price.toLocaleString("id-ID")} / Pcs
                      </span>
                    </div>
                    <div className="pos-ci-qty">
                      <button type="button" onClick={() => updateQty(item.id, -1)}>
                        <Minus size={12} />
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)}>
                        <Plus size={12} />
                      </button>
                      <button type="button" className="pos-ci-del" onClick={() => removeItem(item.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="pos-ci-total">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pos-cart-bottom">
                <div className="pos-field">
                  <label>Nama Pelanggan (opsional)</label>
                  <div className="pos-field-input">
                    <User size={14} />
                    <input
                      type="text"
                      placeholder="Pelanggan umum"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pos-field">
                  <label>Diskon (%)</label>
                  <div className="pos-field-input">
                    <span className="pos-field-prefix">%</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    />
                  </div>
                </div>

                <div className="pos-summary">
                  <div className="pos-sum-row">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="pos-sum-row discount">
                      <span>Diskon ({discount}%)</span>
                      <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="pos-sum-row">
                    <span>PPN (11%)</span>
                    <span>Rp {ppnAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pos-sum-row total">
                    <span>Total</span>
                    <strong>Rp {total.toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                <div className="pos-pay-label">Metode Pembayaran</div>
                <div className="pos-pay-grid">
                  <button
                    type="button"
                    className={`pos-pay-opt ${paymentMethod === "cash" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote size={18} />
                    <span>Tunai</span>
                  </button>
                  <button
                    type="button"
                    className={`pos-pay-opt ${paymentMethod === "qris" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("qris")}
                  >
                    <Smartphone size={18} />
                    <span>QRIS</span>
                  </button>
                  <button
                    type="button"
                    className={`pos-pay-opt ${paymentMethod === "debit" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("debit")}
                  >
                    <CreditCard size={18} />
                    <span>Debit</span>
                  </button>
                </div>

                {paymentMethod === "cash" && (
                  <div className="pos-cash">
                    <div className="pos-cash-row">
                      <label>Uang Pelanggan</label>
                      <div className="pos-cash-input">
                        <span className="pos-cash-rp">Rp</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={cashInput}
                          onChange={(e) => setCashInput(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="pos-quick">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="pos-quick-btn"
                          onClick={() => setCashInput(String(amt))}
                        >
                          {amt >= 1000000
                            ? `${amt / 1000000}jt`
                            : `${amt / 1000}rb`}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="pos-quick-btn exact"
                        onClick={() => setCashInput(String(total))}
                      >
                        <DollarSign size={12} /> Pas
                      </button>
                    </div>
                    {cashValue > 0 && (
                      <div className={`pos-change ${changeAmount < 0 ? "neg" : ""}`}>
                        <span>Kembalian</span>
                        <strong>Rp {Math.max(0, changeAmount).toLocaleString("id-ID")}</strong>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className={`pos-pay-btn ${paymentMethod === "cash" && cashValue < total ? "disabled" : ""}`}
                  disabled={isProcessing || (paymentMethod === "cash" && cashValue < total)}
                  onClick={processPayment}
                >
                  {isProcessing ? (
                    <>
                      <span className="pos-spinner" /> Memproses...
                    </>
                  ) : (
                    <>
                      <Printer size={16} /> Bayar Rp {total.toLocaleString("id-ID")}
                    </>
                  )}
                </button>

                <button type="button" className="pos-cancel" onClick={clearCart}>
                  Batalkan Transaksi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
