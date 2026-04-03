import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { 
  Users, Search, Clock, ArrowRightLeft, ShieldCheck, 
  CheckCircle2, XCircle, CreditCard, Wallet, PackageOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
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
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmt = (v: number) => "₦" + v.toLocaleString();

export default function StoreAccounting() {
  const { user } = useAuth();
  const { customers = [], transactions = [], debtPayments = [], updateTransactionStatus, updateCustomer } = useAppContext();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSup, setSearchSup] = useState('');
  const [selectedSup, setSelectedSup] = useState<any>(null);
  const [tab, setTab] = useState<'LEDGER' | 'REQUESTS' | 'CUSTOMERS'>('LEDGER');
  const [searchCust, setSearchCust] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupplierProfiles();
  }, [customers, transactions, debtPayments]);

  const fetchSupplierProfiles = async () => {
    setLoading(true);
    const { data: sups } = await supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER');
    
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
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Premium Indigo Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '60px 24px 64px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
               <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Supplier Ledger</h1>
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <ShieldCheck size={12} /> Accounting Staff
               </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Manage supplier debt, repayments and unit distributions.</p>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-44px', position: 'relative', zIndex: 20 }}>
          
          {/* Dashboard Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
             {[
               { label: 'Total Debt', val: fmt(totalDebt), icon: Wallet, color: '#fca5a5' },
               { label: 'Pending', val: pendingCount, icon: Clock, color: '#fcd34d' },
               { label: 'Repayments', val: fmt(totalPaid), icon: CreditCard, color: '#6ee7b7' }
             ].map((s, i) => (
               <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '12px 8px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 8px' }}>
                     <s.icon size={14} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: T.ink, letterSpacing: '-0.03em' }}>{s.val}</div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
               </div>
             ))}
          </div>

          {/* Clean Selection Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '5px', borderRadius: '18px', marginBottom: '24px', backdropFilter: 'blur(10px)' }}>
             {(['LEDGER', 'REQUESTS', 'CUSTOMERS'] as const).map(t => (
               <button key={t} onClick={() => setTab(t)}
                 style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: tab === t ? '#fff' : 'transparent', color: tab === t ? T.primary : T.txt3, fontSize: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: tab === t ? '0 4px 15px rgba(37,99,235,0.1)' : 'none', transition: 'all 0.3s' }}>
                  {t === 'LEDGER' ? 'Littafin Bashi' : t === 'REQUESTS' ? 'Ayyukan Suplier' : 'Saka Mutum'}
               </button>
             ))}
          </div>

          {tab === 'LEDGER' ? (
            <>
              {/* Premium Search */}
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Bincika Suplier..." value={searchSup} onChange={(e) => setSearchSup(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '18px', border: `1.5px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loading ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading...</div> : (
                  <>
                    {filteredSuppliers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                        <Users size={32} color={T.txt3} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <h3 style={{ margin: 0, color: T.ink, fontSize: '14px', fontWeight: 900 }}>No Suppliers Found</h3>
                      </div>
                    ) : (
                      filteredSuppliers.map((s, idx) => (
                        <motion.div key={s.id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                          onClick={() => setSelectedSup(selectedSup?.id === s.id ? null : s)}
                          style={{ background: '#fff', borderRadius: '22px', padding: '14px', border: selectedSup?.id === s.id ? `1.5px solid ${T.primary}` : `1px solid ${T.border}`, boxShadow: T.shadow, cursor: 'pointer' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontSize: '15px', fontWeight: 900 }}>
                                   {String(s.full_name || '?').charAt(0)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                   <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name || 'Unnamed'}</div>
                                   <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Units: {s.unitsTaken}</div>
                                </div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Debt</div>
                                <div style={{ fontSize: '15px', fontWeight: 900, color: s.debt > 0 ? T.danger : T.success }}>{fmt(s.debt)}</div>
                             </div>
                          </div>

                          <AnimatePresence>
                            {selectedSup?.id === s.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${T.border}` }}>
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); navigate('/store/dispatch', { state: { supplierId: s.custId } }); }}
                                      style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: T.primary, color: '#fff', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                       Dispatch
                                    </button>
                                    <button onClick={(e) => e.stopPropagation()}
                                      style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1.5px solid ${T.border}`, background: 'transparent', color: T.ink, fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
                                       Pay Report
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
          ) : tab === 'REQUESTS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {myPendingRequests.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '54px 24px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}`, boxShadow: T.shadow }}>
                    <PackageOpen size={36} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <h3 style={{ margin: 0, color: T.ink, fontSize: '15px', fontWeight: 900 }}>Babu Wani Aiki</h3>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: T.txt3, fontWeight: 700 }}>Duk bukatun da aka tura maka zasu bayyana anan.</p>
                 </div>
               ) : (
                 myPendingRequests.map(tx => {
                   const sup = customers.find(c => c.id === tx.customerId);
                   return (
                     <motion.div key={tx.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                       style={{ background: '#fff', borderRadius: '22px', padding: '14px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: tx.type === 'Return' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <ArrowRightLeft size={16} color={tx.type === 'Return' ? T.danger : T.success} />
                              </div>
                              <div>
                                 <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{sup?.name || 'Unknown'}</div>
                                 <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', background: tx.type === 'Return' ? '#fff1f2' : '#f0fdf4', color: tx.type === 'Return' ? T.danger : T.success, textTransform: 'uppercase' }}>{tx.type}</span>
                              </div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3 }}>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                           <button onClick={() => updateTransactionStatus(tx.id, 'COMPLETED')}
                             style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: T.success, color: '#fff', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                               <CheckCircle2 size={14} /> Accept
                           </button>
                           <button onClick={() => updateTransactionStatus(tx.id, 'CANCELLED')}
                             style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1px solid ${T.danger}20`, background: `${T.danger}08`, color: T.danger, fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                               <XCircle size={14} /> Reject
                           </button>
                        </div>
                     </motion.div>
                   );
                 })
               )}
            </div>
          ) : (
            /* Assignment Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Search customer name..." value={searchCust} onChange={(e) => setSearchCust(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '16px', border: `1.5px solid ${T.border}`, background: '#fff', fontSize: '13px', fontWeight: 600, color: T.ink, outline: 'none' }} />
               </div>

               {customers.filter(c => !suppliers.some(s => s.profile_id === c.profile_id))
                .filter(c => (c.name || '').toLowerCase().includes(searchCust.toLowerCase()))
                .map(cust => (
                  <div key={cust.id} style={{ background: '#fff', borderRadius: '20px', padding: '12px 14px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cust.name || 'Unnamed'}</div>
                        <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>{cust.location || 'Local Business'}</div>
                     </div>
                     <select 
                       value={cust.assignedSupplierId || ''} 
                       onChange={(e) => updateCustomer({ ...cust, assignedSupplierId: e.target.value || undefined })}
                       style={{ padding: '8px', borderRadius: '10px', border: `1.5px solid ${T.border}`, background: T.bg, fontSize: '11px', fontWeight: 800, color: T.ink, outline: 'none', maxWidth: '110px' }}>
                        <option value="">(None)</option>
                        {suppliers.map(s => (
                          <option key={s.id || s.profile_id} value={s.custId}>{s.full_name || 'Unnamed'}</option>
                        ))}
                     </select>
                  </div>
                ))}
            </div>
          )}
        </div>
        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
