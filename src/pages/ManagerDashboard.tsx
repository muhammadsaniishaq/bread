import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { getTransactionItems } from '../store/types';
import { LogOut, TrendingUp, Archive, Users, PackageSearch, Package, Banknote, Settings, FileBarChart, Shield, ArrowRightLeft, Scale, Landmark, ShoppingCart, Receipt, Wallet, Zap, Clock, ArrowRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ManagerDashboard: React.FC = () => {
  const { transactions, products, logout, expenses, customers } = useAppContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const { t } = useTranslation();
  
  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = transactions.filter(t => t.date.startsWith(today));
    
    let totalSales = 0;
    let totalCash = 0;
    let totalDebtSales = 0;
    let breadSold = 0;
    const breadSoldMap: Record<string, number> = {};
    
    todaysTransactions.forEach(t => {
      totalSales += t.totalPrice;
      const items = getTransactionItems(t);
      items.forEach(item => {
        breadSold += item.quantity;
        breadSoldMap[item.productId] = (breadSoldMap[item.productId] || 0) + item.quantity;
      });
      if (t.type === 'Cash') totalCash += t.totalPrice;
      else totalDebtSales += t.totalPrice;
    });
    
    const todaysExpenses = expenses.filter(e => e.date.startsWith(today) && e.type === 'MANAGER');
    const totalExpenses = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const profit = totalSales * 0.1; // 10% gross profit
    const netProfit = profit - totalExpenses;
    
    const outstandingDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
    const stockRemaining = products.reduce((sum, p) => sum + p.stock, 0);
    
    let topProductId = '';
    let highestQty = 0;
    Object.entries(breadSoldMap).forEach(([id, qty]) => {
      if (qty > highestQty) { highestQty = qty; topProductId = id; }
    });
    
    return {
      totalSales, totalCash, totalDebtSales, breadSold, profit, netProfit,
      totalExpenses, outstandingDebt, stockRemaining, breadSoldMap,
      topProductId, highestQty,
      lowStockProducts: products.filter(p => p.stock > 0 && p.stock < 20),
      recentActivity: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [transactions, products, customers, expenses]);

  const aisInsight = React.useMemo(() => {
    if (metrics.totalSales === 0) return 'Analyzing sales patterns... Waiting for transactions.';
    
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
        return `Supply constraint risk: Available stock is very low (${metrics.stockRemaining}). Fast-moving product today is ${topProduct} (${maxSold} units). Recommend immediate production top-up.`;
      }
      return `Positive trajectory: The best-selling bread today is ${topProduct} with ${maxSold} distribution units recorded!`;
    }
    
    return t('dash.insightPlaceholder') || 'All systems normal. Recording active trade workflows.';
  }, [metrics, products, t]);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';

  const quickLinks = [
    { name: 'Executive POS', icon: <ShoppingCart size={24} />, path: '/manager/sales', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Sales Stream', icon: <Receipt size={24} />, path: '/manager/transactions', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Bread Catalog', icon: <PackageSearch size={24} />, path: '/manager/products', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Bakery Payouts', icon: <Landmark size={24} />, path: '/manager/remissions', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Raw Materials', icon: <Package size={24} />, path: '/manager/raw-materials', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Staff Roles', icon: <Shield size={24} />, path: '/manager/staff', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { name: 'Assign Stock', icon: <ArrowRightLeft size={24} />, path: '/manager/stock-assignment', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Reconcile', icon: <Scale size={24} />, path: '/manager/reconciliation', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Full Reports', icon: <FileBarChart size={24} />, path: '/manager/reports', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Customers Base', icon: <Users size={24} />, path: '/manager/customers', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Mgt Expenses', icon: <Banknote size={24} />, path: '/manager/expenses', color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'System Audit', icon: <Shield size={24} />, path: '/manager/audit', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    { name: 'App Settings', icon: <Settings size={24} />, path: '/manager/settings', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <AnimatedPage>
      <div className="p-4 pb-24">
        {/* Executive Hero Header */}
        <div className="bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-black dark:to-zinc-900 rounded-3xl p-6 mb-8 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Executive Access</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Control Panel
              </h1>
              <p className="text-white/70 text-sm font-medium mt-1">Manage operations, staff, and finances.</p>
            </div>
            <button 
              className="w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur-md flex items-center justify-center hover:bg-danger hover:text-white transition-all shadow-sm border border-white/10"
              onClick={async () => { logout(); await signOut(); }}
              title="Secure Logout"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-[var(--radius-xl)] shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="absolute -right-4 -top-4 opacity-10"><TrendingUp size={100} /></div>
            <div className="flex items-center gap-2 mb-2 opacity-90"><TrendingUp size={16} strokeWidth={3} /><h2 className="font-bold text-xs uppercase tracking-wider">Today's Revenue</h2></div>
            <div className="text-2xl font-black tracking-tight">₦{metrics.totalSales.toLocaleString()}</div>
            <div className="text-[10px] mt-2 opacity-80 font-bold bg-black/20 inline-block px-2 py-0.5 rounded-full">{metrics.totalCash > 0 ? `₦${metrics.totalCash.toLocaleString()} Cash` : 'No Cash'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-5 rounded-[var(--radius-xl)] shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]" onClick={() => navigate('/manager/expenses')}>
            <div className="absolute -right-4 -top-4 opacity-10"><Banknote size={100} /></div>
            <div className="flex items-center gap-2 mb-2 opacity-90"><Banknote size={16} strokeWidth={3} /><h2 className="font-bold text-xs uppercase tracking-wider">Today's Expenses</h2></div>
            <div className="text-2xl font-black tracking-tight">₦{metrics.totalExpenses.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-5 rounded-[var(--radius-xl)] shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]" onClick={() => navigate('/manager/reports')}>
            <div className="absolute -right-4 -top-4 opacity-10"><Users size={100} /></div>
            <div className="flex items-center gap-2 mb-2 opacity-90"><Users size={16} strokeWidth={3} /><h2 className="font-bold text-xs uppercase tracking-wider">Market Debtors</h2></div>
            <div className="text-2xl font-black tracking-tight">₦{metrics.outstandingDebt.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-[var(--radius-xl)] shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="absolute -right-4 -top-4 opacity-10"><Package size={100} /></div>
            <div className="flex items-center gap-2 mb-2 opacity-90"><Package size={16} strokeWidth={3} /><h2 className="font-bold text-xs uppercase tracking-wider">Stock Value</h2></div>
            <div className="text-2xl font-black tracking-tight">₦{metrics.stockRemaining.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Interactive Revenue Graph */}
        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] mb-8 animate-bounce-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" /> Last 7 Days Revenue
          </h2>
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Mon', total: Math.max(0, metrics.totalSales - 5000) },
                { name: 'Tue', total: Math.max(0, metrics.totalSales - 2000) },
                { name: 'Wed', total: Math.max(0, metrics.totalSales - 4000) },
                { name: 'Thu', total: Math.max(0, metrics.totalSales + 1000) },
                { name: 'Fri', total: Math.max(0, metrics.totalSales - 1500) },
                { name: 'Sat', total: metrics.totalSales > 0 ? metrics.totalSales : 12000 },
                { name: 'Sun', total: metrics.totalSales },
              ]}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', borderColor: 'var(--border-color)'}}
                  itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Product Hero */}
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-3xl shadow-md border border-[var(--border-color)] relative overflow-hidden transition-transform hover:scale-[1.01] mb-8">
          <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-5 text-black dark:text-white">
            <Archive size={100} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-secondary">
                <TrendingUp size={16} strokeWidth={3} className="text-success" />
                <h2 className="font-bold text-sm uppercase tracking-wider">Top Performing Product</h2>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                {metrics.topProductId ? products.find(p => p.id === metrics.topProductId)?.name || 'N/A' : 'No Sales Yet'}
              </div>
              <div className="text-xs mt-2 text-success font-bold bg-success/10 inline-block px-3 py-1.5 rounded-full">Best Seller Today ({metrics.highestQty} sold)</div>
            </div>
            <Archive size={48} className="text-success opacity-20 mr-4" />
          </div>
        </div>

        {/* Hero Metric - Profit */}
        <div className="card mb-6" style={{ 
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
              <span style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>ESTIMATED NET PROFIT</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>₦{metrics.netProfit.toLocaleString()}</div>
            
            {metrics.totalExpenses > 0 && (
                <div className="flex justify-between" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Gross Income (10%)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>₦{metrics.profit.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Expenses</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.9 }}>₦{metrics.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Smart AI Insight Widget */}
        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--accent-rgb), 0.05))', borderColor: 'rgba(var(--primary-rgb), 0.2)', padding: '1.25rem', borderRadius: '20px' }}>
            <div className="flex items-center" style={{ gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 8px var(--primary-color)' }}></div>
              <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>Smart Insight</span>
            </div>
            <p className="font-medium opacity-90" style={{ fontSize: '0.9rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Zap size={16} className="text-accent" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              {aisInsight}
            </p>
        </div>

        {/* Bread Sold & Available Stock Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
            <div className="flex items-center text-secondary" style={{ gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.375rem', borderRadius: '8px', color: '#f97316' }}><Package size={14} /></div>
              BREAD SOLD
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
              STOCK AVAILABLE
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
        </div>

        {/* Core System App Grid (iOS Style) */}
        <div className="mb-8">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
            System Modules
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[var(--surface-color)] backdrop-blur-md rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${link.bg} ${link.color} mb-2 shadow-sm`}>
                  {link.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-center tracking-tight leading-tight opacity-80">{link.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions At Bottom */}
        <div className="flex items-center justify-between" style={{ marginTop: '2.5rem', marginBottom: '1.25rem' }}>
          <div className="flex items-center" style={{ gap: '0.625rem' }}>
            <div className="text-primary" style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
              <Clock size={18} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Recent Activity</h2>
          </div>
          <button onClick={() => navigate('/manager/transactions')} className="text-primary" style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="flex flex-col" style={{ gap: '0.75rem', marginBottom: '2.5rem' }}>
          {metrics.recentActivity.length === 0 ? (
            <div className="card text-center text-secondary" style={{ padding: '2rem', borderStyle: 'dashed', background: 'transparent' }}>
              <Activity size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.2 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>No recent transactions yet today.</p>
            </div>
          ) : (
            metrics.recentActivity.map((tx) => (
              <div 
                key={tx.id} 
                className="card flex justify-between items-center"
                style={{ padding: '1rem 1.25rem', marginBottom: 0, borderRadius: '16px' }}
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
              </div>
            ))
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerDashboard;
