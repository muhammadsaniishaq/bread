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
   V3 TOKENS (Match Suite)
   ───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  bg2:       '#f8fafc',
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.05)'
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
      // 1. Update Password if provided
      if (password) {
        if (password !== confirmPassword) {
           throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
           throw new Error("Password must be at least 6 characters");
        }
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw pwErr;
      }

      // 2. Update Customer Metadata (Location)
      const { error: custErr } = await supabase
        .from('customers')
        .update({ location: location })
        .eq('profile_id', user.id);
      
      if (custErr) throw custErr;

      setMsg({ type: 'success', text: 'Profile updated successfully!' });
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

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>ACCESSING VAULT...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 HEADER */}
        <div style={{ padding: '32px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/customer/dashboard')}
                 style={{ padding: '12px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                 <ArrowLeft size={18} />
              </motion.button>
              <div>
                 <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', color: T.ink }}>Profile Hub</h1>
                 <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Modernized Account Management</p>
              </div>
           </div>
           
           {!isEditing ? (
             <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsEditing(true)}
               style={{ padding: '10px 18px', borderRadius: '12px', background: T.primary, color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}
             >
               <Edit2 size={14} /> Edit
             </motion.button>
           ) : (
             <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '10px 14px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, fontWeight: 800, color: T.txt2 }}
                >
                  <X size={18} />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '10px 18px', borderRadius: '12px', background: T.success, color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}
                >
                  {saving ? '...' : <><Save size={14} /> Save</>}
                </motion.button>
             </div>
           )}
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
           
           <AnimatePresence>
             {msg && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 style={{ 
                   padding: '16px', 
                   borderRadius: '16px', 
                   background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                   color: msg.type === 'success' ? T.success : T.danger,
                   fontSize: '14px',
                   fontWeight: 700,
                   textAlign: 'center',
                   border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                 }}
               >
                 {msg.text}
               </motion.div>
             )}
           </AnimatePresence>

           {/* IDENTITY BRICK */}
           <div style={{ background: '#fff', padding: '32px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '40px', background: `linear-gradient(135deg, ${T.primary}, #818cf8)`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px', fontWeight: 900, boxShadow: '0 20px 40px rgba(79, 70, 229, 0.2)' }}>
                 {profile?.full_name?.charAt(0) || customer?.name?.charAt(0) || '?'}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{profile?.full_name || customer?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: T.success }}>
                 <BadgeCheck size={16} />
                 <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Member</span>
              </div>
              <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.03 }}><User size={120} /></div>
           </div>

           {/* INFO GRID */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              
              {/* READ ONLY FIELDS */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Mail size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Email Address</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.ink }}>{user?.email}</div>
                 </div>
                 <ShieldCheck size={18} color={T.txt3} style={{ opacity: 0.5 }} />
              </div>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Phone size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Phone (Verified)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.ink }}>{customer?.phone || 'Not Linked'}</div>
                 </div>
                 <Lock size={18} color={T.txt3} style={{ opacity: 0.5 }} />
              </div>

              {/* EDITABLE FIELD: LOCATION */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: isEditing ? `2px solid ${T.primary}` : `1px solid ${T.border}`, display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: '20px', transition: 'all 0.2s' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isEditing ? T.primaryGlow : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditing ? T.primary : T.txt3 }}>
                    <MapPin size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: isEditing ? '8px' : '2px' }}>Delivery Location</div>
                    {isEditing ? (
                      <input 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter your address..."
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '15px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                    ) : (
                      <div style={{ fontSize: '16px', fontWeight: 800, color: T.ink }}>{customer?.location || 'Local Delivery'}</div>
                    )}
                 </div>
              </div>

              {/* SECURITY: PASSWORD */}
              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `2px solid ${T.primary}`, display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                         <Lock size={20} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Update Password (Optional)</div>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                   </div>
                   <p style={{ margin: 0, fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Leave blank if you don't want to change your password.</p>
                </motion.div>
              )}

           </div>

           {/* LOGO / BRANDING FOOTER */}
           <div style={{ marginTop: '20px', background: `linear-gradient(135deg, ${T.ink}, #2d3748)`, padding: '32px', borderRadius: T.radius, color: '#fff', textAlign: 'center', boxShadow: T.shadow }}>
              <CheckCircle2 size={32} style={{ marginBottom: '16px', color: T.success }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 900 }}>Secure Account Management</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                Your core information (Name & Phone) is verified and can only be updated by the bakery management for security purposes.
              </p>
           </div>

        </div>

      </div>
    </AnimatedPage>
  );
};

export default CustomerProfileHub;
