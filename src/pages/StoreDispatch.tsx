import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useTranslation } from '../store/LanguageContext';
import type { Transaction, TransactionItem } from '../store/types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Trash2, ArrowLeft,
  CheckCircle, Camera, Minus, Plus, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRScanner } from '../components/QRScanner';
import StoreBottomNav from '../components/StoreBottomNav';
import { supabase } from '../lib/supabase';

const T = {
  bg: '#f4f8ff', white: '#ffffff', primary: '#2563eb', pLight: 'rgba(37,99,235,0.09)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)',
  rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)',
  ink: '#0f1c3f', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '20px',
  shadow: '0 4px 20px rgba(37,99,235,0.08)',
  shadowLg: '0 12px 40px rgba(37,99,235,0.18)',
};

const StoreDispatch: React.FC = () => {
  const { customers, products, transactions, recordSale } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [customerId, setCustomerId]     = useState('');
  const [supplierProfiles, setSupplierProfiles] = useState<any[]>([]);
  const [paymentType, setPaymentType]   = useState<'Cash' | 'Debt'>('Cash');
  const [discountInput, setDiscountInput] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [cart, setCart]                 = useState<TransactionItem[]>([]);
  const [showScanner, setShowScanner]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load Supplier profiles to filter the customer list
  useEffect(() => {
    supabase.from('profiles').select('id').eq('role', 'SUPPLIER')
      .then(({ data }) => { if (data) setSupplierProfiles(data.map(d => d.id)); });
  }, []);

  // Handle incoming supplierId from Ledger
  useEffect(() => {
     if (location.state?.supplierId) {
        setCustomerId(location.state.supplierId);
        setPaymentType('Debt'); // Suppliers usually take on debt
     }
  }, [location.state]);

  const activeProducts = products.filter(p => p.active);
  const categories = ['All', ...Array.from(new Set(activeProducts.map(p => p.category || 'Standard')))];

  const filteredProducts = activeProducts
    .filter(p => selectedCategory === 'All' || (p.category || 'Standard') === selectedCategory)
    .sort((a, b) => a.price - b.price);

  // Filter customers to show only those who are linked to a Supplier profile
  const supplierCustomers = useMemo(() => {
    return customers.filter(c => c.profile_id && supplierProfiles.includes(c.profile_id));
  }, [customers, supplierProfiles]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const maxPoints = selectedCustomer?.loyaltyPoints || 0;

  useEffect(() => { setRedeemPoints(false); }, [customerId]);
  
  // Set payment to Debt automatically if a Supplier is selected
  useEffect(() => {
    if (selectedCustomer && supplierProfiles.includes(selectedCustomer.profile_id || '')) {
       setPaymentType('Debt');
    }
  }, [customerId, selectedCustomer, supplierProfiles]);

  const subtotal = useMemo(() =>
    cart.reduce((s, item) => s + item.quantity * item.unitPrice, 0), [cart]);

  const discountAmount = useMemo(() => {
    if (!discountInput) return 0;
    if (discountInput.endsWith('%')) return Math.floor((parseFloat(discountInput) / 100) * subtotal);
    return parseInt(discountInput) || 0;
  }, [discountInput, subtotal]);

  const maxPointsToUse = Math.min(maxPoints, Math.ceil(Math.max(0, subtotal - discountAmount) / 10));
  const pointsDiscount = redeemPoints ? maxPointsToUse * 10 : 0;
  const totalDiscount  = discountAmount + pointsDiscount;
  const totalAmount    = Math.max(0, subtotal - totalDiscount);
  const pointsEarned   = Math.floor(totalAmount / 1000);

  const handleScan = (id: string) => {
    setShowScanner(false);
    if (id.startsWith('receipt:'))   navigate(`/receipt/${id.split(':')[1]}`);
    else if (customers.find(c => c.id === id)) setCustomerId(id);
  };

  const addToCart = (product: typeof activeProducts[0]) => {
    if (product.stock <= 0) { alert(t('store.outOfStock')); return; }
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) { alert(`${t('store.unitsTotal')} ${product.stock} left!`); return prev; }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateQty = (pid: string, delta: number) => {
    setCart(prev => {
      const product = products.find(p => p.id === pid);
      return prev.map(item => {
        if (item.productId !== pid) return item;
        const newQty = item.quantity + delta;
        if (delta > 0 && product && newQty > product.stock) { alert('Not enough stock!'); return item; }
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      });
    });
  };

  const removeFromCart = (pid: string) => setCart(prev => prev.filter(i => i.productId !== pid));

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'Debt' && !customerId) { alert('Please select a customer for debt.'); return; }
    setSubmitting(true);
    const tx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customerId: customerId || undefined,
      items: cart,
      totalPrice: totalAmount,
      type: paymentType,
      status: 'COMPLETED', // Auto-complete so suppliers get stock instantly without needing manual acceptance flow
      origin: 'STORE',
      discount: totalDiscount > 0 ? totalDiscount : undefined,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      pointsUsed: redeemPoints ? maxPointsToUse : undefined,
    };
    await recordSale(tx);
    setCart([]); setCustomerId(''); setPaymentType('Cash'); setDiscountInput(''); setRedeemPoints(false);
    setSubmitting(false);
    navigate(`/receipt/${tx.id}`);
  };

  const cartTotal = cart.reduce((s, i) => s + i.quantity, 0);
  const todayTx = transactions.filter(t => t.date.startsWith(new Date().toISOString().split('T')[0]));

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '110px' }}>

        {/* ─── HEADER ─── */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <ArrowLeft size={14} /> {t('store.backToDashboard')}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={18} color="#93c5fd" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{t('store.dispatchPOS')}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{todayTx.length} {t('store.matching')}</div>
                </div>
              </div>
              <button onClick={() => setShowScanner(true)} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <Camera size={16} />
              </button>
            </div>

            {/* Cart summary badge */}
            {cartTotal > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingCart size={14} color="#93c5fd" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{cartTotal} {t('store.inCart')}</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#93c5fd' }}>₦{totalAmount.toLocaleString()}</span>
              </motion.div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 14px 0' }}>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', background: selectedCategory === cat ? T.primary : T.white, color: selectedCategory === cat ? '#fff' : T.txt3, boxShadow: T.shadow, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                {cat === 'All' ? t('store.allTime') : cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {filteredProducts.map(p => {
              const inCart = cart.find(i => i.productId === p.id);
              const isOut  = p.stock <= 0;
              return (
                <motion.div key={p.id} whileTap={{ scale: isOut ? 1 : 0.96 }} onClick={() => !isOut && addToCart(p)}
                   style={{ background: T.white, borderRadius: '16px', padding: '14px 12px', boxShadow: T.shadow, border: `2px solid ${inCart ? T.primary : T.borderL}`, cursor: isOut ? 'not-allowed' : 'pointer', opacity: isOut ? 0.45 : 1, transition: 'border 0.2s', position: 'relative', overflow: 'hidden' }}>
                  {inCart && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: '#fff' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isOut ? 'rgba(0,0,0,0.05)' : T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden' }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>🍞</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, lineHeight: 1.2, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: T.primary }}>₦{p.price.toLocaleString()}</div>
                  <div style={{ fontSize: '9px', fontWeight: 800, marginTop: '5px', padding: '2px 7px', borderRadius: '5px', display: 'inline-block', background: isOut ? T.roseL : p.stock < 20 ? T.amberL : T.emeraldL, color: isOut ? T.rose : p.stock < 20 ? T.amber : T.emerald }}>
                    {isOut ? t('store.outOfStock') : `${p.stock} ${t('store.unitsLeft')}`}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ─── CART SHEET ─── (sticky bottom above nav) */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
              style={{ position: 'fixed', bottom: '72px', left: 0, right: 0, zIndex: 150, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${T.borderL}`, borderRadius: '24px 24px 0 0', padding: '16px 16px 10px', boxShadow: '0 -8px 30px rgba(37,99,235,0.12)' }}>

              <div style={{ width: '36px', height: '4px', background: T.borderL, borderRadius: '2px', margin: '0 auto 14px' }} />

              {/* Cart items */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {cart.map(item => {
                  const p = products.find(pr => pr.id === item.productId);
                  return (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '12px', background: T.bg, border: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: '16px' }}>🍞</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name}</div>
                        <div style={{ fontSize: '10px', color: T.txt3 }}>₦{item.unitPrice.toLocaleString()} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => updateQty(item.productId, -1)} style={{ width: '26px', height: '26px', borderRadius: '8px', background: T.bg, border: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: T.ink, minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} style={{ width: '26px', height: '26px', borderRadius: '8px', background: T.pLight, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Plus size={11} color={T.primary} />
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: T.primary, minWidth: '52px', textAlign: 'right' }}>₦{(item.quantity * item.unitPrice).toLocaleString()}</div>
                      <button onClick={() => removeFromCart(item.productId)} style={{ width: '26px', height: '26px', borderRadius: '8px', background: T.roseL, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={11} color={T.rose} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Customer select */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: T.txt3 }} />
                  <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px 11px 34px', borderRadius: '12px', border: `1.5px solid ${T.borderL}`, background: T.bg, fontSize: '13px', fontWeight: 600, color: T.ink, fontFamily: 'inherit', outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                    <option value="">{t('store.selectSupplierDila')}</option>
                    {supplierCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.debtBalance > 0 ? ` (${t('store.debtShort')} ₦${c.debtBalance.toLocaleString()})` : ''}</option>
                    ))}
                  </select>
                </div>
                {selectedCustomer && (selectedCustomer.loyaltyPoints ?? 0) > 0 && (
                  <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '10px', background: T.pLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.primary }}>⭐ {selectedCustomer.loyaltyPoints ?? 0} pts (₦{((selectedCustomer.loyaltyPoints ?? 0) * 10).toLocaleString()} value)</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: T.primary, cursor: 'pointer' }}>
                      <input type="checkbox" checked={redeemPoints} onChange={e => setRedeemPoints(e.target.checked)} /> {t('store.redeemPoints')}
                    </label>
                  </div>
                )}
              </div>

              {/* Payment type */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {(['Cash', 'Debt'] as const).map(type => (
                  <button key={type} onClick={() => setPaymentType(type)}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: paymentType === type ? (type === 'Cash' ? T.emerald : T.rose) : T.bg, color: paymentType === type ? '#fff' : T.txt3 }}>
                    {type === 'Cash' ? '💵 ' + t('store.cashShort') : '📒 ' + t('store.debtShort')}
                  </button>
                ))}
              </div>

              {/* Discount */}
              <input value={discountInput} onChange={e => setDiscountInput(e.target.value)} placeholder={t('store.discountPlaceholder')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: `1.5px solid ${T.borderL}`, background: T.bg, fontSize: '13px', fontWeight: 600, color: T.ink, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />

              {/* Total + submit */}
              <div style={{ background: `linear-gradient(135deg, ${T.primary}, #1d4ed8)`, borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                   {totalDiscount > 0 && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '2px' }}>Ragi: -₦{totalDiscount.toLocaleString()}</div>}
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>₦{totalAmount.toLocaleString()}</div>
                  {pointsEarned > 0 && customerId && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>+{pointsEarned} loyalty pts</div>}
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
                  disabled={cart.length === 0 || submitting || (paymentType === 'Debt' && !customerId)}
                  style={{ padding: '12px 20px', borderRadius: '13px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '13px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  ) : (
                    <><CheckCircle size={16} /> {t('store.completeDispatch')}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      </div>
      <StoreBottomNav />
    </AnimatedPage>
  );
};

export default StoreDispatch;
