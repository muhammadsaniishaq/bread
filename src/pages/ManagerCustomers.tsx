import React, { useState, useMemo, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import {
  Users, ArrowLeft, Search, UserPlus, Truck, Download,
  CheckSquare, Square, MessageCircle, Settings2, Zap,
  X, ChevronRight, History, CreditCard, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { motion, AnimatePresence } from 'framer-motion';

export const ManagerCustomers: React.FC = () => {
  const { customers, transactions, addCustomer, updateCustomer, recordDebtPayment } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Routed' | 'Unassigned' | 'Debtors' | 'Active' | 'Dormant'>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'A-Z' | 'Debt' | 'VIP'>('Newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; full_name: string }[]>([]);

  // Add Client Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [pin, setPin] = useState('');

  // CRM Drawer
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const quickViewCustomer = useMemo(() => customers.find(c => c.id === quickViewId), [customers, quickViewId]);
  const [drawerTab, setDrawerTab] = useState<'profile' | 'ledger' | 'activity'>('profile');

  // Drawer Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editPin, setEditPin] = useState('');

  // Ledger
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Transfer'>('Cash');

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('role', 'SUPPLIER')
      .then(({ data }) => { if (data) setSuppliers(data); });
  }, []);

  // ── Activity Map ──
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    customers.forEach(c => {
      const txs = transactions.filter(t => t.customerId === c.id);
      if (txs.length > 0) {
        const latest = txs.reduce((a, b) => new Date(b.date) > new Date(a.date) ? b : a);
        map[c.id] = Math.floor((now - new Date(latest.date).getTime()) / 86400000);
      } else {
        map[c.id] = 9999;
      }
    });
    return map;
  }, [customers, transactions]);

  // ── Filter & Sort ──
  const filteredCustomers = useMemo(() => {
    let list = customers.filter(c => {
      const q = searchTerm.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(searchTerm));
      if (!match) return false;
      if (filterType === 'Routed') return !!c.assignedSupplierId;
      if (filterType === 'Unassigned') return !c.assignedSupplierId;
      if (filterType === 'Debtors') return c.debtBalance > 0;
      if (filterType === 'Active') return activityMap[c.id] <= 30;
      if (filterType === 'Dormant') return activityMap[c.id] > 30;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
      if (sortBy === 'Debt') return (b.debtBalance || 0) - (a.debtBalance || 0);
      if (sortBy === 'VIP') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      return Number(b.id) - Number(a.id);
    });

    return list;
  }, [customers, searchTerm, filterType, sortBy, activityMap]);

  // ── Stats ──
  const totalDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
  const routedCount = customers.filter(c => c.assignedSupplierId).length;
  const debtorCount = customers.filter(c => c.debtBalance > 0).length;

  // ── Actions ──
  const toggleSelection = (id: string) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleAssign = async (c: Customer, sid: string) => {
    await updateCustomer({ ...c, assignedSupplierId: sid || undefined });
  };

  const bulkAssign = async (sid: string) => {
    for (const id of selectedIds) {
      const c = customers.find(x => x.id === id);
      if (c) await updateCustomer({ ...c, assignedSupplierId: sid || undefined });
    }
    setSelectedIds([]);
  };

  const exportCSV = () => {
    const rows = (selectedIds.length > 0 ? customers.filter(c => selectedIds.includes(c.id)) : filteredCustomers);
    const csv = "data:text/csv;charset=utf-8,"
      + ["Name,Phone,Debt,Loyalty,Route"]
        .concat(rows.map(c => `${c.name},${c.phone || ''},${c.debtBalance},${c.loyaltyPoints || 0},${suppliers.find(s => s.id === c.assignedSupplierId)?.full_name || 'Store'}`))
        .join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `customers_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addCustomer({
      id: Date.now().toString(), name, phone, location: '', notes: '',
      debtBalance: 0, loyaltyPoints: 0,
      assignedSupplierId: selectedSupplierId || undefined,
      pin: pin || undefined
    });
    setName(''); setPhone(''); setPin(''); setSelectedSupplierId(''); setIsAdding(false);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !quickViewCustomer) return;
    await updateCustomer({
      ...quickViewCustomer, name: editName, phone: editPhone,
      assignedSupplierId: editSupplierId || undefined, pin: editPin || undefined
    });
    setIsEditing(false);
  };

  const handleDebtPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || !quickViewId) return;
    const amt = Number(payAmount);
    if (amt <= 0) return;
    await recordDebtPayment({
      id: Date.now().toString(), date: new Date().toISOString(),
      customerId: quickViewId, amount: amt, method: payMethod
    });
    setPayAmount('');
  };

  const openDrawer = (c: Customer) => {
    setQuickViewId(c.id);
    setEditName(c.name); setEditPhone(c.phone || '');
    setEditSupplierId(c.assignedSupplierId || ''); setEditPin(c.pin || '');
    setIsEditing(false); setDrawerTab('profile');
  };

  // ── Activity badge helper ──
  const actBadge = (days: number) => {
    if (days === 9999) return { text: 'No Activity', cls: 'bg-gray-100 text-gray-500' };
    if (days === 0)    return { text: 'Active Today', cls: 'bg-emerald-50 text-emerald-600' };
    if (days <= 7)     return { text: 'Hot 🔥', cls: 'bg-orange-50 text-orange-600' };
    if (days <= 30)    return { text: `${days}d ago`, cls: 'bg-blue-50 text-blue-600' };
    return { text: 'Dormant', cls: 'bg-amber-50 text-amber-600' };
  };

  return (
    <AnimatedPage>
      <div className="px-4 pb-28 bg-gradient-to-b from-gray-50 to-white min-h-screen">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg transition-all">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600" /> Customer Base
          </h1>
        </div>

        {/* ═══ HERO STATS ═══ */}
        <div className="relative rounded-[28px] p-6 mb-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-xl overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Total Clients</p>
              <h2 className="text-4xl font-black tracking-tight">{customers.length}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Outstanding Debt</p>
              <h2 className="text-xl font-black text-amber-300">₦{totalDebt.toLocaleString()}</h2>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Routed</p>
              <p className="text-2xl font-black">{routedCount}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Open Market</p>
              <p className="text-2xl font-black">{customers.length - routedCount}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Debtors</p>
              <p className="text-2xl font-black text-amber-300">{debtorCount}</p>
            </div>
          </div>
        </div>

        {/* ═══ SEARCH + ADD ═══ */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-white/90 backdrop-blur-md rounded-2xl py-3 pl-12 pr-4 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-md hover:bg-indigo-500 transition-all flex items-center gap-2 font-bold text-sm whitespace-nowrap hover:-translate-y-0.5">
            <UserPlus size={18} /> Add
          </button>
          <button onClick={exportCSV}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-1 font-bold text-xs whitespace-nowrap hover:-translate-y-0.5">
            <Download size={16} />
          </button>
        </div>

        {/* ═══ ADD CLIENT FORM ═══ */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
              onSubmit={handleAdd}
              className="bg-white rounded-3xl border border-gray-100 shadow-lg p-5 mb-6 overflow-hidden"
            >
              <h3 className="text-sm font-black mb-4 flex items-center gap-2"><UserPlus size={16} className="text-indigo-600" /> Register New Client</h3>
              <div className="grid gap-3">
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100" />
                <input type="tel" placeholder="Phone Number (Optional)" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100" />
                <input type="text" maxLength={4} placeholder="Login PIN (4 Digits)" value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100" />
                <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-100">
                  <option value="">Unassigned (Store)</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <button type="submit" className="bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-500 transition-colors">Save Client</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ═══ FILTERS + SORT ═══ */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex gap-2 overflow-x-auto flex-1 pb-1">
            {(['All','Routed','Unassigned','Debtors','Active','Dormant'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  filterType === f
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <Settings2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Newest">Newest</option>
              <option value="A-Z">A → Z</option>
              <option value="Debt">Highest Debt</option>
              <option value="VIP">Top VIP</option>
            </select>
          </div>
        </div>

        {/* ═══ BULK ACTIONS BANNER ═══ */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-indigo-600 text-white p-3 rounded-2xl mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3 sticky top-4 z-50">
              <span className="font-bold text-sm flex items-center gap-2"><CheckSquare size={16} /> {selectedIds.length} Selected</span>
              <div className="flex items-center gap-2">
                <select onChange={e => bulkAssign(e.target.value)} value=""
                  className="bg-indigo-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold border-none outline-none">
                  <option value="" disabled>Bulk Route...</option>
                  <option value="">Unassign</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <button onClick={() => setSelectedIds([])} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Clear</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CUSTOMER LIST ═══ */}
        <motion.div className="space-y-4"
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}>

          {filteredCustomers.map(c => {
            const isSelected = selectedIds.includes(c.id);
            const isVIP = (c.loyaltyPoints || 0) > 100;
            const badge = actBadge(activityMap[c.id]);

            return (
              <motion.div key={c.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                className={`bg-white/90 backdrop-blur-md p-4 rounded-3xl border shadow-sm transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100'
                }`}
                onClick={e => {
                  if ((e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('button, a, select')) return;
                  openDrawer(c);
                }}
              >
                {/* Row 1: Avatar + Info */}
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={e => { e.stopPropagation(); toggleSelection(c.id); }}>
                    {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} className="text-gray-300" />}
                  </button>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow text-white ${
                    isVIP ? 'bg-gradient-to-br from-amber-400 to-yellow-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                  }`}>
                    {c.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 truncate">{c.name}</p>
                      {isVIP && <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">VIP</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {c.phone ? (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-emerald-600 flex items-center gap-1 hover:underline">
                          <MessageCircle size={10} /> {c.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No phone</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
                    </div>
                  </div>

                  {c.debtBalance > 0 && (
                    <p className="text-sm font-black text-red-500 shrink-0">₦{c.debtBalance.toLocaleString()}</p>
                  )}
                </div>

                {/* Row 2: Route + View */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Truck size={12} className="text-gray-400" />
                    <select onClick={e => e.stopPropagation()}
                      className="text-xs bg-gray-50 rounded-xl px-3 py-2 font-semibold border border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={c.assignedSupplierId || ''} onChange={e => handleAssign(c, e.target.value)}>
                      <option value="">Store</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                    View <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-16 opacity-50">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm">No Clients Found</p>
              <p className="text-xs mt-1">Adjust your search or filters.</p>
            </div>
          )}
        </motion.div>

        {/* ═══ CRM QUICK VIEW DRAWER ═══ */}
        <AnimatePresence>
          {quickViewCustomer && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                onClick={() => setQuickViewId(null)} />

              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[100] flex flex-col overflow-hidden shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 pb-8 rounded-bl-[32px] text-white relative shrink-0">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                  <button onClick={() => setQuickViewId(null)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <X size={16} />
                  </button>

                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-2xl font-black mb-3 backdrop-blur-md">
                    {quickViewCustomer.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{quickViewCustomer.name}</h2>
                  <p className="text-xs opacity-70 font-bold uppercase tracking-widest mt-1">
                    {quickViewCustomer.phone || 'No Phone'} • {quickViewCustomer.location || 'No Location'}
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {quickViewCustomer.pin ? (
                      <span className="bg-emerald-500/20 text-emerald-100 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-400/30">Auth: ON</span>
                    ) : (
                      <span className="bg-white/5 text-white/70 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/10">Auth: OFF</span>
                    )}
                    <button onClick={() => setIsEditing(!isEditing)}
                      className="text-[10px] uppercase font-black tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/10 transition-colors">
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="flex border-b border-gray-100 shrink-0">
                  {([
                    { key: 'profile' as const, label: 'Profile', icon: ShieldCheck, color: 'indigo' },
                    { key: 'ledger' as const, label: 'Ledger', icon: CreditCard, color: 'amber' },
                    { key: 'activity' as const, label: 'Activity', icon: History, color: 'blue' },
                  ]).map(tab => (
                    <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                        drawerTab === tab.key
                          ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50`
                          : 'border-transparent text-gray-400 hover:bg-gray-50'
                      }`}>
                      <tab.icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Drawer Body */}
                <div className="p-5 overflow-y-auto flex-1">

                  {/* ── PROFILE TAB ── */}
                  {drawerTab === 'profile' && (
                    <div className="space-y-5">
                      {isEditing ? (
                        <form onSubmit={handleEditSave} className="space-y-4">
                          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-indigo-600 flex items-center gap-1"><Zap size={12} /> Security</h3>
                            <input type="text" maxLength={4} placeholder="4-Digit Login PIN"
                              value={editPin} onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white rounded-xl p-3 text-sm font-mono tracking-widest font-bold outline-none border border-indigo-100 focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <input type="text" placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} required
                            className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-gray-100 focus:ring-2 focus:ring-indigo-500" />
                          <input type="tel" placeholder="Phone" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-gray-100 focus:ring-2 focus:ring-indigo-500" />
                          <select value={editSupplierId} onChange={e => setEditSupplierId(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl p-3 text-sm font-bold outline-none border border-gray-100 focus:ring-2 focus:ring-indigo-500">
                            <option value="">Unassigned</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                          </select>
                          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-500 transition-colors">
                            Save Changes
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                              <p className="font-bold text-sm">{activityMap[quickViewCustomer.id] <= 30 ? '🟢 Active' : '🟠 Dormant'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Loyalty</p>
                              <p className="font-bold text-sm text-amber-600">★ {quickViewCustomer.loyaltyPoints || 0} PTS</p>
                            </div>
                          </div>
                          {quickViewCustomer.notes && (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                              <p className="text-sm font-medium">{quickViewCustomer.notes}</p>
                            </div>
                          )}
                          <button onClick={() => navigate(`/customers/${quickViewCustomer.id}`)}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors">
                            Open Full Profile <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── LEDGER TAB ── */}
                  {drawerTab === 'ledger' && (
                    <div className="space-y-5">
                      <div className={`text-white rounded-3xl p-5 relative overflow-hidden shadow-lg ${
                        quickViewCustomer.debtBalance > 0 ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                      }`}>
                        <Zap className="absolute right-0 bottom-0 opacity-10" size={100} />
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Active Debt</p>
                        <p className="text-3xl font-black">₦{quickViewCustomer.debtBalance.toLocaleString()}</p>
                        {quickViewCustomer.debtBalance === 0 && (
                          <p className="text-xs font-bold bg-black/20 inline-block px-3 py-1 rounded-full mt-2">Fully Cleared ✓</p>
                        )}
                      </div>

                      {quickViewCustomer.debtBalance > 0 && (
                        <form onSubmit={handleDebtPay} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4">
                          <h3 className="text-sm font-black flex items-center gap-2"><CreditCard size={16} className="text-emerald-500" /> Settle Payment</h3>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">₦</span>
                            <input type="number" max={quickViewCustomer.debtBalance} placeholder="0"
                              value={payAmount} onChange={e => setPayAmount(e.target.value)} required
                              className="w-full bg-white rounded-xl p-3 pl-8 text-lg font-black text-emerald-600 outline-none border border-gray-100 focus:ring-2 focus:ring-emerald-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setPayMethod('Cash')}
                              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${payMethod === 'Cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 text-gray-500'}`}>Cash</button>
                            <button type="button" onClick={() => setPayMethod('Transfer')}
                              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${payMethod === 'Transfer' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 text-gray-500'}`}>Transfer</button>
                          </div>
                          <button type="submit" className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                            <ShieldCheck size={16} /> Confirm Payment
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ── ACTIVITY TAB ── */}
                  {drawerTab === 'activity' && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Recent Transactions</h3>
                      {transactions.filter(t => t.customerId === quickViewCustomer.id).length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                          <History size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="font-bold text-sm">No History</p>
                        </div>
                      ) : (
                        transactions
                          .filter(t => t.customerId === quickViewCustomer.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 10)
                          .map(tx => (
                            <div key={tx.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-100/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">
                                  {tx.items?.reduce((a, p) => a + p.quantity, 0) || tx.quantity || 1}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Order</p>
                                  <p className="text-[10px] font-bold text-gray-400">
                                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-sm">₦{(tx.totalPrice || 0).toLocaleString()}</p>
                                <p className={`text-[10px] font-black uppercase ${tx.type === 'Cash' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.type}</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
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