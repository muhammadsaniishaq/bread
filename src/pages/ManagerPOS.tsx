import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import type { TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShieldCheck, ArrowLeft, Search, ShoppingCart, ChevronRight, X } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg:           '#fbfcfd',
  white:        '#ffffff',
  surface:      '#f8fafc',
  border:       '#f1f5f9',
  borderDark:   'rgba(255,255,255,0.1)',
  primary:      '#0f172a', // Deep Slate
  brand:        '#3b82f6', // Electric Blue
  brandLight:   'rgba(59, 130, 246, 0.05)',
  success:      '#10b981',
  danger:       '#ef4444',
  ink:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  shadow:       '0 4px 12px rgba(0,0,0,0.03)',
  shadowMd:     '0 12px 30px rgba(0,0,0,0.08)',
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = value / 15;
    const t = setInterval(() => {
      cur += step;
      if (cur >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(cur));
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <span>₦{display.toLocaleString()}</span>;
};

export const ManagerPOS: React.FC = () => {
  const { customers, products, recordSale } = useAppContext();
  const navigate = useNavigate();
  
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Debt'>('Cash');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 900;

  const activeProducts = useMemo(() => 
    products.filter(p => p.active && (!search || p.name.toLowerCase().includes(search.toLowerCase()))),
  [products, search]);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [cart]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuickAdd = (product: any) => {
    if (product.stock <= 0) return alert(`Out of stock!`);
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
         if (existing.quantity >= product.stock) return prev;
         return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateCartQty = (pid: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === pid) {
        const product = products.find(p => p.id === pid);
        const max = product?.stock || 0;
        const newQty = Math.max(1, Math.min(item.quantity + delta, max));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'Debt' && !customerId) return alert('Please select a customer for debt.');
    setIsProcessing(true);
    try {
      await recordSale({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: paymentType,
        items: cart,
        totalPrice: totalAmount,
        discount: 0,
        customerId: customerId || undefined,
        origin: 'POS_BAKERY'
      } as any);
      alert('Transaction Successful!');
    } catch (err: any) {
      alert(err.message || 'Error processing sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCustomer = useMemo(() => customers.find(c => c.id === customerId), [customerId, customers]);
  const isVerified = selectedCustomer?.is_verified || false;

  useEffect(() => {
    if (customerId && !isVerified && paymentType === 'Debt') {
      setPaymentType('Cash');
    }
  }, [customerId, isVerified]);

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: isMobile ? '180px' : '40px', fontFamily: "'Segoe UI', Roboto, sans-serif", color: T.ink }}>
        
        {/* ULTRA COMPACT ADAPTIVE HEADER */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: isMobile ? '8px 16px' : '16px 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
           <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: T.txt2, cursor: 'pointer' }}>
                    <ArrowLeft size={isMobile ? 20 : 22} />
                 </motion.button>
                 <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: 900, letterSpacing: '-0.02em', color: T.primary }}>Sales Terminal</h1>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bakery Executive v2.0</div>
                 </div>
              </div>

              <div style={{ flex: 1, maxWidth: isMobile ? 'unset' : '400px', position: 'relative' }}>
                 <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                 <input 
                   placeholder="Search menu..." 
                   value={search} onChange={e => setSearch(e.target.value)}
                   style={{ width: '100%', padding: isMobile ? '8px 12px 8px 38px' : '10px 12px 10px 38px', borderRadius: '12px', border: `1px solid ${T.border}`, background: T.surface, fontSize: '13px', fontWeight: 600, outline: 'none' }}
                 />
              </div>

              {!isMobile && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>OPERATOR</div>
                       <div style={{ fontSize: '13px', fontWeight: 700 }}>Admin User</div>
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <ShieldCheck size={18} color={T.brand} />
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* MAIN TERMINAL AREA */}
        <div style={{ maxWidth: '1400px', margin: isMobile ? '8px auto' : '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: '24px' }}>
           
           {/* CATALOG AREA */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontSize: '12px', fontWeight: 900, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Selection</div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{activeProducts.length} Items Available</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: isMobile ? '8px' : '16px' }}>
                 {activeProducts.map((p, i) => (
                    <motion.button 
                      key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAdd(p)}
                      style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: isMobile ? '12px' : '20px', padding: isMobile ? '8px' : '16px', textAlign: 'left', cursor: 'pointer', boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}
                    >
                       <div style={{ width: isMobile ? '32px' : '48px', height: isMobile ? '32px' : '48px', borderRadius: isMobile ? '8px' : '12px', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? '8px' : '12px', fontSize: isMobile ? '16px' : '24px' }}>
                          {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isMobile ? '8px' : '12px' }} /> : '🍞'}
                       </div>
                       <div style={{ fontSize: isMobile ? '10px' : '13px', fontWeight: 800, color: T.ink, lineHeight: 1.2, marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                       <div style={{ fontSize: isMobile ? '12px' : '16px', fontWeight: 950, color: T.brand }}>₦{p.price}</div>
                       <div style={{ fontSize: '9px', color: p.stock < 10 ? T.danger : T.txt3, fontWeight: 900, marginTop: '4px' }}>STK: {p.stock}</div>
                    </motion.button>
                 ))}
              </div>
           </div>

           {/* DESKTOP CART (STATIC) */}
           {!isMobile && (
              <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                 <div style={{ background: T.primary, borderRadius: '28px', padding: '28px', color: '#fff', boxShadow: T.shadowMd, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '16px', fontWeight: 900 }}>Active Cart</span>
                       <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>{totalItems} Items</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }} className="hide-scrollbar">
                       {cart.map(item => {
                          const p = products.find(prod => prod.id === item.productId);
                          return (
                             <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                   <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name}</div>
                                   <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>₦{item.unitPrice}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                                      <button onClick={() => updateCartQty(item.productId, -1)} style={{ width: '24px', height: '24px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                                      <span style={{ fontSize: '12px', fontWeight: 900, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                                      <button onClick={() => updateCartQty(item.productId, 1)} style={{ width: '24px', height: '24px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                                   </div>
                                   <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ color: T.danger, border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                </div>
                             </div>
                          )
                       })}
                       {cart.length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontStyle: 'italic' }}>Cart is abandoned...</div>}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ flex: 1.5, padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '13px', fontWeight: 700 }}>
                             <option value="" style={{ color: '#000' }}>Walk-in Customer</option>
                             {customers.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>)}
                          </select>
                          <select value={paymentType} onChange={e => setPaymentType(e.target.value as any)} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '13px', fontWeight: 700 }}>
                             <option value="Cash" style={{ color: '#000' }}>Cash</option>
                             {isVerified && <option value="Debt" style={{ color: '#000' }}>Debt</option>}
                          </select>
                       </div>

                       {!isVerified && customerId && (
                          <div style={{fontSize:'10px',fontWeight:700,color:T.danger,background:'rgba(239,68,68,0.1)',padding:'8px 12px',borderRadius:'10px',marginBottom:'16px',textAlign:'center'}}>
                             ⚠️ Unverified client. Credit blocked.
                          </div>
                       )}

                       <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Subtotal Due</span>
                          <span style={{ fontSize: '28px', fontWeight: 950 }}><AnimatedCounter value={totalAmount} /></span>
                       </div>

                       <motion.button 
                         whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                         disabled={cart.length === 0 || isProcessing}
                         onClick={handleCheckout}
                         style={{ width: '100%', padding: '20px', borderRadius: '20px', background: `linear-gradient(135deg, ${T.brand}, #2563eb)`, color: '#fff', border: 'none', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: (cart.length === 0 || isProcessing) ? 0.6 : 1 }}
                       >
                          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><ShoppingCart size={20} /> Process Payment</>}
                       </motion.button>
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* MOBILE STICKY FOOTER ACTION */}
        {isMobile && (
           <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.white, borderTop: `1px solid ${T.border}`, padding: '16px 20px', zIndex: 500, boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div onClick={() => setShowCartMobile(true)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Cart ({totalItems})</div>
                    <div style={{ fontSize: '24px', fontWeight: 950, color: T.primary }}>₦{totalAmount.toLocaleString()}</div>
                 </div>
                 <motion.button 
                   whileTap={{ scale: 0.95 }}
                   disabled={cart.length === 0 || isProcessing}
                   onClick={() => setShowCartMobile(true)}
                   style={{ background: T.primary, color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '16px', fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', opacity: cart.length === 0 ? 0.5 : 1 }}
                 >
                    Checkout <ChevronRight size={18} />
                 </motion.button>
              </div>
           </div>
        )}

        {/* MOBILE CART OVERLAY */}
        <AnimatePresence>
           {isMobile && showCartMobile && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
              >
                 <motion.div 
                   initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                   style={{ width: '100%', background: T.white, borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                       <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Review Transaction</h2>
                       <button onClick={() => setShowCartMobile(false)} style={{ background: T.surface, border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                       {cart.map(item => {
                          const p = products.find(prod => prod.id === item.productId);
                          return (
                             <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface, padding: '16px', borderRadius: '20px' }}>
                                <div style={{ flex: 1 }}>
                                   <div style={{ fontSize: '14px', fontWeight: 800 }}>{p?.name}</div>
                                   <div style={{ fontSize: '12px', color: T.txt3 }}>₦{item.unitPrice} each</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: T.white, padding: '6px', borderRadius: '12px', border: `1px solid ${T.border}` }}>
                                      <button onClick={() => updateCartQty(item.productId, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none' }}>-</button>
                                      <span style={{ fontSize: '15px', fontWeight: 900 }}>{item.quantity}</span>
                                      <button onClick={() => updateCartQty(item.productId, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none' }}>+</button>
                                   </div>
                                   <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ color: T.danger, border: 'none', background: 'none' }}><Trash2 size={18} /></button>
                                </div>
                             </div>
                          )
                       })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>CUSTOMER</span>
                          <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: T.surface, fontWeight: 700 }}>
                             <option value="">Walk-in</option>
                             {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>PAYMENT</span>
                          <select value={paymentType} onChange={e => setPaymentType(e.target.value as any)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: T.surface, fontWeight: 700 }}>
                             <option value="Cash">Cash</option>
                             {isVerified && <option value="Debt">Debt</option>}
                          </select>
                       </div>
                    </div>

                    {!isVerified && customerId && (
                       <div style={{fontSize:'11px',fontWeight:700,color:T.danger,textAlign:'center',marginBottom:'20px'}}>
                          Client identity not verified for credit.
                       </div>
                    )}

                    <div style={{ background: T.primary, padding: '24px', borderRadius: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                       <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.6 }}>TOTAL PAYABLE</span>
                       <span style={{ fontSize: '32px', fontWeight: 950 }}>₦{totalAmount.toLocaleString()}</span>
                    </div>

                    <button 
                      disabled={cart.length === 0 || isProcessing}
                      onClick={handleCheckout}
                      style={{ width: '100%', padding: '20px', borderRadius: '20px', background: T.brand, color: '#fff', border: 'none', fontSize: '16px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                       {isProcessing ? 'Processing...' : 'Complete Transaction'}
                    </button>
                    <div style={{ height: '24px' }} />
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

const Loader2: React.FC<any> = ({ size, className }) => <ShieldCheck size={size} className={className} />;

export default ManagerPOS;
