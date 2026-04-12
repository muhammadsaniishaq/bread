import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import type { TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShieldCheck, ArrowLeft, PackageOpen } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';

const T = {
  bg:           '#f8f7ff',
  bg2:          '#f0eeff',
  white:        '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  accent:       '#06b6d4',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  danger:       '#e11d48',
  dangerLight:  'rgba(225,29,72,0.10)',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radiusSm:     '16px',
  shadow:       '0 4px 24px rgba(99,91,255,0.08)',
  shadowMd:     '0 8px 40px rgba(99,91,255,0.12)',
};

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
  const [isProcessing, setIsProcessing] = useState(false);

  const activeProducts = products.filter(p => p.active);
  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [cart]);

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

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (paymentType === 'Debt' && !customerId) return alert('Select customer for debt');
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
      alert('Sale Completed!');
      setCart([]);
      setCustomerId('');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cInput = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.white, color: T.ink, fontSize: '13px', fontWeight: 700, outline: 'none' };

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Compact Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={16} color={T.ink} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color={T.primary} /> Executive POS
            </h1>
            <p style={{ margin: 0, fontSize: '10px', color: T.txt2, fontWeight: 600 }}>Compact Sales Terminal</p>
          </div>
        </div>

        {/* Global Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px', flex: 1, alignItems: 'start' }}>
          
          {/* Catalog */}
          <div style={{ background: T.white, borderRadius: T.radiusSm, padding: '14px', boxShadow: T.shadow, border: `1px solid ${T.borderLight}`, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: T.ink, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageOpen size={14} color={T.accent} /> Bread Catalog
              </h2>
              <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>{activeProducts.length} Items</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {activeProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => handleQuickAdd(p)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '10px', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                    {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : '🍞'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: T.ink, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: T.primary }}>₦{p.price}</div>
                  <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{p.stock} pcs</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div style={{ background: T.ink, borderRadius: T.radiusSm, padding: '16px', boxShadow: T.shadowMd, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', color: '#fff' }}>
             <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Active Cart</h2>
             
             <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} className="hide-scrollbar">
               {cart.map(item => {
                 const p = activeProducts.find(x => x.id === item.productId);
                 return (
                   <div key={item.productId} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>₦{item.unitPrice}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px' }}>
                           <button onClick={() => updateCartQty(item.productId, -1)} style={{ width: '20px', height: '20px', color: '#fff', border: 'none', background: 'none', cursor: 'pointer' }}>-</button>
                           <span style={{ fontSize: '11px', fontWeight: 800, width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                           <button onClick={() => updateCartQty(item.productId, 1)} style={{ width: '20px', height: '20px', color: '#fff', border: 'none', background: 'none', cursor: 'pointer' }}>+</button>
                        </div>
                        <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                   </div>
                 );
               })}
             </div>

             <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Total</span>
                   <span style={{ fontSize: '20px', fontWeight: 900 }}><AnimatedCounter value={totalAmount} /></span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <select style={{ ...cInput, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="" style={{ color: '#000' }}>Walk-in</option>
                    {customers.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>)}
                  </select>
                  <select style={{ ...cInput, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={paymentType} onChange={e => setPaymentType(e.target.value as any)}>
                    <option value="Cash" style={{ color: '#000' }}>Cash</option>
                    <option value="Debt" style={{ color: '#000' }}>Debt</option>
                  </select>
                </div>

                <button 
                  disabled={cart.length === 0 || isProcessing}
                  onClick={handleCheckout}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: T.primary, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}
                >
                  {isProcessing ? 'Wait...' : 'Checkout'}
                </button>
             </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerPOS;
