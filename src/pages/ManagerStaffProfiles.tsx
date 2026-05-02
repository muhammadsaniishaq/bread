import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Search, X, Shield, Phone, 
  Edit2, UserPlus, 
  Trash2, UserCheck, Download, 
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5',
  primaryLt: '#eef2ff',
  success: '#10b981',
  successLt: '#ecfdf5',
  danger: '#f43f5e',
  dangerLt: '#fff1f2',
  amber: '#f59e0b',
  amberLt: '#fffbeb',
  purple: '#8b5cf6',
  purpleLt: '#f5f3ff',
  blue: '#3b82f6',
  blueLt: '#eff6ff',
  ink: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#f1f5f9',
  shadow: '0 10px 30px rgba(0,0,0,0.04)',
};

const ROLES: Record<string,{color:string;bg:string;label:string;icon:string}> = {
  MANAGER:      {color:T.purple,  bg:T.purpleLt,  label:'Manager',      icon:'🛡️'},
  SUPPLIER:     {color:T.amber,   bg:T.amberLt,   label:'Supplier',     icon:'📦'},
  STORE_KEEPER: {color:T.blue,    bg:T.blueLt,    label:'Store Keeper', icon:'🏪'},
  CUSTOMER:     {color:T.success, bg:T.successLt, label:'Customer',     icon:'👤'},
  ADMIN:        {color:T.danger,  bg:T.dangerLt,  label:'Admin',        icon:'⚡'},
};

const inpStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  fontSize: '14px',
  fontWeight: 600,
  color: T.ink,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  color: T.txt3,
  textTransform: 'uppercase',
  marginBottom: '6px',
  display: 'block',
  letterSpacing: '0.05em',
};

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; notes?:string; }

const ManagerStaffProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if(!selected) return;
    setSaving(true);
    await supabase.from('profiles').update({full_name:eForm.full_name,phone:eForm.phone,username:eForm.username,role:eForm.role,notes:eForm.notes}).eq('id',selected.id);
    setProfiles(ps=>ps.map(p=>p.id===selected.id?{...p,...eForm}:p));
    setSaving(false); setEditOpen(false); setSelected(null);
  };

  const handleAdd = async () => {
    if (!aForm.full_name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('profiles').insert({ ...aForm }).select().single();
    if (data) { setProfiles(ps => [data, ...ps]); setAddOpen(false); setAForm({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'}); }
    setSaving(false);
  };

  const handleDelete = async (id:string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setProfiles(ps => ps.filter(p => p.id !== id));
    setSelected(null);
  };

  const filtered = profiles.filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.phone?.includes(s));
  });

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh', background:T.bg, color:T.ink, fontFamily:"'Plus Jakarta Sans', sans-serif", paddingBottom:'100px'}}>
        
        <div style={{background:T.surface, padding:'40px 20px 30px', borderBottom:`1px solid ${T.border}`, position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:'-50px', right:'-50px', width:'200px', height:'200px', background:T.primaryLt, borderRadius:'50%', filter:'blur(60px)', zIndex:0}}/>
          
          <div style={{maxWidth:'1000px', margin:'0 auto', position:'relative', zIndex:1}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <button onClick={()=>navigate(-1)} style={{background:T.bg, border:'none', borderRadius:'14px', padding:'12px', color:T.ink, cursor:'pointer'}}><ArrowLeft size={20}/></button>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={()=>{const headers="ID,Name,Role\n";const rows=filtered.map(p=>`${p.id},${p.full_name},${p.role}`).join("\n");const blob=new Blob([headers+rows],{type:'text/csv'});const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='staff.csv';a.click();}} style={{background:T.bg, border:'none', borderRadius:'14px', padding:'12px', color:T.ink}}><Download size={20}/></button>
                <button onClick={()=>setAddOpen(true)} style={{background:T.primary, border:'none', borderRadius:'16px', padding:'12px 24px', color:'#fff', fontWeight:800, fontSize:'14px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', boxShadow:`0 10px 25px ${T.primary}40`}}>
                  <UserPlus size={18}/> <span>Add New</span>
                </button>
              </div>
            </div>

            <h1 style={{margin:0, fontSize:'28px', fontWeight:900, letterSpacing:'-0.03em'}}>Staff Profiles</h1>
            <p style={{margin:'4px 0 24px', fontSize:'14px', color:T.txt2, fontWeight:600}}>{profiles.length} total staff members managed.</p>

            <div style={{position:'relative', marginBottom:'24px'}}>
              <Search size={18} style={{position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:T.txt3}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or phone..." 
                style={{...inpStyle, paddingLeft:'48px', border:'none', boxShadow:T.shadow, background:T.surface}}/>
            </div>

            <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'10px', scrollbarWidth:'none'}}>
              {['ALL', 'MANAGER', 'SUPPLIER', 'STORE_KEEPER'].map(r=>(
                <button key={r} onClick={()=>setFilterRole(r)}
                  style={{padding:'10px 18px', borderRadius:'14px', border:'none', background:filterRole===r?T.primary:T.surface, color:filterRole===r?'#fff':T.txt2, fontWeight:800, fontSize:'12px', whiteSpace:'nowrap', boxShadow:T.shadow, cursor:'pointer'}}>
                  {r==='ALL'?'All Staff':ROLES[r]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{maxWidth:'1000px', margin:'20px auto', padding:'0 20px'}}>
          {loading ? (
            <div style={{textAlign:'center', padding:'100px 0', color:T.txt3}}>Loading accounts...</div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
              {filtered.map((p,i)=>(
                <motion.div key={p.id} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:i*0.05}}
                  onClick={()=>setSelected(p)}
                  whileTap={{scale:0.98}}
                  style={{background:T.surface, borderRadius:'28px', padding:'24px', boxShadow:T.shadow, border:`1px solid ${T.border}`, cursor:'pointer', position:'relative', overflow:'hidden'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px'}}>
                    <div style={{width:'56px', height:'56px', borderRadius:'20px', background:ROLES[p.role]?.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px'}}>
                      {ROLES[p.role]?.icon}
                    </div>
                    <div>
                      <h3 style={{margin:0, fontSize:'16px', fontWeight:800}}>{p.full_name}</h3>
                      <div style={{fontSize:'12px', fontWeight:700, color:ROLES[p.role]?.color, marginTop:'2px'}}>{ROLES[p.role]?.label}</div>
                    </div>
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', background:T.bg, padding:'16px', borderRadius:'20px'}}>
                    <div>
                      <div style={{fontSize:'10px', fontWeight:800, color:T.txt3, textTransform:'uppercase'}}>Clients</div>
                      <div style={{fontSize:'15px', fontWeight:800, display:'flex', alignItems:'center', gap:'4px'}}><UserCheck size={14} color={T.primary}/> {custCounts[p.id]||0}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'10px', fontWeight:800, color:T.txt3, textTransform:'uppercase'}}>Status</div>
                      <div style={{fontSize:'11px', fontWeight:800, color:T.success, display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'6px', height:'6px', borderRadius:'50%', background:T.success}}/> ACTIVE</div>
                    </div>
                  </div>

                  <div style={{marginTop:'16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize:'12px', fontWeight:700, color:T.txt3}}>@{p.username || 'user'}</span>
                    <ChevronRight size={18} color={T.txt3}/>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', zIndex:200}}/>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:25, stiffness:200}}
                style={{position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTopLeftRadius:'40px', borderTopRightRadius:'40px', zIndex:201, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 -10px 40px rgba(0,0,0,0.1)'}}>
                <div style={{width:'40px', height:'4px', background:'#e2e8f0', borderRadius:'2px', margin:'16px auto'}}/>
                <div style={{padding:'0 24px 40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                      <div style={{width:'72px', height:'72px', borderRadius:'24px', background:ROLES[selected.role]?.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px'}}>{ROLES[selected.role]?.icon}</div>
                      <div>
                        <h2 style={{margin:0, fontSize:'22px', fontWeight:900}}>{selected.full_name}</h2>
                        <div style={{fontSize:'13px', fontWeight:700, color:ROLES[selected.role]?.color}}>{ROLES[selected.role]?.label}</div>
                      </div>
                    </div>
                    <button onClick={()=>setSelected(null)} style={{background:T.bg, border:'none', borderRadius:'50%', width:'40px', height:'40px', color:T.ink, cursor:'pointer'}}><X size={20}/></button>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px'}}>
                    <button onClick={()=>{setEForm({full_name:selected.full_name||'',phone:selected.phone||'',email:selected.email||'',username:selected.username||'',role:selected.role||'',notes:selected.notes||''}); setEditOpen(true);}} style={{background:T.primary, border:'none', borderRadius:'20px', padding:'16px', color:'#fff', fontWeight:800, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Edit2 size={18}/> Edit Profile</button>
                    <button onClick={()=>{if(window.confirm('Delete?')){handleDelete(selected.id)}}} style={{background:T.dangerLt, border:'none', borderRadius:'20px', padding:'16px', color:T.danger, fontWeight:800, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><Trash2 size={18}/> Delete</button>
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div style={{background:T.bg, borderRadius:'24px', padding:'20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}><Phone size={20} color={T.primary}/> <span style={{fontSize:'14px', fontWeight:800}}>Contact Details</span></div>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}><span style={{fontSize:'13px', color:T.txt2}}>Phone</span><span style={{fontSize:'13px', fontWeight:700}}>{selected.phone || 'N/A'}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontSize:'13px', color:T.txt2}}>Username</span><span style={{fontSize:'13px', fontWeight:700}}>@{selected.username || 'user'}</span></div>
                    </div>

                    <div style={{background:T.bg, borderRadius:'24px', padding:'20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}><Shield size={20} color={T.purple}/> <span style={{fontSize:'14px', fontWeight:800}}>Administrative Notes</span></div>
                      <p style={{margin:0, fontSize:'14px', color:T.txt2, lineHeight:'1.6'}}>{selected.notes || 'No notes added for this staff member.'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(addOpen || editOpen) && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setAddOpen(false);setEditOpen(false);}}
                style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(10px)', zIndex:300}}/>
              <motion.div initial={{y:'100%', opacity:0}} animate={{y:0, opacity:1}} exit={{y:'100%', opacity:0}} transition={{type:'spring', damping:25, stiffness:200}}
                style={{position:'fixed', bottom:0, left:0, right:0, top: '10vh', background:T.surface, borderTopLeftRadius:'40px', borderTopRightRadius:'40px', zIndex:301, overflowY:'auto', display:'flex', flexDirection:'column'}}>
                
                <div style={{padding:'24px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:T.surface, zIndex:2}}>
                  <h3 style={{margin:0, fontSize:'20px', fontWeight:900}}>{addOpen?'New Staff Member':'Edit Profile'}</h3>
                  <button onClick={()=>{setAddOpen(false);setEditOpen(false);}} style={{background:T.bg, border:'none', borderRadius:'50%', width:'40px', height:'40px', color:T.ink}}><X size={20}/></button>
                </div>

                <div style={{padding:'32px', maxWidth:'600px', margin:'0 auto', width:'100%', boxSizing:'border-box'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                    <div><label style={labelStyle}>Full Name</label><input style={inpStyle} placeholder="Enter full name" value={addOpen?aForm.full_name:eForm.full_name} onChange={e=>addOpen?setAForm({...aForm,full_name:e.target.value}):setEForm({...eForm,full_name:e.target.value})}/></div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                      <div><label style={labelStyle}>Phone</label><input style={inpStyle} placeholder="080..." value={addOpen?aForm.phone:eForm.phone} onChange={e=>addOpen?setAForm({...aForm,phone:e.target.value}):setEForm({...eForm,phone:e.target.value})}/></div>
                      <div><label style={labelStyle}>Username</label><input style={inpStyle} placeholder="user123" value={addOpen?aForm.username:eForm.username} onChange={e=>addOpen?setAForm({...aForm,username:e.target.value.toLowerCase()}):setEForm({...eForm,username:e.target.value.toLowerCase()})}/></div>
                    </div>

                    <div>
                      <label style={labelStyle}>Assigned Role</label>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'10px'}}>
                        {Object.entries(ROLES).map(([k,v])=>(
                          <button key={k} onClick={()=>addOpen?setAForm({...aForm,role:k}):setEForm({...eForm,role:k})}
                            style={{padding:'16px 10px', borderRadius:'16px', border:`2px solid ${(addOpen?aForm.role:eForm.role)===k?v.color:T.border}`, background:(addOpen?aForm.role:eForm.role)===k?v.bg:'transparent', cursor:'pointer', transition:'all 0.2s'}}>
                            <div style={{fontSize:'20px', marginBottom:'4px'}}>{v.icon}</div>
                            <div style={{fontSize:'10px', fontWeight:800, color:(addOpen?aForm.role:eForm.role)===k?v.color:T.txt3}}>{v.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {editOpen && <div><label style={labelStyle}>Internal Notes</label><textarea style={{...inpStyle, height:'100px', resize:'none'}} placeholder="Administrative notes..." value={eForm.notes} onChange={e=>setEForm({...eForm,notes:e.target.value})}/></div>}

                    <button onClick={addOpen?handleAdd:handleSave} disabled={saving} style={{padding:'18px', background:T.primary, color:'#fff', border:'none', borderRadius:'20px', fontWeight:800, fontSize:'16px', cursor:'pointer', marginTop:'10px', boxShadow:`0 10px 25px ${T.primary}40`}}>
                      {saving?'Processing...':addOpen?'Create Account':'Save Changes'}
                    </button>
                  </div>
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
