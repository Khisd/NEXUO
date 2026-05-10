import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'DB not configured' });
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
        if (error) {
            console.error('Supabase GET Error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { name, price, category, description, features, download_link } = req.body;
        const insertData = {
            name: String(name || 'Untitled Product'),
            price: String(price || '0'), 
            category: String(category || 'Indicator'),
            description: String(description || 'No description'),
            features: String(features || ''),
            download_link: String(download_link || '#')
        };
        const { data, error } = await supabase.from('products').insert([insertData]).select();
        if (error) {
            console.error('Supabase INSERT Error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(201).json(data[0]);
    }

    if (req.method === 'DELETE') {
        const { id } = req.body;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
}