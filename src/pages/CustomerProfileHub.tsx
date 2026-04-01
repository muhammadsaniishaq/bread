import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import {
  ArrowLeft, Mail, Phone, MapPin,
  BadgeCheck, Camera, Edit2, X, Lock,
  FileText, CreditCard, Truck, ShieldAlert,
  User, CheckCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { ImageCropModal } from '../components/ImageCropModal';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

/* ─────────────────────────────────────────
   DESIGN SYSTEM V5 — Premium Light Palette
───────────────────────────────────────── */
const T = {
  bg:          '#f8f7ff',
  bg2:         '#f0eeff',
  white:       '#ffffff',
  border:      'rgba(99,91,255,0.10)',
  borderLight: 'rgba(0,0,0,0.06)',
  primary:     '#635bff',
  primaryLight:'rgba(99,91,255,0.10)',
  accent:      '#06b6d4',
  accentLight: 'rgba(6,182,212,0.10)',
  success:     '#059669',
  successLight:'rgba(5,150,105,0.10)',
  danger:      '#e11d48',
  dangerLight: 'rgba(225,29,72,0.10)',
  gold:        '#d97706',
  goldLight:   'rgba(217,119,6,0.10)',
  ink:         '#0f172a',
  txt:         '#1e293b',
  txt2:        '#475569',
  txt3:        '#94a3b8',
  warn:        '#d97706',
  radius:      '20px',
  radiusSm:    '14px',
  shadow:      '0 4px 20px rgba(99,91,255,0.07)',
};

// Reusable info row
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconBg: string;
  locked?: boolean;
  alert?: boolean;
}> = ({ icon, label, value, iconBg, locked, alert }) => (
  <div style={{ background: T.white, padding: '14px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: T.shadow }}>
    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
    {locked && <Lock size={13} color={T.success} />}
    {alert && <ShieldAlert size={13} color={T.danger} />}
  </div>
);

const DocCard: React.FC<{ icon: React.ReactNode; title: string; badge: string; badgeColor: string; badgeBg: string; onClick: () => void; }> =
  ({ icon, title, badge, badgeColor, badgeBg, onClick }) => (
  <motion.button whileTap={{ scale: 0.96 }} onClick={onClick}
    style={{ background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: T.radius, padding: '18px', textAlign: 'center', cursor: 'pointer', boxShadow: T.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{title}</div>
    <div style={{ fontSize: '9px', fontWeight: 900, color: badgeColor, background: badgeBg, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>{badge}</div>
  </motion.button>
);

// Simple labeled input
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: T.txt2, marginBottom: '6px', letterSpacing: '0.02em' }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: '13px',
  border: `1.5px solid ${T.borderLight}`, background: T.white,
  fontWeight: 600, fontSize: '14px', color: T.ink,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
};

export const CustomerProfileHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]   = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [assignedSupplier, setAssignedSupplier] = useState<string>('');
  const [loading, setLoading]   = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName]   = useState('');
  const [location, setLocation]   = useState('');
  const [phone, setPhone]         = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [image, setImage]   = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) { setProfile(prof); setFullName(prof.full_name || ''); }
      const { data: cust } = await supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
      if (cust) {
        setCustomer(cust);
        setLocation(cust.location || ''); setPhone(cust.phone || ''); setImage(cust.image || '');
        if (cust.assignedSupplierId) {
          const { data: sd } = await supabase.from('profiles').select('full_name').eq('id', cust.assignedSupplierId).maybeSingle();
          setAssignedSupplier(sd?.full_name || 'Unknown Supplier');
        } else { setAssignedSupplier('Not Assigned'); }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCropImageSrc(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (base64: string) => {
    setImage(base64); setShowCropper(false);
    try { await supabase.from('customers').update({ image: base64 }).eq('profile_id', user?.id).maybeSingle(); setCustomer((p: any) => ({ ...p, image: base64 })); }
    catch (e) { console.error(e); }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !customer) return;
    setSaving(true); setMsg(null);
    try {
      if (password) {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw pwErr;
      }
      const isMissingUsername = !profile?.username && !user?.user_metadata?.username;
      const normalizedEditUsername = editUsername ? editUsername.trim().toLowerCase().replace(/\s+/g, '') : '';
      const phoneToCheck = (!customer.phone && phone) ? phone.trim() : '';

      if ((isMissingUsername && normalizedEditUsername) || phoneToCheck) {
        const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', {
          chk_username: isMissingUsername ? normalizedEditUsername : '',
          chk_phone: phoneToCheck
        });
        if (availErr) throw new Error('Verification error. Try again.');
        if (avail?.username_taken) throw new Error('This Username is already taken.');
        if (avail?.phone_taken) throw new Error('This Phone Number is already registered.');
      }
      if (isMissingUsername && normalizedEditUsername) {
        const { error: metaErr } = await supabase.auth.updateUser({ data: { username: normalizedEditUsername } });
        if (metaErr) throw metaErr;
      }
      const updateData: any = { location };
      if (!customer.phone && phone) updateData.phone = phone;
      const { data: updatedCust, error: custErr } = await supabase.from('customers').update(updateData).eq('profile_id', user.id).select().maybeSingle();
      if (custErr) throw custErr;
      if (!updatedCust) throw new Error('Update blocked. Check RLS policy.');
      if (fullName && fullName !== profile?.full_name) {
        const { error: profErr } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
        if (profErr) throw profErr;
      }
      setCustomer((p: any) => ({ ...p, ...updateData }));
      setProfile((p: any) => ({ ...p, full_name: fullName || p?.full_name }));
      setMsg({ type: 'success', text: 'Profile Updated Successfully!' });
      setTimeout(() => { setIsEditing(false); setMsg(null); }, 1800);
      setPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, gap: '14px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: '34px', height: '34px', borderRadius: '10px', border: `3px solid ${T.primary}`, borderTopColor: 'transparent' }} />
      <div style={{ color: T.txt3, fontSize: '12px', fontWeight: 700 }}>Loading Profile...</div>
    </div>
  );

  const isVerified = !!(customer?.phone || customer?.assignedSupplierId);
  const usernameDisplay = profile?.username || user?.user_metadata?.username;
  const displayName = profile?.full_name || customer?.name || 'Member';

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ─── STICKY HEADER ─── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,247,255,0.92)', backdropFilter: 'blur(16px)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${T.borderLight}` }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate('/customer/dashboard')}
            style={{ width: '36px', height: '36px', borderRadius: '11px', background: T.white, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={16} color={T.txt} />
          </motion.button>
          <h1 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: T.ink, flex: 1 }}>My Profile</h1>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setIsEditing(true); setMsg(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '11px', background: T.primaryLight, border: 'none', color: T.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
            <Edit2 size={12} /> Edit
          </motion.button>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ─── HERO PROFILE CARD ─── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: T.white, borderRadius: T.radius, padding: '24px', boxShadow: T.shadow, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', background: T.primaryLight, borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '22px', overflow: 'hidden', border: `2.5px solid ${T.primary}`, boxShadow: `0 0 0 4px ${T.primaryLight}`, background: T.bg2 }}>
                  {image
                    ? <img src={image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: T.primary }}>{displayName.charAt(0)}</div>
                  }
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: -4, right: -4, width: '26px', height: '26px', borderRadius: '9px', background: T.primary, color: '#fff', border: `2px solid ${T.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 12px ${T.primaryLight}` }}>
                  <Camera size={12} />
                </motion.button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</h2>
                {usernameDisplay && <div style={{ color: T.txt3, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>@{usernameDisplay}</div>}

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Verified Badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: isVerified ? T.successLight : T.goldLight, border: `1px solid ${isVerified ? T.success : T.gold}30` }}>
                    {isVerified ? <CheckCircle size={11} color={T.success} /> : <ShieldAlert size={11} color={T.gold} />}
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isVerified ? T.success : T.gold }}>{isVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                  {/* Member ID */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: T.primaryLight }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.primary }}>ID: #{customer?.id?.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── ACCOUNT DETAILS ─── */}
          <div>
            <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingLeft: '4px' }}>Account Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usernameDisplay ? (
                <InfoRow icon={<User size={17} color={T.primary} />} iconBg={T.primaryLight} label="Username" value={`@${usernameDisplay}`} locked />
              ) : (
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setIsEditing(true)}
                  style={{ cursor: 'pointer', background: T.goldLight, border: '1px solid rgba(217,119,6,0.2)', borderRadius: T.radiusSm, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={17} color={T.gold} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Username</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: T.gold }}>Tap to Set Username</div>
                  </div>
                  <ChevronRight size={15} color={T.gold} />
                </motion.div>
              )}

              <InfoRow icon={<Mail size={17} color={T.txt3} />} iconBg={T.bg2} label="Email Address"
                value={<span style={{ fontSize: '13px' }}>{user?.email}</span>} locked />

              {customer?.phone
                ? <InfoRow icon={<Phone size={17} color={T.success} />} iconBg={T.successLight} label="Phone Number" value={customer.phone} locked />
                : (
                  <motion.div whileTap={{ scale: 0.98 }} onClick={() => setIsEditing(true)}
                    style={{ cursor: 'pointer', background: T.dangerLight, border: '1px solid rgba(225,29,72,0.15)', borderRadius: T.radiusSm, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(225,29,72,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={17} color={T.danger} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginBottom: '2px' }}>Phone Number</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: T.danger }}>Not Set — Tap to Add</div>
                    </div>
                    <ChevronRight size={15} color={T.danger} />
                  </motion.div>
                )
              }

              <InfoRow icon={<MapPin size={17} color={T.txt3} />} iconBg={T.bg2} label="Delivery Location"
                value={customer?.location || <span style={{ color: T.txt3 }}>Not Set</span>} />
            </div>
          </div>

          {/* ─── ASSIGNED SUPPLIER ─── */}
          <div>
            <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingLeft: '4px' }}>Business</div>
            <div style={{ background: T.white, padding: '14px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: T.shadow }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: T.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={17} color={T.success} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginBottom: '3px' }}>Assigned Supplier</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{assignedSupplier || 'Not Assigned'}</div>
              </div>
              {assignedSupplier && assignedSupplier !== 'Not Assigned' && <BadgeCheck size={16} color={T.success} />}
            </div>
          </div>

          {/* ─── MY DOCUMENTS ─── */}
          <div>
            <div style={{ color: T.txt3, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingLeft: '4px' }}>My Documents</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <DocCard icon={<CreditCard size={22} color={T.success} />} title="Digital ID Card" badge="View Now" badgeColor={T.success} badgeBg={T.successLight} onClick={() => navigate('/customer/docs')} />
              <DocCard icon={<FileText size={22} color={T.primary} />} title="Business Cert" badge="Secured" badgeColor={T.primary} badgeBg={T.primaryLight} onClick={() => navigate('/customer/docs')} />
            </div>
          </div>

        </div>

        {/* ─── EDIT BOTTOM SHEET ─── */}
        <AnimatePresence>
          {isEditing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsEditing(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)' }} />

              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                style={{ position: 'relative', width: '100%', background: T.white, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto' }}>

                {/* Sheet header */}
                <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.borderLight}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: T.ink }}>Edit Profile</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: T.txt3, fontWeight: 600 }}>Update your account information</p>
                  </div>
                  <button onClick={() => setIsEditing(false)}
                    style={{ border: 'none', background: T.bg, width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={16} color={T.txt2} />
                  </button>
                </div>

                {/* Message */}
                <AnimatePresence>
                  {msg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ margin: '16px 20px 0', padding: '12px 16px', borderRadius: '12px', background: msg.type === 'success' ? T.successLight : T.dangerLight, color: msg.type === 'success' ? T.success : T.danger, fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {msg.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                      {msg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  <Field label="Full Name *">
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your full name" style={inputStyle} />
                  </Field>

                  {(!user?.user_metadata?.username && !profile?.username) && (
                    <Field label="Set Username *">
                      <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} placeholder="@username" style={inputStyle} />
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.warn, fontWeight: 600 }}>⚠️ Username is permanent once saved.</p>
                    </Field>
                  )}

                  {!customer?.phone && (
                    <Field label="Phone Number *">
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="080..." style={inputStyle} />
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.warn, fontWeight: 600 }}>⚠️ Phone number locks after being set.</p>
                    </Field>
                  )}

                  <Field label="Delivery Location">
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Your address or delivery route..." style={inputStyle} />
                  </Field>

                  {/* Security Section */}
                  <div style={{ paddingTop: '14px', borderTop: `1px solid ${T.bg}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <Lock size={13} color={T.txt3} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Change Password (Optional)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" style={inputStyle} />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" style={inputStyle} />
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving}
                    style={{ marginTop: '4px', padding: '16px', borderRadius: '16px', background: saving ? T.primaryLight : T.primary, color: saving ? T.primary : '#fff', border: 'none', fontWeight: 900, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : `0 8px 24px rgba(99,91,255,0.30)`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {saving ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${T.primary}`, borderTopColor: 'transparent' }} />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ImageCropModal isOpen={showCropper} imageSrc={cropImageSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />
        <CustomerBottomNav />
      </div>
    </AnimatedPage>
  );
};

export default CustomerProfileHub;
