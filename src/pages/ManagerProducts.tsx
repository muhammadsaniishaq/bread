import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X,
  UploadCloud, Layers, Sparkles, TrendingUp, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../store/types';

/* ═══════════════════════════════════════════════════
   DESIGN SYSTEM TOKENS
═══════════════════════════════════════════════════ */
const DS = {
  amber:     '#F59E0B',
  amberDeep: '#B45309',
  amberGlow: 'rgba(245,158,11,0.15)',
  amberSoft: 'rgba(245,158,11,0.08)',
  dark:      '#0A0A0F',
  surface:   '#111118',
  card:      '#16161F',
  border:    'rgba(255,255,255,0.06)',
  text:      '#F0EFE8',
  textMuted: '#6B6A75',
  textSub:   '#9896A4',
  danger:    '#EF4444',
  success:   '#22C55E',
};

const StatusPill = ({ active }: { active: boolean }) => (
  <span style={{
    background: active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.15)',
    color: active ? DS.success : DS.textMuted,
    border: `1px solid ${active ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 999,
    backdropFilter: 'blur(8px)',
  }}>
    {active ? '● Live' : '○ Archived'}
  </span>
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export const ManagerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();

  const [isAdding,    setIsAdding]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('Bread');
  const [newImage,    setNewImage]    = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab,   setActiveTab]   = useState<'all' | 'active' | 'archived'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Please select an image smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    if (editingId) {
      const existing = products.find(p => p.id === editingId);
      if (existing) {
        await updateProduct({
          ...existing, name,
          price: parseFloat(price), category,
          image: newImage !== undefined ? newImage : existing.image,
        });
      }
    } else {
      await addProduct({
        id: Date.now().toString(), name,
        price: parseFloat(price), stock: 0,
        active: true, category, image: newImage,
      });
    }
    resetForm();
  };

  const startEdit = (p: Product) => {
    setName(p.name); setPrice(p.price.toString());
    setCategory(p.category || 'Bread'); setNewImage(p.image);
    setEditingId(p.id); setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCategory('Bread');
    setNewImage(undefined); setEditingId(null); setIsAdding(false);
  };

  const toggleActive = async (p: Product) =>
    await updateProduct({ ...p, active: !p.active });

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (activeTab === 'active')   list = list.filter(p => p.active);
    if (activeTab === 'archived') list = list.filter(p => !p.active);
    return list;
  }, [products, searchQuery, activeTab]);

  const stats = {
    total:    products.length,
    active:   products.filter(p => p.active).length,
    archived: products.filter(p => !p.active).length,
    cats:     new Set(products.map(p => p.category)).size,
  };

  const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.055 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.07)',
    borderRadius: 14, color: DS.text,
    width: '100%', padding: '13px 16px',
    fontSize: 14, fontWeight: 500,
    outline: 'none', transition: 'all 0.2s',
    fontFamily: 'inherit',
  };

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .mp-root { font-family: 'DM Sans', sans-serif; }
        .mp-root .syne { font-family: 'Syne', sans-serif; }
        .mp-root ::-webkit-scrollbar { width: 4px; }
        .mp-root ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 99px; }
        .mp-input:focus { border-color: rgba(245,158,11,0.5) !important; background: rgba(245,158,11,0.04) !important; box-shadow: 0 0 0 4px rgba(245,158,11,0.08) !important; }
        .mp-input::placeholder { color: #3D3C47; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer {
          background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 45%, #F59E0B 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s linear infinite;
        }
        .card-hover { transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease, border-color 0.22s ease; }
        .card-hover:hover { transform: translateY(-5px) scale(1.018); box-shadow: 0 20px 48px rgba(0,0,0,0.55); border-color: rgba(245,158,11,0.22) !important; }
        .img-zoom img { transition: transform 0.55s cubic-bezier(.22,.68,0,1.2); }
        .img-zoom:hover img { transform: scale(1.07); }
        .action-overlay { opacity: 0; transition: opacity 0.22s; }
        .img-zoom:hover .action-overlay { opacity: 1; }
      `}</style>

      <div className="mp-root min-h-screen pb-32 relative overflow-x-hidden" style={{ background: DS.dark }}>

        {/* ── AMBIENT BG ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-15%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', left: '-15%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          }} />
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.022 }}>
            <filter id="mpnoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#mpnoise)"/>
          </svg>
        </div>

        {/* ══════════════════════════
            STICKY HEADER
        ══════════════════════════ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,15,0.82)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          borderBottom: `1px solid ${DS.border}`,
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

              {/* Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <motion.button
                  whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(-1)}
                  style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${DS.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DS.textSub, flexShrink: 0, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowLeft size={16} />
                </motion.button>

                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.05))',
                    border: '1px solid rgba(245,158,11,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DS.amber, flexShrink: 0,
                  }}>
                    <Box size={17} />
                  </div>
                  <div>
                    <h1 className="syne shimmer" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      Product Suite
                    </h1>
                    <p style={{ color: DS.textMuted, fontSize: 11, marginTop: 3, fontWeight: 500 }}>
                      {stats.total} items &nbsp;·&nbsp; {stats.cats} categories
                    </p>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Search — hidden on mobile */}
                <div style={{ position: 'relative', display: 'none' }} className="sm:block" id="header-search">
                  <style>{`@media(min-width:640px){#header-search{display:block}}`}</style>
                  <Search size={14} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: DS.textMuted, pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="mp-input"
                    style={{
                      ...inputStyle,
                      paddingLeft: 36, paddingRight: searchQuery ? 34 : 14,
                      paddingTop: 9, paddingBottom: 9,
                      borderRadius: 10, width: 190, fontSize: 13,
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: DS.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Add CTA */}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 6px 28px rgba(245,158,11,0.38)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { resetForm(); setIsAdding(true); }}
                  style={{
                    background: `linear-gradient(135deg, ${DS.amber}, ${DS.amberDeep})`,
                    borderRadius: 11, padding: '9px 18px',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontWeight: 800, fontSize: 13, color: '#0A0A0F',
                    boxShadow: '0 4px 18px rgba(245,158,11,0.28)',
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Add Product</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '32px 20px 0' }}>

          {/* ── STAT CARDS ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 28 }}
            className="sm:grid-cols-4"
          >
            <style>{`@media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr)}}`}</style>
            {[
              { label: 'Total Products', value: stats.total,    icon: <Layers     size={16}/>, color: '#818CF8', glow: 'rgba(129,140,248,0.14)' },
              { label: 'Live',           value: stats.active,   icon: <TrendingUp size={16}/>, color: DS.amber,  glow: DS.amberGlow },
              { label: 'Archived',       value: stats.archived, icon: <Archive    size={16}/>, color: '#94A3B8', glow: 'rgba(148,163,184,0.12)' },
              { label: 'Categories',     value: stats.cats,     icon: <Sparkles   size={16}/>, color: '#F472B6', glow: 'rgba(244,114,182,0.14)' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -3, scale: 1.02 }}
                style={{
                  background: DS.card, border: `1px solid ${DS.border}`,
                  borderRadius: 18, padding: '20px 18px',
                  position: 'relative', overflow: 'hidden', cursor: 'default',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Shine */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)', pointerEvents: 'none', borderRadius: 'inherit' }} />
                {/* Glow */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${s.glow}, transparent 70%)` }} />
                <div style={{ width: 34, height: 34, borderRadius: 10, background: s.glow, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: `1px solid ${s.glow}` }}>
                  {s.icon}
                </div>
                <p style={{ color: DS.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</p>
                <p className="syne" style={{ color: DS.text, fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── MOBILE SEARCH ── */}
          <div style={{ marginBottom: 20, position: 'relative' }} id="mob-search">
            <style>{`@media(min-width:640px){#mob-search{display:none}}`}</style>
            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DS.textMuted, pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search products or categories…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="mp-input"
              style={{ ...inputStyle, paddingLeft: 40, paddingRight: searchQuery ? 40 : 16 }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: DS.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── TABS ── */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${DS.border}`, marginBottom: 28 }}>
            {(['all', 'active', 'archived'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  color: activeTab === tab ? DS.amber : DS.textMuted,
                  borderBottom: `2px solid ${activeTab === tab ? DS.amber : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.18s', textTransform: 'capitalize',
                }}
              >
                {tab === 'all' ? `All (${stats.total})` : tab === 'active' ? `Live (${stats.active})` : `Archived (${stats.archived})`}
              </button>
            ))}
          </div>

          {/* ══════════════════════════
              FORM PANEL
          ══════════════════════════ */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.9, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.9 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                style={{ marginBottom: 36, transformOrigin: 'top' }}
              >
                <div style={{
                  background: DS.card,
                  border: '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 32px 72px rgba(0,0,0,0.45), inset 0 1px 0 rgba(245,158,11,0.1)',
                }}>
                  {/* Top shimmer bar */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, transparent 0%, ${DS.amber} 30%, #FDE68A 60%, ${DS.amber} 80%, transparent 100%)` }} />

                  <div style={{ padding: '28px 28px 32px' }}>
                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 13,
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))',
                          border: '1px solid rgba(245,158,11,0.28)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.amber,
                        }}>
                          {editingId ? <Edit2 size={19} /> : <Plus size={19} />}
                        </div>
                        <div>
                          <h2 className="syne" style={{ color: DS.text, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {editingId ? 'Edit Product' : 'New Product'}
                          </h2>
                          <p style={{ color: DS.textMuted, fontSize: 12, marginTop: 3 }}>
                            {editingId ? 'Update the fields below' : 'Fill in details to publish'}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                        onClick={resetForm}
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${DS.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: DS.textMuted, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <X size={15} />
                      </motion.button>
                    </div>

                    <form onSubmit={handleSave}>
                      <div style={{ display: 'grid', gap: 28 }} className="md:grid-cols-form">
                        <style>{`@media(min-width:768px){.md\\:grid-cols-form{grid-template-columns:160px 1fr}}`}</style>

                        {/* Photo */}
                        <div>
                          <label style={{ display: 'block', color: DS.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Product Photo</label>
                          <motion.div
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="img-zoom"
                            style={{
                              aspectRatio: '1', borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                              border: `2px dashed ${newImage ? 'transparent' : 'rgba(245,158,11,0.25)'}`,
                              background: newImage ? 'transparent' : 'rgba(245,158,11,0.04)',
                              position: 'relative',
                            }}
                          >
                            {newImage ? (
                              <>
                                <img src={newImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="action-overlay" style={{
                                  position: 'absolute', inset: 0,
                                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}>
                                  <UploadCloud color="white" size={22} />
                                  <span style={{ color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Replace</span>
                                </div>
                              </>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: DS.amber }}>
                                <div style={{ width: 46, height: 46, borderRadius: 14, background: DS.amberSoft, border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon size={22} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Upload Photo</span>
                                <span style={{ fontSize: 10, color: DS.textMuted }}>Max 1.5 MB</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleProductImageUpload} />
                          </motion.div>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div style={{ display: 'grid', gap: 16 }} className="sm:grid-cols-2-equal">
                            <style>{`@media(min-width:640px){.sm\\:grid-cols-2-equal{grid-template-columns:1fr 1fr}}`}</style>

                            {/* Name */}
                            <div>
                              <label style={{ display: 'block', color: DS.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                                Name <span style={{ color: DS.amber }}>*</span>
                              </label>
                              <input
                                type="text" placeholder="e.g. Premium Butter Loaf"
                                value={name} onChange={e => setName(e.target.value)} required
                                className="mp-input" style={inputStyle}
                              />
                            </div>

                            {/* Price */}
                            <div>
                              <label style={{ display: 'block', color: DS.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                                Price (₦) <span style={{ color: DS.amber }}>*</span>
                              </label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DS.amber, fontWeight: 700, fontSize: 15, pointerEvents: 'none' }}>₦</span>
                                <input
                                  type="number" placeholder="1000"
                                  value={price} onChange={e => setPrice(e.target.value)} required
                                  className="mp-input"
                                  style={{ ...inputStyle, paddingLeft: 32, color: DS.amber, fontWeight: 700 }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Category */}
                          <div>
                            <label style={{ display: 'block', color: DS.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Category</label>
                            <input
                              type="text" placeholder="e.g. Pastries & Snacks"
                              value={category} onChange={e => setCategory(e.target.value)}
                              className="mp-input" style={inputStyle}
                            />
                          </div>

                          {/* Buttons */}
                          <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${DS.border}`, marginTop: 4 }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              type="button" onClick={resetForm}
                              style={{
                                flex: 1, padding: '13px 16px', borderRadius: 13,
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${DS.border}`,
                                color: DS.textSub, fontSize: 14, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                              }}
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02, boxShadow: '0 10px 32px rgba(245,158,11,0.38)' }}
                              whileTap={{ scale: 0.97 }}
                              type="submit"
                              style={{
                                flex: 2, padding: '13px 16px', borderRadius: 13,
                                background: `linear-gradient(135deg, ${DS.amber}, ${DS.amberDeep})`,
                                color: '#0A0A0F', fontSize: 14, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                                boxShadow: '0 4px 18px rgba(245,158,11,0.28)',
                              }}
                            >
                              <CheckCircle2 size={16} />
                              {editingId ? 'Update Product' : 'Deploy Product'}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════
              PRODUCT GRID
          ══════════════════════════ */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}
            className="prod-grid"
          >
            <style>{`
              @media(min-width:500px){.prod-grid{grid-template-columns:repeat(3,1fr)}}
              @media(min-width:768px){.prod-grid{grid-template-columns:repeat(4,1fr)}}
              @media(min-width:1024px){.prod-grid{grid-template-columns:repeat(5,1fr)}}
            `}</style>

            {filteredProducts.map(p => (
              <motion.div
                key={p.id} variants={fadeUp}
                className="card-hover img-zoom"
                style={{
                  background: DS.card,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 20, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  opacity: p.active ? 1 : 0.42,
                  filter: p.active ? 'none' : 'grayscale(0.6)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.32)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', aspectRatio: '1', background: '#0D0D14', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #111118, #1C1C28)',
                      fontSize: 52, fontWeight: 900, fontFamily: 'Syne, sans-serif',
                      color: 'rgba(245,158,11,0.1)', letterSpacing: '-0.05em', userSelect: 'none',
                    }}>
                      {p.name.charAt(0)}
                    </div>
                  )}

                  {/* Status */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                    <StatusPill active={p.active} />
                  </div>

                  {/* Hover actions — desktop */}
                  <div className="action-overlay" style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 100%)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    gap: 8, paddingBottom: 14,
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(p)}
                      title="Edit"
                      style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: 'rgba(255,255,255,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#0A0A0F', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                      }}
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleActive(p)}
                      title={p.active ? 'Archive' : 'Restore'}
                      style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: p.active ? 'rgba(239,68,68,0.88)' : 'rgba(34,197,94,0.88)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                      }}
                    >
                      {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                    </motion.button>
                  </div>
                </div>

                {/* Mobile quick actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '10px 12px 0' }} className="lg-hide">
                  <style>{`@media(min-width:1024px){.lg-hide{display:none}}`}</style>
                  <button onClick={() => startEdit(p)} style={{
                    width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DS.textMuted, cursor: 'pointer',
                  }}>
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => toggleActive(p)} style={{
                    width: 28, height: 28, borderRadius: 8, cursor: 'pointer', border: 'none',
                    background: p.active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color: p.active ? DS.danger : DS.success,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p.active ? <Archive size={11} /> : <CheckCircle2 size={11} />}
                  </button>
                </div>

                {/* Text */}
                <div style={{ padding: '10px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ color: DS.amber, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.category || 'Bakery'}
                  </p>
                  <h4 style={{
                    color: DS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.38,
                    marginBottom: 10, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}>
                    {p.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ color: DS.textMuted, fontSize: 11, fontWeight: 600 }}>₦</span>
                    <span className="syne" style={{ color: DS.text, fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {p.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div variants={fadeUp} style={{
                gridColumn: '1 / -1', padding: '80px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              }}>
                <div style={{
                  width: 78, height: 78, borderRadius: 22,
                  background: DS.card, border: `1px solid ${DS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.04)',
                }}>
                  <PackageSearch size={30} color={DS.textMuted} />
                </div>
                <h4 className="syne" style={{ color: DS.text, fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
                  No Products Found
                </h4>
                <p style={{ color: DS.textMuted, fontSize: 14, lineHeight: 1.65, maxWidth: 280 }}>
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different keyword.`
                    : 'Your catalog is empty. Add your first product to get started.'}
                </p>
                {!searchQuery && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setIsAdding(true)}
                    style={{
                      marginTop: 24, borderRadius: 12, padding: '12px 26px',
                      background: `linear-gradient(135deg, ${DS.amber}, ${DS.amberDeep})`,
                      color: '#0A0A0F', fontWeight: 800, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 4px 20px rgba(245,158,11,0.32)',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={16} /> Add First Product
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ══════════════════════════
            FLOATING BOTTOM BAR
        ══════════════════════════ */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '0 16px 20px' }}>
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 26 }}
            style={{
              maxWidth: 580, margin: '0 auto',
              background: 'rgba(20,20,28,0.88)',
              backdropFilter: 'blur(32px) saturate(1.8)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 20,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px', gap: 16,
            }}
          >
            {/* Left info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: DS.amberSoft, border: '1px solid rgba(245,158,11,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.amber,
              }}>
                <PackageSearch size={17} />
              </div>
              <div>
                <p style={{ color: DS.text, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
                  {filteredProducts.length}{' '}
                  <span style={{ color: DS.textMuted, fontWeight: 500 }}>of</span>{' '}
                  {stats.total} products
                </p>
                <p style={{ color: DS.textMuted, fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: DS.success }}>●</span> {stats.active} live &nbsp;·&nbsp;
                  <span style={{ color: DS.textMuted }}>○</span> {stats.archived} archived
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: DS.border, flexShrink: 0 }} />

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 6px 28px rgba(245,158,11,0.42)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                background: `linear-gradient(135deg, ${DS.amber}, ${DS.amberDeep})`,
                color: '#0A0A0F', borderRadius: 13, padding: '11px 20px',
                fontWeight: 800, fontSize: 13, flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 18px rgba(245,158,11,0.28)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Product
            </motion.button>
          </motion.div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;