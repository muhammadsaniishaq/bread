import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { PackageSearch, ArrowLeft, Plus, Edit2, Archive, CheckCircle2, Image as ImageIcon, Search, X, UploadCloud, Tag, DollarSign, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import type { Product } from '../store/types';

export const ManagerProducts: React.FC = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Bread');
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please select an image smaller than 1.5MB to preserve cloud sync speed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      setNewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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
          image: newImage !== undefined ? newImage : existing.image
        });
      }
    } else {
      await addProduct({
        id: Date.now().toString(),
        name,
        price: parseFloat(price),
        stock: 0,
        active: true,
        category,
        image: newImage
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
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('Bread');
    setNewImage(undefined);
    setEditingId(null);
    setIsAdding(false);
  };

  const toggleActive = async (p: Product) => {
    await updateProduct({ ...p, active: !p.active });
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <div>
             <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
               <PackageSearch className="text-amber-500" /> Catalog Manager
             </h1>
             <p className="text-sm font-medium opacity-60">Manage bakery products, pricing, and visual artwork.</p>
          </div>
        </div>

        {/* Floating Add Product / Form Area */}
        {isAdding ? (
          <form onSubmit={handleSave} className="bg-surface p-6 rounded-3xl shadow-xl border border-amber-500/30 mb-8 relative overflow-hidden animate-bounce-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>
            
            <h2 className="text-lg font-black text-amber-600 dark:text-amber-400 mb-5 relative z-10 flex items-center gap-2">
              <Layers size={20} /> {editingId ? 'Edit Product Configuration' : 'Create New Product'}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              {/* Image Uploader */}
              <div className="md:col-span-1">
                <div 
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 cursor-pointer hover:bg-black/10 transition-colors overflow-hidden relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newImage ? (
                    <>
                      <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <UploadCloud size={30} className="text-white mb-2" />
                         <span className="text-white text-xs font-bold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                        <ImageIcon size={30} />
                      </div>
                      <span className="text-sm font-bold opacity-70">Upload Artwork</span>
                      <span className="text-[10px] opacity-50 mt-1">1024x1024 max. (1.5MB)</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleProductImageUpload}
                />
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2 space-y-4">
                <div className="form-group">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Product Name *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"><Tag size={16}/></span>
                    <input type="text" className="form-input bg-background pl-10 py-3 font-bold" placeholder="e.g. Premium Sliced Loaf" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Retail Price (₦) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"><DollarSign size={16}/></span>
                      <input type="number" className="form-input bg-background pl-10 py-3 font-bold" placeholder="1000" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 block">Category</label>
                    <input type="text" className="form-input bg-background py-3 font-bold" placeholder="e.g. Pastries" value={category} onChange={e => setCategory(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button type="button" className="flex-1 py-3 border border-[var(--border-color)] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/5" onClick={resetForm}>
                    <X size={18} /> Cancel
                  </button>
                  <button type="submit" className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                    <CheckCircle2 size={18} /> {editingId ? 'Update Product' : 'Publish Product'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="w-full bg-surface border border-[var(--border-color)] rounded-2xl py-3 pl-10 pr-4 font-medium shadow-sm focus:border-amber-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="bg-amber-500 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:-translate-y-1 transition-all flex-shrink-0"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={20} /> <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} className={`group bg-surface rounded-[24px] border border-[var(--border-color)] overflow-hidden transition-all duration-300 flex flex-col ${!p.active ? 'opacity-60 grayscale' : 'shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 hover:shadow-[0_14px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 dark:ring-white/5'}`}>
              
              {/* Top Half: Image */}
              <div className="relative w-full aspect-square bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                ) : (
                  <div className="text-amber-500/20 font-black text-6xl select-none">
                     {p.name.charAt(0)}
                  </div>
                )}
                
                {/* Overlay Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {p.active ? (
                    <span className="bg-success text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md">Active</span>
                  ) : (
                    <span className="bg-secondary text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md">Archived</span>
                  )}
                </div>

                {/* Floating Actions on Hover */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 sm:translate-x-4 sm:group-hover:translate-x-0">
                  <button 
                    onClick={() => startEdit(p)} 
                    className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 text-primary shadow-xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors backdrop-blur-md"
                    title="Edit Product"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => toggleActive(p)} 
                    className={`w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-colors backdrop-blur-md ${p.active ? 'bg-white/90 dark:bg-zinc-800/90 text-danger hover:bg-danger hover:text-white' : 'bg-white/90 dark:bg-zinc-800/90 text-success hover:bg-success hover:text-white'}`}
                    title={p.active ? "Archive Product" : "Restore Product"}
                  >
                    {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Bottom Half: Info */}
              <div className="p-3.5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-1.5">
                   <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 truncate bg-amber-500/10 px-2 py-0.5 rounded-md">{p.category || 'Bakery'}</div>
                </div>
                
                <h3 className="font-bold text-[13px] leading-snug text-primary line-clamp-2 min-h-[36px] mb-3">{p.name}</h3>
                
                <div className="mt-auto pt-3 border-t border-[var(--border-color)] flex items-end justify-between">
                  <div className="text-lg font-black text-amber-500 tracking-tighter leading-none">
                    <span className="text-[11px] font-bold opacity-70 align-top mr-0.5">₦</span>
                    {p.price.toLocaleString()}
                  </div>
                  
                  {/* Stock tracking feature */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
                    <Layers size={12} className="opacity-70" /> {p.stock || 0} left
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border-color)] rounded-[32px] bg-surface">
              <PackageSearch size={48} className="mx-auto mb-3 opacity-20 text-amber-500" />
              <h3 className="font-bold text-lg">No Products Found</h3>
              <p className="text-xs font-medium opacity-50 mt-1">Try adjusting your search or add a new bread item.</p>
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
