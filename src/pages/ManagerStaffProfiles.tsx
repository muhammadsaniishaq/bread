import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Users, Search, X, Shield, Phone, 
  Edit2, UserPlus, MessageCircle, 
  Trash2, UserCheck, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.06)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.08)',
  danger: '#ef4444', dangerLt: 'rgba(239,68,68,0.08)',
  amber: '#f59e0b', amberLt: 'rgba(245,158,11,0.08)',
  purple: '#7c3aed', purpleLt: 'rgba(124,58,237,0.06)',
  blue: '#0891b2', blueLt: 'rgba(8,145,178,0.08)',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f8fafc', surface: '#ffffff',
  borderL: 'rgba(0,0,0,0.06)', shadow: '0 4px 20px rgba(0,0,0,0.05)',
};

const ROLES: Record<string,{color:string;bg:string;label:string;icon:string;desc:string}> = {
  MANAGER:      {color:T.purple, bg:T.purpleLt, label:'Manager',      icon:'🛡️', desc:'Full Admin Control'},
  SUPPLIER:     {color:T.amber,  bg:T.amberLt,  label:'Supplier',     icon:'📦', desc:'Sales & Delivery'},
  STORE_KEEPER: {color:T.blue,   bg:T.blueLt,   label:'Store Keeper', icon:'🏪', desc:'Stock Control'},
  CUSTOMER:     {color:T.success,bg:T.successLt,label:'Customer',     icon:'👤', desc:'Standard Access'},
  ADMIN:        {color:T.danger, bg:T.dangerLt, label:'Admin',        icon:'⚡', desc:'Root Access'},
};

const inp:React.CSSProperties={width:'100%',padding:'10px 12px',background:T.bg,border:`1px solid ${T.borderL}`,borderRadius:'10px',fontSize:'13px',fontWeight:600,color:T.ink,outline:'none',boxSizing:'border-box'};
const lbl:React.CSSProperties={fontSize:'10px',fontWeight:800,color:T.txt3,textTransform:'uppercase',display:'block',marginBottom:'4px',letterSpacing:'0.02em'};

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; notes?:string; }

const ManagerStaffProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [dTab, setDTab] = useState<'info'|'stats'|'security'>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
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

  const exportCSV = () => {
    const headers = "ID,Name,Role,Phone,Email\n";
    const rows = filtered.map(p => `${p.id},"${p.full_name}",${p.role},${p.phone},${p.email}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `staff_list.csv`; a.click();
  };

  const counts = profiles.reduce<Record<string,number>>((a,p)=>{a[p.role]=(a[p.role]||0)+1;return a;},{});
  const filtered = [...profiles].filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.phone?.includes(s)||p.username?.toLowerCase().includes(s));
  });

  const cfg = (role:string)=>ROLES[role]||{color:T.txt3,bg:T.bg,label:role,icon:'👤', desc:''};

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'Inter', system-ui, sans-serif",paddingBottom:'80px'}}>

        {/* COMPACT DASHBOARD HEADER */}
        <div style={{background:'#1e293b',padding:'30px 16px 20px',position:'relative'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'8px',padding:'6px 10px',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
              <ArrowLeft size={14}/> Back
            </button>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={exportCSV} style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'8px',padding:'6px',color:'#fff'}}><Download size={16}/></button>
              <button onClick={()=>setAddOpen(true)} style={{background:T.primary,border:'none',borderRadius:'8px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
                <UserPlus size={14}/> Add Staff
              </button>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:T.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Users size={20} color="#fff"/></div>
            <div>
              <h1 style={{margin:0,fontSize:'18px',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>Staff Management</h1>
              <p style={{margin:0,fontSize:'11px',color:'rgba(255,255,255,0.5)',fontWeight:600}}>{profiles.length} total active accounts</p>
            </div>
          </div>

          <div style={{position:'relative'}}>
            <Search size={14} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or role..."
              style={{width:'100%',padding:'10px 12px 10px 34px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:'13px',fontWeight:600,boxSizing:'border-box',outline:'none'}}/>
          </div>
        </div>

        <div style={{padding:'12px'}}>
          <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'10px',marginBottom:'4px',msOverflowStyle:'none',scrollbarWidth:'none'}}>
            {[{id:'ALL',label:'Global'},...Object.entries(ROLES).filter(([k])=>counts[k]).map(([id,c])=>({id,label:c.label}))].map(r=>(
              <button key={r.id} onClick={()=>setFilterRole(r.id)}
                style={{padding:'6px 12px',borderRadius:'20px',border:'none',background:filterRole===r.id?T.primary:T.surface,color:filterRole===r.id?'#fff':T.txt2,fontWeight:800,fontSize:'11px',cursor:'pointer',boxShadow:T.shadow,whiteSpace:'nowrap'}}>
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{padding:'40px',textAlign:'center',color:T.txt3,fontSize:'12px'}}>Loading records...</div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:'10px'}}>
              {filtered.map((p,i)=>(
                <motion.div key={p.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                  onClick={()=>setSelected(p)}
                  style={{background:T.surface,borderRadius:'14px',padding:'12px',boxShadow:T.shadow,cursor:'pointer',border:`1px solid ${T.borderL}`,position:'relative'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'8px',background:cfg(p.role).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{cfg(p.role).icon}</div>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.success}}/>
                  </div>
                  <h3 style={{margin:0,fontSize:'13px',fontWeight:900,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name}</h3>
                  <p style={{margin:'2px 0 0',fontSize:'10px',fontWeight:700,color:cfg(p.role).color,textTransform:'uppercase'}}>{cfg(p.role).label}</p>
                  
                  <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                    <UserCheck size={10} color={T.txt3}/>
                    <span style={{fontSize:'10px',fontWeight:700,color:T.txt3}}>{custCounts[p.id]||0} assigned</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* SIDE DRAWER */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(4px)',zIndex:200}}/>
              <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:25,stiffness:200}}
                style={{position:'fixed',top:0,right:0,bottom:0,width:'min(380px, 100vw)',background:T.surface,zIndex:201,display:'flex',flexDirection:'column',boxShadow:'-10px 0 30px rgba(0,0,0,0.1)'}}>
                
                <div style={{padding:'20px 16px',borderBottom:`1px solid ${T.borderL}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:cfg(selected.role).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{cfg(selected.role).icon}</div>
                    <div>
                      <div style={{fontSize:'14px',fontWeight:900,color:T.ink}}>{selected.full_name}</div>
                      <div style={{fontSize:'10px',fontWeight:700,color:cfg(selected.role).color,textTransform:'uppercase'}}>{cfg(selected.role).label}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>openEdit(selected)} style={{padding:'8px',borderRadius:'8px',background:T.bg,border:'none',color:T.txt2}}><Edit2 size={14}/></button>
                    <button onClick={()=>setSelected(null)} style={{padding:'8px',borderRadius:'8px',background:T.bg,border:'none',color:T.txt2}}><X size={14}/></button>
                  </div>
                </div>

                <div style={{display:'flex',padding:'4px 16px',background:T.bg}}>
                  {([['info','Profile'],['stats','Activity'],['security','Control']] as const).map(([id,label])=>(
                    <button key={id} onClick={()=>setDTab(id)}
                      style={{flex:1,padding:'10px 0',fontSize:'11px',fontWeight:800,border:'none',background:'transparent',color:dTab===id?T.primary:T.txt3,borderBottom:dTab===id?`2px solid ${T.primary}`:'none'}}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
                  {dTab==='info' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                      <div>
                        <label style={lbl}>Basic Information</label>
                        <div style={{background:T.bg,borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column',gap:'10px'}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'12px',color:T.txt3}}>Username</span><span style={{fontSize:'12px',fontWeight:700}}>@{selected.username||'none'}</span></div>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'12px',color:T.txt3}}>ID Code</span><span style={{fontSize:'12px',fontWeight:700,color:T.primary}}>{selected.id.slice(0,8).toUpperCase()}</span></div>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Contact</label>
                        <div style={{display:'flex',gap:'8px'}}>
                          <a href={`tel:${selected.phone}`} style={{flex:1,padding:'10px',background:T.successLt,borderRadius:'10px',textAlign:'center',textDecoration:'none',fontSize:'12px',fontWeight:800,color:T.success,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><Phone size={14}/> Call</a>
                          <a href={`https://wa.me/${selected.phone}`} target="_blank" rel="noreferrer" style={{flex:1,padding:'10px',background:'rgba(37,211,102,0.1)',borderRadius:'10px',textAlign:'center',textDecoration:'none',fontSize:'12px',fontWeight:800,color:'#25d366',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}><MessageCircle size={14}/> Chat</a>
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Administrative Notes</label>
                        <div style={{padding:'12px',background:T.bg,borderRadius:'12px',fontSize:'12px',color:T.txt2,lineHeight:'1.5',fontWeight:500}}>{selected.notes || 'No notes available.'}</div>
                      </div>
                    </div>
                  )}

                  {dTab==='stats' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        <div style={{background:T.bg,padding:'12px',borderRadius:'12px'}}>
                          <div style={{fontSize:'9px',fontWeight:800,color:T.txt3}}>CUSTOMERS</div>
                          <div style={{fontSize:'18px',fontWeight:900}}>{custCounts[selected.id]||0}</div>
                        </div>
                        <div style={{background:T.bg,padding:'12px',borderRadius:'12px'}}>
                          <div style={{fontSize:'9px',fontWeight:800,color:T.txt3}}>PERFORMANCE</div>
                          <div style={{fontSize:'18px',fontWeight:900,color:T.success}}>High</div>
                        </div>
                      </div>
                      <label style={lbl}>System Logs</label>
                      {[1,2,3].map(i=>(
                        <div key={i} style={{padding:'10px',borderLeft:`2px solid ${T.primary}`,background:T.bg,fontSize:'11px',fontWeight:600}}>
                          <div style={{color:T.ink}}>Security Login detected</div>
                          <div style={{color:T.txt3,fontSize:'10px',marginTop:'2px'}}>May 0{i}, 2026 • 09:15 AM</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dTab==='security' && (
                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div style={{background:T.bg,padding:'16px',borderRadius:'12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}><Shield size={16} color={T.primary}/> <span style={{fontSize:'13px',fontWeight:800}}>Access Level</span></div>
                        <div style={{fontSize:'12px',color:T.txt2,fontWeight:600,lineHeight:'1.4'}}>{cfg(selected.role).desc}. Account has active cloud synchronization.</div>
                      </div>
                      {!delConfirm ? (
                        <button onClick={()=>setDelConfirm(true)} style={{padding:'12px',background:T.dangerLt,border:'none',borderRadius:'10px',color:T.danger,fontWeight:800,fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                          <Trash2 size={14}/> Terminate Account
                        </button>
                      ) : (
                        <div style={{padding:'16px',background:T.dangerLt,borderRadius:'12px',textAlign:'center'}}>
                          <div style={{fontSize:'12px',fontWeight:800,color:T.danger,marginBottom:'12px'}}>Are you sure? This is permanent.</div>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button onClick={()=>setDelConfirm(false)} style={{flex:1,padding:'8px',background:T.surface,border:'none',borderRadius:'8px',fontSize:'11px',fontWeight:800}}>Cancel</button>
                            <button onClick={handleDelete} style={{flex:1,padding:'8px',background:T.danger,border:'none',borderRadius:'8px',fontSize:'11px',fontWeight:800,color:'#fff'}}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{padding:'16px',borderTop:`1px solid ${T.borderL}`}}>
                  <button onClick={()=>setSelected(null)} style={{width:'100%',padding:'12px',background:T.ink,color:'#fff',border:'none',borderRadius:'10px',fontSize:'12px',fontWeight:800,cursor:'pointer'}}>Close Profile</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(editOpen || addOpen) && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setEditOpen(false);setAddOpen(false);}}
                style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:300}}/>
              <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
                style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(380px, 92vw)',background:T.surface,borderRadius:'20px',zIndex:301,overflow:'hidden'}}>
                <div style={{padding:'16px',background:T.ink,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'14px',fontWeight:900}}>{addOpen?'Add New Staff':'Update Profile'}</span>
                  <button onClick={()=>{setEditOpen(false);setAddOpen(false);}} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'6px',padding:'4px',color:'#fff'}}><X size={14}/></button>
                </div>
                <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={addOpen?aForm.full_name:eForm.full_name} onChange={e=>addOpen?setAForm({...aForm,full_name:e.target.value}):setEForm({...eForm,full_name:e.target.value})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    <div><label style={lbl}>Phone</label><input style={inp} value={addOpen?aForm.phone:eForm.phone} onChange={e=>addOpen?setAForm({...aForm,phone:e.target.value}):setEForm({...eForm,phone:e.target.value})}/></div>
                    <div><label style={lbl}>Username</label><input style={inp} value={addOpen?aForm.username:eForm.username} onChange={e=>addOpen?setAForm({...aForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')}):setEForm({...eForm,username:e.target.value.toLowerCase().replace(/\s+/g,'')})}/></div>
                  </div>
                  <div><label style={lbl}>Role</label>
                    <select style={inp} value={addOpen?aForm.role:eForm.role} onChange={e=>addOpen?setAForm({...aForm,role:e.target.value}):setEForm({...eForm,role:e.target.value})}>
                      {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {editOpen && <div><label style={lbl}>Notes</label><textarea style={{...inp,height:'60px',resize:'none'}} value={eForm.notes} onChange={e=>setEForm({...eForm,notes:e.target.value})}/></div>}
                  <button onClick={addOpen?handleAdd:handleSave} disabled={saving} style={{padding:'12px',background:T.primary,color:'#fff',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:800,cursor:'pointer',marginTop:'8px'}}>
                    {saving?'Processing...':saved?'Saved!':addOpen?'Create Account':'Save Changes'}
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
