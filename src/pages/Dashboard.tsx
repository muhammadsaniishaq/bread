import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DashboardChart } from '../components/DashboardChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { TrendingUp, TrendingDown, Package, PlusCircle, UserPlus, Activity, AlertTriangle, Clock, Search, X, Crosshair, ArrowUpRight, ArrowDownRight, PackagePlus } from 'lucide-react';

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
    
    // 10/90 Business Model
    const ourShare = totalSales * 0.1; 
    const bakeryOwed = totalSales * 0.9;
    const netProfit = ourShare - totalExpenses;
    
    const outstandingDebt = customers.reduce((sum, c) => sum + c.debtBalance, 0);
    const stockRemaining = products.filter(p => p.active).reduce((sum, p) => sum + p.stock, 0);
    
    // Sort bread sold map by highest quantity
    const topProducts = Object.entries(breadSoldMap)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        return {
          id,
          name: product?.name || 'Unknown',
          image: product?.image,
          price: product?.price || 0,
          qty
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
    
    const dailyGoal = 500000;

    return {
      totalSales,
      totalCash,
      breadSold,
      ourShare,
      bakeryOwed,
      netProfit,
      totalExpenses,
      outstandingDebt,
      stockRemaining,
      topProducts,
      dailyGoal,
      goalProgress: Math.min(100, Math.round((totalSales / dailyGoal) * 100)),
      lowStockProducts: products.filter(p => p.active && p.stock > 0 && p.stock < 20),
      recentActivity: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [transactions, products, customers, expenses]);

  const greetingObj = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('dash.goodMorning') + ' ☀️' };
    if (hour < 17) return { text: t('dash.goodAfternoon') + ' 🌤️' };
    return { text: t('dash.goodEvening') + ' 🌙' };
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

  return (
    <AnimatedPage>
      <div className="container pb-20 pt-4 px-4 overflow-x-hidden">
        {/* Header & Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">
            {greetingObj.text}
          </h1>
          <p className="text-secondary text-sm mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6 z-40">
          <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg px-3 py-2">
            <Search size={16} className="text-secondary mr-2" />
            <input 
              type="text" 
              placeholder={t('rep.search')}
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary ml-2">
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Dropdown Results */}
          {searchResults && (searchResults.customers.length > 0 || searchResults.products.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg shadow-md overflow-hidden z-50">
              {searchResults.customers.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-secondary uppercase px-4 py-2 bg-black/5 dark:bg-white/5">{t('nav.customers')}</div>
                  {searchResults.customers.map(c => (
                     <div key={c.id} onClick={() => navigate(`/customer/${c.id}`)} className="px-4 py-2 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[var(--border-color)]">
                       <div>
                         <div className="font-bold text-sm tracking-tight">{c.name}</div>
                         <div className="text-xs text-secondary mt-0.5">{c.phone || 'No phone'}</div>
                       </div>
                       <div className="text-xs font-bold">
                         {c.debtBalance > 0 ? <span className="text-danger flex items-center gap-1"><AlertTriangle size={12}/> Owes ₦{c.debtBalance.toLocaleString()}</span> : <span className="text-success">Clean</span>}
                       </div>
                     </div>
                  ))}
                </div>
              )}
              {searchResults.products.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-secondary uppercase px-4 py-2 bg-black/5 dark:bg-white/5">{t('nav.inventory')}</div>
                  {searchResults.products.map(p => (
                     <div key={p.id} onClick={() => navigate('/inventory')} className="px-4 py-2 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer border-b border-[var(--border-color)] last:border-b-0">
                       <div className="flex items-center gap-3">
                         {p.image ? (
                           <img src={p.image} className="w-8 h-8 rounded-full object-cover" alt="" />
                         ) : (
                           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                             {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                           </div>
                         )}
                         <div>
                           <div className="font-bold text-sm tracking-tight">{p.name}</div>
                           <div className="text-xs text-secondary mt-0.5">{p.category || 'Standard'} • ₦{p.price}</div>
                         </div>
                       </div>
                       <div className={`text-xs font-bold ${p.stock > 0 ? 'text-success' : 'text-danger'}`}>
                         {p.stock} left
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Net Profit Card with 10/90 Integration */}
        <div className={`rounded-xl p-5 mb-6 text-white ${metrics.netProfit >= 0 ? 'bg-primary' : 'bg-danger'}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              {metrics.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-bold uppercase">{t('dash.netProfit')}</span>
            </div>
          </div>
          
          <div className="text-3xl font-bold mb-4">
            ₦{metrics.netProfit.toLocaleString()}
          </div>
          
          <div className="pt-4 border-t border-white/20">
            <div className="flex justify-between items-end mb-2">
              <div className="text-xs font-bold">Daily Sales</div>
              <div className="font-bold text-sm">₦{metrics.totalSales.toLocaleString()}</div>
            </div>
            
            <div className="h-2 w-full bg-black/20 rounded overflow-hidden flex">
              <div className="h-full bg-white" style={{ width: '10%' }} />
              <div className="h-full bg-black/40" style={{ width: '90%' }} />
            </div>
            
            <div className="flex justify-between mt-2 text-xs">
              <div>
                <div className="font-bold">{t('dash.ourShare')}</div>
                <div className="opacity-90">₦{metrics.ourShare.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{t('dash.bakeryShare')}</div>
                <div className="opacity-90">₦{metrics.bakeryOwed.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Tracker */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-secondary">
              <Crosshair size={16} />
              <span className="text-sm font-bold">{t('dash.dailyGoal')}</span>
            </div>
            <span className="text-xs font-bold text-success">
              {metrics.goalProgress}%
            </span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <div className="text-lg font-bold">₦{metrics.totalSales.toLocaleString()}</div>
            <div className="text-xs text-secondary">/ ₦{metrics.dailyGoal.toLocaleString()} {t('dash.dailyGoalProgress')}</div>
          </div>
          <div className="h-2 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-success" 
              style={{ width: `${metrics.goalProgress}%` }} 
            />
          </div>
        </div>

        {/* Smart Insights Notice */}
        {metrics.lowStockProducts.length > 0 && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-6 flex gap-3 items-center text-danger">
             <AlertTriangle size={18} />
             <div>
               <div className="font-bold text-sm">{t('dash.stockAlert')}</div>
               <div className="text-xs">{t('dash.lowStockMsg')}: {metrics.lowStockProducts.map(p => p.name).join(', ')}</div>
             </div>
          </div>
        )}

        {/* Quick Actions Base layout */}
        <div className="grid grid-cols-4 gap-2 mb-6 no-print">
          <button onClick={() => navigate('/sales')} className="flex flex-col items-center gap-1 p-2 bg-primary/10 text-primary rounded-lg border-none hover:bg-primary/20">
            <PlusCircle size={20} />
            <span className="text-[10px] font-bold">{t('dash.newSale')}</span>
          </button>
          <button onClick={() => navigate('/inventory')} className="flex flex-col items-center gap-1 p-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <PackagePlus size={20} className="text-accent" />
            <span className="text-[10px] font-bold">{t('dash.receiveBread')}</span>
          </button>
          <button onClick={() => navigate('/customers')} className="flex flex-col items-center gap-1 p-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <UserPlus size={20} className="text-success" />
            <span className="text-[10px] font-bold">{t('dash.addCustomer')}</span>
          </button>
          <button onClick={() => navigate('/reports')} className="flex flex-col items-center gap-1 p-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <Activity size={20} className="text-primary" />
            <span className="text-[10px] font-bold">{t('dash.reports')}</span>
          </button>
        </div>

        {/* Today's Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-3 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
               <ArrowDownRight size={16} />
             </div>
             <div>
               <div className="text-[10px] text-secondary font-bold uppercase">{t('dash.cashGenerated')}</div>
               <div className="text-lg font-bold">₦{metrics.totalCash.toLocaleString()}</div>
             </div>
           </div>
           
           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-3 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger">
               <ArrowUpRight size={16} />
             </div>
             <div>
               <div className="text-[10px] text-secondary font-bold uppercase">Expenses</div>
               <div className="text-lg font-bold">₦{metrics.totalExpenses.toLocaleString()}</div>
             </div>
           </div>

           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-3 col-span-2">
             <div className="flex items-center gap-2 mb-2 text-sm font-bold text-primary">
               <Package size={16} /> {t('dash.breadSold')} ({metrics.breadSold} units)
             </div>
             <div className="flex flex-col gap-1">
               {metrics.topProducts.map(p => (
                 <div key={p.id} className="flex justify-between items-center text-sm">
                    <div className="text-secondary">{p.name}</div>
                    <div className="font-bold">x{p.qty}</div>
                 </div>
               ))}
               {metrics.topProducts.length === 0 && <div className="text-sm text-secondary">No products sold</div>}
             </div>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              {t('dash.recentActivity')}
            </h2>
            <button onClick={() => navigate('/reports')} className="text-xs text-primary font-bold">
              View All
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {metrics.recentActivity.length === 0 ? (
               <div className="text-center p-4 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-secondary text-sm">
                 {t('dash.noSalesYet')}
               </div>
            ) : (
              metrics.recentActivity.map(tx => (
                <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center font-bold text-primary">
                      {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{getCustomerName(tx.customerId)}</div>
                      <div className="text-xs text-secondary">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-bold text-sm">₦{tx.totalPrice.toLocaleString()}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${tx.type === 'Cash' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {tx.type}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Chart integrated smoothly */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 mb-6">
          <DashboardChart />
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;
