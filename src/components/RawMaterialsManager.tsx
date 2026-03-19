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

          <div className="grid gap-3">
            {materials.length === 0 ? (
              <p className="text-sm opacity-50 text-center py-6 border border-dashed rounded-xl">No materials tracked yet.</p>
            ) : (
              materials.map(mat => (
                <div key={mat.id} className="flex justify-between items-center p-4 border rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-transparent transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Package size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-0.5 tracking-tight">{mat.name}</div>
                      <div className="text-sm font-medium text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md inline-block">
                        {mat.quantity_remaining} {mat.unit} left
                      </div>
                    </div>
                  </div>
                  <button className="p-3 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors" onClick={() => startEdit(mat)}>
                    <Edit2 size={18} />
                  </button>
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
