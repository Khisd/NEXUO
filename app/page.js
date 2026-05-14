'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingCart, X, Menu, TrendingUp, Shield, Zap, Check, ChevronDown, ChevronUp } from 'lucide-react'

// Initialize Supabase client
const supabase = createClient()

const ADMIN_PASSWORD = 'nexuo2026'

// CSS Styles
const styles = {
  page: `min-h-screen bg-[#050505] text-white font-sans`,
  container: `max-w-6xl mx-auto px-6`,
  navbar: `fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5`,
  navContent: `flex items-center justify-between h-16`,
  logo: `flex items-center gap-3 font-bold text-xl tracking-tight`,
  logoBox: `w-8 h-8 bg-white rounded-md`,
  navLinks: `hidden md:flex items-center gap-8 text-sm text-zinc-400`,
  navLink: `hover:text-white transition-colors`,
  btn: `px-6 py-2.5 rounded-lg font-medium text-sm transition-all`,
  btnPrimary: `bg-white text-black hover:bg-zinc-200`,
  hero: `pt-32 pb-20 text-center`,
  badge: `inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-zinc-400 mb-6`,
  h1: `text-4xl md:text-6xl font-bold tracking-tight mb-6`,
  p: `text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed`,
  grid: `grid md:grid-cols-3 gap-6 py-20`,
  card: `bg-[#0e0e0e] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all hover:-translate-y-1`,
  cardHeader: `flex justify-between items-center mb-4`,
  tag: `text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/5 rounded`,
  price: `text-2xl font-bold font-mono`,
  cardTitle: `text-lg font-semibold mb-2`,
  cardDesc: `text-sm text-zinc-400 mb-4 leading-relaxed`,
  features: `flex flex-wrap gap-2 mb-6`,
  feature: `text-[10px] px-2 py-1 bg-white/5 rounded border border-white/5`,
  section: `py-20 border-t border-white/5`,
  sectionTitle: `text-center mb-12`,
  sectionTitleH2: `text-3xl font-bold mb-2`,
  sectionTitleP: `text-zinc-500`,
  stepsGrid: `grid md:grid-cols-4 gap-6`,
  stepCard: `text-center p-6 bg-white/[0.02] rounded-xl border border-white/5`,
  stepNum: `w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold font-mono`,
  modal: `fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4`,
  modalContent: `bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full relative`,
  input: `w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-white focus:outline-none`,
  label: `block text-xs text-zinc-500 mb-2 font-medium`,
  fileUpload: `border border-dashed border-white/10 rounded-lg p-6 text-center text-zinc-500 text-sm cursor-pointer hover:border-white/20`,
  adminCard: `bg-[#0e0e0e] border border-white/5 rounded-lg p-5`,
  statLabel: `text-xs text-zinc-500 uppercase tracking-wider mb-2`,
  statValue: `text-2xl font-bold font-mono`,
  table: `w-full text-left`,
  th: `px-4 py-3 text-xs uppercase text-zinc-500 border-b border-white/5 bg-[#121212]`,
  td: `px-4 py-3 border-b border-white/5`,
  status: `text-[10px] px-2 py-1 rounded-full font-medium uppercase`,
  statusPending: `bg-yellow-500/10 text-yellow-500`,
  statusApproved: `bg-green-500/10 text-green-500`,
  statusRejected: `bg-red-500/10 text-red-500`,
  toast: `fixed bottom-6 right-6 bg-[#121212] border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl z-50 translate-y-20 opacity-0 transition-all`,
  toastShow: `translate-y-0 opacity-100`,
  footer: `py-12 border-t border-white/5 text-center text-zinc-500 text-sm`,
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('storefront')
  const [purchaseModal, setPurchaseModal] = useState(null)
  const [loginModal, setLoginModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [faqOpen, setFaqOpen] = useState({})
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      showToast('Gagal memuat produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders() {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  function showToast(message, type = 'success') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  async function handleLogin(e) {
    e.preventDefault()
    const password = e.target.password.value
    if (password === ADMIN_PASSWORD) {
      setLoginModal(false)
      setView('admin')
      loadOrders()
    } else {
      showToast('Password salah', 'error')
    }
  }

  async function handlePurchase(e) {
    e.preventDefault()
    if (!file) {
      showToast('Upload bukti transfer wajib!', 'error')
      return
    }
    if (!form.email || !form.phone) {
      showToast('Email dan WhatsApp wajib!', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      const proofBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })

      const orderId = 'ORD-' + Date.now()
      const { error } = await supabase.from('orders').insert([{
        order_id: orderId,
        product_name: purchaseModal.name,
        price: purchaseModal.price,
        email: form.email,
        phone: form.phone,
        proof: proofBase64,
        status: 'pending'
      }])

      if (error) throw error

      setPurchaseModal(null)
      setFile(null)
      setForm({ email: '', phone: '' })
      showToast('Pesanan terkirim! Tunggu verifikasi.', 'success')
    } catch (err) {
      console.error('Error:', err)
      showToast('Gagal: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateOrderStatus(orderId, status) {
    if (!confirm(`Yakin ${status === 'approved' ? 'terima' : 'tolak'} pesanan ini?`)) return
    
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId)
      if (error) throw error
      showToast(status === 'approved' ? 'Pesanan disetujui!' : 'Pesanan ditolak', 'success')
      loadOrders()
    } catch (err) {
      showToast('Gagal update status', 'error')
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    rejected: orders.filter(o => o.status === 'rejected').length
  }

  const faqs = [
    { q: 'Apakah ini aman?', a: 'Ya. NEXUO menggunakan parameter manajemen risiko ketat (Stop Loss wajib).' },
    { q: 'Berapa modal minimal?', a: 'Minimal $100 sudah cukup untuk memulai.' },
    { q: 'Saya gaptek, bisa install sendiri?', a: 'Tentu bisa. Setelah pembelian dapat PDF & Video tutorial.' },
    { q: 'Broker apa yang support?', a: 'Kompatibel dengan broker MT5 dan TradingView.' },
  ]

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={`${styles.container} ${styles.navContent}`}>
          <div className={styles.logo} onClick={() => setView('storefront')}>
            <div className={styles.logoBox}></div>
            NEXUO
          </div>
          <div className={styles.navLinks}>
            <a href="#how" className={styles.navLink}>Cara Kerja</a>
            <a href="#products" className={styles.navLink}>Produk</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
          </div>
          <button className={styles.btn} onClick={() => window.document.getElementById('products').scrollIntoView()}>
            Mulai Sekarang
          </button>
        </div>
      </nav>

      {/* Storefront View */}
      {view === 'storefront' && (
        <>
          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.container}>
              <div className={styles.badge}>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                SYSTEM STATUS: OPERATIONAL
              </div>
              <h1 className={styles.h1}>Trading Tanpa Emosi,<br/>Analisa 24/7.</h1>
              <p className={styles.p}>
                NEXUO menyediakan Algoritma Trading Otomatis yang dapat Anda install di HP atau Laptop.
              </p>
              <div className="flex justify-center gap-4 mb-10 flex-wrap">
                {['Analisa Otomatis', 'Tanpa Coding', 'Install Mudah', 'Support PDF'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-500 text-sm bg-white/5 px-4 py-2 rounded-lg">
                    <Check className="w-4 h-4 text-green-500" /> {item}
                  </div>
                ))}
              </div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.document.getElementById('products').scrollIntoView()}>
                Lihat Produk
              </button>
            </div>
          </section>

          {/* How It Works */}
          <section id="how" className={styles.section}>
            <div className={styles.container}>
              <div className={styles.sectionTitle}>
                <h2 className={styles.sectionTitleH2}>Cara Mendapatkan Produk</h2>
                <p className={styles.sectionTitleP}>Proses pembelian sederhana, aman, dan cepat.</p>
              </div>
              <div className={styles.stepsGrid}>
                {[
                  { num: '1', title: 'Pilih Algoritma', desc: 'Pilih robot sesuai gaya trading Anda' },
                  { num: '2', title: 'Bayar', desc: 'Transfer via bank atau QRIS' },
                  { num: '3', title: 'Upload Bukti', desc: 'Kirim screenshot bukti transfer' },
                  { num: '4', title: 'Terima Email', desc: 'Link download dikirim ke email' },
                ].map((step, i) => (
                  <div key={i} className={styles.stepCard}>
                    <div className={styles.stepNum}>{step.num}</div>
                    <h4 className="font-semibold mb-2">{step.title}</h4>
                    <p className="text-zinc-500 text-sm">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Products */}
          <section id="products" className={styles.section}>
            <div className={styles.container}>
              <div className={styles.sectionTitle}>
                <h2 className={styles.sectionTitleH2}>Katalog Algoritma</h2>
                <p className={styles.sectionTitleP}>Siap pakai untuk MT5 & TradingView.</p>
              </div>
              {loading ? (
                <p className="text-center text-zinc-500">Memuat produk...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-zinc-500">Belum ada produk.</p>
              ) : (
                <div className={styles.grid}>
                  {products.map((product) => (
                    <div key={product.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span className={styles.tag}>{product.category || 'Indicator'}</span>
                        <span className={styles.price}>Rp {parseInt(product.price || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{product.name}</h3>
                      <p className={styles.cardDesc}>{product.description}</p>
                      <div className={styles.features}>
                        {(product.features || '').split(',').slice(0, 3).map((f, i) => (
                          <span key={i} className={styles.feature}>{f.trim()}</span>
                        ))}
                      </div>
                      <button
                        className={`${styles.btn} w-full border border-white/10 hover:border-white/20`}
                        onClick={() => setPurchaseModal(product)}
                      >
                        Beli Sekarang
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className={styles.section}>
            <div className={styles.container} style={{ maxWidth: '800px' }}>
              <div className={styles.sectionTitle}>
                <h2 className={styles.sectionTitleH2}>Pertanyaan Umum</h2>
              </div>
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-white/5 py-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setFaqOpen({ ...faqOpen, [i]: !faqOpen[i] })}
                  >
                    <span className="font-medium">{faq.q}</span>
                    {faqOpen[i] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  {faqOpen[i] && <p className="text-zinc-500 mt-3 text-sm">{faq.a}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className={styles.footer}>
            <p>© 2026 NEXUO Systems. All rights reserved.</p>
            <button onClick={() => setLoginModal(true)} className="mt-2 text-zinc-600 hover:text-zinc-400">
              Staff Login
            </button>
          </footer>
        </>
      )}

      {/* Admin View */}
      {view === 'admin' && (
        <div className="pt-24 pb-12">
          <div className={styles.container}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">Manajemen Pesanan</h1>
                <p className="text-zinc-500 text-sm">Verifikasi bukti pembayaran.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:border-white/20" onClick={loadOrders}>
                  Refresh
                </button>
                <button className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:border-white/20" onClick={() => setView('storefront')}>
                  ← Kembali
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className={styles.adminCard}>
                <div className={styles.statLabel}>Total</div>
                <div className={styles.statValue}>{stats.total}</div>
              </div>
              <div className={styles.adminCard}>
                <div className={styles.statLabel}>Pending</div>
                <div className={styles.statValue} style={{ color: '#fbbf24' }}>{stats.pending}</div>
              </div>
              <div className={styles.adminCard}>
                <div className={styles.statLabel}>Approved</div>
                <div className={styles.statValue} style={{ color: '#00dc82' }}>{stats.approved}</div>
              </div>
              <div className={styles.adminCard}>
                <div className={styles.statLabel}>Rejected</div>
                <div className={styles.statValue} style={{ color: '#f43f5e' }}>{stats.rejected}</div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#0e0e0e] border border-white/5 rounded-lg overflow-hidden">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Order ID</th>
                    <th className={styles.th}>Product</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Bukti</th>
                    <th className={styles.th}>Status</th>
                    <th className={`${styles.th} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Belum ada pesanan</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order.id}>
                      <td className={`${styles.td} font-mono text-xs text-zinc-500`}>{order.order_id}</td>
                      <td className={styles.td}>{order.product_name}</td>
                      <td className={styles.td}>{order.email}</td>
                      <td className={styles.td}>
                        {order.proof ? (
                          <a href={order.proof} target="_blank" className="text-blue-400 text-xs underline">Lihat</a>
                        ) : '-'}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.status} ${order.status === 'pending' ? styles.statusPending : order.status === 'approved' ? styles.statusApproved : styles.statusRejected}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={`${styles.td} text-right`}>
                        {order.status === 'pending' && (
                          <>
                            <button
                              className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded mr-2 hover:bg-green-500/20"
                              onClick={() => updateOrderStatus(order.order_id, 'approved')}
                            >
                              ✓
                            </button>
                            <button
                              className="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"
                              onClick={() => updateOrderStatus(order.order_id, 'rejected')}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {loginModal && (
        <div className={styles.modal} onClick={() => setLoginModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-zinc-500" onClick={() => setLoginModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-2">Staff Access</h2>
            <p className="text-zinc-500 text-sm mb-6">Area Terbatas</p>
            <form onSubmit={handleLogin}>
              <input type="password" name="password" placeholder="Password" className={styles.input} required />
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary} w-full mt-4`}>
                Masuk Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseModal && (
        <div className={styles.modal} onClick={() => setPurchaseModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-zinc-500" onClick={() => setPurchaseModal(null)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-1">{purchaseModal.name}</h2>
            <p className="text-zinc-500 mb-6">Total: <span className="text-white font-bold">Rp {parseInt(purchaseModal.price).toLocaleString('id-ID')}</span></p>

            <form onSubmit={handlePurchase}>
              <div className="mb-4">
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className={styles.label}>WhatsApp</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="08123456789"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className={styles.label}>Bukti Transfer</label>
                <label className={styles.fileUpload}>
                  {file ? file.name : 'Klik upload screenshot'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setFile(e.target.files[0])}
                  />
                </label>
              </div>
              <button type="submit" disabled={submitting} className={`${styles.btn} w-full ${styles.btnPrimary}`}>
                {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`${styles.toast} ${toast.show ? styles.toastShow : ''}`}>
        <span className={toast.type === 'success' ? 'text-green-500' : 'text-red-500'}>
          {toast.type === 'success' ? '✓' : '✕'}
        </span>
        {toast.message}
      </div>
    </div>
  )
}