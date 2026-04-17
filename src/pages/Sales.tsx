import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Transaction, TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { useAuth } from '../store/AuthContext';
import { QRScanner } from '../components/QRScanner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Camera, Link as LinkIcon, RefreshCw,
  AlertTriangle, Package, ChevronUp, Zap,
  BadgeCheck, Clock, User, Banknote, CreditCard,
  Star, X, CheckCircle
} from 'lucide-react';

/* ── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  bg:      '#f0f4ff',
  white:   '#ffffff',
  ink:     '#0f172a',
  txt2:    '#475569',
  txt3:    '#94a3b8',
  border:  'rgba(0,0,0,0.07)',
  primary: '#4f46e5',
  pLight:  'rgba(79,70,229,0.10)',
  pDark:   '#3730a3',
  emerald: '#059669',
  emeraldL:'rgba(5,150,105,0.11)',
  rose:    '#e11d48',
  roseL:   'rgba(225,29,72,0.10)',
  amber:   '#d97706',
  amberL:  'rgba(217,119,6,0.10)',
  radius:  '20px',
  shadow:  '0 4px 20px rgba(79,70,229,0.08)',
  shadowLg:'0 14px 40px rgba(79,70,229,0.18)',
};
const fmt = (v: number) => `₦${v.toLocaleString()}`;

/* ─────────────────────────────────────────────────────────────────────────── */

