import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { 
  Search, Clock, 
  CheckCircle2, Wallet, PackageOpen, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import StoreBottomNav from '../components/StoreBottomNav';
import { getTransactionItems } from '../store/types';

const T = {
  primary: '#4f46e5',
  pLight: 'rgba(79,70,229,0.05)',
  success: '#10b981',
  danger: '#ef4444',
  amber: '#f59e0b',
  ink: '#0f172a',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f1f5f9',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '20px',
  shadow: '0 4px 12px rgba(0,0,0,0.05)'
};

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function StoreAccounting() {
  const { user } = useAuth();
  const { customers = [], transactions = [], debtPayments = [], updateTransactionStatus, products } = useAppContext();
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSup, setSearchSup] = useState('');
  const [selectedSup, setSelectedSup] = useState<any>(null);
  const [tab, setTab] = useState<'LEDGER' | 'REQUESTS'>('LEDGER');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupplierProfiles();
  }, [customers, transactions, debtPayments]);

  const fetchSupplierProfiles = async () => {
    setLoading(true);
    const { data: sups } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'SUPPLIER');
    
    if (sups) {
      const ledger = sups.map(s => {
        const custRecord = customers.find(c => c.profile_id === s.id);
        const supplierTransactions = transactions.filter(t => t.customerId === custRecord?.id && t.status === 'COMPLETED');
        const unitsTaken = supplierTransactions.reduce((sum, t) => {
           const items = getTransactionItems(t);
           return sum + items.reduce((s: number, i: any) => s + i.quantity, 0);
        }, 0);

        const paid = debtPayments
          .filter(p => p.customerId === custRecord?.id)
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          ...s,
          custId: custRecord?.id,
          debt: custRecord?.debtBalance || 0,
          unitsTaken,
          paid,
          profile_id: s.id
        };
      });
      setSuppliers(ledger);
    }
    setLoading(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    (String(s.full_name || '')).toLowerCase().includes(searchSup.toLowerCase())
  );

  const myPendingRequests = transactions.filter(t => 
    t.status === 'PENDING_STORE' && (!t.storeKeeperId || t.storeKeeperId === user?.id)
  );

  const pendingCount = myPendingRequests.length;
  const totalDebt = suppliers.reduce((s, sup) => s + sup.debt, 0);
  const totalPaid = suppliers.reduce((s, sup) => s + sup.paid, 0);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Extreme Compact Header */}
        <div style={{ background: '#0a0f1d', padding: '32px 20px 48px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
               <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>{t('store.supplierLedger')}</h1>
               <div style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Store Staff</div>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{t('store.pureSupplierLabel')}</p>
          </div>
        </div>

        <div style={{ padding: '0 16px', marginTop: '-24px', position: 'relative', zIndex: 20 }}>
          
          {/* Ultra-Compact Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1fr', gap: '8px', marginBottom: '20px' }}>
             {[
               { label: t('store.totalOwedToSuppliers'), val: fmt(totalDebt), icon: Wallet, color: '#f87171' },
               { label: 'Requests', val: pendingCount, icon: Clock, color: '#fbbf24' },
               { label: t('store.supplierPayments'), val: fmt(totalPaid), icon: CheckCircle2, color: '#34d399' }
             ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '10px 6px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '8px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
               </div>
             ))}
          </div>

          {/* Clean Binary Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '16px', marginBottom: '20px' }}>
             {(['LEDGER', 'REQUESTS'] as const).map(tKey => (
               <button key={tKey} onClick={() => setTab(tKey)}
                 style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: tab === tKey ? '#fff' : 'transparent', color: tab === tKey ? T.primary : T.txt3, fontSize: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: tab === tKey ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                  {tKey === 'LEDGER' ? t('store.supplierLedger') : `${t('store.supplierRequests')} (${pendingCount})`}
               </button>
             ))}
          </div>

          {tab === 'LEDGER' ? (
            <>
              {/* Compact Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder={t('store.searchSupplier')} value={searchSup} onChange={(e) => setSearchSup(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '14px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '13px', fontWeight: 600, color: T.ink, outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? <div style={{ textAlign: 'center', padding: '30px', fontSize: '12px', color: T.txt3 }}>{t('store.loading')}</div> : (
                  <>
                    {filteredSuppliers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: `1px dashed ${T.border}` }}>
                        <p style={{ margin: 0, color: T.txt3, fontSize: '12px', fontWeight: 700 }}>{t('store.noSuppliers')}</p>
                      </div>
                    ) : (
                      filteredSuppliers.map((s, idx) => (
                        <motion.div key={s.id || idx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                          onClick={() => setSelectedSup(selectedSup?.id === s.id ? null : s)}
                          style={{ background: '#fff', borderRadius: '18px', padding: '12px', border: selectedSup?.id === s.id ? `1.5px solid ${T.primary}` : `1px solid ${T.border}`, boxShadow: T.shadow, cursor: 'pointer' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontSize: '13px', fontWeight: 900 }}>
                                   {String(s.full_name || '?').charAt(0)}
                                </div>
                                <div>
                                   <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{s.full_name || 'Unnamed'}</div>
                                   <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3 }}>{s.unitsTaken} {t('store.unitsTaken')}</div>
                                </div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: s.debt > 0 ? T.danger : T.success }}>{fmt(s.debt)}</div>
                             </div>
                          </div>

                          <AnimatePresence>
                            {selectedSup?.id === s.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); navigate('/store/dispatch', { state: { supplierId: s.custId } }); }}
                                      style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: T.primary, color: '#fff', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
                                       {t('store.issueStock')}
                                    </button>
                                 </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {myPendingRequests.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '54px 24px', background: '#fff', borderRadius: '20px', border: `1px dashed ${T.border}` }}>
                    <PackageOpen size={32} color={T.txt3} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <h3 style={{ margin: 0, color: T.ink, fontSize: '14px', fontWeight: 900 }}>{t('store.noPendingRequests')}</h3>
                 </div>
               ) : (
                 myPendingRequests.map(tx => {
                    const sup = customers.find(c => c.id === tx.customerId);
                    const txItems = getTransactionItems(tx);
                    return (
                      <motion.div key={tx.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ background: '#fff', borderRadius: '20px', padding: '14px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                           <div style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: tx.type === 'Return' ? 'rgba(239,68,68,0.1)' : tx.type === 'Payment' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {tx.type === 'Return' ? <ArrowUpRight size={14} color={T.danger} /> : tx.type === 'Payment' ? <Wallet size={14} color={T.success} /> : <ArrowDownLeft size={14} color={T.primary} />}
                              </div>
                              <div>
                                 <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{sup?.name || 'Supplier'}</div>
                                 <div style={{ fontSize: '10px', fontWeight: 800, color: tx.type === 'Return' ? T.danger : T.success }}>
                                   {tx.type === 'Return' ? t('inv.return') : tx.type === 'Payment' ? t('store.paymentRequest') : t('dash.receiveBread')}
                                 </div>
                              </div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                           </div>
                        </div>

                        {/* Request Details - SHOW ITEMS ONLY FOR STOCK REQUESTS */}
                        {tx.type !== 'Payment' && (
                          <div style={{ background: T.bg, borderRadius: '12px', padding: '10px', marginBottom: '14px', border: `1px solid ${T.border}` }}>
                             {txItems.map((it, i) => {
                               const p = products.find(pr => pr.id === it.productId);
                               return (
                                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: T.txt2 }}>
                                    <span>{p?.name || 'Bread'}</span>
                                    <span>{it.quantity} pcs</span>
                                 </div>
                               );
                             })}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                           <button onClick={() => updateTransactionStatus(tx.id, 'COMPLETED')}
                             style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: T.success, color: '#fff', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
                                {t('dash.accept')}
                           </button>
                           <button onClick={() => updateTransactionStatus(tx.id, 'CANCELLED')}
                             style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1px solid ${T.danger}20`, background: '#fff', color: T.danger, fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
                                {t('dash.reject')}
                           </button>
                        </div>
                      </motion.div>
                    );
                 })
               )}
            </div>
          )}
        </div>
        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
