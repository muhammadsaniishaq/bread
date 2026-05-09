import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import {
  LogOut, Check, ChevronRight, Copy,
  X, FileText, Package, Phone, ShieldCheck,
  Edit2, User, Wallet, Lock, TrendingUp,
  Star, Zap, BarChart3, Users,
  AlertTriangle, PhoneCall, MessageSquare,
  Award, Activity, Clock, ArrowUpRight
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

const fmt = (v: number) => '₦' + (v || 0).toLocaleString();

/* ── DESIGN TOKENS (matches ManagerStaffProfiles) ───────── */
const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.08)', primaryMid: 'rgba(79,70,229,0.15)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.1)', textSuccess: '#065f46',
  danger:  '#ef4444', dangerLt:  'rgba(239,68,68,0.1)',  textDanger:  '#991b1b',
  warn:    '#f59e0b', warnLt:    'rgba(245,158,11,0.1)', textWarn:    '#78350f',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f1f5f9', surface: '#ffffff', surface2: '#f8fafc',
  border: 'rgba(0,0,0,0.06)', borderL: 'rgba(0,0,0,0.04)',
  shadow:   '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 20px 40px rgba(0,0,0,0.15)',
  heroGrad: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
};

const card: React.CSSProperties = {
  background: T.surface,
  borderRadius: '20px',
  padding: '20px',
  marginBottom: '12px',
  border: `1px solid ${T.border}`,
  boxShadow: T.shadowMd,
};

