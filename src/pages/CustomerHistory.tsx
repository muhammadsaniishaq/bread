import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { ChevronRight, FileText, Search, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { UnifiedReceiptViewer } from '../components/UnifiedReceiptViewer';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

/* ─────────────────────────────────────────
   V3 TOKENS (Light Glass Theme)
────────────────────────────────────────── */
const T = {
  primary: '#10b981',
  primaryGlow: 'rgba(16, 185, 129, 0.2)',
  success: '#10b981',
  danger: '#f43f5e',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  bg2: '#ffffff',
  border: 'rgba(0,0,0,0.05)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmtRaw = (num: number) => {
  return "₦" + num.toLocaleString('en-US');
};

export default function CustomerHistory() {
  const { user } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'debt'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: cust } = await supabase.from('customers').select('id, name').eq('profile_id', user!.id).maybeSingle();
      if (!cust) return;
      setCustomerName(cust.name);

      const { data: allOrds } = await supabase.from('orders')
        .select(`
           *,
           order_items (
              quantity,
              price_at_time,
              products ( name )
           )
        `)
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: false });

      if (allOrds) setOrders(allOrds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const paidMatch = filter === 'all' || (filter === 'paid' && o.payment_status === 'PAID') || (filter === 'debt' && o.payment_status === 'DEBT');
    const searchStr = `${o.total_price} ${new Date(o.created_at).toLocaleDateString()}`.toLowerCase();
    return paidMatch && searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
           <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>Receipt History</h1>
           <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Access all your formal payment documents.</p>
        </div>

        <div style={{ padding: '20px' }}>
           <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                 <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                 <input 
                    type="text" 
                    placeholder="Find receipt by date or price..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none' }}
                 />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                 {['all', 'paid', 'debt'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} 
                       style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: filter === f ? T.ink : '#fff', color: filter === f ? '#fff' : T.txt2, fontWeight: 800, fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer' }}>
                       {f}
                    </button>
                 ))}
              </div>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {loading ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading vault...</div> : (
                <>
                  {filteredOrders.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                        <Receipt size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No Receipts</h3>
                     </div>
                  ) : (
                    filteredOrders.map((o, idx) => (
                      <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                         onClick={() => setSelectedOrder(o)}
                         style={{ background: '#fff', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                            <FileText size={20} />
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                               <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt2 }}>{new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink }}>Receipt #{o.id.substring(0,8).toUpperCase()}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{fmtRaw(o.total_price)}</div>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: o.payment_status === 'PAID' ? T.success : T.danger }}>{o.payment_status}</div>
                         </div>
                         <ChevronRight size={18} color={T.txt3} />
                      </motion.div>
                    ))
                  )}
                </>
             )}
           </div>
        </div>

        <UnifiedReceiptViewer 
           isOpen={!!selectedOrder}
           onClose={() => setSelectedOrder(null)}
           order={selectedOrder}
           appSettings={appSettings}
           customerName={customerName || 'Customer'}
        />

        <CustomerBottomNav />
      </div>
    </AnimatedPage>
  );
}
