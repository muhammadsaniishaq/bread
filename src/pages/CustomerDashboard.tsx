import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import {
  ShoppingBag, Wallet, LogOut, Star,
  Calendar, ShoppingCart, Zap,
  ChefHat, TrendingUp, Package,
  FileText, Phone, Bell, ChevronRight,
  Award, Sparkles, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { UnifiedReceiptViewer } from '../components/UnifiedReceiptViewer';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

/* ─────────────────────────────────────────
   DESIGN SYSTEM V4 — Premium Dark Palette
───────────────────────────────────────── */
const T = {
  bg:          'linear-gradient(145deg, #0f0c29, #302b63, #24243e)',
  bgSolid:     '#0f0c29',
  glass:       'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHover:  'rgba(255,255,255,0.10)',
  panel:       'rgba(255,255,255,0.08)',
  primary:     '#7c3aed',
  primaryGlow: 'rgba(124, 58, 237, 0.4)',
  accent:      '#06b6d4',
  accentGlow:  'rgba(6, 182, 212, 0.3)',
  success:     '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.3)',
  danger:      '#f43f5e',
  dangerGlow:  'rgba(244, 63, 94, 0.3)',
  gold:        '#f59e0b',
  goldGlow:    'rgba(245, 158, 11, 0.3)',
  silver:      '#94a3b8',
  bronze:      '#cd7c2f',
  white:       '#ffffff',
  txt:         'rgba(255,255,255,0.92)',
  txt2:        'rgba(255,255,255,0.55)',
  txt3:        'rgba(255,255,255,0.30)',
  radius:      '24px',
  radiusSm:    '16px',
  shadow:      '0 25px 60px -12px rgba(0,0,0,0.6)',
  shadowSm:    '0 8px 30px -8px rgba(0,0,0,0.4)',
};

const fmt = (v: number) => `₦${v.toLocaleString()}`;

const getLoyaltyTier = (total: number) => {
  if (total >= 500000) return { name: 'Diamond', icon: '💎', color: T.accent, glow: T.accentGlow, next: null, nextAt: 0 };
  if (total >= 150000) return { name: 'Gold', icon: '🥇', color: T.gold, glow: T.goldGlow, next: 'Diamond', nextAt: 500000 };
  if (total >= 50000)  return { name: 'Silver', icon: '🥈', color: T.silver, glow: 'rgba(148,163,184,0.3)', next: 'Gold', nextAt: 150000 };
  return { name: 'Bronze', icon: '🥉', color: T.bronze, glow: 'rgba(205,124,47,0.3)', next: 'Silver', nextAt: 50000 };
};

const cardAnim = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const } }
});

