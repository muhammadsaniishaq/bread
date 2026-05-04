import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { 
  Search, UserPlus, X, 
  Trash2,
  ArrowLeft, Edit2, Download, ChevronRight,
  MessageCircle, BadgeCheck, Activity,
  Phone, Mail, TrendingUp, Key,
  Camera, Package
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

interface Profile { id:string; full_name:string; phone?:string; email?:string; role:string; created_at?:string; username?:string; notes?:string; avatar_url?:string; }

const ManagerStaffProfiles: React.FC = () => {
  useNavigate();
  const { customers, products, getPersonalStock, transactions } = useAppContext();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dTab, setDTab] = useState<'overview'|'activity'|'security'>('overview');
  
  const [eForm, setEForm] = useState({full_name:'',phone:'',email:'',username:'',role:'',notes:'', avatar_url:''});
  const [aForm, setAForm] = useState({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER', avatar_url:''});

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
    await supabase.from('profiles').update({full_name:eForm.full_name,phone:eForm.phone,username:eForm.username,role:eForm.role,notes:eForm.notes, avatar_url:eForm.avatar_url}).eq('id',selected.id);
    setProfiles(ps=>ps.map(p=>p.id===selected.id?{...p,...eForm}:p));
    setSaving(false); setEditOpen(false); setSelected({...selected, ...eForm});
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aForm.full_name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('profiles').insert({ ...aForm }).select().single();
    if (data) { setProfiles(ps => [data, ...ps]); setAddOpen(false); setAForm({full_name:'',phone:'',email:'',username:'',role:'SUPPLIER', avatar_url:''}); }
    setSaving(false);
  };

  const handleDelete = async (id:string) => {
    if(!window.confirm('Delete this profile permanently?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setProfiles(ps => ps.filter(p => p.id !== id));
    setSelected(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if(isEdit) setEForm({...eForm, avatar_url: base64});
        else setAForm({...aForm, avatar_url: base64});
      };
      reader.readAsDataURL(e.target.files[0]);
    }
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
                <motion.div key={p.id} whileTap={{scale:0.98}} onClick={()=>{setSelected(p); setDTab('overview');}}
                  style={{background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'14px', padding:'12px 14px', boxShadow:T.shadow, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'50%', background:lc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:ac, flexShrink:0, overflow:'hidden', border:`2px solid ${T.surface}`, boxShadow:T.shadow}}>
                    {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : p.full_name.charAt(0)}
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

        {/* DETAIL DRAWER WITH ADVANCED TABS */}
        <AnimatePresence>
          {selected && (() => {
            const isSupplier = selected.role === 'SUPPLIER';
            const supplierRecord = isSupplier ? customers.find(c => c.profile_id === selected.id) : null;
            const supplierDebt = supplierRecord?.debtBalance || 0;
            const assignedCustomers = isSupplier ? customers.filter(c => c.assignedSupplierId === selected.id || (supplierRecord && c.assignedSupplierId === supplierRecord.id)) : [];
            const supplierStock = isSupplier ? products.reduce((acc, p) => acc + getPersonalStock(p.id, 'SUPPLIER', selected.id), 0) : 0;
            
            const staffTransactions = transactions.filter(t => t.sellerId === selected.id || t.storeKeeperId === selected.id || t.customerId === selected.id).slice(0, 10);

            const permissionsMap: Record<string, string[]> = {
              MANAGER: ['Full System Access', 'Financial Overrides', 'Staff Management', 'Inventory Control'],
              SUPPLIER: ['Mobile POS Access', 'Stock Requests', 'Customer Management', 'Route Tracking'],
              STORE_KEEPER: ['Inventory Management', 'Supplier Dispatch', 'Production Logging'],
              ADMIN: ['Superuser Access', 'System Settings', 'Role Configuration'],
              CUSTOMER: ['Client Portal Access', 'Digital Ledger View']
            };
            const permissions = permissionsMap[selected.role] || ['Basic Access'];

            return (
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
                    <div style={{background: ROLES[selected.role]?.banner || ROLES.MANAGER.banner, height:'80px', borderRadius:'12px', position:'relative'}}>
                      <div style={{position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.3)', backdropFilter:'blur(5px)', padding:'4px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:800, color:T.ink}}>
                         ID: {selected.id.slice(0,8).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Avatar */}
                    <div style={{display:'flex', padding:'0 16px', marginTop:'-32px', position:'relative'}}>
                      <div style={{width:'64px', height:'64px', borderRadius:'50%', background:getAvatar(selected.full_name)[1], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:700, color:getAvatar(selected.full_name)[0], border:`4px solid ${T.surface}`, boxShadow:T.shadow, overflow:'hidden'}}>
                        {selected.avatar_url ? <img src={selected.avatar_url} alt={selected.full_name} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : selected.full_name.charAt(0)}
                      </div>
                    </div>

                    <div style={{marginTop:'8px'}}>
                      <h1 style={{fontSize:'20px', fontWeight:800, color:T.ink, margin:0, display:'flex', alignItems:'center', gap:4}}>{selected.full_name} <BadgeCheck size={16} color={T.success}/></h1>
                      <p style={{color:T.primary, fontSize:'13px', fontWeight:600, margin:'2px 0 0'}}>@{selected.username || 'user'}</p>
                      
                      <div style={{display:'flex', gap:6, marginTop:10}}>
                        <span style={{background:ROLES[selected.role]?.bg, color:ROLES[selected.role]?.color, padding:'4px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:800}}>{ROLES[selected.role]?.label} Authority</span>
                        <span style={{background:T.successLt, color:T.textSuccess, padding:'4px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:800}}>Active Status</span>
                      </div>

                      {/* Quick Actions */}
                      <div style={{display:'flex', gap:'8px', marginTop:'16px'}}>
                        <button onClick={()=>window.open(`tel:${selected.phone}`)} style={{background:T.success, color:'#fff', padding:'10px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'6px', fontWeight:700, fontSize:'12px', border:'none', cursor:'pointer', flex:1, justifyContent:'center', boxShadow:`0 4px 10px ${T.success}40`}}>
                          <MessageCircle size={14}/> Message
                        </button>
                        <button onClick={()=>{setEForm({full_name:selected.full_name||'',phone:selected.phone||'',email:selected.email||'',username:selected.username||'',role:selected.role||'',notes:selected.notes||'', avatar_url:selected.avatar_url||''}); setEditOpen(true);}} style={{background:T.surface, color:T.ink, padding:'10px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontWeight:700, fontSize:'12px', border:`1px solid ${T.borderL}`, cursor:'pointer', flex:1, boxShadow:T.shadow}}>
                          <Edit2 size={14}/> Edit Profile
                        </button>
                      </div>

                      {/* TABS */}
                      <div style={{display:'flex', gap:'16px', borderBottom:`1px solid ${T.borderL}`, marginTop:'24px'}}>
                        {['overview', 'activity', 'security'].map(tab => (
                          <button key={tab} onClick={()=>setDTab(tab as any)} style={{background:'none', border:'none', borderBottom:dTab===tab?`2px solid ${T.primary}`:'2px solid transparent', padding:'10px 0', fontSize:'12px', fontWeight:dTab===tab?700:500, color:dTab===tab?T.primary:T.txt2, cursor:'pointer', textTransform:'capitalize'}}>
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* TAB CONTENTS */}
                      <div style={{marginTop:'16px'}}>
                        
                        {dTab === 'overview' && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <div style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px'}}>
                              <div style={{display:'flex', alignItems:'center', gap:'12px', background:T.surface2, padding:'12px', borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                                <Phone size={16} color={T.primary}/>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:'10px', color:T.txt3, fontWeight:700}}>Phone Number</div>
                                  <div style={{fontSize:'13px', color:T.ink, fontWeight:600}}>{selected.phone || 'Not provided'}</div>
                                </div>
                              </div>
                              <div style={{display:'flex', alignItems:'center', gap:'12px', background:T.surface2, padding:'12px', borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                                <Mail size={16} color={T.primary}/>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:'10px', color:T.txt3, fontWeight:700}}>Email Address</div>
                                  <div style={{fontSize:'13px', color:T.ink, fontWeight:600}}>{selected.email || 'Not provided'}</div>
                                </div>
                              </div>
                            </div>

                            <div style={{display:'flex', gap:8, marginBottom:'16px'}}>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Date Joined</span>
                                <div style={{fontSize:'14px', fontWeight:800, color:T.ink, marginTop:'4px'}}>{new Date(selected.created_at||Date.now()).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})}</div>
                              </div>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Pay Grade</span>
                                <div style={{fontSize:'14px', fontWeight:800, color:T.ink, marginTop:'4px'}}>Tier {selected.role === 'MANAGER' ? '1' : selected.role === 'ADMIN' ? 'S' : '3'}</div>
                              </div>
                            </div>

                            <div style={{display:'flex', gap:8}}>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <div style={{width:32, height:32, borderRadius:'10px', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, boxShadow:T.shadow}}><Activity size={16} color={T.primary}/></div>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Client Load</span>
                                <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{custCounts[selected.id]||0}</div>
                              </div>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <div style={{width:32, height:32, borderRadius:'10px', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, boxShadow:T.shadow}}><TrendingUp size={16} color={T.success}/></div>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Performance</span>
                                <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>98%</div>
                              </div>
                            </div>

                            <div style={{marginTop:'16px', background:T.surface2, padding:'14px', borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                              <h3 style={{fontSize:'12px', fontWeight:800, color:T.ink, margin:'0 0 8px'}}>Internal Administrative Notes</h3>
                              <p style={{color:T.txt2, fontSize:'12px', lineHeight:1.6, margin:0}}>{selected.notes || 'No internal notes captured for this personnel member.'}</p>
                            </div>

                            {isSupplier && (
                              <div style={{marginTop: 20}}>
                                <div style={{display:'flex', gap:8, marginBottom:16}}>
                                  <div style={{background:T.dangerLt, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.danger}20`}}>
                                     <span style={{fontSize:'10px', fontWeight:800, color:T.textDanger, textTransform:'uppercase'}}>Supplier Debt</span>
                                     <div style={{fontSize:'20px', fontWeight:900, color:T.danger}}>₦{supplierDebt.toLocaleString()}</div>
                                  </div>
                                  <div style={{background:T.warnLt, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.warn}20`}}>
                                     <span style={{fontSize:'10px', fontWeight:800, color:T.textWarn, textTransform:'uppercase'}}>Available Stock</span>
                                     <div style={{fontSize:'20px', fontWeight:900, color:T.warn}}>{supplierStock} units</div>
                                  </div>
                                </div>
                                
                                <h3 style={{fontSize:'12px', fontWeight:800, color:T.ink, margin:'0 0 8px'}}>Assigned Customers ({assignedCustomers.length})</h3>
                                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                                   {assignedCustomers.length === 0 ? <p style={{fontSize:11, color:T.txt3}}>No assigned customers.</p> : assignedCustomers.map(c => (
                                     <div key={c.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:T.surface, padding:'10px', borderRadius:'10px', border:`1px solid ${T.borderL}`}}>
                                        <div>
                                           <div style={{fontSize:'12px', fontWeight:700, color:T.ink}}>{c.name}</div>
                                           <div style={{fontSize:'10px', color:T.txt3}}>{c.phone || 'No phone'}</div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                           <div style={{fontSize:'12px', fontWeight:800, color:c.debtBalance>0?T.danger:T.success}}>₦{(c.debtBalance||0).toLocaleString()}</div>
                                           <div style={{fontSize:'9px', color:T.txt3}}>Debt</div>
                                        </div>
                                     </div>
                                   ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {dTab === 'activity' && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                               {staffTransactions.length === 0 ? (
                                  <div style={{padding:'30px', textAlign:'center', color:T.txt3}}>
                                     <Activity size={32} style={{opacity:0.2, marginBottom:10}}/>
                                     <div style={{fontSize:'13px', fontWeight:600}}>No recent activity found.</div>
                                  </div>
                               ) : staffTransactions.map(tx => {
                                  const d = new Date(tx.date);
                                  const isSale = tx.type === 'Cash' || tx.type === 'Debt';
                                  const isInventory = tx.origin === 'STORE' && !isSale;
                                  const Icon = isSale ? TrendingUp : isInventory ? Package : Activity;
                                  const color = isSale ? T.success : isInventory ? T.primary : T.warn;
                                  return (
                                    <div key={tx.id} style={{display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px', background:T.surface2, borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                                        <div style={{background:`${color}20`, padding:'8px', borderRadius:'50%'}}><Icon size={14} color={color}/></div>
                                        <div style={{flex:1}}>
                                           <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>
                                              {isSale ? 'Processed Sale' : tx.type === 'Return' ? 'Stock Return' : 'Transaction'}
                                           </div>
                                           <div style={{fontSize:'11px', color:T.txt3, marginTop:2}}>{d.toLocaleDateString()} {d.toLocaleTimeString()}</div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                           <div style={{fontSize:'13px', fontWeight:800, color:T.ink}}>₦{tx.totalPrice.toLocaleString()}</div>
                                           <div style={{fontSize:'9px', fontWeight:800, color:color, textTransform:'uppercase'}}>{tx.status}</div>
                                        </div>
                                    </div>
                                  );
                               })}
                            </div>
                          </motion.div>
                        )}

                        {dTab === 'security' && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                             <div style={{background:T.surface2, borderRadius:'12px', padding:'16px', border:`1px solid ${T.borderL}`, marginBottom:'16px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                   <span style={{fontSize:'13px', fontWeight:700, color:T.ink}}>Account Status</span>
                                   <span style={{background:T.successLt, color:T.textSuccess, padding:'4px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:800}}>VERIFIED</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                                   <span style={{fontSize:'13px', fontWeight:700, color:T.ink}}>System Pin Access</span>
                                   <span style={{background:T.dangerLt, color:T.textDanger, padding:'4px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:800}}>REQUIRES RESET</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:`1px solid ${T.borderL}`}}>
                                   <span style={{fontSize:'11px', fontWeight:600, color:T.txt3}}>Member Since</span>
                                   <span style={{fontSize:'12px', fontWeight:700, color:T.ink}}>{new Date(selected.created_at||Date.now()).toLocaleDateString()}</span>
                                </div>
                             </div>

                             <h3 style={{fontSize:'12px', fontWeight:800, color:T.ink, margin:'0 0 10px'}}>System Permissions</h3>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                               {permissions.map((perm, i) => (
                                 <div key={i} style={{background:T.surface, padding:'10px', borderRadius:'8px', border:`1px solid ${T.borderL}`, display:'flex', alignItems:'center', gap:8}}>
                                    <BadgeCheck size={14} color={T.primary}/>
                                    <span style={{fontSize:'11px', fontWeight:600, color:T.ink}}>{perm}</span>
                                 </div>
                               ))}
                             </div>

                             <button style={{width:'100%', marginTop:'16px', padding:'12px', background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'10px', color:T.ink, fontWeight:700, fontSize:'12px', display:'flex', justifyContent:'center', alignItems:'center', gap:6, cursor:'pointer', boxShadow:T.shadow}}>
                                <Key size={14}/> Force Password Reset
                             </button>
                          </motion.div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            );
          })()}
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
                      
                      {/* Avatar Upload */}
                      <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:8}}>
                         <div style={{width:'80px', height:'80px', borderRadius:'50%', background:T.bg, border:`2px dashed ${T.borderL}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', cursor:'pointer'}}>
                            <input type="file" accept="image/*" onChange={(e)=>handleImageSelect(e, editOpen)} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', zIndex:10}} />
                            { (addOpen?aForm.avatar_url:eForm.avatar_url) ? 
                              <img src={addOpen?aForm.avatar_url:eForm.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Preview"/> 
                              : <Camera size={24} color={T.txt3}/> 
                            }
                         </div>
                         <span style={{fontSize:'10px', color:T.txt3, marginTop:8, fontWeight:600}}>Tap to upload photo</span>
                      </div>

                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                        <div><label style={labelStyle}>Full Name</label><input style={inpStyle} value={addOpen?aForm.full_name:eForm.full_name} onChange={e=>addOpen?setAForm({...aForm,full_name:e.target.value}):setEForm({...eForm,full_name:e.target.value})} required/></div>
                        <div><label style={labelStyle}>Email Address</label><input type="email" style={inpStyle} value={addOpen?aForm.email:eForm.email} onChange={e=>addOpen?setAForm({...aForm,email:e.target.value}):setEForm({...eForm,email:e.target.value})}/></div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                        <div><label style={labelStyle}>Phone Number</label><input style={inpStyle} value={addOpen?aForm.phone:eForm.phone} onChange={e=>addOpen?setAForm({...aForm,phone:e.target.value}):setEForm({...eForm,phone:e.target.value})}/></div>
                        <div><label style={labelStyle}>System Username</label><input style={inpStyle} value={addOpen?aForm.username:eForm.username} onChange={e=>addOpen?setAForm({...aForm,username:e.target.value.toLowerCase()}):setEForm({...eForm,username:e.target.value.toLowerCase()})}/></div>
                      </div>
                      <div>
                        <label style={labelStyle}>Administrative Role</label>
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
