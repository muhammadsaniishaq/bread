import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import type { InventoryLog } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Trash2, Package, ArrowDownCircle, ArrowUpCircle, 
  Wallet, TrendingDown,
  Filter, Search, CheckCircle2,
  LayoutGrid
} from 'lucide-react';

const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#eaeef4',
  accent: '#6366f1',
  accentLt: '#eef2ff',
  success: '#10b981',
  successLt: '#dcfce7',
  textSuccess: '#166534',
  danger: '#ef4444',
  dangerLt: '#fee2e2',
  textDanger: '#991b1b',
  warn: '#f59e0b',
  warnLt: '#fef3c7',
  textWarn: '#92400e',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  radius: '16px',
  radiusLg: '24px',
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }> = ({ children, style, onClick }) => (
  <motion.div 
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={onClick}
    style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '16px',
      boxShadow: T.shadow,
      ...style
    }}
  >
    {children}
  </motion.div>
);

const InpLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ fontSize: '11px', fontWeight: 700, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
    {children}
  </label>
);

const InpStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: `1px solid ${T.border}`,
  background: T.surface,
  fontSize: '14px',
  fontWeight: 600,
  color: T.ink,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s'
};

export const Inventory: React.FC = () => {
  const { user, role } = useAuth();
  const { 
    products, companyMetrics, processInventoryBatch, 
    recordBakeryPayment, bakeryPayments, 
    transactions, customers, recordSale, 
    loading, getPersonalStock 
  } = useAppContext();
  const {  } = useTranslation();
  const navigate = useNavigate();
  
  const isSupplier = role === 'SUPPLIER';
  
  const [activeTab, setActiveTab] = useState<'view' | 'receive' | 'return' | 'balance'>('view');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pendingItems, setPendingItems] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [storeKeepers, setStoreKeepers] = useState<any[]>([]);
  const [selectedSK, setSelectedSK] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [paymentReceiver, setPaymentReceiver] = useState('');

  useEffect(() => {
    const fetchSKs = async () => {
      if (!isSupplier) return;
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, role').in('role', ['STORE_KEEPER', 'MANAGER']);
        if (error) throw error;
        if (data) setStoreKeepers(data);
      } catch (err) {
        console.error("Failed to load Store Keepers", err);
      }
    };
    fetchSKs();
  }, [isSupplier]);

  const myAccount = useMemo(() => (customers || []).find(c => c.profile_id === user?.id), [customers, user]);
  const myId = myAccount?.id || user?.id;
  const myTxs = useMemo(() => (transactions || []).filter(t => t.customerId === myId || t.sellerId === myId), [transactions, myId]);

  const filteredProducts = useMemo(() => {
    const active = (products || []).filter(p => p.active);
    let res = active.map(p => {
      if (!isSupplier || !user?.id) return p;
      return { ...p, stock: getPersonalStock(p.id) };
    });

    if (isSupplier) res = res.filter(p => p.stock > 0);
    if (selectedCategory !== 'All') res = res.filter(p => (p.category || 'Standard') === selectedCategory);
    if (searchTerm) res = res.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return res.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name));
  }, [products, isSupplier, user, selectedCategory, searchTerm, getPersonalStock]);

  const categories = useMemo(() => ['All', ...Array.from(new Set((products || []).map(p => p.category || 'Standard')))], [products]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '48px', height: '48px', border: `4px solid ${T.border}`, borderTop: `4px solid ${T.accent}`, borderRadius: '50%' }} />
         <div style={{ fontSize: '15px', fontWeight: 800, color: T.txt2, letterSpacing: '0.02em' }}>Loading Inventory System...</div>
      </div>
    );
  }

  const handleTabChange = (tab: 'view' | 'receive' | 'return' | 'balance') => {
    setActiveTab(tab);
    setPendingItems([]);
    setProductId('');
    setQuantity('');
    setCostPrice('');
    setPaymentAmount('');
    setPaymentReceiver('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = (products || []).find(p => p.id === productId);
    const qty = parseInt(quantity) || 0;
    if (!prod || qty <= 0) return;
    
    const cost = parseInt(costPrice) || prod.price; 

    if (activeTab === 'return') {
      const pendingQty = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      const myStock = getPersonalStock(productId);
      if (myStock < qty + pendingQty) {
        alert(`Insufficient stock. You only have ${myStock} units in your personal ledger.`);
        return;
      }
    }

    if (activeTab === 'receive' && isSupplier) {
      const storeStock = prod.stock || 0;
      const alreadyPending = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      if (storeStock < qty + alreadyPending) {
        alert(`The Store only has ${storeStock} units remaining. Contact the Manager to restock.`);
        return;
      }
    }

    const log: InventoryLog = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      type: activeTab === 'receive' ? 'Receive' : 'Return',
      productId,
      quantityReceived: qty,
      costPrice: cost,
      storeKeeper: isSupplier ? selectedSK : paymentReceiver
    };
    
    setPendingItems([...pendingItems, log]);
    setProductId(''); setQuantity(''); setCostPrice('');
  };

  const handleConfirmBatch = async () => {
    if (pendingItems.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (isSupplier) {
        if (!selectedSK) throw new Error("Please select a Store / Manager for verification.");
        const mid = myAccount?.id || user?.id;
        if (!mid) throw new Error("Profile not identified.");

        for (const item of pendingItems) {
          await recordSale({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerId: mid,
            storeKeeperId: selectedSK,
            type: activeTab === 'receive' ? 'Debt' : 'Return',
            status: 'PENDING_STORE',
            origin: 'SUPPLIER',
            items: [{ productId: item.productId, quantity: item.quantityReceived, unitPrice: item.costPrice }],
            totalPrice: item.quantityReceived * item.costPrice
          });
        }
        alert('Stock request sent to Store Keeper for verification.');
      } else {
        const batchId = Date.now().toString();
        await processInventoryBatch(pendingItems.map(i => ({ ...i, batchId })), activeTab === 'receive' ? 'Receive' : 'Return');
        navigate(`/inventory/receipt/${batchId}`);
      }
      setPendingItems([]);
      setActiveTab('view');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingBalance = (companyMetrics?.totalValueReceived || 0) - (companyMetrics?.totalMoneyPaid || 0);
  const personalDebt = myAccount?.debtBalance || 0;
  const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', padding: '20px 16px 100px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: T.ink, margin: 0, letterSpacing: '-0.03em' }}>
              {isSupplier ? 'Stock Portal' : 'Main Inventory'}
            </h1>
            <p style={{ fontSize: '13px', color: T.txt2, margin: '4px 0 0' }}>Manage product flow & ledgers</p>
          </div>
          {isSupplier && personalDebt > 0 && (
            <div style={{ background: T.dangerLt, padding: '8px 12px', borderRadius: '12px', textAlign: 'right' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: T.textDanger, textTransform: 'uppercase' }}>Owed to Bakery</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: T.textDanger }}>{fmt(personalDebt)}</div>
            </div>
          )}
        </div>

        {/* Financial Highlights (Managers Only) */}
        {!isSupplier && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
             <Card style={{ background: remainingBalance > 0 ? T.dangerLt : T.successLt, borderColor: remainingBalance > 0 ? '#fecdd3' : '#bbf7d0' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                 <Wallet size={14} color={remainingBalance > 0 ? T.danger : T.success} />
                 <span style={{ fontSize: '11px', fontWeight: 800, color: remainingBalance > 0 ? T.textDanger : T.textSuccess }}>Owed to Bakery</span>
               </div>
               <div style={{ fontSize: '20px', fontWeight: 900, color: remainingBalance > 0 ? T.textDanger : T.textSuccess }}>{fmt(remainingBalance)}</div>
             </Card>
             <Card>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                 <TrendingDown size={14} color={T.accent} />
                 <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt2 }}>Total Volume</span>
               </div>
               <div style={{ fontSize: '20px', fontWeight: 900, color: T.ink }}>{fmt(companyMetrics.totalValueReceived)}</div>
             </Card>
          </div>
        )}

        {/* Global Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
          {[
            { id: 'view', label: 'Overview', icon: LayoutGrid, color: T.accent },
            { id: 'receive', label: isSupplier ? 'Get Stock' : 'Receive', icon: ArrowDownCircle, color: T.success },
            { id: 'return', label: 'Return', icon: ArrowUpCircle, color: T.danger },
            { id: 'balance', label: 'Payment', icon: Wallet, color: T.accent }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange(tab.id as any)}
              style={{
                background: activeTab === tab.id ? tab.color : T.surface,
                color: activeTab === tab.id ? '#fff' : T.txt2,
                border: `1px solid ${activeTab === tab.id ? tab.color : T.border}`,
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === tab.id ? `0 4px 12px ${tab.color}33` : 'none'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'view' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Filter & Search Bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} color={T.txt3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    style={{ ...InpStyle, paddingLeft: '40px', height: '48px' }} 
                    placeholder="Search Bread..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                  <Filter size={18} color={T.txt2} />
                </div>
              </div>

              {/* Category Bubbles */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px' }} className="hide-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? T.ink : T.surface2,
                      color: selectedCategory === cat ? '#fff' : T.txt2,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {filteredProducts.map(p => (
                  <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                         {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Package size={20} color={T.accent} />}
                       </div>
                       <div>
                         <div style={{ fontSize: '15px', fontWeight: 800, color: T.ink }}>{p.name}</div>
                         <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{p.category || 'Standard'} • {fmt(p.price)}</div>
                       </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Available</div>
                       <div style={{ fontSize: '18px', fontWeight: 900, color: p.stock > 10 ? T.success : T.danger }}>{p.stock}</div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Historical Logs List (Brief) */}
              <div style={{ marginTop: '32px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h3 style={{ fontSize: '16px', fontWeight: 800, color: T.ink, margin: 0 }}>Recent Activity</h3>
                   <button onClick={() => navigate('/reports')} style={{ fontSize: '12px', fontWeight: 700, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myTxs.slice(0, 5).map(tx => (
                       <Card key={tx.id} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tx.type === 'Return' ? T.dangerLt : T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {tx.type === 'Return' ? <ArrowUpCircle size={18} color={T.danger} /> : <ArrowDownCircle size={18} color={T.success} />}
                          </div>
                          <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{tx.type === 'Debt' ? 'Stock Received' : tx.type === 'Return' ? 'Stock Returned' : 'Cash Payment'}</div>
                             <div style={{ fontSize: '11px', color: T.txt3 }}>{new Date(tx.date).toLocaleDateString()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{tx.type === 'Payment' ? fmt(tx.totalPrice) : `${tx.items?.[0]?.quantity || 0} pcs`}</div>
                             <div style={{ fontSize: '10px', fontWeight: 700, color: tx.status === 'COMPLETED' ? T.success : T.warn }}>{tx.status}</div>
                          </div>
                       </Card>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'receive' || activeTab === 'return') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card style={{ marginBottom: '20px', borderLeftWidth: '4px', borderLeftColor: activeTab === 'receive' ? T.success : T.danger }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: T.ink }}>
                  {activeTab === 'receive' ? 'Create Intake Request' : 'Create Return Request'}
                </h3>
                
                <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <InpLabel>Select Bread Type</InpLabel>
                    <select value={productId} onChange={e => setProductId(e.target.value)} required style={InpStyle}>
                      <option value="">-- Choose Bread --</option>
                      {products.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({activeTab === 'return' ? `My Stock: ${getPersonalStock(p.id)}` : `Store: ${p.stock}`})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <InpLabel>Quantity (Pcs)</InpLabel>
                      <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required style={InpStyle} placeholder="0" />
                    </div>
                    {!isSupplier && (
                      <div>
                        <InpLabel>Cost Price (₦)</InpLabel>
                        <input type="number" min="1" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={InpStyle} placeholder="Auto" />
                      </div>
                    )}
                  </div>

                  {isSupplier ? (
                    <div>
                      <InpLabel>Authorize With Store Keeper</InpLabel>
                      <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)} required style={InpStyle}>
                         <option value="">Choose Witness...</option>
                         {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <InpLabel>Store Keeper Name</InpLabel>
                      <input type="text" placeholder="Receiver Name" value={paymentReceiver} onChange={e => setPaymentReceiver(e.target.value)} style={InpStyle} />
                    </div>
                  )}

                  <button type="submit" style={{ background: activeTab === 'receive' ? T.successLt : T.dangerLt, color: activeTab === 'receive' ? T.textSuccess : T.textDanger, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}>
                    + Add to Batch
                  </button>
                </form>
              </Card>

              {pendingItems.length > 0 && (
                <Card style={{ background: T.ink }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>Requesting {pendingItems.length} Items</span>
                    <button onClick={() => setPendingItems([])} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>Clear All</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {pendingItems.map((item, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{products.find(p => p.id === item.productId)?.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.quantityReceived} units</div>
                        </div>
                        <button onClick={() => setPendingItems(pendingItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none' }}>
                           <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleConfirmBatch} disabled={isProcessing} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: T.surface, color: T.ink, border: 'none', fontSize: '15px', fontWeight: 900, cursor: 'pointer' }}>
                    {isProcessing ? 'Synchronizing...' : 'Submit Final Request'}
                  </button>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'balance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card style={{ borderTop: `4px solid ${T.accent}` }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: T.ink, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={18} color={T.accent} /> 
                  {isSupplier ? 'Settle Outstanding Debt' : 'Record Bakery Remittance'}
                </h2>
                
                <form onSubmit={async (e) => { e.preventDefault(); setIsProcessing(true); try { await recordBakeryPayment({ id: crypto.randomUUID(), date: new Date().toISOString(), amount: parseInt(paymentAmount), method: paymentMethod, receiver: paymentReceiver }); alert('Payment recorded successfully.'); setActiveTab('view'); } catch(e){ alert('Error'); } finally { setIsProcessing(false); } }}>
                  <div style={{ marginBottom: '16px' }}>
                    <InpLabel>Amount to Pay (₦)</InpLabel>
                    <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ ...InpStyle, fontSize: '20px', fontWeight: 900, textAlign: 'center' }} placeholder="0" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <InpLabel>Payment Mode</InpLabel>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={InpStyle}>
                        <option value="Cash">Physical Cash</option>
                        <option value="Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <InpLabel>Authorized By</InpLabel>
                      <input type="text" value={paymentReceiver} onChange={e => setPaymentReceiver(e.target.value)} placeholder="Full Name" style={InpStyle} />
                    </div>
                  </div>

                  <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: T.ink, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.3)' }}>
                    {isProcessing ? 'Verifying...' : 'Record Payment Now'}
                  </button>
                </form>
              </Card>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: T.txt2, marginBottom: '12px' }}>Remittance History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bakeryPayments.slice(0, 5).map(p => (
                    <Card key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={16} color={T.success} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{fmt(p.amount)}</div>
                          <div style={{ fontSize: '11px', color: T.txt3 }}>{new Date(p.date).toLocaleDateString()} • {p.method}</div>
                        </div>
                      </div>
                      <Link to={`/bakery-receipt/${p.id}`} style={{ fontSize: '12px', fontWeight: 700, color: T.accent, textDecoration: 'none' }}>View Receipt</Link>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </AnimatedPage>
  );
};

export default Inventory;
