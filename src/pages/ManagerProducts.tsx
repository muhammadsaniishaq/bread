import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { PackageSearch, ArrowLeft, Plus, Edit2, Archive, CheckCircle2, Image as ImageIcon, Search, X, UploadCloud, Layers } from 'lucide-react';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Animation variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <AnimatedPage>
      <div className="container pb-24 max-w-7xl mx-auto">
        
        {/* Modern Compact Header */}
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center border border-black/5 dark:border-white/5 text-secondary hover:bg-black/5 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2">
            Catalog <span className="text-amber-500">Manager</span>
          </h1>
        </div>

        {/* Compact Top Metrics Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
           <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[20px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-center">
             <div className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
               <PackageSearch size={14} className="text-amber-500" /> Active Items
             </div>
             <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">{activeProducts}</div>
           </div>
           <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[20px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-center">
             <div className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
               <Layers size={14} className="text-amber-500" /> Total Catalog
             </div>
             <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">{products.length}</div>
           </div>
           <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[20px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-center">
             <div className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest mb-1 flex items-center gap-1.5">
               <Search size={14} className="text-amber-500" /> Categories
             </div>
             <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">{categories.length}</div>
           </div>
        </div>

        {/* Structured Add/Edit Form Card */}
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-zinc-900 p-5 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-black/5 dark:border-white/5 mb-8"
            >
              <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                 <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-primary">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                       <Plus size={16} />
                    </div>
                    {editingId ? 'Edit Product Setup' : 'Add New Product'}
                 </h2>
                 <button onClick={resetForm} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary hover:bg-black/10 transition-colors">
                   <X size={16} />
                 </button>
              </div>
              
              <form onSubmit={handleSave} className="grid sm:grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] gap-6 sm:gap-8">
                {/* Clean Image Uploader */}
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-secondary uppercase tracking-widest">Image</label>
                   <div 
                     className="w-full aspect-square sm:w-full sm:h-auto rounded-[16px] border-2 border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-zinc-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all overflow-hidden relative group"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {newImage ? (
                       <>
                          <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                             <UploadCloud className="text-white" size={24} />
                          </div>
                       </>
                     ) : (
                       <div className="flex flex-col items-center text-secondary/60">
                          <ImageIcon size={28} className="mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                       </div>
                     )}
                     <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                   </div>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="flex flex-col gap-1.5 focus-within:text-amber-500">
                        <label className="text-xs font-bold text-inherit uppercase tracking-widest transition-colors">Product Name *</label>
                        <input 
                          type="text" 
                          className="w-full bg-black/5 dark:bg-zinc-800/50 rounded-[14px] py-3 px-4 font-bold text-primary placeholder-secondary/50 border border-transparent focus:border-amber-500/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all shadow-sm" 
                          placeholder="e.g. Premium Loaf" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required 
                        />
                     </div>
                     <div className="flex flex-col gap-1.5 focus-within:text-amber-500">
                        <label className="text-xs font-bold text-inherit uppercase tracking-widest transition-colors">Retail Price (₦) *</label>
                        <input 
                          type="number" 
                          className="w-full bg-black/5 dark:bg-zinc-800/50 rounded-[14px] py-3 px-4 font-bold text-amber-600 dark:text-amber-400 placeholder-secondary/50 border border-transparent focus:border-amber-500/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all shadow-sm" 
                          placeholder="e.g. 1000" 
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          required 
                        />
                     </div>
                   </div>

                   <div className="flex flex-col gap-1.5 focus-within:text-amber-500">
                      <label className="text-xs font-bold text-inherit uppercase tracking-widest transition-colors">Category</label>
                      <input 
                        type="text" 
                        className="w-full bg-black/5 dark:bg-zinc-800/50 rounded-[14px] py-3 px-4 font-bold text-primary placeholder-secondary/50 border border-transparent focus:border-amber-500/30 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all shadow-sm" 
                        placeholder="e.g. Pastries" 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      />
                   </div>

                   <div className="mt-2 flex gap-3">
                     <button 
                       type="button" 
                       onClick={resetForm}
                       className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 text-primary rounded-[14px] font-bold text-sm flex items-center justify-center hover:bg-black/10 transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit" 
                       className="flex-[2] py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[14px] shadow-lg shadow-amber-500/20 font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
                     >
                       <CheckCircle2 size={18} />
                       {editingId ? 'Save Changes' : 'Publish Product'}
                     </button>
                   </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center"
            >
               {/* Search Box */}
               <div className="relative w-full sm:max-w-sm group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    className="w-full bg-white dark:bg-zinc-900 rounded-[16px] py-3 pl-11 pr-4 font-bold text-primary placeholder-secondary/50 shadow-sm border border-black/5 dark:border-white/5 focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>

               <button 
                 className="w-full sm:w-auto bg-amber-500 text-white px-6 py-3 rounded-[16px] font-black tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:bg-amber-600 hover:-translate-y-0.5 transition-all text-sm"
                 onClick={() => setIsAdding(true)}
               >
                 <Plus size={18} /> Add Product
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Structured Grid Layout for Products (E-Commerce Style) */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {filteredProducts.map(p => (
            <motion.div 
               variants={itemVariants} 
               key={p.id} 
               className={`group bg-white dark:bg-zinc-900 rounded-[20px] p-2 flex flex-col border border-black/5 dark:border-white/5 ${!p.active ? 'opacity-60 grayscale' : 'shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300'}`}
            >
               {/* Image Container taking exactly 1:1 aspect ratio to keep cards neat and uniform */}
               <div className="relative w-full aspect-square bg-[#f4f4f5] dark:bg-zinc-800 rounded-[16px] flex items-center justify-center overflow-hidden mb-2">
                 {p.image ? (
                   <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={p.name} />
                 ) : (
                   <div className="font-black text-secondary/30 text-5xl select-none">{p.name.charAt(0)}</div>
                 )}
                 
                 {/* Badges */}
                 <div className="absolute top-2 left-2 z-10">
                   <span className={`${p.active ? 'bg-black/80 dark:bg-white/90 text-white dark:text-black' : 'bg-gray-400 dark:bg-zinc-600 text-white'} text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm`}>
                     {p.active ? 'Active' : 'Archived'}
                   </span>
                 </div>

                 {/* Quick Action Overlay (Clean) */}
                 <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                       onClick={() => startEdit(p)} 
                       className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800/90 text-primary shadow-lg flex items-center justify-center hover:text-amber-500 transition-colors backdrop-blur-md border border-black/5"
                       title="Edit"
                    >
                       <Edit2 size={12} />
                    </button>
                    <button 
                       onClick={() => toggleActive(p)} 
                       className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-colors backdrop-blur-md border border-black/5 bg-white dark:bg-zinc-800/90 ${p.active ? 'text-danger hover:text-white hover:bg-danger' : 'text-success hover:text-white hover:bg-success'}`}
                       title={p.active ? "Archive" : "Restore"}
                    >
                       {p.active ? <Archive size={12} /> : <CheckCircle2 size={12} />}
                    </button>
                 </div>
               </div>

               {/* Uniform Content Area */}
               <div className="px-1.5 pb-2 flex flex-col flex-grow">
                 <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-0.5 truncate">{p.category || 'Bakery'}</div>
                 <h4 className="font-bold text-xs sm:text-sm text-primary mb-1 line-clamp-2 leading-snug">{p.name}</h4>
                 <div className="mt-auto pt-1">
                   <div className="font-black text-sm sm:text-base text-primary tracking-tight">
                     <span className="text-[10px] font-bold text-secondary mr-0.5 opacity-70">₦</span>
                     {p.price.toLocaleString()}
                   </div>
                 </div>
               </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
             <motion.div variants={itemVariants} className="col-span-full py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center mb-4">
                  <PackageSearch size={32} className="text-secondary opacity-50" />
                </div>
                <h4 className="font-black text-lg text-primary mb-1">No products found</h4>
                <p className="text-sm font-medium text-secondary max-w-sm mx-auto">Your catalog is empty. Setup some items above to get started.</p>
             </motion.div>
          )}
        </motion.div>

      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
