import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardChart: React.FC = () => {
  const { transactions, expenses } = useAppContext();

  const data = useMemo(() => {
    const days: { date: string, label: string, sales: number, expenses: number, profit: number }[] = [];
    const now = new Date();
    
    // Generate last 7 days starting from oldest to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
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
  }, [transactions, expenses]);

  if (transactions.length === 0) return null;

  return (
    <div className="card mb-6 p-6 pb-2" style={{ background: 'var(--surface-color)', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          7-Day Trend
        </h3>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger-color)" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="var(--danger-color)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600}} 
              dy={10} 
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(var(--surface-rgb), 0.95)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '16px', 
                backdropFilter: 'blur(20px)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
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
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorSales)"
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: 'var(--primary-color)', style: { filter: 'drop-shadow(0px 4px 8px rgba(var(--primary-rgb),0.5))' } }}
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="Expenses (₦)" 
              stroke="var(--danger-color)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorExpenses)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'var(--danger-color)', style: { filter: 'drop-shadow(0px 4px 8px rgba(var(--danger-rgb),0.5))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
