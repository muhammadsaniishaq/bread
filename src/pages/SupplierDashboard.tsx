import { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowDownLeft, ArrowUpRight, Clock, 
  CheckCircle, Plus, History, X, AlertCircle,
  CreditCard, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg: '#f8fafc', white: '#ffffff', 
  primary: '#4f46e5', pLight: 'rgba(79,70,229,0.06)',
  accent: '#7c3aed', accentL: 'rgba(124,58,237,0.08)',
  success: '#059669', successL: 'rgba(5,150,105,0.08)',
  danger: '#dc2626', dangerL: 'rgba(220,38,38,0.08)',
  warning: '#d97706', warningL: 'rgba(217,119,6,0.08)',
  ink: '#1e293b', txt2: '#475569', txt3: '#94a3b8',
  border: 'rgba(0,0,0,0.05)', radius: '20px',
  shadow: '0 4px 12px rgba(0,0,0,0.03)',
  glass: 'rgba(255,255,255,0.7)',
};

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { customers, products, transactions, recordSale, recordDebtPayment } = useAppContext();
  
  const [showModal, setShowModal] = useState<'RECEIVE' | 'RETURN' | 'PAYMENT' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeKeepers, setStoreKeepers] = useState<any[]>([]);
  
  // Form State
  const [selectedProd, setSelectedProd] = useState('');
  const [qty, setQty] = useState('');
  const [selectedSK, setSelectedSK] = useState('');
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    const fetchSKs = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'STORE_KEEPER');
      setStoreKeepers(data || []);
    };
    fetchSKs();
  }, []);

  const myAccount = useMemo(() => 
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  const myTxs = useMemo(() => 
    transactions.filter(t => t.customerId === myAccount?.id), [transactions, myAccount]);

  const pendingTxs = myTxs.filter(t => t.status === 'PENDING_STORE');
  const completedTxs = myTxs.filter(t => t.status === 'COMPLETED').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async () => {
    if (showModal === 'PAYMENT') {
       if (!payAmount || !myAccount) return;
       setSubmitting(true);
       await recordDebtPayment({
         id: Date.now().toString(),
         date: new Date().toISOString(),
         customerId: myAccount.id,
         amount: Number(payAmount),
         method: 'Cash'
       });
       setShowModal(null);
       setPayAmount('');
       setSubmitting(false);
       return;
    }

    if (!selectedProd || !qty || !myAccount || !selectedSK) return;
    setSubmitting(true);
    
    const prod = products.find(p => p.id === selectedProd);
    if (!prod) return;

    const txId = Date.now().toString();
    const newTx: any = {
      id: txId,
      date: new Date().toISOString(),
      customerId: myAccount.id,
      storeKeeperId: selectedSK,
      type: showModal === 'RECEIVE' ? 'Debt' : 'Return',
      status: 'PENDING_STORE',
      origin: 'SUPPLIER',
      items: [{ productId: selectedProd, quantity: Number(qty), unitPrice: prod.price }],
      totalPrice: Number(qty) * prod.price
    };

    await recordSale(newTx);
    setShowModal(null);
    setSelectedProd('');
    setQty('');
    setSelectedSK('');
    setSubmitting(false);
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '60px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header Section */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '40px 20px 60px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Supplier Portal</p>
                  <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                    Sannu, {user?.user_metadata?.full_name?.split(' ')[0] || 'Supplier'}
                  </h1>
               </div>
               <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={22} color="#fff" />
               </div>
            </div>

            {/* Main Balance Card */}
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Abunda kake bi (Outstanding)</p>
                     <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginTop: '6px', letterSpacing: '-0.04em' }}>{fmt(myAccount?.debtBalance || 0)}</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal('PAYMENT')}
                    style={{ background: '#fff', border: 'none', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                     <CreditCard size={18} color={T.primary} />
                     <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Bada Kudi</span>
                  </motion.button>
               </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
             <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal('RECEIVE')}
               style={{ padding: '20px 16px', borderRadius: '22px', background: '#fff', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.successL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Plus size={22} color={T.success} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Karban Kaya</span>
             </motion.button>
             
             <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal('RETURN')}
               style={{ padding: '20px 16px', borderRadius: '22px', background: '#fff', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.dangerL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowUpRight size={22} color={T.danger} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>Maida Kaya</span>
             </motion.button>
          </div>

          {/* Pending Approvals Section */}
          {pendingTxs.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Clock size={16} color={T.warning} />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jiran Tabbatarwa ({pendingTxs.length})</h3>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingTxs.map(tx => {
                    const sk = storeKeepers.find(k => k.id === tx.storeKeeperId);
                    return (
                      <div key={tx.id} style={{ background: '#fff', borderRadius: '18px', padding: '14px', border: `1.5px solid ${T.warning}20`, boxShadow: T.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                            <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700, marginTop: '2px' }}>
                               {tx.items?.[0]?.quantity} Units • {sk?.full_name || 'Store Keeper'}
                            </div>
                         </div>
                         <div style={{ background: T.warningL, color: T.warning, fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>Pending</div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* Recent History */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color={T.primary} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tarihin Aiki</h3>
             </div>
             <button style={{ background: 'none', border: 'none', color: T.primary, fontSize: '12px', fontWeight: 800 }}>Duba duka</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {completedTxs.slice(0, 8).map(tx => (
               <div key={tx.id} style={{ background: '#fff', borderRadius: '18px', padding: '14px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tx.type === 'Return' ? T.dangerL : T.successL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.type === 'Return' ? <ArrowUpRight size={18} color={T.danger} /> : <ArrowDownLeft size={18} color={T.success} />}
                     </div>
                     <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                        <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700, marginTop: '2px' }}>
                           {new Date(tx.date).toLocaleDateString('en-GB')} • {tx.items?.[0]?.quantity || 0} Units
                        </div>
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
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}>
               <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                 style={{ width: '100%', background: '#fff', borderRadius: '32px 32px 0 0', padding: '24px 24px 40px', boxShadow: '0 -20px 60px rgba(0,0,0,0.1)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                     <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: T.ink }}>
                        {showModal === 'RECEIVE' ? 'Karban Kaya' : showModal === 'RETURN' ? 'Maida Kaya' : 'Bada Kudi (Payment)'}
                     </h2>
                     <button onClick={() => setShowModal(null)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={20} color={T.ink} />
                     </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {showModal === 'PAYMENT' ? (
                       <div>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Adadin Kudi (Amount)</label>
                          <input type="number" placeholder="Enter amount..." value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '16px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
                       </div>
                     ) : (
                       <>
                         <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Zabi Store Keeper</label>
                            <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)}
                              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '14px', fontWeight: 800, outline: 'none' }}>
                               <option value="">— Select Store Keeper —</option>
                               {storeKeepers.map(sk => (
                                 <option key={sk.id} value={sk.id}>{sk.full_name}</option>
                               ))}
                            </select>
                         </div>

                         <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nau'in Burodi (Product)</label>
                            <select value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)}
                              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '14px', fontWeight: 800, outline: 'none' }}>
                               <option value="">— Select Product —</option>
                               {products.filter(p => p.active).map(p => (
                                 <option key={p.id} value={p.id}>{p.name} (₦{p.price})</option>
                               ))}
                            </select>
                         </div>

                         <div>
                            <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Yawa (Quantity)</label>
                            <input type="number" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)}
                              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '15px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }} />
                         </div>
                       </>
                     )}

                     <div style={{ padding: '16px', borderRadius: '16px', background: T.pLight, border: `1px solid ${T.primary}20`, display: 'flex', gap: '12px' }}>
                        <AlertCircle size={18} color={T.primary} style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '12px', color: T.txt2, fontWeight: 600, lineHeight: 1.5 }}>
                           {showModal === 'PAYMENT' 
                             ? 'Wannan zai rage bashin da ake binka nan take.' 
                             : 'Bayan ka tura, Store Keeper sai ya yi **Confirm** kafin kaya su sauka.'}
                        </p>
                     </div>

                     <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={submitting || (showModal === 'PAYMENT' ? !payAmount : (!selectedProd || !qty || !selectedSK))}
                       style={{ width: '100%', padding: '18px', borderRadius: '18px', background: T.primary, color: '#fff', border: 'none', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {submitting ? 'Aiki ake...' : (
                          <><CheckCircle size={20} /> Tura Request</>
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
