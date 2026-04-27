import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { ShoppingBag, Calendar, Search, CheckCircle2, User, MapPin, X, Phone, Package, Clock, Navigation, MessageCircle, XCircle, Share2, Wallet, CalendarDays, RefreshCw, Download, ArrowDownAZ, Copy, Printer, Banknote, Target, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'dateDesc'|'dateAsc'|'amountDesc'|'amountAsc'>('dateDesc');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();

    // Ask for browser notification permission
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    // Subscribe to new orders in realtime
    const channel = supabase
      .channel('supplier-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `supplier_id=eq.${user.id}` },
        () => {
           // Try to play a notification sound
           try {
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(e => console.log('Audio play prevented by browser', e));
           } catch(e) {}
           
           // Show browser notification if permitted
           if ("Notification" in window && Notification.permission === "granted") {
             new Notification('Sabon Order Ya Shigo! 🍞', {
                body: 'Ka duba jerin orders dinka yanzu domin ka amince dashi.',
                icon: '/vite.svg'
             });
           }
           
           // Fetch orders again to show the new one
           fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: allOrds, error } = await supabase.from('orders')
        .select(`
           *,
           customers ( name, location, phone, image, debt_balance ),
           order_items (
              quantity,
              price_at_time,
              products ( name )
           )
        `)
        .eq('supplier_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching orders:", error);
      if (allOrds) setOrders(allOrds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id?: string) => products.find(p=>p.id===id)?.name||'Product';

  const processOrder = async (order: any, method: 'CASH' | 'DEBT') => {
    // Check personal stock first
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

    if (!confirm(`Process this order as ${method} for ${fmtRaw(order.total_price)}?`)) return;

    // Convert order to a Sale Transaction
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerId: order.customer_id,
      items: items, 
      totalPrice: order.total_price,
      type: method === 'CASH' ? 'Cash' : 'Debt', 
      status: 'COMPLETED',
      origin: 'POS_SUPPLIER',
      sellerId: user?.id
    };

    try {
      await recordSale(tx);
      await supabase.from('orders').update({ status: 'DELIVERED', payment_status: method }).eq('id', order.id);
      await fetchOrders();
      alert(`Order delivered successfully as ${method}!`);
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  };

  const rejectOrder = async (order: any) => {
    if (!confirm(`Are you sure you want to REJECT this order? This action cannot be undone.`)) return;
    try {
      await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
      await fetchOrders();
      alert("Order has been cancelled.");
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleShare = (order: any) => {
    let itemsStr = '';
    const items = order.order_items && order.order_items.length > 0 
      ? order.order_items.map((i:any) => ({ name: i.products?.name, quantity: i.quantity, price: i.price_at_time })) 
      : (order.details || []).map((i:any) => ({ name: getProductName(i.productId), quantity: i.quantity, price: i.unitPrice }));

    items.forEach((it: any) => {
       itemsStr += `${it.quantity}x ${it.name} - ${fmtRaw(it.quantity * (it.price || 0))}\n`;
    });
    const text = `*ORDER RECEIPT*\n\nCustomer: ${order.customers?.name || 'Unknown'}\nDate: ${new Date(order.created_at).toLocaleString()}\n\n*Items:*\n${itemsStr}\n*Total: ${fmtRaw(order.total_price)}*\nStatus: ${order.status}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Order Receipt', text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard!');
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label} copied!`);
  };

  const printReceipt = (order: any) => {
    let itemsStr = '';
    const items = order.order_items && order.order_items.length > 0 
      ? order.order_items.map((i:any) => ({ name: i.products?.name, quantity: i.quantity, price: i.price_at_time })) 
      : (order.details || []).map((i:any) => ({ name: getProductName(i.productId), quantity: i.quantity, price: i.unitPrice }));

    items.forEach((it: any) => {
       itemsStr += `
         <tr>
           <td style="padding: 8px 0; border-bottom: 1px dashed #ccc;">${it.name}</td>
           <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; text-align: center;">${it.quantity}</td>
           <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; text-align: right;">${fmtRaw(it.quantity * (it.price || 0))}</td>
         </tr>
       `;
    });

    const printContent = `
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin: 0 0 10px; }
            .meta { font-size: 12px; margin-bottom: 20px; text-align: center; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .total { font-weight: bold; font-size: 16px; text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #555; }
          </style>
        </head>
        <body>
          <h2>ORDER RECEIPT</h2>
          <div class="meta">
            <div>${new Date(order.created_at).toLocaleString()}</div>
            <div style="margin-top: 8px; font-weight: bold; font-size: 14px;">Customer: ${order.customers?.name || 'N/A'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 8px; border-bottom: 1px solid #000;">Item</th>
                <th style="text-align: center; padding-bottom: 8px; border-bottom: 1px solid #000;">Qty</th>
                <th style="text-align: right; padding-bottom: 8px; border-bottom: 1px solid #000;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsStr}
            </tbody>
          </table>
          <div class="total">TOTAL: ${fmtRaw(order.total_price)}</div>
          <div class="footer">Thank you for your business!</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const filteredOrders = orders.filter(o => {
    const statusMatch = filter === 'all' || (filter === 'pending' && o.status === 'PENDING') || (filter === 'delivered' && o.status === 'DELIVERED');
    const custName = o.customers?.name || '';
    const searchStr = `${o.total_price} ${custName} ${new Date(o.created_at).toLocaleDateString()}`.toLowerCase();
    
    let dateMatch = true;
    const oDate = o.created_at ? o.created_at.split('T')[0] : '';
    if (dateFilter === 'today') dateMatch = oDate === today;
    if (dateFilter === 'yesterday') dateMatch = oDate === yesterday;

    const clientMatch = customerFilter === 'all' || custName === customerFilter;

    return statusMatch && dateMatch && clientMatch && searchStr.includes(searchTerm.toLowerCase());
  });

  const uniqueCustomers = Array.from(new Set(orders.map(o => o.customers?.name).filter(Boolean)));

  const pendingVal = orders.filter(o => o.status === 'PENDING').reduce((s, o) => s + o.total_price, 0);
  const deliveredVal = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total_price, 0);

  // Daily Goal (Hardcoded to 100k for gamification, or could be dynamic)
  const dailyGoal = 100000;
  const progressPercent = Math.min((deliveredVal / dailyGoal) * 100, 100);

  const exportCSV = () => {
    const headers = "Order ID,Customer,Location,Date,Amount,Status\n";
    const rows = filteredOrders.map(o => `"${o.id}","${o.customers?.name || 'N/A'}","${o.customers?.location || 'N/A'}","${new Date(o.created_at).toLocaleString()}","${o.total_price}","${o.status}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Supplier_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
      if (sortOrder === 'dateDesc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'dateAsc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === 'amountDesc') return b.total_price - a.total_price;
      if (sortOrder === 'amountAsc') return a.total_price - b.total_price;
      return 0;
  });

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
        
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>Customer Orders</h1>
             <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Manage and fulfill requests.</p>
           </div>
           <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={exportCSV} style={{ background: 'rgba(16,185,129,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.success }}>
               <Download size={16} />
             </button>
             <button onClick={fetchOrders} style={{ background: 'rgba(79,70,229,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.primary }}>
               <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                 <RefreshCw size={16} />
               </motion.div>
             </button>
           </div>
        </div>

        <div style={{ padding: '20px' }}>
           {/* Daily Target Progress */}
           <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', marginBottom: '16px', border: `1px solid ${T.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
               <div style={{ fontSize: '12px', fontWeight: 800, color: T.txt2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Target size={14} color={T.primary} /> Daily Target Progress
               </div>
               <div style={{ fontSize: '13px', fontWeight: 900, color: T.ink }}>{Math.round(progressPercent)}%</div>
             </div>
             <div style={{ height: '8px', background: T.bg, borderRadius: '4px', overflow: 'hidden' }}>
               <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: T.txt3 }}>
               <span>{fmtRaw(deliveredVal)} Delivered</span>
               <span>Goal: {fmtRaw(dailyGoal)}</span>
             </div>
           </div>

           {/* Stats Row */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '20px', padding: '16px', color: '#fff', boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14}/> Delivered Value</div>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '8px' }}>{fmtRaw(deliveredVal)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '20px', padding: '16px', color: '#fff', boxShadow: '0 4px 16px rgba(245,158,11,0.2)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> Pending Value</div>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '8px' }}>{fmtRaw(pendingVal)}</div>
              </div>
           </div>

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

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }} className="hide-scrollbar">
                 {['all', 'pending', 'delivered'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} 
                       style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: filter === f ? T.primary : '#fff', color: filter === f ? '#fff' : T.txt2, fontWeight: 800, fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                       {f}
                    </button>
                 ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="hide-scrollbar">
                 {['all', 'today', 'yesterday'].map(d => (
                    <button key={d} onClick={() => setDateFilter(d as any)} 
                       style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${dateFilter === d ? T.primary : T.border}`, background: dateFilter === d ? 'rgba(79,70,229,0.1)' : '#fff', color: dateFilter === d ? T.primary : T.txt2, fontWeight: 800, fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <CalendarDays size={12} /> {d === 'all' ? 'All Time' : d}
                    </button>
                 ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                 <button onClick={() => setSortOrder(sortOrder === 'dateDesc' ? 'dateAsc' : 'dateDesc')} style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${T.border}`, background: '#fff', color: T.ink, fontWeight: 800, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowDownAZ size={12} /> Date {sortOrder === 'dateDesc' ? '↓' : '↑'}
                 </button>
                 <button onClick={() => setSortOrder(sortOrder === 'amountDesc' ? 'amountAsc' : 'amountDesc')} style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${T.border}`, background: '#fff', color: T.ink, fontWeight: 800, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wallet size={12} /> Amount {sortOrder === 'amountDesc' ? '↓' : '↑'}
                 </button>
              </div>

              {uniqueCustomers.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                   <button onClick={() => setCustomerFilter('all')} style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${customerFilter === 'all' ? T.primary : T.border}`, background: customerFilter === 'all' ? 'rgba(79,70,229,0.1)' : '#fff', color: customerFilter === 'all' ? T.primary : T.txt2, fontWeight: 800, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      All Clients
                   </button>
                   {uniqueCustomers.map((name: any) => (
                      <button key={name} onClick={() => setCustomerFilter(name)} style={{ padding: '8px 16px', borderRadius: '12px', border: `1px solid ${customerFilter === name ? T.primary : T.border}`, background: customerFilter === name ? 'rgba(79,70,229,0.1)' : '#fff', color: customerFilter === name ? T.primary : T.txt2, fontWeight: 800, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                         {name}
                      </button>
                   ))}
                </div>
              )}
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {loading && orders.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading orders...</div> : (
                <>
                  {sortedOrders.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                        <ShoppingBag size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No Orders Found</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: T.txt3 }}>You have no orders matching your criteria.</p>
                     </div>
                  ) : (
                    sortedOrders.map((o, idx) => {
                      const isPending = o.status === 'PENDING';
                      const isOverdue = isPending && o.created_at && (Date.now() - new Date(o.created_at).getTime() > 12 * 60 * 60 * 1000);
                      const isNew = isPending && o.created_at && (Date.now() - new Date(o.created_at).getTime() < 60 * 60 * 1000);
                      const shortId = o.id ? o.id.toString().split('-')[0].toUpperCase() : 'ORD';
                      
                      // Format items string
                      let itemsStr = 'Items';
                      let totalQty = 0;
                      if (o.order_items && o.order_items.length > 0) {
                        itemsStr = o.order_items.map((i: any) => `${i.quantity}x ${i.products?.name}`).join(', ');
                        totalQty = o.order_items.reduce((s:number, i:any) => s + i.quantity, 0);
                      } else if (o.details && o.details.length > 0) {
                        itemsStr = o.details.map((it: any) => `${it.quantity}x ${products.find(px=>px.id===it.productId)?.name}`).join(', ');
                        totalQty = o.details.reduce((s:number, i:any) => s + i.quantity, 0);
                      }

                      return (
                        <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                           onClick={() => setSelectedOrder(o)}
                           style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                           
                           {/* Order Header */}
                           <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <User size={14} color={T.primary} />
                                    <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{o.customers?.name || 'Customer'}</span>
                                    {o.customers?.phone && (
                                       <a href={`tel:${o.customers.phone}`} onClick={e => e.stopPropagation()} style={{ width: '20px', height: '20px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                          <Phone size={10} color="#10b981" />
                                       </a>
                                    )}
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color={T.txt3} />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: T.txt3 }}>{o.customers?.location || 'No Location'}</span>
                                 </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, marginBottom: '2px' }}>#{shortId}</div>
                                 <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{fmtRaw(o.total_price)}</div>
                                 <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', background: o.status === 'CANCELLED' ? 'rgba(244,63,94,0.1)' : isPending ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: o.status === 'CANCELLED' ? T.danger : isPending ? T.warn : T.success, padding: '4px 8px', borderRadius: '6px', marginTop: '4px' }}>
                                    {o.status === 'CANCELLED' ? 'Cancelled' : isPending ? 'Pending' : 'Delivered'}
                                 </div>
                                 {isOverdue && (
                                    <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(244,63,94,0.1)', color: T.danger, padding: '4px 8px', borderRadius: '6px', marginTop: '4px', marginLeft: '4px' }}>
                                       🚨 Overdue
                                    </div>
                                 )}
                                 {isNew && (
                                    <div style={{ display: 'inline-block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', padding: '4px 8px', borderRadius: '6px', marginTop: '4px', marginLeft: '4px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                                       ✨ New
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Order Details */}
                           <div style={{ padding: '16px', background: '#f8fafc' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Order Contents</div>
                                <div style={{ fontSize: '10px', fontWeight: 900, color: T.primary, background: 'rgba(79,70,229,0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                                  🥖 {totalQty} Loaves
                                </div>
                              </div>
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
                             <div style={{ padding: '12px 16px', background: '#fff', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '8px' }}>
                               <motion.button whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); processOrder(o, 'CASH'); }}
                                 style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', color: T.success, fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <Banknote size={14} /> Cash
                               </motion.button>
                               <motion.button whileTap={{ scale: 0.98 }} onClick={(e) => { e.stopPropagation(); processOrder(o, 'DEBT'); }}
                                 style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <Wallet size={14} /> Debt
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

      {/* ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: '#fff', borderRadius: '32px 32px 0 0', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: T.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Order #{selectedOrder.id ? selectedOrder.id.toString().split('-')[0].toUpperCase() : 'ORD'}
                  </h2>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: T.txt3 }}>Placed: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.txt2 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Customer Info Box */}
              <div style={{ background: T.bg, borderRadius: '20px', padding: '16px', marginBottom: '20px', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  {selectedOrder.customers?.image ? (
                    <img src={selectedOrder.customers.image} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontSize: '16px', fontWeight: 900 }}>
                      {selectedOrder.customers?.name ? selectedOrder.customers.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Name</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{selectedOrder.customers?.name || 'Unknown'}</div>
                    {selectedOrder.customers?.debt_balance > 0 && (
                      <div style={{ fontSize: '11px', fontWeight: 800, color: T.danger, marginTop: '2px' }}>
                        Debt: {fmtRaw(selectedOrder.customers.debt_balance)}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div onClick={() => handleCopy(selectedOrder.customers?.phone, 'Phone Number')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg-gray">
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}><Phone size={14} /></div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedOrder.customers?.phone || 'N/A'}
                      <Copy size={12} color={T.txt3} />
                    </div>
                  </div>
                  <div onClick={() => handleCopy(selectedOrder.customers?.location, 'Location')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} className="hover-bg-gray">
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}><MapPin size={14} /></div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedOrder.customers?.location || 'N/A'}
                      <Copy size={12} color={T.txt3} style={{ flexShrink: 0 }} />
                    </div>
                  </div>
                </div>

                {/* Useful Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${T.border}`, paddingTop: '16px' }}>
                  <a href={`tel:${selectedOrder.customers?.phone || ''}`} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: T.ink, fontSize: '11px', fontWeight: 800 }}>
                    <Phone size={14} color={T.primary} /> Call
                  </a>
                  <a href={`https://wa.me/${(selectedOrder.customers?.phone || '').replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${selectedOrder.customers?.name || ''}, your order of ${fmtRaw(selectedOrder.total_price)} has been confirmed and is on the way!`)}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: T.ink, fontSize: '11px', fontWeight: 800 }}>
                    <MessageCircle size={14} color="#10b981" /> WhatsApp
                  </a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.customers?.location || '')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: T.ink, fontSize: '11px', fontWeight: 800 }}>
                    <Navigation size={14} color="#f59e0b" /> Trace
                  </a>
                  <button onClick={() => printReceipt(selectedOrder)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', color: T.ink, fontSize: '11px', fontWeight: 800 }}>
                    <Printer size={14} color={T.primary} /> Print
                  </button>
                  <button onClick={() => handleShare(selectedOrder)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#fff', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', color: T.ink, fontSize: '11px', fontWeight: 800 }}>
                    <Share2 size={14} color={T.primary} /> Share
                  </button>
                </div>
                </div>

                {/* Quick Messages */}
                {selectedOrder.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '16px', paddingBottom: '4px' }} className="hide-scrollbar">
                    <a href={`https://wa.me/${(selectedOrder.customers?.phone || '').replace(/\D/g,'')}?text=${encodeURIComponent("Ina kan hanya (I'm on my way)")}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: '10px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={10} /> "On my way"
                    </a>
                    <a href={`https://wa.me/${(selectedOrder.customers?.phone || '').replace(/\D/g,'')}?text=${encodeURIComponent("Na iso kofar gida (I have arrived)")}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(79,70,229,0.1)', color: T.primary, fontSize: '10px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={10} /> "I have arrived"
                    </a>
                    <a href={`https://wa.me/${(selectedOrder.customers?.phone || '').replace(/\D/g,'')}?text=${encodeURIComponent("Gayi hakuri, biredin ya kare (Sorry, out of stock)")}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(244,63,94,0.1)', color: T.danger, fontSize: '10px', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={10} /> "Out of stock"
                    </a>
                  </div>
                )}

              {/* Order Items */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color={T.primary} /> Items Ordered
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                  {(() => {
                    const items = selectedOrder.order_items && selectedOrder.order_items.length > 0 
                      ? selectedOrder.order_items.map((i:any) => ({ id: i.product_id, name: i.products?.name, quantity: i.quantity, price: i.price_at_time })) 
                      : (selectedOrder.details || []).map((i:any) => ({ id: i.productId, name: getProductName(i.productId), quantity: i.quantity, price: i.unitPrice }));

                    return items.map((it: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: i % 2 === 0 ? '#fff' : T.bg, borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{it.name || 'Product'}</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{it.quantity} units x {fmtRaw(it.price || 0)}</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>
                          {fmtRaw(it.quantity * (it.price || 0))}
                        </div>
                      </div>
                    ));
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f1f5f9', borderTop: `2px solid ${T.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Total Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: T.primary }}>{fmtRaw(selectedOrder.total_price)}</div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '20px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '16px' }}>Order Journey</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                   {/* Step 1: Placed */}
                   <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={12}/></div>
                        <div style={{ width: '2px', height: '24px', background: T.primary, opacity: 0.2, margin: '4px 0' }}></div>
                     </div>
                     <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Order Placed</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{new Date(selectedOrder.created_at).toLocaleTimeString()}</div>
                     </div>
                   </div>
                   {/* Step 2: Status */}
                   <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: selectedOrder.status === 'CANCELLED' ? T.danger : selectedOrder.status === 'PENDING' ? '#f59e0b' : T.success, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {selectedOrder.status === 'CANCELLED' ? <XCircle size={12}/> : selectedOrder.status === 'PENDING' ? <Clock size={12}/> : <CheckCircle2 size={12}/>}
                        </div>
                     </div>
                     <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: selectedOrder.status === 'CANCELLED' ? T.danger : selectedOrder.status === 'PENDING' ? '#d97706' : T.success }}>
                           {selectedOrder.status === 'CANCELLED' ? 'Order Cancelled' : selectedOrder.status === 'PENDING' ? 'Awaiting Delivery' : 'Delivered'}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>
                           {selectedOrder.status === 'PENDING' ? 'Supplier needs to approve' : 'Action completed'}
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              {selectedOrder.status === 'PENDING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => { processOrder(selectedOrder, 'CASH'); setSelectedOrder(null); }}
                      style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', color: T.success, fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Banknote size={16} /> Paid in Cash
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => { processOrder(selectedOrder, 'DEBT'); setSelectedOrder(null); }}
                      style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}>
                      <Wallet size={16} /> Record as Debt
                    </motion.button>
                  </div>
                  
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => { rejectOrder(selectedOrder); setSelectedOrder(null); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '16px', border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.05)', color: T.danger, fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <XCircle size={16} /> Reject Order
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
