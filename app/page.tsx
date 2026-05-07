'use client';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [modalData, setModalData] = useState({ show: false, id: '', name: '', price: '' });
  const [email, setEmail] = useState('');
  // Kita tetap butuh state proof untuk fallback, tapi untuk Cashify utama pakai create_payment
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Klik untuk upload screenshot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Products (VERSI DEBUG)
  useEffect(() => {
    const loadData = async () => {
      try {
          console.log("🔍 Memulai fetch produk...");
          const res = await fetch('/api/orders?type=products');
          console.log("📡 Status Fetch:", res.status, res.statusText);
          
          const json = await res.json();
          console.log("📦 Data Mentah dari API:", json);

          if (json.data) {
            console.log("✅ Jumlah Produk:", json.data.length);
            setProducts(json.data);
          } else {
            console.error("❌ Data null tapi tidak error:", json.error);
          }
        } catch (err) {
          console.error("💥 Gagal Fetch Total:", err);
        }
    };

    loadData();
  }, []);

  // Scroll Effect Navbar
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Particle Effect Background
  useEffect(() => {
    const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return; 

    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    
    let particles = [] as { x: number; y: number; r: number; d: number }[];
    for(let i=0; i<40; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2, d: Math.random()*0.5 });
    
    function draw() {
      if (!ctx) return; 
      
      ctx.clearRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      particles.forEach(p => { ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true); });
      ctx.fill();
      particles.forEach(p => { p.y -= p.d; if(p.y < 0) p.y = canvas.height; });
      requestAnimationFrame(draw);
    }
    draw();
  }, []);

  const openModal = (id: string, name: string, price: string) => {
    setModalData({ show: true, id, name, price });
    setEmail('');
    setProofFile(null);
    setFileName('Klik untuk upload screenshot');
  };

  const closeModal = () => setModalData({ ...modalData, show: false });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      
      // --- LOGIKA COMPRESS GAMBAR (Untuk Backup Manual) ---
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if(!ctx) return;
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); 
          setProofFile(compressedDataUrl); 
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // --- UPDATED: SUBMIT ORDER UNTUK CASHIFY ---
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { showToast('Harap isi email!', 'error'); return; }
    
    setIsSubmitting(true);

    const payload = {
      orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
      productId: modalData.id,
      email: email
      // Untuk Cashify, kita tidak kirim 'proof', tapi minta 'qr_code' dari backend
    };

    try {
      // Request QR Code ke Backend (yang konek ke Cashify)
      const res = await fetch('/api/orders?type=create_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if(data.qr_code) {
        closeModal(); // Tutup modal input
        
        // Tampilkan alert user dan buka link Cashify di tab baru
        alert(`Scan QR Code di jendela baru untuk pembayaran.\n\nID Order: ${data.orderId}\nSetelah pembayaran sukses, link download otomatis dikirim ke email.`);
        
        window.open(data.qr_code, '_blank');
        
        showToast('Membuka Pembayaran...', 'success');
      } else {
        showToast('Gagal inisiasi pembayaran: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) { showToast('Koneksi Error', 'error'); } 
    finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    const t = document.getElementById('toast'); 
    if(!t) return; 
    const msgEl = document.getElementById('toastMessage');
    if(msgEl) msgEl.textContent = msg;
    t.className = `toast show ${type}`;
    const icon = document.getElementById('toastIcon');
    if(icon) icon.textContent = type === 'success' ? '✓' : '✕';
    setTimeout(() => t.classList.remove('show'), 3000);
  };

  const toggleFaq = (el: HTMLElement) => el.parentElement?.classList.toggle('active');

  return (
    <>
      <canvas id="bg-canvas"></canvas>
      <div className="bg-grid"></div>

      <header id="navbar">
        <div className="logo" onClick={() => window.scrollTo(0,0)}><div className="logo-box"></div> NEXUO</div>
        <nav className="nav-links"><a href="#how-it-works">Cara Kerja</a><a href="#products">Produk</a><a href="#faq">FAQ</a></nav>
        <button className="btn btn-white btn-sm" onClick={() => document.getElementById('products')?.scrollIntoView()}>Mulai Sekarang</button>
      </header>

      <section className="hero">
        <div className="badge">SYSTEM STATUS: OPERATIONAL</div>
        <h1>Trading Tanpa Emosi,<br/>Analisa 24/7.</h1>
        <p>NEXUO menyediakan <strong>Algoritma Trading Otomatis</strong> yang dapat Anda install di HP atau Laptop. Biarkan sistem bekerja memantau pasar XAUUSD, BTC, dan Forex untuk Anda.</p>
        <div style={{display:'flex', gap:'16px', justifyContent:'center'}}>
          <button className="btn btn-white" onClick={() => document.getElementById('products')?.scrollIntoView()}>Lihat Produk</button>
          <button className="btn btn-ghost" onClick={() => document.getElementById('how-it-works')?.scrollIntoView()}>Pelajari Dulu</button>
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <div className="container">
          <div style={{textAlign:'center', marginBottom:'40px'}}>
            <h2 style={{fontSize:'24px', fontWeight:'700'}}>Cara Mendapatkan Produk</h2>
            <p style={{color:'var(--text-muted)', fontSize:'14px'}}>Proses pembelian sederhana, aman, dan cepat.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card"><div className="step-num">1</div><h4>Pilih Algoritma</h4><p>Pilih robot yang sesuai dengan gaya trading Anda.</p></div>
            <div className="step-card"><div className="step-num">2</div><h4>Scan QR Code</h4><p>Scan QR Code Cashify untuk pembayaran otomatis via QRIS.</p></div>
            <div className="step-card"><div className="step-num">3</div><h4>Terima Email Otomatis</h4><p>Link download & Panduan langsung dikirim ke email setelah lunas.</p></div>
            <div className="step-card"><div className="step-num">4</div><h4>Download Produk</h4><p>Install di MetaTrader 5 atau TradingView dan mulai trading.</p></div>
          </div>
        </div>
      </section>

      <div className="container" id="products">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:'24px', borderBottom:'1px solid var(--border-subtle)', paddingBottom:'16px'}}>
          <div><h2 style={{fontSize:'24px', fontWeight:'700'}}>Katalog Algoritma</h2><p style={{color:'var(--text-muted)', fontSize:'14px'}}>Siap pakai untuk MT5 & TradingView.</p></div>
        </div>
        <div className="grid">
          {products.length === 0 ? <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px'}}>Memuat produk...</div> : 
            products.map((p) => {
              let featuresHtml = p.features ? JSON.parse(p.features).map((f: string) => `<span class="feature">${f}</span>`).join('') : '';
              return (
                <div className="card" key={p.id}>
                  <div className="card-header"><span className="tag">{p.category}</span><span className="price">{p.price}</span></div>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="feature-list" dangerouslySetInnerHTML={{__html: featuresHtml}}></div>
                  <button className="btn btn-ghost" style={{width:'100%'}} onClick={() => openModal(p.id, p.name, p.price)}>Beli Sekarang</button>
                </div>
              );
            })
          }
        </div>
      </div>

      <section className="faq-section" id="faq">
        <div className="container" style={{maxWidth:'800px'}}>
          <h2 style={{fontSize:'24px', fontWeight:'700', textAlign:'center', marginBottom:'40px'}}>Pertanyaan Umum</h2>
          <div className="faq-item"><div className="faq-question" onClick={(e) => toggleFaq(e.currentTarget)}>Apakah ini aman? <span>+</span></div><div className="faq-answer">Ya. NEXUO menggunakan parameter manajemen risiko ketat (Stop Loss wajib).</div></div>
          <div className="faq-item"><div className="faq-question" onClick={(e) => toggleFaq(e.currentTarget)}>Berapa modal minimal? <span>+</span></div><div className="faq-answer">Secara umum, minimal $100 sudah cukup agar manajemen risiko berjalan efektif.</div></div>
          <div className="faq-item"><div className="faq-question" onClick={(e) => toggleFaq(e.currentTarget)}>Saya gaptek, bisa install sendiri? <span>+</span></div><div className="faq-answer">Tentu bisa. Setelah pembelian, Anda akan mendapatkan file PDF untuk tutorial.</div></div>
        </div>
      </section>

      <div className={`modal-overlay ${modalData.show ? 'active' : ''}`} id="purchaseModal">
        <div className="modal">
          <button className="close-modal" onClick={closeModal}>&times;</button>
          <h2 style={{fontSize:'20px', marginBottom:'8px'}}>{modalData.name}</h2>
          <div className="mono" style={{color:'var(--text-secondary)', fontSize:'14px', marginBottom:'24px'}}>Total: <span style={{color:'var(--text-primary)', fontWeight:'700'}}>{modalData.price}</span></div>
          
          {/* Removed Static QR, changed to instruction */}
          <div style={{textAlign:'center', marginBottom:'20px', padding:'20px', background:'#111', borderRadius:'8px'}}>
             <p style={{color:'#fff'}}>Pembayaran akan dilakukan via <strong>Cashify</strong> (QRIS).</p>
             <p style={{fontSize:'12px', color:'#888'}}>Pastikan email yang Anda masukkan benar untuk menerima link download otomatis.</p>
          </div>

          <form onSubmit={submitOrder}>
            <div className="input-group"><label>Email Anda</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" required /></div>
            <button type="submit" className="btn btn-green" style={{width:'100%', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer'}} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Memproses Pembayaran...' : 'Lanjut ke Pembayaran QRIS'}
            </button>
          </form>
        </div>
      </div>

      <div className="toast" id="toast"><div className="toast-icon" id="toastIcon">✓</div><div id="toastMessage">Operation successful</div></div>
      
      <footer style={{borderTop:'1px solid var(--border-subtle)', padding:'40px 0', marginTop:'80px', textAlign:'center', color:'var(--text-muted)', fontSize:'12px'}}><div className="container"><p>&copy; 2026 NEXUO Systems. All rights reserved.</p></div></footer>
    </>
  );
}