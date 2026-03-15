import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Expense } from '../store/types';

export const Expenses: React.FC = () => {
  const { expenses, addExpense } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayStr = new Date().toISOString().split('T')[0];
  const totalToday = expenses
    .filter(e => e.date.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    const exp: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      amount: parseInt(amount)
    };
    
    await addExpense(exp);
    
    setDescription('');
    setAmount('');
    setIsAdding(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`;
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem' }}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancel' : '+ New Expense'}
        </button>
      </div>

      <div className="card text-center mb-6">
        <h2 className="text-sm text-secondary">Total Expenses Today</h2>
        <div className="text-3xl font-bold text-danger mt-1">₦{totalToday.toLocaleString()}</div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddExpense} className="card border-primary mb-6">
          <h3 className="text-md font-semibold mb-3">Add Daily Expense</h3>
          
          <div className="form-group mb-3">
            <label className="form-label">Description (e.g. Fuel, Loading)</label>
            <input 
              type="text" 
              className="form-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group mb-4">
            <label className="form-label">Amount (₦)</label>
            <input 
              type="number" 
              className="form-input" 
              min="1" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-danger w-full text-lg">Save Expense</button>
        </form>
      )}

      <h2 className="text-lg font-semibold mb-3">Recent Expenses</h2>
      <div className="flex flex-col gap-2">
        {sortedExpenses.length === 0 ? (
          <p className="text-secondary text-center py-4">No expenses recorded yet.</p>
        ) : (
          sortedExpenses.map(e => (
            <div key={e.id} className="card flex justify-between items-center" style={{ marginBottom: 0 }}>
              <div>
                <div className="font-bold">{e.description}</div>
                <div className="text-xs text-secondary mt-1">{formatDate(e.date)}</div>
              </div>
              <div className="text-xl font-bold text-danger">₦{e.amount.toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Expenses;
