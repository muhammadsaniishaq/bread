import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { 
  ArrowLeft, 
  Edit2, X,
  TrendingUp,
  Database, Wallet, History,
  Calendar, CreditCard,
  Activity,
  CheckCircle
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

/* ─────────────────────────────────────────
   V3 TOKENS (Match UserManagement)
───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd',
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  success:   '#10b981',
  danger:    '#f43f5e',
  warn:      '#f59e0b',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.05)',
  glass:     'rgba(255,255,255,0.8)',
  ink:       '#1e293b'
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
        ...txs.map(tx => ({ ...tx, _type: 'SALE', _date: tx.date, _val: tx.totalPrice, _title: `Market Sale` })),
        ...logs.map(log => ({ ...log, _type: 'INVENTORY', _date: log.created_at, _val: log.quantity, _title: `${log.type} Log` }))
      ].sort((a,b) => new Date(b._date).getTime() - new Date(a._date).getTime());

      setActivities(combinedActions.slice(0, 8));
      setRemissions(rems.slice(0, 5));

      const totalSales = txs.reduce((s,c) => s + (c.totalPrice || 0), 0);
      const totalRemitted = rems.reduce((s,c) => s + (c.amount || 0), 0);
      const currentDebt = totalSales - totalRemitted;

      const trendMap: Record<string, number> = {};
      combinedActions.forEach(a => {
        const d = a._date.split('T')[0];
        trendMap[d] = (trendMap[d] || 0) + a._val;
      });
      const dailyTrend = Object.keys(trendMap).sort().slice(-14).map(d => ({ date: d, volume: trendMap[d] }));

      setMetrics({ totalSales, totalRemitted, currentDebt, actionCount: combinedActions.length, dailyTrend });
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

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>LOADING BENTO...</div>;
  if (!profile) return <div style={{ padding: '40px', textAlign: 'center' }}>Staff not found.</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 NAVIGATION */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(253, 253, 253, 0.7)', backdropFilter: 'blur(16px)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${T.border}` }}>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '10px', borderRadius: '16px' }}><ArrowLeft size={18} /></motion.button>
           <h1 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: T.txt, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel Analytics</h1>
           <div style={{ marginLeft: 'auto' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(true)} style={{ background: T.ink, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '14px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Edit2 size={14} /> Update
              </motion.button>
           </div>
        </div>

        {/* BENTO GRID */}
        <div style={{ padding: '24px 16px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
           
           {/* HOLOGRAPHIC IDENTITY */}
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              style={{ background: `linear-gradient(135deg, ${T.ink}, #2d3748)`, borderRadius: T.radius, padding: '40px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center' }}>
                 <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ fontSize: '36px', fontWeight: 900 }}>{profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}</span>
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ color: T.success, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}><CheckCircle size={10} /> Verified Personnel</div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em' }}>{profile.full_name || 'Personnel'}</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                       <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 12px', borderRadius: '10px' }}>{profile.role.replace('_', ' ')}</span>
                       <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', padding: '6px 0' }}><Calendar size={10} /> Sync since {new Date(profile.created_at).getFullYear()}</span>
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* ANALYTICS BRICKS */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2', background: metrics?.currentDebt > 0 ? 'linear-gradient(135deg, #fff1f2, #fff)' : '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                 <div style={{ fontSize: '11px', fontWeight: 900, color: metrics?.currentDebt > 0 ? T.danger : T.success, textTransform: 'uppercase', marginBottom: '8px' }}>Account Standing</div>
                 <div style={{ fontSize: '32px', fontWeight: 900, color: T.txt }}>{fmtRaw(metrics?.currentDebt || 0)}</div>
                 <div style={{ fontSize: '13px', fontWeight: 600, color: T.txt3, marginTop: '16px' }}>Total Volume: {fmtRaw(metrics?.totalSales || 0)}</div>
              </div>

              <div style={{ background: '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                 <div style={{ color: T.success, marginBottom: '16px' }}><TrendingUp size={24} /></div>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Paid</div>
                 <div style={{ fontSize: '18px', fontWeight: 900 }}>{fmtRaw(metrics?.totalRemitted || 0)}</div>
              </div>

              <div style={{ background: '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                 <div style={{ color: T.primary, marginBottom: '16px' }}><Database size={24} /></div>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Logs</div>
                 <div style={{ fontSize: '18px', fontWeight: 900 }}>{metrics?.actionCount || 0}</div>
              </div>
           </div>
        </div>

        {/* CHART SECTION */}
        <div style={{ padding: '0 16px 16px' }}>
           <div style={{ background: '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Throughput Trends</h3>
                 <Activity size={18} color={T.primary} />
              </div>
              <div style={{ height: '200px', width: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.dailyTrend || []}>
                       <defs><linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.primary} stopOpacity={0.1}/><stop offset="95%" stopColor={T.primary} stopOpacity={0}/></linearGradient></defs>
                       <XAxis dataKey="date" hide />
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="volume" stroke={T.primary} strokeWidth={3} fill="url(#colorTrend)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* DATA STREAMS */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
           
           {/* Heartbeat */}
           <div style={{ background: '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 900, color: T.txt2 }}><History size={16} /> Heartbeat</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {activities.map((a, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, paddingBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{a._title}</div>
                      <div style={{ fontSize: '13px', fontWeight: 900 }}>{a._type === 'SALE' ? fmtRaw(a._val) : a._val}</div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Remissions */}
           <div style={{ background: '#fff', borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 900, color: T.txt2 }}><Wallet size={16} /> Remission Ledger</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {remissions.map((r, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, paddingBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>Cash Remitted</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: T.success }}>{fmtRaw(r.amount)}</div>
                   </div>
                 ))}
                 {remissions.length === 0 && <div style={{ fontSize: '12px', color: T.txt3, textAlign: 'center' }}>No recent remissions.</div>}
              </div>
           </div>

        </div>

        {/* FLOATING BAR */}
        <div style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', display: 'flex', gap: '12px' }}>
           <motion.button whileTap={{ scale: 0.95 }} style={{ flex: 1, padding: '16px', borderRadius: '20px', background: T.ink, color: '#fff', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CreditCard size={18} /> Digital Badge</motion.button>
        </div>

        {/* EDIT OVERLAY */}
        <AnimatePresence>
           {isEditing && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }} />
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                   style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Edit Identity</h3>
                      <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'none' }}><X size={20} /></button>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <input type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#f8fafc', fontWeight: 700 }} />
                      <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#f8fafc', fontWeight: 700 }} />
                      <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value as UserRole})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#f8fafc', fontWeight: 700 }}>
                          <option value="MANAGER">Manager</option>
                          <option value="STORE_KEEPER">Store Keeper</option>
                          <option value="SUPPLIER">Supplier</option>
                          <option value="CUSTOMER">Customer</option>
                      </select>
                      <button onClick={handleSave} disabled={isSaving} style={{ padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900 }}>{isSaving ? 'Syncing...' : 'Save Changes'}</button>
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
