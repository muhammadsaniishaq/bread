import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X,
  UploadCloud, TrendingUp, Box, SlidersHorizontal, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../store/types';

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const T = {
  bg:        '#F7F6F2',
  bgDeep:    '#EFEDE8',
  white:     '#FFFFFF',
  border:    '#E6E3DC',
  borderMid: '#D4D0C8',
  amber:     '#C9921A',
  amberLt:   '#F5C842',
  amberBg:   'rgba(201,146,26,0.09)',
  amberRing: 'rgba(201,146,26,0.20)',
  text:      '#18170F',
  textSub:   '#5C5A54',
  textMute:  '#9C9A93',
  green:     '#15803D',
  greenBg:   'rgba(21,128,61,0.09)',
  red:       '#B91C1C',
  redBg:     'rgba(185,28,28,0.09)',
  indigo:    '#4338CA',
  indigoBg:  'rgba(67,56,202,0.09)',
  shadow:    '0 1px 3px rgba(24,23,15,0.08), 0 1px 2px rgba(24,23,15,0.05)',
  shadowMd:  '0 4px 12px rgba(24,23,15,0.10), 0 2px 4px rgba(24,23,15,0.06)',
  shadowLg:  '0 12px 32px rgba(24,23,15,0.12), 0 4px 8px rgba(24,23,15,0.06)',
};

