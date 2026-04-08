import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { getTransactionItems } from '../store/types';
import type { InventoryLog, TransactionItem } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';

import { Trash2, Package, ArrowDownCircle, ArrowUpCircle, Wallet, Clock, TrendingDown } from 'lucide-react';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  danger: '#ef4444',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
};

export const Inventory: React.FC = () => {
  const { user, role } = useAuth();
  const { products, companyMetrics, processInventoryBatch, inventoryLogs, recordBakeryPayment, bakeryPayments, transactions, expenses, customers, recordSale, loading } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const isSupplier = role === 'SUPPLIER';
  
  const [activeTab, setActiveTab] = useState<'view' | 'receive' | 'return' | 'balance'>('view');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pendingItems, setPendingItems] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  
  const [storeKeepers, setStoreKeepers] = useState<any[]>([]);
  const [selectedSK, setSelectedSK] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bakery Payment Form States
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

  // Centralized Stock Helper for Suppliers (Moved up for use in products map)
  const getPersonalStock = (pId: string) => {
    if (!isSupplier) return (products || []).find(p => p.id === pId)?.stock || 0;
    const mid = myAccount?.id || user?.id;
    if (!mid) return 0;
    
    // Received = Debt (Completed) + Legacy (Filtered by Supplier)
    const rec = (transactions || []).filter(t => t.status === 'COMPLETED' && t.type === 'Debt' && t.customerId === mid)
      .reduce((sum, t) => {
         const it = getTransactionItems(t).find((i: TransactionItem) => i.productId === pId);
         return sum + (it?.quantity || 0);
      }, 0);
    const lr = (inventoryLogs || []).filter(l => l.productId === pId && l.type !== 'Return' && l.profile_id === mid).reduce((sum, l) => sum + (l.quantityReceived || 0), 0);

    // Returned = Return (Completed) + Legacy (Filtered by Supplier)
    const ret = (transactions || []).filter(t => t.status === 'COMPLETED' && t.type === 'Return' && t.customerId === mid)
      .reduce((sum, t) => {
         const it = getTransactionItems(t).find((i: TransactionItem) => i.productId === pId);
         return sum + (it?.quantity || 0);
      }, 0);
    const lret = (inventoryLogs || []).filter(l => l.productId === pId && l.type === 'Return' && l.profile_id === mid).reduce((sum, l) => sum + (l.quantityReceived || 0), 0);

    // Sold = POS_SUPPLIER
    const sold = (transactions || []).filter(t => t.status === 'COMPLETED' && t.origin === 'POS_SUPPLIER' && t.sellerId === mid)
      .reduce((sum, t) => {
        const it = getTransactionItems(t).find((i: TransactionItem) => i.productId === pId);
        return sum + (it?.quantity || 0);
      }, 0);
    
    return Math.max(0, (rec + lr) - (ret + lret) - sold);
  };

  const activeProducts = (products || []).filter(p => p.active);
  const categories = Array.from(new Set((products || []).map(p => p.category || 'Standard')));
  const filteredProducts = (products || [])
    .filter(p => selectedCategory === 'All' || (p.category || 'Standard') === selectedCategory)
     .map(p => {
        if (!isSupplier || !user?.id) return p;
        return { ...p, stock: getPersonalStock(p.id) };
     })
    .filter(p => !isSupplier || p.stock > 0)
    .sort((a, b) => {
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      return a.price - b.price;
    });
  
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
         <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
         <div style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>Refreshing Ledger...</div>
         <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const qty = parseInt(quantity) || 0;
  
  const handleTabChange = (tab: 'view' | 'receive' | 'return' | 'balance') => {
    setActiveTab(tab);
    setPendingItems([]);
    setProductId('');
    setQuantity('');
    setCostPrice('');
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentReceiver('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = (products || []).find(p => p.id === productId);
    if (!prod || qty <= 0) return;
    
    const cost = parseInt(costPrice) || prod.price; 

    if (activeTab === 'return') {
      // Return: Check against Supplier's own personal stock
      const pendingQty = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      const myStock = getPersonalStock(productId);
      if (myStock < qty + pendingQty) {
        alert(`⚠️ Cannot return more than your current stock.\n\nYour stock: ${myStock} units\nYou are trying to return: ${qty + pendingQty} units`);
        return;
      }
    }

    if (activeTab === 'receive' && isSupplier) {
      // Receive: Check against STORE's available stock (prod.stock from products table)
      const storeStock = prod.stock || 0;
      const alreadyPending = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + (i.quantityReceived || 0), 0);
      if (storeStock < qty + alreadyPending) {
        alert(`⚠️ Not enough bread in store!\n\nStore available: ${storeStock} units\nYou requested: ${qty + alreadyPending} units\n\nThe Store Manager must receive more bread before you can request this many.`);
        return;
      }
    }

    const log: InventoryLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
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

  const removeItem = (id: string) => {
    setPendingItems(pendingItems.filter(i => i.id !== id));
  };
  
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountStr = parseInt(paymentAmount);
    if (!amountStr || amountStr <= 0) return;
    
    if (isSupplier) {
      if (!user?.id) return alert('Profile not identified');
      if (!selectedSK || selectedSK === "") return alert('Select Store Keeper');
      const mid = myAccount?.id || user.id;
      setIsProcessing(true);
      await recordSale({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customerId: mid,
        storeKeeperId: selectedSK,
        type: 'Payment',
        status: 'PENDING_STORE',
        origin: 'SUPPLIER',
        totalPrice: amountStr
      });
      setIsProcessing(false);
      setPaymentAmount('');
      setActiveTab('view');
      alert('Payment Request Sent to Store Keeper');
      return;
    }

    const currentSales = (transactions || []).reduce((sum, t) => sum + (t.totalPrice || 0), 0);
    const companyOwed = currentSales - (currentSales * 0.1);
    const availableToPay = companyOwed - (companyMetrics?.totalMoneyPaid || 0);
    
    if (amountStr > availableToPay) {
      alert(`Cannot pay more than the available Company Share (₦${availableToPay.toLocaleString()})`);
      return;
    }

    setIsProcessing(true);
    const paymentId = Date.now().toString();
    await recordBakeryPayment({
      id: paymentId,
      date: new Date().toISOString(),
      amount: amountStr,
      method: paymentMethod,
      receiver: paymentReceiver.trim() || undefined
    });
    
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setIsProcessing(false);
    navigate(`/bakery-receipt/${paymentId}`);
  };

  const handleConfirmBatch = async () => {
    if (pendingItems.length === 0) return;
    setIsProcessing(true);
    
    if (isSupplier) {
      if (!user?.id) {
        setIsProcessing(false);
        alert("System Error: Your profile could not be identified.");
        return;
      }
      const mid = myAccount?.id || user.id;
      if (!selectedSK || selectedSK === "") {
        setIsProcessing(false);
        alert("Please Select a Store / Manager from the list. If the list is empty, refresh the page.");
        return;
      }
      
      for (const item of pendingItems) {
        await recordSale({
          id: Date.now().toString() + Math.random().toString(36).substring(5),
          date: new Date().toISOString(),
          customerId: mid,
          storeKeeperId: selectedSK,
          type: activeTab === 'receive' ? 'Debt' : 'Return',
          status: 'PENDING_STORE',
          origin: 'SUPPLIER',
          items: [{ productId: item.productId, quantity: item.quantityReceived, unitPrice: item.costPrice }],
          totalPrice: (item.quantityReceived || 0) * (item.costPrice || 0)
        });
      }
      setPendingItems([]);
      setIsProcessing(false);
      setActiveTab('view');
      alert(`Request sent to Store Keeper`);
      return;
    }

    const batchId = Date.now().toString();
    const itemsWithBatch = pendingItems.map(item => ({ ...item, batchId }));
    
    await processInventoryBatch(itemsWithBatch, activeTab === 'receive' ? 'Receive' : 'Return');
    setPendingItems([]);
    setIsProcessing(false);
    navigate(`/inventory/receipt/${batchId}`);
  };

  const remainingBalance = (companyMetrics?.totalValueReceived || 0) - (companyMetrics?.totalMoneyPaid || 0);
  const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

  // Supplier individual balance: Use the stored debtBalance from the database for historical accuracy.
  // This 'Restores' the user's original ledger and ensures legacy debt is visible.
  const personalDebt = myAccount?.debtBalance || 0;

  // Profit calculations
  const onlySalesTxs = (transactions || []).filter(t => t.status === 'COMPLETED' && t.origin !== 'SUPPLIER');
  const totalSales = onlySalesTxs.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
  const totalGrossProfit = totalSales * 0.1;
  const companyShare = totalSales - totalGrossProfit;
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalNetProfit = totalGrossProfit - totalExpenses;
  const totalReturnsCost = (inventoryLogs || []).filter(l => l.type === 'Return').reduce((sum, l) => sum + ((l.quantityReceived || 0) * (l.costPrice || 0)), 0);

  const groupedLogs = (inventoryLogs || []).reduce((acc, log) => {
    const key = log.batchId || log.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {} as Record<string, InventoryLog[]>);
  
  const sortedBatchIds = Object.keys(groupedLogs).sort((a,b) => new Date(groupedLogs[b][0].date).getTime() - new Date(groupedLogs[a][0].date).getTime());

  // Pending Txs for Supplier
  const myPendingTxs = (transactions || []).filter(t => t.customerId === myAccount?.id && t.status === 'PENDING_STORE');

  return (
    <AnimatedPage>
      <div className="container" style={{ paddingBottom: '90px' }}>
        
        {/* Extreme Compact Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: T.ink, margin: 0 }}>{isSupplier ? t('dash.supplierStock') || 'Supplier Stock' : t('inv.title')}</h1>
        </div>
      
      {!isSupplier && (
        <div style={{ background: T.white, borderRadius: '16px', padding: '16px', border: `1px solid ${T.border}`, marginBottom: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Wallet size={14} color={T.primary} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Financial Balance</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt2, textTransform: 'uppercase' }}>Company Balance (What you Owe)</div>
            {remainingBalance <= 0 ? (
              <div style={{ fontSize: '24px', fontWeight: 900, color: T.success }}>No Debt</div>
            ) : (
              <div style={{ fontSize: '24px', fontWeight: 900, color: T.danger }}>{fmt(remainingBalance)}</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ background: T.bg, padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Value Received</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{fmt(companyMetrics.totalValueReceived)}</div>
             </div>
             <div style={{ background: T.bg, padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Money Paid</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.success }}>{fmt(companyMetrics.totalMoneyPaid)}</div>
             </div>
             <div style={{ background: T.bg, padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Sales / Returns</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{fmt(totalSales)} / {fmt(totalReturnsCost)}</div>
             </div>
             <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>Final Net Profit</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.success }}>{fmt(totalNetProfit)}</div>
             </div>
          </div>
        </div>
      )}

      {isSupplier && myPendingTxs.length > 0 && activeTab === 'view' && (
        <div style={{ marginBottom: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Clock size={14} color="#d97706" />
              <span style={{ fontSize: '11px', fontWeight: 900, color: T.ink, textTransform: 'uppercase' }}>{t('dash.waitVerification')} ({myPendingTxs.length})</span>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {myPendingTxs.map(tx => (
                <div key={tx.id} style={{ background: '#fff', borderRadius: '12px', padding: '10px', border: `1px solid rgba(217,119,6,0.3)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: T.ink }}>{tx.type === 'Payment' ? 'Cash Payment' : tx.type === 'Return' ? t('inv.return') : t('dash.receiveBread')}</div>
                      <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>{tx.type !== 'Payment' ? tx.items?.[0]?.quantity + ' pcs' : fmt(tx.totalPrice)}</div>
                   </div>
                   <div style={{ color: '#d97706', fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: 'rgba(217,119,6,0.1)' }}>PENDING</div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar no-print">
        <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'view' ? 'bg-primary text-white shadow-sm' : 'bg-white text-secondary border border-gray-200'}`} onClick={() => handleTabChange('view')}>
          <Package size={14} /> <span>Overview</span>
        </button>
        <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'receive' ? 'bg-success text-white shadow-sm' : 'bg-white text-secondary border border-gray-200'}`} onClick={() => handleTabChange('receive')}>
          <ArrowDownCircle size={14} /> <span>{t('dash.receiveBreadShort') || 'Receive'}</span>
        </button>
        <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'return' ? 'bg-danger text-white shadow-sm' : 'bg-white text-secondary border border-gray-200'}`} onClick={() => handleTabChange('return')}>
          <ArrowUpCircle size={14} /> <span>{t('dash.returnBreadShort') || 'Return'}</span>
        </button>
        <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'balance' ? 'bg-primary text-white shadow-sm' : 'bg-white text-secondary border border-gray-200'}`} onClick={() => handleTabChange('balance')}>
          <Wallet size={14} /> <span>{t('dash.payDebtShort') || 'Payment'}</span>
        </button>
      </div>

      {(activeTab === 'receive' || activeTab === 'return') && (
        <>
          <form onSubmit={handleAddItem} style={{ background: T.white, borderRadius: '16px', padding: '16px', border: `1px solid ${T.border}`, marginBottom: '12px', borderLeftWidth: '4px', borderLeftColor: activeTab === 'receive' ? T.success : T.danger }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: T.ink }}>
              {activeTab === 'receive' ? t('dash.receiveBreadShort') : t('dash.returnBreadShort')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <select value={productId} onChange={e => setProductId(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700, appearance: 'none' }}>
                <option value="">-- Choose Bread --</option>
                {activeProducts
                  .filter(p => activeTab === 'receive' || getPersonalStock(p.id) > 0)
                  .map(p => {
                  let supStock = getPersonalStock(p.id);
                  const pendingQty = activeTab === 'return' ? pendingItems.filter(i => i.productId === p.id).reduce((s, i) => s + (i.quantityReceived || 0), 0) : 0;
                  const availableStock = supStock - pendingQty;
                  return <option key={p.id} value={p.id}>{p.name} (Avl: {activeTab === 'return' ? availableStock : p.stock})</option>;
                })}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>{t('inv.quantity')}</label>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700 }} />
              </div>
              {!isSupplier && (
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>{t('inv.costPrice')} (₦)</label>
                  <input type="number" min="1" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700 }} />
                </div>
              )}
            </div>

            {isSupplier ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Store / Manager</label>
                <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700, appearance: 'none' }}>
                   <option value="">Choose Store / Manager</option>
                   {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name} ({sk.role === 'MANAGER' ? 'Manager' : 'Store'})</option>)}
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Store Keeper</label>
                <input type="text" placeholder="Name" value={paymentReceiver} onChange={e => setPaymentReceiver(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700 }} />
              </div>
            )}
            
            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px dashed ${activeTab === 'receive' ? T.success : T.danger}`, background: activeTab === 'receive' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', color: activeTab === 'receive' ? T.success : T.danger, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
              + Add to List
            </button>
          </form>

          {pendingItems.length > 0 && (
            <div style={{ background: T.white, borderRadius: '16px', padding: '16px', border: `1px solid ${T.border}`, marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>Pending List ({pendingItems.length})</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: activeTab === 'receive' ? T.success : T.danger, textAlign: 'right' }}>
                  {isSupplier ? (
                     <>
                        <div>{pendingItems.reduce((sum, item) => sum + item.quantityReceived, 0)} pcs</div>
                        <div style={{ fontSize: '10px', color: T.txt3 }}>{fmt(pendingItems.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0))}</div>
                     </>
                  ) : (
                     fmt(pendingItems.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0))
                  )}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pendingItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg, padding: '10px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800 }}>{products.find(p => p.id === item.productId)?.name}</div>
                      <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>{item.quantityReceived} units {!isSupplier && `@ ₦${item.costPrice}`}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {!isSupplier && <div style={{ fontSize: '11px', fontWeight: 800 }}>{fmt(item.quantityReceived * item.costPrice)}</div>}
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} color={T.danger} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleConfirmBatch} disabled={isProcessing} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: activeTab === 'receive' ? T.success : T.danger, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                {isProcessing ? 'Processing...' : (isSupplier ? 'Submit Request to Store Keeper' : (activeTab === 'return' ? 'Confirm Return' : 'Confirm Receive'))}
              </button>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'balance' && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ background: T.white, borderRadius: '16px', padding: '16px', border: `1px solid ${T.border}`, borderTopWidth: '4px', borderTopColor: T.primary }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: T.primary }}>
               <TrendingDown size={16} /> {isSupplier ? 'Send Payment Request' : 'Record Payment to Company'}
            </h2>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Amount Paid (₦) *</label>
                <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={!isSupplier ? (companyShare - companyMetrics.totalMoneyPaid) : undefined}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '16px', fontWeight: 900 }} />
                {!isSupplier ? (
                   <div style={{ fontSize: '9px', color: T.txt2, marginTop: '4px' }}>Available bounds: {fmt(companyShare - companyMetrics.totalMoneyPaid)}</div>
                ) : (
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: T.txt3, textTransform: 'uppercase', fontWeight: 800 }}>Remaining Debt</span>
                          <span style={{ color: T.danger, fontWeight: 900, background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{fmt(personalDebt)}</span>
                       </div>
                       {transactions.filter(t => (t.customerId === myId && t.status === 'PENDING_STORE' && t.type === 'Return')).length > 0 && (
                          <div style={{ fontSize: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ color: T.txt2 }}>Pending Returns</span>
                             <span style={{ color: T.danger, fontWeight: 700 }}>-{fmt(transactions.filter(t => (t.customerId === myId && t.status === 'PENDING_STORE' && t.type === 'Return')).reduce((sum: number, tx: any) => sum + tx.totalPrice, 0))}</span>
                          </div>
                       )}
                    </div>
                 )}
              </div>
              
              {isSupplier ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Store / Manager</label>
                  <select value={selectedSK} onChange={(e) => setSelectedSK(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700, appearance: 'none' }}>
                     <option value="">Choose Store / Manager</option>
                     {storeKeepers.map(sk => <option key={sk.id} value={sk.id}>{sk.full_name} ({sk.role === 'MANAGER' ? 'Manager' : 'Store'})</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'Cash'|'Transfer')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700, appearance: 'none' }}>
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>Receiver</label>
                    <input type="text" value={paymentReceiver} onChange={e => setPaymentReceiver(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${T.border}`, background: T.bg, fontSize: '12px', fontWeight: 700 }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: T.primary, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                {isProcessing ? 'Processing...' : (isSupplier ? 'Request Verification' : 'Record & Print')}
              </button>
            </form>
          </div>
          
          {isSupplier ? (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>{t('dash.history')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {myTxs.filter(t => t.type === 'Payment').sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                  <div key={p.id} style={{ background: T.white, borderRadius: '12px', padding: '12px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800 }}>Payment Sent</div>
                      <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{new Date(p.date).toLocaleDateString()} {p.status === 'PENDING_STORE' ? '• Pending' : '• Approved'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: T.success }}>+{fmt(p.totalPrice)}</div>
                    </div>
                  </div>
                ))}
                
                {[...bakeryPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(p => (
                  <div key={p.id} onClick={() => navigate(`/bakery-receipt/${p.id}`)} style={{ cursor: 'pointer', background: T.white, borderRadius: '12px', padding: '12px', border: `1px dashed ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800 }}>Legacy Payment {p.method ? `(${p.method})` : ''}</div>
                      <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{new Date(p.date).toLocaleDateString()} {p.receiver && `• To: ${p.receiver}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: T.success }}>+{fmt(p.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>Payment History</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...bakeryPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                  <div key={p.id} style={{ background: T.white, borderRadius: '12px', padding: '12px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800 }}>Payment {p.method ? `(${p.method})` : ''}</div>
                      <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>{new Date(p.date).toLocaleDateString()} {p.receiver && `• To: ${p.receiver}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: T.success }}>+{fmt(p.amount)}</div>
                      <Link to={`/bakery-receipt/${p.id}`} style={{ fontSize: '9px', fontWeight: 800, color: T.primary, textDecoration: 'none' }}>Receipt</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'view' && (
        <>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }} className="hide-scrollbar">
            <button className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedCategory === 'All' ? 'bg-primary text-white shadow-sm' : 'bg-white text-secondary'}`} onClick={() => setSelectedCategory('All')}>All</button>
            {categories.map(cat => (
              <button key={cat} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-white text-secondary border border-gray-100'}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {filteredProducts.map(p => (
              <div key={p.id} style={{ background: T.white, borderRadius: '16px', padding: '12px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.image ? (
                    <img src={p.image} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                  ) : (
                    <div style={{ width: '32px', height: '32px', background: T.pLight, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontSize: '12px', fontWeight: 900 }}>
                      {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: p.active ? T.success : T.danger, marginTop: '2px' }}>{p.active ? 'Active' : 'Inactive'} • {p.category || 'Standard'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{t('inv.currentStock')}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>{p.stock}</div>
                </div>
              </div>
            ))}
          </div>

          {isSupplier ? (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>{t('inv.history')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTxs.filter(t => t.type === 'Debt' || t.type === 'Return' || t.type === 'Payment').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map(tx => {
                  const isReceive = tx.type !== 'Return';
                  const isPayment = tx.type === 'Payment';
                  const qty = tx.items?.[0]?.quantity || tx.quantity || 0;
                  const itemProd = products.find(p => p.id === (tx.items?.[0]?.productId || tx.productId));
                  const skName = storeKeepers.find(sk => sk.id === tx.storeKeeperId)?.full_name || '...';
                  
                  if (isPayment) {
                    return (
                      <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} style={{ cursor: 'pointer', background: T.white, borderRadius: '16px', padding: '12px', border: `1px solid ${T.border}`, borderLeftWidth: '4px', borderLeftColor: T.success, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: T.success }}>
                            <Wallet size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>Payment Sent</div>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>
                              {new Date(tx.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 900, color: T.success }}>+{fmt(tx.totalPrice)}</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3 }}>{tx.status === 'PENDING_STORE' ? 'PENDING' : 'COMPLETED'}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} style={{ cursor: 'pointer', background: T.white, borderRadius: '16px', padding: '12px', border: `1px solid ${T.border}`, borderLeftWidth: '4px', borderLeftColor: isReceive ? T.success : T.danger, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: isReceive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isReceive ? T.success : T.danger }}>
                          <Package size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800 }}>{isReceive ? t('dash.receiveBread') : t('inv.return')}</div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>
                            {new Date(tx.date).toLocaleDateString()} • {qty} pcs {itemProd?.name ? `(${itemProd.name})` : ''}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: T.primary, marginTop: '2px' }}>
                            {isReceive ? 'Request from' : 'Return to'}: {skName}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: isReceive ? T.success : T.danger }}>
                           {tx.status === 'PENDING_STORE' ? 'PENDING' : 'COMPLETED'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedBatchIds.length > 0 && (
                <div style={{ marginTop: '24px', opacity: 0.8 }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>Legacy History</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sortedBatchIds.slice(0, 10).map(batchId => {
                      const batch = groupedLogs[batchId];
                      const first = batch[0];
                      const isReceive = first.type !== 'Return';
                      const totalItems = batch.reduce((sum, item) => sum + item.quantityReceived, 0);
                      const totalValue = batch.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0);
                      
                      return (
                        <div key={batchId} onClick={() => navigate(`/inventory/receipt/${batchId}`)} style={{ background: T.white, borderRadius: '16px', padding: '12px', border: `1px dashed ${T.border}`, borderLeftWidth: '4px', borderLeftColor: isReceive ? T.success : T.danger, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: isReceive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isReceive ? T.success : T.danger }}>
                              <Package size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800 }}>{isReceive ? 'Legacy Receive' : 'Legacy Return'}</div>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>
                                {new Date(first.date).toLocaleDateString()} • {totalItems} items
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 900, color: isReceive ? T.success : T.danger }}>
                              {isReceive ? '+' : '-'}{fmt(totalValue)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            sortedBatchIds.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>{t('inv.history')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedBatchIds.slice(0, 20).map(batchId => {
                    const batch = groupedLogs[batchId];
                    const first = batch[0];
                    const isReceive = first.type !== 'Return';
                    const totalItems = batch.reduce((sum, item) => sum + item.quantityReceived, 0);
                    const totalValue = batch.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0);
                    
                    return (
                      <div key={batchId} onClick={() => navigate(`/inventory/receipt/${batchId}`)} style={{ background: T.white, borderRadius: '16px', padding: '12px', border: `1px solid ${T.border}`, borderLeftWidth: '4px', borderLeftColor: isReceive ? T.success : T.danger, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', borderRadius: '10px', background: isReceive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isReceive ? T.success : T.danger }}>
                            <Package size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>{isReceive ? t('dash.receiveBread') : t('inv.return')}</div>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '2px' }}>
                              {new Date(first.date).toLocaleDateString()} • {totalItems} items
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 900, color: isReceive ? T.success : T.danger }}>
                            {isReceive ? '+' : '-'}{fmt(totalValue)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </>
      )}

      </div>
    </AnimatedPage>
  );
};

export default Inventory;
