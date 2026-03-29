import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Camera, Lock, Globe,
  Award, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─── Design Tokens ─── */
const T = {
  bg:        '#f2f3f7',
  surface:   '#ffffff',
  surface2:  '#f8f9fc',
  border:    '#e8eaef',
  accent:    '#4f46e5',
  accentLt:  '#eef2ff',
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
  shadowLg:  '0 8px 40px rgba(0,0,0,0.1)',
  radius:    '16px',
  radiusLg:  '24px',
  radiusXl:  '32px',
};

const avatarPalette = [
  ['#4f46e5','#e0e7ff'], ['#0891b2','#e0f7fa'], ['#059669','#d1fae5'],
  ['#d97706','#fef3c7'], ['#dc2626','#fee2e2'], ['#7c3aed','#ede9fe'],
];
const getAvatar = (name: string) => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

export const ManagerCustomers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, recordDebtPayment, appSettings } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* State */
  const [search, setSearch]           = useState('');
  const [selectedIds]                 = useState<string[]>([]);
  const [isAdding, setIsAdding]       = useState(false);
  const [suppliers, setSuppliers]     = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]         = useState(false);

  // Avatar / Cropping
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  /* Add form */
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fSup, setFSup]   = useState('');
  const [fPin, setFPin]   = useState('');
  const [fNote, setFNote] = useState('');

  /* Drawer */
  const [drawerId, setDrawerId]   = useState<string|null>(null);
  const drawer = useMemo(() => customers.find(c => c.id === drawerId), [customers, drawerId]);
  const [dTab, setDTab]           = useState<'profile'|'ledger'|'docs'>('profile');
  const [editing, setEditing]     = useState(false);
  
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
  
  const [payAmt, setPayAmt]       = useState('');
  const [payMethod, setPayMethod] = useState<'Cash'|'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER')
      .then(({data}) => { if (data) setSuppliers(data); });
  }, []);

  const list = useMemo(() => {
    let r = customers.filter(c => {
      const q = search.toLowerCase();
      if (!(c.name.toLowerCase().includes(q) || (c.phone||'').includes(search) || (c.username||'').toLowerCase().includes(q))) return false;
      return true;
    });
    return [...r].sort((a, b) => Number(b.id) - Number(a.id));
  }, [customers, search]);

  const totalDebt   = customers.reduce((s,c) => s+(c.debtBalance||0), 0);

  /* Actions */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (base64: string) => {
    setEImage(base64);
    setShowCropper(false);
    if (drawer) {
       try {
          await supabase.from('customers').update({ image: base64 }).eq('id', drawer.id);
          await updateCustomer({ ...drawer, image: base64 } as any);
       } catch(e) { console.error(e); }
    }
  };

  const handleAdd = async (e:React.FormEvent) => {
    e.preventDefault(); if(!fName) return;
    setLoading(true);
    try {
      let profile_id = null;
      if (fUsername) {
          const { data: legacyUser, error: legacyErr } = await supabase
             .from('customers')
             .select('*')
             .or(`username.ilike."${fUsername}",email.ilike."${fUsername}"`)
             .maybeSingle();
          
          if (legacyErr && !legacyErr.message.includes('column "username" does not exist')) {
             throw legacyErr;
          }
         
         if (legacyUser) {
            profile_id = legacyUser.profile_id;
          } else {
             const newPid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
             const { error: pErr } = await supabase.from('profiles').insert({
                id: newPid,
                full_name: fName,
                username: fUsername,
                role: 'CUSTOMER'
             });
             if (pErr) throw pErr;
             profile_id = newPid;
          }
      }

      const newCust: any = {
        id: Date.now().toString(), 
        name: fName, 
        phone: fPhone, 
        email: fEmail,
        username: fUsername,
        password: fPassword, // Store manager-set password
        location: fLocation, 
        notes: fNote, 
        debtBalance: 0, 
        loyaltyPoints: 0, 
        assignedSupplierId: fSup||undefined, 
        pin: fPin||undefined,
        profile_id: profile_id || undefined
      };

      await addCustomer(newCust);
      
      const toDB = (c: any) => ({
         id: c.id,
         name: c.name,
         phone: c.phone || null,
         email: c.email || null,
         username: c.username || null,
         password: c.password || null,
         location: c.location || null,
         notes: c.notes || null,
         debt_balance: c.debtBalance,
         loyalty_points: c.loyaltyPoints,
         assignedSupplierId: c.assignedSupplierId || null,
         pin: c.pin || null,
         profile_id: c.profile_id || null,
         image: c.image || null
      });

      const { error: upErr } = await supabase.from('customers').upsert(toDB(newCust));
      if (upErr) throw upErr;

      // Reset
      setFName(''); setFPhone(''); setFEmail(''); setFUsername(''); setFPassword(''); setFLocation(''); setFSup(''); setFPin(''); setFNote(''); setIsAdding(false);
    } catch (err: any) {
       console.error(err);
       alert("Error creating customer: " + (err.message || JSON.stringify(err)));
    } finally {
       setLoading(false);
    }
  };

  const openDrawer = (c:Customer) => {
    setDrawerId(c.id); setEName(c.name); setEPhone(c.phone||''); 
    setEEmail((c as any).email || ''); setEUsername(c.username || '');
    setEPassword((c as any).password || '');
    setELocation(c.location || ''); setEImage(c.image || '');
    setESup(c.assignedSupplierId||'');
    setEPin(c.pin||''); setENote(c.notes||''); setEditing(false); setDTab('profile');
  };

  const saveEdit = async (e:React.FormEvent) => {
    e.preventDefault(); if(!eName||!drawer) return;
    setLoading(true);
    try {
       if (eUsername) {
          await supabase.from('profiles').upsert({
             id: drawer.profile_id || crypto.randomUUID(),
             full_name: eName,
             username: eUsername,
             role: 'CUSTOMER'
          });
       }
       const updated: any = {
          ...drawer, 
          name: eName, phone: ePhone, email: eEmail, username: eUsername, password: ePassword,
          location: eLocation, image: eImage,
          assignedSupplierId: eSup||undefined, pin: ePin||undefined, notes: eNote
       };
       await updateCustomer(updated);

       const toDB = (c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || null,
          email: c.email || null,
          username: c.username || null,
          password: c.password || null,
          location: c.location || null,
          notes: c.notes || null,
          debt_balance: c.debtBalance,
          loyalty_points: c.loyaltyPoints,
          assignedSupplierId: c.assignedSupplierId || null,
          pin: c.pin || null,
          profile_id: c.profile_id || null,
          image: c.image || null
       });

       const { error: upErr } = await supabase.from('customers').upsert(toDB(updated));
       if (upErr) throw upErr;
       setEditing(false);
    } catch (err: any) {
       console.error(err);
       alert("Error updating customer: " + (err.message || JSON.stringify(err)));
    } finally {
       setLoading(false);
    }
  };

  const payDebt = async (e:React.FormEvent) => {
    e.preventDefault(); const amt=Number(payAmt); if(!amt||!drawerId) return;
    await recordDebtPayment({id:Date.now().toString(), date:new Date().toISOString(), customerId:drawerId, amount:amt, method:payMethod});
    setPayAmt('');
  };

  const sx = {
    page: { background: T.bg, minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:'96px' } as React.CSSProperties,
    card: (sel:boolean): React.CSSProperties => ({
      background: T.surface, border: `1.5px solid ${sel ? T.accent : T.border}`,
      borderRadius: T.radius, padding: '16px', boxShadow: sel ? `0 0 0 3px ${T.accentLt}, ${T.shadow}` : T.shadow,
      cursor: 'pointer', transition: 'all 0.2s',
    }),
    input: {
      background: T.surface2, border: `1.5px solid ${T.border}`, borderRadius: '12px', padding: '12px 14px',
      fontSize: '14px', fontWeight: 500, color: T.txt, outline: 'none', width: '100%', boxSizing: 'border-box',
    } as React.CSSProperties,
    btnPrimary: {
      background: T.accent, color:'#fff', border:'none', borderRadius: '12px', padding: '13px 18px',
      fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'7px',
    } as React.CSSProperties,
    btnGhost: {
      background: T.surface, color: T.txt2, border: `1.5px solid ${T.border}`, borderRadius:'12px', padding:'12px 14px',
      fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
    } as React.CSSProperties,
    pill: (act:boolean): React.CSSProperties => ({
      background: act ? T.accent : T.surface, color: act ? '#fff' : T.txt2, border: `1.5px solid ${act ? T.accent : T.border}`,
      borderRadius: '10px', padding: '7px 14px', fontSize:'12px', fontWeight:700, cursor:'pointer',
    }),
    label: { fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px', display:'block' } as React.CSSProperties,
    dInput: {
      background: T.surface2, border: `1.5px solid ${T.border}`, borderRadius:'10px', padding:'11px 14px',
      fontSize:'14px', fontWeight:500, color:T.txt, outline:'none', width:'100%', boxSizing:'border-box',
    } as React.CSSProperties,
  };

  return (
    <AnimatedPage>
      <div style={sx.page}>
        <div style={{ padding: '20px 16px 0' }}>
          {/* HEADER */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <button onClick={() => navigate(-1)} style={{ width:'42px', height:'42px', borderRadius:'12px', background:T.surface, border:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <ArrowLeft size={18} color={T.txt2} />
              </button>
              <div>
                <h1 style={{ fontSize:'20px', fontWeight:900, color:T.txt, margin:0 }}>Customer Base</h1>
                <p style={{ fontSize:'12px', color:T.txt3, margin:0 }}>{customers.length} partners registered</p>
              </div>
            </div>
          </div>

          {/* TOTAL DEBTS BAR (QUICK LOOK) */}
          <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, #6366f1 100%)`, borderRadius: T.radiusXl, padding:'24px', marginBottom:'20px', color:'#fff', boxShadow: T.shadowLg }}>
             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                   <p style={{ opacity:0.7, fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em' }}>Total Receivable</p>
                   <h2 style={{ fontSize:'32px', fontWeight:900, margin:0 }}>₦{totalDebt.toLocaleString()}</h2>
                </div>
                <div style={{ background:'rgba(255,255,255,0.15)', padding:'8px 16px', borderRadius:'12px', backdropFilter:'blur(10px)' }}>
                   <p style={{ margin:0, fontSize:'12px', fontWeight:800 }}>{customers.filter(c => c.debtBalance > 0).length} Debtors</p>
                </div>
             </div>
          </div>

          {/* SEARCH + ADD */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={16} color={T.txt3} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }} />
              <input style={{ ...sx.input, paddingLeft:'42px' }} placeholder="Search name, phone or username..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setIsAdding(!isAdding)} style={sx.btnPrimary}><UserPlus size={16} /> Register</button>
          </div>

          {/* ADD FORM (EXPANDED TO ALL FIELDS) */}
          <AnimatePresence>
            {isAdding && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} style={{ background:'#fff', borderRadius:'24px', border:`1.5px solid ${T.border}`, padding:'24px', marginBottom:'16px', overflow:'hidden', boxShadow:T.shadowLg }}>
                 <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                    <div style={{ background:T.accentLt, color:T.accent, padding:'8px', borderRadius:'10px' }}><ShieldCheck size={18}/></div>
                    <h3 style={{ margin:0, fontSize:'16px', fontWeight:900 }}>Register New Global Client</h3>
                 </div>
                 <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    {/* Part 1: Identity */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                       <div><label style={sx.label}>Partner Full Name *</label><input style={sx.input} value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Aliko Dangote" required/></div>
                       <div><label style={sx.label}>Assigned Route / Supplier</label>
                          <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                             <option value="">Walk-in (No Supplier)</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                       </div>
                    </div>

                    {/* Part 2: Login Details */}
                    <div style={{ background:T.surface2, padding:'16px', borderRadius:'16px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                       <div><label style={{...sx.label, color:T.accent}}>💬 Username</label><input style={sx.input} value={fUsername} onChange={e=>setFUsername(e.target.value)} placeholder="login_name"/></div>
                       <div><label style={{...sx.label, color:T.accent}}>🔐 Password</label><input style={sx.input} value={fPassword} onChange={e=>setFPassword(e.target.value)} placeholder="Security Pwd"/></div>
                       <div><label style={{...sx.label, color:T.accent}}>⭐ 4-Digit PIN</label><input style={{...sx.input, letterSpacing:'0.3em'}} maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))} placeholder="1234"/></div>
                    </div>

                    {/* Part 3: Contact */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                       <div><label style={sx.label}>Phone Number</label><input style={sx.input} type="tel" value={fPhone} onChange={e=>setFPhone(e.target.value)} placeholder="080..."/></div>
                       <div><label style={sx.label}>Email Address</label><input style={sx.input} type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="client@mail.com"/></div>
                       <div><label style={sx.label}>Location / State</label><input style={sx.input} value={fLocation} onChange={e=>setFLocation(e.target.value)} placeholder="e.g. Kano, NG"/></div>
                    </div>

                    <button type="submit" disabled={loading} style={{ ...sx.btnPrimary, justifyContent:'center', padding:'15px' }}>{loading ? 'Initializing Cloud Sync...' : 'Confirm Registration & Sync'}</button>
                 </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIST */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {list.map(c => {
               const [ac, lc] = getAvatar(c.name);
               return (
                 <motion.div key={c.id} style={sx.card(selectedIds.includes(c.id))} onClick={() => openDrawer(c)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                       <div style={{ position:'relative' }}>
                          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, overflow:'hidden', border:`1px solid ${T.border}` }}>
                             {c.image ? <img src={c.image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="P"/> : c.name[0]}
                          </div>
                          {c.username && <div style={{ position:'absolute', top:-4, right:-4, background:T.success, width:12, height:12, borderRadius:'50%', border:`2px solid #fff` }}/>}
                       </div>
                       <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontWeight:800, color:T.txt, fontSize:'15px' }}>{c.name}</p>
                          <p style={{ margin:0, fontSize:'12px', color:T.txt3 }}>{c.username ? `@${c.username}` : (c.phone || 'No Account')}</p>
                       </div>
                       <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontWeight:900, color: c.debtBalance > 0 ? T.danger : T.success }}>₦{c.debtBalance.toLocaleString()}</p>
                          {c.assignedSupplierId && <div style={{ fontSize:'9px', color:T.accent, fontWeight:800, textTransform:'uppercase' }}>Routed</div>}
                       </div>
                    </div>
                 </motion.div>
               );
            })}
          </div>
        </div>

        {/* DRAWER */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:90 }} onClick={()=>setDrawerId(null)}/>
               <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:'420px', background:'#fff', zIndex:100, padding:'24px', boxShadow:T.shadowLg, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                     <h2 style={{ margin:0, fontWeight:900 }}>Partner Profile</h2>
                     <button onClick={()=>setDrawerId(null)} style={{ border:'none', background:T.surface2, width:36, height:36, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
                  </div>
                  
                  {/* Tabs */}
                  <div style={{ display:'flex', gap:'8px', marginBottom:'24px', background:T.surface2, padding:'6px', borderRadius:'14px' }}>
                     <button onClick={()=>setDTab('profile')} style={{ ...sx.pill(dTab==='profile'), flex:1 }}>Admin</button>
                     <button onClick={()=>setDTab('ledger')} style={{ ...sx.pill(dTab==='ledger'), flex:1 }}>Finance</button>
                     <button onClick={()=>setDTab('docs')} style={{ ...sx.pill(dTab==='docs'), flex:1, color:T.accent }}>Docs ✨</button>
                  </div>

                  <div style={{ flex:1, overflowY:'auto', paddingRight:'4px' }} className="hide-scrollbar">
                     {dTab === 'profile' && (
                        editing ? (
                           <form onSubmit={saveEdit} style={{ display:'grid', gap:'16px' }}>
                              {/* Edit Avatar */}
                              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                                 <div style={{ width: '100%', height: '100%', borderRadius: '22px', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.border}`, overflow: 'hidden' }}>
                                    {eImage ? <img src={eImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="P"/> : <div style={{ fontSize: '32px', fontWeight: 900, color: T.accent }}>{eName[0]}</div>}
                                 </div>
                                 <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -10, right: -10, width: '36px', height: '36px', borderRadius: '12px', background: T.accent, color: '#fff', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer' }}><Camera size={14} /></button>
                                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                              </div>

                              <div><label style={sx.label}>Client Name</label><input style={sx.dInput} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                              
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                <div><label style={sx.label}>Username</label><input style={sx.dInput} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                                <div><label style={sx.label}>Pin (4 Digits)</label><input style={{...sx.dInput, letterSpacing:'0.2em'}} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value.replace(/\D/g,''))}/></div>
                              </div>
                              
                              <div><label style={sx.label}>Account Password</label><input style={sx.dInput} value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                              
                              <div><label style={sx.label}>Assigned Supplier</label>
                                 <select style={sx.dInput} value={eSup} onChange={e=>setESup(e.target.value)}>
                                    <option value="">Walk-in (No Supplier)</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                 </select>
                              </div>

                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                 <div><label style={sx.label}>Phone</label><input style={sx.dInput} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                                 <div><label style={sx.label}>Email</label><input style={sx.dInput} value={eEmail} onChange={e=>setEEmail(e.target.value)}/></div>
                              </div>

                              <button type="submit" disabled={loading} style={{...sx.btnPrimary, width:'100%', justifyContent:'center', padding:'15px' }}>Update All Records</button>
                              <button type="button" onClick={()=>setEditing(false)} style={{...sx.btnGhost, width:'100%', justifyContent:'center', border:'none' }}>Cancel Changes</button>
                           </form>
                        ) : (
                           <div>
                              <div style={{ background:T.surface2, padding:'20px', borderRadius:'18px', marginBottom:'20px' }}>
                                 <div style={{ display:'flex', gap:'16px', alignItems:'center', marginBottom:'16px' }}>
                                    <div style={{ width:60, height:60, borderRadius:'18px', background:T.accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, overflow:'hidden' }}>
                                       {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="P"/> : drawer.name[0]}
                                    </div>
                                    <div>
                                       <h3 style={{ margin:0, fontWeight:900 }}>{drawer.name}</h3>
                                       <p style={{ margin:0, color:T.txt3, fontSize:12 }}>Partner ID: #{drawer.id.slice(-6).toUpperCase()}</p>
                                    </div>
                                 </div>
                                 <p style={sx.label}>Account Sync Status</p>
                                 <div style={{ display:'flex', gap:'10px', alignItems:'center', background:'#fff', padding:'10px', borderRadius:'12px', border:`1px solid ${T.border}` }}>
                                    <Globe size={16} color={T.success}/>
                                    <div>
                                       <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{drawer.username ? `@${drawer.username}` : 'No Cloud Account'}</p>
                                       <p style={{ margin:0, fontSize:11, color:T.txt3 }}>{drawer.username ? 'Connected to Supabase' : 'Offline Mode Only'}</p>
                                    </div>
                                 </div>
                              </div>

                              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                 <div style={{ display:'flex', gap:'10px' }}>
                                    <div style={{ flex:1, background:T.surface2, padding:14, borderRadius:14 }}>
                                       <p style={sx.label}>PIN</p>
                                       <p style={{ margin:0, fontWeight:900, letterSpacing:'0.2em' }}>{drawer.pin || '----'}</p>
                                    </div>
                                    <div style={{ flex:1, background:T.surface2, padding:14, borderRadius:14 }}>
                                       <p style={sx.label}>Route</p>
                                       <p style={{ margin:0, fontWeight:700 }}>{suppliers.find(s=>s.id===drawer.assignedSupplierId)?.full_name || 'Walk-in'}</p>
                                    </div>
                                 </div>
                                 <div style={{ background:T.surface2, padding:14, borderRadius:14 }}>
                                    <p style={sx.label}>Manager-Set Password</p>
                                    <p style={{ margin:0, fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}>
                                       <Lock size={12}/> {(drawer as any).password || 'Not Managed'}
                                    </p>
                                 </div>
                              </div>

                              <button onClick={()=>setEditing(true)} style={{...sx.btnGhost, width:'100%', marginTop:'20px', justifyContent:'center' }}>Edit Partner Profile</button>
                           </div>
                        )
                     )}

                     {dTab === 'ledger' && (
                        <div>
                           <div style={{ background: drawer.debtBalance > 0 ? T.dangerLt : T.successLt, padding:'24px', borderRadius:'16px', marginBottom:'16px', textAlign:'center', border:`1px solid ${drawer.debtBalance > 0 ? T.danger : T.success}20` }}>
                              <p style={sx.label}>Outstanding Balance</p>
                              <h1 style={{ margin:0, color: drawer.debtBalance > 0 ? T.danger : T.success, fontSize:36 }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                           </div>
                           {drawer.debtBalance > 0 && (
                              <form onSubmit={payDebt} style={{ display:'grid', gap:'10px' }}>
                                 <p style={sx.label}>Record Debt Payment</p>
                                 <input style={sx.dInput} type="number" placeholder="Enter amount..." value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                                 <div style={{ display:'flex', gap:'8px' }}>
                                    <button type="button" onClick={()=>setPayMethod('Cash')} style={{...sx.pill(payMethod==='Cash'), flex:1}}>Cash</button>
                                    <button type="button" onClick={()=>setPayMethod('Transfer')} style={{...sx.pill(payMethod==='Transfer'), flex:1}}>Transfer</button>
                                 </div>
                                 <button type="submit" style={{...sx.btnPrimary, width:'100%', justifyContent:'center', padding:14 }}>Register Payment</button>
                              </form>
                           )}
                        </div>
                     )}

                     {dTab === 'docs' && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
                           {/* LIVE ID CARD PREVIEW (Circular Profile) */}
                           <div>
                              <p style={sx.label}>Digital ID Card (Circular View)</p>
                              <div style={{ width: '220px', height: '350px', background: '#faeddb', borderRadius: '16px', margin: '0 auto', boxShadow: T.shadow, position:'relative', overflow:'hidden', padding:16, display:'flex', flexDirection:'column', alignItems:'center' }}>
                                 <h4 style={{ fontSize:10, fontWeight:900, margin:'0 0 16px', color:'#4e342e' }}>{appSettings.companyName || 'BAKERY PARTNER'}</h4>
                                 
                                 {/* Circular Avatar specifically for ID */}
                                 <div style={{ width:100, height:100, borderRadius:'50%', background:'#fff', border:'4px solid #4e342e', overflow:'hidden', marginBottom:12 }}>
                                    {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="P"/> : <div style={{width:'100%', height:'100%', color:'#4e342e', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{drawer.name[0]}</div>}
                                 </div>

                                 <h3 style={{ margin:0, fontSize:15, fontWeight:900, color:'#4e342e', textAlign:'center' }}>{drawer.name}</h3>
                                 <p style={{ margin:0, fontSize:9, fontWeight:700, color:'#4e342e', opacity:0.6 }}>AUTHORIZED PARTNER</p>
                                 
                                 <div style={{ flex:1 }}/>
                                 <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                                    <div style={{ textAlign:'left' }}>
                                       <p style={{ margin:0, fontSize:7, fontWeight:800, color:'#4e342e' }}>SN: #{drawer.id.slice(-6).toUpperCase()}</p>
                                       <p style={{ margin:0, fontSize:7, fontWeight:800, color:'#4e342e' }}>EXP: PERMANENT</p>
                                    </div>
                                    <div style={{ background:'white', padding:2, borderRadius:4 }}>
                                       <QRCode value={drawer.id} size={30} />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* CERTIFICATE PREVIEW MINI */}
                           <div>
                              <p style={sx.label}>Business Certificate of Partnership</p>
                              <div style={{ width:'100%', height:220, background:'white', border:'4px double #1e293b', position:'relative', padding:16, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                                 <Award size={32} color="#1e293b" style={{marginBottom:8}}/>
                                 <h4 style={{ margin:0, fontSize:12, fontWeight:900 }}>CERTIFICATE OF PARTNERSHIP</h4>
                                 <p style={{ fontSize:8, margin:'4px 0', color:T.txt3 }}>BE IT KNOWN THAT</p>
                                 <h3 style={{ margin:0, fontSize:16, fontWeight:900, borderBottom:'1px solid #1e293b' }}>{drawer.name}</h3>
                                 <p style={{ fontSize:8, margin:'8px 0', opacity:0.7 }}>Is a verified distributor of {appSettings.companyName || 'The Best Special Bread'}</p>
                                 <div style={{ flex:1 }}/>
                                 <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:8 }}>
                                    <span>AUTHORIZED: JAN 2024</span>
                                    <span>SIGN: ____________</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>

        <ImageCropModal 
          isOpen={showCropper}
          imageSrc={cropImageSrc}
          onClose={() => setShowCropper(false)}
          onCropCompleteAction={handleCropComplete}
        />
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;