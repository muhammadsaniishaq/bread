import React, { useState, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, ClipboardList, Search, Filter, Package, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const T = {
  bg: '#f8f7ff', white: '#ffffff', primary: '#7c3aed', pLight: 'rgba(124,58,237,0.08)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)', rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)', blue: '#2563eb', blueL: 'rgba(37,99,235,0.10)',
  ink: '#1a0a3b', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '18px', shadow: '0 4px 20px rgba(124,58,237,0.08)',
};

const typeConfig = {
  Receive: { label: 'Stock Received',    color: T.emerald, bg: T.emeraldL, icon: Package },
  Return:  { label: 'Returned to Bakery',color: T.blue,    bg: T.blueL,   icon: ArrowDownRight },
  Other:   { label: 'System Action',     color: T.txt3,    bg: 'rgba(148,163,184,0.10)', icon: Activity },
};

const ManagerAuditHistory: React.FC = () => {
  const navigate = useNavigate();
  const { inventoryLogs, products } = useAppContext();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Receive' | 'Return'>('ALL');
  const [filterDate, setFilterDate] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    return [...inventoryLogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(log => {
        const pName = products.find(p => p.id === log.productId)?.name || '';
        const type = log.type || 'Receive';

        const matchSearch = !search ||
          pName.toLowerCase().includes(search.toLowerCase()) ||
          type.toLowerCase().includes(search.toLowerCase());

        const matchType = filterType === 'ALL' || type === filterType;

        const matchDate = filterDate === 'ALL' ? true
          : filterDate === 'TODAY' ? log.date.startsWith(todayStr)
          : filterDate === 'WEEK'  ? log.date >= weekAgo
          : log.date >= monthAgo;

        return matchSearch && matchType && matchDate;
      });
  }, [inventoryLogs, products, search, filterType, filterDate]);

  // Stats
  const totalReceived = inventoryLogs.filter(l => (l.type || 'Receive') === 'Receive').reduce((s, l) => s + l.quantityReceived, 0);
  const totalReturned = inventoryLogs.filter(l => l.type === 'Return').reduce((s, l) => s + l.quantityReceived, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = inventoryLogs.filter(l => l.date.startsWith(todayStr));

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 50%, #4c1d95 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: '230px', height: '230px', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={20} color="#c4b5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Audit History</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>Full inventory log with date filtering</p>
              </div>
            </div>

            {/* Stats row in header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Total Logs', value: inventoryLogs.length, color: '#c4b5fd' },
                { label: 'Units Received', value: totalReceived, color: '#6ee7b7' },
                { label: 'Today\'s Actions', value: todayLogs.length, color: '#fde68a' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '13px', color: T.txt3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or action type…"
              style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '13px', border: `1.5px solid rgba(124,58,237,0.12)`, background: T.white, fontSize: '13px', fontWeight: 600, color: T.ink, outlineColor: T.primary, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* Type filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <Filter size={13} color={T.txt3} style={{ alignSelf: 'center', flexShrink: 0 }} />
            {(['ALL', 'Receive', 'Return'] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                style={{ padding: '6px 12px', borderRadius: '9px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: filterType === f ? T.primary : T.white, color: filterType === f ? '#fff' : T.txt3, boxShadow: T.shadow, transition: 'all 0.2s' }}>
                {f === 'ALL' ? 'All Types' : f === 'Receive' ? '📦 Received' : '↩️ Returns'}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <Calendar size={13} color={T.txt3} style={{ alignSelf: 'center', flexShrink: 0 }} />
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(f => (
              <button key={f} onClick={() => setFilterDate(f)}
                style={{ padding: '6px 10px', borderRadius: '9px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: filterDate === f ? T.emerald : T.white, color: filterDate === f ? '#fff' : T.txt3, boxShadow: T.shadow, transition: 'all 0.2s' }}>
                {f === 'ALL' ? 'All Time' : f === 'TODAY' ? 'Today' : f === 'WEEK' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Returned summary card */}
          {totalReturned > 0 && (
            <div style={{ background: T.blueL, borderRadius: '14px', padding: '12px 14px', border: `1px solid ${T.blue}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: T.blue, textTransform: 'uppercase', marginBottom: '2px' }}>Total Units Returned to Bakery</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: T.ink }}>{totalReturned} units</div>
              </div>
              <ArrowDownRight size={28} color={T.blue} style={{ opacity: 0.4 }} />
            </div>
          )}

          {/* Results count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt3 }}>{filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found</span>
            {(filterType !== 'ALL' || filterDate !== 'ALL' || search) && (
              <button onClick={() => { setFilterType('ALL'); setFilterDate('ALL'); setSearch(''); }}
                style={{ fontSize: '11px', fontWeight: 700, color: T.rose, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* Log list */}
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.txt3, background: T.white, borderRadius: T.radius, border: `1px dashed ${T.borderL}` }}>
              <ClipboardList size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>No logs match your filters.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredLogs.map((log, i) => {
                const product = products.find(p => p.id === log.productId);
                const type = (log.type || 'Receive') as 'Receive' | 'Return';
                const cfg = typeConfig[type] ?? typeConfig.Other;
                const IconComp = cfg.icon;
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}
                    style={{ background: T.white, borderRadius: '16px', padding: '13px', boxShadow: T.shadow, border: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComp size={18} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product?.name || 'Unknown Product'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: cfg.color, background: cfg.bg, padding: '1px 6px', borderRadius: '4px' }}>{cfg.label}</span>
                        <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>
                          {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {log.storeKeeper && <div style={{ fontSize: '10px', color: T.txt3, marginTop: '2px', fontWeight: 600 }}>By: {log.storeKeeper}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: cfg.color }}>{log.quantityReceived}</div>
                      <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase' }}>units</div>
                      {log.costPrice > 0 && <div style={{ fontSize: '10px', color: T.txt2, fontWeight: 700, marginTop: '2px' }}>₦{log.costPrice.toLocaleString()}</div>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerAuditHistory;
