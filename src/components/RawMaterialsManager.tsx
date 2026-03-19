import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Edit2, Save, X } from 'lucide-react';

interface RawMaterial {
  id: string;
  name: string;
  quantity_remaining: number;
  unit: string;
}

export const RawMaterialsManager: React.FC = () => {
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
    <div className="card mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Package className="text-secondary" />
          <h2 className="font-bold text-lg">Raw Materials Inventory</h2>
        </div>
        {!isAdding && (
          <button className="btn btn-outline py-1 px-3 text-sm flex items-center gap-1" onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add 
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface p-3 rounded-lg mb-4 border" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs opacity-70">Material Name</label>
              <input type="text" className="form-input py-1" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Flour" />
            </div>
            <div>
              <label className="text-xs opacity-70">Unit</label>
              <select className="form-input py-1" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="Bags">Bags</option>
                <option value="Kg">Kg</option>
                <option value="Litres">Litres</option>
                <option value="Cartons">Cartons</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs opacity-70">Quantity Remaining</label>
              <input type="number" step="0.1" className="form-input py-1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="btn border bg-transparent text-secondary py-1 px-3" onClick={resetForm}><X size={16} /></button>
            <button className="btn btn-primary py-1 px-3 flex items-center gap-1" onClick={handleSave}><Save size={16}/> Save</button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {materials.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">No materials tracked yet.</p>
        ) : (
          materials.map(mat => (
            <div key={mat.id} className="flex justify-between items-center p-3 border rounded-lg bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="font-bold">{mat.name}</div>
                <div className="text-sm text-secondary">{mat.quantity_remaining} {mat.unit} left</div>
              </div>
              <button className="btn btn-outline p-2 border-transparent" onClick={() => startEdit(mat)}>
                <Edit2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RawMaterialsManager;
