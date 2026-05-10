import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cashifyLicenseKey = process.env.CASHIFY_LICENSE_KEY;
    const cashifyMerchantCode = process.env.CASHIFY_MERCHANT_CODE;
    const mailUser = process.env.EMAIL_USER;
    const mailPass = process.env.EMAIL_PASS;

    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'DB not configured' });
    
    // WAJIB PAKAI SERVICE ROLE KEY UNTUK NEMBUS RLS SAAT UPDATE STATUS
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { order_id, product_name, price, email, phone } = req.body;
        let qrisString = null, cashifyTxId = null, totalAmount = price;
        const numericPrice = parseInt(price);

        if (cashifyLicenseKey && cashifyMerchantCode && numericPrice > 0) {
            try {
                const cashifyRes = await fetch('https://cashify.my.id/api/generate/qris', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-license-key': cashifyLicenseKey },
                    body: JSON.stringify({ id: cashifyMerchantCode, amount: numericPrice, useUniqueCode: true, packageIds: ["id.dana", "com.gojek.app", "com.shopee.id"], expiredInMinutes: 15 })
                });
                const cashifyData = await cashifyRes.json();
                if(cashifyData.status === 200 && cashifyData.data) {
                    qrisString = cashifyData.data.qr_string;
                    cashifyTxId = cashifyData.data.transactionId;
                    totalAmount = cashifyData.data.totalAmount;
                }
            } catch (err) { console.error('Cashify Error:', err); }
        }

        // Sesuai SQL kamu: price text, bukan bigint
        const { data, error } = await supabase
            .from('orders')
            .insert([{ 
                order_id, 
                product_name, 
                price: String(totalAmount), // Di DB tipenya TEXT
                email, 
                proof: null, 
                status: 'pending' 
            }])
            .select();

        if (error) return res.status(500).json({ error: error.message });
        
        // Kembalikan ke frontend
        return res.status(201).json({ 
            order: data[0], 
            qris_string: qrisString || 'MOCK_FALLBACK', 
            totalAmount: totalAmount 
        });
    }

    if (req.method === 'PUT') {
        const { order_id, status, proof } = req.body;
        let updateData = {};
        if (proof) updateData.proof = proof;
        if (status) updateData.status = status;

        const { data, error } = await supabase.from('orders').update(updateData).eq('order_id', order_id).select();
        if (error) return res.status(500).json({ error: error.message });
        const order = data[0];

        if (status === 'approved' && mailUser && mailPass && order.email) {
            try {
                const { data: productData } = await supabase.from('products').select('download_link, name').eq('name', order.product_name).single();
                const downloadUrl = productData?.download_link || '#';
                const productName = productData?.name || order.product_name;

                let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: mailUser, pass: mailPass } });
                await transporter.sendMail({
                    from: `"NEXUO Systems" <${mailUser}>`,
                    to: order.email,
                    subject: `Produk ${productName} Sudah Tersedia!`,
                    html: `
                        <div style="font-family:sans-serif;color:#333;padding:20px;max-width:500px;margin:auto;border:1px solid #ddd;border-radius:10px;">
                            <h2 style="color:#05080A;">Halo! Pembayaran Dikonfirmasi ✅</h2>
                            <p>Terima kasih sudah membeli <strong>${productName}</strong>.</p>
                            <p>Silakan download produk Anda melalui tombol di bawah ini:</p>
                            <a href="${downloadUrl}" style="display:inline-block;background:#c6f91f;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin:10px 0;">Download Sekarang</a>
                            <p style="font-size:12px;color:#888;margin-top:20px;">Jika ada kendala, balas email ini.</p>
                        </div>
                    `
                });
            } catch (err) { console.error('Nodemailer Error:', err); }
        }
        return res.status(200).json(order);
    }
    return res.status(405).json({ message: 'Method Not Allowed' });
}