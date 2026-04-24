import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { useAppContext } from '../store/AppContext';
import {
  ShieldCheck, Languages, LogOut,
  Package, CreditCard, TrendingUp,
  ChevronRight, Star, Edit2, Check, X,
  Users, Clock,
  Copy, Camera, RefreshCw, BarChart3, Receipt, Wallet, ArrowLeft,
  BadgeCheck, Target, Hammer, History, Key
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { ImageCropModal } from '../components/ImageCropModal';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg:'#f8fafc', 
  surface:'#ffffff', 
  surface2:'#f1f5f9', 
  border:'#e2e8f0',
  accent:'#4f46e5', 
  accentLt:'#eef2ff',
  success:'#10b981', 
  successLt:'#dcfce7', 
  textSuccess:'#166534',
  danger:'#ef4444', 
  dangerLt:'#fee2e2', 
  textDanger:'#991b1b',
  warn:'#f59e0b', 
  warnLt:'#fef3c7', 
  textWarn:'#92400e',
  amber:'#f59e0b', 
  ink:'#0f172a', 
  txt2:'#475569', 
  txt3:'#94a3b8',
  shadow:'0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd:'0 10px 25px -5px rgba(0,0,0,0.08)',
  radius:'16px', 
  radiusLg:'24px',
};

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

