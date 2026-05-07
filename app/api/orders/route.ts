import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import axios from 'axios';

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- KONFIGURASI EMAIL ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// --- KONFIGURASI CASHIFY ---
const CASHIFY_API_KEY = process.env.CASHIFY_API_KEY || '';
// Pastikan nama variable Vercel sama persis: CASHIFY_MERCHANT_CODE
const CASHIFY_MERCHANT_CODE = process.env.CASHIFY_MERCHANT_CODE || ''; 
const CASHIFY_API_URL = 'https://api.cashify.id/v1/transactions';

// --- GET (Ambil Data) ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'products') {
    const { data, error } = await supabase.from('products').select('*');
    return NextResponse.json({ data, error });
  } 
  
  if (type === 'orders') {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ data, error });
  }

  return NextResponse.json({ message: 'Invalid Request' }, { status: 400 });
}

// --- POST (Kirim Order & Request QR) ---
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const body = await req.json();

  // 1. REQUEST QR CODE KE CASHIFY
  if (type === 'create_payment') {
    const { orderId, productId, email } = body;

    // Ambil Data Produk dari Supabase
    const { data: productData, error: prodError } = await supabase.from('products').select('*').eq('id', productId).single();
    
    if(prodError || !productData) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Konversi Harga (Hapus "Rp " dan titik)
        // Pastikan ini ada di atas
    const priceString = productData.price;
    // Asumsi harga di database: "Rp 500.000"
    const priceNumber = parseInt(priceString.replace(/[^0-9]/g, '')); 
    // Hasil: 500000

    // Simpan Order dulu ke Supabase status 'pending'
    const { data: orderData, error: insertError } = await supabase.from('orders').insert([{ 
      order_id: orderId, 
      product_name: productData.name, 
      price: productData.price, 
      email, 
      proof: 'PAYMENT_GATEWAY_CASHIFY', 
      status: 'pending' 
    }]).select().single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

    try {
      // Request ke API Cashify
            // Request ke API Cashify
      const cashifyPayload = {
        // PENTING: qr_id ini ADALAH ID dari halaman QRIS Management kamu
        // Jangan dipikir ini API Key, ini hanya 'Wadah' pembayarannya.
        qr_id: "da6ce19e-124a-4e7a-b363-66f5d6402972", 
        
        amount: priceNumber, // <--- INI YANG DINAMIS (Berubah tergantung harga produk)
        
        useUniqueCode: true, // Ini wajib aktif biar nominal unik (anti bentrok)
        packageIds: ["id.dana"], // Pastikan package nama ini sesuai di dashboard Cashify
        expiredInMinutes: 15
      };

      const response = await axios.post(CASHIFY_API_URL, cashifyPayload, {
        headers: {
          'Authorization': `Bearer ${CASHIFY_API_KEY}`, // <-- Ini wajib License Key
          'Content-Type': 'application/json'
        }
      });

      // Cashify biasanya mengembalikan object yang berisi 'qr_code_url' atau 'checkout_url'
      return NextResponse.json({ 
        success: true,
        qr_code: response.data.qr_code_url || response.data.checkout_url,
        orderId: orderId
      });

    } catch (err) {
      console.error("Cashify Error:", err);
      return NextResponse.json({ error: 'Failed connect to Cashify', details: err }, { status: 500 });
    }
  }

  // 2. WEBHOOK CASHIFY (Callback saat pembayaran sukses)
  if (type === 'webhook') {
    const { order_id, status } = body; // Cashify akan kirim ini

    if (status === 'paid' || status === 'success') {
      // Cek order di database
      const { data: orderData } = await supabase.from('orders').select('*').eq('order_id', order_id).single();
      
      if (orderData && orderData.status !== 'approved') {
        // Ambil link download produk
        const { data: productInfo } = await supabase.from('products').select('*').eq('name', orderData.product_name).single();
        const downloadLink = productInfo ? productInfo.download_link : '#';
        
        // Update status jadi Approved
        await supabase.from('orders').update({ status: 'approved' }).eq('order_id', order_id);

        // KIRIM EMAIL OTOMATIS
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: orderData.email,
          subject: `Link Download: ${orderData.product_name}`,
          html: `
            <div style="background:#0f172a; padding:30px; font-family:sans-serif; border-radius: 8px; color: #fff;">
              <h2 style="margin-bottom:10px; color: #00dc82;">Pembayaran Berhasil!</h2>
              <p style="color: #a5b4fc; font-size: 14px;">Terima kasih telah membeli <strong>${orderData.product_name}</strong>.</p>
              <p style="margin-bottom: 16px;">Link download produk Anda ada di bawah ini:</p>
              <a href="${downloadLink}" style="padding: 12px 24px; background:#fff; color: #000; text-decoration:none; border-radius: 6px; font-weight:bold;">Download Produk</a>
            </div>
          `
        };
        
        try { await transporter.sendMail(mailOptions); } catch (err) { console.error("Email Error:", err); }
      }
    }
    return NextResponse.json({ status: 'OK' });
  }

  // 3. MANUAL UPLOAD PROOF (Tetap ada untuk fallback)
  if (type === 'order') {
    const { orderId, productId, email, proof } = body;
    
    const { data: productData } = await supabase.from('products').select('*').eq('id', productId).single();
    if(!productData) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const { data, error } = await supabase.from('orders').insert([{ 
      order_id: orderId, 
      product_name: productData.name, 
      price: productData.price, 
      email, 
      proof, 
      status: 'pending' 
    }]).select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'success', data });
  }

  // 4. TAMBAH PRODUK (Admin)
  if (type === 'product') {
    const { name, price, category, description, features, downloadLink } = body;
    const featuresArray = Array.isArray(features) ? features : features.split(',').map((s: string) => s.trim());

    const { data, error } = await supabase.from('products')
      .insert([{ 
        name, price, category, description, 
        features: JSON.stringify(featuresArray), 
        download_link: downloadLink 
      }])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Product added', data });
  }

  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

// --- PUT (Update Manual Admin) ---
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body; 

  const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!orderData) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const { error: updateErr } = await supabase.from('orders').update({ status }).eq('id', id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (status === 'approved') {
    const { data: productInfo } = await supabase.from('products').select('*').eq('name', orderData.product_name).single();
    const downloadLink = productInfo ? productInfo.download_link : '#';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orderData.email,
      subject: `Link Download: ${orderData.product_name}`,
      html: `<div style="background:#0f172a; padding:30px; font-family:sans-serif; border-radius: 8px; color: #fff;"><h2 style="margin-bottom:10px; color: #00dc82;">Pembayaran Diterima!</h2><p>Terima kasih telah membeli <strong>${orderData.product_name}</strong>.</p><p style="margin-bottom: 16px;">Link download produk Anda ada di bawah ini:</p><a href="${downloadLink}" style="padding: 12px 24px; background:#fff; color: #000; text-decoration:none; border-radius: 6px; font-weight:bold;">Download Produk</a></div>`
    };
    
    try { 
      await transporter.sendMail(mailOptions); 
    } catch (err) { 
      console.error("Email Error:", err); 
    }
  }

  return NextResponse.json({ message: 'Status updated' });
}

// --- DELETE (Hapus Produk Admin) ---
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (type === 'product' && id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Product deleted' });
  }

  return NextResponse.json({ message: 'Invalid Delete Request' }, { status: 400 });
}
