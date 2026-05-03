import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Search, UserPlus, X, 
  Trash2,
  ArrowLeft, Edit2, Download, ChevronRight,
  MessageCircle, BadgeCheck, Activity,
  Phone, Mail, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.05)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.1)', textSuccess: '#166534',
  danger: '#ef4444', dangerLt: 'rgba(239,68,68,0.1)', textDanger: '#991b1b',
  warn: '#f59e0b', warnLt: 'rgba(245,158,11,0.1)', textWarn: '#92400e',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f1f5f9', surface: '#ffffff', surface2: '#f8fafc',
  border: 'rgba(0,0,0,0.06)', borderL: 'rgba(0,0,0,0.04)',
  shadow: '0 4px 12px rgba(0,0,0,0.05)', shadowMd: '0 10px 25px -5px rgba(0,0,0,0.08)'
};

const ROLES: Record<string,{color:string;bg:string;label:string;icon:string;banner:string}> = {
  MANAGER:      {color:T.primary, bg:'#e0e7ff', label:'Manager',      icon:'🛡️', banner:'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'},
  SUPPLIER:     {color:T.warn,    bg:'#fef3c7', label:'Supplier',     icon:'📦', banner:'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'},
  STORE_KEEPER: {color:'#3b82f6', bg:'#eff6ff', label:'Store Keeper', icon:'🏪', banner:'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'},
  CUSTOMER:     {color:T.success, bg:'#d1fae5', label:'Customer',     icon:'👤', banner:'linear-gradient(135deg, #84ffc9 0%, #aab2ff 100%)'},
  ADMIN:        {color:T.danger,  bg:'#fee2e2', label:'Admin',        icon:'⚡', banner:'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)'},
};

const avatarPalette=[['#4f46e5','#e0e7ff'],['#0891b2','#e0f7fa'],['#059669','#d1fae5'],['#d97706','#fef3c7'],['#dc2626','#fee2e2'],['#7c3aed','#ede9fe']];
const getAvatar=(n:string)=>avatarPalette[n.charCodeAt(0)%avatarPalette.length];

