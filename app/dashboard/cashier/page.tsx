"use client";

import React from 'react';
import POSCashier from '../../../components/POSCashier';
import { useDashboard } from '../../../lib/dashboard-context';

export default function CashierPage() {
  const { products, fetchData } = useDashboard();

  return (
    <section className="admin-pos-wrapper">
      <POSCashier products={products} onTransactionComplete={fetchData} />
    </section>
  );
}
