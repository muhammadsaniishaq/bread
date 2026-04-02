import { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { 
  ArrowDownLeft, ArrowUpRight, Clock, 
  CheckCircle, Plus, Wallet, History, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg: '#fbfbff', white: '#ffffff', 
  primary: '#6366f1', pLight: 'rgba(99,102,241,0.08)',
  accent: '#8b5cf6', accentL: 'rgba(139,92,246,0.1)',
  success: '#10b981', successL: 'rgba(16,185,129,0.1)',
  danger: '#f43f5e', dangerL: 'rgba(244,63,94,0.1)',
  ink: '#1e1b4b', txt2: '#475569', txt3: '#94a3b8',
  border: 'rgba(0,0,0,0.06)', radius: '24px',
  shadow: '0 4px 20px rgba(99,102,241,0.08)',
};

const fmt = (v: number) => "₦" + v.toLocaleString();

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { customers, products, transactions, recordSale } = useAppContext();
  
  const [showModal, setShowModal] = useState<'RECEIVE' | 'RETURN' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [selectedProd, setSelectedProd] = useState('');
  const [qty, setQty] = useState('');

  // 1. Identify the Supplier's Customer record
  const myAccount = useMemo(() => 
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  // 2. Filter Transactions for this Supplier
  const myTxs = useMemo(() => 
    transactions.filter(t => t.customerId === myAccount?.id), [transactions, myAccount]);

  const pendingTxs = myTxs.filter(t => t.status === 'PENDING_STORE');
  const completedTxs = myTxs.filter(t => t.status === 'COMPLETED');

  const handleSubmit = async () => {
    if (!selectedProd || !qty || !myAccount) return;
    setSubmitting(true);
    
    const prod = products.find(p => p.id === selectedProd);
    if (!prod) return;

    const txId = Date.now().toString();
    const newTx: any = {
      id: txId,
      date: new Date().toISOString(),
      customerId: myAccount.id,
      type: showModal === 'RECEIVE' ? 'Debt' : 'Return',
      status: 'PENDING_STORE', // Needs Store Keeper confirmation
      origin: 'SUPPLIER',
      items: [{ productId: selectedProd, quantity: Number(qty), unitPrice: prod.price }],
      totalPrice: Number(qty) * prod.price
    };

    await recordSale(newTx);
    setShowModal(null);
    setSelectedProd('');
    setQty('');
    setSubmitting(false);
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header Section */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', padding: '48px 24px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Dashboard</p>
            <h1 style={{ margin: '4px 0 20px', fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Barka da zuwa, {user?.user_metadata?.full_name?.split(' ')[0] || 'Supplier'}
            </h1>

            {/* Main Balance Card */}
            <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Cikakken Bashi (Current Debt)</p>
                     <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmt(myAccount?.debtBalance || 0)}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Wallet size={24} color="#fff" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
             <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal('RECEIVE')}
               style={{ padding: '16px', borderRadius: '20px', background: '#fff', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.successL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Plus size={20} color={T.success} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Karban Kaya (Received)</span>
             </motion.button>
             
             <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal('RETURN')}
               style={{ padding: '16px', borderRadius: '20px', background: '#fff', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.dangerL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowUpRight size={20} color={T.danger} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Maida Kaya (Return)</span>
             </motion.button>
          </div>

          {/* Pending Approvals Section */}
          {pendingTxs.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Clock size={16} color={T.accent} />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: T.ink }}>Wasu na jiran tabbatarwa (Pending)</h3>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingTxs.map(tx => (
                    <div key={tx.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${T.accent}`, boxShadow: T.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                          <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{tx.items?.[0]?.quantity} Units • Jiran Store Keeper</div>
                       </div>
                       <div style={{ background: T.accentL, color: T.accent, fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Waiting</div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Recent History */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color={T.primary} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: T.ink }}>Tarihin kwanan nan</h3>
             </div>
             <button style={{ background: 'none', border: 'none', color: T.primary, fontSize: '12px', fontWeight: 800 }}>Duba duka</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {completedTxs.slice(0, 5).map(tx => (
               <div key={tx.id} style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tx.type === 'Return' ? T.dangerL : T.successL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.type === 'Return' ? <ArrowUpRight size={18} color={T.danger} /> : <ArrowDownLeft size={18} color={T.success} />}
                     </div>
                     <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                        <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{new Date(tx.date).toLocaleDateString()} • {tx.items?.[0]?.quantity} Units</div>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '14px', fontWeight: 900, color: tx.type === 'Return' ? T.success : T.danger }}>
                        {tx.type === 'Return' ? '-' : '+'}{fmt(tx.totalPrice)}
                     </div>
                  </div>
               </div>
             ))}
          </div>

        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
               <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
                 style={{ width: '100%', background: '#fff', borderRadius: '32px 32px 0 0', padding: '24px', boxShadow: '0 -20px 60px rgba(0,0,0,0.1)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: T.ink }}>
                        {showModal === 'RECEIVE' ? 'Record Received Bread' : 'Record Returned Bread'}
                     </h2>
                     <button onClick={() => setShowModal(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} color={T.ink} />
                     </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     <div>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Zabi nau'in burodi (Product)</label>
                        <select value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)}
                          style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '14px', fontWeight: 700, outline: 'none' }}>
                           <option value="">— Select Product —</option>
                           {products.filter(p => p.active).map(p => (
                             <option key={p.id} value={p.id}>{p.name} (₦{p.price})</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Yawa (Quantity)</label>
                        <input type="number" placeholder="Enter quantity..." value={qty} onChange={(e) => setQty(e.target.value)}
                          style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '14px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                     </div>

                     <div style={{ padding: '16px', borderRadius: '16px', background: T.pLight, border: `1px solid ${T.primary}`, display: 'flex', gap: '12px' }}>
                        <AlertCircle size={18} color={T.primary} style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '12px', color: T.ink, fontWeight: 600, lineHeight: 1.5 }}>
                           Bayan ka tura, Store Keeper sai ya duba ya yi **Confirm** kafin kudi ko kaya su canza.
                        </p>
                     </div>

                     <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={submitting || !selectedProd || !qty}
                       style={{ width: '100%', padding: '18px', borderRadius: '18px', background: T.primary, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {submitting ? 'Aiki ake...' : (
                          <><CheckCircle size={18} /> Tura Request (Submit)</>
                        )}
                     </motion.button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
}
