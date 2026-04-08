import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { useAppContext } from '../store/AppContext';
import {
  User, Mail, Phone, ShieldCheck, Languages, LogOut,
  AlertTriangle, TrendingDown, Package, CreditCard,
  MessageSquare, HelpCircle, ChevronRight, Star,
  Activity, TrendingUp, Building2
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import SupplierBottomNav from '../components/SupplierBottomNav';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
};

export default function SupplierProfile() {
  const { user, signOut } = useAuth();
  const { customers, transactions } = useAppContext();
  const { t, language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  const myTransactions = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id),
    [transactions, myAccount, user]);

  const totalDispatched = useMemo(() =>
    myTransactions.filter(t => t.status === 'COMPLETED' && t.type !== 'Return')
      .reduce((s, t) => s + t.totalPrice, 0), [myTransactions]);

  const totalReturned = useMemo(() =>
    myTransactions.filter(t => t.type === 'Return' && t.status === 'COMPLETED')
      .reduce((s, t) => s + t.totalPrice, 0), [myTransactions]);

  const pendingCount = useMemo(() =>
    myTransactions.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
    [myTransactions]);

  const completedCount = useMemo(() =>
    myTransactions.filter(t => t.status === 'COMPLETED').length,
    [myTransactions]);

  const hasDebt = (myAccount?.debtBalance || 0) > 0;
  const initials = (profile?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', paddingBottom: '110px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ─── Hero Header ─── */}
        <div style={{
          background: 'linear-gradient(158deg, #1a0533 0%, #3b0764 35%, #4f46e5 80%, #6366f1 100%)',
          padding: '56px 24px 100px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '30%', left: '40%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{
                  width: '90px', height: '90px', borderRadius: '30px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '30px', fontWeight: 900, color: '#fff',
                  marginBottom: '14px',
                  boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                {initials}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}
              >
                {profile?.full_name || 'Supplier'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.01em' }}
              >
                {user?.email}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '11px', fontWeight: 800 }}
              >
                <ShieldCheck size={12} />
                {t('store.verifiedAccess') || 'Verified Supplier'}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ padding: '0 16px', marginTop: '-60px', position: 'relative', zIndex: 20 }}
        >

          {/* ─── Hero Debt Card ─── */}
          <motion.div variants={fadeUp}>
            <div style={{
              background: hasDebt
                ? 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)'
                : 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
              borderRadius: '28px',
              padding: '22px 24px',
              marginBottom: '14px',
              boxShadow: hasDebt
                ? '0 16px 50px -10px rgba(239,68,68,0.5)'
                : '0 16px 50px -10px rgba(16,185,129,0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.12 }}>
                <AlertTriangle size={130} color="#fff" />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertTriangle size={13} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {hasDebt ? (t('dash.debtYouOwe') || 'Current Debt Balance') : 'Clear Slate'}
                  </span>
                </div>
                <div style={{ fontSize: '38px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {fmt(myAccount?.debtBalance || 0)}
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  {hasDebt ? 'Settle with Store Keepers to reduce balance' : 'No outstanding debt — great work! 🎉'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── 4 Mini Stats Row ─── */}
          <motion.div variants={fadeUp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Total Dispatched', val: fmt(totalDispatched), icon: Package, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                { label: 'Total Returned', val: fmt(totalReturned), icon: TrendingDown, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                { label: 'Completed Orders', val: String(completedCount), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                { label: 'Pending Requests', val: String(pendingCount), icon: CreditCard, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
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

          {/* ─── Account Info Card ─── */}
          <motion.div variants={fadeUp}>
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Account Info</div>
              </div>

              {[
                { icon: User, label: 'Full Name', val: profile?.full_name || 'Loading...', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                { icon: Mail, label: 'Email Address', val: user?.email || 'N/A', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                { icon: Phone, label: 'Phone Number', val: myAccount?.phone || profile?.phone || 'Not set', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                { icon: Building2, label: 'Account Type', val: 'Supplier Account', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                { icon: Activity, label: 'Total Transactions', val: String(myTransactions.length), color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color, flexShrink: 0 }}>
                    <row.icon size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Achievement / Status Badge ─── */}
          <motion.div variants={fadeUp}>
            <div style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: '20px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '14px',
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', flexShrink: 0 }}>
                <Star size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#78350f' }}>Trusted Supplier</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginTop: '2px' }}>
                  {completedCount} completed transactions on record
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── Preferences ─── */}
          <motion.div variants={fadeUp}>
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Preferences</div>
              </div>

              {/* Language Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <Languages size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>App Language</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '1px' }}>
                      {language === 'en' ? 'English selected' : 'An zaɓi Hausa'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '2px' }}>
                  {['en', 'ha'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang as 'en' | 'ha')}
                      style={{
                        padding: '6px 12px', borderRadius: '10px', border: 'none',
                        background: language === lang ? '#4f46e5' : 'transparent',
                        color: language === lang ? '#fff' : '#94a3b8',
                        fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Support */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>WhatsApp Support</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '1px' }}>Chat with us directly</div>
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </motion.button>

              {/* Help & FAQ */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                    <HelpCircle size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Help &amp; FAQ</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '1px' }}>Common questions answered</div>
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* ─── Sign Out Button ─── */}
          <motion.div variants={fadeUp}>
            <AnimatePresence>
              {showSignOutConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: '1.5px solid rgba(239,68,68,0.2)', boxShadow: '0 4px 20px rgba(239,68,68,0.1)', marginBottom: '14px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Confirm Sign Out?</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '20px' }}>Ka tabbata kana son fita?</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setShowSignOutConfirm(false)}
                      style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', background: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={signOut}
                      style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="signout"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSignOutConfirm(true)}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '20px', border: 'none',
                    background: 'rgba(239,68,68,0.07)',
                    color: '#ef4444', fontSize: '14px', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <LogOut size={18} />
                  {t('store.logout') || 'Sign Out'}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Footer ─── */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', paddingBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bakery Management System</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>Version 2.4.0 · Built with ❤️ in Nigeria</div>
          </motion.div>

        </motion.div>
      </div>
      <SupplierBottomNav />
    </AnimatedPage>
  );
}
