import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import {
  LogOut, 
  Check, 
  ChevronRight, Copy,
  X, FileText, Package, Phone, ShieldCheck, Edit2, User, Wallet, Lock
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion } from 'framer-motion';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  successLight: 'rgba(16,185,129,0.1)',
  danger: '#f43f5e',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

export default function SupplierProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer, refreshData } = useAppContext();

  const [profile,        setProfile]        = useState<any>(null);
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
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%)', padding: '60px 24px 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '30px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden' }}>
               {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <User size={36} color="#fff" />}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>{profile?.full_name || 'Supplier'}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
               <ShieldCheck size={12} /> Verified Supplier
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>
          
          {/* Compact Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.primary }}>{fmt(stats.totalVolume).replace('₦','')}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Total Revenue</div>
             </div>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: stats.debtBalance > 0 ? T.danger : T.success }}>{fmt(stats.debtBalance)}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Account Standing</div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             
             {/* Info Section */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Details</h3>
                   <button onClick={() => setIsEditing(true)} style={{ background: 'rgba(37,99,235,0.1)', color: T.primary, border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <Edit2 size={12} /> Edit
                   </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <User size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Username</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>@{profile?.username || 'supplier'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Phone Number</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{profile?.phone || 'N/A'}</div>
                      </div>
                   </div>

                   {profile?.whatsapp_number && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
                           <Phone size={18} />
                        </div>
                        <div>
                           <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>WhatsApp</div>
                           <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{profile.whatsapp_number}</div>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Bank Identity Card */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remittance Account</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                      <Wallet size={18} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{profile?.account_number || 'No Account Provided'}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt2 }}>{profile?.bank_name || 'Bank Name'}</div>
                   </div>
                   {profile?.account_number && (
                     <button onClick={() => copyToClipboard(profile.account_number)} style={{ background: T.bg, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, color: T.txt2, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                       {copied ? <Check size={14} color={T.success}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
                     </button>
                   )}
                </div>
                {profile?.account_name && (
                   <div style={{ marginTop: '12px', padding: '10px 12px', background: T.bg, borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: T.txt2 }}>
                     Account Holder: <span style={{ color: T.ink }}>{profile.account_name}</span>
                   </div>
                )}
             </div>

             {/* Action List */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '8px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <button onClick={() => navigate('/reports')} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '16px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                         <FileText size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Daily Reports</span>
                   </div>
                   <ChevronRight size={16} color={T.txt3} />
                </button>
                <div style={{ height: '1px', background: T.border, margin: '0 12px' }} />
                <button onClick={() => navigate('/supplier/inventory')} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '16px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `rgba(219,39,119,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}>
                         <Package size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Stock Ledger</span>
                   </div>
                   <ChevronRight size={16} color={T.txt3} />
                </button>
             </div>

             <button onClick={() => signOut()}
               style={{ padding: '16px', borderRadius: '20px', border: 'none', background: `${T.danger}08`, color: T.danger, fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <LogOut size={18} /> Sign Out
             </button>
          </div>
        </div>

        {/* Edit Modal (Matches StoreProfile) */}
        {isEditing && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
               style={{ background: '#fff', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '32px 32px 0 0', padding: '32px 24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Edit My Profile</h3>
                   <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                     <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Full Name</label>
                     <input type="text" value={fName} onChange={e => setFName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   </div>
                   
                   <div>
                     <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Username</label>
                     <input type="text" value={fUsername} onChange={e => setFUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                     <div>
                       <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Phone</label>
                       <input type="text" value={fPhone} onChange={e => setFPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                     </div>
                     <div>
                       <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>WhatsApp</label>
                       <input type="text" value={fWhatsapp} onChange={e => setFWhatsapp(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                     </div>
                   </div>

                   <div style={{ height: '1px', background: T.border, margin: '8px 0' }} />

                   <div>
                     <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Bank Name</label>
                     <input type="text" value={fBankName} onChange={e => setFBankName(e.target.value)} placeholder="e.g. OPay, Zenith" style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                     <div>
                       <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Account Number</label>
                       <input type="text" value={fAcctNo} onChange={e => setFAcctNo(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                     </div>
                     <div>
                       <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Account Name</label>
                       <input type="text" value={fAcctName} onChange={e => setFAcctName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                     </div>
                   </div>

                   <div>
                     <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', display: 'block' }}>Security PIN (Optional)</label>
                     <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                       <Lock size={16} color={T.txt3} style={{ position: 'absolute', left: '16px' }} />
                       <input type="password" maxLength={4} value={fPin} onChange={e => setFPin(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 900, fontSize: '16px', letterSpacing: '4px' }} />
                     </div>
                   </div>

                   <button onClick={handleSave} disabled={loading} style={{ padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {loading ? 'Saving Updates...' : 'Save Profile Changes'}
                   </button>
                </div>
             </motion.div>
           </div>
        )}
      </div>
    </AnimatedPage>
  );
}