const sectionHead = (label: string, icon?: React.ReactNode): React.ReactNode => (
  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
    {icon && <span style={{ color: T.primary }}>{icon}</span>}
    <span style={{ fontSize:'12px', fontWeight:800, color:T.txt2, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
  </div>
);

const inp: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.borderL}`, borderRadius: '10px',
  padding: '10px 12px', fontSize: '13px', fontWeight: 500, color: T.ink,
  outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: '10px', fontWeight: 800, color: T.txt2,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  marginBottom: '6px', display: 'block',
};


export default function SupplierProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { customers, transactions, updateCustomer, refreshData, getSupplierDebt } = useAppContext();

  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fName, setFName]         = useState('');
  const [fPhone, setFPhone]       = useState('');
  const [fWhatsapp, setFWhatsapp] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fBankName, setFBankName] = useState('');
  const [fAcctNo, setFAcctNo]     = useState('');
  const [fAcctName, setFAcctName] = useState('');
  const [fPin, setFPin]           = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (!data) return;
      setProfile(data);
      setFName(data.full_name || '');
      setFPhone(data.phone || '');
      setFWhatsapp(data.whatsapp_number || '');
      setFUsername(data.username || '');
      setFBankName(data.bank_name || '');
      setFAcctNo(data.account_number || '');
      setFAcctName(data.account_name || '');
      setFPin(data.pin || '');
    });
  }, [user]);

  const myAccount = useMemo(() => customers.find(c => c.profile_id === user?.id), [customers, user]);
  const myTxns    = useMemo(() => transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id), [transactions, myAccount, user]);

  const stats = useMemo(() => {
    const completed  = myTxns.filter(t => t.status === 'COMPLETED');
    const salesTxns  = completed.filter(t => t.origin === 'POS_SUPPLIER' && t.type !== 'Return' && t.type !== 'Payment');
    const totalSales = salesTxns.reduce((s, t) => s + t.totalPrice, 0);
    const myEarnings = totalSales * 0.1;
    const debt90     = getSupplierDebt(user?.id || '');
    const myCusts    = customers.filter(c => c.assignedSupplierId === user?.id || c.assignedSupplierId === myAccount?.id);
    const txCount    = completed.length;
    const tier = txCount >= 100 ? { label:'Platinum', emoji:'💎', color:'#818cf8', bg:'rgba(129,140,248,0.12)' }
               : txCount >= 50  ? { label:'Gold',     emoji:'🥇', color:'#ca8a04', bg:'rgba(202,138,4,0.10)' }
               : txCount >= 20  ? { label:'Silver',   emoji:'🥈', color:'#64748b', bg:'rgba(100,116,139,0.10)' }
               :                  { label:'Bronze',   emoji:'🥉', color:'#b45309', bg:'rgba(180,83,9,0.10)' };
    const debtRatio = totalSales > 0 ? Math.round((debt90 / totalSales) * 100) : 0;
    const healthScore = Math.max(0, 100 - debtRatio);
    const healthLabel = healthScore >= 80 ? { label:'Excellent', color:'#10b981' }
                      : healthScore >= 50 ? { label:'Good',      color:'#f59e0b' }
                      : healthScore >= 20 ? { label:'At Risk',   color:'#f97316' }
                      :                    { label:'Critical',   color:'#ef4444' };
    const recentTxns = [...myTxns]
      .filter(t => t.status === 'COMPLETED')
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    return { totalSales, myEarnings, debt90, custCount: myCusts.length, txCount, tier,
             pendingCount: myTxns.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
             debtRatio, healthScore, healthLabel, recentTxns };
  }, [myTxns, myAccount, customers, user, getSupplierDebt]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').update({
        full_name: fName, phone: fPhone, whatsapp_number: fWhatsapp,
        username: fUsername, bank_name: fBankName,
        account_number: fAcctNo, account_name: fAcctName, pin: fPin
      }).eq('id', user.id);
      if (myAccount) await updateCustomer({ ...myAccount, name: fName, phone: fPhone });
      await refreshData();
      setIsEditing(false);
      setProfile((p: any) => ({ ...p, full_name: fName, username: fUsername, phone: fPhone,
        whatsapp_number: fWhatsapp, bank_name: fBankName,
        account_number: fAcctNo, account_name: fAcctName, pin: fPin }));
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (profile?.full_name || 'S').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <AnimatedPage>
      <div style={{ minHeight:'100vh', background:T.bg, paddingBottom:'120px', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* ── HERO ── */}
        <div style={{ background: T.heroGrad, padding:'52px 24px 96px', position:'relative', overflow:'hidden', textAlign:'center' }}>
          <div style={{ position:'absolute', top:'-20px', left:'-20px', width:'220px', height:'220px', borderRadius:'50%', background:'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-40px', right:'-20px', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:10 }}>
            {/* Avatar */}
            <div style={{ width:'92px', height:'92px', margin:'0 auto 14px', position:'relative' }}>
              <div style={{ position:'absolute', inset:'-3px', borderRadius:'50%', background:`linear-gradient(135deg, #a5b4fc, ${T.primary}, #3730a3)` }}>
                <div style={{ margin:'3px', borderRadius:'50%', background:'#1e1b4b', height:'calc(100% - 6px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:900, color:'#fff', overflow:'hidden' }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/> : initials}
                </div>
              </div>
            </div>
            <h1 style={{ fontSize:'22px', fontWeight:900, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.03em' }}>{profile?.full_name || 'Supplier'}</h1>
            <p style={{ color:'rgba(165,180,252,0.65)', fontSize:'13px', margin:'0 0 14px', fontWeight:500 }}>@{profile?.username || 'supplier'}</p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', flexWrap:'wrap', justifyContent:'center' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', background:`${T.success}25`, border:`1px solid ${T.success}40`, color:'#6ee7b7', fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                <ShieldCheck size={11}/> Verified Supplier
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', background:stats.tier.bg, border:`1px solid ${stats.tier.color}35`, color:stats.tier.color, fontSize:'10px', fontWeight:800 }}>
                {stats.tier.emoji} {stats.tier.label}
              </span>
            </div>
            {/* Member ID */}
            <div style={{ marginTop:'14px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:'10px' }}>
              <span style={{ fontSize:'9px', color:'rgba(165,180,252,0.5)', fontWeight:700, textTransform:'uppercase' }}>Member ID</span>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:800, fontFamily:'monospace' }}>{(user?.id || '').slice(0,8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div style={{ padding:'0 16px', marginTop:'-68px', position:'relative', zIndex:20 }}>

          {/* ── PENDING ALERT ── */}
          {stats.pendingCount > 0 && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
              style={{ background:`linear-gradient(135deg,#92400e,${T.warn})`, borderRadius:'16px', padding:'14px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', boxShadow:`0 8px 24px ${T.warn}40` }}>
              <AlertTriangle size={20} color="#fbbf24"/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:900, color:'#fef3c7' }}>{stats.pendingCount} Pending Order{stats.pendingCount > 1 ? 's' : ''}</div>
                <div style={{ fontSize:'11px', color:'rgba(254,243,199,0.7)', fontWeight:600 }}>Awaiting your confirmation</div>
              </div>
              <button onClick={() => navigate('/supplier/dashboard')} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fef3c7', padding:'6px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>View →</button>
            </motion.div>
          )}

          {/* ── QUICK CONTACT ── */}
          {profile?.phone && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
              <a href={`tel:${profile.phone}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:T.surface, borderRadius:'16px', padding:'13px', textDecoration:'none', color:T.success, fontWeight:800, fontSize:'13px', boxShadow:T.shadowMd, border:`1px solid ${T.success}20` }}>
                <PhoneCall size={17}/> Call
              </a>
              <a href={`https://wa.me/${profile.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:T.surface, borderRadius:'16px', padding:'13px', textDecoration:'none', color:'#25d366', fontWeight:800, fontSize:'13px', boxShadow:T.shadowMd, border:'1px solid rgba(37,211,102,0.2)' }}>
                <MessageSquare size={17}/> WhatsApp
              </a>
            </motion.div>
          )}

          {/* ── KPI GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            {[
              { icon:<TrendingUp size={17}/>, bg:T.primaryLt,  c:T.primary,  label:'Total Sales', val:fmt(stats.totalSales),   sub:'All time' },
              { icon:<Star size={17}/>,       bg:T.warnLt,     c:T.warn,     label:'My 10% Cut',  val:fmt(stats.myEarnings),   sub:'Commission' },
              { icon:<Zap size={17}/>,        bg:T.dangerLt,   c:T.danger,   label:'Debt Owed',   val:fmt(stats.debt90),       sub:'90% of sales' },
              { icon:<Users size={17}/>,      bg:T.successLt,  c:T.success,  label:'Customers',   val:String(stats.custCount), sub:`${stats.txCount} tx` },
            ].map((k, i) => (
              <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                style={{ ...card, padding:'16px', marginBottom:0 }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', color:k.c, marginBottom:'10px' }}>{k.icon}</div>
                <div style={{ fontSize:'10px', fontWeight:800, color:T.txt3, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px' }}>{k.label}</div>
                <div style={{ fontSize:'18px', fontWeight:900, color:T.ink, lineHeight:1, letterSpacing:'-0.02em' }}>{k.val}</div>
                <div style={{ fontSize:'9px', color:T.txt3, fontWeight:600, marginTop:'4px' }}>{k.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* ── REVENUE SPLIT BAR ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }} style={{ ...card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <span style={{ fontSize:'13px', fontWeight:800, color:T.ink }}>Revenue Split</span>
              <span style={{ fontSize:'10px', fontWeight:700, color:T.txt3 }}>10% You · 90% Bakery</span>
            </div>
            <div style={{ height:'10px', borderRadius:'10px', background:T.bg, overflow:'hidden', display:'flex', marginBottom:'12px' }}>
              <motion.div initial={{ width:0 }} animate={{ width:'10%' }} transition={{ duration:1, delay:0.5 }}
                style={{ height:'100%', background:`linear-gradient(90deg,${T.success},#34d399)`, borderRadius:'10px 0 0 10px' }}/>
              <motion.div initial={{ width:0 }} animate={{ width:'90%' }} transition={{ duration:1, delay:0.5 }}
                style={{ height:'100%', background:`linear-gradient(90deg,${T.primary},#818cf8)`, borderRadius:'0 10px 10px 0' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:T.success }}/>
                <span style={{ fontSize:'11px', fontWeight:600, color:T.txt2 }}>Your Share</span>
                <span style={{ fontSize:'12px', fontWeight:900, color:T.success }}>{fmt(stats.myEarnings)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:T.primary }}/>
                <span style={{ fontSize:'11px', fontWeight:600, color:T.txt2 }}>Bakery</span>
                <span style={{ fontSize:'12px', fontWeight:900, color:T.primary }}>{fmt(stats.debt90)}</span>
              </div>
            </div>
          </motion.div>

          {/* ── ACCOUNT HEALTH METER ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }} style={{ ...card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              {sectionHead('Account Health')}
              <span style={{ fontSize:'11px', fontWeight:800, color:stats.healthLabel.color, background:`${stats.healthLabel.color}12`, padding:'3px 10px', borderRadius:'20px', border:`1px solid ${stats.healthLabel.color}25` }}>{stats.healthLabel.label}</span>
            </div>
            <div style={{ position:'relative', height:'10px', background:T.bg, borderRadius:'10px', overflow:'hidden', marginBottom:'10px' }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${stats.healthScore}%` }} transition={{ duration:1.2, ease:'easeOut', delay:0.6 }}
                style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${stats.healthLabel.color},${stats.healthLabel.color}bb)`, borderRadius:'10px' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', fontWeight:600, color:T.txt3 }}>
              <span>Score: <strong style={{ color:stats.healthLabel.color }}>{stats.healthScore}%</strong></span>
              <span>Debt: <strong style={{ color:stats.debtRatio > 50 ? T.danger : T.txt3 }}>{stats.debtRatio}% of sales</strong></span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.34 }} style={{ ...card }}>
            {sectionHead('Achievements', <Award size={15}/>)}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
              {[
                { emoji:'✅', label:'Verified',      earned:true,                       color:T.success },
                { emoji:'🔥', label:'Active Seller', earned:stats.txCount >= 5,         color:'#f97316' },
                { emoji:'👑', label:'Top Performer', earned:stats.txCount >= 50,        color:T.warn },
                { emoji:'💰', label:'Revenue King',  earned:stats.totalSales >= 100000, color:T.primary },
                { emoji:'🤝', label:'Client Magnet', earned:stats.custCount >= 5,       color:'#0891b2' },
                { emoji:'💎', label:'Platinum',      earned:stats.txCount >= 100,       color:'#818cf8' },
              ].map((b, i) => (
                <div key={i} style={{ textAlign:'center', padding:'12px 6px', borderRadius:'14px', background:b.earned ? `${b.color}0d` : T.bg, border:`1px solid ${b.earned ? b.color + '20' : T.border}`, opacity:b.earned ? 1 : 0.35, transition:'all 0.2s' }}>
                  <div style={{ fontSize:'22px', marginBottom:'4px' }}>{b.emoji}</div>
                  <div style={{ fontSize:'9px', fontWeight:800, color:b.earned ? b.color : T.txt3, textTransform:'uppercase', lineHeight:1.3 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── RECENT TRANSACTIONS ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.36 }} style={{ ...card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              {sectionHead('Recent Activity', <Clock size={14}/>)}
              <button onClick={() => navigate('/supplier/dashboard')} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', color:T.primary, fontSize:'11px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>All <ArrowUpRight size={12}/></button>
            </div>
            {stats.recentTxns.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', color:T.txt3 }}>
                <Activity size={26} style={{ display:'block', margin:'0 auto 8px', opacity:0.25 }}/>
                <div style={{ fontSize:'12px', fontWeight:600 }}>No transactions yet</div>
              </div>
            ) : stats.recentTxns.map((tx, i) => {
              const isPayment = tx.type === 'Payment';
              const chip = isPayment ? { label:'Payment',   color:T.success, bg:T.successLt }
                         : tx.type === 'Cash' ? { label:'Cash Sale', color:T.primary, bg:T.primaryLt }
                         : { label:tx.type,    color:T.warn,    bg:T.warnLt };
              return (
                <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom: i < stats.recentTxns.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:chip.bg, display:'flex', alignItems:'center', justifyContent:'center', color:chip.color, flexShrink:0 }}>
                    {isPayment ? <Wallet size={14}/> : <TrendingUp size={14}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:T.ink }}>{isPayment ? 'Remittance' : 'Sale'}</div>
                    <div style={{ fontSize:'10px', color:T.txt3, fontWeight:500 }}>{new Date(tx.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'14px', fontWeight:900, color:T.ink, letterSpacing:'-0.02em' }}>₦{tx.totalPrice.toLocaleString()}</div>
                    <span style={{ fontSize:'9px', fontWeight:800, color:chip.color, background:chip.bg, padding:'2px 6px', borderRadius:'6px' }}>{chip.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── PROFILE CARD ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }} style={{ ...card }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              {sectionHead('Supplier Details', <User size={14}/>)}
              <button onClick={() => setIsEditing(true)} style={{ display:'flex', alignItems:'center', gap:'5px', background:T.primaryLt, color:T.primary, border:'none', padding:'6px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                <Edit2 size={12}/> Edit
              </button>
            </div>
            {[
              { icon:<User size={15}/>,  bg:T.primaryLt,  c:T.primary,  label:'Username', val:`@${profile?.username || 'supplier'}` },
              { icon:<Phone size={15}/>, bg:T.successLt,  c:T.success,  label:'Phone',    val:profile?.phone || 'N/A' },
              ...(profile?.whatsapp_number ? [{ icon:<Phone size={15}/>, bg:'rgba(37,211,102,0.08)', c:'#25d366', label:'WhatsApp', val:profile.whatsapp_number }] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', paddingBottom: i < arr.length-1 ? '14px' : 0, borderBottom: i < arr.length-1 ? `1px solid ${T.border}` : 'none', marginBottom: i < arr.length-1 ? '14px' : 0 }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:row.bg, display:'flex', alignItems:'center', justifyContent:'center', color:row.c, flexShrink:0 }}>{row.icon}</div>
                <div>
                  <div style={{ fontSize:'10px', color:T.txt3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>{row.label}</div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:T.ink }}>{row.val}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── BANK CARD ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)', borderRadius:'24px', padding:'24px', marginBottom:'14px', position:'relative', overflow:'hidden', boxShadow:'0 12px 32px rgba(67,56,202,0.35)' }}>
            <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
            <div style={{ position:'absolute', bottom:'-20px', left:'30px', width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'rgba(165,180,252,0.7)', fontWeight:700, textTransform:'uppercase', marginBottom:'4px' }}>Remittance Account</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <Wallet size={16} color="rgba(255,255,255,0.6)"/>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{profile?.bank_name || 'Bank Name'}</span>
                  </div>
                </div>
                <div style={{ width:'40px', height:'28px', borderRadius:'6px', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:900, color:'#78350f' }}>BANK</div>
              </div>
              <div style={{ fontSize:'22px', fontWeight:900, color:'#fff', letterSpacing:'2px', marginBottom:'8px' }}>
                {profile?.account_number ? profile.account_number.replace(/(\d{4})(?=\d)/g,'$1 ') : '•••• •••• ••••'}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'9px', color:'rgba(165,180,252,0.6)', fontWeight:700, textTransform:'uppercase' }}>Account Name</div>
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.9)', fontWeight:800 }}>{profile?.account_name || '—'}</div>
                </div>
                {profile?.account_number && (
                  <button onClick={() => copy(profile.account_number)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'8px 14px', borderRadius:'12px', fontSize:'11px', fontWeight:800, cursor:'pointer' }}>
                    {copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── QUICK LINKS ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
            style={{ background:T.surface, borderRadius:'20px', padding:'8px', marginBottom:'14px', border:`1px solid ${T.border}`, boxShadow:T.shadowMd }}>
            {[
              { label:'Daily Reports',  sub:'Sales & summaries',  icon:<FileText size={17}/>,  color:T.primary, bg:T.primaryLt, path:'/reports' },
              { label:'Stock Ledger',   sub:'Inventory & stock',  icon:<Package size={17}/>,   color:'#db2777', bg:'rgba(219,39,119,0.08)', path:'/supplier/inventory' },
              { label:'Analytics',      sub:'Performance trends', icon:<BarChart3 size={17}/>, color:'#0891b2', bg:'rgba(8,145,178,0.08)', path:'/supplier/dashboard' },
            ].map((link, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height:'1px', background:T.border, margin:'0 12px' }}/>}
                <button onClick={() => navigate(link.path)}
                  style={{ width:'100%', padding:'12px', borderRadius:'14px', border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:'inherit' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:link.bg, display:'flex', alignItems:'center', justifyContent:'center', color:link.color }}>{link.icon}</div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:700, color:T.ink }}>{link.label}</div>
                      <div style={{ fontSize:'11px', color:T.txt3, fontWeight:500 }}>{link.sub}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.txt3}/>
                </button>
              </div>
            ))}
          </motion.div>

          {/* ── SIGN OUT ── */}
          <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            onClick={() => signOut()}
            style={{ width:'100%', padding:'15px', borderRadius:'18px', border:`1px solid ${T.danger}20`, background:T.dangerLt, color:T.danger, fontSize:'14px', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit', letterSpacing:'-0.01em' }}>
            <LogOut size={17}/> Sign Out
          </motion.button>
        </div>

        {/* ── EDIT MODAL ── */}
        <AnimatePresence>
          {isEditing && (
            <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-end', background:'rgba(15,23,42,0.65)', backdropFilter:'blur(8px)' }}>
              <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }} transition={{ type:'spring', damping:30, stiffness:300 }}
                style={{ background:T.surface, width:'100%', maxHeight:'92vh', overflowY:'auto', borderRadius:'28px 28px 0 0', padding:'28px 20px 40px', boxShadow:T.shadowLg }}>
                {/* Drag pill */}
                <div style={{ width:'40px', height:'4px', borderRadius:'4px', background:T.border, margin:'-12px auto 20px' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:'20px', fontWeight:900, color:T.ink }}>Edit Profile</h2>
                    <p style={{ margin:'2px 0 0', fontSize:'12px', color:T.txt3, fontWeight:500 }}>Update your supplier information</p>
                  </div>
                  <button onClick={() => setIsEditing(false)} style={{ background:T.bg, border:`1px solid ${T.border}`, width:'36px', height:'36px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.ink }}><X size={16}/></button>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)}/></div>
                  <div><label style={lbl}>Username</label><input style={inp} value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g,''))}/></div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div><label style={lbl}>Phone</label><input style={inp} value={fPhone} onChange={e=>setFPhone(e.target.value)}/></div>
                    <div><label style={lbl}>WhatsApp</label><input style={inp} value={fWhatsapp} onChange={e=>setFWhatsapp(e.target.value)}/></div>
                  </div>

                  <div style={{ height:'1px', background:T.border }}/>

                  <div><label style={lbl}>Bank Name</label><input style={inp} value={fBankName} onChange={e=>setFBankName(e.target.value)} placeholder="e.g. OPay, Zenith"/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div><label style={lbl}>Account No.</label><input style={inp} value={fAcctNo} onChange={e=>setFAcctNo(e.target.value)}/></div>
                    <div><label style={lbl}>Account Name</label><input style={inp} value={fAcctName} onChange={e=>setFAcctName(e.target.value)}/></div>
                  </div>

                  <div>
                    <label style={lbl}>Security PIN</label>
                    <div style={{ position:'relative' }}>
                      <Lock size={15} color={T.txt3} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }}/>
                      <input type="password" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}
                        style={{ ...inp, paddingLeft:'42px', letterSpacing:'6px', fontWeight:900, fontSize:'18px' }}/>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale:0.98 }} onClick={handleSave} disabled={loading}
                    style={{ padding:'17px', borderRadius:'16px', background:T.heroGrad, color:'#fff', border:'none', fontWeight:800, fontSize:'15px', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 8px 24px ${T.primary}40`, marginTop:'4px' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}
