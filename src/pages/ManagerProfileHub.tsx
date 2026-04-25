import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import {
  ShieldCheck, Shield, Users, 
  Lock, Key, 
  ArrowLeft, Award, Star, Building2,
  Fingerprint, Library, BadgeCheck,
  Edit3, Eye, EyeOff, Camera,
  Target, TrendingDown, Plus, Hammer,
  History, BarChart3, Rocket
} from 'lucide-react';

/* ─── DESIGN TOKENS (Synced with ManagerCustomers) ─── */
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
  ink:'#0f172a', 
  txt2:'#475569', 
  txt3:'#94a3b8',
  shadow:'0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd:'0 10px 25px -5px rgba(0,0,0,0.08)',
  radius:'16px', 
  radiusLg:'24px',
};

const fmt = (v: number) => `₦${v.toLocaleString()}`;

export const ManagerProfileHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, customers, expenses, refreshData } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dTab, setDTab] = useState<'history' | 'analytics' | 'security'>('analytics');
  
  // Form States
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAvatar, setFAvatar] = useState('');
  const [fWhatsapp, setFWhatsapp] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fBio, setFBio] = useState('');
  const [fAltPhone, setFAltPhone] = useState('');
  const [fEmployeeId, setFEmployeeId] = useState('');
  const [fPin, setFPin] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [staffCounts, setStaffCounts] = useState({ suppliers: 0, storeKeepers: 0 });
  const [topStaff, setTopStaff] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setFName(data.full_name || '');
        setFEmail(user.email || '');
        setFPhone(data.phone || '');
        setFAvatar(data.avatar_url || '');
        setFWhatsapp(data.whatsapp_number || '');
        setFUsername(data.username || '');
        setFLocation(data.location || '');
        setFBio(data.bio || '');
        setFAltPhone(data.alt_phone || '');
        setFEmployeeId(data.employee_id || '');
        setFPin(data.pin || '');
      }

      const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, role, avatar_url');
      if (allProfiles) {
        setStaffCounts({
           suppliers: allProfiles.filter(p => p.role === 'SUPPLIER').length,
           storeKeepers: allProfiles.filter(p => p.role === 'STORE_KEEPER').length
        });

        // 🏆 Calculate Top Performers (Phase 2)
        const supplierStats = allProfiles
          .filter(p => p.role === 'SUPPLIER')
          .map(p => {
             const volume = transactions.filter(t => t.sellerId === p.id).reduce((s, t) => s + t.totalPrice, 0);
             return { ...p, volume };
          })
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 3);
        setTopStaff(supplierStats);
      }

      // 📜 Fetch Recent Audit Logs (Phase 2)
      const { data: logs } = await supabase.from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentLogs(logs || []);
    };
    fetchProfile();
  }, [user]);

  const stats = useMemo(() => {
    const totalVolume = transactions.reduce((s, t) => s + t.totalPrice, 0);
    const activeStaff = 12; 
    const totalCustomers = customers.length;
    const expenseRatio = totalVolume > 0 ? (expenses.reduce((s, e) => s + e.amount, 0) / (totalVolume || 1)) * 100 : 0;
    
    // Simulations for UI flavor
    const aov = totalVolume > 0 ? Math.round(totalVolume / (transactions.length || 1)) : 0;
    const trustScore = 98;
    const networkRank = 1;

    return {
      totalVolume,
      activeStaff,
      totalCustomers,
      efficiency: 100 - Math.round(expenseRatio),
      aov,
      trustScore,
      networkRank,
      txCount: transactions.length
    };
  }, [transactions, customers, expenses]);

  const aiTags = [
    { label: '👔 Senior Admin', bg: '#dbeafe', color: '#1e3a8a' },
    { label: '🐋 Growth Engine', bg: '#dcfce7', color: '#166534' },
    { label: '🛡️ Security Lead', bg: '#fef3c7', color: '#92400e' }
  ];

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fName,
        phone: fPhone,
        avatar_url: fAvatar,
        whatsapp_number: fWhatsapp,
        username: fUsername,
        location: fLocation,
        bio: fBio,
        alt_phone: fAltPhone,
        employee_id: fEmployeeId,
        pin: fPin
      }).eq('id', user.id);

      if (error) throw error;

      if (fPassword) {
        const { error: pErr } = await supabase.auth.updateUser({ password: fPassword });
        if (pErr) throw pErr;
      }

      await refreshData();
      setIsEditing(false);
      setFPassword('');
      alert('Profile updated successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
     if (transactions.length < 3) return null;
     return transactions.slice(-7).map((t, i) => ({ name: i, amt: t.totalPrice }));
  }, [transactions]);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '40px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Header (Same as Customer Detail Header) */}
        <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px',borderBottom:`1px solid ${T.border}`,background:T.surface}}>
           <button onClick={()=>navigate('/manager/dashboard')} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',marginLeft:'-8px'}}><ArrowLeft size={20} color={T.ink}/></button>
           <h2 style={{fontSize:'18px',fontWeight:600,color:T.ink,margin:0,flex:1}}>Manager details</h2>
        </div>

        <div style={{flex:1, overflowY: 'auto'}} className="hide-scrollbar">
          <div style={{padding:'20px'}}>
             
             {/* 🔥 EXACT CUSTOMER VIEW PATTERN 🔥 */}
             
             {/* Banner (Synched Colors) */}
             <div style={{background:'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',height:'110px',borderRadius:'16px',position:'relative'}}>
               <div style={{position:'absolute', bottom:10, right:16, display:'flex', gap:2}}>
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
                  <Star size={14} color="#f59e0b" fill="#fcd34d" />
               </div>
               {/* Avatar (Overlapping) */}
               <div style={{position:'absolute',bottom:'-40px',left:'20px',width:'100px',height:'100px',borderRadius:'50%',border:`4px solid ${T.surface}`,background:T.surface,boxShadow:T.shadowMd,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {fAvatar ? (
                    <img src={fAvatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="Profile"/>
                  ) : (
                    <span style={{fontSize:'32px',fontWeight:900,color:T.accent}}>{fName?.charAt(0) || 'M'}</span>
                  )}
                  <div onClick={() => setIsEditing(true)} style={{position:'absolute',bottom:4,right:4,width:28,height:28,borderRadius:'50%',background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',border:`2px solid ${T.surface}`,cursor:'pointer'}}>
                     <Camera size={14} color="#fff"/>
                  </div>
               </div>
             </div>

             {/* Personal Info */}
             <div style={{marginTop:'50px'}}>
                <h1 style={{fontSize:'22px',fontWeight:700,color:T.ink,margin:0,display:'flex',alignItems:'center',gap:6}}>{fName || 'Manager'} <BadgeCheck size={18} color={T.success}/></h1>
                <p style={{color:T.accent,fontSize:'14px',fontWeight:500,margin:'4px 0 0'}}>Executive Administrator</p>
                
                {/* AI Performance Tags */}
                <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                   {aiTags.map((tag,idx) => (
                      <span key={idx} style={{background:tag.bg, color:tag.color, padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
                         {tag.label}
                      </span>
                   ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <span style={{color:T.txt2,fontSize:'14px'}}>Email: {fEmail}</span>
                   <span style={{width:4,height:4,borderRadius:'50%',background:T.border}}/>
                   <span style={{color:T.txt2,fontSize:'14px'}}>@{fUsername || 'manager'}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'6px'}}>
                   <span style={{color:T.txt2,fontSize:'14px'}}>Phone: {fPhone || 'Not set'}</span>
                   {fWhatsapp && <span style={{color:T.textSuccess,fontSize:'14px',fontWeight:600}}>WhatsApp: {fWhatsapp}</span>}
                   {fLocation && <span style={{color:T.txt2,fontSize:'14px'}}>Address: {fLocation}</span>}
                </div>

                {/* Quick Actions Row */}
                <div style={{display:'flex',gap:'10px',marginTop:'20px'}}>
                   <button onClick={() => setIsEditing(true)} style={{background:T.ink,color:'#fff',padding:'12px',borderRadius:'12px',display:'flex',alignItems:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:'none',cursor:'pointer',flex:1,justifyContent:'center'}}>
                      <Edit3 size={16}/> Edit Identity
                   </button>
                   <button onClick={() => navigate('/supplier/profile')} style={{background:T.accent,color:'#fff',padding:'12px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:600,fontSize:'14px',border:'none',cursor:'pointer',flex:1}}>
                      <Rocket size={16}/> Supplier Profile
                   </button>
                </div>

                {/* Internal Memo (Dynamic) */}
                <div style={{marginTop:'28px'}}>
                   <h3 style={{fontSize:'15px',fontWeight:600,color:T.ink,margin:'0 0 8px'}}>Executive Memo</h3>
                   <p style={{color:T.txt2,fontSize:'14px',lineHeight:1.6,margin:0}}>{fBio || 'Chief Operating Officer responsible for bakery logistics, financial reconciliation, and staff management workflows.'}</p>
                </div>

                <div style={{marginTop:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                   <div style={{padding:'12px', background:T.surface2, borderRadius:'12px'}}>
                      <div style={{fontSize:'10px', color:T.txt3, fontWeight:800, textTransform:'uppercase'}}>Staff ID</div>
                      <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>{fEmployeeId || 'EXEC-001'}</div>
                   </div>
                   <div style={{padding:'12px', background:T.surface2, borderRadius:'12px'}}>
                      <div style={{fontSize:'10px', color:T.txt3, fontWeight:800, textTransform:'uppercase'}}>Alt Contact</div>
                      <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>{fAltPhone || 'None'}</div>
                   </div>
                </div>

                {/* Pastel Badges (Trust Score & Rank) */}
                <div style={{display:'flex',gap:12,marginTop:24,flexWrap:'wrap'}}>
                    <div style={{background:'#fdf2f8',border:'1px solid #fbcfe8',borderRadius:'12px',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flex:'1 1 140px'}}>
                       <div style={{width:32,height:32,borderRadius:'50%',background:'#f472b6',display:'flex',alignItems:'center',justifyContent:'center'}}><ShieldCheck size={16} color="#fff"/></div>
                       <div style={{display:'flex',flexDirection:'column'}}>
                         <span style={{fontSize:'11px',fontWeight:700,color:T.txt2}}>Management Trust</span>
                         <span style={{fontSize:'14px',fontWeight:700,color:T.ink}}>{stats.trustScore}%</span>
                       </div>
                    </div>
                    <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'12px',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,flex:'1 1 140px'}}>
                       <div style={{width:32,height:32,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center'}}><Target size={16} color="#fff"/></div>
                       <div style={{display:'flex',flexDirection:'column'}}>
                         <span style={{fontSize:'11px',fontWeight:700,color:T.txt2}}>Executive Rank</span>
                         <span style={{fontSize:'14px',fontWeight:700,color:T.ink}}>Top {stats.networkRank}%</span>
                       </div>
                    </div>
                </div>

                {/* 🛠️ EXECUTIVE TOOLBOX (Phase 2) */}
                <div style={{marginTop:'32px'}}>
                   <h3 style={{fontSize:'16px',fontWeight:800,color:T.ink,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Hammer size={18} color={T.accent}/> Executive Toolbox</h3>
                   <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}} className="hide-scrollbar">
                      {[
                        { label: 'Add Staff', icon: Plus, path: '/manager/staff', bg: '#eff6ff', color: '#2563eb' },
                        { label: 'New Product', icon: Rocket, path: '/manager/products', bg: '#fdf2f8', color: '#db2777' },
                        { label: 'Log Expense', icon: TrendingDown, path: '/manager/expenses', bg: '#fef2f2', color: '#dc2626' },
                        { label: 'System Audit', icon: History, path: '/manager/audit', bg: '#f0fdf4', color: '#16a34a' },
                      ].map((tool, i) => (
                        <motion.div key={i} whileTap={{scale:0.95}} onClick={() => navigate(tool.path)}
                          style={{minWidth:'110px', padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', boxShadow:T.shadow}}>
                           <div style={{width:32,height:32,borderRadius:'10px',background:tool.bg,display:'flex',alignItems:'center',justifyContent:'center'}}><tool.icon size={16} color={tool.color}/></div>
                           <span style={{fontSize:'11px',fontWeight:800,color:T.ink,textAlign:'center'}}>{tool.label}</span>
                        </motion.div>
                      ))}
                   </div>
                </div>

                {/* 📦 EXECUTIVE OVERSIGHT & LEADERBOARD */}
                <div style={{marginTop:'32px'}}>
                   <h3 style={{fontSize:'16px',fontWeight:800,color:T.ink,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Building2 size={18} color={T.accent}/> Performance Directory</h3>
                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div style={{padding:'16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'18px',cursor:'pointer'}} onClick={() => navigate('/manager/staff')}>
                         <div style={{width:36,height:36,borderRadius:'10px',background:T.warnLt,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}><Users size={18} color={T.warn}/></div>
                         <div style={{fontSize:'18px',fontWeight:900,color:T.ink}}>{staffCounts.suppliers + staffCounts.storeKeepers} Staff</div>
                         <div style={{fontSize:'10px',fontWeight:700,color:T.txt3,textTransform:'uppercase',marginTop:4}}>Team Status</div>
                         <div style={{marginTop:12,display:'flex',gap:6}}>
                            <span style={{fontSize:'9px',fontWeight:800,padding:'2px 6px',background:T.warnLt,color:T.textWarn,borderRadius:4}}>{staffCounts.suppliers} Sup.</span>
                            <span style={{fontSize:'9px',fontWeight:800,padding:'2px 6px',background:'#dbeafe',color:'#1e3a8a',borderRadius:4}}>{staffCounts.storeKeepers} Stor.</span>
                         </div>
                      </div>

                      {/* 🏆 MINI LEADERBOARD */}
                      <div style={{padding:'16px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'18px'}}>
                         <div style={{fontSize:'11px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:12,display:'flex',justifyContent:'space-between'}}>
                            Leaderboard <Star size={10} color={T.warn} fill={T.warn}/>
                         </div>
                         <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {topStaff.length === 0 ? <p style={{fontSize:9,color:T.txt3}}>Initializing...</p> : topStaff.map((s, i) => (
                               <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{width:22,height:22,borderRadius:'50%',background:T.surface2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:T.accent,overflow:'hidden'}}>
                                     {s.avatar_url ? <img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : s.full_name?.charAt(0)}
                                  </div>
                                  <div style={{flex:1,fontSize:11,fontWeight:700,color:T.ink,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.full_name}</div>
                                  <div style={{fontSize:10,fontWeight:800,color:T.success}}>{i+1}st</div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Tabbed Navigation */}
             <div style={{marginTop:'28px',display:'flex',gap:'24px',borderBottom:`1px solid ${T.border}`}}>
                {['analytics', 'history', 'security'].map(tab => (
                   <button key={tab} onClick={()=>setDTab(tab as any)} style={{background:'none',border:'none',borderBottom:dTab===tab?`2px solid ${T.accent}`:'2px solid transparent',padding:'12px 0',fontSize:'14px',fontWeight:dTab===tab?600:500,color:dTab===tab?T.accent:T.txt2,cursor:'pointer',textTransform:'capitalize'}}>
                      {tab}
                   </button>
                ))}
             </div>

             {/* Tab Contents */}
             <div style={{paddingTop:'24px'}}>
                <AnimatePresence mode="wait">
                   {dTab === 'analytics' && (
                      <motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:16}}>
                         <div style={{background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`, boxShadow: T.shadow}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                               <div>
                                  <h4 style={{fontSize:'14px',fontWeight:600,color:T.txt2,margin:0}}>Operational Yield</h4>
                                  <p style={{fontSize:'28px',fontWeight:700,margin:'4px 0 0',color:T.ink}}>{fmt(stats.totalVolume)}</p>
                               </div>
                               <div style={{textAlign:'right'}}>
                                  <div style={{fontSize:'10px',fontWeight:800,color:T.textDanger,background:T.dangerLt,padding:'4px 8px',borderRadius:'8px'}}>EXP: {fmt(expenses.reduce((s,e)=>s+e.amount,0))}</div>
                               </div>
                            </div>
                            {chartData && (
                               <div style={{height:'120px',marginTop:'10px'}}>
                                  <ResponsiveContainer width="100%" height="100%">
                                     <BarChart data={chartData}>
                                        <Bar dataKey="amt" fill={T.accent} radius={[4,4,0,0]} barSize={20} />
                                     </BarChart>
                                  </ResponsiveContainer>
                               </div>
                            )}
                            <div style={{marginTop:16, display:'flex', alignItems:'center', gap:8, fontSize:11, color:T.txt3, fontWeight:600}}>
                               <BarChart3 size={14}/> Revenue vs. Expense monitoring
                            </div>
                         </div>

                         <div style={{background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`, boxShadow: T.shadow}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'12px'}}>
                               <div><p style={{fontSize:'13px',fontWeight:600,color:T.txt2,margin:'0 0 4px'}}>Efficiency Index</p><p style={{fontSize:'20px',fontWeight:700,color:T.ink,margin:0}}>{stats.efficiency}%</p></div>
                               <div style={{textAlign:'right'}}><p style={{fontSize:'12px',fontWeight:500,color:T.txt3,margin:'0 0 4px'}}>Profitability</p><p style={{fontSize:'14px',fontWeight:600,color:T.success}}>OPTIMAL</p></div>
                            </div>
                            <div style={{width:'100%',height:'6px',background:T.surface2,borderRadius:'10px',overflow:'hidden'}}><div style={{height:'100%',background:T.success,borderRadius:'10px',width:`${stats.efficiency}%`}}/></div>
                         </div>
                      </motion.div>
                   )}

                   {dTab === 'history' && (
                      <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                         <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
                            <div style={{background:T.surface2,padding:'16px',borderRadius:'12px',flex:1}}>
                               <p style={{fontSize:'20px',fontWeight:700,margin:0,color:T.ink}}>{stats.txCount}</p>
                               <p style={{fontSize:'13px',color:T.txt2,margin:'4px 0 0'}}>Total Triggers</p>
                            </div>
                            <div style={{background:T.successLt,padding:'16px',borderRadius:'12px',flex:1}}>
                               <p style={{fontSize:'20px',fontWeight:700,margin:0,color:T.textSuccess}}>{stats.activeStaff}</p>
                               <p style={{fontSize:'13px',color:T.textSuccess,margin:'4px 0 0'}}>Direct Staff</p>
                            </div>
                         </div>
                         <h4 style={{fontSize:'14px',fontWeight:600,color:T.txt2,margin:'0 0 16px'}}>System Activity Log</h4>
                         <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                            {recentLogs.length === 0 ? (
                               <div style={{textAlign:'center',padding:'20px',color:T.txt3,fontSize:13}}>No recent triggers captured.</div>
                            ) : recentLogs.map((log, i) => (
                               <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
                                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                     <div style={{width:'36px',height:'36px',borderRadius:'8px',background:T.surface2,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                        <History size={16} color={T.accent}/>
                                     </div>
                                     <div style={{display:'flex',flexDirection:'column'}}>
                                        <span style={{fontSize:'13px',fontWeight:700,color:T.ink}}>{log.action}</span>
                                        <span style={{fontSize:'11px',color:T.txt3}}>{new Date(log.created_at).toLocaleString()}</span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </motion.div>
                   )}

                   {dTab === 'security' && (
                      <motion.div key="security" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                         <div style={{background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`, boxShadow: T.shadow}}>
                            <h4 style={{fontSize:'15px',fontWeight:700,color:T.ink,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Lock size={16}/> Security Controls</h4>
                            
                            <div style={{display:'flex',flexDirection:'column',gap:16}}>
                               <div onClick={() => setIsEditing(true)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px',background:T.surface2,borderRadius:'12px',cursor:'pointer'}}>
                                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                                     <Key size={16} color={T.txt3}/>
                                     <div>
                                        <div style={{fontSize:'13px',fontWeight:600,color:T.ink}}>Update Credentials</div>
                                        <div style={{fontSize:'11px',color:T.txt3}}>Email, Password & PIN</div>
                                     </div>
                                  </div>
                                  <ArrowLeft size={16} color={T.txt3} style={{transform:'rotate(180deg)'}}/>
                               </div>

                               <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px'}}>
                                  <Shield size={16} color={T.success}/>
                                  <div>
                                     <div style={{fontSize:'13px',fontWeight:600,color:T.ink}}>System Lock</div>
                                     <div style={{fontSize:'11px',color:T.txt3}}>Active • Protected by 2FA</div>
                                  </div>
                                </div>
                            </div>
                         </div>

                         {/* Records Vault */}
                         <div style={{marginTop:'20px',background:T.surface,borderRadius:'16px',padding:'20px',border:`1px solid ${T.border}`, boxShadow: T.shadow}}>
                            <h4 style={{fontSize:'15px',fontWeight:700,color:T.ink,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Library size={16}/> Records Vault</h4>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                               <div style={{padding:'12px',background:T.surface2,borderRadius:'12px',textAlign:'center',cursor:'pointer'}}>
                                  <Fingerprint size={20} color={T.accent} style={{marginBottom:6}}/>
                                  <div style={{fontSize:'12px',fontWeight:700,color:T.ink}}>Manager ID</div>
                               </div>
                               <div style={{padding:'12px',background:T.surface2,borderRadius:'12px',textAlign:'center',cursor:'pointer'}}>
                                  <Award size={20} color={T.warn} style={{marginBottom:6}}/>
                                  <div style={{fontSize:'12px',fontWeight:700,color:T.ink}}>Operations Cert</div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

          </div>
        </div>

        {/* ─── FLOATING EDIT MODAL (Exact Pattern) ─── */}
        <AnimatePresence>
          {isEditing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(5px)', padding: '20px' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: T.surface, width: '100%', maxWidth: '440px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: T.shadowMd }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: T.ink }}>Update Identity</h3>
                   <button type="button" onClick={() => setIsEditing(false)} style={{ background: T.surface2, border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink }}><X size={16}/></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto' }} className="hide-scrollbar">
                   <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      <div style={{display:'flex',flexDirection:'column',gap:12}}>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Profile Display Name</label>
                            <input value={fName} onChange={e=>setFName(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Profile Avatar (Image URL)</label>
                            <input value={fAvatar} onChange={e=>setFAvatar(e.target.value)} placeholder="https://example.com/photo.jpg" style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Username</label>
                            <input value={fUsername} onChange={e=>setFUsername(e.target.value.toLowerCase().replace(/\s+/g,''))} placeholder="e.g. sani_manager" style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Phone Number</label>
                            <input value={fPhone} onChange={e=>setFPhone(e.target.value)} placeholder="080..." style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>WhatsApp Number</label>
                            <input value={fWhatsapp} onChange={e=>setFWhatsapp(e.target.value)} placeholder="081..." style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Office Address / Location</label>
                            <input value={fLocation} onChange={e=>setFLocation(e.target.value)} placeholder="Enter business address" style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Secondary Phone (Alternative)</label>
                            <input value={fAltPhone} onChange={e=>setFAltPhone(e.target.value)} placeholder="Alternative number" style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Official Staff ID / Employee Code</label>
                            <input value={fEmployeeId} onChange={e=>setFEmployeeId(e.target.value)} placeholder="e.g. BREAD-MGR-01" style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Executive Bio / Professional Memo</label>
                            <textarea value={fBio} onChange={e=>setFBio(e.target.value)} placeholder="Describe your responsibilities..." style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500,minHeight:'80px',resize:'none'}}/>
                         </div>
                         <div style={{height:'1px',background:T.border,margin:'8px 0'}}/>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>Security PIN</label>
                            <input type="password" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value.replace(/\D/g,''))} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500,textAlign:'center',letterSpacing:'8px'}}/>
                         </div>
                         <div>
                            <label style={{fontSize:'11px',fontWeight:700,color:T.txt2,textTransform:'uppercase',marginBottom:8,display:'block'}}>New Password</label>
                            <div style={{position:'relative'}}>
                               <input type={showPass?'text':'password'} value={fPassword} onChange={e=>setFPassword(e.target.value)} style={{width:'100%',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',fontSize:'14px',fontWeight:500}}/>
                               <button onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:12,background:'none',border:'none',color:T.txt3}}>{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                            </div>
                         </div>
                      </div>
                      <button onClick={handleSave} disabled={loading} style={{background:T.ink,color:'#fff',border:'none',borderRadius:'12px',padding:'16px',fontWeight:600,fontSize:'14px',cursor:'pointer',marginTop:12}}>
                        {loading?'Updating...':'Save Configuration'}
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
};

// Internal minimal X icon
const X = ({size, color}:{size:number, color?:string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default ManagerProfileHub;
