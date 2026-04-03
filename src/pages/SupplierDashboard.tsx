import { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, Plus, History, X, AlertCircle,
  CreditCard, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg:      '#f1f5f9',
  white:   '#ffffff', 
  primary: '#4f46e5',   // Indigo
  pLight:  'rgba(79,70,229,0.06)',
  accent:  '#8b5cf6',   // Violet
  success: '#10b981',   // Emerald
  danger:  '#f43f5e',   // Rose
  warning: '#f59e0b',   // Amber
  ink:     '#0f172a',
  txt2:    '#475569',
  txt3:    '#94a3b8',
  border:  'rgba(0,0,0,0.06)',
  radius:  '24px',
  shadow:  '0 6px 18px -4px rgba(0,0,0,0.08)',
  glass:   'rgba(255,255,255,0.7)',
};

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function SupplierDashboard() {
  const { user, signOut } = useAuth();
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
  const completedTxs = myTxs.filter(t => t.status === 'COMPLETED')
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

    const newTx: any = {
      id: Date.now().toString(),
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
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Modern Header */}
        <div style={{ background: '#0f172a', padding: '50px 24px 60px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '36px', borderBottomRightRadius: '36px' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '5px 12px', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.success }} />
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Portal</span>
                  </div>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#fff' }}>
                    Sannu da aiki, {user?.user_metadata?.full_name?.split(' ')[0] || 'Aboki'}!
                  </h1>
               </div>
               <motion.button whileTap={{ scale: 0.94 }} onClick={signOut}
                 style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <LogOut size={18} color="#fff" />
               </motion.button>
            </div>

            {/* Bento-style Balance Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(16px)', borderRadius: '28px', padding: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bashin da ake binka</p>
                    <div style={{ fontSize: '34px', fontWeight: 900, color: '#fff', marginTop: '6px', letterSpacing: '-0.04em' }}>{fmt(myAccount?.debtBalance || 0)}</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal('PAYMENT')}
                    style={{ background: '#fff', border: 'none', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                     <CreditCard size={18} color={T.primary} />
                     <span style={{ fontSize: '13px', fontWeight: 900, color: T.ink }}>Bada Kudi</span>
                  </motion.button>
               </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-30px', position: 'relative', zIndex: 10 }}>

          {/* Quick Bento Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '28px' }}>
             <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal('RECEIVE')}
               style={{ height: '140px', borderRadius: '28px', background: T.white, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Plus size={22} color={T.primary} />
                </div>
                <div>
                   <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>Karban Kaya</div>
                   <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>Request bread items</div>
                </div>
             </motion.button>
             
             <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal('RETURN')}
               style={{ height: '140px', borderRadius: '28px', background: T.white, padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(244,63,94,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <ArrowUpRight size={22} color={T.danger} />
                </div>
                <div>
                   <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>Maida Kaya</div>
                   <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>Return items to store</div>
                </div>
             </motion.button>
          </div>

          {/* Status Tracker */}
          {pendingTxs.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '8px' }}>
                  <Clock size={16} color={T.warning} />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jiran Tabbatarwa ({pendingTxs.length})</h3>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingTxs.map(tx => {
                    const sk = storeKeepers.find(k => k.id === tx.storeKeeperId);
                    return (
                      <motion.div key={tx.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        style={{ background: '#fff', borderRadius: '22px', padding: '16px', border: `1.5px solid ${T.warning}30`, boxShadow: T.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.warning + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <Clock size={16} color={T.warning} />
                            </div>
                            <div>
                               <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                               <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>
                                 {sk?.full_name?.split(' ')[0] || 'Store'} • {tx.items?.[0]?.quantity} pcs
                               </div>
                            </div>
                         </div>
                         <div style={{ color: T.warning, fontSize: '10px', fontWeight: 900, padding: '5px 10px', borderRadius: '10px', background: T.warning + '10' }}>PENDING</div>
                      </motion.div>
                    );
                  })}
               </div>
            </div>
          )}

          {/* Modern History List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingLeft: '8px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color={T.primary} />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tarihin Aiki</h3>
             </div>
             <button style={{ background: 'none', border: 'none', color: T.primary, fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>Duba duka</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {completedTxs.slice(0, 10).map(tx => (
               <div key={tx.id} style={{ background: '#fff', borderRadius: '22px', padding: '16px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: tx.type === 'Return' ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.type === 'Return' ? <ArrowUpRight size={20} color={T.danger} /> : <ArrowDownLeft size={20} color={T.success} />}
                     </div>
                     <div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karban Kaya'}</div>
                        <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>
                           {new Date(tx.date).toLocaleDateString('en-GB')} • {tx.items?.[0]?.quantity || 0} Units
                        </div>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '15px', fontWeight: 900, color: tx.type === 'Return' ? T.success : T.danger }}>
                        {tx.type === 'Return' ? '-' : '+'}{fmt(tx.totalPrice)}
                     </div>
                  </div>
               </div>
             ))}
          </div>

        </div>

        {/* Clean Global Modals */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end' }}>
               <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                 style={{ width: '100%', background: '#fff', borderRadius: '32px 32px 0 0', padding: '32px 24px 48px', boxShadow: '0 -20px 60px rgba(0,0,0,0.15)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                     <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>
                        {showModal === 'RECEIVE' ? 'Aika Bukatar Kaya' : showModal === 'RETURN' ? 'Maida Kaya Kantin' : 'Bada Kudi (Payment)'}
                     </h2>
                     <button onClick={() => setShowModal(null)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={20} color={T.ink} />
                     </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     {showModal === 'PAYMENT' ? (
                       <div style={{ background: T.bg, padding: '20px', borderRadius: '24px', border: `1px solid ${T.border}` }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Kudin da zaka bayar (Amount)</label>
                          <input type="number" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '28px', fontWeight: 900, color: T.ink, outline: 'none' }} />
                       </div>
                     ) : (
                       <>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                           <div>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Store Keeper dake aiki</label>
                              <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '18px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '15px', fontWeight: 800, color: T.ink, outline: 'none', appearance: 'none' }}>
                                 <option value="">— Zabi Store Keeper —</option>
                                 {storeKeepers.map(sk => (
                                   <option key={sk.id} value={sk.id}>{sk.full_name}</option>
                                 ))}
                              </select>
                           </div>

                           <div>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nau'in Burodi</label>
                              <select value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '18px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '15px', fontWeight: 800, color: T.ink, outline: 'none', appearance: 'none' }}>
                                 <option value="">— Zabi Burodi —</option>
                                 {products.filter(p => p.active).map(p => (
                                   <option key={p.id} value={p.id}>{p.name} (₦{p.price})</option>
                                 ))}
                              </select>
                           </div>

                           <div>
                              <label style={{ fontSize: '11px', fontWeight: 900, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Yawan Kaya (pcs)</label>
                              <input type="number" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '18px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '18px', fontWeight: 900, color: T.ink, outline: 'none', boxSizing: 'border-box' }} />
                           </div>
                         </div>
                       </>
                     )}

                     <div style={{ padding: '20px', borderRadius: '24px', background: T.pLight, border: `1px solid ${T.primary}20`, display: 'flex', gap: '14px' }}>
                        <AlertCircle size={20} color={T.primary} style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '12px', color: T.txt2, fontWeight: 700, lineHeight: 1.6 }}>
                           {showModal === 'PAYMENT' 
                             ? 'Wannan zai rage daga bashinka kai tsaye. Tabbatar kudin suna hannunka.' 
                             : 'Requests dinka zai je ne ga Store Keeper. Idan ya yi **Confirm** za\'a ga kaya sun karu.'}
                        </p>
                     </div>

                     <motion.button whileTap={{ scale: 0.96 }} onClick={handleSubmit} disabled={submitting || (showModal === 'PAYMENT' ? !payAmount : (!selectedProd || !qty || !selectedSK))}
                       style={{ width: '100%', padding: '20px', borderRadius: '22px', background: T.primary, color: '#fff', border: 'none', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(79,70,229,0.3)' }}>
                        {submitting ? 'Aiki ake...' : (
                          <><CheckCircle size={20} /> {showModal === 'PAYMENT' ? 'Tura Payment' : 'Tura Bukata'}</>
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
