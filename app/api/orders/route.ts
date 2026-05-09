import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const body = await req.json();

    if (type === 'create_payment') {
      const { productId, email, orderId } = body;
      
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
      if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });

      // Proteksi harga: hapus karakter non-angka
      const priceNumber = parseInt(product.price.toString().replace(/[^0-9]/g, '')) || 0;

      const response = await axios.post('https://api.cashify.id/v1/transactions', {
        qr_id: "da6ce19e-124a-4e7a-b363-66f5d6402972", 
        amount: priceNumber,
        useUniqueCode: true,
        packageIds: ["id.dana"],
        expiredInMinutes: 15
      }, {
        headers: { 'Authorization': `Bearer ${process.env.CASHIFY_API_KEY}` }
      });

      return NextResponse.json({ success: true, qr_code: response.data.qr_code_url });
    }
    return NextResponse.json({ message: 'Invalid Request' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Tambahkan fungsi GET, PUT, DELETE kosong agar tidak error saat build jika dipanggil
export async function GET() { return NextResponse.json({ message: "Ready" }); }