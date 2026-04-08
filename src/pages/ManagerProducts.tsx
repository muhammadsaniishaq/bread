import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2, Archive,
  CheckCircle2, Image as ImageIcon, Search, X,
  UploadCloud, Layers, Tag, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { Product } from '../store/types';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const CATEGORIES = ['Bread', 'Pastry', 'Snacks', 'Drinks', 'Other'];

export const ManagerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();

  const [isAdding, setIsAdding]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [name,     setName]         = useState('');
  const [price,    setPrice]        = useState('');
  const [category, setCategory]     = useState('Bread');
  const [newImage, setNewImage]     = useState<string | undefined>(undefined);
  const [search,   setSearch]       = useState('');
  const [saving,   setSaving]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Please select an image smaller than 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSaving(true);
    try {
      if (editingId) {
        const existing = products.find(p => p.id === editingId);
        if (existing) await updateProduct({ ...existing, name, price: parseFloat(price), category, image: newImage !== undefined ? newImage : existing.image });
      } else {
        await addProduct({ id: Date.now().toString(), name, price: parseFloat(price), stock: 0, active: true, category, image: newImage });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
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

  const toggleActive = async (p: Product) => updateProduct({ ...p, active: !p.active });

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, search]);

  const activeCount   = products.filter(p => p.active).length;
  const archivedCount = products.filter(p => !p.active).length;
  const totalValue    = products.filter(p => p.active).reduce((s, p) => s + p.price, 0);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: '40px' }}>

        {/* ── Hero Header ── */}
        <div style={{ background: 'linear-gradient(158deg,#1a0533 0%,#3b0764 40%,#4f46e5 100%)', padding: '48px 20px 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
                style={{ width: '40px', height: '40px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={18} color="#fff" />
              </motion.button>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  Product <span style={{ color: '#fbbf24' }}>Catalog</span>
                </h1>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                  Manage all bakery products
                </p>
              </div>
            </div>

            {/* 3 stat pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
              {[
                { label: 'Active',    val: activeCount,   color: '#34d399', bg: 'rgba(16,185,129,0.15)',  icon: CheckCircle2 },
                { label: 'Total',     val: products.length, color: '#a5b4fc', bg: 'rgba(99,102,241,0.2)',  icon: Layers       },
                { label: 'Archived',  val: archivedCount, color: '#fca5a5', bg: 'rgba(239,68,68,0.15)',  icon: Archive      },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '16px', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ padding: '0 16px', marginTop: '-32px', position: 'relative', zIndex: 20 }}>

          {/* ── Add / Edit Form ── */}
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div key="form"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '14px' }}
              >
                {/* Form header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: editingId ? 'rgba(16,185,129,0.1)' : 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: editingId ? '#10b981' : '#4f46e5' }}>
                      {editingId ? <Edit2 size={17} /> : <Plus size={17} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{editingId ? 'Edit Product' : 'New Product'}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>{editingId ? 'Update product details' : 'Add to catalog'}</div>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={resetForm}
                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                    <X size={16} />
                  </motion.button>
                </div>

                <form onSubmit={handleSave}>
                  {/* Image upload */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '8px' }}>Product Photo</label>
                    <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()}
                      style={{ width: '100%', height: '140px', borderRadius: '16px', border: '2px dashed rgba(79,70,229,0.25)', background: 'rgba(79,70,229,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                      {newImage ? (
                        <>
                          <img src={newImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <UploadCloud size={22} color="#fff" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>Change</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#4f46e5' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={22} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>Tap to upload photo</span>
                        </div>
                      )}
                    </motion.div>
                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                  </div>

                  {/* Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>Product Name *</label>
                    <input type="text" placeholder="e.g. ₦500 Bread" value={name} onChange={e => setName(e.target.value)} required
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '14px 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {/* Price + Category row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>Price (₦) *</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#f59e0b', fontSize: '15px' }}>₦</span>
                        <input type="number" placeholder="500" value={price} onChange={e => setPrice(e.target.value)} required
                          style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '14px 14px 14px 32px', fontSize: '15px', fontWeight: 900, color: '#f59e0b', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        style={{ width: '100%', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '14px 12px', fontSize: '14px', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={resetForm}
                      style={{ flex: 1, padding: '14px', border: '1px solid rgba(0,0,0,0.08)', background: '#f8fafc', borderRadius: '14px', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
                      style={{ flex: 2, padding: '14px', border: 'none', background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius: '14px', fontSize: '13px', fontWeight: 900, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}>
                      <CheckCircle2 size={16} />
                      {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Search + Add row */
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '13px 14px 13px 40px', fontSize: '14px', fontWeight: 600, color: '#0f172a', outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={14} color="#94a3b8" />
                    </button>
                  )}
                </div>
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setIsAdding(true)}
                  style={{ padding: '13px 18px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.3)', flexShrink: 0 }}>
                  <Plus size={18} color="#fff" />
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Add</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Product Grid ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>

            {filtered.map(p => (
              <motion.div key={p.id} variants={card}
                style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', opacity: p.active ? 1 : 0.55 }}>

                {/* Product image */}
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 900, color: '#e2e8f0' }}>
                      🍞
                    </div>
                  )}
                  {/* Active badge */}
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: p.active ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.85)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '3px 8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.active ? 'Active' : 'Archived'}</span>
                  </div>
                  {/* Stock badge */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '3px 8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#fff' }}>{p.stock} units</span>
                  </div>
                </div>

                {/* Product info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={9} /> {p.category || 'Bread'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#4f46e5', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                    ₦{p.price.toLocaleString()}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => startEdit(p)}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid rgba(79,70,229,0.15)', background: 'rgba(79,70,229,0.06)', color: '#4f46e5', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Edit2 size={12} /> Edit
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => toggleActive(p)}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1px solid ${p.active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`, background: p.active ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', color: p.active ? '#ef4444' : '#10b981', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {p.active ? <><ToggleLeft size={12} /> Hide</> : <><ToggleRight size={12} /> Show</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <motion.div variants={card} style={{ gridColumn: '1/-1', padding: '48px 20px', textAlign: 'center', background: '#fff', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <PackageSearch size={28} color="#cbd5e1" />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>No Products Found</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                  {search ? `No results for "${search}"` : 'Click "Add" to create your first product'}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer summary */}
          {products.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
              {activeCount} active · {archivedCount} archived · avg ₦{products.length ? Math.round(totalValue / (activeCount || 1)).toLocaleString() : 0}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
