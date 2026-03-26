import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, QrCode, Search,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../store/AuthContext';
import { AnimatedPage } from './AnimatedPage';

/* ─────────────────────────────────────────
   TOKENS & STYLES (Match ManagerDashboard)
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

/* ─────────────────────────────────────────
   HELPER: Status Resolver
───────────────────────────────────────── */
const getStatusLabel = (lastActive?: string) => {
  if (!lastActive) return { label: 'Inactive', color: T.txt3, live: false };
  const diff = Date.now() - new Date(lastActive).getTime();
  if (diff < 300000) return { label: 'Online', color: T.success, live: true };
  if (diff < 3600000) return { label: 'Recent', color: T.warn, live: false };
  return { label: 'Offline', color: T.txt3, live: false };
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  
  // Modals
  const [idCardUser, setIdCardUser] = useState<any>(null);
  const [payStaffUser, setPayStaffUser] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) setProfiles(profs);

      // Aggregate Metrics for everyone
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [txRes, logRes] = await Promise.all([
        supabase.from('transactions').select('supplierId, totalPrice, date').gte('date', sevenDaysAgo.toISOString()),
        supabase.from('inventory_logs').select('createdBy, quantity, created_at').gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const stats: Record<string, any> = {};
      profs?.forEach(p => {
         const pTxs = txRes.data?.filter(t => t.supplierId === p.id) || [];
         const pLogs = logRes.data?.filter(l => l.createdBy === p.id) || [];
         
         stats[p.id] = {
            totalVolume: pTxs.reduce((s,c) => s + (c.totalPrice || 0), 0) + pLogs.reduce((s,c) => s + (c.quantity || 0), 0),
            lastActive: pTxs[0]?.date || pLogs[0]?.created_at || null
         };
      });
      setMetrics(stats);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredStaff = profiles.filter(p => {
    const matchSearch = (p.full_name || p.email).toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleProcessPayment = async () => {
    if (!payStaffUser) return;
    setIsPaying(true);
    await supabase.from('expenses').insert({
       amount: 0,
       description: `Salary/Wage Payment to ${payStaffUser.full_name || payStaffUser.email}`,
       category: 'STAFF_WAGES',
       date: new Date().toISOString()
    });
    setTimeout(() => {
       setIsPaying(false);
       setPayStaffUser(null);
    }, 1000);
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: T.txt3, fontWeight: 900 }}>Synchronizing HR Systems...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em' }}>Staff Roles</h1>
              <div style={{ fontSize: '13px', color: T.txt3, fontWeight: 700 }}>{profiles.length} Active Personnel</div>
           </div>
           <button style={{ background: T.primary, color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '16px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 10px 20px ${T.primary}30` }}>
              <UserPlus size={18} /> New Staff
           </button>
        </div>

        {/* Global Search */}
        <div style={{ padding: '0 16px 24px' }}>
           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.txt3 }} size={20} />
              <input 
                 type="text" 
                 placeholder="Search by name or email..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '18px', border: `1.5px solid ${T.border}`, background: T.surface, fontSize: '14px', fontWeight: 700, outline: 'none' }} 
              />
           </div>
        </div>

        {/* Tab Filter */}
        <div style={{ padding: '0 16px 24px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
           {(['ALL', 'SUPPLIER', 'STORE_KEEPER', 'MANAGER'] as const).map(r => (
             <button key={r} onClick={() => setRoleFilter(r)} 
                style={{ whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: '14px', border: 'none', background: roleFilter === r ? T.primary : 'rgba(0,0,0,0.05)', color: roleFilter === r ? '#fff' : T.txt2, fontSize: '12px', fontWeight: 800 }}>
                {r === 'ALL' ? 'Directory' : r.replace('_', ' ')}
             </button>
           ))}
        </div>

        {/* Compact Grid */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
            {filteredStaff.map((p) => {
               const perf = metrics[p.id];
               const status = getStatusLabel(perf?.lastActive);
               
               return (
                 <motion.div layout key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => navigate(`/manager/staff/${p.id}`)}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '24px', padding: '16px', boxShadow: T.shadow, cursor: 'pointer', textAlign: 'center', position: 'relative' }}>
                    
                    <div style={{ width: '60px', height: '60px', margin: '0 auto 12px', borderRadius: '20px', background: T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                       <span style={{ fontSize: '24px', fontWeight: 900, color: T.primary }}>{p.full_name?.charAt(0) || p.email.charAt(0).toUpperCase()}</span>
                       {status.live && <div style={{ position: 'absolute', bottom: -2, right: -2, width: '14px', height: '14px', background: T.success, borderRadius: '50%', border: `3px solid ${T.surface}` }} />}
                    </div>

                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.txt }}>{p.full_name || p.email.split('@')[0]}</h3>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: '2px' }}>{p.role.replace('_', ' ')}</div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
                       <button onClick={(e) => { e.stopPropagation(); setIdCardUser(p); }} style={{ flex: 1, padding: '8px', borderRadius: '10px', background: T.primaryLt, color: T.primary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={14} />
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); setPayStaffUser(p); }} style={{ flex: 1, padding: '8px', borderRadius: '10px', background: T.successLt, color: T.success, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Banknote size={14} />
                       </button>
                    </div>
                 </motion.div>
               );
            })}
            </AnimatePresence>
        </div>

        {/* Modal: ID Card */}
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
                  <h3 style={{ margin: '16px 0 4px', fontSize: '24px', fontWeight: 900 }}>{idCardUser.full_name || 'Staff Member'}</h3>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>{idCardUser.role.replace('_', ' ')}</p>
                  
                  <div style={{ margin: '32px auto', padding: '12px', background: '#f8fafc', borderRadius: '24px', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                     <QRCode value={`id:${idCardUser.id}`} size={130} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}> Bakery Org ID • {idCardUser.id.substring(0,8)}...</div>
                  <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                     <button onClick={() => setIdCardUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#1e293b', color: '#fff', border: 'none', fontWeight: 800 }}>Close Drawer</button>
                  </div>
               </motion.div>
            </div>
          )}
          
          {payStaffUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayStaffUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />
               <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                 style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '28px', padding: '32px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: T.successLt, color: T.success, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                     <Banknote size={32} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900 }}>Process Payment</h3>
                  <p style={{ margin: '0 0 24px', fontSize: '14px', color: T.txt3, fontWeight: 700 }}>Log a salary or wage payment to {payStaffUser.full_name || payStaffUser.email}.</p>
                  <button onClick={handleProcessPayment} disabled={isPaying} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900 }}>
                     {isPaying ? 'Processing...' : 'Confirm & Log Payment'}
                  </button>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default UserManagement;
