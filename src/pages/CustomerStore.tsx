import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft,
  Search, Plus, Minus,
  Zap, Star,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   V3 TOKENS (Match Suite)
───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  radius:    '28px',
  shadow:    '0 15px 40px rgba(0,0,0,0.04)'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const CustomerStore: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('active', true);
    if (data) setProducts(data);
    setLoading(false);
  };

  const updateCart = (pid: string, delta: number) => {
    setCart(prev => {
      const current = prev[pid] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [pid]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [pid]: next };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
     const p = products.find(x => x.id === id);
     return sum + (p?.price || 0) * qty;
  }, 0);

  const handlePlaceOrder = async () => {
    if (totalItems === 0) return;
    setIsOrdering(true);
    const auth = localStorage.getItem('customer_auth');
    const customer = auth ? JSON.parse(auth) : null;

    try {
       // Logic: Create a PENDING order in 'orders' table
       const { error } = await supabase.from('orders').insert({
          customer_id: customer?.id,
          total_price: totalPrice,
          items: cart,
          status: 'PENDING'
       });

       if (!error) {
          setShowSuccess(true);
          setCart({});
          setTimeout(() => {
             setShowSuccess(false);
             navigate('/customer/dashboard');
          }, 2500);
       }
    } catch (e) {
       alert("Order failed. Please try again.");
    }
    setIsOrdering(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>FETCHING FRESH BREAD...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '140px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(253, 253, 253, 0.8)', backdropFilter: 'blur(16px)', padding: '20px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '10px', borderRadius: '14px' }}><ArrowLeft size={18} /></motion.button>
           <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: T.ink }}>Bakery Store</h1>
              <p style={{ margin: 0, fontSize: '11px', color: T.txt3, fontWeight: 700 }}>Fresh items available today</p>
           </div>
           <div style={{ background: T.primaryGlow, color: T.primary, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> LIVE
           </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ padding: '20px 16px' }}>
           <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.txt3 }} size={18} />
              <input type="text" placeholder="Search for bread..." 
                style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '18px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
           </div>
        </div>

        {/* PRODUCT BENTO TILES */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
           {products.map((p) => (
             <motion.div layout key={p.id} style={{ background: '#fff', borderRadius: T.radius, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '140px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                   {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={40} color={T.txt3} />}
                   <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, color: T.ink }}>{p.category}</div>
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                   <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: T.ink }}>{p.name}</h3>
                   <div style={{ fontSize: '15px', fontWeight: 900, color: T.primary, marginBottom: '12px' }}>{fmtRaw(p.price)}</div>
                   
                   <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {cart[p.id] ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '4px', borderRadius: '12px' }}>
                           <button onClick={() => updateCart(p.id, -1)} style={{ border: 'none', background: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Minus size={14} /></button>
                           <span style={{ fontSize: '14px', fontWeight: 900 }}>{cart[p.id]}</span>
                           <button onClick={() => updateCart(p.id, 1)} style={{ border: 'none', background: T.primary, width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}><Plus size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => updateCart(p.id, 1)}
                           style={{ width: '100%', padding: '10px', borderRadius: '12px', background: T.ink, color: '#fff', border: 'none', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                           <Plus size={14} /> Add
                        </button>
                      )}
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* V3 CHECKOUT FLOAT */}
        <AnimatePresence>
           {totalItems > 0 && (
             <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                style={{ position: 'fixed', bottom: '32px', left: '16px', right: '16px', zIndex: 100 }}>
                <div style={{ background: T.ink, borderRadius: '24px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                   <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{totalItems} Items selected</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{fmtRaw(totalPrice)}</div>
                   </div>
                   <button onClick={handlePlaceOrder} disabled={isOrdering}
                      style={{ background: T.primary, color: '#fff', border: 'none', padding: '16px 28px', borderRadius: '18px', fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isOrdering ? 'Ordering...' : 'Place Order'} <CheckCircle2 size={18} />
                   </button>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* SUCCESS OVERLAY */}
        <AnimatePresence>
           {showSuccess && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                   style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
                   <div style={{ width: '100px', height: '100px', margin: '0 auto 32px', borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(16, 185, 129, 0.4)' }}>
                      <CheckCircle2 size={60} />
                   </div>
                   <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px' }}>Order Success!</h2>
                   <p style={{ fontSize: '16px', opacity: 0.8, fontWeight: 700 }}>Your fresh bread is being prepared.</p>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default CustomerStore;
