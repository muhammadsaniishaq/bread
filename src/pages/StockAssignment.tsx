import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Package, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const StockAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { products, processInventoryBatch } = useAppContext();
  
  const activeProducts = products.filter(p => p.active);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (id: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setQuantities(prev => ({ ...prev, [id]: num }));
  };

  const handleAssignStock = async () => {
    const logs = activeProducts
      .filter(p => quantities[p.id] > 0)
      .map(p => ({
        id: Date.now().toString() + Math.random(),
        productId: p.id,
        quantityReceived: quantities[p.id],
        costPrice: p.price,
        type: 'Receive' as const,
        date: new Date().toISOString(),
        note: 'Manager Daily Stock Assignment'
      }));

    if (logs.length === 0) return alert('Please enter quantities for at least one item.');

    setIsSubmitting(true);
    await processInventoryBatch(logs, 'Receive');
    setIsSubmitting(false);
    alert('Stock successfully assigned to the storefront!');
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
        
        <div className="card mt-4 p-5 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-3">
            <h2 className="font-bold text-lg text-primary">Daily Bakery Distribution</h2>
          </div>
          <p className="text-sm opacity-70 mb-5 font-medium">Enter the quantity of freshly baked goods to handover to the Store Keeper array.</p>

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
                    onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            className="btn bg-primary text-white w-full rounded-2xl shadow-md flex justify-center items-center gap-2"
            onClick={handleAssignStock}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : <><ShieldCheck size={20} /> Authorize Stock Transfer</>}
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StockAssignment;
