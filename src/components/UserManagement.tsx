import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { 
  Shield, ArrowLeft, Search, 
  Banknote, Mail
} from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

interface StaffMetric {
  userId: string;
  totalVolume: number; // For suppliers: Sales amount. For store: Quantity handled.
  actionCount: number;
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
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) setProfiles(profs);

      // 2. Fetch Performance Metrics (Last 7 Days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sinceISO = sevenDaysAgo.toISOString();

      const [txRes, invRes] = await Promise.all([
        supabase.from('transactions').select('supplierId, totalPrice').gte('date', sinceISO),
        supabase.from('inventory_logs').select('createdBy, quantity').gte('created_at', sinceISO)
      ]);

      const newMetrics: Record<string, StaffMetric> = {};

      // Calculate Supplier Performance
      txRes.data?.forEach(tx => {
        if (!tx.supplierId) return;
        if (!newMetrics[tx.supplierId]) newMetrics[tx.supplierId] = { userId: tx.supplierId, totalVolume: 0, actionCount: 0 };
        newMetrics[tx.supplierId].totalVolume += tx.totalPrice;
        newMetrics[tx.supplierId].actionCount += 1;
      });

      // Calculate Store Keeper Performance
      invRes.data?.forEach(log => {
        if (!log.createdBy) return;
        if (!newMetrics[log.createdBy]) newMetrics[log.createdBy] = { userId: log.createdBy, totalVolume: 0, actionCount: 0 };
        newMetrics[log.createdBy].totalVolume += log.quantity;
        newMetrics[log.createdBy].actionCount += 1;
      });

      setMetrics(newMetrics);
    } catch (e) {
      console.error('Performance fetch error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaffData(); }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setEditRoleUser(null);
      fetchStaffData();
    } else {
      alert('Error updating role: ' + error.message);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStaffUser || !payAmount) return;

    try {
      // Log as a Manager Expense
      const { error } = await supabase.from('expenses').insert([{
        amount: parseFloat(payAmount),
        category: 'Salary/Wages',
        description: `Salary payment for ${payStaffUser.full_name || payStaffUser.email}. ${payNotes}`,
        type: 'MANAGER',
        date: new Date().toISOString()
      }]);

      if (error) throw error;
      alert(`Payment of ₦${parseFloat(payAmount).toLocaleString()} logged successfully.`);
      setPayStaffUser(null);
      setPayAmount('');
      setPayNotes('');
    } catch (err: any) {
      alert('Payment logging failed: ' + err.message);
    }
  };

  const filteredStaff = useMemo(() => {
    return profiles.filter(p => {
      const matchQuery = (p.full_name || '').toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase());
      const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [profiles, query, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      suppliers: profiles.filter(p => p.role === 'SUPPLIER').length,
      storeKeepers: profiles.filter(p => p.role === 'STORE_KEEPER').length,
      unassigned: profiles.filter(p => p.role === 'CUSTOMER').length
    };
  }, [profiles]);

  if (loading && profiles.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: T.txt3, fontWeight: 800 }}>Loading Staff records...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, padding: '16px 16px 100px', color: T.txt, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => navigate(-1)} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '10px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, cursor: 'pointer', boxShadow: T.shadow }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Organization Staff</h1>
            <p style={{ fontSize: '12px', color: T.txt3, fontWeight: 600, margin: 0 }}>Management & Identity Control</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
           <div style={{ background: T.primary, color: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.3)' }}>
              <UsersIcon size={24} style={{ opacity: 0.2, position: 'absolute', right: '15%', top: '15%' }} />
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Total Personnel</div>
              <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{stats.total}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '8px', opacity: 0.9 }}>{stats.unassigned} Pending Assignment</div>
           </div>
           
           <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Suppliers</span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: T.txt }}>{stats.suppliers}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', left: 0, top: 0, width: `${(stats.suppliers/stats.total)*100}%`, background: T.primary, borderRadius: '2px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                 <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Store Keepers</span>
                 <span style={{ fontSize: '11px', fontWeight: 900, color: T.txt }}>{stats.storeKeepers}</span>
              </div>
           </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
           {(['ALL', 'MANAGER', 'SUPPLIER', 'STORE_KEEPER', 'CUSTOMER'] as const).map(r => (
             <button key={r} onClick={() => setRoleFilter(r)} 
               style={{ 
                 whiteSpace: 'nowrap', padding: '10px 16px', borderRadius: '14px', border: roleFilter === r ? 'none' : `1px solid ${T.border}`, 
                 background: roleFilter === r ? T.primary : T.surface, color: roleFilter === r ? '#fff' : T.txt2, 
                 fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: roleFilter === r ? T.shadow : 'none' 
               }}>
               {r === 'ALL' ? 'Everyone' : r.replace('_', ' ')}
             </button>
           ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
           <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
           <input type="text" placeholder="Search by name or email..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 16px 16px 48px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', fontSize: '14px', fontWeight: 600, outline: 'none', boxShadow: T.shadow }} />
        </div>

        {/* Staff List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {filteredStaff.map(profile => {
             const perf = metrics[profile.id];
             const isMe = profile.role === 'MANAGER'; // Simplified

             return (
               <motion.div layout key={profile.id} 
                  style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '24px', padding: '18px', boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                     <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${T.primary}20` }}>
                           <span style={{ fontSize: '18px', fontWeight: 900, color: T.primary }}>{profile.full_name?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                           <div style={{ fontSize: '16px', fontWeight: 800, color: T.txt }}>{profile.full_name || 'Incomplete Profile'}</div>
                           <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {profile.email}
                           </div>
                        </div>
                     </div>
                     <span style={{ fontSize: '10px', fontWeight: 800, color: profile.role === 'CUSTOMER' ? T.warn : T.primary, background: profile.role === 'CUSTOMER' ? T.warnLt : T.primaryLt, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${profile.role === 'CUSTOMER' ? T.warn : T.primary}20` }}>
                        {profile.role.replace('_', ' ')}
                     </span>
                  </div>

                  {/* Performance Indicators */}
                  {(profile.role === 'SUPPLIER' || profile.role === 'STORE_KEEPER') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '16px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>7D Performance</p>
                          <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 900, color: T.success }}>
                             {profile.role === 'SUPPLIER' ? `₦${(perf?.totalVolume || 0).toLocaleString()}` : `${(perf?.totalVolume || 0)} Units`}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Action Count</p>
                          <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 900, color: T.primary }}>{perf?.actionCount || 0} Transactions</p>
                        </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${T.border}`, paddingTop: '16px' }}>
                     {!isMe && (
                       <>
                         <button onClick={() => setPayStaffUser(profile)} 
                            style={{ flex: 1, background: T.success, color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Banknote size={14} /> Pay Staff
                         </button>
                         <button onClick={() => setEditRoleUser(profile)} 
                            style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, color: T.txt2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Shield size={14} /> Permissions
                         </button>
                       </>
                     )}
                     {isMe && <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Executive Account (Self)</div>}
                  </div>
               </motion.div>
             );
           })}
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {editRoleUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditRoleUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 style={{ position: 'relative', background: T.surface, width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>Assign Role</h3>
                  <p style={{ fontSize: '13px', color: T.txt3, marginBottom: '24px' }}>Change permissions for {editRoleUser.full_name || editRoleUser.email}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(['CUSTOMER', 'SUPPLIER', 'STORE_KEEPER', 'MANAGER'] as UserRole[]).map(role => (
                      <button key={role} onClick={() => handleRoleChange(editRoleUser.id, role)}
                        style={{ padding: '16px', borderRadius: '16px', border: editRoleUser.role === role ? `2px solid ${T.primary}` : `1px solid ${T.border}`, background: editRoleUser.role === role ? T.primaryLt : 'none', textAlign: 'left', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 800, color: editRoleUser.role === role ? T.primary : T.txt }}>{role.replace('_', ' ')}</div>
                        <div style={{ fontSize: '11px', color: T.txt3 }}>{role === 'SUPPLIER' ? 'Handles bread delivery and collection.' : role === 'STORE_KEEPER' ? 'Records incoming product from bakery.' : role === 'MANAGER' ? 'Full administrative access.' : 'A customer account.'}</div>
                      </button>
                    ))}
                  </div>
               </motion.div>
            </div>
          )}

          {payStaffUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayStaffUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 style={{ position: 'relative', background: T.surface, width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                     <div style={{ background: T.successLt, padding: '12px', borderRadius: '14px' }}><Banknote color={T.success} size={24} /></div>
                     <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Pay Staff</h3>
                  </div>

                  <form onSubmit={handleProcessPayment}>
                     <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Amount to Pay ₦</label>
                        <input type="number" required autoFocus value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00"
                           style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, fontSize: '24px', fontWeight: 900, outline: 'none' }} />
                     </div>
                     <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Internal Note (Optional)</label>
                        <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="e.g. Month ends bonus..."
                           style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, fontSize: '14px', fontWeight: 600, minHeight: '80px', fontFamily: 'inherit' }} />
                     </div>
                     <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setPayStaffUser(null)} style={{ flex: 1, background: 'none', border: `1px solid ${T.border}`, padding: '16px', borderRadius: '18px', fontWeight: 800, color: T.txt2 }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, background: T.success, color: '#fff', border: 'none', padding: '16px', borderRadius: '18px', fontWeight: 900 }}>Process Payment</button>
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

// Simple Icon fallback
const UsersIcon = ({ size, style }: any) => (
  <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default UserManagement;
