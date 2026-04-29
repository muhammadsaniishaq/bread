import React, { useState, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  ArrowLeft, Languages, Store, Save, User as UserIcon,
  Shield, Bell, Key, ChevronRight, Check, Database,
  Smartphone, Info, LogOut, RefreshCw, CreditCard,
  AlertTriangle, Palette, FileText, Wifi, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useTranslation } from '../store/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5', primaryLt: 'rgba(79,70,229,0.08)',
  success: '#10b981', successLt: 'rgba(16,185,129,0.1)',
  danger: '#ef4444', dangerLt: 'rgba(239,68,68,0.1)',
  amber: '#f59e0b', amberLt: 'rgba(245,158,11,0.1)',
  purple: '#7c3aed', purpleLt: 'rgba(124,58,237,0.08)',
  ink: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  bg: '#f1f5f9', surface: '#ffffff',
  border: 'rgba(0,0,0,0.06)', borderL: 'rgba(0,0,0,0.04)',
  shadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: T.bg,
  border: `1px solid ${T.borderL}`, borderRadius: '10px',
  fontSize: '12px', fontWeight: 600, color: T.ink,
  outline: 'none', boxSizing: 'border-box',
};

const Section = ({ title, icon: Icon, color = T.ink, badge, children }: any) => (
  <div style={{ background: T.surface, borderRadius: '16px', border: `1px solid ${T.borderL}`, overflow: 'hidden', boxShadow: T.shadow }}>
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: color === T.ink ? T.bg : `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 800, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>{title}</span>
      {badge && <span style={{ fontSize: '9px', fontWeight: 800, background: T.primaryLt, color: T.primary, padding: '2px 8px', borderRadius: '20px' }}>{badge}</span>}
    </div>
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
  </div>
);

const Toggle = ({ label, sub, value, onChange }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: T.bg, borderRadius: '10px', cursor: 'pointer' }} onClick={onChange}>
    <div><div style={{ fontSize: '12px', fontWeight: 700, color: T.ink }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: T.txt3, marginTop: '1px' }}>{sub}</div>}</div>
    <motion.div animate={{ background: value ? T.primary : '#cbd5e1' }}
      style={{ width: '40px', height: '22px', borderRadius: '11px', padding: '3px', flexShrink: 0 }}>
      <motion.div animate={{ x: value ? 18 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
    </motion.div>
  </div>
);

const Row = ({ label, sub, value, icon: Icon, color = T.primary, onClick, danger }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: danger ? T.dangerLt : T.bg, borderRadius: '10px', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {Icon && <Icon size={13} color={danger ? T.danger : color} />}
      <div><div style={{ fontSize: '12px', fontWeight: 700, color: danger ? T.danger : T.ink }}>{label}</div>
        {sub && <div style={{ fontSize: '10px', color: T.txt3, marginTop: '1px' }}>{sub}</div>}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {value && <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{value}</span>}
      {onClick && <ChevronRight size={13} color={danger ? T.danger : T.txt3} />}
    </div>
  </div>
);

const SavedBadge = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      style={{ fontSize: '10px', fontWeight: 800, color: T.success, background: T.successLt, padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
      <Check size={10} /> Saved</motion.span>}
  </AnimatePresence>
);

export const ManagerSettings: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, updateSettings } = useAppContext();
  const { language, setLanguage } = useTranslation();
  const { user, signOut } = useAuth();

  const [saved, setSaved] = useState('');
  const showSaved = (id: string) => { setSaved(id); setTimeout(() => setSaved(''), 2200); };
  const [activeTab, setActiveTab] = useState<'account'|'bakery'|'system'>('account');

  // Profile
  const [profile, setProfile] = useState<any>(null);
  const [pForm, setPForm] = useState({ full_name: '', username: '', phone: '' });
  const [savingP, setSavingP] = useState(false);

  // Bakery
  const [storeName, setStoreName] = useState(appSettings?.bakeryName || 'Central Bakery');
  const [adminPin, setAdminPin] = useState(appSettings?.adminPin || '0018');
  const [cashierPin, setCashierPin] = useState(appSettings?.cashierPin || '1234');
  const [receiptFooter, setReceiptFooter] = useState(appSettings?.receiptFooter || 'Thank you for your business!');
  const [accountName, setAccountName] = useState(appSettings?.account_name || '');
  const [bankName, setBankName] = useState(appSettings?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(appSettings?.account_number || '');
  const [savingBakery, setSavingBakery] = useState(false);

  // Business Rules (localStorage — not in AppSettings type)
  const [defaultCredit, setDefaultCredit] = useState(() => localStorage.getItem('defaultCreditLimit') || '50000');
  const [maxDebtDays, setMaxDebtDays] = useState(() => localStorage.getItem('maxDebtDays') || '30');
  const [loavesPerBag, setLoavesPerBag] = useState(() => localStorage.getItem('loavesPerBag') || '500');
  const [savingRules, setSavingRules] = useState(false);

  // Toggles (localStorage)
  const [notif, setNotif] = useState({
    lowStock: localStorage.getItem('notifLowStock') !== 'false',
    debt: localStorage.getItem('notifDebt') !== 'false',
    daily: localStorage.getItem('notifDailyReport') === 'true',
  });
  const [autoLock, setAutoLock] = useState(localStorage.getItem('autoLock') === 'true');
  const [showCostPrice, setShowCostPrice] = useState(localStorage.getItem('showCostPrice') === 'true');
  const [requirePinDelete, setRequirePinDelete] = useState(localStorage.getItem('requirePinDelete') !== 'false');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#4f46e5');

  useEffect(() => {
    if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setPForm({ full_name: data.full_name || '', username: data.username || '', phone: data.phone || '' }); }
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !pForm.full_name.trim()) return;
    setSavingP(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: pForm.full_name.trim(),
        username: pForm.username.trim().toLowerCase().replace(/\s+/g, ''),
        phone: pForm.phone.trim()
      }).eq('id', user.id);
      if (error) throw error;
      setProfile({ ...profile, ...pForm });
      showSaved('profile');
    } catch (e: any) { alert(e.message); }
    setSavingP(false);
  };

  const handleSaveBakery = async () => {
    setSavingBakery(true);
    await updateSettings({ ...appSettings, bakeryName: storeName, adminPin, cashierPin, receiptFooter, account_name: accountName, bank_name: bankName, account_number: accountNumber });
    setSavingBakery(false);
    showSaved('bakery');
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    localStorage.setItem('defaultCreditLimit', defaultCredit);
    localStorage.setItem('maxDebtDays', maxDebtDays);
    localStorage.setItem('loavesPerBag', loavesPerBag);
    setSavingRules(false);
    showSaved('rules');
  };

  const saveToggle = (key: string, val: boolean) => {
    localStorage.setItem(key, String(val));
    showSaved('toggle_' + key);
  };

  const exportData = () => {
    alert('Export feature: Data will be exported as CSV from your Supabase dashboard.');
  };

  const accentColors = ['#4f46e5', '#0891b2', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* HEADER */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.borderL}`, padding: '12px 16px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ background: T.bg, border: `1px solid ${T.borderL}`, cursor: 'pointer', padding: '7px', borderRadius: '10px', display: 'flex' }}>
              <ArrowLeft size={16} color={T.ink} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>System Settings</h1>
              <p style={{ margin: 0, fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Preferences & Configuration</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ padding: '5px 9px', background: T.successLt, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={10} color={T.success} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: T.success }}>Live</span>
              </div>
            </div>
          </div>
          {/* TAB NAV */}
          <div style={{ display: 'flex', gap: '4px', background: T.bg, padding: '4px', borderRadius: '12px', marginBottom: '1px' }}>
            {([['account','👤 Account',UserIcon],['bakery','🏪 Bakery',Store],['system','⚙️ System',Database]] as any[]).map(([id,label]) => (
              <motion.button key={id} onClick={() => setActiveTab(id)}
                animate={{ background: activeTab===id ? T.surface : 'transparent', color: activeTab===id ? T.primary : T.txt3, boxShadow: activeTab===id ? T.shadow : 'none' }}
                transition={{ duration: 0.2 }}
                style={{ flex:1, padding:'8px 4px', borderRadius:'9px', border:'none', fontWeight:800, fontSize:'10px', cursor:'pointer', letterSpacing:'0.01em' }}>
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* HERO PROFILE CARD */}
          {activeTab === 'account' && (
            <div style={{ background: `linear-gradient(135deg, ${T.primary} 0%, #7c3aed 100%)`, borderRadius: '18px', padding: '20px 16px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '40%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, flexShrink: 0 }}>
                  {(profile?.full_name || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em' }}>{profile?.full_name || 'Manager'}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 600, marginTop: '2px' }}>@{profile?.username || 'manager'}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', display: 'flex', gap: '8px' }}>
                    <span>📞 {profile?.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', position: 'relative' }}>
                {[
                  { label: 'Bakery', value: appSettings?.bakeryName || 'Central' },
                  { label: 'PIN', value: '●'.repeat((appSettings?.adminPin||'0018').length) },
                  { label: 'Lang', value: language === 'ha' ? 'Hausa' : 'English' },
                ].map((s,i) => (
                  <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.12)', borderRadius:'10px', padding:'8px', textAlign:'center' }}>
                    <div style={{ fontSize:'9px', fontWeight:700, opacity:0.75, marginBottom:'2px', textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:'11px', fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bakery' && (
            <div style={{ background: `linear-gradient(135deg, ${T.amber} 0%, #ea580c 100%)`, borderRadius: '18px', padding: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900 }}>{appSettings?.bakeryName || 'Central Bakery'}</div>
                <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600, marginTop: '2px' }}>{appSettings?.account_name || 'Banking not configured'}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{appSettings?.bank_name || ''}{appSettings?.account_number ? ` · ${appSettings.account_number}` : ''}</div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div style={{ background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, borderRadius: '18px', padding: '16px', color: '#fff', display: 'flex', gap: '10px' }}>
              {[
                { label: 'Version', value: 'v2.4.1', icon: '📱' },
                { label: 'Database', value: 'Supabase', icon: '☁️' },
                { label: 'Status', value: 'Online', icon: '🟢' },
              ].map((s,i) => (
                <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:'10px', padding:'10px 8px', textAlign:'center', borderRight: i<2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ fontSize:'14px', marginBottom:'4px' }}>{s.icon}</div>
                  <div style={{ fontSize:'9px', fontWeight:700, opacity:0.6, textTransform:'uppercase', marginBottom:'2px' }}>{s.label}</div>
                  <div style={{ fontSize:'11px', fontWeight:900 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && <>
          <Section title="My Account" icon={UserIcon}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: T.primaryLt, borderRadius: '10px', border: `1px solid ${T.primary}20` }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {(profile?.full_name || 'M').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{profile?.full_name || 'Manager'}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: T.primary }}>@{profile?.username || 'manager'}</div>
              </div>
              <SavedBadge show={saved === 'profile'} />
            </div>
            <input style={inp} placeholder="Full Name" value={pForm.full_name} onChange={e => setPForm({ ...pForm, full_name: e.target.value })} />
            <input style={inp} placeholder="Phone Number" value={pForm.phone} onChange={e => setPForm({ ...pForm, phone: e.target.value })} />
            <input style={inp} placeholder="Username" value={pForm.username} onChange={e => setPForm({ ...pForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })} />
            <button onClick={handleSaveProfile} disabled={savingP} style={{ padding: '12px', background: T.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={13} /> {savingP ? 'Saving...' : 'Save Profile'}
            </button>
          </Section>
          </>
          }

          {/* BAKERY TAB */}
          {activeTab === 'bakery' && <>
          <Section title="Bakery Profile" icon={Store} color={T.amber}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Bakery Name</label>
              <SavedBadge show={saved === 'bakery'} />
            </div>
            <input style={inp} placeholder="Bakery Name" value={storeName} onChange={e => setStoreName(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>CASHIER PIN</label>
                <input style={{ ...inp, letterSpacing: '0.15em', fontWeight: 900 }} type="password" maxLength={6} placeholder="••••" value={cashierPin} onChange={e => setCashierPin(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>ADMIN PIN</label>
                <input style={{ ...inp, letterSpacing: '0.15em', fontWeight: 900 }} type="password" maxLength={6} placeholder="••••" value={adminPin} onChange={e => setAdminPin(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>RECEIPT FOOTER MESSAGE</label>
              <input style={inp} placeholder="Thank you for your business!" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} />
            </div>
            <button onClick={handleSaveBakery} disabled={savingBakery} style={{ padding: '12px', background: T.ink, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={13} /> {savingBakery ? 'Saving...' : 'Save Bakery Settings'}
            </button>
          </Section>

          <Section title="Banking Details" icon={CreditCard} color={T.success}>
            <div>
              <label style={{ fontSize:'9px', fontWeight:800, color:T.txt3, display:'block', marginBottom:'4px' }}>ACCOUNT NAME</label>
              <input style={inp} placeholder="e.g. Central Bakery Ltd" value={accountName} onChange={e => setAccountName(e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div>
                <label style={{ fontSize:'9px', fontWeight:800, color:T.txt3, display:'block', marginBottom:'4px' }}>BANK NAME</label>
                <input style={inp} placeholder="e.g. GTBank" value={bankName} onChange={e => setBankName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:'9px', fontWeight:800, color:T.txt3, display:'block', marginBottom:'4px' }}>ACCOUNT NO.</label>
                <input style={inp} placeholder="0123456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
              </div>
            </div>
            <button onClick={handleSaveBakery} style={{ padding:'10px', background:T.success, color:'#fff', border:'none', borderRadius:'10px', fontWeight:800, fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <Save size={13} /> Save Banking Info
            </button>
          </Section>
          </>
          }

          {/* SYSTEM TAB */}
          {activeTab === 'system' && <>

          {/* BUSINESS RULES */}
          <Section title="Business Rules" icon={CreditCard} color={T.success} badge="Smart">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Credit & Production Defaults</label>
              <SavedBadge show={saved === 'rules'} />
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>DEFAULT CREDIT LIMIT (₦)</label>
              <input style={inp} type="number" placeholder="50000" value={defaultCredit} onChange={e => setDefaultCredit(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>MAX DEBT AGE (DAYS)</label>
              <input style={inp} type="number" placeholder="30" value={maxDebtDays} onChange={e => setMaxDebtDays(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '4px' }}>LOAVES YIELD PER BAG OF FLOUR</label>
              <input style={inp} type="number" placeholder="500" value={loavesPerBag} onChange={e => setLoavesPerBag(e.target.value)} />
            </div>
            <div style={{ padding: '10px 12px', background: T.successLt, borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <Info size={12} color={T.success} style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '10px', color: T.success, fontWeight: 600, lineHeight: 1.5 }}>
                These defaults apply system-wide. Individual customers can have custom credit limits set in their profiles.
              </p>
            </div>
            <button onClick={handleSaveRules} disabled={savingRules} style={{ padding: '12px', background: T.success, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={13} /> {savingRules ? 'Saving...' : 'Save Business Rules'}
            </button>
          </Section>

          {/* SECURITY */}
          <Section title="Security & Access" icon={Shield} color={T.danger}>
            <Toggle label="Require PIN to Delete Records" sub="Protects sensitive operations" value={requirePinDelete}
              onChange={() => { setRequirePinDelete(!requirePinDelete); saveToggle('requirePinDelete', !requirePinDelete); }} />
            <Toggle label="Auto-Lock After 5 min" sub="Require PIN to resume session" value={autoLock}
              onChange={() => { setAutoLock(!autoLock); saveToggle('autoLock', !autoLock); }} />
            <Toggle label="Show Cost Price to Staff" sub="Allow staff to see product cost" value={showCostPrice}
              onChange={() => { setShowCostPrice(!showCostPrice); saveToggle('showCostPrice', !showCostPrice); }} />
            <Row label="Change Password" sub="Reset via email" icon={Key} color={T.danger} onClick={() => alert('Password reset: Check your registered email for reset link.')} />
          </Section>

          {/* NOTIFICATIONS */}
          <Section title="Notifications" icon={Bell} color={T.primary}>
            <Toggle label="Low Stock Alerts" sub="Alert when materials run low" value={notif.lowStock}
              onChange={() => { const v = { ...notif, lowStock: !notif.lowStock }; setNotif(v); saveToggle('notifLowStock', v.lowStock); }} />
            <Toggle label="Overdue Debt Alerts" sub="Alert on high-risk customer debts" value={notif.debt}
              onChange={() => { const v = { ...notif, debt: !notif.debt }; setNotif(v); saveToggle('notifDebt', v.debt); }} />
            <Toggle label="Daily Summary Report" sub="End-of-day performance digest" value={notif.daily}
              onChange={() => { const v = { ...notif, daily: !notif.daily }; setNotif(v); saveToggle('notifDailyReport', v.daily); }} />
          </Section>

          {/* APPEARANCE */}
          <Section title="Display & Appearance" icon={Palette} color={T.purple}>
            <Toggle label="Dark Mode" sub="Switch to dark interface" value={appSettings?.theme === 'dark'}
              onChange={() => { const n = appSettings?.theme === 'dark' ? 'light' : 'dark'; updateSettings({ ...appSettings, theme: n }); document.documentElement.setAttribute('data-theme', n); }} />
            <div>
              <label style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Accent Color</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {accentColors.map(c => (
                  <div key={c} onClick={() => { setAccentColor(c); localStorage.setItem('accentColor', c); showSaved('accent'); }}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${accentColor === c ? T.ink : 'transparent'}`, transition: 'all 0.15s' }} />
                ))}
              </div>
            </div>
          </Section>

          {/* LANGUAGE */}
          <Section title="Localization" icon={Languages}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[{ id: 'en', label: '🇬🇧 English' }, { id: 'ha', label: '🇳🇬 Hausa' }].map(lang => (
                <button key={lang.id} onClick={() => setLanguage(lang.id as any)}
                  style={{ padding: '10px', borderRadius: '10px', border: `1.5px solid ${language === lang.id ? T.primary : T.borderL}`, background: language === lang.id ? T.primaryLt : T.bg, color: language === lang.id ? T.primary : T.txt2, fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  {language === lang.id && <Check size={12} />} {lang.label}
                </button>
              ))}
            </div>
          </Section>

          {/* DATA & SYSTEM */}
          <Section title="Data & System" icon={Database} color={T.txt3}>
            <Row label="App Version" value="v2.4.1" icon={Smartphone} color={T.txt3} />
            <Row label="Database" value="Supabase · Live" icon={Wifi} color={T.success} />
            <Row label="Export All Data to CSV" sub="Download backup of all records" icon={Download} color={T.primary} onClick={exportData} />
            <button onClick={() => window.location.reload()} style={{ padding: '10px 12px', background: T.bg, border: `1px solid ${T.borderL}`, borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: T.txt2, width: '100%' }}>
              <RefreshCw size={13} color={T.txt3} /> Force Refresh App
            </button>
          </Section>

          <Section title="Danger Zone" icon={AlertTriangle} color={T.danger}>
            <div style={{ padding: '10px 12px', background: T.dangerLt, borderRadius: '10px', display: 'flex', gap: '8px' }}>
              <AlertTriangle size={12} color={T.danger} style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '10px', color: T.danger, fontWeight: 600, lineHeight: 1.5 }}>Actions in this section are irreversible. Proceed with extreme caution.</p>
            </div>
            <Row label="Reset All Settings to Default" sub="Does not delete customer data" icon={RefreshCw} danger onClick={() => { if (window.confirm('Reset all settings to factory defaults?')) { updateSettings({ companyName: 'Central Bakery', adminPin: '0018', cashierPin: '1234', receiptFooter: 'Thank you for your business!' }); window.location.reload(); } }} />
            <Row label="Clear All Transaction History" sub="Permanently removes all logs" icon={FileText} danger onClick={() => alert('Contact admin to perform this operation.')} />
          </Section>
          </>
          }

          {/* SIGN OUT */}
          <button onClick={() => { if (window.confirm('Sign out of your account?')) signOut?.(); }}
            style={{ padding: '14px', background: T.dangerLt, border: `1px solid ${T.danger}20`, borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: T.danger, width: '100%' }}>
            <LogOut size={15} /> Sign Out
          </button>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerSettings;
