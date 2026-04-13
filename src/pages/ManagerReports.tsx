import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  BarChart2, TrendingUp, CreditCard,
  Package, Receipt, Search, Download,
  Wallet, AlertTriangle, Printer,
  ArrowDownRight, DollarSign, ArrowLeft, PieChart, Activity
} from 'lucide-react';

/* ── Design Tokens ── */
const T = {
  bg: '#f2f3f7',
  surface: '#ffffff',
  surface2: '#f8f9fc',
  border: '#e8eaef',
  accent: '#4f46e5',
  accentLt: '#eef2ff',
  success: '#10b981',
  successLt: '#ecfdf5',
  danger: '#ef4444',
  dangerLt: '#fef2f2',
  warn: '#f59e0b',
  warnLt: '#fffbeb',
  txt: '#0f172a',
  txt2: '#475569',
  txt3: '#94a3b8',
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  radius: '16px',
  radiusLg: '24px',
};

type Period = 'Today' | 'Week' | 'Month' | 'All' | 'Custom';
type Tab = 'overview' | 'transactions' | 'products' | 'expenses' | 'debts';

const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const StatCard = ({ label, value, sub, color = T.accent, icon: Icon, onClick }: any) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: '16px', boxShadow: T.shadow, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '64px', height: '64px', borderRadius: '50%', background: color, opacity: 0.05 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
    <div style={{ fontSize: '20px', fontWeight: 900, color: T.txt, letterSpacing: '-0.02em', margin: 0 }}>{value}</div>
    {sub && <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, marginTop: '4px' }}>{sub}</div>}
  </div>
);

