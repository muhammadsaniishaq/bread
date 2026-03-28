import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, 
  ShieldCheck, BadgeCheck, Camera,
  Edit2, Save, X, Lock,
  FileText, CreditCard, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { ImageCropModal } from '../components/ImageCropModal';
import { DigitalIdCard } from '../components/DigitalIdCard';

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
  const { appSettings } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [assignedSupplier, setAssignedSupplier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Modal States
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [showIdCard, setShowIdCard] = useState(false);

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
      if (prof) {
         setProfile(prof);
         setFullName(prof.full_name || '');
      }

      const { data: cust } = await supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
      if (cust) {
        setCustomer(cust);
        setLocation(cust.location || '');
        setPhone(cust.phone || '');
        setImage(cust.image || '');
        
        if (cust.assignedSupplierId) {
           const { data: sData } = await supabase.from('profiles').select('full_name').eq('id', cust.assignedSupplierId).maybeSingle();
           if (sData) setAssignedSupplier(sData.full_name);
        } else {
           setAssignedSupplier('Not Assigned');
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (base64: string) => {
    setImage(base64);
    setShowCropper(false);
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

      const updateData: any = { location, image };
      if (!customer.phone && phone) {
         updateData.phone = phone;
      }

      const { error: custErr } = await supabase
        .from('customers')
        .update(updateData)
        .eq('profile_id', user.id);
      
      if (custErr) throw custErr;

      if (fullName && fullName !== profile?.full_name) {
         const { error: profErr } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
         if (profErr) throw profErr;
      }

      setCustomer((prev: any) => ({ ...prev, ...updateData }));
      setProfile((prev: any) => ({ ...prev, full_name: fullName || prev?.full_name }));

      setMsg({ type: 'success', text: 'Profile Vault Updated!' });
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
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
                 <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings Vault</p>
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
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                 style={{ padding: '12px', borderRadius: '12px', background: msg.type === 'success' ? '#ecfdf5' : '#fff1f2', color: msg.type === 'success' ? T.success : T.danger, fontSize: '12px', fontWeight: 700, textAlign: 'center', border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecdd3'}` }}>
                 {msg.text}
               </motion.div>
             )}
           </AnimatePresence>

           {/* COMPACT IDENTITY BRICK & AVATAR UPLOAD */}
           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
                 <div style={{ width: '100%', height: '100%', borderRadius: '32px', background: `linear-gradient(135deg, ${T.primary}, #818cf8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 900, boxShadow: '0 15px 30px rgba(79, 70, 229, 0.2)', overflow: 'hidden' }}>
                    {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : (profile?.full_name?.charAt(0) || customer?.name?.charAt(0) || '?')}
                 </div>
                 {isEditing && (
                   <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'absolute', bottom: -5, right: -5, width: '28px', height: '28px', borderRadius: '10px', background: T.ink, color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                      <Camera size={12} />
                   </motion.button>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{profile?.full_name || customer?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: T.success }}>
                 <BadgeCheck size={14} />
                 <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Member</span>
              </div>
              <div style={{ position: 'absolute', top: -20, left: -20, opacity: 0.03 }}><User size={120} /></div>
           </div>

           {/* SUPPLIER ASSIGNMENT BRICK */}
           <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `1px dashed ${T.primary}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: T.shadow }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                 <Truck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: T.primary, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>Assigned Supplier</div>
                 <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{assignedSupplier || 'Not Assigned'}</div>
              </div>
           </div>

           {/* COMPACT INFO GRID */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              
              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Mail size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Account ID</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{user?.email?.includes('@hub.local') ? `@${user.email.replace('@hub.local', '')}` : user?.email}</div>
                 </div>
                 <ShieldCheck size={16} color={T.txt3} style={{ opacity: 0.5 }} />
              </div>

              {/* EDITABLE FIELD: FULL NAME */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: isEditing ? `2px solid ${T.primary}` : `1px solid ${T.border}`, display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: '16px', transition: 'all 0.2s' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isEditing ? T.primaryGlow : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditing ? T.primary : T.txt3 }}>
                    <User size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: isEditing ? '6px' : '2px' }}>Full Name</div>
                    {isEditing ? (
                      <input 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name..."
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                    ) : (
                      <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{profile?.full_name || customer?.name}</div>
                    )}
                 </div>
              </div>

              {/* EDITABLE FIELD: PHONE NUMBER WITH LOCK */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: isEditing && !customer?.phone ? `2px solid ${T.primary}` : `1px solid ${T.border}`, display: 'flex', alignItems: isEditing && !customer?.phone ? 'flex-start' : 'center', gap: '16px', transition: 'all 0.2s' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isEditing && !customer?.phone ? T.primaryGlow : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditing && !customer?.phone ? T.primary : T.txt3 }}>
                    <Phone size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: isEditing && !customer?.phone ? '6px' : '2px' }}>Phone Number</div>
                    {isEditing && !customer?.phone ? (
                      <input 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Assign Phone Number..."
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }}
                      />
                    ) : (
                      <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {customer?.phone || <span style={{ color: T.danger }}>Not Assigned</span>}
                      </div>
                    )}
                 </div>
                 {customer?.phone && <Lock size={16} color={T.success} style={{ opacity: 0.8 }} />}
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: `2px solid ${T.primary}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                         <Lock size={18} />
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Update Password (Optional)</div>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }} />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password"
                        style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, outline: 'none', background: T.bg2 }} />
                   </div>
                   <p style={{ margin: 0, fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Leave empty to keep current password.</p>
                </motion.div>
              )}

           </div>

           {/* VERIFIED DOCUMENTS VAULT */}
           <div style={{ marginTop: '8px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 900, color: T.txt2, textTransform: 'uppercase', marginBottom: '12px', marginLeft: '8px', letterSpacing: '0.05em' }}>Documents Vault</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                 
                 <button onClick={() => setShowIdCard(true)}
                    style={{ background: '#fff', border: `1px solid ${T.success}`, borderRadius: '20px', padding: '16px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: T.shadow, cursor: 'pointer', appearance: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: T.success }}></div>
                    <CreditCard size={28} color={T.success} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 800, color: T.ink, marginBottom: '4px' }}>View Digital ID</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.success, background: '#ecfdf5', display: 'inline-block', padding: '2px 8px', borderRadius: '6px' }}>TAP TO OPEN</div>
                 </button>

                 <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: '20px', padding: '16px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: T.shadow }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: T.primary }}></div>
                    <FileText size={28} color={T.txt3} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '11px', fontWeight: 800, color: T.ink, marginBottom: '4px' }}>Business Cert</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.primary, background: T.primaryGlow, display: 'inline-block', padding: '2px 8px', borderRadius: '6px' }}>SECURE</div>
                 </div>

              </div>
           </div>

           {/* COMPACT FOOTER */}
           <div style={{ marginTop: '8px', background: `linear-gradient(135deg, ${T.ink}, #1e293b)`, padding: '24px', borderRadius: T.radius, color: '#fff', textAlign: 'center', boxShadow: T.shadow }}>
              <Lock size={24} style={{ margin: '0 auto 12px', color: T.txt3 }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 900 }}>Vault Secured</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, lineHeight: 1.5 }}>
                Core verified information (Phone & Docs) are strictly locked. Contact support for changes.
              </p>
           </div>

        </div>

        <ImageCropModal 
          isOpen={showCropper}
          imageSrc={cropImageSrc}
          onClose={() => setShowCropper(false)}
          onCropCompleteAction={handleCropComplete}
        />

        <DigitalIdCard
          isOpen={showIdCard}
          onClose={() => setShowIdCard(false)}
          customer={customer}
          profile={profile}
          appSettings={appSettings}
        />

      </div>
    </AnimatedPage>
  );
};

export default CustomerProfileHub;
