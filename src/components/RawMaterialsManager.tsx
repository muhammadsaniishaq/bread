import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2, Search, X, TrendingUp, Box,
  Building2, Banknote, Minus, Trash2, ShoppingCart,
  Activity, BarChart3, History, Package
} from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export interface RawMaterial { id: string; name: string; quantity_remaining: number; unit: string; min_stock?: number; }
export interface RMVendor { id: string; name: string; phone: string; debt_balance: number; }
export interface RMLog { 
  id: string; material_id?: string; supplier_id?: string; 
  type: 'RESTOCK'|'USAGE'|'PAYMENT'; 
  quantity: number; cost_total: number; amount_paid: number; 
  cash_paid?: number; transfer_paid?: number;
  items?: { material_id: string, name: string, quantity: number, price: number }[];
  created_at: string; 
}

/* ─────────────────────────────────────────
   TOKENS & STYLES (Premium Gray/Indigo)
───────────────────────────────────────── */
const T = {
  bg:        'var(--background-color)',
  surface:   'var(--surface-color)',
  border:    'var(--border-color)',
  primary:   '#4f46e5', // Brand Indigo
  primaryLt: 'rgba(79,70,229,0.1)',
  success:   '#10b981',
  successLt: 'rgba(16,185,129,0.1)',
  danger:    '#ef4444',
  dangerLt:  'rgba(239,68,68,0.1)',
  warn:      '#f59e0b',
  warnLt:    'rgba(245,158,11,0.1)',
  txt:       'var(--text-color)',
  txt2:      'var(--text-secondary)',
  txt3:      'rgba(156, 163, 175, 1)',
  radius:    '24px',
  shadow:    '0 4px 20px rgba(0,0,0,0.03)',
  glass:     'rgba(255,255,255,0.7)',
  glassDark: 'rgba(0,0,0,0.05)'
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const fmt = (v: number) => `₦${v.toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

const Card = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ background: T.surface, borderRadius: '24px', border: `1px solid ${T.border}`, padding: '20px', boxShadow: T.shadow, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, sub }: { icon: any, title: string, sub?: string }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
      <Icon size={18} color={T.primary} />
      <h2 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{title}</h2>
    </div>
    {sub && <p style={{ fontSize: '11px', color: T.txt3, fontWeight: 500, margin: 0 }}>{sub}</p>}
  </div>
);

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export const RawMaterialsManager: React.FC = () => {
  const navigate = useNavigate();

  const [mats, setMats] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<RMVendor[]>([]);
  const [logs, setLogs] = useState<RMLog[]>([]);
  const [, setLoading] = useState(true);
  const [tab, setTab] = useState<'inventory'|'vendors'|'history'|'analytics'>('inventory');
  const [query, setQuery] = useState('');

  // Loaves per Bag setting (Default 500)
  const [loavesPerBag, setLoavesPerBag] = useState(500);

  // Modals & Contexts
  const [addMatOpen, setAddMatOpen] = useState(false);
  const [addVenOpen, setAddVenOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [usageMat, setUsageMat] = useState<RawMaterial | null>(null);
  const [paymentVen, setPaymentVen] = useState<RMVendor | null>(null);

  // Form States
  const [mName, setMName] = useState(''); const [mUnit, setMUnit] = useState('Bags'); const [mEditId, setMEditId] = useState<string|null>(null);
  const [vName, setVName] = useState(''); const [vPhone, setVPhone] = useState(''); const [vEditId, setVEditId] = useState<string|null>(null);
  const [actionQty, setActionQty] = useState(''); const [actionPay, setActionPay] = useState('');
  const [bVenId, setBVenId] = useState('');
  const [bItems, setBItems] = useState<{id: string, matId: string, qty: string, price: string}[]>([]);
  const [bCash, setBCash] = useState(''); const [bTransfer, setBTransfer] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [mRes, vRes, lRes] = await Promise.all([
      supabase.from('raw_materials').select('*').order('name'),
      supabase.from('rm_suppliers').select('*').order('name'),
      supabase.from('rm_logs').select('*').order('created_at', { ascending: false }).limit(200)
    ]);
    if (mRes.data) setMats(mRes.data);
    if (vRes.data) setVendors(vRes.data);
    if (lRes.data) setLogs(lRes.data);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  // Analytics - Price Trends
  const priceTrendData = useMemo(() => {
    // We'll track the unit price of 'Flour' (or most common item) over time
    const flourLogs = logs.filter(l => l.type === 'RESTOCK' && l.items?.some(i => i.name.toLowerCase().includes('flour')))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return flourLogs.map(l => {
      const flourItem = l.items?.find(i => i.name.toLowerCase().includes('flour'));
      return {
        date: fmtDate(l.created_at),
        price: flourItem?.price || 0
      };
    }).slice(-7); // Last 7 restocks
  }, [logs]);

  // Overall Market Value
  const inventoryValuation = useMemo(() => {
    // Calculate latest price from logs for each material
    const latestPrices: Record<string, number> = {};
    logs.filter(l => l.type === 'RESTOCK').forEach(log => {
      log.items?.forEach(item => {
        if (!latestPrices[item.material_id]) latestPrices[item.material_id] = item.price;
      });
    });
    
    return mats.reduce((sum, m) => sum + (m.quantity_remaining * (latestPrices[m.id] || 0)), 0);
  }, [logs, mats]);

  // Yield Projection for Flour
  const flourStock = mats.find(m => m.name.toLowerCase().includes('flour'))?.quantity_remaining || 0;
  const projectedYield = flourStock * loavesPerBag;

  // Actions
  const resetForms = () => {
    setAddMatOpen(false); setAddVenOpen(false); setBatchOpen(false); setUsageMat(null); setPaymentVen(null);
    setMName(''); setMUnit('Bags'); setMEditId(null);
    setVName(''); setVPhone(''); setVEditId(null);
    setActionQty(''); setActionPay(''); setBVenId(''); setBItems([]); setBCash(''); setBTransfer('');
  };

  const handleSaveMat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mEditId) await supabase.from('raw_materials').update({ name: mName, unit: mUnit }).eq('id', mEditId);
    else await supabase.from('raw_materials').insert([{ name: mName, unit: mUnit, quantity_remaining: 0 }]);
    resetForms(); fetchAll();
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalCost = bItems.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.price)||0), 0);
    const paid = (parseFloat(bCash)||0) + (parseFloat(bTransfer)||0);
    const debt = totalCost - paid;

    // 1. Update Mats
    await Promise.all(bItems.map(item => {
      const current = mats.find(m => m.id === item.matId);
      return supabase.from('raw_materials').update({ quantity_remaining: (current?.quantity_remaining || 0) + (parseFloat(item.qty)||0) }).eq('id', item.matId);
    }));

    // 2. Log Receipt
    const itemsJson = bItems.map(i => ({ material_id: i.matId, name: mats.find(m => m.id === i.matId)?.name || 'Unknown', quantity: parseFloat(i.qty)||0, price: parseFloat(i.price)||0 }));
    await supabase.from('rm_logs').insert([{ 
      supplier_id: bVenId, type: 'RESTOCK', cost_total: totalCost, cash_paid: parseFloat(bCash)||0, transfer_paid: parseFloat(bTransfer)||0, 
      items: itemsJson 
    }]);

    // 3. Update Vendor Debt
    if (debt > 0) {
      const v = vendors.find(ven => ven.id === bVenId);
      await supabase.from('rm_suppliers').update({ debt_balance: (v?.debt_balance || 0) + debt }).eq('id', bVenId);
    }
    resetForms(); fetchAll();
  };

  const handleLogUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageMat) return;
    const q = parseFloat(actionQty) || 0;
    await supabase.from('raw_materials').update({ quantity_remaining: Math.max(0, usageMat.quantity_remaining - q) }).eq('id', usageMat.id);
    await supabase.from('rm_logs').insert([{ material_id: usageMat.id, type: 'USAGE', quantity: q }]);
    resetForms(); fetchAll();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentVen) return;
    const p = parseFloat(actionPay) || 0;
    await supabase.from('rm_suppliers').update({ debt_balance: Math.max(0, paymentVen.debt_balance - p) }).eq('id', paymentVen.id);
    await supabase.from('rm_logs').insert([{ supplier_id: paymentVen.id, type: 'PAYMENT', amount_paid: p }]);
    resetForms(); fetchAll();
  };

  // Filtration
  const filteredMats = mats.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(query.toLowerCase()));

  // Sub-components
  const Modal = ({ show, onClose, title, children, icon: Icon }: any) => (
    <AnimatePresence>
      {show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ position: 'relative', background: T.surface, width: '100%', maxWidth: '480px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {Icon && <div style={{ background: T.primaryLt, padding: '10px', borderRadius: '12px' }}><Icon size={20} color={T.primary} /></div>}
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{title}</h3>
              </div>
              <button onClick={onClose} style={{ border: 'none', background: T.glassDark, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, padding: '16px 16px 100px', color: T.txt, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <ArrowLeft size={18} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Back</span>
           </button>
           <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Manufacturing Log</h1>
           <div style={{ width: '38px' }} />
        </div>

        {/* Global Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
           <Card style={{ background: T.primary, color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>Investment Value</span>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{fmt(inventoryValuation)}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '8px', opacity: 0.9 }}>Value of all items in store</div>
           </Card>
           
           <Card style={{ borderLeft: `6px solid ${T.success}` }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: T.txt3 }}>Active Suppliers</span>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>{vendors.length}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '8px', color: T.success }}>{vendors.filter(v => v.debt_balance > 0).length} Unpaid</div>
           </Card>
        </div>

        {/* Dynamic Yield & Trends Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '32px' }}>
           <Card style={{ background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, color: '#fff', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color={T.success} />
                    <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Production Capability</span>
                 </div>
                 <button onClick={() => {
                    const val = prompt('Enter Loaves yielded per Bag of Flour:', loavesPerBag.toString());
                    if (val) setLoavesPerBag(parseInt(val));
                 }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>Adjust Ratio</button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>{projectedYield.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginTop: '6px' }}>Estimated Loaves with {flourStock} bags</div>
                 </div>
                 <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid rgba(255,255,255,0.05)', borderTopColor: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                       <div style={{ fontSize: '14px', fontWeight: 900 }}>{loavesPerBag}</div>
                       <div style={{ fontSize: '7px', fontWeight: 800, color: '#94a3b8' }}>PER BAG</div>
                    </div>
                 </div>
              </div>
           </Card>

           {/* Price Trend Analytics */}
           <Card>
              <SectionTitle icon={TrendingUp} title="Market Price Trends" sub="Historical unit cost for Flour" />
              <div style={{ height: '140px', width: '100%', marginTop: '10px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceTrendData}>
                       <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={T.primary} stopOpacity={0.1}/>
                             <stop offset="95%" stopColor={T.primary} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: T.txt3 }} />
                       <YAxis hide />
                       <Tooltip contentStyle={{ background: T.surface, borderRadius: '12px', border: `1px solid ${T.border}`, fontSize: '10px', fontWeight: 800 }} />
                       <Area type="monotone" dataKey="price" stroke={T.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '16px', marginBottom: '24px', position: 'sticky', top: '10px', zIndex: 10 }}>
           {[
              { id: 'inventory', label: 'Stock', icon: Box },
              { id: 'vendors', label: 'Vendors', icon: Building2 },
              { id: 'history', label: 'History', icon: History }
           ].map(t => (
             <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ flex: 1, border: 'none', background: tab === t.id ? T.surface : 'transparent', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: tab === t.id ? T.shadow : 'none' }}>
                <t.icon size={14} color={tab === t.id ? T.primary : T.txt3} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: tab === t.id ? T.txt : T.txt3 }}>{t.label}</span>
             </button>
           ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
           <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
           <input type="text" placeholder={`Filter ${tab}...`} value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', fontSize: '13px', fontWeight: 600, outline: 'none', boxShadow: T.shadow }} />
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
           {tab === 'inventory' && (
              <motion.div key="inv" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <button onClick={() => { setBItems([{ id: '1', matId: mats[0]?.id || '', qty: '', price: '' }]); setBatchOpen(true); }}
                       style={{ flex: 1, padding: '16px', background: T.primary, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: `0 8px 24px ${T.primary}20` }}>
                       <ShoppingCart size={16} /> Batch RESTOCK
                    </button>
                    <button onClick={() => setAddMatOpen(true)}
                       style={{ width: '54px', height: '54px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                       <Plus size={20} />
                    </button>
                 </div>

                 {filteredMats.map(p => (
                   <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: p.quantity_remaining <= 5 ? T.dangerLt : T.primaryLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color={p.quantity_remaining <= 5 ? T.danger : T.primary} />
                         </div>
                         <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: T.txt }}>{p.name}</div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: T.txt3 }}>{p.quantity_remaining} {p.unit} remaining</div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <button onClick={() => setUsageMat(p)} style={{ background: T.glassDark, border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>USAGE</button>
                         <button onClick={() => { setMName(p.name); setMUnit(p.unit); setMEditId(p.id); setAddMatOpen(true); }} style={{ background: 'none', border: `1.5px solid ${T.border}`, padding: '8px', borderRadius: '10px', color: T.txt3 }}><Edit2 size={14}/></button>
                      </div>
                   </Card>
                 ))}
              </motion.div>
           )}

           {tab === 'vendors' && (
              <motion.div key="ven" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <button onClick={() => setAddVenOpen(true)}
                    style={{ padding: '16px', background: T.txt, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                    <Building2 size={16} /> Add New Supplier
                 </button>

                 {filteredVendors.map(v => (
                   <Card key={v.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: T.glassDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>{v.name.charAt(0)}</div>
                            <div>
                               <div style={{ fontSize: '15px', fontWeight: 800 }}>{v.name}</div>
                               <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{v.phone || 'No phone'}</div>
                            </div>
                         </div>
                         <button onClick={() => { setVName(v.name); setVPhone(v.phone); setVEditId(v.id); setAddVenOpen(true); }} style={{ color: T.txt3 }}><Edit2 size={16}/></button>
                      </div>
                      <div style={{ background: T.dangerLt, padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: T.danger, textTransform: 'uppercase' }}>Debt Balance</span>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: T.danger }}>{fmt(v.debt_balance)}</div>
                         </div>
                         <button onClick={() => setPaymentVen(v)} disabled={v.debt_balance <= 0}
                            style={{ background: v.debt_balance > 0 ? T.danger : T.border, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                            Settle Pay
                         </button>
                      </div>
                   </Card>
                 ))}
              </motion.div>
           )}

           {tab === 'history' && (
              <motion.div key="hist" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {logs.map(log => {
                    const vendor = vendors.find(v => v.id === log.supplier_id);
                    return (
                       <div key={log.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: T.surface, borderRadius: '16px', border: `1px solid ${T.border}` }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: log.type === 'RESTOCK' ? T.primaryLt : log.type === 'USAGE' ? T.warnLt : T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                             {log.type === 'RESTOCK' ? <ShoppingCart size={18} color={T.primary}/> : log.type === 'USAGE' ? <Activity size={18} color={T.warn}/> : <Banknote size={18} color={T.success}/>}
                          </div>
                          <div style={{ flex: 1 }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800 }}>{log.type} {log.type === 'RESTOCK' ? 'Receipt' : ''}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>{fmtDate(log.created_at)}</span>
                             </div>
                             <div style={{ fontSize: '11px', color: T.txt2, marginTop: '4px' }}>
                                {log.type === 'RESTOCK' && `From ${vendor?.name || 'Suppliers'}: ${log.items?.length || 0} items`}
                                {log.type === 'USAGE' && `${log.quantity} units of material removed.`}
                                {log.type === 'PAYMENT' && `Settled ${fmt(log.amount_paid)} with ${vendor?.name}.`}
                             </div>
                             {log.type === 'RESTOCK' && (
                                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 900, color: T.primary }}>
                                   {fmt(log.cost_total || 0)}
                                </div>
                             )}
                          </div>
                       </div>
                    );
                 })}
              </motion.div>
           )}
        </AnimatePresence>

        {/* MODALS */}
        <Modal show={batchOpen} onClose={resetForms} title="Batch Restock" icon={ShoppingCart}>
           <form onSubmit={handleSaveBatch}>
              <div style={{ marginBottom: '20px' }}>
                 <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: T.txt3, marginBottom: '8px', display: 'block' }}>Vendor</label>
                 <select required value={bVenId} onChange={e=>setBVenId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1.5px solid ${T.border}`, outline: 'none', background: T.bg }}>
                    <option value="">Choose Supplier...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                 </select>
              </div>

              <div style={{ background: T.glassDark, padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>ITEMS ORDERED</span>
                    <button type="button" onClick={() => setBItems([...bItems, { id: Date.now().toString(), matId: mats[0]?.id || '', qty: '', price: '' }])}
                       style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '8px', padding: '4px 8px', fontSize: '10px', fontWeight: 800 }}>+ ADD</button>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bItems.map(it => (
                       <div key={it.id} style={{ display: 'flex', gap: '6px' }}>
                          <select value={it.matId} onChange={e=>setBItems(bItems.map(x => x.id === it.id ? {...x, matId: e.target.value} : x))} style={{ flex: 2, padding: '8px', borderRadius: '10px', border: `1px solid ${T.border}` }}>
                             {mats.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <input type="number" placeholder="Qty" value={it.qty} onChange={e=>setBItems(bItems.map(x => x.id === it.id ? {...x, qty: e.target.value} : x))} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${T.border}`, width: '50px' }} />
                          <input type="number" placeholder="Price" value={it.price} onChange={e=>setBItems(bItems.map(x => x.id === it.id ? {...x, price: e.target.value} : x))} style={{ flex: 1.5, padding: '8px', borderRadius: '10px', border: `1px solid ${T.border}`, width: '70px' }} />
                          <button type="button" onClick={() => setBItems(bItems.filter(x => x.id !== it.id))} style={{ color: T.danger, padding: '4px' }}><Trash2 size={14}/></button>
                       </div>
                    ))}
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                 <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>CASH PAID</label>
                    <input type="number" value={bCash} onChange={e=>setBCash(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.border}` }} />
                 </div>
                 <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>TRANSFER</label>
                    <input type="number" value={bTransfer} onChange={e=>setBTransfer(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.border}` }} />
                 </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '16px', background: T.primary, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '15px' }}>Confirm Receipt</button>
           </form>
        </Modal>

        <Modal show={addVenOpen} onClose={resetForms} title={vEditId ? "Update Vendor" : "Add Vendor"} icon={Building2}>
           <form onSubmit={async (e) => {
              e.preventDefault();
              if (vEditId) await supabase.from('rm_suppliers').update({ name: vName, phone: vPhone }).eq('id', vEditId);
              else await supabase.from('rm_suppliers').insert([{ name: vName, phone: vPhone, debt_balance: 0 }]);
              resetForms(); fetchAll();
           }}>
              <input value={vName} onChange={e=>setVName(e.target.value)} placeholder="Supplier Name" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '16px' }} />
              <input value={vPhone} onChange={e=>setVPhone(e.target.value)} placeholder="Phone Number" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '24px' }} />
              <button type="submit" style={{ width: '100%', padding: '16px', background: T.txt, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900 }}>Save Supplier</button>
           </form>
        </Modal>
        {/* Other Modals (Save Mat, Usage, Payment) */}
        <Modal show={addMatOpen} onClose={resetForms} title={mEditId ? "Update Material" : "Add Material"} icon={Box}>
           <form onSubmit={handleSaveMat}>
              <input value={mName} onChange={e=>setMName(e.target.value)} placeholder="Material Name (e.g. Yeast)" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '16px' }} />
              <select value={mUnit} onChange={e=>setMUnit(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '24px' }}>
                 <option>Bags</option><option>Kg</option><option>Litres</option><option>Pieces</option>
              </select>
              <button type="submit" style={{ width: '100%', padding: '16px', background: T.primary, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900 }}>Save Material</button>
           </form>
        </Modal>

        <Modal show={usageMat !== null} onClose={resetForms} title={`Deduct Usage: ${usageMat?.name}`} icon={Minus}>
           <form onSubmit={handleLogUsage}>
              <div style={{ fontSize: '13px', color: T.txt2, marginBottom: '16px' }}>Current stock: {usageMat?.quantity_remaining} {usageMat?.unit}</div>
              <input type="number" step="any" autoFocus value={actionQty} onChange={e=>setActionQty(e.target.value)} placeholder={`Quantity in ${usageMat?.unit}`} required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '24px', fontSize: '18px', fontWeight: 900 }} />
              <button type="submit" style={{ width: '100%', padding: '16px', background: T.txt, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900 }}>Log Usage</button>
           </form>
        </Modal>

        <Modal show={paymentVen !== null} onClose={resetForms} title={`Pay Supplier: ${paymentVen?.name}`} icon={Banknote}>
           <form onSubmit={handlePayment}>
              <div style={{ fontSize: '13px', color: T.txt2, marginBottom: '16px' }}>Debt Balance: {fmt(paymentVen?.debt_balance || 0)}</div>
              <input type="number" step="any" autoFocus value={actionPay} onChange={e=>setActionPay(e.target.value)} placeholder="Amount to settle ₦" required style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1.5px solid ${T.border}`, marginBottom: '24px', fontSize: '18px', fontWeight: 900 }} />
              <button type="submit" style={{ width: '100%', padding: '16px', background: T.success, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 900 }}>Mark Paid</button>
           </form>
        </Modal>

      </div>
    </AnimatedPage>
  );
};

export default RawMaterialsManager;
