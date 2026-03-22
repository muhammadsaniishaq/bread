import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X,
  UploadCloud, TrendingUp, Box, Tag, ShoppingBag, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../store/types';

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS — matches Raw Materials warm parchment theme
══════════════════════════════════════════════════════ */
const T = {
  bg:         '#F5F2EC',
  bgCard:     '#FFFFFF',
  bgDeep:     '#EEE9E0',
  border:     '#E2DDD4',
  borderMid:  '#CBC5BA',
  amber:      '#B8791A',
  amberBright:'#D4941F',
  amberBg:    'rgba(184,121,26,0.08)',
  amberRing:  'rgba(184,121,26,0.22)',
  amberGrad:  'linear-gradient(135deg, #D4941F 0%, #B8791A 100%)',
  green:      '#1A7A4A',
  greenBg:    'rgba(26,122,74,0.09)',
  red:        '#C0392B',
  redBg:      'rgba(192,57,43,0.08)',
  blue:       '#2563EB',
  blueBg:     'rgba(37,99,235,0.09)',
  purple:     '#7C3AED',
  purpleBg:   'rgba(124,58,237,0.09)',
  text:       '#1A1816',
  textSub:    '#5C584F',
  textMuted:  '#9A9388',
  shadow:     '0 1px 4px rgba(24,22,18,0.07), 0 1px 2px rgba(24,22,18,0.05)',
  shadowMd:   '0 4px 16px rgba(24,22,18,0.10), 0 2px 4px rgba(24,22,18,0.06)',
  shadowLg:   '0 12px 40px rgba(24,22,18,0.14), 0 4px 8px rgba(24,22,18,0.07)',
  shadowXl:   '0 24px 64px rgba(24,22,18,0.18), 0 8px 16px rgba(24,22,18,0.08)',
};

/* ══════════════════════════════════════════════════════
   BOTTOM SHEET — reusable
══════════════════════════════════════════════════════ */
const BottomSheet = ({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(30,24,16,0.45)', backdropFilter: 'blur(10px)' }} />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          style={{ position: 'relative', background: '#FFFFFF', borderRadius: '28px 28px 0 0', maxHeight: '92vh', overflowY: 'auto', boxShadow: T.shadowXl }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: T.border }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 24px 18px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.text, letterSpacing: '-0.025em' }}>{title}</h2>
              {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: T.textSub, fontWeight: 500 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: T.bgDeep, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '0 24px 36px' }}>{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════
   MICRO HELPERS
══════════════════════════════════════════════════════ */
const FieldLabel = ({ req, children }: { req?: boolean; children: React.ReactNode }) => (
  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textSub }}>
    {children}{req && <span style={{ color: T.amber, marginLeft: 3 }}>*</span>}
  </p>
);

const StatusBadge = ({ live }: { live: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800,
    background: live ? T.greenBg : 'rgba(156,150,140,0.10)',
    color: live ? T.green : T.textMuted,
    border: `1px solid ${live ? 'rgba(26,122,74,0.18)' : T.border}`,
    letterSpacing: 0.3,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: live ? T.green : T.textMuted }} />
    {live ? 'Live' : 'Off'}
  </span>
);

