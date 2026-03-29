import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { 
  ArrowLeft, Mail, Phone, MapPin, 
  BadgeCheck, Camera, Edit2, X, Lock,
  FileText, CreditCard, Truck, ShieldAlert,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { ImageCropModal } from '../components/ImageCropModal';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

/* ─────────────────────────────────────────
   COMPACT V3 TOKENS (iOS Settings Vibe)
───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd',
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  success:   '#10b981',
  danger:    '#f43f5e',
  warn:      '#f59e0b',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  bg2:       '#f1f5f9',
  radius:    '20px', // Compacted from 32px
  shadow:    '0 10px 30px -10px rgba(0,0,0,0.06)', // Softer shadow
  glass:     'rgba(255,255,255,0.8)'
};

export const CustomerProfileHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [assignedSupplier, setAssignedSupplier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // EDIT MODAL STATES
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // AVATAR & DOC STATES
  const [image, setImage] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
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
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (base64: string) => {
    setImage(base64);
    setShowCropper(false);
    try {
       await supabase.from('customers').update({ image: base64 }).eq('profile_id', user?.id).select().maybeSingle();
       setCustomer((prev: any) => ({ ...prev, image: base64 }));
    } catch(e) { console.error("Could not upload avatar securely", e); }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      // Metadata Update (Username)
      const isMissingUsername = !profile?.username && !user?.user_metadata?.username;
      
      const normalizedEditUsername = editUsername ? editUsername.trim().toLowerCase().replace(/\s+/g, '') : '';
      const phoneToCheck = (!customer.phone && phone) ? phone.trim() : '';
      
      // --- PRE-UPDATE: UNIVERSE UNIQUENESS CHECK ---
      if ((isMissingUsername && normalizedEditUsername) || phoneToCheck) {
         const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', { 
            chk_username: isMissingUsername ? normalizedEditUsername : '', 
            chk_phone: phoneToCheck 
         });
         if (availErr) throw new Error("Verification network error. Please try again.");
         if (avail?.username_taken) throw new Error("Bummer! This Username is already taken.");
         if (avail?.phone_taken) throw new Error("This Phone Number is already registered.");
      }

      if (isMissingUsername && normalizedEditUsername) {
         const { error: metaErr } = await supabase.auth.updateUser({ data: { username: normalizedEditUsername } });
         if (metaErr) throw metaErr;
      }

      const updateData: any = { location };
      if (!customer.phone && phone) updateData.phone = phone;

      const { data: updatedCust, error: custErr } = await supabase
        .from('customers')
        .update(updateData)
        .eq('profile_id', user.id)
        .select()
        .maybeSingle();
      
      if (custErr) throw custErr;
      if (!updatedCust) throw new Error("Security Blocked Update. Apply RLS Policy if needed.");

      if (fullName && fullName !== profile?.full_name) {
         const { error: profErr } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
         if (profErr) throw profErr;
      }

      setCustomer((prev: any) => ({ ...prev, ...updateData }));
      setProfile((prev: any) => ({ ...prev, full_name: fullName || prev?.full_name }));

      setMsg({ type: 'success', text: 'Profile Updated!' });
      setTimeout(() => { setIsEditing(false); }, 1500);
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '13px', letterSpacing: '0.05em' }}>ACCESSING SYSTEM...</div>;

  const isVerified = customer?.phone || customer?.assignedSupplierId;
  
  // Real Username Check
  const usernameDisplay = profile?.username || user?.user_metadata?.username;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '90px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* COMPACT STICKY HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${T.border}` }}>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/customer/dashboard')} 
             style={{ background: '#fff', border: `1px solid ${T.border}`, width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
             <ArrowLeft size={16} color={T.txt} />
           </motion.button>
           <h1 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>My Profile</h1>
           <div style={{ marginLeft: 'auto' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setIsEditing(true); setMsg(null); }} 
                style={{ background: T.bg2, color: T.primary, border: `1px solid ${T.border}`, padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Edit2 size={12} /> Edit
              </motion.button>
           </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
           
           <AnimatePresence>
             {msg && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                 style={{ padding: '12px', borderRadius: '14px', background: msg.type === 'success' ? '#ecfdf5' : '#fff1f2', color: msg.type === 'success' ? T.success : T.danger, fontSize: '12px', fontWeight: 800, textAlign: 'center', border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecdd3'}` }}>
                 {msg.text}
               </motion.div>
             )}
           </AnimatePresence>

           {/* MODERN LIGHT HERO CARD */}
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              style={{ background: '#ffffff', borderRadius: T.radius, padding: '24px 20px', color: T.ink, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: `1px solid ${T.border}` }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: T.primaryGlow, borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '20px', width: '120px', height: '120px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                 <div style={{ position: 'relative' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                       {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : <span style={{ fontSize: '24px', fontWeight: 900, color: T.primary }}>{(profile?.full_name || customer?.name || '?').charAt(0)}</span>}
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                       style={{ position: 'absolute', bottom: -6, right: -6, width: '28px', height: '28px', borderRadius: '10px', background: T.primary, color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(79, 70, 229, 0.3)' }}>
                       <Camera size={12} />
                    </motion.button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                 </div>

                 <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: T.ink }}>{profile?.full_name || customer?.name || 'V.I.P Member'}</h2>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                       ID: #{customer?.id.substring(0,8).toUpperCase()}
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: isVerified ? T.success : '#fbbf24', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginTop: '8px', background: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                       <BadgeCheck size={10} /> {isVerified ? 'Verified' : 'Pending'}
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* SUPPLIER BRICK */}
           <div style={{ background: '#fff', padding: '16px', borderRadius: T.radius, border: `1px solid ${T.success}30`, display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
                 <Truck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: T.success, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em' }}>Assigned Supplier</div>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{assignedSupplier}</div>
              </div>
           </div>

           {/* COMPACT BENTO GRID: DETAILS */}
           <div style={{ display: 'grid', gap: '8px' }}>
              
              {/* Username Field */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: T.radius, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '14px', boxShadow: T.shadow }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <User size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Username</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>
                       {usernameDisplay ? `@${usernameDisplay}` : <span style={{ color: T.warn, fontSize: '12px', fontWeight: 800 }}>Not Set (Click Edit)</span>}
                    </div>
                 </div>
              </div>

              {/* Email Field */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: T.radius, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '14px', boxShadow: T.shadow }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Mail size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Email Address</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                       {user?.email}
                       <span style={{ fontSize: '8px', background: T.bg2, padding: '3px 6px', borderRadius: '4px', color: T.txt3, fontWeight: 900 }}>LOCKED</span>
                    </div>
                 </div>
                 <Lock size={14} color={T.success} style={{ opacity: 0.8 }} />
              </div>

              {/* Phone Field */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: T.radius, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '14px', boxShadow: T.shadow }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: customer?.phone ? T.bg2 : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: customer?.phone ? T.txt3 : T.danger }}>
                    <Phone size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: customer?.phone ? T.txt3 : T.danger, textTransform: 'uppercase', marginBottom: '2px' }}>Phone Number</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: '6px' }}>
                       {customer?.phone || <span style={{ color: T.danger }}>Not Set</span>}
                       {customer?.phone && <span style={{ fontSize: '8px', background: T.bg2, padding: '3px 6px', borderRadius: '4px', color: T.txt3, fontWeight: 900 }}>LOCKED</span>}
                    </div>
                 </div>
                 {customer?.phone ? <Lock size={14} color={T.success} style={{ opacity: 0.8 }} /> : <ShieldAlert size={14} color={T.danger} />}
              </div>

              {/* Location Field */}
              <div style={{ background: '#fff', padding: '16px', borderRadius: T.radius, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '14px', boxShadow: T.shadow }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <MapPin size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Delivery Route</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{customer?.location || 'Local Delivery'}</div>
                 </div>
              </div>

           </div>

           {/* MY DOCUMENTS GRID */}
           <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button onClick={() => navigate('/customer/docs')}
                 style={{ background: '#fff', border: `1px solid ${T.success}50`, borderRadius: T.radius, padding: '16px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)' }}>
                 <CreditCard size={24} color={T.success} style={{ margin: '0 auto 8px' }} />
                 <div style={{ fontSize: '11px', fontWeight: 900, color: T.ink, marginBottom: '6px' }}>Digital ID</div>
                 <div style={{ fontSize: '9px', fontWeight: 900, color: T.success, background: '#ecfdf5', display: 'inline-block', padding: '3px 8px', borderRadius: '6px' }}>VIEW NOW</div>
              </button>

              <button onClick={() => navigate('/customer/docs')} 
                 style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '16px', textAlign: 'center', boxShadow: T.shadow, cursor: 'pointer' }}>
                 <FileText size={24} color={T.txt3} style={{ margin: '0 auto 8px' }} />
                 <div style={{ fontSize: '11px', fontWeight: 900, color: T.ink, marginBottom: '6px' }}>Business Cert</div>
                 <div style={{ fontSize: '9px', fontWeight: 900, color: T.primary, background: T.primaryGlow, display: 'inline-block', padding: '3px 8px', borderRadius: '6px' }}>SECURED</div>
              </button>
           </div>

        </div>

        {/* COMPACT BLUR MODAL */}
        <AnimatePresence>
           {isEditing && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} 
                  style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} />
                
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                   className="edit-modal-content"
                   style={{ position: 'relative', background: T.bg, width: '100%', maxWidth: '450px', borderRadius: '24px 24px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
                   
                   <div style={{ position: 'sticky', top: 0, background: 'rgba(253,253,253,0.9)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink }}>Edit Profile</h3>
                      <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: T.bg2, width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} color={T.txt2} /></button>
                   </div>
                   
                   <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div className="input-group">
                         <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Full Name *</label>
                         <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Musa Sani"
                           style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 700, fontSize: '14px', color: T.ink, outlineColor: T.primary }} />
                      </div>

                      {/* Username - Only editable if empty entirely */}
                      {(!user?.user_metadata?.username && !profile?.username) && (
                        <div className="input-group">
                           <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Set Username *</label>
                           <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} required placeholder="@username"
                             style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 700, fontSize: '14px', color: T.ink, outlineColor: T.primary }} />
                           <p style={{ margin: '4px 0 0', fontSize: '10px', color: T.warn, fontWeight: 700 }}>Note: Username is permanent once saved.</p>
                        </div>
                      )}
                      
                      {/* Phone */}
                      {!customer?.phone && (
                        <div className="input-group">
                           <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Phone Number *</label>
                           <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="E.g 080..."
                             style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 700, fontSize: '14px', color: T.ink, outlineColor: T.primary }} />
                           <p style={{ margin: '4px 0 0', fontSize: '10px', color: T.warn, fontWeight: 700 }}>Note: Phone number completely locks once saved.</p>
                        </div>
                      )}

                      <div className="input-group">
                         <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Delivery Location</label>
                         <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Store Address..."
                           style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 600, fontSize: '14px', color: T.ink, outlineColor: T.primary }} />
                      </div>

                      <div className="input-group" style={{ marginTop: '4px', paddingTop: '16px', borderTop: `1px solid ${T.bg2}` }}>
                         <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}><Lock size={10} style={{display:'inline'}}/> Update Password</label>
                         <div style={{ display: 'grid', gap: '8px' }}>
                           <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password"
                             style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 600, fontSize: '14px', outlineColor: T.primary }} />
                           <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password"
                             style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontWeight: 600, fontSize: '14px', outlineColor: T.primary }} />
                         </div>
                      </div>

                      <button type="submit" disabled={saving} 
                        style={{ marginTop: '8px', padding: '16px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                       </button>

                   </form>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <ImageCropModal 
          isOpen={showCropper}
          imageSrc={cropImageSrc}
          onClose={() => setShowCropper(false)}
          onCropCompleteAction={handleCropComplete}
        />

       <CustomerBottomNav />

      </div>
    </AnimatedPage>
  );
};

export default CustomerProfileHub;
