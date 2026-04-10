import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X, Camera, Lock, Globe,
  Award, ShieldCheck, History, TrendingUp, Zap, 
  CheckCircle2, Star, CreditCard, ChevronRight,
  MapPin, Phone, Mail, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCropModal } from '../components/ImageCropModal';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

/* ─── Premium Design Tokens ─── */
const T = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  surface2:  '#f1f5f9',
  border:    '#e2e8f0',
  accent:    '#6366f1',
  accentDk:  '#4f46e5',
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
  shadow:    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  shadowLg:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  radius:    '16px',
  radiusLg:  '24px',
};

const avatarPalette = [
  ['#6366f1','#e0e7ff'], ['#0ea5e9','#e0f2fe'], ['#10b981','#d1fae5'],
  ['#f59e0b','#fef3c7'], ['#ef4444','#fee2e2'], ['#8b5cf6','#ede9fe'],
];
const getAvatar = (name: string) => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

const getRank = (debt: number) => {
  if (debt === 0) return { label: 'Diamond', color: '#0ea5e9', bg: '#e0f2fe' };
  if (debt < 50000) return { label: 'Gold', color: '#f59e0b', bg: '#fef3c7' };
  return { label: 'Silver', color: '#64748b', bg: '#f1f5f9' };
};

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment, appSettings, refreshData } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* State */
  const [search, setSearch]           = useState('');
  const [isAdding, setIsAdding]       = useState(false);
  const [suppliers, setSuppliers]     = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]         = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{name:string; login:string; password:string}|null>(null);

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
  const [dTab, setDTab]           = useState<'profile'|'ledger'|'history'|'docs'>('profile');
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
  const [eNote]                  = useState('');
  
  const [payAmt, setPayAmt]       = useState('');
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

  const totalDebt = customers.reduce((s,c) => s+(c.debtBalance||0), 0);
  const topCustomer = useMemo(() => [...customers].sort((a,b) => (b.debtBalance||0) - (a.debtBalance||0))[0], [customers]);

  /* Actions */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCropImageSrc(reader.result as string); setShowCropper(true); };
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!fName) return;
    setLoading(true);
    try {
      const newId = crypto.randomUUID();
      if (fEmail && fPassword) {
        // Path A: Auth Account
        const { data: { session: managerSession } } = await supabase.auth.getSession();
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: fEmail.trim().toLowerCase(),
          password: fPassword,
          options: {
            data: { role: 'CUSTOMER', full_name: fName.trim(), phone: fPhone.trim(), username: fUsername.trim().toLowerCase() || fEmail.split('@')[0] },
          },
        });
        if (signUpErr) throw signUpErr;

        if (managerSession) {
          await supabase.auth.setSession({ access_token: managerSession.access_token, refresh_token: managerSession.refresh_token });
        }

        const authUserId = signUpData.user?.id || newId;
        
        await supabase.from('profiles').upsert({
          id: authUserId, full_name: fName.trim(), email: fEmail.trim().toLowerCase(),
          phone: fPhone.trim(), role: 'CUSTOMER'
        });

        await addCustomer({
          id: authUserId, profile_id: authUserId, name: fName.trim(), email: fEmail.trim().toLowerCase(),
          phone: fPhone.trim(), username: fUsername.trim().toLowerCase() || fEmail.split('@')[0],
          location: fLocation.trim(), notes: fNote, debtBalance: 0, loyaltyPoints: 0,
          assignedSupplierId: fSup || undefined, pin: fPin || undefined,
        });

        setCreatedCreds({ name: fName, login: fEmail.trim().toLowerCase(), password: fPassword });
      } else {
        // Path B: Legacy Only
        await addCustomer({
          id: newId, name: fName, phone: fPhone, email: fEmail, username: fUsername,
          password: fPassword, location: fLocation, notes: fNote, debtBalance: 0,
          loyaltyPoints: 0, assignedSupplierId: fSup || undefined, pin: fPin || undefined,
        });
        setCreatedCreds({ name: fName, login: fUsername || fPhone || '---', password: fPassword || '(no password)' });
      }

      setIsAdding(false); setFName(''); setFPhone(''); setFEmail(''); setFUsername(''); setFPassword(''); setFLocation(''); setFSup(''); setFPin(''); setFNote('');
      await refreshData();
    } catch (err: any) {
      alert('Sync Failed: ' + err.message);
    } finally { setLoading(false); }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!eName || !drawer) return;
    setLoading(true);
    try {
      const updated: any = {
        ...drawer, name: eName, phone: ePhone, email: eEmail, username: eUsername,
        password: ePassword, location: eLocation, image: eImage,
        assignedSupplierId: eSup || undefined, pin: ePin || undefined, notes: eNote
      };
      await updateCustomer(updated);
      setEditing(false);
      await refreshData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const payDebt = async (e: React.FormEvent) => {
    e.preventDefault(); const amt = Number(payAmt); if (!amt || !drawerId) return;
    setLoading(true);
    try {
      await recordDebtPayment({ id: crypto.randomUUID(), date: new Date().toISOString(), customerId: drawerId, amount: amt, method: payMethod });
      setPayAmt('');
      await refreshData();
    } finally { setLoading(false); }
  };

  const sx = {
    page: { background: T.bg, minHeight: '100vh', paddingBottom: '100px', color: T.txt, fontFamily: "'Inter', sans-serif" },
    glass: { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${T.border}`, borderRadius: T.radius },
    input: { background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '12px', padding: '12px 14px', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline:'none' } as React.CSSProperties,
    btnPrimary: { background: `linear-gradient(135deg, ${T.accentDk} 0%, ${T.accent} 100%)`, color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 20px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' } as React.CSSProperties,
  };

  return (
    <AnimatedPage>
      <div style={sx.page}>
        {/* HEADER SECTION */}
        <div style={{ padding: '24px 20px', display:'flex', flexDirection:'column', gap:'20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: T.shadow }}>
              <ArrowLeft size={20} color={T.txt} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Partner Directory</h1>
              <p style={{ fontSize: '13px', color: T.txt3, margin: 0, fontWeight: 600 }}>{customers.length} verified distributors</p>
            </div>
            <button onClick={() => setIsAdding(!isAdding)} style={sx.btnPrimary}><UserPlus size={18} /> Register</button>
          </div>

          {/* QUICK METRICS BENTO */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
             <div style={{ ...sx.glass, padding:'16px', background: `linear-gradient(135deg, ${T.accentDk} 0%, ${T.accent} 100%)`, color:'#fff', border:'none' }}>
                <p style={{ margin:0, fontSize:10, fontWeight:800, opacity:0.8, textTransform:'uppercase' }}>Total Receivables</p>
                <div style={{ fontSize:22, fontWeight:900, margin:'4px 0' }}>₦{totalDebt.toLocaleString()}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700 }}>
                   <TrendingUp size={10}/> <span>Active Pool</span>
                </div>
             </div>
             <div style={{ ...sx.glass, padding:'16px' }}>
                <p style={{ margin:0, fontSize:10, fontWeight:800, color:T.txt3, textTransform:'uppercase' }}>Top Partner</p>
                <div style={{ fontSize:15, fontWeight:800, margin:'4px 0', color:T.txt, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topCustomer?.name || '---'}</div>
                <div style={{ fontSize:10, fontWeight:700, color:T.success }}>₦{(topCustomer?.debtBalance||0).toLocaleString()} limit</div>
             </div>
          </div>

          {/* SEARCH BAR */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color={T.txt3} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              style={{ ...sx.input, paddingLeft: 48, height: 54, fontSize: 15, fontWeight: 600, border: 'none', boxShadow: T.shadow }} 
              placeholder="Search by name, phone, or alias..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* ADD FORM DRAWER-LIKE */}
        <AnimatePresence>
          {isAdding && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ margin: '0 20px 24px', padding: 24, background: '#fff', borderRadius: 24, boxShadow: T.shadowLg, border: `1.5px solid ${T.accentLt}` }}>
               <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                  <div style={{ background:T.accentLt, color:T.accent, padding:8, borderRadius:12 }}><ShieldCheck size={20}/></div>
                  <h3 style={{ margin:0, fontSize:18, fontWeight:900 }}>Create Professional Identity</h3>
               </div>
               <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                     <div><label style={{ fontSize:11, fontWeight:800, color:T.txt3, marginBottom:4, display:'block' }}>Full Legal Name</label><input style={sx.input} value={fName} onChange={e=>setFName(e.target.value)} required/></div>
                     <div><label style={{ fontSize:11, fontWeight:800, color:T.txt3, marginBottom:4, display:'block' }}>Assigned Supplier</label>
                        <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                           <option value="">Direct / Walk-in</option>
                           {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                        </select>
                     </div>
                  </div>
                  <div style={{ background:T.bg, padding:16, borderRadius:18 }}>
                     <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:900, color:T.accent, letterSpacing:'0.05em' }}>SECURITY & ACCESS</p>
                     <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                        <input style={sx.input} placeholder="Auth Email" type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)}/>
                        <input style={sx.input} placeholder="Password" type="text" value={fPassword} onChange={e=>setFPassword(e.target.value)}/>
                        <input style={{...sx.input, textAlign:'center', letterSpacing:'0.3em'}} placeholder="PIN" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/>
                     </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ ...sx.btnPrimary, justifyContent:'center', padding:16 }}>{loading ? 'Initializing Secure Bridge...' : 'Finalize & Sync Account'}</button>
                  <button type="button" onClick={()=>setIsAdding(false)} style={{ border:'none', background:'none', color:T.txt3, fontWeight:700, fontSize:12, cursor:'pointer' }}>Discard Registration</button>
               </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CUSTOMER LIST */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map(c => {
            const [ac, lc] = getAvatar(c.name);
            const rank = getRank(c.debtBalance);
            return (
              <motion.div 
                key={c.id} 
                onClick={() => setDrawerId(c.id)}
                whileHover={{ y: -2, boxShadow: T.shadowLg }} 
                style={{ ...sx.glass, padding: 16, cursor: 'pointer', transition: 'all 0.2s', border: `1.5px solid ${c.id === drawerId ? T.accent : T.border}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 18, background: lc, color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, border: `1.5px solid #fff`, boxShadow: T.shadow }}>
                      {c.image ? <img src={c.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name[0]}
                    </div>
                    {(c as any).email && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: T.success, border: '3px solid #fff', borderRadius: '50%' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T.txt }}>{c.name}</h3>
                      <div style={{ background: rank.bg, color: rank.color, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{rank.label}</div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: T.txt3, fontWeight: 600 }}>{c.phone || c.username || 'No Contact'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: c.debtBalance > 0 ? T.danger : T.success }}>₦{c.debtBalance.toLocaleString()}</div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.txt3 }}>Balance</p>
                  </div>
                  <ChevronRight size={18} color={T.border} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* PROFILE DRAWER */}
        <AnimatePresence>
          {drawer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 100 }} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 450, background: '#fff', zIndex: 110, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)' }}>
                {/* Drawer Header */}
                <div style={{ padding: 24, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:T.accentLt, color:T.accent, display:'flex', alignItems:'center', justifyContent:'center' }}><User size={20}/></div>
                      <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>Client Context</h2>
                   </div>
                   <button onClick={() => setDrawerId(null)} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: T.surface2, cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: 12, background: T.surface2, margin: '16px 20px', borderRadius: 16 }}>
                  {[
                    { id: 'profile', icon: User, label: 'Admin' },
                    { id: 'ledger', icon: CreditCard, label: 'Ledger' },
                    { id: 'history', icon: History, label: 'Vault' },
                    { id: 'docs', icon: Award, label: 'Assets' },
                  ].map(t => {
                    const Act = dTab === t.id;
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => setDTab(t.id as any)} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '10px 0', background: Act ? '#fff' : 'transparent', color: Act ? T.accent : T.txt3, cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: Act ? T.shadow : 'none' }}>
                        <Icon size={16} />
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px' }} className="hide-scrollbar">
                  {dTab === 'profile' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                       {/* Identity Card */}
                       <div style={{ background:T.accentLt, padding:24, borderRadius:24, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                          <div style={{ position:'relative' }}>
                             <div style={{ width:100, height:100, borderRadius:32, background:T.surface, overflow:'hidden', border:`4px solid #fff`, boxShadow:T.shadowLg }}>
                                {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:900, color:T.accent}}>{drawer.name[0]}</div>}
                             </div>
                             <button onClick={()=>fileInputRef.current?.click()} style={{ position:'absolute', bottom:0, right:0, width:36, height:36, borderRadius:12, background:T.accent, color:'#fff', border:'4px solid '+T.accentLt, display:'flex', alignItems:'center', justifyContent:'center' }}><Camera size={18}/></button>
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                          </div>
                          <div style={{ textAlign:'center' }}>
                             <h3 style={{ margin:0, fontSize:22, fontWeight:900 }}>{drawer.name}</h3>
                             <p style={{ margin:0, color:T.txt3, fontSize:13, fontWeight:600 }}>Partner ID: #{drawer.id.slice(0,8).toUpperCase()}</p>
                          </div>
                       </div>

                       {/* Details Grid */}
                       <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                          {[
                             { icon: Phone, label: 'Phone', val: drawer.phone || '---' },
                             { icon: Mail, label: 'Email', val: (drawer as any).email || '---' },
                             { icon: MapPin, label: 'Region', val: drawer.location || 'None Set' },
                             { icon: Globe, label: 'Alias', val: drawer.username ? `@${drawer.username}` : 'No Alias' },
                          ].map((item, i) => (
                             <div key={i} style={{ ...sx.glass, padding:16 }}>
                                <item.icon size={14} color={T.accent} style={{marginBottom:8}}/>
                                <p style={{ margin:0, fontSize:10, fontWeight:800, color:T.txt3, textTransform:'uppercase' }}>{item.label}</p>
                                <p style={{ margin:0, fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis' }}>{item.val}</p>
                             </div>
                          ))}
                       </div>

                       {/* Security Quick View */}
                       <div style={{ background:T.surface2, padding:20, borderRadius:20 }}>
                          <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:900, color:T.txt2, display:'flex', alignItems:'center', gap:8 }}><Lock size={14}/> SECURITY CREDENTIALS</p>
                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', padding:12, borderRadius:12 }}>
                                <span style={{ fontSize:12, fontWeight:700, color:T.txt3 }}>PIN ACCESS</span>
                                <span style={{ fontSize:14, fontWeight:900, letterSpacing:'0.2em' }}>{drawer.pin || 'NOT SET'}</span>
                             </div>
                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', padding:12, borderRadius:12 }}>
                                <span style={{ fontSize:12, fontWeight:700, color:T.txt3 }}>MANAGED PWD</span>
                                <span style={{ fontSize:13, fontWeight:800 }}>{(drawer as any).password || 'EXTERNAL'}</span>
                             </div>
                          </div>
                       </div>
                       
                       <button onClick={()=>setEditing(true)} style={{ ...sx.btnPrimary, background:T.surface, color:T.accent, border:`1px solid ${T.accent}`, width:'100%', justifyContent:'center', boxShadow:'none' }}>Configure Professional Details</button>
                    </div>
                  )}

                  {dTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ background: drawer.debtBalance > 0 ? `linear-gradient(135deg, ${T.danger} 0%, #dc2626 100%)` : `linear-gradient(135deg, ${T.success} 0%, #059669 100%)`, padding: 32, borderRadius: 24, color: '#fff', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Outstanding Liability</p>
                        <h1 style={{ margin: '8px 0', fontSize: 42, fontWeight: 900 }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 40, fontSize: 11, fontWeight: 800 }}>
                           {drawer.debtBalance > 0 ? 'Action Required' : 'Account Perfect'}
                        </div>
                      </div>

                      <div style={{ background: T.surface2, padding: 24, borderRadius: 24 }}>
                         <h4 style={{ margin: '0 0 16px', fontWeight: 900 }}>Settle Balance</h4>
                         <form onSubmit={payDebt} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ position: 'relative' }}>
                               <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: T.txt3 }}>₦</span>
                               <input 
                                 style={{ ...sx.input, paddingLeft: 32, fontSize:18, fontWeight:900 }} 
                                 type="number" 
                                 placeholder="0.00" 
                                 value={payAmt} 
                                 onChange={e => setPayAmt(e.target.value)} 
                               />
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                               <button type="button" onClick={() => setPayMethod('Cash')} style={{ flex:1, border:`1.5px solid ${payMethod==='Cash'?T.accent:T.border}`, background:payMethod==='Cash'?T.accentLt:'#fff', color:payMethod==='Cash'?T.accent:T.txt2, borderRadius:12, padding:12, fontWeight:800, cursor:'pointer' }}>Cash</button>
                               <button type="button" onClick={() => setPayMethod('Transfer')} style={{ flex:1, border:`1.5px solid ${payMethod==='Transfer'?T.accent:T.border}`, background:payMethod==='Transfer'?T.accentLt:'#fff', color:payMethod==='Transfer'?T.accent:T.txt2, borderRadius:12, padding:12, fontWeight:800, cursor:'pointer' }}>Transfer</button>
                            </div>
                            <button type="submit" disabled={loading} style={{ ...sx.btnPrimary, width: '100%', justifyContent: 'center' }}>
                               {loading ? 'Processing Cloud Ledger...' : 'Deposit Payment'}
                            </button>
                         </form>
                      </div>
                    </div>
                  )}

                  {dTab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <h4 style={{ margin:0, fontWeight:900, fontSize:16 }}>Transaction Vault</h4>
                          <span style={{ fontSize:11, fontWeight:800, color:T.txt3 }}>{customerItems.length} records found</span>
                       </div>
                       {customerItems.length > 0 ? (
                         customerItems.map(tx => (
                           <motion.div key={tx.id} whileHover={{ x: 4 }} style={{ padding: 14, borderRadius: 16, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, cursor:'pointer' }} onClick={()=>navigate(`/receipt/${tx.id}`)}>
                             <div style={{ width: 44, height: 44, borderRadius: 12, background: tx.type==='Return'?T.dangerLt:T.successLt, color: tx.type==='Return'?T.danger:T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               {tx.type === 'Return' ? <Zap size={18} /> : <CheckCircle2 size={18} />}
                             </div>
                             <div style={{ flex: 1 }}>
                               <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{tx.type} Order</p>
                               <p style={{ margin: 0, fontSize: 11, color: T.txt3, fontWeight: 600 }}>{new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                               <p style={{ margin: 0, fontWeight: 900, fontSize: 15 }}>₦{tx.totalPrice.toLocaleString()}</p>
                               <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.accent }}>View Receipt</p>
                             </div>
                           </motion.div>
                         ))
                       ) : (
                         <div style={{ textAlign:'center', padding:40, opacity:0.5 }}>
                            <History size={48} style={{marginBottom:12}}/>
                            <p style={{ fontWeight:700 }}>No transaction history discovered</p>
                         </div>
                       )}
                    </div>
                  )}

                  {dTab === 'docs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                       {/* ID CARD */}
                       <div>
                          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: T.txt3 }}>DISTRIBUTOR IDENTITY CARD</p>
                          <div style={{ position:'relative', borderRadius:24, overflow:'hidden', boxShadow:T.shadowLg }}>
                             <div style={{ background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, color: '#fff', padding: 24, position: 'relative' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                                   <div style={{ fontWeight:900, fontSize:10, letterSpacing:'0.1em' }}>{appSettings.companyName?.toUpperCase() || 'BAKERY SYSTEM'}</div>
                                   <Zap size={20} color={T.accent}/>
                                </div>
                                <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                                   <div style={{ width:70, height:70, borderRadius:16, background:'#fff', overflow:'hidden', border:'3px solid rgba(255,255,255,0.2)' }}>
                                      {drawer.image ? <img src={drawer.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#1e293b', fontWeight:900, fontSize:24}}>{drawer.name[0]}</div>}
                                   </div>
                                   <div>
                                      <h4 style={{ margin:0, fontSize:18, fontWeight:900 }}>{drawer.name}</h4>
                                      <p style={{ margin:0, fontSize:10, fontWeight:800, color:T.accent }}>AUTHORIZED PARTNER</p>
                                   </div>
                                </div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:32 }}>
                                   <div>
                                      <p style={{ margin:0, fontSize:8, opacity:0.6 }}>REGISTRATION NO.</p>
                                      <p style={{ margin:0, fontSize:11, fontWeight:800, fontFamily:'monospace' }}>BR-{drawer.id.slice(0,6).toUpperCase()}</p>
                                   </div>
                                   <div style={{ background:'#fff', padding:4, borderRadius:8 }}>
                                      <QRCode value={drawer.id} size={50} />
                                   </div>
                                </div>
                             </div>
                          </div>
                          <button style={{ width:'100%', marginTop:12, border:`1px solid ${T.border}`, background:'#fff', borderRadius:12, padding:12, fontSize:11, fontWeight:800, color:T.txt, cursor:'pointer' }}>Download Identity</button>
                       </div>

                       {/* CERTIFICATE */}
                       <div>
                          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: T.txt3 }}>PARTNERSHIP CERTIFICATE</p>
                          <div style={{ background: '#fff', border: `8px double #1e293b`, padding: 20, textAlign: 'center', position: 'relative' }}>
                             <Award size={40} color="#1e293b" style={{ marginBottom: 10 }} />
                             <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>CERTIFICATE OF PARTNERSHIP</h4>
                             <p style={{ fontSize: 8, margin: '4px 0', opacity: 0.6 }}>THIS IS TO CERTIFY THAT</p>
                             <h3 style={{ margin: '8px 0', fontSize: 18, fontWeight: 900, borderBottom: '1px solid #1e293b', display: 'inline-block' }}>{drawer.name}</h3>
                             <p style={{ fontSize: 8, margin: '8px 0', opacity: 0.7 }}>is a recognized partner of {appSettings.companyName || 'The Bakery'}</p>
                             <div style={{ background:T.bg, padding:8, borderRadius:4, margin:'10px 0', fontSize:8, fontWeight:700 }}>VERIFIED DISTRIBUTOR #BR-{drawer.id.slice(0,6).toUpperCase()}</div>
                             <div style={{ display:'flex', justifyContent:'space-between', fontSize:7, fontWeight:900, marginTop:10 }}>
                                <span>DATE: {new Date().toLocaleDateString()}</span>
                                <span>SIGNATURE: ______________</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* EDIT MODAL OVERLAY */}
              <AnimatePresence>
                 {editing && (
                    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} style={{ position:'fixed', inset:0, background:'#fff', zIndex:120, padding:24, display:'flex', flexDirection:'column' }}>
                       <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
                          <h2 style={{ margin:0, fontWeight:900 }}>Configure Identity</h2>
                          <button onClick={()=>setEditing(false)} style={{ border:'none', background:T.surface2, width:40, height:40, borderRadius:12 }}><X size={20}/></button>
                       </div>
                       <form onSubmit={saveEdit} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }} className="hide-scrollbar">
                          <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>PARTNER DISPaly NAME</label><input style={sx.input} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                             <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>ALIAS / USERNAME</label><input style={sx.input} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                             <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>4-DIGIT PIN</label><input style={{...sx.input, textAlign:'center', letterSpacing:'0.2em'}} maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value.replace(/\D/g,''))}/></div>
                          </div>
                          <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>MANAGED PASSWORD</label><input style={sx.input} value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                          <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>LOCATION / REGION</label><input style={sx.input} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                          <div style={{ gridTemplateColumns:'1fr 1fr', display:'grid', gap:12 }}>
                             <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>MOBILE CONTACT</label><input style={sx.input} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                             <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>EMAIL ADDRESS</label><input style={sx.input} value={eEmail} onChange={e=>setEEmail(e.target.value)}/></div>
                          </div>
                          <div><label style={{fontSize:11, fontWeight:800, color:T.txt3}}>ASSIGNED SUPPILER ROUTE</label>
                             <select style={sx.input} value={eSup} onChange={e=>setESup(e.target.value)}>
                                <option value="">Direct / Walk-in</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                             </select>
                          </div>
                          <div style={{ flex:1 }}/>
                          <button type="submit" disabled={loading} style={{...sx.btnPrimary, width:'100%', justifyContent:'center'}}>{loading ? 'Syncing...' : 'Update & Persist Profile'}</button>
                       </form>
                    </motion.div>
                 )}
              </AnimatePresence>
            </>
          )}
        </AnimatePresence>

        <ImageCropModal isOpen={showCropper} imageSrc={cropImageSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />

        {/* CREDENTIALS SUCCESS MODAL */}
        <AnimatePresence>
           {createdCreds && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.8)', backdropFilter:'blur(10px)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
                 <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} style={{ background:'#fff', borderRadius:32, padding:32, width:'100%', maxWidth:380, textAlign:'center' }}>
                    <div style={{ width:70, height:70, background:T.successLt, color:T.success, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}><Star size={32} /></div>
                    <h2 style={{ margin:'0 0 8px', fontWeight:900 }}>Registration Successful</h2>
                    <p style={{ margin:'0 0 24px', fontSize:13, fontWeight:600, color:T.txt3 }}>The partner identity has been synced to the cloud</p>
                    <div style={{ background:T.surface2, padding:20, borderRadius:20, textAlign:'left', gap:12, display:'flex', flexDirection:'column', marginBottom:24 }}>
                       <div><p style={{margin:0, fontSize:10, fontWeight:900, color:T.txt3}}>LOGIN IDENTIFIER</p><p style={{margin:0, fontWeight:800}}>{createdCreds.login}</p></div>
                       <div><p style={{margin:0, fontSize:10, fontWeight:900, color:T.txt3}}>SECURITY PASSWORD</p><p style={{margin:0, fontWeight:800, fontFamily:'monospace'}}>{createdCreds.password}</p></div>
                    </div>
                    <button onClick={()=>setCreatedCreds(null)} style={{...sx.btnPrimary, width:'100%', justifyContent:'center'}}>Great, All Set!</button>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;