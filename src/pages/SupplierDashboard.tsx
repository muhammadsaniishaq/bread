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
  Target, Zap, Star, ShoppingBag, Shield, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
};

const STATUS: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  COMPLETED:        { label: 'Done',      color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: CheckCircle2 },
  PENDING_STORE:    { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Hourglass },
  PENDING_SUPPLIER: { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Hourglass },
  CANCELLED:        { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: XCircle },
};

const getVerificationStatus = (c: any) => {
  if (c.is_verified) return { icon: ShieldCheck, color: '#10b981', label: 'Verified' };
  if (c.phone && c.pin) return { icon: Shield, color: '#f59e0b', label: 'Tantancewa' };
  return { icon: ShieldAlert, color: '#ef4444', label: 'Unverified' };
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }> = ({ children, style, onClick }) => (
  <motion.div 
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={onClick}
    style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.05)',
      borderRadius: '24px',
      padding: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      ...style
    }}
  >
    {children}
  </motion.div>
);

export default function SupplierDashboard() {
  const { transactions, products, customers, inventoryLogs, loading, refreshData, getPersonalStock, recordSale } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing]   = useState(false);
  const [activeSection, setSection]   = useState<'overview'|'stock'|'activity'|'orders'>('overview');
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  /* ── My Account ─────────────────────────────────────────────────────────── */
  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

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
  const hasDebt          = (myAccount?.debtBalance||0) > 0;
  const debtors          = myCustomers.filter(c=>c.debtBalance>0);
  const totalCustomerDebt= myCustomers.reduce((s,c)=>s+(c.debtBalance||0),0);

  /* ── Greeting ───────────────────────────────────────────────────────────── */
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning',   emoji: '🌅', grad: 'linear-gradient(135deg,#f97316,#fbbf24)' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '☀️', grad: 'linear-gradient(135deg,#6366f1,#60a5fa)' };
    return              { text: 'Good Evening',   emoji: '🌙', grad: 'linear-gradient(135deg,#9333ea,#818cf8)' };
  }, []);

  const handleRefresh = async () => { 
    setRefreshing(true); 
    await Promise.all([refreshData(), fetchCustomerOrders()]); 
    setRefreshing(false); 
  };

  const fetchCustomerOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from('orders')
      .select('*, customers(name, location)')
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

    if (!confirm(`Process this order for ${order.total_price.toLocaleString()}?`)) return;

    // Convert order to a Sale Transaction
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerId: order.customer_id,
      items: order.details || [], 
      totalPrice: order.total_price,
      type: 'Debt', // Explicitly typed as 'Debt' to match the Transaction interface literals
      status: 'COMPLETED',
      origin: 'POS_SUPPLIER',
      sellerId: user?.id
    };

    try {
      await recordSale(tx);
      // Mark original order as COMPLETED
      await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', orderId);
      await fetchCustomerOrders();
      alert("Order processed successfully and stock updated!");
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  };
  const getProductName = (id?: string) => products.find(p=>p.id===id)?.name||'Product';

  const firstName = (myAccount?.name || user?.email || 'Supplier').split(' ')[0];

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <AnimatedPage>
      <div style={{ minHeight:'100vh', background:'#f0f2f8', paddingBottom:'110px', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* ══ HERO ══ */}
        <div style={{ background:'linear-gradient(158deg,#1a0533 0%,#3b0764 35%,#4f46e5 75%,#6366f1 100%)', padding:'48px 20px 90px', position:'relative', overflow:'hidden' }}>
          {/* BG orbs */}
          <div style={{ position:'absolute', top:'-80px', right:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-100px', left:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle,rgba(79,70,229,0.3) 0%,transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'40px', left:'40%', width:'150px', height:'150px', borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)', pointerEvents:'none' }}/>

          <div style={{ position:'relative', zIndex:10 }}>
            {/* Top row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
              <div>
                <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'5px' }}>
                  {new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <h1 style={{ fontSize:'22px', fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.02em', lineHeight:1.2 }}>
                  <span style={{ background:greeting.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    {greeting.text}
                  </span>{' '}{greeting.emoji}
                </h1>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {firstName}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: '6px' }}>
                    <ShieldCheck size={10} color="#10b981" />
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Fully Verified</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                {pendingTxns.length > 0 && (
                  <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:2 }}
                    style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 12px rgba(251,191,36,0.7)' }}
                  />
                )}
                <motion.button whileTap={{ scale:0.88 }} onClick={handleRefresh}
                  style={{ width:'42px', height:'42px', borderRadius:'14px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration:1, repeat:refreshing?Infinity:0, ease:'linear' }}>
                    <RefreshCw size={17} color="#fff" />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Debt / Balance Pill */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{ background: hasDebt?'rgba(239,68,68,0.18)':'rgba(16,185,129,0.18)', border:`1px solid ${hasDebt?'rgba(239,68,68,0.35)':'rgba(16,185,129,0.35)'}`, borderRadius:'20px', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>My Debt Balance</div>
                <div style={{ fontSize:'30px', fontWeight:900, color: hasDebt?'#fca5a5':'#6ee7b7', letterSpacing:'-0.02em', lineHeight:1.1 }}>
                  {fmt(myAccount?.debtBalance||0)}
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', fontWeight:600, marginTop:'3px' }}>
                  {hasDebt ? 'Settle with store to reduce balance' : 'No outstanding debt — great! 🎉'}
                </div>
              </div>
              <div style={{ width:'52px', height:'52px', borderRadius:'18px', background: hasDebt?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={24} color={hasDebt?'#fca5a5':'#6ee7b7'} />
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ padding:'0 16px', marginTop:'-48px', position:'relative', zIndex:20 }}>

          {/* ══ 4 STAT BENTO ══ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'12px' }}>
            {[
              { label:'Today Sales',   val:fmt(todaySales),          icon:Wallet,     color:'#10b981', bg:'rgba(16,185,129,0.1)',   trend: salesChange },
              { label:'My Stock',      val:`${totalStock} units`,    icon:Package,    color:'#4f46e5', bg:'rgba(79,70,229,0.1)',    trend: null },
              { label:'Dispatched',    val:fmt(totalDispatched),     icon:TrendingUp, color:'#8b5cf6', bg:'rgba(139,92,246,0.1)',   trend: null },
              { label:'Pending',       val:String(pendingTxns.length), icon:Hourglass, color:'#f59e0b', bg:'rgba(245,158,11,0.1)', trend: null },
            ].map((s,i) => (
              <motion.div key={i} whileTap={{ scale:0.97 }}
                style={{ background:'#fff', borderRadius:'22px', padding:'16px', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>
                    <s.icon size={18} strokeWidth={2.2} />
                  </div>
                  {s.trend !== null && (
                    <div style={{ display:'flex', alignItems:'center', gap:'3px', padding:'3px 7px', borderRadius:'8px', background: s.trend>=0?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: s.trend>=0?'#10b981':'#ef4444', fontSize:'10px', fontWeight:800 }}>
                      {s.trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                      {Math.abs(s.trend).toFixed(0)}%
                    </div>
                  )}
                </div>
                <div style={{ fontSize:'18px', fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em', lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'4px' }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* ══ SECTION TABS ══ */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderRadius:'16px', padding:'4px', display:'flex', gap:'4px', marginBottom:'12px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            {(['overview','stock','orders','activity'] as const).map(s => (
              <button key={s} onClick={() => setSection(s)}
                style={{ flex:1, padding:'9px 4px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', transition:'all 0.2s', background: activeSection===s?'#4f46e5':'transparent', color: activeSection===s?'#fff':'#94a3b8' }}>
                {s === 'overview' ? 'Overview' : s === 'stock' ? 'Stock' : s === 'orders' ? 'Orders' : 'Activity'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════ OVERVIEW ══════════ */}
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

                {/* Weekly Sales Chart */}
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background:'#fff', borderRadius:'24px', padding:'20px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(79,70,229,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4f46e5' }}>
                        <BarChart3 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>Weekly Sales</div>
                        <div style={{ fontSize:'10px', fontWeight:600, color:'#94a3b8' }}>Last 7 days performance</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'16px', fontWeight:900, color:'#4f46e5' }}>{fmt(weekSales.reduce((s,d)=>s+d.val,0))}</div>
                      <div style={{ fontSize:'9px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>7-day total</div>
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'80px' }}>
                    {weekSales.map((d, i) => {
                      const pct = weekMax > 0 ? (d.val / weekMax) * 100 : 0;
                      const isToday = i === 6;
                      return (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%' }}>
                          <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end' }}>
                            <motion.div
                              initial={{ height:0 }} animate={{ height:`${Math.max(pct,4)}%` }}
                              transition={{ delay: i*0.06, type:'spring', stiffness:200, damping:20 }}
                              style={{ width:'100%', borderRadius:'6px 6px 4px 4px', background: isToday ? 'linear-gradient(180deg,#4f46e5,#6366f1)' : 'rgba(79,70,229,0.15)', boxShadow: isToday?'0 4px 12px rgba(79,70,229,0.3)':'none' }}
                            />
                          </div>
                          <div style={{ fontSize:'8px', fontWeight: isToday?900:600, color: isToday?'#4f46e5':'#94a3b8', textAlign:'center' }}>{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                  <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate('/sales')}
                    style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)', border:'none', borderRadius:'22px', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 8px 28px rgba(79,70,229,0.35)', alignItems:'flex-start' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ShoppingCart size={18} color="#fff" />
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#fff' }}>New Sale</div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Record a transaction</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate('/inventory')}
                    style={{ background:'linear-gradient(135deg,#8b5cf6,#a78bfa)', border:'none', borderRadius:'22px', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 8px 28px rgba(139,92,246,0.35)', alignItems:'flex-start' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Package size={18} color="#fff" />
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#fff' }}>Request Stock</div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Get bread from store</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate('/customers')}
                    style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'22px', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', alignItems:'flex-start' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Users size={18} color="#10b981" />
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>My Clients</div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:'#94a3b8' }}>{myCustomers.length} assigned</div>
                    </div>
                  </motion.button>

                  <motion.button whileTap={{ scale:0.95 }} onClick={() => navigate('/expenses')}
                    style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'22px', padding:'18px', cursor:'pointer', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', alignItems:'flex-start' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Target size={18} color="#f59e0b" />
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>Spend Tracker</div>
                      <div style={{ fontSize:'10px', fontWeight:600, color:'#94a3b8' }}>View expenses</div>
                    </div>
                  </motion.button>
                </motion.div>

                {/* My Customers Debt Summary */}
                {myCustomers.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show"
                    style={{ background:'#fff', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)', marginBottom:'12px' }}>
                    <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444' }}>
                          <Users size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>Client Debt Status</div>
                          <div style={{ fontSize:'10px', fontWeight:600, color:'#94a3b8' }}>{debtors.length} of {myCustomers.length} clients have debt</div>
                        </div>
                      </div>
                      {totalCustomerDebt > 0 && (
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'15px', fontWeight:900, color:'#ef4444' }}>{fmt(totalCustomerDebt)}</div>
                          <div style={{ fontSize:'9px', fontWeight:700, color:'#94a3b8' }}>total owed</div>
                        </div>
                      )}
                    </div>
                    {myCustomers.slice(0,4).map((c, i) => (
                      <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom: i < Math.min(myCustomers.length,4)-1 ? '1px solid rgba(0,0,0,0.04)' : 'none', cursor:'pointer' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'12px', background: (c.debtBalance||0)>0?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color: (c.debtBalance||0)>0?'#ef4444':'#10b981' }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                               <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a' }}>{c.name}</div>
                               {(() => {
                                  const v = getVerificationStatus(c);
                                  return <v.icon size={12} color={v.color} />;
                               })()}
                            </div>
                            <div style={{ fontSize:'10px', fontWeight:600, color:'#94a3b8' }}>{c.phone || 'No phone'}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ fontSize:'13px', fontWeight:900, color: c.is_verified ? ((c.debtBalance||0)>0?'#ef4444':'#10b981') : '#94a3b8' }}>
                            {!c.is_verified ? 'Unverified' : ((c.debtBalance||0)>0 ? fmt(c.debtBalance) : '✓ Clear')}
                          </span>
                          <ChevronRight size={14} color="#94a3b8" />
                        </div>
                      </div>
                    ))}
                    {myCustomers.length > 4 && (
                      <div onClick={() => navigate('/customers')}
                        style={{ padding:'12px 20px', textAlign:'center', fontSize:'12px', fontWeight:800, color:'#4f46e5', cursor:'pointer', borderTop:'1px solid rgba(0,0,0,0.04)' }}>
                        View all {myCustomers.length} clients →
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Pending Alert */}
                <AnimatePresence>
                  {pendingTxns.length > 0 && (
                    <motion.div key="pa" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                      style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'20px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', cursor:'pointer' }}
                      onClick={() => navigate('/inventory')}>
                      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                        <motion.div animate={{ rotate:[0,-5,5,-5,0] }} transition={{ repeat:Infinity, duration:2.5 }}
                          style={{ width:'44px', height:'44px', borderRadius:'14px', background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#d97706' }}>
                          <Bell size={21} />
                        </motion.div>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:900, color:'#78350f' }}>{pendingTxns.length} Pending Request{pendingTxns.length>1?'s':''}</div>
                          <div style={{ fontSize:'11px', fontWeight:600, color:'#92400e' }}>Awaiting store keeper approval</div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#d97706" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ══ THE RECORDS VAULT ══ */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ marginTop: '24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                     <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(15,23,42,0.05)', color: '#0f172a' }}>
                       <Shield size={16} />
                     </div>
                     <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>The Records Vault</h3>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                     <Card onClick={() => navigate('/supplier/docs')} 
                       style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#6366f1' }}>
                         <ShieldCheck size={20} />
                       </div>
                       <div>
                         <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Digital Identity</div>
                         <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ID Card & Certs</div>
                       </div>
                     </Card>

                     <Card onClick={() => navigate('/inventory')} 
                       style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#10b981' }}>
                         <Package size={20} />
                       </div>
                       <div>
                         <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Stock Ledger</div>
                         <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Dispatch Archive</div>
                       </div>
                     </Card>
                   </div>

                   <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '20px', fontWeight: 500 }}>
                     Your digital records are encrypted and secured by Bread Cloud™
                   </p>
                </motion.div>

                {/* Performance Badge */}
                {completedTxns.length >= 10 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show"
                    style={{ background:'linear-gradient(135deg,#fefce8,#fef9c3)', border:'1px solid rgba(234,179,8,0.2)', borderRadius:'20px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'rgba(234,179,8,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Star size={21} color="#ca8a04" />
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#78350f' }}>Active Performer 🏆</div>
                      <div style={{ fontSize:'11px', fontWeight:600, color:'#92400e' }}>{completedTxns.length} completed transactions — keep it up!</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══════════ STOCK ══════════ */}
            {activeSection === 'stock' && (
              <motion.div key="stock" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background:'#fff', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)', marginBottom:'12px' }}>
                  <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(79,70,229,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4f46e5' }}><Package size={15}/></div>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>My Stock Levels</div>
                    </div>
                    <div style={{ background:'rgba(79,70,229,0.08)', color:'#4f46e5', padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:800 }}>
                      {totalStock} units total
                    </div>
                  </div>
                  {myStock.length === 0 ? (
                    <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>
                      <Package size={32} style={{ margin:'0 auto 8px', opacity:0.2 }} />
                      <div style={{ fontSize:'13px', fontWeight:600 }}>No stock data yet</div>
                    </div>
                  ) : myStock.map((p, i) => {
                    const maxStock = 100;
                    const pct = Math.min((p.myStock / maxStock) * 100, 100);
                    return (
                      <div key={p.id} style={{ padding:'16px 20px', borderBottom: i < myStock.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background: p.warning?'rgba(239,68,68,0.08)':'rgba(79,70,229,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {p.warning
                                ? <AlertTriangle size={17} color="#ef4444" />
                                : <Zap size={17} color="#4f46e5" />
                              }
                            </div>
                            <div>
                              <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a' }}>{p.name}</div>
                              <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8' }}>₦{p.price} per unit</div>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'22px', fontWeight:900, color: p.warning?'#ef4444':'#0f172a' }}>{p.myStock}</div>
                            <div style={{ fontSize:'9px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>units</div>
                          </div>
                        </div>
                        {/* Stock bar */}
                        <div style={{ background:'rgba(0,0,0,0.05)', borderRadius:'6px', height:'6px', overflow:'hidden' }}>
                          <motion.div
                            initial={{ width:0 }} animate={{ width:`${pct}%` }}
                            transition={{ delay: i*0.1, type:'spring', stiffness:200, damping:25 }}
                            style={{ height:'100%', borderRadius:'6px', background: p.warning ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#4f46e5,#6366f1)' }}
                          />
                        </div>
                        {p.warning && (
                          <div style={{ marginTop:'6px', fontSize:'10px', fontWeight:800, color:'#ef4444' }}>⚠️ Low stock — request more from store</div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => navigate('/inventory')}
                  style={{ width:'100%', background:'linear-gradient(135deg,#4f46e5,#6366f1)', border:'none', borderRadius:'18px', padding:'16px', color:'#fff', fontSize:'13px', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(79,70,229,0.35)', marginBottom:'12px' }}>
                  <Package size={16} /> Request Stock from Store
                </motion.button>
              </motion.div>
            )}
            {/* ══════════ ORDERS ══════════ */}
            {activeSection === 'orders' && (
              <motion.div key="orders" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background:'#fff', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)', marginBottom:'12px' }}>
                  <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(79,70,229,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4f46e5' }}><ShoppingBag size={15}/></div>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>Assigned Orders</div>
                    </div>
                    <div style={{ background:'rgba(79,70,229,0.08)', color:'#4f46e5', padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:800 }}>
                      {customerOrders.filter(o => o.status === 'PENDING').length} new
                    </div>
                  </div>

                  {customerOrders.length === 0 ? (
                    <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>
                      <ShoppingBag size={32} style={{ margin:'0 auto 8px', opacity:0.2 }} />
                      <div style={{ fontSize:'13px', fontWeight:600 }}>No orders assigned to you</div>
                    </div>
                  ) : customerOrders.map((o, i) => (
                    <div key={o.id} style={{ padding:'16px 20px', borderBottom: i < customerOrders.length-1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                          <div>
                             <div style={{ fontSize:'14px', fontWeight:900, color:'#0f172a' }}>{o.customers?.name || 'Customer'}</div>
                             <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:700 }}>Loc: {o.customers?.location || 'Unknown'}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                             <div style={{ fontSize:'16px', fontWeight:900, color:'#4f46e5' }}>{fmt(o.total_price)}</div>
                             <div style={{ fontSize:'9px', fontWeight:800, color: o.status==='PENDING'?'#f59e0b':'#10b981', textTransform:'uppercase' }}>{o.status}</div>
                          </div>
                       </div>
                       
                       <div style={{ background:'#f8fafc', padding:'10px', borderRadius:'12px', marginBottom:'12px' }}>
                          <div style={{ fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', marginBottom:'4px' }}>Items Order</div>
                          <div style={{ fontSize:'12px', fontWeight:700, color:'#1e293b' }}>
                             {o.details?.map((it: any) => `${it.quantity}x ${products.find(px=>px.id===it.productId)?.name}`).join(', ') || 'N/A'}
                          </div>
                       </div>

                       {o.status === 'PENDING' && (
                         <motion.button whileTap={{ scale:0.95 }} onClick={() => processOrder(o.id)}
                           style={{ width:'100%', padding:'12px', borderRadius:'14px', border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:'12px', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 12px rgba(16,185,129,0.2)' }}>
                            <CheckCircle2 size={16} /> Approve & Deliver
                         </motion.button>
                       )}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}
            {/* ══════════ ACTIVITY ══════════ */}
            {activeSection === 'activity' && (
              <motion.div key="activity" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                  style={{ background:'#fff', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)', marginBottom:'12px' }}>
                  <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'rgba(16,185,129,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'#10b981' }}>
                        <TrendingUp size={15}/>
                      </div>
                      <div style={{ fontSize:'13px', fontWeight:900, color:'#0f172a' }}>Transaction History</div>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:700, color:'#94a3b8' }}>{myTxns.length} total</span>
                  </div>

                  {myTxns.length === 0 ? (
                    <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>
                      <TrendingDown size={32} style={{ margin:'0 auto 8px', opacity:0.2 }} />
                      <div style={{ fontSize:'13px', fontWeight:600 }}>No transactions yet</div>
                    </div>
                  ) : myTxns.slice(0, 15).map((tx, i, arr) => {
                    const s = STATUS[tx.status||'COMPLETED'] || STATUS['COMPLETED'];
                    const items = getTransactionItems(tx);
                    const label = items.length > 0
                      ? `${items[0].quantity}× ${getProductName(items[0].productId)}`
                      : tx.type==='Payment' ? 'Debt Payment' : 'Transaction';
                    const d = new Date(tx.date);
                    const isToday2 = tx.date.startsWith(today);
                    return (
                      <div key={tx.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderBottom: i < arr.length-1?'1px solid rgba(0,0,0,0.04)':'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'42px', height:'42px', borderRadius:'14px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>
                            <s.Icon size={19} />
                          </div>
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a' }}>{label}</div>
                            <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', marginTop:'2px' }}>
                              {isToday2 ? `Today ${d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}` : d.toLocaleDateString('en-NG',{day:'numeric',month:'short'})}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'14px', fontWeight:900, color:'#0f172a' }}>{fmt(tx.totalPrice)}</div>
                          <div style={{ fontSize:'9px', fontWeight:800, color:s.color, background:s.bg, padding:'2px 6px', borderRadius:'5px', marginTop:'3px', display:'inline-block', textTransform:'uppercase' }}>
                            {s.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div style={{ textAlign:'center', padding:'16px', fontSize:'12px', color:'#94a3b8', fontWeight:600 }}>Syncing data...</div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
