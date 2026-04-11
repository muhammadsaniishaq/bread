import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Lock, Camera,
  Award, ShieldCheck, History, TrendingUp, Zap, 
  Star, CreditCard, Activity, Filter,
  MoreHorizontal, Download,
  CheckCircle2, Globe, BarChart3, Target, AlertTriangle, PhoneCall, MessageSquare, Mail,
  Bot, Clock, Truck, CheckCircle, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─────────────────────────────────────────
   DESIGN SYSTEM V5 — Premium Light Palette
───────────────────────────────────────── */
const T = {
  bg:           '#f8f7ff',
  bg2:          '#f0eeff',
  white:        'rgba(255,255,255,0.9)', // Glassmorphism base
  solidWhite:   '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  accent:       '#06b6d4',
  accentLight:  'rgba(6,182,212,0.10)',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  danger:       '#e11d48',
  dangerLight:  'rgba(225,29,72,0.10)',
  gold:         '#d97706',
  goldLight:    'rgba(217,119,6,0.10)',
  silver:       '#64748b',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radius:       '24px',
  radiusSm:     '16px',
  shadow:       '0 8px 32px rgba(99,91,255,0.06)',
  shadowMd:     '0 12px 48px rgba(99,91,255,0.12)',
};

const getRank = (debt: number, points: number) => {
  if (points > 1000) return { label: 'DIAMOND', color: T.accent, bg: T.accentLight, icon: Flame };
  if (debt === 0) return { label: 'GOLD', color: T.gold, bg: T.goldLight, icon: Star };
  if (debt < 50000) return { label: 'SILVER', color: T.silver, bg: 'rgba(100,116,139,0.10)', icon: CheckCircle2 };
  return { label: 'BASIC', color: T.txt2, bg: T.bg2, icon: Clock };
};

