import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2, Search, X, TrendingDown, LayoutGrid,
  Building2, Banknote, Trash2, ShoppingCart, AlertTriangle,
  Receipt, CheckCircle, Wheat, ChevronsDown, FileText,
  Sparkles, BarChart3, Package
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
   DESIGN TOKENS — LIGHT PREMIUM WARM THEME
══════════════════════════════════════════════════════ */
const T = {
  /* backgrounds */
  bg:         '#F5F2EC',    // warm parchment
  bgCard:     '#FFFFFF',
  bgDeep:     '#EEE9E0',
  bgGlass:    'rgba(255,255,255,0.72)',
  /* borders */
  border:     '#E2DDD4',
  borderMid:  '#CBC5BA',
  /* brand amber */
  amber:      '#B8791A',
  amberBright:'#D4941F',
  amberBg:    'rgba(184,121,26,0.08)',
  amberRing:  'rgba(184,121,26,0.22)',
  amberGrad:  'linear-gradient(135deg, #D4941F 0%, #B8791A 100%)',
  /* semantic */
  green:      '#1A7A4A',
  greenBg:    'rgba(26,122,74,0.09)',
  red:        '#C0392B',
  redBg:      'rgba(192,57,43,0.08)',
  blue:       '#2563EB',
  blueBg:     'rgba(37,99,235,0.09)',
  purple:     '#7C3AED',
  purpleBg:   'rgba(124,58,237,0.09)',
  /* text */
  text:       '#1A1816',
  textSub:    '#5C584F',
  textMuted:  '#9A9388',
  /* shadows */
  shadow:     '0 1px 4px rgba(24,22,18,0.07), 0 1px 2px rgba(24,22,18,0.05)',
  shadowMd:   '0 4px 16px rgba(24,22,18,0.10), 0 2px 4px rgba(24,22,18,0.06)',
  shadowLg:   '0 12px 40px rgba(24,22,18,0.14), 0 4px 8px rgba(24,22,18,0.07)',
  shadowXl:   '0 24px 64px rgba(24,22,18,0.18), 0 8px 16px rgba(24,22,18,0.08)',
};

const baseInp: React.CSSProperties = {
  width: '100%', padding: '12px 15px',
  background: T.bgDeep, border: `1.5px solid ${T.border}`,
  borderRadius: 13, fontSize: 14, fontWeight: 500,
  color: T.text, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color .15s, background .15s, box-shadow .15s',
};

/* ══════════════════════════════════════════════════════
   MICRO COMPONENTS
══════════════════════════════════════════════════════ */
const FieldLabel = ({ req, children }: { req?: boolean; children: React.ReactNode }) => (
  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textSub }}>
    {children}{req && <span style={{ color: T.amber, marginLeft: 3 }}>*</span>}
  </p>
);

const StockBadge = ({ qty, unit }: { qty: number; unit: string }) => {
  const col = qty === 0 ? T.red : qty <= 5 ? '#B45309' : T.green;
  const bg  = qty === 0 ? T.redBg : qty <= 5 ? 'rgba(180,83,9,0.09)' : T.greenBg;
  const lbl = qty === 0 ? 'Empty' : qty <= 5 ? 'Low' : 'Good';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:800, background:bg, color:col, border:`1px solid ${col}22`, letterSpacing:.3 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:col }} />{qty} {unit} · {lbl}
    </span>
  );
};

