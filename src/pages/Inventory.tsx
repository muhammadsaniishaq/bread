import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import type { InventoryLog } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';

import { Trash2, FileText, TrendingDown, TrendingUp } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, companyMetrics, processInventoryBatch, inventoryLogs } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'view' | 'receive' | 'return'>('view');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pendingItems, setPendingItems] = useState<InventoryLog[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleTabChange = (tab: 'view' | 'receive' | 'return') => {
    setActiveTab(tab);
    setPendingItems([]);
    setProductId('');
    setQuantity('');
    setCostPrice('');
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
      costPrice: cost
    };
    
    setPendingItems([...pendingItems, log]);
    setProductId(''); setQuantity(''); setCostPrice('');
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
    
    await processInventoryBatch(itemsWithBatch, activeTab as 'Receive' | 'Return');
    
    setPendingItems([]);
    setIsProcessing(false);
    navigate(`/inventory/receipt/${batchId}`);
  };

  const remainingBalance = companyMetrics.totalValueReceived - companyMetrics.totalMoneyPaid;

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
      
      <div className="card text-center mb-6">
        <h2 className="text-sm text-secondary">Supplier Balance</h2>
        {remainingBalance <= 0 ? (
          <div className="text-2xl font-bold text-success mt-1">No outstanding balance</div>
        ) : (
          <div className="text-3xl font-bold text-danger mt-1">₦{remainingBalance.toLocaleString()}</div>
        )}
        <div className="flex justify-between mt-4 text-sm text-secondary">
          <span>Total Received: ₦{companyMetrics.totalValueReceived.toLocaleString()}</span>
          <span>Total Paid: ₦{companyMetrics.totalMoneyPaid.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-print">
        <button 
          className={`btn flex-none ${activeTab === 'view' ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
          onClick={() => handleTabChange('view')}
        >
          Overview
        </button>
        <button 
          className={`btn flex-none ${activeTab === 'receive' ? 'btn-success' : 'btn-outline'}`}
          style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
          onClick={() => handleTabChange(activeTab === 'receive' ? 'view' : 'receive')}
        >
          + {t('inv.receive')}
        </button>
        <button 
          className={`btn flex-none ${activeTab === 'return' ? 'btn-danger' : 'btn-outline'}`}
          style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
          onClick={() => handleTabChange(activeTab === 'return' ? 'view' : 'return')}
        >
          - {t('inv.return')}
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
                <img src={p.image} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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
                      <div className="text-xs text-secondary">{new Date(first.date).toLocaleString()}</div>
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
