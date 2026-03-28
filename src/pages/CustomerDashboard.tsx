import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { 
  ShoppingBag, Wallet, History,
  LogOut, ArrowRight, Star,
  Calendar, ShoppingCart, 
  Zap, ChefHat, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { UnifiedReceiptViewer } from '../components/UnifiedReceiptViewer';

/* ─────────────────────────────────────────
   CUTTER/MODEL TOKENS
───────────────────────────────────────── */
const T = {
  bg:        '#f8fafc',
  panel:     '#ffffff',
  border:    'rgba(0,0,0,0.04)',
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.08)',
  success:   '#10b981',
  danger:    '#f43f5e',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  radius:    '24px',
  shadow:    '0 10px 30px -10px rgba(0,0,0,0.05)'
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

export const CustomerDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalBought, setTotalBought] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Receipt Viewer State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (prof) setProfile(prof);

      let { data: cust } = await supabase.from('customers').select('*').eq('profile_id', id).maybeSingle();
      
      if (!cust && user?.email) {
         const { data: byEmail } = await supabase.from('customers').select('*').eq('email', user.email).maybeSingle();
         if (byEmail) {
            await supabase.from('customers').update({ profile_id: id }).eq('id', byEmail.id);
            cust = byEmail;
         }
      }

      if (cust) {
        setCustomer(cust);
        const { data: allOrds } = await supabase.from('orders').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false });
        if (allOrds) {
           setOrders(allOrds.slice(0, 5));
           const bought = allOrds.reduce((sum, o) => sum + (o.total_price || 0), 0);
           setTotalBought(bought);
        }
      } else {
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

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '13px', letterSpacing: '0.05em' }}>LOADING VAULT...</div>;
  
  if (!customer) return (
    <div style={{ padding: '60px 40px', textAlign: 'center', background: T.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div style={{ color: T.danger, marginBottom: '20px' }}><Zap size={48} /></div>
       <h1 style={{ fontSize: '20px', fontWeight: 900 }}>Profile Unlinked</h1>
       <p style={{ color: T.txt2, fontSize: '13px', fontWeight: 700, margin: '12px 0 24px' }}>Account ({user?.email}) not linked. Contact management.</p>
       <button onClick={handleSignOut} style={{ padding: '14px 28px', borderRadius: '16px', background: T.ink, color: '#fff', border: 'none', fontWeight: 900, fontSize: '13px' }}>Sign Out</button>
    </div>
  );

  const isVerified = !!customer.phone || !!customer.assignedSupplierId;
  const debt = customer.debt_balance || 0;
  const totalPaid = Math.max(0, totalBought - debt);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* MODEL HEADER */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: T.primary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member Area</p>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em', color: T.ink }}>Hi, {profile?.full_name?.split(' ')[0] || customer.name.split(' ')[0]}</h1>
           </div>
           <div style={{ display: 'flex', gap: '8px' }}>
             <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/customer/profile')}
                style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <ChefHat size={18} />
             </motion.button>
             <motion.button whileTap={{ scale: 0.9 }} onClick={handleSignOut}
                style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <LogOut size={18} />
             </motion.button>
           </div>
        </div>

        {/* CUTICLES BENTO GRID */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
           
           {/* Account Status / Financial Ledger Brick */}
           {isVerified ? (
             <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ gridColumn: 'span 2', background: `linear-gradient(135deg, ${T.ink}, #1e293b)`, padding: '24px', borderRadius: T.radius, color: '#fff', boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Wallet size={16} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(16, 185, 129, 0.2)', color: T.success, padding: '4px 8px', borderRadius: '8px' }}>Verified Ledger</span>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 8px', borderRadius: '16px' }}>
                         <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Bought (Siya)</div>
                         <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>{fmtRaw(totalBought)}</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 8px', borderRadius: '16px' }}>
                         <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Paid (Biya)</div>
                         <div style={{ fontSize: '13px', fontWeight: 900, color: T.success }}>{fmtRaw(totalPaid)}</div>
                      </div>
                      <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px 8px', borderRadius: '16px' }}>
                         <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Debt (Bashi)</div>
                         <div style={{ fontSize: '13px', fontWeight: 900, color: T.danger }}>{fmtRaw(debt)}</div>
                      </div>
                   </div>
                </div>
                <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.05 }}><Zap size={100} /></div>
             </motion.div>
           ) : (
             <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ gridColumn: 'span 2', background: `linear-gradient(135deg, ${T.danger}, #be123c)`, padding: '24px', borderRadius: T.radius, color: '#fff', boxShadow: T.shadow, display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ShieldAlert size={20} />
                </div>
                <div style={{ flex: 1 }}>
                   <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 900 }}>Action Required</h3>
                   <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Please update your phone number in Profile Settings to unlock your financial ledger.</p>
                </div>
             </motion.div>
           )}

           {/* Quick Stats Bricks */}
           <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ color: T.primary, marginBottom: '12px' }}><ShoppingCart size={18} /></div>
              <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Orders</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{orders.length}</div>
           </div>

           <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ color: T.success, marginBottom: '12px' }}><Star size={18} /></div>
              <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{isVerified ? 'V.I.P' : 'Guest'}</div>
           </div>

           {/* History Timeline Brick */}
           <div style={{ gridColumn: 'span 2', background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: T.ink }}>Recent Orders</h3>
                 <History size={16} color={T.txt3} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {orders.map((o, i) => (
                   <div key={i} onClick={() => setSelectedOrder(o)} 
                     style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', borderBottom: i < orders.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.primaryGlow, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <ShoppingBag size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Bakery Delivery</div>
                         <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={10} /> {new Date(o.created_at).toLocaleDateString()}</div>
                            <span style={{ fontSize: '8px', color: T.txt3 }}>•</span>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: o.status === 'PENDING' ? '#eab308' : T.success }}>{o.status}</div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-0.02em' }}>{fmtRaw(o.total_price)}</div>
                         <div style={{ fontSize: '9px', color: T.primary, fontWeight: 800 }}>Receipt</div>
                      </div>
                   </div>
                 ))}
                 {orders.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: T.txt3, fontWeight: 700, fontSize: '12px' }}>No recent orders.</div>}
              </div>
           </div>

        </div>

        {/* COMPACT FLOATING BAR */}
        <div style={{ position: 'fixed', bottom: '24px', left: '20px', right: '20px', zIndex: 100 }}>
           <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/store')}
              style={{ width: '100%', padding: '16px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.25)' }}>
              <ShoppingCart size={18} /> View Store <ArrowRight size={16} />
           </motion.button>
        </div>

      </div>

      <UnifiedReceiptViewer 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
        appSettings={appSettings} 
        customerName={profile?.full_name || customer?.name} 
      />

    </AnimatedPage>
  );
};

export default CustomerDashboard;
