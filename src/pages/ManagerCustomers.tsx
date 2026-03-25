import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, Truck, Download,
  CheckSquare, Square, Settings2, Zap, Phone,
  X, ChevronRight, History, CreditCard, ShieldCheck, Star,
  TrendingUp, MapPin, SlidersHorizontal, Bell,
  BadgeCheck, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Design Tokens ─── */
const T = {
  bg:        '#f2f3f7',
  surface:   '#ffffff',
  surface2:  '#f8f9fc',
  border:    '#e8eaef',
  accent:    '#4f46e5',
  accentLt:  '#eef2ff',
  accentMd:  '#818cf8',
  success:   '#10b981',
  successLt: '#ecfdf5',
  danger:    '#ef4444',
  dangerLt:  '#fef2f2',
  warn:      '#f59e0b',
  warnLt:    '#fffbeb',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  shadow:    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowMd:  '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  shadowLg:  '0 8px 40px rgba(0,0,0,0.1)',
  radius:    '16px',
  radiusLg:  '24px',
  radiusXl:  '32px',
};

/* ─── Helpers ─── */
const avatarPalette = [
  ['#4f46e5','#e0e7ff'], ['#0891b2','#e0f7fa'], ['#059669','#d1fae5'],
  ['#d97706','#fef3c7'], ['#dc2626','#fee2e2'], ['#7c3aed','#ede9fe'],
];
const getAvatar = (name: string) => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

const fmtDays = (d: number) => {
  if (d === 9999) return { label: 'No Activity', bg: '#f1f5f9', color: '#94a3b8', icon: Clock };
  if (d === 0)    return { label: 'Active Today', bg: '#d1fae5', color: '#059669', icon: BadgeCheck };
  if (d <= 7)     return { label: `${d}d ago`, bg: '#fef3c7', color: '#d97706', icon: TrendingUp };
  if (d <= 30)    return { label: `${d}d ago`, bg: '#e0e7ff', color: '#4f46e5', icon: Clock };
  return { label: 'Dormant', bg: '#fee2e2', color: '#dc2626', icon: AlertCircle };
};

