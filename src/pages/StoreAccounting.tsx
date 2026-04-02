import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { 
  Users, Search, Calculator, Package, Clock, CheckCircle2, XCircle, ArrowRightLeft
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
  bg2: '#ffffff',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmt = (v: number) => "₦" + v.toLocaleString();

export default function StoreAccounting() {
  const { customers, transactions, debtPayments, updateTransactionStatus } = useAppContext();
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
    s.full_name.toLowerCase().includes(searchSup.toLowerCase())
  );

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Supplier Ledger</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Lissafin Supplier: Bread da ya dauka da kudin da ya biya.</p>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
             <button onClick={() => setTab('LEDGER')}
               style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: tab === 'LEDGER' ? '#fff' : 'transparent', color: tab === 'LEDGER' ? T.primary : T.txt3, fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: tab === 'LEDGER' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                Supplier Ledger
             </button>
             <button onClick={() => setTab('REQUESTS')}
               style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: tab === 'REQUESTS' ? '#fff' : 'transparent', color: tab === 'REQUESTS' ? T.primary : T.txt3, fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: tab === 'REQUESTS' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', position: 'relative' }}>
                Handover Requests
                {transactions.filter(t => t.status === 'PENDING_STORE').length > 0 && (
                  <div style={{ position: 'absolute', top: '7px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: T.danger }} />
                )}
             </button>
          </div>

          {tab === 'LEDGER' ? (
            <>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search Supplier (Dila)..." 
                  value={searchSup}
                  onChange={(e) => setSearchSup(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, color: T.ink, outline: 'none', boxSizing: 'border-box', boxShadow: T.shadow }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? <div style={{ textAlign: 'center', padding: '40px', color: T.txt3 }}>Loading...</div> : (
                  <>
                    {filteredSuppliers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                        <Users size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No Suppliers Found</h3>
                      </div>
                    ) : (
                      filteredSuppliers.map((s, idx) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedSup(selectedSup?.id === s.id ? null : s)}
                          style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: selectedSup?.id === s.id ? `2px solid ${T.primary}` : `1px solid ${T.border}`, boxShadow: T.shadow, cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontSize: '20px', fontWeight: 900 }}>
                                   {s.full_name?.charAt(0)}
                                </div>
                                <div>
                                   <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{s.full_name}</div>
                                   <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>ID: {s.id.slice(0, 8).toUpperCase()}</div>
                                </div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Current Debt</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: s.debt > 0 ? T.danger : T.success }}>{fmt(s.debt)}</div>
                             </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                             <div style={{ padding: '12px', background: T.bg, borderRadius: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Bread Taken</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{s.unitsTaken} Units</div>
                             </div>
                             <div style={{ padding: '12px', background: T.bg, borderRadius: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Total Paid</div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: T.success }}>{fmt(s.paid)}</div>
                             </div>
                          </div>
                          <AnimatePresence>
                            {selectedSup?.id === s.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); navigate('/store/dispatch', { state: { supplierId: s.custId } }); }}
                                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: T.primary, color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                       <Package size={14} /> New Dispatch
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); }}
                                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${T.primary}`, background: '#fff', color: T.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                       <Calculator size={14} /> Add Payment
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {transactions.filter(t => t.status === 'PENDING_STORE').length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: T.radius, border: `1px dashed ${T.border}` }}>
                    <Clock size={40} color={T.txt3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ margin: '0 0 8px', color: T.ink, fontSize: '16px', fontWeight: 900 }}>No Pending Requests</h3>
                 </div>
               ) : (
                 transactions.filter(t => t.status === 'PENDING_STORE').map(tx => {
                   const sup = customers.find(c => c.id === tx.customerId);
                   const item = tx.items?.[0];
                   return (
                     <div key={tx.id} style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tx.type === 'Return' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <ArrowRightLeft size={20} color={tx.type === 'Return' ? T.danger : T.success} />
                              </div>
                              <div>
                                 <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{sup?.name || 'Unknown'}</div>
                                 <div style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{tx.type === 'Return' ? 'Maida Kaya' : 'Karba Kaya'}</div>
                              </div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{item?.quantity} Units</div>
                              <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>{new Date(tx.date).toLocaleTimeString()}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                           <button onClick={() => updateTransactionStatus(tx.id, 'COMPLETED')}
                             style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: T.success, color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <CheckCircle2 size={15} /> Confirm
                           </button>
                           <button onClick={() => updateTransactionStatus(tx.id, 'CANCELLED')}
                             style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${T.danger}`, background: '#fff', color: T.danger, fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <XCircle size={15} /> Reject
                           </button>
                        </div>
                     </div>
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
