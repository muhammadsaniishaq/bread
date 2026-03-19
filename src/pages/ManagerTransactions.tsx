import React, { useMemo, useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Receipt, ArrowLeft, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';

export const ManagerTransactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, customers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const sortedTx = useMemo(() => {
    return [...transactions]
      .filter(tx => {
         const customerName = customers.find(c => c.id === tx.customerId)?.name || 'Walk-in Customer';
         return customerName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customers, searchTerm]);

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="text-blue-500" /> Live Sales Stream
          </h1>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] bg-gradient-to-br from-blue-500/10 to-transparent mb-6">
           <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
             <input 
               type="text" 
               className="form-input py-3 pl-10 bg-white/50 dark:bg-black/20 border-blue-500/20 shadow-sm w-full font-bold text-sm"
               placeholder="Search by customer name..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           
           <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 opacity-80">Chronological Logs</h2>
           
           <div className="grid gap-3">
             {sortedTx.map(tx => {
               const c = customers.find(c => c.id === tx.customerId);
               const isDebt = tx.type === 'Debt';
               const items = getTransactionItems(tx);
               
               return (
                 <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-2xl border border-[var(--border-color)] flex justify-between items-center shadow-sm hover:-translate-y-1 cursor-pointer transition-transform">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDebt ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                         {isDebt ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <div className="font-bold text-[15px]">{c?.name || 'Walk-in Customer'}</div>
                        <div className="text-[11px] opacity-60 font-medium">
                          {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {items.length} items
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                     <div className={`font-black text-lg ${isDebt ? 'text-danger' : 'text-success'}`}>₦{tx.totalPrice.toLocaleString()}</div>
                     {tx.discount ? <div className="text-[9px] font-bold text-purple-500 uppercase">Discount applied</div> : null}
                   </div>
                 </div>
               );
             })}
             {sortedTx.length === 0 && <div className="text-center p-8 opacity-50 font-medium text-sm border border-dashed rounded-xl">No transactions found.</div>}
           </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerTransactions;
