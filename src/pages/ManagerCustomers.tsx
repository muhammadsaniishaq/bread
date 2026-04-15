import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import {
  Search, UserPlus, X,
  Award,
  Crown, Star, Medal,
  BadgeCheck,
  MessageCircle, Clock, AlertOctagon,
  Shield, Target, Trash2,
  ArrowLeft, Edit2, CheckCircle2, FileText as InvoiceIcon, ClipboardList
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { ImageCropModal } from '../components/ImageCropModal';

const T = {
  bg:'#f8fafc', surface:'#ffffff', surface2:'#f1f5f9', border:'#e2e8f0',
  accent:'#4f46e5', accentLt:'#eef2ff',
  success:'#10b981', successLt:'#dcfce7', textSuccess:'#166534',
  danger:'#ef4444', dangerLt:'#fee2e2', textDanger:'#991b1b',
  warn:'#f59e0b', warnLt:'#fef3c7', textWarn:'#92400e',
  txt:'#0f172a', txt2:'#475569', txt3:'#94a3b8',
  ink:'#0f172a',
  shadow:'0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd:'0 10px 25px -5px rgba(0,0,0,0.08)',
  radius:'16px', radiusLg:'24px',
};

const avatarPalette=[['#4f46e5','#e0e7ff'],['#0891b2','#e0f7fa'],['#059669','#d1fae5'],['#d97706','#fef3c7'],['#dc2626','#fee2e2'],['#7c3aed','#ede9fe']];
const getAvatar=(n:string)=>avatarPalette[n.charCodeAt(0)%avatarPalette.length];

export const getBadge = (points?: number) => {
  const p = points || 0;
  if (p >= 1000) return <span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'10px',fontWeight:700,padding:'4px 8px',borderRadius:'8px',background:'#ede9fe',color:'#7c3aed'}}><Crown size={12}/> VIP</span>;
  if (p >= 500)  return <span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'10px',fontWeight:700,padding:'4px 8px',borderRadius:'8px',background:'#fef9c3',color:'#a16207'}}><Star size={12}/> Gold</span>;
  if (p >= 100)  return <span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'10px',fontWeight:700,padding:'4px 8px',borderRadius:'8px',background:'#f1f5f9',color:'#64748b'}}><Award size={12}/> Silver</span>;
  if (p > 0)     return <span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'10px',fontWeight:700,padding:'4px 8px',borderRadius:'8px',background:'#fef3c7',color:'#b45309'}}><Medal size={12}/> Bronze</span>;
  return null;
};

