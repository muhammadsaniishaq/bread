import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { User, Mail, Clock, TrendingUp, LogOut, ChevronRight, Settings, Phone, ShieldCheck, Edit2, X } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import StoreBottomNav from '../components/StoreBottomNav';
import { useAppContext } from '../store/AppContext';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  danger: '#f43f5e',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

export default function StoreProfile() {
  const { user, signOut } = useAuth();
  const { transactions } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone: '', username: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) {
      setProfile(data);
      setEditData({ full_name: data.full_name || '', phone: data.phone || '', username: data.username || '' });
    }
  };

  const handleSave = async () => {
    if (!user || !editData.full_name.trim()) return;
    setIsSaving(true);
    try {
      let unToCheck = (editData.username && editData.username.trim() && editData.username.trim().toLowerCase() !== profile?.username?.toLowerCase()) ? editData.username.trim().toLowerCase() : '';
      let phToCheck = (editData.phone && editData.phone.trim() && editData.phone.trim() !== profile?.phone) ? editData.phone.trim() : '';

      if (unToCheck || phToCheck) {
        const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', { chk_username: unToCheck, chk_phone: phToCheck });
        if (availErr) throw new Error('Database Error: Unable to verify uniqueness.');
        if (avail?.username_taken) throw new Error('🚨 ALREADY EXISTS! This Username is currently taken by another user.');
        if (avail?.phone_taken) throw new Error('🚨 ALREADY EXISTS! This Phone Number is taken and cannot be duplicated.');
      }

      const { error } = await supabase.from('profiles').update({
        full_name: editData.full_name.trim(),
        phone: editData.phone.trim(),
        username: editData.username.trim().toLowerCase().replace(/\s+/g, '')
      }).eq('id', user.id);
      
      if (error) throw error;
      setIsEditing(false); fetchProfile();
    } catch (err: any) { alert(err.message); }
    setIsSaving(false);
  };

  // Performance Stats
  const todayDisp = transactions.filter(t => t.date.startsWith(new Date().toISOString().split('T')[0])).length;
  const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
  const weekDisp = transactions.filter(t => new Date(t.date) > last7Days).length;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%)', padding: '60px 24px 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '30px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
               <User size={36} color="#fff" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>{profile?.full_name || 'Store Keeper'}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
               <ShieldCheck size={12} /> {t('store.verifiedAccess')}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>
          
          {/* Compact Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.primary }}>{todayDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{t('store.allTime')}</div>
             </div>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.success }}>{weekDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{t('store.last7Days')}</div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {/* Info Section */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('store.manageDetails')}</h3>
                   <button onClick={() => setIsEditing(true)} style={{ background: 'rgba(37,99,235,0.1)', color: T.primary, border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <Edit2 size={12} /> Edit
                   </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Mail size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>{t('store.appSettings')}</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{user?.email || 'N/A'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>{t('store.callSupport')}</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{profile?.phone || '0800 000 0000'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Clock size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>{t('store.dispatchHistory')}</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Action List */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '8px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <button onClick={() => navigate('/store/accounting')} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '16px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                         <TrendingUp size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{t('store.accounting')}</span>
                   </div>
                   <ChevronRight size={16} color={T.txt3} />
                </button>
                <div style={{ height: '1px', background: T.border, margin: '0 12px' }} />
                <button onClick={() => navigate('/store/settings')} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '16px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${T.txt2}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Settings size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{t('store.appSettings')}</span>
                   </div>
                   <ChevronRight size={16} color={T.txt3} />
                </button>
             </div>

             <button onClick={() => signOut()}
               style={{ padding: '16px', borderRadius: '20px', border: 'none', background: `${T.danger}08`, color: T.danger, fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={18} /> {t('store.signOut')}
             </button>
          </div>
        </div>

        <StoreBottomNav />

        {isEditing && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
             <div style={{ background: '#fff', width: '100%', borderRadius: '32px 32px 0 0', padding: '32px 24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                   <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Edit My Profile</h3>
                   <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <input type="text" placeholder="Full Name" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   <input type="text" placeholder="Phone Number" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   <input type="text" placeholder="Username (Optional)" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})} style={{ padding: '16px', borderRadius: '16px', border: `1px solid rgba(0,0,0,0.1)`, background: '#f8fafc', fontWeight: 700, fontSize: '14px' }} />
                   <button onClick={handleSave} disabled={isSaving} style={{ padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '8px' }}>{isSaving ? 'Saving Updates...' : 'Save Profile Changes'}</button>
                </div>
             </div>
           </div>
        )}
      </div>
    </AnimatedPage>
  );
}
