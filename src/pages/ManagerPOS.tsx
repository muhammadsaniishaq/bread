import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import type { TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ShieldCheck, ArrowLeft, Camera, CreditCard, Banknote, PackageOpen, Minus, Plus } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { QRScanner } from '../components/QRScanner';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────
   DESIGN SYSTEM V5 — Executive Premium Hub
───────────────────────────────────────── */
const T = {
  bg:           '#f8f7ff',
  bg2:          '#f0eeff',
  white:        '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  accent:       '#06b6d4',
  accentLight:  'rgba(6,182,212,0.10)',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  danger:       '#e11d48',
  dangerLight:  'rgba(225,29,72,0.10)',
  gold:         '#d97706',
  goldLight:    'rgba(217,119,6,0.10)',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radius:       '24px',
  radiusSm:     '16px',
  shadow:       '0 4px 24px rgba(99,91,255,0.08)',
  shadowMd:     '0 8px 40px rgba(99,91,255,0.12)',
};

// Animated Number Counter
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = value / 20;
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
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = (decodedId: string) => {
    setShowScanner(false);
    if (customers.find(c => c.id === decodedId)) setCustomerId(decodedId);
  };

  const activeProducts = products.filter(p => p.active);
  
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [cart]);
  const totalAmount = subtotal;

  const handleQuickAdd = (product: typeof activeProducts[0]) => {
    if (product.stock <= 0) return alert(`Out of stock!`);
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Limit reached. Only ${product.stock} available.`);
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateCartQty = (pid: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === pid) {
        const product = activeProducts.find(p => p.id === pid);
        const max = product?.stock || 0;
        const newQty = Math.max(1, Math.min(item.quantity + delta, max));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (pid: string) => {
    setCart(prev => prev.filter(item => item.productId !== pid));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (paymentType === 'Debt' && !customerId) return alert('Select customer for debt');

    setIsProcessing(true);
    try {
      const newTx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: paymentType,
        items: cart,
        totalPrice: totalAmount,
        discount: 0,
        customerId: customerId || undefined,
        origin: 'POS_BAKERY' // Assuming this is bakery admin doing the POS
      };

      await recordSale(newTx as any);
      alert('Sale Completed Successfully!');
      setCart([]);
      setCustomerId('');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cInput = { width: '100%', padding: '16px', borderRadius: '14px', border: `1px solid ${T.border}`, background: T.white, color: T.ink, fontSize: '15px', fontWeight: 600, outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' };

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', padding: 'env(safe-area-inset-top) 16px 100px', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingTop: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '42px', height: '42px', borderRadius: '14px', background: T.white, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: T.shadow }}>
            <ArrowLeft size={20} color={T.ink} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em' }}>
              <ShieldCheck size={24} color={T.primary} /> Executive POS
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: T.txt2, fontWeight: 500 }}>Global Bakery Over-the-counter</p>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px', flex: 1, alignItems: 'start' }}>
          
          {/* LEFT: PRODUCT CATALOG */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.borderLight}`, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageOpen size={18} color={T.accent} /> Store Catalog
              </h2>
              <div style={{ padding: '6px 12px', background: T.bg2, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: T.primary }}>{activeProducts.length} Items Active</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px', paddingRight: '8px' }} className="hide-scrollbar">
              {activeProducts.map((p, i) => (
                <motion.button 
                  key={p.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => handleQuickAdd(p)}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: T.shadow, border: `1px solid ${T.borderLight}` }}>
                     {p.image ? <img src={p.image} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'10px'}}/> : <ShoppingCart size={18} color={T.txt3} />}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, lineHeight: 1.2, marginBottom: '6px', width: '100%' }}>{p.name}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: T.primary, marginBottom: '10px' }}>₦{p.price.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, background: p.stock > 10 ? T.successLight : T.dangerLight, color: p.stock > 10 ? T.success : T.danger, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                     {p.stock} in stock
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* RIGHT: CART & CHECKOUT (PREMIUM GLASS PANEL) */}
          <div style={{ position: 'relative', borderRadius: T.radius, overflow: 'hidden', padding: '24px', boxShadow: T.shadowMd, border: `1px solid ${T.borderLight}`, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', background: T.ink }}>
            {/* Dark glass aesthetics */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,91,255,0.4) 0%, transparent 70%)', filter: 'blur(30px)' }} />
            <div style={{ position: 'absolute', bottom: '-20px', left: '-50px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <ShoppingCart size={18} color="#fff" /> Current Cart
                 </h2>
                 <div style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', fontWeight: 800, padding: '6px 12px', borderRadius: '10px', backdropFilter: 'blur(5px)' }}>
                   {cart.length} Items
                 </div>
               </div>

               {/* Cart Items List */}
               <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }} className="hide-scrollbar">
                  <AnimatePresence>
                    {cart.map(item => {
                      const p = activeProducts.find(x => x.id === item.productId);
                      return (
                        <motion.div key={item.productId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, height: 0 }}
                          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                           <div>
                             <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{p?.name}</div>
                             <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>₦{item.unitPrice.toLocaleString()} ea</div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px' }}>
                                <button onClick={() => updateCartQty(item.productId, -1)} style={{ background: 'none', border: 'none', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><Minus size={14}/></button>
                                <span style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#fff' }}>{item.quantity}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} style={{ background: 'none', border: 'none', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><Plus size={14}/></button>
                             </div>
                             <button onClick={() => removeFromCart(item.productId)} style={{ background: 'rgba(225,29,72,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fb7185' }}>
                               <Trash2 size={16}/>
                             </button>
                           </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  
                  {cart.length === 0 && (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>Your cart is empty</div>
                    </div>
                  )}
               </div>

               {/* Checkout Section */}
               <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Amount Due</div>
                   <div style={{ color: '#fff', fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>
                     <AnimatedCounter value={totalAmount} />
                   </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '12px', marginBottom: '24px' }}>
                   {/* Payment Method Selector */}
                   <div style={{ position: 'relative' }}>
                     <select style={{ ...cInput, WebkitAppearance: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={paymentType} onChange={e => setPaymentType(e.target.value as 'Cash'|'Debt')}>
                       <option value="Cash" style={{ color: T.ink }}>💶 Cash Sale</option>
                       <option value="Debt" style={{ color: T.ink }}>💳 Debt (Credit)</option>
                     </select>
                     <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        {paymentType === 'Cash' ? <Banknote size={16} color="rgba(255,255,255,0.5)"/> : <CreditCard size={16} color="rgba(255,255,255,0.5)"/>}
                     </div>
                   </div>

                   {/* Customer Selector */}
                   <div style={{ position: 'relative' }}>
                     <select style={{ ...cInput, WebkitAppearance: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', paddingRight: '48px' }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                       <option value="" style={{ color: T.ink }}>Walk-in (Anonymous)</option>
                       {customers.map(c => <option key={c.id} value={c.id} style={{ color: T.ink }}>{c.name}</option>)}
                     </select>
                     <button onClick={() => setShowScanner(true)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                       <Camera size={14} />
                     </button>
                   </div>
                 </div>

                 <motion.button 
                   whileTap={cart.length > 0 && !isProcessing ? { scale: 0.96 } : {}}
                   disabled={cart.length === 0 || isProcessing}
                   onClick={handleCheckout}
                   style={{ 
                     width: '100%', padding: '20px', borderRadius: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '18px', fontWeight: 900, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                     background: cart.length === 0 ? 'rgba(255,255,255,0.1)' : T.primary,
                     color: cart.length === 0 ? 'rgba(255,255,255,0.4)' : '#fff',
                     boxShadow: cart.length > 0 ? '0 12px 28px rgba(99,91,255,0.4)' : 'none',
                     transition: 'all 0.3s'
                   }}
                 >
                   {isProcessing ? 'Processing Transaction...' : cart.length > 0 ? 'Charge Client & Checkout' : 'Cart Empty'}
                 </motion.button>

               </div>
            </div>
          </div>

        </div>

      </div>

      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
           <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', color: '#fff' }}>
             <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Scan QR/Barcode</h2>
             <button onClick={() => setShowScanner(false)} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
           </div>
           <div style={{ width: '100%', maxWidth: '400px', height: '400px', background: '#000', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
             <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
             <div style={{ position: 'absolute', inset: 0, border: `2px solid ${T.primary}`, borderRadius: '24px', margin: '16px', pointerEvents: 'none', boxShadow: 'inset 0 0 30px rgba(99,91,255,0.2)' }} />
           </div>
           <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '24px' }}>Focus code inside the scanner</p>
        </div>
      )}
    </AnimatedPage>
  );
};

export default ManagerPOS;
