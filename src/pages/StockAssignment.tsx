import React, { useState, useEffect, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  ArrowLeft, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#0f172a',
  brand: '#3b82f6',
  surface: '#ffffff',
  surface2: '#f8fafc',
  border: '#f1f5f9',
  txt2: '#475569',
  txt3: '#94a3b8',
  success: '#10b981',
  danger: '#ef4444',
  brandLight: 'rgba(59, 130, 246, 0.1)',
};



export const StockAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch } = useAppContext();

  const [mode,          setMode]          = useState<'Receive' | 'Return'>('Receive');
  const [recipientType, setRecipientType] = useState<'STORE' | 'SUPPLIER'>('STORE');
  const [selectedId,    setSelectedId]    = useState('');
  const [quantities,    setQuantities]    = useState<Record<string, number>>({});
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);
  const [profiles,      setProfiles]      = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [search,        setSearch]        = useState('');

  // Load Recipients
  useEffect(() => {
    const fetch = async () => {
      setLoadingProfiles(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['STORE_KEEPER', 'SUPPLIER', 'MANAGER']);
      setProfiles(data || []);
      setLoadingProfiles(false);
    };
    fetch();
  }, []);

  const recipients = useMemo(() => 
    profiles.filter(p => (recipientType === 'STORE' ? (p.role === 'STORE_KEEPER' || p.role === 'MANAGER') : p.role === 'SUPPLIER')),
  [profiles, recipientType]);

  const activeProducts = useMemo(() => 
    products.filter(p => p.active && (!search || p.name.toLowerCase().includes(search.toLowerCase()))),
  [products, search]);

  const totalItems = Object.values(quantities).reduce((s, v) => s + (v || 0), 0);

  const handleSubmit = async () => {
    const items = activeProducts.filter(p => (quantities[p.id] || 0) > 0);
    if (items.length === 0 || !selectedId) return;

    // Stock Validation
    if (mode === 'Receive') {
       for (const p of items) {
          if ((quantities[p.id] || 0) > (p.stock || 0)) {
             alert(`Insufficient stock for ${p.name}`);
             return;
          }
       }
    }

    setSubmitting(true);
    try {
      const logs = items.map(p => ({
        id: crypto.randomUUID(),
        productId: p.id,
        quantityReceived: quantities[p.id],
        costPrice: p.price,
        type: mode === 'Receive' ? 'Receive' : 'Return',
        date: new Date().toISOString(),
        storeKeeper: selectedId,
        profile_id: selectedId,
        batchId: Date.now().toString(),
      } as any));

      // Use the robust bulk processing from AppContext
      // This will update stocks and create logs in the background reliably
      await processInventoryBatch(logs, mode);
      
      setDone(true);
      setQuantities({});
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error occurred during assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '120px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        
        {/* EXECUTIVE HEADER */}
        <div style={{ background: T.primary, padding: '24px 20px', color: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ArrowLeft size={20} />
                 </motion.button>
                 <div>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Inventory Assignment</h1>
                    <div style={{ fontSize: '10px', fontWeight: 850, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bakery Distribution Hub</div>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                 {(['Receive', 'Return'] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setQuantities({}); }} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer', background: mode === m ? (m === 'Receive' ? T.success : T.danger) : 'rgba(255,255,255,0.05)', color: '#fff' }}>
                       {m === 'Receive' ? 'Give Bread' : 'Return Stock'}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="responsive-stack">
           
           {/* SELECTION AREA */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* RECIPIENT PICKER */}
              <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: `1px solid ${T.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: T.txt2, textTransform: 'uppercase' }}>Select Recipient</div>
                    <div style={{ display: 'flex', background: T.surface2, padding: '4px', borderRadius: '12px' }}>
                       {(['STORE', 'SUPPLIER'] as const).map(type => (
                          <button key={type} onClick={() => { setRecipientType(type); setSelectedId(''); }} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer', background: recipientType === type ? T.primary : 'transparent', color: recipientType === type ? '#fff' : T.txt3 }}>{type}</button>
                       ))}
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {loadingProfiles ? <div style={{ textAlign: 'center', padding: '20px', color: T.txt3 }}>Loading profiles...</div> : 
                     recipients.map(p => (
                       <button key={p.id} onClick={() => setSelectedId(p.id)} style={{ border: `2px solid ${selectedId === p.id ? T.brand : T.border}`, background: selectedId === p.id ? T.brandLight : T.surface, padding: '12px', borderRadius: '16px', textAlign: 'left', cursor: 'pointer' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: T.primary }}>{p.full_name}</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, marginTop: '2px' }}>{p.role.replace('_', ' ')}</div>
                       </button>
                    ))}
                 </div>
              </div>

              {/* PRODUCTS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ position: 'relative' }}>
                    <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      placeholder="Filter product selection..." 
                      value={search} onChange={e => setSearch(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '18px', border: `1px solid ${T.border}`, background: '#fff', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                    />
                 </div>

                 {activeProducts.map((p, i) => {
                    const qty = quantities[p.id] || 0;
                    return (
                       <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          style={{ background: '#fff', padding: '16px 20px', borderRadius: '24px', border: `1px solid ${qty > 0 ? T.brand : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                             <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍞'}
                             </div>
                             <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: p.stock < 20 ? T.danger : T.success }}>STK: {p.stock} units</div>
                             </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', background: T.surface2, padding: '4px', borderRadius: '14px', border: `1px solid ${T.border}` }}>
                             <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))} style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: T.txt2, cursor: 'pointer', fontWeight: 900 }}>-</button>
                             <input 
                               type="number" value={qty || ''} placeholder="0"
                               onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setQuantities(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : Math.max(0, val) }));
                               }}
                               style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '16px', fontWeight: 900, color: qty > 0 ? T.brand : T.txt3, outline: 'none' }}
                             />
                             <button onClick={() => setQuantities(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))} style={{ width: '32px', height: '32px', border: 'none', background: 'none', color: T.brand, cursor: 'pointer', fontWeight: 900 }}>+</button>
                          </div>
                       </motion.div>
                    )
                 })}
              </div>
           </div>

           {/* SIDEBAR SUMMARY */}
           <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
              <div style={{ background: T.primary, borderRadius: '28px', padding: '28px', color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Order Details</div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, opacity: 0.8 }}>Action: {mode === 'Receive' ? 'Give Inventory' : 'Return Stock'}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, opacity: 0.8 }}>Assignee: {profiles.find(p => p.id === selectedId)?.full_name || 'Not selected'}</div>
                 </div>

                 <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5, marginBottom: '4px' }}>TOTAL UNITS</div>
                    <div style={{ fontSize: '42px', fontWeight: 950 }}>{totalItems}</div>
                 </div>

                 <button 
                   disabled={submitting || totalItems === 0 || !selectedId}
                   onClick={handleSubmit}
                   style={{ width: '100%', padding: '20px', borderRadius: '20px', background: submitting ? T.txt3 : (mode === 'Receive' ? T.success : T.danger), color: '#fff', border: 'none', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: (submitting || totalItems === 0 || !selectedId) ? 0.6 : 1 }}
                 >
                    {submitting ? 'Synchronizing...' : (mode === 'Receive' ? 'Assign Stock' : 'Process Return')}
                 </button>

                 <AnimatePresence>
                    {done && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: T.success }}>
                          Batch Updated Successfully! ✅
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>

        </div>

        <style>{`
           @media (max-width: 900px) {
              .responsive-stack { grid-template-columns: 1fr !important; }
           }
           input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        `}</style>

      </div>
    </AnimatedPage>
  );
};

export default StockAssignment;
