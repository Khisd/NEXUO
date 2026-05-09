'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LayoutDashboard, Package, ShoppingCart, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'stats' | 'orders' | 'products'>('stats');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  
  // State untuk Tambah/Edit Produk (Fitur Lama + Update)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', download_link: '', category: '' });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    const pRes = await fetch('/api/orders?type=products');
    const pData = await pRes.json();
    setProducts(pData.data || []);

    const oRes = await fetch('/api/orders?type=orders');
    const oData = await oRes.json();
    setOrders(oData.data || []);

    // Format data untuk Chart
    if (oData.data) {
      const chartMap = oData.data.filter((o:any) => o.status === 'PAID').map((o:any) => ({
        date: new Date(o.created_at).toLocaleDateString(),
        amount: parseInt(o.amount) || 0
      }));
      setSalesData(chartMap);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Hapus produk ini?')) {
      await fetch(`/api/orders?type=delete_product&id=${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Sidebar - Akses Fitur Sebelumnya */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-2">
        <h1 className="text-emerald-500 font-bold text-xl mb-8">NEXUO ADMIN</h1>
        <button onClick={() => setTab('stats')} className={`flex items-center gap-3 p-3 rounded-lg ${tab === 'stats' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-900'}`}>
          <LayoutDashboard size={20} /> Statistik
        </button>
        <button onClick={() => setTab('products')} className={`flex items-center gap-3 p-3 rounded-lg ${tab === 'products' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-900'}`}>
          <Package size={20} /> Produk
        </button>
        <button onClick={() => setTab('orders')} className={`flex items-center gap-3 p-3 rounded-lg ${tab === 'orders' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-900'}`}>
          <ShoppingCart size={20} /> Pesanan
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* TAB 1: STATISTIK & CHART (FITUR BARU) */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Ringkasan Penjualan</h2>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUK (FITUR LAMA + EDIT) */}
        {tab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Kelola Produk</h2>
              <button className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <Plus size={18}/> Tambah Produk
              </button>
            </div>
            
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-800 text-zinc-400 text-sm">
                  <tr>
                    <th className="p-4">Nama Produk</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-zinc-800">
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4 text-emerald-500">Rp {p.price}</td>
                      <td className="p-4 flex gap-4">
                        <Edit3 className="text-zinc-400 hover:text-blue-400 cursor-pointer" size={18} />
                        <Trash2 onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-500 cursor-pointer" size={18} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PESANAN (FITUR LAMA) */}
        {tab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Daftar Transaksi</h2>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800 text-zinc-400">
                  <tr>
                    <th className="p-4">Email Pembeli</th>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-zinc-800">
                      <td className="p-4">{o.email}</td>
                      <td className="p-4">{o.product_id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${o.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
