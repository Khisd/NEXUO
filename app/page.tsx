'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, ShieldCheck, Zap, Globe, ArrowRight } from 'lucide-react';

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
    const email = prompt(`Konfirmasi Pembelian: ${productName}\n\nMasukkan email Anda untuk pengiriman produk:`);
    if (!email || !email.includes('@')) return alert('Email valid diperlukan!');

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
        alert('Gagal membuat pembayaran. Cek koneksi API.');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30">
      {/* Header / Nav */}
      <nav className="max-w-7xl mx-auto p-6 flex justify-between items-center border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="text-black fill-current" size={18} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">NEXUO</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-emerald-400 transition">Infrastructure</a>
          <a href="#" className="hover:text-emerald-400 transition">Signals</a>
          <a href="#" className="hover:text-emerald-400 transition">Ecosystem</a>
        </div>
        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-400 transition">
          Client Portal
        </button>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto pt-24 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Marketplace Trading Mekanis</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-white leading-tight mb-6">
          Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Edge.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          NEXUO Protocol menyediakan infrastruktur trading, indikator Pine Script, dan Expert Advisor kelas institusi untuk membantu trader memfilter noise pasar.
        </p>
      </header>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center py-20 text-slate-500">Memuat infrastruktur...</div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="group bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col">
                <div className="mb-6 flex justify-between items-start">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <ShieldCheck size={24} />
                  </div>
                  <span className="text-[10px] font-bold bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest text-slate-400">
                    {p.category || 'Trading Tools'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{p.name}</h3>
                <p className="text-slate-400 text-sm mb-8 flex-grow">{p.description}</p>
                
                <div className="mt-auto">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-white">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                    <span className="text-slate-500 text-xs font-medium">/One-time</span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(p.id, p.name)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                  >
                    DEPLOY NOW <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="border-t border-slate-800/50 py-12 text-center text-slate-600 text-sm">
        <p>&copy; 2026 NEXUO BRAND. Powered by Mechanical Discipline.</p>
      </footer>
    </div>
  );
}
