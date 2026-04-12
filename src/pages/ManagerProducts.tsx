import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import {
  PackageSearch, ArrowLeft, Plus, Edit2,
  CheckCircle2, Image as ImageIcon, Search, X,
  Layers, Tag, ToggleLeft, ToggleRight, Sparkles, ChefHat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, type Variants } from 'framer-motion';
import type { Product } from '../store/types';
import { ImageCropModal } from '../components/ImageCropModal';

/* ─────────────────────────────────────────
   DESIGN SYSTEM V5 — Premium Light Palette
───────────────────────────────────────── */
const T = {
  bg:           '#f8f7ff',
  bg2:          '#f0eeff',
  white:        '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  danger:       '#e11d48',
  dangerLight:  'rgba(225,29,72,0.10)',
  gold:         '#d97706',
  goldLight:    'rgba(217,119,6,0.10)',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radius:       '24px',
  radiusSm:     '16px',
  shadow:       '0 4px 24px rgba(99,91,255,0.08)',
  shadowMd:     '0 8px 32px rgba(99,91,255,0.12)',
};

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
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('Bread');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [barcode,     setBarcode]     = useState('');
  const [newImage,    setNewImage]    = useState<string | undefined>(undefined);
  
  const [search,   setSearch]       = useState('');
  const [saving,   setSaving]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop controls
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Please select an image smaller than 2.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSource(ev.target?.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so you can select the same file again if needed
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setNewImage(croppedBase64);
    setCropModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    setSaving(true);
    try {
      if (editingId) {
        const existing = products.find(p => p.id === editingId);
        if (existing) await updateProduct({ 
          ...existing, name, price: parseFloat(price), category, 
          image: newImage !== undefined ? newImage : existing.image,
          description, ingredients,
          barcode
        });
      } else {
        await addProduct({ 
          id: crypto.randomUUID(), 
          name, price: parseFloat(price), stock: 0, active: true, category, 
          image: newImage,
          description, ingredients,
          barcode
        });
      }
      resetForm();
    } catch (err: any) {
      alert(`Failed to save product: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Product) => {
    setName(p.name); 
    setPrice(p.price.toString());
    setCategory(p.category || 'Bread'); 
    setDescription(p.description || '');
    setIngredients(p.ingredients || '');
    setBarcode(p.barcode || '');
    setNewImage(p.image);
    setEditingId(p.id); 
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCategory('Bread');
    setDescription(''); setIngredients('');
    setBarcode('');
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

  const inp = { width: '100%', background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: '14px', padding: '14px 16px', fontSize: '15px', fontWeight: 700, color: T.ink, outline: 'none', boxSizing: 'border-box' as const };
  const lbl = { fontSize: '10px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: '6px' };

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: '40px' }}>

        {/* ── Hero Header ── */}
        <div style={{ background: T.white, padding: '48px 20px 32px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: T.primaryLight, filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(-1)}
                style={{ width: '40px', height: '40px', borderRadius: '13px', background: T.bg, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={18} color={T.ink} />
              </motion.button>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: T.ink, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color={T.primary} /> Product Catalog
                </h1>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: T.txt2 }}>
                  Executive Bakery Items Data
                </p>
              </div>
            </div>

            {/* 3 stat pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
              {[
                { label: 'Active',    val: activeCount,     color: T.success, bg: T.successLight },
                { label: 'Total',     val: products.length, color: T.primary, bg: T.primaryLight },
                { label: 'Archived',  val: archivedCount,   color: T.danger,  bg: T.dangerLight },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '16px', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px', opacity: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ padding: '0 16px', marginTop: '20px', position: 'relative', zIndex: 20 }}>

          {/* ── Add / Edit Form Overlay Modal ── */}
          {isAdding && (
             <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ width: '100%', maxWidth: '420px', maxHeight: '85vh', background: T.white, borderRadius: '28px', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: `1px solid ${T.borderLight}`, overflowY: 'auto' }} className="hide-scrollbar">
                  
                  {/* Form header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${T.borderLight}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: editingId ? T.successLight : T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: editingId ? T.success : T.primary }}>
                        {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>{editingId ? 'Edit Product' : 'New Product'}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{editingId ? 'Update recipe & details' : 'Add to catalog directory'}</div>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={resetForm}
                      style={{ width: '36px', height: '36px', borderRadius: '12px', background: T.bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.txt2 }}>
                      <X size={18} />
                    </motion.button>
                  </div>

                  <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Image upload with Crop */}
                    <div>
                      <label style={lbl}>High-Res Product Photo</label>
                      <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', aspectRatio: '4/3', borderRadius: '18px', border: `2px dashed ${T.primary}40`, background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                        {newImage ? (
                          <>
                            <img src={newImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                              <ImageIcon size={28} color="#fff" />
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>Tap to Change</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: T.primary }}>
                            <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.shadow }}>
                              <ImageIcon size={24} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: T.primary }}>Tap to upload</span>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: T.txt3 }}>Aspect Ratio 4:3 (Landscape)</span>
                          </div>
                        )}
                      </motion.div>
                      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    </div>

                    {/* Name */}
                    <div>
                      <label style={lbl}>Product Title *</label>
                      <input type="text" placeholder="e.g. Executive Family Loaf" value={name} onChange={e => setName(e.target.value)} required style={inp} />
                    </div>

                    {/* Price + Barcode */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={lbl}>Sell Price (₦) *</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: T.gold, fontSize: '15px' }}>₦</span>
                          <input type="number" placeholder="500" value={price} onChange={e => setPrice(e.target.value)} required
                            style={{ ...inp, paddingLeft: '34px', color: T.gold, fontWeight: 900 }} />
                        </div>
                      </div>
                      <div>
                         <label style={lbl}>Barcode Number</label>
                         <input type="text" placeholder="Scan or enter code" value={barcode} onChange={e => setBarcode(e.target.value)} style={inp} />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label style={lbl}>Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label style={lbl}>Short Description</label>
                      <textarea placeholder="Delicious, freshly baked everyday..." value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} />
                    </div>

                    {/* Ingredients */}
                    <div>
                      <label style={lbl}>Ingredients & Nutritional Info</label>
                      <textarea placeholder="Wheat flour, Butter, Yeast..." value={ingredients} onChange={e => setIngredients(e.target.value)} rows={2} style={{ ...inp, resize: 'none', fontFamily: 'inherit' }} />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button type="button" onClick={resetForm} style={{ flex: 1, padding: '16px', border: `1px solid ${T.borderLight}`, background: T.bg, borderRadius: '16px', fontSize: '13px', fontWeight: 800, color: T.txt2, cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
                        style={{ flex: 2, padding: '16px', border: 'none', background: saving ? T.primaryLight : T.primary, borderRadius: '16px', fontSize: '13px', fontWeight: 900, color: saving ? T.primary : '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: saving ? 'none' : T.shadow }}>
                        <CheckCircle2 size={18} />
                        {saving ? 'Saving...' : editingId ? 'Update Recipe' : 'Add to Catalog'}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
             </div>
          )}

          {/* ── Search + Add Button ── */}
          {!isAdding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color={T.txt3} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', background: T.white, border: `1px solid ${T.borderLight}`, borderRadius: '16px', padding: '16px 16px 16px 42px', fontSize: '14px', fontWeight: 700, color: T.ink, outline: 'none', boxSizing: 'border-box', boxShadow: T.shadow }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: T.bg2, border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={12} color={T.primary} />
                  </button>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setIsAdding(true)}
                style={{ padding: '0 20px', background: T.primary, border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: T.shadow, flexShrink: 0 }}>
                <Plus size={18} color="#fff" />
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Add New</span>
              </motion.button>
            </motion.div>
          )}

          {/* ── Product Grid ── */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>

            {filtered.map(p => (
              <motion.div key={p.id} variants={card}
                style={{ background: T.white, borderRadius: '22px', overflow: 'hidden', boxShadow: T.shadow, border: `1px solid ${T.borderLight}`, opacity: p.active ? 1 : 0.6, position: 'relative' }}>

                {/* Status Badges overlay */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, display: 'flex', gap: '6px' }}>
                   <div style={{ background: p.active ? T.successLight : T.dangerLight, backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '4px 8px', border: `1px solid ${p.active ? T.success : T.danger}30` }}>
                     <span style={{ fontSize: '9px', fontWeight: 900, color: p.active ? T.success : T.danger, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.active ? 'Active' : 'Archived'}</span>
                   </div>
                </div>

                {/* Product image */}
                <div style={{ width: '100%', aspectRatio: '4/3', background: T.bg2, position: 'relative', overflow: 'hidden' }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primaryLight }}>
                      <ChefHat size={48} />
                    </div>
                  )}
                  {/* Stock tag floating */}
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: T.ink, borderRadius: '8px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Layers size={10} color="#fff" />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#fff' }}>{p.stock} units</span>
                  </div>
                </div>

                {/* Product info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> {p.category || 'Bread'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink, marginBottom: '8px', lineHeight: 1.2 }}>{p.name}</div>
                  
                  {/* description snippet */}
                  {(p.description || p.ingredients) && (
                     <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 500, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description || p.ingredients}
                     </div>
                  )}

                  <div style={{ fontSize: '20px', fontWeight: 900, color: T.primary, letterSpacing: '-0.02em', marginBottom: '14px' }}>
                    ₦{p.price.toLocaleString()}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => startEdit(p)}
                      style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${T.primary}20`, background: T.primaryLight, color: T.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Edit2 size={13} /> Edit
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => toggleActive(p)}
                      style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${p.active ? T.danger : T.success}20`, background: p.active ? T.dangerLight : T.successLight, color: p.active ? T.danger : T.success, fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {p.active ? <><ToggleLeft size={13} /> Disable</> : <><ToggleRight size={13} /> Enable</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <motion.div variants={card} style={{ gridColumn: '1/-1', padding: '60px 20px', textAlign: 'center', background: T.white, borderRadius: '24px', border: `1px solid ${T.borderLight}`, boxShadow: T.shadow }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <PackageSearch size={28} color={T.txt3} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink, marginBottom: '6px', letterSpacing: '-0.02em' }}>No Products Found</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: T.txt2 }}>
                  {search ? `No results match your search for "${search}"` : 'Your catalog is empty. Tap Add New to start.'}
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>

      {cropModalOpen && cropSource && (
        <ImageCropModal 
          isOpen={true}
          imageSrc={cropSource} 
          onCropCompleteAction={handleCropComplete} 
          onClose={() => setCropModalOpen(false)} 
        />
      )}
    </AnimatedPage>
  );
};

export default ManagerProducts;
