import React, { useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Scale, ArrowLeft, Banknote, FileWarning, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const FinancialReconciliation: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, expenses } = useAppContext();

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    
    const todaysTx = transactions.filter(t => new Date(t.date).toDateString() === today);
    const todaysExp = expenses.filter(e => new Date(e.date).toDateString() === today);

    let totalCash = 0;
    let totalDebt = 0;
    let expectedCashVault = 0;

    todaysTx.forEach(tx => {
      if (tx.type === 'Cash') {
         totalCash += tx.totalPrice;
      } else {
         totalDebt += tx.totalPrice;
      }
    });

    const totalExpAmount = todaysExp.reduce((sum, e) => sum + e.amount, 0);
    expectedCashVault = totalCash - totalExpAmount;

    return {
      salesCount: todaysTx.length,
      cashStr: totalCash.toLocaleString(),
      debtStr: totalDebt.toLocaleString(),
      expStr: totalExpAmount.toLocaleString(),
      vaultStr: Math.max(0, expectedCashVault).toLocaleString(),
      deficit: expectedCashVault < 0 ? Math.abs(expectedCashVault).toLocaleString() : '0'
    };
  }, [transactions, expenses]);

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-rose-500" /> Reconciliation
          </h1>
        </div>
        
        <div className="card mt-4 p-5 border border-[var(--border-color)] bg-gradient-to-br from-rose-500/10 to-transparent">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-3">
            <h2 className="font-bold text-lg">Expected End-of-Day Cash</h2>
            <div className="text-xs font-bold uppercase tracking-wide bg-rose-500 text-white px-2 py-0.5 rounded-md">Live</div>
          </div>
          
          <div className="text-center py-6 mb-2 border border-rose-500/20 rounded-2xl bg-white dark:bg-zinc-800 shadow-md">
            <div className="text-sm font-bold text-rose-500 mb-1 tracking-widest uppercase">Vault Balance Target</div>
            <div className="text-4xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
              ₦{metrics.vaultStr}
            </div>
            {metrics.deficit !== '0' && <div className="text-danger text-sm font-bold mt-2 flex items-center justify-center gap-1"><FileWarning size={14}/> Deficit Warning: ₦{metrics.deficit}</div>}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
            <div className="bg-surface p-3 rounded-xl border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 text-success font-bold text-sm mb-1 opacity-80">
                <Banknote size={16}/> Cash Captured
              </div>
              <div className="font-black text-xl">₦{metrics.cashStr}</div>
              <div className="text-[10px] text-secondary mt-1 font-bold">from {metrics.salesCount} Sales</div>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 text-danger font-bold text-sm mb-1 opacity-80">
                <FileWarning size={16}/> Expenses Paid
              </div>
              <div className="font-black text-xl">₦{metrics.expStr}</div>
              <div className="text-[10px] text-secondary mt-1 font-bold">Deducted from Cash</div>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-[var(--border-color)] shadow-sm col-span-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-1 opacity-80">
                <CreditCard size={16}/> Issued on Debt (Receivables)
              </div>
              <div className="font-black text-xl">₦{metrics.debtStr}</div>
              <div className="text-[10px] text-secondary mt-1 font-bold">Not in Vault</div>
            </div>
          </div>

          <button className="btn bg-gray-900 dark:bg-white text-white dark:text-gray-900 w-full rounded-2xl shadow-lg border-none flex justify-center items-center gap-2">
            Approve & Close Day
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default FinancialReconciliation;
