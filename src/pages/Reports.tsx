import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import {
  BarChart2, TrendingUp, TrendingDown, ShoppingBag, CreditCard,
  Package, Receipt, Search, ChevronRight,
  Wallet, Users, AlertTriangle, RefreshCw, Printer, Share2,
  ArrowUpRight, ArrowDownRight, DollarSign, Building2, Percent, MinusCircle, PlusCircle
} from 'lucide-react';

type Period = 'Today' | 'Week' | 'Month' | 'All';
type Tab = 'overview' | 'transactions' | 'products' | 'expenses' | 'debts';

const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatCard = ({ label, value, sub, color = '#4f46e5', icon: Icon, onClick }: any) => (
  <div onClick={onClick} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '16px', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative', overflow: 'hidden' }}
    onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; } }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
    <div style={{ position: 'absolute', top: -12, right: -12, width: 60, height: 60, borderRadius: '50%', background: `${color}10` }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
    <div style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>{sub}</div>}
  </div>
);

const MiniBar = ({ data, color = '#4f46e5' }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '68px' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '100%', height: `${(d.value / max) * 52}px`, background: isLast ? color : `${color}55`, borderRadius: '5px 5px 0 0', minHeight: d.value > 0 ? '4px' : '0', transition: 'height 0.4s ease' }} />
            <div style={{ fontSize: '8px', color: isLast ? color : 'var(--text-secondary)', fontWeight: isLast ? 700 : 400 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Reports: React.FC = () => {
  const { transactions, expenses, products, customers, inventoryLogs, debtPayments, appSettings, bakeryPayments } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<Period>('Today');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'All' | 'Cash' | 'Debt'>('All');

  const periodLabel: Record<Period, string> = {
    Today: t('rep.period.today'),
    Week: t('rep.period.week'),
    Month: t('rep.period.month'),
    All: t('rep.period.all'),
  };

  // ── Period Filtering ──
  const { todayStr, weekAgo, monthAgo } = useMemo(() => {
    const now = new Date();
    return {
      todayStr: now.toISOString().split('T')[0],
      weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      monthAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
  }, []);

  const filterByPeriod = <T extends { date: string }>(arr: T[]): T[] => {
    if (period === 'Today') return arr.filter(x => x.date.startsWith(todayStr));
    if (period === 'Week') return arr.filter(x => new Date(x.date) >= weekAgo);
    if (period === 'Month') return arr.filter(x => new Date(x.date) >= monthAgo);
    return arr;
  };

  const { filteredTxs, filteredExps, filteredLogs } = useMemo(() => {
    return { filteredTxs: filterByPeriod(transactions), filteredExps: filterByPeriod(expenses), filteredLogs: filterByPeriod(inventoryLogs) };
  }, [period, transactions, expenses, inventoryLogs, todayStr, weekAgo, monthAgo]);

  // ── Core Metrics — Bread Distribution: 10% ours, 90% to bakery ──
  const metrics = useMemo(() => {
    const totalSales = filteredTxs.reduce((s, t) => s + t.totalPrice, 0);
    const cashSales = filteredTxs.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
    const debtSales = filteredTxs.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);
    const totalExpenses = filteredExps.reduce((s, e) => s + e.amount, 0);
    const breadSold = filteredTxs.reduce((s, t) => s + getTransactionItems(t).reduce((ss, i) => ss + i.quantity, 0), 0);
    const returnLogs = filteredLogs.filter(l => l.type === 'Return');
    const totalReturnsValue = returnLogs.reduce((s, l) => s + l.quantityReceived * l.costPrice, 0);

    // 10/90 split
    const ourShare = totalSales * 0.10;
    const bakeryOwed = totalSales * 0.90;
    const netProfit = ourShare - totalExpenses;

    const outstandingDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
    const stockRetailValue = products.filter(p => p.active).reduce((s, p) => s + p.stock * p.price, 0);
    const txCount = filteredTxs.length;
    const avgSaleValue = txCount > 0 ? Math.round(totalSales / txCount) : 0;

    const debtCollected = filterByPeriod(debtPayments).reduce((s, dp) => s + Number(dp.amount || 0), 0);

    // Amount paid to the company in this period
    const companyPaid = filterByPeriod(bakeryPayments).reduce((s, bp) => s + Number(bp.amount || 0), 0);

    // Remaining Balance = 90% owed - Already Paid to Company
    const netBakeryOwed = Math.max(0, bakeryOwed - companyPaid);

    return {
      totalSales, cashSales, debtSales, totalExpenses, breadSold,
      ourShare, bakeryOwed, companyPaid, netBakeryOwed, netProfit,
      outstandingDebt, stockRetailValue, txCount, avgSaleValue,
      debtCollected, totalReturnsValue,
    };
  }, [filteredTxs, filteredExps, filteredLogs, customers, products, debtPayments, bakeryPayments, period]);

  // ── Product Performance ──
  const productStats = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    filteredTxs.forEach(tx => {
      getTransactionItems(tx).forEach(item => {
        if (!map[item.productId]) map[item.productId] = { qty: 0, revenue: 0 };
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.quantity * item.unitPrice;
      });
    });
    return Object.entries(map)
      .map(([id, data]) => ({ id, name: products.find(p => p.id === id)?.name || 'Unknown', ...data, stock: products.find(p => p.id === id)?.stock || 0, price: products.find(p => p.id === id)?.price || 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredTxs, products]);

  // ── Charts ──
  const weekTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString([], { weekday: 'short' }).charAt(0), value: transactions.filter(tx => tx.date.startsWith(ds)).reduce((s, tx) => s + tx.totalPrice, 0) };
  }), [transactions]);

  const hourlyTrend = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter(tx => tx.date.startsWith(todayStr));
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i * 2;
      const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;
      return { label, value: todayTxs.filter(tx => { const h = new Date(tx.date).getHours(); return h >= hour && h < hour + 2; }).reduce((s, tx) => s + tx.totalPrice, 0) };
    });
  }, [transactions]);

  // ── Transaction List ──
  const displayedTxs = useMemo(() => {
    const q = txSearch.toLowerCase();
    return [...filteredTxs].filter(tx => {
      const matchType = txTypeFilter === 'All' || tx.type === txTypeFilter;
      const customer = customers.find(c => c.id === tx.customerId);
      const matchSearch = !q || customer?.name.toLowerCase().includes(q) ||
        getTransactionItems(tx).some(item => products.find(p => p.id === item.productId)?.name.toLowerCase().includes(q));
      return matchType && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTxs, txSearch, txTypeFilter, customers, products]);

  const getCustomerName = (id?: string) => id ? (customers.find(c => c.id === id)?.name || 'Unknown') : 'Walk-in';
  const debtors = useMemo(() => customers.filter(c => c.debtBalance > 0).sort((a, b) => b.debtBalance - a.debtBalance), [customers]);

  // ── Bluetooth Print ──
  const handlePrint = async () => {
    const p = (n: number) => `N${Math.round(n).toLocaleString()}`;
    try {
      if (!(navigator as any).bluetooth) throw new Error('No Bluetooth');
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, { namePrefix: 'MTP' }, { namePrefix: 'PT' }, { namePrefix: 'RP' }, { namePrefix: 'Printer' }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });
      if (!device.gatt) throw new Error('No GATT');
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      const chars = await services[0].getCharacteristics();
      const char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
      if (!char) throw new Error('No char');
      const co = (appSettings.companyName || 'BREAD APP').replace(/[^\x00-\x7F]/g, '');
      const sep = '--------------------------------\n';
      const lines = [
        `\x1Ba\x01`, `\x1BE\x01${co.toUpperCase()}\x1BE\x00\n`,
        `FINANCIAL REPORT - ${period.toUpperCase()}\n`,
        `Date: ${new Date().toLocaleDateString()}\n`, sep,
        `\x1Ba\x00`,
        `Total Sales:     ${p(metrics.totalSales)}\n`,
        `Cash Sales:      ${p(metrics.cashSales)}\n`,
        `Bread Sold:      ${metrics.breadSold} units\n`, sep,
        `Our Share(10%):  ${p(metrics.ourShare)}\n`,
        `Bakery Owed(90%):${p(metrics.bakeryOwed)}\n`,
        `Company Paid:    -${p(metrics.companyPaid)}\n`,
        `Remaining Bal:   ${p(metrics.netBakeryOwed)}\n`,
        `Our Expenses:    ${p(metrics.totalExpenses)}\n`, sep,
        `\x1BE\x01NET PROFIT: ${p(metrics.netProfit)}\x1BE\x00\n`, sep,
        `Outstanding Debt:${p(metrics.outstandingDebt)}\n`,
        `Stock Value:     ${p(metrics.stockRetailValue)}\n`, sep,
        `\x1Ba\x01`, `${co}\n`, `\x1Ba\x00\n\n\n`,
      ];
      const encoder = new TextEncoder();
      for (const line of lines) {
        const data = encoder.encode(line.replace(/[^\x00-\x7F]/g, '?'));
        for (let i = 0; i < data.length; i += 512) {
          await char.writeValue(data.slice(i, i + 512));
          await new Promise(r => setTimeout(r, 30));
        }
      }
      await new Promise(r => setTimeout(r, 600));
      device.gatt.disconnect();
    } catch { window.print(); }
  };

  // ── Share ──
  const handleShare = () => {
    const text = `📊 *${appSettings.companyName || 'Bread App'} - ${period} Report*\n\n` +
      `💰 Total Sales: ${fmt(metrics.totalSales)}\n` +
      `✅ Cash: ${fmt(metrics.cashSales)} | 💳 Debt: ${fmt(metrics.debtSales)}\n` +
      `🍞 Bread Sold: ${metrics.breadSold} units\n\n` +
      `📈 *Our 10% Share: ${fmt(metrics.ourShare)}*\n` +
      `💸 Our Expenses: ${fmt(metrics.totalExpenses)}\n` +
      `*💵 Net Profit: ${fmt(metrics.netProfit)}*\n\n` +
      `=========================\n` +
      `🏭 Total Sales (100%): ${fmt(metrics.totalSales)}\n` +
      `📉 Bakery Share (90%): ${fmt(metrics.bakeryOwed)}\n` +
      `💸 Paid to Company: -${fmt(metrics.companyPaid)}\n` +
      `*⚠️ Remaining Balance: ${fmt(metrics.netBakeryOwed)}*\n` +
      `=========================\n\n` +
      `⚠️ Customer Debt: ${fmt(metrics.outstandingDebt)}\n` +
      `📦 Stock Value: ${fmt(metrics.stockRetailValue)}\n\n` +
      `*DIAGNOSTICS: BP_len[${bakeryPayments.length}] BP_filt[${filterByPeriod(bakeryPayments).length}] DT_len[${debtPayments.length}] DT_filt[${filterByPeriod(debtPayments).length}]*\n` +
      `🕐 ${new Date().toLocaleString()}`;
    if (navigator.share) {
      navigator.share({ title: 'Sales Report', text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const pillStyle = (active: boolean, col = '#4f46e5'): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '999px', border: active ? 'none' : '1px solid var(--border-color)',
    background: active ? col : 'transparent', color: active ? '#fff' : 'var(--text-secondary)',
    fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
  });
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', border: 'none', borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'transparent', color: active ? '#4f46e5' : 'var(--text-secondary)',
    fontWeight: active ? 700 : 500, fontSize: '12px', cursor: 'pointer', transition: 'color 0.2s',
  });

  return (
    <div ref={reportRef} style={{ paddingBottom: '5rem' }}>
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          html, body { margin: 0 !important; width: 58mm !important; background: #fff !important; }
          .no-print { display: none !important; }
          nav, header, footer { display: none !important; }
          * { font-family: monospace !important; color: #000 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>📊 {t('rep.title')}</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{appSettings.companyName}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <Share2 size={13} /> {t('rep.share')}
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <Printer size={13} /> {t('rep.print')}
          </button>
        </div>
      </div>

      {/* Period Pills */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {(['Today', 'Week', 'Month', 'All'] as Period[]).map(p => (
          <button key={p} style={pillStyle(period === p)} onClick={() => setPeriod(p)}>{periodLabel[p]}</button>
        ))}
      </div>

      {/* Hero: Net Profit */}
      <div style={{ margin: '0 16px 12px', borderRadius: '22px', padding: '22px', background: metrics.netProfit >= 0 ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#b91c1c,#ef4444)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', opacity: 0.08 }}><DollarSign size={80} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: 0.85, fontSize: '12px', fontWeight: 600 }}>
          {metrics.netProfit >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          {t('rep.netProfit')} · {periodLabel[period]}
        </div>
        <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '4px' }}>{fmt(metrics.netProfit)}</div>
        <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '14px' }}>{t('rep.ourShare')}: {fmt(metrics.ourShare)} — Expenses: {fmt(metrics.totalExpenses)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '14px' }}>
          <div><div style={{ fontSize: '10px', opacity: 0.7, marginBottom: 2 }}>Total Sales</div><div style={{ fontSize: '15px', fontWeight: 700 }}>{fmt(metrics.totalSales)}</div></div>
          <div><div style={{ fontSize: '10px', opacity: 0.7, marginBottom: 2 }}>10% Ours</div><div style={{ fontSize: '15px', fontWeight: 700 }}>{fmt(metrics.ourShare)}</div></div>
          <div><div style={{ fontSize: '10px', opacity: 0.7, marginBottom: 2 }}>Bakery 90%</div><div style={{ fontSize: '15px', fontWeight: 700 }}>{fmt(metrics.bakeryOwed)}</div></div>
        </div>
      </div>

      {/* 4-Step Company Balance Flow */}
      <div style={{ margin: '0 16px 16px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #92400e40' }} 
           onClick={() => {
             const diagStr = `Sales: ${metrics.totalSales}\nBakOwed: ${metrics.bakeryOwed}\nPaid: ${metrics.companyPaid}\nNet: ${metrics.netBakeryOwed}\n\nBPayments: ${bakeryPayments.length}\nFiltered: ${filterByPeriod(bakeryPayments).length}\n\nAll BPayments:\n${bakeryPayments.map(b => b.amount + ' (' + b.date.substring(0,10) + ')').join(', ')}`;
             alert(diagStr);
           }}>
        
        {/* Step 1: Total Sales */}
        <div style={{ background: '#78350f08', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #92400e15' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>1. {t('rep.totalSales100')}</div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#92400e' }}>{fmt(metrics.totalSales)}</div>
        </div>

        {/* Step 2: Bakery Share (90%) */}
        <div style={{ background: '#78350f15', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Building2 size={15} color='#92400e' />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. {t('rep.bakeryShare90')}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#92400e' }}>{fmt(metrics.bakeryOwed)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{t('rep.bakeryNote')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Percent size={28} color='#92400e30' />
          </div>
        </div>

        {/* Step 3: Amount Paid */}
        <div style={{ background: '#f59e0b10', borderTop: '1px solid #92400e15', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>3. {t('rep.companyPaid')}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Amount sent to bakery this period</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>-{fmt(metrics.companyPaid)}</div>
        </div>

        {/* Step 4: Remaining Balance */}
        <div style={{ background: metrics.netBakeryOwed > 0 ? '#dc262615' : '#16a34a15', borderTop: '2px solid #92400e20', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-color)' }}>4. {t('rep.remainingBalance')}</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: metrics.netBakeryOwed > 0 ? '#dc2626' : '#16a34a' }}>{fmt(metrics.netBakeryOwed)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {([
          { id: 'overview', icon: BarChart2, key: 'rep.tab.overview' },
          { id: 'transactions', icon: Receipt, key: 'rep.tab.sales' },
          { id: 'products', icon: Package, key: 'rep.tab.products' },
          { id: 'expenses', icon: ArrowDownRight, key: 'rep.tab.expenses' },
          { id: 'debts', icon: CreditCard, key: 'rep.tab.debts' },
        ] as { id: Tab; icon: any; key: string }[]).map(tab => (
          <button key={tab.id} style={{ ...tabStyle(activeTab === tab.id), minWidth: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={12} />{t(tab.key)}
          </button>
        ))}
      </div>

      {/* ══════ OVERVIEW ══════ */}
      {activeTab === 'overview' && (
        <div style={{ padding: '0 16px' }}>
          {/* Chart */}
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{period === 'Today' ? t('rep.chartHourly') : t('rep.chart7day')}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{period === 'Today' ? t('rep.chartHourlySub') : t('rep.chart7daySub')}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#4f46e5' }}>{fmt(period === 'Today' ? metrics.totalSales : weekTrend.reduce((s, d) => s + d.value, 0))}</div>
            </div>
            <MiniBar data={period === 'Today' ? hourlyTrend : weekTrend} color={period === 'Today' ? '#7c3aed' : '#4f46e5'} />
          </div>

          {/* Revenue Split Visual */}
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>💰 {t('rep.splitTitle')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#4f46e510', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 700, marginBottom: 4 }}>{t('rep.us')}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#4f46e5' }}>{fmt(metrics.ourShare)}</div>
              </div>
              <div style={{ background: '#92400e10', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, marginBottom: 4 }}>{t('rep.bakery90')}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#92400e' }}>{fmt(metrics.bakeryOwed)}</div>
              </div>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginTop: '12px', gap: '2px' }}>
              <div style={{ width: '10%', background: '#4f46e5', borderRadius: '999px 0 0 999px' }} />
              <div style={{ flex: 1, background: '#92400e', borderRadius: '0 999px 999px 0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '10px' }}>
              <span style={{ color: '#4f46e5', fontWeight: 700 }}>{t('rep.us')}</span>
              <span style={{ color: '#92400e', fontWeight: 700 }}>{t('rep.bakery90')}</span>
            </div>
          </div>

          {/* Cash Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#16a34a12', border: '1px solid #16a34a30', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><ArrowUpRight size={15} color="#16a34a" /><span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>{t('rep.cashIn')}</span></div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{fmt(metrics.cashSales + metrics.debtCollected)}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 4 }}>{t('rep.cashInSub')}</div>
            </div>
            <div style={{ background: '#dc262612', border: '1px solid #dc262630', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><ArrowDownRight size={15} color="#dc2626" /><span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>{t('rep.cashOut')}</span></div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{fmt(metrics.totalExpenses)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <StatCard label={t('rep.cashSales')} value={fmt(metrics.cashSales)} icon={Wallet} color="#16a34a" sub={`${filteredTxs.filter(tx => tx.type === 'Cash').length} sales`} />
            <StatCard label={t('rep.debtIssued')} value={fmt(metrics.debtSales)} icon={CreditCard} color="#dc2626" sub={`${filteredTxs.filter(tx => tx.type === 'Debt').length} sales`} />
            <StatCard label={t('rep.debtCollected')} value={fmt(metrics.debtCollected)} icon={RefreshCw} color="#0891b2" />
            <StatCard label={t('rep.breadSold')} value={`${metrics.breadSold} ${t('rep.units')}`} icon={ShoppingBag} color="#7c3aed" sub={`${t('rep.avgSale')}: ${fmt(metrics.avgSaleValue)}`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <StatCard label={t('rep.customerDebt')} value={fmt(metrics.outstandingDebt)} icon={AlertTriangle} color="#d97706" onClick={() => setActiveTab('debts')} />
            <StatCard label={t('rep.returns')} value={fmt(metrics.totalReturnsValue)} icon={TrendingDown} color="#6b7280" />
          </div>
          <StatCard label={t('rep.stockValue')} value={fmt(metrics.stockRetailValue)} icon={Package} color="#4f46e5"
            sub={`${products.filter(p => p.active).reduce((s, p) => s + p.stock, 0)} ${t('rep.units')} · ${products.filter(p => p.active).length} products`} />
          <div style={{ marginTop: '10px', marginBottom: '14px' }}>
            <StatCard label={t('rep.customers')} value={customers.length} icon={Users} color="#0891b2"
              sub={`${customers.filter(c => c.debtBalance > 0).length} ${t('rep.debtors')} · ${customers.filter(c => c.debtBalance === 0).length} ${t('rep.cleared')}`}
              onClick={() => navigate('/customers')} />
          </div>
        </div>
      )}

      {/* ══════ SALES ══════ */}
      {activeTab === 'transactions' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px 14px', gap: '8px', marginBottom: '10px' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder={t('rep.search')}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', color: 'var(--text-color)' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            {(['All', 'Cash', 'Debt'] as const).map(f => (
              <button key={f} style={pillStyle(txTypeFilter === f, f === 'Cash' ? '#16a34a' : f === 'Debt' ? '#dc2626' : '#4f46e5')} onClick={() => setTxTypeFilter(f)}>{f}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>{displayedTxs.length} {t('rep.records')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayedTxs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>{t('rep.noTx')}</div>
            ) : displayedTxs.map(tx => (
              <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)}
                style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{getCustomerName(tx.customerId)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getTransactionItems(tx).map(item => `${item.quantity}× ${products.find(p => p.id === item.productId)?.name || 'Item'}`).join(', ')}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{fmtDate(tx.date)}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{fmt(tx.totalPrice)}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: tx.type === 'Cash' ? '#16a34a' : '#dc2626', textTransform: 'uppercase', marginTop: 2 }}>{tx.type}</div>
                  {tx.discount && tx.discount > 0 && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: 2 }}>-{fmt(tx.discount)}</div>}
                </div>
                <ChevronRight size={14} color="var(--text-secondary)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ PRODUCTS ══════ */}
      {activeTab === 'products' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('rep.bestSelling')}</div>
          {productStats.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>{t('rep.noProducts')}</div>
          ) : productStats.map((ps, idx) => {
            const totalRev = productStats.reduce((s, p) => s + p.revenue, 1);
            const pct = Math.round((ps.revenue / totalRev) * 100);
            return (
              <div key={ps.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#4f46e510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#4f46e5' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{ps.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ps.qty} {t('rep.units')} · ₦{ps.price.toLocaleString()} each</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>{fmt(ps.revenue)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ height: '5px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: idx === 0 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  <span>{t('rep.stock')}: {ps.stock} {t('rep.units')}</span>
                  <span style={{ color: ps.stock < 20 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{ps.stock < 20 ? t('rep.lowStock') : t('rep.okStock')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ EXPENSES ══════ */}
      {activeTab === 'expenses' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ background: '#dc262612', border: '1px solid #dc262630', borderRadius: '16px', padding: '16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, marginBottom: 4 }}>{t('rep.totalExpenses')} · {periodLabel[period]}</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#dc2626' }}>{fmt(metrics.totalExpenses)}</div>
            </div>
            <ArrowDownRight size={40} color="#dc262630" />
          </div>
          {filteredExps.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>{t('rep.noExpenses')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...filteredExps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                <div key={exp.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 2 }}>{exp.description || 'Expense'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{fmtDate(exp.date)}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#dc2626' }}>{fmt(exp.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ DEBTS ══════ */}
      {activeTab === 'debts' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ background: '#d9770612', border: '1px solid #d9770630', borderRadius: '16px', padding: '16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, marginBottom: 4 }}>{t('rep.totalDebt')}</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#d97706' }}>{fmt(metrics.outstandingDebt)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>{debtors.length} {t('rep.debtCount')}</div>
            </div>
            <AlertTriangle size={40} color="#d9770630" />
          </div>
          {debtors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#16a34a', fontWeight: 700 }}>{t('rep.noDebt')}</div>
          ) : debtors.map(c => {
            const pct = Math.min(100, Math.round((c.debtBalance / metrics.outstandingDebt) * 100));
            return (
              <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px', marginBottom: '8px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d9770618', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#d97706' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.phone}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#dc2626' }}>{fmt(c.debtBalance)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{pct}% {t('rep.ofTotal')}</div>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#d97706,#f59e0b)', borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>{t('rep.viewProfile')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;
