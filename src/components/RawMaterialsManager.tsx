import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Edit2, Save, ArrowLeft } from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';

interface RawMaterial {
  id: string;
  name: string;
  quantity_remaining: number;
  unit: string;
}

export const RawMaterialsManager: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data } = await supabase.from('raw_materials').select('*').order('name');
    if (data) setMaterials(data);
    setLoading(false);
  };

  const [actionType, setActionType] = useState<'edit' | 'add_stock' | 'deduct_usage' | null>(null);
  const [actionAmount, setActionAmount] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !quantity) return;
    
    if (editingId) {
      await supabase.from('raw_materials')
        .update({ name, quantity_remaining: parseFloat(quantity), unit })
        .eq('id', editingId);
    } else {
      await supabase.from('raw_materials')
        .insert([{ name, quantity_remaining: parseFloat(quantity), unit }]);
    }
    
    resetForm();
    fetchMaterials();
  };

  const handleStockAction = async (mat: RawMaterial) => {
    if (!actionAmount || parseFloat(actionAmount) <= 0) return;
    const amount = parseFloat(actionAmount);
    let newQty = mat.quantity_remaining;

    if (actionType === 'add_stock') newQty += amount;
    if (actionType === 'deduct_usage') newQty = Math.max(0, newQty - amount);

    await supabase.from('raw_materials').update({ quantity_remaining: newQty }).eq('id', mat.id);
    setActionType(null);
    setActionAmount('');
    fetchMaterials();
  };

  const startEdit = (mat: RawMaterial) => {
    setName(mat.name);
    setQuantity(mat.quantity_remaining.toString());
    setUnit(mat.unit);
    setEditingId(mat.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('Bags');
    setEditingId(null);
    setIsAdding(false);
  };

  if (loading) return <div className="animate-pulse p-4">Loading inventory...</div>;

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface border border-[var(--border-color)] rounded-full shadow-sm hover:bg-black/5 transition-colors">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary" /> Raw Materials
          </h1>
        </div>

        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] mt-4">
          <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-4">
            <h2 className="font-bold text-lg">Inventory Tracking</h2>
            {!isAdding && (
              <button className="btn bg-primary/10 text-primary hover:bg-primary hover:text-white py-1.5 px-3 text-sm flex items-center gap-1 rounded-full transition-colors font-bold" onClick={() => setIsAdding(true)}>
                <Plus size={16} strokeWidth={3} /> Add Material
              </button>
            )}
          </div>

          {isAdding && (
            <div className="bg-surface p-4 rounded-xl mb-6 border shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wide">Material Name</label>
                  <input type="text" className="form-input py-2 font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flour" />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wide">Unit Measure</label>
                  <select className="form-input py-2 font-bold text-sm" value={unit} onChange={e => setUnit(e.target.value)}>
                    <option value="Bags">Bags</option>
                    <option value="Kg">Kg</option>
                    <option value="Litres">Litres</option>
                    <option value="Cartons">Cartons</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wide">Qty Remaining</label>
                  <input type="number" step="0.1" className="form-input py-2 font-bold" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.0" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                <button className="btn border border-danger/30 text-danger hover:bg-danger/10 py-1.5 px-4" onClick={resetForm}>Cancel</button>
                <button className="btn bg-success text-white py-1.5 px-4 flex items-center gap-1 shadow-sm" onClick={handleSave}><Save size={16}/> Save</button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {materials.length === 0 ? (
              <p className="text-sm opacity-50 text-center py-6 border border-dashed rounded-xl">No materials tracked yet.</p>
            ) : (
              materials.map(mat => (
                <div key={mat.id} className="p-5 border rounded-3xl bg-surface hover:shadow-md transition-all relative overflow-hidden group" style={{ borderColor: 'var(--border-color)' }}>
                  {mat.quantity_remaining <= 5 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full border-l border-b border-red-500/20" />}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                        <Package size={24} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="font-black text-xl mb-0.5 tracking-tight">{mat.name}</div>
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${mat.quantity_remaining <= 5 ? 'bg-red-500/10 text-red-600' : 'bg-success/10 text-success'}`}>
                          {mat.quantity_remaining} {mat.unit} Available
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100" onClick={() => startEdit(mat)}>
                      <Edit2 size={16} />
                    </button>
                  </div>

                  {actionType && editingId === mat.id && actionType !== 'edit' ? (
                    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-3 animate-bounce-in-up">
                      <input 
                        type="number" 
                        placeholder={`Amount to ${actionType === 'add_stock' ? 'add' : 'deduct'}...`}
                        className="form-input py-2 font-bold w-full bg-white dark:bg-black"
                        value={actionAmount}
                        onChange={e => setActionAmount(e.target.value)}
                        autoFocus
                      />
                      <button className="btn bg-success text-white py-2 px-4 whitespace-nowrap" onClick={() => handleStockAction(mat)}>Confirm</button>
                      <button className="btn border border-[var(--border-color)] text-secondary py-2 px-3" onClick={() => { setActionType(null); setEditingId(null); setActionAmount(''); }}>Cancel</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mt-2 border-t border-[var(--border-color)] pt-4">
                      <button 
                         className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-sm tracking-wide hover:bg-indigo-500 hover:text-white transition-all w-full border border-indigo-500/20"
                         onClick={() => { setEditingId(mat.id); setActionType('add_stock'); }}
                      >
                         <Plus size={16} strokeWidth={3} /> Restock
                      </button>
                      <button 
                         className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-sm tracking-wide hover:bg-amber-500 hover:text-white transition-all w-full border border-amber-500/20"
                         onClick={() => { setEditingId(mat.id); setActionType('deduct_usage'); }}
                      >
                         Deduct Usage
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default RawMaterialsManager;