// Animated Number Counter
const AnimatedCounter: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '₦' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
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
  const [notifCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData(user.id);
  }, [user]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (prof) {
        if (!prof.full_name && user?.user_metadata?.full_name) {
          prof.full_name = user.user_metadata.full_name;
          supabase.from('profiles').update({ full_name: prof.full_name }).eq('id', id).then();
        }
        setProfile(prof);
      }

      let { data: cust } = await supabase.from('customers').select('*').eq('profile_id', id).maybeSingle();
      if (!cust && user?.email) {
        const { data: byEmail } = await supabase.from('customers').select('*').eq('email', user.email).maybeSingle();
        if (byEmail) {
          await supabase.from('customers').update({ profile_id: id }).eq('id', byEmail.id);
          cust = byEmail;
        }
      }

      if (cust) {
        setCustomer(cust);
        const { data: allOrds } = await supabase
          .from('orders').select('*')
          .eq('customer_id', cust.id)
          .order('created_at', { ascending: false });
        if (allOrds) {
          setOrders(allOrds.slice(0, 6));
          setTotalBought(allOrds.reduce((s, o) => s + (o.total_price || 0), 0));
        }
      } else {
        const { data: newCust } = await supabase.from('customers').insert({
          name: prof?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
          email: user?.email,
          profile_id: id,
          debt_balance: 0
        }).select().single();
        if (newCust) setCustomer(newCust);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bgSolid, gap: '16px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', borderRadius: '12px', border: `3px solid ${T.primary}`, borderTopColor: 'transparent' }} />
      <div style={{ color: T.txt2, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Portal...</div>
    </div>
  );

  if (!customer) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bgSolid, textAlign: 'center', padding: '40px' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: '80px', height: '80px', borderRadius: '24px', background: T.dangerGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <Zap size={40} color={T.danger} />
      </motion.div>
      <h2 style={{ color: T.white, fontSize: '22px', fontWeight: 900, margin: '0 0 8px' }}>Profile Unlinked</h2>
      <p style={{ color: T.txt2, fontSize: '13px', margin: '0 0 32px' }}>Your account ({user?.email}) needs to be linked.<br />Please contact management.</p>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { signOut(); navigate('/login'); }}
        style={{ padding: '14px 28px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>
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
    { id: 'shop',    label: 'Shop',     icon: ShoppingCart, color: T.primary,  glow: T.primaryGlow, path: '/customer/store' },
    { id: 'orders',  label: 'Orders',   icon: Package,      color: T.accent,   glow: T.accentGlow,  path: '/customer/orders' },
    { id: 'docs',    label: 'My Docs',  icon: FileText,     color: T.gold,     glow: T.goldGlow,    path: '/customer/docs' },
    { id: 'profile', label: 'Profile',  icon: ChefHat,      color: T.success,  glow: T.successGlow, path: '/customer/profile' },
  ];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', sans-serif" }}>

        {/* ─── HERO HEADER ─── */}
        <div style={{ position: 'relative', padding: '56px 20px 32px', overflow: 'hidden' }}>
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', background: T.primaryGlow, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-20px', right: '-40px', width: '150px', height: '150px', background: T.accentGlow, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <motion.div whileTap={{ scale: 0.95 }}
                style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.glass, border: `1px solid ${T.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                <Bell size={16} color={T.txt} />
                {notifCount > 0 && <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: T.danger }} />}
              </motion.div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { signOut(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: T.glass, border: `1px solid ${T.glassBorder}`, color: T.txt2, fontSize: '12px', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
              <LogOut size={14} />
              Sign Out
            </motion.button>
          </div>

          {/* Avatar + Greeting */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 2 }}>
            <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/profile')}
              style={{ width: '72px', height: '72px', borderRadius: '22px', overflow: 'hidden', border: `2px solid ${tier.color}`, boxShadow: `0 0 20px ${tier.glow}`, cursor: 'pointer', flexShrink: 0, background: T.glass }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{displayName[0]?.toUpperCase()}</div>
              }
            </motion.div>
            <div>
              <div style={{ color: T.txt2, fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>Welcome back,</div>
              <div style={{ color: T.white, fontSize: '26px', fontWeight: 900, lineHeight: 1.1 }}>{displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '14px' }}>{tier.icon}</span>
                <span style={{ color: tier.color, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier.name} Member</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ─── FINANCIAL LEDGER CARD ─── */}
          <motion.div {...cardAnim(0)}
            style={{ background: T.glass, borderRadius: T.radius, border: `1px solid ${T.glassBorder}`, padding: '24px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: T.successGlow, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.successGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={18} color={T.success} />
                </div>
                <span style={{ color: T.txt, fontSize: '14px', fontWeight: 800 }}>Financial Ledger</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <TrendingUp size={12} color={T.success} />
                <span style={{ color: T.success, fontSize: '10px', fontWeight: 900 }}>LIVE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Total Bought', value: totalBought, color: T.white, bg: 'rgba(255,255,255,0.06)' },
                { label: 'Total Paid',   value: totalPaid,   color: T.success, bg: 'rgba(16,185,129,0.08)' },
                { label: 'Balance Due',  value: debt,        color: debt > 0 ? T.danger : T.success, bg: debt > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                  style={{ textAlign: 'center', padding: '14px 8px', borderRadius: '16px', background: stat.bg, border: `1px solid rgba(255,255,255,0.06)` }}>
                  <div style={{ color: T.txt2, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: '13px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                    <AnimatedCounter value={stat.value} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── QUICK ACTIONS ─── */}
          <motion.div {...cardAnim(1)}>
            <div style={{ color: T.txt2, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {quickActions.map((action) => (
                <motion.button key={action.id} whileTap={{ scale: 0.93 }} onClick={() => navigate(action.path)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 8px', borderRadius: T.radiusSm, background: T.glass, border: `1px solid ${T.glassBorder}`, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: action.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${action.color}40` }}>
                    <action.icon size={18} color={action.color} />
                  </div>
                  <span style={{ color: T.txt, fontSize: '10px', fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ─── LOYALTY TIER ─── */}
          <motion.div {...cardAnim(2)}
            style={{ background: T.glass, borderRadius: T.radius, border: `1px solid ${T.glassBorder}`, padding: '20px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: tier.glow, borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: tier.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {tier.icon}
                </div>
                <div>
                  <div style={{ color: T.txt2, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Loyalty Status</div>
                  <div style={{ color: tier.color, fontSize: '16px', fontWeight: 900 }}>{tier.name} Member</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: T.txt2, fontSize: '10px', fontWeight: 700 }}>Total Orders</div>
                <div style={{ color: T.white, fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {orders.length} <ShoppingCart size={14} color={T.txt2} />
                </div>
              </div>
            </div>

            {/* Award badges row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Member', icon: Award, reached: true },
                { label: 'Silver', icon: Star, reached: totalBought >= 50000 },
                { label: 'Gold', icon: Sparkles, reached: totalBought >= 150000 },
                { label: 'Diamond', icon: Zap, reached: totalBought >= 500000 },
              ].map((badge, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '10px', background: badge.reached ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${badge.reached ? T.glassBorder : 'rgba(255,255,255,0.04)'}` }}>
                  <badge.icon size={14} color={badge.reached ? tier.color : T.txt3} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '9px', fontWeight: 700, color: badge.reached ? T.txt : T.txt3 }}>{badge.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {tier.next && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: T.txt2, fontSize: '10px', fontWeight: 700 }}>Progress to {tier.next}</span>
                  <span style={{ color: tier.color, fontSize: '10px', fontWeight: 900 }}>{fmt(tier.nextAt - totalBought)} remaining</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${tierProgress}%` }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${T.accent})`, borderRadius: '3px' }} />
                </div>
              </div>
            )}
            {!tier.next && (
              <div style={{ textAlign: 'center', padding: '8px', background: T.accentGlow, borderRadius: '10px', color: T.accent, fontSize: '11px', fontWeight: 800 }}>
                🎉 Maximum Tier Reached! You're a Diamond Member.
              </div>
            )}
          </motion.div>

          {/* ─── CONTACT INFO BANNER ─── */}
          {!customer.phone && (
            <motion.div {...cardAnim(3)}
              onClick={() => navigate('/customer/profile')}
              style={{ cursor: 'pointer', background: 'rgba(245,158,11,0.08)', borderRadius: T.radiusSm, border: '1px solid rgba(245,158,11,0.25)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} color={T.gold} />
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
            style={{ background: T.glass, borderRadius: T.radius, border: `1px solid ${T.glassBorder}`, padding: '20px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color={T.primary} />
                </div>
                <span style={{ color: T.txt, fontSize: '15px', fontWeight: 900 }}>Recent Orders</span>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/orders')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '10px', background: T.primaryGlow, border: 'none', color: T.primary, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                View All <ArrowUpRight size={12} />
              </motion.button>
            </div>

            <AnimatePresence>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: T.txt3, fontWeight: 700, fontSize: '13px' }}>
                  <ShoppingCart size={32} color={T.txt3} style={{ margin: '0 auto 12px', display: 'block' }} />
                  No orders yet. Start shopping!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {orders.map((o, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      onClick={() => setSelectedOrder(o)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', borderRadius: '14px', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.glassHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShoppingBag size={18} color={T.primary} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: T.txt, fontSize: '13px', fontWeight: 800 }}>Bakery Order</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                          <div style={{ color: T.txt2, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={10} />
                            {new Date(o.created_at).toLocaleDateString()}
                          </div>
                          <div style={{
                            fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '6px', textTransform: 'uppercase',
                            background: o.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: o.status === 'PENDING' ? T.gold : T.success
                          }}>{o.status}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: T.white, fontSize: '14px', fontWeight: 900 }}>{fmt(o.total_price)}</div>
                        <div style={{ color: T.primary, fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>Receipt →</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        <CustomerBottomNav />
      </div>

      <UnifiedReceiptViewer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        appSettings={appSettings}
        customerName={profile?.full_name || customer?.name}
      />
    </AnimatedPage>
  );
};

export default CustomerDashboard;
