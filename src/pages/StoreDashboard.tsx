import React, { useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Users, FileText, ArrowRight, Clock, Activity, LogOut } from 'lucide-react';

export const StoreDashboard: React.FC = () => {
  const { products, transactions, customers } = useAppContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const activeProducts = products.filter(p => p.active);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = transactions.filter(t => t.date.startsWith(today));
    
    let totalSales = 0;
    let totalCash = 0;
    let totalDebtSales = 0;
    
    todaysTransactions.forEach(t => {
      totalSales += t.totalPrice;
      if (t.type === 'Cash') totalCash += t.totalPrice;
      else totalDebtSales += t.totalPrice;
    });
    
    const stockRemaining = products.reduce((sum, p) => sum + p.stock, 0);
    
    return {
      totalSales, totalCash, totalDebtSales,
      stockRemaining,
      recentActivity: todaysTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [transactions, products]);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';

  return (
    <AnimatedPage>
      <div className="container pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Package className="text-blue-500" /> Storefront
            </h1>
            <p className="text-sm font-medium opacity-60">Manage your daily dispatch operations.</p>
          </div>
          <button 
            className="w-10 h-10 rounded-full bg-surface shadow-sm border border-[var(--border-color)] text-secondary flex items-center justify-center hover:bg-danger hover:text-white transition-all"
            onClick={signOut}
            title="Log Out"
          >
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Action Center - Big Prominent Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => navigate('/sales')}
            className="bg-blue-500 text-white p-4 rounded-3xl shadow-md shadow-blue-500/20 text-left flex flex-col justify-between h-32 hover:-translate-y-1 transition-all"
          >
            <ShoppingCart size={28} className="opacity-80" />
            <div>
              <div className="font-bold text-lg leading-tight">Dispense<br/>Stock</div>
              <div className="text-[10px] font-medium opacity-80 mt-1">Open Executive POS</div>
            </div>
          </button>
          
          <div className="grid grid-rows-2 gap-3">
             <button 
               onClick={() => navigate('/customers')}
               className="bg-surface border border-[var(--border-color)] p-3 rounded-[20px] shadow-sm text-left flex items-center gap-3 hover:-translate-y-0.5 transition-all"
             >
               <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center"><Users size={18}/></div>
               <div>
                 <div className="font-bold text-sm">Suppliers File</div>
                 <div className="text-[10px] font-medium opacity-60">Debts & Payments</div>
               </div>
             </button>
             <button 
               onClick={() => navigate('/inventory')}
               className="bg-surface border border-[var(--border-color)] p-3 rounded-[20px] shadow-sm text-left flex items-center gap-3 hover:-translate-y-0.5 transition-all"
             >
               <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><FileText size={18}/></div>
               <div>
                 <div className="font-bold text-sm">Inv. Records</div>
                 <div className="text-[10px] font-medium opacity-60">Batch histories</div>
               </div>
             </button>
          </div>
        </div>

        {/* Current Available Stock Grid */}
        <div className="bg-surface p-5 rounded-3xl shadow-sm border border-[var(--border-color)] mb-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-3">
            <h2 className="font-bold text-sm uppercase tracking-wider text-blue-500 flex items-center gap-2">
              <Package size={16} /> Live Available Stock
            </h2>
            <div className="font-black text-lg bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg">
              {metrics.stockRemaining} <span className="text-xs font-bold">units</span>
            </div>
          </div>
          
          <div className="grid gap-2">
            {activeProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-[var(--border-color)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-xs">
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{p.name}</span>
                </div>
                <div className={`font-black text-lg ${p.stock < 20 ? 'text-danger' : 'text-success'}`}>
                  {p.stock}
                </div>
              </div>
            ))}
            {activeProducts.length === 0 && (
              <div className="text-center py-4 text-xs font-medium opacity-50 border border-dashed rounded-xl">
                No active products in storefront.
              </div>
            )}
          </div>
        </div>

        {/* Today's Transactions Summary */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <div className="flex items-center gap-2">
            <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><Clock size={16} /></div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Today's Dispatch Activity</h2>
          </div>
          <button onClick={() => navigate('/sales')} className="text-blue-500 text-xs font-bold flex items-center gap-1 hover:underline">
            View POS <ArrowRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          {metrics.recentActivity.length === 0 ? (
            <div className="bg-surface p-6 rounded-2xl border border-[var(--border-color)] border-dashed text-center">
              <Activity size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs font-bold opacity-50">No dispatches made today yet.</p>
            </div>
          ) : (
            metrics.recentActivity.map((tx) => (
              <div key={tx.id} className="bg-surface p-3 rounded-2xl border border-[var(--border-color)] shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background border border-[var(--border-color)] flex items-center justify-center font-bold text-blue-500">
                    {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">{getCustomerName(tx.customerId)}</div>
                    <div className="text-[10px] font-medium opacity-60">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">₦{tx.totalPrice.toLocaleString()}</div>
                  <div className={`text-[9px] font-black uppercase inline-block px-1.5 py-0.5 rounded mt-1 bg-${tx.type === 'Cash' ? 'success' : 'danger'}/10 text-${tx.type === 'Cash' ? 'success' : 'danger'}`}>
                    {tx.type}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </AnimatedPage>
  );
};

export default StoreDashboard;
