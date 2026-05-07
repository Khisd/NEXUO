'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const [newProd, setNewProd] = useState({ name: '', price: '', category: 'Python AI', description: '', features: '', downloadLink: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, tab]);

  const fetchData = () => {
    if (tab === 'orders') fetchOrders();
    else fetchProducts();
  };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?type=orders');
    const json = await res.json();
    setOrders(json.data || []);
    setStats({
      total: json.data?.length || 0,
      pending: json.data?.filter((o: any) => o.status === 'pending').length || 0,
      approved: json.data?.filter((o: any) => o.status === 'approved').length || 0,
      rejected: json.data?.filter((o: any) => o.status === 'rejected').length || 0,
    });
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/orders?type=products');
    const json = await res.json();
    setProducts(json.data || []);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const u = (form.elements.namedItem('username') as HTMLInputElement).value;
    const p = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    if (u === 'admin' && p === 'nexuo') {
      setIsAuthenticated(true);
    } else {
      alert("Invalid Credentials");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) fetchOrders();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/orders?type=product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd)
    });
    setNewProd({ name: '', price: '', category: 'Python AI', description: '', features: '', downloadLink: '' });
    fetchProducts();
    alert("Produk Ditambahkan!");
  };

  const deleteProduct = async (id: number) => {
    if(!confirm("Hapus produk ini?")) return;
    await fetch(`/api/orders?type=product&id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #111 0%, #000 100%)' }}>
        <div style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <h2 style={{ marginBottom: '8px', color: '#fff' }}>NEXUO ADMIN</h2>
          <p style={{ color: '#52525b', fontSize: '13px', marginBottom: '24px' }}>Restricted Access</p>
          <form onSubmit={handleLogin}>
            <div className="input-group" style={{textAlign:'left'}}><label>Username</label><input name="username" type="text" required /></div>
            <div className="input-group" style={{textAlign:'left'}}><label>Password</label><input name="password" type="password" required /></div>
            <button type="submit" style={{width:'100%', background:'#00dc82', color:'#000', padding:'12px', border:'none', borderRadius:'6px', fontWeight:'700', cursor:'pointer'}}>LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1a1a1a', paddingBottom: '20px' }}>
        <div><div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-1px', color: '#00dc82' }}>NEXUO SYSTEMS</div><div style={{ fontSize: '12px', color: '#52525b' }}>Command Center</div></div>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#52525b', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }}>LOGOUT</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00dc82' }}><div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>{stats.approved}</div><div style={{ fontSize: '12px', color: '#52525b', textTransform: 'uppercase' }}>Approved</div></div>
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #333' }}><div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>{stats.pending}</div><div style={{ fontSize: '12px', color: '#52525b', textTransform: 'uppercase' }}>Pending</div></div>
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f43f5e' }}><div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>{stats.rejected}</div><div style={{ fontSize: '12px', color: '#52525b', textTransform: 'uppercase' }}>Rejected</div></div>
        <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #333' }}><div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>{stats.total}</div><div style={{ fontSize: '12px', color: '#52525b', textTransform: 'uppercase' }}>Total Orders</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
        <button style={{ background: 'none', border: 'none', color: tab === 'orders' ? '#00dc82' : '#52525b', fontWeight: '700', cursor: 'pointer', fontSize: '16px', paddingBottom: '5px', borderBottom: tab === 'orders' ? '2px solid #00dc82' : 'none' }} onClick={() => setTab('orders')}>Pesanan</button>
        <button style={{ background: 'none', border: 'none', color: tab === 'products' ? '#00dc82' : '#52525b', fontWeight: '700', cursor: 'pointer', fontSize: '16px', paddingBottom: '5px', borderBottom: tab === 'products' ? '2px solid #00dc82' : 'none' }} onClick={() => setTab('products')}>Kelola Produk</button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' ? (
        <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', background: '#0e0e0e', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#111' }}><tr><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Order ID</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Product</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Email</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Proof</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Status</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Action</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan={6} style={{padding:'40px', textAlign:'center', color:'#52525b'}}>No orders found.</td></tr> :
                orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>{o.order_id}</td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{o.product_name}</td>
                    <td style={{ padding: '16px', color: '#a1a1aa' }}>{o.email}</td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => {
                          const w = window.open("", "_blank", "width=600,height=600");
                          if(w) {
                            w.document.write(`
                              <html>
                                <body style="background:#000; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
                                  <img src="${o.proof}" style="max-width:100%; max-height:100%; border-radius:8px; box-shadow:0 0 20px rgba(0,220,130,0.3);" />
                                </body>
                              </html>
                            `);
                          }
                        }}
                        style={{ background: '#111', color: '#00dc82', border: '1px solid #333', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        👁 Lihat Bukti
                      </button>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: o.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : o.status === 'approved' ? 'rgba(0, 220, 130, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: o.status === 'pending' ? '#fbbf24' : o.status === 'approved' ? '#00dc82' : '#f43f5e' }}>{o.status}</span></td>
                    <td style={{ padding: '16px' }}>
                      {o.status === 'pending' ? (
                        <>
                          <button onClick={() => updateStatus(o.id, 'approved')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: '#00dc82', color: '#000', marginRight:'5px' }}>✔</button>
                          <button onClick={() => updateStatus(o.id, 'rejected')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: '#f43f5e', color: '#fff' }}>✖</button>
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {/* Add Product Form */}
          <div style={{ background: '#0e0e0e', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #1a1a1a' }}>
            <h3 style={{ marginBottom: '16px' }}>Tambah Produk Baru</h3>
            <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>Nama Produk</label><input value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} required /></div>
              <div className="input-group"><label>Harga</label><input value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} required /></div>
              <div className="input-group"><label>Kategori</label><select value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} style={{width:'100%', background:'#111', border:'1px solid #2a2a2a', color:'white', padding:'12px', borderRadius:'6px'}}><option value="Python AI">Python AI</option><option value="MQL5 Native">MQL5 Native</option><option value="Pine Script">Pine Script</option></select></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>Deskripsi</label><input value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} required /></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>Fitur (Pisahkan dengan koma)</label><input value={newProd.features} onChange={e => setNewProd({...newProd, features: e.target.value})} placeholder="Anti Martingale, Auto SL, PDF Guide" required /></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>Link Download (Google Drive)</label><input value={newProd.downloadLink} onChange={e => setNewProd({...newProd, downloadLink: e.target.value})} required /></div>
              <button type="submit" style={{ gridColumn: 'span 2', width:'auto', padding: '10px 30px', background:'#00dc82', color:'#000', border:'none', borderRadius:'6px', fontWeight:'700', cursor:'pointer' }}>Simpan Produk</button>
            </form>
          </div>
          
          {/* Product Table */}
          <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', background: '#0e0e0e', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#111' }}><tr><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Produk</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Kategori</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Harga</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Link</th><th style={{ padding: '16px', fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>Aksi</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{p.name}</td>
                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>{p.category}</span></td>
                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>{p.price}</td>
                    <td style={{ padding: '16px' }}><a href={p.download_link} target="_blank" style={{ color: '#3b82f6', fontSize: '12px' }}>Cek Link</a></td>
                    <td style={{ padding: '16px' }}><button onClick={() => deleteProduct(p.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer', background: '#f43f5e', color: '#fff' }}>🗑 Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}