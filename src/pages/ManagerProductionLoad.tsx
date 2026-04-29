import React, { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  ArrowLeft, Plus, Minus,
  CheckCircle2, Loader2, Sparkles,
  Search, History, PackagePlus,
  Activity, Boxes
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const T = {
  primary: '#4f46e5',
  primaryLt: 'rgba(79,70,229,0.08)',
  success: '#10b981',
  successLt: 'rgba(16,185,129,0.1)',
  danger: '#ef4444',
  dangerLt: 'rgba(239,68,68,0.1)',
  ink: '#0f172a',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f1f5f9',
  surface: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  borderL: 'rgba(0,0,0,0.04)',
  shadow: '0 4px 12px rgba(0,0,0,0.05)',
  shadowMd: '0 10px 25px -5px rgba(0,0,0,0.08)',
};

export const ManagerProductionLoad: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch, inventoryLogs } = useAppContext();

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const activeProducts = useMemo(() =>
    products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())),
  [products, search]);

  const selectedItems = useMemo(() =>
    Object.entries(quantities).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id);
      return { id, qty, name: p?.name || 'Unknown' };
    }),
  [quantities, products]);

  const totalQty = selectedItems.reduce((acc, item) => acc + item.qty, 0);

  const handleUpdateQty = (pId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [pId]: Math.max(0, (prev[pId] || 0) + delta)
    }));
  };

  const handleLoadStock = async () => {
    if (selectedItems.length === 0) return;
    setLoading(true);
    try {
      const logs = selectedItems.map(item => ({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'Receive' as const,
        productId: item.id,
        quantityReceived: item.qty,
        costPrice: products.find(p => p.id === item.id)?.costPrice || 0,
        category: 'PRODUCTION' as const,
        batchId: Date.now().toString()
      }));

      await processInventoryBatch(logs, 'Receive');
      setShowSuccess(true);
      setQuantities({});
      setShowSummary(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      alert('Network issue. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const recentLogs = useMemo(() =>
    [...inventoryLogs]
      .filter(l => l.type === 'Receive')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  [inventoryLogs]);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Inter', system-ui, sans-serif", color: T.ink }}>

        {/* COMPACT HEADER */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.borderL}`, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: T.txt2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '6px', borderRadius: '8px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ width: '1px', height: '20px', background: T.border }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>Production Load</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: T.txt3, fontWeight: 700 }}>
                <Activity size={9} color={T.primary} /> Live Batch Tracking
              </div>
            </div>
          </div>

          {/* Summary pill */}
          {totalQty > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={() => setShowSummary(true)}
              style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 12px ${T.primary}30` }}
            >
              <PackagePlus size={12} /> {selectedItems.length} items · {totalQty} units
            </motion.button>
          )}
        </div>

        <div style={{ padding: '16px' }}>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={14} color={T.txt3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              placeholder="Search products..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', background: T.surface, border: `1px solid ${T.borderL}`, borderRadius: '12px', fontSize: '12px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: T.ink, boxShadow: T.shadow }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* PRODUCT GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeProducts.map((p) => (
              <motion.div
                key={p.id}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: T.surface,
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: `1px solid ${quantities[p.id] > 0 ? T.primary : T.borderL}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  boxShadow: quantities[p.id] > 0 ? `0 0 0 2px ${T.primaryLt}` : T.shadow
                }}
              >
                {/* Left accent bar */}
                <AnimatePresence>
                  {quantities[p.id] > 0 && (
                    <motion.div
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }}
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: T.primary, transformOrigin: 'top' }}
                    />
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.primaryLt, border: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Boxes size={16} color={T.primary} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>In stock:</span>
                      <span style={{ fontSize: '10px', color: p.stock < 10 ? T.danger : T.success, fontWeight: 800 }}>{p.stock} units</span>
                    </div>
                  </div>
                </div>

                {/* QUANTITY CONTROLS */}
                <div style={{ display: 'flex', alignItems: 'center', background: T.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${T.borderL}`, gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => handleUpdateQty(p.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: T.surface, border: `1px solid ${T.borderL}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                    <Minus size={12} />
                  </button>
                  <div style={{ width: '44px', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={quantities[p.id] || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setQuantities(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : Math.max(0, val) }));
                      }}
                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '15px', fontWeight: 900, color: quantities[p.id] > 0 ? T.primary : T.ink, outline: 'none', padding: 0 }}
                    />
                  </div>
                  <button onClick={() => handleUpdateQty(p.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: quantities[p.id] > 0 ? T.primary : T.surface, border: `1px solid ${quantities[p.id] > 0 ? T.primary : T.borderL}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: quantities[p.id] > 0 ? '#fff' : T.txt2, transition: 'all 0.15s' }}>
                    <Plus size={12} />
                  </button>
                </div>
              </motion.div>
            ))}

            {activeProducts.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', background: T.surface, borderRadius: '14px', border: `1px dashed ${T.border}` }}>
                <Sparkles size={24} color={T.txt3} style={{ marginBottom: '12px' }} />
                <div style={{ fontWeight: 700, color: T.txt3, fontSize: '13px' }}>No products found</div>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          {recentLogs.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <History size={13} color={T.txt3} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Activity</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentLogs.map((log, idx) => {
                  const p = products.find(prod => prod.id === log.productId);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                      style={{ background: T.surface, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${T.borderL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name}</div>
                        <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: T.success }}>+{log.quantityReceived}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SHEET SUMMARY MODAL */}
        <AnimatePresence>
          {showSummary && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSummary(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                style={{ position: 'relative', background: T.surface, borderRadius: '20px 20px 0 0', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}
              >
                <div style={{ width: '36px', height: '4px', background: T.border, borderRadius: '2px', margin: '0 auto 20px' }} />
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, color: T.ink }}>Batch Summary</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {selectedItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: T.bg, borderRadius: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{item.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: T.primary }}>+{item.qty}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: T.primaryLt, borderRadius: '12px', marginBottom: '20px', border: `1px solid ${T.primary}20` }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Total Units</span>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: T.primary, lineHeight: 1 }}>{totalQty}</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={handleLoadStock}
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', background: loading ? T.txt3 : T.primary, color: '#fff', border: 'none', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 20px ${T.primary}30` }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><PackagePlus size={16} /> Confirm & Load Stock</>}
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SUCCESS TOAST */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 30 }}
              style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: T.ink, color: '#fff', padding: '12px 24px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={13} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '13px' }}>Inventory Updated!</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProductionLoad;
