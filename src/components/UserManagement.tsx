import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { 
  Shield, ArrowLeft, Search, 
  Banknote, 
  Phone, MessageSquare, 
  Award, QrCode, Share2,
  Zap, Clock
} from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import QRCode from 'react-qr-code';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string;
  role: UserRole;
  created_at: string;
}

interface StaffMetric {
  userId: string;
  totalVolume: number; // For suppliers: Sales amount. For store: Quantity handled.
  actionCount: number;
  lastActive: string | null;
  dailyTrend: { date: string, volume: number }[];
}

/* ─────────────────────────────────────────
   TOKENS & STYLES (Premium Gray/Indigo)
───────────────────────────────────────── */
const T = {
  bg:        'var(--background-color)',
  surface:   'var(--surface-color)',
  border:    'var(--border-color)',
  primary:   '#6366f1', // Indigo
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

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;
const getStatusLabel = (lastActive: string | null) => {
  if (!lastActive) return { label: 'Inactive', color: T.txt3, live: false };
  const diff = Date.now() - new Date(lastActive).getTime();
  if (diff < 1000 * 60 * 15) return { label: 'Online Now', color: T.success, live: true };
  if (diff < 1000 * 60 * 60 * 2) return { label: 'Active recently', color: T.primary, live: false };
  return { label: `Seen ${new Date(lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, color: T.txt3, live: false };
};

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [metrics, setMetrics] = useState<Record<string, StaffMetric>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Modals
  const [editRoleUser, setEditRoleUser] = useState<Profile | null>(null);
  const [payStaffUser, setPayStaffUser] = useState<Profile | null>(null);
  const [idCardUser, setIdCardUser] = useState<Profile | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) setProfiles(profs);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sinceISO = sevenDaysAgo.toISOString();

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('supplierId, totalPrice, date').gte('date', sinceISO).order('date', { ascending: true }),
        supabase.from('inventory_logs').select('createdBy, quantity, created_at').gte('created_at', sinceISO).order('created_at', { ascending: true })
      ]);

      const newMetrics: Record<string, StaffMetric> = {};

      const initM = (id: string) => {
        if (!newMetrics[id]) newMetrics[id] = { userId: id, totalVolume: 0, actionCount: 0, lastActive: null, dailyTrend: [] };
      };

      txRes.data?.forEach(tx => {
        if (!tx.supplierId) return;
        initM(tx.supplierId);
        newMetrics[tx.supplierId].totalVolume += tx.totalPrice;
        newMetrics[tx.supplierId].actionCount += 1;
        newMetrics[tx.supplierId].lastActive = tx.date;
        
        const date = tx.date.split('T')[0];
        const dayTrend = newMetrics[tx.supplierId].dailyTrend;
        const existing = dayTrend.find(d => d.date === date);
        if (existing) existing.volume += tx.totalPrice;
        else dayTrend.push({ date, volume: tx.totalPrice });
      });

      invRes.data?.forEach(log => {
        if (!log.createdBy) return;
        initM(log.createdBy);
        newMetrics[log.createdBy].totalVolume += log.quantity;
        newMetrics[log.createdBy].actionCount += 1;
        if (!newMetrics[log.createdBy].lastActive || new Date(log.created_at) > new Date(newMetrics[log.createdBy].lastActive!)) {
           newMetrics[log.createdBy].lastActive = log.created_at;
        }
        
        const date = log.created_at.split('T')[0];
        const dayTrend = newMetrics[log.createdBy].dailyTrend;
        const existing = dayTrend.find(d => d.date === date);
        if (existing) existing.volume += log.quantity;
        else dayTrend.push({ date, volume: log.quantity });
      });

      setMetrics(newMetrics);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaffData(); }, []);

  const topPerformer = useMemo(() => {
    let best: Profile | null = null;
    let max = 0;
    for (const p of profiles) {
      const vol = metrics[p.id]?.totalVolume || 0;
      if (vol > max) { max = vol; best = p; }
    }
    return best;
  }, [profiles, metrics]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!userId) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) { setEditRoleUser(null); fetchStaffData(); }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStaffUser || !payAmount) return;
    const { error } = await supabase.from('expenses').insert([{
      amount: parseFloat(payAmount), category: 'Salary/Wages', 
      description: `Salary for ${payStaffUser.full_name || payStaffUser.email}. ${payNotes}`,
      type: 'MANAGER', date: new Date().toISOString()
    }]);
    if (!error) { setPayStaffUser(null); setPayAmount(''); setPayNotes(''); alert("Payment Managed Successfully."); }
  };

  const filteredStaff = profiles.filter(p => {
    const matchQuery = (p.full_name || '').toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase());
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchQuery && matchRole;
  });

  const StatBox = ({ label, value, color }: any) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '20px', padding: '16px', boxShadow: T.shadow }}>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{label}</p>
      <div style={{ fontSize: '20px', fontWeight: 900, color }}>{value}</div>
    </div>
  );

  if (loading && profiles.length === 0) return <div style={{ padding: '60px', textAlign: 'center', fontWeight: 900, color: T.txt3 }}>Generating Organization Graph...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, padding: '16px 16px 120px', color: T.txt, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '10px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Organization Roles</h1>
          </div>
          <button style={{ width: '42px', height: '42px', borderRadius: '12px', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <Zap size={18} />
          </button>
        </div>

        {/* Top Performer Ribbon */}
        {topPerformer && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
             style={{ background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, borderRadius: '24px', padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden', border: 'none', color: '#fff' }}>
             <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><Award size={120} /></div>
             <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ background: T.gold, color: '#000', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', width: 'fit-content' }}>Weekly Hall of Fame</div>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{(topPerformer as any).full_name || (topPerformer as any).email.split('@')[0]}</h3>
                   <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>Leading production with {(metrics[(topPerformer as any).id] as any)?.actionCount || 0} actions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '24px', fontWeight: 900 }}>{(topPerformer as any).role === 'SUPPLIER' ? fmtRaw((metrics[(topPerformer as any).id] as any)?.totalVolume || 0) : `${(metrics[(topPerformer as any).id] as any)?.totalVolume || 0} Units`}</div>
                   <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>Total Throughput</div>
                </div>
             </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
           <StatBox label="Total Staff" value={profiles.length} />
           <StatBox label="Active Roles" value={profiles.filter(p => p.role !== 'CUSTOMER').length} color={T.primary} />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
           <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
           <input type="text" placeholder="Search organization..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', fontSize: '13px', fontWeight: 600, outline: 'none' }} />
        </div>

        {/* Tab Filter */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
           {(['ALL', 'SUPPLIER', 'STORE_KEEPER', 'MANAGER'] as const).map(r => (
             <button key={r} onClick={() => setRoleFilter(r)} 
                style={{ whiteSpace: 'nowrap', padding: '10px 16px', borderRadius: '14px', border: 'none', background: roleFilter === r ? T.primary : 'rgba(0,0,0,0.05)', color: roleFilter === r ? '#fff' : T.txt2, fontSize: '11px', fontWeight: 800 }}>
                {r === 'ALL' ? 'Total Graph' : r.replace('_', ' ')}
             </button>
           ))}
        </div>

        {/* Staff Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
           <AnimatePresence>
           {filteredStaff.map(p => {
             const perf = metrics[p.id];
             const status = getStatusLabel(perf?.lastActive);
             
             return (
               <motion.div layout key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => navigate(`/manager/staff/${p.id}`)}
                  style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '28px', padding: '20px', boxShadow: T.shadow, cursor: 'pointer' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                     <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                           <span style={{ fontSize: '20px', fontWeight: 900, color: T.primary }}>{p.full_name?.charAt(0) || p.email.charAt(0).toUpperCase()}</span>
                           {status.live && <div style={{ position: 'absolute', bottom: -2, right: -2, width: '14px', height: '14px', background: T.success, borderRadius: '50%', border: `3px solid ${T.surface}`, boxShadow: `0 0 10px ${T.success}80` }} />}
                        </div>
                        <div>
                           <div style={{ fontSize: '16px', fontWeight: 900, color: T.txt }}>{p.full_name || p.email.split('@')[0]}</div>
                           <div style={{ fontSize: '10px', fontWeight: 800, color: status.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} /> {status.label}
                           </div>
                        </div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); setIdCardUser(p); }} style={{ padding: '8px', borderRadius: '12px', background: T.primaryLt, color: T.primary, border: 'none' }}>
                        <QrCode size={18} />
                     </button>
                  </div>

                  {/* Sparkline & Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '20px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>7D Throughput</div>
                         <div style={{ fontSize: '16px', fontWeight: 900 }}>{p.role === 'SUPPLIER' ? fmtRaw(perf?.totalVolume || 0) : `${perf?.totalVolume || 0} Units`}</div>
                      </div>
                      <div style={{ flex: 1.5, height: '40px' }}>
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={(perf?.dailyTrend && perf.dailyTrend.length > 0) ? (perf.dailyTrend as any) : ([{ date: '', volume: 0 }, { date: '', volume: 0 }, { date: '', volume: 0 }] as any)}>
                               <Area type="monotone" dataKey="volume" stroke={T.primary} strokeWidth={2} fill={T.primary} fillOpacity={0.1} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                     <a href={`tel:${p.phone || ''}`} onClick={e => e.stopPropagation()} style={{ flex: 1, height: '36px', borderRadius: '12px', background: T.glass, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textDecoration: 'none', color: 'inherit' }}><Phone size={14} /> Call</a>
                     <a href={`https://wa.me/${p.phone?.replace(/[^0-9]/g, '') || ''}`} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" style={{ flex: 1, height: '36px', borderRadius: '12px', background: T.glass, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textDecoration: 'none', color: 'inherit' }}><MessageSquare size={14} /> Chat</a>
                     <button onClick={(e) => { e.stopPropagation(); navigate(`/manager/staff/${p.id}`); }} style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.glass, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={14} />
                     </button>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); setPayStaffUser(p); }} 
                     style={{ width: '100%', padding: '12px', borderRadius: '16px', background: T.txt, color: '#fff', border: 'none', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <Banknote size={16} /> Process Wages
                  </button>
               </motion.div>
             );
           })}
           </AnimatePresence>
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {idCardUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIdCardUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }} />
               <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }}
                 style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '340px', borderRadius: '32px', padding: '32px', textAlign: 'center', color: '#000', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: `linear-gradient(45deg, #1e293b, #4f46e5)` }} />
                  <div style={{ position: 'relative', marginTop: '30px' }}>
                     <div style={{ width: '100px', height: '100px', margin: '0 auto', borderRadius: '50%', border: '4px solid #fff', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#4f46e5' }}>
                        {idCardUser.full_name?.charAt(0) || idCardUser.email.charAt(0).toUpperCase()}
                     </div>
                  </div>
                  <h3 style={{ margin: '16px 0 4px', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em' }}>{idCardUser.full_name || 'Staff Member'}</h3>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>{idCardUser.role.replace('_', ' ')}</p>
                  
                  <div style={{ margin: '32px auto', padding: '16px', background: '#f8fafc', borderRadius: '24px', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                     <QRCode value={`id:${idCardUser.id}`} size={140} />
                  </div>
                  
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
                     Official Bakery Organization ID<br/>
                     UID: {idCardUser.id.substring(0,18)}...
                  </div>
                  
                  <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                     <button onClick={() => window.print()} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: '#f1f5f9', border: 'none', fontWeight: 800, fontSize: '13px' }}><Share2 size={16}/> Share</button>
                     <button onClick={() => setIdCardUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '16px', background: '#000', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px' }}>Close</button>
                  </div>
               </motion.div>
            </div>
          )}

          {editRoleUser && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditRoleUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  style={{ position: 'relative', background: T.surface, width: '100%', maxWidth: '360px', borderRadius: '28px', padding: '24px' }}>
                   <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>Update Permissions</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(['MANAGER', 'STORE_KEEPER', 'SUPPLIER', 'CUSTOMER'] as UserRole[]).map(rr => (
                        <button key={rr} onClick={() => handleRoleChange((editRoleUser as any).id, rr)} 
                          style={{ padding: '14px', borderRadius: '16px', border: (editRoleUser as any).role === rr ? `2px solid ${T.primary}` : `1px solid ${T.border}`, background: (editRoleUser as any).role === rr ? T.primaryLt : 'none', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>
                          {rr.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                </motion.div>
             </div>
          )}

          {payStaffUser && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayStaffUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  style={{ position: 'relative', background: T.surface, width: '100%', maxWidth: '380px', borderRadius: '28px', padding: '28px' }}>
                   <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900 }}>Disburse Wages</h3>
                   <p style={{ margin: '0 0 20px', fontSize: '12px', color: T.txt3 }}>Settling payment for {(payStaffUser as any).full_name || (payStaffUser as any).email}</p>
                   <form onSubmit={handleProcessPayment}>
                      <input type="number" required autoFocus value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="₦ 0.00" 
                        style={{ width: '100%', padding: '16px', borderRadius: '18px', border: `2px solid ${T.primary}`, background: T.bg, fontSize: '24px', fontWeight: 900, outline: 'none', marginBottom: '16px' }} />
                      <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Salary notes..." 
                        style={{ width: '100%', padding: '16px', borderRadius: '18px', border: `1px solid ${T.border}`, fontSize: '13px', minHeight: '80px', marginBottom: '24px', fontFamily: 'inherit' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <button type="button" onClick={() => setPayStaffUser(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: `1px solid ${T.border}`, background: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                         <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '16px', background: T.success, color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Send Payment</button>
                      </div>
                   </form>
                </motion.div>
             </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default UserManagement;
