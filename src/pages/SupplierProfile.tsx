import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { useAppContext } from '../store/AppContext';
import {
  User, Mail, Phone, ShieldCheck, Languages, LogOut, AlertTriangle,
  Package, CreditCard, TrendingUp, MessageSquare, HelpCircle,
  ChevronRight, Star, Activity, Building2, Edit2, Check, X,
  Banknote, Truck, Users, CircleDollarSign, Landmark, Clock,
  Copy, Camera
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import SupplierBottomNav from '../components/SupplierBottomNav';
import { ImageCropModal } from '../components/ImageCropModal';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

export default function SupplierProfile() {
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer } = useAppContext();
  const { language, setLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile,        setProfile]        = useState<any>(null);
  const [editing,        setEditing]        = useState(false);
  const [editName,       setEditName]       = useState('');
  const [editPhone,      setEditPhone]      = useState('');
  const [editAcctNo,     setEditAcctNo]     = useState('');
  const [editBankName,   setEditBankName]   = useState('');
  const [editImage,      setEditImage]      = useState('');
  const [saving,         setSaving]         = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [activeTab,      setActiveTab]      = useState<'overview'|'customers'>('overview');
  const [copied,         setCopied]         = useState(false);
  const [showCropper,    setShowCropper]    = useState(false);
  const [cropSrc,        setCropSrc]        = useState('');

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setEditName(data.full_name || '');
          setEditPhone(data.phone || '');
          setEditAcctNo(data.account_number || '');
          setEditBankName(data.bank_name || '');
          setEditImage(data.avatar_url || '');
        }
      });
  }, [user]);

  // ── My account ─────────────────────────────────────────────────────────────
  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  // ── My transactions ────────────────────────────────────────────────────────
  const myTxns = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id),
    [transactions, myAccount, user]);

  // ── Customers assigned to ME — dual match (profile UUID or customer record ID) ──
  const myCustomers = useMemo(() =>
    customers.filter(c =>
      (user?.id && c.assignedSupplierId === user.id) ||
      (myAccount?.id && c.assignedSupplierId === myAccount.id)
    ),
    [customers, user, myAccount]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDispatched = useMemo(() =>
    myTxns.filter(t => t.status === 'COMPLETED' && t.type !== 'Return')
      .reduce((s, t) => s + t.totalPrice, 0), [myTxns]);

  const pendingCount = useMemo(() =>
    myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
    [myTxns]);

  const completedCount = useMemo(() =>
    myTxns.filter(t => t.status === 'COMPLETED').length, [myTxns]);

  const hasDebt = (myAccount?.debtBalance || 0) > 0;

  const initials = (profile?.full_name || user?.email || 'S')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Customer payment status ────────────────────────────────────────────────
  const getCustomerStatus = (customerId: string) => {
    const cTxns = transactions.filter(t => t.customerId === customerId && t.status === 'COMPLETED');
    return {
      hasPayNow:    cTxns.some(t => t.type === 'Cash'),
      hasOnDeliver: cTxns.some(t => t.type === 'Debt'),
    };
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = (base64: string) => {
    setEditImage(base64);
    setShowCropper(false);
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name:      editName,
        account_number: editAcctNo,
        bank_name:      editBankName,
        avatar_url:     editImage || null,
      }).eq('id', user.id);

      if (error) throw error;

      // Also save phone + name to the linked customer record (if exists)
      if (myAccount) {
        await updateCustomer({ ...myAccount, name: editName, phone: editPhone });
      } else if (editPhone) {
        // Fallback: upsert a minimal customer record linked to this profile
        await supabase.from('customers').upsert({
          id: user.id,
          name: editName,
          phone: editPhone,
          profile_id: user.id,
          debt_balance: 0,
          loyalty_points: 0,
        }, { onConflict: 'profile_id' });
      }

      setProfile((p: any) => ({
        ...p,
        full_name:      editName,
        account_number: editAcctNo,
        bank_name:      editBankName,
        avatar_url:     editImage || null,
      }));
      setEditing(false);
    } catch (err: any) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(profile?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditAcctNo(profile?.account_number || '');
    setEditBankName(profile?.bank_name || '');
    setEditImage(profile?.avatar_url || '');
    setEditing(false);
  };

  const handleCopyAcct = () => {
    const acctNo = profile?.account_number;
    if (!acctNo) return;
    navigator.clipboard.writeText(acctNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const acctNo   = profile?.account_number;
  const bankName = profile?.bank_name;
  const avatarUrl = profile?.avatar_url;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', paddingBottom: '110px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Hero Header ── */}
        <div style={{ background: 'linear-gradient(158deg,#1a0533 0%,#3b0764 35%,#4f46e5 80%,#6366f1 100%)', padding: '52px 24px 96px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.35) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,70,229,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ position: 'relative', marginBottom: '14px' }}
            >
              <div style={{ width: '92px', height: '92px', borderRadius: '30px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 900, color: '#fff', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {profile?.full_name || user?.email || 'Supplier'}
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
              style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              {user?.email}
            </motion.p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '11px', fontWeight: 800 }}>
                <ShieldCheck size={12} /> Verified Supplier
              </motion.div>
              {myCustomers.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.28 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>
                  <Clock size={12} /> Waiting for Assignment
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.28 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', fontSize: '11px', fontWeight: 800 }}>
                  <Users size={12} /> {myCustomers.length} Customers
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ padding: '0 16px', marginTop: '-50px', position: 'relative', zIndex: 30, marginBottom: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '4px', display: 'flex', gap: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {(['overview', 'customers'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '11px 8px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s', background: activeTab === tab ? '#4f46e5' : 'transparent', color: activeTab === tab ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                {tab === 'overview' ? <User size={13} /> : <Users size={13} />}
                {tab === 'overview' ? 'My Profile' : `Customers (${myCustomers.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '0 16px', position: 'relative', zIndex: 20 }}>
          <AnimatePresence mode="wait">

            {/* ══════════════ OVERVIEW TAB ══════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Debt Card */}
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

                {/* 4 Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Dispatched',   val: fmt(totalDispatched),       icon: TrendingUp,  color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                    { label: 'Pending',      val: String(pendingCount),       icon: CreditCard,  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                    { label: 'Completed',    val: String(completedCount),     icon: Package,     color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                    { label: 'My Customers', val: String(myCustomers.length), icon: Users,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
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

                {/* ── Profile & Bank Card ── */}
                <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>

                  {/* Card Header */}
                  <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.06),rgba(139,92,246,0.06))', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                        <User size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>My Profile</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>Personal & bank details</div>
                      </div>
                    </div>
                    {!editing && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(79,70,229,0.2)', background: 'rgba(79,70,229,0.06)', color: '#4f46e5', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                        <Edit2 size={11} /> Edit
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {editing ? (
                      /* ── EDIT FORM ── */
                      <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: '20px' }}>

                        {/* Avatar Upload */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f1f5f9', border: '2px solid rgba(79,70,229,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#4f46e5' }}>
                              {editImage
                                ? <img src={editImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initials
                              }
                            </div>
                            <button onClick={() => fileInputRef.current?.click()}
                              style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '30px', height: '30px', borderRadius: '10px', background: '#4f46e5', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Camera size={13} color="#fff" />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { label: 'Full Name',       val: editName,     set: setEditName,     type: 'text',  ph: 'Your name' },
                            { label: 'Phone Number',    val: editPhone,    set: setEditPhone,    type: 'tel',   ph: '080...' },
                            { label: 'Bank Name',       val: editBankName, set: setEditBankName, type: 'text',  ph: 'e.g. First Bank, GTBank' },
                            { label: 'Account Number',  val: editAcctNo,   set: setEditAcctNo,   type: 'tel',   ph: '0123456789' },
                          ].map(f => (
                            <div key={f.label}>
                              <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                              <input
                                type={f.type} value={f.val} placeholder={f.ph}
                                onChange={e => f.set(e.target.value)}
                                maxLength={f.label === 'Account Number' ? 10 : undefined}
                                style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '12px', padding: '12px 14px', fontSize: f.label === 'Account Number' ? '16px' : '14px', fontWeight: f.label === 'Account Number' ? 900 : 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box', letterSpacing: f.label === 'Account Number' ? '0.1em' : 'normal' }}
                              />
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button onClick={handleCancelEdit}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <X size={14} /> Cancel
                          </button>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveProfile} disabled={saving}
                            style={{ flex: 2, padding: '12px', border: 'none', background: saving ? '#a5b4fc' : '#4f46e5', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                        {/* Bank Account Display */}
                        {acctNo ? (
                          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            {bankName && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Landmark size={14} color="#4f46e5" />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{bankName}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Account Number</div>
                                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.1em' }}>
                                  {acctNo.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                                </div>
                              </div>
                              <motion.button whileTap={{ scale: 0.88 }} onClick={handleCopyAcct}
                                style={{ width: '42px', height: '42px', borderRadius: '13px', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(79,70,229,0.08)', border: `1px solid ${copied ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: copied ? '#10b981' : '#4f46e5' }}>
                                <Copy size={17} />
                              </motion.button>
                            </div>
                            {copied && <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '6px' }}>✓ Copied to clipboard</div>}
                          </div>
                        ) : (
                          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(245,158,11,0.03)' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Landmark size={17} color="#f59e0b" />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400e' }}>No Bank Account Added</div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Tap "Edit" to add your account</div>
                            </div>
                          </div>
                        )}

                        {/* Profile Info Rows */}
                        {[
                          { icon: User,      label: 'Full Name',    val: profile?.full_name || 'Not set', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                          { icon: Mail,      label: 'Email',        val: user?.email || 'N/A',            color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                          { icon: Phone,     label: 'Phone',        val: profile?.phone || myAccount?.phone || editPhone || 'Not set', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                          { icon: Building2, label: 'Account Type', val: 'Supplier Account',              color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                          { icon: Activity,  label: 'Transactions', val: String(myTxns.length),           color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        ].map((row, i, arr) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.color, flexShrink: 0 }}>
                              <row.icon size={17} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Achievement */}
                <div style={{ background: 'linear-gradient(135deg,#fefce8,#fef9c3)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', flexShrink: 0 }}>
                    <Star size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#78350f' }}>Trusted Supplier</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginTop: '2px' }}>{completedCount} completed transactions</div>
                  </div>
                </div>

                {/* Preferences */}
                <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
                  <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Preferences</div>
                  </div>

                  {/* Language */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Languages size={17} /></div>
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

                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><MessageSquare size={17} /></div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>WhatsApp Support</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Chat with us</div>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
                  </button>

                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}><HelpCircle size={17} /></div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Help &amp; FAQ</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Common questions</div>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
                  </button>
                </div>

                {/* Sign Out */}
                <AnimatePresence>
                  {signOutConfirm ? (
                    <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1.5px solid rgba(239,68,68,0.2)', marginBottom: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Sign Out?</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '18px' }}>Ka tabbata kana son fita?</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setSignOutConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', background: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={signOut} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Sign Out</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button key="signout-btn" whileTap={{ scale: 0.97 }} onClick={() => setSignOutConfirm(true)}
                      style={{ width: '100%', padding: '16px', borderRadius: '20px', border: 'none', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                      <LogOut size={18} /> Sign Out
                    </motion.button>
                  )}
                </AnimatePresence>

                <div style={{ textAlign: 'center', paddingBottom: '8px', fontSize: '10px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Bakery Management v2.4
                </div>
              </motion.div>
            )}

            {/* ══════════════ CUSTOMERS TAB ══════════════ */}
            {activeTab === 'customers' && (
              <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {myCustomers.length === 0 ? (
                  /* Waiting state */
                  <div style={{ background: '#fff', borderRadius: '24px', padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Clock size={34} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Waiting for Assignment</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', lineHeight: 1.6 }}>
                      No customers have been assigned to you yet.<br />
                      The Manager will assign customers from the Customer Base.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706' }}>Awaiting manager action</span>
                    </div>
                    <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}`}</style>
                  </div>
                ) : (
                  <>
                    {/* Summary pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
                      {[
                        { label: 'Total',   val: myCustomers.length, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                        { label: 'In Debt', val: myCustomers.filter(c => (c.debtBalance || 0) > 0).length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                        { label: 'Clear',   val: myCustomers.filter(c => (c.debtBalance || 0) === 0).length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: '18px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Customer list */}
                    <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '14px' }}>
                      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>My Customers</div>
                      </div>

                      {myCustomers.map((c, i) => {
                        const { hasPayNow, hasOnDeliver } = getCustomerStatus(c.id);
                        const hasDebtBalance = (c.debtBalance || 0) > 0;

                        return (
                          <div key={c.id} style={{ padding: '14px 20px', borderBottom: i < myCustomers.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              {/* Avatar */}
                              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: hasDebtBalance ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: hasDebtBalance ? '#ef4444' : '#10b981', flexShrink: 0 }}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 900, color: hasDebtBalance ? '#ef4444' : '#10b981', flexShrink: 0, marginLeft: '8px' }}>
                                    {fmt(c.debtBalance || 0)}
                                  </div>
                                </div>
                                {c.phone && <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>{c.phone}</div>}

                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                  {hasPayNow && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '7px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '10px', fontWeight: 800, color: '#10b981' }}>
                                      <Banknote size={9} /> Pay Now
                                    </span>
                                  )}
                                  {hasOnDeliver && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '7px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '10px', fontWeight: 800, color: '#f59e0b' }}>
                                      <Truck size={9} /> Pay on Delivery
                                    </span>
                                  )}
                                  {!hasPayNow && !hasOnDeliver && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '7px', background: '#f1f5f9', fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>
                                      <CircleDollarSign size={9} /> No transactions
                                    </span>
                                  )}
                                  {hasDebtBalance && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '10px', fontWeight: 800, color: '#ef4444' }}>
                                      <AlertTriangle size={9} /> Has Debt
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', paddingBottom: '8px' }}>
                      Only your assigned customers are shown here
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <SupplierBottomNav />
      <ImageCropModal
        isOpen={showCropper}
        imageSrc={cropSrc}
        onClose={() => setShowCropper(false)}
        onCropCompleteAction={handleCropComplete}
      />
    </AnimatedPage>
  );
}
