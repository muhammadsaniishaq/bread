import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2,
  Search, X, TrendingUp, Box, Layers,
  Building2, Banknote, Minus
} from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export interface RawMaterial { id: string; name: string; quantity_remaining: number; unit: string; }
export interface RMVendor { id: string; name: string; phone: string; debt_balance: number; }
export interface RMLog { id: string; material_id: string; supplier_id?: string; type: 'RESTOCK'|'USAGE'|'PAYMENT'; quantity: number; cost_total: number; amount_paid: number; created_at: string; }

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const T = {
  bg:        '#F7F6F2',
  bgDeep:    '#EFEDE8',
  white:     '#FFFFFF',
  border:    '#E6E3DC',
  borderMid: '#D4D0C8',
  amber:     '#C9921A',
  amberLt:   '#F5C842',
  amberBg:   'rgba(201,146,26,0.09)',
  amberRing: 'rgba(201,146,26,0.20)',
  text:      '#18170F',
  textSub:   '#5C5A54',
  textMute:  '#9C9A93',
  green:     '#15803D',
  greenBg:   'rgba(21,128,61,0.09)',
  red:       '#B91C1C',
  redBg:     'rgba(185,28,28,0.09)',
  indigo:    '#4338CA',
  indigoBg:  'rgba(67,56,202,0.09)',
  shadow:    '0 1px 3px rgba(24,23,15,0.08), 0 1px 2px rgba(24,23,15,0.05)',
  shadowMd:  '0 4px 12px rgba(24,23,15,0.10), 0 2px 4px rgba(24,23,15,0.06)',
  shadowLg:  '0 12px 32px rgba(24,23,15,0.12), 0 4px 8px rgba(24,23,15,0.06)',
};

/* ─────────────────────────────────────────
   MICRO COMPONENTS
───────────────────────────────────────── */
const FieldLabel = ({ req, children }: { req?: boolean; children: React.ReactNode }) => (
  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textSub, marginBottom: 7 }}>
    {children}{req && <span style={{ color: T.amber, marginLeft: 3 }}>*</span>}
  </p>
);

