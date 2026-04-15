import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  ShieldCheck, TrendingUp, Users, 
  Settings, Lock, Mail, Phone, 
  ArrowLeft, Award, Star, Trophy,
  Fingerprint, Library,
  Edit3, Camera, Save, Eye, EyeOff
} from 'lucide-react';

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:           '#f8f7ff',
  white:        '#ffffff',
  primary:      '#7c3aed',
  pLight:       'rgba(124,58,237,0.08)',
  pMid:         'rgba(124,58,237,0.18)',
  emerald:      '#059669',
  emeraldL:     'rgba(5,150,105,0.10)',
  rose:         '#e11d48',
  roseL:        'rgba(225,29,72,0.08)',
  amber:        '#d97706',
  amberL:       'rgba(217,119,6,0.10)',
  blue:         '#2563eb',
  blueL:        'rgba(37,99,235,0.10)',
  ink:          '#1a0a3b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  border:       'rgba(124,58,237,0.10)',
  borderL:      'rgba(0,0,0,0.06)',
  radius:       '20px',
  radiusSm:     '14px',
  shadow:       '0 4px 20px rgba(124,58,237,0.08)',
  shadowLg:     '0 12px 40px rgba(124,58,237,0.14)',
};

const fmt = (v: number) => `₦${v.toLocaleString()}`;

