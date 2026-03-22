import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2, Search, X, TrendingDown, LayoutGrid,
  Building2, Banknote, Trash2, ShoppingCart, AlertTriangle,
  Receipt, CheckCircle, Wheat, ChevronsDown, FileText
} from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
export interface RawMaterial { id: string; name: string; quantity_remaining: number; unit: string; }
export interface RMVendor { id: string; name: string; phone: string; debt_balance: number; }
export interface RMLog {
  id: string; material_id?: string; supplier_id?: string;
  type: 'RESTOCK' | 'USAGE' | 'PAYMENT';
  quantity: number; cost_total: number; amount_paid: number;
  cash_paid?: number; transfer_paid?: number;
  items?: { material_id: string; name: string; quantity: number; price?: number }[];
  created_at: string;
}

/* ══════════════════════════════════════════════════════
   DESIGN SYSTEM
══════════════════════════════════════════════════════ */
const palette = {
  bg: '#0E0D0A',
  bgCard: '#1A1916',
  bgCardHover: '#221F1B',
  bgGlass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  golden: '#D4A847',
  goldenGlow: 'rgba(212,168,71,0.20)',
  goldenSoft: 'rgba(212,168,71,0.10)',
  emerald: '#34D399',
  emeraldGlow: 'rgba(52,211,153,0.15)',
  rose: '#F87171',
  roseGlow: 'rgba(248,113,113,0.15)',
  blue: '#60A5FA',
  blueGlow: 'rgba(96,165,250,0.15)',
  text: '#F5F4F0',
  textSub: '#A8A49C',
  textMuted: '#6B6760',
  white: '#FFFFFF',
};

/* ══════════════════════════════════════════════════════
   MICRO HELPERS
══════════════════════════════════════════════════════ */
const FieldLabel = ({ req, children }: { req?: boolean; children: React.ReactNode }) => (
  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: palette.textSub }}>
    {children}{req && <span style={{ color: palette.golden, marginLeft: 3 }}>*</span>}
  </p>
);

const StockBadge = ({ qty, unit }: { qty: number; unit: string }) => {
  const low = qty <= 5;
  const empty = qty === 0;
  const color = empty ? palette.rose : low ? '#FBBF24' : palette.emerald;
  const glow = empty ? palette.roseGlow : low ? 'rgba(251,191,36,0.15)' : palette.emeraldGlow;
  const label = empty ? 'Empty' : low ? 'Low Stock' : 'In Stock';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: glow, color, border: `1px solid ${color}33`, letterSpacing: 0.3 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      {qty} {unit} · {label}
    </span>
  );
};

const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)',
  border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 14, fontSize: 15,
  fontWeight: 500, color: palette.text, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color .15s, background .15s, box-shadow .15s',
};

