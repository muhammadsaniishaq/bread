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
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="text-red-500" /> Mgt Expenses
          </h1>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-transparent p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-sm">
           <h2 className="text-sm font-bold opacity-70 mb-1 uppercase tracking-wide">Today's Expenditures</h2>
           <div className="text-3xl font-black text-red-500 tracking-tight">₦{totalToday.toLocaleString()}</div>
        </div>

        <form onSubmit={handleAddExpense} className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-sm">
          <h3 className="text-sm font-bold mb-4 opacity-80 uppercase tracking-wide">Log Internal Expense</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold opacity-70 block mb-1">Reason (e.g. Fuel, Logistics)</label>
              <input type="text" className="form-input bg-black/5 dark:bg-white/5 border-none" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Expense description..." />
            </div>
            <div>
              <label className="text-xs font-bold opacity-70 block mb-1">Amount (₦)</label>
              <input type="number" className="form-input bg-black/5 dark:bg-white/5 border-none font-bold text-lg" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0" />
            </div>
            <button type="submit" className="btn bg-red-500 text-white rounded-xl shadow-md mt-2 flex items-center justify-center gap-2">
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
