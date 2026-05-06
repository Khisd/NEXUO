'use client';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [modalData, setModalData] = useState({ show: false, id: '', name: '', price: '' });
  const [email, setEmail] = useState('');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Klik untuk upload screenshot');
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
    
    // Validasi null canvas
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
      const reader = new FileReader();
      reader.onload = (evt) => setProofFile(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) { showToast('Harap upload bukti transfer!', 'error'); return; }
    
    const payload = {
      orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
      productId: modalData.id,
      email: email,
      proof: proofFile
    };

    try {
      const res = await fetch('/api/orders?type=order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.message === 'success') {
        closeModal();
        showToast('Pesanan berhasil! Kami akan verifikasi segera.', 'success');
      } else {
        showToast('Gagal: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (err) { showToast('Koneksi Error', 'error'); }
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
            <div className="step-card"><div className="step-num">2</div><h4>Scan & Bayar</h4><p>Lakukan pembayaran via QRIS/Transfer sesuai harga.</p></div>
            <div className="step-card"><div className="step-num">3</div><h4>Upload Bukti</h4><p>Kirim screenshot bukti transfer di form pembelian.</p></div>
            <div className="step-card"><div className="step-num">4</div><h4>Terima Email</h4><p>Link download & Panduan dikirim ke email Anda.</p></div>
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
          <div className="qr-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NEXUO_PAYMENT_GATEWAY" alt="QR Payment" />
            <div style={{color:'#000', fontWeight:'600', fontSize:'13px'}}>Scan QR di Bawah</div>
            <div className="qr-note">BCA / QRIS / E-Wallet<br/>a.n NEXUO SYSTEMS LTD</div>
          </div>
          <form onSubmit={submitOrder}>
            <div className="input-group"><label>Email Anda</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" required /></div>
            <div className="input-group"><label>Upload Bukti Transfer</label>
              <div className="file-upload" onClick={() => fileInputRef.current?.click()}><span id="fileNameDisplay">{fileName}</span><input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={handleFileChange} /></div>
            </div>
            <button type="submit" className="btn btn-green" style={{width:'100%'}}>Konfirmasi Pembayaran</button>
          </form>
        </div>
      </div>

      <div className="toast" id="toast"><div className="toast-icon" id="toastIcon">✓</div><div id="toastMessage">Operation successful</div></div>
      
      <footer style={{borderTop:'1px solid var(--border-subtle)', padding:'40px 0', marginTop:'80px', textAlign:'center', color:'var(--text-muted)', fontSize:'12px'}}><div className="container"><p>&copy; 2026 NEXUO Systems. All rights reserved.</p></div></footer>
    </>
  );
}