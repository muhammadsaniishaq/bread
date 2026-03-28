import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, 
  ShieldCheck, BadgeCheck,
  Edit2, Save, X, Lock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   CUTTER/MODEL TOKENS
───────────────────────────────────────── */
const T = {
  bg:        '#f8fafc', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.04)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.08)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  bg2:       '#f1f5f9',
  radius:    '24px',
  shadow:    '0 10px 30px -10px rgba(0,0,0,0.05)'
};

export const CustomerProfileHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);

      const { data: cust } = await supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
      if (cust) {
        setCustomer(cust);
        setLocation(cust.location || '');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !customer) return;
    setSaving(true);
    setMsg(null);
    
    try {
      if (password) {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw pwErr;
      }

      const { error: custErr } = await supabase
        .from('customers')
        .update({ location: location })
        .eq('profile_id', user.id);
      
      if (custErr) throw custErr;

      setMsg({ type: 'success', text: 'Profile updated!' });
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '13px', letterSpacing: '0.05em' }}>ACCESSING VAULT...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* COMPACT HEADER */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/customer/dashboard')}
                 style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                 <ArrowLeft size={18} />
              </motion.button>
              <div>
                 <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: T.ink }}>Profile Hub</h1>
                 <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</p>
              </div>
           </div>
           
           {!isEditing ? (
             <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsEditing(true)}
               style={{ padding: '8px 16px', borderRadius: '12px', background: T.primary, color: '#fff', border: 'none', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)' }}
             >
               <Edit2 size={12} /> Edit
             </motion.button>
           ) : (
             <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}
                >
                  <X size={16} />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: T.success, color: '#fff', border: 'none', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}
                >
                  {saving ? '...' : <><Save size={12} /> Save</>}
                </motion.button>
             </div>
           )}
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
           
           <AnimatePresence>
             {msg && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 style={{ 
                   padding: '12px', 
                   borderRadius: '12px', 
                   background: msg.type === 'success' ? '#ecfdf5' : '#fff1f2',
                   color: msg.type === 'success' ? T.success : T.danger,
                   fontSize: '12px',
                   fontWeight: 700,
                   textAlign: 'center',
                   border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecdd3'}`
                 }}
               >
                 {msg.text}
               </motion.div>
             )}
           </AnimatePresence>

           {/* COMPACT IDENTITY BRICK */}
           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '32px', background: `linear-gradient(135deg, ${T.primary}, #818cf8)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 900, boxShadow: '0 15px 30px rgba(79, 70, 229, 0.2)' }}>
                 {profile?.full_name?.charAt(0) || customer?.name?.charAt(0) || '?'}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{profile?.full_name || customer?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: T.success }}>
                 <BadgeCheck size={14} />
                 <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Member</span>
              </div>
              <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.03 }}><User size={100} /></div>
           </div>

           {/* COMPACT INFO GRID */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              
              {/* READ ONLY FIELDS */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Mail size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Email Address</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{user?.email}</div>
                 </div>
                 <ShieldCheck size={16} color={T.txt3} style={{ opacity: 0.5 }} />
              </div>

              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Phone size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Phone (Verified)</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{customer?.phone || 'Not Linked'}</div>
                 </div>
                 <Lock size={16} color={T.txt3} style={{ opacity: 0.5 }} />
              </div>

              {/* EDITABLE FIELD: LOCATION */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: isEditing ? `2px solid ${T.primary}` : `1px solid ${T.border}`, display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: '16px', transition: 'all 0.2s' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isEditing ? T.primaryGlow : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditing ? T.primary : T.txt3 }}>
                    <MapPin size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: isEditing ? '6px' : '2px' }}>Delivery Location</div>
                    {isEditing ? (
                      <input 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter your address..."
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                    ) : (
                      <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{customer?.location || 'Local Delivery'}</div>
                    )}
                 </div>
              </div>

              {/* SECURITY: PASSWORD */}
              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `2px solid ${T.primary}`, display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                         <Lock size={18} />
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Update Password (Optional)</div>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                   </div>
                   <p style={{ margin: 0, fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Leave empty to keep current password.</p>
                </motion.div>
              )}

           </div>

           {/* COMPACT FOOTER */}
           <div style={{ marginTop: '8px', background: `linear-gradient(135deg, ${T.ink}, #1e293b)`, padding: '24px', borderRadius: T.radius, color: '#fff', textAlign: 'center', boxShadow: T.shadow }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto 12px', color: T.success }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 900 }}>Secure Account</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, lineHeight: 1.5 }}>
                Core information is verified and can only be updated by the bakery management.
              </p>
           </div>

        </div>

      </div>
    </AnimatedPage>
  );
};

export default CustomerProfileHub;
