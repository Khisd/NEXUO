import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Gunakan default string kosong untuk mencegah error build kalau env kosong
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cek apakah key ada sebelum bikin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // Debug: Cek apakah Supabase terinisialisasi
  if (!supabaseUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_SUPABASE_URL is missing in .env" }, { status: 500 });
  }

  if (type === 'products') {
    const { data, error } = await supabase.from('products').select('*');
    
    // Debug: Kembalikan error detail kalau gagal
    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ data: null, error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data, error: null });
  } 
  
  if (type === 'orders') {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ data, error });
  }

  return NextResponse.json({ message: 'Invalid Request' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const body = await req.json();

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
      html: `
        <div style="background:#0f172a; padding:30px; font-family:sans-serif; border-radius: 8px; color: #fff;">
          <h2 style="margin-bottom:10px; color: #00dc82;">Pembayaran Diterima!</h2>
          <p style="color: #a5b4fc; font-size: 14px;">Terima kasih telah membeli <strong>${orderData.product_name}</strong>.</p>
          <p style="margin-bottom: 16px;">Link download produk Anda ada di bawah ini:</p>
          <a href="${downloadLink}" style="padding: 12px 24px; background:#fff; color: #000; text-decoration:none; border-radius: 6px; font-weight:bold;">Download Produk</a>
        </div>
      `
    };
    
    try { 
      await transporter.sendMail(mailOptions); 
    } catch (err) { 
      console.error("Email Error:", err); 
    }
  }

  return NextResponse.json({ message: 'Status updated' });
}

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