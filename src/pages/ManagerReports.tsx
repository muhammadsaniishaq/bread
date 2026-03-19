import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  BarChart2, TrendingUp, TrendingDown, ShoppingBag, CreditCard,
  Package, Receipt, Search, ChevronRight,
  Wallet, AlertTriangle, Printer, Share2,
  ArrowDownRight, DollarSign, ArrowLeft
} from 'lucide-react';

type Period = 'Today' | 'Week' | 'Month' | 'All';
type Tab = 'overview' | 'transactions' | 'products' | 'expenses' | 'debts';

const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatCard = ({ label, value, sub, color = 'var(--primary-color)', icon: Icon, onClick }: any) => (
  <div onClick={onClick} className={`bg-surface border border-[var(--border-color)] rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''}`}>
    <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: color }} />
    <div className="flex items-center gap-2 mb-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center opacity-80" style={{ backgroundColor: `${color}20` }}>
        <Icon size={18} color={color} />
      </div>
      <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-[21px] font-black text-[var(--text-color)] leading-tight">{value}</div>
    {sub && <div className="text-[11px] text-secondary mt-1">{sub}</div>}
  </div>
);

const MiniBar = ({ data, color = '#4f46e5' }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-[68px]">
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all duration-300" 
                 style={{ height: `${(d.value / max) * 52}px`, background: isLast ? color : `${color}55`, minHeight: d.value > 0 ? '4px' : '0' }} />
            <div className={`text-[8px] ${isLast ? 'font-bold' : 'font-medium opacity-70'}`} style={{ color: isLast ? color : 'var(--text-secondary)' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const ManagerReports: React.FC = () => {
  const { transactions, expenses, products, customers, inventoryLogs, debtPayments, appSettings, bakeryPayments } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<Period>('Today');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter] = useState<'All' | 'Cash' | 'Debt'>('All');

  const periodLabel: Record<Period, string> = {
    Today: t('rep.period.today') || 'Today',
    Week: t('rep.period.week') || 'Week',
    Month: t('rep.period.month') || 'Month',
    All: t('rep.period.all') || 'All Time',
  };

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

  const metrics = useMemo(() => {
    const totalSales = filteredTxs.reduce((s, t) => s + t.totalPrice, 0);
    const cashSales = filteredTxs.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
    const debtSales = filteredTxs.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);
    const totalExpenses = filteredExps.reduce((s, e) => s + e.amount, 0);
    const breadSold = filteredTxs.reduce((s, t) => s + getTransactionItems(t).reduce((ss, i) => ss + i.quantity, 0), 0);
    const returnLogs = filteredLogs.filter(l => l.type === 'Return');
    const totalReturnsValue = returnLogs.reduce((s, l) => s + l.quantityReceived * l.costPrice, 0);

    const ourShare = totalSales * 0.10;
    const bakeryOwed = totalSales * 0.90;
    const netProfit = ourShare - totalExpenses;

    const outstandingDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
    const stockRetailValue = products.filter(p => p.active).reduce((s, p) => s + p.stock * p.price, 0);
    const txCount = filteredTxs.length;
    const avgSaleValue = txCount > 0 ? Math.round(totalSales / txCount) : 0;

    const debtCollected = filterByPeriod(debtPayments).reduce((s, dp) => s + Number(dp.amount || 0), 0);
    const companyPaid = filterByPeriod(bakeryPayments).reduce((s, bp) => s + Number(bp.amount || 0), 0);
    const netBakeryOwed = Math.max(0, bakeryOwed - companyPaid);

    return {
      totalSales, cashSales, debtSales, totalExpenses, breadSold,
      ourShare, bakeryOwed, companyPaid, netBakeryOwed, netProfit,
      outstandingDebt, stockRetailValue, txCount, avgSaleValue,
      debtCollected, totalReturnsValue,
    };
  }, [filteredTxs, filteredExps, filteredLogs, customers, products, debtPayments, bakeryPayments, period]);

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

  const weekTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString([], { weekday: 'short' }).charAt(0), value: transactions.filter(tx => tx.date.startsWith(ds)).reduce((s, tx) => s + tx.totalPrice, 0) };
  }), [transactions]);

  const hourlyTrend = useMemo(() => {
    const todayTxs = transactions.filter(tx => tx.date.startsWith(todayStr));
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i * 2;
      const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;
      return { label, value: todayTxs.filter(tx => { const h = new Date(tx.date).getHours(); return h >= hour && h < hour + 2; }).reduce((s, tx) => s + tx.totalPrice, 0) };
    });
  }, [transactions, todayStr]);

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
        `EXECUTIVE REPORT - ${period.toUpperCase()}\n`,
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
        `\x1Ba\x01`, `End of Report\n`, `\x1Ba\x00\n\n\n`,
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

  const handleShare = () => {
    const text = `📊 *${appSettings.companyName || 'Bread App'} - Manager Report (${period})*\n\n💰 Total Sales: ${fmt(metrics.totalSales)}\n✅ Cash: ${fmt(metrics.cashSales)} | 💳 Debt: ${fmt(metrics.debtSales)}\n🍞 Bread Sold: ${metrics.breadSold} units\n\n📈 *Our 10% Share: ${fmt(metrics.ourShare)}*\n💸 Our Expenses: ${fmt(metrics.totalExpenses)}\n*💵 Net Profit: ${fmt(metrics.netProfit)}*\n\n🏭 Bakery Share (90%): ${fmt(metrics.bakeryOwed)}\n💸 Paid to Company: -${fmt(metrics.companyPaid)}\n*⚠️ Remaining Balance: ${fmt(metrics.netBakeryOwed)}*\n\n⚠️ Customer Debt: ${fmt(metrics.outstandingDebt)}\n📦 Stock Value: ${fmt(metrics.stockRetailValue)}\n🕐 ${new Date().toLocaleString()}`;
    if (navigator.share) navigator.share({ title: 'Sales Report', text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AnimatedPage>
      <div ref={reportRef} className="container pb-24">
        <style>{`
          @media print {
            @page { margin: 0; size: 58mm auto; }
            html, body { margin: 0 !important; width: 58mm !important; background: #fff !important; }
            .no-print { display: none !important; }
            * { font-family: monospace !important; color: #000 !important; }
          }
        `}</style>
        
        {/* Header */}
        <div className="no-print flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
              <ArrowLeft size={20} className="text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">📊 Executive Report</h1>
              <p className="text-xs text-secondary">{appSettings.companyName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-xl font-bold text-xs shadow-sm shadow-green-600/20"><Share2 size={14}/> Share</button>
            <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20"><Printer size={14}/> Print</button>
          </div>
        </div>

        {/* Period Filter */}
        <div className="no-print flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
          {(['Today', 'Week', 'Month', 'All'] as Period[]).map(p => (
            <button 
              key={p} 
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${period === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-surface text-secondary border-[var(--border-color)]'}`} 
              onClick={() => setPeriod(p)}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>

        {/* Hero Net Profit */}
        <div className={`rounded-3xl p-6 text-white relative flex flex-col items-start justify-center overflow-hidden mb-6 shadow-xl border border-white/10 ${metrics.netProfit >= 0 ? 'bg-gradient-to-br from-indigo-600 to-purple-800' : 'bg-gradient-to-br from-red-600 to-rose-800'}`}>
           <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
           <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10" size={100} />
           
           <div className="flex items-center gap-2 mb-1 opacity-90 text-sm font-bold tracking-wide uppercase">
             {metrics.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} 
             Net Profit • {periodLabel[period]}
           </div>
           <div className="text-4xl font-black mb-2 tracking-tight">
             {fmt(metrics.netProfit)}
           </div>
           <div className="text-xs opacity-80 mb-4 font-medium">
             Our 10% Share: {fmt(metrics.ourShare)} — Expenses: {fmt(metrics.totalExpenses)}
           </div>
           
           <div className="grid grid-cols-3 gap-4 w-full border-t border-white/20 pt-4 mt-2">
             <div><div className="text-[10px] uppercase opacity-70 font-bold">Total Sales</div><div className="text-lg font-bold">{fmt(metrics.totalSales)}</div></div>
             <div><div className="text-[10px] uppercase opacity-70 font-bold">10% Ours</div><div className="text-lg font-bold">{fmt(metrics.ourShare)}</div></div>
             <div><div className="text-[10px] uppercase opacity-70 font-bold">Bakery 90%</div><div className="text-lg font-bold">{fmt(metrics.bakeryOwed)}</div></div>
           </div>
        </div>

        {/* Tabs */}
        <div className="no-print flex overflow-x-auto border-b border-[var(--border-color)] mb-6 custom-scrollbar pb-1">
          {([
            { id: 'overview', icon: BarChart2, label: 'Overview' },
            { id: 'transactions', icon: Receipt, label: 'Sales Feed' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'expenses', icon: ArrowDownRight, label: 'Expenses' },
            { id: 'debts', icon: CreditCard, label: 'Debtors' },
          ] as const).map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-1 pb-2 pt-1 font-bold text-xs whitespace-nowrap transition-colors border-b-2 px-4 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-secondary'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-4">
             <div className="grid grid-cols-2 gap-4">
               <StatCard label="Cash In" value={fmt(metrics.cashSales + metrics.debtCollected)} icon={Wallet} color="#16a34a" sub="Physical funds received" />
               <StatCard label="Cash Out" value={fmt(metrics.totalExpenses)} icon={ArrowDownRight} color="#dc2626" sub="Operational expenses" />
               <StatCard label="Debt Issued" value={fmt(metrics.debtSales)} icon={CreditCard} color="#dc2626" sub={`${filteredTxs.filter(tx => tx.type === 'Debt').length} credit instances`} />
               <StatCard label="Bread Sold" value={`${metrics.breadSold} units`} icon={ShoppingBag} color="#7c3aed" sub={`Avg: ${fmt(metrics.avgSaleValue)}/sale`} />
             </div>

             <div className="bg-surface p-6 rounded-3xl border border-[var(--border-color)] mt-2">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Revenue Trend</h3>
                    <p className="text-[10px] text-secondary">Hourly / Weekly performance metric</p>
                  </div>
                  <div className="font-black text-indigo-600 dark:text-indigo-400">
                    {fmt(period === 'Today' ? metrics.totalSales : weekTrend.reduce((s,d) => s + d.value, 0))}
                  </div>
                </div>
                <MiniBar data={period === 'Today' ? hourlyTrend : weekTrend} color={period === 'Today' ? '#7c3aed' : '#4f46e5'} />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <StatCard label="Customer Debt" value={fmt(metrics.outstandingDebt)} icon={AlertTriangle} color="#d97706" onClick={() => setActiveTab('debts')} />
               <StatCard label="Stock Value" value={fmt(metrics.stockRetailValue)} icon={Package} color="#2563eb" sub={`${products.filter(p => p.active).reduce((s,p) => s + p.stock, 0)} units total`} />
             </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={16} />
              <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search transactions..." className="form-input bg-surface pl-10 py-3 w-full font-bold text-sm shadow-sm" />
            </div>
            <div className="grid gap-3">
              {displayedTxs.map(tx => (
                <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)} className="bg-surface p-4 rounded-2xl border border-[var(--border-color)] flex justify-between items-center cursor-pointer shadow-sm hover:border-indigo-500/50 transition-colors">
                  <div>
                     <div className="font-bold text-sm">{getCustomerName(tx.customerId)}</div>
                     <div className="text-[10px] opacity-60 font-medium my-1">{getTransactionItems(tx).map(i => `${i.quantity}×`).join(', ')} Items</div>
                     <div className="text-[10px] text-secondary">{fmtDate(tx.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg">{fmt(tx.totalPrice)}</div>
                    <div className={`text-[10px] font-bold uppercase ${tx.type === 'Debt' ? 'text-danger' : 'text-success'}`}>{tx.type}</div>
                  </div>
                  <ChevronRight size={16} className="text-secondary ml-2 opacity-30" />
                </div>
              ))}
              {displayedTxs.length === 0 && <div className="text-center p-8 opacity-50 font-medium text-sm">No transactions found.</div>}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid gap-3">
            {productStats.map((ps, idx) => {
              const totalRev = productStats.reduce((s, p) => s + p.revenue, 1);
              const pct = Math.round((ps.revenue / totalRev) * 100);
              return (
                <div key={ps.id} className="bg-surface p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-black text-indigo-600 text-lg">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
                      </div>
                      <div>
                        <div className="font-bold text-[15px]">{ps.name}</div>
                        <div className="text-[11px] text-secondary font-medium">{ps.qty} units @ ₦{ps.price}/ea</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[15px]">{fmt(ps.revenue)}</div>
                      <div className="text-[10px] text-secondary font-bold">{pct}% share</div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 mb-6 flex justify-between items-center">
              <div>
                <div className="text-red-500 font-bold text-[11px] uppercase tracking-wider mb-1">Total Expenses • {periodLabel[period]}</div>
                <div className="text-3xl font-black text-red-500">{fmt(metrics.totalExpenses)}</div>
              </div>
              <ArrowDownRight size={48} className="text-red-500 opacity-20" />
            </div>
            <div className="grid gap-3">
              {filteredExps.map(exp => (
                <div key={exp.id} className="bg-surface p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[15px]">{exp.description}</div>
                    <div className="text-[10px] text-secondary font-medium">{fmtDate(exp.date)}</div>
                  </div>
                  <div className="font-black text-red-500 text-lg">{fmt(exp.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debts Tab */}
        {activeTab === 'debts' && (
          <div>
            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 mb-6 flex justify-between items-center">
               <div>
                 <div className="text-amber-600 font-bold text-[11px] uppercase tracking-wider mb-1">Total Market Debt</div>
                 <div className="text-3xl font-black text-amber-600">{fmt(metrics.outstandingDebt)}</div>
                 <div className="text-xs text-amber-600/70 mt-1 font-bold">{debtors.length} Debtors Profiled</div>
               </div>
               <AlertTriangle size={48} className="text-amber-500 opacity-20" />
            </div>
            <div className="grid gap-3">
              {debtors.map(c => {
                const pct = Math.min(100, Math.round((c.debtBalance / metrics.outstandingDebt) * 100));
                return (
                  <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="bg-surface p-4 rounded-2xl border border-[var(--border-color)] shadow-sm cursor-pointer hover:border-amber-500/40 transition-colors">
                     <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-black text-amber-600 text-lg">
                             {c.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <div className="font-bold text-[15px]">{c.name}</div>
                             <div className="text-[11px] text-secondary">{c.phone || 'No phone'}</div>
                           </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-xl text-danger">{fmt(c.debtBalance)}</div>
                          <div className="text-[10px] font-bold text-secondary">{pct}% of total</div>
                        </div>
                     </div>
                     <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500" style={{ width: `${pct}%` }}></div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ManagerReports;
