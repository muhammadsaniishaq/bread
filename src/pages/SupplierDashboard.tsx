import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTransactionItems } from '../store/types';
import type { Transaction } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  AlertTriangle, Package, TrendingUp, TrendingDown,
  ShoppingCart, RefreshCw, Wallet, Users,
  CheckCircle2, Hourglass, XCircle, ChevronRight,
  BarChart3, ArrowUpRight, ArrowDownRight, Bell,
  Target, Zap, Star, ShoppingBag, Shield, ShieldCheck, ShieldAlert, X,
  Flame, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Premium Design Tokens ─── */
const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#e2e8f0',
  accent: '#4f46e5',
  accentLt: '#eef2ff',
  success: '#10b981',
  successLt: '#dcfce7',
  danger: '#ef4444',
  dangerLt: '#fee2e2',
  warn: '#f59e0b',
  warnLt: '#fef3c7',
  textSuccess: '#166534',
  textWarn: '#92400e',
  ink: '#0f172a',
  txt2: '#475569',
  txt3: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd: '0 10px 25px -5px rgba(0,0,0,0.08)',
  shadowLg: '0 20px 50px -12px rgba(0,0,0,0.1)',
  radius: '16px',
  radiusLg: '24px',
};

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
};

const STATUS: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  COMPLETED:        { label: 'Done',      color: T.success, bg: T.successLt,  Icon: CheckCircle2 },
  PENDING_STORE:    { label: 'Pending',   color: T.warn,    bg: T.warnLt,     Icon: Hourglass },
  PENDING_SUPPLIER: { label: 'Pending',   color: T.warn,    bg: T.warnLt,     Icon: Hourglass },
  CANCELLED:        { label: 'Cancelled', color: T.danger,  bg: T.dangerLt,   Icon: XCircle },
};

const getVerificationStatus = (c: any) => {
  if (c.is_verified) return { icon: ShieldCheck, color: T.success, label: 'Verified' };
  if (c.phone && c.pin) return { icon: Shield, color: T.warn, label: 'Tantancewa' };
  return { icon: ShieldAlert, color: T.danger, label: 'Unverified' };
};

