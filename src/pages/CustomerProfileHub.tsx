import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { 
  ArrowLeft, Mail, Phone, MapPin, 
  BadgeCheck, Camera, Edit2, X, Lock,
  FileText, CreditCard, Truck, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { ImageCropModal } from '../components/ImageCropModal';
import { DigitalIdCard } from '../components/DigitalIdCard';

/* ─────────────────────────────────────────
   V3 TOKENS
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
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.05)',
  glass:     'rgba(255,255,255,0.8)'
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
  
  // EDIT MODAL STATES
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // AVATAR & DOC STATES
  const [image, setImage] = useState<string>('');
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
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (base64: string) => {
    setImage(base64);
    setShowCropper(false);
    
    // Auto-save image directly so they don't have to hit "Save" on the main modal for avatar only
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

      const updateData: any = { location };
      if (!customer.phone && phone) {
         updateData.phone = phone; // Locks securely once inserted in DB via trigger/RLS if applicable
      }

      const { data: updatedCust, error: custErr } = await supabase
        .from('customers')
        .update(updateData)
        .eq('profile_id', user.id)
        .select()
        .maybeSingle();
      
      if (custErr) throw custErr;
      if (!updatedCust) throw new Error("Security Blocked Update. Please apply the Supabase SQL RLS Policy!");

      if (fullName && fullName !== profile?.full_name) {
         const { error: profErr } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
         if (profErr) throw profErr;
      }

      setCustomer((prev: any) => ({ ...prev, ...updateData }));
      setProfile((prev: any) => ({ ...prev, full_name: fullName || prev?.full_name }));

      setMsg({ type: 'success', text: 'Profile Updated successfully!' });
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '13px', letterSpacing: '0.05em' }}>ACCESSING SECURE VAULT...</div>;

  const isVerified = customer?.phone || customer?.assignedSupplierId;
  const usernameDisplay = user?.email?.includes('@hub.local') ? user.email.replace('@hub.local', '') : user?.email;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 STICKY HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.7)', backdropFilter: 'blur(16px)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${T.border}` }}>
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/customer/dashboard')} 
             style={{ background: '#fff', border: `1px solid ${T.border}`, padding: '10px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
             <ArrowLeft size={18} color={T.txt} />
           </motion.button>
           <h1 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: T.txt, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Vault</h1>
           <div style={{ marginLeft: 'auto' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setIsEditing(true); setMsg(null); }} 
                style={{ background: T.ink, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '14px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Edit2 size={14} /> Update
              </motion.button>
           </div>
        </div>

        <div style={{ padding: '24px 16px', display: 'grid', gap: '16px' }}>
           
           <AnimatePresence>
             {msg && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                 style={{ padding: '14px', borderRadius: '20px', background: msg.type === 'success' ? '#ecfdf5' : '#fff1f2', color: msg.type === 'success' ? T.success : T.danger, fontSize: '13px', fontWeight: 800, textAlign: 'center', border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecdd3'}` }}>
                 {msg.text}
               </motion.div>
             )}
           </AnimatePresence>

           {/* HOLOGRAPHIC HERO CARD */}
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              style={{ background: `linear-gradient(135deg, ${T.ink}, #2d3748)`, borderRadius: T.radius, padding: '40px 32px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                 
                 {/* AVATAR WITH CAMERA OVERLAY */}
                 <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                       {image ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : <span style={{ fontSize: '36px', fontWeight: 900 }}>{(profile?.full_name || customer?.name || '?').charAt(0)}</span>}
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                       style={{ position: 'absolute', bottom: -10, right: -10, width: '36px', height: '36px', borderRadius: '12px', background: T.primary, color: '#fff', border: '3px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                       <Camera size={14} />
                    </motion.button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                 </div>

                 <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isVerified ? T.success : '#fbbf24', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                       <BadgeCheck size={12} /> {isVerified ? 'Verified Member' : 'Pending Verification'}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em' }}>{profile?.full_name || customer?.name}</h2>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       ID: #{customer?.id.substring(0,8).toUpperCase()}
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* SUPPLIER BRICK */}
           <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: `1px solid ${T.success}40`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
                 <Truck size={20} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: T.success, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Assigned Supplier</div>
                 <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{assignedSupplier}</div>
              </div>
           </div>

           {/* BENTO GRID: DETAILS */}
           <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '12px' }}>
              
              <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: T.shadow }}>
                 <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <Mail size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>{user?.email?.includes('@hub.local') ? 'Username' : 'Email Address'}</div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                       {user?.email?.includes('@hub.local') ? `@${usernameDisplay}` : user?.email}
                       <span style={{ fontSize: '9px', background: T.bg2, padding: '3px 8px', borderRadius: '6px', color: T.txt3, fontWeight: 800 }}>LOCKED</span>
                    </div>
                 </div>
                 <Lock size={18} color={T.success} style={{ opacity: 0.8 }} />
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: T.shadow }}>
                 <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: customer?.phone ? T.bg2 : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: customer?.phone ? T.txt3 : T.danger }}>
                    <Phone size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: customer?.phone ? T.txt3 : T.danger, textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {customer?.phone || <span style={{ color: T.danger }}>Not Set</span>}
                       {customer?.phone && <span style={{ fontSize: '9px', background: T.bg2, padding: '3px 8px', borderRadius: '6px', color: T.txt3, fontWeight: 800 }}>LOCKED</span>}
                    </div>
                 </div>
                 {customer?.phone ? <Lock size={18} color={T.success} style={{ opacity: 0.8 }} /> : <ShieldAlert size={18} color={T.danger} />}
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: T.shadow }}>
                 <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt3 }}>
                    <MapPin size={18} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Location</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.txt }}>{customer?.location || 'Local Delivery'}</div>
                 </div>
              </div>

           </div>

           {/* DOCUMENTS VAULT - TWO COLUMN BRICKS */}
           <div style={{ marginTop: '8px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '16px', marginLeft: '8px', letterSpacing: '0.05em' }}>Documents Vault</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                 
                 <button onClick={() => setShowIdCard(true)}
                    style={{ background: '#fff', border: `1px solid ${T.success}`, borderRadius: '24px', padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.1)', cursor: 'pointer' }}>
                    <CreditCard size={32} color={T.success} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink, marginBottom: '6px' }}>Digital ID Card</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: T.success, background: '#ecfdf5', display: 'inline-block', padding: '4px 10px', borderRadius: '8px' }}>VIEW ID</div>
                 </button>

                 <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: '24px', padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: T.shadow }}>
                    <FileText size={32} color={T.txt3} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink, marginBottom: '6px' }}>Business Cert</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: T.primary, background: T.primaryGlow, display: 'inline-block', padding: '4px 10px', borderRadius: '8px' }}>SECURED</div>
                 </div>

              </div>
           </div>

        </div>

        {/* GLASSMORPHIC EDIT MODAL */}
        <AnimatePresence>
           {isEditing && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} 
                  style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)' }} />
                
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                   className="edit-modal-content"
                   style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '32px 32px 0 0', maxHeight: '90vh', overflowY: 'auto' }}>
                   
                   <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: T.ink }}>Update Profile</h3>
                      <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: T.bg2, width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color={T.txt2} /></button>
                   </div>
                   
                   <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      <div className="input-group">
                         <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Full Name *</label>
                         <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Musa Sani"
                           style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: T.bg2, fontWeight: 700, fontSize: '15px', color: T.ink, outlineColor: T.primary }} />
                      </div>
                      
                      {/* Phone - Only editable if empty in DB to lock it securely */}
                      {!customer?.phone && (
                        <div className="input-group">
                           <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Phone Number *</label>
                           <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="E.g 080..."
                             style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: T.bg2, fontWeight: 700, fontSize: '15px', color: T.ink, outlineColor: T.primary }} />
                           <p style={{ margin: '6px 0 0', fontSize: '11px', color: T.warn, fontWeight: 700 }}>Note: Phone number completely locks once saved.</p>
                        </div>
                      )}

                      <div className="input-group">
                         <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Delivery Location</label>
                         <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Store Address..."
                           style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: T.bg2, fontWeight: 600, fontSize: '15px', color: T.ink, outlineColor: T.primary }} />
                      </div>

                      <div className="input-group" style={{ marginTop: '12px', paddingTop: '20px', borderTop: `1px dashed ${T.border}` }}>
                         <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}><Lock size={12} style={{display:'inline'}}/> Update Password (Optional)</label>
                         <div style={{ display: 'grid', gap: '12px' }}>
                           <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password"
                             style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: T.bg2, fontWeight: 600, fontSize: '15px', outlineColor: T.primary }} />
                           <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password"
                             style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: T.bg2, fontWeight: 600, fontSize: '15px', outlineColor: T.primary }} />
                         </div>
                      </div>

                      <button type="submit" disabled={saving} 
                        style={{ marginTop: '16px', padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)', cursor: 'pointer' }}>
                        {saving ? 'Syncing Vault...' : 'Save & Secure'}
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
