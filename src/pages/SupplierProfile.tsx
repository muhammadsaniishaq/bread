import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import {
  LogOut, ArrowLeft,
  Check, Key, 
  BarChart3,
  Users,
  ChevronRight, Copy,
  X, FileText, Rocket, Package, TrendingUp
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Premium Design Tokens (Compact & Executive) ─── */
const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#e2e8f0',
  accent: '#4f46e5',
  accentLt: '#eef2ff',
  success: '#10b981',
  successLt: '#dcfce7',
  danger: '#ef4444',
  dangerLt: '#fee2e2',
  warn: '#f59e0b',
  warnLt: '#fef3c7',
  textSuccess: '#166534',
  textWarn: '#92400e',
  ink: '#0f172a',
  txt2: '#475569',
  txt3: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd: '0 10px 25px -5px rgba(0,0,0,0.08)',
  shadowLg: '0 20px 50px -12px rgba(0,0,0,0.1)',
  radius: '12px',
  radiusLg: '20px',
};

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

export default function SupplierProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer, refreshData } = useAppContext();

  const [profile,        setProfile]        = useState<any>(null);
  const [dTab,           setDTab]           = useState<'analytics'|'ledger'|'security'>('analytics');
  const [copied,         setCopied]         = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [loading,        setLoading]        = useState(false);

  // Form States
  const [fName,          setFName]          = useState('');
  const [fPhone,         setFPhone]         = useState('');
  const [fAvatar,        setFAvatar]        = useState('');
  const [fWhatsapp,      setFWhatsapp]      = useState('');
  const [fUsername,      setFUsername]      = useState('');
  const [fBankName,      setFBankName]      = useState('');
  const [fAcctNo,        setFAcctNo]        = useState('');
  const [fAcctName,      setFAcctName]      = useState('');
  const [fPin,           setFPin]           = useState('');

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFName(data.full_name || '');
        setFPhone(data.phone || '');
        setFAvatar(data.avatar_url || '');
        setFWhatsapp(data.whatsapp_number || '');
        setFUsername(data.username || '');
        setFBankName(data.bank_name || '');
        setFAcctNo(data.account_number || '');
        setFAcctName(data.account_name || '');
        setFPin(data.pin || '');
      }
    };
    fetchProfile();
  }, [user]);

  // ── Data Logic ─────────────────────────────────────────────────────────────
  const myAccount = useMemo(() => customers.find(c => c.profile_id === user?.id), [customers, user]);
  const myTxns = useMemo(() => transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id), [transactions, myAccount, user]);
  
  const stats = useMemo(() => {
    const completed = myTxns.filter(t => t.status === 'COMPLETED');
    const totalVolume = completed.filter(t => t.type !== 'Return').reduce((s, t) => s + t.totalPrice, 0);
    const myCusts = customers.filter(c => c.assignedSupplierId === user?.id || c.assignedSupplierId === myAccount?.id);
    
    return {
      totalVolume,
      pendingCount: myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
      completedCount: completed.length,
      debtBalance: myAccount?.debtBalance || 0,
      custCount: myCusts.length,
      trustScore: 98,
      marketRank: 1,
      txCount: myTxns.length
    };
  }, [myTxns, myAccount, customers, user]);

  const initials = (profile?.full_name || user?.email || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fName,
          phone: fPhone,
          whatsapp_number: fWhatsapp,
          username: fUsername,
          bank_name: fBankName,
          account_number: fAcctNo,
          account_name: fAcctName,
          pin: fPin
        })
        .eq('id', user.id);

      if (error) throw error;

      if (myAccount) await updateCustomer({ ...myAccount, name: fName, phone: fPhone });

      await refreshData();
      setIsEditing(false);
      setProfile((p:any) => ({ ...p, full_name: fName, avatar_url: fAvatar, username: fUsername, phone: fPhone, whatsapp_number: fWhatsapp, bank_name: fBankName, account_number: fAcctNo, account_name: fAcctName, pin: fPin }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '30px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Header - Glassmorphic & Modern */}
        <div style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:'16px',borderBottom:`1px solid ${T.border}`,background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', position:'sticky', top:0, zIndex:100}}>
           <button onClick={()=>navigate(-1)} style={{background:T.surface2,border:'none',cursor:'pointer',width:'36px',height:'36px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowLeft size={20} color={T.ink}/></button>
           <h2 style={{fontSize:'18px',fontWeight:800,color:T.ink,margin:0,flex:1}}>Supplier Hub</h2>
           <button onClick={() => setIsEditing(true)} style={{background:T.ink, color:'#fff', border:'none', padding:'8px 14px', borderRadius:'10px', fontSize:'11px', fontWeight:800}}>EDIT</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ─── IDENTITY BENTO ─── */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '32px', padding: '32px 24px', color: '#fff', boxShadow: T.shadowLg, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900 }}>
                 {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }} alt="" /> : initials}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Supplier Identity</div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{profile?.full_name || 'Personnel'}</h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 600 }}>@{profile?.username || 'supplier'}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{profile?.phone || 'N/A'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>WhatsApp</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>{profile?.whatsapp_number || 'N/A'}</div>
              </div>
            </div>

            {/* Compact Bank Identity Card */}
            <div style={{ marginTop: '16px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Remittance Account</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, marginTop: '4px', letterSpacing: '1px' }}>{profile?.account_number || '•••• •••• ••••'}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '4px', opacity: 0.8 }}>{profile?.account_name || 'HOLDER NAME'}</div>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 900, textAlign: 'right' }}>{profile?.bank_name || 'BANK'}</div>
              </div>
              {profile?.account_number && (
                <button onClick={() => copyToClipboard(profile.account_number)} style={{marginTop: 12, width: '100%', border: 'none', background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: 8, color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
                  {copied ? <Check size={10}/> : <Copy size={10}/>} {copied ? 'Copied' : 'Copy Account Number'}
                </button>
              )}
          </div>
        </div>

          {/* ─── MARKET OPERATIONS (The requested "Supplier Report" section) ─── */}
          <div style={{ background: '#fff', borderRadius: '28px', padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
             <h3 style={{ fontSize: '16px', fontWeight: 900, color: T.ink, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Rocket size={18} color={T.accent} /> Market Operations
             </h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate('/reports')}
                  style={{ background: '#eff6ff', padding: '20px 16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #dbeafe' }}>
                   <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.1)' }}>
                     <FileText size={20} color="#2563eb" />
                   </div>
                   <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e40af' }}>Daily Report</span>
                   <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', textAlign: 'center' }}>Submit sales activity</span>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }} onClick={() => navigate('/supplier/inventory')}
                  style={{ background: '#fdf2f8', padding: '20px 16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #fce7f3' }}>
                   <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(219,39,119,0.1)' }}>
                     <Package size={20} color="#db2777" />
                   </div>
                   <span style={{ fontSize: '13px', fontWeight: 900, color: '#9d174d' }}>Stock Ledger</span>
                   <span style={{ fontSize: '9px', fontWeight: 700, color: '#f472b6', textAlign: 'center' }}>Manage inventory</span>
                </motion.div>
             </div>
          </div>

          {/* ─── PERFORMANCE METRICS ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
               <div style={{ width: 36, height: 36, borderRadius: 10, background: T.warnLt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Users size={18} color={T.warn} /></div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: T.ink }}>{stats.custCount}</div>
               <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: 4 }}>Active Clients</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
               <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><TrendingUp size={18} color={T.accent} /></div>
               <div style={{ fontSize: '24px', fontWeight: 900, color: T.ink }}>{fmt(stats.totalVolume).replace('₦','')}</div>
               <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: 4 }}>Revenue Yield</div>
            </div>
          </div>

          {/* ─── ANALYTICS TABBED VIEW ─── */}
          <div style={{ background: '#fff', borderRadius: '28px', padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
             <div style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${T.surface2}`, marginBottom: '20px' }}>
                {[
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'ledger', label: 'Ledger' },
                  { id: 'security', label: 'Safety' }
                ].map(tab => (
                   <button key={tab.id} onClick={() => setDTab(tab.id as any)} 
                     style={{ background: 'none', border: 'none', borderBottom: dTab === tab.id ? `3px solid ${T.accent}` : '3px solid transparent', padding: '10px 0', fontSize: '14px', fontWeight: 800, color: dTab === tab.id ? T.accent : T.txt3, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {tab.label}
                   </button>
                ))}
             </div>
             
             <AnimatePresence mode="wait">
                {dTab === 'analytics' && (
                  <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: T.txt2, marginBottom: '4px' }}>Cumulative Trade Volume</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: T.ink }}>{fmt(stats.totalVolume)}</div>
                    <div style={{ height: '100px', marginTop: '20px', background: T.surface2, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <BarChart3 size={32} color={T.txt3} opacity={0.3} />
                       <span style={{ fontSize: '12px', color: T.txt3, fontWeight: 600, marginLeft: '8px' }}>Visualizing market performance...</span>
                    </div>
                  </motion.div>
                )}

                {dTab === 'ledger' && (
                  <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ background: stats.debtBalance > 0 ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #10b981, #064e3b)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
                       <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Standing</div>
                       <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px' }}>{fmt(stats.debtBalance)}</div>
                    </div>
                  </motion.div>
                )}

                {dTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div onClick={() => setIsEditing(true)} style={{ background: T.surface2, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                       <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Key size={18} color={T.warn} /></div>
                       <div style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: T.ink }}>Security Credentials</div>
                       <ChevronRight size={16} color={T.txt3} />
                    </div>
                    <button onClick={() => signOut()} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: T.dangerLt, border: 'none', color: T.danger, fontSize: '14px', fontWeight: 800, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                       <LogOut size={18} /> End Session
                    </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* ─── EXECUTIVE EDIT MODAL ─── */}
        <AnimatePresence>
          {isEditing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(5px)', padding: '16px' }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: T.surface, width: '100%', maxWidth: '400px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowMd }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: T.ink }}>Profile Configuration</h3>
                   <button onClick={() => setIsEditing(false)} style={{ background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink }}><X size={18}/></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }} className="hide-scrollbar">
                   <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div>
                         <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Full Legal Name</label>
                         <input value={fName} onChange={e=>setFName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                      </div>
                      <div>
                         <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Username</label>
                         <input value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g,''))} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                         <div>
                            <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Phone</label>
                            <input value={fPhone} onChange={e=>setFPhone(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                         </div>
                         <div>
                            <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>WhatsApp</label>
                            <input value={fWhatsapp} onChange={e=>setFWhatsapp(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                         </div>
                      </div>
                      <div style={{height:'1px',background:T.border}}/>
                      <div>
                         <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Bank Name</label>
                         <input value={fBankName} onChange={e=>setFBankName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}} placeholder="e.g. OPay, Zenith, Kuda"/>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                         <div>
                            <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Account Number</label>
                            <input value={fAcctNo} onChange={e=>setFAcctNo(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                         </div>
                         <div>
                            <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Account Name</label>
                            <input value={fAcctName} onChange={e=>setFAcctName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:14,fontWeight:600}}/>
                         </div>
                      </div>
                      <div style={{height:'1px',background:T.border}}/>
                      <div>
                         <label style={{fontSize:10,fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:8,display:'block'}}>Security PIN</label>
                         <input type="password" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px',fontSize:16,fontWeight:900,textAlign:'center',letterSpacing:8}}/>
                      </div>
                      <button onClick={handleSave} disabled={loading} style={{background:T.ink,color:'#fff',border:'none',borderRadius:12,padding:16,fontWeight:800,fontSize:15,cursor:'pointer',marginTop:12}}>
                        {loading?'Synchronizing...':'Confirm Changes'}
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
}