export default function SupplierDashboard() {
  const { 
    transactions, products, customers, inventoryLogs, loading, 
    refreshData, getPersonalStock, recordSale, verifyCustomer,
    linkProfileToRecord, getSupplierDebt
  } = useAppContext();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing]   = useState(false);
  const [activeSection, setSection]   = useState<'overview'|'stock'|'activity'|'orders'>('overview');
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string|null>(null);
  const [actFilter, setActFilter]     = useState<'all'|'sales'|'payments'>('all');
  const [clock, setClock]             = useState(() => new Date());

  // Live clock ticker
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmt, setSettleAmt] = useState('');
  const [settling, setSettling] = useState(false);

  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id) ||
    customers.find(c => user?.email && c.email?.toLowerCase() === user.email.toLowerCase()) ||
    customers.find(c => (user as any)?.user_metadata?.phone && c.phone === (user as any).user_metadata.phone) ||
    customers.find(c => (user as any)?.user_metadata?.full_name && c.name?.toLowerCase() === (user as any).user_metadata.full_name.toLowerCase()),
  [customers, user]);

  // ── Auto-Link Profile if missing ──────────────────────────────────────────
  useEffect(() => {
    const checkLink = async () => {
      if (!user || role !== 'SUPPLIER') return;
      const linkedRecord = customers.find(c => c.profile_id === user.id);
      if (!linkedRecord) {
        const meta = (user as any).user_metadata || {};
        await linkProfileToRecord(user.id, user.email || '', meta.phone, meta.full_name);
      }
    };
    checkLink();
  }, [user, role, customers, linkProfileToRecord]);

  const mid = myAccount?.id || user?.id || '';

  /* ── My Customers (assigned) ────────────────────────────────────────────── */
  const myCustomers = useMemo(() =>
    customers.filter(c =>
      (user?.id && c.assignedSupplierId === user.id) ||
      (myAccount?.id && c.assignedSupplierId === myAccount.id)
    ), [customers, user, myAccount]);

  /* ── Stock per product ──────────────────────────────────────────────────── */
  const myStock = useMemo(() =>
    products.filter(p => p.active).map(p => {
      const stock = getPersonalStock(p.id);
      return { ...p, myStock: stock, warning: stock < 5 };
    }),
  [products, inventoryLogs, transactions, mid, getPersonalStock]);

  /* ── Transactions ───────────────────────────────────────────────────────── */
  const myTxns = useMemo(() =>
    transactions
      .filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions, myAccount, user]);

  const pendingTxns  = useMemo(() => myTxns.filter(t => t.status==='PENDING_STORE'||t.status==='PENDING_SUPPLIER'), [myTxns]);
  const completedTxns= useMemo(() => myTxns.filter(t => t.status==='COMPLETED'), [myTxns]);

  /* ── Time-based metrics ─────────────────────────────────────────────────── */
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = useMemo(() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }, []);

  const todaySales = useMemo(() =>
    myTxns.filter(t => t.status==='COMPLETED' && t.origin==='POS_SUPPLIER' && t.date.startsWith(today))
      .reduce((s,t) => s+t.totalPrice, 0), [myTxns, today]);

  const yesterdaySales = useMemo(() =>
    myTxns.filter(t => t.status==='COMPLETED' && t.origin==='POS_SUPPLIER' && t.date.startsWith(yesterday))
      .reduce((s,t) => s+t.totalPrice, 0), [myTxns, yesterday]);

  const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  const weekSales = useMemo(() => {
    const days: { label: string; val: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split('T')[0];
      const label = i===0 ? 'Today' : d.toLocaleDateString('en',{weekday:'short'});
      const val = myTxns.filter(t => t.status==='COMPLETED' && t.origin==='POS_SUPPLIER' && t.date.startsWith(ds)).reduce((s,t)=>s+t.totalPrice,0);
      days.push({ label, val });
    }
    return days;
  }, [myTxns]);

  const weekMax = Math.max(...weekSales.map(d => d.val), 1);

  const totalDispatched  = completedTxns.filter(t=>t.type!=='Return').reduce((s,t)=>s+t.totalPrice,0);
  const totalStock       = myStock.reduce((s,p)=>s+p.myStock,0);
  const myDebt           = getSupplierDebt(user?.id || '');
  const hasDebt          = myDebt > 0;
  const debtors          = myCustomers.filter(c=>c.debtBalance>0);
  const totalCustomerDebt= myCustomers.reduce((s,c)=>s+(c.debtBalance||0),0);

  /* ── Helper (must be before topProducts) ───────────────────────────────── */
  const getProductName = (id?: string) => products.find(p => p.id === id)?.name || 'Product';

  /* ── Top products by quantity sold ──────────────────────────────────────── */
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number }> = {};
    completedTxns.forEach(t => {
      getTransactionItems(t).forEach(item => {
        if (!map[item.productId]) map[item.productId] = { name: getProductName(item.productId), qty: 0, rev: 0 };
        map[item.productId].qty += item.quantity;
        map[item.productId].rev += item.quantity * (item.unitPrice || 0);
      });
    });
    return Object.entries(map).sort((a,b) => b[1].qty - a[1].qty).slice(0,4).map(([id, v]) => ({ id, ...v }));
  }, [completedTxns, products]);

  /* ── Performance tier ───────────────────────────────────────────────────── */
  const tier = useMemo(() => {
    const n = completedTxns.length;
    if (n >= 100) return { label: 'Platinum', emoji: '💎', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', min: 100 };
    if (n >= 50)  return { label: 'Gold',     emoji: '🥇', color: '#ca8a04', bg: 'rgba(202,138,4,0.12)',   min: 50 };
    if (n >= 20)  return { label: 'Silver',   emoji: '🥈', color: '#64748b', bg: 'rgba(100,116,139,0.12)', min: 20 };
    return               { label: 'Bronze',   emoji: '🥉', color: '#b45309', bg: 'rgba(180,83,9,0.12)',    min: 0 };
  }, [completedTxns.length]);

  const nextTierThreshold = tier.label === 'Bronze' ? 20 : tier.label === 'Silver' ? 50 : tier.label === 'Gold' ? 100 : 100;
  const tierProgress = Math.min(100, (completedTxns.length / nextTierThreshold) * 100);

  /* ── Monthly total + Revenue split ─────────────────────────────────────── */
  const monthStart = new Date(); monthStart.setDate(1);
  const monthSales = useMemo(() =>
    myTxns.filter(t => t.status==='COMPLETED' && t.origin==='POS_SUPPLIER' && new Date(t.date) >= monthStart)
      .reduce((s,t) => s+t.totalPrice, 0)
  , [myTxns]);

  const myEarnings   = totalDispatched * 0.1;   // supplier keeps 10%
  const bakeryShare  = totalDispatched * 0.9;   // bakery keeps 90%

  /* ── Sales streak with safety guard ──────────────────────────────────── */
  const salesStreak = useMemo(() => {
    let streak = 0;
    const check = new Date();
    for (let i = 0; i < 365; i++) {  // max 365 days safety guard
      const ds = check.toISOString().split('T')[0];
      const hasSale = myTxns.some(t => t.status === 'COMPLETED' && t.origin === 'POS_SUPPLIER' && t.date.startsWith(ds));
      if (!hasSale) break;
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }, [myTxns]);

  /* ── Greeting ───────────────────────────────────────────────────────────── */
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning',   emoji: '🌅' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
    return              { text: 'Good Evening',   emoji: '🌙' };
  }, []);

  const handleRefresh = async () => { 
    setRefreshing(true); 
    await Promise.all([refreshData(), fetchCustomerOrders()]); 
    setRefreshing(false); 
  };

  const handleSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAccount) return;
    const amt = parseFloat(settleAmt);
    if (!amt || amt <= 0) return;

    setSettling(true);
    try {
      const newDebt = Math.max(0, (myAccount.debtBalance || 0) - amt);
      await supabase.from('customers').update({ debt_balance: newDebt }).eq('id', myAccount.id);
      
      const tx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        customer_id: myAccount.id,
        seller_id: user?.id,
        total_price: amt,
        type: 'Payment',
        status: 'COMPLETED',
        origin: 'SUPPLIER_SELF_REMIT'
      };
      await supabase.from('transactions').insert([tx]);
      alert(`Successfully remitted ₦${amt.toLocaleString()} to store.`);
      setSettleOpen(false);
      setSettleAmt('');
      handleRefresh();
    } catch(err: any) {
      alert("Error: " + err.message);
    }
    setSettling(false);
  };

  const fetchCustomerOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from('orders')
      .select('*, customers(id, name, location, phone)')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setCustomerOrders(data);
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, [user]);

  const processOrder = async (orderId: string) => {
    const order = customerOrders.find(o => o.id === orderId);
    if (!order) return;

    // Check personal stock first
    const orderItems = order.items || [];
    for (const it of orderItems) {
      const avail = getPersonalStock(it.productId);
      if (avail < it.quantity) {
        alert(`Insufficient Stock: You only have ${avail} units of ${getProductName(it.productId)}. Please request more from the store.`);
        return;
      }
    }

    if (!confirm(`Process this order for ${order.total_price.toLocaleString()}?`)) return;

    // Convert order to a Sale Transaction
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerId: order.customer_id,
      items: orderItems, 
      totalPrice: order.total_price,
      type: 'Debt', 
      status: 'COMPLETED',
      origin: 'POS_SUPPLIER',
      sellerId: user?.id
    };

    try {
      await recordSale(tx);
      // Mark original order as DELIVERED
      await supabase.from('orders').update({ status: 'DELIVERED' }).eq('id', orderId);
      await fetchCustomerOrders();
      alert("Order delivered successfully! Stock and ledger updated.");
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  };

  const firstName = (myAccount?.name || user?.email || 'Supplier').split(' ')[0];

  // Pre-compute filtered transactions (avoids IIFE in JSX)
  const filteredTxns = useMemo(() => {
    return myTxns
      .filter(tx => {
        if (actFilter === 'sales')    return tx.type !== 'Payment';
        if (actFilter === 'payments') return tx.type === 'Payment';
        return true;
      })
      .slice(0, 20);
  }, [myTxns, actFilter]);

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <AnimatedPage>
      <div style={{ minHeight:'100vh', background: T.bg, paddingBottom:'110px', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* ══ PREMIUM HERO WITH ANIMATED GLASSMORPHISM ══ */}
        <div style={{ background: T.ink, padding: '48px 20px 64px', position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background Glows */}
          <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-150px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', bottom: '-100px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          {/* Subtle grid overlay for texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none', opacity: 0.5 }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Top Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {greeting.text} {greeting.emoji}
                </h1>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {firstName}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <ShieldCheck size={10} color="#10b981" />
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Verified</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {/* Live Clock */}
                <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                  {clock.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {pendingTxns.length > 0 && (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.warn, boxShadow: `0 0 12px ${T.warn}` }}
                    />
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleRefresh}
                    style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                      <RefreshCw size={18} color="#fff" />
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Premium Debt Card inside Hero */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: hasDebt ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${hasDebt ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   My Debt Balance
                   {hasDebt && <button onClick={() => setSettleOpen(true)} style={{ background: T.danger, color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em', boxShadow: `0 4px 12px ${T.danger}60` }}>PAY NOW</button>}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: hasDebt ? '#fca5a5' : '#6ee7b7', letterSpacing: '-0.02em', marginTop: '4px' }}>
                  {fmt(myDebt)}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: hasDebt ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} color={hasDebt ? '#fca5a5' : '#6ee7b7'} />
              </div>
            </motion.div>

            {/* NEW FEATURE: Daily Target Progress Widget (Glassmorphism) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={12} color={T.success} /> Daily Sales Target
                 </div>
                 <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>
                    {Math.min(100, Math.round((todaySales / 100000) * 100))}%
                 </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                 <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, (todaySales / 100000) * 100)}%` }}
                    transition={{ duration: 1.5, type: 'spring' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '4px' }}
                 />
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                 Goal: ₦100,000
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '-20px', position: 'relative', zIndex: 20 }}>

          {/* ══ 4 STAT BENTO ══ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'Today Sales',   val: fmt(todaySales),          icon: Wallet,     color: T.success, bg: T.successLt,   trend: salesChange, grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
              { label: 'My Stock',      val: `${totalStock} units`,    icon: Package,    color: T.accent,  bg: T.accentLt,    trend: null, grad: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' },
              { label: 'Dispatched',    val: fmt(totalDispatched),     icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', trend: null, grad: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
              { label: 'Pending',       val: String(pendingTxns.length), icon: Hourglass, color: T.warn,   bg: T.warnLt,      trend: null, grad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
            ].map((s, i) => (
              <motion.div key={i} whileTap={{ scale: 0.95 }} style={{ background: T.surface, borderRadius: '24px', padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                {/* Subtle gradient strip at the bottom of each card for decoration */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: s.grad, opacity: 0.7 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                    <s.icon size={18} strokeWidth={2.5} />
                  </div>
                  {s.trend !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '8px', background: s.trend >= 0 ? T.successLt : T.dangerLt, color: s.trend >= 0 ? T.success : T.danger, fontSize: '10px', fontWeight: 800 }}>
                      {s.trend >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                      {Math.abs(s.trend).toFixed(0)}%
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* ══ LOW-STOCK ALERT STRIP ══ */}
          {myStock.some(p => p.warning) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ background: T.dangerLt, border: `1px solid ${T.danger}40`, borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
              <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <AlertTriangle size={20} color={T.danger} />
              </motion.div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: T.danger, whiteSpace: 'nowrap' }}>Low Stock:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                {myStock.filter(p => p.warning).map(p => (
                  <span key={p.id} style={{ background: T.danger, color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {p.name} ({p.myStock})
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ STREAK BANNER ══ */}
          {salesStreak > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '28px' }}>🔥</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{salesStreak}-Day Sales Streak!</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Keep it up — you're on fire!</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{salesStreak}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Days</div>
              </div>
            </motion.div>
          )}

          {/* ══ SECTION TABS WITH ICONS ══ */}
          <div style={{ background: T.surface2, borderRadius: '16px', padding: '6px', display: 'flex', gap: '4px' }}>
            {([
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'stock',    label: 'Stock',    icon: '📦' },
              { id: 'orders',   label: 'Orders',   icon: '🛒' },
              { id: 'activity', label: 'History',  icon: '📋' },
            ] as const).map(s => (
              <button key={s.id} onClick={() => setSection(s.id as any)}
                style={{ flex: 1, padding: '10px 4px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontSize: '10px', fontWeight: 800, transition: 'all 0.2s',
                  background: activeSection === s.id ? T.ink : 'transparent',
                  color: activeSection === s.id ? '#fff' : T.txt3,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════ OVERVIEW ══════════ */}
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Quick Actions Bento */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/sales')}
                    style={{ background: T.accent, border: 'none', borderRadius: '24px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: `0 8px 24px ${T.accentLt}`, alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={20} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>New Sale</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Record transaction</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/inventory')}
                    style={{ background: T.ink, border: 'none', borderRadius: '24px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: T.shadowMd, alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={20} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Stock Request</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Get bread from store</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customers')}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '24px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: T.shadow, alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color={T.success} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>My Clients</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{myCustomers.length} assigned</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/expenses')}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '24px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: T.shadow, alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.warnLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={20} color={T.warn} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Spend Tracker</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>View expenses</div>
                    </div>
                  </motion.button>
                </motion.div>

                {/* Weekly Sales Chart */}
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: T.surface, borderRadius: '28px', padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                        <BarChart3 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Weekly Sales</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>Last 7 days performance</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: T.accent }}>{fmt(weekSales.reduce((s,d)=>s+d.val,0))}</div>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>7-day total</div>
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                    {weekSales.map((d, i) => {
                      const pct = weekMax > 0 ? (d.val / weekMax) * 100 : 0;
                      const isToday = i === 6;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', background: T.surface2, borderRadius: '6px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 5)}%` }}
                              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                              style={{ width: '100%', borderRadius: '6px', background: isToday ? T.accent : T.txt3 }}
                            />
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: isToday ? 900 : 700, color: isToday ? T.accent : T.txt3, textAlign: 'center' }}>{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* My Customers Debt Summary */}
                {myCustomers.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show"
                    style={{ background: T.surface, borderRadius: '28px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.surface2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.dangerLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.danger }}>
                          <Users size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Client Debt Status</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{debtors.length} of {myCustomers.length} clients have debt</div>
                        </div>
                      </div>
                      {totalCustomerDebt > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: T.danger }}>{fmt(totalCustomerDebt)}</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Total Owed</div>
                        </div>
                      )}
                    </div>
                    {myCustomers.slice(0,4).map((c, i) => (
                      <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < Math.min(myCustomers.length,4)-1 ? `1px solid ${T.surface2}` : 'none', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: (c.debtBalance||0)>0 ? T.dangerLt : T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: (c.debtBalance||0)>0 ? T.danger : T.success }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{c.name}</div>
                               {(() => {
                                  const v = getVerificationStatus(c);
                                  return <v.icon size={14} color={v.color} />;
                               })()}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3, marginTop: '2px' }}>{c.phone || 'No phone'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="no-nav" onClick={e=>e.stopPropagation()}>
                          {c.debtBalance > 0 && (
                            <span style={{ fontSize: '14px', fontWeight: 900, color: T.danger }}>{fmt(c.debtBalance)}</span>
                          )}
                          <div 
                            style={{ 
                              width: '34px', height: '18px', borderRadius: '10px', 
                              background: c.is_verified ? T.success : T.border, 
                              position: 'relative', cursor: verifyingId === c.id ? 'wait' : 'pointer', 
                              transition: 'all 0.3s'
                            }}
                            onClick={async () => {
                              if (verifyingId === c.id) return;
                              setVerifyingId(c.id);
                              try {
                                await verifyCustomer(c.id, !c.is_verified);
                              } catch (err: any) {
                                console.error('Verification failed:', err);
                                alert(`Verification Failed: ${err.message}`);
                              } finally {
                                setVerifyingId(null);
                              }
                            }}
                          >
                            {verifyingId === c.id ? (
                               <div style={{ position:'absolute', top:2, left: c.is_verified ? 2 : 18, width:12, height:12, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                            ) : (
                               <motion.div 
                                 animate={{ x: c.is_verified ? 16 : 2 }} 
                                 style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', marginTop: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} 
                               />
                            )}
                          </div>
                          <ChevronRight size={16} color={T.txt3} />
                        </div>
                      </div>
                    ))}
                    {myCustomers.length > 4 && (
                      <div onClick={() => navigate('/customers')}
                        style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: T.accent, cursor: 'pointer', background: T.surface2 }}>
                        View all {myCustomers.length} clients →
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Pending Alert */}
                <AnimatePresence>
                  {pendingTxns.length > 0 && (
                    <motion.div key="pa" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ background: T.warnLt, border: `1px solid ${T.warn}`, borderRadius: '24px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => navigate('/inventory')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.div animate={{ rotate: [0, -5, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
                          style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.warn }}>
                          <Bell size={24} />
                        </motion.div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: T.textWarn }}>{pendingTxns.length} Pending Request{pendingTxns.length>1?'s':''}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: T.textWarn, opacity: 0.8 }}>Awaiting store keeper approval</div>
                        </div>
                      </div>
                      <ChevronRight size={18} color={T.warn} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Performance Badge */}
                {completedTxns.length >= 10 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show"
                    style={{ background: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '24px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Star size={24} color="#ca8a04" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#78350f' }}>Active Performer 🏆</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginTop: '2px' }}>{completedTxns.length} completed transactions — excellent work!</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══════════ EARNINGS BREAKDOWN ══════════ */}
            {activeSection === 'overview' && (
              <motion.div key="earnings" variants={fadeUp} initial="hidden" animate="show"
                style={{ background: T.surface, borderRadius: '28px', padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} color="#8b5cf6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Earnings Breakdown</div>
                    <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Sales performance overview</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Today',      val: todaySales,      color: T.success,  bg: T.successLt },
                    { label: 'Yesterday',  val: yesterdaySales,  color: T.accent,   bg: T.accentLt },
                    { label: 'This Month', val: monthSales,      color: '#8b5cf6',  bg: 'rgba(139,92,246,0.1)' },
                    { label: 'All Time',   val: totalDispatched, color: T.ink,      bg: T.surface2 },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: row.bg, borderRadius: '14px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.txt2 }}>{row.label}</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: row.color }}>{fmt(row.val)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ PERFORMANCE TIER ══════════ */}
            {activeSection === 'overview' && (
              <motion.div key="tier" variants={fadeUp} initial="hidden" animate="show"
                style={{ background: tier.bg, border: `1px solid ${tier.color}40`, borderRadius: '28px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '36px', lineHeight: 1 }}>{tier.emoji}</div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance Tier</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: T.ink }}>{tier.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: tier.color }}>{completedTxns.length}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>Transactions</div>
                  </div>
                </div>
                {tier.label !== 'Platinum' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Progress to next tier</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: tier.color }}>{nextTierThreshold - completedTxns.length} more needed</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${tierProgress}%` }}
                        transition={{ duration: 1.2, type: 'spring' }}
                        style={{ height: '100%', background: tier.color, borderRadius: '8px' }} />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══════════ STOCK ══════════ */}
            {activeSection === 'stock' && (
              <motion.div key="stock" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: T.surface, borderRadius: '28px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.surface2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}><Package size={18}/></div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>My Stock Levels</div>
                    </div>
                    <div style={{ background: T.accentLt, color: T.accent, padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                      {totalStock} units total
                    </div>
                  </div>
                  {myStock.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: T.txt3 }}>
                      <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>No stock data yet</div>
                      <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>Request stock from the store to begin.</div>
                    </div>
                  ) : myStock.map((p, i) => {
                    const maxStock = 100;
                    const pct = Math.min((p.myStock / maxStock) * 100, 100);
                    return (
                      <div key={p.id} style={{ padding: '20px 24px', borderBottom: i < myStock.length-1 ? `1px solid ${T.surface2}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: p.warning ? T.dangerLt : T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.warning
                                ? <AlertTriangle size={20} color={T.danger} />
                                : <Zap size={20} color={T.accent} />
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{p.name}</div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>₦{p.price} per unit</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: p.warning ? T.danger : T.ink }}>{p.myStock}</div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>units</div>
                          </div>
                        </div>
                        {/* Stock bar */}
                        <div style={{ background: T.surface2, borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 25 }}
                            style={{ height: '100%', borderRadius: '8px', background: p.warning ? T.danger : T.accent }}
                          />
                        </div>
                        {p.warning && (
                          <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 800, color: T.danger, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={12} /> Low stock — request more from store
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
                {/* Top Products in Stock Tab */}
                {topProducts.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show"
                    style={{ background: T.surface, borderRadius: '28px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.surface2}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.warnLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={18} color={T.warn} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Top Selling Products</div>
                        <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Based on all your sales</div>
                      </div>
                    </div>
                    {topProducts.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: i < topProducts.length-1 ? `1px solid ${T.surface2}` : 'none', gap: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: i===0?'#fef9c3':i===1?T.surface2:T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: i===0?'#ca8a04':T.txt3, flexShrink: 0 }}>
                          {i+1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: T.txt3, marginTop: '2px' }}>{fmt(p.rev)} revenue</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: T.accent }}>{p.qty}</div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>units</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/inventory')}
                  style={{ width: '100%', background: T.ink, border: 'none', borderRadius: '24px', padding: '20px', color: '#fff', fontSize: '15px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: T.shadowMd }}>
                  <Package size={20} /> Request Stock from Store
                </motion.button>
              </motion.div>
            )}

            {/* ══════════ ORDERS ══════════ */}
            {activeSection === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: T.surface, borderRadius: '28px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.surface2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}><ShoppingBag size={18}/></div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Assigned Orders</div>
                    </div>
                    <div style={{ background: T.accentLt, color: T.accent, padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                      {customerOrders.filter(o => o.status === 'PENDING').length} new
                    </div>
                  </div>

                  {customerOrders.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: T.txt3 }}>
                      <ShoppingBag size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>No orders assigned to you</div>
                    </div>
                  ) : customerOrders.map((o, i) => (
                    <div key={o.id} style={{ padding: '20px 24px', borderBottom: i < customerOrders.length-1 ? `1px solid ${T.surface2}` : 'none' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                             <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{o.customers?.name || 'Customer'}</div>
                             <div style={{ fontSize: '12px', color: T.txt3, fontWeight: 700, marginTop: '2px' }}>Loc: {o.customers?.location || 'Unknown'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: '18px', fontWeight: 900, color: T.accent }}>{fmt(o.total_price)}</div>
                             <div style={{ fontSize: '10px', fontWeight: 800, color: o.status==='PENDING' ? T.warn : T.success, textTransform: 'uppercase', marginTop: '4px' }}>{o.status === 'PENDING' ? 'New Order' : 'Delivered'}</div>
                          </div>
                       </div>
                       
                       <div style={{ background: T.surface2, padding: '12px 16px', borderRadius: '16px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px' }}>Items Ordered</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>
                             {o.details?.map((it: any) => `${it.quantity}x ${products.find(px=>px.id===it.productId)?.name}`).join(', ') || 'N/A'}
                          </div>
                       </div>

                       {o.status === 'PENDING' && (
                         <motion.button whileTap={{ scale: 0.97 }} onClick={() => processOrder(o.id)}
                           style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: T.success, color: '#fff', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 12px ${T.successLt}` }}>
                            <CheckCircle2 size={18} /> Approve & Deliver
                         </motion.button>
                       )}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ══════════ ACTIVITY ══════════ */}
            {activeSection === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: T.surface, borderRadius: '28px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.surface2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
                        <TrendingUp size={18}/>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Transaction History</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt3 }}>{myTxns.length} total</span>
                  </div>
                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: `1px solid ${T.surface2}`, overflowX: 'auto' }}>
                    {(['all','sales','payments'] as const).map(f => (
                      <button key={f} onClick={() => setActFilter(f)}
                        style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800, textTransform: 'capitalize', whiteSpace: 'nowrap', background: actFilter === f ? T.ink : T.surface2, color: actFilter === f ? '#fff' : T.txt3 }}>
                        {f === 'all' ? 'All' : f === 'sales' ? '🛒 Sales' : '💳 Payments'}
                      </button>
                    ))}
                  </div>

                  {myTxns.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: T.txt3 }}>
                      <TrendingDown size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>No transactions yet</div>
                    </div>
                  ) : filteredTxns.map((tx, i, arr) => {
                    const s = STATUS[tx.status||'COMPLETED'] || STATUS['COMPLETED'];
                    const items = getTransactionItems(tx);
                    const label = items.length > 0
                      ? `${items[0].quantity}× ${getProductName(items[0].productId)}`
                      : tx.type==='Payment' ? 'Debt Payment' : 'Transaction';
                    const d = new Date(tx.date);
                    const isToday2 = tx.date.startsWith(today);
                    return (
                      <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < arr.length-1 ? `1px solid ${T.surface2}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                            <s.Icon size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{label}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, marginTop: '4px' }}>
                              {isToday2 ? `Today ${d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}` : d.toLocaleDateString('en-NG',{day:'numeric',month:'short'})}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: s.color, background: s.bg, padding: '4px 8px', borderRadius: '6px', marginTop: '4px', display: 'inline-block', textTransform: 'uppercase' }}>
                            {s.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                {/* Revenue Split Card in Activity */}
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: T.surface, borderRadius: '28px', padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                      <Wallet size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Revenue Split</div>
                      <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Your share of all dispatched goods</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: T.successLt, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: T.success, textTransform: 'uppercase', marginBottom: '4px' }}>My Cut (10%)</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: T.success }}>{fmt(myEarnings)}</div>
                    </div>
                    <div style={{ background: T.accentLt, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: T.accent, textTransform: 'uppercase', marginBottom: '4px' }}>Bakery (90%)</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: T.accent }}>{fmt(bakeryShare)}</div>
                    </div>
                  </div>
                  <div style={{ height: '10px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: '10%', background: T.success }} />
                    <div style={{ width: '90%', background: T.accent }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.success }}>10% You</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.accent }}>90% Bakery</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: T.txt3, fontWeight: 700 }}>Syncing data...</div>
          )}
        </div>
      </div>

      {/* MODAL: SETTLE DEBT */}
      <AnimatePresence>
        {settleOpen && myAccount && (
          <div style={{position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', padding: '20px'}}>
            <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.95, opacity: 0}}
              style={{background: T.surface, width: '100%', maxWidth: '380px', borderRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowLg}}>
              <div style={{padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <h3 style={{margin: 0, fontSize: '18px', fontWeight: 900, color: T.ink}}>Remit Payment</h3>
                 <button onClick={()=>setSettleOpen(false)} style={{background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.txt2}}><X size={16}/></button>
              </div>
              <div style={{padding: '24px'}}>
                 <div style={{background: T.dangerLt, padding: '16px', borderRadius: '16px', marginBottom: 20, border: `1px solid ${T.danger}30`}}>
                    <div style={{fontSize: '11px', color: T.danger, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6}}>Current Outstanding Debt</div>
                    <div style={{fontSize: '24px', color: T.danger, fontWeight: 900}}>{fmt(myDebt)}</div>
                 </div>
                 <form onSubmit={handleSettleDebt} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                    <div>
                       <label style={{fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Amount Paid to Store (₦)</label>
                       <input type="number" style={{padding: '16px', borderRadius: '14px', border: `1px solid ${T.border}`, background: T.surface, fontSize: '16px', fontWeight: 800, color: T.ink, width: '100%', boxSizing: 'border-box'}} placeholder="e.g. 50000" value={settleAmt} onChange={e=>setSettleAmt(e.target.value)} required autoFocus/>
                    </div>
                    <button type="submit" disabled={settling} style={{background: T.ink, color: '#fff', border: 'none', borderRadius: '14px', padding: '16px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', marginTop: 8}}>
                      {settling ? 'Processing...' : 'Confirm Remittance'}
                    </button>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
}
