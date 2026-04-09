import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { useTranslation } from '../store/LanguageContext';
import { 
  User, Mail, Phone, ShieldCheck, Languages, LogOut, 
  AlertTriangle, TrendingDown, Package, CreditCard,
  MessageSquare, HelpCircle, ChevronRight
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion } from 'framer-motion';

const T = {
  primary: '#4f46e5',
  pLight: 'rgba(79,70,229,0.08)',
  success: '#10b981',
  danger: '#ef4444',
  amber: '#f59e0b',
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

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function SupplierMore() {
  const { user, signOut } = useAuth();
  const { customers, transactions } = useAppContext();
  const { language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  // My supplier account data
  const myAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  // Stats derived from transactions
  const myTransactions = useMemo(() =>
    transactions.filter(t => t.customerId === myAccount?.id || t.sellerId === user?.id),
    [transactions, myAccount, user]);

  const totalDispatched = useMemo(() =>
    myTransactions.filter(t => t.status === 'COMPLETED' && t.type !== 'Return')
      .reduce((s, t) => s + t.totalPrice, 0), [myTransactions]);

  const totalReturned = useMemo(() =>
    myTransactions.filter(t => t.type === 'Return' && t.status === 'COMPLETED')
      .reduce((s, t) => s + t.totalPrice, 0), [myTransactions]);

  const pendingCount = useMemo(() =>
    myTransactions.filter(t => t.status === 'PENDING_STORE' || t.status === 'PENDING_SUPPLIER').length,
    [myTransactions]);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #4f46e5 100%)', padding: '60px 24px 80px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '22px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {(profile?.full_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || 'Supplier'}
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800 }}>
                <ShieldCheck size={11} /> Verified Supplier
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-44px', position: 'relative', zIndex: 20 }}>

          {/* Account Stats - 3 mini cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'My Debt', val: fmt(myAccount?.debtBalance || 0), icon: AlertTriangle, color: myAccount?.debtBalance ? T.danger : T.success },
              { label: 'Dispatched', val: fmt(totalDispatched), icon: Package, color: T.primary },
              { label: 'Pending', val: pendingCount, icon: CreditCard, color: T.amber },
            ].map((s, i) => (
              <div key={i} style={{ background: T.white, borderRadius: '20px', padding: '12px 8px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 8px' }}>
                  <s.icon size={14} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Profile Information */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>My Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Full Name</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{profile?.full_name || 'Loading...'}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: T.border }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, flexShrink: 0 }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{user?.email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: T.border }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, flexShrink: 0 }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{myAccount?.phone || profile?.phone || 'Not set'}</div>
                </div>
              </div>

            </div>
          </div>

          {/* Financial Summary */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lissafi (Summary)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Current Debt', val: fmt(myAccount?.debtBalance || 0), color: myAccount?.debtBalance ? T.danger : T.success, icon: AlertTriangle },
                { label: 'Total Dispatched', val: fmt(totalDispatched), color: T.primary, icon: Package },
                { label: 'Total Returned', val: fmt(totalReturned), color: T.amber, icon: TrendingDown },
                { label: 'Pending Requests', val: String(pendingCount), color: T.txt2, icon: CreditCard },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 12px', background: T.bg, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                    <s.icon size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '8px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: '16px' }}>
            {/* Language Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Languages size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>App Language</div>
                  <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>{language === 'en' ? 'English selected' : 'An zaɓi Hausa'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', background: T.bg, padding: '3px', borderRadius: '10px' }}>
                <button onClick={() => setLanguage('en')} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: language === 'en' ? T.primary : 'transparent', color: language === 'en' ? '#fff' : T.txt3, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>EN</button>
                <button onClick={() => setLanguage('ha')} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: language === 'ha' ? T.primary : 'transparent', color: language === 'ha' ? '#fff' : T.txt3, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>HA</button>
              </div>
            </div>

            <div style={{ height: '1px', background: T.border, margin: '0 14px' }} />

            {/* Support */}
            <motion.button whileTap={{ scale: 0.98 }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>WhatsApp Support</span>
              </div>
              <ChevronRight size={16} color={T.txt3} />
            </motion.button>

            <div style={{ height: '1px', background: T.border, margin: '0 14px' }} />

            <motion.button whileTap={{ scale: 0.98 }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Help & FAQ</span>
              </div>
              <ChevronRight size={16} color={T.txt3} />
            </motion.button>
          </div>

          {/* Sign Out */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={signOut}
            style={{ width: '100%', padding: '16px', borderRadius: '20px', border: 'none', background: `${T.danger}08`, color: T.danger, fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            <LogOut size={18} /> Sign Out Account
          </motion.button>

          {/* App Footer */}
          <div style={{ textAlign: 'center', opacity: 0.45 }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>BAKERY MANAGEMENT SYSTEM</div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '3px' }}>Version 2.4.0 • Built with ❤️ in Nigeria</div>
          </div>

        </div>

      </div>
    </AnimatedPage>
  );
}
