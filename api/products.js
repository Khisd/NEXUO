export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
                .from('products')
                .select('*')
                .order('id', { ascending: true });
            
            if (error) {
                console.error('Supabase GET Error:', error);
                return res.status(500).json({ error: error.message });
            }
            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const { name, price, category, description, features, download_link } = req.body;
            
            if (!name || !price) {
                return res.status(400).json({ error: 'Name and price are required' });
            }

            const insertData = {
                name: String(name),
                price: String(price),
                category: String(category || 'Indicator'),
                description: String(description || ''),
                features: String(features || ''),
                download_link: String(download_link || '#')
            };

            const { data, error } = await supabase
                .from('products')
                .insert([insertData])
                .select();

            if (error) {
                console.error('Supabase INSERT Error:', error);
                return res.status(500).json({ error: error.message });
            }
            
            return res.status(201).json(data[0]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase DELETE Error:', error);
                return res.status(500).json({ error: error.message });
            }
            
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });
        
    } catch (err) {
        console.error('Function error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}