/* ─────────────────────────────────────────
   MICRO COMPONENTS
───────────────────────────────────────── */
const Pill = ({ live }: { live: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 99,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    background: live ? T.greenBg : 'rgba(156,154,147,0.12)',
    color: live ? T.green : T.textMute,
    border: `1px solid ${live ? 'rgba(21,128,61,0.18)' : T.border}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: live ? T.green : T.textMute }} />
    {live ? 'Live' : 'Off'}
  </span>
);

const FieldLabel = ({ req, children }: { req?: boolean; children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textSub, marginBottom: 7 }}>
    {children}{req && <span style={{ color: T.amber, marginLeft: 3 }}>*</span>}
  </p>
);

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export const ManagerProducts: React.FC = () => {
  const navigate  = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();

  const [isAdding,    setIsAdding]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('Bread');
  const [newImage,    setNewImage]    = useState<string | undefined>(undefined);
  const [query,       setQuery]       = useState('');
  const [tab,         setTab]         = useState<'all'|'live'|'off'>('all');

  const fileRef = useRef<HTMLInputElement>(null);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) { alert('Max 1.5 MB'); return; }
    const r = new FileReader();
    r.onload = ev => setNewImage(ev.target?.result as string);
    r.readAsDataURL(f);
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

  const edit = (p: Product) => {
    setName(p.name); setPrice(p.price.toString());
    setCategory(p.category || 'Bread'); setNewImage(p.image);
    setEditingId(p.id); setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setName(''); setPrice(''); setCategory('Bread'); setNewImage(undefined); setEditingId(null); setIsAdding(false); };
  const toggle = async (p: Product) => updateProduct({ ...p, active: !p.active });

  const filtered = useMemo(() => {
    let list = products;
    if (query) { const q = query.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category?.toLowerCase().includes(q))); }
    if (tab === 'live') list = list.filter(p => p.active);
    if (tab === 'off')  list = list.filter(p => !p.active);
    return list;
  }, [products, query, tab]);

  const s = {
    total:    products.length,
    live:     products.filter(p => p.active).length,
    off:      products.filter(p => !p.active).length,
    cats:     new Set(products.map(p => p.category)).size,
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.045 } } };
  const up      = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 460, damping: 32 } } };

  const baseInp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: T.bgDeep, border: `1.5px solid ${T.border}`,
    borderRadius: 10, fontSize: 14, fontWeight: 500,
    color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color .15s, background .15s, box-shadow .15s',
  };

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .mp-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .inp::placeholder { color: ${T.textMute}; }
        .inp:hover:not(:focus) { background: #EBE9E4 !important; border-color: ${T.borderMid} !important; }
        .inp:focus { background: ${T.white} !important; border-color: ${T.amber} !important; box-shadow: 0 0 0 3px ${T.amberRing} !important; }
        .card { transition: transform .24s cubic-bezier(.22,.68,0,1.2), box-shadow .24s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: ${T.shadowMd} !important; }
        .card .ov { opacity:0; transition: opacity .18s; }
        .card:hover .ov { opacity:1; }
        .card .ci img { transition: transform .48s cubic-bezier(.22,.68,0,1.2); }
        .card:hover .ci img { transform: scale(1.06); }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; letter-spacing:.03em; padding:10px 14px; border-bottom:2px solid transparent; transition:all .14s; margin-bottom:-1px; white-space:nowrap; }
        .tab-btn:hover { color: ${T.amber} !important; }
        .cta { border:none; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:6px; transition: transform .16s, box-shadow .16s; }
        .cta:hover { transform:scale(1.03); }
        .cta:active { transform:scale(0.97); }
        .icon-btn { background:none; border:1px solid ${T.border}; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition: background .14s, border-color .14s; font-family:inherit; }
        .icon-btn:hover { background:${T.bgDeep} !important; border-color:${T.borderMid} !important; }
        .pg { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media(min-width:480px){ .pg { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:768px){ .pg { grid-template-columns:repeat(4,1fr); } }
        @media(min-width:1024px){ .pg { grid-template-columns:repeat(5,1fr); } }
        @media(min-width:640px){ .hdr-search { display:flex !important; } .mob-search { display:none !important; } }
        @media(min-width:640px){ .fg { grid-template-columns:148px 1fr !important; } }
        @media(min-width:480px){ .f2 { grid-template-columns:1fr 1fr !important; } }
        @media(max-width:479px){ .stat-val { font-size:20px !important; } }
      `}</style>

      <div className="mp-root" style={{ minHeight: '100vh', background: T.bg, paddingBottom: 96 }}>

        {/* ══════════ HEADER ══════════ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(247,246,242,0.94)',
          backdropFilter: 'blur(18px) saturate(1.5)',
          borderBottom: `1px solid ${T.border}`,
        }}>
          {/* Row 1 */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>

              {/* Back */}
              <motion.button whileTap={{ scale: .9 }} onClick={() => navigate(-1)}
                style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, cursor: 'pointer', boxShadow: T.shadow }}>
                <ArrowLeft size={14} />
              </motion.button>

              {/* Wordmark */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Product Suite
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: T.textMute, fontWeight: 500, marginTop: 1 }}>
                  {s.total} items · {s.cats} categories
                </p>
              </div>

              {/* Search — desktop */}
              <div className="hdr-search" style={{ display: 'none', position: 'relative', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMute, pointerEvents: 'none' }} />
                <input type="text" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)}
                  className="inp" style={{ ...baseInp, paddingLeft: 32, paddingTop: 8, paddingBottom: 8, paddingRight: query ? 28 : 12, width: 180, fontSize: 13 }} />
                {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMute, padding: 0, lineHeight: 0 }}><X size={11} /></button>}
              </div>

              {/* Add button */}
              <motion.button whileTap={{ scale: .95 }} onClick={() => { reset(); setIsAdding(true); }}
                className="cta"
                style={{ padding: '8px 14px', borderRadius: 9, background: T.amber, color: '#FFF', fontWeight: 700, fontSize: 13, boxShadow: `0 3px 12px rgba(201,146,26,.32)`, flexShrink: 0 }}>
                <Plus size={14} strokeWidth={2.5} />
                Add
              </motion.button>
            </div>
          </div>

          {/* Row 2 — tabs */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
              {(['all','live','off'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className="tab-btn"
                  style={{ color: tab === t ? T.amber : T.textMute, borderBottomColor: tab === t ? T.amber : 'transparent' }}>
                  {t === 'all' ? `All  ${s.total}` : t === 'live' ? `Live  ${s.live}` : `Off  ${s.off}`}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button className="tab-btn icon-btn" style={{ gap: 5, borderRadius: 7, padding: '5px 10px', marginRight: 2, marginBottom: 6, color: T.textSub }}>
                <SlidersHorizontal size={12} /><span style={{ fontSize: 11, fontWeight: 700 }}>Filter</span>
              </button>
            </div>
          </div>
        </header>

        {/* ══════════ CONTENT ══════════ */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 16px 0' }}>

          {/* Mobile search */}
          <div className="mob-search" style={{ marginBottom: 14, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMute, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)}
              className="inp" style={{ ...baseInp, paddingLeft: 36, paddingRight: query ? 36 : 14 }} />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMute, padding: 0, lineHeight: 0 }}><X size={13} /></button>}
          </div>

          {/* ── STATS ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { v: s.total,    l: 'Products', icon: <Box       size={13}/>, c: T.indigo,  bg: T.indigoBg },
              { v: s.live,     l: 'Live',     icon: <TrendingUp size={13}/>, c: T.green,   bg: T.greenBg  },
              { v: s.off,      l: 'Archived', icon: <Archive   size={13}/>, c: T.textMute, bg: 'rgba(156,154,147,.1)' },
              { v: s.cats,     l: 'Categories',icon:<Tag       size={13}/>, c: T.amber,   bg: T.amberBg  },
            ].map((x, i) => (
              <motion.div key={i} variants={up}
                style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: x.bg, color: x.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{x.icon}</div>
                <div>
                  <p className="stat-val" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{x.v}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: T.textMute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{x.l}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── FORM ── */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: .96 }} animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: .96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{ marginBottom: 20, transformOrigin: 'top' }}
              >
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: T.shadowLg }}>
                  {/* Accent bar */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${T.amber} 25%, ${T.amberLt} 55%, ${T.amber} 75%, transparent)` }} />

                  <div style={{ padding: '22px 22px 26px' }}>
                    {/* Form head */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.amberBg, border: `1px solid ${T.amberRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber }}>
                          {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                            {editingId ? 'Edit Product' : 'New Product'}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 12, color: T.textMute }}>
                            {editingId ? 'Update fields below' : 'Fill in to publish'}
                          </p>
                        </div>
                      </div>
                      <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: .9 }} onClick={reset}
                        style={{ width: 32, height: 32, borderRadius: 8, background: T.bgDeep, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, cursor: 'pointer' }}>
                        <X size={14} />
                      </motion.button>
                    </div>

                    <form onSubmit={onSave}>
                      <div className="fg" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr' }}>

                        {/* Photo */}
                        <div>
                          <FieldLabel>Photo</FieldLabel>
                          <motion.div whileTap={{ scale: .98 }} onClick={() => fileRef.current?.click()}
                            style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: `2px dashed ${newImage ? T.border : T.amberRing}`, background: newImage ? 'transparent' : T.amberBg, transition: 'border-color .18s' }}
                            className="upload-z">
                            <style>{`.upload-z:hover{border-color:${T.amber}!important}`}</style>
                            {newImage ? (
                              <>
                                <img src={newImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(4px)', opacity: 0, transition: 'opacity .18s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                                  className="rpl">
                                  <style>{`.upload-z:hover .rpl{opacity:1!important}`}</style>
                                  <UploadCloud color="white" size={18} />
                                  <span style={{ color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>Replace</span>
                                </div>
                              </>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,146,26,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber }}>
                                  <ImageIcon size={18} />
                                </div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: '.08em' }}>Upload</p>
                                <p style={{ margin: 0, fontSize: 10, color: T.textMute }}>Max 1.5 MB</p>
                              </div>
                            )}
                            <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={onImage} />
                          </motion.div>
                        </div>

                        {/* Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div className="f2" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
                            <div>
                              <FieldLabel req>Name</FieldLabel>
                              <input type="text" placeholder="e.g. Butter Loaf" value={name} onChange={e => setName(e.target.value)} required className="inp" style={baseInp} />
                            </div>
                            <div>
                              <FieldLabel req>Price (₦)</FieldLabel>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.amber, fontWeight: 800, fontSize: 14, pointerEvents: 'none' }}>₦</span>
                                <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required className="inp" style={{ ...baseInp, paddingLeft: 28, color: T.amber, fontWeight: 700 }} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <FieldLabel>Category</FieldLabel>
                            <input type="text" placeholder="e.g. Pastries" value={category} onChange={e => setCategory(e.target.value)} className="inp" style={baseInp} />
                          </div>

                          <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                            <motion.button whileTap={{ scale: .97 }} type="button" onClick={reset}
                              style={{ flex: 1, padding: '11px', borderRadius: 10, background: T.bgDeep, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Cancel
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: .97 }} type="submit"
                              style={{ flex: 2, padding: '11px', borderRadius: 10, background: T.amber, color: '#FFF', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', border: 'none', fontFamily: 'inherit', boxShadow: `0 4px 14px rgba(201,146,26,.32)` }}>
                              <CheckCircle2 size={14} />
                              {editingId ? 'Save Changes' : 'Deploy Product'}
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

          {/* ── GRID ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="pg">
            {filtered.map(p => (
              <motion.div key={p.id} variants={up} className="card"
                style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: p.active ? 1 : .46, filter: p.active ? 'none' : 'grayscale(.55)', cursor: 'default' }}>

                {/* Image */}
                <div className="ci" style={{ position: 'relative', aspectRatio: '1 / 1', background: T.bgDeep, overflow: 'hidden', flexShrink: 0 }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800, color: T.border, background: T.bgDeep, userSelect: 'none', letterSpacing: '-0.04em' }}>{p.name.charAt(0)}</div>
                  }

                  {/* Status */}
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}><Pill live={p.active} /></div>

                  {/* Hover overlay */}
                  <div className="ov" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(247,246,242,.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: .9 }} onClick={() => edit(p)}
                      style={{ width: 38, height: 38, borderRadius: 10, background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer', boxShadow: T.shadowMd }}>
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: .9 }} onClick={() => toggle(p)}
                      style={{ width: 38, height: 38, borderRadius: 10, background: p.active ? T.redBg : T.greenBg, border: `1px solid ${p.active ? 'rgba(185,28,28,.18)' : 'rgba(21,128,61,.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.active ? T.red : T.green, cursor: 'pointer', boxShadow: T.shadowMd }}>
                      {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                    </motion.button>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '12px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.amber, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.category || 'General'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.35, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {p.name}
                  </p>
                  {/* Price + mini actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 9, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMute }}>₦</span>
                      <span style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {p.price.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => edit(p)} className="icon-btn"
                        style={{ width: 27, height: 27, borderRadius: 7, color: T.textSub }}>
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => toggle(p)} className="icon-btn"
                        style={{ width: 27, height: 27, borderRadius: 7, background: p.active ? T.redBg : T.greenBg, borderColor: p.active ? 'rgba(185,28,28,.16)' : 'rgba(21,128,61,.16)', color: p.active ? T.red : T.green }}>
                        {p.active ? <Archive size={11} /> : <CheckCircle2 size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty */}
            {filtered.length === 0 && (
              <motion.div variants={up} style={{ gridColumn: '1 / -1', padding: '72px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: T.shadow }}>
                  <PackageSearch size={26} color={T.textMute} />
                </div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>No products found</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMute, lineHeight: 1.6, maxWidth: 240 }}>
                  {query ? `Nothing matches "${query}"` : 'Add your first product to get started.'}
                </p>
                {!query && (
                  <motion.button whileTap={{ scale: .96 }} onClick={() => setIsAdding(true)} className="cta"
                    style={{ marginTop: 20, padding: '11px 22px', borderRadius: 10, background: T.amber, color: '#FFF', fontWeight: 800, fontSize: 13, boxShadow: `0 4px 14px rgba(201,146,26,.32)` }}>
                    <Plus size={14} /> Add Product
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ══════════ BOTTOM PILL ══════════ */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '0 16px 18px' }}>
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: .28, type: 'spring', stiffness: 300, damping: 28 }}
            style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(22px) saturate(1.6)', border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: `0 -2px 24px rgba(24,23,15,.09), ${T.shadowLg}, inset 0 1px 0 rgba(255,255,255,.95)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: T.amberBg, border: `1px solid ${T.amberRing}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber, flexShrink: 0 }}>
                <Box size={15} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1 }}>
                  {filtered.length} <span style={{ fontWeight: 500, color: T.textMute }}>/ {s.total}</span>
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textMute }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>●</span> {s.live} live &nbsp;·&nbsp; ○ {s.off} off
                </p>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: T.border, flexShrink: 0 }} />
            <motion.button whileTap={{ scale: .95 }} onClick={() => { reset(); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="cta"
              style={{ padding: '10px 16px', borderRadius: 10, background: T.amber, color: '#FFF', fontWeight: 800, fontSize: 13, boxShadow: `0 3px 12px rgba(201,146,26,.28)`, flexShrink: 0 }}>
              <Plus size={14} strokeWidth={2.5} /> Add Product
            </motion.button>
          </motion.div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;