import React, { useState, useRef, useMemo } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { PackageSearch, ArrowLeft, Plus, Edit2, Archive, CheckCircle2, Image as ImageIcon, Search, X, UploadCloud, Tag, DollarSign, Layers, ChevronRight } from 'lucide-react';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { 
      y: 0,  
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-24 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] opacity-70 pointer-events-none -translate-y-1/2 translate-x-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50 pointer-events-none translate-y-1/3 -translate-x-1/3 z-0"></div>

        <div className="container relative z-10 pt-4">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center border border-black/5 dark:border-white/5 hover:scale-105 active:scale-95 transition-all text-secondary">
              <ArrowLeft size={20} />
            </button>
            <div>
               <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 text-primary">
                 Catalog <span className="text-amber-500">Hub</span>
               </h1>
               <p className="text-sm font-medium text-secondary mt-0.5">Define your inventory, set prices, and upload assets.</p>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {/* Adding Product Form */}
            {isAdding ? (
              <motion.form 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onSubmit={handleSave} 
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 dark:border-white/5 mb-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-primary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                    {editingId ? 'Edit Product Configuration' : 'Create New Product'}
                  </h2>
                  <button type="button" onClick={resetForm} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary hover:bg-black/10 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
                  {/* Premium Image Uploader */}
                  <div>
                    <div 
                      className="w-full aspect-square md:aspect-auto md:h-full min-h-[250px] rounded-[24px] border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center bg-black/5 dark:bg-zinc-800/50 cursor-pointer hover:bg-amber-500/5 transition-colors overflow-hidden relative group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newImage ? (
                        <>
                          <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
                               <UploadCloud size={24} className="text-white" />
                             </div>
                             <span className="text-white text-sm font-bold tracking-wide">Replace Artwork</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                            <ImageIcon size={32} />
                          </div>
                          <h3 className="text-base font-bold text-primary mb-1">Upload Product Image</h3>
                          <p className="text-xs font-medium text-secondary">High-res PNG or JPG.<br/>Max 1.5MB recommended.</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                  </div>

                  {/* Form Inputs */}
                  <div className="flex flex-col gap-5">
                    <div className="bg-black/5 dark:bg-white/5 p-5 rounded-[24px]">
                      <label className="text-[11px] font-black uppercase tracking-widest text-secondary mb-2 block ml-1">Product Details</label>
                      <div className="space-y-4">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary"><Tag size={18}/></span>
                          <input type="text" className="w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-primary placeholder-secondary focus:ring-2 focus:ring-amber-500/50 outline-none transition-shadow shadow-sm" placeholder="e.g. Premium Sliced Loaf" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary"><DollarSign size={18}/></span>
                            <input type="number" className="w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-primary placeholder-secondary focus:ring-2 focus:ring-amber-500/50 outline-none transition-shadow shadow-sm" placeholder="Retail Price (e.g. 1000)" value={price} onChange={e => setPrice(e.target.value)} required />
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary"><PackageSearch size={18}/></span>
                            <input type="text" className="w-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-primary placeholder-secondary focus:ring-2 focus:ring-amber-500/50 outline-none transition-shadow shadow-sm" placeholder="Category (e.g. Pastries)" value={category} onChange={e => setCategory(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button type="button" className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[20px] font-bold text-primary flex items-center justify-center hover:bg-black/5 transition-colors" onClick={resetForm}>
                        Cancel
                      </button>
                      <button type="submit" className="flex-[2] py-4 bg-amber-500 text-white rounded-[20px] font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.3)] hover:bg-amber-600 hover:-translate-y-1 transition-all">
                        <CheckCircle2 size={20} /> {editingId ? 'Save Changes' : 'Publish to Catalog'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8"
              >
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search your inventory..." 
                    className="w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-[20px] py-4 pl-12 pr-4 font-bold text-primary placeholder-secondary/70 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="bg-primary text-white dark:bg-white dark:text-black px-6 py-4 rounded-[20px] font-black tracking-wide shadow-[0_8px_20px_rgb(0,0,0,0.1)] flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={20} /> Add Product
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5"
          >
            {filteredProducts.map(p => (
              <motion.div 
                variants={itemVariants}
                key={p.id} 
                className={`group bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[28px] border border-white/40 dark:border-white/5 overflow-hidden flex flex-col ${!p.active ? 'opacity-50 grayscale' : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500'}`}
              >
                {/* Top Half: Image */}
                <div className="relative w-full aspect-square bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden p-1">
                  <div className="w-full h-full rounded-[20px] overflow-hidden bg-white dark:bg-zinc-800 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                    ) : (
                      <div className="text-amber-500/20 font-black text-6xl select-none">
                         {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 flex gap-1 z-10">
                    <span className={`${p.active ? 'bg-success' : 'bg-secondary'} text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md`}>
                      {p.active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  {/* Floating Actions on Hover */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-4 lg:group-hover:translate-x-0 z-10">
                    <button 
                      onClick={() => startEdit(p)} 
                      className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 text-primary shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors backdrop-blur-md"
                      title="Edit Product"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => toggleActive(p)} 
                      className={`w-9 h-9 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex items-center justify-center transition-colors backdrop-blur-md ${p.active ? 'bg-white/90 dark:bg-zinc-800/90 text-danger hover:bg-danger hover:text-white' : 'bg-white/90 dark:bg-zinc-800/90 text-success hover:bg-success hover:text-white'}`}
                      title={p.active ? "Archive Product" : "Restore Product"}
                    >
                      {p.active ? <Archive size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Bottom Half: Info */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                     <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 truncate">{p.category || 'Bakery'}</div>
                  </div>
                  
                  <h3 className="font-bold text-[14px] leading-snug text-primary line-clamp-2 min-h-[40px] mb-3">{p.name}</h3>
                  
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="text-xl font-black text-primary tracking-tighter leading-none">
                      <span className="text-[12px] font-bold text-secondary align-top mr-0.5 opacity-50">â‚¦</span>
                      {p.price.toLocaleString()}
                    </div>
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-secondary group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors" title={`${p.stock || 0} left in stock`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredProducts.length === 0 && (
              <motion.div variants={itemVariants} className="col-span-full py-20 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[40px] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <PackageSearch size={32} className="text-secondary opacity-50" />
                </div>
                <h3 className="font-black text-xl text-primary mb-1">Catalog Empty</h3>
                <p className="text-sm font-medium text-secondary max-w-sm mx-auto">You haven't added any products yet, or your search didn't match anything.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
};
export default ManagerProducts;
