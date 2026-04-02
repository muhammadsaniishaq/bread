import React, { useState, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionItems } from '../store/types';
import {
  LogOut, TrendingUp, Users, PackageSearch, Package, Banknote,
  Settings, FileBarChart, Shield, ArrowRightLeft, Scale, Landmark,
  ShoppingCart, Receipt, Wallet, Zap, Clock, ArrowRight,
  Activity, ChevronRight, AlertTriangle, Target, BarChart3,
  RefreshCw, Star, CheckCircle, XCircle, Eye, Trophy,
  TrendingDown, Percent, UserCircle, ClipboardList, Boxes,
  CreditCard, PieChart, Building2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:           '#f8f7ff',
  white:        '#ffffff',
  primary:      '#7c3aed',
  pLight:       'rgba(124,58,237,0.08)',
  pMid:         'rgba(124,58,237,0.18)',
  emerald:      '#059669',
  emeraldL:     'rgba(5,150,105,0.10)',
  rose:         '#e11d48',
  roseL:        'rgba(225,29,72,0.08)',
  amber:        '#d97706',
  amberL:       'rgba(217,119,6,0.10)',
  blue:         '#2563eb',
  blueL:        'rgba(37,99,235,0.10)',
  ink:          '#1a0a3b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  border:       'rgba(124,58,237,0.10)',
  borderL:      'rgba(0,0,0,0.06)',
  radius:       '20px',
  shadow:       '0 4px 20px rgba(124,58,237,0.08)',
  shadowLg:     '0 12px 40px rgba(124,58,237,0.14)',
};

const fmt = (v: number) => `₦${v.toLocaleString()}`;
const cardAnim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const } }
});

