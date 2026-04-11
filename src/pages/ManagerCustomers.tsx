import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Lock, Camera,
  Award, ShieldCheck, History, TrendingUp, Zap, 
  Star, CreditCard, Activity, Filter,
  MoreHorizontal, Download,
  CheckCircle2, Globe, BarChart3, Target, AlertTriangle, PhoneCall, MessageSquare,
  Bot, Clock, Truck, CheckCircle, Flame, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─────────────────────────────────────────
   HYPER-MODERN V4 — TOP CLASS MODEL UI
───────────────────────────────────────── */
const T = {
  bg:           '#F9FAFB', // Extremely light grey/off-white background
  bg2:          '#F3F4F6',
  white:        'rgba(255,255,255,0.85)', // Premium Glassmorphism base
  solidWhite:   '#ffffff',
  border:       'rgba(0,0,0,0.04)', // Invisible soft borders
  borderLight:  'rgba(0,0,0,0.02)',
  primary:      '#000000', // SaaS Minimal (Black is Primary)
  primaryLight: 'rgba(0,0,0,0.05)',
  accent:       '#3b82f6', // Blueprint Accent
  accentLight:  'rgba(59,130,246,0.1)',
  success:      '#10b981',
  successLight: 'rgba(16,185,129,0.1)',
  danger:       '#ef4444',
  dangerLight:  'rgba(239,68,68,0.1)',
  gold:         '#f59e0b',
  goldLight:    'rgba(245,158,11,0.1)',
  silver:       '#9ca3af',
  ink:          '#111827', // Crisp Black Text
  txt:          '#374151',
  txt2:         '#4b5563',
  txt3:         '#9ca3af',
  radius:       '32px',
  radiusSm:     '20px',
  shadowSoft:   '0 12px 40px -12px rgba(0,0,0,0.05)', // Vercel-like soft shadow
  shadowMd:     '0 24px 60px -16px rgba(0,0,0,0.1)',
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
      setDTab('summary');
      
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
     const r = Math.min(100, Math.round((drawer.debtBalance / drawerMeta.creditLimit) * 100));
     return isNaN(r) ? 0 : r;
  }, [drawer, drawerMeta]);

  const salesProgress = useMemo(() => {
      if (!drawer || !drawerMeta.salesTarget) return 0;
      const totalSpent = customerItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      const r = Math.min(100, Math.round((totalSpent / drawerMeta.salesTarget) * 100));
      return isNaN(r) ? 0 : r;
  }, [customerItems, drawerMeta]);

  /* 🧠 AI Insight Generator Engine */
  const aiInsight = useMemo(() => {
      if (!drawer) return null;
      if (creditRatio >= 80) return { msg: `Critical Limit Reached! Partner is at ${creditRatio}% limit. Restrict new credit instantly.`, color: T.danger, light: T.dangerLight };
      if (salesProgress >= 80) return { msg: `Closing In! Partner is near target. Offer bulk-discount to seal the objective.`, color: T.accent, light: T.accentLight };
      if (customerItems.length > 5 && drawer.debtBalance === 0) return { msg: `A+ Compliance. Zero debt streak! Lock in retention with a Diamond Promo.`, color: T.success, light: T.successLight };
      return { msg: `Stable Performance. Maintain routine communications to grow relationship.`, color: T.primary, light: T.primaryLight };
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
    input: { background:T.solidWhite, border:`1px solid ${T.border}`, borderRadius:T.radiusSm, padding:'16px', fontSize:'14px', width:'100%', outline:'none', fontWeight:600, color:T.ink, transition:'0.3s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' } as React.CSSProperties,
    btn: { background:T.primary, color:T.solidWhite, border:'none', borderRadius:T.radiusSm, padding:'16px 24px', fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'0.3s', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding:'10px', borderRadius:T.radiusSm, background:active ? T.ink : 'transparent', color:active ? T.solidWhite : T.txt3, border: 'none', fontSize:10, fontWeight:900, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1, transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', minWidth:70 
    }) as any,
    glassPanel: { background: T.white, backdropFilter: 'blur(30px) saturate(150%)', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
    card: { background: T.solidWhite, borderRadius: T.radius, padding: 24, boxShadow: T.shadowSoft, border: `1px solid ${T.borderLight}` } as React.CSSProperties
  };

  return (
    <AnimatedPage>
      {/* Absolute Hero Mesh Background */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:350, zIndex:0, opacity:0.6, background: `radial-gradient(at 100% 0%, hsla(240,40%,95%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(200,60%,96%,1) 0px, transparent 50%), radial-gradient(at 50% 100%, hsla(280,40%,98%,1) 0px, transparent 50%)` }} />

      <div style={{ background:T.bg, minHeight:'100vh', paddingBottom:'120px', color:T.txt, fontFamily:"'Inter', -apple-system, sans-serif", position:'relative', zIndex:1 }}>
        
        {/* ULTRA-MODERN FLOATING HEADER */}
        <div style={{ ...sx.glassPanel, padding: '50px 24px 24px', position: 'sticky', top:0, zIndex:50, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, boxShadow: T.shadowSoft }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
             <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.9}} onClick={() => navigate(-1)} style={{ width:44, height:44, borderRadius:'50%', border:'none', background:T.solidWhite, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow: T.shadowSoft }}>
              <ArrowLeft size={18} color={T.ink} />
            </motion.button>
            <div style={{ flex:1 }}>
              <p style={{ margin:'0 0 2px', fontSize:10, color:T.txt3, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em' }}>CRM Module</p>
              <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:T.ink, letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:8 }}>
                 Enterprise Network 
                 <div style={{background:T.primary, color:T.solidWhite, padding:'4px 8px', borderRadius:20, fontSize:9, fontWeight:800, letterSpacing:'0.1em', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}>V4</div>
              </h1>
            </div>
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => setIsAdding(true)} style={{...sx.btn, padding:'12px 18px', fontSize:12, borderRadius:16}}><UserPlus size={16}/> New</motion.button>
          </div>

          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:10 }} className="hide-scrollbar">
             {[
               { label:'Global Liability', val:stats.total, color:T.danger, light:T.solidWhite, icon:TrendingUp, pre:'₦' },
               { label:'Network Retention', val:Math.round((stats.active/stats.count)*100)||0, color:T.accent, light:T.solidWhite, icon:Flame, suf:'%' },
               { label:'Issued Points', val:customers.reduce((s,c)=>s+(c.loyaltyPoints||0), 0), color:T.gold, light:T.solidWhite, icon:Award, pre:'' }
             ].map((s,i) => (
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} key={i} style={{ flexShrink:0, background:T.solidWhite, padding:'16px 20px', borderRadius:24, display:'flex', flexDirection:'column', gap:8, minWidth:140, boxShadow: T.shadowSoft, border:`1px solid ${T.border}` }}>
                   <div style={{ display:'flex', alignItems:'center', gap:6, color:s.color }}>
                      <s.icon size={12}/> <span style={{ fontSize:9, fontWeight:800, color:T.txt3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</span>
                   </div>
                   <h3 style={{ margin:0, fontSize:22, fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>{s.pre}{s.val.toLocaleString()}{s.suf}</h3>
                </motion.div>
             ))}
          </div>

          <div style={{ position:'relative', marginTop:8 }}>
            <Search size={16} color={T.txt3} style={{ position:'absolute', left:20, top:'50%', transform:'translateY(-50%)' }} />
            <input style={{ ...sx.input, paddingLeft:48, height:56, borderRadius:24, background:T.solidWhite, border:'none', boxShadow: T.shadowSoft }} placeholder="Search intelligent directory..." value={search} onChange={e => setSearch(e.target.value)} />
            <motion.button whileTap={{scale:0.95}} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', border:'none', background:T.bg2, width:32, height:32, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
               <Filter size={14} color={T.ink}/>
            </motion.button>
          </div>
        </div>

        {/* APPLE-STYLE BENTO GRID VIEWS */}
        <div style={{ padding:'24px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:16 }}>
           {list.map((c, i) => {
             const [ac, lc] = getAvatar(c.name);
             const rank = getRank(c.debtBalance, c.loyaltyPoints || 0);
             
             let creditWarining = false;
             let streak = c.debtBalance === 0 && (transactions.filter(t=>t.customerId===c.id).length > 2);

             try {
                const cm = c.notes ? JSON.parse(c.notes) : {};
                if (cm.creditLimit && c.debtBalance >= cm.creditLimit * 0.8) creditWarining = true;
             } catch(e) {}

             return (
               <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{delay: i * 0.05}} key={c.id} layoutId={c.id} onClick={() => setDrawerId(c.id)} whileHover={{ y:-6, scale:1.03 }} whileTap={{ scale:0.95 }} style={{ background: T.solidWhite, borderRadius: T.radius, padding:20, cursor:'pointer', position:'relative', overflow:'hidden', boxShadow: T.shadowSoft, display:'flex', flexDirection:'column', justifyContent:'space-between', border:`1px solid ${creditWarining ? T.dangerLight : 'transparent'}` }}>
                 {/* Decorative background glow */}
                 <div style={{ position:'absolute', top:-40, right:-40, width:100, height:100, background: creditWarining ? T.dangerLight : lc, filter:'blur(40px)', zIndex:0, opacity:0.6 }}/>

                 <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', width:'100%', marginBottom:16 }}>
                    <div style={{ width:44, height:44, borderRadius:16, background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                       {c.image ? <img src={c.image} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:16}} /> : c.name[0]}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                       {creditWarining ? (
                           <div style={{ background: T.dangerLight, color: T.danger, fontSize:8, fontWeight:900, padding:'6px 8px', borderRadius:10, height:'fit-content', border:`1px solid rgba(239,68,68,0.2)`, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={10}/> O-LIMIT</div>
                       ) : streak ? (
                           <div style={{ background: T.goldLight, color: T.gold, fontSize:8, fontWeight:900, padding:'6px 8px', borderRadius:10, height:'fit-content', border:`1px solid rgba(245,158,11,0.2)`, display:'flex', alignItems:'center', gap:4 }}><Flame size={10}/> HOT</div>
                       ) : (
                           <div style={{ background: rank.bg, color: rank.color, fontSize:8, fontWeight:900, padding:'6px 8px', borderRadius:10, height:'fit-content', display:'flex', alignItems:'center', gap:4 }}><rank.icon size={10}/> {rank.label}</div>
                       )}
                    </div>
                 </div>
                 <div style={{ position:'relative', zIndex:1 }}>
                    <h3 style={{ margin:0, fontSize:15, fontWeight:900, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.02em' }}>{c.name}</h3>
                    <p style={{ margin:'2px 0 16px', fontSize:11, color:T.txt3, fontWeight:600 }}>{c.phone || '@'+c.username}</p>
                 </div>
                 
                 <div style={{ width:'100%', paddingTop:16, borderTop:`1px dashed ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-end', position:'relative', zIndex:1 }}>
                    <div>
                        <p style={{margin:0, fontSize:8, fontWeight:800, color:T.txt3, textTransform:'uppercase'}}>Liability</p>
                        <div style={{ fontSize:14, fontWeight:900, color:c.debtBalance > 0 ? T.danger : T.ink, letterSpacing:'-0.02em' }}>₦{(c.debtBalance||0).toLocaleString()}</div>
                    </div>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:T.bg2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                       <ChevronRight size={14} color={T.txt3}/>
                    </div>
                 </div>
               </motion.div>
             );
           })}
        </div>

        {/* FULL-SCREEN LIQUID PROFILE SHEET */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawerId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', zIndex:100 }}/>
               <motion.div initial={{y:'100%', scale:0.95}} animate={{y:0, scale:1}} exit={{y:'100%', scale:1}} transition={{type:'spring', damping:28, stiffness:260, mass:0.8}} style={{ position:'fixed', bottom:0, left:0, right:0, height:'92vh', background:T.bg, zIndex:110, borderTopLeftRadius:40, borderTopRightRadius:40, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:T.shadowMd }}>
                  
                  {/* Master Handle */}
                  <div style={{ padding: '16px 0', cursor:'grab', display:'flex', justifyContent:'center' }} onClick={()=>setDrawerId(null)}>
                     <div style={{ height:6, width:48, background:T.borderLight, borderRadius:4 }}/>
                  </div>

                  {/* High End Header */}
                  <div style={{ padding:'0 30px 24px', display:'flex', alignItems:'center', gap:20, borderBottom:`1px solid ${T.border}` }}>
                     <div style={{ position: 'relative' }}>
                        <div style={{ width:80, height:80, borderRadius:24, background:getAvatar(drawer.name)[1], color:getAvatar(drawer.name)[0], display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:900, overflow:'hidden', boxShadow:T.shadowSoft, border:`4px solid ${T.solidWhite}` }}>
                           {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : drawer.name[0]}
                        </div>
                        <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:-4, right:-4, background:T.ink, color:T.solidWhite, border:`3px solid ${T.solidWhite}`, borderRadius:12, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadowSoft, cursor:'pointer' }}>
                           <Camera size={14}/>
                        </motion.button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                     </div>
                     <div style={{ flex:1 }}>
                        <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:T.ink, letterSpacing:'-0.03em', lineHeight:1 }}>
                           {drawer.name}
                        </h2>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
                           <a href={`tel:${drawer.phone}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', background:T.solidWhite, borderRadius:12, padding:'8px 12px', color:T.ink, fontWeight:800, fontSize:10, boxShadow:T.shadowSoft }}><PhoneCall size={12} style={{marginRight:6}}/> Call</a>
                           <a href={`https://wa.me/${drawer.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', background:T.successLight, borderRadius:12, padding:'8px 12px', color:T.success, fontWeight:800, fontSize:10 }}><MessageSquare size={12} style={{marginRight:6}}/> Whatsapp</a>
                           <button onClick={()=>setDrawerId(null)} style={{ marginLeft:'auto', border:'none', background:T.bg2, width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.txt3, cursor:'pointer' }}><X size={18}/></button>
                        </div>
                     </div>
                  </div>

                  {/* LIQUID TABS */}
                  <div style={{ padding:'24px 30px 10px', overflowX:'auto' }} className="hide-scrollbar">
                     <div style={{ display:'flex', gap:10, padding:6, background:T.solidWhite, borderRadius:24, boxShadow:T.shadowSoft, width:'max-content' }}>
                        {[
                          { id:'summary', icon:Activity, label:'Overview' },
                          { id:'analytics', icon:BarChart3, label:'Insights' },
                          { id:'logistics', icon:Truck, label:'Logistics' },
                          { id:'vault', icon:History, label:'Vault' },
                          { id:'identity', icon:ShieldCheck, label:'Identity' },
                          { id:'compliance', icon:Award, label:'Legal' },
                          { id:'config', icon:MoreHorizontal, label:'Config' },
                        ].map(t => (
                          <motion.button layout whileTap={{scale:0.95}} key={t.id} onClick={()=>setDTab(t.id as any)} style={sx.tab(dTab===t.id)}>
                             <t.icon size={dTab===t.id ? 16 : 14}/> <span>{t.label}</span>
                          </motion.button>
                        ))}
                     </div>
                  </div>

                  {/* TAB CONTENT */}
                  <div style={{ flex:1, overflowY:'auto', padding:'20px 30px 60px' }} className="hide-scrollbar">
                     
                     <AnimatePresence mode="wait">
                     {/* 1. SUMMARY DASHBOARD WITH GOALS, AI & LIMITS */}
                     {dTab === 'summary' && (
                        <motion.div key="summary" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           
                           {/* SaaS AI Assistant Widget */}
                           {aiInsight && (
                              <div style={{ background:T.solidWhite, border:`1px solid ${aiInsight.color}20`, borderRadius:T.radius, padding:20, display:'flex', gap:16, boxShadow:T.shadowSoft, overflow:'hidden', position:'relative' }}>
                                 <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background:aiInsight.color }}/>
                                 <div style={{ background:aiInsight.light, color:aiInsight.color, width:40, height:40, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <Bot size={20}/>
                                 </div>
                                 <div style={{ alignSelf:'center' }}>
                                    <h4 style={{ margin:'0 0 6px', fontSize:12, fontWeight:900, color:aiInsight.color, letterSpacing:'-0.01em' }}>Model AI Insight</h4>
                                    <p style={{ margin:0, fontSize:11, color:T.txt, lineHeight:1.5, fontWeight:600 }}>{aiInsight.msg}</p>
                                 </div>
                              </div>
                           )}

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              {/* Vercel-like Data Card */}
                              <div style={{ background: drawer.debtBalance > 0 ? (creditRatio >= 80 ? T.danger : T.gold) : T.ink, padding:24, borderRadius:T.radius, color:T.solidWhite, position:'relative', overflow:'hidden', boxShadow:T.shadowSoft }}>
                                 <CreditCard size={80} style={{ position:'absolute', right:-15, bottom:-15, opacity:0.05, transform:'rotate(-10deg)' }}/>
                                 <p style={{ margin:0, fontSize:9, fontWeight:800, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.15em' }}>Current Liability</p>
                                 <h1 style={{ margin:'10px 0', fontSize:28, fontWeight:900, letterSpacing:'-0.03em' }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                                 {drawerMeta.creditLimit && (
                                    <div style={{ marginTop:16 }}>
                                       <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontWeight:800, marginBottom:6, opacity:0.9 }}>
                                          <span>Limit Exposure</span><span>{creditRatio}%</span>
                                       </div>
                                       <div style={{ height:6, background:'rgba(255,255,255,0.2)', borderRadius:3, overflow:'hidden' }}>
                                          <motion.div initial={{width:0}} animate={{width:`${creditRatio}%`}} transition={{duration:1, ease:'easeOut'}} style={{ height:'100%', background:T.solidWhite, borderRadius:3 }}/>
                                       </div>
                                    </div>
                                 )}
                              </div>

                              <div style={{ ...sx.card, textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                                 <p style={{ margin:'0 0 16px', fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.1em' }}>MONTHLY TARGET</p>
                                 <div style={{ position:'relative', width:70, height:70, margin:'0 auto' }}>
                                    <svg viewBox="0 0 36 36" style={{ width:'100%', height:'100%' }}>
                                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={T.bg2} strokeWidth="3" strokeLinecap="round" />
                                       <motion.path initial={{strokeDasharray:"0, 100"}} animate={{strokeDasharray:`${salesProgress}, 100`}} transition={{duration:1.5, ease:"easeOut"}} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={salesProgress >= 100 ? T.success : T.accent} strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:salesProgress >= 100 ? T.success : T.ink }}>{salesProgress}%</div>
                                 </div>
                                 <h3 style={{ margin:'12px 0 0', fontSize:13, fontWeight:900, color:T.ink }}>{drawerMeta.salesTarget ? `₦${drawerMeta.salesTarget.toLocaleString()}` : 'No Goal Set'}</h3>
                              </div>
                           </div>

                           <div style={{ ...sx.card }}>
                              <h4 style={{ margin:'0 0 16px', fontSize:14, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:8 }}><TrendingUp size={16} color={T.primary}/> Instant Settlement</h4>
                              <form onSubmit={payDebt} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                                 <div style={{ position:'relative' }}>
                                    <span style={{ position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', fontWeight:900, fontSize:22, color:T.txt3 }}>₦</span>
                                    <input style={{...sx.input, paddingLeft:48, fontSize:28, fontWeight:900, height:70, borderRadius:20}} type="number" placeholder="0.00" value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                                 </div>
                                 <div style={{ display:'flex', gap:10 }}>
                                    {['Cash', 'Transfer'].map(m => (
                                       <button key={m} type="button" onClick={()=>setPayMethod(m as any)} style={{ flex:1, border:`2px solid ${payMethod===m?T.primary:T.borderLight}`, borderRadius:16, padding:'14px 0', fontSize:12, fontWeight:900, background:payMethod===m?T.primary:T.bg2, color:payMethod===m?T.solidWhite:T.txt, transition:'0.3s', cursor:'pointer' }}>{m}</button>
                                    ))}
                                 </div>
                                 <motion.button whileTap={{scale:0.98}} type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:56, borderRadius:16, marginTop:8}}>{loading ? 'Processing...' : 'Complete Payment'}</motion.button>
                              </form>
                           </div>
                        </motion.div>
                     )}

                     {/* 2. ANALYTICS & INSIGHTS */}
                     {dTab === 'analytics' && (
                        <motion.div key="analytics" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           <div style={{ ...sx.card }}>
                              <h4 style={{ margin:'0 0 20px', fontSize:14, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:8 }}><BarChart3 size={16} color={T.primary}/> Purchasing Velocity</h4>
                              {chartData.length > 0 ? (
                                 <div style={{ width: '100%', height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                       <AreaChart data={chartData} margin={{top:0, right:0, left:-20, bottom:0}}>
                                          <defs>
                                             <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={T.primary} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                                             </linearGradient>
                                          </defs>
                                          <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{fill:T.txt3, fontWeight:700}} dy={10} />
                                          <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v/1000}k`} tick={{fill:T.txt3, fontWeight:700}} />
                                          <Tooltip cursor={{stroke: T.borderLight, strokeWidth: 2}} contentStyle={{ borderRadius:16, border:`none`, fontWeight:900, fontSize:12, boxShadow: T.shadowSoft }} />
                                          <Area type="monotone" dataKey="amount" stroke={T.primary} strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" animationDuration={1500} />
                                       </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                              ) : (
                                 <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:T.txt3, fontSize:12, fontWeight:800, background:T.bg2, borderRadius:20 }}>No Data Points Acquired</div>
                              )}
                           </div>
                           
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <div style={{ background:T.solidWhite, padding:24, borderRadius:T.radius, boxShadow:T.shadowSoft, border:`1px solid ${T.border}` }}>
                                 <p style={{ margin:0, fontSize:10, fontWeight:900, color:T.txt3, letterSpacing:'0.1em' }}>LIFETIME VALUE</p>
                                 <h3 style={{ margin:'8px 0 0', fontSize:22, fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>₦{customerItems.reduce((a,c)=>a+c.totalPrice,0).toLocaleString()}</h3>
                                 <div style={{ marginTop:16, background:T.accentLight, color:T.accent, padding:'4px 8px', borderRadius:8, display:'inline-block', fontSize:10, fontWeight:900 }}>Tier Verified</div>
                              </div>
                              <div style={{ background:T.solidWhite, padding:24, borderRadius:T.radius, boxShadow:T.shadowSoft, border:`1px solid ${T.border}` }}>
                                 <p style={{ margin:0, fontSize:10, fontWeight:900, color:T.txt3, letterSpacing:'0.1em' }}>REWARD POINTS</p>
                                 <h3 style={{ margin:'8px 0 0', fontSize:22, fontWeight:900, color:T.success, letterSpacing:'-0.02em' }}>{drawer.loyaltyPoints || 0} Pts</h3>
                                 <div style={{ marginTop:16, background:T.successLight, color:T.success, padding:'4px 8px', borderRadius:8, display:'inline-block', fontSize:10, fontWeight:900 }}>Active Balance</div>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* 2.5 LOGISTICS JOURNEY TIMELINE */}
                     {dTab === 'logistics' && (
                        <motion.div key="logistics" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ ...sx.card }}>
                           <h4 style={{ margin:'0 0 24px', fontSize:14, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:8 }}><Truck size={16} color={T.primary}/> Master Route Status</h4>
                           
                           <div style={{ position:'relative', paddingLeft:24, borderLeft:`2px dashed ${T.borderLight}`, marginLeft:12 }}>
                              <div style={{ position:'relative', marginBottom:32 }}>
                                 <div style={{ position:'absolute', left:-33, top:0, background:T.success, color:T.solidWhite, width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`4px solid ${T.solidWhite}`, boxShadow: T.shadowSoft }}><CheckCircle size={10}/></div>
                                 <h5 style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink }}>Designated Route</h5>
                                 <p style={{ margin:'4px 0 0', fontSize:11, color:T.txt2, fontWeight:600 }}>{suppliers.find(s=>s.id===drawer.assignedSupplierId)?.full_name || 'Direct HQ Pickup'}</p>
                              </div>
                              
                              <div style={{ position:'relative', marginBottom:32 }}>
                                 <div style={{ position:'absolute', left:-33, top:0, background:T.primary, color:T.solidWhite, width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`4px solid ${T.solidWhite}`, boxShadow: `0 0 0 4px ${T.primaryLight}` }}><Truck size={10}/></div>
                                 <h5 style={{ margin:0, fontSize:13, fontWeight:900, color:T.primary }}>In Good Standing</h5>
                                 <p style={{ margin:'4px 0 0', fontSize:11, color:T.txt2, fontWeight:600 }}>Verified for next dispatch window.</p>
                              </div>

                              <div style={{ position:'relative' }}>
                                 <div style={{ position:'absolute', left:-33, top:0, background:T.txt3, color:T.solidWhite, width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:`4px solid ${T.solidWhite}` }}><Clock size={10}/></div>
                                 <h5 style={{ margin:0, fontSize:13, fontWeight:900, color:T.txt3 }}>Settlement Due</h5>
                                 <p style={{ margin:'4px 0 0', fontSize:11, color:T.txt3, fontWeight:600 }}>Awaiting future drop-offs.</p>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* 3. TRANSACTION VAULT */}
                     {dTab === 'vault' && (
                        <motion.div key="vault" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                              <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>Statements</h3>
                              <button style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:'10px 16px', borderRadius:14, fontSize:11, fontWeight:900, color:T.ink, boxShadow:T.shadowSoft, cursor:'pointer' }}>Export CSV</button>
                           </div>
                           {customerItems.length > 0 ? customerItems.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                              <motion.div whileHover={{scale:1.01}} key={tx.id} onClick={()=>navigate(`/receipt/${tx.id}`)} style={{ background:T.solidWhite, padding:16, borderRadius:T.radiusSm, border:`1px solid ${T.borderLight}`, display:'flex', alignItems:'center', gap:16, cursor:'pointer', boxShadow:T.shadowSoft }}>
                                 <div style={{ width:48, height:48, borderRadius:16, background:tx.type==='Return' ? T.dangerLight: tx.type==='Debt' ? T.goldLight : T.successLight, color:tx.type==='Return'?T.danger: tx.type==='Debt' ? T.gold : T.success, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    {tx.type==='Return' ? <ArrowLeft size={20}/> : <Zap size={20}/>}
                                 </div>
                                 <div style={{ flex:1 }}>
                                    <p style={{ margin:0, fontSize:14, fontWeight:900, color:T.ink, letterSpacing:'-0.01em' }}>{tx.type} Document</p>
                                    <p style={{ margin:'2px 0 0', fontSize:11, color:T.txt3, fontWeight:700 }}>{new Date(tx.date).toLocaleDateString([], { month:'long', day:'numeric', year:'numeric' })}</p>
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <p style={{ margin:0, fontSize:16, fontWeight:900, color:tx.type==='Return'?T.danger:T.ink, letterSpacing:'-0.03em' }}>₦{tx.totalPrice.toLocaleString()}</p>
                                    <div style={{ display:'inline-block', padding:'4px 8px', borderRadius:6, background:T.bg2, color:T.txt2, fontSize:9, fontWeight:900, marginTop:6 }}>{tx.status || 'FINALIZED'}</div>
                                 </div>
                              </motion.div>
                           )) : (
                              <div style={{ textAlign:'center', padding:'60px 20px', background:T.solidWhite, borderRadius:T.radiusSm, border:`1px dashed ${T.border}` }}>
                                 <History size={48} color={T.txt3} style={{marginBottom:16, opacity:0.2}}/>
                                 <p style={{margin:0, fontSize:14, fontWeight:900, color:T.txt2}}>No Documents Found</p>
                                 <p style={{margin:'4px 0 0', fontSize:11, color:T.txt3, fontWeight:600}}>Financial records will appear here</p>
                              </div>
                           )}
                        </motion.div>
                     )}

                     {/* 4. DIGITAL IDENTITY */}
                     {dTab === 'identity' && (
                        <motion.div key="identity" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           <div style={{ background: `linear-gradient(135deg, ${T.ink} 0%, #374151 100%)`, color:T.solidWhite, padding:32, borderRadius:32, position:'relative', overflow:'hidden', boxShadow: '0 24px 60px -16px rgba(0,0,0,0.3)' }}>
                              <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, background:T.solidWhite, opacity:0.04, filter:'blur(40px)', borderRadius:'50%' }}/>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
                                 <div style={{ zIndex:1 }}>
                                    <h4 style={{ margin:0, fontSize:11, fontWeight:900, letterSpacing:'0.2em', opacity:0.9 }}>{appSettings.companyName?.toUpperCase() || 'BAKERY INC.'}</h4>
                                    <p style={{ margin:'4px 0 0', fontSize:9, fontWeight:700, opacity:0.6 }}>VERIFIED PARTNER</p>
                                 </div>
                                 <ShieldCheck size={28} color={T.solidWhite} opacity={0.8}/>
                              </div>
                              <div style={{ display:'flex', gap:20, alignItems:'center', position:'relative', zIndex:1 }}>
                                 <div style={{ width:80, height:80, borderRadius:24, background:T.solidWhite, overflow:'hidden', border:'4px solid rgba(255,255,255,0.1)' }}>
                                    {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:T.ink, fontWeight:900, fontSize:28}}>{drawer.name[0]}</div>}
                                 </div>
                                 <div>
                                    <h3 style={{ margin:0, fontSize:24, fontWeight:900, letterSpacing:'-0.02em' }}>{drawer.name}</h3>
                                    <p style={{ margin:'6px 0 0', fontSize:10, fontWeight:800, color:T.txt3, letterSpacing:'0.15em' }}>AUTHORIZED LICENSE</p>
                                 </div>
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:40, borderTop:'1px rgba(255,255,255,0.1) dashed', paddingTop:24 }}>
                                 <div>
                                    <p style={{ margin:0, fontSize:9, opacity:0.6, fontWeight:900, letterSpacing:'0.1em' }}>VAULT ID</p>
                                    <p style={{ margin:'4px 0 0', fontSize:13, fontWeight:900, fontFamily:'monospace', letterSpacing:'0.05em' }}>UID-{drawer.id.slice(0,8).toUpperCase()}</p>
                                 </div>
                                 <div style={{ background:T.solidWhite, padding:6, borderRadius:12 }}>
                                    <QRCode value={drawer.id} size={50} />
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', background:T.solidWhite, color:T.ink, border:`1px solid ${T.borderLight}`, justifyContent:'center'}}><Download size={16}/> Save Native Wallet Card</button>
                        </motion.div>
                     )}

                     {/* 5. COMPLIANCE (CERTIFICATE) */}
                     {dTab === 'compliance' && (
                        <motion.div key="compliance" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           <div style={{ background: T.solidWhite, border: `2px solid ${T.borderLight}`, padding: 40, textAlign: 'center', position: 'relative', boxShadow:T.shadowSoft, borderRadius:32 }}>
                              <div style={{ position:'absolute', top:24, right:24 }}><Award size={40} color={T.primary} opacity={0.03}/></div>
                              <Globe size={40} color={T.primary} style={{ marginBottom: 20 }} />
                              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color:T.ink, letterSpacing:'0.1em' }}>OFFICIAL PARTNERSHIP</h4>
                              <p style={{ fontSize: 11, margin: '16px 0', color:T.txt3, fontStyle:'italic' }}>Document certified on blockchain</p>
                              <h2 style={{ margin: '12px 0', fontSize: 26, fontWeight: 900, color:T.ink, borderBottom:`3px solid ${T.borderLight}`, display:'inline-block', paddingBottom:8, letterSpacing:'-0.03em' }}>{drawer.name}</h2>
                              <p style={{ fontSize: 12, margin: '20px auto', maxWidth:'80%', color:T.txt2, lineHeight:1.6, fontWeight:600 }}>Has successfully fulfilled the requirements to operate as an accredited enterprise distributor.</p>
                              <div style={{ background:T.bg2, padding:'10px 20px', borderRadius:12, margin:'24px 0', fontSize:10, fontWeight:900, color:T.ink, letterSpacing:'0.15em', display:'inline-block' }}>CERT-{drawer.id.slice(0,8).toUpperCase()}</div>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontWeight:900, marginTop:30, borderTop:`1px solid ${T.borderLight}`, paddingTop:16, color:T.txt3 }}>
                                 <div style={{ textAlign:'left' }}>
                                    <span style={{opacity:0.6}}>VALIDATED:</span><br/>{new Date().toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' })}
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <span style={{opacity:0.6}}>SIGNATURE:</span><br/>System Generated
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', justifyContent:'center'}}><Download size={16}/> Extract PDF</button>
                        </motion.div>
                     )}

                     {/* 6. CONFIG / ADMIN WITH CRM FIELDS */}
                     {dTab === 'config' && (
                        <motion.div key="config" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                        <form onSubmit={saveEdit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:T.solidWhite, padding:20, borderRadius:24, border:`1px solid ${T.borderLight}`, boxShadow:T.shadowSoft }}>
                              <div>
                                 <h3 style={{ margin:0, fontSize:15, fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>Enterprise Console</h3>
                                 <p style={{ margin:'2px 0 0', fontSize:11, fontWeight:700, color:T.txt3 }}>Mutate system variables.</p>
                              </div>
                              <motion.button whileTap={{scale:0.9}} type="submit" disabled={loading} style={{ background:T.ink, color:T.solidWhite, border:'none', borderRadius:12, padding:'10px 16px', fontSize:11, fontWeight:900, cursor:'pointer', boxShadow:T.shadowSoft }}>{loading ? 'Committing...' : 'Push State'}</motion.button>
                           </div>

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>LEGAL NAME</label><input style={sx.input} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>PHONE LINE</label><input style={sx.input} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                           </div>

                           <div style={{ background:T.solidWhite, border:`1px solid ${T.borderLight}`, padding:24, borderRadius:24, display:'flex', flexDirection:'column', gap:16, boxShadow: T.shadowSoft }}>
                              <h4 style={{ margin:0, fontSize:13, fontWeight:900, color:T.ink, display:'flex', alignItems:'center', gap:8 }}><Target size={14} color={T.primary}/> Operational Constraints</h4>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                                 <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>CREDIT CAP</label><input style={sx.input} type="number" placeholder="500000" value={eCreditLimit} onChange={e=>setECreditLimit(e.target.value)}/></div>
                                 <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>SALES QUOTA</label><input style={sx.input} type="number" placeholder="1000000" value={eSalesTarget} onChange={e=>setESalesTarget(e.target.value)}/></div>
                              </div>
                           </div>

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>CLOUD ALIAS</label><input style={sx.input} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>HASHED KEY</label><input style={sx.input} type="password" placeholder="••••••••" value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                           </div>
                           
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>SECURITY PIN</label><input style={{...sx.input, textAlign:'center', letterSpacing:'0.3em', fontSize:18}} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value)}/></div>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>DOMAIN NODE</label>
                                 <select style={sx.input} value={eSup} onChange={e=>setESup(e.target.value)}>
                                    <option value="">System Root</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>GEOLOCATION</label><input style={sx.input} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6, letterSpacing:'0.05em'}}>INTERNAL MEMO</label><textarea style={{...sx.input, minHeight:80, resize:'none'}} value={eNote} onChange={e=>setENote(e.target.value)}/></div>
                           
                           <div style={{ paddingTop:24, borderTop:`1px solid ${T.borderLight}`, marginTop:8 }}>
                              <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:900, color:T.danger, letterSpacing:'0.05em' }}>DANGER ZONE</p>
                              <button type="button" style={{ ...sx.btn, background:T.solidWhite, color:T.danger, border:`2px solid ${T.dangerLight}`, width:'100%', justifyContent:'center', boxShadow:'none' }}><Lock size={16}/> Terminate Instance</button>
                           </div>
                        </form>
                        </motion.div>
                     )}
                     </AnimatePresence>
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        {/* ONBOARDING MODAL */}
        <AnimatePresence>
           {isAdding && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(12px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <motion.div initial={{scale:0.9, y:40}} animate={{scale:1, y:0}} exit={{scale:0.9, y:40, opacity:0}} style={{ background:T.solidWhite, width:'100%', maxWidth:440, borderRadius:32, padding:32, position:'relative', boxShadow:T.shadowMd }}>
                    <button onClick={()=>setIsAdding(false)} style={{ position:'absolute', top:24, right:24, border:'none', background:T.bg2, width:36, height:36, borderRadius:12, cursor:'pointer' }}><X size={18}/></button>
                    <div style={{ marginBottom:28 }}>
                       <div style={{ width:56, height:56, background:T.ink, color:T.solidWhite, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:T.shadowSoft }}><UserPlus size={24}/></div>
                       <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:T.ink, letterSpacing:'-0.03em' }}>Deploy Resource</h2>
                       <p style={{ margin:'4px 0 0', fontSize:13, color:T.txt3, fontWeight:600 }}>Initialize a new enterprise model.</p>
                    </div>
                    <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                       <input style={sx.input} placeholder="Legal Entity Name" value={fName} onChange={e=>setFName(e.target.value)} required/>
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                          <input style={sx.input} placeholder="Comms Line" value={fPhone} onChange={e=>setFPhone(e.target.value)}/>
                          <select style={{...sx.input, paddingRight:10}} value={fSup} onChange={e=>setFSup(e.target.value)}>
                             <option value="">Root Server</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                       </div>
                       <div style={{ background:T.bg, padding:20, borderRadius:24, display:'flex', flexDirection:'column', gap:16, border:`1px solid ${T.borderLight}` }}>
                          <p style={{ margin:0, fontSize:10, fontWeight:900, color:T.txt, letterSpacing:'0.1em' }}><Lock size={12} style={{display:'inline', marginBottom:-2}}/> AUTH TUNNEL</p>
                          <input style={sx.input} placeholder="System Email" value={fEmail} onChange={e=>setFEmail(e.target.value)}/>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                             <input style={sx.input} type="password" placeholder="Passkey" value={fPassword} onChange={e=>setFPassword(e.target.value)}/>
                             <input style={{...sx.input, textAlign:'center', letterSpacing:'0.2em'}} placeholder="PIN" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/>
                          </div>
                       </div>
                       <motion.button whileTap={{scale:0.98}} type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:56, borderRadius:16, marginTop:8}}>{loading ? 'Building...' : 'Commit Protocol'}</motion.button>
                    </form>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        <ImageCropModal isOpen={showCropper} imageSrc={cropImageSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />
        
        {/* SUCCESS INTERFACE */}
        <AnimatePresence>
           {createdCreds && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(20px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <motion.div initial={{scale:0.9, y:40}} animate={{scale:1, y:0}} style={{ background:T.solidWhite, borderRadius:32, padding:32, width:'100%', maxWidth:360, textAlign:'center', boxShadow:T.shadowMd }}>
                    <div style={{ width:64, height:64, background:T.success, color:T.solidWhite, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow: '0 12px 30px rgba(16,185,129,0.3)' }}><CheckCircle2 size={32} /></div>
                    <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>Instance Live</h2>
                    <p style={{ margin:'0 0 24px', fontSize:13, fontWeight:600, color:T.txt3 }}>New model successfully synced.</p>
                    <div style={{ background:T.bg2, padding:20, borderRadius:20, textAlign:'left', display:'flex', flexDirection:'column', gap:16 }}>
                       <div><p style={{margin:0, fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.1em'}}>IDENTIFIER</p><p style={{margin:'4px 0 0', fontWeight:800, color:T.ink, fontSize:15}}>{createdCreds.login}</p></div>
                       <div><p style={{margin:0, fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.1em'}}>KEY</p><p style={{margin:'4px 0 0', fontWeight:900, fontFamily:'monospace', letterSpacing:'0.2em', color:T.ink, fontSize:16}}>{createdCreds.password}</p></div>
                    </div>
                    <motion.button whileTap={{scale:0.95}} onClick={()=>setCreatedCreds(null)} style={{...sx.btn, width:'100%', marginTop:24, height:56, borderRadius:16}}>Acknowledge</motion.button>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;