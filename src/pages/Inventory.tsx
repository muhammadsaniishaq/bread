import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import type { InventoryLog } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { motion } from 'framer-motion';

import { 
  Trash2, Package, ArrowDownCircle, ArrowUpCircle, 
  Wallet, Clock,
  LayoutGrid, ChevronRight, ShoppingCart, Info, RotateCcw
} from 'lucide-react';

const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#eaeef4',
  accent: '#4f46e5',
  accentLt: '#e0e7ff',
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
  shadow: '0 4px 20px rgba(0,0,0,0.04)',
  radius: '20px',
  radiusLg: '28px',
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }> = ({ children, style, onClick }) => (
  <motion.div 
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={onClick}
    style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: '16px',
      padding: '16px',
      boxShadow: T.shadow,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}
  >
    {children}
  </motion.div>
);

const InpLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ fontSize: '11px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
    {children}
  </label>
);

const InpStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: `1px solid ${T.border}`,
  background: T.surface,
  fontSize: '13px',
  fontWeight: 700,
  color: T.ink,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s'
};

export const Inventory: React.FC = () => {
  const { user, role } = useAuth();
  const { 
    products, processInventoryBatch, 
    recordBakeryPayment, 
    transactions, customers, recordSale, 
    loading, getPersonalStock 
  } = useAppContext();
  const {  } = useTranslation();
  const navigate = useNavigate();
  
  const isSupplier = role === 'SUPPLIER';
  
  const [activeTab, setActiveTab] = useState<'view' | 'receive' | 'return' | 'balance'>('view');
  const [pendingItems, setPendingItems] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [storeKeepers, setStoreKeepers] = useState<any[]>([]);
  const [selectedSK, setSelectedSK] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [paymentReceiver, setPaymentReceiver] = useState('');

  // Fetch Store Keepers and Managers explicitly for assignment
  useEffect(() => {
    const fetchSKs = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, role').in('role', ['STORE_KEEPER', 'MANAGER']);
        if (error) throw error;
        if (data) setStoreKeepers(data);
      } catch (err) {
        console.error("Failed to load Store Keepers", err);
      }
    };
    fetchSKs();
  }, []);

  // ── Auto-Link Profile if missing ──────────────────────────────────────────
  const { linkProfileToRecord } = useAppContext();
  useEffect(() => {
    const checkLink = async () => {
      if (!user || role !== 'SUPPLIER') return;
      const linkedRecord = customers.find(c => c.profile_id === user.id);
      if (!linkedRecord) {
        const meta = (user as any).user_metadata || {};
        await linkProfileToRecord(user.id, user.email || '', meta.phone, meta.full_name);
      }
    };
    checkLink();
  }, [user, role, customers, linkProfileToRecord]);

  const myAccount = useMemo(() => (customers || []).find(c => c.profile_id === user?.id), [customers, user]);
  const myId = myAccount?.id || user?.id;

  // Recent specific transactions
  const myTxs = useMemo(() => (transactions || []).filter(t => 
    t.customerId === myId || t.sellerId === myId || 
    t.customerId === user?.id || t.sellerId === user?.id
  ).sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions, myId, user]);
  
  // Pending actions waiting on some Store Keeper
  const autoPending = useMemo(() => myTxs.filter(t => t.status === 'PENDING_STORE'), [myTxs]);
  
  // Stock per product
  const enrichedProducts = useMemo(() => {
    return products.filter(p => p.active).map(p => ({
      ...p, 
      myStock: getPersonalStock(p.id) 
    }));
  }, [products, getPersonalStock]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '48px', height: '48px', border: `4px solid ${T.border}`, borderTop: `4px solid ${T.accent}`, borderRadius: '50%' }} />
      </div>
    );
  }

  const handleTabChange = (tab: 'view' | 'receive' | 'return' | 'balance') => {
    setActiveTab(tab);
    setPendingItems([]);
    setProductId('');
    setQuantity('');
    setSelectedSK(''); // Crucial step reset
    setPaymentAmount('');
    setPaymentReceiver('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSK && isSupplier) {
      alert("Please select the Store Keeper/Manager handling this transaction first.");
      return;
    }

    const prod = enrichedProducts.find(p => p.id === productId);
    const qty = parseInt(quantity) || 0;
    if (!prod || qty <= 0) return;

    if (activeTab === 'return') {
      const alreadyPending = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      if (prod.myStock < qty + alreadyPending) {
        alert(`Insufficient stock. You only have ${prod.myStock} units in your personal ledger.`);
        return;
      }
    }

    if (activeTab === 'receive' && isSupplier) {
      // Global Store Check
      const storeStock = prod.stock || 0;
      const alreadyPending = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      if (storeStock < qty + alreadyPending) {
        alert(`The Bakery only has ${storeStock} units remaining of this item. Wait for restock.`);
        return;
      }
    }

    const log: InventoryLog = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      type: activeTab === 'receive' ? 'Receive' : 'Return',
      productId,
      quantityReceived: qty,
      costPrice: prod.price, 
      storeKeeper: selectedSK || paymentReceiver
    };
    
    setPendingItems([...pendingItems, log]);
    setProductId(''); 
    setQuantity(''); 
  };

  const handleConfirmBatch = async () => {
    if (pendingItems.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (isSupplier) {
        if (!selectedSK) throw new Error("Crucial Error: You must select a Store Keeper/Manager.");
        const mid = myAccount?.id || user?.id; // Supplier's representation
        if (!mid) throw new Error("Profile not fully recognized. Try relogging.");

        for (const item of pendingItems) {
          // Send to PENDING_STORE mapping so the specific SK sees it on their end
          await recordSale({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerId: user?.id, // STRICTLY Auth UUID to bypass RLS failures, not Ledger ID
            storeKeeperId: selectedSK, 
            type: activeTab === 'receive' ? 'Debt' : 'Return',
            status: 'PENDING_STORE',
            origin: 'SUPPLIER',
            items: [{ productId: item.productId, quantity: item.quantityReceived, unitPrice: item.costPrice }],
            totalPrice: item.quantityReceived * item.costPrice
          });
        }
        alert('Request Sent! The Store Keeper must accept it before your stock changes.');
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

  const submitPayment = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedSK && isSupplier) return alert('Select the Store Keeper receiving this money.');
     setIsProcessing(true);
     try {
       await recordBakeryPayment({ 
         id: crypto.randomUUID(), 
         date: new Date().toISOString(), 
         amount: parseInt(paymentAmount), 
         method: paymentMethod, 
         receiver: storeKeepers.find(sk => sk.id === selectedSK)?.full_name || paymentReceiver,
          customerId: myId,
          profileId: user?.id
        });
       alert('Payment recorded successfully.');
       setActiveTab('view');
     } catch(e) {
       alert('Failed to record payment');
     } finally {
       setIsProcessing(false);
     }
  };

  const personalDebt = myAccount?.debtBalance || 0;
  const totalStockCount = enrichedProducts.reduce((s,p) => s + p.myStock, 0);
  const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
        
        {/* HERO */}
        <div style={{ padding: '32px 20px 0', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              {isSupplier ? 'My Inventory' : 'Store Inventory'}
            </h1>
            <p style={{ fontSize: '13px', color: T.txt2, margin: 0, fontWeight: 500 }}>
              {isSupplier ? 'Manage your stock, returns, and remit payments.' : 'Global Bakery Inventory Portal'}
            </p>
          </div>

          {/* TOP NAVIGATION TABS */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
            {[
              { id: 'view', icon: LayoutGrid, label: 'Overview' },
              { id: 'receive', icon: ArrowDownCircle, label: 'Receive' },
              { id: 'return', icon: ArrowUpCircle, label: 'Return' },
              { id: 'balance', icon: Wallet, label: 'Payment' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id} onClick={() => handleTabChange(tab.id as any)}
                  style={{
                    background: isActive ? T.ink : T.surface2,
                    color: isActive ? '#fff' : T.txt3,
                    border: 'none', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* METRICS DASHBOARD (Overview) */}
        {activeTab === 'view' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '20px' }}>
            {isSupplier && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <Card style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Active Stock</div>
                  <div style={{ fontSize: '26px', fontWeight: 950, color: '#fff', margin: '4px 0' }}>{totalStockCount}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Units in circulation</div>
                </Card>
                <Card style={{ background: personalDebt > 0 ? T.dangerLt : T.successLt, borderColor: personalDebt > 0 ? '#fecaca' : '#bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: personalDebt > 0 ? T.textDanger : T.textSuccess, fontWeight: 800, textTransform: 'uppercase' }}>Owed Dept</div>
                  <div style={{ fontSize: '24px', fontWeight: 950, color: personalDebt > 0 ? T.danger : T.textSuccess, margin: '4px 0' }}>{fmt(personalDebt)}</div>
                  <div style={{ fontSize: '11px', color: personalDebt > 0 ? T.textDanger : T.textSuccess, fontWeight: 600 }}>Remaining to clear</div>
                </Card>
              </div>
            )}

            {autoPending.length > 0 && isSupplier && (
              <Card style={{ borderLeft: `4px solid ${T.warn}`, background: T.warnLt, marginBottom: '24px', padding: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Clock size={20} color={T.warn} />
                   <div>
                     <div style={{ fontSize: '13px', fontWeight: 800, color: T.textWarn }}>{autoPending.length} Request(s) Pending</div>
                     <div style={{ fontSize: '11px', color: '#b45309' }}>Waiting for Store Keeper to accept.</div>
                   </div>
                 </div>
              </Card>
            )}

            {/* INVENTORY ITEMS OVERVIEW */}
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: T.txt2, marginBottom: '12px' }}>Personal Ledger</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {enrichedProducts.map(p => (
                <Card key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} alt="" /> : <Package size={18} color={T.txt3} />}
                     </div>
                     <div>
                       <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{p.name}</div>
                       <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 600 }}>{p.category}</div>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Available</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: isSupplier ? (p.myStock > 0 ? T.success : T.ink) : T.ink }}>{isSupplier ? p.myStock : p.stock}</div>
                  </div>
                </Card>
              ))}
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: 800, color: T.txt2, marginTop: '32px', marginBottom: '12px' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTxs.slice(0, 5).map(tx => (
                  <Card key={tx.id} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tx.status === 'PENDING_STORE' ? T.warnLt : (tx.type === 'Return' ? T.dangerLt : T.successLt), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tx.status === 'PENDING_STORE' ? <Clock size={16} color={T.warn} /> : (tx.type === 'Return' ? <ArrowUpCircle size={16} color={T.danger} /> : <ArrowDownCircle size={16} color={T.success} />)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{tx.type === 'Debt' ? 'Stock Receive' : tx.type === 'Return' ? 'Stock Return' : 'Payment Sent'}</div>
                        <div style={{ fontSize: '11px', color: T.txt3 }}>{new Date(tx.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{tx.type === 'Payment' ? fmt(tx.totalPrice) : `${tx.items?.[0]?.quantity || 0} pcs`}</div>
                        <div style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: tx.status === 'COMPLETED' ? T.successLt : T.warnLt, color: tx.status === 'COMPLETED' ? T.success : T.textWarn }}>{tx.status}</div>
                      </div>
                  </Card>
                ))}
            </div>
          </motion.div>
        )}

        {/* OPERATIONS (Receive / Return / Balance) */}
        {(activeTab === 'receive' || activeTab === 'return' || activeTab === 'balance') && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px' }}>
            
            <Card style={{ borderTop: `4px solid ${activeTab === 'receive' ? T.success : activeTab === 'return' ? T.warn : T.ink}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                 {activeTab === 'receive' && <ShoppingCart size={20} color={T.success} />}
                 {activeTab === 'return' && <RotateCcw size={20} color={T.warn} />}
                 {activeTab === 'balance' && <Wallet size={20} color={T.ink} />}
                 <h2 style={{ fontSize: '18px', fontWeight: 900, color: T.ink, margin: 0 }}>
                   {activeTab === 'receive' ? 'Receive New Stock' : activeTab === 'return' ? 'Return Stock' : 'Settle Debt'}
                 </h2>
              </div>
              
              <form onSubmit={activeTab === 'balance' ? submitPayment : handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Universal Delegator (Who are we dealing with?) */}
                {isSupplier && (
                  <div style={{ background: T.surface2, padding: '12px', borderRadius: '14px', border: `1px solid ${T.border}` }}>
                    <InpLabel>Target Store Keeper / Manager *</InpLabel>
                    <select value={selectedSK} onChange={e => setSelectedSK(e.target.value)} required style={InpStyle}>
                       <option value="">-- Choose the Operator --</option>
                       {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name} ({sk.role})</option>)}
                    </select>
                    <div style={{ fontSize: '10px', color: T.txt3, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Info size={12} /> The selected operator will receive your request for approval.
                    </div>
                  </div>
                )}

                {/* Balance Specific Inputs */}
                {activeTab === 'balance' ? (
                  <>
                    {/* Explicit Debt Display for Payment Tab */}
                    {isSupplier && (
                      <div style={{ background: personalDebt > 0 ? T.dangerLt : T.successLt, padding: '14px', borderRadius: '12px', border: `1px solid ${personalDebt > 0 ? '#fecaca' : '#bbf7d0'}`, marginBottom: '4px' }}>
                        <div style={{ fontSize: '11px', color: personalDebt > 0 ? T.textDanger : T.textSuccess, fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Current Outstanding Debt</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: personalDebt > 0 ? T.danger : T.textSuccess }}>{fmt(personalDebt)}</div>
                      </div>
                    )}
                    <div>
                      <InpLabel>Amount Conveyed (₦)</InpLabel>
                      <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ ...InpStyle, fontSize: '18px', fontWeight: 900 }} placeholder="0" />
                    </div>
                    <div>
                      <InpLabel>Payment Form</InpLabel>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={InpStyle}>
                        <option value="Cash">Physical Cash</option>
                        <option value="Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    {!isSupplier && (
                      <div>
                        <InpLabel>Given To (Name)</InpLabel>
                        <input type="text" value={paymentReceiver} onChange={e => setPaymentReceiver(e.target.value)} required style={InpStyle} />
                      </div>
                    )}
                  </>
                ) : (
                  /* Inventory Specific Inputs */
                  <>
                    <div>
                      <InpLabel>Select Bread Type</InpLabel>
                      <select value={productId} onChange={e => setProductId(e.target.value)} required style={InpStyle}>
                        <option value="">-- Choose Bread --</option>
                        {enrichedProducts.map(p => (
                           <option key={p.id} value={p.id}>
                             {p.name} 
                             {activeTab === 'receive' 
                               ? ` (Store Balance: ${p.stock})` 
                               : ` (My Balance: ${p.myStock})`}
                           </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <InpLabel>Quantity (Pieces)</InpLabel>
                      <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required style={InpStyle} placeholder="1" />
                    </div>
                  </>
                )}

                <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: activeTab === 'return' ? T.warn : (activeTab === 'receive' ? T.success : T.ink), color: '#fff', border: 'none', fontSize: '15px', fontWeight: 900, cursor: 'pointer', marginTop: '10px' }}>
                  {activeTab === 'balance' ? (isProcessing ? 'Recording...' : 'Finalize Payment') : '+ Add Item to Request'}
                </button>
              </form>
            </Card>

            {/* PENDING ITEMS CART (Only for Receive/Return) */}
            {pendingItems.length > 0 && activeTab !== 'balance' && (
              <Card style={{ background: T.ink, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>Draft Request ({pendingItems.length})</span>
                  <button onClick={() => setPendingItems([])} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {pendingItems.map((item, idx) => {
                    const prod = enrichedProducts.find(p => p.id === item.productId);
                    return (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>{prod?.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.quantityReceived} units requested</div>
                        </div>
                        <button onClick={() => setPendingItems(pendingItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                           <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleConfirmBatch} disabled={isProcessing} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: T.success, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isProcessing ? 'Pushing Request...' : 'Push Request to Manager'}
                  <ChevronRight size={18} />
                </button>
              </Card>
            )}

          </motion.div>
        )}

      </div>
    </AnimatedPage>
  );
};

export default Inventory;
