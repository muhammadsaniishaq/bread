import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DashboardChart } from '../components/DashboardChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { TrendingUp, Wallet, Package, Users, PlusCircle, UserPlus, Activity, AlertTriangle, Clock, Search, X, Zap, ArrowRight, TrendingDown, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  show: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 } 
  }
};

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
    if (hour < 12) return { text: t('dash.goodMorning') + ' ☀️', gradient: 'from-amber-400 to-orange-500' };
    if (hour < 17) return { text: t('dash.goodAfternoon') + ' 🌤️', gradient: 'from-blue-400 to-indigo-500' };
    return { text: t('dash.goodEvening') + ' 🌙', gradient: 'from-indigo-400 to-purple-600' };
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
      <motion.div 
        className="container pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col mb-6 mt-2">
          <h1 className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${greetingObj.gradient}`}>
            {greetingObj.text}
          </h1>
          <p className="text-secondary font-medium mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </motion.div>

        {/* Search Bar - Modernized */}
        <motion.div variants={itemVariants} className="relative mb-8 z-10 group">
          <div className="flex items-center bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl px-5 py-3.5 focus-within:border-primary focus-within:ring-4 ring-primary/10 transition-all duration-300 shadow-sm group-hover:shadow-md backdrop-blur-md">
            <Search size={20} className="text-secondary mr-3 transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search customers, products..." 
              className="bg-transparent border-none outline-none w-full text-[15px] font-medium placeholder:text-secondary/70"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')} 
                  className="text-secondary hover:text-primary ml-2 bg-gray-100 dark:bg-zinc-800 rounded-full p-1 transition-colors"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Search Dropdown */}
          <AnimatePresence>
            {searchResults && (searchResults.customers.length > 0 || searchResults.products.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
              >
                {/* Search Results Content */}
                {searchResults.customers.length > 0 && (
                  <div className="py-2">
                    <div className="text-[11px] font-bold text-secondary uppercase tracking-widest px-5 py-2">Customers</div>
                    {searchResults.customers.map(c => (
                       <div key={c.id} onClick={() => navigate(`/customer/${c.id}`)} className="px-5 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                         <div>
                           <div className="font-semibold text-[15px] tracking-tight">{c.name}</div>
                           <div className="text-xs text-secondary mt-0.5">{c.phone || 'No phone'}</div>
                         </div>
                         <div className="text-xs font-bold font-mono">
                           {c.debtBalance > 0 ? <span className="text-danger flex items-center gap-1.5 px-2 py-1 bg-danger/10 rounded-lg"><AlertTriangle size={12}/> ₦{c.debtBalance.toLocaleString()}</span> : <span className="text-success bg-success/10 px-2 py-1 rounded-lg">Clean</span>}
                         </div>
                       </div>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div className="py-2 border-t border-[var(--border-color)]">
                    <div className="text-[11px] font-bold text-secondary uppercase tracking-widest px-5 py-2">Products</div>
                    {searchResults.products.map(p => (
                       <div key={p.id} onClick={() => navigate('/inventory')} className="px-5 py-3 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
                         <div className="flex items-center gap-3">
                           {p.image ? (
                             <img src={p.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                           ) : (
                             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-primary/20">
                               {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                             </div>
                           )}
                           <div>
                             <div className="font-semibold text-[15px] tracking-tight">{p.name}</div>
                             <div className="text-xs text-secondary mt-0.5">{p.category || 'Standard'} • ₦{p.price}</div>
                           </div>
                         </div>
                         <div className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${p.stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                           {p.stock} in stock
                         </div>
                       </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick Actions - Floating Pills */}
        <motion.div variants={itemVariants} className="flex gap-3 mb-8 overflow-x-auto pb-4 no-print -mx-5 px-5 snap-x" style={{ scrollbarWidth: 'none' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/sales')}
            className="flex-none flex items-center gap-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-primary/30 font-semibold tracking-wide snap-start ring-1 ring-white/20"
          >
            <PlusCircle size={20} className="opacity-90" /> {t('dash.newSale')}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/customers')}
            className="flex-none flex items-center gap-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] px-5 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow font-semibold text-secondary snap-start backdrop-blur-md"
          >
            <UserPlus size={20} className="text-primary/70" /> {t('dash.addCustomer')}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/reports')}
            className="flex-none flex items-center gap-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] px-5 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow font-semibold text-secondary snap-start backdrop-blur-md"
          >
            <Activity size={20} className="text-accent/70" /> {t('dash.reports')}
          </motion.button>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {metrics.lowStockProducts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden bg-red-500/5 dark:bg-red-500/10 border-red-500/20 backdrop-blur-md">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl"></div>
                <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 text-[15px]">
                  <AlertTriangle size={18} /> {t('dash.stockAlert')}
                </h3>
                <div className="grid gap-2">
                  {metrics.lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-red-500/10">
                      <span className="font-medium">{p.name}</span>
                      <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><TrendingDown size={14} className="opacity-70"/> {p.stock} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Metrics Grid */}
        <div className="flex flex-col gap-4">
          {/* Smart AI Insight Widget */}
          <motion.div variants={itemVariants} className="p-5 rounded-3xl relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-primary/20 backdrop-blur-2xl shadow-sm">
             <div className="flex items-center gap-2.5 mb-3">
               <div className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">Smart Insight</span>
             </div>
             <p className="text-[15px] font-medium leading-relaxed opacity-90 text-primary-900 dark:text-primary-100 flex items-start gap-2">
               <Zap size={18} className="text-accent flex-shrink-0 mt-0.5" />
               {aisInsight}
             </p>
          </motion.div>

          {/* Hero Metric - Profit */}
          <motion.div variants={itemVariants} className={`relative overflow-hidden p-6 rounded-3xl text-white shadow-xl transition-all ${metrics.netProfit >= 0 ? 'bg-gradient-to-br from-primary via-indigo-600 to-indigo-800' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
            {/* Decal background */}
            <TrendingUp size={140} className="absolute -right-6 -bottom-6 opacity-[0.07] rotate-12 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 opacity-80 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                  <Wallet size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold tracking-wide uppercase">{t('dash.estimatedProfit')}</span>
              </div>
              <div className="text-4xl font-extrabold mt-1 tracking-tight drop-shadow-sm">₦{metrics.netProfit.toLocaleString()}</div>
              
              {metrics.totalExpenses > 0 && (
                 <div className="mt-5 pt-4 flex justify-between tracking-wide border-t border-white/15">
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase opacity-70 font-bold">Gross Income</span>
                     <span className="text-sm font-bold">₦{metrics.profit.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-[10px] uppercase opacity-70 font-bold">Expenses</span>
                     <span className="text-sm font-bold opacity-90">₦{metrics.totalExpenses.toLocaleString()}</span>
                   </div>
                 </div>
              )}
            </div>
          </motion.div>
          
          {/* Sub-Metrics Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-3xl shadow-sm backdrop-blur-md hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-bl-[100px] transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center mb-3 text-success">
                <Wallet size={20} />
              </div>
              <div className="text-xs text-secondary font-semibold uppercase tracking-wider">{t('dash.cashGenerated')}</div>
              <div className="text-xl font-bold mt-1 tracking-tight text-gray-800 dark:text-gray-100">₦{metrics.totalCash.toLocaleString()}</div>
            </div>
            
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-3xl shadow-sm backdrop-blur-md hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[100px] transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <TrendingUp size={20} />
              </div>
              <div className="text-xs text-secondary font-semibold uppercase tracking-wider">{t('dash.totalValue')}</div>
              <div className="text-xl font-bold mt-1 tracking-tight text-gray-800 dark:text-gray-100">₦{metrics.totalSales.toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-3xl shadow-sm backdrop-blur-md relative">
              <div className="flex items-center gap-2.5 text-xs text-secondary font-bold uppercase tracking-wider border-b border-[var(--border-color)] pb-3 mb-3">
                <div className="bg-orange-500/10 p-1.5 rounded-lg text-orange-500"><Package size={14} /></div>
                {t('dash.breadSold')}
              </div>
              <div className="text-2xl font-bold mb-3 tracking-tight">{metrics.breadSold} <span className="text-sm font-medium text-secondary">units</span></div>
              <div className="flex flex-col gap-2">
                {products.map(p => {
                  const sold = metrics.breadSoldMap[p.id] || 0;
                  if (sold === 0) return null;
                  return (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50/50 dark:bg-white/5 p-2 rounded-xl">
                      <span className="truncate mr-2 text-sm font-medium">{p.name}</span>
                      <span className="font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md text-xs">{sold}</span>
                    </div>
                  );
                })}
                {metrics.breadSold === 0 && <span className="opacity-50 italic text-sm text-center py-2">No sales yet</span>}
              </div>
            </div>
            
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-3xl shadow-sm backdrop-blur-md relative">
              <div className="flex items-center gap-2.5 text-xs text-secondary font-bold uppercase tracking-wider border-b border-[var(--border-color)] pb-3 mb-3">
                <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-500"><Package size={14} /></div>
                {t('dash.stockAvailable')}
              </div>
              <div className="text-2xl font-bold mb-3 tracking-tight">{metrics.stockRemaining} <span className="text-sm font-medium text-secondary">units</span></div>
              <div className="flex flex-col gap-2">
                {products.filter(p => p.active).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-gray-50/50 dark:bg-white/5 p-2 rounded-xl">
                    <span className="truncate mr-2 text-sm font-medium">{p.name}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${p.stock < 20 ? 'bg-red-500/10 text-red-500' : 'bg-gray-200 dark:bg-zinc-700'}`}>{p.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {metrics.outstandingDebt > 0 && (
            <motion.div variants={itemVariants} className="bg-red-500/5 border border-red-500/30 p-5 rounded-3xl shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
               <div className="flex items-center gap-3 mb-1">
                 <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                  <Users size={20} />
                 </div>
                 <div>
                   <div className="text-xs font-bold uppercase tracking-wider text-red-600/80">{t('dash.outstandingDebt')}</div>
                   <div className="text-2xl font-extrabold text-red-600 mt-0.5 tracking-tight">₦{metrics.outstandingDebt.toLocaleString()}</div>
                 </div>
               </div>
            </motion.div>
          )}
        </div>

        <motion.div variants={itemVariants} className="mt-12 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Clock size={18} />
            </div>
            <h2 className="text-[19px] font-bold tracking-tight">{t('dash.recentActivity')}</h2>
          </div>
          <button onClick={() => navigate('/sales')} className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
            View All <ArrowRight size={14} />
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-10">
          {metrics.recentActivity.length === 0 ? (
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-8 rounded-3xl text-center text-secondary border-dashed backdrop-blur-sm">
              <Activity size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No recent transactions yet today.</p>
            </div>
          ) : (
            metrics.recentActivity.map((tx, idx) => (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/receipt/${tx.id}`)} 
                className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex justify-between items-center hover:shadow-md cursor-pointer transition-all hover:bg-gray-50/50 dark:hover:bg-white-[0.02] active:scale-95 group backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                      {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                    </div>
                    {tx.type === 'Cash' ? (
                      <div className="absolute -bottom-1 -right-1 bg-success text-white p-1 rounded-full border-2 border-[var(--surface-color)]">
                        <Wallet size={10} />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 bg-danger text-white p-1 rounded-full border-2 border-[var(--surface-color)]">
                        <CreditCard size={10} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[15px] tracking-tight group-hover:text-primary transition-colors">{getCustomerName(tx.customerId)}</div>
                    <div className="text-xs text-secondary font-medium flex items-center gap-1">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-[15px] tracking-tight">₦{tx.totalPrice.toLocaleString()}</div>
                  <div className={`text-[10px] uppercase font-bold mt-1.5 px-2 py-0.5 rounded-lg inline-block tracking-wider ${tx.type === 'Cash' ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-600'}`}>
                    {tx.type}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardChart />
        </motion.div>
        
      </motion.div>
    </AnimatedPage>
  );
};

export default Dashboard;
