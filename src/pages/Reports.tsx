import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';

export const Reports: React.FC = () => {
  const { transactions, expenses, products, customers } = useAppContext();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState<'All' | 'Today' | 'Week' | 'Month'>('Today');

  const filteredData = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filteredTxs = transactions;
    let filteredExps = expenses;

    if (period === 'Today') {
      filteredTxs = transactions.filter(t => t.date.startsWith(todayStr));
      filteredExps = expenses.filter(e => e.date.startsWith(todayStr));
    } else if (period === 'Week') {
      filteredTxs = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
      filteredExps = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    } else if (period === 'Month') {
      filteredTxs = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
      filteredExps = expenses.filter(e => new Date(e.date) >= oneMonthAgo);
    }

    return { filteredTxs, filteredExps };
  };

  const { filteredTxs, filteredExps } = filteredData();

  const totalSalesValue = filteredTxs.reduce((acc, t) => acc + t.totalPrice, 0);
  const totalCash = filteredTxs.filter(t => t.type === 'Cash').reduce((acc, t) => acc + t.totalPrice, 0);
  const totalDebt = filteredTxs.filter(t => t.type === 'Debt').reduce((acc, t) => acc + t.totalPrice, 0);
  const breadCount = filteredTxs.reduce((acc, t) => acc + getTransactionItems(t).reduce((sum, item) => sum + item.quantity, 0), 0);
  
  const totalExpenses = filteredExps.reduce((acc, e) => acc + e.amount, 0);
  const grossProfit = totalSalesValue * 0.1;
  const netProfit = grossProfit - totalExpenses;

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Item';
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`;
  };

  const sortedTxs = [...filteredTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Advanced Reports</h1>
        <button className="btn btn-outline" style={{width: 'auto', minHeight: 'auto', padding: '0.25rem 0.5rem'}} onClick={() => window.print()}>
          Print View
        </button>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-print">
        {['Today', 'Week', 'Month', 'All'].map(p => (
          <button 
            key={p}
            className={`btn flex-none ${period === p ? 'btn-primary' : 'btn-outline'}`} 
            style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
            onClick={() => setPeriod(p as any)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="card mb-6" style={{ background: netProfit >= 0 ? 'var(--primary-color)' : 'var(--danger-color)', color: 'white' }}>
        <h2 className="text-sm opacity-90 mb-1">Net Profit ({period})</h2>
        <div className="text-3xl font-bold">₦{netProfit.toLocaleString()}</div>
        <div className="flex justify-between mt-4 text-sm opacity-90 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <span>10% Gross: ₦{grossProfit.toLocaleString()}</span>
          <span>Expenses: ₦{totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Total Sales</div>
          <div className="text-xl font-bold mt-1">₦{totalSalesValue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Bread Sold</div>
          <div className="text-xl font-bold mt-1">{breadCount} units</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Cash Received</div>
          <div className="text-xl font-bold text-success mt-1">₦{totalCash.toLocaleString()}</div>
        </div>
        <div className="card border-danger" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Debt Issued</div>
          <div className="text-xl font-bold text-danger mt-1">₦{totalDebt.toLocaleString()}</div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-3">Transaction History</h3>
      <div className="flex flex-col gap-2">
        {sortedTxs.length === 0 ? (
          <p className="text-center text-secondary py-4">No transactions found.</p>
        ) : (
          sortedTxs.map(t => (
            <div key={t.id} className="card flex justify-between items-center" style={{ marginBottom: 0, padding: '1rem' }} onClick={() => navigate(`/receipt/${t.id}`)}>
              <div>
                <div className="font-bold">{t.customerId ? getCustomerName(t.customerId) : 'Cash Walk-in'}</div>
                <div className="text-sm">
                  {getTransactionItems(t).map((item, idx) => (
                    <div key={idx} className="opacity-80 mt-1">
                      {item.quantity}x {getProductName(item.productId)}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-secondary mt-1">{formatDate(t.date)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">₦{t.totalPrice.toLocaleString()}</div>
                <div className={`text-xs font-bold uppercase ${t.type === 'Cash' ? 'text-success' : 'text-danger'}`}>
                  {t.type}
                </div>
                <div className="text-xs text-primary mt-1 no-print">View Receipt →</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
