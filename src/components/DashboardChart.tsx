import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export const DashboardChart: React.FC = () => {
  const { transactions, expenses } = useAppContext();
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const data = useMemo(() => {
    const days: { date: string, label: string, sales: number, expenses: number, profit: number }[] = [];
    const now = new Date();
    const numDays = timeRange === '7d' ? 7 : 30;
    
    // Generate days starting from oldest to today
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoStr = d.toISOString().split('T')[0];
      const label = timeRange === '7d' 
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      days.push({ date: isoStr, label, sales: 0, expenses: 0, profit: 0 });
    }

    // Aggregate data
    days.forEach(day => {
      const daySales = transactions
        .filter(t => t.date.startsWith(day.date))
        .reduce((sum, t) => sum + t.totalPrice, 0);
        
      const dayExpenses = expenses
        .filter(e => e.date.startsWith(day.date))
        .reduce((sum, e) => sum + e.amount, 0);
        
      day.sales = daySales;
      day.expenses = dayExpenses;
      day.profit = (daySales * 0.1) - dayExpenses;
    });

    return days;
  }, [transactions, expenses, timeRange]);

  if (transactions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
      className="bg-[var(--surface-color)] backdrop-blur-md border border-[var(--border-color)] mb-6 p-6 pb-2 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          Revenue Trend
        </h3>
        
        {/* Modern Toggle */}
        <div className="flex bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-xl">
          <button 
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === '7d' ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-secondary hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            7D
          </button>
          <button 
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === '30d' ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-secondary hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            30D
          </button>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger-color)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--danger-color)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600}} 
              dy={15} 
            />
            <Tooltip 
              cursor={{ stroke: 'rgba(var(--primary-rgb), 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
              contentStyle={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(0,0,0,0.05)', 
                borderRadius: '16px', 
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                padding: '12px 16px'
              }}
              itemStyle={{ fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              name="Income (₦)" 
              stroke="var(--primary-color)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorSales)"
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: 'var(--primary-color)', style: { filter: 'drop-shadow(0px 4px 8px rgba(var(--primary-rgb),0.5))' } }}
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="Expenses (₦)" 
              stroke="var(--danger-color)" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorExpenses)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'var(--danger-color)', style: { filter: 'drop-shadow(0px 4px 8px rgba(var(--danger-rgb),0.5))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
