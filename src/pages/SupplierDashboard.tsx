import { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  AlertTriangle, Package, CreditCard, TrendingUp, TrendingDown,
  Clock, ChevronRight, ShoppingCart, RefreshCw, Wallet,
  CheckCircle2, Hourglass, XCircle
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  COMPLETED:        { label: 'Done',     color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle2 },
  PENDING_STORE:    { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Hourglass },
  PENDING_SUPPLIER: { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Hourglass },
  CANCELLED:        { label: 'Cancelled',color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircle },
};

export default function SupplierDashboard() {
  const { transactions, products, customers, inventoryLogs, loading, refreshData } = useAppContext();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  const mid = myAccount?.id || user?.id || '';

  const myStock = useMemo(() =>
    products.filter(p => p.active).map(p => {
      const rec  = inventoryLogs.filter(l => l.productId === p.id && l.type !== 'Return' && l.profile_id === mid).reduce((s, l) => s + l.quantityReceived, 0);
      const ret  = inventoryLogs.filter(l => l.productId === p.id && l.type === 'Return'  && l.profile_id === mid).reduce((s, l) => s + l.quantityReceived, 0);
      const sold = transactions.filter(t => t.status === 'COMPLETED' && t.origin === 'POS_SUPPLIER' && t.sellerId === mid)
        .reduce((s, t) => { const it = (t.items || []).find(i => i.productId === p.id); return s + (it?.quantity || 0); }, 0);
      const txRec = transactions.filter(t => t.status === 'COMPLETED' && t.type === 'Debt' && t.customerId === mid && (t.items?.[0]?.productId === p.id || t.productId === p.id)).reduce((s, t) => s + (t.items?.[0]?.quantity || t.quantity || 0), 0);
      const txRet = transactions.filter(t => t.status === 'COMPLETED' && t.type === 'Return' && t.customerId === mid && (t.items?.[0]?.productId === p.id || t.productId === p.id)).reduce((s, t) => s + (t.items?.[0]?.quantity || t.quantity || 0), 0);
      return { ...p, myStock: Math.max(0, (rec + txRec) - (ret + txRet) - sold) };
    }),
  [products, inventoryLogs, transactions, mid]);

  const myTxns = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [transactions, myAccount, user]);

  const pendingTxns = useMemo(() => myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER'), [myTxns]);

  const totalDispatched = useMemo(() =>
    myTxns.filter(t => t.status === 'COMPLETED' && t.type !== 'Return').reduce((s, t) => s + t.totalPrice, 0), [myTxns]);

  const totalSoldToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return myTxns.filter(t => t.status === 'COMPLETED' && t.date.startsWith(today) && t.origin === 'POS_SUPPLIER')
      .reduce((s, t) => s + t.totalPrice, 0);
  }, [myTxns]);

  const totalStock = useMemo(() => myStock.reduce((s, p) => s + p.myStock, 0), [myStock]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: t('dash.goodMorning') || 'Good Morning', emoji: '☀️', grad: 'linear-gradient(135deg,#f97316,#fbbf24)' };
    if (h < 17) return { text: t('dash.goodAfternoon') || 'Good Afternoon', emoji: '🌤️', grad: 'linear-gradient(135deg,#6366f1,#60a5fa)' };
    return { text: t('dash.goodEvening') || 'Good Evening', emoji: '🌙', grad: 'linear-gradient(135deg,#9333ea,#818cf8)' };
  }, [t]);

  const hasDebt = (myAccount?.debtBalance || 0) > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getProductName = (id?: string) => products.find(p => p.id === id)?.name || 'Product';

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', paddingBottom: '110px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Hero Header */}
        <div style={{ background: 'linear-gradient(158deg,#1a0533 0%,#3b0764 40%,#4f46e5 100%)', padding: '48px 20px 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  <span style={{ background: greeting.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {greeting.text}
                  </span>
                  {' '}{greeting.emoji}
                </h1>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={handleRefresh}
                style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <RefreshCw size={17} color="#fff" className={refreshing ? 'animate-spin' : ''} />
              </motion.button>
            </div>

            {/* Debt pill */}
            <div style={{ background: hasDebt ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${hasDebt ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '20px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: hasDebt ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color={hasDebt ? '#ef4444' : '#10b981'} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>My Debt Balance</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: hasDebt ? '#fca5a5' : '#6ee7b7', letterSpacing: '-0.02em' }}>
                    {fmt(myAccount?.debtBalance || 0)}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: hasDebt ? 'rgba(239,68,68,0.7)' : 'rgba(16,185,129,0.7)' }}>
                {hasDebt ? 'Outstanding' : '✅ Clear!'}
              </span>
            </div>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ padding: '0 16px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>

          {/* 4 stat cards */}
          <motion.div variants={fadeUp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'My Stock',        val: `${totalStock} units`,  icon: Package,    color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                { label: "Today's Sales",   val: fmt(totalSoldToday),    icon: Wallet,     color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                { label: 'Total Dispatched',val: fmt(totalDispatched),   icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                { label: 'Pending Orders',  val: String(pendingTxns.length), icon: CreditCard, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '10px' }}>
                    <s.icon size={17} strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stock per product */}
          <motion.div variants={fadeUp}>
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <Package size={14} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>My Stock Breakdown</span>
                </div>
              </div>
              {myStock.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>No stock data yet</div>
              ) : myStock.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < myStock.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: p.myStock < 10 ? 'rgba(239,68,68,0.08)' : 'rgba(79,70,229,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: p.myStock < 10 ? '#ef4444' : '#4f46e5' }}>
                      ₦{p.price}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>₦{p.price} per loaf</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: p.myStock < 10 ? '#ef4444' : '#0f172a' }}>{p.myStock}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>units</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pending alert */}
          <AnimatePresence>
            {pendingTxns.length > 0 && (
              <motion.div variants={fadeUp} key="pa">
                <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                      <Hourglass size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#78350f' }}>
                        {pendingTxns.length} Pending {pendingTxns.length > 1 ? 'Requests' : 'Request'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e' }}>Awaiting Store Keeper approval</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#d97706" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <motion.div variants={fadeUp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/sales')}
                style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', border: 'none', borderRadius: '20px', padding: '18px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={17} color="#fff" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>New Sale</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Record a sale</div>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/inventory')}
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '18px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={17} color="#8b5cf6" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>Returns</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>Send back stock</div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={fadeUp}>
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Clock size={14} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Recent Activity</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{myTxns.length} total</span>
              </div>
              {myTxns.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <Clock size={28} color="#e2e8f0" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>No transactions yet</div>
                </div>
              ) : myTxns.slice(0, 8).map((tx, i, arr) => {
                const s = STATUS_STYLES[tx.status || 'COMPLETED'] || STATUS_STYLES['COMPLETED'];
                const items = getTransactionItems(tx);
                const label = items.length > 0
                  ? `${items[0].quantity}× ${getProductName(items[0].productId)}`
                  : tx.type === 'Payment' ? 'Debt Payment' : 'Transaction';
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                        <s.icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{label}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{fmt(tx.totalPrice)}</div>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, background: s.bg, padding: '2px 6px', borderRadius: '5px', marginTop: '3px', display: 'inline-block', textTransform: 'uppercase' }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Loading...</div>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
