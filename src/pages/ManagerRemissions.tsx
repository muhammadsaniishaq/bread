import React, { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Landmark, ArrowLeft, ArrowDownToLine, Wallet, FileText, Send } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';

export const ManagerRemissions: React.FC = () => {
  const navigate = useNavigate();
  const { bakeryPayments, transactions, recordBakeryPayment } = useAppContext();
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [paymentReceiver, setPaymentReceiver] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountStr = parseInt(paymentAmount);
    if (!amountStr || amountStr <= 0) return;
    
    if (amountStr > metrics.outstanding) {
      alert(`Cannot pay more than the pending unremitted balance (₦${metrics.outstanding.toLocaleString()})`);
      return;
    }

    setIsProcessing(true);
    const paymentId = Date.now().toString();
    
    await recordBakeryPayment({
      id: paymentId,
      date: new Date().toISOString(),
      amount: amountStr,
      method: paymentMethod,
      receiver: paymentReceiver.trim() || undefined
    });
    
    setPaymentAmount('');
    setPaymentReceiver('');
    setPaymentMethod('Cash');
    setIsProcessing(false);
    
    navigate(`/bakery-receipt/${paymentId}`);
  };

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

        <div className="card border-t-4 border-purple-500 mb-8" style={{ background: 'var(--surface-color)' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
             <Send size={20} className="text-purple-500" /> Record New Remission
          </h2>
          <form onSubmit={handleRecordPayment}>
            <div className="form-group mb-3">
              <label className="form-label text-xs">Amount Paid (₦) *</label>
              <input 
                type="number" 
                className="form-input bg-background" 
                placeholder="e.g. 50000" 
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                max={metrics.outstanding}
                required 
              />
              <div className="text-[10px] text-secondary mt-1">
                Available to pay: <strong className="text-purple-500">₦{metrics.outstanding.toLocaleString()}</strong>
              </div>
            </div>
            
            <div className="flex gap-3 mb-4">
              <div className="form-group flex-1">
                <label className="form-label text-xs">Method</label>
                <select 
                  className="form-select bg-background" 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                >
                  <option value="Cash">Cash (KudiHannu)</option>
                  <option value="Transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div className="form-group flex-1">
                <label className="form-label text-xs">Receiver Name</label>
                <input 
                  type="text" 
                  className="form-input bg-background" 
                  placeholder="Who received it?" 
                  value={paymentReceiver}
                  onChange={e => setPaymentReceiver(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn bg-purple-500 text-white w-full rounded-2xl shadow-md"
              disabled={isProcessing}
            >
              {isProcessing ? 'Generating Receipt...' : 'Record Payment & Print Receipt'}
            </button>
          </form>
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
              <div className="flex flex-col items-end gap-2">
                <div className="font-black text-purple-600 dark:text-purple-400 text-lg">
                  ₦{p.amount.toLocaleString()}
                </div>
                <Link to={`/bakery-receipt/${p.id}`} className="btn btn-outline py-1 px-2 text-[10px] flex items-center gap-1 border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                  <FileText size={12} /> Receipt
                </Link>
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
