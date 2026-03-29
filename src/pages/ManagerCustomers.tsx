import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  ArrowLeft, Search, UserPlus, X
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
  success:   '#10b981',
  successLt: '#ecfdf5',
  danger:    '#ef4444',
  dangerLt:  '#fef2f2',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  shadow:    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowLg:  '0 8px 40px rgba(0,0,0,0.1)',
  radius:    '16px',
  radiusXl:  '32px',
};

const avatarPalette = [
  ['#4f46e5','#e0e7ff'], ['#0891b2','#e0f7fa'], ['#059669','#d1fae5'],
  ['#d97706','#fef3c7'], ['#dc2626','#fee2e2'], ['#7c3aed','#ede9fe'],
];
const getAvatar = (name: string) => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment } = useAppContext();
  const navigate = useNavigate();

  /* State */
  const [search, setSearch]           = useState('');
  const [filter]                      = useState<'All'|'Routed'|'Unassigned'|'Debtors'|'Active'|'Dormant'>('All');
  const [selectedIds]                 = useState<string[]>([]);
  const [isAdding, setIsAdding]       = useState(false);
  const [suppliers, setSuppliers]     = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]         = useState(false);

  /* Add form */
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fLocation, setFLocation] = useState('');
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
  const [eEmail, setEEmail]       = useState('');
  const [eUsername, setEUsername] = useState('');
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

  const list = useMemo(() => {
    let r = customers.filter(c => {
      const q = search.toLowerCase();
      if (!(c.name.toLowerCase().includes(q) || (c.phone||'').includes(search) || (c.username||'').toLowerCase().includes(q))) return false;
      if (filter === 'Routed')     return !!c.assignedSupplierId;
      if (filter === 'Unassigned') return !c.assignedSupplierId;
      if (filter === 'Debtors')    return c.debtBalance > 0;
      if (filter === 'Active')     return activity[c.id] <= 30;
      if (filter === 'Dormant')    return activity[c.id] > 30;
      return true;
    });
    return [...r].sort((a,b) => Number(b.id) - Number(a.id));
  }, [customers, search, filter, activity]);

  const totalDebt   = customers.reduce((s,c) => s+(c.debtBalance||0), 0);

  /* Actions */
  const handleAdd = async (e:React.FormEvent) => {
    e.preventDefault(); if(!fName) return;
    setLoading(true);
    try {
      let profile_id = null;
      if (fUsername) {
         const { data: existing } = await supabase.from('profiles').select('id').eq('username', fUsername).maybeSingle();
         if (existing) {
            profile_id = existing.id;
         } else {
            const newPid = crypto.randomUUID();
            await supabase.from('profiles').insert({
               id: newPid,
               full_name: fName,
               username: fUsername,
               role: 'CUSTOMER'
            });
            profile_id = newPid;
         }
      }

      const newCust: any = {
        id: Date.now().toString(), 
        name: fName, 
        phone: fPhone, 
        email: fEmail,
        username: fUsername,
        location: fLocation, 
        notes: fNote, 
        debtBalance: 0, 
        loyaltyPoints: 0, 
        assignedSupplierId: fSup||undefined, 
        pin: fPin||undefined,
        profile_id: profile_id || undefined
      };

      await addCustomer(newCust);
      await supabase.from('customers').upsert(newCust);

      setFName(''); setFPhone(''); setFEmail(''); setFUsername(''); setFLocation(''); setFSup(''); setFPin(''); setFNote(''); setIsAdding(false);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const openDrawer = (c:Customer) => {
    setDrawerId(c.id); setEName(c.name); setEPhone(c.phone||''); 
    setEEmail((c as any).email || ''); setEUsername(c.username || '');
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
          name: eName, phone: ePhone, email: eEmail, username: eUsername, location: eLocation, image: eImage,
          assignedSupplierId: eSup||undefined, pin: ePin||undefined, notes: eNote
       };
       await updateCustomer(updated);
       await supabase.from('customers').upsert(updated);
       setEditing(false);
    } catch (err) {
       console.error(err);
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
                <p style={{ fontSize:'12px', color:T.txt3, margin:0 }}>{customers.length} clients registered</p>
              </div>
            </div>
          </div>

          {/* HERO */}
          <div style={{ background: `linear-gradient(135deg, ${T.accent} 0%, #6366f1 100%)`, borderRadius: T.radiusXl, padding:'24px', marginBottom:'20px', color:'#fff' }}>
             <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                   <p style={{ opacity:0.7, fontSize:'11px', fontWeight:800, textTransform:'uppercase' }}>Active Customers</p>
                   <h2 style={{ fontSize:'42px', fontWeight:900, margin:0 }}>{customers.length}</h2>
                </div>
                <div style={{ textAlign:'right' }}>
                   <p style={{ opacity:0.7, fontSize:'11px', fontWeight:800, textTransform:'uppercase' }}>Total Debt</p>
                   <h2 style={{ fontSize:'24px', fontWeight:900, margin:0 }}>₦{totalDebt.toLocaleString()}</h2>
                </div>
             </div>
          </div>

          {/* SEARCH + ADD */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={16} color={T.txt3} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }} />
              <input style={{ ...sx.input, paddingLeft:'42px' }} placeholder="Search name, phone or username..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setIsAdding(!isAdding)} style={sx.btnPrimary}><UserPlus size={16} /> Add</button>
          </div>

          {/* ADD FORM */}
          <AnimatePresence>
            {isAdding && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} style={{ background:'#fff', borderRadius:'20px', border:`1.5px solid ${T.border}`, padding:'20px', marginBottom:'16px', overflow:'hidden' }}>
                 <p style={sx.label}>Register New Customer</p>
                 <form onSubmit={handleAdd} style={{ display:'grid', gap:'12px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                       <div><label style={sx.label}>Full Name</label><input style={sx.input} value={fName} onChange={e=>setFName(e.target.value)} required/></div>
                       <div><label style={sx.label}>Username</label><input style={sx.input} value={fUsername} onChange={e=>setFUsername(e.target.value)} placeholder="login_name"/></div>
                       <div><label style={sx.label}>Phone</label><input style={sx.input} value={fPhone} onChange={e=>setFPhone(e.target.value)}/></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                       <div><label style={sx.label}>Email</label><input style={sx.input} value={fEmail} onChange={e=>setFEmail(e.target.value)}/></div>
                       <div><label style={sx.label}>Location</label><input style={sx.input} value={fLocation} onChange={e=>setFLocation(e.target.value)}/></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                       <div><label style={sx.label}>PIN (4 Digits)</label><input style={{...sx.input, letterSpacing:'0.2em'}} maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}/></div>
                       <div><label style={sx.label}>Route</label>
                          <select style={sx.input} value={fSup} onChange={e=>setFSup(e.target.value)}>
                             <option value="">Walk-in</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                       </div>
                    </div>
                    <button type="submit" disabled={loading} style={{ ...sx.btnPrimary, justifyContent:'center' }}>{loading ? 'Creating...' : 'Save Customer & Create Account'}</button>
                 </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIST */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {list.map(c => {
               const [ac, lc] = getAvatar(c.name);
               return (
                 <div key={c.id} style={sx.card(selectedIds.includes(c.id))} onClick={() => openDrawer(c)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                       <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:lc, color:ac, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{c.name[0]}</div>
                       <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontWeight:800, color:T.txt }}>{c.name}</p>
                          <p style={{ margin:0, fontSize:'11px', color:T.txt3 }}>{c.phone || c.username || 'No ID info'}</p>
                       </div>
                       <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontWeight:900, color: c.debtBalance > 0 ? T.danger : T.success }}>₦{c.debtBalance.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
               );
            })}
          </div>
        </div>

        {/* DRAWER */}
        <AnimatePresence>
           {drawer && (
             <>
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:90 }} onClick={()=>setDrawerId(null)}/>
               <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:'400px', background:'#fff', zIndex:100, padding:'24px', boxShadow:T.shadowLg, display:'flex', flexDirection:'column' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                     <h2 style={{ margin:0, fontWeight:900 }}>Client Hub</h2>
                     <button onClick={()=>setDrawerId(null)} style={{ border:'none', background:'none' }}><X/></button>
                  </div>
                  
                  <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
                     <button onClick={()=>setDTab('profile')} style={{ ...sx.pill(dTab==='profile'), flex:1 }}>Info</button>
                     <button onClick={()=>setDTab('ledger')} style={{ ...sx.pill(dTab==='ledger'), flex:1 }}>Ledger</button>
                  </div>

                  <div style={{ flex:1, overflowY:'auto' }}>
                     {dTab === 'profile' && (
                        editing ? (
                           <form onSubmit={saveEdit} style={{ display:'grid', gap:'12px' }}>
                              <div><label style={sx.label}>Name</label><input style={sx.dInput} value={eName} onChange={e=>setEName(e.target.value)}/></div>
                              <div><label style={sx.label}>Username</label><input style={sx.dInput} value={eUsername} onChange={e=>setEUsername(e.target.value)}/></div>
                              <div><label style={sx.label}>PIN</label><input style={{...sx.dInput, letterSpacing:'0.2em'}} value={ePin} onChange={e=>setEPin(e.target.value.replace(/\D/g,''))}/></div>
                              <div><label style={sx.label}>Phone</label><input style={sx.dInput} value={ePhone} onChange={e=>setEPhone(e.target.value)}/></div>
                              <div><label style={sx.label}>Email</label><input style={sx.dInput} value={eEmail} onChange={e=>setEEmail(e.target.value)}/></div>
                              <div><label style={sx.label}>Location</label><input style={sx.dInput} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                              <div><label style={sx.label}>Image URL</label><input style={sx.dInput} value={eImage} onChange={e=>setEImage(e.target.value)}/></div>
                              <button type="submit" style={{...sx.btnPrimary, width:'100%', justifyContent:'center'}}>Update Profile</button>
                              <button type="button" onClick={()=>setEditing(false)} style={{...sx.btnGhost, width:'100%', justifyContent:'center'}}>Cancel</button>
                           </form>
                        ) : (
                           <div>
                              <div style={{ background:T.surface2, padding:'16px', borderRadius:'12px', marginBottom:'16px' }}>
                                 <p style={sx.label}>Contact & Login</p>
                                 <p style={{ margin:'4px 0', fontSize:'14px' }}><b>User:</b> {drawer.username || 'None'}</p>
                                 <p style={{ margin:'4px 0', fontSize:'14px' }}><b>Phone:</b> {drawer.phone || 'None'}</p>
                                 <p style={{ margin:'4px 0', fontSize:'14px' }}><b>Email:</b> {(drawer as any).email || 'None'}</p>
                              </div>
                              <button onClick={()=>setEditing(true)} style={{...sx.btnGhost, width:'100%', justifyContent:'center'}}>Edit All Information</button>
                           </div>
                        )
                     )}

                     {dTab === 'ledger' && (
                        <div>
                           <div style={{ background: drawer.debtBalance > 0 ? T.dangerLt : T.successLt, padding:'24px', borderRadius:'16px', marginBottom:'16px', textAlign:'center' }}>
                              <p style={sx.label}>Outstanding Balance</p>
                              <h1 style={{ margin:0, color: drawer.debtBalance > 0 ? T.danger : T.success }}>₦{drawer.debtBalance.toLocaleString()}</h1>
                           </div>
                           {drawer.debtBalance > 0 && (
                              <form onSubmit={payDebt} style={{ display:'grid', gap:'10px' }}>
                                 <input style={sx.dInput} type="number" placeholder="Enter amount..." value={payAmt} onChange={e=>setPayAmt(e.target.value)}/>
                                 <div style={{ display:'flex', gap:'8px' }}>
                                    <button type="button" onClick={()=>setPayMethod('Cash')} style={{...sx.pill(payMethod==='Cash'), flex:1}}>Cash</button>
                                    <button type="button" onClick={()=>setPayMethod('Transfer')} style={{...sx.pill(payMethod==='Transfer'), flex:1}}>Transfer</button>
                                 </div>
                                 <button type="submit" style={{...sx.btnPrimary, width:'100%', justifyContent:'center'}}>Record Payment</button>
                              </form>
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