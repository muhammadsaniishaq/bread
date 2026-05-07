import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { 
  Search, UserPlus, X, Trash2,
  ArrowLeft, Edit2, Download, ChevronRight,
  MessageCircle, BadgeCheck, Activity,
  Phone, Mail, TrendingUp, Key,
  Camera, Package,
  PhoneCall, MessageSquare, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.08)', primaryMid: 'rgba(79,70,229,0.15)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.1)', textSuccess: '#065f46',
  danger: '#ef4444', dangerLt: 'rgba(239,68,68,0.1)', textDanger: '#991b1b',
  warn: '#f59e0b', warnLt: 'rgba(245,158,11,0.1)', textWarn: '#78350f',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f1f5f9', surface: '#ffffff', surface2: '#f8fafc',
  border: 'rgba(0,0,0,0.06)', borderL: 'rgba(0,0,0,0.04)',
  shadow: '0 2px 8px rgba(0,0,0,0.06)', shadowMd: '0 8px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 20px 40px rgba(0,0,0,0.15)',
  heroGrad: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
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
  const { customers, products, getPersonalStock, transactions, getSupplierDebt } = useAppContext();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [custCounts, setCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');
  const [selected, setSelected] = useState<Profile|null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dTab, setDTab] = useState<'overview'|'activity'|'security'|'inventory'>('overview');
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmt, setSettleAmt] = useState('');
  const [settling, setSettling] = useState(false);
  
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

  const handleSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const amt = parseFloat(settleAmt);
    if (!amt || amt <= 0) return;

    const sRecord = customers.find(c => c.profile_id === selected.id) ||
      customers.find(c => c.name.toLowerCase() === (selected.full_name||'').toLowerCase()) ||
      customers.find(c => c.phone && c.phone === selected.phone);

    if (!sRecord) return alert('Could not find matching customer record for this supplier.');

    // Use dynamic 90% debt calculation
    const currentDebt = getSupplierDebt(selected.id);
    if (amt > currentDebt) {
      alert(`Cannot remit more than the outstanding balance of ₦${currentDebt.toLocaleString()} (90% of sales).`);
      return;
    }

    setSettling(true);
    try {
      // Only insert payment transaction — debt is calculated dynamically from transactions
      const tx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        customer_id: sRecord.id,
        seller_id: selected.id,
        total_price: amt,
        type: 'Payment',
        status: 'COMPLETED',
        origin: 'ADMIN_SETTLEMENT'
      };
      await supabase.from('transactions').insert([tx]);
      alert(`₦${amt.toLocaleString()} recorded. Remaining: ₦${Math.max(0, currentDebt - amt).toLocaleString()}`);
      setSettleOpen(false);
      setSettleAmt('');
      window.location.reload();
    } catch(err: any) {
      alert('Error: ' + err.message);
    }
    setSettling(false);
  };

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

  const getTxCount = (profileId: string) =>
    transactions.filter(t => t.sellerId === profileId || t.storeKeeperId === profileId).length;

  const getTier = (count: number) => {
    if (count >= 100) return { label: 'Platinum', emoji: '💎', color: '#818cf8' };
    if (count >= 50)  return { label: 'Gold',     emoji: '🥇', color: '#ca8a04' };
    if (count >= 20)  return { label: 'Silver',   emoji: '🥈', color: '#64748b' };
    return               { label: 'Bronze',   emoji: '🥉', color: '#b45309' };
  };

  const totalSupplierDebt = profiles
    .filter(p => p.role === 'SUPPLIER')
    .reduce((s, p) => s + getSupplierDebt(p.id), 0);

  const filtered = profiles.filter(p => {
    const s = search.toLowerCase();
    return (activeRoleFilter === 'ALL' || p.role === activeRoleFilter)
      && (p.full_name?.toLowerCase().includes(s) || p.phone?.includes(s) || p.username?.toLowerCase().includes(s));
  });

  return (
    <AnimatedPage>
      <div style={{background:T.bg, minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:'110px', paddingTop:'env(safe-area-inset-top)'}}>
        
        {/* PREMIUM HERO HEADER */}
        <div style={{background: T.heroGrad, padding:'32px 20px 24px', position:'relative', overflow:'hidden'}}>
          {/* Background glows */}
          <div style={{position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(165,180,252,0.15)', pointerEvents:'none'}}/>
          <div style={{position:'absolute', bottom:'-40px', left:'-40px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(99,102,241,0.2)', pointerEvents:'none'}}/>
          <div style={{position:'relative'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
              <div>
                <p style={{color:'rgba(165,180,252,0.8)', fontSize:'11px', fontWeight:800, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em'}}>Management Console</p>
                <h1 style={{fontSize:'22px', fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.02em'}}>Staff Profiles</h1>
                <p style={{color:'rgba(255,255,255,0.55)', fontSize:'12px', margin:'4px 0 0', fontWeight:500}}>{profiles.length} team members
              </p></div>
              <button onClick={()=>setAddOpen(true)} style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', color:'#fff', padding:'10px 14px', borderRadius:'12px', fontWeight:800, fontSize:'12px', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer'}}>
                <UserPlus size={14}/> Add Staff
              </button>
            </div>
            {/* Stats strip */}
            <div style={{display:'flex', gap:'8px'}}>
              {[
                {label:'Suppliers', val: profiles.filter(p=>p.role==='SUPPLIER').length, color:'#fbbf24'},
                {label:'Store Keepers', val: profiles.filter(p=>p.role==='STORE_KEEPER').length, color:'#60a5fa'},
                {label:'Total Debt', val: `₦${(totalSupplierDebt/1000).toFixed(0)}k`, color:'#f87171'},
              ].map(s => (
                <div key={s.label} style={{flex:1, background:'rgba(255,255,255,0.08)', backdropFilter:'blur(8px)', padding:'10px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)'}}>
                  <div style={{fontSize:'16px', fontWeight:900, color:s.color}}>{s.val}</div>
                  <div style={{fontSize:'9px', fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div style={{padding:'16px'}}>
          <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
            <div style={{position:'relative', flex:1}}>
              <Search size={16} color={T.txt3} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}}/>
              <input style={{...inpStyle, paddingLeft:'36px', height:'42px', borderRadius:'12px', boxShadow:T.shadow}} placeholder="Search name, phone, username..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button onClick={()=>fetch()} style={{background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'12px', width:'42px', display:'flex', alignItems:'center', justifyContent:'center', color:T.ink, boxShadow:T.shadow}}><Download size={16}/></button>
          </div>

          {/* Role Filter Chips */}
          <div style={{display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px', marginBottom:'12px'}}>
            {[{id:'ALL',label:'All Staff',icon:'👥'}, {id:'SUPPLIER',label:'Suppliers',icon:'📦'}, {id:'STORE_KEEPER',label:'Store Keepers',icon:'🏪'}, {id:'MANAGER',label:'Managers',icon:'🛡️'}, {id:'ADMIN',label:'Admins',icon:'⚡'}].map(r => (
              <button key={r.id} onClick={()=>setActiveRoleFilter(r.id)}
                style={{display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'11px', flexShrink:0, transition:'all 0.2s',
                  background: activeRoleFilter===r.id ? T.ink : T.surface,
                  color: activeRoleFilter===r.id ? '#fff' : T.txt2,
                  boxShadow: activeRoleFilter===r.id ? T.shadowMd : T.shadow}}>
                <span>{r.icon}</span> {r.label}
                {r.id !== 'ALL' && <span style={{background: activeRoleFilter===r.id ? 'rgba(255,255,255,0.2)' : T.bg, borderRadius:'10px', padding:'1px 5px', fontSize:'9px', fontWeight:900}}>{profiles.filter(p=>p.role===r.id).length}</span>}
              </button>
            ))}
          </div>

          {/* LIST VIEW */}
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {loading ? (
              <div style={{textAlign:'center', padding:'40px', color:T.txt3}}>
                <motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:'linear'}} style={{width:'32px', height:'32px', border:`3px solid ${T.borderL}`, borderTop:`3px solid ${T.primary}`, borderRadius:'50%', margin:'0 auto 12px'}}/>
                Syncing profiles...
              </div>
            ) : filtered.map(p => {
              const [ac, lc] = getAvatar(p.full_name);
              const role = ROLES[p.role] || ROLES.CUSTOMER;
              const debt = p.role === 'SUPPLIER' ? getSupplierDebt(p.id) : 0;
              return (
                <motion.div key={p.id} whileTap={{scale:0.98}} onClick={()=>{setSelected(p); setDTab('overview');}}
                  style={{background:T.surface, border:`1px solid ${T.borderL}`, borderRadius:'16px', padding:'14px', boxShadow:T.shadow, cursor:'pointer'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{width:'44px', height:'44px', borderRadius:'50%', background:lc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:ac, flexShrink:0, overflow:'hidden', border:`2px solid ${T.surface}`, boxShadow:T.shadow}}>
                      {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : p.full_name.charAt(0)}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px'}}>
                        <span style={{color:T.ink, fontWeight:800, fontSize:'14px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.full_name}</span>
                        <span style={{fontSize:'9px', fontWeight:800, padding:'2px 7px', borderRadius:'6px', background:role.bg, color:role.color, flexShrink:0}}>{role.label}</span>
                      </div>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <span style={{color:T.txt2, fontSize:'11px', fontWeight:500}}>{p.phone || 'No phone'}</span>
                        {debt > 0 && <span style={{fontSize:'10px', fontWeight:800, color:T.danger, background:T.dangerLt, padding:'1px 6px', borderRadius:'5px'}}>₦{debt.toLocaleString()} owed</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} color={T.txt3}/>
                  </div>
                  {/* Quick action row */}
                  {p.phone && (
                    <div style={{display:'flex', gap:'6px', marginTop:'10px', paddingTop:'10px', borderTop:`1px solid ${T.borderL}`}} onClick={e=>e.stopPropagation()}>
                      <a href={`tel:${p.phone}`} style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'7px', borderRadius:'10px', background:T.successLt, color:T.textSuccess, fontWeight:700, fontSize:'11px', textDecoration:'none'}}>
                        <PhoneCall size={13}/> Call
                      </a>
                      <a href={`https://wa.me/${p.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'7px', borderRadius:'10px', background:'rgba(37,211,102,0.1)', color:'#128c7e', fontWeight:700, fontSize:'11px', textDecoration:'none'}}>
                        <MessageSquare size={13}/> WhatsApp
                      </a>
                      <button onClick={()=>{setSelected(p); setDTab('overview');}} style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'7px', borderRadius:'10px', background:T.primaryLt, color:T.primary, fontWeight:700, fontSize:'11px', border:'none', cursor:'pointer'}}>
                        <Shield size={13}/> Profile
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* DETAIL DRAWER WITH ADVANCED TABS */}
        <AnimatePresence>
          {selected && (() => {
            const isSupplier = selected.role === 'SUPPLIER';
            const supplierRecord = isSupplier ? (
              customers.find(c => c.profile_id === selected.id) ||
              customers.find(c => c.name.toLowerCase() === (selected.full_name||'').toLowerCase()) ||
              customers.find(c => c.phone && c.phone === selected.phone)
            ) : null;
            const supplierDebt = isSupplier ? getSupplierDebt(selected.id) : 0;
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
                      <div style={{display:'flex', gap:'16px', borderBottom:`1px solid ${T.borderL}`, marginTop:'24px', overflowX:'auto'}} className="hide-scrollbar">
                        {['overview', 'activity', 'security', ...(isSupplier ? ['inventory'] : [])].map(tab => (
                          <button key={tab} onClick={()=>setDTab(tab as any)} style={{background:'none', border:'none', borderBottom:dTab===tab?`2px solid ${T.primary}`:'2px solid transparent', padding:'10px 0', fontSize:'12px', fontWeight:dTab===tab?700:500, color:dTab===tab?T.primary:T.txt2, cursor:'pointer', textTransform:'capitalize', whiteSpace:'nowrap'}}>
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
                              {(() => {
                                const txCount = getTxCount(selected.id);
                                const tier = getTier(txCount);
                                return (
                                <div style={{background:`${tier.color}15`, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${tier.color}30`}}>
                                  <span style={{fontSize:'10px', fontWeight:800, color:tier.color, textTransform:'uppercase'}}>Performance Tier</span>
                                  <div style={{fontSize:'20px', marginTop:'4px'}}>{tier.emoji}</div>
                                  <div style={{fontSize:'13px', fontWeight:900, color:tier.color}}>{tier.label}</div>
                                </div>
                                );
                              })()}
                            </div>

                            <div style={{display:'flex', gap:8}}>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <div style={{width:32, height:32, borderRadius:'10px', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, boxShadow:T.shadow}}><Activity size={16} color={T.primary}/></div>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Client Load</span>
                                <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{custCounts[selected.id]||0}</div>
                              </div>
                              <div style={{background:T.bg, borderRadius:'12px', padding:'14px', flex:1, border:`1px solid ${T.borderL}`}}>
                                <div style={{width:32, height:32, borderRadius:'10px', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8, boxShadow:T.shadow}}><TrendingUp size={16} color={T.success}/></div>
                                <span style={{fontSize:'10px', fontWeight:800, color:T.txt2, textTransform:'uppercase'}}>Transactions</span>
                                <div style={{fontSize:'20px', fontWeight:900, color:T.ink}}>{getTxCount(selected.id)}</div>
                              </div>
                            </div>

                            <div style={{marginTop:'16px', background:T.surface2, padding:'14px', borderRadius:'12px', border:`1px solid ${T.borderL}`}}>
                              <h3 style={{fontSize:'12px', fontWeight:800, color:T.ink, margin:'0 0 8px'}}>Internal Administrative Notes</h3>
                              <p style={{color:T.txt2, fontSize:'12px', lineHeight:1.6, margin:0}}>{selected.notes || 'No internal notes captured for this personnel member.'}</p>
                            </div>

                            {isSupplier && (() => {
                              const totalSales = transactions
                                .filter(t => t.status === 'COMPLETED' && t.origin === 'POS_SUPPLIER' && t.sellerId === selected.id)
                                .reduce((s, t) => s + t.totalPrice, 0);
                              const supplierEarnings = totalSales * 0.1;
                              return (
                              <div style={{marginTop: 20}}>
                                {/* Debt + Stock cards */}
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
                                  <div style={{background:`linear-gradient(135deg, ${T.danger}15, ${T.danger}05)`, borderRadius:'14px', padding:'14px', border:`1px solid ${T.danger}20`}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                                      <span style={{fontSize:'10px', fontWeight:800, color:T.textDanger, textTransform:'uppercase'}}>Debt Owed</span>
                                      <button onClick={()=>setSettleOpen(true)} style={{background:T.danger, color:'#fff', border:'none', padding:'3px 7px', borderRadius:'6px', fontSize:'9px', fontWeight:800, cursor:'pointer'}}>Settle</button>
                                    </div>
                                    <div style={{fontSize:'20px', fontWeight:900, color:T.danger}}>₦{supplierDebt.toLocaleString()}</div>
                                    <div style={{fontSize:'9px', color:T.textDanger, marginTop:4, opacity:0.7}}>90% of sales</div>
                                  </div>
                                  <div style={{background:`linear-gradient(135deg, ${T.warn}15, ${T.warn}05)`, borderRadius:'14px', padding:'14px', border:`1px solid ${T.warn}20`}}>
                                    <span style={{fontSize:'10px', fontWeight:800, color:T.textWarn, textTransform:'uppercase'}}>Available Stock</span>
                                    <div style={{fontSize:'20px', fontWeight:900, color:T.warn, marginTop:8}}>{supplierStock}</div>
                                    <div style={{fontSize:'9px', color:T.textWarn, marginTop:4, opacity:0.7}}>units held</div>
                                  </div>
                                </div>
                                {/* Mini earnings row */}
                                <div style={{background:T.successLt, borderRadius:'12px', padding:'12px', border:`1px solid ${T.success}20`, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  <div>
                                    <div style={{fontSize:'10px', fontWeight:800, color:T.textSuccess, textTransform:'uppercase'}}>Their 10% Commission</div>
                                    <div style={{fontSize:'16px', fontWeight:900, color:T.success}}>₦{supplierEarnings.toLocaleString()}</div>
                                  </div>
                                  <div style={{textAlign:'right'}}>
                                    <div style={{fontSize:'10px', fontWeight:800, color:T.txt3, textTransform:'uppercase'}}>Total Sales</div>
                                    <div style={{fontSize:'16px', fontWeight:900, color:T.ink}}>₦{totalSales.toLocaleString()}</div>
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
                              );
                            })()}
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

                        {dTab === 'inventory' && isSupplier && (
                          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                            <h3 style={{fontSize:'12px', fontWeight:800, color:T.ink, margin:'0 0 10px'}}>Current Stock Breakdown</h3>
                            <div style={{display:'flex', flexDirection:'column', gap:8}}>
                               {products.reduce((acc, p) => acc + getPersonalStock(p.id, 'SUPPLIER', selected.id), 0) === 0 ? (
                                 <div style={{padding:'30px', textAlign:'center', color:T.txt3}}>
                                    <Package size={32} style={{opacity:0.2, marginBottom:10}}/>
                                    <div style={{fontSize:'13px', fontWeight:600}}>Supplier has no stock.</div>
                                 </div>
                               ) : products.map(p => {
                                 const stock = getPersonalStock(p.id, 'SUPPLIER', selected.id);
                                 if (stock <= 0) return null;
                                 return (
                                   <div key={p.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:T.surface2, padding:'12px', borderRadius:'10px', border:`1px solid ${T.borderL}`}}>
                                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                                        <div style={{width:32, height:32, borderRadius:'8px', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadow}}>
                                          <Package size={14} color={T.primary}/>
                                        </div>
                                        <div>
                                           <div style={{fontSize:'13px', fontWeight:700, color:T.ink}}>{p.name}</div>
                                           <div style={{fontSize:'10px', color:T.txt3}}>₦{p.price.toLocaleString()} per unit</div>
                                        </div>
                                      </div>
                                      <div style={{textAlign:'right'}}>
                                         <div style={{fontSize:'16px', fontWeight:800, color:stock < 5 ? T.danger : T.success}}>{stock}</div>
                                         <div style={{fontSize:'9px', color:T.txt3, fontWeight:600}}>UNITS</div>
                                      </div>
                                   </div>
                                 );
                               })}
                            </div>
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

        {/* MODAL: SETTLE DEBT */}
        <AnimatePresence>
          {settleOpen && selected && (() => {
            const currentDebt = getSupplierDebt(selected.id);
            const totalSales = transactions
              .filter(t => t.status === 'COMPLETED' && t.origin === 'POS_SUPPLIER' && (t.sellerId === selected.id))
              .reduce((s, t) => s + t.totalPrice, 0);
            const myEarnings = totalSales * 0.1;
            return (
            <div style={{position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.7)', backdropFilter:'blur(8px)', padding:'20px'}}>
              <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
                style={{background:T.surface, width:'100%', maxWidth:'380px', borderRadius:'24px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px rgba(0,0,0,0.3)'}}>
                <div style={{padding:'16px 20px', borderBottom:`1px solid ${T.borderL}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div>
                     <h3 style={{margin:0, fontSize:'16px', fontWeight:900, color:T.ink}}>Settle Supplier Debt</h3>
                     <p style={{margin:'2px 0 0', fontSize:'11px', color:T.txt3, fontWeight:600}}>{selected.full_name}</p>
                   </div>
                   <button onClick={()=>setSettleOpen(false)} style={{background:T.bg, border:'none', width:'32px', height:'32px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:T.ink}}><X size={14}/></button>
                </div>
                <div style={{padding:'20px'}}>
                  {/* Debt Breakdown */}
                  <div style={{background:T.dangerLt, padding:'16px', borderRadius:'16px', marginBottom:'16px', border:`1px solid ${T.danger}30`}}>
                    <div style={{fontSize:'11px', color:T.textDanger, fontWeight:800, textTransform:'uppercase', marginBottom:'8px'}}>Outstanding Debt (90% of Sales)</div>
                    <div style={{fontSize:'28px', fontWeight:900, color:T.danger, marginBottom:'12px'}}>₦{currentDebt.toLocaleString()}</div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <div style={{flex:1, background:'rgba(239,68,68,0.08)', padding:'8px 10px', borderRadius:'10px'}}>
                        <div style={{fontSize:'9px', fontWeight:800, color:T.textDanger, textTransform:'uppercase'}}>Total Sales</div>
                        <div style={{fontSize:'13px', fontWeight:900, color:T.ink}}>₦{totalSales.toLocaleString()}</div>
                      </div>
                      <div style={{flex:1, background:'rgba(16,185,129,0.08)', padding:'8px 10px', borderRadius:'10px'}}>
                        <div style={{fontSize:'9px', fontWeight:800, color:T.textSuccess, textTransform:'uppercase'}}>Their 10% Cut</div>
                        <div style={{fontSize:'13px', fontWeight:900, color:T.success}}>₦{myEarnings.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleSettleDebt} style={{display:'flex', flexDirection:'column', gap:12}}>
                    <div>
                      <label style={labelStyle}>Amount Remitting to Store (₦)</label>
                      <input type="number" max={currentDebt} style={{...inpStyle, fontSize:'18px', fontWeight:900, padding:'14px'}} placeholder={`Max: ₦${currentDebt.toLocaleString()}`} value={settleAmt} onChange={e=>setSettleAmt(e.target.value)} required autoFocus/>
                    </div>
                    <button type="submit" disabled={settling} style={{background:T.ink, color:'#fff', border:'none', borderRadius:'12px', padding:'14px', fontWeight:800, fontSize:'14px', cursor:'pointer', marginTop:4}}>
                      {settling ? 'Processing...' : 'Confirm Settlement'}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
            );
          })()}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerStaffProfiles;
