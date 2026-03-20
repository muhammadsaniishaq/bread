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
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as any, stiffness: 400, damping: 25 } }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-24 relative overflow-hidden">
        
        {/* Abstract Floating Ambient Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

        <div className="container relative z-10 max-w-7xl mx-auto pt-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <motion.button 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => navigate(-1)} 
               className="w-12 h-12 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.04)] flex items-center justify-center text-primary"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-3xl font-black text-primary flex items-center gap-2 tracking-tight">
                Product <span className="text-amber-500">Suite</span>
              </h1>
              <p className="text-sm font-bold text-secondary opacity-70 mt-0.5 tracking-wide">Orchestrate your global catalog.</p>
            </div>
          </div>

          {/* Ultra Premium Metrics Row */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10">
             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/5 relative overflow-hidden group"
             >
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
               <div className="w-10 h-10 rounded-[14px] bg-amber-500/10 flex items-center justify-center mb-3">
                 <PackageSearch size={20} className="text-amber-500" />
               </div>
               <div className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-widest mb-1">Active Assets</div>
               <div className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">{activeProducts}</div>
             </motion.div>

             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/5 relative overflow-hidden group"
             >
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
               <div className="w-10 h-10 rounded-[14px] bg-blue-500/10 flex items-center justify-center mb-3">
                 <Layers size={20} className="text-blue-500" />
               </div>
               <div className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-widest mb-1">Total Catalog</div>
               <div className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">{products.length}</div>
             </motion.div>

             <motion.div 
               whileHover={{ y: -5 }}
               className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/5 relative overflow-hidden group"
             >
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors"></div>
               <div className="w-10 h-10 rounded-[14px] bg-rose-500/10 flex items-center justify-center mb-3">
                 <Search size={20} className="text-rose-500" />
               </div>
               <div className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-widest mb-1">Categories</div>
               <div className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">{categories.length}</div>
             </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div 
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/10 mb-10 relative overflow-hidden"
              >
                {/* Internal Glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex justify-between items-center mb-8 relative z-10 border-b border-black/5 dark:border-white/5 pb-6">
                   <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                         <Plus size={20} />
                      </div>
                      {editingId ? 'Edit Asset Configuration' : 'Create New Asset'}
                   </h2>
                   <motion.button 
                     whileHover={{ scale: 1.1, rotate: 90 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={resetForm} 
                     className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-primary"
                   >
                     <X size={20} />
                   </motion.button>
                </div>
                
                <form onSubmit={handleSave} className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-10 relative z-10">
                  {/* Photo Studio Area */}
                  <div className="flex flex-col gap-3">
                     <label className="text-xs font-black text-secondary uppercase tracking-widest pl-2">Asset Studio</label>
                     <motion.div 
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       className="w-full aspect-[4/3] md:aspect-square rounded-[2rem] border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-zinc-800/50 dark:to-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:shadow-xl transition-all overflow-hidden relative group"
                       onClick={() => fileInputRef.current?.click()}
                     >
                       {newImage ? (
                         <>
                            <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm">
                               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                                  <UploadCloud className="text-white" size={24} />
                               </div>
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace</span>
                            </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center text-amber-600 dark:text-amber-500">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-[1rem] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <ImageIcon size={28} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Upload Photo</span>
                         </div>
                       )}
                       <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                     </motion.div>
                  </div>

                  <div className="flex flex-col justify-center gap-6">
                     <div className="grid gap-6 sm:grid-cols-2">
                       <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-black text-secondary uppercase tracking-widest pl-2">Product Name <span className="text-amber-500">*</span></label>
                          <input 
                            type="text" 
                            className="w-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-[1.5rem] py-4 px-6 font-bold text-lg text-primary placeholder-secondary/40 border-2 border-transparent focus:border-amber-500/50 hover:bg-white dark:hover:bg-zinc-800 outline-none transition-all shadow-sm" 
                            placeholder="e.g. Premium Butter Loaf" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required 
                          />
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-black text-secondary uppercase tracking-widest pl-2">Retail Price (₦) <span className="text-amber-500">*</span></label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary font-black">₦</span>
                            <input 
                              type="number" 
                              className="w-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-[1.5rem] py-4 pl-12 pr-6 font-black text-lg text-amber-600 dark:text-amber-400 placeholder-secondary/40 border-2 border-transparent focus:border-amber-500/50 hover:bg-white dark:hover:bg-zinc-800 outline-none transition-all shadow-sm" 
                              placeholder="1000" 
                              value={price}
                              onChange={e => setPrice(e.target.value)}
                              required 
                            />
                          </div>
                       </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black text-secondary uppercase tracking-widest pl-2">Category Group</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-[1.5rem] py-4 px-6 font-bold text-lg text-primary placeholder-secondary/40 border-2 border-transparent focus:border-amber-500/50 hover:bg-white dark:hover:bg-zinc-800 outline-none transition-all shadow-sm" 
                          placeholder="e.g. Pastries & Snacks" 
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                        />
                     </div>

                     <div className="mt-4 flex gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                       <motion.button 
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         type="button" 
                         onClick={resetForm}
                         className="flex-1 py-4 bg-black/5 dark:bg-white/5 text-primary rounded-[1.5rem] font-bold text-base flex items-center justify-center hover:bg-black/10 transition-colors"
                       >
                         Cancel
                       </motion.button>
                       <motion.button 
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         type="submit" 
                         className="flex-[2] py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-[1.5rem] shadow-[0_15px_30px_-10px_rgba(245,158,11,0.5)] font-black text-base tracking-wide flex items-center justify-center gap-2"
                       >
                         <CheckCircle2 size={20} />
                         {editingId ? 'Update Asset' : 'Deploy Product'}
                       </motion.button>
                     </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="mb-10 flex flex-col md:flex-row gap-4 justify-between"
              >
                 <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search inventory..." 
                      className="w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[1.5rem] py-4 pl-14 pr-6 font-bold text-lg text-primary placeholder-secondary/50 shadow-[0_8px_20px_rgba(0,0,0,0.03)] border border-white/50 dark:border-white/5 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-[1.5rem] font-black text-base tracking-wide shadow-xl flex items-center justify-center gap-2"
                   onClick={() => setIsAdding(true)}
                 >
                   <Plus size={20} /> Add Product
                 </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ultra-Premium E-Commerce Grid */}
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
                 className={`group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-2 flex flex-col border border-white/60 dark:border-white/5 ${!p.active ? 'opacity-50 grayscale' : 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500'}`}
              >
                 {/* Breathtaking Image Area */}
                 <div className="relative w-full aspect-square bg-black/5 dark:bg-black/20 rounded-[1.5rem] flex items-center justify-center overflow-hidden mb-3">
                   {p.image ? (
                     <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                   ) : (
                     <div className="font-black text-secondary/20 text-7xl select-none">{p.name.charAt(0)}</div>
                   )}
                   
                   {/* Float Overlay */}
                   <div className="absolute top-3 left-3 z-10">
                     <span className={`${p.active ? 'bg-black/80 dark:bg-white/90 text-white dark:text-black' : 'bg-gray-400 dark:bg-zinc-600 text-white'} text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg`}>
                       {p.active ? 'Active' : 'Archived'}
                     </span>
                   </div>

                   {/* Quick Action Overlay on Hover - Frost Effect */}
                   <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 backdrop-blur-[2px] z-10 hidden lg:flex">
                      <motion.button 
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         onClick={() => startEdit(p)} 
                         className="w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-800/95 text-primary shadow-xl flex items-center justify-center hover:text-amber-500 transition-colors"
                         title="Edit Asset"
                      >
                         <Edit2 size={16} />
                      </motion.button>
                      <motion.button 
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         onClick={() => toggleActive(p)} 
                         className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-colors bg-white/95 dark:bg-zinc-800/95 ${p.active ? 'text-danger hover:text-white hover:bg-danger' : 'text-success hover:text-white hover:bg-success'}`}
                         title={p.active ? "Archive Asset" : "Restore Asset"}
                      >
                         {p.active ? <Archive size={16} /> : <CheckCircle2 size={16} />}
                      </motion.button>
                   </div>
                 </div>

                 {/* Mobile Quick Actions (Visible only on small devices below image) */}
                 <div className="lg:hidden flex items-center justify-between px-2 mb-2">
                    <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-primary flex items-center justify-center"><Edit2 size={12} /></button>
                    <button onClick={() => toggleActive(p)} className={`w-8 h-8 rounded-full flex items-center justify-center ${p.active ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      {p.active ? <Archive size={12} /> : <CheckCircle2 size={12} />}
                    </button>
                 </div>

                 {/* Premium Content Typography */}
                 <div className="px-2 pb-3 flex flex-col flex-grow">
                   <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1 truncate">{p.category || 'Bakery'}</div>
                   <h4 className="font-bold text-[14px] sm:text-[15px] text-primary mb-2 line-clamp-2 leading-snug">{p.name}</h4>
                   <div className="mt-auto">
                     <div className="font-black text-xl sm:text-2xl text-primary tracking-tighter">
                       <span className="text-[12px] sm:text-[14px] font-bold text-secondary mr-0.5 opacity-60">₦</span>
                       {p.price.toLocaleString()}
                     </div>
                   </div>
                 </div>
              </motion.div>
            ))}
            
            {filteredProducts.length === 0 && (
               <motion.div variants={itemVariants} className="col-span-full py-24 text-center">
                  <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center mb-6 shadow-inner">
                    <PackageSearch size={40} className="text-secondary opacity-40" />
                  </div>
                  <h4 className="font-black text-2xl text-primary mb-2">No Assets Found</h4>
                  <p className="text-base font-bold text-secondary opacity-70 max-w-sm mx-auto">Your orchestrator array is empty. Setup an asset profile to populate the catalog.</p>
               </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
