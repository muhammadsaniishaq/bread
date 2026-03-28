import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { 
  ArrowLeft, Search, Plus, Minus,
  Zap, Star, CheckCircle2, ArrowRight,
  PackageX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   CUTTER/MODEL TOKENS
───────────────────────────────────────── */
const T = {
  bg:        '#f8fafc', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.04)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.08)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  bg2:       '#f1f5f9',
  radius:    '24px',
  shadow:    '0 10px 30px -10px rgba(0,0,0,0.05)'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

export const CustomerStore: React.FC = () => {
  const { user } = useAuth();
  const { products: contextProducts } = useAppContext();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [search, setSearch] = useState('');

  // Use AppContext products so we have REAL stock levels managed by Store Keepers.
  const activeProducts = contextProducts.filter(p => p.active);
  const filteredProducts = activeProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    fetchCustomer();
  }, [user]);

  const fetchCustomer = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
      if (cData) setCustomer(cData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateCart = (pid: string, delta: number) => {
    const product = activeProducts.find(p => p.id === pid);
    if (!product) return;
    
    setCart(prev => {
      const current = prev[pid] || 0;
      let next = Math.max(0, current + delta);
      
      // Enforce real-time stock limits
      if (next > (product.stock || 0)) {
         next = product.stock || 0;
      }
      
      if (next === 0) {
        const { [pid]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [pid]: next };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
     const p = activeProducts.find(x => x.id === id);
     return sum + (p?.price || 0) * qty;
  }, 0);

  const handlePlaceOrder = async () => {
    if (totalItems === 0 || !customer) return;
    setIsOrdering(true);
    
    try {
       const mappedItems = Object.entries(cart).map(([productId, quantity]) => ({
          productId,
          quantity,
          unitPrice: activeProducts.find(x => x.id === productId)?.price || 0
       }));

       const { error } = await supabase.from('orders').insert({
          customer_id: customer.id,
          total_price: totalPrice,
          items: cart, // Optional: Keep raw map for legacy UI if needed
          details: mappedItems, // More structured item saving
          status: 'PENDING',
          created_at: new Date().toISOString()
       });

       if (!error) {
          setShowReview(false);
          setShowSuccess(true);
          setCart({});
          setTimeout(() => {
             setShowSuccess(false);
             navigate('/customer/dashboard');
          }, 2500);
       } else {
         throw error;
       }
    } catch (e) {
       alert("Order failed. Please ensure your ledger is linked.");
    }
    setIsOrdering(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '12px', letterSpacing: '0.1em' }}>CURATING MENU...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '140px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* COMPACT HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248, 250, 252, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '8px', borderRadius: '12px', color: T.txt2, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}><ArrowLeft size={16} /></motion.button>
           <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink }}>Bakery Store</h1>
              <p style={{ margin: 0, fontSize: '10px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fresh items available today</p>
           </div>
           <div style={{ background: T.primaryGlow, color: T.primary, padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} fill="currentColor" /> LIVE
           </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ padding: '16px 20px' }}>
           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.txt3 }} size={16} />
              <input type="text" placeholder="Search for bread..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '13px', fontWeight: 600, outline: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }} />
           </div>
        </div>

        {/* PRODUCT BENTO TILES */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
           {filteredProducts.map((p) => {
             const stock = p.stock || 0;
             const outOfStock = stock <= 0;
             
             return (
               <motion.div layout key={p.id} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', opacity: outOfStock ? 0.7 : 1 }}>
                  <div style={{ height: '120px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                     {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={32} color={T.txt3} />}
                     <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, color: T.ink, textTransform: 'uppercase' }}>{p.category || 'BREAD'}</div>
                     
                     {/* Stock Badge */}
                     <div style={{ position: 'absolute', top: '8px', right: '8px', background: outOfStock ? 'rgba(244, 63, 94, 0.9)' : 'rgba(16, 185, 129, 0.9)', color: '#fff', backdropFilter: 'blur(10px)', padding: '4px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {outOfStock ? <PackageX size={10} /> : null} 
                        {outOfStock ? 'OUT' : `${stock} LEFT`}
                     </div>
                  </div>
                  
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                     <h3 style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 800, color: T.ink }}>{p.name}</h3>
                     <div style={{ fontSize: '14px', fontWeight: 900, color: T.primary, marginBottom: '12px' }}>{fmtRaw(p.price)}</div>
                     
                     <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {cart[p.id] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: T.bg, padding: '4px', borderRadius: '12px', width: '100%', justifyContent: 'space-between' }}>
                             <button onClick={() => updateCart(p.id, -1)} style={{ border: 'none', background: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: T.ink }}><Minus size={12} /></button>
                             <span style={{ fontSize: '13px', fontWeight: 900, color: T.ink }}>{cart[p.id]}</span>
                             <button 
                               onClick={() => updateCart(p.id, 1)} 
                               disabled={cart[p.id] >= stock}
                               style={{ border: 'none', background: cart[p.id] >= stock ? T.txt3 : T.primary, width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: cart[p.id] >= stock ? 'none' : '0 4px 10px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s', cursor: cart[p.id] >= stock ? 'not-allowed' : 'pointer' }}>
                               <Plus size={12} />
                             </button>
                          </div>
                        ) : (
                          <button 
                             onClick={() => updateCart(p.id, 1)}
                             disabled={outOfStock}
                             style={{ width: '100%', padding: '10px', borderRadius: '12px', background: outOfStock ? T.bg2 : T.ink, color: outOfStock ? T.txt3 : '#fff', border: 'none', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: outOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                             {outOfStock ? 'Sold Out' : <><Plus size={12} /> Add</>}
                          </button>
                        )}
                     </div>
                  </div>
               </motion.div>
             )
           })}
        </div>
        
        {filteredProducts.length === 0 && (
           <div style={{ textAlign: 'center', padding: '40px 20px', color: T.txt3, fontWeight: 700, fontSize: '13px' }}>
             No products found matching "{search}".
           </div>
        )}

        {/* V3 CHECKOUT FLOAT */}
        <AnimatePresence>
           {totalItems > 0 && !showReview && (
             <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                style={{ position: 'fixed', bottom: '24px', left: '20px', right: '20px', zIndex: 100 }}>
                <div style={{ background: T.ink, borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                   <div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{totalItems} Items</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{fmtRaw(totalPrice)}</div>
                   </div>
                   <button onClick={() => setShowReview(true)}
                      style={{ background: T.primary, color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)' }}>
                      Checkout <ArrowRight size={14} />
                   </button>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* ORDER REVIEW SLIDE-UP */}
        <AnimatePresence>
           {showReview && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReview(false)}
                   style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                   style={{ position: 'relative', width: '100%', background: '#fff', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px 40px', boxShadow: '0 -20px 50px rgba(0,0,0,0.1)' }}>
                   
                   <div style={{ width: '32px', height: '4px', background: T.border, borderRadius: '2px', margin: '-8px auto 20px' }}></div>
                   
                   <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px', color: T.ink }}>Review Order</h2>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '40vh', overflowY: 'auto', paddingRight: '4px' }}>
                      {Object.entries(cart).map(([id, qty]) => {
                         const p = activeProducts.find(x => x.id === id);
                         return (
                           <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg, padding: '12px', borderRadius: '16px' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                 <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                    {p?.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={16} color={T.txt3} />}
                                 </div>
                                 <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{p?.name}</div>
                                    <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>{qty} x {fmtRaw(p?.price || 0)}</div>
                                 </div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{fmtRaw((p?.price || 0) * qty)}</div>
                           </div>
                         );
                      })}
                   </div>

                   <div style={{ borderTop: `1px dashed ${T.txt3}`, paddingTop: '20px', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Total</span>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: T.ink, letterSpacing: '-0.03em' }}>{fmtRaw(totalPrice)}</span>
                   </div>

                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowReview(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: T.bg2, color: T.ink, border: 'none', fontWeight: 900, fontSize: '13px' }}>Back</button>
                      <button onClick={handlePlaceOrder} disabled={isOrdering}
                         style={{ flex: 2, padding: '16px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.25)' }}>
                         {isOrdering ? 'Processing...' : 'Confirm Order'} <CheckCircle2 size={16} />
                      </button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        {/* SUCCESS OVERLAY */}
        <AnimatePresence>
           {showSuccess && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                   style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
                   <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}>
                      <CheckCircle2 size={40} />
                   </div>
                   <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Order Sent!</h2>
                   <p style={{ fontSize: '13px', opacity: 0.8, fontWeight: 700 }}>Your fresh bread is being prepared.</p>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default CustomerStore;
