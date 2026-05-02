import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Users, Search, X, Shield, Phone, Mail, 
  Edit2, ChevronRight, Check, UserPlus, MessageCircle, 
  Trash2, AlertTriangle, Copy, TrendingUp, Package, 
  UserCheck, Download, Star, ShieldCheck, 
  FileText, LayoutDashboard
} from 'lucide-react';
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
  borderL: 'rgba(0,0,0,0.05)', shadow: '0 20px 50px rgba(0,0,0,0.1)',
};

const ROLES: Record<string,{color:string;bg:string;label:string;icon:string;desc:string}> = {
  MANAGER:      {color:T.purple, bg:T.purpleLt, label:'Manager',      icon:'🛡️', desc:'Full administrative control'},
  SUPPLIER:     {color:T.amber,  bg:T.amberLt,  label:'Supplier',     icon:'📦', desc:'Sales & delivery management'},
  STORE_KEEPER: {color:T.blue,   bg:T.blueLt,   label:'Store Keeper', icon:'🏪', desc:'Inventory & stock control'},
  CUSTOMER:     {color:T.success,bg:T.successLt,label:'Customer',     icon:'👤', desc:'Standard service access'},
  ADMIN:        {color:T.danger, bg:T.dangerLt, label:'Admin',        icon:'⚡', desc:'System-wide root access'},
};

const inp:React.CSSProperties={width:'100%',padding:'14px 16px',background:T.bg,border:`1px solid ${T.borderL}`,borderRadius:'16px',fontSize:'14px',fontWeight:600,color:T.ink,outline:'none',boxSizing:'border-box',transition:'all 0.2s'};
const lbl:React.CSSProperties={fontSize:'11px',fontWeight:800,color:T.txt3,textTransform:'uppercase',display:'block',marginBottom:'6px',letterSpacing:'0.03em'};

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; notes?:string; }

const ManagerStaffProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [dTab, setDTab] = useState<'info'|'stats'|'activity'|'security'>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sortMode, setSortMode] = useState<'newest'|'az'>('newest');
  const [delConfirm, setDelConfirm] = useState(false);
  const [copied, setCopied] = useState('');
  const [eForm, setEForm] = useState({full_name:'',phone:'',email:'',username:'',role:'',notes:''});
  const [aForm, setAForm] = useState({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'});

  const fetch = async () => {
    setLoading(true);
    const {data} = await supabase.from('profiles').select('*').order('created_at',{ascending:false});
    if (data) {
      setProfiles(data);
      const { data: counts } = await supabase.from('customers').select('assigned_to');
      if (counts) {
        const mapping = counts.reduce<Record<string, number>>((acc, curr) => {
          if (curr.assigned_to) acc[curr.assigned_to] = (acc[curr.assigned_to] || 0) + 1;
          return acc;
        }, {});
        setCustCounts(mapping);
      }
    }
    setLoading(false);
  };
  useEffect(()=>{fetch();},[]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  };

  const openEdit = (p:Profile) => { setEForm({full_name:p.full_name||'',phone:p.phone||'',email:p.email||'',username:p.username||'',role:p.role||'',notes:p.notes||''}); setEditOpen(true); };

  const handleSave = async () => {
    if(!selected) return;
    setSaving(true);
    await supabase.from('profiles').update({full_name:eForm.full_name,phone:eForm.phone,username:eForm.username,role:eForm.role,notes:eForm.notes}).eq('id',selected.id);
    setProfiles(ps=>ps.map(p=>p.id===selected.id?{...p,...eForm}:p));
    setSelected({...selected,...eForm});
    setSaving(false); setSaved(true); setTimeout(()=>{setSaved(false);setEditOpen(false);},1200);
  };

  const handleAdd = async () => {
    if (!aForm.full_name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('profiles').insert({ ...aForm }).select().single();
    if (data) { setProfiles(ps => [data, ...ps]); setAddOpen(false); setAForm({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'}); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await supabase.from('profiles').delete().eq('id', selected.id);
    setProfiles(ps => ps.filter(p => p.id !== selected.id));
    setSelected(null); setDelConfirm(false);
  };

  const sortedProfiles = [...profiles].sort((a,b) => {
    if (sortMode==='az') return (a.full_name||'').localeCompare(b.full_name||'');
    return new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime();
  });

  const filtered = sortedProfiles.filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.email?.toLowerCase().includes(s)||p.phone?.includes(s)||p.username?.toLowerCase().includes(s));
  });

  const exportCSV = () => {
    const headers = "ID,Name,Username,Role,Phone,Email,Joined\n";
    const rows = filtered.map(p => `${p.id},"${p.full_name}",${p.username},${p.role},${p.phone},${p.email},${p.created_at}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `staff_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const counts = profiles.reduce<Record<string,number>>((a,p)=>{a[p.role]=(a[p.role]||0)+1;return a;},{});

  const cfg = (role:string)=>ROLES[role]||{color:T.txt3,bg:T.bg,label:role,icon:'👤', desc:''};

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Outfit', sans-serif",paddingBottom:'100px'}}>

        {/* ULTRA-MODERN GLASS HEADER */}
        <div style={{background:'#0f172a',padding:'60px 20px 40px',position:'relative',overflow:'hidden',borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
          <motion.div animate={{scale:[1,1.1,1], rotate:[0,10,-10,0]}} transition={{duration:15, repeat:Infinity}} style={{position:'absolute',top:'-10%',right:'-5%',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',filter:'blur(40px)'}}/>
          <motion.div animate={{scale:[1,1.2,1], x:[0,20,-20,0]}} transition={{duration:20, repeat:Infinity}} style={{position:'absolute',bottom:'-10%',left:'5%',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',filter:'blur(40px)'}}/>
          
          <div style={{position:'relative',zIndex:10,maxWidth:'1000px',margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'32px'}}>
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px 16px',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',backdropFilter:'blur(20px)'}}>
                  <ArrowLeft size={18}/>
                </button>
                <div style={{height:'40px',width:'1px',background:'rgba(255,255,255,0.1)'}}/>
                <div>
                  <h1 style={{margin:0,fontSize:'28px',fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1}}>Staff Command</h1>
                  <p style={{margin:'4px 0 0',fontSize:'13px',color:'rgba(255,255,255,0.4)',fontWeight:600}}>Global Access Control & Personnel</p>
                </div>
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={exportCSV} style={{width:'44px',height:'44px',borderRadius:'14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff'}}>
                  <Download size={20}/>
                </motion.button>
                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setAddOpen(true)} style={{padding:'0 20px',height:'44px',borderRadius:'14px',background:T.primary,border:'none',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'14px',fontWeight:800,color:'#fff',boxShadow:`0 8px 25px ${T.primary}50`}}>
                  <UserPlus size={18}/> <span>Deploy Staff</span>
                </motion.button>
              </div>
            </div>

            <div style={{display:'flex',gap:'12px',overflowX:'auto',paddingBottom:'10px',scrollbarWidth:'none'}}>
              {[
                {label:'Active Force', count:profiles.length, icon:<Users size={16}/>, color:T.primary},
                {label:'Suppliers', count:counts['SUPPLIER']||0, icon:<Package size={16}/>, color:T.amber},
                {label:'Management', count:counts['MANAGER']||0, icon:<ShieldCheck size={16}/>, color:T.purple},
                {label:'Customers Managed', count:Object.values(custCounts).reduce((a,b)=>a+b,0), icon:<UserCheck size={16}/>, color:T.success},
              ].map((s,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'20px',padding:'14px 20px',minWidth:'140px',backdropFilter:'blur(10px)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                    <div style={{color:s.color,background:`${s.color}20`,padding:'6px',borderRadius:'10px'}}>{s.icon}</div>
                    <span style={{fontSize:'10px',fontWeight:800,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</span>
                  </div>
                  <div style={{fontSize:'22px',fontWeight:900,color:'#fff'}}>{s.count}</div>
                </div>
              ))}
            </div>

            <div style={{position:'relative',marginTop:'20px'}}>
              <Search size={20} style={{position:'absolute',left:'18px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Query staff name, @username, or active role..."
                style={{width:'100%',padding:'18px 20px 18px 54px',borderRadius:'22px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'15px',fontWeight:600,boxSizing:'border-box',outline:'none',backdropFilter:'blur(20px)',transition:'all 0.3s'}}/>
            </div>
          </div>
        </div>

        <div style={{padding:'24px 20px',maxWidth:'1000px',margin:'0 auto'}}>
          
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'24px',gap:'12px',flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:'8px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'5px'}}>
              {[{id:'ALL',label:'Global'},...Object.entries(ROLES).filter(([k])=>counts[k]).map(([id,c])=>({id,label:c.label}))].map(r=>(
                <button key={r.id} onClick={()=>setFilterRole(r.id)}
                  style={{padding:'10px 18px',borderRadius:'16px',border:'none',background:filterRole===r.id?T.primary:T.surface,color:filterRole===r.id?'#fff':T.txt2,fontWeight:800,fontSize:'12px',cursor:'pointer',boxShadow:T.shadow,transition:'all 0.2s',whiteSpace:'nowrap'}}>
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'6px',background:T.surface,padding:'4px',borderRadius:'14px',boxShadow:T.shadow}}>
              {([['newest','Newest'],['az','A-Z']] as const).map(([id,label])=>(
                <button key={id} onClick={()=>setSortMode(id)}
                  style={{padding:'8px 14px',borderRadius:'10px',border:'none',background:sortMode===id?T.bg:'transparent',color:sortMode===id?T.primary:T.txt3,fontWeight:800,fontSize:'11px',cursor:'pointer'}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{padding:'100px 0',textAlign:'center'}}>
              <motion.div animate={{rotate:360}} style={{width:'40px',height:'40px',borderRadius:'50%',border:`4px solid ${T.primaryLt}`,borderTopColor:T.primary,margin:'0 auto'}}/>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:'20px'}}>
              {filtered.map((p,i)=>{
                const c=cfg(p.role);
                const cCount = custCounts[p.id] || 0;
                return (
                  <motion.div key={p.id} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    onClick={()=>{setSelected(p);setDTab('info');}}
                    whileHover={{y:-6}}
                    style={{background:T.surface,borderRadius:'30px',padding:'24px',boxShadow:T.shadow,cursor:'pointer',position:'relative',overflow:'hidden',border:`1px solid ${T.borderL}`}}>
                    
                    <div style={{position:'absolute',top:'24px',right:'24px',display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.success}}/>
                      <span style={{fontSize:'10px',fontWeight:900,color:T.success}}>Online</span>
                    </div>

                    <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'20px'}}>
                      <div style={{width:'72px',height:'72px',borderRadius:'24px',background:`linear-gradient(135deg, ${c.color}, ${T.primary})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',fontWeight:900,color:'#fff'}}>
                        {(p.full_name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <h3 style={{margin:0,fontSize:'18px',fontWeight:900,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name}</h3>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px'}}>
                          <span style={{fontSize:'10px',fontWeight:900,color:c.color,background:c.bg,padding:'3px 10px',borderRadius:'8px'}}>{c.label}</span>
                          <span style={{fontSize:'11px',color:T.txt3,fontWeight:600}}>@{p.username || 'user'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',background:T.bg,padding:'16px',borderRadius:'20px'}}>
                      <div>
                        <div style={{fontSize:'9px',fontWeight:800,color:T.txt3}}>Connections</div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <Users size={14} color={T.primary}/>
                          <span style={{fontSize:'14px',fontWeight:900,color:T.ink}}>{cCount}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'9px',fontWeight:800,color:T.txt3}}>Phone</div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <Phone size={14} color={T.txt3}/>
                          <span style={{fontSize:'13px',fontWeight:700,color:T.txt2}}>{p.phone?.slice(-4) || '----'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'16px'}}>
                      <div style={{display:'flex', WebkitMaskImage: 'linear-gradient(90deg, #000 60%, transparent)'}}>
                        {[1,2,3,4].map(j=><div key={j} style={{width:'24px',height:'24px',borderRadius:'50%',background:T.bg,border:`2px solid ${T.surface}`,marginLeft:j===1?0:-10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px'}}>👤</div>)}
                      </div>
                      <ChevronRight size={14} color={T.primary}/>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAIL MODAL */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.7)',backdropFilter:'blur(12px)',zIndex:200}}/>
              <motion.div initial={{opacity:0,scale:0.92,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.92,y:30}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(600px,94vw)',maxHeight:'92vh',background:T.surface,borderRadius:'40px',zIndex:201,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:T.shadow}}>

                <div style={{background:`linear-gradient(135deg,${cfg(selected.role).color} 0%,#1e1b4b 100%)`,padding:'40px 32px',position:'relative'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'relative',zIndex:2}}>
                    <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
                      <div style={{position:'relative'}}>
                        <div style={{width:'85px',height:'85px',borderRadius:'28px',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(20px)',border:'2px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'38px',fontWeight:900,color:'#fff'}}>
                          {(selected.full_name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{position:'absolute',bottom:'-8px',right:'-8px',width:'32px',height:'32px',borderRadius:'10px',background:T.surface,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{cfg(selected.role).icon}</div>
                      </div>
                      <div>
                        <h2 style={{fontSize:'26px',fontWeight:900,color:'#fff',margin:0}}>{selected.full_name}</h2>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'6px'}}>
                          <span style={{fontSize:'12px',color:'#fff',fontWeight:800,background:'rgba(255,255,255,0.1)',padding:'4px 12px',borderRadius:'12px'}}>{cfg(selected.role).label}</span>
                          <span style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',fontWeight:600}}>@{selected.username || 'unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'10px'}}>
                      <button onClick={()=>openEdit(selected)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'16px',padding:'12px',cursor:'pointer',color:'#fff'}}><Edit2 size={20}/></button>
                      <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'16px',padding:'12px',cursor:'pointer',color:'#fff'}}><X size={20}/></button>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:'12px',marginTop:'32px',position:'relative',zIndex:2}}>
                    {[
                      {label:'ID Code', val:selected.id.slice(0,6).toUpperCase(), icon:<Shield size={14}/>},
                      {label:'Performance', val:custCounts[selected.id]>5?'Elite':'Active', icon:<Star size={14}/>},
                      {label:'Managed', val:`${custCounts[selected.id]||0} Clients`, icon:<Users size={14}/>},
                    ].map((st,i)=>(
                      <div key={i} style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'20px',padding:'14px',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(10px)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                          <span style={{color:'rgba(255,255,255,0.5)'}}>{st.icon}</span>
                          <span style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase'}}>{st.label}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <div style={{fontSize:'13px',fontWeight:900,color:'#fff'}}>{st.val}</div>
                          {st.label==='ID Code' && (
                            <button onClick={()=>copyToClipboard('STF-'+selected.id.toUpperCase(), 'sid')} style={{background:'none',border:'none',padding:0,cursor:'pointer'}}>
                              {copied==='sid' ? <Check size={12} color={T.success}/> : <Copy size={12} color="#fff" style={{opacity:0.6}}/>}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display:'flex',gap:'8px',padding:'16px 24px',background:T.bg,borderBottom:`1px solid ${T.borderL}`}}>
                  {([['info','Overview'],['stats','Insights'],['activity','Audit Logs'],['security','Security']] as const).map(([id,label])=>(
                    <button key={id} onClick={()=>setDTab(id)}
                      style={{padding:'10px 16px',borderRadius:'14px',border:'none',background:dTab===id?T.surface:'transparent',color:dTab===id?T.primary:T.txt3,fontWeight:800,fontSize:'13px',cursor:'pointer',boxShadow:dTab===id?T.shadow:'none'}}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'24px',display:'flex',flexDirection:'column',gap:'20px'}}>
                  {dTab==='info' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:'16px'}}>
                        <div style={{background:T.bg,borderRadius:'24px',padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                            <div style={{width:'44px',height:'44px',borderRadius:'14px',background:T.surface,display:'flex',alignItems:'center',justifyContent:'center'}}><Phone size={20} color={T.primary}/></div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:'10px',fontWeight:800,color:T.txt3}}>Private Line</div>
                              <div style={{fontSize:'15px',fontWeight:800,color:T.ink}}>{selected.phone || 'No Contact'}</div>
                            </div>
                            {selected.phone && (
                              <div style={{display:'flex',gap:'6px'}}>
                                <a href={`tel:${selected.phone}`} style={{padding:'10px',background:T.successLt,borderRadius:'12px',color:T.success}}><Phone size={16}/></a>
                                <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'10px',background:'rgba(37,211,102,0.1)',borderRadius:'12px',color:'#25d366'}}><MessageCircle size={16}/></a>
                              </div>
                            )}
                          </div>
                          <div style={{height:'1px',background:T.borderL}}/>
                          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                            <div style={{width:'44px',height:'44px',borderRadius:'14px',background:T.surface,display:'flex',alignItems:'center',justifyContent:'center'}}><Mail size={20} color={T.primary}/></div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:'10px',fontWeight:800,color:T.txt3}}>Email Service</div>
                              <div style={{fontSize:'14px',fontWeight:700,color:T.ink}}>{selected.email || 'No email'}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{background:cfg(selected.role).bg,borderRadius:'24px',padding:'20px',textAlign:'center',border:`1px solid ${cfg(selected.role).color}20`}}>
                          <div style={{fontSize:'24px',marginBottom:'8px'}}>{cfg(selected.role).icon}</div>
                          <div style={{fontSize:'14px',fontWeight:900,color:cfg(selected.role).color}}>{cfg(selected.role).label}</div>
                          <div style={{fontSize:'10px',color:T.txt3,marginTop:'4px',fontWeight:600}}>{cfg(selected.role).desc}</div>
                        </div>
                      </div>
                      <div style={{background:T.bg,borderRadius:'24px',padding:'20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                          <FileText size={18} color={T.txt3}/>
                          <span style={{fontSize:'13px',fontWeight:900,color:T.ink}}>Admin Notes</span>
                        </div>
                        <div style={{fontSize:'14px',color:T.txt2,lineHeight:'1.6',fontWeight:600}}>{selected.notes || 'No administrative notes.'}</div>
                      </div>
                    </div>
                  )}

                  {dTab==='stats' && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                      <div style={{background:T.surface,border:`1px solid ${T.borderL}`,borderRadius:'24px',padding:'20px'}}>
                        <TrendingUp size={24} color={T.success}/>
                        <div style={{fontSize:'11px',fontWeight:900,color:T.txt3,marginTop:'12px'}}>Daily Growth</div>
                        <div style={{fontSize:'24px',fontWeight:900,color:T.ink,marginTop:'4px'}}>+12.5%</div>
                      </div>
                      <div style={{background:T.surface,border:`1px solid ${T.borderL}`,borderRadius:'24px',padding:'20px'}}>
                        <LayoutDashboard size={24} color={T.primary}/>
                        <div style={{fontSize:'11px',fontWeight:900,color:T.txt3,marginTop:'12px'}}>System Utilization</div>
                        <div style={{fontSize:'24px',fontWeight:900,color:T.ink,marginTop:'4px'}}>88%</div>
                      </div>
                    </div>
                  )}

                  {dTab==='activity' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      {[
                        {text:'System Authentication', time:'14 mins ago', icon:<Shield size={14}/>, color:T.primary},
                        {text:'Database Entry: New Sale', time:'2 hours ago', icon:<Package size={14}/>, color:T.success},
                        {text:'Profile Metadata Changed', time:'Yesterday', icon:<Edit2 size={14}/>, color:T.purple},
                      ].map((a,i)=>(
                        <div key={i} style={{display:'flex',gap:'16px',padding:'16px',background:T.bg,borderRadius:'20px',alignItems:'center'}}>
                          <div style={{width:'40px',height:'40px',borderRadius:'14px',background:T.surface,display:'flex',alignItems:'center',justifyContent:'center',color:a.color}}>{a.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'14px',fontWeight:800,color:T.ink}}>{a.text}</div>
                            <div style={{fontSize:'12px',color:T.txt3}}>{a.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dTab==='security' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div style={{background:T.bg,borderRadius:'24px',padding:'24px',border:`1px solid ${T.success}20`}}>
                        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                          <ShieldCheck size={24} color={T.success}/>
                          <h4 style={{margin:0,fontSize:'16px',fontWeight:900}}>Account Security</h4>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:T.surface,padding:'14px 20px',borderRadius:'16px'}}>
                          <span style={{fontSize:'13px',fontWeight:700,color:T.txt2}}>PIN Protection</span>
                          <span style={{fontSize:'11px',fontWeight:900,color:T.success}}>ENABLED</span>
                        </div>
                      </div>
                      <button onClick={()=>setDelConfirm(true)} style={{width:'100%',padding:'14px',background:T.danger,color:'#fff',border:'none',borderRadius:'16px',fontWeight:800,fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                        <Trash2 size={18}/> Revoke Access & Delete
                      </button>
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
                style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.8)',backdropFilter:'blur(15px)',zIndex:300}}/>
              <motion.div initial={{opacity:0,scale:0.9,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:30}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(500px,94vw)',background:T.surface,borderRadius:'40px',zIndex:301,overflow:'hidden',boxShadow:'0 40px 100px rgba(0,0,0,0.5)'}}>
                <div style={{background:`linear-gradient(135deg,${T.primary},${T.purple})`,padding:'32px'}}>
                  <h3 style={{fontSize:'22px',fontWeight:900,color:'#fff',margin:0}}>Configuration</h3>
                  <p style={{margin:'6px 0 0',fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>Modify staff identity</p>
                </div>
                <div style={{padding:'32px',display:'flex',flexDirection:'column',gap:'20px'}}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={eForm.full_name} onChange={e=>setEForm({...eForm,full_name:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                    <div><label style={lbl}>Mobile</label><input style={inp} value={eForm.phone} onChange={e=>setEForm({...eForm,phone:e.target.value})}/></div>
                    <div><label style={lbl}>Username</label><input style={inp} value={eForm.username} onChange={e=>setEForm({...eForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')})} /></div>
                  </div>
                  <div>
                    <label style={lbl}>Functional Role</label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'8px'}}>
                      {Object.entries(ROLES).slice(0,3).map(([k,v])=>(
                        <button key={k} onClick={()=>setEForm({...eForm,role:k})} style={{padding:'12px 4px',borderRadius:'14px',border:`2px solid ${eForm.role===k?v.color:T.borderL}`,background:eForm.role===k?v.bg:'transparent',cursor:'pointer'}}>
                          <div style={{fontSize:'18px',marginBottom:'4px'}}>{v.icon}</div>
                          <div style={{fontSize:'9px',fontWeight:900,color:eForm.role===k?v.color:T.txt3}}>{v.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label style={lbl}>Notes</label><textarea style={{...inp, height:'80px', resize:'none'}} value={eForm.notes} onChange={e=>setEForm({...eForm,notes:e.target.value})}/></div>
                  <button onClick={handleSave} disabled={saving} style={{padding:'16px',background:saved?T.success:T.primary,color:'#fff',border:'none',borderRadius:'18px',fontWeight:900,fontSize:'15px',cursor:'pointer'}}>
                    {saved ? 'Updated!' : saving ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ADD MODAL */}
        <AnimatePresence>
          {addOpen && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setAddOpen(false)}
                style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.8)',backdropFilter:'blur(15px)',zIndex:300}}/>
              <motion.div initial={{opacity:0,scale:0.9,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:30}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(420px,90vw)',background:T.surface,borderRadius:'28px',zIndex:301,overflow:'hidden',boxShadow:T.shadow}}>
                <div style={{background:`linear-gradient(135deg,${T.success},${T.primary})`,padding:'24px'}}>
                  <h3 style={{fontSize:'18px',fontWeight:900,color:'#fff',margin:0}}>Onboard New Staff</h3>
                </div>
                <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
                  <div><label style={lbl}>Full Name</label><input style={inp} placeholder="Full Legal Name" value={aForm.full_name} onChange={e=>setAForm({...aForm,full_name:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div><label style={lbl}>Phone</label><input style={inp} placeholder="080..." value={aForm.phone} onChange={e=>setAForm({...aForm,phone:e.target.value})}/></div>
                    <div><label style={lbl}>Username</label><input style={inp} placeholder="login_id" value={aForm.username} onChange={e=>setAForm({...aForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')})} /></div>
                  </div>
                  <div><label style={lbl}>Access Role</label>
                    <select style={{...inp,cursor:'pointer'}} value={aForm.role} onChange={e=>setAForm({...aForm,role:e.target.value})}>
                      {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAdd} disabled={saving} style={{padding:'14px',background:T.primary,color:'#fff',border:'none',borderRadius:'14px',fontWeight:900,fontSize:'14px',cursor:'pointer'}}>
                    {saving ? 'Creating...' : 'Finalize Onboarding'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRM */}
        <AnimatePresence>
          {delConfirm && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDelConfirm(false)}
                style={{position:'fixed',inset:0,background:'rgba(2,6,23,0.85)',backdropFilter:'blur(10px)',zIndex:400}}/>
              <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(380px,90vw)',background:T.surface,borderRadius:'32px',zIndex:401,padding:'32px',textAlign:'center'}}>
                <div style={{width:'80px',height:'80px',borderRadius:'50%',background:T.dangerLt,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}><AlertTriangle size={40} color={T.danger}/></div>
                <h3 style={{fontSize:'22px',fontWeight:900,color:T.ink}}>Terminate Account?</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'24px'}}>
                  <button onClick={handleDelete} style={{padding:'16px',background:T.danger,color:'#fff',border:'none',borderRadius:'16px',fontWeight:900,fontSize:'14px',cursor:'pointer'}}>Confirm Termination</button>
                  <button onClick={()=>setDelConfirm(false)} style={{padding:'16px',background:T.bg,color:T.txt2,border:'none',borderRadius:'16px',fontWeight:800,fontSize:'14px',cursor:'pointer'}}>Keep Account</button>
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
