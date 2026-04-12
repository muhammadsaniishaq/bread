import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import {
  ShoppingBag, Wallet, LogOut, Star,
  Calendar, ShoppingCart, Zap,
  TrendingUp, Package,
  User, Phone, Bell, ChevronRight,
  Award, ArrowUpRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { UnifiedReceiptViewer } from '../components/UnifiedReceiptViewer';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

/* ─────────────────────────────────────────
   DESIGN SYSTEM V5 — Premium Light Palette
───────────────────────────────────────── */
const T = {
  bg:           '#f8f7ff',
  bg2:          '#f0eeff',
  white:        '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  primaryMid:   'rgba(99,91,255,0.20)',
  accent:       '#06b6d4',
  accentLight:  'rgba(6,182,212,0.10)',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  danger:       '#e11d48',
  dangerLight:  'rgba(225,29,72,0.10)',
  gold:         '#d97706',
  goldLight:    'rgba(217,119,6,0.10)',
  silver:       '#64748b',
  bronze:       '#92400e',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radius:       '24px',
  radiusSm:     '16px',
  shadow:       '0 4px 24px rgba(99,91,255,0.08)',
  shadowMd:     '0 8px 40px rgba(99,91,255,0.12)',
};

const fmt = (v: number) => `₦${v.toLocaleString()}`;

const getLoyaltyTier = (total: number) => {
  if (total >= 500000) return { name: 'Diamond', icon: '💎', color: T.accent,  light: T.accentLight,  next: null,     nextAt: 0 };
  if (total >= 150000) return { name: 'Gold',    icon: '🥇', color: T.gold,    light: T.goldLight,    next: 'Diamond',nextAt: 500000 };
  if (total >= 50000)  return { name: 'Silver',  icon: '🥈', color: T.silver,  light: 'rgba(100,116,139,0.10)', next: 'Gold', nextAt: 150000 };
  return { name: 'Bronze', icon: '🥉', color: T.bronze, light: 'rgba(146,64,14,0.10)', next: 'Silver', nextAt: 50000 };
};

const cardAnim = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' as const } }
});

// Animated Number Counter
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = value / 36;
    const t = setInterval(() => {
      cur += step;
      if (cur >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(cur));
    }, 22);
    return () => clearInterval(t);
  }, [value]);
  return <span>₦{display.toLocaleString()}</span>;
};

