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

    // --- PEMBERSIHAN DATA MANUAL ---

    // 1. Hapus Item Pesanan & Pesanan
    const { data: userOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", userId);

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
      await supabaseAdmin.from("orders").delete().in("id", orderIds);
    }

    // 2. Hapus data di tabel-tabel pendukung
    // Kita jalankan satu per satu agar lebih aman dan mudah di-handle jika tabel tidak ada
    await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    
    // Untuk tabel alamat, kita coba hapus tapi abaikan jika kolom/tabel tidak ada
    try {
      await supabaseAdmin.from("user_addresses").delete().eq("user_id", userId);
    } catch (e) {
      console.log("Table user_addresses skip or not found");
    }

    // 3. Hapus dari Authentication
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      if (authError.message.includes("User not found")) {
        console.log("User already gone from Auth");
      } else {
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
