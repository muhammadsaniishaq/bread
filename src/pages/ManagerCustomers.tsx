import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  Users, ArrowLeft, Search, UserPlus, Truck, Download,
  CheckSquare, Square, Settings2, Zap,
  X, ChevronRight, History, CreditCard, ShieldCheck, Star,
  TrendingUp, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   INLINE STYLES  (premium design tokens)
───────────────────────────────────────────── */
const css = {
  page: {
    background: '#0f0f13',
    minHeight: '100vh',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
  } as React.CSSProperties,

  hero: {
    background: 'linear-gradient(145deg, #1a1025 0%, #160e2a 50%, #0f0f1a 100%)',
    borderRadius: '28px',
    border: '1px solid rgba(139,92,246,0.15)',
    boxShadow: '0 8px 48px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
    padding: '28px 24px',
    position: 'relative' as const,
    overflow: 'hidden',
    marginBottom: '24px',
  },

  statPill: {
    background: 'rgba(139,92,246,0.08)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: '16px',
    padding: '14px 16px',
    backdropFilter: 'blur(12px)',
    flex: 1,
  },

  card: (selected: boolean): React.CSSProperties => ({
    background: selected ? 'rgba(139,92,246,0.06)' : '#18181f',
    border: selected ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '18px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: selected ? '0 0 0 3px rgba(139,92,246,0.12)' : '0 2px 8px rgba(0,0,0,0.3)',
  }),

  searchBox: {
    background: '#18181f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '14px 16px 14px 48px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  btn: {
    primary: {
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: '#fff',
      border: 'none',
      borderRadius: '14px',
      padding: '14px 20px',
      fontWeight: 700,
      fontSize: '13px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      whiteSpace: 'nowrap' as const,
      boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    ghost: {
      background: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '14px 16px',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s',
    } as React.CSSProperties,
  },

  pill: (active: boolean): React.CSSProperties => ({
    background: active ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
    boxShadow: active ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
    letterSpacing: '0.02em',
  }),

  input: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s',
  } as React.CSSProperties,

  drawer: {
    background: '#141419',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
  } as React.CSSProperties,
};

/* ─────────────────────────────────────────────
     COMPONENT
───────────────────────────────────────────── */
export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Routed' | 'Unassigned' | 'Debtors' | 'Active' | 'Dormant'>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'A-Z' | 'Debt' | 'VIP'>('Newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; full_name: string }[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [pin, setPin] = useState('');

  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const quickViewCustomer = useMemo(() => customers.find(c => c.id === quickViewId), [customers, quickViewId]);
  const [drawerTab, setDrawerTab] = useState<'profile' | 'ledger' | 'activity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editPin, setEditPin] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER')
      .then(({ data }) => { if (data) setSuppliers(data); });
  }, []);

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    customers.forEach(c => {
      const txs = transactions.filter(t => t.customerId === c.id);
      if (txs.length > 0) {
        const latest = txs.reduce((a, b) => new Date(b.date) > new Date(a.date) ? b : a);
        map[c.id] = Math.floor((now - new Date(latest.date).getTime()) / 86400000);
      } else {
        map[c.id] = 9999;
      }
    });
    return map;
  }, [customers, transactions]);

  const filteredCustomers = useMemo(() => {
    let list = customers.filter(c => {
      const q = searchTerm.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(searchTerm));
      if (!match) return false;
      if (filterType === 'Routed') return !!c.assignedSupplierId;
      if (filterType === 'Unassigned') return !c.assignedSupplierId;
      if (filterType === 'Debtors') return c.debtBalance > 0;
      if (filterType === 'Active') return activityMap[c.id] <= 30;
      if (filterType === 'Dormant') return activityMap[c.id] > 30;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
      if (sortBy === 'Debt') return (b.debtBalance || 0) - (a.debtBalance || 0);
      if (sortBy === 'VIP') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      return Number(b.id) - Number(a.id);
    });
  }, [customers, searchTerm, filterType, sortBy, activityMap]);

  const totalDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const debtorCount = customers.filter(c => c.debtBalance > 0).length;
  const activeCount = customers.filter(c => activityMap[c.id] <= 30).length;

  const toggleSelection = (id: string) =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleAssign = async (c: Customer, sid: string) =>
    await updateCustomer({ ...c, assignedSupplierId: sid || undefined });

  const bulkAssign = async (sid: string) => {
    for (const id of selectedIds) {
      const c = customers.find(x => x.id === id);
      if (c) await updateCustomer({ ...c, assignedSupplierId: sid || undefined });
    }
    setSelectedIds([]);
  };

  const exportCSV = () => {
    const rows = selectedIds.length > 0 ? customers.filter(c => selectedIds.includes(c.id)) : filteredCustomers;
    const csv = "data:text/csv;charset=utf-8,"
      + ["Name,Phone,Debt,Loyalty,Route"]
        .concat(rows.map(c => `${c.name},${c.phone || ''},${c.debtBalance},${c.loyaltyPoints || 0},${suppliers.find(s => s.id === c.assignedSupplierId)?.full_name || 'Store'}`))
        .join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv); a.download = `customers_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addCustomer({ id: Date.now().toString(), name, phone, location: '', notes: '', debtBalance: 0, loyaltyPoints: 0, assignedSupplierId: selectedSupplierId || undefined, pin: pin || undefined });
    setName(''); setPhone(''); setPin(''); setSelectedSupplierId(''); setIsAdding(false);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !quickViewCustomer) return;
    await updateCustomer({ ...quickViewCustomer, name: editName, phone: editPhone, assignedSupplierId: editSupplierId || undefined, pin: editPin || undefined });
    setIsEditing(false);
  };

  const handleDebtPay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || !quickViewId) return;
    await recordDebtPayment({ id: Date.now().toString(), date: new Date().toISOString(), customerId: quickViewId, amount: amt, method: payMethod });
    setPayAmount('');
  };

  const openDrawer = (c: Customer) => {
    setQuickViewId(c.id);
    setEditName(c.name); setEditPhone(c.phone || '');
    setEditSupplierId(c.assignedSupplierId || ''); setEditPin(c.pin || '');
    setIsEditing(false); setDrawerTab('profile');
  };

  const actBadge = (days: number) => {
    if (days === 9999) return { text: 'No Activity', bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' };
    if (days === 0)    return { text: 'Today', bg: 'rgba(52,211,153,0.1)', color: '#34d399' };
    if (days <= 7)     return { text: `${days}d ago 🔥`, bg: 'rgba(251,146,60,0.1)', color: '#fb923c' };
    if (days <= 30)    return { text: `${days}d ago`, bg: 'rgba(96,165,250,0.1)', color: '#60a5fa' };
    return { text: 'Dormant', bg: 'rgba(251,191,36,0.08)', color: '#fbbf24' };
  };

  const avatarColor = (name: string) => {
    const colors = [
      ['#7c3aed','#6d28d9'], ['#2563eb','#1d4ed8'], ['#059669','#047857'],
      ['#dc2626','#b91c1c'], ['#d97706','#b45309'], ['#0891b2','#0e7490'],
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <AnimatedPage>
      <div style={css.page} className="px-4 pb-28">

        {/* ── HEADER ── */}
        <div style={{ paddingTop: '20px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate(-1)} style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                Customer Base
              </h1>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: '2px', fontWeight: 500 }}>
                {customers.length} clients · ₦{totalDebt.toLocaleString()} total debt
              </p>
            </div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
          }}>
            <Users size={20} color="#fff" />
          </div>
        </div>

        {/* ── HERO STATS CARD ── */}
        <div style={css.hero}>
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', pointerEvents: 'none' }} />

          {/* Big number */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Clients</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '56px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{customers.length}</span>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '4px 10px' }}>
                <TrendingUp size={12} color="#34d399" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>{activeCount} active</span>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <div style={css.statPill}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Routed</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>{routedCount}</p>
              </div>
              <div style={css.statPill}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Open Market</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>{customers.length - routedCount}</p>
              </div>
              <div style={{ ...css.statPill, background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.15)' }}>
                <p style={{ fontSize: '10px', color: 'rgba(251,191,36,0.6)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Debtors</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24', margin: 0 }}>{debtorCount}</p>
              </div>
            </div>

            {/* Total debt bar */}
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="#fbbf24" />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Outstanding Debt</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>₦{totalDebt.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── SEARCH + ACTIONS ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              style={css.searchBox}
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button onClick={() => setIsAdding(!isAdding)} style={css.btn.primary}><UserPlus size={16} /> Add</button>
          <button onClick={exportCSV} style={css.btn.ghost}><Download size={16} /></button>
        </div>

        {/* ── ADD CLIENT FORM ── */}
        <AnimatePresence>
          {isAdding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: '#1a1024', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.2)', padding: '24px', marginBottom: '20px', overflow: 'hidden',boxShadow: '0 8px 32px rgba(139,92,246,0.12)' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '15px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={16} color="#fff" />
                </div>
                Register New Client
              </h3>
              <form onSubmit={handleAdd} style={{ display: 'grid', gap: '12px' }}>
                <input style={css.input} placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} required />
                <input style={css.input} placeholder="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <input style={{ ...css.input, fontFamily: 'monospace', letterSpacing: '0.3em' }} maxLength={4} placeholder="Login PIN (4 digits)" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
                <select style={{ ...css.input, cursor: 'pointer' }} value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                  <option value="">Unassigned (Store)</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <button type="submit" style={{ ...css.btn.primary, justifyContent: 'center', width: '100%' }}>Save Client</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FILTERS + SORT ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, paddingBottom: '4px' }}>
            {(['All', 'Routed', 'Unassigned', 'Debtors', 'Active', 'Dormant'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)} style={css.pill(filterType === f)}>{f}</button>
            ))}
          </div>
          <div style={{ position: 'relative', shrink: 0 } as any}>
            <Settings2 size={13} color="rgba(139,92,246,0.7)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              style={{ background: '#18181f', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px 10px 34px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
              <option value="Newest">Newest</option>
              <option value="A-Z">A → Z</option>
              <option value="Debt">Highest Debt</option>
              <option value="VIP">Top VIP</option>
            </select>
          </div>
        </div>

        {/* ── BULK BANNER ── */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: '16px', padding: '14px 18px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', position: 'sticky', top: '16px', zIndex: 50, boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} /> {selectedIds.length} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select onChange={e => bulkAssign(e.target.value)} value=""
                  style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                  <option value="" disabled>Bulk Route...</option>
                  <option value="">Unassign</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <button onClick={() => setSelectedIds([])}
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CUSTOMER LIST ── */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}>

          {filteredCustomers.map(c => {
            const selected = selectedIds.includes(c.id);
            const isVIP = (c.loyaltyPoints || 0) > 100;
            const badge = actBadge(activityMap[c.id]);
            const [from, to] = avatarColor(c.name);

            return (
              <motion.div key={c.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                style={css.card(selected)}
                onClick={e => {
                  if ((e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('button, a, select')) return;
                  openDrawer(c);
                }}>

                {/* Row 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <button onClick={e => { e.stopPropagation(); toggleSelection(c.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                    {selected ? <CheckSquare size={20} color="#a78bfa" /> : <Square size={20} color="rgba(255,255,255,0.15)" />}
                  </button>

                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg,${from},${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: `0 4px 16px ${from}40` }}>
                    {c.name.charAt(0)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em' }}>{c.name}</span>
                      {isVIP && (
                        <span style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Star size={8} fill="#fff" /> VIP
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {c.phone ? (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#34d399', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: 'rgba(52,211,153,0.08)', padding: '3px 8px', borderRadius: '7px' }}>
                          <Phone size={10} /> {c.phone}
                        </a>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 500 }}>No phone</span>
                      )}
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '7px', background: badge.bg, color: badge.color }}>{badge.text}</span>
                    </div>
                  </div>

                  {c.debtBalance > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Debt</p>
                      <p style={{ color: '#f87171', fontWeight: 900, fontSize: '14px', margin: 0 }}>₦{c.debtBalance.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Row 2 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={13} color="rgba(139,92,246,0.5)" />
                    <select onClick={e => e.stopPropagation()}
                      value={c.assignedSupplierId || ''} onChange={e => handleAssign(c, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                      <option value="">Store</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View <ChevronRight size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(255,255,255,0.2)' }}>
              <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.15 }} />
              <p style={{ fontWeight: 700, fontSize: '14px' }}>No Clients Found</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search or filters.</p>
            </div>
          )}
        </motion.div>

        {/* ── CRM DRAWER ── */}
        <AnimatePresence>
          {quickViewCustomer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 90 }}
                onClick={() => setQuickViewId(null)} />

              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '420px', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...css.drawer }}>

                {/* Drawer header */}
                <div style={{ padding: '28px 24px 24px', background: 'linear-gradient(145deg,#1a1025,#160e2a)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%)', pointerEvents: 'none' }} />

                  <button onClick={() => setQuickViewId(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={16} color="rgba(255,255,255,0.7)" />
                  </button>

                  <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `linear-gradient(135deg,${avatarColor(quickViewCustomer.name)[0]},${avatarColor(quickViewCustomer.name)[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '14px', boxShadow: `0 8px 24px ${avatarColor(quickViewCustomer.name)[0]}50` }}>
                    {quickViewCustomer.name.charAt(0)}
                  </div>

                  <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '20px', margin: 0, letterSpacing: '-0.02em' }}>{quickViewCustomer.name}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 500, margin: '4px 0 14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {quickViewCustomer.phone || 'No Phone'} · {quickViewCustomer.location || 'No Location'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {quickViewCustomer.pin ? (
                      <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>🔐 Auth On</span>
                    ) : (
                      <span style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Auth Off</span>
                    )}
                    <button onClick={() => setIsEditing(!isEditing)}
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      {isEditing ? '✕ Cancel' : '✏️ Edit'}
                    </button>
                  </div>
                </div>

                {/* Drawer tabs */}
                <div style={{ display: 'flex', background: '#141419', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  {([
                    { key: 'profile' as const, label: 'Profile', icon: ShieldCheck, activeColor: '#a78bfa' },
                    { key: 'ledger' as const, label: 'Ledger', icon: CreditCard, activeColor: '#34d399' },
                    { key: 'activity' as const, label: 'Activity', icon: History, activeColor: '#60a5fa' },
                  ]).map(tab => (
                    <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                      style={{ flex: 1, padding: '14px 0', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', borderBottom: drawerTab === tab.key ? `2px solid ${tab.activeColor}` : '2px solid transparent', color: drawerTab === tab.key ? tab.activeColor : 'rgba(255,255,255,0.3)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                      <tab.icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Drawer body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                  {/* Profile Tab */}
                  {drawerTab === 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {isEditing ? (
                        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '16px', padding: '18px' }}>
                            <p style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={12} /> Security PIN</p>
                            <input style={{ ...css.input, fontFamily: 'monospace', letterSpacing: '0.3em' }} maxLength={4} placeholder="4-Digit Login PIN" value={editPin} onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))} />
                          </div>
                          <input style={css.input} placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} required />
                          <input style={css.input} placeholder="Phone" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                          <select style={{ ...css.input, cursor: 'pointer' }} value={editSupplierId} onChange={e => setEditSupplierId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                          <button type="submit" style={{ ...css.btn.primary, justifyContent: 'center', width: '100%', padding: '16px' }}>Save Changes</button>
                        </form>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Status</p>
                              <p style={{ color: '#fff', fontWeight: 800, fontSize: '14px', margin: 0 }}>{activityMap[quickViewCustomer.id] <= 30 ? '🟢 Active' : '🟡 Dormant'}</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Loyalty</p>
                              <p style={{ color: '#fbbf24', fontWeight: 800, fontSize: '14px', margin: 0 }}>★ {quickViewCustomer.loyaltyPoints || 0} pts</p>
                            </div>
                          </div>
                          {quickViewCustomer.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Notes</p>
                              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0, fontWeight: 500 }}>{quickViewCustomer.notes}</p>
                            </div>
                          )}
                          <button onClick={() => navigate(`/customers/${quickViewCustomer.id}`)} style={{ ...css.btn.primary, justifyContent: 'center', width: '100%', padding: '16px', marginTop: '8px' }}>
                            Open Full Profile <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Ledger Tab */}
                  {drawerTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: quickViewCustomer.debtBalance > 0 ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' : 'linear-gradient(135deg,#064e3b,#065f46)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', border: `1px solid ${quickViewCustomer.debtBalance > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}` }}>
                        <Zap style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.08 }} size={100} color="#fff" />
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Active Debt</p>
                        <p style={{ color: '#fff', fontWeight: 900, fontSize: '36px', margin: 0, letterSpacing: '-0.03em' }}>₦{quickViewCustomer.debtBalance.toLocaleString()}</p>
                        {quickViewCustomer.debtBalance === 0 && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>✓ Fully Settled</p>}
                      </div>

                      {quickViewCustomer.debtBalance > 0 && (
                        <form onSubmit={handleDebtPay} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <p style={{ color: '#fff', fontWeight: 800, fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} color="#34d399" /> Settle Payment</p>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>₦</span>
                            <input type="number" max={quickViewCustomer.debtBalance} placeholder="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} required
                              style={{ ...css.input, paddingLeft: '32px', fontSize: '20px', fontWeight: 900, color: '#34d399' }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {(['Cash', 'Transfer'] as const).map(m => (
                              <button key={m} type="button" onClick={() => setPayMethod(m)}
                                style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: `2px solid ${payMethod === m ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.06)'}`, background: payMethod === m ? 'rgba(52,211,153,0.08)' : 'transparent', color: payMethod === m ? '#34d399' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                                {m}
                              </button>
                            ))}
                          </div>
                          <button type="submit" style={{ background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '14px', padding: '15px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(5,150,105,0.35)' }}>
                            <ShieldCheck size={16} /> Confirm Payment
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {drawerTab === 'activity' && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Recent Transactions</p>
                      {transactions.filter(t => t.customerId === quickViewCustomer.id).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)' }}>
                          <History size={36} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                          <p style={{ fontWeight: 700, fontSize: '13px' }}>No History Yet</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {transactions.filter(t => t.customerId === quickViewCustomer.id)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10)
                            .map(tx => (
                              <div key={tx.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 900, fontSize: '13px' }}>
                                    {tx.items?.reduce((a, p) => a + p.quantity, 0) || tx.quantity || 1}
                                  </div>
                                  <div>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px', margin: 0 }}>Order</p>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 500, margin: '2px 0 0' }}>
                                      {new Date(tx.date).toLocaleDateString()} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ color: '#fff', fontWeight: 900, fontSize: '14px', margin: 0 }}>₦{(tx.totalPrice || 0).toLocaleString()}</p>
                                  <p style={{ color: tx.type === 'Cash' ? '#34d399' : '#f87171', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>{tx.type}</p>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;