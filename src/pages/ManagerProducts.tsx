import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X, UploadCloud, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../store/types';

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (override via Tailwind if needed)
───────────────────────────────────────────── */
const TOKEN = {
  accent:      '#F59E0B',   // amber-500
  accentDark:  '#D97706',
  accentGlow:  'rgba(245,158,11,0.18)',
  danger:      '#EF4444',
  success:     '#22C55E',
  radius:      '1.75rem',
  radiusSm:    '1rem',
};

export const ManagerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();

  const [isAdding,   setIsAdding]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [name,       setName]       = useState('');
  const [price,      setPrice]      = useState('');
  const [category,   setCategory]   = useState('Bread');
  const [newImage,   setNewImage]   = useState<string | undefined>(undefined);
  const [searchQuery,setSearchQuery]= useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Image upload ── */
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Please select an image smaller than 1.5 MB to preserve cloud sync speed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setNewImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Save (add or edit) ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    if (editingId) {
      const existing = products.find(p => p.id === editingId);
      if (existing) {
        await updateProduct({
          ...existing,
          name,
          price: parseFloat(price),
          category,
          image: newImage !== undefined ? newImage : existing.image,
        });
      }
    } else {
      await addProduct({
        id:       Date.now().toString(),
        name,
        price:    parseFloat(price),
        stock:    0,
        active:   true,
        category,
        image:    newImage,
      });
    }
    resetForm();
  };

  const startEdit = (p: Product) => {
    setName(p.name);
    setPrice(p.price.toString());
    setCategory(p.category || 'Bread');
    setNewImage(p.image);
    setEditingId(p.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');  setPrice('');  setCategory('Bread');
    setNewImage(undefined);  setEditingId(null);  setIsAdding(false);
  };

  const toggleActive = async (p: Product) =>
    await updateProduct({ ...p, active: !p.active });

  /* ── Derived data ── */
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(q) ||
           (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const activeProducts = filteredProducts.filter(p => p.active).length;
  const categories     = Array.from(new Set(products.map(p => p.category)));

  /* ── Animation variants ── */
  const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const pop = {
    hidden: { opacity: 0, scale: 0.85, y: 24 },
    show:   { opacity: 1, scale: 1, y: 0,
              transition: { type: 'spring' as const, stiffness: 420, damping: 28 } },
  };

  /* ── Metric card data ── */
  const metrics = [
    { label: 'Active',    value: activeProducts,    icon: <PackageSearch size={18} />, color: TOKEN.accent,   glow: TOKEN.accentGlow },
    { label: 'Catalog',   value: products.length,   icon: <Layers        size={18} />, color: '#3B82F6', glow: 'rgba(59,130,246,0.15)' },
    { label: 'Categories',value: categories.length, icon: <Search        size={18} />, color: '#EC4899', glow: 'rgba(236,72,153,0.15)' },
  ];

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-[#F7F7F5] dark:bg-zinc-950 pb-28 overflow-hidden relative"
           style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}>

        {/* ── Background mesh ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ background: `radial-gradient(ellipse 70% 50% at 80% -10%, ${TOKEN.accentGlow}, transparent)` }}
               className="absolute inset-0" />
          <div style={{ background: 'radial-gradient(ellipse 50% 40% at -10% 90%, rgba(236,72,153,0.08), transparent)' }}
               className="absolute inset-0" />
          {/* Fine grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025] dark:opacity-[0.04]"
               xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8">

          {/* ─────────── HEADER ─────────── */}
          <div className="flex items-center gap-4 mb-10">
            <motion.button
              whileHover={{ scale: 1.08, x: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/10
                         shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300
                         hover:border-amber-400/60 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </motion.button>

            <div>
              <h1 className="text-[1.75rem] font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                Product <span style={{ color: TOKEN.accent }}>Suite</span>
              </h1>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-1 tracking-wide uppercase">
                Manage your product catalog
              </p>
            </div>
          </div>

          {/* ─────────── METRIC CARDS ─────────── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-10">
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative bg-white dark:bg-zinc-900 rounded-[1.5rem] p-5 overflow-hidden
                           border border-black/[0.05] dark:border-white/5
                           shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                {/* Glow blob */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-80"
                     style={{ background: m.glow }} />
                {/* Icon pill */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: m.glow, color: m.color }}>
                  {m.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                  {m.label}
                </p>
                <p className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
                  {m.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ─────────── FORM / SEARCH BAR ─────────── */}
          <AnimatePresence mode="wait">
            {isAdding ? (
              /* ── ADD / EDIT FORM ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
                exit={{   opacity: 0, y: -16, filter: 'blur(8px)' }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 sm:p-8
                           border border-black/[0.05] dark:border-white/5
                           shadow-[0_8px_40px_rgba(0,0,0,0.07)] mb-10 relative overflow-hidden"
              >
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
                     style={{ background: `linear-gradient(90deg, transparent, ${TOKEN.accent}, transparent)` }} />

                {/* Form header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white shadow-lg"
                         style={{ background: `linear-gradient(135deg, ${TOKEN.accent}, ${TOKEN.accentDark})`,
                                  boxShadow: `0 6px 20px ${TOKEN.accentGlow}` }}>
                      <Plus size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                        {editingId ? 'Edit Product' : 'New Product'}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {editingId ? 'Update asset details' : 'Add to catalog'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetForm}
                    className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center
                               text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave}
                      className="grid md:grid-cols-[180px_1fr] gap-8">

                  {/* Photo upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">
                      Product Photo
                    </label>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square rounded-[1.5rem] border-2 border-dashed cursor-pointer
                                 overflow-hidden relative group transition-all"
                      style={{ borderColor: newImage ? 'transparent' : `${TOKEN.accent}50`,
                               background: newImage ? 'transparent' : `${TOKEN.accentGlow}` }}
                    >
                      {newImage ? (
                        <>
                          <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                          flex flex-col items-center justify-center transition-all backdrop-blur-sm">
                            <UploadCloud className="text-white mb-1" size={22} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center"
                             style={{ color: TOKEN.accent }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                               style={{ background: TOKEN.accentGlow }}>
                            <ImageIcon size={24} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Upload Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleProductImageUpload}
                      />
                    </motion.div>
                  </div>

                  {/* Fields */}
                  <div className="flex flex-col gap-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">
                          Product Name <span style={{ color: TOKEN.accent }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Premium Butter Loaf"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl py-3.5 px-5
                                     text-[15px] font-semibold text-zinc-900 dark:text-white
                                     placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                                     border-2 border-transparent outline-none transition-all
                                     focus:border-amber-400/60 focus:bg-white dark:focus:bg-zinc-800
                                     hover:bg-white dark:hover:bg-zinc-800"
                        />
                      </div>
                      {/* Price */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">
                          Price (₦) <span style={{ color: TOKEN.accent }}>*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-zinc-400 text-sm">₦</span>
                          <input
                            type="number"
                            placeholder="1000"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            required
                            className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl py-3.5 pl-10 pr-5
                                       text-[15px] font-black text-amber-500
                                       placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                                       border-2 border-transparent outline-none transition-all
                                       focus:border-amber-400/60 focus:bg-white dark:focus:bg-zinc-800
                                       hover:bg-white dark:hover:bg-zinc-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">
                        Category
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pastries & Snacks"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl py-3.5 px-5
                                   text-[15px] font-semibold text-zinc-900 dark:text-white
                                   placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                                   border-2 border-transparent outline-none transition-all
                                   focus:border-amber-400/60 focus:bg-white dark:focus:bg-zinc-800
                                   hover:bg-white dark:hover:bg-zinc-800"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2 border-t border-black/[0.04] dark:border-white/5 mt-auto">
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm
                                   bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400
                                   hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: `0 12px 28px ${TOKEN.accentGlow}` }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        className="flex-[2] py-3.5 rounded-2xl font-black text-sm text-white
                                   flex items-center justify-center gap-2 transition-all"
                        style={{ background: `linear-gradient(135deg, ${TOKEN.accent}, ${TOKEN.accentDark})` }}
                      >
                        <CheckCircle2 size={16} />
                        {editingId ? 'Update Product' : 'Deploy Product'}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>

            ) : (
              /* ── SEARCH + ADD BUTTON ── */
              <motion.div
                key="toolbar"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <div className="relative flex-1 sm:max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400
                                     group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search products or categories…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 rounded-2xl py-3.5 pl-12 pr-12
                               text-[15px] font-semibold text-zinc-900 dark:text-white
                               placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                               border border-black/[0.06] dark:border-white/5
                               shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                               focus:ring-2 focus:ring-amber-400/30 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${TOKEN.accentGlow}` }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsAdding(true)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl
                             font-black text-sm text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${TOKEN.accent}, ${TOKEN.accentDark})` }}
                >
                  <Plus size={18} /> Add Product
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────── PRODUCT GRID ─────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {filteredProducts.map(p => (
              <motion.div
                key={p.id}
                variants={pop}
                className={`group relative bg-white dark:bg-zinc-900 rounded-[1.75rem] overflow-hidden
                            border border-black/[0.05] dark:border-white/5 flex flex-col
                            transition-all duration-300
                            ${p.active
                              ? 'shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.10)] hover:-translate-y-1.5'
                              : 'opacity-40 grayscale'
                            }`}
              >
                {/* Image */}
                <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center
                                    text-7xl font-black text-zinc-200 dark:text-zinc-700 select-none">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  {/* Status pill */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full
                                      backdrop-blur-md shadow-sm
                                      ${p.active
                                        ? 'bg-zinc-900/80 text-white dark:bg-white/90 dark:text-zinc-900'
                                        : 'bg-zinc-400/70 text-white'
                                      }`}>
                      {p.active ? 'Live' : 'Archived'}
                    </span>
                  </div>

                  {/* Hover action overlay — desktop */}
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px] opacity-0
                                  group-hover:opacity-100 transition-opacity duration-200
                                  hidden lg:flex items-center justify-center gap-2 z-10">
                    <motion.button
                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(p)}
                      className="w-10 h-10 rounded-full bg-white/95 dark:bg-zinc-800/95
                                 flex items-center justify-center shadow-lg
                                 text-zinc-600 hover:text-amber-500 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleActive(p)}
                      className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors
                                  bg-white/95 dark:bg-zinc-800/95
                                  ${p.active ? 'text-red-400 hover:text-white hover:bg-red-500'
                                             : 'text-emerald-500 hover:text-white hover:bg-emerald-500'}`}
                      title={p.active ? 'Archive' : 'Restore'}
                    >
                      {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                    </motion.button>
                  </div>
                </div>

                {/* Mobile quick actions */}
                <div className="lg:hidden flex items-center justify-between px-3 pt-2.5">
                  <button
                    onClick={() => startEdit(p)}
                    className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800
                               flex items-center justify-center text-zinc-500"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center
                                ${p.active
                                  ? 'bg-red-50 text-red-400 dark:bg-red-900/20'
                                  : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'}`}
                  >
                    {p.active ? <Archive size={11} /> : <CheckCircle2 size={11} />}
                  </button>
                </div>

                {/* Content */}
                <div className="px-3 pb-4 pt-2 flex flex-col flex-grow">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 truncate"
                     style={{ color: TOKEN.accent }}>
                    {p.category || 'Bakery'}
                  </p>
                  <h4 className="text-[13px] sm:text-sm font-bold text-zinc-800 dark:text-zinc-100
                                 line-clamp-2 leading-snug mb-2">
                    {p.name}
                  </h4>
                  <div className="mt-auto flex items-baseline gap-0.5">
                    <span className="text-xs font-bold text-zinc-400 mr-0.5">₦</span>
                    <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                      {p.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div
                variants={pop}
                className="col-span-full py-24 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                  <PackageSearch size={36} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <h4 className="text-xl font-black text-zinc-800 dark:text-white mb-2">No products found</h4>
                <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : 'Your catalog is empty. Add your first product to get started.'}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;