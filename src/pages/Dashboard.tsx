import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DashboardChart } from '../components/DashboardChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { TrendingUp, TrendingDown, Wallet, Package, PlusCircle, UserPlus, Activity, AlertTriangle, Clock, Search, X, Crosshair, ArrowUpRight, ArrowDownRight, PackagePlus, Receipt, ChevronRight } from 'lucide-react';

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
    
    const dailyGoal = 500000; // Easily configurable later

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
    if (hour < 12) return { text: t('dash.goodMorning') + ' ☀️', gradient: 'from-[#f59e0b] to-[#ef4444]' };
    if (hour < 17) return { text: t('dash.goodAfternoon') + ' 🌤️', gradient: 'from-[#3b82f6] to-[#8b5cf6]' };
    return { text: t('dash.goodEvening') + ' 🌙', gradient: 'from-[#4f46e5] to-[#c026d3]' };
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
          <h1 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${greetingObj.gradient}`}>
            {greetingObj.text}
          </h1>
          <p className="text-secondary text-xs uppercase tracking-wider font-bold mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-6 z-40">
          <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[16px] px-4 py-3.5 focus-within:border-primary focus-within:ring-4 ring-primary/10 transition-all shadow-sm">
            <Search size={18} className="text-secondary mr-3" />
            <input 
              type="text" 
              placeholder={t('rep.search')}
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary p-1 bg-black/5 dark:bg-white/5 rounded-full ml-2">
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Dropdown Results */}
          {searchResults && (searchResults.customers.length > 0 || searchResults.products.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] shadow-2xl overflow-hidden animate-fade-in z-50 divide-y divide-[var(--border-color)]">
              {searchResults.customers.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-4 py-2 bg-black/5 dark:bg-white/5">{t('nav.customers')}</div>
                  {searchResults.customers.map(c => (
                     <div key={c.id} onClick={() => navigate(`/customer/${c.id}`)} className="px-4 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
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
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-4 py-2 bg-black/5 dark:bg-white/5">{t('nav.inventory')}</div>
                  {searchResults.products.map(p => (
                     <div key={p.id} onClick={() => navigate('/inventory')} className="px-4 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
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
                         {p.stock} left
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premium Net Profit Card (Glassmorphism + 10/90 Integration) */}
        <div className={`relative overflow-hidden rounded-[24px] p-6 mb-6 text-white ${metrics.netProfit >= 0 ? 'bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] shadow-[0_12px_30px_rgba(79,70,229,0.3)]' : 'bg-gradient-to-br from-[#dc2626] to-[#991b1b] shadow-[0_12px_30px_rgba(220,38,38,0.3)]'}`}>
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white opacity-10 blur-2xl" />
          <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 rounded-full bg-black opacity-10 blur-xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-inner">
                {metrics.netProfit >= 0 ? <TrendingUp size={14} className="text-white" /> : <TrendingDown size={14} className="text-white" />}
                <span className="text-xs font-bold tracking-wide uppercase text-white drop-shadow-sm">{t('dash.netProfit')}</span>
              </div>
              <Activity className="text-white/40" size={24} />
            </div>
            
            <div className="text-[42px] font-black tracking-tighter leading-none mb-1 drop-shadow-md">
              ₦{metrics.netProfit.toLocaleString()}
            </div>
            
            {/* Revenue Split Details */}
            <div className="mt-6 pt-5 border-t border-white/20">
              <div className="flex justify-between items-end mb-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Daily Sales</div>
                <div className="font-bold">₦{metrics.totalSales.toLocaleString()}</div>
              </div>
              
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: '10%' }} />
                <div className="h-full bg-black/40 transition-all duration-1000 ease-out" style={{ width: '90%' }} />
              </div>
              
              <div className="flex justify-between mt-2 text-xs">
                <div>
                  <div className="font-bold text-white drop-shadow-sm">{t('dash.ourShare')}</div>
                  <div className="text-white/80 font-mono mt-0.5">₦{metrics.ourShare.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white/70">{t('dash.bakeryShare')}</div>
                  <div className="text-white/60 font-mono mt-0.5">₦{metrics.bakeryOwed.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Tracker */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                <Crosshair size={16} />
              </div>
              <span className="text-sm font-bold">{t('dash.dailyGoal')}</span>
            </div>
            <span className="text-xs font-bold bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full">
              {metrics.goalProgress}%
            </span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <div className="text-lg font-black tracking-tight">₦{metrics.totalSales.toLocaleString()}</div>
            <div className="text-xs text-secondary font-medium">/ ₦{metrics.dailyGoal.toLocaleString()} {t('dash.dailyGoalProgress')}</div>
          </div>
          <div className="h-2.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all duration-1000 ease-out shadow-sm" 
              style={{ width: `${metrics.goalProgress}%` }} 
            />
          </div>
        </div>

        {/* Smart Insights Notice */}
        {metrics.lowStockProducts.length > 0 && (
          <div className="bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fca5a5] dark:border-[#7f1d1d] rounded-[16px] p-4 mb-6 flex gap-3">
             <AlertTriangle className="text-[#dc2626] shrink-0 mt-0.5" size={20} />
             <div>
               <h3 className="font-bold text-[#dc2626] text-sm mb-1">{t('dash.stockAlert')}</h3>
               <p className="text-xs text-[#dc2626]/80">{t('dash.lowStockMsg')}: <span className="font-bold">{metrics.lowStockProducts.map(p => p.name).join(', ')}</span></p>
             </div>
          </div>
        )}

        {/* Quick Actions Carousel */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-print" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => navigate('/sales')} className="snap-start flex-none w-[110px] aspect-[4/3] bg-primary text-white rounded-[18px] p-3 flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-[0_4px_14px_rgba(var(--primary-rgb),0.3)] border-none">
            <PlusCircle size={22} className="opacity-90" />
            <span className="font-bold text-xs text-left leading-tight">{t('dash.newSale')}</span>
          </button>
          <button onClick={() => navigate('/inventory')} className="snap-start flex-none w-[110px] aspect-[4/3] bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-[18px] p-3 flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-sm">
            <PackagePlus size={22} className="text-[#f59e0b]" />
            <span className="font-bold text-xs text-left leading-tight">{t('dash.receiveBread')}</span>
          </button>
          <button onClick={() => navigate('/customers')} className="snap-start flex-none w-[110px] aspect-[4/3] bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-[18px] p-3 flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-sm">
            <UserPlus size={22} className="text-[#10b981]" />
            <span className="font-bold text-xs text-left leading-tight">{t('dash.addCustomer')}</span>
          </button>
          <button onClick={() => navigate('/reports')} className="snap-start flex-none w-[110px] aspect-[4/3] bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] rounded-[18px] p-3 flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-sm">
            <Activity size={22} className="text-[#6366f1]" />
            <span className="font-bold text-xs text-left leading-tight">{t('dash.reports')}</span>
          </button>
        </div>

        {/* Today's Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] p-4 flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981] mb-2">
               <ArrowDownRight size={20} />
             </div>
             <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">{t('dash.cashGenerated')}</div>
             <div className="text-xl font-black">₦{metrics.totalCash.toLocaleString()}</div>
           </div>
           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] p-4 flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] mb-2">
               <ArrowUpRight size={20} />
             </div>
             <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Expenses</div>
             <div className="text-xl font-black">₦{metrics.totalExpenses.toLocaleString()}</div>
           </div>
           <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] p-4 flex flex-col items-center justify-center text-center col-span-2">
             <div className="flex items-center gap-2 mb-2">
               <Package size={16} className="text-primary" />
               <span className="text-sm font-bold">{t('dash.breadSold')}</span>
             </div>
             <div className="text-2xl font-black text-primary mb-3">{metrics.breadSold} <span className="text-sm font-medium text-secondary">units today</span></div>
             
             {/* Visual Top Products */}
             <div className="w-full flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
               {metrics.topProducts.map(p => (
                 <div key={p.id} className="bg-black/5 dark:bg-white/5 rounded-[12px] p-2 flex items-center gap-2 min-w-[120px] flex-none">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-black shadow-sm flex items-center justify-center font-bold text-[#f59e0b] text-xs">
                       x{p.qty}
                    </div>
                    <div className="text-left">
                       <div className="text-[10px] font-bold truncate max-w-[70px]">{p.name}</div>
                       <div className="text-[9px] text-secondary">₦{p.price.toLocaleString()}</div>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Recent Activity List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="text-base font-bold">{t('dash.recentActivity')}</h2>
            </div>
            <button onClick={() => navigate('/reports')} className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">
              View All
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {metrics.recentActivity.length === 0 ? (
              <div className="text-center py-6 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px]">
                <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-secondary">
                  <Receipt size={20} />
                </div>
                <div className="text-sm font-bold text-secondary">{t('dash.noSalesYet')}</div>
              </div>
            ) : (
              metrics.recentActivity.map(tx => (
                <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[18px] p-3.5 flex justify-between items-center cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 text-primary shadow-inner">
                        {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--surface-color)] flex items-center justify-center ${tx.type === 'Cash' ? 'bg-[#10b981]' : 'bg-[#dc2626]'}`}>
                        {tx.type === 'Cash' ? <Wallet size={8} color="white" /> : <AlertTriangle size={8} color="white" />}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight">{getCustomerName(tx.customerId)}</div>
                      <div className="text-xs text-secondary font-medium">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm tracking-tight">₦{tx.totalPrice.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-secondary mt-0.5 flex gap-1 justify-end items-center">
                       {getTransactionItems(tx).reduce((s, i) => s + i.quantity, 0)} items <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Chart integrated smoothly */}
        <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] p-4 shadow-sm mb-6">
          <DashboardChart />
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;
