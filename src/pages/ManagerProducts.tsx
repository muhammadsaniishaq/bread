import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { PackageSearch, ArrowLeft, Plus, Edit2, Archive, CheckCircle2, Image as ImageIcon, Search, X, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
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

  const activeProducts = filteredProducts.filter(p => p.active).length;
  const categories = new Set(products.map(p => p.category)).size;

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <PackageSearch className="text-amber-500" /> Catalog Setup
          </h1>
        </div>

        {/* Global Catalog Status - Matches Remissions Layout */}
        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] bg-gradient-to-br from-amber-500/10 to-transparent mt-4 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 opacity-80">Global Configuration Status</h2>
          
          <div className="grid gap-4">
             <div className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
                <div className="text-xs font-bold opacity-70 mb-1 flex items-center gap-1"><PackageSearch size={12}/> Total Active Products</div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{activeProducts} Items</div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[var(--border-color)] shadow-inner">
                 <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Total Catalog</div>
                 <div className="font-bold text-lg text-primary">{products.length} Items</div>
               </div>
               <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[var(--border-color)] shadow-inner">
                 <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Categories</div>
                 <div className="font-bold text-lg text-primary">{categories} Groups</div>
               </div>
             </div>
          </div>
        </div>

        {/* Add / Edit Form Card - Matches Remissions Layout precisely */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="card border-t-4 border-amber-500 mb-8" style={{ background: 'var(--surface-color)' }}>
                <div className="flex justify-between items-center mb-5">
                   <h2 className="text-lg font-bold flex items-center gap-2">
                      <Plus size={20} className="text-amber-500" /> {editingId ? 'Edit Product Setup' : 'Add New Product'}
                   </h2>
                   <button onClick={resetForm} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary hover:bg-black/10 transition-colors">
                     <X size={16} />
                   </button>
                </div>
                
                <form onSubmit={handleSave}>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                     {/* Image Uploader Dashboard Style */}
                     <div 
                       className="w-full sm:w-32 h-32 rounded-xl flex-shrink-0 border-2 border-dashed border-amber-500/30 bg-background flex flex-col items-center justify-center cursor-pointer hover:bg-amber-500/5 hover:border-amber-500/50 transition-all relative overflow-hidden group shadow-sm"
                       onClick={() => fileInputRef.current?.click()}
                     >
                       {newImage ? (
                         <>
                            <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                               <UploadCloud className="text-white" size={24} />
                            </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center">
                            <ImageIcon className="text-amber-500 mb-1 opacity-80" size={28} />
                            <span className="text-[10px] font-bold uppercase opacity-60 mt-1">Product Photo</span>
                         </div>
                       )}
                       <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                     </div>

                     <div className="flex-1 form-group flex flex-col justify-center">
                        <label className="form-label text-xs">Product Name *</label>
                        <input 
                          type="text" 
                          className="form-input bg-background font-bold" 
                          placeholder="e.g. Premium Sliced Bread" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required 
                        />
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="form-group flex-[2]">
                      <label className="form-label text-xs">Retail Price (₦) *</label>
                      <input 
                        type="number" 
                        className="form-input bg-background font-bold text-amber-600 dark:text-amber-400" 
                        placeholder="e.g. 1000" 
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required 
                      />
                    </div>
                    
                    <div className="form-group flex-[3]">
                      <label className="form-label text-xs">Category</label>
                      <input 
                        type="text" 
                        className="form-input bg-background font-bold" 
                        placeholder="e.g. Pastries" 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn bg-amber-500 hover:bg-amber-600 text-white w-full rounded-2xl shadow-lg shadow-amber-500/20 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 size={18} />
                    {editingId ? 'Update Product Details' : 'Save & Publish Product'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAdding && (
          <div className="mb-8">
            <button 
              className="btn bg-surface border-2 border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 w-full rounded-2xl shadow-sm py-4 text-sm font-bold flex justify-center gap-2 hover:bg-amber-500/5 transition-all"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={18} /> Add New Product
            </button>
          </div>
        )}

        {/* Catalog List Header - Matches Remissions Logs Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-bold opacity-80 uppercase tracking-wide text-primary">Configured Catalog Logs</h3>
        </div>
        
        {/* Simple Dashboard Search Input */}
        <div className="mb-5">
          <div className="relative shadow-sm rounded-xl overflow-hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-60" size={18} />
            <input 
              type="text" 
              placeholder="Search by product name..." 
              className="w-full bg-surface border-0 py-3.5 pl-11 pr-4 font-bold text-sm focus:ring-2 focus:ring-amber-500/30 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Structured List Layout - Dashboard Log Style */}
        <div className="grid gap-3">
          {filteredProducts.map(p => (
            <div key={p.id} className={`bg-surface p-3.5 sm:p-4 rounded-3xl border border-[var(--border-color)] flex items-center gap-3 sm:gap-4 transition-all shadow-sm ${!p.active ? 'opacity-60 grayscale' : 'hover:-translate-y-0.5 hover:shadow-md'}`}>
              
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#f4f4f5] dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center shadow-inner">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <span className="font-black text-amber-500/40 text-2xl">{p.name.charAt(0)}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1.5 mb-1">
                   <div className={`w-2 h-2 rounded-full ${p.active ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-secondary'}`}></div>
                   <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-secondary truncate">{p.category || 'Bakery'}</div>
                 </div>
                 <h4 className="font-bold text-sm sm:text-base text-primary mb-0.5 truncate">{p.name}</h4>
                 <div className="font-black text-amber-600 dark:text-amber-400 tracking-tight text-sm sm:text-base">₦{p.price.toLocaleString()}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                 <button 
                   onClick={() => startEdit(p)} 
                   className="w-8 h-8 sm:w-10 sm:h-10 rounded-full sm:rounded-[14px] bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 transition-colors text-primary"
                   title="Edit"
                 >
                   <Edit2 size={16} />
                 </button>
                 <button 
                   onClick={() => toggleActive(p)} 
                   className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full sm:rounded-[14px] flex items-center justify-center hover:bg-black/10 transition-colors ${p.active ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}
                   title={p.active ? "Archive" : "Activate"}
                 >
                   {p.active ? <Archive size={16} /> : <CheckCircle2 size={16} />}
                 </button>
              </div>

            </div>
          ))}

          {filteredProducts.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="py-12 px-6 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-surface"
             >
               <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center mb-4">
                 <PackageSearch size={28} className="text-secondary opacity-50" />
               </div>
               <h4 className="font-bold text-base text-primary mb-1">No products found</h4>
               <p className="text-sm text-secondary opacity-80 max-w-xs mx-auto">Your catalog is currently empty. Add products to have them display here.</p>
             </motion.div>
          )}
        </div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
