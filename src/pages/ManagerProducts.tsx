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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 pb-24 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] opacity-70 pointer-events-none -translate-y-1/2 translate-x-1/3 z-0"></div>
        <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] opacity-50 pointer-events-none translate-y-1/3 -translate-x-1/3 z-0"></div>

        <div className="container relative z-10 pt-6">
          
          {/* Header & Global Add Button */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-[1.25rem] shadow-sm flex items-center justify-center outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-primary hover:scale-105 active:scale-95">
                <ArrowLeft size={22} />
              </button>
              <div>
                 <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2 text-primary">
                   Catalog
                 </h1>
                 <p className="text-sm font-bold text-secondary mt-0.5 opacity-60">Manage your product offerings</p>
              </div>
            </div>
            
            <button 
              className="hidden sm:flex bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-full font-black tracking-wide shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={20} /> Add Product
            </button>
            <button 
              className="sm:hidden w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full font-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Majestic Search Bar */}
          <div className="mb-10 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-amber-500 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Search inventory by name or category..." 
                className="w-full bg-white dark:bg-zinc-900 rounded-full py-5 pl-16 pr-6 font-bold text-lg text-primary placeholder-secondary/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Products Grid Always Visible */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6"
          >
            {filteredProducts.map(p => (
              <motion.div 
                variants={itemVariants}
                key={p.id} 
                className={`group bg-white dark:bg-zinc-900 rounded-[32px] p-2 flex flex-col ${!p.active ? 'opacity-50 grayscale' : 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] transition-all duration-500'}`}
              >
                {/* Top Half: Huge Image */}
                <div className="relative w-full aspect-square bg-[#f4f4f5] dark:bg-zinc-800 rounded-[28px] flex items-center justify-center overflow-hidden mb-3">
                  {p.image ? (
                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                  ) : (
                    <div className="text-secondary/30 font-black text-6xl select-none">
                       {p.name.charAt(0)}
                    </div>
                  )}
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 flex gap-1 z-10">
                    <span className={`${p.active ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-zinc-700 text-secondary'} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md backdrop-blur-md`}>
                      {p.active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  {/* Floating Action Menu on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hidden lg:flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={() => startEdit(p)} 
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => toggleActive(p)} 
                      className={`w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl ${p.active ? 'text-red-500' : 'text-green-500'}`}
                      title={p.active ? "Archive" : "Restore"}
                    >
                      {p.active ? <Archive size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                  </div>
                </div>

                {/* Mobile actions (visible on small screens) */}
                <div className="lg:hidden flex items-center justify-between px-2 mb-2">
                   <button onClick={() => startEdit(p)} className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-primary"><Edit2 size={12} /></button>
                   <button onClick={() => toggleActive(p)} className={`w-8 h-8 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center ${p.active ? 'text-red-500' : 'text-green-500'}`}>
                     {p.active ? <Archive size={12} /> : <CheckCircle2 size={12} />}
                   </button>
                </div>

                {/* Bottom Half: Info */}
                <div className="px-2 pb-3 flex flex-col flex-grow">
                  <div className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1 truncate">{p.category || 'Bakery'}</div>
                  <h3 className="font-bold text-[15px] leading-snug text-primary line-clamp-2 min-h-[44px] mb-2">{p.name}</h3>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="text-2xl font-black text-primary tracking-tighter leading-none">
                      <span className="text-[14px] font-bold text-secondary align-top mr-0.5">₦</span>
                      {p.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredProducts.length === 0 && (
              <motion.div variants={itemVariants} className="col-span-full py-24 text-center">
                <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <PackageSearch size={40} className="text-secondary opacity-40" />
                </div>
                <h3 className="font-black text-2xl text-primary mb-2">Catalog is Empty</h3>
                <p className="text-base font-medium text-secondary max-w-sm mx-auto">You haven't added any products yet, or your search didn't match anything.</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Floating Frost Modal for Add/Edit */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ perspective: "1000px" }}>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={resetForm}
              />
              
              {/* Modal Container */}
              <motion.div 
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
                className="w-full sm:max-w-xl bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl relative z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
              >
                {/* Header */}
                <div className="px-6 sm:px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
                  <h2 className="text-2xl font-black text-primary">
                    {editingId ? 'Edit Asset' : 'New Asset'}
                  </h2>
                  <button 
                    onClick={resetForm} 
                    className="w-10 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors rounded-full flex items-center justify-center text-secondary"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="overflow-y-auto p-6 sm:p-8 no-scrollbar">
                  <form id="productForm" onSubmit={handleSave} className="space-y-8">
                    
                    {/* Hero Image Uploader */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[4px] border-white dark:border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.1)] bg-[#f4f4f5] dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all overflow-hidden relative group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {newImage ? (
                          <>
                            <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <UploadCloud className="text-white" size={32} />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-secondary/60">
                            <ImageIcon size={40} className="mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProductImageUpload} />
                    </div>

                    {/* Plush Inputs */}
                    <div className="space-y-5">
                      <div>
                        <input 
                          type="text" 
                          placeholder="Product Name" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          required
                          className="w-full bg-[#f4f4f5] dark:bg-zinc-800 rounded-[1.5rem] py-5 px-6 font-bold text-lg text-primary placeholder-secondary/50 focus:ring-4 focus:ring-amber-500/20 focus:bg-white outline-none transition-all shadow-inner"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-5">
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary font-black">₦</span>
                          <input 
                            type="number" 
                            placeholder="Price" 
                            value={price} 
                            onChange={e => setPrice(e.target.value)} 
                            required
                            className="w-full bg-[#f4f4f5] dark:bg-zinc-800 rounded-[1.5rem] py-5 pl-12 pr-6 font-bold text-lg text-primary placeholder-secondary/50 focus:ring-4 focus:ring-amber-500/20 focus:bg-white outline-none transition-all shadow-inner"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            placeholder="Category" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-[#f4f4f5] dark:bg-zinc-800 rounded-[1.5rem] py-5 px-6 font-bold text-lg text-primary placeholder-secondary/50 focus:ring-4 focus:ring-amber-500/20 focus:bg-white outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer Action */}
                <div className="p-6 sm:p-8 pt-2">
                  <button 
                    type="submit" 
                    form="productForm"
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-lg tracking-wide shadow-[0_10px_30px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={24} /> {editingId ? 'Save Configuration' : 'Publish Asset'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
