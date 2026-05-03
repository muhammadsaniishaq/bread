import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Search, X, Shield, 
  Edit2, UserPlus, Trash2, Download, 
  ChevronRight, Activity
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
  ink: '#0f172a',
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
  width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px',
  fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none', boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.05em'
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

  const filtered = profiles.filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.phone?.includes(s)||p.username?.toLowerCase().includes(s));
  });

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh', background:T.bg, color:T.ink, fontFamily:"'Plus Jakarta Sans', sans-serif", paddingBottom:'100px'}}>
        
        {/* MOBILE-FIRST VIBRANT HEADER */}
        <div style={{background:T.surface, padding:'24px 20px 20px', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:100}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <button onClick={()=>navigate(-1)} style={{background:T.bg, border:'none', borderRadius:'14px', padding:'10px', color:T.ink, cursor:'pointer'}}><ArrowLeft size={20}/></button>
            <div style={{display:'flex', gap:'8px'}}>
              <button onClick={()=>{}} style={{background:T.bg, border:'none', borderRadius:'14px', padding:'10px', color:T.ink}}><Download size={20}/></button>
              <button onClick={()=>setAddOpen(true)} style={{background:T.primary, border:'none', borderRadius:'14px', padding:'10px 16px', color:'#fff', fontWeight:800, fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', cursor:'pointer'}}>
                <UserPlus size={16}/> Add
              </button>
            </div>
          </div>
          
          <h1 style={{margin:0, fontSize:'22px', fontWeight:900, letterSpacing:'-0.02em'}}>Staff Directory</h1>
          <div style={{fontSize:'12px', fontWeight:700, color:T.txt3, marginTop:'2px'}}>{profiles.length} Verified Personnel</div>

          <div style={{position:'relative', marginTop:'16px'}}>
            <Search size={18} style={{position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:T.txt3}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, or role..." 
              style={{...inpStyle, paddingLeft:'44px', border:'none', background:T.bg}}/>
          </div>
        </div>

        {/* ROLE TABS (HORIZONTAL SCROLL) */}
        <div style={{display:'flex', gap:'8px', overflowX:'auto', padding:'16px 20px', scrollbarWidth:'none'}}>
          {['ALL', 'MANAGER', 'SUPPLIER', 'STORE_KEEPER'].map(r=>(
            <button key={r} onClick={()=>setFilterRole(r)}
              style={{padding:'10px 18px', borderRadius:'20px', border:'none', background:filterRole===r?T.primary:T.surface, color:filterRole===r?'#fff':T.txt2, fontWeight:800, fontSize:'12px', whiteSpace:'nowrap', boxShadow:T.shadow, cursor:'pointer'}}>
              {r==='ALL'?'All Staff':ROLES[r]?.label}
            </button>
          ))}
        </div>

        {/* COMPACT MOBILE-FIRST LIST */}
        <div style={{padding:'0 16px'}}>
          {loading ? (
            <div style={{textAlign:'center', padding:'60px 0', color:T.txt3, fontSize:'14px', fontWeight:600}}>Loading accounts...</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              {filtered.map((p,i)=>(
                <motion.div key={p.id} initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{delay:i*0.03}}
                  onClick={()=>setSelected(p)}
                  whileTap={{scale:0.98}}
                  style={{background:T.surface, borderRadius:'24px', padding:'16px', boxShadow:T.shadow, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:'14px', cursor:'pointer'}}>
                  <div style={{width:'52px', height:'52px', borderRadius:'18px', background:ROLES[p.role]?.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>
                    {ROLES[p.role]?.icon}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'15px', fontWeight:800, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', marginTop:'2px'}}>
                      <span style={{fontSize:'11px', fontWeight:800, color:ROLES[p.role]?.color, textTransform:'uppercase'}}>{ROLES[p.role]?.label}</span>
                      <div style={{width:'3px', height:'3px', borderRadius:'50%', background:T.txt3}}/>
                      <span style={{fontSize:'12px', fontWeight:600, color:T.txt3}}>@{p.username || 'user'}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'14px', fontWeight:900, color:T.primary}}>{custCounts[p.id]||0}</div>
                    <div style={{fontSize:'9px', fontWeight:800, color:T.txt3}}>CLIENTS</div>
                  </div>
                  <ChevronRight size={18} color={T.txt3}/>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* MOBILE BOTTOM SHEET (DETAILS) */}
        <AnimatePresence>
          {selected && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}
                style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', zIndex:200}}/>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:25, stiffness:200}}
                style={{position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTopLeftRadius:'40px', borderTopRightRadius:'40px', zIndex:201, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 -10px 40px rgba(0,0,0,0.1)'}}>
                <div style={{width:'40px', height:'4px', background:'#e2e8f0', borderRadius:'2px', margin:'16px auto'}}/>
                <div style={{padding:'0 24px 40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                      <div style={{width:'64px', height:'64px', borderRadius:'22px', background:ROLES[selected.role]?.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px'}}>{ROLES[selected.role]?.icon}</div>
                      <div>
                        <h2 style={{margin:0, fontSize:'20px', fontWeight:900}}>{selected.full_name}</h2>
                        <div style={{fontSize:'12px', fontWeight:700, color:ROLES[selected.role]?.color}}>{ROLES[selected.role]?.label} • @{selected.username}</div>
                      </div>
                    </div>
                    <button onClick={()=>setSelected(null)} style={{background:T.bg, border:'none', borderRadius:'50%', width:'36px', height:'36px', color:T.ink}}><X size={18}/></button>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px'}}>
                    <button onClick={()=>{setEForm({full_name:selected.full_name||'',phone:selected.phone||'',email:selected.email||'',username:selected.username||'',role:selected.role||'',notes:selected.notes||''}); setEditOpen(true);}} style={{background:T.primary, border:'none', borderRadius:'20px', padding:'14px', color:'#fff', fontWeight:800, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}><Edit2 size={16}/> Edit</button>
                    <button onClick={()=>{if(window.confirm('Delete?')){setProfiles(ps=>ps.filter(p=>p.id!==selected.id)); setSelected(null);}}} style={{background:T.dangerLt, border:'none', borderRadius:'20px', padding:'14px', color:T.danger, fontWeight:800, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}><Trash2 size={16}/> Delete</button>
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                    <div style={{background:T.bg, borderRadius:'24px', padding:'20px', display:'flex', flexDirection:'column', gap:'12px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}><Activity size={16} color={T.primary}/> <span style={{fontSize:'13px', fontWeight:800}}>Operations</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontSize:'13px', color:T.txt2}}>Phone</span><span style={{fontSize:'13px', fontWeight:700}}>{selected.phone || 'N/A'}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontSize:'13px', color:T.txt2}}>Managed Customers</span><span style={{fontSize:'13px', fontWeight:700, color:T.primary}}>{custCounts[selected.id]||0} Clients</span></div>
                    </div>
                    <div style={{background:T.bg, borderRadius:'24px', padding:'20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}><Shield size={16} color={T.purple}/> <span style={{fontSize:'13px', fontWeight:800}}>Internal Notes</span></div>
                      <p style={{margin:0, fontSize:'13px', color:T.txt2, lineHeight:'1.5'}}>{selected.notes || 'No notes added for this member.'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* BOTTOM SHEET (ADD / EDIT) */}
        <AnimatePresence>
          {(addOpen || editOpen) && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setAddOpen(false);setEditOpen(false);}}
                style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', zIndex:300}}/>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:25, stiffness:200}}
                style={{position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTopLeftRadius:'40px', borderTopRightRadius:'40px', zIndex:301, maxHeight:'90vh', overflowY:'auto'}}>
                <div style={{width:'40px', height:'4px', background:'#e2e8f0', borderRadius:'2px', margin:'16px auto'}}/>
                <div style={{padding:'0 24px 40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                    <h3 style={{margin:0, fontSize:'20px', fontWeight:900}}>{addOpen?'New Staff Member':'Update Profile'}</h3>
                    <button onClick={()=>{setAddOpen(false);setEditOpen(false);}} style={{background:T.bg, border:'none', borderRadius:'50%', width:'36px', height:'36px', color:T.ink}}><X size={18}/></button>
                  </div>
                  
                  <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div><label style={labelStyle}>Full Legal Name</label><input style={inpStyle} placeholder="Full Name" value={addOpen?aForm.full_name:eForm.full_name} onChange={e=>addOpen?setAForm({...aForm,full_name:e.target.value}):setEForm({...eForm,full_name:e.target.value})}/></div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                      <div><label style={labelStyle}>Phone</label><input style={inpStyle} placeholder="080..." value={addOpen?aForm.phone:eForm.phone} onChange={e=>addOpen?setAForm({...aForm,phone:e.target.value}):setEForm({...eForm,phone:e.target.value})}/></div>
                      <div><label style={labelStyle}>Username</label><input style={inpStyle} placeholder="user123" value={addOpen?aForm.username:eForm.username} onChange={e=>addOpen?setAForm({...aForm,username:e.target.value.toLowerCase()}):setEForm({...eForm,username:e.target.value.toLowerCase()})}/></div>
                    </div>
                    <div>
                      <label style={labelStyle}>Assigned Role</label>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'8px'}}>
                        {Object.entries(ROLES).map(([k,v])=>(
                          <button key={k} onClick={()=>addOpen?setAForm({...aForm,role:k}):setEForm({...eForm,role:k})}
                            style={{padding:'14px 8px', borderRadius:'16px', border:`2px solid ${(addOpen?aForm.role:eForm.role)===k?v.color:T.border}`, background:(addOpen?aForm.role:eForm.role)===k?v.bg:'transparent', cursor:'pointer'}}>
                            <div style={{fontSize:'18px', marginBottom:'4px'}}>{v.icon}</div>
                            <div style={{fontSize:'10px', fontWeight:800, color:(addOpen?aForm.role:eForm.role)===k?v.color:T.txt3}}>{v.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {editOpen && <div><label style={labelStyle}>Notes</label><textarea style={{...inpStyle, height:'80px', resize:'none'}} placeholder="Notes..." value={eForm.notes} onChange={e=>setEForm({...eForm,notes:e.target.value})}/></div>}
                    <button onClick={addOpen?handleAdd:handleSave} disabled={saving} style={{padding:'16px', background:T.primary, color:'#fff', border:'none', borderRadius:'20px', fontWeight:800, fontSize:'15px', cursor:'pointer', marginTop:'10px'}}>
                      {saving?'Processing...':addOpen?'Onboard Staff':'Save Changes'}
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