const MiniBar = ({ data, color = T.accent }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '70px', width: '100%' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max((d.value / max) * 56, d.value > 0 ? 4 : 0);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '100%', height: `${h}px`, background: isLast ? color : `${color}40`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
            <div style={{ fontSize: '9px', fontWeight: isLast ? 800 : 600, color: isLast ? color : T.txt3 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const ManagerReports: React.FC = () => {
  const { transactions, expenses, products, customers, debtPayments, inventoryLogs } = useAppContext();
  const navigate = useNavigate();

  const [rmLogs, setRmLogs] = useState<any[]>([]);
  
  useEffect(() => {
    supabase.from('rm_logs').select('*').then(({ data }) => {
      if (data) setRmLogs(data);
    });
  }, []);

  const [period, setPeriod] = useState<Period>('Today');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [txSearch, setTxSearch] = useState('');
  
  // Custom Date Range State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const { filteredTxs, filteredExps, filteredDebtPayments, filteredInventory, filteredRmLogs } = useMemo(() => {
    let txs = transactions, exps = expenses, dps = debtPayments, invs = inventoryLogs, rmls = rmLogs;
    const now = new Date();
    
    if (period === 'Today') {
      const todayStr = now.toISOString().split('T')[0];
      txs = txs.filter(t => t.date.startsWith(todayStr));
      exps = exps.filter(e => e.date.startsWith(todayStr));
      dps = dps.filter(d => d.date.startsWith(todayStr));
      invs = invs.filter(i => i.date.startsWith(todayStr));
      rmls = rmls.filter(r => r.created_at?.startsWith(todayStr));
    } else if (period === 'Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      txs = txs.filter(t => new Date(t.date) >= weekAgo);
      exps = exps.filter(e => new Date(e.date) >= weekAgo);
      dps = dps.filter(d => new Date(d.date) >= weekAgo);
      invs = invs.filter(i => new Date(i.date) >= weekAgo);
      rmls = rmls.filter(r => new Date(r.created_at) >= weekAgo);
    } else if (period === 'Month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      txs = txs.filter(t => new Date(t.date) >= monthAgo);
      exps = exps.filter(e => new Date(e.date) >= monthAgo);
      dps = dps.filter(d => new Date(d.date) >= monthAgo);
      invs = invs.filter(i => new Date(i.date) >= monthAgo);
      rmls = rmls.filter(r => new Date(r.created_at) >= monthAgo);
    } else if (period === 'Custom') {
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      txs = txs.filter(t => { const d = new Date(t.date); return d >= start && d <= end; });
      exps = exps.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
      dps = dps.filter(d => { const dt = new Date(d.date); return dt >= start && dt <= end; });
      invs = invs.filter(i => { const d = new Date(i.date); return d >= start && d <= end; });
      rmls = rmls.filter(r => { const d = new Date(r.created_at); return d >= start && d <= end; });
    }
    return { filteredTxs: txs, filteredExps: exps, filteredDebtPayments: dps, filteredInventory: invs, filteredRmLogs: rmls };
  }, [period, startDate, endDate, transactions, expenses, debtPayments, inventoryLogs, rmLogs]);

  const metrics = useMemo(() => {
    // 1. Bread Produced (Net) = Received - Returned (ONLY PRODUCTION CATEGORY)
    const invLogs = filteredInventory.filter(l => !l.category || l.category === 'PRODUCTION');
    const receivedValue = invLogs.filter(l => l.type === 'Receive').reduce((s, l) => s + (l.quantityReceived * l.costPrice), 0);
    const returnedValue = invLogs.filter(l => l.type === 'Return').reduce((s, l) => s + (l.quantityReceived * l.costPrice), 0);
    const totalBreadValue = Math.max(0, receivedValue - returnedValue);
    const bakeryIncome = totalBreadValue * 0.90; // The Bakery takes 90% of the value sent to store
    
    // 2. Raw Materials Cost
    // We average the RESTOCK price across all time to get a stable unit cost
    const unitCosts: Record<string, { cost: number; qty: number }> = {};
    rmLogs.forEach(log => {
      if (log.type === 'RESTOCK' && log.items) {
         log.items.forEach((item: any) => {
            const mId = item.material_id;
            if (!unitCosts[mId]) unitCosts[mId] = { cost: 0, qty: 0 };
            unitCosts[mId].cost += parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
            unitCosts[mId].qty += parseFloat(item.quantity || 0);
         });
      }
    });
    
    // Fallback: If no restock logs found, check raw_materials table if they were seeded with a cost (legacy)
    // For now we rely on RESTOCK logs as that's the current system's source of truth
    
    let rawMaterialsUsedCost = 0;
    filteredRmLogs.filter(l => l.type === 'USAGE').forEach(usage => {
       const matId = usage.material_id;
       const qty = parseFloat(usage.quantity || 0);
       let avgPrice = 0;
       if (matId && unitCosts[matId] && unitCosts[matId].qty > 0) {
          avgPrice = unitCosts[matId].cost / unitCosts[matId].qty;
       }
       rawMaterialsUsedCost += (qty * avgPrice);
    });

    const totalSales = filteredTxs.reduce((s, t) => s + t.totalPrice, 0);
    const cashSales = filteredTxs.filter(t => t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0);
    const debtSales = filteredTxs.filter(t => t.type === 'Debt').reduce((s, t) => s + t.totalPrice, 0);
    
    // 3. Expenses (Staff, Fuel, etc.)
    const mgtExps = filteredExps.filter(e => e.type === 'MANAGER');
    const totalExpenses = mgtExps.reduce((s, e) => s + e.amount, 0);
    
    const breadSold = filteredTxs.reduce((s, t) => s + getTransactionItems(t).reduce((ss, i) => ss + i.quantity, 0), 0);
    
    // FINAL BAKERY PROFIT
    const netProfit = bakeryIncome - rawMaterialsUsedCost - totalExpenses;
    const grossMargin = bakeryIncome > 0 ? (netProfit / bakeryIncome) * 100 : 0;
    const avgOrderValue = filteredTxs.length > 0 ? totalSales / filteredTxs.length : 0;
    
    // Cash Drawer / Till Expectation
    const debtCollected = filteredDebtPayments.reduce((s, dp) => s + Number(dp.amount || 0), 0);
    const expectedCashInHand = cashSales + debtCollected - totalExpenses;

    const outstandingDebt = customers.reduce((s, c) => s + (c.debtBalance || 0), 0);
    const stockRetailValue = products.filter(p => p.active).reduce((s, p) => s + p.stock * p.price, 0);

    return {
      totalSales, cashSales, debtSales, totalExpenses, breadSold,
      netProfit, grossMargin, avgOrderValue, txCount: filteredTxs.length,
      outstandingDebt, stockRetailValue, debtCollected, expectedCashInHand,
      bakeryIncome, rawMaterialsUsedCost, totalBreadValue, receivedValue, returnedValue
    };
  }, [filteredTxs, filteredExps, filteredDebtPayments, filteredInventory, filteredRmLogs, rmLogs, customers, products]);

  // Product Analysis
  const productStats = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    filteredTxs.forEach(tx => getTransactionItems(tx).forEach(item => {
      if (!map[item.productId]) map[item.productId] = { qty: 0, revenue: 0 };
      map[item.productId].qty += item.quantity;
      map[item.productId].revenue += item.quantity * item.unitPrice;
    }));
    return Object.entries(map).map(([id, data]) => ({ 
      id, name: products.find(p => p.id === id)?.name || 'Unknown', 
      price: products.find(p => p.id === id)?.price || 0,
      ...data 
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTxs, products]);

  // Trends
  const hourlyTrend = useMemo(() => Array.from({length: 12}, (_, i) => {
    const h = i * 2;
    const label = `${h===0?12:h>12?h-12:h}${h<12?'a':'p'}`;
    return { label, value: filteredTxs.filter(tx => { const th = new Date(tx.date).getHours(); return th >= h && th < h + 2; }).reduce((s, tx) => s + tx.totalPrice, 0)};
  }), [filteredTxs]);

  const displayedTxs = useMemo(() => {
    const q = txSearch.toLowerCase();
    return [...filteredTxs].filter(tx => {
      const cust = customers.find(c => c.id === tx.customerId);
      return !q || cust?.name.toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTxs, txSearch, customers]);

  // EXPORT TO CSV FEATURE
  const handleExportCSV = () => {
    try {
      let csv = 'Date,Time,Customer,Type,Items,TotalAmount,Discount\n';
      displayedTxs.forEach(tx => {
        const d = new Date(tx.date);
        const dateStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        const timeStr = `${d.getHours()}:${d.getMinutes()}`;
        const custName = customers.find(c => c.id === tx.customerId)?.name || 'Walk-in';
        const itemsCount = getTransactionItems(tx).length;
        csv += `${dateStr},${timeStr},"${custName}",${tx.type},${itemsCount},${tx.totalPrice},${tx.discount || 0}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `BreadApp_Sales_${period}_${Date.now()}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { alert('Export failed'); }
  };

  return (
    <AnimatedPage>
      <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: '96px' }}>
        <div style={{ padding: '20px 16px 0' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.surface, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: T.shadow }}>
                 <ArrowLeft size={18} color={T.txt} />
               </button>
               <div>
                 <h1 style={{ color: T.txt, fontWeight: 900, fontSize: '20px', margin: 0 }}>Executive Report</h1>
                 <p style={{ color: T.txt3, fontSize: '11px', fontWeight: 600, margin: '2px 0 0' }}>Advanced Metrics & Print</p>
               </div>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
               <button onClick={handleExportCSV} style={{ padding: '8px 12px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: T.shadow, color: T.txt2, fontWeight: 700, fontSize: '11px' }}>
                  <Download size={14} /> CSV
               </button>
               <button onClick={() => window.print()} style={{ padding: '8px 12px', background: T.accent, border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: `0 4px 12px ${T.accent}40`, color: '#fff', fontWeight: 700, fontSize: '11px' }}>
                  <Printer size={14} /> Print
               </button>
             </div>
          </div>

          {/* Premium Date Selector */}
          <div style={{ background: T.surface, borderRadius: T.radius, padding: '6px', display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: showCustomRange ? '12px' : '24px', boxShadow: T.shadow, border: `1.5px solid ${T.border}` }}>
            {(['Today', 'Week', 'Month', 'All', 'Custom'] as Period[]).map(p => (
              <button key={p} onClick={() => { setPeriod(p); if (p !== 'Custom') setShowCustomRange(false); else setShowCustomRange(true); }}
                style={{ flex: 1, minWidth: '70px', background: period === p ? T.surface2 : 'transparent', color: period === p ? T.txt : T.txt3, border: `1.5px solid ${period === p ? T.border : 'transparent'}`, borderRadius: '10px', padding: '8px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {p}
              </button>
            ))}
          </div>
          
          {showCustomRange && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: T.surface, padding: '12px', borderRadius: T.radius, border: `1.5px solid ${T.border}` }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>From</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: T.surface2, color: T.txt, fontWeight: 600, fontSize: '12px', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>To</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1.5px solid ${T.border}`, background: T.surface2, color: T.txt, fontWeight: 600, fontSize: '12px', outline: 'none' }} />
              </div>
            </div>
          )}

          {/* Master Profit Hero Header */}
          <div style={{ position: 'relative', background: `linear-gradient(135deg, ${T.txt} 0%, #1e293b 100%)`, borderRadius: '28px', padding: '24px', marginBottom: '24px', color: '#fff', overflow: 'hidden', boxShadow: '0 12px 32px rgba(15,23,42,0.2)' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '200px', height: '200px', background: 'rgba(16,185,129,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <BarChart2 size={16} color="#fff" />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, display: 'block' }}>Company Net Profit</span>
                <span style={{ fontSize: '9px', fontWeight: 600, opacity: 0.6, display: 'block' }}>Total Gross Revenue minus Operating Expenses</span>
              </div>
            </div>
            
            <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '20px' }}>
              {fmt(metrics.netProfit)}
            </div>
            
            {/* Master Metrics Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                 <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6ee7b7', display: 'block', marginBottom: '4px' }}>Bakery Revenue (90%)</span>
                 <span style={{ fontSize: '14px', fontWeight: 800 }}>{fmt(metrics.bakeryIncome)}</span>
                 <div style={{ fontSize: '9px', fontWeight: 500, opacity: 0.6, marginTop: '2px' }}>Net Prod: {fmt(metrics.totalBreadValue)}</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                 <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#fca5a5', display: 'block', marginBottom: '4px' }}>Bakery RM & Exp.</span>
                 <span style={{ fontSize: '14px', fontWeight: 800 }}>{fmt(metrics.rawMaterialsUsedCost + metrics.totalExpenses)}</span>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
                 <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#93c5fd', display: 'block', marginBottom: '4px' }}>Net Profit %</span>
                 <span style={{ fontSize: '14px', fontWeight: 800 }}>{metrics.grossMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Premium Tabs */}
          <div style={{ display: 'flex', background: 'transparent', paddingBottom: '16px', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {([
              { id: 'overview', icon: Activity, label: 'Analytics' },
              { id: 'transactions', icon: Receipt, label: 'Feed' },
              { id: 'products', icon: Package, label: 'Products' },
              { id: 'expenses', icon: ArrowDownRight, label: 'Expenses' },
              { id: 'debts', icon: AlertTriangle, label: 'Debtors' }
            ] as const).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as Tab)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: activeTab === t.id ? T.txt : T.surface, color: activeTab === t.id ? '#fff' : T.txt2, border: `1.5px solid ${activeTab === t.id ? T.txt : T.border}`, fontWeight: 800, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: activeTab === t.id ? '0 4px 12px rgba(15,23,42,0.2)' : T.shadow }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* ────── OVERVIEW TAB ────── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Expected Till Balance - NEW FEATURE */}
              <div style={{ background: T.successLt, border: `1.5px solid #a7f3d0`, borderRadius: T.radiusLg, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: T.shadow }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }}>
                  <Wallet size={24} color={T.success} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#047857', marginBottom: '4px' }}>Expected Cash In Till</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b', margin: 0 }}>{fmt(metrics.expectedCashInHand)}</div>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: 600, marginTop: '2px' }}>Cash Sales + Debt Collected - Expenses</div>
                </div>
              </div>

               {/* 4 Block Stats + 2 New Master Metrics */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <StatCard label="Gross Sales" value={fmt(metrics.totalSales)} icon={TrendingUp} color={T.accent} sub={`${metrics.breadSold} units sold.`} />
                  <StatCard label="Cash Revenue" value={fmt(metrics.cashSales)} icon={DollarSign} color={T.success} sub={`+ ${fmt(metrics.debtCollected)} debts collected`} />
                  <StatCard label="Average Order" value={fmt(metrics.avgOrderValue)} icon={Activity} color={'#8b5cf6'} sub={`${metrics.txCount} total transactions`} />
                  <StatCard label="Debts Issued" value={fmt(metrics.debtSales)} icon={CreditCard} color={T.warn} sub={`${Math.round((metrics.debtSales/metrics.totalSales)*100 || 0)}% of total sales`} />
               </div>

               {/* BAKERY ECONOMICS TRANSPARENCY Drilldown - NEW */}
               <div style={{ background: T.accentLt, padding: '20px', borderRadius: T.radiusLg, border: `1.5px solid ${T.accent}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                     <PieChart size={18} color={T.accent} />
                     <span style={{ fontSize: '11px', fontWeight: 800, color: T.txt, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bakery Profit Math (Based on Dispatch)</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${T.accent}20`, paddingBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: T.txt2 }}>Gross Dispatch (Production)</span>
                        <span style={{ fontSize: '11px', fontWeight: 700 }}>{fmt(metrics.receivedValue)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${T.accent}20`, paddingBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: T.txt2 }}>Less Returns (Unsold)</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.danger }}>- {fmt(metrics.returnedValue)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.accent}30`, paddingBottom: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.txt }}>Net Production Value</span>
                        <span style={{ fontSize: '11px', fontWeight: 900 }}>{fmt(metrics.totalBreadValue)}</span>
                     </div>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', borderLeft: `2px solid ${T.success}50` }}>
                        <span style={{ fontSize: '11px', color: T.txt2 }}>Bakery Gross Income (90% Share)</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: T.success }}>{fmt(metrics.bakeryIncome)}</span>
                     </div>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', borderLeft: `2px solid ${T.danger}50` }}>
                        <span style={{ fontSize: '11px', color: T.txt2 }}>Less RM Cost (Usage)</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.danger }}>- {fmt(metrics.rawMaterialsUsedCost)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', borderLeft: `2px solid ${T.danger}50` }}>
                        <span style={{ fontSize: '11px', color: T.txt2 }}>Less Manager Expenses</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.danger }}>- {fmt(metrics.totalExpenses)}</span>
                     </div>
                     
                     <div style={{ marginTop: '8px', padding: '12px', background: T.surface, borderRadius: '12px', border: `1px solid ${T.accent}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Net Bakery Profit</span>
                           <span style={{ fontSize: '18px', fontWeight: 900, color: T.txt }}>{fmt(metrics.netProfit)}</span>
                        </div>
                        <div style={{ height: '32px', padding: '0 10px', borderRadius: '8px', background: T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <span style={{ fontSize: '12px', fontWeight: 900, color: T.success }}>{metrics.grossMargin.toFixed(1)}%</span>
                        </div>
                     </div>
                  </div>
               </div>

              {/* Sales Distribution Bar */}
              <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: '20px', boxShadow: T.shadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: T.txt }}>Revenue Structure</span>
                  <PieChart size={16} color={T.txt3} />
                </div>
                <div style={{ width: '100%', height: '12px', borderRadius: '10px', overflow: 'hidden', display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: `${(metrics.cashSales / metrics.totalSales)*100 || 0}%`, background: T.success, height: '100%' }} />
                  <div style={{ width: `${(metrics.debtSales / metrics.totalSales)*100 || 0}%`, background: T.warn, height: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.success}}/> Cash</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: T.txt }}>{Math.round((metrics.cashSales/metrics.totalSales)*100 || 0)}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: T.txt3, fontWeight: 700, textTransform: 'uppercase' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.warn}}/> Debt</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: T.txt }}>{Math.round((metrics.debtSales/metrics.totalSales)*100 || 0)}%</div>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: '20px', boxShadow: T.shadow, marginBottom: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: T.txt }}>Activity Velocity</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.accent, background: T.accentLt, padding: '4px 8px', borderRadius: '8px' }}>Active Period</span>
                 </div>
                 <MiniBar data={hourlyTrend} color={T.accent} />
              </div>
            </div>
          )}

          {/* ────── TRANSACTIONS TAB ────── */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search invoices..." value={txSearch} onChange={e => setTxSearch(e.target.value)}
                  style={{ width: '100%', padding: '14px 14px 14px 40px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '16px', fontSize: '13px', fontWeight: 600, color: T.txt, outline: 'none', boxShadow: T.shadow }} />
              </div>
              
              {displayedTxs.map(tx => (
                <div key={tx.id} onClick={() => navigate(`/receipt/${tx.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tx.type === 'Debt' ? T.dangerLt : T.successLt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Receipt size={16} color={tx.type === 'Debt' ? T.danger : T.success} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '2px' }}>{customers.find(c => c.id === tx.customerId)?.name || 'Walk-in'}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{fmtDate(tx.date)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: T.txt, marginBottom: '2px' }}>{fmt(tx.totalPrice)}</div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: tx.type === 'Debt' ? T.danger : T.success, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tx.type}</div>
                  </div>
                </div>
              ))}
              {displayedTxs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: T.txt3, fontSize: '12px', fontWeight: 600 }}>No matching transactions found in this period.</div>}
            </div>
          )}

          {/* ────── PRODUCTS TAB ────── */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productStats.map((ps, idx) => {
                 const totalRev = productStats.reduce((s, p) => s + p.revenue, 1) || 1;
                 const pct = (ps.revenue / totalRev) * 100;
                 return (
                   <div key={ps.id} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '16px', padding: '16px', boxShadow: T.shadow }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.surface2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: T.accent }}>
                           #{idx + 1}
                         </div>
                         <div>
                           <div style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '2px' }}>{ps.name}</div>
                           <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{ps.qty} sold @ ₦{ps.price}</div>
                         </div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '16px', fontWeight: 900, color: T.txt, marginBottom: '2px' }}>{fmt(ps.revenue)}</div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.accent }}>{pct.toFixed(1)}% Share</div>
                       </div>
                     </div>
                     <div style={{ height: '6px', width: '100%', background: T.surface2, borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${pct}%`, background: T.accent, borderRadius: '4px' }} />
                     </div>
                   </div>
                 );
              })}
            </div>
          )}

          {/* ────── EXPENSES TAB ────── */}
          {activeTab === 'expenses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: T.dangerLt, border: `1.5px solid #fecaca`, borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.danger, marginBottom: '8px' }}>Total Manager Expenses</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#991b1b', margin: 0 }}>{fmt(metrics.totalExpenses)}</div>
              </div>
              {filteredExps.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '16px', padding: '16px', boxShadow: T.shadow }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '4px' }}>{e.description}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: T.txt3, textTransform: 'uppercase' }}>{fmtDate(e.date)}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: T.danger }}>{fmt(e.amount)}</div>
                </div>
              ))}
              {filteredExps.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: T.txt3, fontSize: '12px', fontWeight: 600 }}>No expenses recorded in this period.</div>}
            </div>
          )}

          {/* ────── DEBTS TAB ────── */}
          {activeTab === 'debts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: T.warnLt, border: `1.5px solid #fde68a`, borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#92400e', marginBottom: '8px' }}>Total Outstanding Market Debt</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#78350f', margin: 0 }}>{fmt(metrics.outstandingDebt)}</div>
              </div>
              {customers.filter(c => c.debtBalance > 0).sort((a,b) => b.debtBalance - a.debtBalance).map(c => {
                 const pct = (c.debtBalance / metrics.outstandingDebt) * 100;
                 return (
                   <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: '16px', padding: '16px', boxShadow: T.shadow, cursor: 'pointer' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                       <div>
                         <div style={{ fontSize: '15px', fontWeight: 800, color: T.txt, marginBottom: '4px' }}>{c.name}</div>
                         <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{c.phone || 'No phone'}</div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '18px', fontWeight: 900, color: T.danger, marginBottom: '4px' }}>{fmt(c.debtBalance)}</div>
                         <div style={{ fontSize: '9px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{pct.toFixed(1)}% of total</div>
                       </div>
                     </div>
                     <div style={{ height: '6px', width: '100%', background: T.dangerLt, borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${pct}%`, background: T.danger, borderRadius: '4px' }} />
                     </div>
                   </div>
                 );
              })}
            </div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerReports;