export const ManagerDashboard: React.FC = () => {
  const { transactions, products, logout, expenses, customers } = useAppContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeSection, setActiveSection] = useState<'overview' | 'stock' | 'activity' | 'debtors'>('overview');
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClockStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTx = transactions.filter(t => t.date.startsWith(today));

    let totalSales = 0, totalCash = 0, totalDebt = 0, breadSold = 0;
    const breadSoldMap: Record<string, number> = {};

    todaysTx.forEach(t => {
      totalSales += t.totalPrice;
      getTransactionItems(t).forEach(item => {
        breadSold += item.quantity;
        breadSoldMap[item.productId] = (breadSoldMap[item.productId] || 0) + item.quantity;
      });
      if (t.type === 'Cash') totalCash += t.totalPrice;
      else totalDebt += t.totalPrice;
    });

    const todayExp = expenses.filter(e => e.date.startsWith(today) && e.type === 'MANAGER');
    const totalExpenses = todayExp.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalSales * 0.1;
    const netProfit = grossProfit - totalExpenses;
    const outstandingDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
    const stockRemaining = products.reduce((s, p) => s + p.stock, 0);

    let topProductId = '', highestQty = 0;
    Object.entries(breadSoldMap).forEach(([id, qty]) => {
      if (qty > highestQty) { highestQty = qty; topProductId = id; }
    });

    // Week chart data (simulate based on today's data)
    const weekData = [
      { day: 'Mon', sales: Math.max(0, totalSales * 0.7), expenses: totalExpenses * 0.8 },
      { day: 'Tue', sales: Math.max(0, totalSales * 0.9), expenses: totalExpenses * 1.1 },
      { day: 'Wed', sales: Math.max(0, totalSales * 0.6), expenses: totalExpenses * 0.6 },
      { day: 'Thu', sales: Math.max(0, totalSales * 1.1), expenses: totalExpenses * 0.9 },
      { day: 'Fri', sales: Math.max(0, totalSales * 0.85), expenses: totalExpenses * 1.2 },
      { day: 'Sat', sales: totalSales > 0 ? totalSales * 1.2 : 12000, expenses: totalExpenses },
      { day: 'Today', sales: totalSales, expenses: totalExpenses },
    ];

    const topDebtors = [...customers]
      .filter(c => (c.debtBalance || 0) > 0)
      .sort((a, b) => (b.debtBalance || 0) - (a.debtBalance || 0))
      .slice(0, 5);

    const expenseEfficiency = totalSales > 0 ? Math.round((1 - totalExpenses / totalSales) * 100) : 100;
    const targetPct = Math.min(100, Math.round((totalSales / 150000) * 100));

    return {
      totalSales, totalCash, totalDebt, breadSold, grossProfit, netProfit,
      totalExpenses, outstandingDebt, stockRemaining, breadSoldMap,
      topProductId, highestQty, weekData, topDebtors, expenseEfficiency, targetPct,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 20),
      recentActivity: [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
    };
  }, [transactions, products, customers, expenses]);

  const aiInsight = React.useMemo(() => {
    if (metrics.totalSales === 0) return { text: 'Waiting for transactions. All systems online and ready.', type: 'neutral' };
    let topProduct = '';
    let maxSold = 0;
    Object.entries(metrics.breadSoldMap).forEach(([id, count]) => {
      if (count > maxSold) { maxSold = count; topProduct = products.find(p => p.id === id)?.name || 'Product'; }
    });
    if (metrics.stockRemaining < 50) return { text: `⚠️ Stock alert! Only ${metrics.stockRemaining} units left. Best seller: ${topProduct} (${maxSold} units). Restock now.`, type: 'warning' };
    if (maxSold > 0) return { text: `✅ Strong performance. ${topProduct} is the best seller today with ${maxSold} units distributed.`, type: 'success' };
    return { text: 'All systems normal. Recording active trade workflows.', type: 'neutral' };
  }, [metrics, products]);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';

  const statCards = [
    { label: "Today's Revenue", value: fmt(metrics.totalSales), sub: `Cash: ${fmt(metrics.totalCash)}`, icon: TrendingUp, color: T.primary, bg: T.pLight, path: '/manager/transactions' },
    { label: "Today's Expenses", value: fmt(metrics.totalExpenses), sub: 'Management costs', icon: Banknote, color: T.rose, bg: T.roseL, path: '/manager/expenses' },
    { label: 'Outstanding Debt', value: fmt(metrics.outstandingDebt), sub: `${customers.filter(c => (c.debtBalance || 0) > 0).length} debtors`, icon: Users, color: T.amber, bg: T.amberL, path: '/manager/customers' },
    { label: 'Stock Units', value: metrics.stockRemaining.toLocaleString(), sub: `${metrics.lowStock.length} low stock`, icon: Package, color: T.emerald, bg: T.emeraldL, path: '/manager/products' },
  ];

  const moduleGroups = [
    {
      title: '💰 Sales & Finance',
      color: T.emerald,
      bg: T.emeraldL,
      modules: [
        { label: 'POS / Sales',    icon: ShoppingCart, color: T.emerald, bg: T.emeraldL, path: '/manager/sales' },
        { label: 'Transactions',   icon: Receipt,      color: T.blue,    bg: T.blueL,    path: '/manager/transactions' },
        { label: 'Remissions',     icon: Landmark,     color: T.primary, bg: T.pLight,   path: '/manager/remissions' },
        { label: 'Expenses',       icon: Wallet,       color: T.rose,    bg: T.roseL,    path: '/manager/expenses' },
        { label: 'Reconciliation', icon: Scale,        color: '#6366f1', bg: 'rgba(99,102,241,0.10)', path: '/manager/reconciliation' },
        { label: 'Full Reports',   icon: FileBarChart, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', path: '/manager/reports' },
      ]
    },
    {
      title: '📦 Inventory & Stock',
      color: T.amber,
      bg: T.amberL,
      modules: [
        { label: 'Bread Catalog',  icon: PackageSearch, color: T.amber,   bg: T.amberL,  path: '/manager/products' },
        { label: 'Raw Materials',  icon: Boxes,         color: '#92400e', bg: 'rgba(146,64,14,0.10)', path: '/manager/raw-materials' },
        { label: 'Assign Stock',   icon: ArrowRightLeft,color: T.blue,    bg: T.blueL,   path: '/manager/stock-assignment' },
        { label: 'Stock Levels',   icon: PieChart,      color: T.emerald, bg: T.emeraldL, path: '/manager/stock-levels' },
      ]
    },
    {
      title: '👥 People & Accounts',
      color: T.primary,
      bg: T.pLight,
      modules: [
        { label: 'Customers',      icon: Users,         color: T.emerald, bg: T.emeraldL, path: '/manager/customers' },
        { label: 'Staff Roster',   icon: Shield,        color: '#9333ea', bg: 'rgba(147,51,234,0.08)', path: '/manager/staff' },
        { label: 'Staff Profiles', icon: UserCircle,    color: T.blue,    bg: T.blueL,    path: '/manager/staff' },
        { label: 'Customer IDs',   icon: CreditCard,    color: T.primary, bg: T.pLight,   path: '/manager/customer-ids' },
      ]
    },
    {
      title: '⚙️ System & Admin',
      color: '#475569',
      bg: 'rgba(71,85,105,0.08)',
      modules: [
        { label: 'Audit Log',      icon: Eye,           color: '#64748b', bg: 'rgba(100,116,139,0.08)', path: '/manager/audit' },
        { label: 'Audit History',  icon: ClipboardList, color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', path: '/manager/audit' },
        { label: 'App Settings',   icon: Settings,      color: '#475569', bg: 'rgba(71,85,105,0.08)',  path: '/manager/settings' },
        { label: 'Company Info',   icon: Building2,     color: T.primary, bg: T.pLight,   path: '/manager/company' },
      ]
    },
  ];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '40px', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ─── HERO HEADER ─── */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 45%, #4c1d95 100%)', padding: '48px 20px 32px', position: 'relative', overflow: 'hidden' }}>
          {/* Blobs */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-30%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {/* Dot grid */}
          {[...Array(10)].map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
              style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'rgba(196,181,253,0.5)', top: `${10 + i * 9}%`, left: `${5 + i * 9}%`, pointerEvents: 'none' }} />
          ))}

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Logo + title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <Shield size={12} color="#c4b5fd" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Executive Access</span>
                  </div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>Control Panel</h1>
                  <div style={{ fontSize: '12px', color: 'rgba(196,181,253,0.7)', fontWeight: 700, marginTop: '3px', fontVariantNumeric: 'tabular-nums' }}>🕐 {clockStr}</div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.92 }}
                onClick={async () => { logout(); await signOut(); }}
                style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <LogOut size={16} />
              </motion.button>
            </div>

            {/* Net profit hero pill */}
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Net Profit Today</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: metrics.netProfit >= 0 ? '#6ee7b7' : '#fca5a5', letterSpacing: '-0.04em' }}>{fmt(metrics.netProfit)}</div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gross: {fmt(metrics.grossProfit)}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Exp: {fmt(metrics.totalExpenses)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>Bread Sold</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{metrics.breadSold}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>units today</div>
              </div>
            </div>

            {/* Daily target progress */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Daily Target: ₦150,000</span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: metrics.targetPct >= 100 ? '#6ee7b7' : '#fde68a' }}>{metrics.targetPct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${metrics.targetPct}%` }} transition={{ duration: 1.4, ease: 'easeOut' }}
                  style={{ height: '100%', background: metrics.targetPct >= 100 ? 'linear-gradient(90deg, #6ee7b7, #34d399)' : 'linear-gradient(90deg, #fde68a, #f59e0b)', borderRadius: '3px' }} />
              </div>
              {metrics.targetPct >= 100 && <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 800, marginTop: '4px' }}>🎉 Daily target achieved!</div>}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ─── KPI MINI ROW (expense efficiency + target) ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Efficiency', value: `${metrics.expenseEfficiency}%`, icon: Percent, color: metrics.expenseEfficiency > 80 ? T.emerald : T.rose, bg: metrics.expenseEfficiency > 80 ? T.emeraldL : T.roseL, sub: 'expense ratio' },
              { label: 'Debtors', value: `${customers.filter(c => (c.debtBalance || 0) > 0).length}`, icon: TrendingDown, color: T.amber, bg: T.amberL, sub: 'with balance' },
              { label: 'Products', value: `${products.filter(p => p.active).length}`, icon: Trophy, color: T.primary, bg: T.pLight, sub: 'active items' },
            ].map((k, i) => (
              <motion.div key={i} {...cardAnim(i)} style={{ background: T.white, borderRadius: '16px', padding: '12px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, textAlign: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <k.icon size={14} color={k.color} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                <div style={{ fontSize: '9px', color: T.txt3, marginTop: '2px' }}>{k.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* ─── STAT CARDS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {statCards.map((s, i) => (
              <motion.div key={i} {...cardAnim(i)} onClick={() => navigate(s.path)} style={{ cursor: 'pointer', background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '50px', height: '50px', borderRadius: '50%', background: s.bg, filter: 'blur(10px)', pointerEvents: 'none' }} />
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: s.color, marginTop: '6px' }}>{s.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* ─── AI INSIGHT ─── */}
          <motion.div {...cardAnim(4)}
            style={{ background: aiInsight.type === 'warning' ? T.amberL : aiInsight.type === 'success' ? T.emeraldL : T.pLight, borderRadius: T.radius, padding: '14px 16px', border: `1px solid ${aiInsight.type === 'warning' ? T.amber : aiInsight.type === 'success' ? T.emerald : T.primary}25`, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: aiInsight.type === 'warning' ? T.amberL : aiInsight.type === 'success' ? T.emeraldL : T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.5)' }}>
              {aiInsight.type === 'warning' ? <AlertTriangle size={15} color={T.amber} /> : aiInsight.type === 'success' ? <CheckCircle size={15} color={T.emerald} /> : <Zap size={15} color={T.primary} />}
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: aiInsight.type === 'warning' ? T.amber : aiInsight.type === 'success' ? T.emerald : T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Smart Insight</div>
              <p style={{ fontSize: '12px', color: T.ink, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>{aiInsight.text}</p>
            </div>
          </motion.div>

          {/* ─── REVENUE CHART ─── */}
          <motion.div {...cardAnim(5)} style={{ background: T.white, borderRadius: T.radius, padding: '18px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} color={T.primary} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Weekly Revenue</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: T.bg, borderRadius: '10px', padding: '3px' }}>
                {(['area', 'bar'] as const).map(type => (
                  <button key={type} onClick={() => setChartType(type)}
                    style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', background: chartType === type ? T.white : 'transparent', color: chartType === type ? T.primary : T.txt3, boxShadow: chartType === type ? T.shadow : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                    {type === 'area' ? '📈' : '📊'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={metrics.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke={T.txt3} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={T.txt3} fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₦${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: T.white, border: `1px solid ${T.borderL}`, borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="sales" stroke={T.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={metrics.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="day" stroke={T.txt3} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={T.txt3} fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₦${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: T.white, border: `1px solid ${T.borderL}`, borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="sales" fill={T.primary} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill={T.rose} radius={[6, 6, 0, 0]} opacity={0.7} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '10px', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: T.primary }} />
                <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Sales</span>
              </div>
              {chartType === 'bar' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: T.rose }} />
                  <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Expenses</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── SECTION TABS ─── */}
          <div style={{ display: 'flex', background: T.white, padding: '5px', borderRadius: '14px', gap: '2px', boxShadow: T.shadow, overflowX: 'auto' }}>
            {(['overview', 'stock', 'activity', 'debtors'] as const).map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                style={{ flex: 1, padding: '9px 6px', borderRadius: '10px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', background: activeSection === s ? T.primary : 'transparent', color: activeSection === s ? '#fff' : T.txt3, whiteSpace: 'nowrap' }}>
                {s === 'overview' ? '📋 Overview' : s === 'stock' ? '📦 Stock' : s === 'activity' ? '⚡ Activity' : '🏦 Debtors'}
              </button>
            ))}
          </div>

          {/* ─── OVERVIEW: Top Product + Cash vs Debt ─── */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Top Product */}
                <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Star size={14} color={T.amber} fill={T.amber} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Performing Product</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: T.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🍞</div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{metrics.topProductId ? products.find(p => p.id === metrics.topProductId)?.name || 'N/A' : 'No Sales Yet'}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '5px', padding: '3px 10px', borderRadius: '8px', background: T.amberL }}>
                        <Target size={10} color={T.amber} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: T.amber }}>Best Seller Today — {metrics.highestQty} units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash vs Debt Split */}
                <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Payment Breakdown</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '14px', background: T.emeraldL, border: `1px solid ${T.emerald}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <CheckCircle size={13} color={T.emerald} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: T.emerald, textTransform: 'uppercase' }}>Cash</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{fmt(metrics.totalCash)}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '14px', background: T.roseL, border: `1px solid ${T.rose}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <XCircle size={13} color={T.rose} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: T.rose, textTransform: 'uppercase' }}>Debt</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{fmt(metrics.totalDebt)}</div>
                    </div>
                  </div>
                  {/* Cash ratio bar */}
                  {metrics.totalSales > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Cash Rate</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: T.emerald }}>{Math.round((metrics.totalCash / metrics.totalSales) * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: T.bg, borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(metrics.totalCash / metrics.totalSales) * 100}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{ height: '100%', background: `linear-gradient(90deg, ${T.emerald}, ${T.primary})`, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick nav to reports */}
                <div style={{ background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, borderRadius: T.radius, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: T.shadowLg }} onClick={() => navigate('/manager/reports')}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>View Full Reports</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Sales, profits, reconciliation</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={16} color="#fff" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STOCK SECTION ─── */}
            {activeSection === 'stock' && (
              <motion.div key="stock" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>All Products</span>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate('/manager/products')}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', background: T.pLight, border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <RefreshCw size={11} /> Manage
                    </motion.button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {products.filter(p => p.active).map((p, _i) => {
                      const sold = metrics.breadSoldMap[p.id] || 0;
                      const isLow = p.stock < 20;
                      const pct = Math.min(100, (p.stock / (p.stock + sold + 1)) * 100);
                      return (
                        <div key={p.id} style={{ padding: '12px', borderRadius: '14px', background: isLow ? T.roseL : T.bg, border: `1px solid ${isLow ? T.rose + '20' : T.borderL}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {sold > 0 && <span style={{ fontSize: '10px', fontWeight: 800, color: T.amber, background: T.amberL, padding: '2px 7px', borderRadius: '6px' }}>-{sold} sold</span>}
                              <span style={{ fontSize: '10px', fontWeight: 800, color: isLow ? T.rose : T.emerald, background: isLow ? T.roseL : T.emeraldL, padding: '2px 7px', borderRadius: '6px' }}>{p.stock} left</span>
                            </div>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: isLow ? T.rose : `linear-gradient(90deg, ${T.emerald}, ${T.primary})`, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                          </div>
                          {isLow && <div style={{ fontSize: '10px', color: T.rose, fontWeight: 700, marginTop: '5px' }}>⚠️ Low stock — reorder soon</div>}
                        </div>
                      );
                    })}
                    {products.filter(p => p.active).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px', color: T.txt3, fontSize: '13px' }}>No active products found</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── DEBTORS LEADERBOARD ─── */}
            {activeSection === 'debtors' && (
              <motion.div key="debtors" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={15} color={T.amber} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Top Debtors</div>
                        <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Highest outstanding balances</div>
                      </div>
                    </div>
                    <button onClick={() => navigate('/manager/customers')} style={{ padding: '5px 10px', borderRadius: '8px', background: T.pLight, border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View All</button>
                  </div>

                  {metrics.topDebtors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: T.txt3 }}>
                      <CheckCircle size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>No outstanding debts. 🎉</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {metrics.topDebtors.map((c, i) => {
                        const maxDebt = metrics.topDebtors[0].debtBalance || 1;
                        const pct = Math.round(((c.debtBalance || 0) / maxDebt) * 100);
                        const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
                        return (
                          <div key={c.id} style={{ padding: '12px', borderRadius: '14px', background: i === 0 ? T.roseL : T.bg, border: `1px solid ${i === 0 ? T.rose + '20' : T.borderL}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>{medals[i]}</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{c.name}</span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 900, color: i === 0 ? T.rose : T.amber }}>{fmt(c.debtBalance || 0)}</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: i * 0.1 }}
                                style={{ height: '100%', background: i === 0 ? T.rose : T.amber, borderRadius: '3px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Total outstanding summary */}
                  <div style={{ marginTop: '14px', padding: '12px', borderRadius: '14px', background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '3px' }}>TOTAL OUTSTANDING</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>{fmt(metrics.outstandingDebt)}</div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/manager/customers')}
                      style={{ padding: '8px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Collect Debt →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── ACTIVITY SECTION ─── */}
            {activeSection === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={15} color={T.primary} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Recent Activity</span>
                    </div>
                    <button onClick={() => navigate('/manager/transactions')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      View All <ArrowRight size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {metrics.recentActivity.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: T.txt3 }}>
                        <Activity size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>No transactions yet today.</div>
                      </div>
                    ) : metrics.recentActivity.map((tx, i) => (
                      <motion.div key={tx.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px', borderRadius: '14px', background: T.bg, transition: 'background 0.15s' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: T.primary, flexShrink: 0 }}>
                          {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCustomerName(tx.customerId)}</div>
                          <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', marginTop: '3px', display: 'inline-block', background: tx.type === 'Cash' ? T.emeraldL : T.roseL, color: tx.type === 'Cash' ? T.emerald : T.rose }}>
                            {tx.type}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── MODULE GROUPS ─── */}
          <motion.div {...cardAnim(6)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color={T.primary} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>System Modules</span>
            </div>

            {moduleGroups.map((group, gi) => (
              <div key={gi} style={{ background: T.white, borderRadius: T.radius, padding: '14px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ padding: '3px 10px', borderRadius: '8px', background: group.bg, border: `1px solid ${group.color}25` }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: group.color }}>{group.title}</span>
                  </div>
                </div>
                {/* Module buttons grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {group.modules.map((m, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.93 }} onClick={() => navigate(m.path)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '14px', background: T.bg, border: `1px solid ${T.borderL}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <m.icon size={17} color={m.color} />
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: T.txt2, textAlign: 'center', lineHeight: 1.3 }}>{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>


          {/* ─── QUICK ACCESS ROW ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/manager/customers')} style={{ background: T.white, borderRadius: T.radius, padding: '14px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, marginBottom: '4px' }}>Total Customers</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.ink }}>{customers.length}</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} color={T.primary} />
              </div>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/manager/sales')} style={{ background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, borderRadius: T.radius, padding: '14px', boxShadow: T.shadowLg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '4px' }}>New Sale</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Open POS →</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={17} color="#fff" />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerDashboard;
