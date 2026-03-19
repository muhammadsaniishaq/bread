import React, { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Activity, ArrowDownRight, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerAudit: React.FC = () => {
  const { inventoryLogs, products } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const sortedLogs = useMemo(() => {
    return [...inventoryLogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(log => {
        if (!search) return true;
        const pName = products.find(p => p.id === log.productId)?.name || '';
        const searchLower = search.toLowerCase();
        const typeStr = log.type || 'Receive';
        return pName.toLowerCase().includes(searchLower) || typeStr.toLowerCase().includes(searchLower);
      });
  }, [inventoryLogs, products, search]);

  const getLogIcon = (type?: string) => {
    const t = type || 'Receive';
    if (t === 'Receive') return <Package className="text-emerald-500" size={20} strokeWidth={2.5}/>;
    if (t === 'Return') return <ArrowDownRight className="text-blue-500" size={20} strokeWidth={2.5}/>;
    return <Activity size={20} />;
  };

  const getLogColor = (type?: string) => {
    const t = type || 'Receive';
    if (t === 'Receive') return 'bg-emerald-500/10 border-emerald-500/20';
    if (t === 'Return') return 'bg-blue-500/10 border-blue-500/20';
    return 'bg-gray-500/10 border-gray-500/20';
  };

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Activity className="text-indigo-500" /> System Audit
          </h1>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-6 rounded-3xl border border-[var(--border-color)] mb-6 shadow-sm relative overflow-hidden">
           <Activity size={120} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] text-indigo-500" />
           <div className="relative z-10">
             <h2 className="text-xs font-bold opacity-70 mb-1 uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Total System Logs</h2>
             <div className="text-4xl font-black text-[var(--text-color)] tracking-tighter">{inventoryLogs.length}</div>
             <p className="text-xs font-medium text-secondary mt-2 max-w-[80%]">Comprehensive tracking of all product assignments, deductions, and supplier returns across the system.</p>
           </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
          <input 
            type="text" 
            placeholder="Search logs by product or action..." 
            className="form-input w-full pl-12 py-3.5 bg-surface font-bold text-sm shadow-sm rounded-2xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          {sortedLogs.map(log => {
            const product = products.find(p => p.id === log.productId);
            const t = log.type || 'Receive';
            // Default legacy logs didn't capture full names, mostly just type and qty
            const description = t === 'Receive' ? 'Store Received' : 
                                t === 'Return' ? 'Returned to Bakery' : t;

            return (
              <div key={log.id} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm backdrop-blur-md ${getLogColor(t)}`}>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                      {getLogIcon(t)}
                    </div>
                    <div>
                      <div className="font-bold text-base">{product?.name || 'Unknown Product'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">{description}</span>
                        <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20"></span>
                        <span className="text-[11px] font-medium text-secondary">{new Date(log.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                 </div>
                 <div className="text-right">
                   <div className="font-black text-xl">{log.quantityReceived}</div>
                   <div className="text-[10px] font-bold opacity-50">Units</div>
                 </div>
              </div>
            );
          })}
          
          {sortedLogs.length === 0 && (
            <div className="text-center py-12 opacity-50 border border-dashed rounded-3xl border-[var(--border-color)]">
               <Activity size={48} className="mx-auto mb-3 opacity-20" />
               <p className="font-bold text-sm">No Audit Logs Found</p>
               <p className="text-xs mt-1">Assignments and returns will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerAudit;
