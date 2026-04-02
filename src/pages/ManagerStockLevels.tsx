import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Package, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { getTransactionItems } from '../store/types';

const T = {
  bg: '#f8f7ff', white: '#ffffff', primary: '#7c3aed', pLight: 'rgba(124,58,237,0.08)',
  emerald: '#059669', emeraldL: 'rgba(5,150,105,0.10)', rose: '#e11d48', roseL: 'rgba(225,29,72,0.08)',
  amber: '#d97706', amberL: 'rgba(217,119,6,0.10)', ink: '#1a0a3b', txt2: '#475569', txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.06)', radius: '18px', shadow: '0 4px 20px rgba(124,58,237,0.08)',
};

const ManagerStockLevels: React.FC = () => {
  const navigate = useNavigate();
  const { products, transactions } = useAppContext();

  const today = new Date().toISOString().split('T')[0];
  const soldMap: Record<string, number> = {};
  transactions.filter(t => t.date.startsWith(today)).forEach(t => {
    getTransactionItems(t).forEach(item => {
      soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
    });
  });

  const activeProducts = products.filter(p => p.active);
  const totalStock = activeProducts.reduce((s, p) => s + p.stock, 0);
  const lowStockItems = activeProducts.filter(p => p.stock < 20);
  const outOfStock = activeProducts.filter(p => p.stock === 0);
  const totalSoldToday = Object.values(soldMap).reduce((s, v) => s + v, 0);

  const chartData = activeProducts.map(p => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name,
    stock: p.stock,
    sold: soldMap[p.id] || 0,
    isLow: p.stock < 20,
  }));

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: '40px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 50%, #4c1d95 100%)', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={20} color="#c4b5fd" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>Stock Levels</h1>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>Live inventory overview for all products</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { label: 'Total Stock', value: totalStock, icon: Package, color: T.primary, bg: T.pLight },
              { label: 'Sold Today', value: totalSoldToday, icon: TrendingUp, color: T.emerald, bg: T.emeraldL },
              { label: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, color: T.amber, bg: T.amberL },
              { label: 'Out of Stock', value: outOfStock.length, icon: TrendingDown, color: T.rose, bg: T.roseL },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginBottom: '14px' }}>Stock vs Sold Today</div>
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke={T.txt3} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} stroke={T.txt3} />
                  <Tooltip contentStyle={{ background: T.white, borderRadius: '10px', fontSize: '11px', border: `1px solid ${T.borderL}` }} />
                  <Bar dataKey="stock" name="Stock" radius={[5, 5, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.isLow ? T.rose : T.primary} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Bar dataKey="sold" name="Sold" fill={T.amber} radius={[5, 5, 0, 0]} fillOpacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: T.primary }} />
                <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>In Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: T.amber }} />
                <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Sold Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: T.rose }} />
                <span style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Low Stock</span>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div style={{ background: T.white, borderRadius: T.radius, padding: '16px', boxShadow: T.shadow, border: `1px solid ${T.borderL}` }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginBottom: '12px' }}>All Products</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: T.txt3, fontSize: '13px' }}>No active products.</div>
              ) : activeProducts.sort((a, b) => a.stock - b.stock).map((p, i) => {
                const sold = soldMap[p.id] || 0;
                const isLow = p.stock < 20;
                const isOut = p.stock === 0;
                const maxStock = Math.max(...activeProducts.map(x => x.stock + (soldMap[x.id] || 0)), 1);
                const pct = Math.round((p.stock / maxStock) * 100);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: '12px', borderRadius: '14px', background: isOut ? T.roseL : isLow ? T.amberL : T.bg, border: `1px solid ${isOut ? T.rose + '30' : isLow ? T.amber + '25' : T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🍞</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{p.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {sold > 0 && <span style={{ fontSize: '9px', fontWeight: 800, color: T.amber, background: T.amberL, padding: '2px 6px', borderRadius: '5px' }}>-{sold} sold</span>}
                        {isOut ? (
                          <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff', background: T.rose, padding: '2px 7px', borderRadius: '5px' }}>OUT</span>
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: 800, color: isLow ? T.amber : T.emerald, background: isLow ? T.amberL : T.emeraldL, padding: '2px 7px', borderRadius: '5px' }}>{p.stock} left</span>
                        )}
                      </div>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                        style={{ height: '100%', background: isOut ? T.rose : isLow ? T.amber : `linear-gradient(90deg, ${T.emerald}, ${T.primary})`, borderRadius: '3px' }} />
                    </div>
                    {isLow && !isOut && <div style={{ fontSize: '10px', color: T.amber, fontWeight: 700, marginTop: '5px' }}>⚠️ Low stock — reorder recommended</div>}
                    {isOut && <div style={{ fontSize: '10px', color: T.rose, fontWeight: 700, marginTop: '5px' }}>🚫 Out of stock — immediate restock needed</div>}
                    {p.price && <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600, marginTop: '3px' }}>Unit price: ₦{p.price?.toLocaleString()}</div>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Status summary */}
          <div style={{ background: `linear-gradient(135deg, #1a0050, #2d1b69)`, borderRadius: '20px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '4px' }}>Overall Status</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: lowStockItems.length === 0 ? '#6ee7b7' : T.amber }}>
                {outOfStock.length > 0 ? '🚫 Critical — items out of stock' : lowStockItems.length > 0 ? '⚠️ Warning — restock needed' : '✅ All stock levels good'}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {lowStockItems.length === 0 ? <CheckCircle size={22} color="#6ee7b7" /> : <AlertTriangle size={22} color="#fde68a" />}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerStockLevels;
