"use client";

import React, { useState, useMemo } from 'react';
import { ClipboardList, Printer, Search, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  useDashboard,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
} from '../../../lib/dashboard-context';
import { useFeedback } from '../../../lib/feedback-context';

export default function TransactionsPage() {
  const { orders, fetchData } = useDashboard();
  const { success, error, showConfirm } = useFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof ORDER_STATUSES)[number]>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchSearch =
        !searchTerm ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const cancelOrder = (orderId: number, customerName: string) => {
    showConfirm({
      title: 'Batalkan Pesanan?',
      description: `Pesanan dari "${customerName}" akan dibatalkan. Stok produk akan dikembalikan otomatis.`,
      confirmText: 'Ya, Batalkan',
      cancelText: 'Tidak',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const order = orders.find((o: any) => o.id === orderId);
          if (order && order.order_items) {
            for (const item of order.order_items) {
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();
              if (product && typeof product.stock === 'number') {
                await supabase
                  .from('products')
                  .update({ stock: product.stock + item.qty })
                  .eq('id', item.product_id);
              }
            }
          }
          const { error: supaError } = await supabase.from('orders').delete().eq('id', orderId);
          if (supaError) throw supaError;
          success('Pesanan Dibatalkan', `Pesanan #${orderId} telah dibatalkan, stok dikembalikan`);
          fetchData();
        } catch (err: any) {
          error('Gagal Membatalkan Pesanan', err.message || 'Terjadi kesalahan');
        }
      },
    });
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    if (status === 'cancelled') {
      const order = orders.find((o: any) => o.id === orderId);
      cancelOrder(orderId, order?.customer_name || 'Pelanggan');
      return;
    }
    try {
      const { error: supaError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (supaError) throw supaError;
      success('Status Diperbarui', `Pesanan #${orderId} sekarang ${ORDER_STATUS_LABEL[status]}`);
      fetchData();
    } catch (err: any) {
      error('Gagal Memperbarui Status', err.message || 'Error tidak diketahui');
    }
  };

  const printReceipt = (order: any) => {
    const items = (order.order_items || [])
      .map(
        (item: any) =>
          `<tr><td>${item.product_name}</td><td>${item.qty}</td><td>Rp ${item.price.toLocaleString(
            'id-ID'
          )}</td><td>Rp ${(item.qty * item.price).toLocaleString('id-ID')}</td></tr>`
      )
      .join('');

    const receiptHtml = `<!DOCTYPE html>
<html><head><title>Struk-${order.id}</title>
<style>
body{font-family:monospace;padding:8px;width:80mm;}
h2{text-align:center;margin:0 0 4px;font-size:14px;}
table{width:100%;font-size:11px;border-collapse:collapse;}
td{padding:2px 0;}
.right{text-align:right;}
.divider{border-top:1px dashed #000;margin:4px 0;}
</style></head><body>
<h2>HIJRAH TOKO</h2>
<p style="text-align:center;margin:0;font-size:10px;">Padang, Sumatera Barat</p>
<div class="divider"></div>
<p style="font-size:10px;margin:2px 0;">No: #${order.id}<br/>
Tgl: ${new Date(order.created_at).toLocaleString('id-ID')}<br/>
Plg: ${order.customer_name}<br/>
Telp: ${order.customer_phone || '-'}<br/>
${
  order.delivery_method === 'pickup'
    ? 'Ambil di Toko'
    : 'Diantar<br/>Alamat: ' + (order.customer_address || '-')
}
</p>
<div class="divider"></div>
<table>
<tr><th style="text-align:left;font-size:10px;">Item</th><th style="font-size:10px;">Qty</th><th class="right" style="font-size:10px;">Harga</th><th class="right" style="font-size:10px;">Total</th></tr>
${items}
</table>
<div class="divider"></div>
<p style="font-size:11px;">Subtotal: Rp ${(order.subtotal || 0).toLocaleString('id-ID')}<br/>
${
  order.shipping_cost
    ? 'Ongkir: Rp ' + order.shipping_cost.toLocaleString('id-ID') + '<br/>'
    : ''
}Total: <b>Rp ${order.grand_total.toLocaleString('id-ID')}</b><br/>
Bayar: ${order.payment_method || 'COD'}<br/>
Status: ${order.status}</p>
<div class="divider"></div>
<p style="text-align:center;font-size:10px;">Terima Kasih!</p>
</body></html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(receiptHtml);
      win.document.close();
      win.print();
    }
  };

  return (
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
              filteredOrders.map((order: any, i: number) => (
                <tr key={order.id} className="fb-row" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                  <td>
                    <div className="admin-customer-cell">
                      <strong>{order.customer_name}</strong>
                      <span>{order.customer_phone}</span>
                      <small>
                        {new Date(order.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="admin-order-items">
                      <span className="delivery-pill">
                        {order.delivery_method === 'pickup' ? 'Ambil di Toko' : 'Diantar'}
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
                      onChange={(event) => updateOrderStatus(order.id, event.target.value)}
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
                      Rp {order.grand_total.toLocaleString('id-ID')}
                    </strong>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="icon-action info fb-pressable"
                        title="Cetak struk"
                        onClick={() => printReceipt(order)}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-action danger fb-pressable"
                        title="Hapus"
                        onClick={() => cancelOrder(order.id, order.customer_name)}
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
  );
}
