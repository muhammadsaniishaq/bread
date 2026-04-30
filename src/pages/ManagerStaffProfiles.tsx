import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, Search, RefreshCw, X, Save, Shield, Phone, Mail, Calendar, Edit2, ChevronRight, Check, UserPlus, MessageCircle, Trash2, SortAsc, AlertTriangle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.08)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.1)',
  danger: '#ef4444', dangerLt: 'rgba(239,68,68,0.1)',
  amber: '#f59e0b', amberLt: 'rgba(245,158,11,0.1)',
  purple: '#7c3aed', purpleLt: 'rgba(124,58,237,0.08)',
  blue: '#0891b2', blueLt: 'rgba(8,145,178,0.1)',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f1f5f9', surface: '#ffffff',
  borderL: 'rgba(0,0,0,0.05)', shadow: '0 4px 12px rgba(0,0,0,0.06)',
};

const ROLES: Record<string,{color:string;bg:string;label:string;icon:string}> = {
  MANAGER:      {color:T.purple, bg:T.purpleLt, label:'Manager',      icon:'🛡️'},
  SUPPLIER:     {color:T.amber,  bg:T.amberLt,  label:'Supplier',     icon:'📦'},
  STORE_KEEPER: {color:T.blue,   bg:T.blueLt,   label:'Store Keeper', icon:'🏪'},
  CUSTOMER:     {color:T.success,bg:T.successLt,label:'Customer',     icon:'👤'},
  ADMIN:        {color:T.danger, bg:T.dangerLt, label:'Admin',        icon:'⚡'},
};

const inp:React.CSSProperties={width:'100%',padding:'10px 12px',background:T.bg,border:`1px solid ${T.borderL}`,borderRadius:'10px',fontSize:'12px',fontWeight:600,color:T.ink,outline:'none',boxSizing:'border-box'};
const lbl:React.CSSProperties={fontSize:'9px',fontWeight:800,color:T.txt3,textTransform:'uppercase',display:'block',marginBottom:'4px'};

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; }

const ManagerStaffProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [dTab, setDTab] = useState<'info'|'activity'|'permissions'>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sortMode, setSortMode] = useState<'newest'|'oldest'|'az'>('newest');
  const [delConfirm, setDelConfirm] = useState(false);
  const [copied, setCopied] = useState('');
  const [eForm, setEForm] = useState({full_name:'',phone:'',email:'',username:'',role:''});
  const [aForm, setAForm] = useState({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'});

  const fetch = async () => {
    setLoading(true);
    const {data} = await supabase.from('profiles').select('id,full_name,phone,email,role,created_at,username').order('created_at',{ascending:false});
    setProfiles(data||[]);
    setLoading(false);
  };
  useEffect(()=>{fetch();},[]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  };

  const openEdit = (p:Profile) => { setEForm({full_name:p.full_name||'',phone:p.phone||'',email:p.email||'',username:p.username||'',role:p.role||''}); setEditOpen(true); };

  const handleSave = async () => {
    if(!selected) return;
    setSaving(true);
    await supabase.from('profiles').update({full_name:eForm.full_name,phone:eForm.phone,username:eForm.username,role:eForm.role}).eq('id',selected.id);
    setProfiles(ps=>ps.map(p=>p.id===selected.id?{...p,...eForm}:p));
    setSelected({...selected,...eForm});
    setSaving(false); setSaved(true); setTimeout(()=>{setSaved(false);setEditOpen(false);},1200);
  };

  const handleAdd = async () => {
    if (!aForm.full_name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('profiles').insert({ full_name: aForm.full_name, phone: aForm.phone, email: aForm.email, username: aForm.username, role: aForm.role }).select().single();
    if (data) { setProfiles(ps => [data, ...ps]); setAddOpen(false); setAForm({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'}); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await supabase.from('profiles').delete().eq('id', selected.id);
    setProfiles(ps => ps.filter(p => p.id !== selected.id));
    setSelected(null); setDelConfirm(false);
  };

  const counts = profiles.reduce<Record<string,number>>((a,p)=>{a[p.role]=(a[p.role]||0)+1;return a;},{});

  const sorted = [...profiles].sort((a,b) => {
    if (sortMode==='az') return (a.full_name||'').localeCompare(b.full_name||'');
    if (sortMode==='oldest') return new Date(a.created_at||0).getTime()-new Date(b.created_at||0).getTime();
    return new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime();
  });

  const filtered = sorted.filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.email?.toLowerCase().includes(s)||p.phone?.includes(s));
  });

  const cfg = (role:string)=>ROLES[role]||{color:T.txt3,bg:T.bg,label:role,icon:'👤'};

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:'80px'}}>

        {/* HEADER */}
        <div style={{background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4f46e5 100%)',padding:'48px 16px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-30px',right:'-30px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
          <div style={{position:'absolute',bottom:'-40px',left:'20%',width:'140px',height:'140px',borderRadius:'50%',background:'rgba(255,255,255,0.03)'}}/>
          <div style={{position:'relative',zIndex:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'10px',padding:'7px 12px',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
                <ArrowLeft size={13}/> Back
              </button>
              <div style={{display:'flex',gap:'6px'}}>
                <motion.button whileTap={{scale:0.9}} onClick={()=>setAddOpen(true)} style={{padding:'7px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',gap:'5px',cursor:'pointer',fontSize:'11px',fontWeight:700,color:'#fff'}}>
                  <UserPlus size={13}/> Add
                </motion.button>
                <motion.button whileTap={{scale:0.9}} onClick={fetch} style={{width:'34px',height:'34px',borderRadius:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <RefreshCw size={14} color="#fff"/>
                </motion.button>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'14px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Users size={22} color="#c4b5fd"/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:'20px',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>Staff Profiles</h1>
                <p style={{margin:0,fontSize:'11px',color:'rgba(255,255,255,0.55)',fontWeight:600}}>{profiles.length} registered accounts</p>
              </div>
            </div>
            {/* STATS ROW */}
            <div style={{display:'flex',gap:'8px',marginBottom:'14px',overflowX:'auto'}}>
              {Object.entries(ROLES).filter(([k])=>counts[k]).map(([role,c])=>(
                <div key={role} style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',flexShrink:0,textAlign:'center',minWidth:'60px'}}>
                  <div style={{fontSize:'13px'}}>{c.icon}</div>
                  <div style={{fontSize:'14px',fontWeight:900,color:'#fff'}}>{counts[role]||0}</div>
                  <div style={{fontSize:'9px',color:'rgba(255,255,255,0.6)',fontWeight:700}}>{c.label}</div>
                </div>
              ))}
            </div>
            {/* SEARCH */}
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.5)'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone…"
                style={{width:'100%',padding:'11px 12px 11px 34px',borderRadius:'12px',border:'1.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:'12px',fontWeight:600,boxSizing:'border-box',outline:'none'}}/>
            </div>
          </div>
        </div>

        <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>

          {/* SORT + COUNT BAR */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'11px',fontWeight:700,color:T.txt3}}>{filtered.length} staff member{filtered.length!==1?'s':''}</span>
            <div style={{display:'flex',gap:'4px'}}>
              {([['newest','Newest'],['oldest','Oldest'],['az','A–Z']] as const).map(([id,label])=>(
                <button key={id} onClick={()=>setSortMode(id)}
                  style={{padding:'4px 9px',borderRadius:'6px',border:`1px solid ${sortMode===id?T.primary:T.borderL}`,background:sortMode===id?T.primaryLt:T.surface,color:sortMode===id?T.primary:T.txt3,fontWeight:700,fontSize:'9px',cursor:'pointer',display:'flex',alignItems:'center',gap:'3px'}}>
                  {sortMode===id&&<SortAsc size={9}/>}{label}
                </button>
              ))}
            </div>
          </div>

          {/* ROLE FILTER PILLS */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'2px'}}>
            {[{id:'ALL',label:'👥 All',count:profiles.length},...Object.entries(ROLES).filter(([k])=>counts[k]).map(([id,c])=>({id,label:`${c.icon} ${c.label}`,count:counts[id]||0}))].map(r=>(
              <button key={r.id} onClick={()=>setFilterRole(r.id)}
                style={{padding:'6px 12px',borderRadius:'20px',border:`1.5px solid ${filterRole===r.id?T.primary:T.borderL}`,background:filterRole===r.id?T.primary:T.surface,color:filterRole===r.id?'#fff':T.txt2,fontWeight:800,fontSize:'10px',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                {r.label} · {r.count}
              </button>
            ))}
          </div>

          {/* CARDS */}
          {loading ? (
            <div style={{padding:'40px',textAlign:'center',color:T.txt3}}>
              <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}
                style={{width:'26px',height:'26px',borderRadius:'50%',border:`3px solid ${T.primaryLt}`,borderTopColor:T.primary,margin:'0 auto 10px'}}/>
              Loading…
            </div>
          ) : filtered.length===0 ? (
            <div style={{padding:'60px 40px',textAlign:'center',color:T.txt3,background:T.surface,borderRadius:'24px',border:`1.5px dashed ${T.borderL}`}}>
              <div style={{width:'64px',height:'64px',borderRadius:'50%',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <Users size={32} style={{opacity:0.2}}/>
              </div>
              <div style={{fontSize:'16px',fontWeight:900,color:T.ink,marginBottom:'4px'}}>No staff found</div>
              <p style={{fontSize:'12px',fontWeight:600,color:T.txt3,margin:'0 0 20px'}}>Try adjusting your filters or search query.</p>
              <button onClick={()=>setAddOpen(true)} style={{padding:'10px 20px',background:T.primary,color:'#fff',border:'none',borderRadius:'12px',fontWeight:800,fontSize:'12px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'8px'}}>
                <UserPlus size={14}/> Add New Staff
              </button>
            </div>
          ) : filtered.map((p,i)=>{
            const c=cfg(p.role);
            return (
              <motion.div key={p.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                onClick={()=>{setSelected(p);setDTab('info');}}
                style={{background:T.surface,borderRadius:'16px',border:`1px solid ${T.borderL}`,boxShadow:T.shadow,cursor:'pointer',overflow:'hidden'}}>
                <div style={{height:'3px',background:`linear-gradient(90deg,${c.color},${T.primary})`}}/>
                <div style={{padding:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'46px',height:'46px',borderRadius:'50%',background:`linear-gradient(135deg,${c.color},${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,color:'#fff',flexShrink:0}}>
                    {(p.full_name||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontSize:'14px',fontWeight:800,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name||'Unnamed'}</div>
                      <ChevronRight size={14} color={T.txt3}/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px'}}>
                      <span style={{fontSize:'9px',fontWeight:900,color:c.color,background:c.bg,padding:'2px 8px',borderRadius:'6px'}}>{c.icon} {c.label}</span>
                      {p.username&&<span style={{fontSize:'9px',color:T.txt3,fontWeight:600}}>@{p.username}</span>}
                    </div>
                    <div style={{display:'flex',gap:'10px',marginTop:'6px',flexWrap:'wrap'}}>
                      {p.phone&&<div style={{display:'flex',alignItems:'center',gap:'3px'}}><Phone size={9} color={T.txt3}/><span style={{fontSize:'10px',color:T.txt3,fontWeight:600}}>{p.phone}</span></div>}
                      {p.email&&<div style={{display:'flex',alignItems:'center',gap:'3px',overflow:'hidden'}}><Mail size={9} color={T.txt3}/><span style={{fontSize:'10px',color:T.txt3,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.email}</span></div>}
                    </div>
                  </div>
                </div>
                <div style={{padding:'7px 14px',borderTop:`1px solid ${T.borderL}`,display:'flex',justifyContent:'space-between',background:T.bg}}>
                  <span style={{fontSize:'9px',fontWeight:800,color:T.primary}}>STF-{p.id?.slice(0,8).toUpperCase()}</span>
                  {p.created_at&&<span style={{fontSize:'9px',color:T.txt3,fontWeight:600}}>Joined {new Date(p.created_at).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* DETAIL DRAWER */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200}}/>
              <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:300}}
                style={{position:'fixed',top:0,right:0,bottom:0,width:'min(420px,100vw)',background:T.surface,zIndex:201,display:'flex',flexDirection:'column',overflow:'hidden'}}>

                {/* DRAWER HEADER */}
                <div style={{background:`linear-gradient(135deg,${cfg(selected.role).color} 0%,${T.primary} 100%)`,padding:'20px 16px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'-20px',right:'-20px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'relative'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'2px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:900,color:'#fff'}}>
                        {(selected.full_name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:'16px',fontWeight:900,color:'#fff',letterSpacing:'-0.01em'}}>{selected.full_name}</div>
                        <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)',fontWeight:600,marginTop:'2px'}}>{cfg(selected.role).icon} {cfg(selected.role).label}</div>
                        {selected.username&&<div style={{fontSize:'10px',color:'rgba(255,255,255,0.6)',marginTop:'1px'}}>@{selected.username}</div>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>openEdit(selected)} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',padding:'6px',cursor:'pointer',display:'flex'}}>
                        <Edit2 size={13} color="#fff"/>
                      </button>
                      <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',padding:'6px',cursor:'pointer',display:'flex'}}>
                        <X size={13} color="#fff"/>
                      </button>
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div style={{display:'flex',gap:'8px',marginTop:'14px',position:'relative'}}>
                    <div style={{flex:1,background:'rgba(255,255,255,0.12)',borderRadius:'8px',padding:'7px',textAlign:'center',position:'relative'}}>
                      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.65)',fontWeight:700,textTransform:'uppercase'}}>ID</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',marginTop:'2px'}}>
                        <div style={{fontSize:'10px',fontWeight:900,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>STF-{selected.id?.slice(0,6).toUpperCase()}</div>
                        <button onClick={()=>copyToClipboard('STF-'+selected.id?.toUpperCase(), 'sid')} style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'flex'}}>
                          {copied==='sid' ? <Check size={10} color={T.success}/> : <Copy size={10} color="#fff" style={{opacity:0.6}}/>}
                        </button>
                      </div>
                    </div>
                    {[
                      {label:'Joined',value:selected.created_at?new Date(selected.created_at).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}):'—'},
                      {label:'Status',value:'Active'},
                    ].map((s,i)=>(
                      <div key={i} style={{flex:1,background:'rgba(255,255,255,0.12)',borderRadius:'8px',padding:'7px',textAlign:'center'}}>
                        <div style={{fontSize:'9px',color:'rgba(255,255,255,0.65)',fontWeight:700,textTransform:'uppercase'}}>{s.label}</div>
                        <div style={{fontSize:'10px',fontWeight:900,color:'#fff',marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div style={{display:'flex',gap:'6px',padding:'10px 14px 0'}}>
                  {selected.phone&&<a href={`tel:${selected.phone}`} style={{flex:1,padding:'8px',background:T.successLt,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',textDecoration:'none',color:T.success,fontWeight:700,fontSize:'10px'}}><Phone size={11}/>Call</a>}
                  {selected.phone&&<a href={`https://wa.me/${selected.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{flex:1,padding:'8px',background:'rgba(37,211,102,0.12)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',textDecoration:'none',color:'#25d366',fontWeight:700,fontSize:'10px'}}><MessageCircle size={11}/>WhatsApp</a>}
                  {selected.email&&<a href={`mailto:${selected.email}`} style={{flex:1,padding:'8px',background:T.primaryLt,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',textDecoration:'none',color:T.primary,fontWeight:700,fontSize:'10px'}}><Mail size={11}/>Email</a>}
                </div>

                {/* TABS */}
                <div style={{display:'flex',gap:'4px',padding:'8px 14px 0',background:T.bg}}>
                  {([['info','📋 Info'],['activity','📈 Activity'],['permissions','🔒 Perms']] as const).map(([id,label])=>(
                    <button key={id} onClick={()=>setDTab(id)}
                      style={{flex:1,padding:'8px 4px',borderRadius:'8px',border:'none',background:dTab===id?T.surface:'transparent',color:dTab===id?T.primary:T.txt3,fontWeight:800,fontSize:'10px',cursor:'pointer',boxShadow:dTab===id?T.shadow:'none',transition:'all 0.2s'}}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:'10px'}}>

                  {dTab==='activity'&&(
                    <div style={{background:T.surface,borderRadius:'14px',border:`1px solid ${T.borderL}`,overflow:'hidden',boxShadow:T.shadow}}>
                      <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.borderL}`,fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase'}}>Recent Activity</div>
                      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                        {[
                          {icon:'🔐',label:'Logged in',time:'Today, 08:14 AM',color:T.success},
                          {icon:'📦',label:'Updated stock',time:'Yesterday, 3:20 PM',color:T.amber},
                          {icon:'💰',label:'Processed sale',time:'2 days ago',color:T.primary},
                          {icon:'👤',label:'Profile updated',time:'Apr 27',color:T.purple},
                        ].map((a,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',background:T.bg,borderRadius:'8px'}}>
                            <div style={{width:'28px',height:'28px',borderRadius:'8px',background:`${a.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',flexShrink:0}}>{a.icon}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:'11px',fontWeight:700,color:T.ink}}>{a.label}</div>
                              <div style={{fontSize:'9px',color:T.txt3,fontWeight:600,marginTop:'1px'}}>{a.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DANGER ZONE inside info tab */}
                  {dTab==='info'&&!delConfirm&&(
                    <div style={{background:T.surface,borderRadius:'14px',border:`1px solid rgba(239,68,68,0.15)`,padding:'12px 14px',boxShadow:T.shadow}}>
                      <div style={{fontSize:'10px',fontWeight:800,color:T.danger,textTransform:'uppercase',marginBottom:'8px',display:'flex',alignItems:'center',gap:'5px'}}><AlertTriangle size={11}/>Danger Zone</div>
                      <button onClick={()=>setDelConfirm(true)} style={{width:'100%',padding:'9px',background:T.dangerLt,border:`1px solid ${T.danger}20`,borderRadius:'8px',color:T.danger,fontWeight:700,fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                        <Trash2 size={12}/> Remove Staff Account
                      </button>
                    </div>
                  )}
                  {dTab==='info'&&delConfirm&&(
                    <div style={{background:T.dangerLt,borderRadius:'14px',border:`1px solid ${T.danger}30`,padding:'14px'}}>
                      <div style={{fontSize:'12px',fontWeight:800,color:T.danger,marginBottom:'8px'}}>⚠️ Confirm Removal</div>
                      <div style={{fontSize:'11px',color:T.txt2,fontWeight:600,marginBottom:'12px'}}>This will permanently delete {selected.full_name}'s profile. This cannot be undone.</div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button onClick={()=>setDelConfirm(false)} style={{flex:1,padding:'9px',background:T.surface,border:`1px solid ${T.borderL}`,borderRadius:'8px',fontWeight:700,fontSize:'11px',cursor:'pointer',color:T.txt2}}>Cancel</button>
                        <button onClick={handleDelete} style={{flex:1,padding:'9px',background:T.danger,border:'none',borderRadius:'8px',color:'#fff',fontWeight:800,fontSize:'11px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}><Trash2 size={11}/>Delete</button>
                      </div>
                    </div>
                  )}

                  {dTab==='info'&&(
                    <>
                      {/* Contact info */}
                      <div style={{background:T.surface,borderRadius:'14px',border:`1px solid ${T.borderL}`,overflow:'hidden',boxShadow:T.shadow}}>
                        <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.borderL}`,fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Contact Details</div>
                        <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                          {[
                            {icon:<Phone size={12} color={T.primary}/>, label:'Phone', value:selected.phone||'Not set'},
                            {icon:<Mail size={12} color={T.primary}/>,  label:'Email', value:selected.email||'Not set'},
                            {icon:<Calendar size={12} color={T.primary}/>, label:'Joined', value:selected.created_at?new Date(selected.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—'},
                          ].map((row,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',background:T.bg,borderRadius:'8px'}}>
                              <div style={{width:'26px',height:'26px',borderRadius:'7px',background:T.primaryLt,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{row.icon}</div>
                              <div>
                                <div style={{fontSize:'9px',fontWeight:800,color:T.txt3,textTransform:'uppercase'}}>{row.label}</div>
                                <div style={{fontSize:'11px',fontWeight:700,color:T.ink,marginTop:'1px'}}>{row.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Role badge */}
                      <div style={{background:T.surface,borderRadius:'14px',border:`1px solid ${T.borderL}`,padding:'14px',boxShadow:T.shadow}}>
                        <div style={{fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',marginBottom:'10px'}}>Role & Access Level</div>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',background:cfg(selected.role).bg,borderRadius:'10px',border:`1px solid ${cfg(selected.role).color}20`}}>
                          <span style={{fontSize:'22px'}}>{cfg(selected.role).icon}</span>
                          <div>
                            <div style={{fontSize:'13px',fontWeight:900,color:cfg(selected.role).color}}>{cfg(selected.role).label}</div>
                            <div style={{fontSize:'10px',color:T.txt3,fontWeight:600,marginTop:'2px'}}>
                              {selected.role==='MANAGER'?'Full control over bakery operations, reports, and settings.'
                                :selected.role==='SUPPLIER'?'Manages product sales, debt collection, and inventory assignments.'
                                :selected.role==='STORE_KEEPER'?'Responsible for raw materials, production logs, and warehouse stock.'
                                :selected.role==='ADMIN'?'Super administrator with access to staff management and system audits.'
                                :'Standard user account with restricted view-only permissions.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {dTab==='permissions'&&(
                    <div style={{background:T.surface,borderRadius:'14px',border:`1px solid ${T.borderL}`,overflow:'hidden',boxShadow:T.shadow}}>
                      <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.borderL}`,fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Access Permissions</div>
                      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:'6px'}}>
                        {[
                          {label:'View Dashboard',       roles:['MANAGER','ADMIN','SUPPLIER','STORE_KEEPER']},
                          {label:'Manage Customers',     roles:['MANAGER','ADMIN']},
                          {label:'Process Sales',        roles:['MANAGER','ADMIN','SUPPLIER']},
                          {label:'View Reports',         roles:['MANAGER','ADMIN']},
                          {label:'Manage Stock',         roles:['MANAGER','ADMIN','STORE_KEEPER']},
                          {label:'Edit Settings',        roles:['MANAGER','ADMIN']},
                          {label:'Delete Records',       roles:['ADMIN']},
                          {label:'Manage Staff',         roles:['ADMIN']},
                        ].map((perm,i)=>{
                          const has=perm.roles.includes(selected.role);
                          return (
                            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:has?T.successLt:T.bg,borderRadius:'8px',border:`1px solid ${has?T.success+'20':T.borderL}`}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <Shield size={11} color={has?T.success:T.txt3}/>
                                <span style={{fontSize:'11px',fontWeight:700,color:has?T.ink:T.txt3}}>{perm.label}</span>
                              </div>
                              {has?<Check size={12} color={T.success}/>:<X size={12} color={T.txt3}/>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {editOpen && selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setEditOpen(false)}
                style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:300}}/>
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(420px,92vw)',background:T.surface,borderRadius:'20px',zIndex:301,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{background:`linear-gradient(135deg,${T.primary},${T.purple})`,padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:'14px',fontWeight:900,color:'#fff'}}>Edit Staff Profile</div>
                    <button onClick={()=>setEditOpen(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'8px',padding:'5px',cursor:'pointer',display:'flex'}}><X size={13} color="#fff"/></button>
                  </div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.65)',marginTop:'2px',fontWeight:600}}>{selected.full_name}</div>
                </div>
                <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={eForm.full_name} onChange={e=>setEForm({...eForm,full_name:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    <div><label style={lbl}>Phone</label><input style={inp} value={eForm.phone} onChange={e=>setEForm({...eForm,phone:e.target.value})}/></div>
                    <div><label style={lbl}>Username</label><input style={inp} value={eForm.username} onChange={e=>setEForm({...eForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')})} /></div>
                  </div>
                  <div><label style={lbl}>Role</label>
                    <select style={{...inp,cursor:'pointer'}} value={eForm.role} onChange={e=>setEForm({...eForm,role:e.target.value})}>
                      {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    style={{padding:'12px',background:saved?T.success:T.primary,color:'#fff',border:'none',borderRadius:'10px',fontWeight:800,fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'background 0.3s'}}>
                    {saved?<><Check size={13}/> Saved!</>:saving?'Saving…':<><Save size={13}/> Save Changes</>}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ADD STAFF MODAL */}
        <AnimatePresence>
          {addOpen && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setAddOpen(false)}
                style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:300}}/>
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(420px,92vw)',background:T.surface,borderRadius:'20px',zIndex:301,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                <div style={{background:`linear-gradient(135deg,${T.success},${T.primary})`,padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:'14px',fontWeight:900,color:'#fff'}}>Register New Staff</div>
                    <button onClick={()=>setAddOpen(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'8px',padding:'5px',cursor:'pointer',display:'flex'}}><X size={13} color="#fff"/></button>
                  </div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.65)',marginTop:'2px',fontWeight:600}}>Create a new system account for staff member</div>
                </div>
                <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div><label style={lbl}>Full Name</label><input style={inp} placeholder="e.g. Abdullahi Musa" value={aForm.full_name} onChange={e=>setAForm({...aForm,full_name:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    <div><label style={lbl}>Phone</label><input style={inp} placeholder="080..." value={aForm.phone} onChange={e=>setAForm({...aForm,phone:e.target.value})}/></div>
                    <div><label style={lbl}>Username</label><input style={inp} placeholder="username" value={aForm.username} onChange={e=>setAForm({...aForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')})} /></div>
                  </div>
                  <div><label style={lbl}>Role</label>
                    <select style={{...inp,cursor:'pointer'}} value={aForm.role} onChange={e=>setAForm({...aForm,role:e.target.value})}>
                      {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAdd} disabled={saving}
                    style={{padding:'12px',background:T.primary,color:'#fff',border:'none',borderRadius:'10px',fontWeight:800,fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    {saving ? 'Registering...' : <><UserPlus size={13}/> Create Account</>}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerStaffProfiles;
