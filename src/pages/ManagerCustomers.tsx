import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { Users, ArrowLeft, Search, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';

export const ManagerCustomers: React.FC = () => {
  const { customers, updateCustomer } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Routed' | 'Unassigned' | 'Debtors'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'SUPPLIER');

    if (data) setSuppliers(data);
  };

  // FILTER LOGIC
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const match =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));

      if (!match) return false;

      if (filterType === 'Routed') return !!c.assignedSupplierId;
      if (filterType === 'Unassigned') return !c.assignedSupplierId;
      if (filterType === 'Debtors') return c.debtBalance > 0;

      return true;
    });
  }, [customers, searchTerm, filterType]);

  // STATS
  const totalDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const unassignedCount = customers.length - routedCount;

  // ACTIONS
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleAssignSupplier = async (customer: Customer, supplierId: string) => {
    await updateCustomer({
      ...customer,
      assignedSupplierId: supplierId || undefined
    });
  };

  return (
    <AnimatedPage>
      <div className="px-4 pb-24">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full shadow border flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-indigo-600" />
            Customer Base
          </h1>
        </div>

        {/* HERO */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-3xl mb-6 shadow-lg">
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-xs opacity-70">Clients</p>
              <h2 className="text-3xl font-bold">{customers.length}</h2>
            </div>

            <div className="text-right">
              <p className="text-xs opacity-70">Total Debt</p>
              <h2 className="text-lg font-bold text-amber-300">
                ₦{totalDebt.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 p-4 rounded-xl">
              <p className="text-xs">Routed</p>
              <p className="text-lg font-bold">{routedCount}</p>
            </div>

            <div className="flex-1 bg-white/10 p-4 rounded-xl">
              <p className="text-xs">Open Market</p>
              <p className="text-lg font-bold">{unassignedCount}</p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 overflow-x-auto mb-4">
          {['All','Routed','Unassigned','Debtors'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${
                filterType === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {filteredCustomers.map(c => {
            const isSelected = selectedIds.includes(c.id);

            return (
              <div
                key={c.id}
                className={`bg-white p-4 rounded-2xl border shadow-sm ${
                  isSelected ? "border-indigo-500" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">

                  <button onClick={() => toggleSelection(c.id)}>
                    {isSelected ? <CheckSquare size={20}/> : <Square size={20}/>}
                  </button>

                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                    {c.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.phone || "No phone"}
                    </p>
                  </div>

                  {c.debtBalance > 0 && (
                    <p className="text-sm font-bold text-red-500">
                      ₦{c.debtBalance.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <select
                    className="bg-gray-100 px-3 py-2 rounded-lg text-xs"
                    value={c.assignedSupplierId || ""}
                    onChange={(e) => handleAssignSupplier(c, e.target.value)}
                  >
                    <option value="">Store</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="text-indigo-600 text-xs font-semibold"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;