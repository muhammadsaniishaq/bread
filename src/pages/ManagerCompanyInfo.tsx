import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Building2, Store, Save, Globe, Phone, MapPin, Mail, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const T = {
  bg: '#f8f7ff', white: '#ffffff', primary: '#7c3aed', pLight: 'rgba(124,58,237,0.08)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)', rose: '#e11d48',
  ink: '#1a0a3b', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', border: 'rgba(124,58,237,0.12)',
  radius: '18px', shadow: '0 4px 20px rgba(124,58,237,0.08)',
};

const ManagerCompanyInfo: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, updateSettings } = useAppContext();

  const [form, setForm] = useState({
    bakeryName:  appSettings?.bakeryName  || 'Best Special Bread',
    companyName: appSettings?.companyName || 'Best Special Bread Ltd',
    phone:       (appSettings as any)?.phone       || '',
    email:       (appSettings as any)?.email       || '',
    address:     (appSettings as any)?.address     || '',
    website:     (appSettings as any)?.website     || '',
    tagline:     (appSettings as any)?.tagline     || 'Quality bread baked with love & tradition',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({ ...appSettings, ...form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 12px 12px 36px', borderRadius: '13px',
    border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '13px',
    fontWeight: 600, color: T.ink, outlineColor: T.primary,
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const inputStylePlain: React.CSSProperties = { ...inputStyle, paddingLeft: '12px' };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 50%, #4c1d95 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} color="#c4b5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Company Info</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>Edit your company profile & branding</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Logo preview card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: T.white, borderRadius: T.radius, padding: '20px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, margin: '0 auto 12px', padding: '6px', boxShadow: `0 8px 24px rgba(124,58,237,0.25)` }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{form.bakeryName || 'Bakery Name'}</div>
            <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600, marginTop: '3px' }}>{form.tagline}</div>
            <button style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '10px', background: T.pLight, border: `1px solid ${T.border}`, color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Camera size={12} /> Change Logo (via Settings)
            </button>
          </motion.div>

          {/* Bakery Display Name */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <Store size={14} color={T.primary} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branding</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Bakery Display Name</label>
                <input value={form.bakeryName} onChange={e => setForm(f => ({ ...f, bakeryName: e.target.value }))} placeholder="Best Special Bread" style={inputStylePlain} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Official Company Name</label>
                <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Best Special Bread Ltd" style={inputStylePlain} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Tagline / Slogan</label>
                <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Quality bread with love & tradition" style={inputStylePlain} />
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <Phone size={14} color={T.primary} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: T.txt3 }} />
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="080..." style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: T.txt3 }} />
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@bakery.com" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Business Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: T.txt3 }} />
                  <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Baker Street, Lagos" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Website (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: T.txt3 }} />
                  <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://bestspecialbread.com" style={inputStyle} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            style={{ padding: '15px', borderRadius: '14px', background: saved ? `linear-gradient(135deg, ${T.emerald}, #059669)` : `linear-gradient(135deg, ${T.primary}, #a855f7)`, border: 'none', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 24px rgba(124,58,237,0.25)`, transition: 'background 0.3s' }}>
            {saving ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                Saving...
              </>
            ) : saved ? (
              '✅ Company Info Saved!'
            ) : (
              <><Save size={16} /> Save Company Info</>
            )}
          </motion.button>

          {/* Info note */}
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: T.pLight, border: `1px solid rgba(124,58,237,0.15)`, fontSize: '11px', color: T.txt2, fontWeight: 600, lineHeight: 1.55 }}>
            ℹ️ Company info is used across receipts, customer-facing documents, and the digital ID card system.
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCompanyInfo;
