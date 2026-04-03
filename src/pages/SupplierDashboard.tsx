import { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, Plus, History, X,
  CreditCard, LogOut, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  bg:      '#f8fafc',
  white:   '#ffffff', 
  primary: '#4f46e5',
  pLight:  'rgba(79,70,229,0.06)',
  success: '#10b981',
  danger:  '#ef4444',
  amber:   '#f59e0b',
  ink:     '#0f172a',
  txt2:    '#475569',
  txt3:    '#94a3b8',
  border:  'rgba(0,0,0,0.06)',
  radius:  '20px',
  shadow:  '0 2px 8px rgba(0,0,0,0.04)',
};

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function SupplierDashboard() {
  const { user, signOut } = useAuth();
  const { customers, products, transactions, recordSale } = useAppContext();
  const { t } = useTranslation();
  
  const [showModal, setShowModal] = useState<'RECEIVE' | 'RETURN' | 'PAYMENT' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeKeepers, setStoreKeepers] = useState<any[]>([]);
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
    if (submitting) return;
    setSubmitting(true);
    try {
      if (showModal === 'PAYMENT') {
        if (!payAmount || !myAccount || !selectedSK) return;
        await recordSale({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          customerId: myAccount.id,
          storeKeeperId: selectedSK,
          type: 'Payment',
          status: 'PENDING_STORE',
          origin: 'SUPPLIER',
          totalPrice: Number(payAmount)
        });
      } else {
        if (!selectedProd || !qty || !myAccount || !selectedSK) return;
        const prod = products.find(p => p.id === selectedProd);
        if (prod) {
          await recordSale({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            customerId: myAccount.id,
            storeKeeperId: selectedSK,
            type: showModal === 'RECEIVE' ? 'Debt' : 'Return',
            status: 'PENDING_STORE',
            origin: 'SUPPLIER',
            items: [{ productId: selectedProd, quantity: Number(qty), unitPrice: prod.price }],
            totalPrice: Number(qty) * prod.price
          });
        }
      }
      setShowModal(null);
      setSelectedProd('');
      setQty('');
      setSelectedSK('');
      setPayAmount('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '80px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Extreme Compact Header */}
        <div style={{ background: '#0a0f1d', padding: '32px 20px 48px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>{t('store.hello')}, {user?.user_metadata?.full_name?.split(' ')[0]}</h1>
             <motion.button whileTap={{ scale: 0.92 }} onClick={signOut}
               style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={16} color="#fff" />
             </motion.button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{t('dash.debtYouOwe')}</p>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{fmt(myAccount?.debtBalance || 0)}</div>
          </div>
        </div>

        <div style={{ padding: '0 16px', marginTop: '-24px' }}>

          {/* Compact Action Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
             {[
               { id: 'RECEIVE', label: t('dash.receiveBreadShort'), sub: t('dash.breadSet'), icon: Plus, color: T.primary, bg: T.pLight },
               { id: 'RETURN', label: t('dash.returnBreadShort'), sub: t('dash.breadSet'), icon: RefreshCw, color: T.danger, bg: 'rgba(239,68,68,0.05)' },
               { id: 'PAYMENT', label: t('dash.payDebtShort'), sub: t('dash.debtSet'), icon: CreditCard, color: T.success, bg: 'rgba(16,185,129,0.05)' }
             ].map((a) => (
               <motion.button key={a.id} whileTap={{ scale: 0.96 }} onClick={() => setShowModal(a.id as any)}
                 style={{ background: '#fff', borderRadius: '18px', padding: '12px 6px', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <a.icon size={16} color={a.color} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                     <div style={{ fontSize: '12px', fontWeight: 900, color: T.ink }}>{a.label}</div>
                     <div style={{ fontSize: '8px', fontWeight: 700, color: T.txt3 }}>{a.sub}</div>
                  </div>
               </motion.button>
             ))}
          </div>

          {/* High-Density Status Tracker */}
          {pendingTxs.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingLeft: '4px' }}>
                  <Clock size={14} color={T.amber} />
                  <span style={{ fontSize: '11px', fontWeight: 900, color: T.ink, textTransform: 'uppercase' }}>{t('dash.waitVerification')} ({pendingTxs.length})</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pendingTxs.map(tx => (
                    <div key={tx.id} style={{ background: '#fff', borderRadius: '16px', padding: '10px 14px', border: `1px solid ${T.amber}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? t('inv.return') : t('dash.receiveBread')}</div>
                          <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{tx.items?.[0]?.quantity} pcs</div>
                       </div>
                       <div style={{ color: T.amber, fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: T.amber + '10' }}>PENDING</div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Compact History */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', paddingLeft: '4px' }}>
             <History size={14} color={T.primary} />
             <span style={{ fontSize: '11px', fontWeight: 900, color: T.ink, textTransform: 'uppercase' }}>{t('dash.history')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
             {completedTxs.slice(0, 8).map(tx => (
               <div key={tx.id} style={{ background: '#fff', borderRadius: '16px', padding: '10px 14px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     {tx.type === 'Return' ? <ArrowUpRight size={16} color={T.danger} /> : <ArrowDownLeft size={16} color={T.success} />}
                     <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{tx.type === 'Return' ? t('inv.return') : t('dash.receiveBread')}</div>
                        <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{tx.items?.[0]?.quantity || 0} Units</div>
                     </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: tx.type === 'Return' ? T.success : T.danger }}>
                     {tx.type === 'Return' ? '-' : '+'}{fmt(tx.totalPrice)}
                  </div>
               </div>
             ))}
          </div>

        </div>

        {/* Action Modals */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
               <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                 style={{ width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: T.ink }}>
                        {showModal === 'RECEIVE' ? t('dash.receiveBreadShort') + ' ' + t('dash.breadSet') : showModal === 'RETURN' ? t('inv.return') : t('dash.payDebtShort') + ' ' + t('dash.debtSet')}
                     </h2>
                     <button onClick={() => setShowModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     {showModal === 'PAYMENT' ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 700, appearance: 'none' }}>
                             <option value="">{t('dash.selectStoreKeeper')}</option>
                             {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name}</option>)}
                          </select>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${T.border}` }}>
                             <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{t('dash.amountToPay')}</label>
                             <input type="number" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                               style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 900, color: T.ink, outline: 'none' }} />
                          </div>
                       </div>
                     ) : (
                       <>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)}
                              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 700, appearance: 'none' }}>
                               <option value="">{t('dash.selectStoreKeeper')}</option>
                               {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name}</option>)}
                            </select>

                            <select value={selectedProd} onChange={(e) => setSelectedProd(e.target.value)}
                              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 700, appearance: 'none' }}>
                               <option value="">{t('dash.selectBread')}</option>
                               {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} (₦{p.price})</option>)}
                            </select>

                            <input type="number" placeholder={t('inv.stockCount') + ' (pcs)'} value={qty} onChange={(e) => setQty(e.target.value)}
                              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 700, outline: 'none' }} />
                         </div>
                       </>
                     )}

                     <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting || !selectedSK || (showModal === 'PAYMENT' ? !payAmount : (!selectedProd || !qty))}
                       style={{ width: '100%', padding: '16px', borderRadius: '16px', background: T.primary, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {submitting ? t('store.loading') : <><CheckCircle size={18} /> {t('dash.submitRequest')}</>}
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
