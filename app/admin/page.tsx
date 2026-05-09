'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LayoutDashboard, Package, ShoppingCart, Edit3, Trash2, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const [tab, setTab] = useState<'stats' | 'orders' | 'products'>('stats');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

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

    if (oData.data) {
      const stats = oData.data.filter((o:any) => o.status === 'PAID').map((o:any) => ({
        name: new Date(o.created_at).toLocaleDateString(),
        amount: parseInt(o.amount) || 0
      }));
      setSalesData(stats);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 bg-emerald-500 rounded"></div>
          <span className="font-bold text-xl tracking-tighter">NEXUO ADMIN</span>
        </div>
        <button onClick={() => setTab('stats')} className={`flex items-center gap-3 p-3 rounded-lg transition ${tab === 'stats' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          <TrendingUp size={20} /> Statistik
        </button>
        <button onClick={() => setTab('products')} className={`flex items-center gap-3 p-3 rounded-lg transition ${tab === 'products' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          <Package size={20} /> Kelola Produk
        </button>
        <button onClick={() => setTab('orders')} className={`flex items-center gap-3 p-3 rounded-lg transition ${tab === 'orders' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'text-zinc-500 hover:bg-zinc-900'}`}>
          <ShoppingCart size={20} /> Pesanan (Paid)
        </button>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {tab === 'stats' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold mb-8">Ringkasan Pendapatan</h2>
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} />
                  <YAxis stroke="#52525b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold mb-8">Inventaris Produk</h2>
            <div className="grid gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">{p.name}</h4>
                    <p className="text-zinc-500 text-sm italic">Rp {p.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 text-blue-400"><Edit3 size={18}/></button>
                    <button className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
