'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Globe } from 'lucide-react';

export default function LandingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?type=products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.data || []);
        setLoading(false);
      });
  }, []);

  const handlePurchase = async (productId: string, productName: string) => {
    const email = prompt(`Beli ${productName}\nMasukkan Email Anda untuk pengiriman produk:`);
    if (!email || !email.includes('@')) return alert("Email valid diperlukan!");

    try {
      const res = await fetch('/api/orders?type=create_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email })
      });
      const data = await res.json();
      if (data.qr_url) {
        window.location.href = data.qr_url;
      } else {
        alert("Gagal memproses pembayaran. Pastikan API Key Cashify sudah benar.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <nav className="max-w-7xl mx-auto p-6 flex justify-between items-center border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="text-black fill-current" size={18} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase">Nexuo Protocol</span>
        </div>
        <div className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          SYSTEM_ONLINE
        </div>
      </nav>

      <header className="max-w-5xl mx-auto pt-24 pb-16 px-6 text-center">
        <h1 className="text-6xl md:text-7xl font-black text-white leading-tight mb-6">
          Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Edge.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Infrastruktur trading dan Expert Advisor kelas institusi untuk membantu trader memfilter noise pasar.
        </p>
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center py-20 text-slate-500 animate-pulse">Connecting to Nexus...</div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="group bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col">
                <div className="mb-6 flex justify-between items-start text-emerald-500">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl"><ShieldCheck size={24} /></div>
                  <span className="text-[10px] font-bold bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest text-slate-400">{p.category || 'Trading Tool'}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{p.name}</h3>
                <p className="text-slate-400 text-sm mb-8 flex-grow">{p.description}</p>
                <div className="mt-auto">
                  <div className="mb-6">
                    <span className="text-3xl font-black text-white">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                  </div>
                  <button onClick={() => handlePurchase(p.id, p.name)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
                    DEPLOY NOW <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