export const Sales: React.FC = () => {
  const {
    customers, products, transactions, recordSale,
    getPersonalStock, inventoryLogs, personalStockMap,
    linkProfileToRecord, refreshData
  } = useAppContext();
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [customerId, setCustomerId]       = useState('');
  const [paymentType, setPaymentType]     = useState<'Cash' | 'Debt'>('Cash');
  const [discountInput, setDiscountInput] = useState('');
  const [redeemPoints, setRedeemPoints]   = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [linking, setLinking]             = useState(false);
  const [cart, setCart]                   = useState<TransactionItem[]>([]);
  const [showScanner, setShowScanner]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [cartOpen, setCartOpen]           = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);

  const isSupplier = role === 'SUPPLIER';
  const myAccount  = useMemo(() => customers.find(c => c.profile_id === user?.id), [customers, user]);
  const needsLink  = (role === 'SUPPLIER' || role === 'STORE_KEEPER') && !myAccount;

  const activeProducts = useMemo(() => {
    let prods = products.filter(p => p.active);
    if (isSupplier && myAccount) {
      prods = prods.map(p => ({ ...p, stock: getPersonalStock(p.id) }));
    }
    return prods;
  }, [products, isSupplier, myAccount, inventoryLogs, transactions, personalStockMap]);

  const categories = ['All', ...Array.from(new Set(activeProducts.map(p => p.category || 'Standard')))];
  const filteredProducts = activeProducts
    .filter(p => selectedCategory === 'All' || (p.category || 'Standard') === selectedCategory)
    .sort((a, b) => a.price - b.price);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0), [cart]);
  const selectedCustomer = customers.find(c => c.id === customerId);
  const maxPointsAvailable = selectedCustomer?.loyaltyPoints || 0;

  useEffect(() => { setRedeemPoints(false); }, [customerId]);
  useEffect(() => { if (cart.length > 0) setCartOpen(true); }, [cart.length]);

  const discountAmount = useMemo(() => {
    if (!discountInput) return 0;
    if (discountInput.endsWith('%')) return Math.floor((parseFloat(discountInput) / 100) * subtotal);
    return parseInt(discountInput) || 0;
  }, [discountInput, subtotal]);

  const maxPointsToUse = Math.min(maxPointsAvailable, Math.ceil(Math.max(0, subtotal - discountAmount) / 10));
  const pointsDiscount = redeemPoints ? maxPointsToUse * 10 : 0;
  const totalDiscount  = discountAmount + pointsDiscount;
  const totalAmount    = Math.max(0, subtotal - totalDiscount);
  const pointsEarned   = Math.floor(totalAmount / 1000);
  const cartCount      = cart.reduce((s, i) => s + i.quantity, 0);

  const handleScan = (id: string) => {
    setShowScanner(false);
    if (id.startsWith('receipt:')) navigate(`/receipt/${id.split(':')[1]}`);
    else if (id.startsWith('payment:')) navigate(`/customer-receipt/${id.split(':')[1]}`);
    else if (id.startsWith('bakery-receipt:')) navigate(`/bakery-receipt/${id.split(':')[1]}`);
    else if (id.startsWith('inventory:')) navigate(`/inventory/receipt/${id.split(':')[2]}`);
    else if (customers.find(c => c.id === id)) setCustomerId(id);
  };

  const handleQuickAdd = (p: typeof activeProducts[0]) => {
    if (p.stock <= 0) { alert('Out of stock!'); return; }
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) {
        if (ex.quantity >= p.stock) { alert(`Only ${p.stock} available!`); return prev; }
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: p.id, quantity: 1, unitPrice: p.price }];
    });
  };

  const updateCartQty = (pid: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== pid) return i;
      const prod = activeProducts.find(p => p.id === pid);
      const next = i.quantity + delta;
      if (next > (prod?.stock || 0)) { alert('Not enough stock!'); return i; }
      if (next <= 0) return i;
      return { ...i, quantity: next };
    }));
  };

  const removeFromCart = (pid: string) => setCart(prev => prev.filter(i => i.productId !== pid));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    for (const item of cart) {
      const avail = getPersonalStock(item.productId);
      const p = products.find(pr => pr.id === item.productId);
      if (p && item.quantity > avail) { alert(`Not enough stock for ${p.name}!`); return; }
    }
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: paymentType,
      totalPrice: totalAmount,
      discount: totalDiscount,
      customerId: customerId || undefined,
      sellerId: user?.id,
      items: cart,
      status: 'COMPLETED',
      origin: 'POS_SUPPLIER',
    };
    setSubmitting(true);
    try {
      await recordSale(tx);
      setCart([]);
      setCustomerId('');
      setPaymentType('Cash');
      setDiscountInput('');
      setRedeemPoints(false);
      setCartOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate(`/receipt/${tx.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Today stats ── */
  const todayTxns = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(t =>
      new Date(t.date).toDateString() === today &&
      (isSupplier
        ? (t.sellerId === user?.id || t.customerId === myAccount?.id)
        : true)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, isSupplier, user, myAccount]);

  const todayRevenue  = todayTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
  const todayDebt     = todayTxns.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);
  const totalInStock  = activeProducts.reduce((s, p) => s + p.stock, 0);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown';

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 140 }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(145deg, #0f0d2e 0%, #1e1b4b 50%, #312e81 100%)',
        padding: '52px 20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Blobs */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '-30%', right: '-10%', width: 260, height: 260, background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: '-50%', left: '-10%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                🛒 Point of Sale
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                {isSupplier ? `${(user as any)?.user_metadata?.full_name?.split(' ')[0] || 'Supplier'}'s Sales` : t('sales.title')}
              </div>
            </div>
            {cartCount > 0 && (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCartOpen(o => !o)}
                style={{ position: 'relative', width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <ShoppingCart size={20} />
                <span style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#e11d48', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1e1b4b' }}>
                  {cartCount}
                </span>
              </motion.button>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Today Cash', value: fmt(todayRevenue), icon: Banknote, color: '#6ee7b7', bg: 'rgba(5,150,105,0.2)' },
              { label: isSupplier ? 'Personal Stock' : 'Total Stock', value: `${totalInStock} units`, icon: Package, color: '#a5b4fc', bg: 'rgba(99,102,241,0.2)' },
              { label: 'Today Debt', value: fmt(todayDebt), icon: CreditCard, color: '#fda4af', bg: 'rgba(225,29,72,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <s.icon size={12} color={s.color} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROFILE LINK WARNING ── */}
      <AnimatePresence>
        {needsLink && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ margin: '16px 16px 0', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 4px 16px rgba(217,119,6,0.12)' }}
          >
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: 8, flexShrink: 0 }}>
              <AlertTriangle size={18} color={C.amber} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>Profile Not Linked</div>
              <div style={{ fontSize: 11, color: '#b45309', lineHeight: 1.5, marginBottom: 10 }}>
                Your account is not linked to a supplier record. Stock tracking may be inaccurate.
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={async () => {
                  setLinking(true);
                  try {
                    const linked = await linkProfileToRecord(user!.id, user!.email!, (user as any).user_metadata?.phone);
                    if (linked) alert('✅ Linked successfully!');
                    else alert('No matching record found. Contact your manager.');
                    await refreshData();
                  } catch (e: any) {
                    alert('Error: ' + e.message);
                  } finally { setLinking(false); }
                }}
                disabled={linking}
                style={{ background: C.amber, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: linking ? 0.6 : 1 }}
              >
                {linking ? <RefreshCw size={13} className="animate-spin" /> : <LinkIcon size={13} />}
                Link Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS TOAST ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: C.emerald, color: '#fff', padding: '12px 24px', borderRadius: 50, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, boxShadow: '0 8px 24px rgba(5,150,105,0.4)', whiteSpace: 'nowrap' }}
          >
            <CheckCircle size={18} /> Sale Completed!
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── CATEGORY PILLS ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              style={{
                flexShrink: 0, padding: '8px 18px', borderRadius: 50, fontSize: 12, fontWeight: 800,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: selectedCategory === cat ? C.primary : C.white,
                color: selectedCategory === cat ? '#fff' : C.txt2,
                boxShadow: selectedCategory === cat ? `0 4px 14px rgba(79,70,229,0.35)` : C.shadow,
              }}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* ── PRODUCT GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          {filteredProducts.map((p, idx) => {
            const inCart = cart.find(i => i.productId === p.id);
            const isOut  = p.stock <= 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileTap={!isOut ? { scale: 0.97 } : undefined}
                onClick={() => !isOut && handleQuickAdd(p)}
                style={{
                  background: C.white, borderRadius: C.radius, padding: '14px 12px',
                  boxShadow: inCart ? `0 0 0 2.5px ${C.primary}, 0 8px 24px rgba(79,70,229,0.15)` : C.shadow,
                  border: `1.5px solid ${inCart ? C.primary : C.border}`,
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  opacity: isOut ? 0.45 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                }}
              >
                {/* Cart badge */}
                {inCart && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: C.primary, color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}>
                    {inCart.quantity}
                  </div>
                )}

                {/* Product image / avatar */}
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                  {p.image ? (
                    <img src={p.image} style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} alt={p.name} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${C.pLight}, rgba(79,70,229,0.2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      🍞
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 2, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.primary, marginBottom: 8, letterSpacing: '-0.03em' }}>{fmt(p.price)}</div>

                {/* Stock badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: isOut ? C.roseL : isSupplier ? C.pLight : C.emeraldL,
                  color: isOut ? C.rose : isSupplier ? C.primary : C.emerald,
                }}>
                  {isOut ? '❌ Out of Stock' : isSupplier ? `📦 ${p.stock} Mine` : `✅ ${p.stock} In Stock`}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.txt3 }}>
            <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>No products in this category</div>
          </div>
        )}

        {/* ── RECENT SALES ── */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: C.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={13} color={C.primary} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>Recent Sales (Today)</span>
            {todayTxns.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.txt3 }}>{todayTxns.length} transactions</span>
            )}
          </div>

          {todayTxns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 20px', background: C.white, borderRadius: C.radius, boxShadow: C.shadow, border: `1px solid ${C.border}` }}>
              <Zap size={28} style={{ margin: '0 auto 10px', opacity: 0.25, display: 'block', color: C.primary }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: C.txt3 }}>No sales recorded today yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayTxns.slice(0, 8).map((tx, i) => {
                const cust = customers.find(c => c.id === tx.customerId);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/receipt/${tx.id}`)}
                    style={{ background: C.white, borderRadius: 14, padding: '12px 14px', boxShadow: C.shadow, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: tx.type === 'Cash' ? C.emeraldL : C.roseL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {tx.type === 'Cash' ? <Banknote size={16} color={C.emerald} /> : <CreditCard size={16} color={C.rose} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cust?.name || 'Walk-in Customer'}
                      </div>
                      <div style={{ fontSize: 10, color: C.txt3, fontWeight: 600 }}>
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.ink }}>{fmt(tx.totalPrice)}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, display: 'inline-block', background: tx.type === 'Cash' ? C.emeraldL : C.roseL, color: tx.type === 'Cash' ? C.emerald : C.rose }}>
                        {tx.type}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── FLOATING CART BUTTON (when closed) ── */}
      <AnimatePresence>
        {cart.length > 0 && !cartOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCartOpen(true)}
            style={{
              position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${C.primary}, ${C.pDark})`,
              color: '#fff', border: 'none', borderRadius: 50,
              padding: '14px 28px', fontSize: 14, fontWeight: 900,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: C.shadowLg, zIndex: 800, fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            <ShoppingCart size={18} />
            View Cart ({cartCount} items) — {fmt(subtotal)}
            <ChevronUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CART PANEL ── */}
      <AnimatePresence>
        {cartOpen && cart.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900, backdropFilter: 'blur(2px)' }}
            />
            {/* Sheet */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: C.white, borderRadius: '28px 28px 0 0',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.18)',
                zIndex: 910, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                fontFamily: 'inherit',
              }}
            >
              {/* Handle + header */}
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)', margin: '0 auto 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: C.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={18} color={C.primary} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.ink }}>Your Cart</div>
                      <div style={{ fontSize: 11, color: C.txt3, fontWeight: 600 }}>{cartCount} items</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setCartOpen(false)}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={16} color={C.txt2} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
                {/* Cart items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: C.bg, borderRadius: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: C.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍞</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getProductName(item.productId)}</div>
                        <div style={{ fontSize: 11, color: C.txt3, fontWeight: 600 }}>{fmt(item.unitPrice)} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => updateCartQty(item.productId, -1)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                          −
                        </button>
                        <span style={{ width: 24, textAlign: 'center', fontWeight: 900, fontSize: 14, color: C.ink }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateCartQty(item.productId, 1)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: C.primary, border: 'none', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          +
                        </button>
                      </div>
                      <div style={{ minWidth: 52, textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>{fmt(item.quantity * item.unitPrice)}</div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.productId)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: C.roseL, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 size={13} color={C.rose} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Customer selector */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={13} color={C.txt2} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.txt2 }}>Customer</span>
                    </div>
                    <button type="button" onClick={() => setShowScanner(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.pLight, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 800, color: C.primary, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Camera size={12} /> Scan QR
                    </button>
                  </div>
                  <select
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.ink, background: C.bg, fontFamily: 'inherit', outline: 'none' }}
                  >
                    <option value="">— Walk-in Customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.debtBalance > 0 ? ` (Owes ${fmt(c.debtBalance)})` : ''}</option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div style={{ marginTop: 8, padding: '10px 14px', background: '#eef2ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #c7d2fe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={13} color='#6366f1' />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3730a3' }}>{selectedCustomer.loyaltyPoints || 0} pts (₦{((selectedCustomer.loyaltyPoints || 0) * 10).toLocaleString()})</span>
                      </div>
                      {maxPointsAvailable > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#4338ca' }}>
                          <input type="checkbox" checked={redeemPoints} onChange={e => setRedeemPoints(e.target.checked)} style={{ accentColor: '#4f46e5' }} />
                          Redeem
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment type */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.txt2, marginBottom: 8 }}>Payment Method</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Cash', 'Debt'] as const).map(type => (
                      <button key={type} type="button"
                        onClick={() => setPaymentType(type)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '11px', borderRadius: 12, border: `2px solid ${paymentType === type ? (type === 'Cash' ? C.emerald : C.rose) : C.border}`,
                          background: paymentType === type ? (type === 'Cash' ? C.emeraldL : C.roseL) : C.white,
                          color: paymentType === type ? (type === 'Cash' ? C.emerald : C.rose) : C.txt2,
                          fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}>
                        {type === 'Cash' ? <Banknote size={15} /> : <CreditCard size={15} />} {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.txt2, marginBottom: 8 }}>Discount (₦ or %)</div>
                  <input
                    type="text"
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value)}
                    placeholder="e.g. 500 or 10%"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.ink, background: C.bg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Debt warning */}
                {paymentType === 'Debt' && !customerId && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: C.roseL, borderRadius: 12, border: `1px solid rgba(225,29,72,0.15)`, fontSize: 12, fontWeight: 700, color: C.rose }}>
                    ⚠️ Please select a customer for Debt payment
                  </div>
                )}
                {customerId && paymentType === 'Cash' && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: C.amberL, borderRadius: 12, border: `1px solid rgba(217,119,6,0.15)`, fontSize: 12, fontWeight: 700, color: C.amber }}>
                    ⚠️ Customer selected — confirm this is not a DEBT sale?
                  </div>
                )}

                {/* Total breakdown */}
                <div style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)', borderRadius: 18, padding: '16px 18px', marginBottom: 18 }}>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 600 }}>
                      <span>Subtotal</span><span>{fmt(subtotal)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#fda4af', marginBottom: 6, fontWeight: 700 }}>
                      <span>Discount</span><span>− {fmt(discountAmount)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a5b4fc', marginBottom: 6, fontWeight: 700 }}>
                      <span>Points ({maxPointsToUse} pts)</span><span>− {fmt(pointsDiscount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', paddingTop: discountAmount > 0 ? 10 : 0, borderTop: discountAmount > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                    <span>Total</span><span>{fmt(totalAmount)}</span>
                  </div>
                  {customerId && pointsEarned > 0 && (
                    <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 700 }}>
                      +{pointsEarned} loyalty points earned
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button (fixed at bottom) */}
              <div style={{ padding: '0 20px 24px' }}>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={cart.length === 0 || totalAmount < 0 || (paymentType === 'Debt' && !customerId) || submitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                    background: (cart.length === 0 || (paymentType === 'Debt' && !customerId) || submitting)
                      ? 'rgba(0,0,0,0.1)'
                      : `linear-gradient(135deg, ${C.emerald}, #047857)`,
                    color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: (cart.length > 0 && !submitting) ? '0 8px 24px rgba(5,150,105,0.35)' : 'none',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <><RefreshCw size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <><BadgeCheck size={18} /> Complete Sale — {fmt(totalAmount)}</>
                  )}
                </motion.button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default Sales;
