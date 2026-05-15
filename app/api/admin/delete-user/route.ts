import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Service Role Key" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(`Starting aggressive cleanup for user: ${userId}`);

    // --- PEMBERSIHAN DATA MANUAL (Hapus semua yang berkaitan dengan user ini) ---

    // 1. Ambil data pesanan user untuk menghapus order_items terlebih dahulu
    const { data: userOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", userId);

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      // Hapus item pesanan
      await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
      // Hapus pesanan
      await supabaseAdmin.from("orders").delete().in("id", orderIds);
    }

    // 2. Hapus data di tabel-tabel pendukung lainnya
    await Promise.all([
      supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
      // Jika ada tabel alamat yang menggunakan user_id UUID
      supabaseAdmin.from("user_addresses").delete().filter("user_id", "eq", userId).catch(() => {}),
    ]);

    // 3. Langkah terakhir: Hapus dari Authentication
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      if (authError.message.includes("User not found")) {
        console.log("User already gone from Auth");
      } else {
        // Jika masih error database, kemungkinan ada tabel lain yang belum kita bersihkan
        throw new Error(`Gagal menghapus akun (Database Lock): ${authError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "User dan seluruh datanya telah dihapus total." 
    });
  } catch (error: any) {
    console.error("Aggressive delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
