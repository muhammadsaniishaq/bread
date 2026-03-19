import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { Users, ArrowLeft, Search, UserPlus, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';

export const ManagerCustomers: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);

  const handleAssignSupplier = async (customer: Customer, newSupplierId: string) => {
    await updateCustomer({ ...customer, assignedSupplierId: newSupplierId });
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

        <div className="bg-gradient-to-br from-emerald-500/10 to-transparent p-5 rounded-2xl border border-[var(--border-color)] mb-6 shadow-sm flex items-center justify-between">
           <div>
             <h2 className="text-xs font-bold opacity-70 mb-1 uppercase tracking-wide">Total Market Debt</h2>
             <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₦{totalDebt.toLocaleString()}</div>
           </div>
           <div className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full text-xs">
             {customers.length} Clients
           </div>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="w-full bg-surface border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-sm font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center"
          >
            <UserPlus size={20} />
          </button>
        </div>

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
          {filteredCustomers.map(c => (
            <div key={c.id} className="bg-surface p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold shadow-sm text-lg border border-emerald-500/20">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg tracking-tight mb-0.5 flex items-center gap-2">
                    {c.name}
                    {c.assignedSupplierId && (
                       <span className="flex items-center gap-1 text-[9px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                         <Truck size={10} /> Routed
                       </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-60 font-medium">{c.phone || 'No phone'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end bg-black/5 dark:bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                 <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold opacity-60 mb-1">Route Assignment</label>
                    <select 
                      className="form-input py-1.5 text-xs bg-white dark:bg-black border-[var(--border-color)] font-medium shadow-sm w-[160px] cursor-pointer"
                      value={c.assignedSupplierId || ''}
                      onChange={(e) => handleAssignSupplier(c, e.target.value)}
                    >
                      <option value="">Unassigned (Store)</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.full_name || 'Unnamed Supplier'}</option>
                      ))}
                    </select>
                 </div>
                 <div className="text-right min-w-[80px]">
                   <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Debt Bal</div>
                   <div className={`font-black text-sm ${c.debtBalance > 0 ? 'text-danger' : 'text-success'}`}>
                     ₦{c.debtBalance.toLocaleString()}
                   </div>
                 </div>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="text-center p-8 opacity-50 font-medium text-sm border border-dashed rounded-xl">No clients found.</div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;
