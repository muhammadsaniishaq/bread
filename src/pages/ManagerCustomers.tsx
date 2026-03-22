import React, { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { Users, ArrowLeft, Search, UserPlus, Truck, Download, CheckSquare, Square, MessageCircle, Settings2, Clock, Zap, TrendingUp, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Routed' | 'Unassigned' | 'Debtors' | 'Active' | 'Dormant'>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'A-Z' | 'Debt' | 'VIP' | 'Recent'>('Newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; full_name: string }[]>([]);
  
  // Quick View Drawer State
  const [quickViewCustomerId, setQuickViewCustomerId] = useState<string | null>(null);
  const quickViewCustomer = useMemo(() => customers.find(c => c.id === quickViewCustomerId), [customers, quickViewCustomerId]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [pin, setPin] = useState('');
  
  // Edit Quick View State
  const [isEditingQuickView, setIsEditingQuickView] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editPin, setEditPin] = useState('');

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER');
    if (data) setSuppliers(data);
  };

  // Pre-calculate last active dates for all customers to avoid O(n*m) during render
  const customerActivity = useMemo(() => {
    const activityMap: Record<string, { lastDate: Date | null, daysSince: number }> = {};
    const now = new Date();
    
    customers.forEach(c => {
      const customerTxs = transactions.filter(t => t.customerId === c.id);
      if (customerTxs.length > 0) {
        const latestTx = customerTxs.reduce((latest, current) => 
          new Date(current.date) > new Date(latest.date) ? current : latest
        );
        const lastDate = new Date(latestTx.date);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        activityMap[c.id] = { lastDate, daysSince };
      } else {
        activityMap[c.id] = { lastDate: null, daysSince: 9999 };
      }
    });
    return activityMap;
  }, [customers, transactions]);

  let filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm));
    if (!matchesSearch) return false;
    
    const isDormant = customerActivity[c.id].daysSince > 30;
    
    if (filterType === 'Routed') return !!c.assignedSupplierId;
    if (filterType === 'Unassigned') return !c.assignedSupplierId;
    if (filterType === 'Debtors') return c.debtBalance > 0;
    if (filterType === 'Active') return !isDormant;
    if (filterType === 'Dormant') return isDormant;
    return true;
  });

  filteredCustomers = filteredCustomers.sort((a, b) => {
    if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
    if (sortBy === 'Debt') return (b.debtBalance || 0) - (a.debtBalance || 0);
    if (sortBy === 'VIP') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
    if (sortBy === 'Recent') return customerActivity[a.id].daysSince - customerActivity[b.id].daysSince;
    return Number(b.id) - Number(a.id); // Newest
  });

  const totalDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const unassignedCount = customers.length - routedCount;
  
  const activeCount = customers.filter(c => customerActivity[c.id].daysSince <= 30).length;
  const dormantCount = customers.length - activeCount;

  const pieData = [
    { name: 'Active (30d)', value: activeCount, color: '#34d399' }, // emerald-400
    { name: 'Dormant', value: dormantCount, color: '#fbbf24' },   // amber-400
  ];

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
      assignedSupplierId: selectedSupplierId || undefined,
      pin: pin || undefined
    });
    setName('');
    setPhone('');
    setPin('');
    setIsAdding(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !quickViewCustomer) return;
    
    await updateCustomer({
      ...quickViewCustomer,
      name: editName,
      phone: editPhone,
      assignedSupplierId: editSupplierId || undefined,
      pin: editPin || undefined
    });
    setIsEditingQuickView(false);
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

        <div className="bg-gradient-to-br from-emerald-600 via-teal-800 to-indigo-900 text-white p-6 md:p-8 rounded-3xl mb-8 shadow-xl relative overflow-hidden border border-emerald-500/20 flex flex-col lg:flex-row gap-8 lg:items-center">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
           <Users className="absolute right-4 bottom-4 opacity-[0.03]" size={160} />
           
           <div className="flex-1 relative z-10 w-full">
             <div className="flex justify-between items-start mb-6 border-b border-emerald-500/30 pb-4">
               <div>
                 <h2 className="text-[10px] font-black opacity-70 mb-1 uppercase tracking-widest text-emerald-200">Executive Directory</h2>
                 <div className="text-4xl font-black tracking-tight">{customers.length} <span className="text-xl font-bold opacity-80">Clients</span></div>
               </div>
               <div className="text-right">
                 <h2 className="text-[10px] font-black opacity-70 mb-1 uppercase tracking-widest text-emerald-200">Global Customer Debt</h2>
                 <div className="text-2xl font-black text-amber-300">₦{totalDebt.toLocaleString()}</div>
               </div>
             </div>
  
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner overflow-hidden relative group">
                   <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500"></div>
                   <div className="flex justify-between items-center mb-1 relative z-10">
                     <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Routed</span>
                     <Truck size={14} className="opacity-50" />
                   </div>
                   <div className="text-2xl font-black relative z-10">{routedCount}</div>
                   <div className="text-[10px] opacity-60 font-medium relative z-10">Assigned to Suppliers</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner overflow-hidden relative group">
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/10 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500"></div>
                   <div className="flex justify-between items-center mb-1 relative z-10">
                     <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Open Market</span>
                     <Users size={14} className="opacity-50" />
                   </div>
                   <div className="text-2xl font-black relative z-10">{unassignedCount}</div>
                   <div className="text-[10px] opacity-60 font-medium relative z-10">Unassigned / Store</div>
                </div>
             </div>
           </div>

           {/* Analytical Pie Chart for Engagement */}
           <div className="hidden lg:flex w-64 flex-col items-center justify-center relative z-10 border-l border-white/10 pl-8">
             <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">30-Day Engagement</h3>
             <div className="w-full h-32 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     innerRadius={40}
                     outerRadius={60}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     formatter={(value: any) => [`${value} Clients`, 'Count']}
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                     itemStyle={{ color: '#fff' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center Metric */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xl font-black">{Math.round((activeCount / Math.max(1, customers.length)) * 100)}%</span>
                 <span className="text-[8px] uppercase tracking-widest opacity-60 font-bold">Active</span>
               </div>
             </div>
             
             <div className="flex justify-center gap-4 text-[10px] font-bold mt-2 w-full">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{backgroundColor: pieData[0].color}}></div>Active</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{backgroundColor: pieData[1].color}}></div>Dormant</div>
             </div>
           </div>
        </div>
        
        {/* AI Action Insights Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-surface p-4 rounded-3xl border border-[var(--border-color)] shadow-sm flex items-start gap-3 group hover:border-emerald-500/50 transition-all cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><TrendingUp size={18} /></div>
             <div>
               <h4 className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-0.5">Growth Engine</h4>
               <p className="text-sm font-bold leading-tight">{activeCount} clients have engaged inside 30 days. Outstanding loyalty.</p>
             </div>
           </div>
           
           <div className="bg-surface p-4 rounded-3xl border border-[var(--border-color)] shadow-sm flex items-start gap-3 group hover:border-amber-500/50 transition-all cursor-pointer" onClick={() => setFilterType('Dormant')}>
             <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><AlertTriangle size={18} /></div>
             <div>
               <h4 className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-0.5">Retention Risk</h4>
               <p className="text-sm font-bold leading-tight">{dormantCount} clients are dormant. <span className="text-amber-600">Click to filter & follow up.</span></p>
             </div>
           </div>
           
           <div className="bg-surface p-4 rounded-3xl border border-[var(--border-color)] shadow-sm flex items-start gap-3 group hover:border-indigo-500/50 transition-all cursor-pointer" onClick={() => setFilterType('Debtors')}>
             <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Zap size={18} /></div>
             <div>
               <h4 className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-0.5">Liquidity Opportunity</h4>
               <p className="text-sm font-bold leading-tight">₦{totalDebt.toLocaleString()} total uncollected debt. Prioritize top 10% debtors.</p>
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
            {(['All', 'Routed', 'Unassigned', 'Debtors', 'Active', 'Dormant'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-black whitespace-nowrap border transition-all ${filterType === f ? 'bg-primary text-white border-primary shadow-md transform -translate-y-0.5' : 'bg-surface text-secondary border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5'}`}
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
                 className="w-full bg-surface border border-[var(--border-color)] rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary font-bold shadow-sm"
               >
                 <option value="Newest">Sort: By Registry</option>
                 <option value="Recent">Sort: Last Active</option>
                 <option value="A-Z">Sort: A-Z Name</option>
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
                <input type="text" maxLength={4} className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium font-mono tracking-widest" placeholder="Assign Login PIN (Optional 4 Digits)" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
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

        <motion.div 
          className="grid gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {filteredCustomers.map(c => {
            const loyaltyScore = c.loyaltyPoints || 0;
            const isVIP = loyaltyScore > 100;
            const isSelected = selectedIds.includes(c.id);
            
            return (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                key={c.id} 
                className={`bg-surface p-5 rounded-3xl border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5 transition-all group cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-[var(--border-color)] hover:border-emerald-500/40 hover:shadow-md'}`}
                onClick={(e) => {
                  // If clicking on selects or buttons inside, don't open quick view
                  if ((e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('button, a')) return;
                  setQuickViewCustomerId(c.id);
                  setEditName(c.name);
                  setEditPhone(c.phone || '');
                  setEditSupplierId(c.assignedSupplierId || '');
                  setEditPin(c.pin || '');
                  setIsEditingQuickView(false);
                }}
              >
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
                      {isVIP && <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-bold shadow-sm">VIP</span>}
                      {customerActivity[c.id].daysSince <= 7 && <span className="text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black shrink-0">Hot</span>}
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
                         <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20 shrink-0">
                           <Truck size={10} /> {suppliers.find(s => s.id === c.assignedSupplierId)?.full_name || 'Routed'}
                         </span>
                      ) : (
                         <span className="flex items-center gap-1 bg-zinc-500/10 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-500/20 shrink-0">
                           <Users size={10} /> Open Market
                         </span>
                      )}
                      
                      {/* Activity Indicator based on daysSince */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] shrink-0 ${
                        customerActivity[c.id].daysSince === 9999 ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700' :
                        customerActivity[c.id].daysSince <= 30 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                         <Clock size={10} /> 
                         {customerActivity[c.id].daysSince === 9999 ? 'No Activity' : 
                          customerActivity[c.id].daysSince === 0 ? 'Active Today' :
                          `${customerActivity[c.id].daysSince}d ago`}
                      </span>
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
              </motion.div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 opacity-50 border border-dashed rounded-3xl border-[var(--border-color)] mt-4">
               <Users size={48} className="mx-auto mb-3 opacity-20" />
               <p className="font-bold text-sm">No Clients Found</p>
               <p className="text-xs mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </motion.div>
        
        {/* Full-Screen CRM Quick View Drawer */}
        <AnimatePresence>
          {quickViewCustomer && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                onClick={() => setQuickViewCustomerId(null)}
              />
              <motion.div 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface border-l border-[var(--border-color)] shadow-2xl z-[100] flex flex-col overflow-hidden"
              >
                <div className="bg-gradient-to-br from-primary via-blue-800 to-indigo-900 p-8 rounded-bl-[40px] text-white relative shadow-lg shrink-0">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                  <button 
                    onClick={() => setQuickViewCustomerId(null)}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  
                  <div className="w-20 h-20 bg-white/10 border border-white/20 text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner mb-4 backdrop-blur-md">
                    {quickViewCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">{quickViewCustomer.name}</h2>
                  <div className="flex gap-2 text-xs font-bold opacity-80 uppercase tracking-widest mb-3">
                    <span>{quickViewCustomer.phone || 'No Phone'}</span>
                    <span>•</span>
                    <span>{quickViewCustomer.location || 'No Loc'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 group">
                     {quickViewCustomer.pin ? (
                        <span className="bg-emerald-500/20 text-emerald-100 text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase shadow-sm border border-emerald-400">
                          Auth: Enabled
                        </span>
                     ) : (
                        <span className="bg-white/5 text-white/80 text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase border border-white/20">
                          Auth: Disabled
                        </span>
                     )}
                     <button 
                       onClick={() => setIsEditingQuickView(!isEditingQuickView)}
                       className="text-[10px] uppercase font-black tracking-widest bg-white/10 hover:bg-white/20 transition-colors px-3 py-1 rounded-full border border-white/20"
                     >
                       {isEditingQuickView ? 'Cancel Editing' : 'Edit Profile & Security'}
                     </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                  {isEditingQuickView ? (
                    <form onSubmit={handleEdit} className="space-y-4 animate-in fade-in">
                      <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-5 mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 text-indigo-400"><Zap size={14} /> Security & Access</h3>
                        <p className="text-[10px] font-bold opacity-70 mb-4 leading-tight">Assigning a PIN to this customer will allow them to login to the Customer Web App to manage orders natively.</p>
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block">Login PIN (4 Digits)</label>
                        <input type="text" maxLength={4} className="w-full bg-surface border border-[var(--border-color)] focus:border-indigo-500 text-primary font-mono tracking-widest rounded-xl p-3 text-sm font-black transition-colors outline-none" placeholder="Set 4-Digit Login PIN" value={editPin} onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))} />
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block">Full Name</label>
                          <input type="text" className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" value={editName} onChange={e => setEditName(e.target.value)} required />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block">Phone Number</label>
                          <input type="tel" className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block">Routed Supplier Override</label>
                          <select className="w-full bg-black/5 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" value={editSupplierId} onChange={e => setEditSupplierId(e.target.value)}>
                            <option value="">Unassigned (Walk-in / Open Market)</option>
                            {suppliers.map(sup => (
                              <option key={sup.id} value={sup.id}>{sup.full_name || 'Unnamed Supplier'}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="pt-4 mt-2 border-t border-[var(--border-color)]">
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl border-none font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all">
                          Save & Update Client Profile
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-[var(--border-color)]">
                      <div className="text-[10px] uppercase font-black opacity-50 tracking-widest mb-1">Status</div>
                      <div className="font-bold text-sm">
                        {customerActivity[quickViewCustomer.id].daysSince <= 30 ? '🟢 Active' : '🟠 Dormant'}
                      </div>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-[var(--border-color)]">
                      <div className="text-[10px] uppercase font-black opacity-50 tracking-widest mb-1">Loyalty Points</div>
                      <div className="font-bold text-sm text-yellow-600 dark:text-yellow-400">
                        ★ {quickViewCustomer.loyaltyPoints || 0} PTS
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-danger/10 text-danger-color border border-danger/20 rounded-3xl p-6 relative overflow-hidden">
                    <Zap className="absolute right-0 bottom-0 opacity-10 -translate-y-1/4 translate-x-1/4" size={100} />
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Current Active Debt</div>
                    <div className="text-4xl font-black tracking-tight mb-2">₦{quickViewCustomer.debtBalance.toLocaleString()}</div>
                    {quickViewCustomer.debtBalance > 0 && (
                       <div className="w-full bg-danger/20 rounded-full h-1.5 mt-4">
                          <div className="bg-danger h-1.5 rounded-full" style={{width: '75%'}}></div>
                       </div>
                    )}
                  </div>
                  
                  {quickViewCustomer.notes && (
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Operational Notes</h3>
                      <p className="text-sm font-medium bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-[var(--border-color)]">{quickViewCustomer.notes}</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => navigate(`/customers/${quickViewCustomer.id}`)}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-black shadow-md flex items-center justify-center gap-2 transition-all group mt-8"
                  >
                    Open Full Profile & Ledger
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default ManagerCustomers;
