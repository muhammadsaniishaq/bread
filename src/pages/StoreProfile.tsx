import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { User, Mail, Clock, TrendingUp, LogOut, ChevronRight, Settings, Phone, ShieldCheck } from 'lucide-react';
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
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) setProfile(data);
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
               <ShieldCheck size={12} /> Verified Personnel
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>
          
          {/* Compact Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.primary }}>{todayDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Today</div>
             </div>
             <div style={{ background: T.white, borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: T.success }}>{weekDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Weekly</div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {/* Info Section */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel Details</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Mail size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>System Email</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{user?.email || 'N/A'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Contact</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{profile?.phone || '0800 000 0000'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Clock size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Member Since</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{new Date(profile?.created_at).toLocaleDateString()}</div>
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
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Reconciliation</span>
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
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Settings</span>
                   </div>
                   <ChevronRight size={16} color={T.txt3} />
                </button>
             </div>

             <button onClick={() => signOut()}
               style={{ padding: '16px', borderRadius: '20px', border: 'none', background: `${T.danger}08`, color: T.danger, fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={18} /> Sign Out Account
             </button>
          </div>
        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