/* ══════════════════════════════════════════════════════
   BOTTOM SHEET
══════════════════════════════════════════════════════ */
const BottomSheet = ({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          style={{ position: 'relative', background: palette.bgCard, borderRadius: '28px 28px 0 0', padding: '0 0 env(safe-area-inset-bottom)', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -24px 64px rgba(0,0,0,0.6)' }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
          </div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 24px 20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.02em' }}>{title}</h2>
              {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: palette.textSub }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textSub, cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '0 24px 32px' }}>{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export const RawMaterialsManager: React.FC = () => {
  const navigate = useNavigate();

  const [mats, setMats] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<RMVendor[]>([]);
  const [logs, setLogs] = useState<RMLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mats' | 'vendors' | 'logs'>('mats');
  const [query, setQuery] = useState('');

  // Sheets
  const [addMatOpen, setAddMatOpen] = useState(false);
  const [addVenOpen, setAddVenOpen] = useState(false);
  const [actionCtx, setActionCtx] = useState<{ type: 'USAGE' | 'PAY'; mat?: RawMaterial; ven?: RMVendor } | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  // Form state
  const [mName, setMName] = useState(''); const [mUnit, setMUnit] = useState('Bags'); const [mEditId, setMEditId] = useState<string | null>(null);
  const [vName, setVName] = useState(''); const [vPhone, setVPhone] = useState(''); const [vEditId, setVEditId] = useState<string | null>(null);
  const [aQty, setAQty] = useState(''); const [aPaid, setAPaid] = useState('');

  // Batch state
  const [bVenId, setBVenId] = useState('');
  const [bItems, setBItems] = useState<{ id: string; matId: string; qty: string; price: string }[]>([]);
  const [bCost, setBCost] = useState('');
  const [bCash, setBCash] = useState('');
  const [bTransfer, setBTransfer] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, vRes, lRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('rm_suppliers').select('*').order('name'),
        supabase.from('rm_logs').select('*').order('created_at', { ascending: false }).limit(60),
      ]);
      if (mRes.data) setMats(mRes.data);
      if (vRes.data && !vRes.error) setVendors(vRes.data);
      if (lRes.data && !lRes.error) setLogs(lRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const resetAll = () => {
    setAddMatOpen(false); setAddVenOpen(false); setActionCtx(null); setBatchOpen(false);
    setMName(''); setMUnit('Bags'); setMEditId(null);
    setVName(''); setVPhone(''); setVEditId(null);
    setAQty(''); setAPaid('');
    setBVenId(''); setBItems([]); setBCost(''); setBCash(''); setBTransfer('');
  };

  const saveMat = async (e: React.FormEvent) => {
    e.preventDefault(); if (!mName) return;
    if (mEditId) await supabase.from('raw_materials').update({ name: mName, unit: mUnit }).eq('id', mEditId);
    else await supabase.from('raw_materials').insert([{ name: mName, unit: mUnit, quantity_remaining: 0 }]);
    resetAll(); fetchAll();
  };

  const saveVen = async (e: React.FormEvent) => {
    e.preventDefault(); if (!vName) return;
    const { error } = vEditId
      ? await supabase.from('rm_suppliers').update({ name: vName, phone: vPhone }).eq('id', vEditId)
      : await supabase.from('rm_suppliers').insert([{ name: vName, phone: vPhone, debt_balance: 0 }]);
    if (error) alert('Vendor save failed. Check database migration.');
    resetAll(); fetchAll();
  };

  const executeAction = async (e: React.FormEvent) => {
    e.preventDefault(); if (!actionCtx) return;
    if (actionCtx.type === 'USAGE' && actionCtx.mat) {
      const q = parseFloat(aQty) || 0;
      await supabase.from('raw_materials').update({ quantity_remaining: Math.max(0, actionCtx.mat.quantity_remaining - q) }).eq('id', actionCtx.mat.id);
      await supabase.from('rm_logs').insert([{ material_id: actionCtx.mat.id, type: 'USAGE', quantity: q }]);
    } else if (actionCtx.type === 'PAY' && actionCtx.ven) {
      const p = parseFloat(aPaid) || 0;
      await supabase.from('rm_suppliers').update({ debt_balance: Math.max(0, actionCtx.ven.debt_balance - p) }).eq('id', actionCtx.ven.id);
      await supabase.from('rm_logs').insert([{ supplier_id: actionCtx.ven.id, type: 'PAYMENT', amount_paid: p }]);
    }
    resetAll(); fetchAll();
  };

  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bVenId || bItems.length === 0) return alert('Select a supplier and add at least one item.');
    const calcCost = bItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
    const c = parseFloat(bCost) || calcCost;
    const cPaid = parseFloat(bCash) || 0;
    const tPaid = parseFloat(bTransfer) || 0;
    const d = c - (cPaid + tPaid);

    const updates = bItems.map(item => {
      const mat = mats.find(m => m.id === item.matId);
      if (!mat) return null;
      return supabase.from('raw_materials').update({ quantity_remaining: mat.quantity_remaining + (parseFloat(item.qty) || 0) }).eq('id', mat.id);
    });
    await Promise.all((updates.filter(u => u !== null) as unknown) as Promise<any>[]);

    const validItems = bItems.map(item => {
      const m = mats.find(x => x.id === item.matId);
      return { material_id: item.matId, name: m?.name || 'Unknown', quantity: parseFloat(item.qty) || 0, price: parseFloat(item.price) || 0 };
    });
    const { error } = await supabase.from('rm_logs').insert([{
      supplier_id: bVenId, type: 'RESTOCK', cost_total: c, cash_paid: cPaid, transfer_paid: tPaid, items: validItems,
    }]);
    if (d > 0 && !error) {
      const ven = vendors.find(v => v.id === bVenId);
      if (ven) await supabase.from('rm_suppliers').update({ debt_balance: ven.debt_balance + d }).eq('id', ven.id);
    }
    if (error) alert('Failed. Check database.');
    resetAll(); fetchAll();
  };

  const addRow = () => setBItems([...bItems, { id: Date.now().toString(), matId: mats[0]?.id || '', qty: '', price: '' }]);
  const updateRow = (id: string, field: string, val: string) => setBItems(bItems.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeRow = (id: string) => setBItems(bItems.filter(i => i.id !== id));

  // Aggregates
  const totalMats = mats.length;
  const lowMats = mats.filter(m => m.quantity_remaining <= 5).length;
  const totalDebt = vendors.reduce((s, v) => s + (v.debt_balance || 0), 0);
  const totalVendors = vendors.length;

  const filteredMats = mats.filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()));
  const filteredVendors = vendors.filter(v => !query || v.name.toLowerCase().includes(query.toLowerCase()));

  // Animation variants
  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } } };

  const TABS = [
    { key: 'mats', label: 'Inventory', icon: <LayoutGrid size={14} /> },
    { key: 'vendors', label: 'Suppliers', icon: <Building2 size={14} /> },
    { key: 'logs', label: 'History', icon: <FileText size={14} /> },
  ] as const;

  if (loading && mats.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{ width: 40, height: 40, border: `3px solid ${palette.goldenGlow}`, borderTopColor: palette.golden, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: palette.textSub, fontWeight: 600, fontSize: 14 }}>Loading supply chain…</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .rm { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        .dinp { background: rgba(255,255,255,0.05) !important; border: 1.5px solid rgba(255,255,255,0.10) !important; color: #F5F4F0 !important; }
        .dinp::placeholder { color: #6B6760 !important; }
        .dinp:focus { border-color: ${palette.golden} !important; background: rgba(212,168,71,0.06) !important; box-shadow: 0 0 0 3px ${palette.goldenGlow} !important; outline: none; }
        .dinp option { background: #1A1916; color: #F5F4F0; }
        .mat-card { transition: transform .22s cubic-bezier(.22,.68,0,1.3), box-shadow .22s; cursor: default; }
        .mat-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important; }
        .ven-card { transition: transform .22s cubic-bezier(.22,.68,0,1.3), box-shadow .22s; }
        .ven-card:hover { transform: translateY(-2px); }
        .tab-item { background: none; border: none; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; transition: all .16s; white-space: nowrap; }
        .tab-item:hover { color: ${palette.golden} !important; background: ${palette.goldenSoft} !important; }
        .cta-btn { border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-weight: 800; transition: transform .14s, box-shadow .14s, opacity .14s; }
        .cta-btn:hover { transform: scale(1.03); }
        .cta-btn:active { transform: scale(0.97); opacity: 0.85; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      <div className="rm" style={{ minHeight: '100vh', background: palette.bg, paddingBottom: 96 }}>

        {/* ═══════════ STICKY HEADER ═══════════ */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,13,10,0.92)', backdropFilter: 'blur(24px) saturate(1.6)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
              <motion.button whileTap={{ scale: .88 }} onClick={() => navigate(-1)}
                style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 11, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textSub, cursor: 'pointer' }}>
                <ArrowLeft size={16} />
              </motion.button>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: palette.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Supply Chain</h1>
                <p style={{ margin: 0, fontSize: 11, color: palette.textMuted, fontWeight: 600 }}>{totalMats} materials · {totalVendors} vendors</p>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 8px 8px', display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="tab-item"
                style={{ color: tab === t.key ? palette.golden : palette.textSub, background: tab === t.key ? palette.goldenSoft : 'transparent', flex: 1, justifyContent: 'center' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </header>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>

          {/* ═══════════ HERO STATS STRIP ═══════════ */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { v: totalMats, l: 'Items', color: palette.blue, glow: palette.blueGlow, icon: <LayoutGrid size={13} /> },
              { v: lowMats, l: 'Low Stock', color: '#FBBF24', glow: 'rgba(251,191,36,0.15)', icon: <AlertTriangle size={13} /> },
              { v: `₦${(totalDebt / 1000).toFixed(1)}k`, l: 'Owed', color: palette.rose, glow: palette.roseGlow, icon: <Banknote size={13} /> },
              { v: totalVendors, l: 'Vendors', color: palette.emerald, glow: palette.emeraldGlow, icon: <Building2 size={13} /> },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                style={{ background: palette.bgCard, borderRadius: 14, padding: '10px 8px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.glow, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{s.icon}</div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.v}</p>
                <p style={{ margin: '3px 0 0', fontSize: 9, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══════════ SEARCH + ACTIONS ═══════════ */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: palette.textMuted, pointerEvents: 'none' }} />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
                className="dinp" style={{ ...inp, paddingLeft: 38, paddingRight: query ? 38 : 16, fontSize: 14 }} />
              {query && (
                <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, padding: 2 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {tab === 'mats' && (
              <>
                <motion.button whileTap={{ scale: .93 }} onClick={() => { setBItems([{ id: '1', matId: mats[0]?.id || '', qty: '', price: '' }]); setBatchOpen(true); }} className="cta-btn"
                  style={{ padding: '0 14px', borderRadius: 13, background: `linear-gradient(135deg, #4F46E5, #7C3AED)`, color: '#FFF', fontSize: 12, boxShadow: '0 4px 16px rgba(79,70,229,0.35)', flexShrink: 0 }}>
                  <ShoppingCart size={14} /> Receipt
                </motion.button>
                <motion.button whileTap={{ scale: .93 }} onClick={() => setAddMatOpen(true)} className="cta-btn"
                  style={{ padding: '0 14px', borderRadius: 13, background: `linear-gradient(135deg, ${palette.golden}, #E6B94A)`, color: '#000', fontSize: 12, fontWeight: 900, boxShadow: `0 4px 16px ${palette.goldenGlow}`, flexShrink: 0 }}>
                  <Plus size={15} /> Item
                </motion.button>
              </>
            )}
            {tab === 'vendors' && (
              <motion.button whileTap={{ scale: .93 }} onClick={() => setAddVenOpen(true)} className="cta-btn"
                style={{ padding: '0 14px', borderRadius: 13, background: 'linear-gradient(135deg, #065F46, #059669)', color: '#FFF', fontSize: 12, boxShadow: `0 4px 16px ${palette.emeraldGlow}`, flexShrink: 0 }}>
                <Plus size={15} /> Supplier
              </motion.button>
            )}
          </div>

          {/* ═══════════ MATERIALS TAB ═══════════ */}
          {tab === 'mats' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredMats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                  <Wheat size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
                  <p style={{ fontWeight: 700 }}>No materials found</p>
                </div>
              )}
              {filteredMats.map(mat => {
                const pct = Math.min(100, (mat.quantity_remaining / Math.max(100, mat.quantity_remaining)) * 100);
                const low = mat.quantity_remaining <= 5;
                const barColor = mat.quantity_remaining === 0 ? palette.rose : low ? '#FBBF24' : palette.emerald;
                return (
                  <motion.div key={mat.id} variants={fadeUp} className="mat-card"
                    style={{ background: palette.bgCard, borderRadius: 22, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

                    {/* Top gradient band */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${barColor}44, ${barColor})` }} />

                    <div style={{ padding: '18px 18px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${barColor}22, ${barColor}11)`, border: `1px solid ${barColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: barColor }}>
                            <Wheat size={22} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: palette.text, letterSpacing: '-0.02em' }}>{mat.name}</h3>
                            <StockBadge qty={mat.quantity_remaining} unit={mat.unit} />
                          </div>
                        </div>
                        <button onClick={() => { setMName(mat.name); setMUnit(mat.unit); setMEditId(mat.id); setAddMatOpen(true); }}
                          style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textSub, cursor: 'pointer' }}>
                          <Edit2 size={14} />
                        </button>
                      </div>

                      {/* Quantity Display */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 38, fontWeight: 900, color: barColor, lineHeight: 1, letterSpacing: '-0.04em' }}>{mat.quantity_remaining}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: palette.textSub, paddingBottom: 6 }}>{mat.unit} remaining</span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .8, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }} />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setActionCtx({ type: 'USAGE', mat })} className="cta-btn"
                          style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: palette.textSub, fontSize: 12 }}>
                          <TrendingDown size={14} style={{ color: palette.rose }} /> Log Usage
                        </button>
                        <button onClick={() => { setBItems([{ id: '1', matId: mat.id, qty: '', price: '' }]); setBatchOpen(true); }} className="cta-btn"
                          style={{ flex: 1, padding: '10px', borderRadius: 12, background: palette.goldenSoft, border: `1px solid ${palette.goldenGlow}`, color: palette.golden, fontSize: 12 }}>
                          <ChevronsDown size={14} /> Restock
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ═══════════ VENDORS TAB ═══════════ */}
          {tab === 'vendors' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Total Debt Banner */}
              {totalDebt > 0 && (
                <motion.div variants={fadeUp}
                  style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.06))', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.rose, flexShrink: 0 }}>
                    <Banknote size={22} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: palette.rose, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Outstanding Debt</p>
                    <p style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 900, color: palette.rose, letterSpacing: '-0.04em', lineHeight: 1 }}>₦{totalDebt.toLocaleString()}</p>
                  </div>
                </motion.div>
              )}

              {filteredVendors.map(v => (
                <motion.div key={v.id} variants={fadeUp} className="ven-card"
                  style={{ background: palette.bgCard, borderRadius: 22, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                  {v.debt_balance > 0 && <div style={{ height: 2, background: `linear-gradient(90deg, ${palette.rose}55, ${palette.rose})` }} />}
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textSub }}>
                          <Building2 size={22} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: palette.text }}>{v.name}</h3>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: palette.textMuted, fontWeight: 600 }}>{v.phone || 'No contact'}</p>
                        </div>
                      </div>
                      <button onClick={() => { setVName(v.name); setVPhone(v.phone); setVEditId(v.id); setAddVenOpen(true); }}
                        style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textSub, cursor: 'pointer' }}>
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {/* Debt panel */}
                    <div style={{ background: v.debt_balance > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.05)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${v.debt_balance > 0 ? 'rgba(248,113,113,0.18)' : 'rgba(52,211,153,0.12)'}` }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: palette.textMuted }}>Balance Owed</p>
                        <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: v.debt_balance > 0 ? palette.rose : palette.emerald, letterSpacing: '-0.03em' }}>₦{v.debt_balance.toLocaleString()}</p>
                      </div>
                      {v.debt_balance <= 0 && <CheckCircle size={22} style={{ color: palette.emerald, opacity: .7 }} />}
                    </div>

                    {v.debt_balance > 0 && (
                      <button onClick={() => setActionCtx({ type: 'PAY', ven: v })} className="cta-btn"
                        style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.08))', border: `1px solid ${palette.emeraldGlow}`, color: palette.emerald, fontSize: 13 }}>
                        <CheckCircle size={16} /> Settle Debt
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ═══════════ LOGS TAB ═══════════ */}
          {tab === 'logs' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
                  <p style={{ fontWeight: 700 }}>No history yet</p>
                </div>
              )}
              {logs.map(L => {
                const ven = vendors.find(v => v.id === L.supplier_id);
                const typeConf = {
                  RESTOCK: { color: '#818CF8', glow: 'rgba(129,140,248,0.15)', label: 'Receipt', icon: <Receipt size={13} /> },
                  USAGE: { color: '#FBBF24', glow: 'rgba(251,191,36,0.15)', label: 'Usage', icon: <TrendingDown size={13} /> },
                  PAYMENT: { color: palette.emerald, glow: palette.emeraldGlow, label: 'Payment', icon: <CheckCircle size={13} /> },
                }[L.type];
                return (
                  <motion.div key={L.id} variants={fadeUp}
                    style={{ background: palette.bgCard, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: typeConf.glow, color: typeConf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {typeConf.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: typeConf.color, textTransform: 'uppercase', letterSpacing: '.06em', background: typeConf.glow, padding: '3px 8px', borderRadius: 6 }}>{typeConf.label}</span>
                        <span style={{ fontSize: 11, color: palette.textMuted, fontWeight: 600 }}>{new Date(L.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: '4px 0 2px', fontSize: 13, fontWeight: 700, color: palette.text, lineHeight: 1.4 }}>
                        {L.type === 'RESTOCK' && (L.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'Items received')}
                        {L.type === 'USAGE' && `${L.quantity} units deducted`}
                        {L.type === 'PAYMENT' && `Paid ${ven?.name || 'vendor'}`}
                      </p>
                      {L.type === 'RESTOCK' && (
                        <p style={{ margin: 0, fontSize: 12, color: palette.textSub }}>
                          Total ₦{(L.cost_total || 0).toLocaleString()} · Cash ₦{(L.cash_paid || 0).toLocaleString()} · Transfer ₦{(L.transfer_paid || 0).toLocaleString()}
                          {ven && ` · From: ${ven.name}`}
                        </p>
                      )}
                      {L.type === 'PAYMENT' && <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: palette.emerald }}>₦{(L.amount_paid || 0).toLocaleString()}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </div>{/* /content */}
      </div>{/* /root */}

      {/* ═══════════ BOTTOM SHEETS ═══════════ */}

      {/* ADD MATERIAL */}
      <BottomSheet open={addMatOpen} onClose={resetAll} title={mEditId ? 'Edit Material' : 'New Material'} subtitle="Add an item to your raw material inventory">
        <form onSubmit={saveMat} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><FieldLabel req>Material Name</FieldLabel><input value={mName} onChange={e => setMName(e.target.value)} required placeholder="e.g. Wheat Flour" className="dinp" style={inp} /></div>
          <div><FieldLabel>Unit of Measure</FieldLabel>
            <select value={mUnit} onChange={e => setMUnit(e.target.value)} className="dinp" style={inp}>
              <option>Bags</option><option>Kg</option><option>Litres</option><option>Pieces</option><option>Cartons</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={resetAll} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: palette.textSub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" className="cta-btn" style={{ flex: 1, padding: 14, borderRadius: 14, background: `linear-gradient(135deg, ${palette.golden}, #E6B94A)`, color: '#000', fontWeight: 900 }}>Save Material</button>
          </div>
        </form>
      </BottomSheet>

      {/* ADD VENDOR */}
      <BottomSheet open={addVenOpen} onClose={resetAll} title={vEditId ? 'Edit Supplier' : 'New Supplier'} subtitle="Register a supply company or individual">
        <form onSubmit={saveVen} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><FieldLabel req>Company / Supplier Name</FieldLabel><input value={vName} onChange={e => setVName(e.target.value)} required placeholder="e.g. Dangote Mills" className="dinp" style={inp} /></div>
          <div><FieldLabel>Phone Number</FieldLabel><input value={vPhone} onChange={e => setVPhone(e.target.value)} placeholder="080..." className="dinp" style={inp} /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={resetAll} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: palette.textSub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" className="cta-btn" style={{ flex: 1, padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, #065F46, #059669)', color: '#FFF', fontWeight: 900 }}>Save Supplier</button>
          </div>
        </form>
      </BottomSheet>

      {/* USAGE / PAY */}
      <BottomSheet
        open={!!actionCtx}
        onClose={resetAll}
        title={actionCtx?.type === 'USAGE' ? `Log Usage` : `Settle Debt`}
        subtitle={actionCtx?.type === 'USAGE'
          ? `Deduct consumed amount from ${actionCtx.mat?.name}`
          : `Outstanding: ₦${actionCtx?.ven?.debt_balance.toLocaleString()}`}
      >
        <form onSubmit={executeAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {actionCtx?.type === 'USAGE' && (
            <div><FieldLabel req>Quantity Used ({actionCtx.mat?.unit})</FieldLabel><input type="number" step="any" required value={aQty} onChange={e => setAQty(e.target.value)} placeholder="0" className="dinp" style={inp} /></div>
          )}
          {actionCtx?.type === 'PAY' && (
            <div><FieldLabel req>Payment Amount ₦</FieldLabel><input type="number" required value={aPaid} onChange={e => setAPaid(e.target.value)} placeholder={actionCtx.ven?.debt_balance.toString()} className="dinp" style={inp} /></div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={resetAll} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: palette.textSub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" className="cta-btn" style={{ flex: 1, padding: 14, borderRadius: 14, background: actionCtx?.type === 'PAY' ? 'linear-gradient(135deg, #065F46, #059669)' : `linear-gradient(135deg, ${palette.rose}cc, ${palette.rose})`, color: '#FFF', fontWeight: 900 }}>
              {actionCtx?.type === 'PAY' ? 'Confirm Payment' : 'Deduct Stock'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* BATCH RECEIPT */}
      <BottomSheet open={batchOpen} onClose={resetAll} title="Create Receipt" subtitle="Receive stock & log financials in one go">
        <form onSubmit={saveBatch} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Supplier */}
          <div>
            <FieldLabel req>Supplier / Company</FieldLabel>
            <select required value={bVenId} onChange={e => setBVenId(e.target.value)} className="dinp" style={inp}>
              <option value="">-- Select Vendor --</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <FieldLabel>Items Received</FieldLabel>
              <button type="button" onClick={addRow} className="cta-btn" style={{ padding: '6px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: palette.textSub, fontSize: 11 }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
            {bItems.map(item => {
              const sel = mats.find(m => m.id === item.matId);
              const rowTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <select required value={item.matId} onChange={e => updateRow(item.id, 'matId', e.target.value)} className="dinp" style={{ ...inp, padding: '10px 14px', fontSize: 13 }}>
                    <option value="">Material…</option>
                    {mats.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" step="any" required placeholder={`Qty (${sel?.unit || ''})`} value={item.qty} onChange={e => updateRow(item.id, 'qty', e.target.value)} className="dinp" style={{ ...inp, padding: '10px 14px', fontSize: 13, flex: 1 }} />
                    <input type="number" step="any" required placeholder="Unit Price ₦" value={item.price} onChange={e => updateRow(item.id, 'price', e.target.value)} className="dinp" style={{ ...inp, padding: '10px 14px', fontSize: 13, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {rowTotal > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: palette.golden }}>Subtotal: ₦{rowTotal.toLocaleString()}</span>}
                    <button type="button" disabled={bItems.length <= 1} onClick={() => removeRow(item.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: bItems.length <= 1 ? palette.textMuted : palette.rose, cursor: bItems.length <= 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0, marginLeft: 'auto' }}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial breakdown */}
          {(() => {
            const calcCost = bItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
            const actualCost = parseFloat(bCost) || calcCost;
            const cash = parseFloat(bCash) || 0;
            const transfer = parseFloat(bTransfer) || 0;
            const debt = actualCost - cash - transfer;
            return (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <FieldLabel>Total Bill ₦ {calcCost > 0 && `(Auto: ₦${calcCost.toLocaleString()})`}</FieldLabel>
                  <input type="number" value={bCost} onChange={e => setBCost(e.target.value)} placeholder={calcCost ? calcCost.toString() : '0'} className="dinp" style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><FieldLabel>Cash ₦</FieldLabel><input type="number" value={bCash} onChange={e => setBCash(e.target.value)} placeholder="0" className="dinp" style={{ ...inp, padding: '10px 14px', fontSize: 13 }} /></div>
                  <div><FieldLabel>Transfer ₦</FieldLabel><input type="number" value={bTransfer} onChange={e => setBTransfer(e.target.value)} placeholder="0" className="dinp" style={{ ...inp, padding: '10px 14px', fontSize: 13 }} /></div>
                </div>
                {actualCost > 0 && (
                  <div style={{ background: debt > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${debt > 0 ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {debt > 0 ? <AlertTriangle size={16} color={palette.rose} /> : <CheckCircle size={16} color={palette.emerald} />}
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: debt > 0 ? palette.rose : palette.emerald }}>
                        {debt > 0 ? `Debt: ₦${debt.toLocaleString()}` : 'Fully Paid — No Debt Added'}
                      </p>
                      {debt > 0 && <p style={{ margin: '2px 0 0', fontSize: 11, color: palette.textMuted }}>Will be added to supplier balance</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={resetAll} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: palette.textSub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" className="cta-btn" style={{ flex: 1, padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#FFF', fontWeight: 900 }}>
              <Receipt size={16} /> Confirm Receipt
            </button>
          </div>
        </form>
      </BottomSheet>

    </AnimatedPage>
  );
};

export default RawMaterialsManager;
