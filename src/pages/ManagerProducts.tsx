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

  return (
    <AnimatedPage>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .mp-root { font-family: 'DM Sans', sans-serif; }
        .mp-root .syne { font-family: 'Syne', sans-serif; }
        .mp-root ::-webkit-scrollbar { width: 4px; }
        .mp-root ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 99px; }
        .mp-input:focus { border-color: rgba(245,158,11,0.5) !important; background: rgba(245,158,11,0.04) !important; box-shadow: 0 0 0 4px rgba(245,158,11,0.08) !important; }
        .mp-input::placeholder { color: #9CA3AF; }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .shimmer {
          background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 45%, #F59E0B 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s linear infinite;
        }
        .card-hover { transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease, border-color 0.22s ease; }
        .card-hover:hover { transform: translateY(-5px) scale(1.018); box-shadow: 0 20px 48px rgba(0,0,0,0.12); border-color: rgba(245,158,11,0.22) !important; }
        .dark .card-hover:hover { box-shadow: 0 20px 48px rgba(0,0,0,0.55); }
        .img-zoom img { transition: transform 0.55s cubic-bezier(.22,.68,0,1.2); }
        .img-zoom:hover img { transform: scale(1.07); }
        .action-overlay { opacity: 0; transition: opacity 0.22s; }
        .img-zoom:hover .action-overlay { opacity: 1; }
      `}</style>

      {/* Bright Beautiful White Background Standardized */}
      <div className="mp-root min-h-screen pb-32 relative overflow-x-hidden bg-[#FAFAFA] dark:bg-zinc-950 transition-colors duration-500">

        {/* ── AMBIENT BG ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] right-[-15%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_65%)]" />
          <div className="absolute bottom-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_65%)]" />
        </div>

        {/* ══════════════════════════
            STICKY COMPACT HEADER
        ══════════════════════════ */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-[24px] saturate-[1.8] border-b border-black/5 dark:border-white/5 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-[56px]"> {/* Reduced Height to 56px */}

              {/* Left */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  <ArrowLeft size={16} />
                </motion.button>

                {/* Icon + title */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <Box size={16} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="syne shimmer text-lg font-extrabold tracking-tight leading-none text-zinc-900 dark:text-white">
                      Product Suite
                    </h1>
                    <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {stats.total} items &nbsp;·&nbsp; {stats.cats} categories
                    </p>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                {/* Search — hidden on mobile */}
                <div className="relative hidden sm:block">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="mp-input bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-900 dark:text-zinc-100 rounded-lg py-1.5 pl-9 pr-8 text-xs font-semibold w-40 sm:w-48 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Add CTA */}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 4px 14px rgba(245,158,11,0.25)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { resetForm(); setIsAdding(true); }}
                  className="bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 rounded-lg py-1.5 px-3.5 flex items-center gap-1.5 text-white font-bold text-xs whitespace-nowrap"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add Product</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8">

          {/* ── STAT CARDS ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-8">
            {[
              { label: 'Total Products', value: stats.total,    icon: <Layers     size={16}/>, color: 'text-indigo-500', glow: 'bg-indigo-500/10' },
              { label: 'Live',           value: stats.active,   icon: <TrendingUp size={16}/>, color: 'text-amber-500',  glow: 'bg-amber-500/10' },
              { label: 'Archived',       value: stats.archived, icon: <Archive    size={16}/>, color: 'text-zinc-500',   glow: 'bg-zinc-500/10' },
              { label: 'Categories',     value: stats.cats,     icon: <Sparkles   size={16}/>, color: 'text-pink-500',   glow: 'bg-pink-500/10' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[1.25rem] p-4 relative overflow-hidden shadow-sm"
              >
                {/* Shine & Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none rounded-[1.25rem]" />
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[20px] ${s.glow} opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl ${s.glow} ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                  {s.icon}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className="syne text-zinc-900 dark:text-white text-2xl sm:text-3xl font-extrabold leading-none tracking-tight">{s.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── MOBILE SEARCH ── */}
          <div className="sm:hidden mb-6 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text" placeholder="Search products or categories…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="mp-input w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-zinc-900 dark:text-zinc-100 rounded-xl py-3 pl-10 pr-10 text-sm font-semibold shadow-sm outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-4 border-b border-black/5 dark:border-white/5 mb-8 overflow-x-auto no-scrollbar">
            {(['all', 'active', 'archived'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-2.5 px-2 text-xs sm:text-sm font-bold whitespace-nowrap capitalize transition-all border-b-2 ${activeTab === tab ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
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
                initial={{ opacity: 0, scaleY: 0.95, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="mb-10 origin-top"
              >
                <div className="bg-white dark:bg-zinc-900 border border-amber-500/20 rounded-[1.5rem] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
                  {/* Top shimmer bar */}
                  <div className="h-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 dark:from-transparent dark:via-amber-500 dark:to-transparent" />

                  <div className="p-6 sm:p-8">
                    {/* Form header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                          {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                        </div>
                        <div>
                          <h2 className="syne text-lg font-extrabold text-zinc-900 dark:text-white leading-none">
                            {editingId ? 'Edit Product' : 'New Product'}
                          </h2>
                          <p className="text-zinc-500 text-xs mt-1">
                            {editingId ? 'Update the fields below' : 'Fill in details to publish'}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                        onClick={resetForm}
                        className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-500 flex items-center justify-center transition-colors"
                      >
                        <X size={16} />
                      </motion.button>
                    </div>

                    <form onSubmit={handleSave}>
                      <div className="grid md:grid-cols-[160px_1fr] gap-8">
                        {/* Photo */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Photo</label>
                          <motion.div
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`img-zoom relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${newImage ? 'border-transparent bg-transparent' : 'border-dashed border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'}`}
                          >
                            {newImage ? (
                              <>
                                <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                                <div className="action-overlay absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                                  <UploadCloud className="text-white" size={20} />
                                  <span className="text-white text-[9px] font-black tracking-widest uppercase">Replace</span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-amber-600 dark:text-amber-500">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                  <ImageIcon size={18} />
                                </div>
                                <div className="text-center">
                                  <span className="block text-[9px] font-bold uppercase tracking-widest">Upload Photo</span>
                                  <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">Max 1.5 MB</span>
                                </div>
                              </div>
                            )}
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                          </motion.div>
                        </div>

                        {/* Fields */}
                        <div className="flex flex-col gap-5">
                          <div className="grid sm:grid-cols-2 gap-5">
                            {/* Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Name <span className="text-amber-500">*</span>
                              </label>
                              <input
                                type="text" placeholder="e.g. Premium Butter Loaf"
                                value={name} onChange={e => setName(e.target.value)} required
                                className="mp-input w-full bg-black/5 dark:bg-white/5 border-2 border-transparent text-zinc-900 dark:text-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all placeholder:text-zinc-400"
                              />
                            </div>

                            {/* Price */}
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Price (₦) <span className="text-amber-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold">₦</span>
                                <input
                                  type="number" placeholder="1000"
                                  value={price} onChange={e => setPrice(e.target.value)} required
                                  className="mp-input w-full bg-black/5 dark:bg-white/5 border-2 border-transparent text-amber-600 dark:text-amber-500 font-bold rounded-xl py-3 pl-8 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Category</label>
                            <input
                              type="text" placeholder="e.g. Pastries & Snacks"
                              value={category} onChange={e => setCategory(e.target.value)}
                              className="mp-input w-full bg-black/5 dark:bg-white/5 border-2 border-transparent text-zinc-900 dark:text-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all placeholder:text-zinc-400"
                            />
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-black/5 dark:border-white/5 mt-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              type="button" onClick={resetForm}
                              className="flex-1 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm font-bold transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="flex-[2] py-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
          >
            {filteredProducts.map(p => (
              <motion.div
                key={p.id} variants={fadeUp}
                className={`card-hover img-zoom bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[1.25rem] overflow-hidden flex flex-col transition-all duration-300 ${p.active ? 'shadow-sm' : 'opacity-40 grayscale'}`}
              >
                {/* Image */}
                <div className="relative aspect-square bg-[#F4F4F5] dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-5xl font-extrabold text-amber-500/10 dark:text-amber-500/20 syne select-none">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  {/* Status */}
                  <div className="absolute top-2 left-2 z-10 flex">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm border ${p.active ? 'bg-white/90 text-zinc-900 border-white/20' : 'bg-zinc-500/80 text-white border-zinc-500/30'}`}>
                      {p.active ? '● Live' : '○ Archived'}
                    </span>
                  </div>

                  {/* Hover actions — desktop */}
                  <div className="action-overlay absolute inset-0 bg-gradient-to-t from-black/60 to-black/10 backdrop-blur-[2px] hidden lg:flex items-center justify-center gap-2 z-10">
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(p)}
                      title="Edit"
                      className="w-10 h-10 rounded-xl bg-white/95 text-zinc-800 flex items-center justify-center shadow-lg hover:text-amber-500 transition-colors"
                    >
                      <Edit2 size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleActive(p)}
                      title={p.active ? 'Archive' : 'Restore'}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${p.active ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                      {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                    </motion.button>
                  </div>
                </div>

                {/* Mobile quick actions */}
                <div className="lg:hidden flex items-center justify-end gap-1.5 px-2.5 pt-2">
                  <button onClick={() => startEdit(p)} className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-500 active:bg-black/10">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => toggleActive(p)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.active ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'}`}>
                    {p.active ? <Archive size={11} /> : <CheckCircle2 size={11} />}
                  </button>
                </div>

                {/* Text */}
                <div className="px-3 pb-3 pt-1 flex flex-col flex-grow">
                  <p className="text-amber-500 text-[9px] font-black tracking-widest uppercase mb-1 truncate">{p.category || 'Bakery'}</p>
                  <h4 className="text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-bold leading-tight mb-2 line-clamp-2 flex-grow">{p.name}</h4>
                  <div className="flex items-baseline gap-0.5 mt-auto">
                    <span className="text-zinc-400 text-[10px] font-bold">₦</span>
                    <span className="syne text-zinc-900 dark:text-white text-lg sm:text-xl font-extrabold tracking-tight leading-none">{p.price.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div variants={fadeUp} className="col-span-full py-16 px-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center justify-center mb-4 shadow-sm">
                  <PackageSearch size={28} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <h4 className="syne text-zinc-900 dark:text-white text-xl font-extrabold mb-1">No Products Found</h4>
                <p className="text-zinc-500 text-xs sm:text-sm max-w-xs mb-6">
                  {searchQuery ? `No results for "${searchQuery}".` : 'Your catalog is entirely empty.'}
                </p>
                {!searchQuery && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setIsAdding(true)}
                    className="bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <motion.div
            initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 280, damping: 26 }}
            className="max-w-[480px] mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-between p-3 gap-3 pointer-events-auto"
          >
            {/* Left info */}
            <div className="flex items-center gap-3 pl-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                <PackageSearch size={16} />
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white text-[11px] sm:text-xs font-bold leading-none mb-1">
                  {filteredProducts.length} <span className="text-zinc-400 font-medium">of</span> {stats.total} products
                </p>
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-zinc-500 font-semibold">
                  <span><span className="text-emerald-500 mr-0.5">●</span>{stats.active} live</span>
                  <span><span className="text-zinc-400 mr-0.5">●</span>{stats.archived} archived</span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-black/5 dark:bg-white/10 flex-shrink-0" />

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl py-2 px-4 shadow-sm text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} /> Add Product
            </motion.button>
          </motion.div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;