/* Bottom Sheet Component */
const BottomSheet = ({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
          style={{ position:'absolute', inset:0, background:'rgba(30,24,16,0.45)', backdropFilter:'blur(10px)' }} />
        <motion.div
          initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
          transition={{ type:'spring', stiffness:400, damping:38 }}
          style={{ position:'relative', background:'#FFFFFF', borderRadius:'28px 28px 0 0', maxHeight:'92vh', overflowY:'auto', boxShadow:T.shadowXl }}>
          <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 4px' }}>
            <div style={{ width:40, height:4, borderRadius:99, background:T.border }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 24px 18px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.text, letterSpacing:'-0.025em' }}>{title}</h2>
              {subtitle && <p style={{ margin:'3px 0 0', fontSize:13, color:T.textSub, fontWeight:500 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, background:T.bgDeep, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.textSub, cursor:'pointer' }}>
              <X size={16}/>
            </button>
          </div>
          <div style={{ padding:'0 24px 36px' }}>{children}</div>
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
  const [tab, setTab] = useState<'mats'|'vendors'|'logs'>('mats');
  const [query, setQuery] = useState('');

  const [addMatOpen, setAddMatOpen] = useState(false);
  const [addVenOpen, setAddVenOpen] = useState(false);
  const [actionCtx, setActionCtx] = useState<{ type:'USAGE'|'PAY'; mat?: RawMaterial; ven?: RMVendor }|null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const [mName, setMName] = useState(''); const [mUnit, setMUnit] = useState('Bags'); const [mEditId, setMEditId] = useState<string|null>(null);
  const [vName, setVName] = useState(''); const [vPhone, setVPhone] = useState(''); const [vEditId, setVEditId] = useState<string|null>(null);
  const [aQty, setAQty] = useState(''); const [aPaid, setAPaid] = useState('');
  const [bVenId, setBVenId] = useState('');
  const [bItems, setBItems] = useState<{id:string;matId:string;qty:string;price:string}[]>([]);
  const [bCost, setBCost] = useState(''); const [bCash, setBCash] = useState(''); const [bTransfer, setBTransfer] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes,vRes,lRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('rm_suppliers').select('*').order('name'),
        supabase.from('rm_logs').select('*').order('created_at',{ascending:false}).limit(60),
      ]);
      if (mRes.data) setMats(mRes.data);
      if (vRes.data && !vRes.error) setVendors(vRes.data);
      if (lRes.data && !lRes.error) setLogs(lRes.data);
    } catch(e){ console.error(e); }
    setLoading(false);
  };
  useEffect(()=>{ fetchAll(); },[]);

  const resetAll = () => {
    setAddMatOpen(false); setAddVenOpen(false); setActionCtx(null); setBatchOpen(false);
    setMName(''); setMUnit('Bags'); setMEditId(null);
    setVName(''); setVPhone(''); setVEditId(null);
    setAQty(''); setAPaid('');
    setBVenId(''); setBItems([]); setBCost(''); setBCash(''); setBTransfer('');
  };

  const saveMat = async (e: React.FormEvent) => {
    e.preventDefault(); if (!mName) return;
    if (mEditId) await supabase.from('raw_materials').update({name:mName,unit:mUnit}).eq('id',mEditId);
    else await supabase.from('raw_materials').insert([{name:mName,unit:mUnit,quantity_remaining:0}]);
    resetAll(); fetchAll();
  };
  const saveVen = async (e: React.FormEvent) => {
    e.preventDefault(); if (!vName) return;
    const {error} = vEditId
      ? await supabase.from('rm_suppliers').update({name:vName,phone:vPhone}).eq('id',vEditId)
      : await supabase.from('rm_suppliers').insert([{name:vName,phone:vPhone,debt_balance:0}]);
    if (error) alert('Vendor save failed. Check DB migration.');
    resetAll(); fetchAll();
  };
  const executeAction = async (e: React.FormEvent) => {
    e.preventDefault(); if (!actionCtx) return;
    if (actionCtx.type==='USAGE'&&actionCtx.mat) {
      const q=parseFloat(aQty)||0;
      await supabase.from('raw_materials').update({quantity_remaining:Math.max(0,actionCtx.mat.quantity_remaining-q)}).eq('id',actionCtx.mat.id);
      await supabase.from('rm_logs').insert([{material_id:actionCtx.mat.id,type:'USAGE',quantity:q}]);
    } else if (actionCtx.type==='PAY'&&actionCtx.ven) {
      const p=parseFloat(aPaid)||0;
      await supabase.from('rm_suppliers').update({debt_balance:Math.max(0,actionCtx.ven.debt_balance-p)}).eq('id',actionCtx.ven.id);
      await supabase.from('rm_logs').insert([{supplier_id:actionCtx.ven.id,type:'PAYMENT',amount_paid:p}]);
    }
    resetAll(); fetchAll();
  };
  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bVenId||bItems.length===0) return alert('Select a supplier and add at least 1 item.');
    const calcCost=bItems.reduce((a,it)=>a+(parseFloat(it.qty)||0)*(parseFloat(it.price)||0),0);
    const c=parseFloat(bCost)||calcCost;
    const cP=parseFloat(bCash)||0; const tP=parseFloat(bTransfer)||0; const d=c-(cP+tP);
    const updates=bItems.map(item=>{ const mat=mats.find(m=>m.id===item.matId); if(!mat) return null; return supabase.from('raw_materials').update({quantity_remaining:mat.quantity_remaining+(parseFloat(item.qty)||0)}).eq('id',mat.id); });
    await Promise.all((updates.filter(u=>u!==null) as unknown) as Promise<any>[]);
    const validItems=bItems.map(item=>{ const m=mats.find(x=>x.id===item.matId); return {material_id:item.matId,name:m?.name||'Unknown',quantity:parseFloat(item.qty)||0,price:parseFloat(item.price)||0}; });
    const {error}=await supabase.from('rm_logs').insert([{supplier_id:bVenId,type:'RESTOCK',cost_total:c,cash_paid:cP,transfer_paid:tP,items:validItems}]);
    if (d>0&&!error) { const ven=vendors.find(v=>v.id===bVenId); if(ven) await supabase.from('rm_suppliers').update({debt_balance:ven.debt_balance+d}).eq('id',ven.id); }
    if (error) alert('Failed. Check DB.');
    resetAll(); fetchAll();
  };

  const addRow=()=>setBItems([...bItems,{id:Date.now().toString(),matId:mats[0]?.id||'',qty:'',price:''}]);
  const updateRow=(id:string,field:string,val:string)=>setBItems(bItems.map(i=>i.id===id?{...i,[field]:val}:i));
  const removeRow=(id:string)=>setBItems(bItems.filter(i=>i.id!==id));

  const totalDebt=vendors.reduce((s,v)=>s+(v.debt_balance||0),0);
  const lowMats=mats.filter(m=>m.quantity_remaining<=5).length;

  const filteredMats=mats.filter(m=>!query||m.name.toLowerCase().includes(query.toLowerCase()));
  const filteredVendors=vendors.filter(v=>!query||v.name.toLowerCase().includes(query.toLowerCase()));

  const stagger={hidden:{opacity:0},show:{opacity:1,transition:{staggerChildren:.055}}};
  const up={hidden:{opacity:0,y:18},show:{opacity:1,y:0,transition:{type:'spring' as const,stiffness:400,damping:30}}};

  const TABS=[
    {key:'mats',label:'Inventory',icon:<LayoutGrid size={13}/>},
    {key:'vendors',label:'Suppliers',icon:<Building2 size={13}/>},
    {key:'logs',label:'History',icon:<FileText size={13}/>},
  ] as const;

  if (loading&&mats.length===0) return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Plus Jakarta Sans'}}>
      <div style={{textAlign:'center'}}>
        <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.2,ease:'linear'}}
          style={{width:40,height:40,border:`3px solid ${T.amberBg}`,borderTopColor:T.amber,borderRadius:'50%',margin:'0 auto 16px'}}/>
        <p style={{color:T.textMuted,fontWeight:700,fontSize:13}}>Loading supply chain…</p>
      </div>
    </div>
  );

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        .rm-page { font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        .lInp::placeholder { color:${T.textMuted}; }
        .lInp:hover:not(:focus) { background:${T.bgDeep}; border-color:${T.borderMid}; }
        .lInp:focus { background:#FFF; border-color:${T.amber}; box-shadow:0 0 0 3.5px ${T.amberRing}; outline:none; }
        .lInp option { background:#FFF; color:${T.text}; }
        .mat-card { transition:transform .22s cubic-bezier(.22,.68,0,1.3),box-shadow .22s; }
        .mat-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:${T.shadowLg} !important; }
        .tab-pill { background:none; border:none; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; padding:9px 16px; border-radius:12px; font-size:13px; font-weight:700; transition:all .16s; white-space:nowrap; }
        .cta { border:none; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; justify-content:center; gap:7px; font-weight:800; transition:transform .14s,box-shadow .14s; }
        .cta:hover { transform:scale(1.03); }
        .cta:active { transform:scale(0.97); }
        ::-webkit-scrollbar { width:0; height:0; }
      `}</style>

      <div className="rm-page" style={{ minHeight:'100vh', background:T.bg, paddingBottom:96, position:'relative', overflow:'hidden' }}>

        {/* ── DECORATIVE BACKGROUND BLOBS ── */}
        <div aria-hidden style={{ position:'fixed', top:-120, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(184,121,26,0.10) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div aria-hidden style={{ position:'fixed', bottom:-80, left:-120, width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
        <div aria-hidden style={{ position:'fixed', top:'40%', left:'60%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

        {/* ── STICKY HEADER ── */}
        <header style={{ position:'sticky', top:0, zIndex:50, background:'rgba(245,242,236,0.90)', backdropFilter:'blur(22px) saturate(1.6)', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'0 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, height:54 }}>
              <motion.button whileTap={{ scale:.88 }} onClick={()=>navigate(-1)}
                style={{ width:37, height:37, flexShrink:0, borderRadius:11, background:T.bgCard, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.textSub, cursor:'pointer', boxShadow:T.shadow }}>
                <ArrowLeft size={16}/>
              </motion.button>
              <div style={{ flex:1 }}>
                <h1 style={{ margin:0, fontSize:17, fontWeight:900, color:T.text, letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:8 }}>
                  <Wheat size={17} style={{ color:T.amber }}/> Supply & Raw Materials
                </h1>
                <p style={{ margin:0, fontSize:11, color:T.textMuted, fontWeight:600 }}>{mats.length} materials · {vendors.length} vendors tracked</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {lowMats > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:99, background:T.redBg, color:T.red, fontSize:10, fontWeight:800 }}>
                    <AlertTriangle size={10}/> {lowMats} Low
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ maxWidth:680, margin:'0 auto', padding:'0 8px 8px', display:'flex', gap:4 }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} className="tab-pill"
                style={{ color:tab===t.key?T.amber:T.textMuted, background:tab===t.key?T.amberBg:'transparent', flex:1, justifyContent:'center' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </header>

        <div style={{ maxWidth:680, margin:'0 auto', padding:'18px 16px 0', position:'relative', zIndex:1 }}>

          {/* ── STATS STRIP ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
            {[
              {v:mats.length, l:'Materials', c:T.blue, bg:T.blueBg, icon:<LayoutGrid size={13}/>},
              {v:lowMats, l:'Low Stock', c:'#B45309', bg:'rgba(180,83,9,0.09)', icon:<AlertTriangle size={13}/>},
              {v:`₦${(totalDebt/1000).toFixed(1)}k`, l:'Owed', c:T.red, bg:T.redBg, icon:<Banknote size={13}/>},
              {v:vendors.length, l:'Suppliers', c:T.green, bg:T.greenBg, icon:<Building2 size={13}/>},
            ].map((s,i)=>(
              <motion.div key={i} variants={up}
                style={{ background:T.bgCard, borderRadius:16, padding:'10px 8px', border:`1px solid ${T.border}`, textAlign:'center', boxShadow:T.shadow, position:'relative', overflow:'hidden' }}>
                {/* tiny shimmer top */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${s.c}66, transparent)` }}/>
                <div style={{ width:28, height:28, borderRadius:8, background:s.bg, color:s.c, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 7px' }}>{s.icon}</div>
                <p style={{ margin:0, fontSize:17, fontWeight:900, color:T.text, lineHeight:1, letterSpacing:'-0.02em' }}>{s.v}</p>
                <p style={{ margin:'3px 0 0', fontSize:9, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.l}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── SEARCH + ACTION BUTTONS ── */}
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
              <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${tab}…`}
                className="lInp" style={{ ...baseInp, paddingLeft:38, paddingRight:query?38:16 }}/>
              {query && <button onClick={()=>setQuery('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.textMuted }}><X size={14}/></button>}
            </div>
            {tab==='mats' && (
              <>
                <motion.button whileTap={{scale:.92}} onClick={()=>{setBItems([{id:'1',matId:mats[0]?.id||'',qty:'',price:''}]);setBatchOpen(true);}} className="cta"
                  style={{ padding:'0 14px', borderRadius:13, background:'linear-gradient(135deg, #4F46E5, #7C3AED)', color:'#FFF', fontSize:12, boxShadow:'0 4px 18px rgba(79,70,229,0.32)', flexShrink:0 }}>
                  <ShoppingCart size={14}/> Receipt
                </motion.button>
                <motion.button whileTap={{scale:.92}} onClick={()=>setAddMatOpen(true)} className="cta"
                  style={{ padding:'0 14px', borderRadius:13, background:T.amberGrad, color:'#FFF', fontSize:12, fontWeight:900, boxShadow:`0 4px 18px ${T.amberRing}`, flexShrink:0 }}>
                  <Plus size={15}/> Item
                </motion.button>
              </>
            )}
            {tab==='vendors' && (
              <motion.button whileTap={{scale:.92}} onClick={()=>setAddVenOpen(true)} className="cta"
                style={{ padding:'0 14px', borderRadius:13, background:`linear-gradient(135deg,${T.green},#2A9D5C)`, color:'#FFF', fontSize:12, boxShadow:`0 4px 18px ${T.greenBg}`, flexShrink:0 }}>
                <Plus size={15}/> Supplier
              </motion.button>
            )}
          </div>

          {/* ════════ MATERIALS TAB ════════ */}
          {tab==='mats' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {filteredMats.length===0 && (
                <div style={{ textAlign:'center', padding:'56px 0', color:T.textMuted }}>
                  <Package size={40} style={{ margin:'0 auto 12px', opacity:.3 }}/>
                  <p style={{ fontWeight:700 }}>No materials yet — add your first item!</p>
                </div>
              )}
              {filteredMats.map(mat=>{
                const pct=Math.min(100,(mat.quantity_remaining/Math.max(100,mat.quantity_remaining+10))*100);
                const isEmpty=mat.quantity_remaining===0;
                const isLow=mat.quantity_remaining<=5;
                const barC=isEmpty?T.red:isLow?'#B45309':T.green;
                const iconBg=isEmpty?T.redBg:isLow?'rgba(180,83,9,0.09)':T.greenBg;
                return (
                  <motion.div key={mat.id} variants={up} className="mat-card"
                    style={{ background:T.bgCard, borderRadius:22, border:`1px solid ${T.border}`, overflow:'hidden', boxShadow:T.shadow }}>

                    {/* Accent line */}
                    <div style={{ height:3, background:`linear-gradient(90deg, ${barC}33, ${barC})`}} />

                    <div style={{ padding:'18px 18px 14px' }}>
                      {/* Header row */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                        <div style={{ display:'flex', gap:12, alignItems:'center', flex:1, minWidth:0 }}>
                          {/* Icon */}
                          <div style={{ width:48, height:48, borderRadius:16, background:`linear-gradient(135deg, ${iconBg}, ${barC}0D)`, border:`1.5px solid ${barC}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Wheat size={22} style={{ color:barC }}/>
                          </div>
                          <div style={{ minWidth:0, flex:1 }}>
                            <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:T.text, letterSpacing:'-0.02em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mat.name}</h3>
                            <StockBadge qty={mat.quantity_remaining} unit={mat.unit}/>
                          </div>
                        </div>
                        <button onClick={()=>{setMName(mat.name);setMUnit(mat.unit);setMEditId(mat.id);setAddMatOpen(true);}}
                          style={{ width:32, height:32, borderRadius:9, background:T.bgDeep, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.textSub, cursor:'pointer', flexShrink:0 }}>
                          <Edit2 size={14}/>
                        </button>
                      </div>

                      {/* Big quantity */}
                      <div style={{ background:T.bgDeep, borderRadius:14, padding:'12px 16px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <p style={{ margin:0, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.textMuted }}>Quantity Remaining</p>
                          <p style={{ margin:0, fontSize:32, fontWeight:900, color:barC, letterSpacing:'-0.05em', lineHeight:1 }}>{mat.quantity_remaining} <span style={{ fontSize:14, fontWeight:700, color:T.textMuted }}>{mat.unit}</span></p>
                        </div>
                        <BarChart3 size={28} style={{ color:barC, opacity:.25 }}/>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height:5, background:T.bgDeep, borderRadius:99, marginBottom:14, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.8, ease:'easeOut' }}
                          style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg, ${barC}55, ${barC})` }}/>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>setActionCtx({type:'USAGE',mat})} className="cta"
                          style={{ flex:1, padding:'10px', borderRadius:12, background:T.redBg, border:`1px solid ${T.red}22`, color:T.red, fontSize:12 }}>
                          <TrendingDown size={14}/> Log Usage
                        </button>
                        <button onClick={()=>{setBItems([{id:'1',matId:mat.id,qty:'',price:''}]);setBatchOpen(true);}} className="cta"
                          style={{ flex:1, padding:'10px', borderRadius:12, background:T.amberBg, border:`1px solid ${T.amberRing}`, color:T.amber, fontSize:12, fontWeight:800 }}>
                          <ChevronsDown size={14}/> Restock
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ════════ VENDORS TAB ════════ */}
          {tab==='vendors' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Debt summary banner */}
              {totalDebt > 0 && (
                <motion.div variants={up}
                  style={{ background:`linear-gradient(135deg, rgba(192,57,43,0.08), rgba(192,57,43,0.04))`, border:`1.5px solid rgba(192,57,43,0.20)`, borderRadius:20, padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:50, height:50, borderRadius:16, background:T.redBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Banknote size={24} style={{ color:T.red }}/>
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Outstanding Debt</p>
                    <p style={{ margin:'2px 0 0', fontSize:28, fontWeight:900, color:T.red, letterSpacing:'-0.05em', lineHeight:1 }}>₦{totalDebt.toLocaleString()}</p>
                    <p style={{ margin:'3px 0 0', fontSize:11, color:T.textMuted }}>across {vendors.filter(v=>v.debt_balance>0).length} supplier(s)</p>
                  </div>
                </motion.div>
              )}

              {filteredVendors.map(v=>(
                <motion.div key={v.id} variants={up} className="mat-card"
                  style={{ background:T.bgCard, borderRadius:22, border:`1px solid ${T.border}`, overflow:'hidden', boxShadow:T.shadow }}>
                  {v.debt_balance > 0 && <div style={{ height:3, background:`linear-gradient(90deg, ${T.red}33, ${T.red})`}} />}
                  <div style={{ padding:'18px 18px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center', flex:1, minWidth:0 }}>
                        {/* Avatar / initials */}
                        <div style={{ width:48, height:48, borderRadius:16, background:T.amberBg, border:`1.5px solid ${T.amberRing}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:18, fontWeight:900, color:T.amber }}>{v.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                          <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:T.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</h3>
                          <p style={{ margin:'2px 0 0', fontSize:12, color:T.textMuted, fontWeight:600 }}>{v.phone||'No contact saved'}</p>
                        </div>
                      </div>
                      <button onClick={()=>{setVName(v.name);setVPhone(v.phone);setVEditId(v.id);setAddVenOpen(true);}}
                        style={{ width:32, height:32, borderRadius:9, background:T.bgDeep, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.textSub, cursor:'pointer', flexShrink:0 }}>
                        <Edit2 size={14}/>
                      </button>
                    </div>

                    {/* Debt panel */}
                    <div style={{ background:v.debt_balance>0?T.redBg:T.greenBg, borderRadius:14, padding:'14px 16px', border:`1px solid ${v.debt_balance>0?'rgba(192,57,43,0.18)':'rgba(26,122,74,0.18)'}`, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:v.debt_balance>0?12:0 }}>
                      <div>
                        <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:T.textMuted }}>Balance Owed</p>
                        <p style={{ margin:'2px 0 0', fontSize:24, fontWeight:900, color:v.debt_balance>0?T.red:T.green, letterSpacing:'-0.04em' }}>₦{v.debt_balance.toLocaleString()}</p>
                      </div>
                      {v.debt_balance<=0 && <CheckCircle size={28} style={{ color:T.green, opacity:.7 }}/>}
                      {v.debt_balance>0 && <Sparkles size={22} style={{ color:T.red, opacity:.4 }}/>}
                    </div>

                    {v.debt_balance>0 && (
                      <button onClick={()=>setActionCtx({type:'PAY',ven:v})} className="cta"
                        style={{ width:'100%', padding:'11px', borderRadius:13, background:T.greenBg, border:`1px solid rgba(26,122,74,0.25)`, color:T.green, fontSize:13 }}>
                        <CheckCircle size={16}/> Settle This Debt
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ════════ LOGS TAB ════════ */}
          {tab==='logs' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {logs.length===0 && (
                <div style={{ textAlign:'center', padding:'56px 0', color:T.textMuted }}>
                  <FileText size={36} style={{ margin:'0 auto 12px', opacity:.3 }}/>
                  <p style={{ fontWeight:700 }}>History will appear here</p>
                </div>
              )}
              {logs.map(L=>{
                const ven=vendors.find(v=>v.id===L.supplier_id);
                const conf={
                  RESTOCK:{color:'#4F46E5',bg:'rgba(79,70,229,0.09)',label:'Receipt',icon:<Receipt size={14}/>},
                  USAGE:{color:T.amber,bg:T.amberBg,label:'Usage',icon:<TrendingDown size={14}/>},
                  PAYMENT:{color:T.green,bg:T.greenBg,label:'Payment',icon:<CheckCircle size={14}/>},
                }[L.type];
                return (
                  <motion.div key={L.id} variants={up}
                    style={{ background:T.bgCard, borderRadius:16, border:`1px solid ${T.border}`, padding:'14px 16px', display:'flex', gap:14, alignItems:'flex-start', boxShadow:T.shadow }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:conf.bg, color:conf.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {conf.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:800, color:conf.color, textTransform:'uppercase', letterSpacing:'.06em' }}>{conf.label}</span>
                        <span style={{ fontSize:11, color:T.textMuted, fontWeight:600 }}>{new Date(L.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <p style={{ margin:'2px 0', fontSize:13, fontWeight:700, color:T.text, lineHeight:1.4 }}>
                        {L.type==='RESTOCK' && (L.items?.map((i:any)=>`${i.quantity}x ${i.name}`).join(', ')||'Items received')}
                        {L.type==='USAGE' && `${L.quantity} units consumed`}
                        {L.type==='PAYMENT' && `Paid ${ven?.name||'vendor'}`}
                      </p>
                      {L.type==='RESTOCK' && (
                        <p style={{ margin:0, fontSize:11, color:T.textMuted, fontWeight:600 }}>
                          Total ₦{(L.cost_total||0).toLocaleString()} · Cash ₦{(L.cash_paid||0).toLocaleString()} · Transfer ₦{(L.transfer_paid||0).toLocaleString()}{ven?` · ${ven.name}`:''}
                        </p>
                      )}
                      {L.type==='PAYMENT' && <p style={{ margin:0, fontSize:13, fontWeight:900, color:T.green }}>₦{(L.amount_paid||0).toLocaleString()}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </div>
      </div>

      {/* ════════ ADD MATERIAL ════════ */}
      <BottomSheet open={addMatOpen} onClose={resetAll} title={mEditId?'Edit Material':'New Material'} subtitle="Track a raw ingredient or input">
        <form onSubmit={saveMat} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div><FieldLabel req>Material Name</FieldLabel><input value={mName} onChange={e=>setMName(e.target.value)} required placeholder="e.g. Wheat Flour" className="lInp" style={baseInp}/></div>
          <div><FieldLabel>Unit of Measure</FieldLabel>
            <select value={mUnit} onChange={e=>setMUnit(e.target.value)} className="lInp" style={baseInp}>
              <option>Bags</option><option>Kg</option><option>Litres</option><option>Pieces</option><option>Cartons</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={resetAll} style={{ flex:1, padding:13, borderRadius:13, background:T.bgDeep, border:`1px solid ${T.border}`, color:T.textSub, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" className="cta" style={{ flex:1, padding:13, borderRadius:13, background:T.amberGrad, color:'#FFF', fontWeight:900 }}>Save Material</button>
          </div>
        </form>
      </BottomSheet>

      {/* ════════ ADD VENDOR ════════ */}
      <BottomSheet open={addVenOpen} onClose={resetAll} title={vEditId?'Edit Supplier':'New Supplier'} subtitle="Register a supply company">
        <form onSubmit={saveVen} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div><FieldLabel req>Company / Name</FieldLabel><input value={vName} onChange={e=>setVName(e.target.value)} required placeholder="e.g. Dangote Mills" className="lInp" style={baseInp}/></div>
          <div><FieldLabel>Phone Number</FieldLabel><input value={vPhone} onChange={e=>setVPhone(e.target.value)} placeholder="080…" className="lInp" style={baseInp}/></div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={resetAll} style={{ flex:1, padding:13, borderRadius:13, background:T.bgDeep, border:`1px solid ${T.border}`, color:T.textSub, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" className="cta" style={{ flex:1, padding:13, borderRadius:13, background:`linear-gradient(135deg,${T.green},#2A9D5C)`, color:'#FFF', fontWeight:900 }}>Save Supplier</button>
          </div>
        </form>
      </BottomSheet>

      {/* ════════ USAGE / PAY ════════ */}
      <BottomSheet
        open={!!actionCtx} onClose={resetAll}
        title={actionCtx?.type==='USAGE'?'Log Usage':'Settle Debt'}
        subtitle={actionCtx?.type==='USAGE'?`Deduct from ${actionCtx.mat?.name}`:`Outstanding: ₦${actionCtx?.ven?.debt_balance.toLocaleString()}`}>
        <form onSubmit={executeAction} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {actionCtx?.type==='USAGE' && <div><FieldLabel req>Qty Used ({actionCtx.mat?.unit})</FieldLabel><input type="number" step="any" required value={aQty} onChange={e=>setAQty(e.target.value)} placeholder="0" className="lInp" style={baseInp}/></div>}
          {actionCtx?.type==='PAY' && <div><FieldLabel req>Payment Amount ₦</FieldLabel><input type="number" required value={aPaid} onChange={e=>setAPaid(e.target.value)} placeholder={actionCtx.ven?.debt_balance.toString()} className="lInp" style={baseInp}/></div>}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={resetAll} style={{ flex:1, padding:13, borderRadius:13, background:T.bgDeep, border:`1px solid ${T.border}`, color:T.textSub, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" className="cta" style={{ flex:1, padding:13, borderRadius:13, background:actionCtx?.type==='PAY'?`linear-gradient(135deg,${T.green},#2A9D5C)`:T.amberGrad, color:'#FFF', fontWeight:900 }}>
              {actionCtx?.type==='PAY'?'Confirm Payment':'Deduct Stock'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ════════ BATCH RECEIPT ════════ */}
      <BottomSheet open={batchOpen} onClose={resetAll} title="Create Receipt" subtitle="Receive stock & log financials in one go">
        <form onSubmit={saveBatch} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div><FieldLabel req>Supplier / Company</FieldLabel>
            <select required value={bVenId} onChange={e=>setBVenId(e.target.value)} className="lInp" style={baseInp}>
              <option value="">— Select Vendor —</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {/* Items list */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <FieldLabel>Items Received</FieldLabel>
              <button type="button" onClick={addRow} className="cta" style={{ padding:'6px 12px', borderRadius:9, background:T.bgDeep, border:`1px solid ${T.border}`, color:T.textSub, fontSize:11 }}><Plus size={12}/> Row</button>
            </div>
            {bItems.map(item=>{
              const rowTotal=(parseFloat(item.qty)||0)*(parseFloat(item.price)||0);
              return (
                <div key={item.id} style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10, background:T.bgDeep, borderRadius:14, padding:'12px 14px', border:`1px solid ${T.border}` }}>
                  <select required value={item.matId} onChange={e=>updateRow(item.id,'matId',e.target.value)} className="lInp" style={{ ...baseInp, padding:'9px 13px', fontSize:13 }}>
                    <option value="">Material…</option>
                    {mats.map(m=><option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="number" step="any" required placeholder="Qty" value={item.qty} onChange={e=>updateRow(item.id,'qty',e.target.value)} className="lInp" style={{ ...baseInp, padding:'9px 13px', fontSize:13, flex:1 }}/>
                    <input type="number" step="any" required placeholder="Unit Price ₦" value={item.price} onChange={e=>updateRow(item.id,'price',e.target.value)} className="lInp" style={{ ...baseInp, padding:'9px 13px', fontSize:13, flex:1 }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    {rowTotal>0 && <span style={{ fontSize:12, fontWeight:800, color:T.amber }}>Sub: ₦{rowTotal.toLocaleString()}</span>}
                    <button type="button" disabled={bItems.length<=1} onClick={()=>removeRow(item.id)}
                      style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:bItems.length<=1?T.textMuted:T.red, cursor:bItems.length<=1?'not-allowed':'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', padding:0, marginLeft:'auto' }}>
                      <Trash2 size={13}/> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial breakdown */}
          {(()=>{
            const calcCost=bItems.reduce((a,it)=>a+(parseFloat(it.qty)||0)*(parseFloat(it.price)||0),0);
            const actualCost=parseFloat(bCost)||calcCost;
            const cash=parseFloat(bCash)||0; const transfer=parseFloat(bTransfer)||0;
            const debt=actualCost-cash-transfer;
            return (
              <div style={{ background:T.bgDeep, borderRadius:18, border:`1px solid ${T.border}`, padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
                <div><FieldLabel>Total Bill ₦ {calcCost>0?`(Auto: ₦${calcCost.toLocaleString()})`:''}</FieldLabel>
                  <input type="number" value={bCost} onChange={e=>setBCost(e.target.value)} placeholder={calcCost?calcCost.toString():'0'} className="lInp" style={baseInp}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><FieldLabel>Cash ₦</FieldLabel><input type="number" value={bCash} onChange={e=>setBCash(e.target.value)} placeholder="0" className="lInp" style={{ ...baseInp, padding:'9px 13px', fontSize:13 }}/></div>
                  <div><FieldLabel>Transfer ₦</FieldLabel><input type="number" value={bTransfer} onChange={e=>setBTransfer(e.target.value)} placeholder="0" className="lInp" style={{ ...baseInp, padding:'9px 13px', fontSize:13 }}/></div>
                </div>
                {actualCost>0 && (
                  <div style={{ background:debt>0?T.redBg:T.greenBg, border:`1px solid ${debt>0?'rgba(192,57,43,0.22)':'rgba(26,122,74,0.22)'}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                    {debt>0?<AlertTriangle size={16} color={T.red}/>:<CheckCircle size={16} color={T.green}/>}
                    <p style={{ margin:0, fontSize:13, fontWeight:800, color:debt>0?T.red:T.green }}>
                      {debt>0?`Debt: ₦${debt.toLocaleString()} → Added to supplier`:'Fully Paid — No Debt'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={resetAll} style={{ flex:1, padding:13, borderRadius:13, background:T.bgDeep, border:`1px solid ${T.border}`, color:T.textSub, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" className="cta" style={{ flex:1, padding:13, borderRadius:13, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'#FFF', fontWeight:900 }}>
              <Receipt size={16}/> Confirm Receipt
            </button>
          </div>
        </form>
      </BottomSheet>

    </AnimatedPage>
  );
};

export default RawMaterialsManager;
