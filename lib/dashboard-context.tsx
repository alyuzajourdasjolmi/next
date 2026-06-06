"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const ADMIN_EMAIL = "admin.hijrahtoko@gmail.com";

export const ORDER_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  all: "Semua Status",
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

type DashboardContextValue = {
  user: any;
  isUnauthorized: boolean;
  loading: boolean;
  orders: any[];
  products: any[];
  users: any[];
  reviews: any[];
  fetchData: () => Promise<void>;
  signOut: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async (sessionUser: any) => {
    if (sessionUser) {
      if (sessionUser.email !== ADMIN_EMAIL) {
        setIsUnauthorized(true);
        setUser(null);
      } else {
        setUser(sessionUser);
        setIsUnauthorized(false);
      }
    } else {
      setUser(null);
      setIsUnauthorized(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) checkUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user || null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        user,
        isUnauthorized,
        loading,
        orders,
        products,
        users,
        reviews,
        fetchData,
        signOut,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