const Pill = ({ low }: { low: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    background: low ? T.redBg : T.greenBg, color: low ? T.red : T.green,
    border: `1px solid ${low ? 'rgba(185,28,28,0.18)' : 'rgba(21,128,61,0.18)'}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: low ? T.red : T.green }} />
    {low ? 'Low Stock' : 'In Stock'}
  </span>
);

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export const RawMaterialsManager: React.FC = () => {
  const navigate = useNavigate();

  const [mats, setMats] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<RMVendor[]>([]);
  const [logs, setLogs] = useState<RMLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mats'|'vendors'|'logs'>('mats');
  const [query, setQuery] = useState('');

  // DB Load
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, vRes, lRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('rm_suppliers').select('*').order('name'),
        supabase.from('rm_logs').select('*').order('created_at', { ascending: false }).limit(100)
      ]);
      if (mRes.data) setMats(mRes.data);
      if (vRes.data && !vRes.error) setVendors(vRes.data);
      if (lRes.data && !lRes.error) setLogs(lRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  // Modals & Sliders
  const [addMatOpen, setAddMatOpen] = useState(false);
  const [addVenOpen, setAddVenOpen] = useState(false);
  
  // Mat Form
  const [mName, setMName] = useState('');
  const [mUnit, setMUnit] = useState('Bags');
  const [mEditId, setMEditId] = useState<string|null>(null);

  // Vendor Form
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEditId, setVEditId] = useState<string|null>(null);

  // Action Drawer (Restock / Usage / Pay)
  const [actionCtx, setActionCtx] = useState<{ type: 'RESTOCK'|'USAGE'|'PAY', mat?: RawMaterial, ven?: RMVendor } | null>(null);
  const [aQty, setAQty] = useState('');
  const [aCost, setACost] = useState('');
  const [aPaid, setAPaid] = useState('');
  const [aVenId, setAVenId] = useState('');

  const resetAll = () => {
    setAddMatOpen(false); setAddVenOpen(false); setActionCtx(null);
    setMName(''); setMUnit('Bags'); setMEditId(null);
    setVName(''); setVPhone(''); setVEditId(null);
    setAQty(''); setACost(''); setAPaid(''); setAVenId('');
  };

  const saveMat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName) return;
    if (mEditId) await supabase.from('raw_materials').update({ name: mName, unit: mUnit }).eq('id', mEditId);
    else await supabase.from('raw_materials').insert([{ name: mName, unit: mUnit, quantity_remaining: 0 }]);
    resetAll(); fetchAll();
  };

  const saveVen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName) return;
    // Gracefully handle if table doesn't exist
    const { error } = mEditId 
      ? await supabase.from('rm_suppliers').update({ name: vName, phone: vPhone }).eq('id', vEditId)
      : await supabase.from('rm_suppliers').insert([{ name: vName, phone: vPhone, debt_balance: 0 }]);
    if (error) alert("Database is not updated for Vendors. Please run the SQL migration.");
    resetAll(); fetchAll();
  };

  const executeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCtx) return;

    if (actionCtx.type === 'RESTOCK' && actionCtx.mat) {
      const q = parseFloat(aQty) || 0;
      const c = parseFloat(aCost) || 0;
      const p = parseFloat(aPaid) || 0;
      const d = c - p;

      // Update Mat Qty
      await supabase.from('raw_materials').update({ quantity_remaining: actionCtx.mat.quantity_remaining + q }).eq('id', actionCtx.mat.id);
      
      if (aVenId) {
        // Log & Debt
        await supabase.from('rm_logs').insert([{ material_id: actionCtx.mat.id, supplier_id: aVenId, type: 'RESTOCK', quantity: q, cost_total: c, amount_paid: p }]);
        if (d > 0) {
          const ven = vendors.find(v => v.id === aVenId);
          if (ven) await supabase.from('rm_suppliers').update({ debt_balance: ven.debt_balance + d }).eq('id', ven.id);
        }
      }
    } 
    else if (actionCtx.type === 'USAGE' && actionCtx.mat) {
      const q = parseFloat(aQty) || 0;
      await supabase.from('raw_materials').update({ quantity_remaining: Math.max(0, actionCtx.mat.quantity_remaining - q) }).eq('id', actionCtx.mat.id);
      await supabase.from('rm_logs').insert([{ material_id: actionCtx.mat.id, type: 'USAGE', quantity: q }]);
    }
    else if (actionCtx.type === 'PAY' && actionCtx.ven) {
      const p = parseFloat(aPaid) || 0;
      await supabase.from('rm_suppliers').update({ debt_balance: Math.max(0, actionCtx.ven.debt_balance - p) }).eq('id', actionCtx.ven.id);
      await supabase.from('rm_logs').insert([{ supplier_id: actionCtx.ven.id, type: 'PAYMENT', amount_paid: p }]);
    }

    resetAll(); fetchAll();
  };

  // Stats
  const totalMats = mats.length;
  const lowMats = mats.filter(m => m.quantity_remaining <= 5).length;
  const totalDebt = vendors.reduce((sum, v) => sum + (v.debt_balance || 0), 0);
  const activeVendors = vendors.filter(v => v.debt_balance > 0).length;

  const filteredMats = mats.filter(m => query ? m.name.toLowerCase().includes(query.toLowerCase()) : true);
  const filteredVendors = vendors.filter(v => query ? v.name.toLowerCase().includes(query.toLowerCase()) : true);

  // Anim
  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.045 } } };
  const up      = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 460, damping: 32 } } };

  const baseInp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: T.bgDeep, border: `1.5px solid ${T.border}`,
    borderRadius: 10, fontSize: 14, fontWeight: 500,
    color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color .15s, background .15s, box-shadow .15s',
  };

  if (loading && mats.length === 0) return <div style={{ padding: 40, fontFamily: 'Plus Jakarta Sans', fontWeight: 800 }}>Loading Architecture...</div>;

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .rm-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .inp::placeholder { color: ${T.textMute}; }
        .inp:hover:not(:focus) { background: #EBE9E4 !important; border-color: ${T.borderMid} !important; }
        .inp:focus { background: ${T.white} !important; border-color: ${T.amber} !important; box-shadow: 0 0 0 3px ${T.amberRing} !important; }
        .card { transition: transform .24s cubic-bezier(.22,.68,0,1.2), box-shadow .24s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: ${T.shadowMd} !important; }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; letter-spacing:.03em; padding:10px 14px; border-bottom:2px solid transparent; transition:all .14s; margin-bottom:-1px; white-space:nowrap; }
        .tab-btn:hover { color: ${T.amber} !important; }
        .cta { border:none; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition: transform .16s, box-shadow .16s; }
        .cta:hover { transform:scale(1.03); }
        .cta:active { transform:scale(0.97); }
        .pg { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:480px){ .pg { grid-template-columns:repeat(2,1fr); } }
        @media(min-width:768px){ .pg { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:1024px){ .pg { grid-template-columns:repeat(4,1fr); } }
      `}</style>
      <div className="rm-root" style={{ minHeight: '100vh', background: T.bg, paddingBottom: 96 }}>
        
        {/* ══════════ HEADER ══════════ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(247,246,242,0.94)', backdropFilter: 'blur(18px) saturate(1.5)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
              <motion.button whileTap={{ scale: .9 }} onClick={() => navigate(-1)}
                style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, cursor: 'pointer', boxShadow: T.shadow }}>
                <ArrowLeft size={14} />
              </motion.button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Supply & Logistics
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute, fontWeight: 500, marginTop: 1 }}>
                  {mats.length} raw materials · {vendors.length} active suppliers
                </p>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
              {(['mats','vendors','logs'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className="tab-btn"
                  style={{ color: tab === t ? T.amber : T.textMute, borderBottomColor: tab === t ? T.amber : 'transparent' }}>
                  {t === 'mats' ? `Materials (${mats.length})` : t === 'vendors' ? `Vendors (${vendors.length})` : 'Audit Logs'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ══════════ CONTENT ══════════ */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 16px 0' }}>
          
          {/* ── STATS ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { v: totalMats,   l: 'Materials', icon: <Box size={13}/>,       c: T.indigo,  bg: T.indigoBg },
              { v: lowMats,     l: 'Low Stock', icon: <TrendingUp size={13}/>,c: T.red,     bg: T.redBg  },
              { v: `₦${totalDebt.toLocaleString()}`, l: 'Total Debt', icon: <Banknote size={13}/>, c: T.amber, bg: T.amberBg },
              { v: activeVendors, l: 'Unpaid Ven.', icon: <Building2 size={13}/>, c: T.textSub, bg: 'rgba(156,154,147,.1)' },
            ].map((x, i) => (
              <motion.div key={i} variants={up}
                style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: x.bg, color: x.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{x.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <p className="stat-val" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.v}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 8, fontWeight: 700, color: T.textMute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{x.l}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── CONTROLS ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMute, pointerEvents: 'none' }} />
              <input type="text" placeholder={`Search ${tab}...`} value={query} onChange={e => setQuery(e.target.value)} className="inp" style={{ ...baseInp, paddingLeft: 36, paddingRight: query ? 36 : 14 }} />
              {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMute, padding: 0 }}><X size={13} /></button>}
            </div>
            {tab === 'mats' && (
              <motion.button whileTap={{ scale: .95 }} onClick={() => setAddMatOpen(true)} className="cta"
                style={{ padding: '0 16px', borderRadius: 10, background: T.amber, color: '#FFF', fontWeight: 800, fontSize: 13, boxShadow: `0 3px 12px ${T.amberRing}`, flexShrink: 0 }}>
                <Plus size={14} /> Add
              </motion.button>
            )}
            {tab === 'vendors' && (
              <motion.button whileTap={{ scale: .95 }} onClick={() => setAddVenOpen(true)} className="cta"
                style={{ padding: '0 16px', borderRadius: 10, background: T.text, color: '#FFF', fontWeight: 800, fontSize: 13, boxShadow: `0 3px 12px rgba(0,0,0,.15)`, flexShrink: 0 }}>
                <Plus size={14} /> Vendor
              </motion.button>
            )}
          </div>

          {/* ── ADD FORMS ── */}
          <AnimatePresence>
            {addMatOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scaleY: .96 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -8, scaleY: .96 }} style={{ transformOrigin: 'top', marginBottom: 20 }}>
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: T.shadowMd, padding: 20 }}>
                  <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: T.text }}>{mEditId ? 'Edit Material' : 'New Material'}</p>
                  <form onSubmit={saveMat}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <FieldLabel req>Name</FieldLabel>
                        <input value={mName} onChange={e=>setMName(e.target.value)} required placeholder="e.g. Flour" className="inp" style={baseInp} />
                      </div>
                      <div>
                        <FieldLabel>Unit</FieldLabel>
                        <select value={mUnit} onChange={e=>setMUnit(e.target.value)} className="inp" style={baseInp}>
                          <option>Bags</option><option>Kg</option><option>Litres</option><option>Pieces</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={resetAll} style={{ flex: 1, padding: 11, borderRadius: 10, background: T.bgDeep, border: `1px solid ${T.border}`, fontWeight: 700, color: T.textSub }}>Cancel</button>
                      <button type="submit" className="cta" style={{ flex: 1, padding: 11, borderRadius: 10, background: T.amber, color: '#FFF', fontWeight: 800 }}>Save</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
            {addVenOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scaleY: .96 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -8, scaleY: .96 }} style={{ transformOrigin: 'top', marginBottom: 20 }}>
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: T.shadowMd, padding: 20 }}>
                  <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: T.text }}>{vEditId ? 'Edit Vendor' : 'New Vendor'}</p>
                  <form onSubmit={saveVen}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
                      <div><FieldLabel req>Company / Name</FieldLabel><input value={vName} onChange={e=>setVName(e.target.value)} required placeholder="e.g. Dangote Flour Mills" className="inp" style={baseInp} /></div>
                      <div><FieldLabel>Phone Number</FieldLabel><input value={vPhone} onChange={e=>setVPhone(e.target.value)} placeholder="080..." className="inp" style={baseInp} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={resetAll} style={{ flex: 1, padding: 11, borderRadius: 10, background: T.bgDeep, border: `1px solid ${T.border}`, fontWeight: 700, color: T.textSub }}>Cancel</button>
                      <button type="submit" className="cta" style={{ flex: 1, padding: 11, borderRadius: 10, background: T.text, color: '#FFF', fontWeight: 800 }}>Save Vendor</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
            {actionCtx && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={resetAll} />
                <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: T.white, borderRadius: 20, padding: 24, boxShadow: T.shadowLg }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
                    {actionCtx.type === 'RESTOCK' ? `Restock ${actionCtx.mat?.name}` : actionCtx.type === 'USAGE' ? `Log Usage: ${actionCtx.mat?.name}` : `Pay ${actionCtx.ven?.name}`}
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textMute }}>
                     {actionCtx.type === 'RESTOCK' ? 'Receive new inventory and track potential debt.' : actionCtx.type === 'USAGE' ? 'Deduct amount from active inventory.' : `Clear debt. Current balance: ₦${actionCtx.ven?.debt_balance.toLocaleString()}`}
                  </p>
                  
                  <form onSubmit={executeAction}>
                    <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                      {(actionCtx.type === 'RESTOCK' || actionCtx.type === 'USAGE') && (
                        <div>
                          <FieldLabel req>Quantity ({actionCtx.mat?.unit})</FieldLabel>
                          <input type="number" step="0.1" required value={aQty} onChange={e=>setAQty(e.target.value)} placeholder="0" className="inp" style={baseInp} />
                        </div>
                      )}
                      {actionCtx.type === 'RESTOCK' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><FieldLabel>Total Cost ₦</FieldLabel><input type="number" required value={aCost} onChange={e=>setACost(e.target.value)} placeholder="10000" className="inp" style={baseInp} /></div>
                            <div><FieldLabel>Amount Paid ₦</FieldLabel><input type="number" required value={aPaid} onChange={e=>setAPaid(e.target.value)} placeholder="10000" className="inp" style={baseInp} /></div>
                          </div>
                          <div>
                            <FieldLabel>Select Supplier</FieldLabel>
                            <select value={aVenId} onChange={e=>setAVenId(e.target.value)} className="inp" style={baseInp} required>
                              <option value="">-- Choose Vendor --</option>
                              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            {aCost && aPaid && parseFloat(aCost) > parseFloat(aPaid) && (
                              <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, color: T.amber }}>₦{(parseFloat(aCost) - parseFloat(aPaid)).toLocaleString()} will be added to vendor debt.</p>
                            )}
                          </div>
                        </>
                      )}
                      {actionCtx.type === 'PAY' && (
                        <div>
                          <FieldLabel req>Amount to Pay ₦</FieldLabel>
                          <input type="number" required value={aPaid} onChange={e=>setAPaid(e.target.value)} placeholder={actionCtx.ven?.debt_balance.toString()} className="inp" style={baseInp} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={resetAll} style={{ flex: 1, padding: 12, borderRadius: 12, background: T.bgDeep, border: `1px solid ${T.borderMid}`, fontWeight: 700 }}>Cancel</button>
                      <button type="submit" className="cta" style={{ flex: 1, padding: 12, borderRadius: 12, background: T.text, color: '#FFF', fontWeight: 800 }}>Confirm</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── VIEWS ── */}
          {tab === 'mats' && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="pg">
              {filteredMats.map(p => (
                <motion.div key={p.id} variants={up} className="card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.border}`, padding: 14, boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: T.amberBg, color: T.amber, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent:'center' }}><Layers size={20}/></div>
                    <Pill low={p.quantity_remaining <= 5} />
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {p.quantity_remaining} <span style={{ fontSize: 13, fontWeight: 700, color: T.textMute }}>{p.unit}</span>
                  </p>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                    <button onClick={() => setActionCtx({ type: 'RESTOCK', mat: p })} className="cta" style={{ flex: 1, padding: '9px', borderRadius: 10, background: T.amberBg, color: T.amber, fontSize: 12, fontWeight: 800 }}>
                      <Plus size={14}/> Restock
                    </button>
                    <button onClick={() => setActionCtx({ type: 'USAGE', mat: p })} className="cta" style={{ flex: 1, padding: '9px', borderRadius: 10, background: T.bgDeep, color: T.textSub, fontSize: 12, fontWeight: 800 }}>
                      <Minus size={14}/> Usage
                    </button>
                    <button onClick={() => { setMName(p.name); setMUnit(p.unit); setMEditId(p.id); setAddMatOpen(true); }} style={{ padding: '9px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none' }}><Edit2 size={13} color={T.textSub}/></button>
                  </div>
                </motion.div>
              ))}
              {filteredMats.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: T.textMute, fontWeight: 700 }}>No materials found.</div>}
            </motion.div>
          )}

          {tab === 'vendors' && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="pg">
              {filteredVendors.map(v => (
                <motion.div key={v.id} variants={up} className="card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.border}`, padding: 14, boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: T.bgDeep, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent:'center' }}><Building2 size={20}/></div>
                    {v.debt_balance > 0 && <span style={{ background: T.redBg, color: T.red, padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, border: '1px solid rgba(185,28,28,0.15)' }}>Unpaid Debt</span>}
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', WebkitLineClamp: 1, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>{v.name}</h3>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.textMute }}>{v.phone || 'No phone'}</p>
                  
                  <div style={{ marginTop: 16, background: T.bgDeep, borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.textSub, textTransform: 'uppercase' }}>Debt Balance</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: v.debt_balance > 0 ? T.red : T.text }}>₦{v.debt_balance.toLocaleString()}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => setActionCtx({ type: 'PAY', ven: v })} disabled={v.debt_balance <= 0} className="cta" style={{ flex: 1, padding: '9px', borderRadius: 10, background: v.debt_balance > 0 ? T.text : 'rgba(0,0,0,0.05)', color: v.debt_balance > 0 ? '#FFF' : T.textMute, fontSize: 12, fontWeight: 800, opacity: v.debt_balance > 0 ? 1 : 0.5 }}>
                      Settle Debt
                    </button>
                    <button onClick={() => { setVName(v.name); setVPhone(v.phone); setVEditId(v.id); setAddVenOpen(true); }} style={{ padding: '9px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none' }}><Edit2 size={13} color={T.textSub}/></button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'logs' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: T.bgDeep, color: T.textSub }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Details</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(L => (
                    <tr key={L.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: L.type === 'RESTOCK' ? T.indigoBg : L.type === 'USAGE' ? T.amberBg : T.greenBg, color: L.type === 'RESTOCK' ? T.indigo : L.type === 'USAGE' ? T.amber : T.green }}>{L.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: T.text }}>
                        {L.type === 'RESTOCK' ? `+${L.quantity} units (Cost ₦${L.cost_total})` : L.type === 'USAGE' ? `${L.quantity} units deducted` : `Paid ₦${L.amount_paid}`}
                      </td>
                      <td style={{ padding: '12px 16px', color: T.textMute, fontSize: 12 }}>{new Date(L.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={3} style={{ padding: 30, textAlign: 'center', color: T.textMute }}>No history found.</td></tr>}
                </tbody>
              </table>
            </motion.div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
};

export default RawMaterialsManager;
