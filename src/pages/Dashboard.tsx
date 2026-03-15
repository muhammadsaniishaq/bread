import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DashboardChart } from '../components/DashboardChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { TrendingUp, Wallet, Package, Users, PlusCircle, UserPlus, Activity, AlertTriangle, Clock, Search, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions, products, customers, expenses } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = transactions.filter(t => t.date.startsWith(today));
    
    let totalSales = 0;
    let totalCash = 0;
    let breadSold = 0;
    const breadSoldMap: Record<string, number> = {};
    
    todaysTransactions.forEach(t => {
      totalSales += t.totalPrice;
      const items = getTransactionItems(t);
      items.forEach(item => {
        breadSold += item.quantity;
        breadSoldMap[item.productId] = (breadSoldMap[item.productId] || 0) + item.quantity;
      });
      if (t.type === 'Cash') {
        totalCash += t.totalPrice;
      }
    });
    
    const todaysExpenses = expenses.filter(e => e.date.startsWith(today));
    const totalExpenses = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const profit = totalSales * 0.1; // 10% gross profit
    const netProfit = profit - totalExpenses;
    
    const outstandingDebt = customers.reduce((sum, c) => sum + c.debtBalance, 0);
    const stockRemaining = products.reduce((sum, p) => sum + p.stock, 0);
    
    return {
      totalSales,
      totalCash,
      breadSold,
      profit,
      netProfit,
      totalExpenses,
      outstandingDebt,
      stockRemaining,
      breadSoldMap,
      lowStockProducts: products.filter(p => p.stock > 0 && p.stock < 20),
      recentActivity: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [transactions, products, customers, expenses]);

  const greetingObj = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('dash.goodMorning') + ' ☀️', gradient: 'from-orange-400 to-rose-400' };
    if (hour < 17) return { text: t('dash.goodAfternoon') + ' 🌤️', gradient: 'from-blue-400 to-indigo-500' };
    return { text: t('dash.goodEvening') + ' 🌙', gradient: 'from-indigo-900 to-purple-800 dark:from-indigo-400 dark:to-purple-400' };
  }, [t]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    ).slice(0, 3);
    
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 3);
    
    return { customers: matchedCustomers, products: matchedProducts };
  }, [searchQuery, customers, products]);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';

  const aisInsight = useMemo(() => {
    if (metrics.totalSales === 0) return t('dash.insightPlaceholder');
    
    let topProduct = '';
    let maxSold = 0;
    Object.entries(metrics.breadSoldMap).forEach(([id, count]) => {
      if (count > maxSold) {
        maxSold = count;
        topProduct = products.find(p => p.id === id)?.name || 'Product';
      }
    });

    if (maxSold > 0) {
      if (metrics.stockRemaining < 50) {
        return `${t('dash.lowStockMsg')} (${metrics.stockRemaining}). ${topProduct} (x${maxSold})`;
      }
      return `${topProduct} (x${maxSold}). ${t('dash.insightPlaceholder')}`;
    }
    
    return t('dash.insightPlaceholder');
  }, [metrics, products, t]);

  return (
    <AnimatedPage>
      <div className="container pb-20">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${greetingObj.gradient}`}>
              {greetingObj.text}
            </h1>
            <p className="text-secondary text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="relative mb-6 z-10">
          <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-full px-4 py-3 focus-within:border-primary focus-within:ring-2 ring-primary/20 transition-all shadow-sm">
            <Search size={18} className="text-secondary mr-2" />
            <input 
              type="text" 
              placeholder="Search customers, products..." 
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary ml-2">
                <X size={16} />
              </button>
            )}
          </div>
          
          {searchResults && (searchResults.customers.length > 0 || searchResults.products.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
              {searchResults.customers.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-4 py-2 bg-black/5 dark:bg-white/5">{t('nav.customers')}</div>
                  {searchResults.customers.map(c => (
                     <div key={c.id} onClick={() => navigate(`/customer/${c.id}`)} className="px-4 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[var(--border-color)] last:border-none">
                       <div>
                         <div className="font-bold text-sm tracking-tight">{c.name}</div>
                         <div className="text-xs text-secondary mt-0.5">{c.phone || 'No phone'}</div>
                       </div>
                       <div className="text-xs font-bold font-mono">
                         {c.debtBalance > 0 ? <span className="text-danger flex items-center gap-1"><AlertTriangle size={12}/> Owes ₦{c.debtBalance.toLocaleString()}</span> : <span className="text-success">Clean</span>}
                       </div>
                     </div>
                  ))}
                </div>
              )}
              {searchResults.products.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-4 py-2 bg-black/5 dark:bg-white/5">Products</div>
                  {searchResults.products.map(p => (
                     <div key={p.id} onClick={() => navigate('/inventory')} className="px-4 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[var(--border-color)] last:border-none">
                       <div className="flex items-center gap-3">
                         {p.image ? (
                           <img src={p.image} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm">
                             {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                           </div>
                         )}
                         <div>
                           <div className="font-bold text-sm tracking-tight">{p.name}</div>
                           <div className="text-xs text-secondary mt-0.5">{p.category || 'Standard'} • ₦{p.price}</div>
                         </div>
                       </div>
                       <div className={`text-xs font-bold uppercase tracking-wider ${p.stock > 0 ? 'text-success' : 'text-danger'}`}>
                         {p.stock} in stock
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-print" style={{ scrollbarWidth: 'none' }}>
          <button 
            onClick={() => navigate('/sales')}
            className="btn btn-primary flex-none flex items-center gap-2" 
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}
          >
            <PlusCircle size={18} /> {t('dash.newSale')}
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="btn btn-outline flex-none flex items-center gap-2" 
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}
          >
            <UserPlus size={18} /> {t('dash.addCustomer')}
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="btn btn-outline flex-none flex items-center gap-2" 
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}
          >
            <Activity size={18} /> {t('dash.reports')}
          </button>
        </div>

        {metrics.lowStockProducts.length > 0 && (
          <div className="card mb-6 flex flex-col gap-2 relative overflow-hidden" style={{ background: 'rgba(var(--danger-rgb), 0.05)', borderColor: 'var(--danger-color)' }}>
            <h3 className="font-bold text-danger flex items-center gap-2">
              <AlertTriangle size={18} /> {t('dash.stockAlert')}
            </h3>
            {metrics.lowStockProducts.map(p => (
              <div key={p.id} className="flex justify-between text-sm opacity-90">
                <span>{p.name}</span>
                <span className="font-bold text-danger">{p.stock} units left</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="card p-4 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-primary/20 backdrop-blur-xl">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"></div>
               <span className="text-xs font-bold uppercase tracking-widest text-primary">{t('dash.smartInsights')}</span>
             </div>
             <p className="text-sm font-medium leading-relaxed opacity-90">{aisInsight}</p>
          </div>

          <div className={`card text-white relative overflow-hidden p-6 ${metrics.netProfit >= 0 ? 'bg-gradient-to-br from-primary to-indigo-600 shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)]' : 'bg-gradient-to-br from-danger to-rose-700 shadow-[0_8px_30px_rgba(var(--danger-rgb),0.3)]'}`} style={{ border: 'none' }}>
            <TrendingUp size={100} className="absolute right-0 bottom-0 opacity-[0.05]" style={{ transform: 'translate(10%, 10%)' }} />
            <div className="text-sm opacity-80 flex items-center gap-2 mb-1">
              <Wallet size={16} /> {t('dash.estimatedProfit')}
            </div>
            <div className="text-3xl font-bold mt-1 tracking-tight">₦{metrics.netProfit.toLocaleString()}</div>
            {metrics.totalExpenses > 0 && (
               <div className="text-xs opacity-70 mt-3 pt-3 flex justify-between uppercase tracking-wider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                 <span>Gross ₦{metrics.profit.toLocaleString()}</span>
                 <span>Exp ₦{metrics.totalExpenses.toLocaleString()}</span>
               </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card relative overflow-hidden">
              <div className="w-8 h-8 flex items-center justify-center mb-1 text-success">
                <Wallet size={18} />
              </div>
              <div className="text-xs text-secondary font-medium">{t('dash.cashGenerated')}</div>
              <div className="text-lg font-bold mt-0.5">₦{metrics.totalCash.toLocaleString()}</div>
            </div>
            
            <div className="card relative overflow-hidden">
              <div className="w-8 h-8 flex items-center justify-center mb-1 text-primary">
                <TrendingUp size={18} />
              </div>
              <div className="text-xs text-secondary font-medium">{t('dash.totalValue')}</div>
              <div className="text-lg font-bold mt-0.5">₦{metrics.totalSales.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs text-secondary font-medium border-b pb-2 mb-2" style={{ borderColor: 'var(--border-color)' }}>
                <Package size={14} /> {t('dash.breadSold')}
              </div>
              <div className="text-lg font-bold mb-2">{metrics.breadSold} units</div>
              <div className="flex flex-col gap-1 text-xs">
                {products.map(p => {
                  const sold = metrics.breadSoldMap[p.id] || 0;
                  if (sold === 0) return null;
                  return (
                    <div key={p.id} className="flex justify-between items-center py-0.5 opacity-90">
                      <span className="truncate mr-2">{p.name}</span>
                      <span className="font-bold text-accent">{sold}</span>
                    </div>
                  );
                })}
                {metrics.breadSold === 0 && <span className="opacity-50 italic">No sales yet</span>}
              </div>
            </div>
            
            <div className="card relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs text-secondary font-medium border-b pb-2 mb-2" style={{ borderColor: 'var(--border-color)' }}>
                <Package size={14} /> {t('dash.stockAvailable')}
              </div>
              <div className="text-lg font-bold mb-2">{metrics.stockRemaining} units</div>
              <div className="flex flex-col gap-1 text-xs">
                {products.filter(p => p.active).map(p => (
                  <div key={p.id} className="flex justify-between items-center py-0.5 opacity-90">
                    <span className="truncate mr-2">{p.name}</span>
                    <span className="font-bold" style={{ color: p.stock < 20 ? 'var(--danger-color)' : 'inherit' }}>{p.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card border-danger relative overflow-hidden">
             <div className="w-8 h-8 flex items-center justify-center mb-1 text-danger">
              <Users size={18} />
            </div>
            <div className="text-xs text-secondary font-medium">{t('dash.outstandingDebt')}</div>
            <div className="text-lg font-bold text-danger mt-0.5">₦{metrics.outstandingDebt.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-8 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h2 className="text-lg font-bold">{t('dash.recentActivity')}</h2>
        </div>
        
        <div className="flex flex-col gap-2 mb-8">
          {metrics.recentActivity.length === 0 ? (
            <p className="text-sm text-secondary text-center py-4">No recent transactions.</p>
          ) : (
            metrics.recentActivity.map(tx => (
              <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} className="card p-3 flex justify-between items-center" style={{ marginBottom: 0, cursor: 'pointer', padding: '1rem' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 dark:bg-zinc-800 text-primary">
                    {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">{getCustomerName(tx.customerId)}</div>
                    <div className="text-xs text-secondary">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm tracking-tight">₦{tx.totalPrice.toLocaleString()}</div>
                  <div className={`text-[10px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded inline-block ${tx.type === 'Cash' ? 'bg-[rgba(var(--success-rgb),0.1)] text-success' : 'bg-[rgba(var(--danger-rgb),0.1)] text-danger'}`}>
                    {tx.type}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DashboardChart />
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;
