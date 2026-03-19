import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { Users, ArrowLeft, Search, UserPlus, Truck, Download, CheckSquare, Square, MessageCircle, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';

export const ManagerCustomers: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Routed' | 'Unassigned' | 'Debtors'>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'A-Z' | 'Debt' | 'VIP'>('Newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; full_name: string }[]>([]);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER');
    if (data) setSuppliers(data);
  };

  let filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm));
    if (!matchesSearch) return false;
    
    if (filterType === 'Routed') return !!c.assignedSupplierId;
    if (filterType === 'Unassigned') return !c.assignedSupplierId;
    if (filterType === 'Debtors') return c.debtBalance > 0;
    return true;
  });

  filteredCustomers = filteredCustomers.sort((a, b) => {
    if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
    if (sortBy === 'Debt') return (b.debtBalance || 0) - (a.debtBalance || 0);
    if (sortBy === 'VIP') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
    return Number(b.id) - Number(a.id); // Newest
  });

  const totalDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const unassignedCount = customers.length - routedCount;

  const handleAssignSupplier = async (customer: Customer, newSupplierId: string) => {
    await updateCustomer({ ...customer, assignedSupplierId: newSupplierId });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAssign = async (newSupplierId: string) => {
    for (const customerId of selectedIds) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        await updateCustomer({ ...customer, assignedSupplierId: newSupplierId });
      }
    }
    setSelectedIds([]); // Clear selection after bulk update
  };

  const exportCSV = () => {
    const dataToExport = selectedIds.length > 0 ? customers.filter(c => selectedIds.includes(c.id)) : filteredCustomers;
    const headers = ['Name', 'Phone', 'Debt Balance', 'Loyalty Points', 'Assigned Route'];
    const rows = dataToExport.map(c => [
      c.name,
      c.phone || 'N/A',
      c.debtBalance,
      c.loyaltyPoints || 0,
      suppliers.find(s => s.id === c.assignedSupplierId)?.full_name || 'Open Market'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addCustomer({
      id: Date.now().toString(),
      name,
      phone,
      location: '',
      notes: '',
      debtBalance: 0,
      loyaltyPoints: 0,
      assignedSupplierId: selectedSupplierId || undefined
    });
    setName('');
    setPhone('');
    setIsAdding(false);
  };

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-emerald-500" /> Customer Base
          </h1>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-900 text-white p-6 rounded-3xl mb-8 shadow-xl relative overflow-hidden border border-emerald-500/20">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
           <Users className="absolute right-4 bottom-4 opacity-[0.05]" size={120} />
           
           <div className="flex justify-between items-start relative z-10 mb-6 border-b border-emerald-500/30 pb-4">
             <div>
               <h2 className="text-[10px] font-black opacity-70 mb-1 uppercase tracking-widest text-emerald-200">Executive Directory</h2>
               <div className="text-3xl font-black tracking-tight">{customers.length} Clients</div>
             </div>
             <div className="text-right">
               <h2 className="text-[10px] font-black opacity-70 mb-1 uppercase tracking-widest text-emerald-200">Global Customer Debt</h2>
               <div className="text-xl font-bold text-amber-300">₦{totalDebt.toLocaleString()}</div>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Routed</span>
                   <Truck size={14} className="opacity-50" />
                 </div>
                 <div className="text-2xl font-black">{routedCount}</div>
                 <div className="text-[10px] opacity-60 font-medium">Assigned to Suppliers</div>
              </div>
              <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-400/20 backdrop-blur-sm">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Open Market</span>
                   <Users size={14} className="opacity-50" />
                 </div>
                 <div className="text-2xl font-black">{unassignedCount}</div>
                 <div className="text-[10px] opacity-60 font-medium">Unassigned / Store</div>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="w-full bg-surface border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-sm font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap"
          >
            <UserPlus size={18} strokeWidth={2.5} /> Add Client
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between mb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full md:w-auto">
            {(['All', 'Routed', 'Unassigned', 'Debtors'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${filterType === f ? 'bg-emerald-500 text-white border-emerald-500 shadow-md transform -translate-y-0.5' : 'bg-surface text-secondary border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
               <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={16} />
               <select 
                 value={sortBy} 
                 onChange={e => setSortBy(e.target.value as any)}
                 className="w-full bg-surface border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 font-bold"
               >
                 <option value="Newest">Sort: Newest</option>
                 <option value="A-Z">Sort: A-Z</option>
                 <option value="Debt">Sort: Highest Debt</option>
                 <option value="VIP">Sort: Top VIPs</option>
               </select>
             </div>
             <button onClick={exportCSV} className="p-2 border border-[var(--border-color)] text-secondary hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors tooltip-trigger" title="Export CSV">
               <Download size={18} />
             </button>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-600 text-white p-3 rounded-2xl mb-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-bounce-in-up sticky top-20 z-50">
             <div className="font-bold flex items-center gap-2">
               <CheckSquare size={18} /> {selectedIds.length} Clients Selected
             </div>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                   className="form-input py-1.5 text-xs bg-indigo-800 border-none font-bold rounded-lg text-white w-full sm:w-auto"
                   onChange={(e) => handleBulkAssign(e.target.value)}
                   value=""
                >
                  <option value="" disabled>Bulk Route Assign...</option>
                  <option value="">Unassign / Store</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.full_name || 'Supplier'}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Clear
                </button>
             </div>
          </div>
        )}

        {isAdding && (
          <form onSubmit={handleAdd} className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-sm animate-bounce-in-up">
            <h3 className="text-sm font-bold mb-4 opacity-80 uppercase tracking-wide">Register New Client</h3>
            <div className="grid gap-4">
              <div>
                <input type="text" className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" placeholder="Full Name or Business Name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <input type="tel" className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" placeholder="Phone Number (Optional)" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold opacity-70 mb-1 block">Assign to Supplier Route (Optional)</label>
                <select className="form-input bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium w-full" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                  <option value="">Unassigned (Open Market)</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.full_name || 'Unnamed Supplier'}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn bg-emerald-500 text-white rounded-xl shadow-md mt-1 font-bold text-sm">Save Client</button>
            </div>
          </form>
        )}

        <div className="grid gap-4">
          {filteredCustomers.map(c => {
            const loyaltyScore = c.loyaltyPoints || 0;
            const isVIP = loyaltyScore > 100;
            const isSelected = selectedIds.includes(c.id);
            
            return (
              <div key={c.id} className={`bg-surface p-5 rounded-3xl border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5 transition-all group ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-[var(--border-color)] hover:border-emerald-500/40 hover:shadow-md'}`}>
                <div className="flex items-start gap-4 flex-1">
                  <button onClick={() => toggleSelection(c.id)} className={`mt-3 ${isSelected ? 'text-indigo-500' : 'text-gray-300 dark:text-zinc-600 hover:text-indigo-400'} transition-colors`}>
                    {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                  </button>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black shadow-sm text-xl border shrink-0 ${isVIP ? 'bg-gradient-to-br from-amber-200 to-amber-500 text-amber-900 border-amber-300' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-xl tracking-tight mb-1 flex items-center gap-2 flex-wrap">
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">{c.name}</span>
                      {isVIP && <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">VIP</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      {c.phone ? (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors px-2 py-0.5 rounded-full">
                          <MessageCircle size={10} /> {c.phone}
                        </a>
                      ) : (
                        <span className="opacity-50">No phone</span>
                      )}
                      {c.assignedSupplierId ? (
                         <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                           <Truck size={10} /> {suppliers.find(s => s.id === c.assignedSupplierId)?.full_name || 'Routed'}
                         </span>
                      ) : (
                         <span className="flex items-center gap-1 bg-zinc-500/10 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-500/20">
                           <Users size={10} /> Open Market
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                   <div className="flex items-center gap-4 justify-between sm:justify-end w-full">
                     <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold opacity-60 mb-1 ml-1">Route Control</label>
                        <select 
                          className="form-input py-2 text-[11px] bg-black/5 dark:bg-white/5 border-none font-bold rounded-xl w-[140px] cursor-pointer hover:bg-black/10 transition-colors"
                          value={c.assignedSupplierId || ''}
                          onChange={(e) => handleAssignSupplier(c, e.target.value)}
                        >
                          <option value="">Store / Walk-in</option>
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.full_name || 'Supplier'}</option>
                          ))}
                        </select>
                     </div>
                     <div className="text-right pl-4 border-l border-[var(--border-color)]">
                       <div className="text-[9px] uppercase font-black opacity-50 mb-1">Debt Bal</div>
                       <div className={`font-black text-lg tracking-tight ${c.debtBalance > 0 ? 'text-danger' : 'text-success'}`}>
                         ₦{c.debtBalance.toLocaleString()}
                       </div>
                     </div>
                   </div>
                   
                   <button 
                     onClick={() => navigate(`/customers/${c.id}`)}
                     className="w-full sm:w-auto text-[11px] font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition-colors py-2 px-6 rounded-xl text-center"
                   >
                     View Full Profile
                   </button>
                </div>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 opacity-50 border border-dashed rounded-3xl border-[var(--border-color)] mt-4">
               <Users size={48} className="mx-auto mb-3 opacity-20" />
               <p className="font-bold text-sm">No Clients Found</p>
               <p className="text-xs mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;
