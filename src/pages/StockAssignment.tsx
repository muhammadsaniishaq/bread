import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Package, ArrowLeft, ShieldCheck, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const StockAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch } = useAppContext();
  
  const activeProducts = products.filter(p => p.active);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'Receive' | 'Return'>('Receive');

  const handleAssignStock = async () => {
    if (mode === 'Return') {
      for (const p of activeProducts) {
        if ((quantities[p.id] || 0) > p.stock) {
          return alert(`Cannot return more ${p.name} than currently in storefront stock (${p.stock}).`);
        }
      }
    }

    const logs = activeProducts
      .filter(p => quantities[p.id] > 0)
      .map(p => ({
        id: Date.now().toString() + Math.random(),
        productId: p.id,
        quantityReceived: quantities[p.id],
        costPrice: p.price,
        type: mode,
        date: new Date().toISOString(),
        note: mode === 'Receive' ? 'Manager Daily Stock Assignment' : 'Manager Unsold Stock Return'
      }));

    if (logs.length === 0) return alert('Please enter quantities for at least one item.');

    setIsSubmitting(true);
    await processInventoryBatch(logs, mode);
    setIsSubmitting(false);
    alert(mode === 'Receive' ? 'Stock successfully assigned to the storefront!' : 'Unsold stock successfully returned from storefront!');
    setQuantities({});
  };

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary" /> Assign Stock
          </h1>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button 
            className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'Receive' ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-surface border border-[var(--border-color)] text-secondary shadow-sm hover:bg-black/5'}`}
            onClick={() => setMode('Receive')}
          >
            <ArrowDownCircle size={18} /> Assign New Stock
          </button>
          <button 
             className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'Return' ? 'bg-danger text-white shadow-md shadow-danger/20' : 'bg-surface border border-[var(--border-color)] text-secondary shadow-sm hover:bg-black/5'}`}
             onClick={() => setMode('Return')}
          >
            <ArrowUpCircle size={18} /> Return Unsold Stock
          </button>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] mt-4">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-3">
            <h2 className={`font-bold text-lg ${mode === 'Receive' ? 'text-success' : 'text-danger'}`}>
              {mode === 'Receive' ? 'Daily Bakery Distribution' : 'Process Unsold Returns'}
            </h2>
          </div>
          <p className="text-sm opacity-70 mb-5 font-medium">
            {mode === 'Receive' 
               ? 'Enter the quantity of freshly baked goods to handover to the Storefront.' 
               : 'Enter the quantity of unsold goods being returned by the Storefront.'}
          </p>

          <div className="grid gap-3 mb-6">
            {activeProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold tracking-tight text-[15px]">{p.name}</div>
                    <div className="text-[10px] text-secondary font-bold bg-black/10 dark:bg-white/10 px-2 py-0.5 mt-1 inline-block rounded-md">Current Storefront Stock: {p.stock}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-50">+</span>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input text-center font-bold py-1.5 px-2 w-20 bg-background"
                    placeholder="0"
                    value={quantities[p.id] || ''}
                    onChange={(e) => setQuantities(prev => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            className={`btn ${mode === 'Receive' ? 'bg-success' : 'bg-danger'} text-white w-full rounded-2xl shadow-md flex justify-center items-center gap-2`}
            onClick={handleAssignStock}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : <><ShieldCheck size={20} /> {mode === 'Receive' ? 'Authorize Stock Transfer' : 'Authorize Return Batch'}</>}
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StockAssignment;
