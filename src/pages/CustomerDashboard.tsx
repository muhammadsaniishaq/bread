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
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#475569',
  txt3:      '#94a3b8',
  bg2:       '#f1f5f9',
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.05)',
  glass:     'rgba(255,255,255,0.8)'
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
      if (prof) {
         if (!prof.full_name && user?.user_metadata?.full_name) {
             prof.full_name = user.user_metadata.full_name;
             supabase.from('profiles').update({ full_name: prof.full_name }).eq('id', id).then();
         }
         setProfile(prof);
      }

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
           name: prof?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member',
           email: user?.user_metadata?.contact_email || user?.email,
           phone: user?.user_metadata?.phone || '',
           location: user?.user_metadata?.location || '',
           profile_id: id,
           debt_balance: 0
        }).select().single();
        
        if (newCust && !createErr) setCustomer(newCust);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontWeight: 900, color: T.primary, fontSize: '13px', letterSpacing: '0.05em' }}>LOADING PORTAL...</div>;
  
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
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* V3 STICKY HEADER */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.7)', backdropFilter: 'blur(16px)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: `1px solid ${T.border}` }}>
           <h1 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: T.txt, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hi, {profile?.full_name?.split(' ')[0] || customer.name.split(' ')[0]}
           </h1>
           <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/profile')} 
                style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                 <ChefHat size={18} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSignOut} 
                style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.danger, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                 <LogOut size={18} />
              </motion.button>
           </div>
        </div>

        {/* BENTO GRID */}
        <div style={{ padding: '24px 16px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
           
           {/* Modern Light Financial Ledger Brick */}
           {isVerified ? (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ background: '#ffffff', padding: '32px 24px', borderRadius: T.radius, color: T.ink, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                         <Wallet size={18} color="#10b981" />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(16, 185, 129, 0.1)', color: T.success, padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Verified Ledger</span>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '16px 8px', borderRadius: '20px', border: `1px solid ${T.border}` }}>
                         <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Bought</div>
                         <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{fmtRaw(totalBought)}</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px 8px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                         <div style={{ fontSize: '10px', color: T.txt2, fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Paid</div>
                         <div style={{ fontSize: '15px', fontWeight: 900, color: T.success }}>{fmtRaw(totalPaid)}</div>
                      </div>
                      <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '16px 8px', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                         <div style={{ fontSize: '10px', color: T.txt2, fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Debt</div>
                         <div style={{ fontSize: '15px', fontWeight: 900, color: T.danger }}>{fmtRaw(debt)}</div>
                      </div>
                   </div>
                </div>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '50%', pointerEvents: 'none' }} />
             </motion.div>
           ) : (
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ background: '#fff1f2', padding: '32px 24px', borderRadius: T.radius, color: T.ink, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)', border: `1px solid #ffe4e6`, display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.danger }}>
                   <ShieldAlert size={24} />
                </div>
                <div style={{ flex: 1 }}>
                   <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 900, color: T.danger }}>Action Required</h3>
                   <p style={{ margin: 0, fontSize: '12px', color: T.txt, fontWeight: 700, lineHeight: 1.5 }}>Please update your phone number in Profile Settings to unlock your financial ledger.</p>
                </div>
             </motion.div>
           )}

           {/* Loyalty Tier */}
           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: totalBought >= 150000 ? '#fef08a' : totalBought >= 50000 ? '#e2e8f0' : '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: totalBought >= 150000 ? '#eab308' : totalBought >= 50000 ? '#64748b' : '#f97316' }}>
                 <Star size={28} fill="currentColor" />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                       <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loyalty Tier</div>
                       <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{totalBought >= 150000 ? 'Gold Member' : totalBought >= 50000 ? 'Silver Member' : 'Bronze Starter'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '10px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase' }}>Orders</div>
                       <div style={{ fontSize: '16px', fontWeight: 900, color: T.primary }}>{orders.length} <ShoppingCart size={14} style={{ display: 'inline', marginBottom: '-2px' }} /></div>
                    </div>
                 </div>
                 
                 {/* V3 Progress Bar */}
                 <div style={{ position: 'relative' }}>
                    <div style={{ height: '8px', background: T.bg2, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                       <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totalBought / (totalBought >= 50000 ? 150000 : 50000)) * 100)}%` }} transition={{ duration: 1, delay: 0.5 }}
                          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: totalBought >= 150000 ? '#eab308' : totalBought >= 50000 ? '#94a3b8' : '#f97316', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, marginTop: '8px', textAlign: 'right' }}>
                       {totalBought >= 150000 ? 'Max Tier Reached' : `${fmtRaw((totalBought >= 50000 ? 150000 : 50000) - totalBought)} to next tier`}
                    </div>
                 </div>
              </div>
           </div>

           {/* History Timeline Brick */}
           <div style={{ background: '#fff', padding: '24px', borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: T.ink }}>Recent Orders</h3>
                 <History size={18} color={T.txt3} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {orders.map((o, i) => (
                   <div key={i} onClick={() => setSelectedOrder(o)} 
                     style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: i < orders.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: T.primaryGlow, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <ShoppingBag size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>Bakery Delivery</div>
                         <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: T.txt3, display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(o.created_at).toLocaleDateString()}</div>
                            <span style={{ fontSize: '10px', color: T.txt3 }}>•</span>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: o.status === 'PENDING' ? '#eab308' : T.success }}>{o.status}</div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.02em', color: T.txt }}>{fmtRaw(o.total_price)}</div>
                         <div style={{ fontSize: '10px', color: T.primary, fontWeight: 800, marginTop: '2px' }}>Receipt</div>
                      </div>
                   </div>
                 ))}
                 {orders.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: T.txt3, fontWeight: 700, fontSize: '13px' }}>No recent orders.</div>}
              </div>
           </div>

        </div>

        {/* COMPACT FLOATING BAR */}
        <div style={{ position: 'fixed', bottom: '24px', left: '16px', right: '16px', zIndex: 100 }}>
           <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/customer/store')}
              style={{ width: '100%', padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.25)' }}>
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
