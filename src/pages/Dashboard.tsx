import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DashboardChart } from '../components/DashboardChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { TrendingUp, Wallet, Package, Users, PlusCircle, UserPlus, Activity, AlertTriangle, Clock, Search, X, Zap, ArrowRight, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  show: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 } 
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
    if (hour < 12) return { text: t('dash.goodMorning') + ' ☀️', background: 'linear-gradient(to right, #fbbf24, #f97316)' }; // amber to orange
    if (hour < 17) return { text: t('dash.goodAfternoon') + ' 🌤️', background: 'linear-gradient(to right, #60a5fa, #6366f1)' }; // blue to indigo
    return { text: t('dash.goodEvening') + ' 🌙', background: 'linear-gradient(to right, #818cf8, #9333ea)' }; // indigo to purple
  }, [t]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    );
    
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    );
    
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
        className="container"
        style={{ paddingBottom: '6rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Ultra-Compact Top Bar */}
        <motion.div variants={itemVariants} className="flex items-center justify-between" style={{ marginBottom: '1rem', marginTop: '0', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
          {/* Greeting Column */}
          <div className="flex flex-col" style={{ flexShrink: 0 }}>
            <h1 style={{ 
              fontSize: '1.1rem', fontWeight: 800, background: greetingObj.background,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', letterSpacing: '-0.02em', lineHeight: 1.1
            }}>
              {greetingObj.text}
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Compact Search Bar */}
          <div style={{ 
            display: 'flex', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.04)', 
            border: '1px solid rgba(var(--primary-rgb), 0.1)', borderRadius: '99px', padding: '0.25rem 0.6rem',
            flexGrow: 1, maxWidth: '280px', transition: 'all 0.3s'
          }}>
            <Search size={14} className="text-primary" style={{ marginRight: '0.3rem', opacity: 0.7 }} />
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}
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
                  className="text-secondary"
                  style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.15rem', marginLeft: '0.25rem', border: 'none', cursor: 'pointer' }}
                >
                  <X size={12} />
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
                style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '100%', minWidth: '300px',
                  background: 'var(--surface-color)', border: '1px solid var(--border-color)', backdropFilter: 'blur(20px)',
                  borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflowY: 'auto', overflowX: 'hidden', maxHeight: '50vh', zIndex: 50 
                }}
              >
                {/* Search Results Content */}
                {searchResults.customers.length > 0 && (
                  <div style={{ padding: '0.5rem 0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 1.25rem' }}>Customers</div>
                    {searchResults.customers.map(c => (
                       <div key={c.id} onClick={() => { setSearchQuery(''); navigate(`/customers/${c.id}`); }} className="flex items-center justify-between" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                         <div>
                           <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{c.phone || 'No phone'}</div>
                         </div>
                         <div style={{ fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                           {c.debtBalance > 0 ? <span className="text-danger flex items-center gap-1" style={{ background: 'rgba(var(--danger-rgb), 0.1)', padding: '0.25rem 0.5rem', borderRadius: '8px' }}><AlertTriangle size={10}/> ₦{c.debtBalance.toLocaleString()}</span> : <span className="text-success" style={{ background: 'rgba(var(--success-rgb), 0.1)', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>Clean</span>}
                         </div>
                       </div>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div style={{ padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 1.25rem' }}>Products</div>
                    {searchResults.products.map(p => (
                       <div key={p.id} onClick={() => { setSearchQuery(''); navigate('/inventory'); }} className="flex items-center justify-between" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                         <div className="flex items-center" style={{ gap: '0.75rem' }}>
                           {p.image ? (
                             <img src={p.image} style={{ width: '2rem', height: '2rem', borderRadius: '6px', objectFit: 'cover' }} alt="" />
                           ) : (
                             <div className="text-primary" style={{ width: '2rem', height: '2rem', borderRadius: '6px', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                               {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ') + 1) : p.name.charAt(1)}
                             </div>
                           )}
                           <div>
                             <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{p.category || 'Standard'} • ₦{p.price}</div>
                           </div>
                         </div>
                         <div className={p.stock > 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', background: p.stock > 0 ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--danger-rgb), 0.1)', padding: '0.2rem 0.4rem', borderRadius: '6px' }}>
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
        <motion.div variants={itemVariants} className="flex mb-6" style={{ gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', margin: '0 -1.25rem', padding: '0 1.25rem' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/sales')}
            className="btn btn-primary flex flex-none items-center justify-center"
            style={{ borderRadius: '14px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, gap: '0.4rem', border: 'none', boxShadow: '0 4px 14px 0 rgba(var(--primary-rgb), 0.39)', minHeight: 'auto', width: 'auto' }}
          >
            <PlusCircle size={16} /> {t('dash.newSale')}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/customers')}
            className="btn flex flex-none items-center justify-center"
            style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '14px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, gap: '0.4rem', minHeight: 'auto', width: 'auto' }}
          >
            <UserPlus size={16} className="text-primary" style={{ opacity: 0.8 }} /> {t('dash.addCustomer')}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/reports')}
            className="btn flex flex-none items-center justify-center"
            style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '14px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, gap: '0.4rem', minHeight: 'auto', width: 'auto' }}
          >
            <Activity size={16} className="text-accent" style={{ opacity: 0.8 }} /> {t('dash.reports')}
          </motion.button>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {metrics.lowStockProducts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="card" style={{ background: 'rgba(var(--danger-rgb), 0.05)', borderColor: 'rgba(var(--danger-rgb), 0.3)', borderLeft: '4px solid var(--danger-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 className="font-bold text-danger flex items-center gap-2" style={{ fontSize: '0.95rem' }}>
                  <AlertTriangle size={16} /> {t('dash.stockAlert')}
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {metrics.lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm" style={{ background: 'rgba(255,255,255,0.5)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(var(--danger-rgb), 0.1)' }}>
                      <span className="font-medium">{p.name}</span>
                      <span className="font-bold text-danger flex items-center gap-2"><TrendingDown size={14} style={{ opacity: 0.7 }}/> {p.stock} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Metrics Grid */}
        <div className="flex flex-col" style={{ gap: '1rem' }}>
          {/* Smart AI Insight Widget */}
          <motion.div variants={itemVariants} className="card" style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--accent-rgb), 0.05))', borderColor: 'rgba(var(--primary-rgb), 0.2)', padding: '1.25rem', borderRadius: '20px' }}>
             <div className="flex items-center" style={{ gap: '0.625rem', marginBottom: '0.75rem' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 8px var(--primary-color)' }}></div>
               <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>Smart Insight</span>
             </div>
             <p className="font-medium opacity-90" style={{ fontSize: '0.9rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
               <Zap size={16} className="text-accent" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
               {aisInsight}
             </p>
          </motion.div>

          {/* Hero Metric - Profit */}
          <motion.div variants={itemVariants} className="card" style={{ 
            background: metrics.netProfit >= 0 ? 'linear-gradient(135deg, var(--primary-color), #4338ca)' : 'linear-gradient(135deg, var(--danger-color), #be123c)', 
            color: 'white', border: 'none', padding: '1.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden',
            boxShadow: metrics.netProfit >= 0 ? '0 10px 25px -5px rgba(var(--primary-rgb), 0.4)' : '0 10px 25px -5px rgba(var(--danger-rgb), 0.4)'
          }}>
            <TrendingUp size={120} style={{ position: 'absolute', right: '-10%', bottom: '-10%', opacity: 0.1, transform: 'rotate(15deg)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex items-center gap-2" style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.375rem', borderRadius: '8px' }}>
                  <Wallet size={16} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{t('dash.estimatedProfit')}</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>₦{metrics.netProfit.toLocaleString()}</div>
              
              {metrics.totalExpenses > 0 && (
                 <div className="flex justify-between" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                   <div className="flex flex-col">
                     <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Gross Income</span>
                     <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>₦{metrics.profit.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Expenses</span>
                     <span style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.9 }}>₦{metrics.totalExpenses.toLocaleString()}</span>
                   </div>
                 </div>
              )}
            </div>
          </motion.div>
          
          {/* Sub-Metrics Grid */}
          <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--success-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--success-color)' }}>
                <Wallet size={20} />
              </div>
              <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash.cashGenerated')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>₦{metrics.totalCash.toLocaleString()}</div>
            </div>
            
            <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                <TrendingUp size={20} />
              </div>
              <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash.totalValue')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>₦{metrics.totalSales.toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
              <div className="flex items-center text-secondary" style={{ gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.375rem', borderRadius: '8px', color: '#f97316' }}><Package size={14} /></div>
                {t('dash.breadSold')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{metrics.breadSold} <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500 }}>units</span></div>
              <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                {products.map(p => {
                  const sold = metrics.breadSoldMap[p.id] || 0;
                  if (sold === 0) return null;
                  return (
                    <div key={p.id} className="flex justify-between items-center" style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{sold}</span>
                    </div>
                  );
                })}
                {metrics.breadSold === 0 && <span className="text-secondary" style={{ fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>No sales yet</span>}
              </div>
            </div>
            
            <div className="card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
              <div className="flex items-center text-secondary" style={{ gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.375rem', borderRadius: '8px', color: '#3b82f6' }}><Package size={14} /></div>
                {t('dash.stockAvailable')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{metrics.stockRemaining} <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500 }}>units</span></div>
              <div className="flex flex-col" style={{ gap: '0.5rem' }}>
                {products.filter(p => p.active).map(p => (
                  <div key={p.id} className="flex justify-between items-center" style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.stock < 20 ? 'white' : 'inherit', background: p.stock < 20 ? 'var(--danger-color)' : 'rgba(0,0,0,0.05)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{p.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {metrics.outstandingDebt > 0 && (
            <motion.div variants={itemVariants} className="card border-danger" style={{ background: 'rgba(var(--danger-rgb), 0.05)', padding: '1.25rem', borderRadius: '20px' }}>
               <div className="flex items-center" style={{ gap: '0.75rem' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(var(--danger-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
                  <Users size={20} />
                 </div>
                 <div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--danger-color)', opacity: 0.8 }}>{t('dash.outstandingDebt')}</div>
                   <div className="text-danger" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.125rem', letterSpacing: '-0.02em' }}>₦{metrics.outstandingDebt.toLocaleString()}</div>
                 </div>
               </div>
            </motion.div>
          )}
        </div>

        <motion.div variants={itemVariants} className="flex items-center justify-between" style={{ marginTop: '2.5rem', marginBottom: '1.25rem' }}>
          <div className="flex items-center" style={{ gap: '0.625rem' }}>
            <div className="text-primary" style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
              <Clock size={18} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{t('dash.recentActivity')}</h2>
          </div>
          <button onClick={() => navigate('/sales')} className="text-primary" style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            View All <ArrowRight size={14} />
          </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex flex-col" style={{ gap: '0.75rem', marginBottom: '2.5rem' }}>
          {metrics.recentActivity.length === 0 ? (
            <div className="card text-center text-secondary" style={{ padding: '2rem', borderStyle: 'dashed', background: 'transparent' }}>
              <Activity size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.2 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>No recent transactions yet today.</p>
            </div>
          ) : (
            metrics.recentActivity.map((tx, idx) => (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/receipt/${tx.id}`)} 
                className="card flex justify-between items-center"
                style={{ cursor: 'pointer', padding: '1rem 1.25rem', marginBottom: 0, borderRadius: '16px' }}
              >
                <div className="flex items-center" style={{ gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div className="text-primary" style={{ width: '3rem', height: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.125rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      {getCustomerName(tx.customerId).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getCustomerName(tx.customerId)}</div>
                    <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '0.125rem' }}>
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>₦{tx.totalPrice.toLocaleString()}</div>
                  <div style={{ 
                    fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.375rem', 
                    display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: '6px', letterSpacing: '0.05em',
                    background: tx.type === 'Cash' ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--danger-rgb), 0.1)',
                    color: tx.type === 'Cash' ? 'var(--success-color)' : 'var(--danger-color)'
                  }}>
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
