import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, QrCode, Search,
  Banknote, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../store/AuthContext';
import { AnimatedPage } from './AnimatedPage';

/* ─────────────────────────────────────────
   V3 DESIGN TOKENS (SaaS / Fintech)
───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.15)',
  success:   '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.1)',
  danger:    '#f43f5e',
  warn:      '#f59e0b',
  txt:       '#0f172a',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  radius:    '28px',
  shadow:    '0 10px 40px -10px rgba(0,0,0,0.05)',
  glass:     'rgba(255,255,255,0.7)',
  ink:       '#1e293b',
  gold:      '#fbbf24'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

/* ─────────────────────────────────────────
   PULSE STATUS INDICATOR
───────────────────────────────────────── */
const LivePulse: React.FC<{ active: boolean }> = ({ active }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? T.success : T.txt3 }} />
     {active && (
       <motion.div 
         initial={{ scale: 0.8, opacity: 0.8 }}
         animate={{ scale: 2.2, opacity: 0 }}
         transition={{ duration: 1.5, repeat: Infinity }}
         style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: T.success }}
       />
     )}
  </div>
);

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

  useEffect(() => { fetchStaffData(); }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) setProfiles(profs);

      const [txRes, logRes] = await Promise.all([
        supabase.from('transactions').select('supplierId, price:totalPrice, date').gte('date', new Date(Date.now() - 604800000).toISOString()),
        supabase.from('inventory_logs').select('createdBy, quantity, created_at').gte('created_at', new Date(Date.now() - 604800000).toISOString())
      ]);

      const stats: Record<string, any> = {};
      profs?.forEach(p => {
         const pTxs = txRes.data?.filter(t => t.supplierId === p.id) || [];
         const pLogs = logRes.data?.filter(l => l.createdBy === p.id) || [];
         stats[p.id] = {
            totalVolume: pTxs.reduce((s,c) => s + (c.price || 0), 0) + pLogs.reduce((s,c) => s + (c.quantity || 0), 0),
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

  const onlineCount = profiles.filter(p => {
    const last = metrics[p.id]?.lastActive;
    return last && (Date.now() - new Date(last).getTime() < 300000);
  }).length;

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>INITIALIZING HR...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 FLOAT HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '24px 16px 12px', background: 'rgba(253, 253, 253, 0.8)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                 <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.06em', color: T.txt }}>Staff Roles</h1>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: T.success }}>
                       <LivePulse active={true} /> {onlineCount} Live
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: T.txt3 }}>{profiles.length} Total</span>
                 </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} style={{ background: T.ink, color: '#fff', border: 'none', width: '48px', height: '48px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <UserPlus size={20} />
              </motion.button>
           </div>

           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.txt3 }} size={18} />
              <input 
                 type="text" placeholder="Search team..." 
                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '20px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, outline: 'none' }} 
              />
           </div>
        </div>

        {/* TOP METRICS */}
        <div style={{ padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
           <div style={{ background: T.primary, padding: '24px', borderRadius: '24px', color: '#fff' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Global Yield (7D)</div>
              <div style={{ fontSize: '32px', fontWeight: 900 }}>{fmtRaw(Object.values(metrics).reduce((s,c) => s + (c.totalVolume || 0), 0))}</div>
           </div>
        </div>

        {/* ROLE SEGMENTED CONTROL */}
        <div style={{ padding: '0 16px 24px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
           {(['ALL', 'SUPPLIER', 'STORE_KEEPER', 'MANAGER'] as const).map(r => (
             <button key={r} onClick={() => setRoleFilter(r)} 
                style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '14px', background: roleFilter === r ? T.ink : 'transparent', color: roleFilter === r ? '#fff' : T.txt2, fontSize: '12px', fontWeight: 800, border: roleFilter === r ? 'none' : `1px solid ${T.border}` }}>
                {r === 'ALL' ? 'Directory' : r.replace('_', ' ')}
             </button>
           ))}
        </div>

        {/* PERSONNEL DIRECTORY */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence mode="popLayout">
            {filteredStaff.map((p) => {
               const perf = metrics[p.id];
               const isOnline = perf?.lastActive && (Date.now() - new Date(perf.lastActive).getTime() < 300000);
               
               return (
                 <motion.div layout key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => navigate(`/manager/staff/${p.id}`)}
                    style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: '20px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                    
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <span style={{ fontSize: '18px', fontWeight: 900, color: T.primary }}>{p.full_name?.charAt(0) || p.email.charAt(0).toUpperCase()}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: T.txt }}>{p.full_name || p.email.split('@')[0]}</h3>
                          <LivePulse active={!!isOnline} />
                       </div>
                       <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginTop: '2px' }}>{p.role.replace('_', ' ')}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                       <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setIdCardUser(p); }} style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', color: T.txt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={16} />
                       </motion.button>
                       <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setPayStaffUser(p); }} style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.successGlow, color: T.success, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Banknote size={16} />
                       </motion.button>
                       <div style={{ width: '20px', display: 'flex', justifyContent: 'flex-end', color: T.txt3 }}>
                          <ChevronRight size={18} />
                       </div>
                    </div>
                 </motion.div>
               );
            })}
            </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {idCardUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIdCardUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }} />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                 style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '340px', borderRadius: '40px', padding: '32px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 900 }}>Staff Badge</h3>
                  <div style={{ margin: '0 auto 24px', padding: '20px', background: '#f8fafc', borderRadius: '32px', width: 'min-content', border: `2px solid ${T.border}` }}>
                     <QRCode value={`id:${idCardUser.id}`} size={160} />
                  </div>
                  <button onClick={() => setIdCardUser(null)} style={{ width: '100%', padding: '16px', borderRadius: '20px', background: T.ink, color: '#fff', border: 'none', fontWeight: 900 }}>Close Badge</button>
               </motion.div>
            </div>
          )}
          
          {payStaffUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPayStaffUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />
               <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                 style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900 }}>Authorize Wages</h3>
                  <p style={{ margin: '0 0 24px', fontSize: '14px', color: T.txt2 }}>Recording payout for {payStaffUser.full_name || payStaffUser.email}</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <button onClick={() => setPayStaffUser(null)} style={{ flex: 1, padding: '16px', borderRadius: '18px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>Cancel</button>
                     <button onClick={async () => {
                        setIsPaying(true);
                        await supabase.from('expenses').insert({ amount: 0, description: `Wage Account: ${payStaffUser.full_name || payStaffUser.email}`, category: 'STAFF_WAGES', date: new Date().toISOString() });
                        setTimeout(() => { setIsPaying(false); setPayStaffUser(null); }, 800);
                     }} disabled={isPaying} style={{ flex: 1.5, padding: '16px', borderRadius: '18px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900 }}>
                        {isPaying ? 'Synchronizing...' : 'Commit Vault'}
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

export default UserManagement;
