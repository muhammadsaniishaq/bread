import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Lock, Camera,
  Award, ShieldCheck, History, TrendingUp, Zap, 
  Star, CreditCard, Activity, Filter,
  MoreHorizontal, Download,
  CheckCircle2, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─── Master Executive Tokens ─── */
const T = {
  bg:        '#f8fafc', 
  surface:   '#ffffff',
  surface2:  '#f1f5f9',
  border:    '#e2e8f0',
  borderDk:  '#cbd5e1',
  accent:    '#6366f1',
  accentDk:  '#4f46e5',
  accentLt:  '#eef2ff',
  success:   '#10b981',
  successLt: '#d1fae5',
  danger:    '#ef4444',
  dangerLt:  '#fee2e2',
  warn:      '#f59e0b',
  warnLt:    '#fef3c7',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  shadow:    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  shadowLg:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  radius:    '16px',
  radiusLg:  '24px',
};

const getRank = (debt: number) => {
  if (debt === 0) return { label: 'DIAMOND', color: '#0ea5e9', bg: '#e0f2fe' };
  if (debt < 50000) return { label: 'GOLD', color: '#f59e0b', bg: '#fef3c7' };
  return { label: 'SILVER', color: '#64748b', bg: '#f1f5f9' };
};

const getAvatar = (name: string) => {
  const palette = [['#6366f1','#e0e7ff'], ['#0ea5e9','#e0f2fe'], ['#10b981','#d1fae5'], ['#f59e0b','#fef3c7']];
  return palette[name.charCodeAt(0) % palette.length];
};

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment, appSettings, refreshData } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* List State */
  const [search, setSearch]       = useState('');
  const [isAdding, setIsAdding]   = useState(false);
  const [suppliers, setSuppliers] = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]     = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{name:string; login:string; password:string}|null>(null);

  /* Modal States */
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
  const [dTab, setDTab]         = useState<'summary'|'vault'|'identity'|'compliance'|'config'>('summary');
  
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

  /* Finance States */
  const [payAmt, setPayAmt]       = useState('');
  const [payMethod, setPayMethod] = useState<'Cash'|'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER')
      .then(({data}) => { if (data) setSuppliers(data); });
  }, []);

  /* Sync edit states when drawer opens */
  useEffect(() => {
    if (drawer) {
      setEName(drawer.name); setEPhone(drawer.phone); setEEmail(drawer.email || '');
      setEUsername(drawer.username || ''); setEPassword(drawer.password || '');
      setELocation(drawer.location || ''); setEImage(drawer.image || '');
      setESup(drawer.assignedSupplierId || ''); setEPin(drawer.pin || ''); setENote(drawer.notes || '');
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

  const stats = useMemo(() => ({
    total: customers.reduce((s,c) => s+(c.debtBalance||0), 0),
    count: customers.length,
    active: customers.filter(c => transactions.some(t => t.customerId === c.id)).length
  }), [customers, transactions]);

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
      await updateCustomer({ ...drawer, name:eName, phone:ePhone, email:eEmail, username:eUsername, password:ePassword, location:eLocation, image:eImage, assignedSupplierId:eSup||undefined, pin:ePin||undefined, notes:eNote } as any);
      await refreshData();
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
    input: { background:'#fff', border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', fontSize:'14px', width:'100%', outline:'none', fontWeight:500 } as React.CSSProperties,
    btn: { background:T.accent, color:'#fff', border:'none', borderRadius:12, padding:'12px 20px', fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:8 } as React.CSSProperties,
    tab: (active: boolean) => ({ padding:'10px 16px', borderRadius:12, background:active ? T.surface : 'transparent', color:active ? T.accent : T.txt3, border:'none', fontSize:11, fontWeight:900, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, transition:'all 0.2s', boxShadow:active ? T.shadow : 'none' }) as any,
  };

  return (
    <AnimatedPage>
      <div style={{ background:T.bg, minHeight:'100vh', paddingBottom:'100px', color:T.txt, fontFamily:"'Inter', system-ui, sans-serif" }}>
        
        {/* COMPACT TOP BAR */}
        <div style={{ padding:'20px 20px 10px', position:'sticky', top:0, background:'rgba(248,250,252,0.8)', backdropFilter:'blur(24px)', zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <button onClick={() => navigate(-1)} style={{ width:40, height:40, borderRadius:14, border:`1px solid ${T.border}`, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:20, fontWeight:900, letterSpacing:'-0.03em' }}>Partner Network</h1>
              <p style={{ margin:0, fontSize:11, color:T.txt3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Bakery Management • {stats.count} Members</p>
            </div>
            <button onClick={() => setIsAdding(true)} style={sx.btn}><UserPlus size={16}/> New Partner</button>
          </div>

          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:10 }} className="hide-scrollbar">
             {[
               { label:'Liability', val:stats.total, color:T.danger, icon:TrendingUp },
               { label:'Retention', val:Math.round((stats.active/stats.count)*100)||0, color:T.accent, icon:Star, unit:'%' },
               { label:'Points', val:customers.reduce((s,c)=>s+(c.loyaltyPoints||0), 0), color:T.success, icon:Award }
             ].map((s,i) => (
                <div key={i} style={{ flexShrink:0, background:'#fff', border:`1px solid ${T.border}`, padding:'12px 18px', borderRadius:16, display:'flex', alignItems:'center', gap:12, minWidth:130 }}>
                   <div style={{ background:s.color+'10', color:s.color, padding:8, borderRadius:10 }}><s.icon size={14}/></div>
                   <div>
                      <p style={{ margin:0, fontSize:9, fontWeight:800, color:T.txt3, textTransform:'uppercase' }}>{s.label}</p>
                      <p style={{ margin:0, fontSize:14, fontWeight:900 }}>{s.unit==='%' ? s.val+'%' : '₦'+s.val.toLocaleString()}</p>
                   </div>
                </div>
             ))}
          </div>

          <div style={{ position:'relative', marginTop:6 }}>
            <Search size={16} color={T.txt3} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
            <input style={{ ...sx.input, paddingLeft:42, height:48, fontSize:15, border:`1px solid ${T.border}` }} placeholder="Search partners, phones or aliass..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', display:'flex', gap:10 }}>
               <Filter size={16} color={T.txt3}/>
            </div>
          </div>
        </div>

        {/* COMPACT BENTO LIST */}
        <div style={{ padding:'10px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12 }}>
           {list.map(c => {
             const [ac, lc] = getAvatar(c.name);
             const rank = getRank(c.debtBalance);
             return (
               <motion.div key={c.id} layoutId={c.id} onClick={() => setDrawerId(c.id)} whileHover={{ y:-4 }} whileTap={{ scale:0.96 }} style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:20, padding:16, cursor:'pointer', position:'relative', overflow:'hidden', boxShadow:T.shadow }}>
                 <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginBottom:16 }}>
                    <div style={{ width:36, height:36, borderRadius:12, background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, border:'2px solid #fff', boxShadow:T.shadow }}>
                       {c.image ? <img src={c.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : c.name[0]}
                    </div>
                    <div style={{ background:rank.bg, color:rank.color, fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:8 }}>{rank.label}</div>
                 </div>
                 <h3 style={{ margin:0, fontSize:14, fontWeight:900, color:T.txt, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</h3>
                 <p style={{ margin:'4px 0 14px', fontSize:11, color:T.txt3, fontWeight:600 }}>{c.phone || '@'+c.username}</p>
                 
                 <div style={{ width:'100%', paddingTop:12, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:15, fontWeight:900, color:c.debtBalance > 0 ? T.danger : T.success }}>₦{(c.debtBalance||0).toLocaleString()}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, color:T.txt3, fontSize:10, fontWeight:700 }}>
                       <Award size={10}/> {c.loyaltyPoints || 0}
                    </div>
                 </div>
               </motion.div>
             );
           })}
        </div>

        {/* MASTER EXECUTIVE DRAWER */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawerId(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)', zIndex:100 }}/>
               <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:32, stiffness:320}} style={{ position:'fixed', bottom:0, left:0, right:0, height:'90vh', background:T.bg, zIndex:110, borderTopLeftRadius:32, borderTopRightRadius:32, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 -20px 40px -10px rgba(0,0,0,0.1)' }}>
                  
                  {/* Handle */}
                  <div style={{ height:5, width:40, background:T.borderDk, borderRadius:3, margin:'16px auto' }}/>

                  {/* Header */}
                  <div style={{ padding:'0 24px 24px', display:'flex', alignItems:'center', gap:16 }}>
                     <div style={{ position: 'relative' }}>
                        <div style={{ width:60, height:60, borderRadius:18, background:getAvatar(drawer.name)[1], color:getAvatar(drawer.name)[0], display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, overflow:'hidden', border:'4px solid #fff', boxShadow:T.shadow }}>
                           {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : drawer.name[0]}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:-2, right:-2, background:T.accent, color:'#fff', border:`3px solid #fff`, borderRadius:10, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadow, cursor:'pointer' }}>
                           <Camera size={14}/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                     </div>
                     <div style={{ flex:1 }}>
                        <h2 style={{ margin:0, fontSize:22, fontWeight:900, letterSpacing:'-0.02em' }}>{drawer.name}</h2>
                        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:4 }}>
                           <span style={{ fontSize:12, color:T.txt3, fontWeight:700 }}>BR-DIST-{drawer.id.slice(0,6).toUpperCase()}</span>
                           <span style={{ fontSize:10, background:T.success+'15', color:T.success, padding:'2px 8px', borderRadius:6, fontWeight:900, textTransform:'uppercase' }}>Verified Partner</span>
                        </div>
                     </div>
                     <button onClick={()=>setDrawerId(null)} style={{ border:'none', background:T.surface2, width:42, height:42, borderRadius:14, cursor:'pointer' }}><X size={20}/></button>
                  </div>

                  {/* MASTER TABS */}
                  <div style={{ display:'flex', padding:4, background:T.surface2, margin:'0 24px 28px', borderRadius:18 }}>
                     {[
                       { id:'summary', icon:Activity, label:'Overview' },
                       { id:'vault', icon:History, label:'Vault' },
                       { id:'identity', icon:ShieldCheck, label:'Identity' },
                       { id:'compliance', icon:Award, label:'Legal' },
                       { id:'config', icon:MoreHorizontal, label:'Config' },
                     ].map(t => (
                       <button key={t.id} onClick={()=>setDTab(t.id as any)} style={sx.tab(dTab===t.id)}>
                          <t.icon size={dTab===t.id ? 16 : 14}/> <span>{t.label}</span>
                       </button>
                     ))}
                  </div>

                  {/* TAB CONTENT */}
                  <div style={{ flex:1, overflowY:'auto', padding:'0 24px 60px' }} className="hide-scrollbar">
                     
                     {/* 1. SUMMARY DASHBOARD */}
                     {dTab === 'summary' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                           <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
                              <div style={{ background: drawer.debtBalance > 0 ? T.danger : T.success, padding:32, borderRadius:28, color:'#fff', position:'relative', overflow:'hidden' }}>
                                 <CreditCard size={100} style={{ position:'absolute', right:-20, bottom:-20, opacity:0.1, transform:'rotate(-15deg)' }}/>
                                 <p style={{ margin:0, fontSize:10, fontWeight:900, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.1em' }}>Current Balance</p>
                                 <h1 style={{ margin:'8px 0', fontSize:36, fontWeight:900 }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                                 <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.15)', padding:'6px 12px', borderRadius:10, width:'fit-content' }}>
                                    <div style={{ width:6, height:6, borderRadius:3, background:'#fff' }}/>
                                    <span style={{ fontSize:11, fontWeight:800 }}>{drawer.debtBalance > 0 ? 'Settlement Pending' : 'Clear Account'}</span>
                                 </div>
                              </div>
                              <div style={{ background:'#fff', border:`1px solid ${T.border}`, padding:20, borderRadius:28, textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                                 <div style={{ width:50, height:50, borderRadius:25, background:getRank(drawer.debtBalance).bg, color:getRank(drawer.debtBalance).color, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'2px solid #fff', boxShadow:T.shadow }}>
                                    <Star size={24} fill="currentColor"/>
                                 </div>
                                 <p style={{ margin:0, fontSize:9, fontWeight:900, color:T.txt3 }}>LOYALTY RANK</p>
                                 <h3 style={{ margin:'2px 0 0', fontSize:18, fontWeight:900, color:getRank(drawer.debtBalance).color }}>{getRank(drawer.debtBalance).label}</h3>
                              </div>
                           </div>

                           <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:24, padding:24 }}>
                              <h4 style={{ margin:'0 0 16px', fontSize:13, fontWeight:900, display:'flex', alignItems:'center', gap:8 }}><TrendingUp size={16} color={T.accent}/> Settle Outstanding</h4>
                              <form onSubmit={payDebt} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                                 <div style={{ position:'relative' }}>
                                    <span style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', fontWeight:900, fontSize:22, color:T.txt3 }}>₦</span>
                                    <input style={{...sx.input, height:60, paddingLeft:40, fontSize:28, fontWeight:900, border:`1px solid ${T.borderDk}`}} type="number" placeholder="0.00" value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                                 </div>
                                 <div style={{ display:'flex', gap:10 }}>
                                    {['Cash', 'Transfer'].map(m => (
                                       <button key={m} type="button" onClick={()=>setPayMethod(m as any)} style={{ flex:1, border:`1px solid ${payMethod===m?T.accent:T.border}`, borderRadius:14, padding:'14px 0', fontSize:13, fontWeight:800, background:payMethod===m?T.accentLt:'#fff', color:payMethod===m?T.accent:T.txt2, transition:'0.2s' }}>{m}</button>
                                    ))}
                                 </div>
                                 <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', justifyContent:'center', height:60, fontSize:16, boxShadow:T.shadowLg}}>{loading ? 'Processing...' : 'Record Payment Now ✓'}</button>
                              </form>
                           </div>
                        </div>
                     )}

                     {/* 2. TRANSACTION VAULT */}
                     {dTab === 'vault' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                              <h3 style={{ margin:0, fontSize:15, fontWeight:900 }}>Statement Vault</h3>
                              <button style={{ border:'none', background:T.surface2, padding:'6px 12px', borderRadius:8, fontSize:10, fontWeight:900, color:T.accent }}>Export PDF</button>
                           </div>
                           {customerItems.length > 0 ? customerItems.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(tx => (
                              <div key={tx.id} onClick={()=>navigate(`/receipt/${tx.id}`)} style={{ background:'#fff', padding:16, borderRadius:20, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:16, cursor:'pointer' }}>
                                 <div style={{ width:44, height:44, borderRadius:12, background:tx.type==='Return' ? T.dangerLt: tx.type==='Debt' ? T.warnLt : T.successLt, color:tx.type==='Return'?T.danger: tx.type==='Debt' ? T.warn : T.success, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    {tx.type==='Return' ? <ArrowLeft size={18}/> : <Zap size={18}/>}
                                 </div>
                                 <div style={{ flex:1 }}>
                                    <p style={{ margin:0, fontSize:14, fontWeight:900 }}>{tx.type} Transaction</p>
                                    <p style={{ margin:0, fontSize:11, color:T.txt3, fontWeight:600 }}>{new Date(tx.date).toLocaleDateString([], { month:'long', day:'numeric', year:'numeric' })}</p>
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <p style={{ margin:0, fontSize:16, fontWeight:900, color:tx.type==='Return'?T.danger:T.txt }}>₦{tx.totalPrice.toLocaleString()}</p>
                                    <p style={{ margin:0, fontSize:9, fontWeight:800, color:T.txt3 }}>{tx.status || 'COMPLETED'}</p>
                                 </div>
                              </div>
                           )) : (
                              <div style={{ textAlign:'center', padding:'60px 40px', background:'#fff', borderRadius:24, border:`1px dashed ${T.borderDk}` }}>
                                 <History size={40} color={T.txt3} style={{marginBottom:16, opacity:0.3}}/>
                                 <p style={{margin:0, fontSize:14, fontWeight:800, color:T.txt3}}>No Activity Found</p>
                                 <p style={{margin:0, fontSize:11, color:T.txt3, opacity:0.6}}>Transactions will appear once recorded</p>
                              </div>
                           )}
                        </div>
                     )}

                     {/* 3. DIGITAL IDENTITY */}
                     {dTab === 'identity' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                           <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color:'#fff', padding:32, borderRadius:32, position:'relative', overflow:'hidden', boxShadow:T.shadowLg }}>
                              <div style={{ position:'absolute', top:0, right:0, width:150, height:150, background:T.accent, opacity:0.1, filter:'blur(60px)', borderRadius:'50%' }}/>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
                                 <div>
                                    <h4 style={{ margin:0, fontSize:12, fontWeight:900, letterSpacing:'0.2em', opacity:0.6 }}>{appSettings.companyName?.toUpperCase() || 'BAKERY SYSTEM'}</h4>
                                    <p style={{ margin:0, fontSize:9, fontWeight:700, opacity:0.4 }}>SINCE 2024 • GLOBAL PARTNER</p>
                                 </div>
                                 <ShieldCheck size={28} color={T.accent}/>
                              </div>
                              <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                                 <div style={{ width:74, height:74, borderRadius:20, background:'#fff', overflow:'hidden', border:'4px solid rgba(255,255,255,0.2)' }}>
                                    {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#1e293b', fontWeight:900, fontSize:28}}>{drawer.name[0]}</div>}
                                 </div>
                                 <div>
                                    <h3 style={{ margin:0, fontSize:20, fontWeight:900 }}>{drawer.name}</h3>
                                    <p style={{ margin:0, fontSize:10, fontWeight:800, color:T.accent, letterSpacing:'0.1em' }}>AUTHORIZED DISTRIBUTOR</p>
                                 </div>
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:40 }}>
                                 <div>
                                    <p style={{ margin:0, fontSize:8, opacity:0.4, fontWeight:900 }}>DIGITAL SERIAL</p>
                                    <p style={{ margin:0, fontSize:12, fontWeight:900, fontFamily:'monospace' }}>BR-{drawer.id.slice(0,8).toUpperCase()}</p>
                                 </div>
                                 <div style={{ background:'#fff', padding:6, borderRadius:12 }}>
                                    <QRCode value={drawer.id} size={50} />
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', background:'#fff', color:T.txt, border:`1px solid ${T.border}`, justifyContent:'center'}}><Download size={16}/> Download ID Card</button>
                        </div>
                     )}

                     {/* 4. COMPLIANCE (CERTIFICATE) */}
                     {dTab === 'compliance' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                           <div style={{ background: '#fff', border: `12px double #1e293b`, padding: 40, textAlign: 'center', position: 'relative', boxShadow:T.shadowLg }}>
                              <div style={{ position:'absolute', top:20, right:20 }}><Award size={40} color="#1e293b" opacity={0.1}/></div>
                              <Globe size={40} color="#1e293b" style={{ marginBottom: 20 }} />
                              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, letterSpacing:'0.2em' }}>CERTIFICATE OF PARTNERSHIP</h4>
                              <p style={{ fontSize: 10, margin: '14px 0', opacity: 0.6, fontStyle:'italic' }}>THIS DOCUMENT HEREBY CERTIFIES THAT</p>
                              <h2 style={{ margin: '10px 0', fontSize: 24, fontWeight: 900, color:'#1e293b', borderBottom:'2px solid #1e293b', display:'inline-block', paddingBottom:4 }}>{drawer.name}</h2>
                              <p style={{ fontSize: 11, margin: '20px auto', maxWidth:'80%', opacity: 0.8, lineHeight:1.6 }}>is an accredited distributor and trusted partner of <b>{appSettings.companyName || 'The Bakery System'}</b>, entitled to all benefits and privileges of the Partner Network.</p>
                              <div style={{ background:T.bg, padding:'12px 20px', borderRadius:8, margin:'24px 0', fontSize:10, fontWeight:800, letterSpacing:'0.1em', display:'inline-block' }}>LICENSE NO: BR-CERT-{drawer.id.slice(0,6).toUpperCase()}</div>
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontWeight:900, marginTop:30, borderTop:`1px solid #1e293b`, paddingTop:14 }}>
                                 <div style={{ textAlign:'left' }}>
                                    <span style={{opacity:0.6}}>ISSUED DATE:</span><br/>{new Date().toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' })}
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <span style={{opacity:0.6}}>DIRECTOR SIGNATURE:</span><br/>____________________
                                 </div>
                              </div>
                           </div>
                           <button style={{...sx.btn, width:'100%', background:T.accent, justifyContent:'center'}}><Download size={16}/> Download Official Certificate</button>
                        </div>
                     )}

                     {/* 5. CONFIG / ADMIN */}
                     {dTab === 'config' && (
                        <form onSubmit={saveEdit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <h3 style={{ margin:0, fontSize:15, fontWeight:900 }}>Account Configuration</h3>
                              <button type="submit" disabled={loading} style={{ background:T.success, color:'#fff', border:'none', borderRadius:10, padding:'6px 14px', fontSize:11, fontWeight:900, cursor:'pointer' }}>{loading ? 'Saving...' : 'Sync Changes'}</button>
                           </div>

                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>DISPLAY NAME</label><input style={sx.input} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>SECURITY PIN</label><input style={{...sx.input, textAlign:'center', letterSpacing:'0.2em'}} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value)}/></div>
                           </div>

                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>LOGIN USERNAME</label><input style={sx.input} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>MANAGED PASSWORD</label><input style={sx.input} value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                           
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>MOBILE CONTACT</label><input style={sx.input} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                              <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>ASSIGNED ROUTE</label>
                                 <select style={sx.input} value={eSup} onChange={e=>setESup(e.target.value)}>
                                    <option value="">Direct / Walk-in</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>LOCATION / ADDRESS</label><input style={sx.input} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                           <div><label style={{fontSize:10, fontWeight:800, color:T.txt3, display:'block', marginBottom:6}}>INTERNAL NOTES</label><textarea style={{...sx.input, minHeight:80, resize:'none'}} value={eNote} onChange={e=>setENote(e.target.value)}/></div>
                           
                           <div style={{ paddingTop:20, borderTop:`1px solid ${T.border}`, marginTop:10 }}>
                              <p style={{ margin:'0 0 12px', fontSize:11, fontWeight:800, color:T.danger }}>Dangerous Actions</p>
                              <button type="button" style={{ ...sx.btn, background:T.dangerLt, color:T.danger, width:'100%', justifyContent:'center' }}><Lock size={16}/> Suspend Partner Account</button>
                           </div>
                        </form>
                     )}
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        {/* ADD PARTNER MODAL */}
        <AnimatePresence>
           {isAdding && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.8)', backdropFilter:'blur(12px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} style={{ background:'#fff', width:'100%', maxWidth:440, borderRadius:32, padding:32, position:'relative', boxShadow:T.shadowLg }}>
                    <button onClick={()=>setIsAdding(false)} style={{ position:'absolute', top:24, right:24, border:'none', background:T.surface2, width:36, height:36, borderRadius:12, cursor:'pointer' }}><X size={18}/></button>
                    <div style={{ textAlign:'center', marginBottom:28 }}>
                       <div style={{ width:56, height:56, background:T.accentLt, color:T.accent, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><UserPlus size={28}/></div>
                       <h2 style={{ margin:0, fontSize:22, fontWeight:900 }}>Onboard New Partner</h2>
                       <p style={{ margin:0, fontSize:13, color:T.txt3, fontWeight:600 }}>Create an elite distributor profile</p>
                    </div>
                    <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                       <input style={sx.input} placeholder="Legal Full Name" value={fName} onChange={e=>setFName(e.target.value)} required/>
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <input style={sx.input} placeholder="Primary Phone" value={fPhone} onChange={e=>setFPhone(e.target.value)}/>
                          <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                             <option value="">Select Supplier Route</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                       </div>
                       <div style={{ background:T.surface2, padding:20, borderRadius:20, display:'flex', flexDirection:'column', gap:12, border:`1px solid ${T.border}` }}>
                          <p style={{ margin:0, fontSize:10, fontWeight:900, color:T.txt3, letterSpacing:'0.05em' }}>🔐 CLOUD ACCESS (OPTIONAL)</p>
                          <input style={sx.input} placeholder="Official Email (Login Identifier)" value={fEmail} onChange={e=>setFEmail(e.target.value)}/>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                             <input style={sx.input} placeholder="Create Password" value={fPassword} onChange={e=>setFPassword(e.target.value)}/>
                             <input style={{...sx.input, textAlign:'center'}} placeholder="4-Digit PIN" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/>
                          </div>
                       </div>
                       <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:56, justifyContent:'center', fontSize:16, marginTop:10, boxShadow:T.shadowLg}}>{loading ? 'Initializing Cloud Sync...' : 'Confirm Registration ✓'}</button>
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
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(10px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <div style={{ background:'#fff', borderRadius:28, padding:32, width:'100%', maxWidth:350, textAlign:'center' }}>
                    <div style={{ width:60, height:60, background:T.successLt, color:T.success, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:T.shadow }}><CheckCircle2 size={32} /></div>
                    <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:900 }}>Account Enabled</h2>
                    <p style={{ margin:'0 0 24px', fontSize:13, fontWeight:600, color:T.txt3 }}>Partner credentials have been synced to the database</p>
                    <div style={{ background:T.surface2, padding:20, borderRadius:20, textAlign:'left', fontSize:13, display:'flex', flexDirection:'column', gap:12 }}>
                       <div><p style={{margin:0, fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.05em'}}>SYSTEM LOGIN</p><p style={{margin:0, fontWeight:800}}>{createdCreds.login}</p></div>
                       <div><p style={{margin:0, fontSize:9, fontWeight:900, color:T.txt3, letterSpacing:'0.05em'}}>SECURE PASSWORD</p><p style={{margin:0, fontWeight:800, fontFamily:'monospace', letterSpacing:'0.1em'}}>{createdCreds.password}</p></div>
                    </div>
                    <button onClick={()=>setCreatedCreds(null)} style={{...sx.btn, width:'100%', marginTop:24, height:50, justifyContent:'center'}}>Great, Thanks!</button>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;