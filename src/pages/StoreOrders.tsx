import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Search, CheckCircle, XCircle, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import StoreBottomNav from '../components/StoreBottomNav';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  danger: '#f43f5e',
  roseL: 'rgba(244,63,94,0.08)',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  bg2: '#ffffff',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmtRaw = (num: number) => "₦" + num.toLocaleString('en-US');

export default function StoreOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'DELIVERED' | 'CANCELLED' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders with customer profile info
      const { data: allOrds } = await supabase.from('orders')
        .select(`
           *,
           order_items (
              quantity,
              price_at_time,
              products ( name )
           )
        `)
        .order('created_at', { ascending: false });

      if (allOrds) {
        // We'll manually join with customers/profiles if needed, or assume orders has a customer helper
        // Since we don't have a direct join here for simplicity, we'll fetch them.
        setOrders(allOrds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (!error) {
        setOrders((prev: any[]) => prev.map((o: any) => o.id === orderId ? { ...o, status } : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const statusMatch = filter === 'ALL' || o.status === filter;
    const searchStr = `${o.id} ${o.total_price}`.toLowerCase();
    return statusMatch && searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Customer Orders</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Manage and fulfill incoming bread orders.</p>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by ID or amount..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(['PENDING', 'DELIVERED', 'CANCELLED', 'ALL'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} 
                  style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: filter === f ? T.primary : '#fff', color: filter === f ? '#fff' : T.txt2, fontWeight: 800, fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer', boxShadow: T.shadow, whiteSpace: 'nowrap' }}>
                  {f.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading orders...</div> : (
              <>
                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                    <Package size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No orders found</h3>
                  </div>
                ) : (
                  filteredOrders.map((o, idx) => (
                    <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Order #{o.id.slice(0,8).toUpperCase()}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{new Date(o.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: T.primary }}>{fmtRaw(o.total_price)}</div>
                      </div>

                      <div style={{ padding: '12px', background: T.bg, borderRadius: '14px', marginBottom: '16px' }}>
                         <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Items</div>
                         <div style={{ fontSize: '13px', fontWeight: 700, color: T.txt }}>
                            {o.order_items?.map((i: any) => `${i.quantity}x ${i.products?.name}`).join(', ') || 'General Order'}
                         </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', background: o.status === 'PENDING' ? 'rgba(59,130,246,0.1)' : o.status === 'DELIVERED' ? 'rgba(16,185,129,0.1)' : T.roseL, color: o.status === 'PENDING' ? '#3b82f6' : o.status === 'DELIVERED' ? T.success : T.danger, padding: '4px 10px', borderRadius: '8px' }}>
                            {o.status}
                         </div>
                         
                         {o.status === 'PENDING' && (
                           <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => updateStatus(o.id, 'CANCELLED')} 
                                style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: T.roseL, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                 <XCircle size={18} />
                              </button>
                              <button onClick={() => updateStatus(o.id, 'DELIVERED')} 
                                style={{ height: '32px', padding: '0 12px', borderRadius: '10px', border: 'none', background: T.success, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                 <CheckCircle size={14} /> Dispatch
                              </button>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
