import React, { useState, useEffect, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  Package, ArrowLeft, ArrowDownCircle, ArrowUpCircle,
  CheckCircle2, AlertTriangle, Loader2,
  Store, Truck, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

type RecipientType = 'STORE' | 'SUPPLIER';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export const StockAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch, refreshData } = useAppContext();

  const [mode,          setMode]          = useState<'Receive' | 'Return'>('Receive');
  const [recipientType, setRecipientType] = useState<RecipientType>('STORE');
  const [selectedId,    setSelectedId]    = useState('');
  const [quantities,    setQuantities]    = useState<Record<string, number>>({});
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);
  const [profiles,      setProfiles]      = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Load Store Keepers + Suppliers from Supabase profiles
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

  const storeKeepers = useMemo(() => profiles.filter(p => p.role === 'STORE_KEEPER' || p.role === 'MANAGER'), [profiles]);
  const suppliers    = useMemo(() => profiles.filter(p => p.role === 'SUPPLIER'), [profiles]);

  const activeProducts = products.filter(p => p.active);

  const totalItems = Object.values(quantities).reduce((s, v) => s + (v || 0), 0);

  const setQty = (productId: string, val: number) =>
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, val) }));

  const handleSubmit = async () => {
    const items = activeProducts.filter(p => (quantities[p.id] || 0) > 0);
    if (items.length === 0) return alert('Please enter at least one quantity.');

    if (mode === 'Return') {
      for (const p of items) {
        if ((quantities[p.id] || 0) > (p.stock || 0)) {
          alert(`⚠️ Cannot return more ${p.name} than in store stock.\n\nStore stock: ${p.stock}\nYou entered: ${quantities[p.id]}`);
          return;
        }
      }
    }

    if (mode === 'Receive') {
      // Check stock won't go negative on assignment to recipient
      for (const p of items) {
        if ((quantities[p.id] || 0) > (p.stock || 0)) {
          alert(`⚠️ Not enough ${p.name} in store!\n\nStore stock: ${p.stock}\nRequested: ${quantities[p.id]}\n\nReceive more bread from the bakery first.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (recipientType === 'STORE' || mode === 'Return') {
        // Directly update product stock in Supabase
        for (const p of items) {
          const qty = quantities[p.id] || 0;
          const newStock = mode === 'Receive'
            ? Math.max(0, (p.stock || 0) - qty)   // Stock leaves store → going to recipient
            : (p.stock || 0) + qty;                // Stock returns to store

          await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
        }
        await refreshData();

      } else {
        // Assign to Supplier → create pending transaction
        const logs = items.map(p => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          productId: p.id,
          quantityReceived: quantities[p.id],
          costPrice: p.price,
          type: 'Receive' as const,
          date: new Date().toISOString(),
          storeKeeper: selectedId,
          profile_id: selectedId,
          batchId: Date.now().toString(),
        }));

        // Deduct from store stock
        for (const p of items) {
          const newStock = Math.max(0, (p.stock || 0) - (quantities[p.id] || 0));
          await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
        }

        await processInventoryBatch(logs, 'Receive');
      }

      setDone(true);
      setQuantities({});
      setTimeout(() => setDone(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const recipientList = recipientType === 'STORE' ? storeKeepers : suppliers;
  const selectedProfile = profiles.find(p => p.id === selectedId);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: '40px' }}>

        {/* Hero Header */}
        <div style={{ background: 'linear-gradient(158deg,#1a0533 0%,#3b0764 40%,#4f46e5 100%)', padding: '48px 20px 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
                style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={18} color="#fff" />
              </motion.button>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Assign <span style={{ color: '#fbbf24' }}>Bread</span>
                </h1>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                  Distribute stock to Stores or Suppliers
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '4px', display: 'flex', gap: '4px' }}>
              {(['Receive', 'Return'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '12px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: mode === m ? (m === 'Receive' ? '#10b981' : '#ef4444') : 'transparent',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>
                  {m === 'Receive' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                  {m === 'Receive' ? 'Give Bread' : 'Return Bread'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ padding: '0 16px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>

          {/* Recipient Type Selector (only for Receive mode) */}
          {mode === 'Receive' && (
            <motion.div variants={fadeUp}>
              <div style={{ background: '#fff', borderRadius: '24px', padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                  Who are you giving bread to?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {([
                    { type: 'STORE' as const, label: 'Store Keeper', icon: Store, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', activeBg: 'rgba(14,165,233,0.12)', border: '#0ea5e9' },
                    { type: 'SUPPLIER' as const, label: 'Supplier',  icon: Truck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', activeBg: 'rgba(139,92,246,0.12)', border: '#8b5cf6' },
                  ]).map(opt => (
                    <motion.button key={opt.type} whileTap={{ scale: 0.95 }} onClick={() => { setRecipientType(opt.type); setSelectedId(''); }}
                      style={{ padding: '14px 12px', borderRadius: '16px', border: `2px solid ${recipientType === opt.type ? opt.border : 'rgba(0,0,0,0.07)'}`, background: recipientType === opt.type ? opt.activeBg : '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: recipientType === opt.type ? opt.bg : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: recipientType === opt.type ? opt.color : '#94a3b8' }}>
                        <opt.icon size={20} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: recipientType === opt.type ? opt.color : '#64748b' }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Person selector */}
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Select {recipientType === 'STORE' ? 'Store Keeper' : 'Supplier'}
                  </label>
                  {loadingProfiles ? (
                    <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      <Loader2 size={16} style={{ display: 'inline', marginRight: '6px' }} /> Loading...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {recipientList.length === 0 ? (
                        <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                          No {recipientType === 'STORE' ? 'Store Keepers' : 'Suppliers'} found
                        </div>
                      ) : recipientList.map(p => (
                        <motion.button key={p.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedId(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: `2px solid ${selectedId === p.id ? '#4f46e5' : 'rgba(0,0,0,0.06)'}`, background: selectedId === p.id ? 'rgba(79,70,229,0.06)' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: selectedId === p.id ? 'rgba(79,70,229,0.12)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: selectedId === p.id ? '#4f46e5' : '#64748b', flexShrink: 0 }}>
                            {p.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: selectedId === p.id ? '#0f172a' : '#374151' }}>{p.full_name}</div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{p.role.replace('_', ' ')}</div>
                          </div>
                          {selectedId === p.id && <CheckCircle2 size={18} color="#4f46e5" />}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quantities Card */}
          <motion.div variants={fadeUp}>
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: mode === 'Receive' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mode === 'Receive' ? '#10b981' : '#ef4444' }}>
                    <Package size={14} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    {mode === 'Receive' ? 'Set Quantities to Give' : 'Set Quantities to Return'}
                  </span>
                </div>
                {totalItems > 0 && (
                  <div style={{ background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '20px' }}>
                    {totalItems} total
                  </div>
                )}
              </div>

              {activeProducts.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                  No active products. Add products first.
                </div>
              ) : (
                activeProducts.map((p, i) => {
                  const qty = quantities[p.id] || 0;
                  const storeStock = p.stock || 0;
                  const isOverLimit = mode === 'Receive'
                    ? qty > storeStock
                    : qty > storeStock;
                  const stockLabel = mode === 'Receive' ? `Store: ${storeStock} available` : `In store: ${storeStock}`;

                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: i < activeProducts.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', background: isOverLimit && qty > 0 ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                      {/* Product icon */}
                      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: isOverLimit && qty > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(79,70,229,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.image
                          ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '13px' }} alt="" />
                          : <span style={{ fontSize: '18px' }}>🍞</span>
                        }
                      </div>

                      {/* Name + stock */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: storeStock === 0 ? '#ef4444' : storeStock < 10 ? '#f59e0b' : '#10b981' }}>
                            {storeStock === 0 ? '⛔ Out of stock' : stockLabel}
                          </span>
                        </div>
                        {isOverLimit && qty > 0 && (
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> Exceeds store stock!
                          </div>
                        )}
                      </div>

                      {/* Quantity stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                        <button onClick={() => setQty(p.id, qty - 1)}
                          style={{ width: '34px', height: '36px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '18px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          −
                        </button>
                        <input
                          type="number" min="0" value={qty || ''}
                          onChange={e => setQty(p.id, parseInt(e.target.value) || 0)}
                          style={{ width: '48px', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '14px', fontWeight: 900, color: isOverLimit && qty > 0 ? '#ef4444' : '#0f172a', outline: 'none', padding: '0' }}
                          placeholder="0"
                        />
                        <button onClick={() => setQty(p.id, qty + 1)}
                          style={{ width: '34px', height: '36px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '18px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Summary + Submit */}
          <motion.div variants={fadeUp}>
            {/* Recipient summary strip */}
            {mode === 'Receive' && selectedId && (
              <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ChevronRight size={16} color="#4f46e5" />
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Sending to: <span style={{ color: '#4f46e5' }}>{selectedProfile?.full_name}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginLeft: '6px' }}>({selectedProfile?.role?.replace('_',' ')})</span>
                </div>
              </div>
            )}

            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
                >
                  <CheckCircle2 size={20} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                    {mode === 'Receive' ? 'Bread assigned successfully! ✅' : 'Return processed successfully! ✅'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting || totalItems === 0 || (mode === 'Receive' && !selectedId)}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '20px', cursor: submitting || totalItems === 0 || (mode === 'Receive' && !selectedId) ? 'not-allowed' : 'pointer',
                background: submitting || totalItems === 0 || (mode === 'Receive' && !selectedId)
                  ? '#e2e8f0'
                  : mode === 'Receive'
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: submitting || totalItems === 0 || (mode === 'Receive' && !selectedId) ? '#94a3b8' : '#fff',
                fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: totalItems > 0 && selectedId
                  ? mode === 'Receive'
                    ? '0 8px 24px rgba(16,185,129,0.35)'
                    : '0 8px 24px rgba(239,68,68,0.35)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                : mode === 'Receive'
                  ? <><ArrowDownCircle size={18} /> Give {totalItems > 0 ? `${totalItems} units` : 'Bread'}</>
                  : <><ArrowUpCircle size={18} /> Return {totalItems > 0 ? `${totalItems} units` : 'Bread'}</>
              }
            </motion.button>

            {mode === 'Receive' && !selectedId && totalItems > 0 && (
              <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '8px' }}>
                Select a recipient above to enable
              </p>
            )}
          </motion.div>

        </motion.div>
      </div>
    </AnimatedPage>
  );
};

export default StockAssignment;
