import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { 
  ArrowLeft, Search, Plus, Minus,
  Zap, Star, CheckCircle2, ArrowRight,
  PackageX, CreditCard, Truck, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { CustomerBottomNav } from '../components/CustomerBottomNav';
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
  const { products: contextProducts, getPersonalStock } = useAppContext();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [search, setSearch] = useState('');
  
  // Checkout & Payment
  const [paymentMethod, setPaymentMethod] = useState<'DELIVERY' | 'TRANSFER'>('DELIVERY');
  const [assignedSupplier, setAssignedSupplier] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

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
      if (cData) {
         setCustomer(cData);
         const sid = cData.assigned_supplier_id;
          if (sid) {
            const { data: sData } = await supabase.from('profiles').select('full_name, id, phone, bank_name, account_number').eq('id', sid).maybeSingle();
            if (sData) setAssignedSupplier(sData);
         }
      }
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
      const supplierId = assignedSupplier?.id;
      const availableStock = supplierId ? getPersonalStock(pid, 'SUPPLIER', supplierId) : product.stock;
      
      if (next > availableStock) {
         next = availableStock;
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
          supplier_id: assignedSupplier?.id || null, // Track assignment
          total_price: totalPrice,
          items: cart, 
          details: mappedItems,
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
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {filteredProducts.map((p) => {
              const supplierId = assignedSupplier?.id;
              const avail = supplierId ? getPersonalStock(p.id, 'SUPPLIER', supplierId) : p.stock;
              const outOfStock = avail <= 0;
              
              return (
                <motion.div layout key={p.id} 
                  whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                  style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', opacity: outOfStock ? 0.7 : 1, transition: 'all 0.3s ease' }}>
                   <div style={{ height: '120px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={32} color={T.txt3} />}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 900, color: T.primary, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.5)' }}>{p.category || 'Bakery'}</div>
                      
                      {/* Stock Badge */}
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: outOfStock ? 'rgba(244, 63, 94, 0.9)' : 'rgba(16, 185, 129, 0.9)', color: '#fff', backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                         {outOfStock ? <PackageX size={10} /> : <Zap size={10} fill="#fff" />} 
                         {outOfStock ? 'SOLD OUT' : `${avail} IN STOCK`}
                      </div>
                   </div>
                   
                   <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: T.ink, lineHeight: 1.3 }}>{p.name}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Freshly curated batch</p>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{fmtRaw(p.price)}</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                           {cart[p.id] ? (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: T.bg2, padding: '4px', borderRadius: '14px' }}>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateCart(p.id, -1)} style={{ border: 'none', background: '#fff', width: '28px', height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: T.ink }}><Minus size={14} /></motion.button>
                                <span style={{ fontSize: '14px', fontWeight: 900, color: T.ink, minWidth: '20px', textAlign: 'center' }}>{cart[p.id]}</span>
                                <motion.button 
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateCart(p.id, 1)} 
                                  disabled={cart[p.id] >= avail}
                                  style={{ border: 'none', background: cart[p.id] >= avail ? T.txt3 : T.primary, width: '28px', height: '28px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: cart[p.id] >= avail ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)', cursor: cart[p.id] >= avail ? 'not-allowed' : 'pointer' }}>
                                  <Plus size={14} />
                                </motion.button>
                             </div>
                           ) : (
                             <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateCart(p.id, 1)}
                                disabled={outOfStock}
                                style={{ padding: '10px 16px', borderRadius: '14px', background: outOfStock ? T.bg2 : T.ink, color: outOfStock ? T.txt3 : '#fff', border: 'none', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', cursor: outOfStock ? 'not-allowed' : 'pointer', boxShadow: outOfStock ? 'none' : '0 8px 20px rgba(15, 23, 42, 0.2)' }}>
                                {outOfStock ? 'OUT' : <><Plus size={14} /> ADD</>}
                             </motion.button>
                           )}
                        </div>
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
                style={{ position: 'fixed', bottom: '94px', left: '20px', right: '20px', zIndex: 100 }}>
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
                   style={{ position: 'relative', width: '100%', background: '#fff', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px 40px', boxShadow: '0 -20px 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                   
                   <div style={{ width: '32px', height: '4px', background: T.border, borderRadius: '2px', margin: '-8px auto 20px' }}></div>
                   
                   <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                         <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Basket Items</p>
                         {Object.entries(cart).map(([id, qty]) => {
                            const p = activeProducts.find(x => x.id === id);
                            return (
                              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg, padding: '10px 14px', borderRadius: '16px', border: `1px solid ${T.border}` }}>
                                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                       {p?.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Star size={14} color={T.txt3} />}
                                    </div>
                                    <div>
                                       <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{p?.name}</div>
                                       <div style={{ fontSize: '11px', color: T.txt2, fontWeight: 700 }}>{qty} x {fmtRaw(p?.price || 0)}</div>
                                    </div>
                                 </div>
                                 <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{fmtRaw((p?.price || 0) * qty)}</div>
                              </div>
                            );
                         })}
                      </div>

                      {/* Payment Segment */}
                      <div style={{ marginBottom: '24px' }}>
                         <h3 style={{ fontSize: '11px', fontWeight: 900, color: T.ink, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Checkout Summary</h3>
                         
                         <div style={{ background: T.bg, borderRadius: '18px', padding: '16px', border: `1px solid ${T.border}`, marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Subtotal</span>
                               <span style={{ fontSize: '13px', color: T.ink, fontWeight: 700 }}>{fmtRaw(totalPrice)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Delivery Fee</span>
                               <span style={{ fontSize: '13px', color: T.success, fontWeight: 700 }}>FREE</span>
                            </div>
                            <div style={{ height: '1px', background: T.border, margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                               <span style={{ fontSize: '14px', color: T.ink, fontWeight: 800 }}>Order Total</span>
                               <span style={{ fontSize: '16px', color: T.primary, fontWeight: 900 }}>{fmtRaw(totalPrice)}</span>
                            </div>
                         </div>

                         <h3 style={{ fontSize: '11px', fontWeight: 900, color: T.ink, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</h3>
                         <div style={{ display: 'flex', gap: '8px', background: T.bg2, padding: '4px', borderRadius: '14px', marginBottom: '16px' }}>
                            <button onClick={() => setPaymentMethod('DELIVERY')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: paymentMethod === 'DELIVERY' ? '#fff' : 'transparent', color: paymentMethod === 'DELIVERY' ? T.ink : T.txt3, border: 'none', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: paymentMethod === 'DELIVERY' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                               <Truck size={14} /> On Delivery
                            </button>
                            <button onClick={() => setPaymentMethod('TRANSFER')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: paymentMethod === 'TRANSFER' ? '#fff' : 'transparent', color: paymentMethod === 'TRANSFER' ? T.ink : T.txt3, border: 'none', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: paymentMethod === 'TRANSFER' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                               <CreditCard size={14} /> Bank Transfer
                            </button>
                         </div>
                         
                         <AnimatePresence>
                           {paymentMethod === 'TRANSFER' && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ overflow: 'hidden' }}>
                                 <div style={{ padding: '20px', borderRadius: '24px', background: `linear-gradient(135deg, ${T.ink}, #1e293b)`, color: '#fff', boxShadow: '0 10px 30px rgba(15,23,42,0.15)' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>Payment Details</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '8px' }}>
                                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Recipient</span>
                                          <span style={{ fontSize: '13px', fontWeight: 900 }}>{assignedSupplier?.full_name || 'Bakery Admin'}</span>
                                       </div>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '8px' }}>
                                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Bank</span>
                                          <span style={{ fontSize: '13px', fontWeight: 900 }}>{assignedSupplier?.bank_name || 'Guaranty Trust Bank'}</span>
                                       </div>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Account</span>
                                          <span style={{ fontSize: '18px', fontWeight: 900, color: T.success, letterSpacing: '1px' }}>{assignedSupplier?.account_number || '0422119034'}</span>
                                       </div>
                                    </div>

                                    <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                       <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Upload Proof (Image/PDF)</p>
                                       <input 
                                         type="file" 
                                         accept="image/*,application/pdf"
                                         onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                                         style={{ width: '100%', fontSize: '12px', color: '#fff', cursor: 'pointer' }}
                                       />
                                       {paymentProof && <p style={{ margin: '8px 0 0', fontSize: '11px', color: T.success, fontWeight: 700 }}>✓ {paymentProof.name} attached</p>}
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                       <a 
                                         href={`https://wa.me/${assignedSupplier?.phone || '08033620803'}?text=${encodeURIComponent(`Hello, I've just transferred ${fmtRaw(totalPrice)} for my order. ${paymentProof ? `I have attached proof: ${paymentProof.name}` : ''}`)}`}
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         onClick={(e) => {
                                            if (!paymentProof) {
                                               alert("Please upload your payment proof first!");
                                               e.preventDefault();
                                            }
                                         }}
                                         style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '14px', background: '#25D366', color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: '13px', boxShadow: '0 8px 20px rgba(37,211,102,0.3)', transition: 'all 0.2s' }}
                                       >
                                          <MessageSquare size={16} /> Send Proof via WhatsApp
                                       </a>
                                    </div>
                                    
                                    {!assignedSupplier && <div style={{ marginTop: '12px', fontSize: '10px', color: T.danger, fontWeight: 700, textAlign: 'center' }}>No supplier is currently assigned to you.</div>}
                                 </div>
                              </motion.div>
                           )}
                         </AnimatePresence>
                      </div>

                   </div>

                   <div style={{ borderTop: `1px dashed ${T.txt3}`, paddingTop: '20px', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Total</span>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: T.ink, letterSpacing: '-0.03em' }}>{fmtRaw(totalPrice)}</span>
                   </div>

                   <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowReview(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: T.bg2, color: T.ink, border: 'none', fontWeight: 900, fontSize: '13px' }}>Back</button>
                      <button onClick={handlePlaceOrder} disabled={isOrdering || (paymentMethod === 'TRANSFER' && !assignedSupplier)}
                         style={{ flex: 2, padding: '16px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.25)', opacity: (paymentMethod === 'TRANSFER' && !assignedSupplier) ? 0.5 : 1 }}>
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
                   <p style={{ fontSize: '13px', opacity: 0.8, fontWeight: 700 }}>Your fresh bread is being prepared ({paymentMethod}).</p>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <CustomerBottomNav />
      </div>
    </AnimatedPage>
  );
};

export default CustomerStore;
