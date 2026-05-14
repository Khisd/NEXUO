export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('DB not configured - missing env vars');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase GET Error:', error);
                return res.status(500).json({ error: error.message });
            }
            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const { order_id, product_name, price, email, phone } = req.body;
            
            if (!order_id || !product_name || !price || !email) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const numericPrice = parseInt(price);
            let totalAmount = numericPrice;
            let qrisString = 'MOCK_FALLBACK';

            // Try Cashify QRIS (optional - won't fail if missing)
            const cashifyLicenseKey = process.env.CASHIFY_LICENSE_KEY;
            const cashifyMerchantCode = process.env.CASHIFY_MERCHANT_CODE;

            if (cashifyLicenseKey && cashifyMerchantCode && numericPrice > 0) {
                try {
                    const cashifyRes = await fetch('https://cashify.my.id/api/generate/qris', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'x-license-key': cashifyLicenseKey 
                        },
                        body: JSON.stringify({ 
                            id: cashifyMerchantCode, 
                            amount: numericPrice, 
                            useUniqueCode: true, 
                            packageIds: ["id.dana", "com.gojek.app", "com.shopee.id"], 
                            expiredInMinutes: 15 
                        })
                    });
                    const cashifyData = await cashifyRes.json();
                    if(cashifyData.status === 200 && cashifyData.data) {
                        qrisString = cashifyData.data.qr_string;
                        totalAmount = cashifyData.data.totalAmount || numericPrice;
                    }
                } catch (err) { 
                    console.error('Cashify Error (non-blocking):', err); 
                }
            }

            // Insert order
            const { data, error } = await supabase
                .from('orders')
                .insert([{ 
                    order_id, 
                    product_name, 
                    price: String(totalAmount),
                    email, 
                    phone: phone || '',
                    proof: null, 
                    status: 'pending' 
                }])
                .select();

            if (error) {
                console.error('Supabase INSERT Error:', error);
                return res.status(500).json({ error: error.message });
            }
            
            return res.status(201).json({ 
                order: data[0], 
                qris_string: qrisString, 
                totalAmount: totalAmount 
            });
        }

        if (req.method === 'PUT') {
            const { order_id, status, proof } = req.body;
            
            if (!order_id) {
                return res.status(400).json({ error: 'Order ID is required' });
            }

            let updateData = {};
            if (proof) updateData.proof = proof;
            if (status) updateData.status = status;

            const { data, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('order_id', order_id)
                .select();

            if (error) {
                console.error('Supabase UPDATE Error:', error);
                return res.status(500).json({ error: error.message });
            }

            const order = data[0];

            // Send email if approved (optional - won't fail if Gmail not configured)
            if (status === 'approved' && order.email) {
                try {
                    const mailUser = process.env.EMAIL_USER;
                    const mailPass = process.env.EMAIL_PASS;
                    
                    if (mailUser && mailPass) {
                        const { nodemailer } = await import('nodemailer');
                        
                        const { data: productData } = await supabase
                            .from('products')
                            .select('download_link, name')
                            .eq('name', order.product_name)
                            .single();
                        
                        const downloadUrl = productData?.download_link || '#';
                        const productName = productData?.name || order.product_name;

                        const transporter = nodemailer.createTransport({ 
                            service: 'gmail', 
                            auth: { user: mailUser, pass: mailPass } 
                        });
                        
                        await transporter.sendMail({
                            from: `"NEXUO Systems" <${mailUser}>`,
                            to: order.email,
                            subject: `Produk ${productName} Sudah Tersedia!`,
                            html: `
                                <div style="font-family:sans-serif;color:#333;padding:20px;max-width:500px;margin:auto;border:1px solid #ddd;border-radius:10px;">
                                    <h2 style="color:#05080A;">Halo! Pembayaran Dikonfirmasi</h2>
                                    <p>Terima kasih sudah membeli <strong>${productName}</strong>.</p>
                                    <p>Silakan download produk Anda melalui tombol di bawah ini:</p>
                                    <a href="${downloadUrl}" style="display:inline-block;background:#00dc82;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin:10px 0;">Download Sekarang</a>
                                    <p style="font-size:12px;color:#888;margin-top:20px;">Jika ada kendala, balas email ini.</p>
                                </div>
                            `
                        });
                    }
                } catch (err) { 
                    console.error('Nodemailer Error (non-blocking):', err); 
                }
            }

            return res.status(200).json(order);
        }

        return res.status(405).json({ message: 'Method Not Allowed' });
        
    } catch (err) {
        console.error('Function error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}