export default function SupplierProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer, linkProfileToRecord, refreshData } = useAppContext();
  const { language, setLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile,        setProfile]        = useState<any>(null);
  const [editing,        setEditing]        = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [dTab,           setDTab]           = useState<'overview' | 'financials' | 'security'>('overview');
  
  // Form States
  const [fName,          setFName]          = useState('');
  const [fPhone,         setFPhone]         = useState('');
  const [fUsername,      setFUsername]      = useState('');
  const [fAcctNo,        setFAcctNo]        = useState('');
  const [fBankName,      setFBankName]      = useState('');
  const [fWhatsapp,      setFWhatsapp]      = useState('');
  const [fAvatar,        setFAvatar]        = useState('');
  const [fLocation,      setFLocation]      = useState('');
  const [fBio,           setFBio]           = useState('');
  const [fAltPhone,      setFAltPhone]      = useState('');
  const [fEmployeeId,    setFEmployeeId]    = useState('');
  const [fPin,           setFPin]           = useState('');
  const [fPassword,      setFPassword]      = useState('');
  const [showPass,       setShowPass]       = useState(false);
  
  const [copied,         setCopied]         = useState(false);
  const [showCropper,    setShowCropper]    = useState(false);
  const [cropSrc,        setCropSrc]        = useState('');

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFName(data.full_name || '');
        setFPhone(data.phone || '');
        setFUsername(data.username || '');
        setFAcctNo(data.account_number || '');
        setFBankName(data.bank_name || '');
        setFWhatsapp(data.whatsapp_number || '');
        setFAvatar(data.avatar_url || '');
        setFLocation(data.location || '');
        setFBio(data.bio || '');
        setFAltPhone(data.alt_phone || '');
        setFEmployeeId(data.employee_id || '');
        setFPin(data.pin || '');
      }
    };
    fetchProfile();
  }, [user]);

  // ── My account & Transactions ────────────────────────────────────────────────
  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  const myTxns = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id),
    [transactions, myAccount, user]);

  const myCustomers = useMemo(() =>
    customers.filter(c =>
      (user?.id && c.assignedSupplierId === user.id) ||
      (myAccount?.id && c.assignedSupplierId === myAccount.id)
    ),
    [customers, user, myAccount]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDispatched = myTxns.filter(t => t.status === 'COMPLETED' && t.type !== 'Return')
      .reduce((s, t) => s + t.totalPrice, 0);

    const pendingCount = myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length;
    const completedCount = myTxns.filter(t => t.status === 'COMPLETED').length;
    const debtBalance = myAccount?.debtBalance || 0;
    
    // Performance metrics
    const trustScore = 95; // Simulated for UI
    const rank = completedCount > 50 ? 'Elite' : completedCount > 20 ? 'Senior' : 'Active';

    return {
      totalDispatched,
      pendingCount,
      completedCount,
      debtBalance,
      customerCount: myCustomers.length,
      trustScore,
      rank,
      txCount: myTxns.length
    };
  }, [myTxns, myAccount, myCustomers]);

  const aiTags = [
    { label: `🛡️ ${stats.rank} Supplier`, bg: T.accentLt, color: T.accent },
    { label: '🐋 Reliable Partner', bg: T.successLt, color: T.textSuccess },
    { label: '⚡ Fast Dispatch', bg: T.warnLt, color: T.textWarn }
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Uniqueness checks (optional but safe)
      let unToCheck = (fUsername && fUsername.trim() && fUsername.trim().toLowerCase() !== profile?.username?.toLowerCase()) ? fUsername.trim().toLowerCase() : '';
      let phToCheck = (fPhone && fPhone.trim() && fPhone.trim() !== profile?.phone) ? fPhone.trim() : '';

      if (unToCheck || phToCheck) {
        const { data: avail } = await supabase.rpc('check_account_availability', { chk_username: unToCheck, chk_phone: phToCheck });
        if (avail?.username_taken) throw new Error('Username is already taken.');
        if (avail?.phone_taken) throw new Error('Phone number is already registered.');
      }

      const { error } = await supabase.from('profiles').update({
        full_name: fName,
        phone: fPhone,
        avatar_url: fAvatar,
        whatsapp_number: fWhatsapp,
        username: fUsername.trim().toLowerCase().replace(/\s+/g, ''),
        location: fLocation,
        bio: fBio,
        alt_phone: fAltPhone,
        employee_id: fEmployeeId,
        pin: fPin,
        account_number: fAcctNo,
        bank_name: fBankName
      }).eq('id', user.id);

      if (error) throw error;

      if (fPassword) {
        await supabase.auth.updateUser({ password: fPassword });
      }

      // Sync to customer record if linked
      if (myAccount) {
        await updateCustomer({ ...myAccount, name: fName, phone: fPhone });
      }

      await refreshData();
      setEditing(false);
      setFPassword('');
      alert('Profile updated successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAcct = () => {
    if (!fAcctNo) return;
    navigator.clipboard.writeText(fAcctNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = (base64: string) => {
    setFAvatar(base64);
    setShowCropper(false);
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Header */}
        <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px',borderBottom:`1px solid ${T.border}`,background:T.surface}}>
           <button onClick={()=>navigate('/supplier')} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',marginLeft:'-8px'}}><ArrowLeft size={20} color={T.ink}/></button>
           <h2 style={{fontSize:'18px',fontWeight:600,color:T.ink,margin:0,flex:1}}>Supplier Profile Hub</h2>
        </div>

        <div style={{flex:1, overflowY: 'auto'}} className="hide-scrollbar">
          <div style={{padding:'20px'}}>
             
             {/* Profile Banner */}
             <div style={{background:'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',height:'110px',borderRadius:'16px',position:'relative'}}>
               <div style={{position:'absolute', bottom:10, right:16, display:'flex', gap:2}}>
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
               </div>
               
               {/* Avatar */}
               <div style={{position:'absolute',bottom:'-40px',left:'20px',width:'100px',height:'100px',borderRadius:'30px',border:`4px solid ${T.surface}`,background:T.surface,boxShadow:T.shadowMd,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {fAvatar ? (
                    <img src={fAvatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="Profile"/>
                  ) : (
                    <span style={{fontSize:'32px',fontWeight:900,color:T.accent}}>{fName?.charAt(0) || 'S'}</span>
                  )}
                  <div onClick={() => fileInputRef.current?.click()} style={{position:'absolute',bottom:4,right:4,width:28,height:28,borderRadius:'50%',background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${T.surface}`,cursor:'pointer'}}>
                     <Camera size={14} color="#fff"/>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
               </div>
             </div>

             {/* Personal Info */}
             <div style={{marginTop:'50px'}}>
                <h1 style={{fontSize:'22px',fontWeight:700,color:T.ink,margin:0,display:'flex',alignItems:'center',gap:6}}>{fName || 'Supplier'} <BadgeCheck size={18} color={T.success}/></h1>
                <p style={{color:T.accent,fontSize:'14px',fontWeight:500,margin:'4px 0 0'}}>Verified Logistics & Sales Partner</p>
                
                {/* AI Performance Tags */}
                <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                   {aiTags.map((tag,idx) => (
                      <span key={idx} style={{background:tag.bg, color:tag.color, padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
                         {tag.label}
                      </span>
                   ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 12 }}>
                   <span style={{color:T.txt2,fontSize:'14px'}}>{user?.email}</span>
                   <span style={{width:4,height:4,borderRadius:'50%',background:T.border}}/>
                   <span style={{color:T.txt2,fontSize:'14px'}}>@{fUsername || 'supplier'}</span>
                </div>

                {/* Quick Actions Row */}
                <div style={{display:'flex',gap:'10px',marginTop:'20px'}}>
                   <button onClick={() => setEditing(true)} style={{background:T.ink,color:'#fff',padding:'12px',borderRadius:'12px',display:'flex',alignItems:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:'none',cursor:'pointer',flex:1,justifyContent:'center'}}>
                      <Edit2 size={16}/> Edit Identity
                   </button>
                   <button onClick={() => setDTab('financials')} style={{background:T.surface2,color:T.ink,padding:'12px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:`1px solid ${T.border}`,cursor:'pointer',flex:1}}>
                      <Wallet size={16}/> My Ledger
                   </button>
                </div>

                {/* Bank Account Quick View */}
                {fAcctNo && (
                   <div style={{marginTop:'24px', padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:T.shadow}}>
                      <div>
                         <div style={{fontSize:'10px', fontWeight:800, color:T.txt3, textTransform:'uppercase', marginBottom:4}}>{fBankName || 'Bank Account'}</div>
                         <div style={{fontSize:'16px', fontWeight:900, color:T.ink, letterSpacing:'2px'}}>{fAcctNo.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</div>
                      </div>
                      <motion.button whileTap={{scale:0.9}} onClick={handleCopyAcct} style={{padding:'10px', background:copied ? T.successLt : T.accentLt, borderRadius:'12px', border:'none', color:copied ? T.success : T.accent, cursor:'pointer'}}>
                         {copied ? <Check size={18}/> : <Copy size={18}/>}
                      </motion.button>
                   </div>
                )}
                
                {/* ── Tabs ── */}
                <div style={{marginTop:'32px',display:'flex',gap:'24px',borderBottom:`1px solid ${T.border}`}}>
                   {['overview', 'financials', 'security'].map(tab => (
                      <button key={tab} onClick={()=>setDTab(tab as any)} style={{background:'none',border:'none',borderBottom:dTab===tab?`2px solid ${T.accent}`:'2px solid transparent',padding:'12px 0',fontSize:'14px',fontWeight:dTab===tab?600:500,color:dTab===tab?T.accent:T.txt2,cursor:'pointer',textTransform:'capitalize'}}>
                         {tab}
                      </button>
                   ))}
                </div>

                <div style={{paddingTop:'24px'}}>
                   <AnimatePresence mode="wait">
                      {/* OVERVIEW TAB */}
                      {dTab === 'overview' && (
                         <motion.div key="overview" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            {/* Stats Bento Grid */}
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                               <div style={{padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radius, boxShadow:T.shadow}}>
                                  <div style={{width:32, height:32, borderRadius:'10px', background:T.accentLt, color:T.accent, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12}}><TrendingUp size={18}/></div>
                                  <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{fmt(stats.totalDispatched)}</div>
                                  <div style={{fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase'}}>Total Dispatched</div>
                               </div>
                               <div style={{padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radius, boxShadow:T.shadow}}>
                                  <div style={{width:32, height:32, borderRadius:'10px', background:T.warnLt, color:T.warn, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12}}><Clock size={18}/></div>
                                  <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{stats.pendingCount}</div>
                                  <div style={{fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase'}}>Pending Jobs</div>
                               </div>
                               <div style={{padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radius, boxShadow:T.shadow}}>
                                  <div style={{width:32, height:32, borderRadius:'10px', background:T.successLt, color:T.success, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12}}><Package size={18}/></div>
                                  <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{stats.completedCount}</div>
                                  <div style={{fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase'}}>Completed Sales</div>
                               </div>
                               <div style={{padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radius, boxShadow:T.shadow}}>
                                  <div style={{width:32, height:32, borderRadius:'10px', background:'#fdf2f8', color:'#db2777', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12}}><Users size={18}/></div>
                                  <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{stats.customerCount}</div>
                                  <div style={{fontSize:'11px', fontWeight:700, color:T.txt3, textTransform:'uppercase'}}>My Clients</div>
                               </div>
                            </div>

                            {/* Trust Score */}
                            <div style={{marginTop:20, padding:'20px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.radiusLg, boxShadow:T.shadow}}>
                               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                                     <ShieldCheck size={18} color={T.success}/>
                                     <span style={{fontSize:'14px', fontWeight:800, color:T.ink}}>Performance Trust Score</span>
                                  </div>
                                  <span style={{fontSize:'18px', fontWeight:900, color:T.success}}>{stats.trustScore}%</span>
                               </div>
                               <div style={{width:'100%', height:'8px', background:T.surface2, borderRadius:4, overflow:'hidden'}}>
                                  <div style={{width:`${stats.trustScore}%`, height:'100%', background:T.success, borderRadius:4}}/>
                               </div>
                               <p style={{fontSize:'11px', color:T.txt3, fontWeight:600, marginTop:12}}>Based on timely dispatches and debt management.</p>
                            </div>

                            {/* Toolbox */}
                            <div style={{marginTop:'32px'}}>
                               <h3 style={{fontSize:'16px',fontWeight:800,color:T.ink,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Hammer size={18} color={T.accent}/> Supplier Toolbox</h3>
                               <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}} className="hide-scrollbar">
                                  {[
                                    { label: 'Request Stock', icon: Package, path: '/inventory', bg: '#eff6ff', color: '#2563eb' },
                                    { label: 'New Sale', icon: CreditCard, path: '/sales', bg: '#fdf2f8', color: '#db2777' },
                                    { label: 'My Clients', icon: Users, path: '/customers', bg: '#fef2f2', color: '#dc2626' },
                                    { label: 'Activity Log', icon: History, path: '/supplier', bg: '#f0fdf4', color: '#16a34a' },
                                  ].map((tool, i) => (
                                    <motion.div key={i} whileTap={{scale:0.95}} onClick={() => navigate(tool.path)}
                                      style={{minWidth:'110px', padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', boxShadow:T.shadow}}>
                                       <div style={{width:32,height:32,borderRadius:'10px',background:tool.bg,display:'flex',alignItems:'center',justifyContent:'center'}}><tool.icon size={16} color={tool.color}/></div>
                                       <span style={{fontSize:'11px',fontWeight:800,color:T.ink,textAlign:'center'}}>{tool.label}</span>
                                    </motion.div>
                                  ))}
                               </div>
                            </div>
                         </motion.div>
                      )}

                      {/* FINANCIALS TAB (Report & Linking) */}
                      {dTab === 'financials' && (
                         <motion.div key="financials" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            {/* Debt Card */}
                            <div style={{background: stats.debtBalance > 0 ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #10b981, #064e3b)', borderRadius:T.radiusLg, padding:24, color:'#fff', boxShadow:T.shadowMd, marginBottom:20}}>
                               <div style={{fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', marginBottom:8}}>Current Debt Balance</div>
                               <div style={{fontSize:'36px', fontWeight:900}}>{fmt(stats.debtBalance)}</div>
                               <p style={{fontSize:'12px', marginTop:12, fontWeight:500, color:'rgba(255,255,255,0.8)'}}>
                                  {stats.debtBalance > 0 ? '⚠️ You have an outstanding balance with the bakery.' : '✅ Your financial account is clear.'}
                               </p>
                            </div>

                            {/* Reports List */}
                            <div style={{background:T.surface, borderRadius:T.radiusLg, border:`1px solid ${T.border}`, overflow:'hidden', boxShadow:T.shadow}}>
                               <div style={{padding:'16px 20px', borderBottom:`1px solid ${T.border}`, background:T.surface2}}>
                                  <h3 style={{fontSize:'14px', fontWeight:800, color:T.ink, margin:0, display:'flex', alignItems:'center', gap:8}}><BarChart3 size={16} color={T.accent}/> Financial Records & Reports</h3>
                               </div>
                               
                               <div style={{display:'flex', flexDirection:'column'}}>
                                  <button onClick={() => alert('Feature coming soon: Weekly Sales Breakdown')} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${T.border}`, background:'transparent', border:'none', cursor:'pointer'}}>
                                     <div style={{display:'flex', alignItems:'center', gap:14}}>
                                        <div style={{width:36, height:36, borderRadius:11, background:T.accentLt, color:T.accent, display:'flex', alignItems:'center', justifyContent:'center'}}><Receipt size={18}/></div>
                                        <div style={{textAlign:'left'}}>
                                           <div style={{fontSize:'13px', fontWeight:800, color:T.ink}}>Weekly Sales Report</div>
                                           <div style={{fontSize:'11px', color:T.txt3}}>Download PDF summary</div>
                                        </div>
                                     </div>
                                     <ChevronRight size={16} color={T.txt3}/>
                                  </button>

                                  <button onClick={() => navigate('/supplier')} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${T.border}`, background:'transparent', border:'none', cursor:'pointer'}}>
                                     <div style={{display:'flex', alignItems:'center', gap:14}}>
                                        <div style={{width:36, height:36, borderRadius:11, background:T.warnLt, color:T.warn, display:'flex', alignItems:'center', justifyContent:'center'}}><Target size={18}/></div>
                                        <div style={{textAlign:'left'}}>
                                           <div style={{fontSize:'13px', fontWeight:800, color:T.ink}}>Collection Target</div>
                                           <div style={{fontSize:'11px', color:T.txt3}}>Track your debt recovery progress</div>
                                        </div>
                                     </div>
                                     <ChevronRight size={16} color={T.txt3}/>
                                  </button>

                                  {/* Link Account Feature */}
                                  {!myAccount && (
                                     <button 
                                        onClick={async () => {
                                           const phone = prompt("Enter phone number registered in the bakery ledger:");
                                           if (phone) {
                                              const res = await linkProfileToRecord(user?.id || '', user?.email || '', phone, profile?.full_name);
                                              if (res) { alert("Success! Profile linked."); refreshData(); }
                                              else alert("Ledger not found. Please contact Manager.");
                                           }
                                        }}
                                        style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:`${T.amber}10`, border:'none', cursor:'pointer'}}
                                     >
                                        <div style={{display:'flex', alignItems:'center', gap:14}}>
                                           <div style={{width:36, height:36, borderRadius:11, background:T.warn, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}><RefreshCw size={18}/></div>
                                           <div style={{textAlign:'left'}}>
                                              <div style={{fontSize:'13px', fontWeight:800, color:T.textWarn}}>Link My Ledger</div>
                                              <div style={{fontSize:'11px', color:T.textWarn}}>Can't see your debt? Connect manually</div>
                                           </div>
                                        </div>
                                        <ChevronRight size={16} color={T.textWarn}/>
                                     </button>
                                  )}
                               </div>
                            </div>
                         </motion.div>
                      )}

                      {/* SECURITY TAB */}
                      {dTab === 'security' && (
                         <motion.div key="security" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <div style={{background:T.surface, borderRadius:T.radiusLg, padding:20, border:`1px solid ${T.border}`, boxShadow:T.shadow}}>
                               <h4 style={{fontSize:'15px', fontWeight:800, color:T.ink, margin:'0 0 20px', display:'flex', alignItems:'center', gap:8}}><ShieldCheck size={18} color={T.accent}/> Privacy & Access</h4>
                               
                               <div style={{display:'flex', flexDirection:'column', gap:16}}>
                                  <div onClick={() => setEditing(true)} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:14, background:T.surface2, borderRadius:12, cursor:'pointer'}}>
                                     <div style={{display:'flex', alignItems:'center', gap:12}}>
                                        <div style={{width:32, height:32, borderRadius:8, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center'}}><Key size={16} color={T.txt3}/></div>
                                        <div>
                                           <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>Update Credentials</div>
                                           <div style={{fontSize:'11px', color:T.txt3}}>Password & Security PIN</div>
                                        </div>
                                     </div>
                                     <ChevronRight size={16} color={T.txt3}/>
                                  </div>

                                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:14, background:T.surface2, borderRadius:12}}>
                                     <div style={{display:'flex', alignItems:'center', gap:12}}>
                                        <div style={{width:32, height:32, borderRadius:8, background:T.surface, display:'flex', alignItems:'center', justifyContent:'center'}}><Languages size={16} color={T.txt3}/></div>
                                        <div>
                                           <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>Language</div>
                                           <div style={{fontSize:'11px', color:T.txt3}}>{language === 'en' ? 'English' : 'Hausa'}</div>
                                        </div>
                                     </div>
                                     <div style={{display:'flex', gap:4}}>
                                        <button onClick={()=>setLanguage('en')} style={{padding:'4px 8px', borderRadius:6, border:'none', background:language==='en'?T.accent:T.surface, color:language==='en'?'#fff':T.txt3, fontSize:10, fontWeight:800}}>EN</button>
                                        <button onClick={()=>setLanguage('ha')} style={{padding:'4px 8px', borderRadius:6, border:'none', background:language==='ha'?T.accent:T.surface, color:language==='ha'?'#fff':T.txt3, fontSize:10, fontWeight:800}}>HA</button>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <button onClick={signOut} style={{width:'100%', marginTop:24, padding:16, borderRadius:T.radius, border:'none', background:T.dangerLt, color:T.textDanger, fontWeight:800, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer'}}>
                               <LogOut size={18}/> Sign Out Account
                            </button>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </div>
        </div>

        {/* Floating Edit Modal */}
        <AnimatePresence>
          {editing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(5px)', padding: '20px' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: T.surface, width: '100%', maxWidth: '440px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowMd }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: T.ink }}>Update Identity</h3>
                   <button type="button" onClick={() => setEditing(false)} style={{ background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink }}><X size={16}/></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }} className="hide-scrollbar">
                   <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div>
                            <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Display Name</label>
                            <input value={fName} onChange={e=>setFName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:600}}/>
                         </div>
                         <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                            <div>
                               <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Username</label>
                               <input value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g,''))} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:600}}/>
                            </div>
                            <div>
                               <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Phone</label>
                               <input value={fPhone} onChange={e=>setFPhone(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:600}}/>
                            </div>
                         </div>
                         <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                            <div>
                               <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Bank Name</label>
                               <input value={fBankName} onChange={e=>setFBankName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:600}}/>
                            </div>
                            <div>
                               <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Account No.</label>
                               <input value={fAcctNo} maxLength={10} onChange={e=>setFAcctNo(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:800, letterSpacing:'1px'}}/>
                            </div>
                         </div>
                         <div>
                            <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>WhatsApp (234...)</label>
                            <input value={fWhatsapp} onChange={e=>setFWhatsapp(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:600}}/>
                         </div>
                         <div style={{height:'1px',background:T.border,margin:'8px 0'}}/>
                         <div>
                            <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>Security PIN (4 digits)</label>
                            <input type="password" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:800,textAlign:'center',letterSpacing:'8px'}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:6,display:'block'}}>New Password (Optional)</label>
                            <div style={{position:'relative'}}>
                               <input type={showPass?'text':'password'} value={fPassword} onChange={e=>setFPassword(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px'}}/>
                               <button onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:12,background:'none',border:'none',color:T.txt3}}>{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                            </div>
                         </div>
                      </div>
                      <button onClick={handleSave} disabled={loading} style={{background:T.ink,color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontWeight:800,fontSize:'14px',cursor:'pointer',marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                        {loading?<RefreshCw size={18} className="spin"/>:'Save Configuration'}
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ImageCropModal
          isOpen={showCropper}
          imageSrc={cropSrc}
          onClose={() => setShowCropper(false)}
          onCropCompleteAction={handleCropComplete}
        />
        
        <style>{`
           .hide-scrollbar::-webkit-scrollbar { display: none; }
           .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           .spin { animation: spin 1s linear infinite; }
           @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </AnimatedPage>
  );
}

const Eye = ({size}:{size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOff = ({size}:{size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