export const CustomerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalBought, setTotalBought] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData(user.id);
  }, [user]);

  const fetchData = async (id: string) => {
    setLoading(true);
    setSyncError(null);
    try {
      // 1. Fetch profile
      const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (profErr) {
        console.error('CustomerDashboard: Profile fetch error:', profErr.message);
        setSyncError(`Profile: ${profErr.message}`);
      }
      
      if (prof) {
        if (!prof.full_name && user?.user_metadata?.full_name) {
          prof.full_name = user.user_metadata.full_name;
          supabase.from('profiles').update({ full_name: prof.full_name }).eq('id', id).then();
        }
        setProfile(prof);
      }

      // 2. Find customer record
      let cust: any = null;

      const { data: byProfile, error: custErr } = await supabase.from('customers').select('*').eq('profile_id', id).maybeSingle();
      if (custErr) {
        console.error('CustomerDashboard: Customer fetch error:', custErr.message);
        setSyncError(`Customer Fetch: ${custErr.message}`);
      }

      if (byProfile) {
        cust = byProfile;
      } else {
        const { data: byId } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
        if (byId) {
          cust = byId;
          if (!byId.profile_id) await supabase.from('customers').update({ profile_id: id }).eq('id', id);
        } else if (user?.email) {
          const { data: byEmail } = await supabase.from('customers').select('*').eq('email', user.email).maybeSingle();
          if (byEmail) {
            cust = byEmail;
            await supabase.from('customers').update({ profile_id: id }).eq('id', byEmail.id);
          }
        }
      }

      if (cust) {
        setCustomer(cust);
        // ... rest of transaction fetching
        const { data: txns, error: txnErr } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_id', cust.id)
          .order('date', { ascending: false });

        if (txnErr) console.error('CustomerDashboard: Error fetching transactions:', txnErr);

        if (txns && txns.length > 0) {
          const mapped = txns.map((t: any) => ({
            ...t,
            total_price: t.total_price,
            created_at:  t.date,
            status:      t.status || 'COMPLETED',
          }));
          setOrders(mapped.slice(0, 6));
          setTotalBought(txns.filter((t:any) => t.type !== 'Return').reduce((s:number,t:any)=>s+(t.total_price||0),0));
        }
      } else {
        console.warn('CustomerDashboard: Customer record not found. Attempting sync...');
        const { data: newCust, error: insErr } = await supabase.from('customers').insert({
          name:         prof?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
          email:        user?.email,
          profile_id:   id,
          debt_balance: 0,
        }).select().single();
        
        if (insErr) {
          console.error('CustomerDashboard: Critical Error - Sync failed:', insErr.message);
          setSyncError(`Sync Internal: ${insErr.message}`);
        }

        if (newCust) {
          setCustomer(newCust);
        }
      }
    } catch (e: any) {
      console.error('CustomerDashboard: FetchData crashed:', e);
      setSyncError(`Crash: ${e.message || 'Unknown Error'}`);
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, gap: '16px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: '36px', height: '36px', borderRadius: '10px', border: `3px solid ${T.primary}`, borderTopColor: 'transparent' }} />
      <div style={{ color: T.txt3, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>LOADING PORTAL...</div>
    </div>
  );

  if (!customer) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, textAlign: 'center', padding: '40px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: T.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Zap size={36} color={T.danger} />
      </div>
      <h2 style={{ color: T.ink, fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>Profile Unlinked</h2>
      <p style={{ color: T.txt2, fontSize: '13px', margin: '0 0 8px' }}>Account ({user?.email}) not linked.</p>
      
      {syncError && (
        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)', color: T.danger, fontSize: '11px', fontWeight: 700, marginBottom: '20px', maxWidth: '300px' }}>
          Diagnostic: {syncError}
        </div>
      )}
      
      <p style={{ color: T.txt2, fontSize: '13px', margin: '0 0 28px' }}>Contact management to fix this.</p>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { signOut(); navigate('/login'); }}
        style={{ padding: '14px 28px', borderRadius: '14px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: T.shadow }}>
        Sign Out
      </motion.button>
    </div>
  );

  const debt = customer.debt_balance || 0;
  const totalPaid = Math.max(0, totalBought - debt);
  const tier = getLoyaltyTier(totalBought);
  const tierProgress = tier.next ? Math.min(100, (totalBought / tier.nextAt) * 100) : 100;
  const displayName = profile?.full_name?.split(' ')[0] || customer.name?.split(' ')[0] || 'Member';
  const avatar = customer.image || profile?.avatar_url;

  const quickActions = [
    { id: 'shop',    label: 'Order',   icon: ShoppingCart, color: T.primary, light: T.primaryLight,  path: '/customer/store' },
    { id: 'orders',  label: 'History', icon: Package,      color: T.accent,  light: T.accentLight,   path: '/customer/orders' },
    { id: 'ledger',  label: 'Ledger',  icon: Wallet,       color: T.gold,    light: T.goldLight,     path: '/customer/dashboard' },
    { id: 'profile', label: 'Profile', icon: User,         color: T.success, light: T.successLight,  path: '/customer/profile' },
  ];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ─── HERO HEADER ─── */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.borderLight}`, padding: '52px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          {/* Purple accent blob */}
          <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '220px', height: '220px', background: T.primaryLight, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '140px', height: '140px', background: T.accentLight, borderRadius: '50%', filter: 'blur(35px)', pointerEvents: 'none' }} />

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={16} color={T.txt2} />
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { signOut(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: T.dangerLight, border: '1px solid rgba(225,29,72,0.15)', color: T.danger, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              <LogOut size={13} /> Sign Out
            </motion.button>
          </div>

          {/* Avatar + Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/profile')}
              style={{ width: '70px', height: '70px', borderRadius: '24px', overflow: 'hidden', border: `3px solid ${T.white}`, boxShadow: `0 0 0 3px ${tier.color}, 0 12px 28px rgba(0,0,0,0.12)`, cursor: 'pointer', background: T.bg2, flexShrink: 0 }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: T.primary, background: T.primaryLight }}>{displayName[0]?.toUpperCase()}</div>
              }
            </motion.div>
            <div>
              <div style={{ color: T.txt3, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {new Date().getHours() < 12 ? 'Good Morning ☀️' : new Date().getHours() < 18 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙'}
              </div>
              <div style={{ color: T.ink, fontSize: '26px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{displayName}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', padding: '3px 10px', borderRadius: '8px', background: tier.light, border: `1px solid ${tier.color}30` }}>
                <span style={{ fontSize: '12px' }}>{tier.icon}</span>
                <span style={{ color: tier.color, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tier.name} Member</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ─── FINANCIAL LEDGER CARD ─── */}
          <motion.div {...cardAnim(0)}
            style={{ position: 'relative', overflow: 'hidden', background: T.ink, borderRadius: '28px', padding: '24px', boxShadow: '0 20px 40px rgba(15,23,42,0.15)' }}>
            {/* Dynamic Glassmorphism Background elements */}
            <div style={{ position: 'absolute', top: '-50px', right: '-20px', width: '180px', height: '180px', background: 'linear-gradient(135deg, rgba(99,91,255,0.4), rgba(6,182,212,0.1))', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '140px', height: '140px', background: 'rgba(217,119,6,0.2)', borderRadius: '50%', filter: 'blur(30px)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Wallet size={18} color="#fff" />
                </div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em' }}>Financial Ledger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.3)' }}>
                <TrendingUp size={11} color="#34d399" />
                <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 900 }}>LIVE</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Total Volume', value: totalBought, color: '#fff',     bg: 'rgba(255,255,255,0.06)' },
                { label: 'Total Paid',   value: totalPaid,   color: '#34d399', bg: 'rgba(5,150,105,0.15)' },
                { label: 'Amount Due',  value: debt,        color: debt > 0 ? '#fb7185' : '#34d399', bg: debt > 0 ? 'rgba(225,29,72,0.15)' : 'rgba(5,150,105,0.15)' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: '18px', background: stat.bg, border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: '14px', fontWeight: 900 }}>
                    <AnimatedCounter value={stat.value} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── QUICK ACTIONS ─── */}
          <motion.div {...cardAnim(1)}>
            <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {quickActions.map((action) => (
                <motion.button key={action.id} whileTap={{ scale: 0.93 }} onClick={() => navigate(action.path)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 6px', borderRadius: T.radiusSm, background: T.white, border: `1px solid ${T.borderLight}`, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: action.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <action.icon size={20} color={action.color} />
                  </div>
                  <span style={{ color: T.txt, fontSize: '10px', fontWeight: 800 }}>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ─── LOYALTY TIER ─── */}
          <motion.div {...cardAnim(2)}
            style={{ background: T.white, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: '20px', boxShadow: T.shadow, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: tier.light, borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: tier.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{tier.icon}</div>
                <div>
                  <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Loyalty Status</div>
                  <div style={{ color: tier.color, fontSize: '16px', fontWeight: 900 }}>{tier.name} Member</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 600 }}>Total Orders</div>
                <div style={{ color: T.ink, fontSize: '20px', fontWeight: 900 }}>{orders.length}</div>
              </div>
            </div>

            {/* Badge icons row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Member', icon: Award,    reached: true },
                { label: 'Silver', icon: Star,     reached: totalBought >= 50000 },
                { label: 'Gold',   icon: Sparkles, reached: totalBought >= 150000 },
                { label: 'Gem',    icon: Zap,      reached: totalBought >= 500000 },
              ].map((b, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '10px', background: b.reached ? tier.light : T.bg, border: `1px solid ${b.reached ? tier.color + '30' : T.borderLight}` }}>
                  <b.icon size={13} color={b.reached ? tier.color : T.txt3} style={{ margin: '0 auto 3px', display: 'block' }} />
                  <div style={{ fontSize: '9px', fontWeight: 700, color: b.reached ? tier.color : T.txt3 }}>{b.label}</div>
                </div>
              ))}
            </div>

            {tier.next ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: T.txt2, fontSize: '11px', fontWeight: 600 }}>Progress to {tier.next}</span>
                  <span style={{ color: tier.color, fontSize: '11px', fontWeight: 800 }}>{fmt(tier.nextAt - totalBought)} to go</span>
                </div>
                <div style={{ height: '7px', background: T.bg, borderRadius: '4px', overflow: 'hidden', border: `1px solid ${T.borderLight}` }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${tierProgress}%` }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${T.primary})`, borderRadius: '4px' }} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', background: T.accentLight, borderRadius: '10px', color: T.accent, fontSize: '12px', fontWeight: 800 }}>
                🎉 Maximum Tier Reached — Diamond Member!
              </div>
            )}
          </motion.div>

          {/* ─── PROFILE COMPLETION NUDGE ─── */}
          {!customer.phone && (
            <motion.div {...cardAnim(3)} onClick={() => navigate('/customer/profile')}
              style={{ cursor: 'pointer', background: T.goldLight, borderRadius: T.radiusSm, border: '1px solid rgba(217,119,6,0.2)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={17} color={T.gold} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.gold, fontSize: '13px', fontWeight: 800 }}>Complete Your Profile</div>
                <div style={{ color: T.txt2, fontSize: '11px', fontWeight: 600 }}>Add a phone number to verify your account</div>
              </div>
              <ChevronRight size={16} color={T.gold} />
            </motion.div>
          )}

          {/* ─── RECENT ORDERS ─── */}
          <motion.div {...cardAnim(4)}
            style={{ background: T.white, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: '20px', boxShadow: T.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color={T.primary} />
                </div>
                <span style={{ color: T.ink, fontSize: '15px', fontWeight: 900 }}>Recent Orders</span>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/orders')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '10px', background: T.primaryLight, border: 'none', color: T.primary, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                View All <ArrowUpRight size={12} />
              </motion.button>
            </div>

            <AnimatePresence>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: T.txt3 }}>
                  <ShoppingCart size={32} color={T.txt3} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>No orders yet. Start shopping!</div>
                </div>
              ) : orders.map((o, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedOrder(o)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', marginBottom: i < orders.length - 1 ? '4px' : 0, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={18} color={T.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.ink, fontSize: '13px', fontWeight: 800 }}>Bakery Order</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                      <div style={{ color: T.txt3, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={10} />{new Date(o.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '6px', textTransform: 'uppercase',
                        background: o.status === 'PENDING' ? 'rgba(217,119,6,0.1)' : T.successLight,
                        color: o.status === 'PENDING' ? T.gold : T.success }}>
                        {o.status}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: T.ink, fontSize: '14px', fontWeight: 900 }}>{fmt(o.total_price)}</div>
                    <div style={{ color: T.primary, fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>Receipt →</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

        </div>
        <CustomerBottomNav />
      </div>

      <UnifiedReceiptViewer
        isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)}
        order={selectedOrder} appSettings={appSettings}
        customerName={profile?.full_name || customer?.name}
      />
    </AnimatedPage>
  );
};

export default CustomerDashboard;
