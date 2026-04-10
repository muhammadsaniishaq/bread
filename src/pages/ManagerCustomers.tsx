import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Lock, Camera,
  Award, ShieldCheck, History, TrendingUp, Zap, 
  Star, CreditCard, ChevronRight, Activity, Filter, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─── Executive Design Tokens (Compact Edition) ─── */
const T = {
  bg:        '#fdfdfe', 
  surface:   '#ffffff',
  surface2:  '#f8fafc',
  border:    '#f1f5f9',
  borderDk:  '#e2e8f0',
  accent:    '#6366f1',
  accentDk:  '#4f46e5',
  accentLt:  '#f5f3ff',
  success:   '#10b981',
  danger:    '#ef4444',
  warn:      '#f59e0b',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  shadow:    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadowLg:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  radius:    '12px',
  radiusLg:  '20px',
};

const getRank = (debt: number) => {
  if (debt === 0) return { label: 'DIAMOND', color: '#0ea5e9', bg: '#e0f2fe' };
  if (debt < 50000) return { label: 'GOLD', color: '#f59e0b', bg: '#fef3c7' };
  return { label: 'SILVER', color: '#64748b', bg: '#f1f5f9' };
};

const getAvatar = (name: string) => {
  const palette = [['#6366f1','#e0e7ff'], ['#0ea5e9','#e0f2fe'], ['#10b981','#d1fae5']];
  return palette[name.charCodeAt(0) % palette.length];
};

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment, refreshData } = useAppContext();
  const navigate = useNavigate();

  /* State */
  const [search, setSearch]       = useState('');
  const [isAdding, setIsAdding]   = useState(false);
  const [suppliers, setSuppliers] = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]     = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{name:string; login:string; password:string}|null>(null);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* Add form */
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fSup, setFSup]   = useState('');
  const [fPin, setFPin]   = useState('');

  /* Drawer */
  const [drawerId, setDrawerId] = useState<string|null>(null);
  const drawer = useMemo(() => customers.find(c => c.id === drawerId), [customers, drawerId]);
  const [dTab, setDTab]         = useState<'profile'|'ledger'|'history'|'docs'>('profile');
  const [editing, setEditing]   = useState(false);
  
  const [eName, setEName]       = useState('');
  const [ePhone]                 = useState('');
  const [eEmail]                 = useState('');
  const [eUsername, setEUsername] = useState('');
  const [ePassword]              = useState('');
  const [eLocation, setELocation] = useState('');
  const [eImage, setEImage]       = useState('');
  const [eSup]                   = useState('');
  const [ePin, setEPin]           = useState('');
  
  const [payAmt, setPayAmt]     = useState('');
  const [payMethod, setPayMethod] = useState<'Cash'|'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER')
      .then(({data}) => { if (data) setSuppliers(data); });
  }, []);

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

  /* Actions */
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
        await addCustomer({ id:uid, profile_id:uid, name:fName, email:fEmail, phone:fPhone, username:fUsername||fEmail.split('@')[0], location:fLocation, debtBalance:0, loyaltyPoints:0, assignedSupplierId:fSup||undefined, pin:fPin||undefined, notes: '' });
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
      await updateCustomer({ ...drawer, name:eName, phone:ePhone, email:eEmail, username:eUsername, password:ePassword, location:eLocation, image:eImage, assignedSupplierId:eSup||undefined, pin:ePin||undefined } as any);
      setEditing(false); await refreshData();
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
    card: { background:'#fff', border:`1px solid ${T.border}`, borderRadius:T.radius, padding:'10px 14px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' } as React.CSSProperties,
    input: { background:'#fff', border:`1px solid ${T.borderDk}`, borderRadius:'10px', padding:'10px 12px', fontSize:'13px', width:'100%', outline:'none', fontWeight:500 } as React.CSSProperties,
    btn: { background:T.accent, color:'#fff', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' } as React.CSSProperties,
  };

  return (
    <AnimatedPage>
      <div style={{ background:T.bg, minHeight:'100vh', paddingBottom:'100px', color:T.txt, fontFamily:"'Inter', system-ui, sans-serif" }}>
        
        {/* COMPACT TOP BAR */}
        <div style={{ padding:'16px 16px 8px', position:'sticky', top:0, background:'rgba(253,253,254,0.8)', backdropFilter:'blur(20px)', zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <button onClick={() => navigate(-1)} style={{ width:34, height:36, borderRadius:10, border:`1px solid ${T.borderDk}`, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ArrowLeft size={16} />
            </button>
            <div style={{ flex:1 }}>
              <h1 style={{ margin:0, fontSize:'18px', fontWeight:900, letterSpacing:'-0.03em' }}>Executive Manager</h1>
              <p style={{ margin:0, fontSize:'11px', color:T.txt3, fontWeight:600 }}>Partners • {stats.count}</p>
            </div>
            <button onClick={() => setIsAdding(!isAdding)} style={{ ...sx.btn, padding:'8px 12px' }}><UserPlus size={14}/> Add New</button>
          </div>

          {/* COMPACT STAT TICKER */}
          <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'8px' }} className="hide-scrollbar">
             {[
               { label:'Liability', val:stats.total, color:T.danger, icon:TrendingUp },
               { label:'Partners', val:stats.count, color:T.accent, icon:CreditCard },
               { label:'Retained', val:stats.active, color:T.success, icon:Activity }
             ].map((s,i) => (
                <div key={i} style={{ flexShrink:0, background:'#fff', border:`1px solid ${T.border}`, padding:'10px 16px', borderRadius:10, display:'flex', alignItems:'center', gap:10, minWidth:'120px' }}>
                   <div style={{ background:s.color+'10', color:s.color, padding:6, borderRadius:8 }}><s.icon size={12}/></div>
                   <div>
                      <p style={{ margin:0, fontSize:9, fontWeight:800, color:T.txt3, textTransform:'uppercase' }}>{s.label}</p>
                      <p style={{ margin:0, fontSize:13, fontWeight:900 }}>{typeof s.val==='number' && s.val > 100 ? '₦'+s.val.toLocaleString() : s.val}</p>
                   </div>
                </div>
             ))}
          </div>

          {/* SEARCH & FILTER */}
          <div style={{ position:'relative', marginTop:'8px' }}>
            <Search size={14} color={T.txt3} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
            <input 
              style={{ ...sx.input, paddingLeft:36, height:42, fontSize:14, border:`1px solid ${T.border}` }} 
              placeholder="Search directory..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'flex', gap:8 }}>
               <Filter size={14} color={T.txt3}/>
            </div>
          </div>
        </div>

        {/* COMPACT BENTO LIST */}
        <div style={{ padding:'8px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'10px' }}>
           {list.map(c => {
             const [ac, lc] = getAvatar(c.name);
             const rank = getRank(c.debtBalance);
             return (
               <motion.div 
                 key={c.id} 
                 layoutId={c.id}
                 onClick={() => setDrawerId(c.id)}
                 whileTap={{ scale:0.97 }} 
                 style={{ ...sx.card, flexDirection:'column', alignItems:'flex-start', padding:'14px' }}
               >
                 <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginBottom:12 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, border:'2px solid #fff', boxShadow:T.shadow }}>
                       {c.image ? <img src={c.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : c.name[0]}
                    </div>
                    <div style={{ background:rank.bg, color:rank.color, fontSize:8, fontWeight:900, padding:'2px 6px', borderRadius:4 }}>{rank.label}</div>
                 </div>
                 <div style={{ flex:1, width:'100%' }}>
                    <h3 style={{ margin:0, fontSize:13, fontWeight:800, color:T.txt, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</h3>
                    <p style={{ margin:'2px 0 8px', fontSize:10, color:T.txt3, fontWeight:600 }}>{c.phone || '@'+c.username}</p>
                 </div>
                 <div style={{ width:'100%', paddingTop:8, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div style={{ fontSize:14, fontWeight:900, color:c.debtBalance > 0 ? T.danger : T.success }}>₦{(c.debtBalance||0).toLocaleString()}</div>
                    <ChevronRight size={12} color={T.txt3}/>
                 </div>
               </motion.div>
             );
           })}
        </div>

        {/* EXECUTIVE DRAWER (Compact Edition) */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDrawerId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:100 }}/>
               <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:30, stiffness:300}} style={{ position:'fixed', bottom:0, left:0, right:0, height:'85vh', background:'#fff', zIndex:110, borderTopLeftRadius:24, borderTopRightRadius:24, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  
                  <div style={{ height:4, width:40, background:T.borderDk, borderRadius:2, margin:'12px auto' }}/>

                  <div style={{ padding:'0 20px 16px', display:'flex', alignItems:'center', gap:12 }}>
                     <div style={{ position: 'relative' }}>
                        <div style={{ width:48, height:48, borderRadius:14, background:getAvatar(drawer.name)[1], color:getAvatar(drawer.name)[0], display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, overflow:'hidden' }}>
                           {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : drawer.name[0]}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} style={{ position:'absolute', bottom:-4, right:-4, background:T.accent, color:'#fff', border:`2px solid #fff`, borderRadius:8, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadow }}>
                           <Camera size={12}/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                     </div>
                     <div style={{ flex:1 }}>
                        <h2 style={{ margin:0, fontSize:18, fontWeight:900 }}>{drawer.name}</h2>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                           <span style={{ fontSize:11, color:T.txt3, fontWeight:600 }}>ID: {drawer.id.slice(0,6)}</span>
                           <span style={{ fontSize:10, background:T.success+'20', color:T.success, padding:'1px 6px', borderRadius:4, fontWeight:900 }}>VERIFIED</span>
                        </div>
                     </div>
                     <button onClick={()=>setDrawerId(null)} style={{ border:'none', background:T.surface2, width:36, height:36, borderRadius:10 }}><X size={18}/></button>
                  </div>

                  <div style={{ display:'flex', padding:'4px', background:T.surface2, margin:'0 20px 20px', borderRadius:12 }}>
                     {[
                       { id:'profile', icon:User, label:'Admin' },
                       { id:'ledger', icon:CreditCard, label:'Ledger' },
                       { id:'history', icon:History, label:'Vault' },
                       { id:'docs', icon:Award, label:'Docs' },
                     ].map(t => (
                       <button key={t.id} onClick={()=>setDTab(t.id as any)} style={{ flex:1, border:'none', borderRadius:10, padding:'8px 0', background:dTab===t.id ? '#fff' : 'transparent', color:dTab===t.id ? T.accent : T.txt3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:11, fontWeight:800, transition:'0.2s', boxShadow:dTab===t.id ? T.shadow : 'none' }}>
                          <t.icon size={13}/> {t.label}
                       </button>
                     ))}
                  </div>

                  <div style={{ flex:1, overflowY:'auto', padding:'0 20px 40px' }} className="hide-scrollbar">
                     {dTab === 'profile' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                              <div style={{ background:T.surface2, padding:12, borderRadius:12 }}>
                                 <p style={{ margin:0, fontSize:9, color:T.txt3, fontWeight:800 }}>PHONE</p>
                                 <p style={{ margin:'2px 0 0', fontSize:13, fontWeight:700 }}>{drawer.phone||'N/A'}</p>
                              </div>
                              <div style={{ background:T.surface2, padding:12, borderRadius:12 }}>
                                 <p style={{ margin:0, fontSize:9, color:T.txt3, fontWeight:800 }}>ALIAS</p>
                                 <p style={{ margin:'2px 0 0', fontSize:13, fontWeight:700 }}>@{drawer.username||'none'}</p>
                              </div>
                           </div>
                           <div style={{ background:T.accentLt, padding:14, borderRadius:14 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                 <ShieldCheck size={16} color={T.accent}/>
                                 <div>
                                    <p style={{ margin:0, fontSize:12, fontWeight:800 }}>Managed Cloud Security</p>
                                    <p style={{ margin:0, fontSize:10, color:T.txt2 }}>PIN: {drawer.pin || '----'} • PWD: {(drawer as any).password || 'Ext'}</p>
                                 </div>
                              </div>
                           </div>
                           <div style={{ paddingTop:8 }}>
                              <button onClick={()=>setEditing(true)} style={{ ...sx.btn, width:'100%', background:T.surface, color:T.accent, border:`1px solid ${T.accent}`, justifyContent:'center' }}>Configure Partner Settings</button>
                           </div>
                        </div>
                     )}

                     {dTab === 'ledger' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ background: drawer.debtBalance > 0 ? T.danger : T.success, padding:30, borderRadius:20, color:'#fff', textAlign:'center' }}>
                              <p style={{ margin:0, fontSize:10, fontWeight:800, opacity:0.8, textTransform:'uppercase' }}>Statement</p>
                              <h1 style={{ margin:'4px 0', fontSize:32, fontWeight:900 }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                              <p style={{ margin:0, fontSize:10, fontWeight:700 }}>{drawer.debtBalance > 0 ? 'Urgent Settlement' : 'Clear Standing'}</p>
                           </div>
                           <form onSubmit={payDebt} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                              <input style={{...sx.input, height:48, fontSize:20, textAlign:'center', fontWeight:900}} type="number" placeholder="Enter amount..." value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                              <div style={{ display:'flex', gap:8 }}>
                                 <button type="button" onClick={()=>setPayMethod('Cash')} style={{ flex:1, border:`1px solid ${payMethod==='Cash'?T.accent:T.border}`, borderRadius:10, padding:10, fontSize:12, fontWeight:800, background:payMethod==='Cash'?T.accentLt:'#fff' }}>Cash</button>
                                 <button type="button" onClick={()=>setPayMethod('Transfer')} style={{ flex:1, border:`1px solid ${payMethod==='Transfer'?T.accent:T.border}`, borderRadius:10, padding:10, fontSize:12, fontWeight:800, background:payMethod==='Transfer'?T.accentLt:'#fff' }}>Transfer</button>
                              </div>
                              <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', justifyContent:'center', height:48}}>Confirm Deposit</button>
                           </form>
                        </div>
                     )}

                     {dTab === 'history' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                           {customerItems.length > 0 ? customerItems.slice(0,10).map(tx => (
                              <div key={tx.id} onClick={()=>navigate(`/receipt/${tx.id}`)} style={{ padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                                 <div style={{ width:34, height:34, borderRadius:8, background:tx.type==='Return' ? T.danger+'10' : T.success+'10', color:tx.type==='Return'?T.danger:T.success, display:'flex', alignItems:'center', justifyContent:'center' }}><Zap size={14}/></div>
                                 <div style={{ flex:1 }}>
                                    <p style={{ margin:0, fontSize:12, fontWeight:800 }}>{tx.type} Order</p>
                                    <p style={{ margin:0, fontSize:10, color:T.txt3 }}>{new Date(tx.date).toLocaleDateString([], { month:'short', day:'numeric' })}</p>
                                 </div>
                                 <div style={{ textAlign:'right' }}>
                                    <p style={{ margin:0, fontSize:13, fontWeight:900 }}>₦{tx.totalPrice.toLocaleString()}</p>
                                 </div>
                              </div>
                           )) : (
                              <div style={{ textAlign:'center', padding:40, opacity:0.4 }}><History size={32} style={{marginBottom:10}}/><p style={{fontSize:12, fontWeight:700}}>Empty History Vault</p></div>
                           )}
                        </div>
                     )}

                     {dTab === 'docs' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                           <div style={{ background:'#1e293b', color:'#fff', padding:20, borderRadius:16, position:'relative' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                                 <span style={{ fontSize:9, fontWeight:900, opacity:0.6 }}>EXECUTIVE ID</span>
                                 <Lock size={12} opacity={0.6}/>
                              </div>
                              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                                 <div style={{ width:50, height:50, borderRadius:12, background:'#fff', overflow:'hidden' }}>
                                    {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', color:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>{drawer.name[0]}</div>}
                                 </div>
                                 <div><p style={{margin:0, fontSize:14, fontWeight:900}}>{drawer.name}</p><p style={{margin:0, fontSize:9, color:T.accent, fontWeight:800}}>AUTHORIZED</p></div>
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20 }}>
                                 <div style={{ fontSize:10, fontWeight:700, opacity:0.6 }}>BR-{drawer.id.slice(0,6).toUpperCase()}</div>
                                 <div style={{ background:'#fff', padding:2, borderRadius:4 }}><QRCode value={drawer.id} size={30}/></div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        <ImageCropModal isOpen={showCropper} imageSrc={cropImageSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />
        
        {/* ADD EDIT MODAL (Sleek Compact) */}
        <AnimatePresence>
           {isAdding && (
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} style={{ position:'fixed', inset:0, background:'#fff', zIndex:200, padding:20, display:'flex', flexDirection:'column' }}>
                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                    <h2 style={{ margin:0, fontWeight:900, fontSize:18 }}>Partner Intake</h2>
                    <button onClick={()=>setIsAdding(false)} style={{ border:'none', background:T.surface2, width:36, height:36, borderRadius:10 }}><X size={18}/></button>
                 </div>
                 <form onSubmit={handleAdd} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }} className="hide-scrollbar">
                    <input style={sx.input} placeholder="Legal Full Name" value={fName} onChange={e=>setFName(e.target.value)} required/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                       <input style={sx.input} placeholder="Mobile Contact" value={fPhone} onChange={e=>setFPhone(e.target.value)}/>
                       <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                          <option value="">Direct / Walk-in</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                       </select>
                    </div>
                    <div style={{ background:T.surface2, padding:14, borderRadius:14, display:'flex', flexDirection:'column', gap:10 }}>
                       <p style={{ margin:0, fontSize:9, fontWeight:900, color:T.txt3 }}>CLOUD AUTH (OPTIONAL)</p>
                       <input style={sx.input} placeholder="Email" value={fEmail} onChange={e=>setFEmail(e.target.value)}/>
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <input style={sx.input} placeholder="Password" value={fPassword} onChange={e=>setFPassword(e.target.value)}/>
                          <input style={{...sx.input, textAlign:'center'}} placeholder="4-Digit PIN" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/>
                       </div>
                    </div>
                    <div style={{ flex:1 }}/>
                    <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:48, justifyContent:'center'}}>Register Partner ✓</button>
                    <button type="button" onClick={()=>setIsAdding(false)} style={{ border:'none', background:'none', color:T.txt3, fontWeight:700, fontSize:11 }}>Cancel Registration</button>
                 </form>
              </motion.div>
           )}

           {editing && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(10px)', zIndex:200, padding:20, display:'flex', flexDirection:'column' }}>
                 <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
                    <h2 style={{ margin:0, fontWeight:900, fontSize:18 }}>Partner Config</h2>
                    <button onClick={()=>setEditing(false)} style={{ border:'none', background:T.surface2, width:36, height:36, borderRadius:10 }}><X size={18}/></button>
                 </div>
                 <form onSubmit={saveEdit} style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                    <div><label style={{fontSize:9, fontWeight:900, color:T.txt3}}>DISPLAY NAME</label><input style={sx.input} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                       <div><label style={{fontSize:9, fontWeight:900, color:T.txt3}}>ALIAS</label><input style={sx.input} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                       <div><label style={{fontSize:9, fontWeight:900, color:T.txt3}}>SECURITY PIN</label><input style={sx.input} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value)}/></div>
                    </div>
                    <div><label style={{fontSize:9, fontWeight:900, color:T.txt3}}>REGION / LOC</label><input style={sx.input} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                    <div style={{ flex:1 }}/>
                    <button type="submit" disabled={loading} style={{...sx.btn, width:'100%', height:48, justifyContent:'center'}}>Sync Profile Updates</button>
                 </form>
              </motion.div>
           )}
        </AnimatePresence>

        {/* CREDENTIALS SUCCESS */}
        <AnimatePresence>
           {createdCreds && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                 <div style={{ background:'#fff', borderRadius:20, padding:24, width:'100%', maxWidth:320, textAlign:'center' }}>
                    <div style={{ width:50, height:50, background:T.success+'10', color:T.success, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><Star size={24} /></div>
                    <h2 style={{ margin:'0 0 4px', fontSize:18, fontWeight:900 }}>Account Linked</h2>
                    <p style={{ margin:'0 0 20px', fontSize:11, fontWeight:600, color:T.txt3 }}>Partner credentials are now live</p>
                    <div style={{ background:T.surface2, padding:16, borderRadius:12, textAlign:'left', fontSize:12, display:'flex', flexDirection:'column', gap:8 }}>
                       <div><p style={{margin:0, fontSize:8, fontWeight:900, color:T.txt3}}>LOGIN</p><p style={{margin:0, fontWeight:800}}>{createdCreds.login}</p></div>
                       <div><p style={{margin:0, fontSize:8, fontWeight:900, color:T.txt3}}>SECURE PWD</p><p style={{margin:0, fontWeight:800, fontFamily:'monospace'}}>{createdCreds.password}</p></div>
                    </div>
                    <button onClick={()=>setCreatedCreds(null)} style={{...sx.btn, width:'100%', marginTop:20, justifyContent:'center'}}>Done ✓</button>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;