const inpStyle: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.borderL}`, borderRadius: '10px', padding: '10px 12px',
  fontSize: '12px', fontWeight: 500, color: T.ink, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'all 0.2s'
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block'
};

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; notes?:string; }

const ManagerStaffProfiles: React.FC = () => {
  useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole] = useState('ALL');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selected) return;
    setSaving(true);
    await supabase.from('profiles').update({full_name:eForm.full_name,phone:eForm.phone,username:eForm.username,role:eForm.role,notes:eForm.notes}).eq('id',selected.id);
    setProfiles(ps=>ps.map(p=>p.id===selected.id?{...p,...eForm}:p));
    setSaving(false); setEditOpen(false); setSelected(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aForm.full_name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('profiles').insert({ ...aForm }).select().single();
    if (data) { setProfiles(ps => [data, ...ps]); setAddOpen(false); setAForm({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER'}); }
    setSaving(false);
  };

  const handleDelete = async (id:string) => {
    if(!window.confirm('Delete this profile permanently?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setProfiles(ps => ps.filter(p => p.id !== id));
    setSelected(null);
  };

  const filtered = profiles.filter(p=>{
    const s=search.toLowerCase();
    return (filterRole==='ALL'||p.role===filterRole)&&(p.full_name?.toLowerCase().includes(s)||p.phone?.includes(s)||p.username?.toLowerCase().includes(s));
  });

  return (
    <AnimatedPage>
      <div style={{background:T.bg, minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:'110px', paddingTop:'env(safe-area-inset-top)'}}>
        
        {/* HEADER */}
        <div style={{padding:'16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <div>
              <h1 style={{fontSize:'18px', fontWeight:800, color:T.ink, margin:0, letterSpacing:'-0.02em'}}>Staff Profiles</h1>
              <p style={{color:T.txt2, fontSize:'12px', margin:'2px 0 0'}}>Manage your team directory</p>
            </div>
            <button onClick={()=>setAddOpen(true)} style={{display:'flex', alignItems:'center', gap:'6px', background:T.ink, color:'#fff', padding:'8px 12px', borderRadius:'10px', fontWeight:700, fontSize:'12px', border:'none', cursor:'pointer', boxShadow:T.shadow}}>
               <UserPlus size={14}/> Add Staff
            </button>
          </div>

          <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
            <div style={{position:'relative', flex:1}}>
              <Search size={16} color={T.txt3} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}}/>
              <input style={{...inpStyle, paddingLeft:'36px', height:'40px'}} placeholder="Search name, phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button onClick={()=>fetch()} style={{background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'10px', width:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:T.ink}}><Download size={16}/></button>
          </div>

          {/* LIST VIEW */}
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {loading ? <div style={{textAlign:'center', padding:'40px', color:T.txt3, fontSize:'13px'}}>Syncing profiles...</div> : filtered.map(p => {
              const [ac, lc] = getAvatar(p.full_name);
              return (
                <motion.div key={p.id} whileTap={{scale:0.98}} onClick={()=>setSelected(p)}
                  style={{background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'14px', padding:'12px 14px', boxShadow:T.shadow, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px'}}>
                  <div style={{width:'36px', height:'36px', borderRadius:'50%', background:lc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:ac, flexShrink:0}}>
                    {p.full_name.charAt(0)}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px'}}>
                      <span style={{color:T.ink, fontWeight:700, fontSize:'14px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.full_name}</span>
                      <span style={{fontSize:'9px', fontWeight:800, padding:'2px 6px', borderRadius:'6px', background:ROLES[p.role]?.bg, color:ROLES[p.role]?.color}}>{ROLES[p.role]?.label}</span>
                    </div>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <span style={{color:T.txt2, fontSize:'11px'}}>{p.phone || 'No phone'}</span>
                      <span style={{width:3, height:3, borderRadius:'50%', background:T.borderL}}/>
                      <span style={{color:T.txt3, fontSize:'10px', fontWeight:700}}>@{p.username || 'user'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.txt3}/>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* DETAIL DRAWER (MATCHING MANAGER CUSTOMERS) */}
        <AnimatePresence>
          {selected && (
            <div style={{position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end'}}>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring', damping:26, stiffness:300}} style={{background:T.surface, height:'100vh', display:'flex', flexDirection:'column'}}>
                
                <div style={{padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', borderBottom:`1px solid ${T.borderL}`, background:T.surface}}>
                  <button onClick={()=>setSelected(null)} style={{background:'none', border:'none', cursor:'pointer', padding:'6px', marginLeft:'-6px'}}><ArrowLeft size={18} color={T.ink}/></button>
                  <h2 style={{fontSize:'15px', fontWeight:700, color:T.ink, margin:0, flex:1}}>Staff Details</h2>
                  <button onClick={()=>handleDelete(selected.id)} style={{background:T.dangerLt, border:'none', padding:'6px 10px', borderRadius:'8px', display:'flex', alignItems:'center', gap:4, cursor:'pointer', color:T.danger, fontSize:'11px', fontWeight:800}}>
                    <Trash2 size={12}/> Terminate
                  </button>
                </div>

                <div style={{flex:1, overflowY:'auto'}}>
                  <div style={{padding:'20px'}}>
                    {/* Banner */}
                    <div style={{background: ROLES[selected.role]?.banner || ROLES.MANAGER.banner, height:'70px', borderRadius:'12px', position:'relative'}}/>
                    
                    {/* Avatar */}
                    <div style={{display:'flex', padding:'0 16px', marginTop:'-28px', position:'relative'}}>
                      <div style={{width:'56px', height:'56px', borderRadius:'50%', background:getAvatar(selected.full_name)[1], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:700, color:getAvatar(selected.full_name)[0], border:`3px solid ${T.surface}`, boxShadow:T.shadow}}>
                        {selected.full_name.charAt(0)}
                      </div>
                    </div>

                    <div style={{marginTop:'8px'}}>
                      <h1 style={{fontSize:'18px', fontWeight:800, color:T.ink, margin:0, display:'flex', alignItems:'center', gap:4}}>{selected.full_name} <BadgeCheck size={14} color={T.success}/></h1>
                      <p style={{color:T.primary, fontSize:'12px', fontWeight:600, margin:'2px 0 0'}}>@{selected.username || 'user'}</p>
                      
                      <div style={{display:'flex', gap:6, marginTop:8}}>
                        <span style={{background:ROLES[selected.role]?.bg, color:ROLES[selected.role]?.color, padding:'2px 6px', borderRadius:'6px', fontSize:'9px', fontWeight:700}}>{ROLES[selected.role]?.label} Authority</span>
                        <span style={{background:T.successLt, color:T.textSuccess, padding:'2px 6px', borderRadius:'6px', fontSize:'9px', fontWeight:700}}>Active Sync</span>
                      </div>

                      <div style={{display:'flex', flexDirection:'column', gap:'4px', marginTop:'10px'}}>
                        <span style={{color:T.txt2, fontSize:'12px', fontWeight:500}}><Mail size={12} style={{verticalAlign:'middle', marginRight:6}}/> {selected.email || 'No email registered'}</span>
                        <span style={{color:T.txt2, fontSize:'12px', fontWeight:500}}><Phone size={12} style={{verticalAlign:'middle', marginRight:6}}/> {selected.phone || 'No phone'}</span>
                      </div>

                      <div style={{display:'flex', gap:'8px', marginTop:'16px'}}>
                        <button onClick={()=>window.open(`tel:${selected.phone}`)} style={{background:T.warn, color:'#fff', padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'6px', fontWeight:700, fontSize:'12px', border:'none', cursor:'pointer', flex:1, justifyContent:'center', boxShadow:`0 4px 10px ${T.warn}40`}}>
                          <MessageCircle size={14}/> Contact
                        </button>
                        <button onClick={()=>setEditOpen(true)} style={{background:T.surface, color:T.ink, padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:700, fontSize:'12px', border:`1px solid ${T.borderL}`, cursor:'pointer', flex:1, boxShadow:T.shadow}}>
                          <Edit2 size={14}/> Edit Profile
                        </button>
                      </div>

                      <div style={{marginTop:'20px', background:T.surface2, padding:'12px', borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                        <h3 style={{fontSize:'12px', fontWeight:700, color:T.ink, margin:'0 0 6px'}}>Admin Notes</h3>
                        <p style={{color:T.txt2, fontSize:'12px', lineHeight:1.5, margin:0}}>{selected.notes || 'No internal notes captured for this personnel member.'}</p>
                      </div>

                      {/* Performance Metrics */}
                      <div style={{display:'flex', gap:8, marginTop:16}}>
                        <div style={{background:T.primaryLt, border:`1px solid ${T.primary}20`, borderRadius:'10px', padding:'10px 12px', flex:1}}>
                          <div style={{width:28, height:28, borderRadius:'50%', background:T.primary, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6}}><Activity size={14} color="#fff"/></div>
                          <span style={{fontSize:'9px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Client Load</span>
                          <div style={{fontSize:'16px', fontWeight:800, color:T.ink}}>{custCounts[selected.id]||0} Assigned</div>
                        </div>
                        <div style={{background:T.successLt, border:`1px solid ${T.success}20`, borderRadius:'10px', padding:'10px 12px', flex:1}}>
                          <div style={{width:28, height:28, borderRadius:'50%', background:T.success, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6}}><TrendingUp size={14} color="#fff"/></div>
                          <span style={{fontSize:'9px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Efficiency</span>
                          <div style={{fontSize:'16px', fontWeight:800, color:T.ink}}>High Rank</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: ADD / EDIT STAFF */}
        <AnimatePresence>
          {(addOpen || editOpen) && (
            <div style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)', padding:'20px'}}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
                style={{background:T.surface, width:'100%', maxWidth:'380px', maxHeight:'90vh', borderRadius:'16px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:T.shadowMd}}>
                <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.borderL}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <h3 style={{margin:0, fontSize:'15px', fontWeight:800, color:T.ink}}>{addOpen ? 'Add Staff Member' : 'Edit Personnel'}</h3>
                   <button onClick={()=>{setAddOpen(false); setEditOpen(false);}} style={{background:T.bg, border:'none', width:'28px', height:'28px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.ink}}><X size={14}/></button>
                </div>
                <div style={{padding:'16px', overflowY:'auto'}} className="hide-scrollbar">
                   <form onSubmit={addOpen?handleAdd:handleSave} style={{display:'flex', flexDirection:'column', gap:12}}>
                      <div><label style={labelStyle}>Full Name</label><input style={inpStyle} value={addOpen?aForm.full_name:eForm.full_name} onChange={e=>addOpen?setAForm({...aForm,full_name:e.target.value}):setEForm({...eForm,full_name:e.target.value})} required/></div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                        <div><label style={labelStyle}>Phone</label><input style={inpStyle} value={addOpen?aForm.phone:eForm.phone} onChange={e=>addOpen?setAForm({...aForm,phone:e.target.value}):setEForm({...eForm,phone:e.target.value})}/></div>
                        <div><label style={labelStyle}>Username</label><input style={inpStyle} value={addOpen?aForm.username:eForm.username} onChange={e=>addOpen?setAForm({...aForm,username:e.target.value.toLowerCase()}):setEForm({...eForm,username:e.target.value.toLowerCase()})}/></div>
                      </div>
                      <div>
                        <label style={labelStyle}>Staff Role</label>
                        <select style={inpStyle} value={addOpen?aForm.role:eForm.role} onChange={e=>addOpen?setAForm({...aForm,role:e.target.value}):setEForm({...eForm,role:e.target.value})}>
                          {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      {editOpen && <div><label style={labelStyle}>Administrative Notes</label><textarea style={{...inpStyle, resize:'none', height:100}} value={eForm.notes} onChange={e=>setEForm({...eForm,notes:e.target.value})}/></div>}
                      <button type="submit" disabled={saving} style={{background:T.ink, color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontWeight:700, fontSize:'12px', cursor:'pointer', marginTop:4}}>
                        {saving ? 'Saving...' : addOpen ? 'Create Account' : 'Save Changes'}
                      </button>
                   </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerStaffProfiles;