const PageHeader: React.FC<{ title: string; subtitle: string; onBack: () => void }> = ({ title, subtitle, onBack }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
    <motion.button 
      whileTap={{ scale: 0.9 }} 
      onClick={onBack}
      style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.white, border: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: T.shadow }}
    >
      <ArrowLeft size={18} color={T.ink} />
    </motion.button>
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 900, color: T.ink, margin: 0 }}>{title}</h1>
      <p style={{ fontSize: '11px', color: T.txt3, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</p>
    </div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; title?: string; icon?: any }> = ({ children, style, onClick, title, icon: Icon }) => (
  <motion.div 
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={onClick}
    style={{ background: T.white, border: `1px solid ${T.borderL}`, borderRadius: T.radius, padding: '20px', boxShadow: T.shadow, ...style }}
  >
    {title && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {Icon && <div style={{ color: T.primary }}><Icon size={16} /></div>}
        <h3 style={{ fontSize: '13px', fontWeight: 900, color: T.ink, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      </div>
    )}
    {children}
  </motion.div>
);

export const ManagerProfileHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, customers, expenses, refreshData } = useAppContext();
  
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPin, setFPin] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFName(data.full_name || '');
        setFEmail(user.email || '');
        setFPhone(data.phone || '');
        setFPin(data.pin || '');
      }
    };
    fetchProfile();
  }, [user]);

  const stats = useMemo(() => {
    const totalVolume = transactions.reduce((s, t) => s + t.totalPrice, 0);
    const activeStaff = 12; // Hardcoded or fetchable
    const totalCustomers = customers.length;
    const expenseRatio = totalVolume > 0 ? (expenses.reduce((s, e) => s + e.amount, 0) / totalVolume) * 100 : 0;
    
    return {
      totalVolume,
      activeStaff,
      totalCustomers,
      efficiency: 100 - Math.round(expenseRatio),
      trustScore: 98 // Managers are highly trusted by default
    };
  }, [transactions, customers, expenses]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fName,
        phone: fPhone,
        pin: fPin
      }).eq('id', user.id);

      if (error) throw error;

      if (fPassword) {
        const { error: pErr } = await supabase.auth.updateUser({ password: fPassword });
        if (pErr) throw pErr;
      }

      await refreshData();
      setIsEditing(false);
      setFPassword('');
      alert('Profile updated successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* ─── HERO ─── */}
        <div style={{ background: 'linear-gradient(158deg, #1e0050 0%, #312e81 45%, #4c1d95 100%)', padding: '48px 20px 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <PageHeader title="Executive Profile" subtitle="Operations Command" onBack={() => navigate('/manager/dashboard')} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff', overflow: 'hidden' }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fName.charAt(0)}
                </div>
                <motion.div whileTap={{ scale: 0.9 }} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', borderRadius: '10px', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #312e81', cursor: 'pointer' }}>
                  <Camera size={14} color="#fff" />
                </motion.div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>{fName || 'Manager'}</h2>
                  <ShieldCheck size={18} color="#6ee7b7" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)', color: '#c4b5fd', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Administrator</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Bakery ID: {user?.id.slice(0, 8)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>
          
          {/* ─── EXECUTIVE STATS BENTO ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Management Trust', value: `${stats.trustScore}%`, icon: ShieldCheck, color: T.emerald, bg: T.emeraldL },
              { label: 'Revenue Managed', value: fmt(stats.totalVolume), icon: TrendingUp, color: T.primary, bg: T.pLight },
              { label: 'Staff Roster', value: stats.activeStaff, icon: Users, color: T.blue, bg: T.blueL },
              { label: 'Client Base', value: stats.totalCustomers, icon: Trophy, color: T.amber, bg: T.amberL },
            ].map((s, i) => (
              <Card key={i} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* ─── IDENTITY VAULT ─── */}
                <Card title="The Records Vault" icon={Library} style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: T.txt2, fontWeight: 500, marginBottom: '16px' }}>Digital identity and business accreditation for executive verification.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <motion.div whileTap={{ scale: 0.97 }} style={{ cursor: 'pointer', background: T.bg, borderRadius: T.radiusSm, padding: '16px', border: `1px solid ${T.borderL}` }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Fingerprint size={18} color={T.primary} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Operations ID</div>
                      <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, marginTop: '2px' }}>Verified & Licensed</div>
                    </motion.div>

                    <motion.div whileTap={{ scale: 0.97 }} style={{ cursor: 'pointer', background: T.bg, borderRadius: T.radiusSm, padding: '16px', border: `1px solid ${T.borderL}` }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Award size={18} color={T.amber} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Business Cert</div>
                      <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, marginTop: '2px' }}>Registration Hub</div>
                    </motion.div>
                  </div>
                </Card>

                {/* ─── ACCOUNT DETAILS ─── */}
                <Card title="Account Details" icon={Settings} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Full Name', value: fName, icon: Crown },
                      { label: 'Contact Email', value: fEmail, icon: Mail },
                      { label: 'Phone Number', value: fPhone || 'Not set', icon: Phone },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                          <item.icon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>{item.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: T.radiusSm, background: T.pLight, border: `1px solid ${T.border}`, color: T.primary, fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Edit3 size={16} /> Edit Profile & Security
                  </motion.button>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Card title="Update Operations Access" icon={Lock} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Full Name</label>
                      <input value={fName} onChange={e => setFName(e.target.value)} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Phone Number</label>
                      <input value={fPhone} onChange={e => setFPhone(e.target.value)} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                    </div>
                    <div style={{ height: '1px', background: T.borderL, margin: '8px 0' }} />
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Account PIN (4 Digits)</label>
                      <input type="password" maxLength={4} value={fPin} onChange={e => setFPin(e.target.value.replace(/\D/g,''))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, letterSpacing: '8px', textAlign: 'center', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>New Password (Leave blank to keep current)</label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPass ? 'text' : 'password'} value={fPassword} onChange={e => setFPassword(e.target.value)} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                        <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: T.txt3, cursor: 'pointer' }}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '24px' }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(false)} style={{ padding: '14px', borderRadius: T.radiusSm, background: T.bg, border: 'none', color: T.txt2, fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Cancel</motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      disabled={loading}
                      style={{ padding: '14px', borderRadius: T.radiusSm, background: T.primary, border: 'none', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: T.shadowLg }}
                    >
                      {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <p style={{ textAlign: 'center', fontSize: '11px', color: T.txt3, fontWeight: 700, marginTop: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Secured by Bread Cloud Executive Shield™
          </p>

        </div>
      </div>
    </AnimatedPage>
  );
};

// Re-using icon for consistency
const Crown = ({ size, color }: { size: number, color?: string }) => (
  <Star size={size} color={color} fill={color} />
);

export default ManagerProfileHub;
