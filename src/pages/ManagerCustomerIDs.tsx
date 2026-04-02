import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, CreditCard, Search, User, MapPin, Phone, BadgeCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg: '#f8f7ff', white: '#ffffff', primary: '#7c3aed', pLight: 'rgba(124,58,237,0.08)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)', rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)', ink: '#1a0a3b', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '18px', shadow: '0 4px 20px rgba(124,58,237,0.08)',
};

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BRONZE:  { label: 'Bronze',  color: '#92400e', bg: 'rgba(146,64,14,0.10)',  icon: '🥉' },
  SILVER:  { label: 'Silver',  color: '#64748b', bg: 'rgba(100,116,139,0.10)',icon: '🥈' },
  GOLD:    { label: 'Gold',    color: '#d97706', bg: 'rgba(217,119,6,0.10)',   icon: '🥇' },
  DIAMOND: { label: 'Diamond', color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',  icon: '💎' },
};

const ManagerCustomerIDs: React.FC = () => {
  const navigate = useNavigate();
  const { customers } = useAppContext();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const getTier = (points: number): string => {
    if (points >= 5000) return 'DIAMOND';
    if (points >= 1500) return 'GOLD';
    if (points >= 500)  return 'SILVER';
    return 'BRONZE';
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 50%, #4c1d95 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="#c4b5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Customer IDs</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>{customers.length} registered members</p>
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '13px', color: 'rgba(255,255,255,0.5)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username or phone…"
                style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '13px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {Object.entries(tierConfig).map(([key, cfg]) => {
              const count = customers.filter(c => getTier(c.loyaltyPoints || 0) === key).length;
              return (
                <div key={key} style={{ background: T.white, borderRadius: '14px', padding: '10px 6px', textAlign: 'center', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cfg.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* Customer ID Cards */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.txt3, background: T.white, borderRadius: T.radius }}>
              <User size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>No customers found.</div>
            </div>
          ) : filtered.map((c, i) => {
            const tier = getTier(c.loyaltyPoints || 0);
            const cfg = tierConfig[tier];
            const hasDebt = (c.debtBalance || 0) > 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(selected === c.id ? null : c.id)}
                style={{ cursor: 'pointer' }}>
                {/* ID Card */}
                <div style={{ background: T.white, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow, border: `1.5px solid ${selected === c.id ? T.primary : T.borderL}`, transition: 'border-color 0.2s' }}>
                  {/* Card top stripe */}
                  <div style={{ height: '4px', background: `linear-gradient(90deg, ${T.primary}, #a855f7, #ec4899)` }} />
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Avatar */}
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {c.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'Unnamed'}</div>
                            <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>@{c.username || 'no-username'}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: cfg.color, background: cfg.bg, padding: '2px 7px', borderRadius: '6px' }}>{cfg.icon} {cfg.label}</span>
                            {hasDebt && <span style={{ fontSize: '9px', fontWeight: 800, color: T.rose, background: T.roseL, padding: '2px 6px', borderRadius: '5px' }}>DEBT</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ID number & status */}
                    <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '10px', background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Member ID</div>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: T.primary, fontVariantNumeric: 'tabular-nums' }}>
                          BSB-{c.id?.slice(0, 8).toUpperCase() || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Status</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.profile_id ? <BadgeCheck size={12} color={T.emerald} /> : <AlertCircle size={12} color={T.amber} />}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: c.profile_id ? T.emerald : T.amber }}>
                            {c.profile_id ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {selected === c.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ background: T.white, borderRadius: '0 0 16px 16px', padding: '14px 14px 16px', borderTop: `1px solid ${T.borderL}`, marginTop: '-4px', boxShadow: T.shadow }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ padding: '10px', borderRadius: '12px', background: T.bg }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginBottom: '3px' }}>Phone</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Phone size={11} color={T.primary} />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: T.ink }}>{c.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{ padding: '10px', borderRadius: '12px', background: T.bg }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginBottom: '3px' }}>Location</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <MapPin size={11} color={T.primary} />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{ padding: '10px', borderRadius: '12px', background: T.emeraldL }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: T.emerald, textTransform: 'uppercase', marginBottom: '3px' }}>Total Purchases</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>₦{(c.loyaltyPoints || 0).toLocaleString()} pts</div>
                          </div>
                          <div style={{ padding: '10px', borderRadius: '12px', background: hasDebt ? T.roseL : T.emeraldL }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: hasDebt ? T.rose : T.emerald, textTransform: 'uppercase', marginBottom: '3px' }}>Debt Balance</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>₦{(c.debtBalance || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/manager/customers'); }}
                          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '12px', background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          View Full Customer Profile →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomerIDs;
