import React, { useMemo, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { FileBarChart, ArrowLeft, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const ManagerReports: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useAppContext();
  
  const [filter, setFilter] = useState<'All' | 'Today' | 'Week'>('All');

  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (filter === 'Today') return d.toDateString() === now.toDateString();
      if (filter === 'Week') return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  const totalRevenue = filteredTx.reduce((sum, tx) => sum + tx.totalPrice, 0);
  const totalItemsSold = filteredTx.reduce((sum, tx) => sum + (tx.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="text-indigo-500" /> Executive Report
          </h1>
        </div>

        <div className="bg-surface p-2 rounded-xl border border-[var(--border-color)] mb-6 shadow-sm flex gap-2">
          {['All', 'Today', 'Week'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f as any)} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${filter === f ? 'bg-indigo-500 text-white shadow-sm' : 'hover:bg-black/5'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h3 className="text-[10px] uppercase font-bold tracking-wide opacity-70 mb-1 flex items-center gap-1"><DollarSign size={12}/> Revenue</h3>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₦{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h3 className="text-[10px] uppercase font-bold tracking-wide opacity-70 mb-1 flex items-center gap-1"><TrendingUp size={12}/> Units Sold</h3>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalItemsSold.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5">
            <h2 className="text-sm font-bold uppercase tracking-wide opacity-80 flex items-center gap-2">
               <Calendar size={16}/> Filtered Transactions
            </h2>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {filteredTx.length === 0 ? (
              <div className="p-8 text-center text-secondary text-sm font-medium opacity-70">No data found for this period.</div>
            ) : (
              filteredTx.map(tx => (
                <div key={tx.id} className="p-4 border-b border-[var(--border-color)] flex justify-between items-center hover:bg-black/5 transition-colors">
                  <div>
                    <div className="font-bold text-sm">{tx.type} Sale</div>
                    <div className="text-[10px] font-medium opacity-60 mt-1">{new Date(tx.date).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary">₦{tx.totalPrice.toLocaleString()}</div>
                    <div className="text-[10px] font-bold opacity-60 mt-0.5">{(tx.items || []).length} Products</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerReports;
