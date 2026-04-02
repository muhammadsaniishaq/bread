import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Search, Filter, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import StoreBottomNav from '../components/StoreBottomNav';

const T = {
  bg: '#f4f8ff', white: '#ffffff', primary: '#2563eb', pLight: 'rgba(37,99,235,0.09)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)',
  rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)',
  ink: '#0f1c3f', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '20px', shadow: '0 4px 20px rgba(37,99,235,0.08)',
};
const fmt = (v: number) => `₦${v.toLocaleString()}`;

const StoreRecords: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, customers, products } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Cash' | 'Debt'>('ALL');
  const [filterDate, setFilterDate] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  const getCustomer = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in';
  const getProductNames = (tx: typeof transactions[0]) => {
    if (tx.items && tx.items.length > 0) {
      return tx.items.map(item => {
        const p = products.find(p => p.id === item.productId);
        return `${p?.name || 'Item'} ×${item.quantity}`;
      }).join(', ');
    }
    if (tx.productId) {
      return `${products.find(p => p.id === tx.productId)?.name || 'Item'} ×${tx.quantity || 1}`;
    }
    return 'Sale';
  };

  const now = new Date();
  const todayStr  = now.toISOString().split('T')[0];
  const weekAgo   = new Date(now.getTime() - 7  * 86400000).toISOString();
  const monthAgo  = new Date(now.getTime() - 30 * 86400000).toISOString();

  const filtered = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(tx => {
      const matchType = filterType === 'ALL' || tx.type === filterType;
      const matchDate = filterDate === 'TODAY' ? tx.date.startsWith(todayStr)
        : filterDate === 'WEEK'  ? tx.date >= weekAgo
        : filterDate === 'MONTH' ? tx.date >= monthAgo : true;
      const name = getCustomer(tx.customerId);
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchDate && matchSearch;
    });

  const totalFiltered = filtered.reduce((s, t) => s + t.totalPrice, 0);
  const cashFiltered  = filtered.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
  const debtFiltered  = filtered.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '100px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '18px' }}>
              <ArrowLeft size={14} /> Dashboard
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={20} color="#93c5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Dispatch Records</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} matching</p>
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: 'Total', value: fmt(totalFiltered), color: '#93c5fd' },
                { label: 'Cash',  value: fmt(cashFiltered),  color: '#6ee7b7' },
                { label: 'Debt',  value: fmt(debtFiltered),  color: '#fca5a5' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '9px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '13px', color: 'rgba(255,255,255,0.5)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer…"
                style={{ width: '100%', padding: '11px 12px 11px 35px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Date filter */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Calendar size={13} color={T.txt3} style={{ flexShrink: 0 }} />
            {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map(f => (
              <button key={f} onClick={() => setFilterDate(f)}
                style={{ padding: '6px 11px', borderRadius: '9px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: filterDate === f ? T.primary : T.white, color: filterDate === f ? '#fff' : T.txt3, boxShadow: T.shadow, transition: 'all 0.2s' }}>
                {f === 'TODAY' ? 'Today' : f === 'WEEK' ? '7 Days' : f === 'MONTH' ? '30 Days' : 'All'}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Filter size={13} color={T.txt3} style={{ flexShrink: 0 }} />
            {(['ALL', 'Cash', 'Debt'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                style={{ padding: '6px 11px', borderRadius: '9px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: filterType === f ? (f === 'Cash' ? T.emerald : f === 'Debt' ? T.rose : T.primary) : T.white, color: filterType === f ? '#fff' : T.txt3, boxShadow: T.shadow, transition: 'all 0.2s' }}>
                {f === 'ALL' ? '📋 All' : f === 'Cash' ? '💵 Cash' : '📒 Debt'}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: T.txt3, background: T.white, borderRadius: T.radius, border: `1px dashed ${T.borderL}` }}>
              <ClipboardList size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>No records match your filters.</div>
            </div>
          ) : filtered.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ background: T.white, borderRadius: '16px', padding: '13px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                {/* Avatar */}
                <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: tx.type === 'Cash' ? T.emeraldL : T.roseL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: tx.type === 'Cash' ? T.emerald : T.rose, flexShrink: 0 }}>
                  {getCustomer(tx.customerId).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{getCustomer(tx.customerId)}</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{fmt(tx.totalPrice)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{getProductNames(tx)}</div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', background: tx.type === 'Cash' ? T.emeraldL : T.roseL, color: tx.type === 'Cash' ? T.emerald : T.rose }}>{tx.type}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, marginTop: '3px' }}>
                    {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* View receipt link */}
          {filtered.length > 0 && (
            <button onClick={() => navigate('/sales')} style={{ padding: '13px', borderRadius: '14px', background: T.pLight, border: `1px solid rgba(37,99,235,0.15)`, color: T.primary, fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Open POS to Record New Sale <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
      <StoreBottomNav />
    </AnimatedPage>
  );
};

export default StoreRecords;
