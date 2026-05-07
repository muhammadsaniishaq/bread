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
const inp: React.CSSProperties = {
  width:'100%', boxSizing:'border-box', padding:'14px 16px',
  borderRadius:'14px', border:'1px solid rgba(0,0,0,0.08)',
  background:'#f8fafc', fontWeight:700, fontSize:'14px',
  outline:'none', fontFamily:'inherit'
};
const lbl: React.CSSProperties = {
  fontSize:'10px', fontWeight:800, color:'#64748b',
  textTransform:'uppercase', letterSpacing:'0.05em',
  marginBottom:'6px', display:'block'
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
      <div style={{ minHeight:'100vh', background:'#f1f5f9', paddingBottom:'120px', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* ── HERO ── */}
        <div style={{ background:'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', padding:'56px 24px 100px', position:'relative', overflow:'hidden', textAlign:'center' }}>
          {/* Glow orbs */}
          {[['10%','5%','200px','rgba(129,140,248,0.18)'],['70%','60%','160px','rgba(99,102,241,0.14)']].map(([t,l,s,c],i) => (
            <div key={i} style={{ position:'absolute', top:t, left:l, width:s, height:s, borderRadius:'50%', background:`radial-gradient(circle, ${c} 0%, transparent 70%)`, pointerEvents:'none' }}/>
          ))}
          <div style={{ position:'relative', zIndex:10 }}>
            {/* Avatar ring */}
            <div style={{ width:'96px', height:'96px', margin:'0 auto 16px', position:'relative' }}>
              <div style={{ position:'absolute', inset:'-4px', borderRadius:'50%', background:'linear-gradient(135deg,#818cf8,#6366f1,#4f46e5)', padding:'3px' }}>
                <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'#1e1b4b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:900, color:'#fff', overflow:'hidden' }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : initials}
                </div>
              </div>
            </div>

            <h1 style={{ fontSize:'22px', fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.02em' }}>{profile?.full_name || 'Supplier'}</h1>
            <p style={{ color:'rgba(165,180,252,0.7)', fontSize:'13px', margin:'0 0 12px' }}>@{profile?.username || 'supplier'}</p>

            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399', fontSize:'10px', fontWeight:800, textTransform:'uppercase' }}>
                <ShieldCheck size={12}/> Verified Supplier
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', background:stats.tier.bg, border:`1px solid ${stats.tier.color}30`, color:stats.tier.color, fontSize:'10px', fontWeight:800 }}>
                {stats.tier.emoji} {stats.tier.label}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding:'0 16px', marginTop:'-72px', position:'relative', zIndex:20 }}>

          {/* ── PENDING ALERT ── */}
          {stats.pendingCount > 0 && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              style={{ background:'linear-gradient(135deg,#92400e,#b45309)', borderRadius:'16px', padding:'14px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 8px 24px rgba(180,83,9,0.3)' }}>
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
              style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              <a href={`tel:${profile.phone}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#fff', borderRadius:'16px', padding:'14px', textDecoration:'none', color:'#10b981', fontWeight:800, fontSize:'13px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(16,185,129,0.15)' }}>
                <PhoneCall size={18}/> Call Me
              </a>
              <a href={`https://wa.me/${profile.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#fff', borderRadius:'16px', padding:'14px', textDecoration:'none', color:'#25d366', fontWeight:800, fontSize:'13px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(37,211,102,0.15)' }}>
                <MessageSquare size={18}/> WhatsApp
              </a>
            </motion.div>
          )}

          {/* ── KPI BENTO GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
            {[
              { icon:<TrendingUp size={18}/>, iconBg:'rgba(99,102,241,0.12)', iconColor:'#6366f1', label:'Total Sales', val:fmt(stats.totalSales), sub:'All time' },
              { icon:<Star size={18}/>,      iconBg:'rgba(202,138,4,0.12)',   iconColor:'#ca8a04', label:'My 10% Cut',  val:fmt(stats.myEarnings), sub:'Commission earned' },
              { icon:<Zap size={18}/>,       iconBg:'rgba(239,68,68,0.10)',   iconColor:'#ef4444', label:'Debt Owed',   val:fmt(stats.debt90),     sub:'90% of sales' },
              { icon:<Users size={18}/>,     iconBg:'rgba(16,185,129,0.10)', iconColor:'#10b981', label:'Customers',   val:String(stats.custCount), sub:`${stats.txCount} transactions` },
            ].map((k, i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                style={{ background:'#fff', borderRadius:'20px', padding:'16px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'12px', background:k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:k.iconColor, marginBottom:'10px' }}>{k.icon}</div>
                <div style={{ fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', marginBottom:'4px' }}>{k.label}</div>
                <div style={{ fontSize:'18px', fontWeight:900, color:'#0f172a', lineHeight:1 }}>{k.val}</div>
                <div style={{ fontSize:'9px', color:'#cbd5e1', fontWeight:600, marginTop:'3px' }}>{k.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* ── REVENUE SPLIT BAR ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            style={{ background:'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div style={{ fontSize:'12px', fontWeight:800, color:'#0f172a' }}>Revenue Split</div>
              <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8' }}>10% You · 90% Bakery</div>
            </div>
            <div style={{ height:'10px', borderRadius:'10px', background:'#f1f5f9', overflow:'hidden', display:'flex' }}>
              <motion.div initial={{ width:0 }} animate={{ width:'10%' }} transition={{ duration:1, delay:0.5 }}
                style={{ height:'100%', background:'linear-gradient(90deg,#10b981,#34d399)', borderRadius:'10px 0 0 10px' }}/>
              <motion.div initial={{ width:0 }} animate={{ width:'90%' }} transition={{ duration:1, delay:0.5 }}
                style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius:'0 10px 10px 0' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#10b981' }}/>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#475569' }}>Your Share</span>
                <span style={{ fontSize:'12px', fontWeight:900, color:'#10b981' }}>{fmt(stats.myEarnings)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#6366f1' }}/>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#475569' }}>Bakery 90%</span>
                <span style={{ fontSize:'12px', fontWeight:900, color:'#6366f1' }}>{fmt(stats.debt90)}</span>
              </div>
            </div>
          </motion.div>

          {/* ── ACCOUNT HEALTH METER ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }}
            style={{ background:'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a' }}>Account Health</div>
              <span style={{ fontSize:'11px', fontWeight:900, color:stats.healthLabel.color, background:`${stats.healthLabel.color}15`, padding:'3px 10px', borderRadius:'20px' }}>{stats.healthLabel.label}</span>
            </div>
            <div style={{ position:'relative', height:'12px', background:'#f1f5f9', borderRadius:'12px', overflow:'hidden', marginBottom:'10px' }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${stats.healthScore}%` }} transition={{ duration:1.2, ease:'easeOut', delay:0.6 }}
                style={{ position:'absolute', inset:0, background:`linear-gradient(90deg,${stats.healthLabel.color},${stats.healthLabel.color}99)`, borderRadius:'12px' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', fontWeight:700, color:'#94a3b8' }}>
              <span>Score: <strong style={{ color:stats.healthLabel.color }}>{stats.healthScore}%</strong></span>
              <span>Debt ratio: <strong style={{ color:stats.debtRatio > 50 ? '#ef4444' : '#94a3b8' }}>{stats.debtRatio}% of sales</strong></span>
            </div>
          </motion.div>

          {/* ── ACHIEVEMENTS ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.34 }}
            style={{ background:'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <Award size={15} color="#ca8a04"/> Achievements
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
              {[
                { emoji:'✅', label:'Verified',      earned:true,                       color:'#10b981' },
                { emoji:'🔥', label:'Active Seller', earned:stats.txCount >= 5,         color:'#f97316' },
                { emoji:'👑', label:'Top Performer', earned:stats.txCount >= 50,        color:'#ca8a04' },
                { emoji:'💰', label:'Revenue King',  earned:stats.totalSales >= 100000, color:'#6366f1' },
                { emoji:'🤝', label:'Client Magnet', earned:stats.custCount >= 5,       color:'#0891b2' },
                { emoji:'💎', label:'Platinum',      earned:stats.txCount >= 100,       color:'#818cf8' },
              ].map((b, i) => (
                <div key={i} style={{ textAlign:'center', padding:'12px 6px', borderRadius:'14px', background:b.earned ? `${b.color}10` : '#f8fafc', border:`1px solid ${b.earned ? b.color + '25' : 'rgba(0,0,0,0.04)'}`, opacity:b.earned ? 1 : 0.4 }}>
                  <div style={{ fontSize:'22px', marginBottom:'4px' }}>{b.emoji}</div>
                  <div style={{ fontSize:'9px', fontWeight:800, color:b.earned ? b.color : '#94a3b8', textTransform:'uppercase', lineHeight:1.2 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── RECENT TRANSACTIONS ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.36 }}
            style={{ background:'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:'8px' }}><Clock size={14} color="#6366f1"/> Recent Activity</div>
              <button onClick={() => navigate('/supplier/dashboard')} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', color:'#6366f1', fontSize:'11px', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>All <ArrowUpRight size={12}/></button>
            </div>
            {stats.recentTxns.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', color:'#94a3b8' }}>
                <Activity size={26} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }}/>
                <div style={{ fontSize:'12px', fontWeight:600 }}>No transactions yet</div>
              </div>
            ) : stats.recentTxns.map((tx, i) => {
              const isPayment = tx.type === 'Payment';
              const chip = isPayment ? { label:'Payment', color:'#10b981', bg:'rgba(16,185,129,0.1)' }
                         : tx.type === 'Cash' ? { label:'Cash Sale', color:'#6366f1', bg:'rgba(99,102,241,0.1)' }
                         : { label:tx.type, color:'#f59e0b', bg:'rgba(245,158,11,0.1)' };
              return (
                <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom: i < stats.recentTxns.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:chip.bg, display:'flex', alignItems:'center', justifyContent:'center', color:chip.color, flexShrink:0 }}>
                    {isPayment ? <Wallet size={15}/> : <TrendingUp size={15}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{isPayment ? 'Remittance' : 'Sale Transaction'}</div>
                    <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:600 }}>{new Date(tx.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'14px', fontWeight:900, color:'#0f172a' }}>₦{tx.totalPrice.toLocaleString()}</div>
                    <span style={{ fontSize:'9px', fontWeight:800, color:chip.color, background:chip.bg, padding:'2px 6px', borderRadius:'6px' }}>{chip.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── PROFILE CARD ── */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            style={{ background:'#fff', borderRadius:'20px', padding:'20px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <span style={{ fontSize:'12px', fontWeight:800, color:'#0f172a' }}>Supplier Details</span>
              <button onClick={() => setIsEditing(true)} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(99,102,241,0.08)', color:'#6366f1', border:'none', padding:'6px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:800, cursor:'pointer' }}>
                <Edit2 size={12}/> Edit
              </button>
            </div>
            {[
              { icon:<User size={16}/>, bg:'rgba(99,102,241,0.1)', c:'#6366f1', label:'Username', val:`@${profile?.username || 'supplier'}` },
              { icon:<Phone size={16}/>, bg:'rgba(16,185,129,0.1)', c:'#10b981', label:'Phone', val:profile?.phone || 'N/A' },
              ...(profile?.whatsapp_number ? [{ icon:<Phone size={16}/>, bg:'rgba(37,211,102,0.1)', c:'#25d366', label:'WhatsApp', val:profile.whatsapp_number }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom: i < 2 ? '14px' : 0 }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:row.bg, display:'flex', alignItems:'center', justifyContent:'center', color:row.c, flexShrink:0 }}>{row.icon}</div>
                <div>
                  <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:700 }}>{row.label}</div>
                  <div style={{ fontSize:'14px', fontWeight:800, color:'#0f172a' }}>{row.val}</div>
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
            style={{ background:'#fff', borderRadius:'20px', padding:'8px', marginBottom:'14px', border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            {[
              { label:'Daily Reports',  sub:'Sales & summaries',  icon:<FileText size={18}/>,  color:'#6366f1', bg:'rgba(99,102,241,0.1)',  path:'/reports' },
              { label:'Stock Ledger',   sub:'Inventory & stock',  icon:<Package size={18}/>,   color:'#db2777', bg:'rgba(219,39,119,0.1)',  path:'/supplier/inventory' },
              { label:'Analytics',      sub:'Performance trends', icon:<BarChart3 size={18}/>, color:'#0891b2', bg:'rgba(8,145,178,0.1)',   path:'/supplier/dashboard' },
            ].map((link, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height:'1px', background:'rgba(0,0,0,0.04)', margin:'0 12px' }}/>}
                <button onClick={() => navigate(link.path)}
                  style={{ width:'100%', padding:'12px', borderRadius:'14px', border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:'inherit' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'14px', background:link.bg, display:'flex', alignItems:'center', justifyContent:'center', color:link.color }}>{link.icon}</div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:'14px', fontWeight:800, color:'#0f172a' }}>{link.label}</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:600 }}>{link.sub}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#cbd5e1"/>
                </button>
              </div>
            ))}
          </motion.div>

          {/* ── SIGN OUT ── */}
          <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            onClick={() => signOut()}
            style={{ width:'100%', padding:'16px', borderRadius:'20px', border:'1.5px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)', color:'#ef4444', fontSize:'14px', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit' }}>
            <LogOut size={18}/> Sign Out
          </motion.button>
        </div>

        {/* ── EDIT MODAL ── */}
        <AnimatePresence>
          {isEditing && (
            <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-end', background:'rgba(15,23,42,0.6)', backdropFilter:'blur(6px)' }}>
              <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }} transition={{ type:'spring', damping:28, stiffness:280 }}
                style={{ background:'#fff', width:'100%', maxHeight:'92vh', overflowY:'auto', borderRadius:'28px 28px 0 0', padding:'28px 20px', boxShadow:'0 -20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:'20px', fontWeight:900, color:'#0f172a' }}>Edit Profile</h2>
                    <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>Update your supplier information</p>
                  </div>
                  <button onClick={() => setIsEditing(false)} style={{ background:'#f1f5f9', border:'none', width:'36px', height:'36px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={16}/></button>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)}/></div>
                  <div><label style={lbl}>Username</label><input style={inp} value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g,''))}/></div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div><label style={lbl}>Phone</label><input style={inp} value={fPhone} onChange={e=>setFPhone(e.target.value)}/></div>
                    <div><label style={lbl}>WhatsApp</label><input style={inp} value={fWhatsapp} onChange={e=>setFWhatsapp(e.target.value)}/></div>
                  </div>

                  <div style={{ height:'1px', background:'rgba(0,0,0,0.06)' }}/>

                  <div><label style={lbl}>Bank Name</label><input style={inp} value={fBankName} onChange={e=>setFBankName(e.target.value)} placeholder="e.g. OPay, Zenith"/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div><label style={lbl}>Account No.</label><input style={inp} value={fAcctNo} onChange={e=>setFAcctNo(e.target.value)}/></div>
                    <div><label style={lbl}>Account Name</label><input style={inp} value={fAcctName} onChange={e=>setFAcctName(e.target.value)}/></div>
                  </div>

                  <div>
                    <label style={lbl}>Security PIN</label>
                    <div style={{ position:'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)' }}/>
                      <input type="password" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))}
                        style={{ ...inp, paddingLeft:'42px', letterSpacing:'6px', fontWeight:900, fontSize:'18px' }}/>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale:0.98 }} onClick={handleSave} disabled={loading}
                    style={{ padding:'18px', borderRadius:'18px', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'#fff', border:'none', fontWeight:900, fontSize:'15px', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 24px rgba(99,102,241,0.35)', marginTop:'4px' }}>
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
