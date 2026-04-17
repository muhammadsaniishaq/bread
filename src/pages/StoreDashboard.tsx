import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTransactionItems } from '../store/types';
import { useTranslation } from '../store/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Package, LogOut,
  TrendingUp, AlertTriangle, CheckCircle, ArrowRight,
  Zap, Clock, BarChart3, Wallet, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import StoreBottomNav from '../components/StoreBottomNav';

const T = {
  bg:      '#f4f8ff',
  white:   '#ffffff',
  primary: '#2563eb',
  pLight:  'rgba(37,99,235,0.09)',
  pMid:    'rgba(37,99,235,0.20)',
  emerald: '#059669',
  emeraldL:'rgba(5,150,105,0.10)',
  rose:    '#e11d48',
  roseL:   'rgba(225,29,72,0.08)',
  amber:   '#d97706',
  amberL:  'rgba(217,119,6,0.10)',
  ink:     '#0f1c3f',
  txt2:    '#475569',
  txt3:    '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)',
  radius:  '20px',
  shadow:  '0 4px 20px rgba(37,99,235,0.08)',
  shadowLg:'0 12px 40px rgba(37,99,235,0.14)',
};
const fmt = (v: number) => `₦${v.toLocaleString()}`;

export const StoreDashboard: React.FC = () => {
  const { 
    products, transactions, customers, inventoryLogs, 
    updateTransactionStatus, linkProfileToRecord
  } = useAppContext();
  const { signOut, user, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clockStr, setClockStr] = useState('');
  const [supplierIds, setSupplierIds] = useState<Set<string>>(new Set());
  const [totalSupplierDebt, setTotalSupplierDebt] = useState(0);

  // ── Auto-Link Profile if missing ──────────────────────────────────────────
  useEffect(() => {
    const checkLink = async () => {
      if (!user || (role !== 'SUPPLIER' && role !== 'STORE_KEEPER')) return;
      const linkedRecord = customers.find(c => c.profile_id === user.id);
      if (!linkedRecord) {
        // Try to link silently based on email/phone
        await linkProfileToRecord(user.id, user.email || '', (user as any).user_metadata?.phone);
      }
    };
    checkLink();
  }, [user, role, customers, linkProfileToRecord]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase.from('profiles').select('id').eq('role', 'SUPPLIER');
      if (data) {
        const pIds = data.map((d: any) => d.id);
        const sups = customers.filter(c => pIds.includes(c.profile_id));
        setSupplierIds(new Set(sups.map(c => c.id)));
        setTotalSupplierDebt(sups.reduce((sum, c) => sum + (c.debtBalance || 0), 0));
      }
    };
    if (customers.length > 0) fetchSuppliers();
  }, [customers]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClockStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return t('store.earlyMorning');
    if (h < 10) return t('store.morning');
    if (h < 12) return t('store.lateMorning');
    if (h < 16) return t('store.afternoon');
    if (h < 19) return t('store.evening');
    return t('store.night');
  };

  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTx = transactions.filter(t => t.date.startsWith(today) && supplierIds.has(t.customerId || ''));

    let totalSales = 0, totalCash = 0, totalDebt = 0, unitsSold = 0;
    const breadMap: Record<string, number> = {};

    todaysTx.forEach(tx => {
      totalSales += tx.totalPrice;
      if (tx.type === 'Cash') totalCash += tx.totalPrice; else totalDebt += tx.totalPrice;
      getTransactionItems(tx).forEach(item => {
        unitsSold += item.quantity;
        breadMap[item.productId] = (breadMap[item.productId] || 0) + item.quantity;
      });
    });

    const stock = products.filter(p => p.active).reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter(p => p.active && p.stock < 20);
    const todayLogs = inventoryLogs.filter(l => l.date.startsWith(today));
    const received = todayLogs.filter(l => (l.type || 'Receive') === 'Receive').reduce((s, l) => s + l.quantityReceived, 0);

    // Weekly sparkline
    const weekData = [0.65,0.85,0.55,1.0,0.8,1.15,totalSales > 0 ? totalSales / 10000 : 0.9].map((f, i) => ({
      d: ['M','T','W','T','F','S','Today'][i],
      v: Math.round((totalSales > 0 ? totalSales : 15000) * f / 1000) * 1000,
    }));

    const pendingRequests = transactions.filter(t => 
      t.status === 'PENDING_STORE' && (!t.storeKeeperId || t.storeKeeperId === user?.id)
    );
    const pendingRequestsCount = pendingRequests.length;

    return { totalSales, totalCash, totalDebt, unitsSold, stock, lowStock, received, breadMap, weekData, pendingRequestsCount, pendingRequests,
      recent: [...todaysTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) };
  }, [transactions, products, inventoryLogs, user, supplierIds]);

  const staffName = (user as any)?.user_metadata?.full_name || 'Store Keeper';
  const getCustomer = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '100px' }}>

        {/* ─── HERO HEADER ─── */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          {/* Blobs */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-30%', left: '-15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(37,99,235,0.45) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {/* Dots */}
          {[...Array(10)].map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
              style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'rgba(147,197,253,0.5)', top: `${10 + i * 9}%`, left: `${5 + i * 9}%`, pointerEvents: 'none' }} />
          ))}

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(147,197,253,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏪 Storefront</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{getGreeting()}, {staffName.split(' ')[0]}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: '1px' }}>🕐 {clockStr}</div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={signOut}
                style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <LogOut size={16} />
              </motion.button>
            </div>

            {/* Hero stats card */}
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{t('store.dispatched')}</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#93c5fd', letterSpacing: '-0.04em' }}>{fmt(metrics.totalSales)}</div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{t('store.supplierPayments')}: {fmt(metrics.totalCash)}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{t('store.totalOwedToSuppliers')}: {fmt(totalSupplierDebt)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '3px' }}>{t('store.unitsOut')}</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{metrics.unitsSold}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{t('store.dispatchedToday')}</div>
                </div>
              </div>

              {/* Stock status bar */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {metrics.lowStock.length > 0
                    ? <AlertTriangle size={13} color="#fde68a" />
                    : <CheckCircle size={13} color="#6ee7b7" />}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: metrics.lowStock.length > 0 ? '#fde68a' : '#6ee7b7' }}>
                    {metrics.lowStock.length > 0 ? `${metrics.lowStock.length} ${t('store.lowStockAlert')}` : t('store.allStockOk')}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{metrics.stock} {t('store.unitsLeft')}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ─── QUICK ACTION BUTTONS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/store/accounting')}
              style={{ padding: '18px 16px', borderRadius: T.radius, background: `linear-gradient(135deg, ${T.primary}, #3b82f6)`, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadowLg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.2 }}>{t('store.supplierLedger').split(' ')[0]}<br/>{t('store.supplierLedger').split(' ')[1] || 'Ledger'}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>{t('store.pureSupplierLabel')}</div>
              </div>
            </motion.button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/store/inventory')}
                style={{ flex: 1, padding: '12px 14px', borderRadius: '16px', background: T.white, border: `1px solid ${T.borderL}`, cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: T.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={16} color={T.amber} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{t('nav.inventory')}</div>
                  <div style={{ fontSize: '10px', color: T.txt3 }}>{metrics.stock} {t('rep.units')}</div>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/store/accounting')}
                style={{ flex: 1, padding: '12px 14px', borderRadius: '16px', background: metrics.pendingRequestsCount > 0 ? '#fff7ed' : T.white, border: `1px solid ${metrics.pendingRequestsCount > 0 ? '#fdba74' : T.borderL}`, cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: metrics.pendingRequestsCount > 0 ? '#ffedd5' : T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} color={metrics.pendingRequestsCount > 0 ? '#f97316' : T.primary} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{t('store.pendingRequests').split(' ')[0]}</div>
                  <div style={{ fontSize: '10px', color: metrics.pendingRequestsCount > 0 ? '#f97316' : T.txt3, fontWeight: 700 }}>{metrics.pendingRequestsCount} {t('store.pendingRequests').split(' ')[1]}</div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* ─── STAT TILES ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: t('store.supplierPayments'), value: fmt(metrics.totalCash), color: T.emerald, bg: T.emeraldL, icon: TrendingUp },
              { label: t('inv.receive'), value: `${metrics.received}`, color: T.amber, bg: T.amberL, icon: Package },
              { label: t('rep.debtIssued'), value: fmt(metrics.totalDebt), color: T.rose, bg: T.roseL, icon: AlertTriangle },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: T.white, borderRadius: '16px', padding: '12px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, textAlign: 'center' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <s.icon size={14} color={s.color} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* ─── SPARKLINE CHART ─── */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={15} color={T.primary} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{t('store.weeklyTrend')}</span>
            </div>
            <div style={{ height: '120px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="storeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" fontSize={10} tickLine={false} axisLine={false} stroke={T.txt3} />
                  <Tooltip contentStyle={{ background: T.white, border: `1px solid ${T.borderL}`, borderRadius: '10px', fontSize: '11px' }} formatter={(v) => [`₦${Number(v).toLocaleString()}`, t('nav.sales')]} />
                  <Area type="monotone" dataKey="v" stroke={T.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#storeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── LIVE STOCK PREVIEW ─── */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: T.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={14} color={T.amber} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{t('store.liveStock')}</span>
              </div>
              <button onClick={() => navigate('/store/inventory')} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('store.viewAll')} <ArrowRight size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {products.filter(p => p.active).map((p, i) => {
                const isLow = p.stock < 20;
                const sold = Object.entries(metrics.breadMap).find(([id]) => id === p.id)?.[1] || 0;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', background: isLow ? T.roseL : T.bg, border: `1px solid ${isLow ? T.rose + '20' : T.borderL}` }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: isLow ? T.roseL : T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🍞</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{p.name}</div>
                      <div style={{ height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                          style={{ height: '100%', background: isLow ? T.rose : T.primary, borderRadius: '2px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: isLow ? T.rose : T.primary }}>{p.stock}</div>
                      {sold > 0 && <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>-{sold} out</div>}
                    </div>
                  </div>
                );
              })}
              {products.filter(p => p.active).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: T.txt3, fontSize: '12px' }}>No active products.</div>
              )}
            </div>
          </div>

          {/* ─── RECENT DISPATCHES ─── */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={14} color={T.primary} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{t('store.dispatched')}</span>
              </div>
              <button onClick={() => navigate('/store/records')} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('sales.all')} <ArrowRight size={12} />
              </button>
            </div>

            {metrics.recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: T.txt3 }}>
                <Zap size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{t('store.noDispatches')}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <AnimatePresence>
                  {metrics.recent.map((tx, i) => (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', background: T.bg }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: T.primary, flexShrink: 0 }}>
                        {getCustomer(tx.customerId).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCustomer(tx.customerId)}</div>
                        <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                        <div style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', marginTop: '2px', display: 'inline-block', background: tx.type === 'Cash' ? T.emeraldL : T.roseL, color: tx.type === 'Cash' ? T.emerald : T.rose }}>
                          {tx.type}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ─── PENDING SUPPLIER REQUESTS (BOTTOM SECTION) ─── */}
          {metrics.pendingRequests.length > 0 && (
            <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1.5px solid ${T.amberL}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: T.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={14} color={T.amber} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{t('store.supplierRequests')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                  {metrics.pendingRequests.map((tx) => {
                    const sup = customers.find(c => c.id === tx.customerId);
                    const txItems = getTransactionItems(tx);
                    return (
                      <motion.div key={tx.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        style={{ border: `1px solid ${T.borderL}`, borderRadius: '16px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: tx.type === 'Return' ? T.roseL : tx.type === 'Payment' ? T.emeraldL : T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {tx.type === 'Return' ? <ArrowUpRight size={14} color={T.rose} /> : tx.type === 'Payment' ? <Wallet size={14} color={T.emerald} /> : <ArrowDownLeft size={14} color={T.primary} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{sup?.name || 'Supplier'}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: tx.type === 'Return' ? T.rose : T.emerald }}>
                                {tx.type === 'Return' ? t('inv.return') : tx.type === 'Payment' ? t('store.paymentRequest') : t('dash.receiveBread')}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                          </div>
                        </div>

                        {tx.type !== 'Payment' && (
                          <div style={{ background: T.bg, borderRadius: '10px', padding: '8px', marginBottom: '10px' }}>
                            {txItems.map((it, i) => {
                              const p = products.find(pr => pr.id === it.productId);
                              const isShort = p && p.stock < it.quantity;
                              return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700 }}>
                                  <span style={{ color: T.txt2 }}>{p?.name}: {it.quantity} pcs</span>
                                  <span style={{ color: isShort ? T.rose : T.emerald, background: isShort ? T.roseL : T.emeraldL, padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>
                                    {t('store.liveStock')}: {p?.stock || 0}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateTransactionStatus(tx.id, 'COMPLETED')}
                            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: T.emerald, color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                            {t('dash.accept')}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateTransactionStatus(tx.id, 'CANCELLED')}
                            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${T.rose}20`, background: '#fff', color: T.rose, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                            {t('dash.reject')}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

        </div>
      </div>
      <StoreBottomNav />
    </AnimatedPage>
  );
};

export default StoreDashboard;
