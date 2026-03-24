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
     <div className="px-4 pb-28 bg-gradient-to-b from-gray-50 to-white min-h-screen">

  {/* HEADER */}
  <div className="flex items-center gap-3 mb-6 pt-2">
    <button
      onClick={() => navigate(-1)}
      className="w-11 h-11 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center"
    >
      <ArrowLeft size={18} />
    </button>

    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
      <Users className="text-indigo-600" />
      Customer Base
    </h1>
  </div>

  {/* HERO */}
  <div className="relative rounded-[28px] p-6 mb-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-xl overflow-hidden">

    <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

    <div className="flex justify-between items-start mb-6">
      <div>
        <p className="text-xs opacity-70 font-semibold uppercase tracking-widest">
          Clients
        </p>
        <h2 className="text-4xl font-black tracking-tight">
          {customers.length}
        </h2>
      </div>

      <div className="text-right">
        <p className="text-xs opacity-70 font-semibold uppercase tracking-widest">
          Total Debt
        </p>
        <h2 className="text-xl font-black text-amber-300">
          ₦{totalDebt.toLocaleString()}
        </h2>
      </div>
    </div>

    <div className="flex gap-4">
      <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        <p className="text-xs opacity-70">Routed</p>
        <p className="text-2xl font-black">{routedCount}</p>
      </div>

      <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        <p className="text-xs opacity-70">Open Market</p>
        <p className="text-2xl font-black">{unassignedCount}</p>
      </div>
    </div>
  </div>

  {/* SEARCH */}
  <div className="relative mb-5">
    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />
    <input
      className="w-full bg-white/90 backdrop-blur-md rounded-2xl py-3 pl-12 pr-4 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
      placeholder="Search clients..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* FILTERS */}
  <div className="flex gap-2 overflow-x-auto mb-5">
    {['All','Routed','Unassigned','Debtors'].map(f => (
      <button
        key={f}
        onClick={() => setFilterType(f as any)}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
          filterType === f
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-white text-gray-600 border border-gray-200"
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
          className={`bg-white/90 backdrop-blur-md p-4 rounded-3xl border shadow-md transition-all ${
            isSelected
              ? "border-indigo-500 ring-2 ring-indigo-100"
              : "border-gray-100"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">

            <button onClick={() => toggleSelection(c.id)}>
              {isSelected
                ? <CheckSquare size={20} className="text-indigo-600"/>
                : <Square size={20} className="text-gray-300"/>
              }
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shadow">
              {c.name.charAt(0)}
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.phone || "No phone"}
              </p>
            </div>

            {c.debtBalance > 0 && (
              <p className="text-sm font-black text-red-500">
                ₦{c.debtBalance.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <select
              className="text-xs bg-gray-100 rounded-xl px-3 py-2 font-semibold"
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
              className="text-xs font-bold text-indigo-600"
            >
              View →
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