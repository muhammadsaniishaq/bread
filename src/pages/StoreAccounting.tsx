import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { 
  Link, CheckCircle, 
  Search, Calculator, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import StoreBottomNav from '../components/StoreBottomNav';
import { getTransactionItems } from '../store/types';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  danger: '#f43f5e',
  amber: '#f59e0b',
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

const fmt = (v: number) => "₦" + v.toLocaleString();

export default function StoreAccounting() {
  const { customers, transactions, inventoryLogs, products } = useAppContext();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchCust, setSearchCust] = useState('');
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER');
    if (data) setSuppliers(data);
  };

  const handleAssign = async (supId: string) => {
    if (!selectedCust) return;
    setAssigning(true);
    const { error } = await supabase.from('customers')
      .update({ assignedSupplierId: supId || null })
      .eq('id', selectedCust.id);
    
    if (!error) {
      alert("Supplier Assigned Successfully!");
      setSelectedCust(null);
      // Data will refresh on next AppContext reload or manual refresh
    }
    setAssigning(false);
  };

  // --- Accounting Calculations ---
  const today = new Date().toISOString().split('T')[0];
  
  // Total value received from bakery (Today)
  const receivedTodayValue = inventoryLogs
    .filter(l => l.date.startsWith(today) && (l.type || 'Receive') === 'Receive')
    .reduce((sum, log) => {
      const p = products.find(prod => prod.id === log.productId);
      return sum + (log.quantityReceived * (p?.price || 0));
    }, 0);

  // Total sales recorded (Today)
  const salesTodayValue = transactions
    .filter(t => t.date.startsWith(today))
    .reduce((sum, t) => sum + t.totalPrice, 0);

  // Accounting Summary per product
  const productAunt = products.map(p => {
    const received = inventoryLogs
      .filter(l => l.productId === p.id && (l.type || 'Receive') === 'Receive')
      .reduce((s, l) => s + l.quantityReceived, 0);
    
    const sold = transactions.reduce((s, t) => {
      const items = getTransactionItems(t);
      const item = items.find(i => i.productId === p.id);
      return s + (item?.quantity || 0);
    }, 0);

    return { name: p.name, received, sold, remaining: p.stock };
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCust.toLowerCase()) || 
    (c as any).username?.toLowerCase().includes(searchCust.toLowerCase())
  );

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Accounting & Sync</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Manage supplier assignments and stock reconciliation.</p>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          
          {/* Today's Reconciliation Summary */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calculator size={18} color={T.primary} />
                <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>Reconciliation (Today)</span>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: T.bg, borderRadius: '16px' }}>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Value Received</div>
                   <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{fmt(receivedTodayValue)}</div>
                </div>
                <div style={{ padding: '12px', background: T.bg, borderRadius: '16px' }}>
                   <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Value Dispatched</div>
                   <div style={{ fontSize: '18px', fontWeight: 900, color: T.primary }}>{fmt(salesTodayValue)}</div>
                </div>
             </div>

             <div style={{ marginTop: '12px', padding: '12px', background: receivedTodayValue > salesTodayValue ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: '16px', border: `1px solid ${receivedTodayValue > salesTodayValue ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '12px', fontWeight: 700, color: T.txt2 }}>Net Balance:</span>
                   <span style={{ fontSize: '15px', fontWeight: 900, color: receivedTodayValue > salesTodayValue ? T.amber : T.success }}>
                      {fmt(receivedTodayValue - salesTodayValue)} {receivedTodayValue > salesTodayValue ? '(Pending)' : '(Cleared)'}
                   </span>
                </div>
             </div>
          </div>

          {/* Supplier Assignment Section */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Link size={18} color={T.primary} />
                <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>Assign Supplier</span>
             </div>

             <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search customer to link..." 
                  value={searchCust}
                  onChange={(e) => setSearchCust(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '14px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '13px', fontWeight: 600, color: T.ink, outline: 'none', boxSizing: 'border-box' }}
                />
             </div>

             <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCustomers.slice(0, 15).map(c => {
                  const currentSup = suppliers.find(s => s.id === c.assignedSupplierId);
                  return (
                    <div key={c.id} onClick={() => setSelectedCust(c)}
                      style={{ padding: '12px', borderRadius: '14px', background: selectedCust?.id === c.id ? T.pLight : T.bg, border: `1px solid ${selectedCust?.id === c.id ? T.primary : T.border}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{c.name}</div>
                          <div style={{ fontSize: '10px', color: T.txt3 }}>{currentSup ? `Assigned to: ${currentSup.full_name}` : 'Not assigned'}</div>
                       </div>
                       {selectedCust?.id === c.id && <CheckCircle size={16} color={T.primary} />}
                    </div>
                  );
                })}
             </div>
          </div>

          <AnimatePresence>
            {selectedCust && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: '0 -10px 40px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, marginBottom: '12px' }}>Assign Supplier to {selectedCust.name}</div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {suppliers.map(s => (
                      <button key={s.id} onClick={() => handleAssign(s.id)} disabled={assigning}
                        style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700, color: T.txt, cursor: 'pointer', textAlign: 'left' }}>
                        {s.full_name}
                      </button>
                    ))}
                    <button onClick={() => handleAssign('')} disabled={assigning}
                      style={{ padding: '10px', borderRadius: '12px', border: `1px dashed ${T.danger}`, background: 'rgba(244,63,94,0.05)', fontSize: '12px', fontWeight: 700, color: T.danger, cursor: 'pointer' }}>
                      Remove Assignment
                    </button>
                 </div>
                 <button onClick={() => setSelectedCust(null)} style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: T.txt3, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product flow breakdown */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BarChart3 size={18} color={T.primary} />
                <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>Product Flow (Lifetime)</span>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {productAunt.map((pa, idx) => (
                  <div key={idx}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: T.txt }}>{pa.name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{pa.received} Recv | {pa.sold} Sold</span>
                     </div>
                     <div style={{ height: '8px', background: T.bg, borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(pa.sold / (pa.received || 1)) * 100}%`, background: T.primary }} />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
