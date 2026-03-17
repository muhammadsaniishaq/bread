import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { 
  BarChart2, TrendingUp, TrendingDown, ShoppingBag, CreditCard, 
  Package, Receipt, Search, ChevronRight, 
  Wallet, Users, AlertTriangle, RefreshCw, Download
} from 'lucide-react';

type Period = 'Today' | 'Week' | 'Month' | 'All';
type Tab = 'overview' | 'transactions' | 'products';

const fmt = (n: number) => `₦${n.toLocaleString()}`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─────────── Reusable Stat Card ────────────
const StatCard = ({ label, value, sub, color = '#4f46e5', icon: Icon, onClick }: any) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '16px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>{sub}</div>}
  </div>
);

// ─────────── Mini Bar Chart ────────────
const MiniBar = ({ data, color = '#4f46e5' }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ width: '100%', height: `${(d.value / max) * 50}px`, background: color, borderRadius: '4px 4px 0 0', minHeight: d.value > 0 ? '4px' : '0', opacity: 0.85 }} />
          <div style={{ fontSize: '8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

export const Reports: React.FC = () => {
  const { transactions, expenses, products, customers, inventoryLogs, debtPayments, appSettings } = useAppContext();
  const { t: _t } = useTranslation();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>('Today');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'All' | 'Cash' | 'Debt'>('All');

  // ─────────── Data Filtering ────────────
  const { filteredTxs, filteredExps, filteredLogs } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filterByPeriod = <T extends { date: string }>(arr: T[]): T[] => {
      if (period === 'Today') return arr.filter(x => x.date.startsWith(todayStr));
      if (period === 'Week') return arr.filter(x => new Date(x.date) >= weekAgo);
      if (period === 'Month') return arr.filter(x => new Date(x.date) >= monthAgo);
      return arr;
    };

    return {
      filteredTxs: filterByPeriod(transactions),
      filteredExps: filterByPeriod(expenses),
      filteredLogs: filterByPeriod(inventoryLogs),
    };
  }, [period, transactions, expenses, inventoryLogs]);

  // ─────────── Core Metrics ────────────
  const metrics = useMemo(() => {
    const totalSales = filteredTxs.reduce((s, t) => s + t.totalPrice, 0);
    const cashSales = filteredTxs.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
    const debtSales = filteredTxs.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);
    const totalExpenses = filteredExps.reduce((s, e) => s + e.amount, 0);
    const breadSold = filteredTxs.reduce((s, t) => s + getTransactionItems(t).reduce((ss, i) => ss + i.quantity, 0), 0);

    // Cost of goods = sum of (item.quantity * product.costPrice or approx)
    // We use actual transaction items + inventory cost price
    const returnLogs = filteredLogs.filter(l => l.type === 'Return');
    const receiveLogs = filteredLogs.filter(l => l.type !== 'Return');
    const totalReturnsValue = returnLogs.reduce((s, l) => s + l.quantityReceived * l.costPrice, 0);
    const totalStockCostReceived = receiveLogs.reduce((s, l) => s + l.quantityReceived * l.costPrice, 0);

    // Avg cost per unit across all receipts
    const totalUnitsReceived = receiveLogs.reduce((s, l) => s + l.quantityReceived, 0);
    const avgCostPerUnit = totalUnitsReceived > 0 ? totalStockCostReceived / totalUnitsReceived : 0;
    const estimatedCOGS = avgCostPerUnit > 0 ? breadSold * avgCostPerUnit : totalSales * 0.55; // fallback 55% COGS

    // Accurate gross profit = Sales - estimated COGS - returns value
    const grossProfit = Math.max(0, totalSales - estimatedCOGS - totalReturnsValue);
    const netProfit = grossProfit - totalExpenses;

    const outstandingDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
    const stockRetailValue = products.filter(p => p.active).reduce((s, p) => s + p.stock * p.price, 0);
    const txCount = filteredTxs.length;
    const avgSaleValue = txCount > 0 ? Math.round(totalSales / txCount) : 0;
    
    // Debt collected this period
    const debtCollected = debtPayments
      .filter(dp => {
        const now = new Date(); const todayStr = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (period === 'Today') return dp.date.startsWith(todayStr);
        if (period === 'Week') return new Date(dp.date) >= weekAgo;
        if (period === 'Month') return new Date(dp.date) >= monthAgo;
        return true;
      })
      .reduce((s, dp) => s + dp.amount, 0);

    return { totalSales, cashSales, debtSales, totalExpenses, breadSold, grossProfit, netProfit, outstandingDebt, stockRetailValue, txCount, avgSaleValue, debtCollected, totalReturnsValue, estimatedCOGS };
  }, [filteredTxs, filteredExps, filteredLogs, customers, products, debtPayments, period]);

  // ─────────── Product Performance ────────────
  const productStats = useMemo(() => {
    const salesMap: Record<string, { qty: number; revenue: number }> = {};
    filteredTxs.forEach(t => {
      getTransactionItems(t).forEach(item => {
        if (!salesMap[item.productId]) salesMap[item.productId] = { qty: 0, revenue: 0 };
        salesMap[item.productId].qty += item.quantity;
        salesMap[item.productId].revenue += item.quantity * item.unitPrice;
      });
    });
    return Object.entries(salesMap)
      .map(([id, data]) => ({ id, name: products.find(p => p.id === id)?.name || 'Unknown', ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredTxs, products]);

  // ─────────── 7-Day Trend For Chart ────────────
  const weekTrend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayTotal = transactions.filter(t => t.date.startsWith(ds)).reduce((s, t) => s + t.totalPrice, 0);
      days.push({ label: d.toLocaleDateString([], { weekday: 'short' }).charAt(0), value: dayTotal });
    }
    return days;
  }, [transactions]);

  // ─────────── Transaction list with filter ────────────
  const displayedTxs = useMemo(() => {
    const q = txSearch.toLowerCase();
    return [...filteredTxs]
      .filter(t => {
        const matchType = txTypeFilter === 'All' || t.type === txTypeFilter;
        const customer = customers.find(c => c.id === t.customerId);
        const matchSearch = !q || (customer?.name.toLowerCase().includes(q)) ||
          getTransactionItems(t).some(item => products.find(p => p.id === item.productId)?.name.toLowerCase().includes(q));
        return matchType && matchSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTxs, txSearch, txTypeFilter, customers, products]);

  const getCustomerName = (id?: string) => id ? (customers.find(c => c.id === id)?.name || 'Unknown') : 'Walk-in';

  // ─────────── Styles ────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'transparent',
    color: active ? '#4f46e5' : 'var(--text-secondary)',
    fontWeight: active ? 700 : 500,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'color 0.2s',
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '999px',
    border: active ? 'none' : '1px solid var(--border-color)',
    background: active ? '#4f46e5' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ paddingBottom: '5rem', maxWidth: '480px', margin: '0 auto', padding: '0 0 5rem 0' }}>
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          html, body { margin: 0 !important; width: 58mm !important; background: #fff !important; }
          .no-print { display: none !important; }
          * { font-family: monospace !important; color: #000 !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="no-print" style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-color)' }}>📊 Records</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{appSettings.companyName}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* ── Period Pills ── */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {(['Today', 'Week', 'Month', 'All'] as Period[]).map(p => (
          <button key={p} style={pillStyle(period === p)} onClick={() => setPeriod(p)}>{p}</button>
        ))}
      </div>

      {/* ── Net Profit Hero Card ── */}
      <div style={{ margin: '0 16px 16px', borderRadius: '20px', padding: '20px', background: metrics.netProfit >= 0 ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.85, fontSize: '13px', fontWeight: 600 }}>
          {metrics.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          Net Profit · {period}
        </div>
        <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>{fmt(metrics.netProfit)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
          <div><div style={{ fontSize: '10px', opacity: 0.75, marginBottom: 2 }}>Revenue</div><div style={{ fontSize: '14px', fontWeight: 700 }}>{fmt(metrics.totalSales)}</div></div>
          <div><div style={{ fontSize: '10px', opacity: 0.75, marginBottom: 2 }}>Est. COGS</div><div style={{ fontSize: '14px', fontWeight: 700 }}>{fmt(metrics.estimatedCOGS)}</div></div>
          <div><div style={{ fontSize: '10px', opacity: 0.75, marginBottom: 2 }}>Expenses</div><div style={{ fontSize: '14px', fontWeight: 700 }}>{fmt(metrics.totalExpenses)}</div></div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '0 16px', marginBottom: '16px' }}>
        <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}><BarChart2 size={14} style={{ display: 'inline', marginRight: 4 }} />Overview</button>
        <button style={tabStyle(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}><Receipt size={14} style={{ display: 'inline', marginRight: 4 }} />Transactions</button>
        <button style={tabStyle(activeTab === 'products')} onClick={() => setActiveTab('products')}><Package size={14} style={{ display: 'inline', marginRight: 4 }} />Products</button>
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === 'overview' && (
        <div style={{ padding: '0 16px' }}>
          {/* 7-day mini chart */}
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>7-Day Sales Trend</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Last 7 days</span>
            </div>
            <MiniBar data={weekTrend} color="#4f46e5" />
          </div>

          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <StatCard label="Cash Sales" value={fmt(metrics.cashSales)} icon={Wallet} color="#16a34a" sub={`${filteredTxs.filter(t => t.type === 'Cash').length} transactions`} />
            <StatCard label="Debt Issued" value={fmt(metrics.debtSales)} icon={CreditCard} color="#dc2626" sub={`${filteredTxs.filter(t => t.type === 'Debt').length} transactions`} />
            <StatCard label="Debt Collected" value={fmt(metrics.debtCollected)} icon={RefreshCw} color="#0891b2" />
            <StatCard label="Outstanding Debt" value={fmt(metrics.outstandingDebt)} icon={AlertTriangle} color="#d97706" sub="All customers" />
            <StatCard label="Bread Sold" value={`${metrics.breadSold} units`} icon={ShoppingBag} color="#7c3aed" sub={`Avg ₦${metrics.avgSaleValue.toLocaleString()} / sale`} />
            <StatCard label="Returns Value" value={fmt(metrics.totalReturnsValue)} icon={TrendingDown} color="#6b7280" />
            <div style={{ gridColumn: '1 / -1' }}>
              <StatCard label="Stock Retail Value" value={fmt(metrics.stockRetailValue)} icon={Package} color="#4f46e5" sub={`${products.filter(p => p.active).reduce((s, p) => s + p.stock, 0)} units in stock`} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <StatCard label="Total Customers" value={customers.length} icon={Users} color="#0891b2" sub={`${customers.filter(c => c.debtBalance > 0).length} with outstanding debt`} onClick={() => navigate('/customers')} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TRANSACTIONS TAB ══════════════ */}
      {activeTab === 'transactions' && (
        <div style={{ padding: '0 16px' }}>
          {/* Search + Filter */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 14px', gap: '8px', marginBottom: '10px' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              value={txSearch}
              onChange={e => setTxSearch(e.target.value)}
              placeholder="Search by customer or product..."
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', color: 'var(--text-color)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {(['All', 'Cash', 'Debt'] as const).map(f => (
              <button key={f} style={pillStyle(txTypeFilter === f)} onClick={() => setTxTypeFilter(f)}>{f}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center' }}>{displayedTxs.length} records</span>
          </div>

          {/* Transaction List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayedTxs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px', fontSize: '14px' }}>No transactions found</div>
            ) : displayedTxs.map(tx => {
              const items = getTransactionItems(tx);
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/receipt/${tx.id}`)}
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getCustomerName(tx.customerId)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {items.map((item, _i) => {
                        const p = products.find(p => p.id === item.productId);
                        return `${item.quantity}× ${p?.name || 'Item'}`;
                      }).join(', ')}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{fmtDate(tx.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-color)' }}>{fmt(tx.totalPrice)}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: tx.type === 'Cash' ? '#16a34a' : '#dc2626', textTransform: 'uppercase', marginTop: '2px' }}>{tx.type}</div>
                    {tx.discount && tx.discount > 0 && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>-{fmt(tx.discount)} disc</div>}
                  </div>
                  <ChevronRight size={14} color="var(--text-secondary)" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ PRODUCTS TAB ══════════════ */}
      {activeTab === 'products' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Best-selling products in selected period
          </div>
          {productStats.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px', fontSize: '14px' }}>No product sales data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {productStats.map((ps, idx) => {
                const product = products.find(p => p.id === ps.id);
                const totalRevenue = productStats.reduce((s, p) => s + p.revenue, 1);
                const pct = Math.round((ps.revenue / totalRevenue) * 100);
                return (
                  <div key={ps.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#4f46e510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#4f46e5' }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{ps.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ps.qty} units sold • ₦{product?.price.toLocaleString()} each</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{fmt(ps.revenue)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pct}% of sales</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '999px', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                      <span>{product?.stock || 0} in stock</span>
                      <span style={{ color: product && product.stock < 20 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{product && product.stock < 20 ? '⚠ Low Stock' : '✓ OK'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
