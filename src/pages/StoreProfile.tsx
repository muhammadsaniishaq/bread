import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { User, Mail, Clock, TrendingUp, LogOut, ChevronRight, Settings, Phone } from 'lucide-react';
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
  bg2: '#ffffff',
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

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Performance Stats
  const todayDisp = transactions.filter(t => t.date.startsWith(new Date().toISOString().split('T')[0])).length;
  const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
  const weekDisp = transactions.filter(t => new Date(t.date) > last7Days).length;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '60px 20px 40px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10, display: 'inline-block' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '30px', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(10px)' }}>
               <User size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{profile?.full_name || 'Store Keeper'}</h2>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', padding: '4px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', display: 'inline-block' }}>
               {profile?.role === 'STORE_KEEPER' ? 'Official Store Keeper' : 'Staff Member'}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-24px', position: 'relative', zIndex: 20 }}>
          
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
             <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: T.primary }}>{todayDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Today Dispatch</div>
             </div>
             <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: T.success }}>{weekDisp}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Weekly Total</div>
             </div>
          </div>

          {/* Info Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, color: T.ink }}>Account Details</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Mail size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Email Address</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.txt }}>{user?.email || 'N/A'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Phone Number</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.txt }}>{profile?.phone || '0800 000 0000'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Clock size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>Job Since</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.txt }}>{new Date(profile?.created_at).toLocaleDateString()}</div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Actions */}
             <div style={{ background: '#fff', borderRadius: '20px', padding: '10px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <button onClick={() => navigate('/store/accounting')} 
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TrendingUp size={18} color={T.primary} />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Reconciliation & Accounting</span>
                   </div>
                   <ChevronRight size={18} color={T.txt3} />
                </button>
                <div style={{ height: '1px', background: T.border, margin: '0 10px' }} />
                <button onClick={() => navigate('/store/settings')} 
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Settings size={18} color={T.txt2} />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Profile Settings</span>
                   </div>
                   <ChevronRight size={18} color={T.txt3} />
                </button>
             </div>

             <button onClick={handleLogout}
               style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#fff', boxShadow: T.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: T.danger, fontWeight: 900, cursor: 'pointer' }}>
                <LogOut size={18} /> Logout Account
             </button>
          </div>
        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
