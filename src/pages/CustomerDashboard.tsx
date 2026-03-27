import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { 
  ShoppingBag, Wallet, History,
  LogOut, ArrowRight, Star,
  Calendar, ShoppingCart, User,
  Zap, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   V3 TOKENS (Match Suite)
───────────────────────────────────────── */
const T = {
  bg:        '#fdfdfd', 
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.06)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.05)'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const CustomerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData(user.id);
  }, [user]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      // 0. Fetch Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (prof) setProfile(prof);

      // 1. Try fetching by profile_id linkage
      let { data: cust } = await supabase.from('customers').select('*').eq('profile_id', id).maybeSingle();
      
      // 2. Fallback: If no link but we have email, try matching email
      if (!cust && user?.email) {
         const { data: byEmail } = await supabase.from('customers').select('*').eq('email', user.email).maybeSingle();
         if (byEmail) {
            // Auto-link for future visits
            await supabase.from('customers').update({ profile_id: id }).eq('id', byEmail.id);
            cust = byEmail;
         }
      }

      if (cust) {
        setCustomer(cust);
        const { data: ords } = await supabase.from('orders').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false }).limit(5);
        if (ords) setOrders(ords);
      } else {
        // 3. AUTO-LINK: Create a new customer ledger if none exists
        const { data: newCust, error: createErr } = await supabase.from('customers').insert({
           name: prof?.full_name || user?.email?.split('@')[0] || 'Member',
           email: user?.email,
           profile_id: id,
           debt_balance: 0
        }).select().single();
        
        if (newCust && !createErr) {
           setCustomer(newCust);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary }}>LOADING VAULT...</div>;
  
  if (!customer) return (
    <div style={{ padding: '60px 40px', textAlign: 'center', background: T.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div style={{ color: T.danger, marginBottom: '24px' }}><Zap size={60} /></div>
       <h1 style={{ fontSize: '24px', fontWeight: 900 }}>Profile Unlinked</h1>
       <p style={{ color: T.txt2, fontWeight: 700, margin: '12px 0 32px' }}>Your authentication account ({user?.email}) is not yet linked to a bakery ledger. Please contact management.</p>
       <button onClick={handleSignOut} style={{ padding: '16px 32px', borderRadius: '18px', background: T.ink, color: '#fff', border: 'none', fontWeight: 900 }}>Sign Out</button>
    </div>
  );

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 HEADER */}
        <div style={{ padding: '32px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Customer</p>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', color: T.ink }}>Hello, {profile?.full_name || customer.name}</h1>
           </div>
           <motion.button whileTap={{ scale: 0.9 }} onClick={handleSignOut}
              style={{ width: '48px', height: '48px', borderRadius: '18px', background: '#f8fafc', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
              <LogOut size={20} />
           </motion.button>
        </div>

        {/* BENTO GRID */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
           
           {/* Account Status Brick (Wide) */}
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              style={{ gridColumn: 'span 2', background: `linear-gradient(135deg, ${T.ink}, #2d3748)`, padding: '32px', borderRadius: T.radius, color: '#fff', boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Wallet size={20} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>Account Balance</span>
                 </div>
                 <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em' }}>{fmtRaw(customer.debt_balance || 0)}</div>
                 <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                    {customer.debt_balance > 0 ? 'Outstanding balance owed' : 'Your account is clear'}
                 </div>
              </div>
              <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.1 }}><Zap size={140} /></div>
           </motion.div>

           {/* Quick Stats Bricks */}
           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ color: T.primary, marginBottom: '16px' }}><ShoppingCart size={24} /></div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Orders</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: T.ink }}>{orders.length}+</div>
           </div>

           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ color: T.success, marginBottom: '16px' }}><Star size={24} /></div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: T.ink }}>Gold</div>
           </div>

           {/* History Timeline Brick (Wide) */}
           <div style={{ gridColumn: 'span 2', background: '#fff', padding: '28px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink }}>Recent Activity</h3>
                 <History size={18} color={T.txt3} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {orders.map((o, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: i < orders.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: T.primaryGlow, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <ShoppingBag size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Bulk Order</div>
                         <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(o.created_at).toLocaleDateString()}</div>
                            <span style={{ fontSize: '10px', color: T.txt3 }}>•</span>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: T.success }}>{o.status}</div>
                         </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 900 }}>{fmtRaw(o.total_price)}</div>
                   </div>
                 ))}
                 {orders.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: T.txt3, fontWeight: 700 }}>No history found.</div>}
              </div>
           </div>

           {/* Support Card */}
           <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '24px', borderRadius: T.radius, display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${T.border}` }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                 <User size={24} color={T.primary} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '14px', fontWeight: 800 }}>Account Managed</div>
                 <div style={{ fontSize: '12px', color: T.txt3, fontWeight: 700 }}>Managed by {customer.location || 'Central Bakery'}</div>
              </div>
              <ChevronRight size={20} color={T.txt3} />
           </div>
        </div>

        {/* V3 FLOATING ACTION BAR */}
        <div style={{ position: 'fixed', bottom: '32px', left: '20px', right: '20px', zIndex: 100 }}>
           <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/store')}
              style={{ width: '100%', padding: '20px', borderRadius: '24px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)' }}>
              <ShoppingCart size={22} /> New Order <ArrowRight size={20} />
           </motion.button>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default CustomerDashboard;
