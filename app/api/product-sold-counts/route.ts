import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Cache in-memory (server-side) selama 60 detik agar tidak hit DB tiap request.
// Cache invalidates otomatis saat server restart (edge: setiap deploy).
let cache: { data: Record<number, number>; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function GET() {
  try {
    // Return cache kalau masih fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(
        { counts: cache.data, cached: true, ts: cache.ts },
        { headers: { "Cache-Control": "public, max-age=30" } }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Aggregate total qty per product_id dari order_items.
    // Pakai LEFT JOIN orders untuk filter status='cancelled' (safety;
    // biasanya order yg dicancel sudah di-delete di dashboard, tapi
    // kalau ada yg nyangkut kita exclude juga).
    // RPC: pgsql aggregate di server, jauh lebih cepat dari JS loop.
    const { data, error } = await supabaseAdmin.rpc("get_product_sold_counts");

    if (error) {
      // Fallback: kalau function RPC belum dibuat, pakai query langsung.
      // (Aggregate di client; aman karena data cuma 2 kolom dan jumlah row
      // biasanya ratusan, bukan jutaan.)
      console.warn(
        "RPC get_product_sold_counts unavailable, falling back to direct query:",
        error.message
      );

      const { data: items, error: itemsErr } = await supabaseAdmin
        .from("order_items")
        .select("product_id, qty, orders(status)");

      if (itemsErr) {
        return NextResponse.json(
          { error: itemsErr.message },
          { status: 500 }
        );
      }

      const counts: Record<number, number> = {};
      for (const it of (items || []) as any[]) {
        const status = it.orders?.status;
        if (status === "cancelled") continue;
        const pid = Number(it.product_id);
        const q = Number(it.qty || 0);
        if (!Number.isFinite(pid) || !Number.isFinite(q)) continue;
        counts[pid] = (counts[pid] || 0) + q;
      }

      cache = { data: counts, ts: Date.now() };
      return NextResponse.json(
        { counts, cached: false, ts: cache.ts, source: "fallback" },
        { headers: { "Cache-Control": "public, max-age=30" } }
      );
    }

    const counts: Record<number, number> = {};
    for (const row of (data || []) as any[]) {
      const pid = Number(row.product_id);
      const sold = Number(row.total_sold || 0);
      if (!Number.isFinite(pid) || !Number.isFinite(sold)) continue;
      counts[pid] = sold;
    }

    cache = { data: counts, ts: Date.now() };
    return NextResponse.json(
      { counts, cached: false, ts: cache.ts, source: "rpc" },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  } catch (err: any) {
    console.error("product-sold-counts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
