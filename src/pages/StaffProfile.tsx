import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { 
  ArrowLeft, Phone, MessageSquare, 
  Edit2, X,
  TrendingUp, Zap, ChevronRight,
  Database, User
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

/* ─────────────────────────────────────────
   TOKENS & STYLES (Match UserManagement)
───────────────────────────────────────── */
const T = {
  bg:        'var(--background-color)',
  surface:   'var(--surface-color)',
  border:    'var(--border-color)',
  primary:   '#6366f1',
  primaryLt: 'rgba(99, 102, 241, 0.1)',
  success:   '#10b981',
  successLt: 'rgba(16, 185, 129, 0.1)',
  danger:    '#ef4444',
  dangerLt:  'rgba(239, 68, 68, 0.1)',
  warn:      '#f59e0b',
  warnLt:    'rgba(245, 158, 11, 0.1)',
  txt:       'var(--text-color)',
  txt2:      'var(--text-secondary)',
  txt3:      'rgba(156, 163, 175, 1)',
  radius:    '24px',
  shadow:    '0 4px 20px rgba(0,0,0,0.03)',
  glass:     'rgba(255,255,255,0.7)',
  gold:      '#fbbf24'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const StaffProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone: '', role: '' as UserRole });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (prof) {
        setProfile(prof);
        setEditData({ full_name: prof.full_name || '', phone: prof.phone || '', role: prof.role });
      }

      // 2. Fetch Activities (Hybrid: Transactions & Inventory)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);
      const sinceISO = sevenDaysAgo.toISOString();

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('supplierId', id).gte('date', sinceISO).order('date', { ascending: false }),
        supabase.from('inventory_logs').select('*').eq('createdBy', id).gte('created_at', sinceISO).order('created_at', { ascending: false })
      ]);

      const combined = [
        ...(txRes.data || []).map(tx => ({ ...tx, _type: 'SALE', _date: tx.date, _val: tx.totalPrice, _title: `Sold ${tx.items?.length || 0} items` })),
        ...(invRes.data || []).map(log => ({ ...log, _type: 'INVENTORY', _date: log.created_at, _val: log.quantity, _title: `${log.type} ${log.quantity} units` }))
      ].sort((a,b) => new Date(b._date).getTime() - new Date(a._date).getTime());

      setActivities(combined);

      // 3. Calc Metrics
      const totalVol = combined.reduce((acc, curr) => acc + (curr._val || 0), 0);
      const dailyTrend: any[] = [];
      const trendMap: Record<string, number> = {};
      
      combined.forEach(a => {
        const d = a._date.split('T')[0];
        trendMap[d] = (trendMap[d] || 0) + a._val;
      });
      
      Object.keys(trendMap).sort().forEach(d => dailyTrend.push({ date: d, volume: trendMap[d] }));

      setMetrics({
        totalVolume: totalVol,
        actionCount: combined.length,
        dailyTrend: dailyTrend.slice(-14) // Last 14 days
      });

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async () => {
    if (!id || !editData.full_name.trim()) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editData.full_name.trim(),
      phone: editData.phone.trim(),
      role: editData.role
    }).eq('id', id);

    if (!error) {
       setIsEditing(false);
       fetchData();
    }
    setIsSaving(false);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: T.txt3, fontWeight: 900 }}>Synchronizing Staff Records...</div>;
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center' }}>Staff not found.</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header Guard */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(242,243,247,0.8)', backdropFilter: 'blur(20px)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <button onClick={() => navigate(-1)} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '10px', borderRadius: '14px' }}><ArrowLeft size={18} /></button>
           <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Staff Ledger</h1>
           <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => setIsEditing(true)} style={{ background: T.primary, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Edit2 size={14} /> Edit
              </button>
           </div>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '0 16px 24px' }}>
           <div style={{ background: T.surface, borderRadius: T.radius, padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}><User size={180} /></div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                 <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: T.primary }}>
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em' }}>{profile.full_name || 'Anonymous Staff'}</h2>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                       <span style={{ fontSize: '10px', fontWeight: 900, background: T.primaryLt, color: T.primary, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>{profile.role.replace('_', ' ')}</span>
                       <span style={{ fontSize: '10px', fontWeight: 900, background: T.successLt, color: T.success, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>Verified Profile</span>
                    </div>
                 </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', display: 'flex', gap: '12px' }}>
                 <a href={`tel:${profile.phone}`} style={{ flex: 1, textDecoration: 'none', padding: '12px', borderRadius: '14px', background: '#fff', color: T.txt, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px solid ${T.border}` }}><Phone size={14} /> Call</a>
                 <a href={`https://wa.me/${profile.phone?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none', padding: '12px', borderRadius: '14px', background: '#fff', color: T.txt, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px solid ${T.border}` }}><MessageSquare size={14} /> Chat</a>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div style={{ padding: '0 16px 32px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
           <div style={{ background: T.surface, padding: '20px', borderRadius: T.radius, boxShadow: T.shadow }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Lifetime Volume</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: T.primary }}>{profile.role === 'SUPPLIER' ? fmtRaw(metrics?.totalVolume || 0) : `${metrics?.totalVolume || 0} Units`}</div>
           </div>
           <div style={{ background: T.surface, padding: '20px', borderRadius: T.radius, boxShadow: T.shadow }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Actions (30D)</div>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>{metrics?.actionCount || 0}</div>
           </div>
        </div>

        {/* Productivity Chart */}
        <div style={{ padding: '0 16px 32px' }}>
           <div style={{ background: T.surface, borderRadius: T.radius, padding: '24px', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Productivity Trend</h3>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: T.success, background: T.successLt, padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} /> Live Tracking
                 </div>
              </div>
              <div style={{ height: '200px', width: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.dailyTrend || []}>
                       <defs>
                          <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={T.primary} stopOpacity={0.3}/>
                             <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="date" hide />
                       <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="volume" stroke={T.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Activity Ledger */}
        <div style={{ padding: '0 16px' }}>
           <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 900, paddingLeft: '8px' }}>Recent Heartbeat</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.map((a, idx) => (
                <div key={idx} style={{ background: T.surface, borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${T.border}` }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: a._type === 'SALE' ? T.successLt : T.warnLt, color: a._type === 'SALE' ? T.success : T.warn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a._type === 'SALE' ? <Zap size={18} /> : <Database size={18} />}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{a._title}</div>
                      <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>{new Date(a._date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.txt }}>{a._type === 'SALE' ? fmtRaw(a._val) : `${a._val} U`}</div>
                      <ChevronRight size={14} color={T.txt3} />
                   </div>
                </div>
              ))}
              {activities.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '40px', color: T.txt3, fontWeight: 700 }}>No recent actions recorded.</div>
              )}
           </div>
        </div>

        {/* EDIT MODAL */}
        <AnimatePresence>
           {isEditing && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                   style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Edit Staff Profile</h3>
                      <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: T.txt3 }}><X size={24} /></button>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Full Name</label>
                         <input type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} 
                           style={{ width: '100%', padding: '14px', background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                      </div>
                      
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Phone Number</label>
                         <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} 
                           style={{ width: '100%', padding: '14px', background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                      </div>
                      
                      <div>
                         <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Assigned Role</label>
                         <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value as UserRole})}
                           style={{ width: '100%', padding: '14px', background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700, outline: 'none' }}>
                             <option value="MANAGER">Manager</option>
                             <option value="STORE_KEEPER">Store Keeper</option>
                             <option value="SUPPLIER">Supplier</option>
                             <option value="CUSTOMER">Customer</option>
                         </select>
                      </div>

                      <button onClick={handleSave} disabled={isSaving}
                         style={{ marginTop: '12px', width: '100%', padding: '16px', borderRadius: '18px', background: T.primary, color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, boxShadow: `0 10px 20px -5px rgba(99,102,241,0.4)` }}>
                         {isSaving ? 'Synchronizing...' : 'Save Profile Changes'}
                      </button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default StaffProfile;
