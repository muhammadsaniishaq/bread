import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { PackageSearch, ArrowLeft, Plus, Edit2, Archive, CheckCircle2 } from 'lucide-react';
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
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('Bread');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    if (editingId) {
      await updateProduct({
        id: editingId,
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
        active: products.find(p => p.id === editingId)?.active ?? true
      });
    } else {
      await addProduct({
        id: Date.now().toString(),
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        active: true,
        category
      });
    }
    
    resetForm();
  };

  const startEdit = (p: Product) => {
    setName(p.name);
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category || 'Bread');
    setEditingId(p.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('0');
    setCategory('Bread');
    setEditingId(null);
    setIsAdding(false);
  };

  const toggleActive = async (p: Product) => {
    await updateProduct({ ...p, active: !p.active });
  };

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageSearch className="text-amber-500" /> Catalog
          </h1>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] bg-gradient-to-br from-amber-500/10 to-transparent mt-4 mb-6">
          <div className="flex items-center justify-between mb-2 border-b border-[var(--border-color)] pb-3">
            <h2 className="font-bold text-lg text-amber-600 dark:text-amber-400">Bread & Pastries</h2>
            {!isAdding && (
              <button className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm" onClick={() => setIsAdding(true)}>
                <Plus size={14} strokeWidth={3}/> New Item
              </button>
            )}
          </div>

          {isAdding && (
            <form onSubmit={handleSave} className="bg-white/60 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 mt-4 animate-bounce-in-up shadow-sm">
              <h3 className="text-xs font-bold opacity-70 uppercase tracking-wide mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="grid gap-3">
                <input type="text" className="form-input bg-surface border-none shadow-sm py-2 font-bold text-sm" placeholder="Product Name (e.g. Jumbo Loaf)" value={name} onChange={e => setName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold opacity-50">₦</span>
                     <input type="number" className="form-input bg-surface border-none shadow-sm py-2 pl-8 font-bold text-sm" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required />
                   </div>
                   <input type="text" className="form-input bg-surface border-none shadow-sm py-2 font-bold text-sm" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="text-xs font-bold px-4 py-2 border border-danger/30 text-danger rounded-xl hover:bg-danger/10" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="text-xs font-bold px-4 py-2 bg-amber-500 text-white rounded-xl shadow-md flex items-center gap-1">Save Item</button>
                </div>
              </div>
            </form>
          )}

          <div className="grid gap-3 mt-4">
            {products.map(p => (
              <div key={p.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${!p.active ? 'opacity-50 grayscale bg-black/5' : 'bg-surface shadow-sm hover:-translate-y-1'}`} style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleActive(p)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${p.active ? 'bg-amber-500 text-white shadow-sm' : 'bg-black/10 text-secondary'}`}>
                     {p.active ? <CheckCircle2 size={20} /> : <Archive size={20} />}
                  </button>
                  <div>
                    <div className="font-bold tracking-tight text-[15px]">{p.name}</div>
                    <div className="text-[11px] font-bold text-amber-500 mt-0.5">₦{p.price.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => startEdit(p)} className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                  <Edit2 size={16} />
                </button>
              </div>
            ))}
            {products.length === 0 && <div className="text-center py-6 opacity-50 font-medium text-sm border border-dashed rounded-xl">No products configured.</div>}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerProducts;
