import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X,
  UploadCloud, Layers, Sparkles, TrendingUp, Box, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../store/types';

/* ═══════════════════════════════════════
   DESIGN TOKENS — Light / Crisp
═══════════════════════════════════════ */
const C = {
  bg:        '#F5F4F0',
  bgAlt:     '#EEECEA',
  surface:   '#FFFFFF',
  surfaceAlt:'#FAFAF8',
  border:    '#E4E2DC',
  borderFoc: '#D4A843',
  amber:     '#D4A843',
  amberDeep: '#B8892A',
  amberSoft: 'rgba(212,168,67,0.10)',
  amberGlow: 'rgba(212,168,67,0.18)',
  text:      '#1A1916',
  textSub:   '#6B6760',
  textMuted: '#9E9B95',
  success:   '#16A34A',
  danger:    '#DC2626',
  shadow:    'rgba(26,25,22,0.07)',
  shadowMd:  'rgba(26,25,22,0.12)',
};

const StatusBadge = ({ active }: { active: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: 999,
    background: active ? 'rgba(22,163,74,0.10)' : 'rgba(156,163,175,0.14)',
    color: active ? C.success : C.textMuted,
    border: `1px solid ${active ? 'rgba(22,163,74,0.22)' : C.border}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? C.success : C.textMuted, display: 'inline-block' }} />
    {active ? 'Live' : 'Archived'}
  </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textSub, marginBottom: 8 }}>
    {children}
  </label>
);

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
    if (file.size > 1.5 * 1024 * 1024) { alert('Max 1.5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    if (editingId) {
      const ex = products.find(p => p.id === editingId);
      if (ex) await updateProduct({ ...ex, name, price: parseFloat(price), category, image: newImage !== undefined ? newImage : ex.image });
    } else {
      await addProduct({ id: Date.now().toString(), name, price: parseFloat(price), stock: 0, active: true, category, image: newImage });
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

  const toggleActive = async (p: Product) => await updateProduct({ ...p, active: !p.active });

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
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

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const up = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } } };

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: C.bgAlt, border: `1.5px solid ${C.border}`,
    borderRadius: 12, fontSize: 14, fontWeight: 500,
    color: C.text, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
  };

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .mp { font-family: 'DM Sans', sans-serif; }
        .mp .serif { font-family: 'Instrument Serif', serif; }
        .mp-inp::placeholder { color: ${C.textMuted}; }
        .mp-inp:focus { border-color: ${C.borderFoc} !important; background: #FFF !important; box-shadow: 0 0 0 3px ${C.amberGlow} !important; }
        .mp-inp:hover:not(:focus) { border-color: #CCC8BE !important; background: #FFF !important; }
        .prod-card { transition: transform 0.26s cubic-bezier(.22,.68,0,1.18), box-shadow 0.26s ease; }
        .prod-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(26,25,22,0.13) !important; }
        .prod-card .card-actions { opacity: 0; transition: opacity 0.2s; }
        .prod-card:hover .card-actions { opacity: 1; }
        .prod-card .card-img img { transition: transform 0.5s cubic-bezier(.22,.68,0,1.18); }
        .prod-card:hover .card-img img { transform: scale(1.05); }
        .add-btn { transition: transform 0.18s, box-shadow 0.18s; }
        .add-btn:hover { transform: scale(1.03); box-shadow: 0 6px 24px ${C.amberGlow} !important; }
        .add-btn:active { transform: scale(0.97); }
        .upload-zone:hover { border-color: ${C.amber} !important; background: rgba(212,168,67,0.08) !important; }
        .upload-zone:hover .upload-overlay { opacity: 1 !important; }
        @media(min-width:500px){.pg{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:768px){.pg{grid-template-columns:repeat(4,1fr)}}
        @media(min-width:1024px){.pg{grid-template-columns:repeat(5,1fr)}}
        @media(min-width:640px){.header-search{display:flex!important}}
        @media(max-width:639px){.header-search{display:none!important}}
        @media(min-width:640px){.mob-search{display:none!important}}
        @media(min-width:480px){.fields-2{grid-template-columns:1fr 1fr!important}}
        @media(min-width:640px){.form-grid{grid-template-columns:150px 1fr!important}}
      `}</style>

      <div className="mp" style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>

        {/* ═══ STICKY HEADER — Mobile-first, compact ═══ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(245,244,240,0.92)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 56 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
                style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub, cursor: 'pointer', boxShadow: `0 1px 4px ${C.shadow}` }}>
                <ArrowLeft size={15} />
              </motion.button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.025em', lineHeight: 1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Product Suite
                </h1>
                <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0', fontWeight: 500 }}>
                  {stats.total} products · {stats.cats} categories
                </p>
              </div>

              {/* Desktop search */}
              <div className="header-search" style={{ position: 'relative', alignItems: 'center', display: 'none' }}>
                <Search size={14} style={{ position: 'absolute', left: 11, color: C.textMuted, pointerEvents: 'none', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="mp-inp"
                  style={{ ...inp, paddingLeft: 34, paddingTop: 9, paddingBottom: 9, paddingRight: searchQuery ? 30 : 14, width: 200, fontSize: 13 }} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0, lineHeight: 0 }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <button className="add-btn" onClick={() => { resetForm(); setIsAdding(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.amber}, ${C.amberDeep})`, color: '#FFF', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', boxShadow: `0 3px 14px ${C.amberGlow}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Plus size={14} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tab row */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', overflowX: 'auto' }}>
              {(['all', 'active', 'archived'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', color: activeTab === tab ? C.amber : C.textMuted, borderBottom: `2px solid ${activeTab === tab ? C.amber : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                  {tab === 'all' ? `All  ${stats.total}` : tab === 'active' ? `Live  ${stats.active}` : `Archived  ${stats.archived}`}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                <SlidersHorizontal size={13} /> Filter
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 0' }}>

          {/* Mobile search */}
          <div className="mob-search" style={{ marginBottom: 16, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="mp-inp" style={{ ...inp, paddingLeft: 38, paddingRight: searchQuery ? 38 : 16 }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0, lineHeight: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* STAT STRIP */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'Total',      value: stats.total,    icon: <Layers     size={14}/>, color: '#6366F1' },
              { label: 'Live',       value: stats.active,   icon: <TrendingUp size={14}/>, color: C.success },
              { label: 'Archived',   value: stats.archived, icon: <Archive    size={14}/>, color: C.textMuted },
              { label: 'Categories', value: stats.cats,     icon: <Sparkles   size={14}/>, color: C.amber },
            ].map((s, i) => (
              <motion.div key={i} variants={up}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: `0 1px 4px ${C.shadow}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* FORM */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.96 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                style={{ marginBottom: 24, transformOrigin: 'top' }}
              >
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 8px 32px ${C.shadowMd}` }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${C.bg}, ${C.amber} 40%, #E8C46A 60%, ${C.amber} 80%, ${C.bg})` }} />
                  <div style={{ padding: '24px 24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.amberSoft, border: `1px solid rgba(212,168,67,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.amber }}>
                          {editingId ? <Edit2 size={17} /> : <Plus size={17} />}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
                            {editingId ? 'Edit Product' : 'New Product'}
                          </h2>
                          <p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0' }}>
                            {editingId ? 'Update product details' : 'Fill in to publish to catalog'}
                          </p>
                        </div>
                      </div>
                      <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={resetForm}
                        style={{ width: 34, height: 34, borderRadius: 9, background: C.bgAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub, cursor: 'pointer' }}>
                        <X size={14} />
                      </motion.button>
                    </div>

                    <form onSubmit={handleSave}>
                      <div style={{ display: 'grid', gap: 24 }} className="form-grid">
                        {/* Photo */}
                        <div>
                          <Label>Photo</Label>
                          <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()}
                            className="upload-zone"
                            style={{ aspectRatio: '1', borderRadius: 16, overflow: 'hidden', border: `2px dashed ${newImage ? C.border : 'rgba(212,168,67,0.35)'}`, background: newImage ? 'transparent' : C.amberSoft, cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s, background 0.2s' }}>
                            {newImage ? (
                              <>
                                <img src={newImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="upload-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0, transition: 'opacity 0.2s' }}>
                                  <UploadCloud color="white" size={20} />
                                  <span style={{ color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Replace</span>
                                </div>
                              </>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.amber }}>
                                  <ImageIcon size={20} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upload</span>
                                <span style={{ fontSize: 10, color: C.textMuted }}>Max 1.5MB</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleProductImageUpload} />
                          </motion.div>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'grid', gap: 14 }} className="fields-2">
                            <div>
                              <Label>Product Name <span style={{ color: C.amber }}>*</span></Label>
                              <input type="text" placeholder="e.g. Butter Loaf" value={name} onChange={e => setName(e.target.value)} required className="mp-inp" style={inp} />
                            </div>
                            <div>
                              <Label>Price (₦) <span style={{ color: C.amber }}>*</span></Label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.amber, fontWeight: 800, fontSize: 15, pointerEvents: 'none' }}>₦</span>
                                <input type="number" placeholder="1000" value={price} onChange={e => setPrice(e.target.value)} required className="mp-inp" style={{ ...inp, paddingLeft: 32, color: C.amberDeep, fontWeight: 700 }} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label>Category</Label>
                            <input type="text" placeholder="e.g. Pastries & Snacks" value={category} onChange={e => setCategory(e.target.value)} className="mp-inp" style={inp} />
                          </div>
                          <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={resetForm}
                              style={{ flex: 1, padding: '12px 16px', borderRadius: 12, background: C.bgAlt, border: `1px solid ${C.border}`, color: C.textSub, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Cancel
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit"
                              style={{ flex: 2, padding: '12px 16px', borderRadius: 12, background: `linear-gradient(135deg, ${C.amber}, ${C.amberDeep})`, color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit', boxShadow: `0 4px 16px ${C.amberGlow}` }}>
                              <CheckCircle2 size={15} />
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

          {/* PRODUCT GRID */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="pg"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {filteredProducts.map(p => (
              <motion.div key={p.id} variants={up} className="prod-card"
                style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, boxShadow: `0 2px 10px ${C.shadow}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: p.active ? 1 : 0.5, filter: p.active ? 'none' : 'grayscale(0.5)', cursor: 'default' }}>

                {/* Image */}
                <div className="card-img" style={{ position: 'relative', aspectRatio: '1', background: C.bgAlt, overflow: 'hidden', flexShrink: 0 }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 900, fontFamily: 'Instrument Serif, serif', color: C.border, background: `linear-gradient(145deg, ${C.bgAlt}, ${C.bg})`, userSelect: 'none' }}>
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3 }}>
                    <StatusBadge active={p.active} />
                  </div>
                  {/* Hover overlay actions */}
                  <div className="card-actions" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => startEdit(p)} title="Edit"
                      style={{ width: 42, height: 42, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, cursor: 'pointer', boxShadow: `0 4px 14px ${C.shadowMd}` }}>
                      <Edit2 size={15} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleActive(p)} title={p.active ? 'Archive' : 'Restore'}
                      style={{ width: 42, height: 42, borderRadius: 12, background: p.active ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', border: `1px solid ${p.active ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.active ? C.danger : C.success, cursor: 'pointer', boxShadow: `0 4px 14px ${C.shadowMd}` }}>
                      {p.active ? <Archive size={15} /> : <CheckCircle2 size={15} />}
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.amber, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.category || 'General'}
                  </p>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 'auto', paddingBottom: 12, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {p.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>₦</span>
                      <span style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Instrument Serif, serif' }}>
                        {p.price.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(p)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: C.bgAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub, cursor: 'pointer' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => toggleActive(p)}
                        style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', border: 'none', background: p.active ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.active ? C.danger : C.success }}>
                        {p.active ? <Archive size={12} /> : <CheckCircle2 size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredProducts.length === 0 && (
              <motion.div variants={up} style={{ gridColumn: '1 / -1', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 22, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: `0 2px 8px ${C.shadow}` }}>
                  <PackageSearch size={28} color={C.textMuted} />
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>No products found</h4>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, maxWidth: 260 }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'Your catalog is empty. Add your first product.'}
                </p>
                {!searchQuery && (
                  <button className="add-btn" onClick={() => setIsAdding(true)}
                    style={{ marginTop: 22, borderRadius: 12, padding: '12px 24px', border: 'none', background: `linear-gradient(135deg, ${C.amber}, ${C.amberDeep})`, color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: `0 4px 16px ${C.amberGlow}` }}>
                    <Plus size={15} /> Add First Product
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* BOTTOM FLOATING BAR */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '0 16px 20px' }}>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 26 }}
            style={{ maxWidth: 560, margin: '0 auto', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(1.8)', border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: `0 -4px 32px rgba(26,25,22,0.1), 0 8px 32px rgba(26,25,22,0.08), inset 0 1px 0 rgba(255,255,255,0.9)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: C.amberSoft, border: `1px solid rgba(212,168,67,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.amber }}>
                <Box size={16} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                  {filteredProducts.length} <span style={{ fontWeight: 500, color: C.textMuted }}>of</span> {stats.total}
                </p>
                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                  <span style={{ color: C.success, fontWeight: 700 }}>●</span> {stats.active} live &nbsp;·&nbsp;
                  <span style={{ color: C.textMuted }}>○</span> {stats.archived} archived
                </p>
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: C.border, flexShrink: 0 }} />
            <button className="add-btn" onClick={() => { resetForm(); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.amber}, ${C.amberDeep})`, color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'inherit', boxShadow: `0 3px 14px ${C.amberGlow}`, flexShrink: 0 }}>
              <Plus size={14} strokeWidth={2.5} />
              Add Product
            </button>
          </motion.div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;