const getAvatar = (name: string) => {
  const palette = [[T.primary, T.primaryLight], [T.accent, T.accentLight], [T.success, T.successLight], [T.gold, T.goldLight]];
  return palette[name.charCodeAt(0) % palette.length];
};

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment, appSettings, refreshData } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch]       = useState('');
  const [isAdding, setIsAdding]   = useState(false);
  const [suppliers, setSuppliers] = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]     = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{name:string; login:string; password:string}|null>(null);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  /* Form States */
  const [fName, setFName]         = useState('');
  const [fPhone, setFPhone]       = useState('');
  const [fEmail, setFEmail]       = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fSup, setFSup]           = useState('');
  const [fPin, setFPin]           = useState('');

  /* Drawer State */
  const [drawerId, setDrawerId] = useState<string|null>(null);
  const drawer = useMemo(() => customers.find(c => c.id === drawerId), [customers, drawerId]);
  const [dTab, setDTab]         = useState<'summary'|'analytics'|'logistics'|'vault'|'identity'|'compliance'|'config'>('summary');
  
  /* Edit States */
  const [eName, setEName]         = useState('');
  const [ePhone, setEPhone]       = useState('');
  const [eEmail, setEEmail]       = useState('');
  const [eUsername, setEUsername] = useState('');
  const [ePassword, setEPassword] = useState('');
  const [eLocation, setELocation] = useState('');
  const [eImage, setEImage]       = useState('');
  const [eSup, setESup]           = useState('');
  const [ePin, setEPin]           = useState('');
  const [eNote, setENote]         = useState('');
  const [eCreditLimit, setECreditLimit] = useState('');
  const [eSalesTarget, setESalesTarget] = useState('');

  const [payAmt, setPayAmt]       = useState('');
  const [payMethod, setPayMethod] = useState<'Cash'|'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER')
      .then(({data}) => { if (data) setSuppliers(data); });
  }, []);

  useEffect(() => {
    if (drawer) {
      setEName(drawer.name); setEPhone(drawer.phone); setEEmail(drawer.email || '');
      setEUsername(drawer.username || ''); setEPassword(drawer.password || '');
      setELocation(drawer.location || ''); setEImage(drawer.image || '');
      setESup(drawer.assignedSupplierId || ''); setEPin(drawer.pin || ''); 
      
      try {
         const parsed = JSON.parse(drawer.notes || '{}');
         setECreditLimit(parsed.creditLimit ? String(parsed.creditLimit) : '');
         setESalesTarget(parsed.salesTarget ? String(parsed.salesTarget) : '');
         setENote(parsed.memo || '');
      } catch (err) {
         setECreditLimit('');
         setESalesTarget('');
         setENote(drawer.notes || '');
      }
    }
  }, [drawer]);

  const list = useMemo(() => {
    let r = customers.filter(c => {
      const q = search.toLowerCase();
      return (c.name.toLowerCase().includes(q) || (c.phone||'').includes(search) || (c.username||'').toLowerCase().includes(q));
    });
    return [...r].sort((a, b) => b.name.localeCompare(a.name));
  }, [customers, search]);

  const customerItems = useMemo(() => {
    if (!drawerId) return [];
    return transactions.filter(t => t.customerId === drawerId || t.sellerId === drawerId);
  }, [transactions, drawerId]);

  const chartData = useMemo(() => {
     if (!customerItems.length) return [];
     const groups: Record<string, number> = {};
     customerItems.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(tx => {
        const d = new Date(tx.date).toLocaleDateString([], {month:'short', day:'numeric'});
        groups[d] = (groups[d] || 0) + tx.totalPrice;
     });
     return Object.keys(groups).map(k => ({ date: k, amount: groups[k] }));
  }, [customerItems]);

  const stats = useMemo(() => ({
    total: customers.reduce((s,c) => s+(c.debtBalance||0), 0),
    count: customers.length,
    active: customers.filter(c => transactions.some(t => t.customerId === c.id)).length
  }), [customers, transactions]);

  const drawerMeta = useMemo(() => {
     try { return drawer?.notes ? JSON.parse(drawer.notes) : {}; }
     catch { return {}; }
  }, [drawer]);

  const creditRatio = useMemo(() => {
     if (!drawer || !drawerMeta.creditLimit) return 0;
     return Math.min(100, Math.round((drawer.debtBalance / drawerMeta.creditLimit) * 100));
  }, [drawer, drawerMeta]);

  const salesProgress = useMemo(() => {
      if (!drawer || !drawerMeta.salesTarget) return 0;
      const totalSpent = customerItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      return Math.min(100, Math.round((totalSpent / drawerMeta.salesTarget) * 100));
  }, [customerItems, drawerMeta]);

  /* 🧠 AI Insight Generator Engine */
  const aiInsight = useMemo(() => {
      if (!drawer) return null;
      if (creditRatio >= 80) return { msg: `High Risk! Partner is at ${creditRatio}% of their credit limit. Delay new long-term shipments until settlement.`, color: T.danger, light: T.dangerLight };
      if (salesProgress >= 80) return { msg: `Great momentum detected! Partner is closing in on their target. Suggest offering a bulk-discount to push them over the finish line.`, color: T.accent, light: T.accentLight };
      if (customerItems.length > 5 && drawer.debtBalance === 0) return { msg: `A+ Performer. This partner pays consistently. Consider promoting them to the Diamond Loyalty bracket to lock in retention.`, color: T.success, light: T.successLight };
      return { msg: `Partner activity is stable. Routine check-ins advised to maintain strong relationship ties.`, color: T.primary, light: T.primaryLight };
  }, [drawer, creditRatio, salesProgress, customerItems]);

  /* ───── Actions ───── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCropImageSrc(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (base64: string) => {
    setEImage(base64); setShowCropper(false);
    if (drawer) {
      await supabase.from('customers').update({ image: base64 }).eq('id', drawer.id);
      await updateCustomer({ ...drawer, image: base64 } as any);
      await refreshData();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setLoading(true);
    try {
      const newId = crypto.randomUUID();
      if (fEmail && fPassword) {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: sData, error: sErr } = await supabase.auth.signUp({
          email: fEmail.trim().toLowerCase(), password: fPassword,
          options: { data: { role:'CUSTOMER', full_name:fName } }
        });
        if (sErr) throw sErr;
        if (session) await supabase.auth.setSession(session);
        const uid = sData.user?.id || newId;
        await supabase.from('profiles').upsert({ id:uid, full_name:fName, role:'CUSTOMER' });
        await addCustomer({ id:uid, profile_id:uid, name:fName, email:fEmail, phone:fPhone, username:fUsername||fEmail.split('@')[0], location:fLocation, debtBalance:0, loyaltyPoints:0, assignedSupplierId:fSup||undefined, pin:fPin||undefined, notes:'' });
        setCreatedCreds({ name:fName, login:fEmail, password:fPassword });
      } else {
        await addCustomer({ id:newId, name:fName, phone:fPhone, email:fEmail, username:fUsername, debtBalance:0, loyaltyPoints:0, location:fLocation, notes:'', assignedSupplierId:fSup||undefined, pin:fPin||undefined });
        setCreatedCreds({ name:fName, login:fUsername||fPhone||'---', password:fPassword||'(no password)' });
      }
      setIsAdding(false); setFName(''); setFPhone(''); setFEmail(''); setFUsername(''); setFPassword(''); setFLocation(''); setFSup(''); setFPin('');
      await refreshData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!eName || !drawer) return;
    setLoading(true);
    try {
      const compiledNotes = JSON.stringify({
         creditLimit: Number(eCreditLimit) || 0,
         salesTarget: Number(eSalesTarget) || 0,
         memo: eNote
      });

      await updateCustomer({ ...drawer, name:eName, phone:ePhone, email:eEmail, username:eUsername, password:ePassword, location:eLocation, image:eImage, assignedSupplierId:eSup||undefined, pin:ePin||undefined, notes:compiledNotes } as any);
      await refreshData();
      alert('Partner Configuration Synced Successfully ✓');
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const payDebt = async (e: React.FormEvent) => {
    e.preventDefault(); const amt = Number(payAmt); if (!amt || !drawerId) return;
    setLoading(true);
    try {
      await recordDebtPayment({ id:crypto.randomUUID(), date:new Date().toISOString(), customerId:drawerId, amount:amt, method:payMethod });
      setPayAmt(''); await refreshData();
    } finally { setLoading(false); }
  };

  const sx = {
    input: { background:T.solidWhite, border:`1px solid ${T.borderLight}`, borderRadius:T.radiusSm, padding:'12px 14px', fontSize:'13px', width:'100%', outline:'none', fontWeight:500, color:T.ink, boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)' } as React.CSSProperties,
    btn: { background:T.primary, color:T.solidWhite, border:'none', borderRadius:T.radiusSm, padding:'12px 20px', fontSize:'13px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:T.shadow } as React.CSSProperties,
    tab: (active: boolean) => ({ padding:'10px', borderRadius:T.radiusSm, background:active ? T.solidWhite : 'transparent', color:active ? T.primary : T.txt3, border:active ? `1px solid ${T.borderLight}`: 'none', fontSize:10, fontWeight:900, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, transition:'all 0.2s', boxShadow:active ? T.shadow : 'none' }) as any,
    glassPanel: { background: T.white, backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.4)` } as React.CSSProperties,
  };

  return (
    <AnimatedPage>
      <div style={{ background:T.bg, minHeight:'100vh', paddingBottom:'100px', color:T.txt, fontFamily:"'Inter', -apple-system, sans-serif" }}>
        
        {/* COMPACT TOP BAR - Floating Glass Palette */}
        <div style={{ ...sx.glassPanel, padding: '40px 20px 20px', position: 'sticky', top:0, zIndex:50, boxShadow:'0 4px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
             <button onClick={() => navigate(-1)} style={{ width:38, height:38, borderRadius:12, border:`1px solid ${T.borderLight}`, background:T.solidWhite, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
              <ArrowLeft size={16} color={T.ink} />
            </button>
            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink, letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:6 }}>
                 Partner Network <div style={{background:T.successLight, padding:'2px 6px', borderRadius:6, fontSize:9, color:T.success, letterSpacing:'0.05em'}}>ENTERPRISE</div>
              </h1>
              <p style={{ margin:'2px 0 0', fontSize:10, color:T.txt3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{stats.count} Active Members</p>
            </div>
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => setIsAdding(true)} style={{...sx.btn, padding:'8px 14px', fontSize:11, borderRadius:12}}><UserPlus size={14}/> New</motion.button>
          </div>

          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:10 }} className="hide-scrollbar">
             {[
               { label:'Liability', val:stats.total, color:T.danger, light:T.dangerLight, icon:TrendingUp },
               { label:'Retention', val:Math.round((stats.active/stats.count)*100)||0, color:T.primary, light:T.primaryLight, icon:Flame, unit:'%' },
               { label:'Points', val:customers.reduce((s,c)=>s+(c.loyaltyPoints||0), 0), color:T.success, light:T.successLight, icon:Award }
             ].map((s,i) => (
                <div key={i} style={{ flexShrink:0, background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:'10px 14px', borderRadius:14, display:'flex', alignItems:'center', gap:10, minWidth:120, boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
                   <div style={{ background:s.light, color:s.color, padding:6, borderRadius:8 }}><s.icon size={12}/></div>
                   <div>
                      <p style={{ margin:0, fontSize:8, fontWeight:800, color:T.txt3, textTransform:'uppercase' }}>{s.label}</p>
                      <p style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink }}>{s.unit==='%' ? s.val+'%' : '₦'+s.val.toLocaleString()}</p>
                   </div>
                </div>
             ))}
          </div>

          <div style={{ position:'relative', marginTop:6 }}>
            <Search size={14} color={T.txt3} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
            <input style={{ ...sx.input, paddingLeft:38, height:42, fontSize:13, borderRadius:14, border:`1px solid ${T.borderLight}`, background:T.solidWhite }} placeholder="Search enterprise directory..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', display:'flex', gap:10 }}>
               <Filter size={14} color={T.primary}/>
            </div>
          </div>
        </div>

        {/* ENTERPRISE BENTO GRID */}
        <div style={{ padding:'16px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12 }}>
           {list.map(c => {
             const [ac, lc] = getAvatar(c.name);
             const rank = getRank(c.debtBalance, c.loyaltyPoints || 0);
             
             let creditWarining = false;
             let streak = c.debtBalance === 0 && (transactions.filter(t=>t.customerId===c.id).length > 2);

             try {
                const cm = c.notes ? JSON.parse(c.notes) : {};
                if (cm.creditLimit && c.debtBalance >= cm.creditLimit * 0.8) creditWarining = true;
             } catch(e) {}

             return (
               <motion.div key={c.id} layoutId={c.id} onClick={() => setDrawerId(c.id)} whileHover={{ y:-4, scale:1.02 }} whileTap={{ scale:0.96 }} style={{ ...sx.glassPanel, border:`1px solid ${creditWarining ? T.dangerLight : T.borderLight}`, borderRadius:T.radiusSm, padding:14, cursor:'pointer', position:'relative', overflow:'hidden', boxShadow:T.shadow }}>
                 {creditWarining && <div style={{ position:'absolute', top:0, right:0, background:T.dangerLight, color:T.danger, padding:'2px 6px', borderBottomLeftRadius:8, fontSize:7, fontWeight:900, display:'flex', alignItems:'center' }}><AlertTriangle size={7} style={{marginRight:3}}/>RISK</div>}
                 {streak && !creditWarining && <div style={{ position:'absolute', top:0, right:0, background:T.goldLight, color:T.gold, padding:'2px 6px', borderBottomLeftRadius:8, fontSize:7, fontWeight:900, display:'flex', alignItems:'center' }}><Flame size={7} style={{marginRight:3}}/>HOT STREAK</div>}
                 
                 <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginBottom:12 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900 }}>
                       {c.image ? <img src={c.image} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:10}} /> : c.name[0]}
                    </div>
                    <div style={{ background:rank.bg, color:rank.color, fontSize:8, fontWeight:900, padding:'2px 6px', borderRadius:6, height:'fit-content', display:'flex', alignItems:'center', gap:3 }}><rank.icon size={8}/>{rank.label}</div>
                 </div>
                 <h3 style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</h3>
                 <p style={{ margin:'2px 0 10px', fontSize:10, color:T.txt3, fontWeight:600 }}>{c.phone || '@'+c.username}</p>
                 
                 <div style={{ width:'100%', paddingTop:10, borderTop:`1px solid ${T.borderLight}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:13, fontWeight:900, color:c.debtBalance > 0 ? T.danger : T.success }}>₦{(c.debtBalance||0).toLocaleString()}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:3, color:T.txt3, fontSize:9, fontWeight:700 }}>
                       <Award size={9} color={T.gold}/> {c.loyaltyPoints || 0}
                    </div>
                 </div>
               </motion.div>
             );
           })}
        </div>

        {/* ULTIMATE ENTERPRISE DRAWER (GLASSMORPHIC) */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawerId(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(4px)', zIndex:100 }}/>
               <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:32, stiffness:320}} style={{ position:'fixed', bottom:0, left:0, right:0, height:'90vh', background:T.bg2, zIndex:110, borderTopLeftRadius:T.radius, borderTopRightRadius:T.radius, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:T.shadowMd, borderTop:`1px solid rgba(255,255,255,0.4)` }}>
                  
                  {/* Handle */}
                  <div style={{ height:4, width:36, background:T.borderLight, borderRadius:2, margin:'12px auto' }}/>

                  {/* Header & Quick Connect Hub */}
                  <div style={{ padding:'0 20px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
                     <div style={{ position: 'relative' }}>
                        <div style={{ width:60, height:60, borderRadius:16, background:getAvatar(drawer.name)[1], color:getAvatar(drawer.name)[0], display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, overflow:'hidden', border:`2px solid ${T.solidWhite}`, boxShadow:T.shadow }}>
                           {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : drawer.name[0]}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:-4, right:-4, background:T.primary, color:T.solidWhite, border:`2px solid ${T.solidWhite}`, borderRadius:8, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadow, cursor:'pointer' }}>
                           <Camera size={12}/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                     </div>
                     <div style={{ flex:1, alignSelf:'center' }}>
                        <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:T.ink, letterSpacing:'-0.02em', lineHeight:1.1, display:'flex', gap:6, alignItems:'center' }}>
                           {drawer.name}
                           {drawer.debtBalance === 0 && customerItems.length > 2 && <Flame size={14} color={T.accent} />}
                        </h2>
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                           <a href={`tel:${drawer.phone}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', background:T.solidWhite, border:`1px solid ${T.borderLight}`, borderRadius:8, padding:'4px 8px', color:T.primary, flex:1, fontWeight:800, fontSize:9, boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}><PhoneCall size={10} style={{marginRight:4}}/> Call</a>
                           <a href={`https://wa.me/${drawer.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', background:T.successLight, border:`1px solid rgba(5,150,105,0.1)`, borderRadius:8, padding:'4px 8px', color:T.success, flex:1, fontWeight:800, fontSize:9 }}><MessageSquare size={10} style={{marginRight:4}}/> Chat</a>
                           {drawer.email && <a href={`mailto:${drawer.email}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', background:T.solidWhite, border:`1px solid ${T.borderLight}`, borderRadius:8, padding:'4px 8px', color:T.txt2, flex:1, fontWeight:800, fontSize:9 }}><Mail size={10} style={{marginRight:4}}/> Mail</a>}
                        </div>
                     </div>
                     <button onClick={()=>setDrawerId(null)} style={{ border:'none', background:T.solidWhite, width:32, height:32, borderRadius:10, cursor:'pointer', alignSelf:'center', color:T.ink, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}><X size={16}/></button>
                  </div>

                  {/* MASTER TABS */}
                  <div style={{ display:'flex', padding:4, background:T.solidWhite, border:`1px solid ${T.borderLight}`, margin:'0 20px 20px', borderRadius:16, boxShadow:T.shadow, overflowX:'auto' }} className="hide-scrollbar">
                     {[
                       { id:'summary', icon:Activity, label:'Overview' },
                       { id:'analytics', icon:BarChart3, label:'Insights' },
                       { id:'logistics', icon:Truck, label:'Logistics' },
                       { id:'vault', icon:History, label:'Vault' },
                       { id:'identity', icon:ShieldCheck, label:'Identity' },
                       { id:'compliance', icon:Award, label:'Legal' },
                       { id:'config', icon:MoreHorizontal, label:'Config' },
                     ].map(t => (
                       <motion.button whileTap={{scale:0.95}} key={t.id} onClick={()=>setDTab(t.id as any)} style={{...sx.tab(dTab===t.id), minWidth:60}}>
                          <t.icon size={dTab===t.id ? 14 : 12}/> <span style={{fontSize:8}}>{t.label}</span>
                       </motion.button>
                     ))}
                  </div>

                  {/* TAB CONTENT */}
                  <div style={{ flex:1, overflowY:'auto', padding:'0 20px 40px' }} className="hide-scrollbar">
                     
                     {/* 1. SUMMARY DASHBOARD WITH GOALS, AI & LIMITS */}
                     {dTab === 'summary' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           
                           {/* AI Insights Panel */}
                           {aiInsight && (
                              <div style={{ background:aiInsight.light, border:`1px solid ${aiInsight.color}30`, borderRadius:20, padding:16, display:'flex', gap:12, boxShadow:T.shadow }}>
                                 <div style={{ background:T.solidWhite, color:aiInsight.color, width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
                                    <Bot size={16}/>
                                 </div>
                                 <div style={{ alignSelf:'center' }}>
                                    <h4 style={{ margin:'0 0 4px', fontSize:10, fontWeight:900, color:aiInsight.color }}>Smart AI Insight</h4>
                                    <p style={{ margin:0, fontSize:10, color:T.ink, lineHeight:1.4, fontWeight:600 }}>{aiInsight.msg}</p>
                                 </div>
                              </div>
                           )}

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                              <div style={{ background: drawer.debtBalance > 0 ? (creditRatio >= 80 ? T.danger : T.gold) : T.success, padding:20, borderRadius:20, color:T.solidWhite, position:'relative', overflow:'hidden', boxShadow:T.shadow }}>
                                 <CreditCard size={60} style={{ position:'absolute', right:-10, bottom:-10, opacity:0.1, transform:'rotate(-15deg)' }}/>
                                 <p style={{ margin:0, fontSize:8, fontWeight:900, opacity:0.9, textTransform:'uppercase', letterSpacing:'0.1em' }}>Current Liability</p>
                                 <h1 style={{ margin:'6px 0', fontSize:22, fontWeight:900 }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                                 {drawerMeta.creditLimit && (
                                    <div style={{ marginTop:8, background:'rgba(0,0,0,0.1)', padding:'6px', borderRadius:8 }}>
                                       <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, fontWeight:800, marginBottom:4 }}>
                                          <span>Limit Usage</span><span>{creditRatio}%</span>
                                       </div>
                                       <div style={{ height:4, background:'rgba(255,255,255,0.3)', borderRadius:2, overflow:'hidden' }}>
                                          <motion.div initial={{width:0}} animate={{width:`${creditRatio}%`}} transition={{duration:1}} style={{ height:'100%', background:T.solidWhite, borderRadius:2 }}/>
                                       </div>
                                    </div>
                                 )}
                              </div>
                              <div style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:16, borderRadius:20, textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center', boxShadow:T.shadow }}>
                                 <p style={{ margin:'0 0 10px', fontSize:8, fontWeight:900, color:T.txt3 }}>MONTHLY TARGET</p>
                                 <div style={{ position:'relative', width:60, height:60, margin:'0 auto' }}>
                                    <svg viewBox="0 0 36 36" style={{ width:'100%', height:'100%' }}>
                                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={T.bg2} strokeWidth="3" />
                                       <motion.path initial={{strokeDasharray:"0, 100"}} animate={{strokeDasharray:`${salesProgress}, 100`}} transition={{duration:1.5, ease:"easeOut"}} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={salesProgress >= 100 ? T.success : T.primary} strokeWidth="3" />
                                    </svg>
                                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:salesProgress >= 100 ? T.success : T.primary }}>{salesProgress}%</div>
                                 </div>
                                 <h3 style={{ margin:'8px 0 0', fontSize:11, fontWeight:900, color:T.ink }}>{drawerMeta.salesTarget ? `₦${drawerMeta.salesTarget.toLocaleString()}` : 'No Target Set'}</h3>
                              </div>
                           </div>

                           <div style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, borderRadius:20, padding:20, boxShadow:T.shadow }}>
                              <h4 style={{ margin:'0 0 12px', fontSize:12, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:6 }}><TrendingUp size={14} color={T.primary}/> Instant Settlement</h4>
                              <form onSubmit={payDebt} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                 <div style={{ position:'relative' }}>
                                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontWeight:900, fontSize:18, color:T.txt3 }}>₦</span>
                                    <input style={{...sx.input, height:48, paddingLeft:36, fontSize:22, fontWeight:900, background:T.bg2, border:'none'}} type="number" placeholder="0.00" value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                                 </div>
                                 <div style={{ display:'flex', gap:8 }}>
                                    {['Cash', 'Transfer'].map(m => (
                                       <button key={m} type="button" onClick={()=>setPayMethod(m as any)} style={{ flex:1, border:`1px solid ${payMethod===m?T.border:T.borderLight}`, borderRadius:10, padding:'10px 0', fontSize:11, fontWeight:800, background:payMethod===m?T.primaryLight:T.solidWhite, color:payMethod===m?T.primary:T.txt2, transition:'0.2s', cursor:'pointer' }}>{m}</button>
                                    ))}
                                 </div>
                                 <motion.button whileTap={{scale:0.97}} type="submit" disabled={loading} style={{...sx.btn, width:'100%', justifyContent:'center', height:48, fontSize:13}}>{loading ? 'Processing...' : 'Complete Payment ✓'}</motion.button>
                              </form>
                           </div>
                        </motion.div>
                     )}

                     {/* 2. ANALYTICS & INSIGHTS */}
                     {dTab === 'analytics' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, borderRadius:20, padding:20, boxShadow:T.shadow }}>
                              <h4 style={{ margin:'0 0 16px', fontSize:12, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:6 }}><BarChart3 size={14} color={T.primary}/> Purchasing Trend / Heat Matrix</h4>
                              {chartData.length > 0 ? (
                                 <div style={{ width: '100%', height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                       <AreaChart data={chartData} margin={{top:0, right:0, left:-20, bottom:0}}>
                                          <defs>
                                             <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={T.primary} stopOpacity={0.6}/>
                                                <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                                             </linearGradient>
                                          </defs>
                                          <XAxis dataKey="date" fontSize={9} axisLine={false} tickLine={false} tick={{fill:T.txt3}} />
                                          <YAxis fontSize={9} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v/1000}k`} tick={{fill:T.txt3}} />
                                          <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.borderLight}`, fontWeight:900, fontSize:10 }} />
                                          <Area type="monotone" dataKey="amount" stroke={T.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" animationDuration={1500} />
                                       </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                              ) : (
                                 <div style={{ height:150, display:'flex', alignItems:'center', justifyContent:'center', color:T.txt3, fontSize:10, fontWeight:700, background:T.bg2, borderRadius:12 }}>Not Enough Data Available</div>
                              )}
                           </div>
                           
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                              <div style={{ background:T.primaryLight, padding:16, borderRadius:16, border:`1px solid rgba(99,91,255,0.15)` }}>
                                 <p style={{ margin:0, fontSize:9, fontWeight:900, color:T.primary }}>LIFETIME VALUE</p>
                                 <h3 style={{ margin:'4px 0 0', fontSize:16, fontWeight:900, color:T.primary }}>₦{customerItems.reduce((a,c)=>a+c.totalPrice,0).toLocaleString()}</h3>
                              </div>
                              <div style={{ background:T.successLight, padding:16, borderRadius:16, border:`1px solid rgba(5,150,105,0.15)` }}>
                                 <p style={{ margin:0, fontSize:9, fontWeight:900, color:T.success }}>POINTS REDEEMABLE</p>
                                 <h3 style={{ margin:'4px 0 0', fontSize:16, fontWeight:900, color:T.success }}>{drawer.loyaltyPoints || 0} Pts</h3>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* 2.5 LOGISTICS JOURNEY TIMELINE */}
                     {dTab === 'logistics' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:16, background:T.solidWhite, padding:24, borderRadius:20, boxShadow:T.shadow, border:`1px solid ${T.borderLight}` }}>
                           <h4 style={{ margin:'0 0 16px', fontSize:12, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:6 }}><Truck size={14} color={T.primary}/> Supply Route Status</h4>
                           
                           <div style={{ position:'relative', paddingLeft:20, borderLeft:`2px dashed ${T.primaryLight}`, marginLeft:10 }}>
                              <div style={{ position:'relative', marginBottom:24 }}>
                                 <div style={{ position:'absolute', left:-28, top:0, background:T.successLight, color:T.success, width:16, height:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${T.solidWhite}` }}><CheckCircle size={10}/></div>
                                 <h5 style={{ margin:0, fontSize:11, fontWeight:900, color:T.ink }}>Assigned Route</h5>
                                 <p style={{ margin:'2px 0 0', fontSize:10, color:T.txt3, fontWeight:600 }}>{suppliers.find(s=>s.id===drawer.assignedSupplierId)?.full_name || 'Direct HQ Pickup'}</p>
                              </div>
                              
                              <div style={{ position:'relative', marginBottom:24 }}>
                                 <div style={{ position:'absolute', left:-28, top:0, background:T.primary, color:T.solidWhite, width:16, height:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${T.solidWhite}`, boxShadow:`0 0 0 3px ${T.primaryLight}` }}><Truck size={8}/></div>
                                 <h5 style={{ margin:0, fontSize:11, fontWeight:900, color:T.primary }}>In Good Standing</h5>
                                 <p style={{ margin:'2px 0 0', fontSize:10, color:T.txt3, fontWeight:600 }}>Ready for next dispatch window.</p>
                              </div>

                              <div style={{ position:'relative' }}>
                                 <div style={{ position:'absolute', left:-28, top:0, background:T.borderLight, color:T.txt3, width:16, height:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${T.solidWhite}` }}><Clock size={10}/></div>
                                 <h5 style={{ margin:0, fontSize:11, fontWeight:900, color:T.txt3 }}>Settlement Due</h5>
                                 <p style={{ margin:'2px 0 0', fontSize:10, color:T.txt3, fontWeight:600 }}>Pending future deliveries.</p>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* 3. TRANSACTION VAULT */}
                     {dTab === 'vault' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                              <h3 style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink }}>Statement Vault</h3>
                              <button style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:'6px 12px', borderRadius:8, fontSize:9, fontWeight:900, color:T.ink, boxShadow:T.shadow, cursor:'pointer' }}>Export Ledger</button>
                           </div>
                           {customerItems.length > 0 ? customerItems.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                              <div key={tx.id} onClick={()=>navigate(`/receipt/${tx.id}`)} style={{ background:T.solidWhite, padding:12, borderRadius:16, border:`1px solid ${T.borderLight}`, display:'flex', alignItems:'center', gap:12, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
                                 <div style={{ width:36, height:36, borderRadius:10, background:tx.type==='Return' ? T.dangerLight: tx.type==='Debt' ? T.goldLight : T.successLight, color:tx.type==='Return'?T.danger: tx.type==='Debt' ? T.gold : T.success, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    {tx.type==='Return' ? <ArrowLeft size={16}/> : <Zap size={16}/>}
                                 </div>
                                 <div style={{ flex:1 }}>
                                    <p style={{ margin:0, fontSize:12, fontWeight:900, color:T.ink }}>{tx.type} Txn</p>
                                    <p style={{ margin:0, fontSize:9, color:T.txt3, fontWeight:600 }}>{new Date(tx.date).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' })}</p>
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <p style={{ margin:0, fontSize:14, fontWeight:900, color:tx.type==='Return'?T.danger:T.ink }}>₦{tx.totalPrice.toLocaleString()}</p>
                                    <p style={{ margin:0, fontSize:8, fontWeight:800, color:T.txt3 }}>{tx.status || 'COMPLETED'}</p>
                                 </div>
                              </div>
                           )) : (
                              <div style={{ textAlign:'center', padding:'40px 20px', background:T.solidWhite, borderRadius:16, border:`1px dashed ${T.borderLight}` }}>
                                 <History size={32} color={T.txt3} style={{marginBottom:10, opacity:0.3}}/>
                                 <p style={{margin:0, fontSize:12, fontWeight:800, color:T.txt3}}>No Activity Found</p>
                                 <p style={{margin:0, fontSize:9, color:T.txt3, opacity:0.6}}>Transactions will appear once recorded</p>
                              </div>
                           )}
                        </motion.div>
                     )}

                     {/* 4. DIGITAL IDENTITY */}
                     {dTab === 'identity' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #4f46e5 100%)`, color:T.solidWhite, padding:24, borderRadius:24, position:'relative', overflow:'hidden', boxShadow:T.shadowMd }}>
                              <div style={{ position:'absolute', top:0, right:0, width:120, height:120, background:T.solidWhite, opacity:0.05, filter:'blur(40px)', borderRadius:'50%' }}/>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                                 <div>
                                    <h4 style={{ margin:0, fontSize:10, fontWeight:900, letterSpacing:'0.2em', opacity:0.8 }}>{appSettings.companyName?.toUpperCase() || 'BAKERY SYSTEM'}</h4>
                                    <p style={{ margin:0, fontSize:8, fontWeight:700, opacity:0.6 }}>SINCE 2024 • GLOBAL PARTNER</p>
                                 </div>
                                 <ShieldCheck size={24} color={T.solidWhite} opacity={0.8}/>
                              </div>
                              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                                 <div style={{ width:60, height:60, borderRadius:16, background:T.solidWhite, overflow:'hidden', border:'3px solid rgba(255,255,255,0.2)' }}>
                                    {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:T.primary, fontWeight:900, fontSize:22}}>{drawer.name[0]}</div>}
                                 </div>
                                 <div>
                                    <h3 style={{ margin:0, fontSize:18, fontWeight:900 }}>{drawer.name}</h3>
                                    <p style={{ margin:0, fontSize:9, fontWeight:800, color:T.accentLight, letterSpacing:'0.1em' }}>AUTHORIZED DISTRIBUTOR</p>
                                 </div>
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:30 }}>
                                 <div>
                                    <p style={{ margin:0, fontSize:8, opacity:0.6, fontWeight:900 }}>DIGITAL SERIAL</p>
                                    <p style={{ margin:0, fontSize:11, fontWeight:900, fontFamily:'monospace' }}>BR-{drawer.id.slice(0,8).toUpperCase()}</p>
                                 </div>
                                 <div style={{ background:T.solidWhite, padding:4, borderRadius:8 }}>
                                    <QRCode value={drawer.id} size={40} />
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', background:T.solidWhite, color:T.ink, border:`1px solid ${T.borderLight}`, justifyContent:'center'}}><Download size={14}/> Download ID Card</button>
                        </motion.div>
                     )}

                     {/* 5. COMPLIANCE (CERTIFICATE) */}
                     {dTab === 'compliance' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ background: T.solidWhite, border: `6px double ${T.borderLight}`, padding: 30, textAlign: 'center', position: 'relative', boxShadow:T.shadow, borderRadius:16 }}>
                              <div style={{ position:'absolute', top:16, right:16 }}><Award size={30} color={T.primary} opacity={0.05}/></div>
                              <Globe size={30} color={T.primary} style={{ marginBottom: 16 }} />
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color:T.ink, letterSpacing:'0.1em' }}>CERTIFICATE OF PARTNERSHIP</h4>
                              <p style={{ fontSize: 9, margin: '10px 0', color:T.txt3, fontStyle:'italic' }}>THIS DOCUMENT HEREBY CERTIFIES THAT</p>
                              <h2 style={{ margin: '8px 0', fontSize: 20, fontWeight: 900, color:T.ink, borderBottom:`2px solid ${T.borderLight}`, display:'inline-block', paddingBottom:4 }}>{drawer.name}</h2>
                              <p style={{ fontSize: 10, margin: '16px auto', maxWidth:'80%', color:T.txt2, lineHeight:1.5 }}>is an accredited distributor and trusted partner of <b>{appSettings.companyName || 'The Bakery System'}</b>, entitled to all benefits and privileges.</p>
                              <div style={{ background:T.bg2, padding:'8px 16px', borderRadius:6, margin:'16px 0', fontSize:9, fontWeight:800, color:T.ink, letterSpacing:'0.1em', display:'inline-block' }}>LICENSE NO: BR-CERT-{drawer.id.slice(0,6).toUpperCase()}</div>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, fontWeight:900, marginTop:24, borderTop:`1px solid ${T.borderLight}`, paddingTop:12, color:T.txt3 }}>
                                 <div style={{ textAlign:'left' }}>
                                    <span style={{opacity:0.6}}>ISSUED DATE:</span><br/>{new Date().toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <span style={{opacity:0.6}}>DIRECTOR:</span><br/>____________________
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', background:T.primary, justifyContent:'center'}}><Download size={14}/> Download Official Certificate</button>
                        </motion.div>
                     )}

                     {/* 6. CONFIG / ADMIN WITH CRM FIELDS */}
                     {dTab === 'config' && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                        <form onSubmit={saveEdit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:T.solidWhite, padding:14, borderRadius:16, border:`1px solid ${T.borderLight}`, boxShadow:T.shadow }}>
                              <div>
                                 <h3 style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink }}>Enterprise Config</h3>
                                 <p style={{ margin:0, fontSize:9, fontWeight:700, color:T.txt3 }}>Modify CRM parameters.</p>
                              </div>
                              <button type="submit" disabled={loading} style={{ background:T.success, color:T.solidWhite, border:'none', borderRadius:8, padding:'8px 12px', fontSize:10, fontWeight:900, cursor:'pointer', boxShadow:T.shadow }}>{loading ? 'Saving...' : 'Sync Master ✓'}</button>
                           </div>

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>DISPLAY NAME</label><input style={sx.input} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>MOBILE CONTACT</label><input style={sx.input} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                           </div>

                           <div style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:16, borderRadius:16, display:'flex', flexDirection:'column', gap:10 }}>
                              <h4 style={{ margin:0, fontSize:11, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:6 }}><Target size={12} color={T.primary}/> Sales Goals & Risk</h4>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                 <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>MAX CREDIT (₦)</label><input style={sx.input} type="number" placeholder="500000" value={eCreditLimit} onChange={e=>setECreditLimit(e.target.value)}/></div>
                                 <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>MONTH TARGET (₦)</label><input style={sx.input} type="number" placeholder="1000000" value={eSalesTarget} onChange={e=>setESalesTarget(e.target.value)}/></div>
                              </div>
                           </div>

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>PORTAL ALIAS</label><input style={sx.input} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>PASSWORD</label><input style={sx.input} value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                           </div>
                           
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>4-DIGIT PIN</label><input style={{...sx.input, textAlign:'center', letterSpacing:'0.2em'}} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value)}/></div>
                              <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>LOGISTICS ROUTE</label>
                                 <select style={sx.input} value={eSup} onChange={e=>setESup(e.target.value)}>
                                    <option value="">Direct Pickup</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>BRANCH ADDRESS</label><input style={sx.input} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                           <div><label style={{fontSize:9, fontWeight:800, color:T.txt3, display:'block', marginBottom:4}}>ADMIN MEMO</label><textarea style={{...sx.input, minHeight:60, resize:'none'}} value={eNote} onChange={e=>setENote(e.target.value)}/></div>
                           
                           <div style={{ paddingTop:16, borderTop:`1px solid ${T.borderLight}`, marginTop:6 }}>
                              <p style={{ margin:'0 0 10px', fontSize:9, fontWeight:800, color:T.danger }}>Critical Actions</p>
                              <button type="button" style={{ ...sx.btn, background:T.dangerLight, color:T.danger, width:'100%', justifyContent:'center' }}><Lock size={14}/> Terminate Partnership</button>
                           </div>
                        </form>
                        </motion.div>
                     )}
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        {/* ADD PARTNER MODAL */}
        <AnimatePresence>
           {isAdding && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
                 <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} style={{ background:T.solidWhite, width:'100%', maxWidth:400, borderRadius:24, padding:24, position:'relative', boxShadow:T.shadowMd }}>
                    <button onClick={()=>setIsAdding(false)} style={{ position:'absolute', top:20, right:20, border:'none', background:T.bg2, width:32, height:32, borderRadius:10, cursor:'pointer' }}><X size={16}/></button>
                    <div style={{ textAlign:'center', marginBottom:20 }}>
                       <div style={{ width:48, height:48, background:T.primaryLight, color:T.primary, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}><UserPlus size={24}/></div>
                       <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:T.ink }}>Onboard Partner</h2>
                       <p style={{ margin:0, fontSize:11, color:T.txt3, fontWeight:600 }}>Create a managed distributor profile</p>
                    </div>
                    <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                       <input style={sx.input} placeholder="Legal Enterprise Full Name" value={fName} onChange={e=>setFName(e.target.value)} required/>
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <input style={sx.input} placeholder="Primary Phone" value={fPhone} onChange={e=>setFPhone(e.target.value)}/>
                          <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                             <option value="">Select Supplier Route</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                       </div>
                       <div style={{ background:T.bg2, padding:16, borderRadius:16, display:'flex', flexDirection:'column', gap:10, border:`1px solid ${T.borderLight}` }}>
                          <p style={{ margin:0, fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.05em' }}>🔐 CLOUD ACCESS PORTAL</p>
                          <input style={sx.input} placeholder="Official Email (Login Identifier)" value={fEmail} onChange={e=>setFEmail(e.target.value)}/>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                             <input style={sx.input} placeholder="Create Password" value={fPassword} onChange={e=>setFPassword(e.target.value)}/>
                             <input style={{...sx.input, textAlign:'center'}} placeholder="4-Digit PIN" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/>
                          </div>
                       </div>
                       <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:48, justifyContent:'center', fontSize:14, marginTop:6}}>{loading ? 'Deploying...' : 'Confirm Registration ✓'}</button>
                    </form>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* UTILITIES */}
        <ImageCropModal isOpen={showCropper} imageSrc={cropImageSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />
        
        {/* SUCCESS MODAL */}
        <AnimatePresence>
           {createdCreds && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <div style={{ background:T.solidWhite, borderRadius:24, padding:24, width:'100%', maxWidth:320, textAlign:'center', boxShadow:T.shadowMd }}>
                    <div style={{ width:50, height:50, background:T.successLight, color:T.success, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><CheckCircle2 size={24} /></div>
                    <h2 style={{ margin:'0 0 6px', fontSize:18, fontWeight:900, color:T.ink }}>Account Enabled</h2>
                    <p style={{ margin:'0 0 20px', fontSize:11, fontWeight:600, color:T.txt3 }}>Partner credentials synced to database</p>
                    <div style={{ background:T.bg2, padding:16, borderRadius:16, textAlign:'left', fontSize:11, display:'flex', flexDirection:'column', gap:10 }}>
                       <div><p style={{margin:0, fontSize:8, fontWeight:900, color:T.txt3, letterSpacing:'0.05em'}}>SYSTEM LOGIN</p><p style={{margin:0, fontWeight:800, color:T.ink}}>{createdCreds.login}</p></div>
                       <div><p style={{margin:0, fontSize:8, fontWeight:900, color:T.txt3, letterSpacing:'0.05em'}}>SECURE PASSWORD</p><p style={{margin:0, fontWeight:800, fontFamily:'monospace', letterSpacing:'0.1em', color:T.ink}}>{createdCreds.password}</p></div>
                    </div>
                    <button onClick={()=>setCreatedCreds(null)} style={{...sx.btn, width:'100%', marginTop:20, height:44, justifyContent:'center'}}>Great, Thanks!</button>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;