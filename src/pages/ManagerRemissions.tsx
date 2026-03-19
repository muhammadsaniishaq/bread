import React, { useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Landmark, ArrowLeft, ArrowDownToLine, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const ManagerRemissions: React.FC = () => {
  const navigate = useNavigate();
  const { bakeryPayments, transactions } = useAppContext();

  const metrics = useMemo(() => {
    let expectedTotalSales = 0;
    
    // Calculate 90% of all cash sales (Assuming suppliers keep 10% or whatever the logic implies)
    // Actually, bakery share is just sum of all Bakery Payments recorded.
    transactions.forEach(tx => {
       if (tx.type === 'Cash') {
         expectedTotalSales += tx.totalPrice;
       }
    });

    const expectedBakeryShare = expectedTotalSales * 0.90; // The 90% logic from user's history
    const totalRemitted = bakeryPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const outstanding = Math.max(0, expectedBakeryShare - totalRemitted);

    return {
      expectedBakeryShare,
      totalRemitted,
      outstanding
    };
  }, [bakeryPayments, transactions]);

  const sortedPayments = [...bakeryPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="text-purple-500" /> Bakery Payouts
          </h1>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] bg-gradient-to-br from-purple-500/10 to-transparent mt-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4 opacity-80">Global Remission Status</h2>
          
          <div className="grid gap-4">
             <div className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md p-4 rounded-2xl border border-purple-500/20">
                <div className="text-xs font-bold opacity-70 mb-1 flex items-center gap-1"><Wallet size={12}/> Total Remitted to Bakery</div>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400">₦{metrics.totalRemitted.toLocaleString()}</div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[var(--border-color)]">
                 <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Expected 90% Share</div>
                 <div className="font-bold text-lg">₦{metrics.expectedBakeryShare.toLocaleString()}</div>
               </div>
               <div className="bg-danger/10 p-3 rounded-xl border border-danger/20">
                 <div className="text-[10px] font-bold text-danger opacity-80 uppercase mb-1">Pending Unremitted</div>
                 <div className="font-bold text-lg text-danger">₦{metrics.outstanding.toLocaleString()}</div>
               </div>
             </div>
          </div>
        </div>

        <h3 className="text-sm font-bold mb-3 opacity-80 uppercase tracking-wide px-1">Recent Remission Logs</h3>
        <div className="grid gap-3">
          {sortedPayments.map(p => (
            <div key={p.id} className="bg-surface p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center shadow-sm hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <ArrowDownToLine size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-[15px]">{p.method || 'Cash'} Transfer</div>
                   <div className="text-[11px] opacity-60 font-medium">{new Date(p.date).toLocaleString()}</div>
                 </div>
              </div>
              <div className="font-black text-purple-600 dark:text-purple-400 text-lg">
                ₦{p.amount.toLocaleString()}
              </div>
            </div>
          ))}
          {sortedPayments.length === 0 && <div className="text-center p-8 opacity-50 font-medium text-sm border border-dashed rounded-xl">No remissions recorded yet.</div>}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerRemissions;
