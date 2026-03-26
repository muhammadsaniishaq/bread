import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { 
  ArrowLeft, Phone, 
  Edit2, X,
  TrendingUp, Zap,
  Database, Wallet, History,
  Award, Shield, Calendar, CreditCard,
  AlertCircle, Activity
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

/* ─────────────────────────────────────────
   TOKENS & STYLES
───────────────────────────────────────── */
const T = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  primary:   '#4f46e5',
  primaryLt: 'rgba(79, 70, 229, 0.08)',
  success:   '#10b981',
  successLt: 'rgba(16, 185, 129, 0.08)',
  danger:    '#ef4444',
  dangerLt:  'rgba(239, 68, 68, 0.08)',
  warn:      '#f59e0b',
  warnLt:    'rgba(245, 158, 11, 0.08)',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  radius:    '32px',
  shadow:    '0 10px 30px rgba(0,0,0,0.04)',
  glass:     'rgba(255,255,255,0.8)'
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
  const [remissions, setRemissions] = useState<any[]>([]);
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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (prof) {
        setProfile(prof);
        setEditData({ full_name: prof.full_name || '', phone: prof.phone || '', role: prof.role });
      }

      const [txRes, remRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('supplierId', id).order('date', { ascending: false }),
        supabase.from('remissions').select('*').eq('supplierId', id).order('date', { ascending: false }),
        supabase.from('inventory_logs').select('*').eq('createdBy', id).order('created_at', { ascending: false })
      ]);

      const txs = txRes.data || [];
      const rems = remRes.data || [];
      const logs = invRes.data || [];

      const combinedActions = [
        ...txs.map(tx => ({ ...tx, _type: 'SALE', _date: tx.date, _val: tx.totalPrice, _title: `Sale Recorded` })),
        ...logs.map(log => ({ ...log, _type: 'INVENTORY', _date: log.created_at, _val: log.quantity, _title: `${log.type} Logged` }))
      ].sort((a,b) => new Date(b._date).getTime() - new Date(a._date).getTime());

      setActivities(combinedActions.slice(0, 15));
      setRemissions(rems.slice(0, 10));

      const totalSales = txs.reduce((s,c) => s + (c.totalPrice || 0), 0);
      const totalRemitted = rems.reduce((s,c) => s + (c.amount || 0), 0);
      const currentDebt = totalSales - totalRemitted;

      const trendMap: Record<string, number> = {};
      combinedActions.forEach(a => {
        const d = a._date.split('T')[0];
        trendMap[d] = (trendMap[d] || 0) + a._val;
      });
      const dailyTrend = Object.keys(trendMap).sort().slice(-14).map(d => ({ date: d, volume: trendMap[d] }));

      setMetrics({
        totalSales,
        totalRemitted,
        currentDebt,
        actionCount: combinedActions.length,
        dailyTrend
      });

    } catch (e) { console.error(e); }
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
    if (!error) { setIsEditing(false); fetchData(); }
    setIsSaving(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>Fetching Personnel Telemetry...</div>;
  if (!profile) return <div style={{ padding: '40px', textAlign: 'center' }}>Staff profile not found.</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(16px)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${T.border}` }}>
           <button onClick={() => navigate(-1)} style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '10px', borderRadius: '14px' }}><ArrowLeft size={18} /></button>
           <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Staff Command</h1>
           <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => setIsEditing(true)} style={{ background: T.primary, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '14px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Edit2 size={14} /> Edit
              </button>
           </div>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '24px 16px' }}>
           <div style={{ background: '#fff', borderRadius: T.radius, padding: '32px', boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.05 }}><Shield size={220} /></div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
                 <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 900, color: T.primary }}>
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                 </div>
                 <div style={{ flex: 1, minWidth: '200px' }}>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em' }}>{profile.full_name || 'Personnel'}</h2>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                       <span style={{ fontSize: '11px', fontWeight: 800, background: T.primaryLt, color: T.primary, padding: '6px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>{profile.role.replace('_', ' ')}</span>
                       <span style={{ fontSize: '11px', fontWeight: 800, background: T.successLt, color: T.success, padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={12} /> Elite Staff</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                       <div style={{ color: T.txt2, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}><Phone size={14} /> {profile.phone || 'No Phone'}</div>
                       <div style={{ color: T.txt3, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}><Calendar size={14} /> Since {new Date(profile.created_at).toLocaleDateString()}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Widgets Grid */}
        <div style={{ padding: '0 16px 32px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div style={{ background: metrics?.currentDebt > 0 ? T.dangerLt : T.successLt, borderRadius: '28px', padding: '24px', border: `1px solid ${metrics?.currentDebt > 0 ? T.danger : T.success}15` }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: metrics?.currentDebt > 0 ? T.danger : T.success, textTransform: 'uppercase', marginBottom: '4px' }}>Unremitted Cash</div>
                 <div style={{ fontSize: '24px', fontWeight: 900, color: metrics?.currentDebt > 0 ? T.danger : T.success }}>{fmtRaw(metrics?.currentDebt || 0)}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '28px', padding: '24px', border: `1px solid ${T.border}` }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Total Remitted</div>
                 <div style={{ fontSize: '24px', fontWeight: 900 }}>{fmtRaw(metrics?.totalRemitted || 0)}</div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: T.success, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> {fmtRaw(metrics?.totalSales || 0)} All-time</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '28px', padding: '24px', border: `1px solid ${T.border}` }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>System Actions</div>
                 <div style={{ fontSize: '24px', fontWeight: 900 }}>{metrics?.actionCount || 0}</div>
              </div>
           </div>
        </div>

        {/* Productivity Chart */}
        <div style={{ padding: '0 16px 32px' }}>
           <div style={{ background: '#fff', borderRadius: T.radius, padding: '32px', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Productivity Intelligence</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: T.txt3, fontWeight: 700 }}>Telemetry from last 14 active days</p>
                 </div>
                 <div style={{ background: T.primaryLt, color: T.primary, padding: '8px 16px', borderRadius: '16px', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> LIVE FEED
                 </div>
              </div>
              <div style={{ height: '240px', width: '100%', marginBottom: '20px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.dailyTrend || []}>
                       <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={T.primary} stopOpacity={0.2}/>
                             <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="date" hide />
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} />
                       <Area type="monotone" dataKey="volume" stroke={T.primary} strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Activity & Remissions */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
           <div>
              <h3 style={{ margin: '0 0 16px 8px', fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Database size={18} /> Heartbeat</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {activities.map((a, idx) => (
                   <div key={idx} style={{ background: '#fff', padding: '16px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: a._type === 'SALE' ? T.successLt : T.warnLt, color: a._type === 'SALE' ? T.success : T.warn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Zap size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '13px', fontWeight: 800 }}>{a._title}</div>
                         <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>{new Date(a._date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 900 }}>{a._type === 'SALE' ? fmtRaw(a._val) : `${a._val} U`}</div>
                   </div>
                 ))}
              </div>
           </div>
           <div>
              <h3 style={{ margin: '0 0 16px 8px', fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}><Wallet size={18} /> Remissions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {remissions.map((r, idx) => (
                   <div key={idx} style={{ background: '#fff', padding: '16px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: T.primaryLt, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Wallet size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '13px', fontWeight: 800 }}>Cash Remitted</div>
                         <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>{new Date(r.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.success }}>{fmtRaw(r.amount)}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Action Button Drawer */}
        <div style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', display: 'flex', gap: '12px', zIndex: 10 }}>
           <button onClick={() => fetchData()} style={{ flex: 1, padding: '16px', borderRadius: '20px', background: '#fff', border: `1.5px solid ${T.border}`, fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: T.shadow }}><History size={18} /> History</button>
           <button style={{ flex: 1, padding: '16px', borderRadius: '20px', background: T.txt, color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}><CreditCard size={18} /> ID Card</button>
        </div>

        {/* EDIT MODAL */}
        <AnimatePresence>
           {isEditing && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                   style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)' }}>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Update Personnel</h3>
                      <button onClick={() => setIsEditing(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '12px' }}><X size={20} /></button>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <input type="text" placeholder="Full Name" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} 
                        style={{ width: '100%', padding: '16px', background: '#f8fafc', border: `1.5px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700 }} />
                      
                      <input type="text" placeholder="Phone Number" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} 
                        style={{ width: '100%', padding: '16px', background: '#f8fafc', border: `1.5px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700 }} />
                      
                      <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value as UserRole})}
                        style={{ width: '100%', padding: '16px', background: '#f8fafc', border: `1.5px solid ${T.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: 700 }}>
                          <option value="MANAGER">Manager</option>
                          <option value="STORE_KEEPER">Store Keeper</option>
                          <option value="SUPPLIER">Supplier</option>
                          <option value="CUSTOMER">Customer</option>
                      </select>

                      <div style={{ background: T.warnLt, padding: '16px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                         <AlertCircle size={18} color={T.warn} />
                         <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Role changes affect system access immediately.</p>
                      </div>

                      <button onClick={handleSave} disabled={isSaving}
                         style={{ marginTop: '12px', width: '100%', padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontSize: '16px', fontWeight: 900 }}>
                         {isSaving ? 'Synchronizing...' : 'Save Changes'}
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
