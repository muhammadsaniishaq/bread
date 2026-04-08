import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { useAppContext } from '../store/AppContext';
import {
  User, Mail, Phone, ShieldCheck, Languages, LogOut, AlertTriangle,
  Package, CreditCard, TrendingUp, MessageSquare, HelpCircle,
  ChevronRight, Star, Activity, Building2, Edit2, Check, X,
  Banknote, Truck, Users, CircleDollarSign
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import SupplierBottomNav from '../components/SupplierBottomNav';
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

export default function SupplierProfile() {
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer } = useAppContext();
  const { language, setLanguage } = useTranslation();

  const [profile,   setProfile]   = useState<any>(null);
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'customers'>('overview');

  // ── Fetch profile from Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setEditName(data.full_name || '');
          setEditPhone(data.phone || '');
        }
      });
  }, [user]);

  // ── My account (customer record linked to this supplier's profile) ─────────
  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  // ── My transactions (only mine — full isolation) ───────────────────────────
  const myTxns = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id),
    [transactions, myAccount, user]);

  // ── Customers assigned to ME only ─────────────────────────────────────────
  const myCustomers = useMemo(() =>
    customers.filter(c => c.assignedSupplierId === myAccount?.id),
    [customers, myAccount]);

  // ── Financial stats ────────────────────────────────────────────────────────
  const totalDispatched = useMemo(() =>
    myTxns.filter(t => t.status === 'COMPLETED' && t.type !== 'Return')
      .reduce((s, t) => s + t.totalPrice, 0), [myTxns]);

  const pendingCount = useMemo(() =>
    myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
    [myTxns]);

  const completedCount = useMemo(() =>
    myTxns.filter(t => t.status === 'COMPLETED').length, [myTxns]);

  const hasDebt = (myAccount?.debtBalance || 0) > 0;
  const initials = (profile?.full_name || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Per-customer payment status ───────────────────────────────────────────
  const getCustomerStatus = (customerId: string) => {
    const cTxns = transactions.filter(t => t.customerId === customerId && t.status === 'COMPLETED');
    const hasPayNow    = cTxns.some(t => t.type === 'Cash');
    const hasOnDeliver = cTxns.some(t => t.type === 'Debt');
    return { hasPayNow, hasOnDeliver };
  };

  // ── Save profile edits ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: editName, phone: editPhone }).eq('id', user.id);
      if (myAccount) await updateCustomer({ ...myAccount, name: editName, phone: editPhone });
      setProfile((p: any) => ({ ...p, full_name: editName, phone: editPhone }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', paddingBottom: '110px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Hero Header ── */}
        <div style={{ background: 'linear-gradient(158deg,#1a0533 0%,#3b0764 35%,#4f46e5 80%,#6366f1 100%)', padding: '52px 24px 96px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.35) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ width: '88px', height: '88px', borderRadius: '28px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '14px', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)' }}
            >
              {initials}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {profile?.full_name || 'Supplier'}
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
              style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              {user?.email}
            </motion.p>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '11px', fontWeight: 800 }}>
              <ShieldCheck size={12} /> Verified Supplier
            </motion.div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ padding: '0 16px', marginTop: '-50px', position: 'relative', zIndex: 30, marginBottom: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '4px', display: 'flex', gap: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {(['overview', 'customers'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '11px 8px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s', background: activeTab === tab ? '#4f46e5' : 'transparent', color: activeTab === tab ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                {tab === 'overview' ? <User size={13} /> : <Users size={13} />}
                {tab === 'overview' ? 'My Profile' : `My Customers${myCustomers.length ? ` (${myCustomers.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ padding: '0 16px', position: 'relative', zIndex: 20 }}>

          <AnimatePresence mode="wait">
            {/* ══════════════ OVERVIEW TAB ══════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Debt Card */}
                <motion.div variants={fadeUp}>
                  <div style={{ background: hasDebt ? 'linear-gradient(135deg,#7f1d1d,#ef4444)' : 'linear-gradient(135deg,#064e3b,#10b981)', borderRadius: '24px', padding: '20px 22px', marginBottom: '14px', boxShadow: hasDebt ? '0 16px 50px -10px rgba(239,68,68,0.45)' : '0 16px 50px -10px rgba(16,185,129,0.35)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-30px', opacity: 0.1 }}><AlertTriangle size={120} color="#fff" /></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        {hasDebt ? 'My Debt Balance' : 'Debt Status'}
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmt(myAccount?.debtBalance || 0)}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                        {hasDebt ? 'Settle with Store Keepers to reduce balance' : 'No outstanding debt — great work! 🎉'}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 4 Stats */}
                <motion.div variants={fadeUp}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'Dispatched',    val: fmt(totalDispatched),     icon: TrendingUp,  color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                      { label: 'Pending',       val: String(pendingCount),     icon: CreditCard,  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                      { label: 'Completed',     val: String(completedCount),   icon: Package,     color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                      { label: 'My Customers',  val: String(myCustomers.length), icon: Users,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '10px' }}>
                          <s.icon size={17} strokeWidth={2.2} />
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{s.val}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Edit Profile Card */}
                <motion.div variants={fadeUp}>
                  <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Account Info</div>
                      {!editing ? (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(79,70,229,0.2)', background: 'rgba(79,70,229,0.06)', color: '#4f46e5', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                          <Edit2 size={11} /> Edit
                        </motion.button>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditing(false); setEditName(profile?.full_name || ''); setEditPhone(profile?.phone || ''); }}
                            style={{ width: '30px', height: '30px', borderRadius: '9px', border: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={14} />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSaveProfile} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '10px', border: 'none', background: saving ? '#a5b4fc' : '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            <Check size={12} /> {saving ? 'Saving...' : 'Save'}
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Fields */}
                    <div style={{ padding: '4px 0' }}>
                      {editing ? (
                        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Full Name</label>
                            <input value={editName} onChange={e => setEditName(e.target.value)}
                              style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Phone Number</label>
                            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel"
                              style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      ) : (
                        [
                          { icon: User,     label: 'Full Name',    val: profile?.full_name || 'Loading...', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                          { icon: Mail,     label: 'Email',        val: user?.email || 'N/A',               color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                          { icon: Phone,    label: 'Phone',        val: profile?.phone || myAccount?.phone || 'Not set', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                          { icon: Building2,label: 'Account Type', val: 'Supplier Account',                 color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                          { icon: Activity, label: 'Total Transactions', val: String(myTxns.length),        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        ].map((row, i, arr) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color, flexShrink: 0 }}>
                              <row.icon size={18} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Achievement badge */}
                <motion.div variants={fadeUp}>
                  <div style={{ background: 'linear-gradient(135deg,#fefce8,#fef9c3)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', flexShrink: 0 }}>
                      <Star size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#78350f' }}>Trusted Supplier</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginTop: '2px' }}>{completedCount} completed transactions</div>
                    </div>
                  </div>
                </motion.div>

                {/* Preferences */}
                <motion.div variants={fadeUp}>
                  <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
                    <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Preferences & Support</div>
                    </div>

                    {/* Language */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Languages size={18} /></div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>App Language</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>{language === 'en' ? 'English' : 'Hausa'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '2px' }}>
                        {(['en', 'ha'] as const).map(lang => (
                          <button key={lang} onClick={() => setLanguage(lang)}
                            style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', background: language === lang ? '#4f46e5' : 'transparent', color: language === lang ? '#fff' : '#94a3b8', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {lang.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <motion.button whileTap={{ scale: 0.98 }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><MessageSquare size={18} /></div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>WhatsApp Support</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Chat with us directly</div>
                        </div>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" />
                    </motion.button>

                    {/* Help */}
                    <motion.button whileTap={{ scale: 0.98 }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}><HelpCircle size={18} /></div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Help &amp; FAQ</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Common questions answered</div>
                        </div>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Sign out */}
                <motion.div variants={fadeUp}>
                  <AnimatePresence>
                    {signOutConfirm ? (
                      <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1.5px solid rgba(239,68,68,0.2)', marginBottom: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Confirm Sign Out?</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '18px' }}>Ka tabbata kana son fita?</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => setSignOutConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', background: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                          <button onClick={signOut} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Sign Out</button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button key="signout" whileTap={{ scale: 0.97 }} onClick={() => setSignOutConfirm(true)}
                        style={{ width: '100%', padding: '16px', borderRadius: '20px', border: 'none', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                        <LogOut size={18} /> Sign Out
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={fadeUp} style={{ textAlign: 'center', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bakery Management System v2.4</div>
                </motion.div>
              </motion.div>
            )}

            {/* ══════════════ MY CUSTOMERS TAB ══════════════ */}
            {activeTab === 'customers' && (
              <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {myCustomers.length === 0 ? (
                  <motion.div variants={fadeUp} style={{ background: '#fff', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Users size={28} color="#cbd5e1" />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>No Customers Assigned</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>The Manager has not assigned any customers to you yet.</div>
                  </motion.div>
                ) : (
                  <>
                    {/* Summary */}
                    <motion.div variants={fadeUp}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
                        {[
                          { label: 'Total',   val: myCustomers.length, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                          { label: 'In Debt', val: myCustomers.filter(c => (c.debtBalance || 0) > 0).length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                          { label: 'Clear',   val: myCustomers.filter(c => (c.debtBalance || 0) === 0).length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: '#fff', borderRadius: '18px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Customer list */}
                    <motion.div variants={fadeUp}>
                      <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '14px' }}>
                        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assigned Customers</div>
                        </div>

                        {myCustomers.map((c, i) => {
                          const { hasPayNow, hasOnDeliver } = getCustomerStatus(c.id);
                          const hasDebtBalance = (c.debtBalance || 0) > 0;

                          return (
                            <div key={c.id} style={{ padding: '14px 20px', borderBottom: i < myCustomers.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                {/* Avatar */}
                                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: hasDebtBalance ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: hasDebtBalance ? '#ef4444' : '#10b981', flexShrink: 0 }}>
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 900, color: hasDebtBalance ? '#ef4444' : '#10b981', flexShrink: 0, marginLeft: '8px' }}>
                                      {fmt(c.debtBalance || 0)}
                                    </div>
                                  </div>
                                  {c.phone && (
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>{c.phone}</div>
                                  )}
                                  {/* Payment method badges */}
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {hasPayNow && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <Banknote size={10} color="#10b981" />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981' }}>Pay Now</span>
                                      </div>
                                    )}
                                    {hasOnDeliver && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        <Truck size={10} color="#f59e0b" />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b' }}>Pay on Delivery</span>
                                      </div>
                                    )}
                                    {!hasPayNow && !hasOnDeliver && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: '#f1f5f9' }}>
                                        <CircleDollarSign size={10} color="#94a3b8" />
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>No transactions yet</span>
                                      </div>
                                    )}
                                    {hasDebtBalance && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                        <AlertTriangle size={10} color="#ef4444" />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444' }}>Has Debt</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>

                    <motion.div variants={fadeUp} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', paddingBottom: '8px' }}>
                      Only customers assigned to you are shown here
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <SupplierBottomNav />
    </AnimatedPage>
  );
}