const formatDate = (dateString: string) => {
   const d = new Date(dateString);
   return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const inp:React.CSSProperties={background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500,color:T.txt,outline:'none',width:'100%',boxSizing:'border-box',transition:'all 0.2s'};
const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:'8px',display:'block'};

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, debtPayments, addCustomer, updateCustomer, verifyCustomer, deleteCustomer, refreshData, appSettings } = useAppContext();
  // const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [filterMode] = useState<'ALL'|'DEBT'|'CLEAN'|'VIP'|'RISK'>('ALL');
  const [sortMode, setSortMode]     = useState<'A-Z'|'DEBT'|'VIP'|'NEWEST'>('A-Z');
  
  const [isAdding, setIsAdding]   = useState(false);
  const [suppliers, setSuppliers] = useState<{id:string; full_name:string}[]>([]);
  const [loading, setLoading]     = useState(false);
  const isSubmitting = React.useRef(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState(false);

  const [drawerId, setDrawerId] = useState<string|null>(null);
  const drawer = useMemo(() => customers.find(c => c.id === drawerId), [customers, drawerId]);
  
  const [fName, setFName]=useState(''); const [fPhone, setFPhone]=useState(''); const [fEmail, setFEmail]=useState(''); const [fUsername, setFUsername]=useState(''); const [fPassword, setFPassword]=useState(''); const [fLocation, setFLocation]=useState(''); const [fImage, setFImage]=useState(''); const [fSup, setFSup]=useState(''); const [fPin, setFPin]=useState(''); const [fCreditLimit, setFCreditLimit]=useState(''); const [fSalesTarget, setFSalesTarget]=useState(''); const [fNote, setFNote]=useState('');

  const [eName, setEName]=useState(''); const [ePhone, setEPhone]=useState(''); const [eEmail, setEEmail]=useState(''); const [eUsername, setEUsername]=useState(''); const [ePassword, setEPassword]=useState(''); const [eLocation, setELocation]=useState(''); const [eImage, setEImage]=useState(''); const [eSup, setESup]=useState(''); const [ePin, setEPin]=useState(''); const [eNote, setENote]=useState(''); const [eCreditLimit, setECreditLimit]=useState(''); const [eSalesTarget, setESalesTarget]=useState('');
  const [eIsVerified, setEIsVerified] = useState(false);
  
  const [dTab, setDTab] = useState<'history'|'analytics'>('history');
  const [historyFilter, setHistoryFilter] = useState<'ALL'|'PURCHASES'|'PAYMENTS'>('ALL');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const [cropTarget, setCropTarget] = useState<'add'|'edit'>('edit');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'add'|'edit') => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setCropTarget(target);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => { supabase.from('profiles').select('id,full_name').eq('role','SUPPLIER').then(({data}) => { if (data) setSuppliers(data); }); }, []);

  useEffect(() => {
    if (drawer) {
      setEName(drawer.name); setEPhone(drawer.phone); setEEmail(drawer.email || '');
      setEUsername(drawer.username || ''); setEPassword(drawer.password || '');
      setELocation(drawer.location || ''); setEImage(drawer.image || '');
      setESup(drawer.assignedSupplierId || ''); setEPin(drawer.pin || ''); setDTab('history');
      setEIsVerified(drawer.is_verified || false);
      try {
         const parsed = JSON.parse(drawer.notes || '{}');
         setECreditLimit(parsed.creditLimit ? String(parsed.creditLimit) : '');
         setESalesTarget(parsed.salesTarget ? String(parsed.salesTarget) : '');
         setENote(parsed.memo || '');
      } catch (err) { setECreditLimit(''); setESalesTarget(''); setENote(drawer.notes || ''); }
    }
  }, [drawer]);

  const list = useMemo(() => {
    let res = [...customers];
    const q = search.toLowerCase();
    if(q) res = res.filter(c => c.name.toLowerCase().includes(q) || (c.location||'').toLowerCase().includes(q) || (c.phone||'').includes(q));
    if (filterMode==='DEBT') res = res.filter(c=>c.debtBalance>0);
    if (filterMode==='CLEAN') res = res.filter(c=>c.debtBalance===0);
    if (filterMode==='VIP') res = res.filter(c=>(c.loyaltyPoints||0)>=100);
    if (filterMode==='RISK') res = res.filter(c=>{ try { const p=JSON.parse(c.notes||'{}'); return (p.creditLimit>0&&c.debtBalance>p.creditLimit); }catch(e){return false;} });
    if (sortMode==='A-Z') res.sort((a,b)=>a.name.localeCompare(b.name));
    if (sortMode==='DEBT') res.sort((a,b)=>b.debtBalance - a.debtBalance);
    if (sortMode==='VIP') res.sort((a,b)=>(b.loyaltyPoints||0)-(a.loyaltyPoints||0));
    return res;
  }, [customers, search, filterMode, sortMode]);

  // const debtorCount = customers.filter(c => c.debtBalance > 0).length;
  // const riskCount = customers.filter(c=>{ try { const p = JSON.parse(c.notes||'{}'); return (p.creditLimit > 0 && c.debtBalance > p.creditLimit); } catch(e){return false;} }).length;

  // const handleGlobalSync = async () => { setIsSyncing(true); await refreshData(); setTimeout(()=>setIsSyncing(false),800); };
  
  const checkUniqueness = async (u: string, p: string, origU?: string, origP?: string) => {
    let unToCheck = (u && u.trim() && u.trim().toLowerCase() !== origU?.toLowerCase()) ? u.trim().toLowerCase() : '';
    let phToCheck = (p && p.trim() && p.trim() !== origP?.trim()) ? p.trim() : '';
    if (!unToCheck && !phToCheck) return;
    const { data: avail, error } = await supabase.rpc('check_account_availability', { chk_username: unToCheck, chk_phone: phToCheck });
    if (error) throw new Error('Database Error: Unable to verify uniqueness.');
    if (avail?.username_taken) throw new Error('🚨 ALREADY EXISTS! This Username is currently taken by another user in the database.');
    if (avail?.phone_taken) throw new Error('🚨 ALREADY EXISTS! This Phone Number is taken and cannot be duplicated.');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      await checkUniqueness(fUsername, fPhone);
      const newId = crypto.randomUUID();
      const compiledNotes = JSON.stringify({ creditLimit: Number(fCreditLimit) || 0, salesTarget: Number(fSalesTarget) || 0, memo: fNote });
      if (fEmail && fPassword) {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: sData, error: sErr } = await supabase.auth.signUp({ email: fEmail.trim().toLowerCase(), password: fPassword, options: { data: { role:'CUSTOMER', full_name:fName } } });
        if (sErr) throw sErr;
        if (session) await supabase.auth.setSession(session);
        const uid = sData.user?.id || newId;

        // Use upsert to avoid double-create from auth triggers
        await supabase.from('profiles').upsert({ 
           id:uid, full_name:fName, role:'CUSTOMER',
           username: fUsername || fEmail.split('@')[0],
           phone: fPhone || null, avatar_url: fImage || null
        }, { onConflict: 'id' });

        // Check if customer already exists (auth trigger may have created one)
        const { data: existingCust } = await supabase.from('customers').select('id').eq('id', uid).maybeSingle();
        if (!existingCust) {
          await addCustomer({ id:uid, profile_id:uid, name:fName, email:fEmail, phone:fPhone, username:fUsername||fEmail.split('@')[0], location:fLocation, image:fImage, debtBalance:0, loyaltyPoints:0, assignedSupplierId:fSup||undefined, pin:fPin||undefined, notes:compiledNotes });
        } else {
          // Update existing record with full details
          await updateCustomer({ id:uid, profile_id:uid, name:fName, email:fEmail, phone:fPhone, username:fUsername||fEmail.split('@')[0], location:fLocation, image:fImage, debtBalance:0, loyaltyPoints:0, assignedSupplierId:fSup||undefined, pin:fPin||undefined, notes:compiledNotes });
        }
      } else {
        await addCustomer({ id:newId, name:fName, phone:fPhone, email:fEmail, username:fUsername, image:fImage, debtBalance:0, loyaltyPoints:0, location:fLocation, notes:compiledNotes, assignedSupplierId:fSup||undefined, pin:fPin||undefined });
      }
      setIsAdding(false); setFName(''); setFPhone(''); setFEmail(''); setFUsername(''); setFPassword(''); setFLocation(''); setFImage(''); setFSup(''); setFPin(''); setFCreditLimit(''); setFSalesTarget(''); setFNote('');
      await refreshData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); isSubmitting.current = false; }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!eName || !drawer || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      await checkUniqueness(eUsername, ePhone, drawer.username, drawer.phone);
      const compiledNotes = JSON.stringify({ creditLimit: Number(eCreditLimit) || 0, salesTarget: Number(eSalesTarget) || 0, memo: eNote });
      
      // Write is_verified to the customers table too
      await updateCustomer({ 
        ...drawer, name:eName, phone:ePhone, email:eEmail, username:eUsername, 
        password:ePassword, location:eLocation, image:eImage, 
        assignedSupplierId: eSup || undefined, 
        pin: ePin || undefined, 
        is_verified: eIsVerified,
        notes:compiledNotes 
      } as any);
      
      // SYNC to Auth system and profiles table
      if (drawer.profile_id || drawer.id) {
         const targetId = drawer.profile_id || drawer.id;
         
         const { error: rpcErr } = await supabase.rpc('admin_update_user_credentials', {
            target_user_id: targetId,
            new_email: eEmail !== drawer.email ? eEmail : null,
            new_password: ePassword ? ePassword : null,
            new_username: eUsername !== drawer.username ? eUsername : null
         });

         // Always sync these fields to profiles, regardless of RPC result
         await supabase.from('profiles').update({
            full_name: eName, phone: ePhone || null,
            avatar_url: eImage || null, is_verified: eIsVerified,
            ...(rpcErr ? { username: eUsername ? eUsername.toLowerCase().trim() : null } : {})
         }).eq('id', targetId);
         
         if (rpcErr) console.warn('Auth credential sync failed, basic profile updated:', rpcErr);
      }

      await refreshData(); alert('Client details updated.');
      setEditModalOpen(false);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); isSubmitting.current = false; }
  };

  const applyBestQuota = () => {
     if(!aov) return alert('Insufficient transaction data to model limit.');
     const rec = Math.round((aov * 3) / 1000) * 1000;
     setECreditLimit(String(rec));
  };

  const drawerMetrics = useMemo(() => {
    if (!drawer) return null;
    const txs = transactions.filter(t => t.customerId === drawer.id).sort((a,b)=>new Date(a.date).getTime() - new Date(b.date).getTime());
    const pays = debtPayments.filter(p => p.customerId === drawer.id);
    return { txs, lifetimeValue: txs.reduce((s,t)=>s+t.totalPrice,0), totalPaid: pays.reduce((s,p)=>s+p.amount,0), txCount: txs.length }
  }, [drawer, transactions, debtPayments]);

  const networkRank = useMemo(() => {
      if(!drawerMetrics || !drawer || customers.length===0) return null;
      if(drawerMetrics.lifetimeValue === 0) return 99;
      const lvs = customers.map(c => transactions.filter(t=>t.customerId===c.id).reduce((s,t)=>s+t.totalPrice,0)).sort((a,b)=>a-b);
      const countBelow = lvs.filter(v => v < drawerMetrics.lifetimeValue).length;
      let perc = 100 - Math.round((countBelow / lvs.length) * 100);
      return perc <= 0 ? 1 : perc; 
  }, [drawerMetrics, customers, transactions, drawer]);

  const aov = useMemo(() => {
     if(!drawerMetrics || !drawerMetrics.txCount) return 0;
     return Math.round(drawerMetrics.lifetimeValue / drawerMetrics.txCount);
  }, [drawerMetrics]);

  const timelineFull = useMemo(() => {
     if(!drawer) return [];
     const t = transactions.filter(t=>t.customerId===drawer.id).map(t=>({id:t.id, type:'PURCHASE', amt:t.totalPrice, date:t.date, isDebt:t.type==='Debt'}));
     const p = debtPayments.filter(p=>p.customerId===drawer.id).map(p=>({id:p.id, type:'PAYMENT', amt:p.amount, date:p.date, isDebt:false}));
     let combined = [...t,...p].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime());
     
     if (historyFilter === 'PURCHASES') combined = combined.filter(x => x.type === 'PURCHASE');
     if (historyFilter === 'PAYMENTS') combined = combined.filter(x => x.type === 'PAYMENT');
     return combined;
  }, [drawer, transactions, debtPayments, historyFilter]);

  const trustScore = useMemo(() => {
     if(!drawer) return 100;
     let s = 80;
     if(drawerMetrics?.txCount && drawerMetrics.txCount>5) s+=10;
     if(drawer.loyaltyPoints && drawer.loyaltyPoints>200) s+=5;
     if(drawer.debtBalance>0) s-=(drawer.debtBalance/50000)*10;
     const lim = Number(eCreditLimit)||0;
     if(lim>0 && drawer.debtBalance > lim) s-=30;
     return Math.max(1, Math.min(100, Math.round(s)));
  }, [drawer, drawerMetrics, eCreditLimit]);

  const limitNum = Number(eCreditLimit) || 0;
  const usedPercent = limitNum > 0 ? Math.min(100, Math.round((drawer?.debtBalance||0) / limitNum * 100)) : 0;
  const visualChartData = useMemo(() => {
     if(!drawerMetrics || drawerMetrics.txs.length < 3) return null;
     return drawerMetrics.txs.slice(-7).map((t,i)=>({name:i, amt:t.totalPrice}));
  }, [drawerMetrics]);

  // CRM AI Segmentation Tags
  const aiTags = useMemo(() => {
     if (!drawerMetrics || !drawer) return [];
     const tags = [];
     if(aov >= 150000) tags.push({label:'🐋 High Roller', bg:'#dbeafe', color:'#1e3a8a'});
     if(drawerMetrics.txCount >= 10) tags.push({label:'⭐ Loyal Regular', bg:'#fef9c3', color:'#854d0e'});
     if(drawerMetrics.totalPaid > 0 && drawer.debtBalance === 0) tags.push({label:'🛡️ Reliable Payer', bg:'#dcfce7', color:'#166534'});
     try {
        const p = JSON.parse(drawer.notes||'{}');
        if(p.creditLimit > 0 && drawer.debtBalance > p.creditLimit) tags.push({label:'⚠️ Over-Leveraged', bg:'#fee2e2', color:'#991b1b'});
     } catch(e){}
     if(drawerMetrics.txCount === 0) tags.push({label:'🌱 Fresh Lead', bg:'#f3f4f6', color:'#4b5563'});
     return tags;
  }, [drawerMetrics, drawer, aov]);

  const copyCustomerReport = () => {
      if(!drawer) return;
      const text = `📋 *EXECUTIVE REPORT: ${drawer.name}*
------------------------------
👤 *ID:* ${drawer.id.slice(0,8)}
🎯 *Status:* ${drawer.debtBalance===0 ? 'Clean Record' : 'Active Liability'}
📊 *Trust Score:* ${trustScore}% (Top ${networkRank}% Network)

💼 *FINANCIALS*
• Total Volume: ₦${drawerMetrics?.lifetimeValue.toLocaleString()}
• Debt Outstanding: ₦${drawer.debtBalance.toLocaleString()}
• AOV: ₦${aov.toLocaleString()}

📍 ${drawer.phone || 'No Phone'} | ${drawer.location || 'No Location'}
Generated via Admin Console.`;
      navigator.clipboard.writeText(text).then(()=>alert('Professional report copied to clipboard.'));
  };

  return (
    <AnimatedPage>
      <div style={{background:T.bg,minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:'110px', paddingTop:'env(safe-area-inset-top)'}}>
        
        {/* MAIN DASHBOARD LIST VIEW */}
        <div style={{padding:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:T.ink,margin:0,letterSpacing:'-0.02em'}}>Customers</h1>
              <p style={{color:T.txt2,fontSize:'14px',margin:'4px 0 0'}}>Manage your client directory</p>
            </div>
            <button onClick={()=>setIsAdding(true)} style={{display:'flex',alignItems:'center',gap:'8px',background:T.txt,color:'#fff',padding:'10px 16px',borderRadius:'12px',fontWeight:600,fontSize:'14px',border:'none',cursor:'pointer',boxShadow:T.shadow}}>
               <UserPlus size={16}/> Add Client
            </button>
          </div>

          <div style={{display:'flex',gap:'12px',marginBottom:'16px',flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:'1 1 200px'}}>
              <Search size={18} color={T.txt3} style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input style={{...inp,paddingLeft:'44px',height:'48px'}} placeholder="Search name, phone, email..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select style={{...inp, flex:'0 1 auto', width:'auto', height:'48px', padding:'0 16px', fontSize:'14px'}} value={sortMode} onChange={e=>setSortMode(e.target.value as any)}>
               <option value="A-Z">Sort A-Z</option><option value="DEBT">Highest Debt</option><option value="VIP">Top loyalty</option>
            </select>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {list.map(customer=>{
              const [ac,lc]=getAvatar(customer.name);
              const isDebt=customer.debtBalance>0;
              let overLimit = false; try { const p = JSON.parse(customer.notes||'{}'); if(p.creditLimit > 0 && customer.debtBalance > p.creditLimit) overLimit = true; } catch(e){}

              return(
                <motion.div key={customer.id} whileTap={{scale:0.98}} onClick={()=>setDrawerId(customer.id)}
                  style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'16px',padding:'16px',boxShadow:T.shadow,cursor:'pointer',display:'flex',alignItems:'center',gap:'16px'}}>
                  <div style={{width:'50px',height:'50px',borderRadius:'50%',background:lc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:700,color:ac,flexShrink:0,overflow:'hidden'}}>
                    {customer.image?<img src={customer.image} alt={customer.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:customer.name.charAt(0)}
                  </div>
                  
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                      <span style={{color:T.ink,fontWeight:700,fontSize:'16px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{customer.name}</span>
                      {overLimit&&<span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'6px',background:T.dangerLt,color:T.textDanger}}><AlertOctagon size={10}/> Limit</span>}
                    </div>
                    <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                      <span style={{color:T.txt2,fontSize:'13px'}}>{customer.phone || 'No phone'}</span>
                      <span style={{width:4,height:4,borderRadius:'50%',background:T.border}}/>
                      <span style={{color:customer.assignedSupplierId ? T.accent : T.txt3, fontSize:'11px', fontWeight:700}}>
                        {suppliers.find(s => s.id === customer.assignedSupplierId)?.full_name || 'Direct Bakery Client'}
                      </span>
                    </div>
                  </div>

                  <div style={{textAlign:'right',flexShrink:0}}>
                    {isDebt?(
                       <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                          <p style={{color:T.textWarn,fontWeight:700,fontSize:'15px',margin:0}}>₦{customer.debtBalance.toLocaleString()}</p>
                          <p style={{color:T.txt3,fontSize:'11px',margin:0}}>Pending</p>
                       </div>
                    ):(
                       <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                          <p style={{color:T.textSuccess,fontWeight:700,fontSize:'13px',margin:0,background:T.successLt,padding:'4px 8px',borderRadius:'8px'}}>Settled</p>
                       </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* PROVISIONING CENTERED MODAL */}
        <AnimatePresence>
          {isAdding&&(
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', padding: '20px' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: T.surface, width: '100%', maxWidth: '440px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowMd }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: T.ink }}>Add New Client</h3>
                   <button type="button" onClick={() => setIsAdding(false)} style={{ background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink }}><X size={16}/></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }} className="hide-scrollbar">
                   <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div><label style={lbl}>Legal/Business Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)} required/></div>
                         <div><label style={lbl}>Phone Number</label><input style={inp} value={fPhone} onChange={e=>setFPhone(e.target.value)}/></div>
                         <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)}/></div>
                         <div><label style={lbl}>Username</label><input style={inp} value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}/></div>
                         <div><label style={lbl}>Password (For Client Login)</label><input style={inp} type="password" value={fPassword} onChange={e=>setFPassword(e.target.value)}/></div>
                         <div><label style={lbl}>Security PIN (4-Digits)</label><input style={inp} type="text" placeholder="e.g. 1234" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value)}/></div>
                         <div>
                           <label style={lbl}>Customer Avatar (Upload)</label>
                           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                             {fImage ? <img src={fImage} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : null}
                             <label style={{ ...inp, cursor: 'pointer', textAlign: 'center', background: T.surface2, border: `1px dashed ${T.border}` }}>
                               <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageSelect(e, 'add')} />
                               {fImage ? 'Change Photo' : 'Tap to Upload Photo'}
                             </label>
                             {fImage ? <button type="button" onClick={() => setFImage('')} style={{ background: T.dangerLt, color: T.textDanger, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button> : null}
                           </div>
                         </div>
                         <div><label style={lbl}>Operations Base / Location</label><input style={inp} value={fLocation} onChange={e=>setFLocation(e.target.value)}/></div>
                         <div>
                            <label style={lbl}>Assigned Supplier / Manager</label>
                            <select style={inp} value={fSup} onChange={e=>setFSup(e.target.value)}>
                               <option value="">None (Direct Bakery Client)</option>
                               {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                            </select>
                         </div>
                      </div>
                      
                      <h4 style={{fontSize:'14px',fontWeight:600,color:T.ink,margin:'8px 0 0'}}>Initial Policies</h4>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                               <label style={{...lbl,margin:0}}>Credit Threshold (₦)</label>
                            </div>
                            <input style={inp} type="number" value={fCreditLimit} onChange={e=>setFCreditLimit(e.target.value)}/>
                         </div>
                      </div>

                      <button type="submit" disabled={loading} style={{background:T.ink,color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontWeight:600,fontSize:'14px',cursor:'pointer',marginTop:8}}>
                        {loading?'Enrolling...':'Create Client Account'}
                      </button>
                   </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 🔥 THE CLEAN, LIGHT CLIENT DETAILS DRAWER (Feature Bloated) 🔥 */}
        <AnimatePresence>
          {drawer && drawerMetrics && (
            <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(4px)',zIndex:100,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
               <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:26,stiffness:300}} style={{background:T.surface,height:'100vh',display:'flex',flexDirection:'column'}}>
                 
                 {/* Header: Client details */}
                 <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px',borderBottom:`1px solid ${T.border}`,background:T.surface}}>
                    <button onClick={()=>setDrawerId(null)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',marginLeft:'-8px'}}><ArrowLeft size={20} color={T.ink}/></button>
                    <h2 style={{fontSize:'18px',fontWeight:600,color:T.ink,margin:0,flex:1}}>Client details</h2>
                    <button onClick={()=>setShowDeleteModal(true)} style={{background:T.dangerLt,border:'none',padding:'8px 14px',borderRadius:'10px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',color:T.danger,fontSize:'13px',fontWeight:700}}>
                       <Trash2 size={14}/> Delete
                    </button>
                 </div>

                 <div style={{flex:1,overflowY:'auto'}} className="hide-scrollbar">
                    
                    <div style={{padding:'20px'}}>
                       {/* Banner & Avatar Container */}
                       <div style={{background:'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',height:'110px',borderRadius:'16px',position:'relative'}}>
                         {/* Network Level Stars */}
                         {drawer.loyaltyPoints && drawer.loyaltyPoints > 0 && (
                            <div style={{position:'absolute', bottom:10, right:16, display:'flex', gap:2}} title={`Loyalty: ${drawer.loyaltyPoints}`}>
                               {Array.from({length: Math.min(5, Math.ceil(drawer.loyaltyPoints/50))}).map((_,index)=> <Star key={index} size={14} color="#f59e0b" fill="#fcd34d" />)}
                            </div>
                         )}
                       </div>
                       
                       {/* Overlapping Avatar */}
                       <div style={{display:'flex',padding:'0 16px',marginTop:'-40px',position:'relative'}}>
                           <div style={{width:'84px',height:'84px',borderRadius:'50%',background:getAvatar(drawer.name)[1],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',fontWeight:700,color:getAvatar(drawer.name)[0],border:`4px solid ${T.surface}`,boxShadow:T.shadow,overflow:'hidden'}}>
                             {drawer.image?<img src={drawer.image} alt={drawer.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:drawer.name.charAt(0)}
                           </div>
                       </div>

                       {/* Customer Info Block */}
                       <div style={{marginTop:'12px'}}>
                          <h1 style={{fontSize:'22px',fontWeight:700,color:T.ink,margin:0,display:'flex',alignItems:'center',gap:6}}>{drawer.name} {drawer.pin && <BadgeCheck size={16} color={T.success}/>}</h1>
                          <p style={{color:T.accent,fontSize:'14px',fontWeight:500,margin:'4px 0 0'}}>@{drawer.username || 'client_'+drawer.id.substring(0,4)}</p>
                          
                          {/* AI Segmentation Tags */}
                          {aiTags.length > 0 && (
                             <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                                {aiTags.map((tag,idx) => (
                                   <span key={idx} style={{background:tag.bg, color:tag.color, padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
                                      {tag.label}
                                   </span>
                                ))}
                             </div>
                          )}

                          <div style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
                             {drawer.email && <span style={{color:T.txt2,fontSize:'14px'}}>Email: {drawer.email}</span>}
                             {drawer.phone && <span style={{color:T.txt2,fontSize:'14px'}}>Phone: {drawer.phone}</span>}
                          </div>

                          {/* Quick Actions */}
                          <div style={{display:'flex',gap:'10px',marginTop:'20px'}}>
                             <button onClick={()=>window.open(`https://wa.me/${drawer.phone?.replace(/\D/g,'')}`)} style={{background:'#f59e0b',color:'#fff',padding:'10px',borderRadius:'10px',display:'flex',alignItems:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:'none',cursor:'pointer',flex:1,justifyContent:'center',whiteSpace:'nowrap'}}>
                                <MessageCircle size={16}/> Message
                             </button>
                             <button onClick={copyCustomerReport} style={{background:T.surface2,color:T.ink,padding:'10px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:`1px solid ${T.border}`,cursor:'pointer',flex:1,whiteSpace:'nowrap'}}>
                                <ClipboardList size={16}/> Report
                             </button>
                             <button onClick={()=>setEditModalOpen(true)} style={{background:T.surface,color:T.ink,padding:'10px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${T.border}`,cursor:'pointer'}} title="Edit Client">
                                <Edit2 size={16}/>
                             </button>
                          </div>
                          
                          {/* Notes Preview Block */}
                          <div style={{marginTop:'28px'}}>
                             <h3 style={{fontSize:'15px',fontWeight:600,color:T.ink,margin:'0 0 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                Notes <button onClick={()=>setEditModalOpen(true)} style={{background:'none',border:'none',color:T.accent,fontSize:'12px',cursor:'pointer'}}>Edit</button>
                             </h3>
                             <p style={{color:T.txt2,fontSize:'14px',lineHeight:1.6,margin:0}}>{eNote || 'No internal notes captured for this client. Lorem ipsum text acts as placeholder if none exists.'}</p>
                          </div>

                          {/* Address / Map Placeholder Block */}
                          <div style={{marginTop:'24px'}}>
                             <h3 style={{fontSize:'15px',fontWeight:600,color:T.ink,margin:'0 0 8px'}}>Address</h3>
                             <p style={{color:T.txt2,fontSize:'14px',margin:'0 0 12px'}}>{drawer.location || '1901 Thornridge Cir. Shiloh, null'}</p>
                             <div onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drawer.location||'')}`)} style={{background:'#e5e7eb',height:'100px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',backgroundImage:'url("https://maps.googleapis.com/maps/api/staticmap?center=location&zoom=13&size=600x300&maptype=roadmap&color=gray")',backgroundSize:'cover'}}>
                                <span style={{background:T.surface,padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:600,color:T.ink,boxShadow:T.shadow}}>View map</span>
                             </div>
                          </div>

                          {/* Pastel Badges (Trust Score, Rank) */}
                          <div style={{display:'flex',gap:12,marginTop:24,flexWrap:'wrap'}}>
                              <div style={{background:trustScore>=80?'#fdf2f8':'#fff1f2',border:`1px solid ${trustScore>=80?'#fbcfe8':'#fecdd3'}`,borderRadius:'12px',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flex:'1 1 140px'}}>
                                 <div style={{width:32,height:32,borderRadius:'50%',background:trustScore>=80?'#f472b6':'#fb7185',display:'flex',alignItems:'center',justifyContent:'center'}}><Shield size={16} color="#fff"/></div>
                                 <div style={{display:'flex',flexDirection:'column'}}>
                                   <span style={{fontSize:'11px',fontWeight:700,color:T.txt2}}>Trust Score</span>
                                   <span style={{fontSize:'14px',fontWeight:700,color:T.ink}}>{trustScore}%</span>
                                 </div>
                              </div>
                              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'12px',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flex:'1 1 140px'}}>
                                 <div style={{width:32,height:32,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center'}}><Target size={16} color="#fff"/></div>
                                 <div style={{display:'flex',flexDirection:'column'}}>
                                   <span style={{fontSize:'11px',fontWeight:700,color:T.txt2}}>Network Rank</span>
                                   <span style={{fontSize:'14px',fontWeight:700,color:T.ink}}>Top {networkRank}%</span>
                                 </div>
                              </div>
                          </div>
                       </div>
                    </div>

                    {/* Navigation Tabs Container */}
                    <div style={{marginTop:'12px',display:'flex',gap:'24px',borderBottom:`1px solid ${T.border}`,padding:'0 24px'}}>
                       {['history', 'analytics'].map(tab => (
                          <button key={tab} onClick={()=>setDTab(tab as any)} style={{background:'none',border:'none',borderBottom:dTab===tab?`2px solid ${T.accent}`:'2px solid transparent',padding:'12px 0',fontSize:'14px',fontWeight:dTab===tab?600:500,color:dTab===tab?T.accent:T.txt2,cursor:'pointer',textTransform:'capitalize'}}>
                             {tab}
                          </button>
                       ))}
                    </div>

                    {/* TAB CONTENTS */}
                    <div style={{padding:'24px'}}>
                       
                       {dTab === 'history' && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}}>
                             <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
                                <div style={{background:T.surface2,padding:'16px',borderRadius:'12px',flex:1}}>
                                   <p style={{fontSize:'20px',fontWeight:700,margin:0,color:T.ink}}>{drawerMetrics.txCount}</p>
                                   <p style={{fontSize:'13px',color:T.txt2,margin:'4px 0 0'}}>Invoices total</p>
                                </div>
                                <div style={{background:T.successLt,padding:'16px',borderRadius:'12px',flex:1}}>
                                   <p style={{fontSize:'20px',fontWeight:700,margin:0,color:T.textSuccess}}>₦{drawerMetrics.lifetimeValue.toLocaleString()}</p>
                                   <p style={{fontSize:'13px',color:T.textSuccess,margin:'4px 0 0'}}>Total volume</p>
                                </div>
                             </div>

                             {/* Tab Filters for Invoices */}
                             <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto'}} className="hide-scrollbar">
                                {['ALL', 'PURCHASES', 'PAYMENTS'].map((f) => (
                                   <button key={f} onClick={() => setHistoryFilter(f as any)} style={{background:historyFilter===f?T.ink:T.surface2,color:historyFilter===f?'#fff':T.txt2,padding:'6px 12px',borderRadius:'8px',fontSize:'12px',fontWeight:600,border:'none',cursor:'pointer'}}>
                                      {f}
                                   </button>
                                ))}
                             </div>

                             <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                                <span style={{fontSize:'14px',fontWeight:600,color:T.txt2}}>Invoice</span>
                                <span style={{fontSize:'14px',fontWeight:600,color:T.txt2}}>Status</span>
                             </div>

                             {/* Verification Status Toggle (Phase 9) */}
                             <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:eIsVerified ? T.successLt : T.surface2,padding:'12px 16px',borderRadius:'14px',marginBottom:'24px',border:`1px solid ${eIsVerified ? T.success : T.border}`,transition:'all 0.3s'}}>
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                   <div style={{width:32,height:32,borderRadius:'10px',background:eIsVerified ? T.success : T.txt3,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                      <BadgeCheck size={18} color="#fff"/>
                                   </div>
                                   <div>
                                      <div style={{fontSize:'13px',fontWeight:800,color:eIsVerified ? T.textSuccess : T.ink}}>Identity Verification</div>
                                      <div style={{fontSize:'10px',fontWeight:600,color:T.txt2}}>{eIsVerified ? 'Customer is verified for credit' : 'Pending verification'}</div>
                                   </div>
                                </div>
                                <div 
                                  onClick={async () => {
                                    if (!drawer) return;
                                    const newVal = !eIsVerified;
                                    setEIsVerified(newVal);
                                    try {
                                      await verifyCustomer(drawer.id, newVal);
                                    } catch (err) {
                                      setEIsVerified(!newVal);
                                    }
                                  }}
                                  style={{width:'44px',height:'24px',borderRadius:'12px',background:eIsVerified?T.success:T.txt3,position:'relative',cursor:'pointer',transition:'background 0.3s'}}
                                >
                                   <motion.div animate={{x: eIsVerified ? 22 : 2}} style={{width:'20px',height:'20px',borderRadius:'10px',background:'#fff',marginTop:2,boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}/>
                                </div>
                             </div>

                             <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                                {timelineFull.length===0?<p style={{color:T.txt3,fontSize:14,textAlign:'center'}}>No items recorded.</p> : timelineFull.map((item,i) => (
                                   <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:i!==timelineFull.length-1?`1px solid ${T.border}`:'none'}}>
                                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                         <div style={{width:'36px',height:'36px',borderRadius:'8px',background:T.surface2,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                            <InvoiceIcon size={16} color={T.txt3}/>
                                         </div>
                                         <div style={{display:'flex',flexDirection:'column'}}>
                                            <span style={{fontSize:'14px',fontWeight:600,color:T.ink}}>Record #{item.id.slice(0,5).toUpperCase()}</span>
                                            <span style={{fontSize:'12px',color:T.txt3}}>{formatDate(item.date)}</span>
                                         </div>
                                      </div>
                                      
                                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                                         <span style={{fontSize:'14px',fontWeight:700,color:T.ink}}>₦{item.amt.toLocaleString()}</span>
                                         {item.type==='PURCHASE' ? (
                                            item.isDebt ? 
                                               <span style={{background:T.warnLt,color:T.textWarn,padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><Clock size={10}/> Pending</span> 
                                            : 
                                               <span style={{background:T.successLt,color:T.textSuccess,padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><CheckCircle2 size={10}/> Done</span>
                                         ) : (
                                            <span style={{background:T.successLt,color:T.textSuccess,padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><CheckCircle2 size={10}/> Paid</span>
                                         )}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </motion.div>
                       )}

                       {dTab === 'analytics' && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}} style={{display:'flex',flexDirection:'column',gap:16}}>
                             <div style={{background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`}}>
                                <h4 style={{fontSize:'14px',fontWeight:600,color:T.txt2,margin:'0 0 16px'}}>AOV / Volume Metrics</h4>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                                   <p style={{fontSize:'28px',fontWeight:700,margin:0,color:T.ink}}>₦{aov.toLocaleString()}</p>
                                </div>
                                <p style={{fontSize:'13px',color:T.txt3,margin:0}}>Average Order Value over {drawerMetrics.txCount} transactions</p>

                                {visualChartData && (
                                   <div style={{height:'100px',marginTop:'20px'}}>
                                      <ResponsiveContainer width="100%" height="100%">
                                         <BarChart data={visualChartData}>
                                            <Bar dataKey="amt" fill={T.txt3} radius={[4,4,0,0]} />
                                         </BarChart>
                                      </ResponsiveContainer>
                                   </div>
                                )}
                             </div>

                             {limitNum > 0 && (
                                <div style={{background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`}}>
                                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'12px'}}>
                                      <div><p style={{fontSize:'13px',fontWeight:600,color:T.txt2,margin:'0 0 4px'}}>Credit Utilization</p><p style={{fontSize:'20px',fontWeight:700,color:T.ink,margin:0}}>{usedPercent}%</p></div>
                                      <div style={{textAlign:'right'}}><p style={{fontSize:'12px',fontWeight:500,color:T.txt3,margin:'0 0 4px'}}>Available</p><p style={{fontSize:'14px',fontWeight:600,color:T.ink,margin:0}}>₦{(limitNum - drawer.debtBalance).toLocaleString()}</p></div>
                                   </div>
                                   <div style={{width:'100%',height:'6px',background:T.surface2,borderRadius:'10px',overflow:'hidden'}}><div style={{height:'100%',background:usedPercent>=100?T.danger:usedPercent>=80?T.warn:T.success,borderRadius:'10px',width:`${usedPercent}%`}}/></div>
                                </div>
                             )}
                          </motion.div>
                       )}

                    </div>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Floating Edit Modal in Center */}
        <AnimatePresence>
          {editModalOpen && drawer && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', padding: '20px' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: T.surface, width: '100%', maxWidth: '440px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowMd }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: T.ink }}>Edit Client Profile</h3>
                   <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink }}><X size={16}/></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }} className="hide-scrollbar">
                   <form onSubmit={saveEdit} style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div><label style={lbl}>Legal/Business Name</label><input style={inp} value={eName} onChange={e=>setEName(e.target.value)} required/></div>
                         <div><label style={lbl}>Business Registration No. (Optional)</label><input style={inp} placeholder="RC-123456" /></div>
                         <div><label style={lbl}>Phone Number</label><input style={inp} value={ePhone} onChange={e=>setEPhone(e.target.value)} required/></div>
                         <div><label style={lbl}>Email Address</label><input style={inp} type="email" value={eEmail} onChange={e=>setEEmail(e.target.value)}/></div>
                         <div><label style={lbl}>Username</label><input style={inp} value={eUsername} onChange={e=>setEUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}/></div>
                         <div><label style={lbl}>Password</label><input style={inp} type="text" placeholder="Leave blank to keep current" value={ePassword} onChange={e=>setEPassword(e.target.value)}/></div>
                         <div><label style={lbl}>Security PIN (4-Digits)</label><input style={inp} type="text" placeholder="e.g. 1234" maxLength={4} value={ePin} onChange={e=>setEPin(e.target.value)}/></div>
                         <div>
                           <label style={lbl}>Customer Avatar (Upload)</label>
                           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                             {eImage ? <img src={eImage} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : null}
                             <label style={{ ...inp, cursor: 'pointer', textAlign: 'center', background: T.surface2, border: `1px dashed ${T.border}` }}>
                               <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageSelect(e, 'edit')} />
                               {eImage ? 'Change Photo' : 'Tap to Upload Photo'}
                             </label>
                             {eImage ? <button type="button" onClick={() => setEImage('')} style={{ background: T.dangerLt, color: T.textDanger, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button> : null}
                           </div>
                         </div>
                         <div><label style={lbl}>Operations Base / Location</label><input style={inp} value={eLocation} onChange={e=>setELocation(e.target.value)}/></div>
                         <div>
                            <label style={lbl}>Assigned Supplier / Manager</label>
                            <select style={inp} value={eSup} onChange={e=>setESup(e.target.value)}>
                               <option value="">None (Direct Bakery Client)</option>
                               {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                            </select>
                         </div>
                         
                         {/* Verification Toggle in Modal */}
                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',background:T.surface2,borderRadius:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                               <BadgeCheck size={16} color={eIsVerified ? T.success : T.txt3}/>
                               <span style={{fontSize:'13px',fontWeight:700,color:T.ink}}>Verified Status</span>
                            </div>
                            <div onClick={() => setEIsVerified(!eIsVerified)} style={{width:'40px',height:'20px',borderRadius:'10px',background:eIsVerified?T.success:T.txt3,position:'relative',cursor:'pointer'}}>
                               <motion.div animate={{x: eIsVerified ? 22 : 2}} style={{width:'16px',height:'16px',borderRadius:'8px',background:'#fff',marginTop:2}}/>
                            </div>
                         </div>
                      </div>
                      
                      <h4 style={{fontSize:'14px',fontWeight:600,color:T.ink,margin:'8px 0 0'}}>Restricted Policies</h4>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                               <label style={{...lbl,margin:0}}>Credit Threshold (₦)</label>
                               <button type="button" onClick={applyBestQuota} style={{background:T.surface2,color:T.ink,border:'none',borderRadius:'6px',padding:'4px 8px',fontSize:'10px',fontWeight:600}}>Auto-tune</button>
                            </div>
                            <input style={inp} type="number" value={eCreditLimit} onChange={e=>setECreditLimit(e.target.value)}/>
                         </div>
                         <div><label style={lbl}>Override Memo / Internal Note</label><textarea style={{...inp,resize:'none',height:100}} value={eNote} onChange={e=>setENote(e.target.value)}></textarea></div>
                      </div>

                      <button type="submit" disabled={loading} style={{background:T.ink,color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontWeight:600,fontSize:'14px',cursor:'pointer',marginTop:8}}>
                        {loading?'Saving updates...':'Save Configuration'}
                      </button>
                   </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ImageCropModal 
          isOpen={cropModalOpen} 
          imageSrc={tempImage} 
          onClose={() => setCropModalOpen(false)} 
          onCropCompleteAction={(res) => { 
            if (cropTarget === 'edit') setEImage(res); 
            else setFImage(res);
            setCropModalOpen(false); 
          }} 
        />
      </div>

      {/* 🗑️ DELETE CONFIRMATION MODAL — PIN PROTECTED */}
      <AnimatePresence>
        {showDeleteModal && drawer && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
            onClick={(e) => { if(e.target === e.currentTarget){ setShowDeleteModal(false); setDeletePin(''); setDeletePinError(false); } }}
          >
            <motion.div
              initial={{scale:0.85,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0}}
              style={{background:T.surface,borderRadius:'28px',padding:'32px 28px',maxWidth:'390px',width:'100%',textAlign:'center',boxShadow:'0 30px 80px rgba(239,68,68,0.15), 0 10px 30px rgba(0,0,0,0.2)'}}
            >
              {/* Danger Icon */}
              <motion.div
                animate={deletePinError ? {x:[0,-8,8,-8,8,0]} : {x:0}}
                transition={{duration:0.4}}
                style={{width:'68px',height:'68px',borderRadius:'22px',background:'linear-gradient(135deg,#fee2e2,#fecaca)',border:'2px solid #fca5a5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 8px 24px rgba(239,68,68,0.2)'}}
              >
                <Trash2 size={30} color={T.danger}/>
              </motion.div>

              <h2 style={{fontSize:'21px',fontWeight:900,color:T.ink,margin:'0 0 6px',letterSpacing:'-0.02em'}}>Tabbatar da Share</h2>
              <p style={{fontSize:'13px',color:T.txt2,margin:'0 0 4px'}}>Kana gab da share dukkan bayanin:</p>
              <div style={{fontSize:'16px',fontWeight:800,color:T.danger,padding:'10px 16px',background:T.dangerLt,borderRadius:'12px',margin:'0 0 8px',border:'1px solid #fecaca'}}>
                {drawer.name}
              </div>
              <p style={{fontSize:'11px',color:T.txt3,margin:'0 0 24px',lineHeight:1.6}}>
                ⚠️ Wannan aikin ba zai iya juya baya ba. Saka PIN ɗinka na Admin don tabbatarwa.
              </p>

              {/* PIN Input */}
              <div style={{marginBottom:'20px',textAlign:'left'}}>
                <label style={{fontSize:'11px',fontWeight:800,color:deletePinError?T.danger:T.txt2,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:'8px'}}>
                  {deletePinError ? '❌ PIN ba daidai ba ne! Gwada kuma.' : '🔐 Admin PIN'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={deletePin}
                  onChange={e => { setDeletePin(e.target.value); setDeletePinError(false); }}
                  placeholder="Enter your admin PIN"
                  autoFocus
                  style={{width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:'14px',border:`2px solid ${deletePinError?T.danger:T.border}`,background:deletePinError?T.dangerLt:T.surface2,fontSize:'18px',fontWeight:700,color:T.ink,outline:'none',letterSpacing:'0.2em',textAlign:'center',transition:'all 0.2s'}}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
                  }}
                />
              </div>

              <div style={{display:'flex',gap:'12px'}}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletePin(''); setDeletePinError(false); }}
                  style={{flex:1,padding:'14px',borderRadius:'14px',border:`1.5px solid ${T.border}`,background:T.surface2,color:T.txt2,fontSize:'14px',fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}
                >
                  Soke
                </button>
                <button
                  disabled={deleteLoading || !deletePin}
                  onClick={async () => {
                    // Validate PIN against admin PIN
                    const correctPin = appSettings?.adminPin || '0018';
                    if (deletePin !== correctPin) {
                      setDeletePinError(true);
                      setDeletePin('');
                      return;
                    }
                    setDeleteLoading(true);
                    try {
                      if (drawer.profile_id) {
                        await supabase.from('profiles').delete().eq('id', drawer.profile_id);
                      }
                      await deleteCustomer(drawer.id);
                      setShowDeleteModal(false);
                      setDeletePin('');
                      setDeletePinError(false);
                      setDrawerId(null);
                      await refreshData();
                    } catch (err: any) {
                      alert('Kuskure: ' + err.message);
                    } finally {
                      setDeleteLoading(false);
                    }
                  }}
                  style={{flex:1,padding:'14px',borderRadius:'14px',border:'none',background:(!deletePin||deleteLoading)?T.txt3:T.danger,color:'#fff',fontSize:'14px',fontWeight:800,cursor:(!deletePin||deleteLoading)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.2s',boxShadow:deletePin?'0 4px 20px rgba(239,68,68,0.35)':'none'}}
                >
                  <Trash2 size={15}/>
                  {deleteLoading ? 'Ana share...' : 'Share'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
};

export default ManagerCustomers;