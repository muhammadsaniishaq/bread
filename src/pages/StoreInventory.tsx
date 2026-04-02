import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAppContext } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { getTransactionItems } from '../store/types';
import {
  ArrowLeft, Package, AlertTriangle, CheckCircle,
  Search, ChevronRight, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import StoreBottomNav from '../components/StoreBottomNav';

const T = {
  bg: '#f4f8ff', white: '#ffffff', primary: '#2563eb', pLight: 'rgba(37,99,235,0.09)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)',
  rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)',
  ink: '#0f1c3f', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '20px', shadow: '0 4px 20px rgba(37,99,235,0.08)',
};

const StoreInventory: React.FC = () => {
  const navigate = useNavigate();
  const { products, transactions, inventoryLogs } = useAppContext();
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Build sold map for today
  const soldMap: Record<string, number> = {};
  transactions.filter(t => t.date.startsWith(today)).forEach(tx => {
    getTransactionItems(tx).forEach(item => {
      soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
    });
  });

  // Build received map for today
  const receivedMap: Record<string, number> = {};
  inventoryLogs.filter(l => l.date.startsWith(today) && (l.type || 'Receive') === 'Receive').forEach(l => {
    receivedMap[l.productId] = (receivedMap[l.productId] || 0) + l.quantityReceived;
  });

  const activeProducts = products.filter(p => p.active).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.filter(p => p.active).reduce((s, p) => s + p.stock, 0);
  const lowItems   = products.filter(p => p.active && p.stock < 20);
  const outItems   = products.filter(p => p.active && p.stock === 0);
  const totalReceivedToday = Object.values(receivedMap).reduce((s, v) => s + v, 0);
  const totalSoldToday     = Object.values(soldMap).reduce((s, v) => s + v, 0);

  const chartData = products.filter(p => p.active).map(p => ({
    name: p.name.length > 9 ? p.name.slice(0, 9) + '…' : p.name,
    stock: p.stock,
    sold: soldMap[p.id] || 0,
    received: receivedMap[p.id] || 0,
    isLow: p.stock < 20,
  }));

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '100px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f2952 50%, #1e40af 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '18px' }}>
              <ArrowLeft size={14} /> Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} color="#93c5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Live Stock</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>Real-time inventory levels</p>
              </div>
            </div>

            {/* 4 summary tiles in header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: 'Total Stock', value: totalStock, color: '#93c5fd' },
                { label: 'Received', value: totalReceivedToday, color: '#6ee7b7' },
                { label: 'Dispatched', value: totalSoldToday, color: '#fde68a' },
                { label: 'Low Stock', value: lowItems.length, color: lowItems.length > 0 ? '#fca5a5' : '#6ee7b7' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '8px 6px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginTop: '14px' }}>
              <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '13px', color: 'rgba(255,255,255,0.5)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product…"
                style={{ width: '100%', padding: '11px 12px 11px 35px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Alerts */}
          {outItems.length > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: T.roseL, border: `1px solid ${T.rose}25`, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={16} color={T.rose} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: T.rose }}>Out of Stock</div>
                <div style={{ fontSize: '11px', color: T.txt2 }}>{outItems.map(p => p.name).join(', ')} — restock immediately</div>
              </div>
            </div>
          )}

          {lowItems.length > 0 && outItems.length === 0 && (
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: T.amberL, border: `1px solid ${T.amber}25`, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={16} color={T.amber} />
              <div style={{ fontSize: '12px', fontWeight: 800, color: T.amber }}>⚠️ {lowItems.length} product(s) below 20 units</div>
            </div>
          )}

          {outItems.length === 0 && lowItems.length === 0 && (
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: T.emeraldL, border: `1px solid ${T.emerald}25`, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CheckCircle size={14} color={T.emerald} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: T.emerald }}>All stock levels are healthy ✅</span>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BarChart3 size={14} color={T.primary} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>Stock vs Dispatched Today</span>
              </div>
              <div style={{ height: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke={T.txt3} />
                    <YAxis fontSize={9} tickLine={false} axisLine={false} stroke={T.txt3} />
                    <Tooltip contentStyle={{ background: T.white, borderRadius: '10px', fontSize: '11px', border: `1px solid ${T.borderL}` }} />
                    <Bar dataKey="stock" name="Stock Left" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.isLow ? T.rose : T.primary} fillOpacity={0.85} />)}
                    </Bar>
                    <Bar dataKey="sold" name="Dispatched" fill={T.amber} radius={[4, 4, 0, 0]} fillOpacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '6px' }}>
                {[
                  { color: T.primary, label: 'In Stock' },
                  { color: T.amber, label: 'Dispatched' },
                  { color: T.rose, label: 'Low Stock' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color }} />
                    <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product cards */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginBottom: '12px' }}>All Products</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: T.txt3, fontSize: '13px' }}>No products found.</div>
              ) : activeProducts.sort((a, b) => a.stock - b.stock).map((p, i) => {
                const isLow = p.stock < 20;
                const isOut = p.stock === 0;
                const sold = soldMap[p.id] || 0;
                const received = receivedMap[p.id] || 0;
                const maxPossible = Math.max(p.stock + sold, 1);
                const pct = Math.round((p.stock / maxPossible) * 100);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ padding: '12px', borderRadius: '14px', background: isOut ? T.roseL : isLow ? T.amberL : T.bg, border: `1px solid ${isOut ? T.rose + '25' : isLow ? T.amber + '20' : T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <span style={{ fontSize: '20px' }}>🍞</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink }}>{p.name}</div>
                          {p.price > 0 && <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>₦{p.price.toLocaleString()} / unit</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: isOut ? T.rose : isLow ? T.amber : T.primary }}>{p.stock}</div>
                        <div style={{ fontSize: '9px', color: T.txt3, fontWeight: 700 }}>units left</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                        style={{ height: '100%', background: isOut ? T.rose : isLow ? T.amber : `linear-gradient(90deg, ${T.primary}, #3b82f6)`, borderRadius: '3px' }} />
                    </div>
                    {/* Today's flow */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '7px' }}>
                      {sold > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingDown size={11} color={T.rose} />
                          <span style={{ fontSize: '10px', color: T.rose, fontWeight: 700 }}>-{sold} dispatched</span>
                        </div>
                      )}
                      {received > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingUp size={11} color={T.emerald} />
                          <span style={{ fontSize: '10px', color: T.emerald, fontWeight: 700 }}>+{received} received</span>
                        </div>
                      )}
                      {isOut && <span style={{ fontSize: '10px', color: T.rose, fontWeight: 800 }}>🚫 Out of stock</span>}
                      {isLow && !isOut && <span style={{ fontSize: '10px', color: T.amber, fontWeight: 800 }}>⚠️ Restock needed</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Go to receive stock */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/inventory')}
            style={{ padding: '15px', borderRadius: '16px', background: `linear-gradient(135deg, ${T.primary}, #3b82f6)`, border: 'none', color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}>
            <Package size={16} /> Receive Stock from Bakery <ChevronRight size={15} />
          </motion.button>
        </div>
      </div>
      <StoreBottomNav />
    </AnimatedPage>
  );
};

export default StoreInventory;