/* ─── Component ─── */
export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment } = useAppContext();
  const navigate = useNavigate();

  /* State */
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<'All'|'Routed'|'Unassigned'|'Debtors'|'Active'|'Dormant'>('All');
  const [sort, setSort]               = useState<'Newest'|'A-Z'|'Debt'|'VIP'>('Newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers]     = useState<{id:string; full_name:string}[]>([]);

  /* Add form */
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fSup, setFSup]   = useState('');
  const [fPin, setFPin]   = useState('');
  const [fNote, setFNote] = useState('');

  /* Drawer */
  const [drawerId, setDrawerId]   = useState<string|null>(null);
  const drawer = useMemo(() => customers.find(c => c.id === drawerId), [customers, drawerId]);
  const [dTab, setDTab]           = useState<'profile'|'ledger'|'activity'>('profile');
  const [editing, setEditing]     = useState(false);
  const [eName, setEName]         = useState('');
  const [ePhone, setEPhone]       = useState('');
  const [eSup, setESup]           = useState('');
  const [ePin, setEPin]           = useState('');
  const [eNote, setENote]         = useState('');
  const [payAmt, setPayAmt]       = useState('');
  const [payMethod, setPayMethod] = useState<'Cash'|'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER')
      .then(({data}) => { if (data) setSuppliers(data); });
  }, []);

  /* Activity map */
  const activity = useMemo(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    customers.forEach(c => {
      const txs = transactions.filter(t => t.customerId === c.id);
      map[c.id] = txs.length
        ? Math.floor((now - new Date(txs.reduce((a,b) => new Date(b.date)>new Date(a.date)?b:a).date).getTime()) / 86400000)
        : 9999;
    });
    return map;
  }, [customers, transactions]);

  /* Filtered list */
  const list = useMemo(() => {
    let r = customers.filter(c => {
      const q = search.toLowerCase();
      if (!(c.name.toLowerCase().includes(q) || (c.phone||'').includes(search))) return false;
      if (filter === 'Routed')     return !!c.assignedSupplierId;
      if (filter === 'Unassigned') return !c.assignedSupplierId;
      if (filter === 'Debtors')    return c.debtBalance > 0;
      if (filter === 'Active')     return activity[c.id] <= 30;
      if (filter === 'Dormant')    return activity[c.id] > 30;
      return true;
    });
    return [...r].sort((a,b) => {
      if (sort==='A-Z')  return a.name.localeCompare(b.name);
      if (sort==='Debt') return (b.debtBalance||0) - (a.debtBalance||0);
      if (sort==='VIP')  return (b.loyaltyPoints||0) - (a.loyaltyPoints||0);
      return Number(b.id) - Number(a.id);
    });
  }, [customers, search, filter, sort, activity]);

  /* Stats */
  const totalDebt   = customers.reduce((s,c) => s+(c.debtBalance||0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const debtors     = customers.filter(c => c.debtBalance > 0).length;
  const active30    = customers.filter(c => activity[c.id] <= 30).length;

  /* Pill counts */
  const counts: Record<string,number> = {
    All: customers.length, Routed: routedCount,
    Unassigned: customers.length - routedCount,
    Debtors: debtors, Active: active30,
    Dormant: customers.length - active30,
  };

  /* Actions */
  const toggle = (id:string) => setSelectedIds(p => p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const assign = async (c:Customer, sid:string) => updateCustomer({...c, assignedSupplierId: sid||undefined});
  const bulkAssign = async (sid:string) => {
    for (const id of selectedIds) { const c=customers.find(x=>x.id===id); if(c) await updateCustomer({...c, assignedSupplierId:sid||undefined}); }
    setSelectedIds([]);
  };
  const exportCSV = () => {
    const rows = selectedIds.length ? customers.filter(c=>selectedIds.includes(c.id)) : list;
    const csv  = "data:text/csv;charset=utf-8," + ["Name,Phone,Debt,Loyalty,Route"].concat(rows.map(c=>`${c.name},${c.phone||''},${c.debtBalance},${c.loyaltyPoints||0},${suppliers.find(s=>s.id===c.assignedSupplierId)?.full_name||'Store'}`)).join('\n');
    const a = document.createElement('a'); a.href = encodeURI(csv); a.download = `customers_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const handleAdd = async (e:React.FormEvent) => {
    e.preventDefault(); if(!fName) return;
    await addCustomer({id:Date.now().toString(), name:fName, phone:fPhone, location:'', notes:fNote, debtBalance:0, loyaltyPoints:0, assignedSupplierId:fSup||undefined, pin:fPin||undefined});
    setFName(''); setFPhone(''); setFSup(''); setFPin(''); setFNote(''); setIsAdding(false);
  };
  const openDrawer = (c:Customer) => {
    setDrawerId(c.id); setEName(c.name); setEPhone(c.phone||''); setESup(c.assignedSupplierId||'');
    setEPin(c.pin||''); setENote(c.notes||''); setEditing(false); setDTab('profile');
  };
  const saveEdit = async (e:React.FormEvent) => {
    e.preventDefault(); if(!eName||!drawer) return;
    await updateCustomer({...drawer, name:eName, phone:ePhone, assignedSupplierId:eSup||undefined, pin:ePin||undefined, notes:eNote});
    setEditing(false);
  };
  const payDebt = async (e:React.FormEvent) => {
    e.preventDefault(); const amt=Number(payAmt); if(!amt||!drawerId) return;
    await recordDebtPayment({id:Date.now().toString(), date:new Date().toISOString(), customerId:drawerId, amount:amt, method:payMethod});
    setPayAmt('');
  };

  /* ─── STYLES ─── */
  const sx = {
    page: { background: T.bg, minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:'96px' } as React.CSSProperties,
    card: (sel:boolean): React.CSSProperties => ({
      background: T.surface,
      border: `1.5px solid ${sel ? T.accent : T.border}`,
      borderRadius: T.radius,
      padding: '16px',
      boxShadow: sel ? `0 0 0 3px ${T.accentLt}, ${T.shadow}` : T.shadow,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    input: {
      background: T.surface2, border: `1.5px solid ${T.border}`,
      borderRadius: '12px', padding: '12px 14px',
      fontSize: '14px', fontWeight: 500, color: T.txt,
      outline: 'none', width: '100%', boxSizing: 'border-box',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    btnPrimary: {
      background: T.accent, color:'#fff', border:'none',
      borderRadius: '12px', padding: '13px 18px',
      fontSize:'13px', fontWeight:700, cursor:'pointer',
      display:'flex', alignItems:'center', gap:'7px',
      whiteSpace:'nowrap', boxShadow:`0 4px 14px rgba(79,70,229,0.3)`,
      transition:'all 0.2s',
    } as React.CSSProperties,
    btnGhost: {
      background: T.surface, color: T.txt2, border: `1.5px solid ${T.border}`,
      borderRadius:'12px', padding:'12px 14px',
      fontSize:'13px', fontWeight:600, cursor:'pointer',
      display:'flex', alignItems:'center', gap:'6px',
      boxShadow: T.shadow, transition:'all 0.2s',
    } as React.CSSProperties,
    pill: (act:boolean): React.CSSProperties => ({
      background: act ? T.accent : T.surface,
      color: act ? '#fff' : T.txt2,
      border: `1.5px solid ${act ? T.accent : T.border}`,
      borderRadius: '10px', padding: '7px 14px',
      fontSize:'12px', fontWeight:700, cursor:'pointer',
      whiteSpace:'nowrap', transition:'all 0.2s',
      boxShadow: act ? `0 4px 12px rgba(79,70,229,0.25)` : T.shadow,
    }),
    label: { fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px', display:'block' } as React.CSSProperties,
    sectionTitle: { fontSize:'12px', fontWeight:800, color:T.txt, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' } as React.CSSProperties,

    /* drawer */
    drawer: { background: T.surface, borderLeft: `1px solid ${T.border}`, boxShadow: T.shadowLg } as React.CSSProperties,
    dInput: {
      background: T.surface2, border: `1.5px solid ${T.border}`,
      borderRadius:'10px', padding:'11px 14px',
      fontSize:'14px', fontWeight:500, color:T.txt,
      outline:'none', width:'100%', boxSizing:'border-box',
      transition:'all 0.2s',
    } as React.CSSProperties,
  };

  return (
    <AnimatedPage>
      <div style={sx.page}>
        <div style={{ padding: '20px 16px 0' }}>

          {/* ══ HEADER ══ */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <button onClick={() => navigate(-1)} style={{ width:'42px', height:'42px', borderRadius:'12px', background:T.surface, border:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:T.shadow }}>
                <ArrowLeft size={18} color={T.txt2} />
              </button>
              <div>
                <h1 style={{ fontSize:'20px', fontWeight:900, color:T.txt, margin:0, letterSpacing:'-0.02em' }}>Customer Base</h1>
                <p style={{ fontSize:'12px', color:T.txt3, margin:0, marginTop:'2px' }}>{customers.length} clients registered</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={exportCSV} style={{ ...sx.btnGhost, padding:'10px 12px' }}><Download size={16} /></button>
              <button style={{ ...sx.btnGhost, padding:'10px 12px' }}><Bell size={16} /></button>
            </div>
          </div>

          {/* ══ HERO ══ */}
          <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, #6366f1 60%, #818cf8 100%)`, borderRadius: T.radiusXl, padding:'24px', marginBottom:'20px', position:'relative', overflow:'hidden', boxShadow:`0 8px 32px rgba(79,70,229,0.3)` }}>
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', background:'rgba(255,255,255,0.08)', borderRadius:'50%', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-50px', left:'40px', width:'120px', height:'120px', background:'rgba(255,255,255,0.05)', borderRadius:'50%', pointerEvents:'none' }} />

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', position:'relative', zIndex:1 }}>
              <div>
                <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'4px' }}>Total Clients</p>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'10px' }}>
                  <span style={{ fontSize:'52px', fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-0.04em' }}>{customers.length}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:'8px' }}>/ {active30} active</span>
                </div>
              </div>
              <div style={{ textAlign:'right', background:'rgba(0,0,0,0.15)', borderRadius:'14px', padding:'12px 16px', backdropFilter:'blur(10px)' }}>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>Total Debt</p>
                <p style={{ color:'#fde68a', fontWeight:900, fontSize:'18px', margin:'4px 0 0' }}>₦{totalDebt.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', position:'relative', zIndex:1 }}>
              {[
                { label:'Routed', value:routedCount, color:'rgba(255,255,255,0.9)' },
                { label:'Open', value:customers.length - routedCount, color:'rgba(255,255,255,0.9)' },
                { label:'Debtors', value:debtors, color:'#fde68a' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:'14px', padding:'14px', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)' }}>
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px' }}>{s.label}</p>
                  <p style={{ fontSize:'22px', fontWeight:900, color:s.color, margin:0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SEARCH + ADD ══ */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={16} color={T.txt3} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input style={{ ...sx.input, paddingLeft:'42px' }}
                placeholder="Search name or phone..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setIsAdding(!isAdding)} style={sx.btnPrimary}><UserPlus size={16} /> Add</button>
            <button onClick={() => setShowFilters(!showFilters)} style={{ ...sx.btnGhost, padding:'12px 14px', background: showFilters ? T.accentLt : T.surface, color: showFilters ? T.accent : T.txt2, borderColor: showFilters ? T.accent : T.border }}>
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* ══ ADD FORM ══ */}
          <AnimatePresence>
            {isAdding && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:0.25}}
                style={{ background:T.surface, borderRadius:T.radiusLg, border:`1.5px solid ${T.border}`, padding:'22px', marginBottom:'16px', overflow:'hidden', boxShadow:T.shadowMd }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'18px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:T.accentLt, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <UserPlus size={18} color={T.accent} />
                  </div>
                  <h3 style={{ color:T.txt, fontWeight:800, fontSize:'15px', margin:0 }}>Register New Client</h3>
                </div>
                <form onSubmit={handleAdd} style={{ display:'grid', gap:'12px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={sx.label}>Full Name *</label>
                      <input style={sx.input} placeholder="e.g. Musa Aliyu" value={fName} onChange={e=>setFName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={sx.label}>Phone</label>
                      <input style={sx.input} type="tel" placeholder="08012345678" value={fPhone} onChange={e=>setFPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={sx.label}>Login PIN (4 digits)</label>
                      <input style={{ ...sx.input, fontFamily:'monospace', letterSpacing:'0.25em' }} maxLength={4} placeholder="••••" value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))} />
                    </div>
                    <div>
                      <label style={sx.label}>Supplier Route</label>
                      <select style={{ ...sx.input, cursor:'pointer' }} value={fSup} onChange={e=>setFSup(e.target.value)}>
                        <option value="">Store Walk-in</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={sx.label}>Notes (Optional)</label>
                    <input style={sx.input} placeholder="Any special notes about this client..." value={fNote} onChange={e=>setFNote(e.target.value)} />
                  </div>
                  <div style={{ display:'flex', gap:'10px' }}>
                    <button type="submit" style={{ ...sx.btnPrimary, flex:1, justifyContent:'center' }}>Save Client</button>
                    <button type="button" onClick={() => setIsAdding(false)} style={{ ...sx.btnGhost, paddingLeft:'20px', paddingRight:'20px' }}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ FILTERS ══ */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                style={{ background:T.surface, borderRadius:T.radius, border:`1.5px solid ${T.border}`, padding:'16px', marginBottom:'16px', overflow:'hidden', boxShadow:T.shadow }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <p style={sx.sectionTitle}>Filter & Sort</p>
                  <div style={{ position:'relative' }}>
                    <Settings2 size={13} color={T.txt3} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)' }} />
                    <select value={sort} onChange={e=>setSort(e.target.value as any)}
                      style={{ background:T.surface2, border:`1.5px solid ${T.border}`, borderRadius:'10px', padding:'8px 12px 8px 30px', fontSize:'12px', fontWeight:700, color:T.txt, outline:'none', cursor:'pointer' }}>
                      <option value="Newest">Newest First</option>
                      <option value="A-Z">A → Z</option>
                      <option value="Debt">Highest Debt</option>
                      <option value="VIP">Top VIP Points</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {(['All','Routed','Unassigned','Debtors','Active','Dormant'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={sx.pill(filter===f)}>
                      {f} <span style={{ opacity:0.6, marginLeft:'4px', fontSize:'11px' }}>{counts[f]}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick filter pills (always visible) */}
          {!showFilters && (
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', marginBottom:'18px', paddingBottom:'4px' }}>
              {(['All','Routed','Unassigned','Debtors','Active','Dormant'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={sx.pill(filter===f)}>
                  {f}
                  <span style={{ background: filter===f ? 'rgba(255,255,255,0.2)' : T.border, color: filter===f ? '#fff' : T.txt3, fontSize:'10px', fontWeight:700, padding:'1px 6px', borderRadius:'6px', marginLeft:'6px' }}>{counts[f]}</span>
                </button>
              ))}
            </div>
          )}

          {/* ══ BULK BANNER ══ */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                style={{ background:T.accent, color:'#fff', padding:'14px 18px', borderRadius:T.radius, marginBottom:'16px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'10px', position:'sticky', top:'14px', zIndex:50, boxShadow:`0 8px 24px rgba(79,70,229,0.35)` }}>
                <span style={{ fontWeight:700, fontSize:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <CheckSquare size={16}/> {selectedIds.length} selected
                </span>
                <div style={{ display:'flex', gap:'8px' }}>
                  <select onChange={e=>bulkAssign(e.target.value)} value=""
                    style={{ background:'rgba(0,0,0,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'8px 12px', fontSize:'12px', fontWeight:700, outline:'none', cursor:'pointer' }}>
                    <option value="" disabled>Bulk Route...</option>
                    <option value="">Unassign</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <button onClick={()=>setSelectedIds([])} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'8px 14px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>Clear</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ LIST ══ */}
          <motion.div style={{ display:'flex', flexDirection:'column', gap:'10px' }}
            initial="hidden" animate="visible"
            variants={{ hidden:{opacity:0}, visible:{opacity:1, transition:{staggerChildren:0.05}} }}>

            {list.map(c => {
              const sel = selectedIds.includes(c.id);
              const vip = (c.loyaltyPoints||0) > 100;
              const [ac, lc] = getAvatar(c.name);
              const bd = fmtDays(activity[c.id]);
              const BdIcon = bd.icon;

              return (
                <motion.div key={c.id}
                  variants={{ hidden:{opacity:0,y:16}, visible:{opacity:1,y:0} }}
                  whileHover={{ y:-2, boxShadow: T.shadowMd }}
                  style={sx.card(sel)}
                  onClick={e => {
                    if ((e.target as HTMLElement).tagName==='SELECT' || (e.target as HTMLElement).closest('button,a,select')) return;
                    openDrawer(c);
                  }}>

                  {/* Top row */}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'13px' }}>
                    <button onClick={e=>{e.stopPropagation();toggle(c.id);}}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0, display:'flex' }}>
                      {sel ? <CheckSquare size={18} color={T.accent}/> : <Square size={18} color={T.txt3}/>}
                    </button>

                    {/* Avatar */}
                    <div style={{ width:'46px', height:'46px', borderRadius:'13px', background:lc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', fontWeight:900, color:ac, flexShrink:0, border:`1.5px solid ${ac}30` }}>
                      {c.name.charAt(0)}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap' }}>
                        <span style={{ color:T.txt, fontWeight:800, fontSize:'15px', letterSpacing:'-0.01em' }}>{c.name}</span>
                        {vip && (
                          <span style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:'9px', fontWeight:900, padding:'2px 7px', borderRadius:'6px', letterSpacing:'0.06em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'3px' }}>
                            <Star size={8} fill="#fff"/> VIP
                          </span>
                        )}
                        {c.pin && (
                          <span style={{ background:T.successLt, color:T.success, fontSize:'9px', fontWeight:800, padding:'2px 7px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'3px' }}>
                            <BadgeCheck size={9}/> Auth
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'5px', flexWrap:'wrap' }}>
                        {c.phone ? (
                          <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                            onClick={e=>e.stopPropagation()}
                            style={{ color:T.success, fontSize:'12px', fontWeight:600, display:'flex', alignItems:'center', gap:'4px', textDecoration:'none', background:T.successLt, padding:'3px 8px', borderRadius:'7px' }}>
                            <Phone size={10}/> {c.phone}
                          </a>
                        ) : (
                          <span style={{ color:T.txt3, fontSize:'12px' }}>No phone</span>
                        )}
                        <span style={{ background:bd.bg, color:bd.color, fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'7px', display:'flex', alignItems:'center', gap:'4px' }}>
                          <BdIcon size={9}/> {bd.label}
                        </span>
                      </div>
                    </div>

                    {/* Debt badge */}
                    {c.debtBalance > 0 ? (
                      <div style={{ textAlign:'right', flexShrink:0, background:T.dangerLt, borderRadius:'10px', padding:'8px 12px', border:`1px solid ${T.danger}20` }}>
                        <p style={{ color:T.txt3, fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 2px' }}>Debt</p>
                        <p style={{ color:T.danger, fontWeight:900, fontSize:'14px', margin:0 }}>₦{c.debtBalance.toLocaleString()}</p>
                      </div>
                    ) : (
                      <div style={{ flexShrink:0, background:T.successLt, borderRadius:'10px', padding:'8px 12px', border:`1px solid ${T.success}20` }}>
                        <p style={{ color:T.success, fontSize:'11px', fontWeight:800, margin:0 }}>✓ Clear</p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height:'1px', background:T.border, marginBottom:'13px' }}/>

                  {/* Bottom row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <Truck size={13} color={T.txt3}/>
                      <select onClick={e=>e.stopPropagation()} value={c.assignedSupplierId||''} onChange={e=>assign(c,e.target.value)}
                        style={{ background:T.surface2, color:T.txt, border:`1.5px solid ${T.border}`, borderRadius:'9px', padding:'7px 12px', fontSize:'12px', fontWeight:600, outline:'none', cursor:'pointer' }}>
                        <option value="">Store</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                      </select>
                      {c.loyaltyPoints ? (
                        <span style={{ background:'#fef3c7', color:'#d97706', fontSize:'11px', fontWeight:700, padding:'5px 10px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'3px' }}>
                          <Star size={10} fill="#d97706" color="#d97706"/> {c.loyaltyPoints}
                        </span>
                      ) : null}
                    </div>
                    <button onClick={e=>{e.stopPropagation();navigate(`/customers/${c.id}`);}}
                      style={{ background:T.accentLt, color:T.accent, border:`1.5px solid ${T.accent}30`, borderRadius:'10px', padding:'8px 14px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                      View <ChevronRight size={13}/>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {list.length === 0 && (
              <div style={{ textAlign:'center', padding:'64px 0', color:T.txt3 }}>
                <RefreshCw size={40} style={{ margin:'0 auto 12px', opacity:0.2 }}/>
                <p style={{ fontWeight:700, fontSize:'15px', color:T.txt2 }}>No Clients Found</p>
                <p style={{ fontSize:'13px', marginTop:'4px' }}>Try a different filter or search.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ══ CRM DRAWER ══ */}
        <AnimatePresence>
          {drawer && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(6px)', zIndex:90 }}
                onClick={() => setDrawerId(null)}/>

              <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
                transition={{type:'spring', damping:28, stiffness:220}}
                style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:'420px', zIndex:100, display:'flex', flexDirection:'column', overflow:'hidden', ...sx.drawer }}>

                {/* Drawer header */}
                <div style={{ background:`linear-gradient(135deg,${T.accent},#6366f1)`, padding:'28px 24px 24px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'140px', height:'140px', background:'rgba(255,255,255,0.07)', borderRadius:'50%' }}/>
                  <button onClick={()=>setDrawerId(null)}
                    style={{ position:'absolute', top:'20px', right:'20px', width:'36px', height:'36px', borderRadius:'10px', background:'rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <X size={16} color="#fff"/>
                  </button>

                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
                    <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:`${getAvatar(drawer.name)[1]}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:getAvatar(drawer.name)[0], boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
                      {drawer.name.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ color:'#fff', fontWeight:900, fontSize:'19px', margin:0, letterSpacing:'-0.02em' }}>{drawer.name}</h2>
                      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', margin:'4px 0 0', display:'flex', alignItems:'center', gap:'5px' }}>
                        <Phone size={11}/> {drawer.phone||'No Phone'} &nbsp;·&nbsp; <MapPin size={11}/> {drawer.location||'No Location'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {drawer.pin
                      ? <span style={{ background:'rgba(52,211,153,0.2)', color:'#a7f3d0', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>🔐 Auth On</span>
                      : <span style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>Auth Off</span>
                    }
                    <button onClick={()=>setEditing(!editing)}
                      style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
                      {editing ? '✕ Cancel' : '✏ Edit'}
                    </button>
                    <button onClick={()=>{setDTab('ledger');}}
                      style={{ background: drawer.debtBalance>0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', color: drawer.debtBalance>0 ? '#fca5a5' : 'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
                      ₦{drawer.debtBalance.toLocaleString()}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, background:T.surface2, flexShrink:0 }}>
                  {([
                    {key:'profile' as const, label:'Profile', icon:ShieldCheck, color:T.accent},
                    {key:'ledger' as const, label:'Ledger', icon:CreditCard, color:T.success},
                    {key:'activity' as const, label:'Activity', icon:History, color:'#3b82f6'},
                  ]).map(tab => (
                    <button key={tab.key} onClick={()=>setDTab(tab.key)}
                      style={{ flex:1, padding:'14px 0', fontSize:'11px', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none', borderBottom:`2.5px solid ${dTab===tab.key ? tab.color : 'transparent'}`, color: dTab===tab.key ? tab.color : T.txt3, background:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all 0.2s' }}>
                      <tab.icon size={13}/> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Drawer body */}
                <div style={{ flex:1, overflowY:'auto', padding:'22px' }}>

                  {/* Profile */}
                  {dTab==='profile' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                      {editing ? (
                        <form onSubmit={saveEdit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                          <div style={{ background:T.accentLt, border:`1.5px solid ${T.accent}20`, borderRadius:'14px', padding:'16px' }}>
                            <label style={{ ...sx.label, color:T.accent }}>🔐 Login PIN (4 Digits)</label>
                            <input style={{ ...sx.dInput, fontFamily:'monospace', letterSpacing:'0.3em' }} maxLength={4} placeholder="e.g. 1234" value={ePin} onChange={e=>setEPin(e.target.value.replace(/\D/g,''))}/>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                            <div><label style={sx.label}>Name</label><input style={sx.dInput} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                            <div><label style={sx.label}>Phone</label><input style={sx.dInput} type="tel" value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                          </div>
                          <div><label style={sx.label}>Route</label>
                            <select style={{ ...sx.dInput, cursor:'pointer' }} value={eSup} onChange={e=>setESup(e.target.value)}>
                              <option value="">Unassigned</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                            </select>
                          </div>
                          <div><label style={sx.label}>Notes</label><input style={sx.dInput} placeholder="Additional notes..." value={eNote} onChange={e=>setENote(e.target.value)}/></div>
                          <button type="submit" style={{ ...sx.btnPrimary, justifyContent:'center', width:'100%', padding:'15px' }}>Save Changes</button>
                        </form>
                      ) : (
                        <>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                            {[
                              {label:'Status', value: activity[drawer.id] <= 30 ? '🟢 Active' : '🟡 Dormant'},
                              {label:'Loyalty', value: `★ ${drawer.loyaltyPoints||0} pts`},
                              {label:'Last Active', value: activity[drawer.id] === 9999 ? 'Never' : `${activity[drawer.id]}d ago`},
                              {label:'Route', value: suppliers.find(s=>s.id===drawer.assignedSupplierId)?.full_name || 'Store'},
                            ].map(stat => (
                              <div key={stat.label} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'14px' }}>
                                <p style={{ ...sx.label, marginBottom:'4px' }}>{stat.label}</p>
                                <p style={{ color:T.txt, fontWeight:800, fontSize:'14px', margin:0 }}>{stat.value}</p>
                              </div>
                            ))}
                          </div>
                          {drawer.notes && (
                            <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'14px' }}>
                              <p style={sx.label}>Notes</p>
                              <p style={{ color:T.txt2, fontSize:'14px', margin:0 }}>{drawer.notes}</p>
                            </div>
                          )}
                          <button onClick={()=>navigate(`/customers/${drawer.id}`)}
                            style={{ ...sx.btnPrimary, justifyContent:'center', width:'100%', padding:'15px', marginTop:'6px' }}>
                            Open Full Profile <ChevronRight size={16}/>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Ledger */}
                  {dTab==='ledger' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                      <div style={{ background: drawer.debtBalance>0 ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#059669,#047857)', borderRadius:'20px', padding:'24px', position:'relative', overflow:'hidden', boxShadow: drawer.debtBalance>0 ? '0 8px 24px rgba(220,38,38,0.25)' : '0 8px 24px rgba(5,150,105,0.25)' }}>
                        <Zap style={{ position:'absolute', right:'-8px', bottom:'-8px', opacity:0.1 }} size={90} color="#fff"/>
                        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>Active Debt</p>
                        <p style={{ color:'#fff', fontWeight:900, fontSize:'38px', margin:0, letterSpacing:'-0.03em' }}>₦{drawer.debtBalance.toLocaleString()}</p>
                        {drawer.debtBalance===0 && <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:700, marginTop:'8px' }}>✓ This client has no outstanding debt</p>}
                      </div>

                      {drawer.debtBalance>0 && (
                        <form onSubmit={payDebt} style={{ background:T.surface2, border:`1.5px solid ${T.border}`, borderRadius:'18px', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
                          <p style={{ ...sx.sectionTitle }}><CreditCard size={15} style={{verticalAlign:'middle', marginRight:'6px'}} color={T.success}/>Settle Payment</p>
                          <div style={{ position:'relative' }}>
                            <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:T.txt3, fontWeight:700 }}>₦</span>
                            <input type="number" max={drawer.debtBalance} placeholder="0" value={payAmt} onChange={e=>setPayAmt(e.target.value)} required
                              style={{ ...sx.dInput, paddingLeft:'30px', fontSize:'18px', fontWeight:900, color:T.success }}/>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                            {(['Cash','Transfer'] as const).map(m => (
                              <button key={m} type="button" onClick={()=>setPayMethod(m)}
                                style={{ padding:'12px', borderRadius:'10px', fontSize:'13px', fontWeight:700, cursor:'pointer', border:`2px solid ${payMethod===m ? T.success : T.border}`, background: payMethod===m ? T.successLt : 'transparent', color: payMethod===m ? T.success : T.txt2, transition:'all 0.2s' }}>
                                {m}
                              </button>
                            ))}
                          </div>
                          <button type="submit" style={{ background:`linear-gradient(135deg,${T.success},#047857)`, color:'#fff', border:'none', borderRadius:'12px', padding:'15px', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:`0 4px 16px rgba(5,150,105,0.3)` }}>
                            <ShieldCheck size={16}/> Confirm Payment
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Activity */}
                  {dTab==='activity' && (
                    <div>
                      <p style={sx.sectionTitle}>Recent Transactions</p>
                      {transactions.filter(t=>t.customerId===drawer.id).length===0 ? (
                        <div style={{ textAlign:'center', padding:'48px 0', color:T.txt3 }}>
                          <History size={36} style={{ margin:'0 auto 10px', opacity:0.2 }}/>
                          <p style={{ fontWeight:700, fontSize:'13px', color:T.txt2 }}>No History Yet</p>
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                          {transactions.filter(t=>t.customerId===drawer.id)
                            .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
                            .slice(0,12)
                            .map(tx => (
                              <div key={tx.id} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'13px', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:T.accentLt, display:'flex', alignItems:'center', justifyContent:'center', color:T.accent, fontWeight:900, fontSize:'13px' }}>
                                    {tx.items?.reduce((a,p)=>a+p.quantity,0)||tx.quantity||1}
                                  </div>
                                  <div>
                                    <p style={{ color:T.txt, fontWeight:700, fontSize:'13px', margin:0 }}>Order Checkout</p>
                                    <p style={{ color:T.txt3, fontSize:'11px', margin:'2px 0 0' }}>
                                      {new Date(tx.date).toLocaleDateString()} · {new Date(tx.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign:'right' }}>
                                  <p style={{ color:T.txt, fontWeight:900, fontSize:'14px', margin:0 }}>₦{(tx.totalPrice||0).toLocaleString()}</p>
                                  <p style={{ color: tx.type==='Cash' ? T.success : T.danger, fontSize:'10px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', margin:'2px 0 0' }}>{tx.type}</p>
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