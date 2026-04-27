import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { ShoppingBag, Calendar, Search, CheckCircle2, User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import SupplierBottomNav from '../components/SupplierBottomNav';
import type { Transaction } from '../store/types';

/* ─────────────────────────────────────────
   V3 TOKENS (Light Glass Theme)
────────────────────────────────────────── */
const T = {
  primary: '#4f46e5',
  success: '#10b981',
  danger: '#f43f5e',
  warn: '#f59e0b',
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

export default function SupplierOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products, getPersonalStock, recordSale } = useAppContext();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: allOrds } = await supabase.from('orders')
        .select(`
           *,
           customers ( name, location, phone ),
           order_items (
              quantity,
              price_at_time,
              products ( name )
           )
        `)
        .eq('supplier_id', user!.id)
        .order('created_at', { ascending: false });

      if (allOrds) setOrders(allOrds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id?: string) => products.find(p=>p.id===id)?.name||'Product';

  const processOrder = async (order: any) => {
    // Check personal stock first
    // If order has order_items (relational) use it, else fallback to details (json)
    const items = order.order_items && order.order_items.length > 0 
      ? order.order_items.map((i:any) => ({ productId: i.product_id, quantity: i.quantity, unitPrice: i.price_at_time })) 
      : (order.details || []);

    for (const it of items) {
      const avail = getPersonalStock(it.productId);
      if (avail < it.quantity) {
        alert(`Insufficient Stock: You only have ${avail} units of ${getProductName(it.productId)}. Please request more from the store.`);
        return;
      }
    }

    if (!confirm(`Process this order for ${order.total_price.toLocaleString()}?`)) return;

    // Convert order to a Sale Transaction
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerId: order.customer_id,
      items: items, 
      totalPrice: order.total_price,
      type: 'Debt', 
      status: 'COMPLETED',
      origin: 'POS_SUPPLIER',
      sellerId: user?.id
    };

    try {
      await recordSale(tx);
      // Mark original order as DELIVERED
      await supabase.from('orders').update({ status: 'DELIVERED', payment_status: 'DEBT' }).eq('id', order.id);
      await fetchOrders();
      alert("Order delivered successfully! Stock and ledger updated.");
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const statusMatch = filter === 'all' || (filter === 'pending' && o.status === 'PENDING') || (filter === 'delivered' && o.status === 'DELIVERED');
    const custName = o.customers?.name || '';
    const searchStr = `${o.total_price} ${custName} ${new Date(o.created_at).toLocaleDateString()}`.toLowerCase();
    return statusMatch && searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
        
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
           <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>Customer Orders</h1>
           <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Manage and fulfill requests from your clients.</p>
        </div>

        <div style={{ padding: '20px' }}>
           <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                 <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                 <input 
                    type="text" 
                    placeholder="Search by client or amount..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none' }}
                 />
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="hide-scrollbar">
                 {['all', 'pending', 'delivered'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} 
                       style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: filter === f ? T.primary : '#fff', color: filter === f ? '#fff' : T.txt2, fontWeight: 800, fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer' }}>
                       {f}
                    </button>
                 ))}
              </div>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {loading ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading orders...</div> : (
                <>
                  {filteredOrders.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                        <ShoppingBag size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No Orders Found</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: T.txt3 }}>You have no orders matching your criteria.</p>
                     </div>
                  ) : (
                    filteredOrders.map((o, idx) => {
                      const isPending = o.status === 'PENDING';
                      
                      // Format items string
                      let itemsStr = 'Items';
                      if (o.order_items && o.order_items.length > 0) {
                        itemsStr = o.order_items.map((i: any) => `${i.quantity}x ${i.products?.name}`).join(', ');
                      } else if (o.details && o.details.length > 0) {
                        itemsStr = o.details.map((it: any) => `${it.quantity}x ${products.find(px=>px.id===it.productId)?.name}`).join(', ');
                      }

                      return (
                        <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                           style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                           
                           {/* Order Header */}
                           <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <User size={14} color={T.primary} />
                                    <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{o.customers?.name || 'Customer'}</span>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color={T.txt3} />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: T.txt3 }}>{o.customers?.location || 'No Location'}</span>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{fmtRaw(o.total_price)}</div>
                                 <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', background: isPending ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isPending ? T.warn : T.success, padding: '4px 8px', borderRadius: '6px', marginTop: '4px' }}>
                                    {isPending ? 'Pending' : 'Delivered'}
                                 </div>
                              </div>
                           </div>

                           {/* Order Details */}
                           <div style={{ padding: '16px', background: '#f8fafc' }}>
                              <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '6px' }}>Order Contents</div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink, marginBottom: '12px', lineHeight: 1.4 }}>
                                 {itemsStr}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <Calendar size={12} color={T.txt3} />
                                 <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt2 }}>{new Date(o.created_at).toLocaleString()}</span>
                              </div>
                           </div>

                           {/* Action */}
                           {isPending && (
                             <div style={{ padding: '12px 16px', background: '#fff', borderTop: `1px solid ${T.border}` }}>
                               <motion.button whileTap={{ scale: 0.98 }} onClick={() => processOrder(o)}
                                 style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                                  <CheckCircle2 size={16} /> Approve & Deliver Order
                               </motion.button>
                             </div>
                           )}
                        </motion.div>
                      );
                    })
                  )}
                </>
             )}
           </div>
        </div>

        <SupplierBottomNav />
      </div>
    </AnimatedPage>
  );
}
