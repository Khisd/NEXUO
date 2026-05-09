import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Konfigurasi Pengiriman Email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gunakan App Password dari Google
  },
});

// --- HANDLE DATA (GET) ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'products') {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return NextResponse.json({ data });
    }

    if (type === 'orders') {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ message: "API Nexuo Ready" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- HANDLE ACTIONS (POST) ---
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const body = await req.json();

    // 1. BUAT PEMBAYARAN
    if (type === 'create_payment') {
      const { productId, email } = body;
      
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
      if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

      const priceNumber = parseInt(product.price.toString().replace(/[^0-9]/g, '')) || 0;

      // Request ke Cashify
      const response = await axios.post('https://api.cashify.id/v1/transactions', {
        qr_id: "da6ce19e-124a-4e7a-b363-66f5d6402972", 
        amount: priceNumber,
        useUniqueCode: true,
        packageIds: ["id.dana"],
        expiredInMinutes: 15
      }, {
        headers: { 'Authorization': `Bearer ${process.env.CASHIFY_API_KEY}` }
      });

      // SIMPAN DATA KE TABEL ORDERS (Status PENDING)
      // Ini penting agar saat Webhook datang, kita tahu siapa pembelinya
      await supabase.from('orders').insert({
        email: email,
        product_id: productId,
        amount: priceNumber,
        status: 'PENDING',
        transaction_id: response.data.id // ID dari Cashify
      });

      return NextResponse.json({ success: true, qr_url: response.data.qr_code_url });
    }

    // 2. WEBHOOK (DIPANGGIL OTOMATIS OLEH CASHIFY SAAT SUDAH BAYAR)
    if (type === 'webhook') {
      const { transaction_id, status } = body;

      if (status === 'PAID') {
        // Ambil data order & link download produk
        const { data: order } = await supabase.from('orders').select('*, products(name, download_link)').eq('transaction_id', transaction_id).single();

        if (order) {
          // KIRIM EMAIL OTOMATIS
          await transporter.sendMail({
            from: '"NEXUO PROTOCOL" <noreply@nexuo.com>',
            to: order.email,
            subject: `Akses Produk: ${order.products.name}`,
            html: `
              <div style="background:#020617; color:white; padding:30px; border-radius:20px; font-family:sans-serif;">
                <h1 style="color:#10b981;">Pembayaran Berhasil!</h1>
                <p>Halo, ini adalah link akses untuk <b>${order.products.name}</b> yang Anda beli.</p>
                <div style="margin:30px 0;">
                  <a href="${order.products.download_link}" style="background:#10b981; color:black; padding:15px 25px; border-radius:10px; font-weight:bold; text-decoration:none;">DOWNLOAD / AKSES SEKARANG</a>
                </div>
                <p style="color:#64748b; font-size:12px;">Jika tombol tidak bekerja, copy link ini: ${order.products.download_link}</p>
              </div>
            `
          });

          // Update status di DB
          await supabase.from('orders').update({ status: 'PAID' }).eq('transaction_id', transaction_id);
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Invalid Action' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
