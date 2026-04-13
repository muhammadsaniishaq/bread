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
  bg: '#fbfcfd',
  surface: '#ffffff',
  surface2: '#f8fafc',
  border: '#f1f5f9',
  primary: '#0f172a', // Deep Slate
  brand: '#3b82f6',   // Electric Blue
  brandLight: 'rgba(59, 130, 246, 0.05)',
  success: '#10b981',
  danger: '#ef4444',
  ink: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  softShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
  hoverShadow: '0 12px 40px -4px rgba(0, 0, 0, 0.08)',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
};

export const ManagerProductionLoad: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch, inventoryLogs } = useAppContext();

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '100px', fontFamily: "'Segoe UI', Roboto, sans-serif", color: T.ink, overflowX: 'hidden' }}>
        
        {/* ULTRA PREMIUM HEADER */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '20px 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                 <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: T.txt2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                    <ArrowLeft size={18} /> BACK
                 </motion.button>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(45deg, #0f172a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Production Desk</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: T.txt3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                       <Activity size={10} color={T.brand} /> Live Batch Tracking
                    </div>
                 </div>
              </div>
              
              <div style={{ background: T.surface2, borderRadius: '14px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', flex: '1', maxWidth: '400px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                 <Search size={16} color={T.txt3} />
                 <input 
                   placeholder="Filter production menu..." 
                   style={{ background: 'transparent', border: 'none', outline: 'none', color: T.ink, fontSize: '14px', fontWeight: 600, width: '100%' }}
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* FLEX-MAX ADAPTIVE GRID */}
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
           
           {/* PRODUCT MENU */}
           <div style={{ flex: '1.2', minWidth: '320px', maxWidth: '800px' }}>
              <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                 {activeProducts.map((p) => (
                    <motion.div 
                      key={p.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.005, boxShadow: T.hoverShadow }}
                      style={{ background: T.surface, padding: '20px', borderRadius: '24px', border: `1px solid ${quantities[p.id] > 0 ? T.brand : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                       {/* PULSE INDICATOR FOR SELECTION */}
                       <AnimatePresence>
                          {quantities[p.id] > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
                              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: T.brand }}
                            />
                          )}
                       </AnimatePresence>

                       <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1', minWidth: '220px' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                             {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Boxes size={24} color={T.brand} />}
                          </div>
                          <div>
                             <div style={{ fontSize: '15px', fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>{p.name}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>Current Storage</span>
                                <span style={{ fontSize: '11px', color: p.stock < 10 ? T.danger : T.success, fontWeight: 900 }}>{p.stock} units</span>
                             </div>
                          </div>
                       </div>

                       {/* QUANTITY CONTROLS */}
                       <div style={{ display: 'flex', alignItems: 'center', background: T.surface2, padding: '4px', borderRadius: '14px', border: `1px solid ${T.border}` }}>
                           <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleUpdateQty(p.id, -1)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.softShadow, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}><Minus size={14} /></motion.button>
                          <div style={{ width: '60px', textAlign: 'center' }}>
                             <input 
                               type="number"
                               value={quantities[p.id] || ''}
                               placeholder="0"
                               onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setQuantities(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : Math.max(0, val) }));
                               }}
                               style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '18px', fontWeight: 900, color: quantities[p.id] > 0 ? T.brand : T.ink, outline: 'none', padding: 0 }}
                             />
                          </div>
                           <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleUpdateQty(p.id, 1)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.softShadow, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.brand }}><Plus size={14} /></motion.button>
                       </div>
                    </motion.div>
                 ))}
                 {activeProducts.length === 0 && (
                   <div style={{ padding: '60px', textAlign: 'center', background: T.surface, borderRadius: '24px', border: `1px dashed ${T.border}` }}>
                      <Sparkles size={32} color={T.txt3} style={{ marginBottom: '16px' }} />
                      <div style={{ fontWeight: 700, color: T.txt3 }}>No matches found in bakery catalog</div>
                   </div>
                 )}
              </motion.div>
           </div>

           {/* ACTION SIDEBAR */}
           <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <div style={{ background: T.surface, borderRadius: '32px', padding: '32px', border: `1px solid ${T.border}`, boxShadow: T.hoverShadow, position: 'sticky', top: '110px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.brand }} />
                    <span style={{ fontSize: '13px', fontWeight: 900, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch Summary</span>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {selectedItems.map(item => (
                       <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span style={{ color: T.txt2, fontWeight: 700 }}>{item.name}</span>
                          <span style={{ color: T.brand, fontWeight: 900 }}>+{item.qty}</span>
                       </div>
                    ))}
                    {selectedItems.length === 0 && (
                       <div style={{ textAlign: 'center', color: T.txt3, fontSize: '12px', background: T.surface2, borderRadius: '12px', padding: '16px' }}>
                          Empty batch selection...
                       </div>
                    )}
                 </div>

                 <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: '20px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                       <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>TOTAL ADDED</span>
                       <span style={{ fontSize: '42px', fontWeight: 950, color: T.ink, lineHeight: 1 }}>{totalQty}</span>
                    </div>
                 </div>

                 <motion.button 
                   whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }} whileTap={{ scale: 0.98 }}
                   disabled={loading || selectedItems.length === 0}
                   onClick={handleLoadStock}
                   style={{ 
                     width: '100%', padding: '20px', borderRadius: '20px', background: loading || selectedItems.length === 0 ? T.txt3 : `linear-gradient(135deg, ${T.brand}, #2563eb)`, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.1)'
                   }}
                 >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><PackagePlus size={20} /> Sync Inventory</>}
                 </motion.button>
              </div>

              <div style={{ padding: '0 8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: T.txt3 }}>
                    <History size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Recent Activity Log</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentLogs.map((log, idx) => {
                       const p = products.find(prod => prod.id === log.productId);
                       return (
                          <motion.div 
                            key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                            style={{ background: T.surface, padding: '14px 18px', borderRadius: '18px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: T.softShadow }}
                          >
                             <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name}</div>
                                <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                             </div>
                             <div style={{ fontSize: '15px', fontWeight: 950, color: T.success }}>+{log.quantityReceived}</div>
                          </motion.div>
                       )
                    })}
                 </div>
              </div>

           </div>

        </div>

        {/* NOTIFICATION */}
        <AnimatePresence>
           {showSuccess && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 30 }}
               style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: '#0f172a', color: '#fff', padding: '16px 32px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
             >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <CheckCircle2 size={16} color="#fff" />
                </div>
                <span style={{ fontWeight: 850, fontSize: '14px', letterSpacing: '0.02em' }}>INVENTORY UPDATED SUCCESSFULLY</span>
             </motion.div>
           )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProductionLoad;
