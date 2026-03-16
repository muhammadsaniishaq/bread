import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import type { InventoryLog } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';

import { Trash2, FileText, TrendingDown, TrendingUp, Package, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, companyMetrics, processInventoryBatch, inventoryLogs, recordBakeryPayment, bakeryPayments, transactions, expenses } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'view' | 'receive' | 'return' | 'balance'>('view');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pendingItems, setPendingItems] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [storeKeeper, setStoreKeeper] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bakery Payment Form States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [paymentReceiver, setPaymentReceiver] = useState('');

  const activeProducts = products.filter(p => p.active);
  const categories = Array.from(new Set(products.map(p => p.category || 'Standard')));
  const filteredProducts = products
    .filter(p => selectedCategory === 'All' || (p.category || 'Standard') === selectedCategory)
    .sort((a, b) => {
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      return a.price - b.price;
    });
  
  const qty = parseInt(quantity) || 0;
  const cost = parseInt(costPrice) || 0;

  const handleTabChange = (tab: 'view' | 'receive' | 'return' | 'balance') => {
    setActiveTab(tab);
    setPendingItems([]);
    setProductId('');
    setQuantity('');
    setCostPrice('');
    setStoreKeeper('');
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentReceiver('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || qty <= 0 || cost <= 0) return;
    
    if (activeTab === 'return') {
      const product = products.find(p => p.id === productId);
      const pendingQty = pendingItems.filter(i => i.productId === productId).reduce((s, i) => s + i.quantityReceived, 0);
      if (!product || product.stock < qty + pendingQty) {
        alert("Cannot return more stock than you currently have.");
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
      storeKeeper: storeKeeper.trim() || undefined
    };
    
    setPendingItems([...pendingItems, log]);
    setProductId(''); setQuantity(''); setCostPrice('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountStr = parseInt(paymentAmount);
    if (!amountStr || amountStr <= 0) return;
    
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
    setPaymentReceiver('');
    setPaymentMethod('Cash');
    setIsProcessing(false);
    
    // Navigate straight to the receipt
    navigate(`/bakery-receipt/${paymentId}`);
  };

  const removeItem = (id: string) => {
    setPendingItems(pendingItems.filter(i => i.id !== id));
  };

  const handleConfirmBatch = async () => {
    if (pendingItems.length === 0) return;
    setIsProcessing(true);
    
    // Generate the batch ID here to guarantee we know it
    const batchId = Date.now().toString();
    const itemsWithBatch = pendingItems.map(item => ({ ...item, batchId }));
    
    await processInventoryBatch(itemsWithBatch, activeTab === 'receive' ? 'Receive' : 'Return');
    
    setPendingItems([]);
    setIsProcessing(false);
    navigate(`/inventory/receipt/${batchId}`);
  };

  const remainingBalance = companyMetrics.totalValueReceived - companyMetrics.totalMoneyPaid;

  // New Professional Metrics
  const totalSales = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
  const totalGrossProfit = totalSales * 0.1; // Standard 10%
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNetProfit = totalGrossProfit - totalExpenses;
  const totalReturnsCost = inventoryLogs.filter(l => l.type === 'Return').reduce((sum, l) => sum + (l.quantityReceived * l.costPrice), 0);

  // Group logs by batch for history
  const groupedLogs = inventoryLogs.reduce((acc, log) => {
    const key = log.batchId || log.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {} as Record<string, InventoryLog[]>);
  
  const sortedBatchIds = Object.keys(groupedLogs).sort((a,b) => {
    return new Date(groupedLogs[b][0].date).getTime() - new Date(groupedLogs[a][0].date).getTime();
  });

  return (
    <AnimatedPage>
      <div className="container">
        <h1 className="text-2xl font-bold mb-6">{t('inv.title')}</h1>
      
      {/* Professional Company Balance Grid */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 mb-6 shadow-xl border border-white/10">
        <h2 className="text-sm text-slate-300 font-medium mb-4 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          Professional Financial Balance
        </h2>
        
        <div className="mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Company Balance (What you Owe)</div>
          {remainingBalance <= 0 ? (
            <div className="text-3xl font-bold leading-tight text-emerald-400">No Debt</div>
          ) : (
            <div className="text-4xl font-black leading-tight text-rose-400">₦{remainingBalance.toLocaleString()}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mb-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Value Received</div>
            <div className="text-base font-bold">₦{companyMetrics.totalValueReceived.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Money Paid</div>
            <div className="text-base font-bold text-emerald-400">₦{companyMetrics.totalMoneyPaid.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Sales (Abun da aka saida)</div>
            <div className="text-lg font-bold text-blue-400">₦{totalSales.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Returns (Abun da aka maida)</div>
            <div className="text-lg font-bold text-amber-400">₦{totalReturnsCost.toLocaleString()}</div>
          </div>
          <div className="col-span-2 bg-black/20 rounded-lg p-3 mt-2 border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Estimated Net Profit (Riba)</div>
            <div className="text-xl font-bold text-emerald-400">₦{totalNetProfit.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Based on 10% Gross Margin minus Expenses</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-print hide-scrollbar">
        <button 
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'view' ? 'bg-primary text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
          onClick={() => handleTabChange('view')}
        >
          <Package size={14} /> <span>Overview</span>
        </button>
        <button 
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'receive' ? 'bg-success text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-success/30 shadow-sm'}`}
          onClick={() => handleTabChange(activeTab === 'receive' ? 'view' : 'receive')}
        >
          <ArrowDownCircle size={14} /> <span>Receive</span>
        </button>
        <button 
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'return' ? 'bg-danger text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-danger/30 shadow-sm'}`}
          onClick={() => handleTabChange(activeTab === 'return' ? 'view' : 'return')}
        >
          <ArrowUpCircle size={14} /> <span>Return</span>
        </button>
        <button 
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'balance' ? 'bg-primary text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
          onClick={() => handleTabChange(activeTab === 'balance' ? 'view' : 'balance')}
        >
          <Wallet size={14} /> <span>Balance</span>
        </button>
      </div>

      {(activeTab === 'receive' || activeTab === 'return') && (
        <>
          <form onSubmit={handleAddItem} className="card mb-4" style={{ borderColor: activeTab === 'receive' ? 'var(--success-color)' : 'var(--danger-color)', borderLeftWidth: '4px' }}>
            <h3 className="text-md font-semibold mb-1">
              {activeTab === 'receive' ? 'Receive New Stock' : 'Return Unsold Stock'}
            </h3>
            <p className="text-secondary text-xs mb-4">
              {activeTab === 'receive' ? 'Adds to your current inventory and increases supplier balance.' : 'Removes from your current inventory and decreases supplier balance.'}
            </p>
            
            <div className="form-group mb-3">
              <label className="form-label">Bread Type</label>
              <select className="form-select" value={productId} onChange={e => setProductId(e.target.value)} required>
                <option value="">-- Choose Bread --</option>
                {activeProducts.map(p => {
                  // Show adjusted stock for returns
                  const pendingQty = activeTab === 'return' ? pendingItems.filter(i => i.productId === p.id).reduce((s, i) => s + i.quantityReceived, 0) : 0;
                  const availableStock = p.stock - pendingQty;
                  return (
                    <option key={p.id} value={p.id}>{p.name} (Available: {activeTab === 'return' ? availableStock : p.stock})</option>
                  );
                })}
              </select>
            </div>
            
            <div className="flex gap-4 mb-3">
              <div className="form-group flex-1">
                <label className="form-label">{t('inv.quantity')}</label>
                <input type="number" className="form-input" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t('inv.costPrice')} (₦)</label>
                <input type="number" className="form-input" min="1" value={costPrice} onChange={e => setCostPrice(e.target.value)} required />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Store Keeper (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Name of person supplying/receiving"
                value={storeKeeper} 
                onChange={e => setStoreKeeper(e.target.value)} 
              />
            </div>
            
            <button type="submit" className={`btn w-full btn-outline ${activeTab === 'return' ? 'text-danger border-danger' : 'text-success border-success'}`}>
              + Add to List
            </button>
          </form>

          {pendingItems.length > 0 && (
            <div className="card mb-6" style={{ background: 'var(--surface-color)' }}>
              <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
                <span>Pending List ({pendingItems.length} items)</span>
                <span className={`text-${activeTab === 'receive' ? 'success' : 'danger'}`}>
                  Total: ₦{pendingItems.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0).toLocaleString()}
                </span>
              </h3>
              
              <div className="flex flex-col gap-2 mb-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-[var(--background-color)] p-2 rounded text-sm relative overflow-hidden">
                    <div>
                      <div className="font-bold">{products.find(p => p.id === item.productId)?.name}</div>
                      <div className="text-xs text-secondary">{item.quantityReceived} units @ ₦{item.costPrice}</div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="font-bold">₦{(item.quantityReceived * item.costPrice).toLocaleString()}</div>
                      <button onClick={() => removeItem(item.id)} className="text-danger p-1 opacity-70 hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleConfirmBatch}
                disabled={isProcessing}
                className={`btn w-full ${activeTab === 'return' ? 'btn-danger' : 'btn-success'}`}
              >
                {isProcessing ? 'Processing...' : (activeTab === 'return' ? 'Confirm Return Batch' : 'Confirm Receive Batch')}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        <button 
          type="button"
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === 'All' ? 'bg-primary text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
          onClick={() => setSelectedCategory('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            type="button"
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredProducts.map(p => (
          <div key={p.id} className="card flex justify-between items-center" style={{ marginBottom: 0 }}>
            <div className="flex items-center gap-3">
              {p.image ? (
                <img src={p.image} style={{ width: '30px', height: '30px', objectFit: 'cover' }} className="rounded-full" alt="" />
              ) : (
                <div style={{ width: '30px', height: '30px' }} className="rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                </div>
              )}
              <div>
                <div className="font-bold">{p.name}</div>
                <div className={`text-xs mt-0.5 ${p.active ? 'text-success' : 'text-danger'}`}>
                  {p.active ? 'Active' : 'Inactive'} • <span className="text-secondary">{p.category || 'Standard'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary mb-1 uppercase tracking-wider font-bold">{t('inv.currentStock')}</div>
              <div className="text-2xl font-bold text-accent">{p.stock}</div>
            </div>
          </div>
        ))}
      </div>
      
      {activeTab === 'balance' && (
        <div className="mt-4">
          <div className="card border-t-4 border-primary">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <TrendingDown size={20} className="text-primary" /> Record Payment to Company
            </h2>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group mb-3">
                <label className="form-label text-xs">Amount Paid (₦) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 50000" 
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required 
                />
              </div>
              
              <div className="flex gap-3 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label text-xs">Method</label>
                  <select 
                    className="form-select" 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                  >
                    <option value="Cash">Cash (KudiHannu)</option>
                    <option value="Transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div className="form-group flex-1">
                  <label className="form-label text-xs">Receiver Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Who received it?" 
                    value={paymentReceiver}
                    onChange={e => setPaymentReceiver(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving & Generating Receipt...' : 'Record Payment & Print Receipt'}
              </button>
            </form>
          </div>
          
          <h2 className="text-lg font-bold mt-8 mb-4">Payment History</h2>
          <div className="flex flex-col gap-3">
            {bakeryPayments.length === 0 ? (
              <p className="text-center text-secondary py-4">No payments recorded yet.</p>
            ) : (
              [...bakeryPayments]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(payment => (
                <div key={payment.id} className="card flex justify-between items-center" style={{ marginBottom: 0, padding: '1rem' }}>
                  <div>
                    <div className="font-bold text-sm">Payment Sent {payment.method ? `(${payment.method})` : ''}</div>
                    <div className="text-xs text-secondary">
                      {new Date(payment.date).toLocaleString()}
                      {payment.receiver && ` • To: ${payment.receiver}`}
                    </div>
                  </div>
                  <div className="font-bold text-success">+₦{payment.amount.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'view' && sortedBatchIds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">{t('inv.history')}</h2>
          <div className="flex flex-col gap-3">
            {sortedBatchIds.slice(0, 20).map(batchId => {
              const batch = groupedLogs[batchId];
              const first = batch[0];
              const isReceive = first.type !== 'Return';
              const totalItems = batch.reduce((sum, item) => sum + item.quantityReceived, 0);
              const totalValue = batch.reduce((sum, item) => sum + (item.quantityReceived * item.costPrice), 0);
              
              return (
                <div 
                  key={batchId} 
                  className="card flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" 
                  style={{ marginBottom: 0, padding: '1rem', borderLeftWidth: '4px', borderColor: isReceive ? 'var(--success-color)' : 'var(--danger-color)' }}
                  onClick={() => navigate(`/inventory/receipt/${batchId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isReceive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {isReceive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{isReceive ? 'Received Stock' : 'Returned Stock'}</div>
                      <div className="text-xs text-secondary">
                        {new Date(first.date).toLocaleString()}
                        {first.storeKeeper && ` • Keeper: ${first.storeKeeper}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-bold">₦{totalValue.toLocaleString()}</div>
                      <div className="text-xs text-secondary">{totalItems} items</div>
                    </div>
                    <FileText size={18} className="text-secondary opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>
    </AnimatedPage>
  );
};

export default Inventory;
