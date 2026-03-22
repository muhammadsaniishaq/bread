import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import type { Expense } from '../store/types';
import { Banknote, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerExpenses: React.FC = () => {
  const { expenses, addExpense } = useAppContext();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const managerExpenses = expenses.filter(e => e.type === 'MANAGER');
  
  const sortedExpenses = [...managerExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const todayStr = new Date().toISOString().split('T')[0];
  const totalToday = managerExpenses
    .filter(e => e.date.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    const exp: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      amount: parseInt(amount),
      type: 'MANAGER'
    };
    await addExpense(exp);
    setDescription('');
    setAmount('');
  };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '6rem' }} className="container px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} style={{ padding: '8px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
            <Banknote color="#dc2626" /> Mgt Expenses
          </h1>
        </div>

        <div style={{ margin: '0 0 24px', borderRadius: '22px', padding: '24px', background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="shadow-md">
           <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
           <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, margin: '0 0 4px' }}>Today's Expenditures</h2>
           <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>₦{totalToday.toLocaleString()}</div>
        </div>

        <form onSubmit={handleAddExpense} className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-sm">
          <h3 className="text-sm font-bold mb-4 opacity-80 uppercase tracking-wide">Log Internal Expense</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold opacity-70 block mb-1">Reason (e.g. Fuel, Logistics)</label>
              <input type="text" style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', fontSize: '15px', color: 'var(--text-color)', outline: 'none' }} value={description} onChange={e => setDescription(e.target.value)} required placeholder="Expense description..." />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70 block mb-1">Amount (₦)</label>
              <input type="number" style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', fontSize: '18px', fontWeight: 800, color: '#dc2626', outline: 'none' }} value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0" />
            </div>
            <button type="submit" style={{ background: '#dc2626', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
              <Plus size={18} /> Record Expense
            </button>
          </div>
        </form>

        <h3 className="text-sm font-bold mb-3 opacity-80 uppercase tracking-wide px-1">Expense History</h3>
        <div className="grid gap-3">
          {sortedExpenses.map(e => (
            <div key={e.id} className="bg-surface p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center shadow-sm">
              <div>
                <div className="font-bold text-[15px]">{e.description}</div>
                <div className="text-[11px] opacity-60 font-medium mt-1">{new Date(e.date).toLocaleString()}</div>
              </div>
              <div className="text-lg font-black text-red-500">₦{e.amount.toLocaleString()}</div>
            </div>
          ))}
          {sortedExpenses.length === 0 && <div className="text-center p-8 opacity-50 font-medium text-sm border border-dashed rounded-xl">No expenses recorded.</div>}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerExpenses;