const baseInp: React.CSSProperties = {
  width: '100%', padding: '12px 15px',
  background: T.bgDeep, border: `1.5px solid ${T.border}`,
  borderRadius: 13, fontSize: 14, fontWeight: 500,
  color: T.text, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color .15s, background .15s, box-shadow .15s',
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export const ManagerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Bread');
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'live' | 'off'>('all');

  const fileRef = useRef<HTMLInputElement>(null);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) { alert('Max 1.5 MB'); return; }
    const r = new FileReader();
    r.onload = ev => setNewImage(ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const openAdd = () => { reset(); setSheetOpen(true); };
  const openEdit = (p: Product) => {
    setName(p.name); setPrice(p.price.toString());
    setCategory(p.category || 'Bread'); setNewImage(p.image);
    setEditingId(p.id); setSheetOpen(true);
  };

  const reset = () => {
    setName(''); setPrice(''); setCategory('Bread');
    setNewImage(undefined); setEditingId(null); setSheetOpen(false);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    if (editingId) {
      const ex = products.find(p => p.id === editingId);
      if (ex) await updateProduct({ ...ex, name, price: parseFloat(price), category, image: newImage !== undefined ? newImage : ex.image });
    } else {
      await addProduct({ id: Date.now().toString(), name, price: parseFloat(price), stock: 0, active: true, category, image: newImage });
    }
    reset();
  };

  const toggle = async (p: Product) => updateProduct({ ...p, active: !p.active });

  const filtered = useMemo(() => {
    let list = products;
    if (query) { const q = query.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category?.toLowerCase().includes(q))); }
    if (tab === 'live') list = list.filter(p => p.active);
    if (tab === 'off') list = list.filter(p => !p.active);
    return list;
  }, [products, query, tab]);

  const s = {
    total: products.length,
    live: products.filter(p => p.active).length,
    off: products.filter(p => !p.active).length,
    cats: new Set(products.map(p => p.category)).size,
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.055 } } };
  const up = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } } };

  const TABS = [
    { key: 'all', label: `All`, count: s.total },
    { key: 'live', label: `Live`, count: s.live },
    { key: 'off', label: `Off`, count: s.off },
  ] as const;

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .mp { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        .mp-inp { background: ${T.bgDeep} !important; border: 1.5px solid ${T.border} !important; color: ${T.text} !important; }
        .mp-inp::placeholder { color: ${T.textMuted} !important; }
        .mp-inp:focus { background: #FFF !important; border-color: ${T.amber} !important; box-shadow: 0 0 0 3.5px ${T.amberRing} !important; outline: none; }
        .pcard { transition: transform .22s cubic-bezier(.22,.68,0,1.3), box-shadow .22s; cursor: default; }
        .pcard:hover { transform: translateY(-5px) scale(1.015); box-shadow: ${T.shadowLg} !important; }
        .pcard .pov { opacity: 0; transition: opacity .18s; }
        .pcard:hover .pov { opacity: 1; }
        .pcard .pimg img { transition: transform .5s cubic-bezier(.22,.68,0,1.2); }
        .pcard:hover .pimg img { transform: scale(1.08); }
        .tab-p { background: none; border: none; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; transition: all .16s; white-space: nowrap; }
        .tab-p:hover { color: ${T.amber} !important; background: ${T.amberBg} !important; }
        .cta { border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-weight: 800; transition: transform .14s, box-shadow .14s; }
        .cta:hover { transform: scale(1.03); }
        .cta:active { transform: scale(0.96); }
        .pg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media(min-width:480px){ .pg { grid-template-columns: repeat(3, 1fr); } }
        @media(min-width:768px){ .pg { grid-template-columns: repeat(4, 1fr); } }
        @media(min-width:1024px){ .pg { grid-template-columns: repeat(5, 1fr); } }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      <div className="mp" style={{ minHeight: '100vh', background: T.bg, paddingBottom: 100, position: 'relative', overflow: 'hidden' }}>

        {/* ── DECORATIVE BACKGROUND BLOBS ── */}
        <div aria-hidden style={{ position: 'fixed', top: -100, right: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,121,26,0.10) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div aria-hidden style={{ position: 'fixed', bottom: -60, left: -100, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div aria-hidden style={{ position: 'fixed', top: '45%', left: '55%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── STICKY HEADER ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,242,236,0.90)', backdropFilter: 'blur(22px) saturate(1.6)', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 54 }}>
              <motion.button whileTap={{ scale: .88 }} onClick={() => navigate(-1)}
                style={{ width: 37, height: 37, flexShrink: 0, borderRadius: 11, background: T.bgCard, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, cursor: 'pointer', boxShadow: T.shadow }}>
                <ArrowLeft size={16} />
              </motion.button>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={17} style={{ color: T.amber }} /> Product Suite
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{s.total} products · {s.cats} categories</p>
              </div>
              <motion.button whileTap={{ scale: .92 }} onClick={openAdd} className="cta"
                style={{ padding: '0 16px', height: 38, borderRadius: 12, background: T.amberGrad, color: '#FFF', fontSize: 12, boxShadow: `0 4px 16px ${T.amberRing}`, flexShrink: 0 }}>
                <Plus size={15} /> Add
              </motion.button>
            </div>
          </div>

          {/* TABS + SEARCH ROW */}
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 8px 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="tab-p"
                style={{ color: tab === t.key ? T.amber : T.textMuted, background: tab === t.key ? T.amberBg : 'transparent' }}>
                {t.label}
                <span style={{ padding: '1px 7px', borderRadius: 99, background: tab === t.key ? T.amber : T.bgDeep, color: tab === t.key ? '#FFF' : T.textMuted, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 0', position: 'relative', zIndex: 1 }}>

          {/* ── STATS STRIP ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { v: s.total, l: 'Products', c: T.blue, bg: T.blueBg, icon: <Box size={13} /> },
              { v: s.live, l: 'Live', c: T.green, bg: T.greenBg, icon: <TrendingUp size={13} /> },
              { v: s.off, l: 'Archived', c: T.textMuted, bg: 'rgba(154,147,136,0.09)', icon: <Archive size={13} /> },
              { v: s.cats, l: 'Categories', c: T.amber, bg: T.amberBg, icon: <Tag size={13} /> },
            ].map((s2, i) => (
              <motion.div key={i} variants={up}
                style={{ background: T.bgCard, borderRadius: 16, padding: '10px 8px', border: `1px solid ${T.border}`, textAlign: 'center', boxShadow: T.shadow, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s2.c}66, transparent)` }} />
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s2.bg, color: s2.c, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{s2.icon}</div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{s2.v}</p>
                <p style={{ margin: '3px 0 0', fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s2.l}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── SEARCH ── */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…"
              className="mp-inp" style={{ ...baseInp, paddingLeft: 40, paddingRight: query ? 40 : 16 }} />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── PRODUCT GRID ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="pg">
            {filtered.map(p => (
              <motion.div key={p.id} variants={up} className="pcard"
                style={{ background: T.bgCard, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow, display: 'flex', flexDirection: 'column', opacity: p.active ? 1 : .5, filter: p.active ? 'none' : 'grayscale(.4)' }}>

                {/* Accent top line */}
                <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${p.active ? T.green : T.textMuted}88, transparent)` }} />

                {/* Image Area */}
                <div className="pimg" style={{ position: 'relative', aspectRatio: '1 / 1', background: T.bgDeep, overflow: 'hidden', flexShrink: 0 }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.amberBg }}>
                        <span style={{ fontSize: 44, fontWeight: 900, color: T.amber, opacity: .35, letterSpacing: '-0.06em' }}>{p.name.charAt(0)}</span>
                      </div>
                    )}

                  {/* Status pill on image */}
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                    <StatusBadge live={p.active} />
                  </div>

                  {/* Hover overlay with actions */}
                  <div className="pov" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(245,242,236,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: .9 }} onClick={() => openEdit(p)}
                      style={{ width: 40, height: 40, borderRadius: 11, background: T.bgCard, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer', boxShadow: T.shadowMd }}>
                      <Edit2 size={15} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: .9 }} onClick={() => toggle(p)}
                      style={{ width: 40, height: 40, borderRadius: 11, background: p.active ? T.redBg : T.greenBg, border: `1px solid ${p.active ? 'rgba(192,57,43,0.20)' : 'rgba(26,122,74,0.20)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.active ? T.red : T.green, cursor: 'pointer', boxShadow: T.shadowMd }}>
                      {p.active ? <Archive size={15} /> : <CheckCircle2 size={15} />}
                    </motion.button>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px 12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: T.amber }}>
                    {p.category || 'General'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.35, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {p.name}
                  </p>

                  {/* Price + actions row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>₦</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: '-0.04em' }}>{p.price.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => openEdit(p)} style={{ width: 28, height: 28, borderRadius: 7, background: T.bgDeep, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textSub }}>
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => toggle(p)} style={{ width: 28, height: 28, borderRadius: 7, background: p.active ? T.redBg : T.greenBg, border: `1px solid ${p.active ? 'rgba(192,57,43,0.16)' : 'rgba(26,122,74,0.16)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: p.active ? T.red : T.green }}>
                        {p.active ? <Archive size={11} /> : <CheckCircle2 size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filtered.length === 0 && (
              <motion.div variants={up} style={{ gridColumn: '1 / -1', padding: '72px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: T.bgCard, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: T.shadow }}>
                  <PackageSearch size={28} color={T.textMuted} />
                </div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: '-0.02em' }}>No products found</p>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.6, maxWidth: 240 }}>
                  {query ? `Nothing matches "${query}"` : 'Add your first product to get started.'}
                </p>
                {!query && (
                  <motion.button whileTap={{ scale: .96 }} onClick={openAdd} className="cta"
                    style={{ marginTop: 22, padding: '12px 24px', borderRadius: 13, background: T.amberGrad, color: '#FFF', fontSize: 13, boxShadow: `0 4px 16px ${T.amberRing}` }}>
                    <Plus size={15} /> Add First Product
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── FLOATING BOTTOM PILL ── */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '0 16px 86px', pointerEvents: 'none' }}>
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: .28, type: 'spring', stiffness: 300, damping: 28 }}
            style={{ maxWidth: 540, margin: '0 auto', background: 'rgba(249,246,240,0.96)', backdropFilter: 'blur(24px) saturate(1.6)', border: `1px solid ${T.border}`, borderRadius: 18, boxShadow: `0 -2px 24px rgba(24,22,18,.10), ${T.shadowXl}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 14, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.amberBg, border: `1px solid ${T.amberRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber, flexShrink: 0 }}>
                <Zap size={17} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1 }}>
                  {filtered.length} <span style={{ fontWeight: 500, color: T.textMuted }}>/ {s.total} products</span>
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textMuted }}>
                  <span style={{ color: T.green, fontWeight: 800 }}>●</span> {s.live} live &nbsp;·&nbsp; ○ {s.off} off
                </p>
              </div>
            </div>
            <div style={{ width: 1, height: 30, background: T.border, flexShrink: 0 }} />
            <motion.button whileTap={{ scale: .95 }} onClick={openAdd} className="cta"
              style={{ padding: '11px 18px', borderRadius: 12, background: T.amberGrad, color: '#FFF', fontSize: 13, boxShadow: `0 4px 14px ${T.amberRing}`, flexShrink: 0 }}>
              <Plus size={15} strokeWidth={2.5} /> Add Product
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ══════════ ADD / EDIT BOTTOM SHEET ══════════ */}
      <BottomSheet
        open={sheetOpen}
        onClose={reset}
        title={editingId ? 'Edit Product' : 'New Product'}
        subtitle={editingId ? 'Update product details below' : 'Fill in to publish a new product'}
      >
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Image upload */}
          <div>
            <FieldLabel>Photo</FieldLabel>
            <motion.div whileTap={{ scale: .98 }} onClick={() => fileRef.current?.click()}
              style={{ aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: `2px dashed ${newImage ? T.border : T.amberRing}`, background: newImage ? 'transparent' : T.amberBg, transition: 'border-color .18s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {newImage ? (
                <>
                  <img src={newImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,20,10,.44)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0, transition: 'opacity .18s' }}
                    className="rpl-overlay">
                    <style>{`.rpl-overlay:hover{opacity:1!important}`}</style>
                    <UploadCloud color="white" size={22} />
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>Replace</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(184,121,26,.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber }}>
                    <ImageIcon size={22} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em' }}>Tap to Upload</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>Max 1.5 MB</p>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={onImage} />
            </motion.div>
          </div>

          {/* Name + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel req>Name</FieldLabel>
              <input type="text" placeholder="e.g. Butter Loaf" value={name} onChange={e => setName(e.target.value)} required
                className="mp-inp" style={baseInp} />
            </div>
            <div>
              <FieldLabel req>Price (₦)</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.amber, fontWeight: 900, fontSize: 15, pointerEvents: 'none' }}>₦</span>
                <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required
                  className="mp-inp" style={{ ...baseInp, paddingLeft: 30, color: T.amber, fontWeight: 800 }} />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <FieldLabel>Category</FieldLabel>
            <input type="text" placeholder="e.g. Pastries" value={category} onChange={e => setCategory(e.target.value)}
              className="mp-inp" style={baseInp} />
          </div>

          {/* Submit row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={reset}
              style={{ flex: 1, padding: 13, borderRadius: 13, background: T.bgDeep, border: `1px solid ${T.border}`, color: T.textSub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" className="cta"
              style={{ flex: 2, padding: 13, borderRadius: 13, background: T.amberGrad, color: '#FFF', fontWeight: 900, fontSize: 14, boxShadow: `0 4px 16px ${T.amberRing}` }}>
              <CheckCircle2 size={16} /> {editingId ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </BottomSheet>

    </AnimatedPage>
  );
};

export default ManagerProducts;