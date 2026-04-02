import React, { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, Search, ChevronRight, UserCircle, Phone, Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const T = {
  bg: '#f8f7ff', white: '#ffffff', primary: '#7c3aed', pLight: 'rgba(124,58,237,0.08)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)', rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)', blue: '#2563eb', blueL: 'rgba(37,99,235,0.10)',
  ink: '#1a0a3b', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '18px', shadow: '0 4px 20px rgba(124,58,237,0.08)',
};

const roleColors: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  MANAGER:      { color: T.primary,  bg: T.pLight,   label: 'Manager',      icon: '🛡️' },
  SUPPLIER:     { color: T.amber,    bg: T.amberL,   label: 'Supplier',     icon: '📦' },
  STORE_KEEPER: { color: T.blue,     bg: T.blueL,    label: 'Store Keeper', icon: '🏪' },
  CUSTOMER:     { color: T.emerald,  bg: T.emeraldL, label: 'Customer',     icon: '👤' },
  ADMIN:        { color: T.rose,     bg: T.roseL,    label: 'Admin',        icon: '⚡' },
};

interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  role: string;
  created_at?: string;
}

const ManagerStaffProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, role, created_at')
      .order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchRole = filterRole === 'ALL' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 50%, #4c1d95 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.2 }}
              style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'rgba(196,181,253,0.5)', top: `${10 + i * 14}%`, left: `${5 + i * 14}%`, pointerEvents: 'none' }} />
          ))}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircle size={20} color="#c4b5fd" />
                </div>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Staff Profiles</h1>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>{profiles.length} registered accounts</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={fetchProfiles}
                style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <RefreshCw size={15} />
              </motion.button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '13px', color: 'rgba(255,255,255,0.5)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone…"
                style={{ width: '100%', padding: '11px 12px 11px 35px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Role breakdown tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Object.entries(roleColors).filter(([key]) => (roleCounts[key] || 0) > 0).map(([role, cfg]) => (
              <motion.button key={role} whileTap={{ scale: 0.93 }} onClick={() => setFilterRole(filterRole === role ? 'ALL' : role)}
                style={{ padding: '10px 6px', borderRadius: '14px', background: filterRole === role ? cfg.color : T.white, border: `2px solid ${filterRole === role ? cfg.color : T.borderL}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: T.shadow }}>
                <div style={{ fontSize: '16px', marginBottom: '3px' }}>{cfg.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: filterRole === role ? '#fff' : T.ink }}>{roleCounts[role] || 0}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: filterRole === role ? 'rgba(255,255,255,0.8)' : T.txt3, textTransform: 'uppercase' }}>{cfg.label}</div>
              </motion.button>
            ))}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setFilterRole('ALL')}
              style={{ padding: '10px 6px', borderRadius: '14px', background: filterRole === 'ALL' ? T.primary : T.white, border: `2px solid ${filterRole === 'ALL' ? T.primary : T.borderL}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: T.shadow }}>
              <div style={{ fontSize: '16px', marginBottom: '3px' }}>👥</div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: filterRole === 'ALL' ? '#fff' : T.ink }}>{profiles.length}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: filterRole === 'ALL' ? 'rgba(255,255,255,0.8)' : T.txt3, textTransform: 'uppercase' }}>All</div>
            </motion.button>
          </div>

          {/* Profile cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.txt3, background: T.white, borderRadius: T.radius }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${T.pLight}`, borderTopColor: T.primary, margin: '0 auto 12px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Loading profiles...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.txt3, background: T.white, borderRadius: T.radius }}>
              <Users size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>No staff found.</div>
            </div>
          ) : filtered.map((p, i) => {
            const cfg = roleColors[p.role] || { color: T.txt3, bg: 'rgba(0,0,0,0.05)', label: p.role, icon: '👤' };
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/manager/staff/${p.id}`)}
                style={{ background: T.white, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, cursor: 'pointer' }}>
                {/* Top color strip based on role */}
                <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, ${T.primary})` }} />
                <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}, ${T.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {p.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name || 'Unnamed'}</div>
                      <ChevronRight size={15} color={T.txt3} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: cfg.color, background: cfg.bg, padding: '2px 7px', borderRadius: '5px' }}>{cfg.icon} {cfg.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '7px' }}>
                      {p.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} color={T.txt3} />
                          <span style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{p.phone}</span>
                        </div>
                      )}
                      {p.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                          <Mail size={10} color={T.txt3} />
                          <span style={{ fontSize: '11px', color: T.txt3, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Staff ID footer */}
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.borderL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: T.primary }}>ID: STF-{p.id?.slice(0, 8).toUpperCase()}</span>
                  {p.created_at && <span style={{ fontSize: '9px', color: T.txt3, fontWeight: 600 }}>Joined {new Date(p.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerStaffProfiles;
