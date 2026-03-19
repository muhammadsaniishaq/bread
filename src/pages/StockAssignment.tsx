import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StockAssignment: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary" /> Stock Assignment
          </h1>
        </div>
        
        <div className="card text-center p-8">
          <Package size={48} className="mx-auto text-secondary opacity-50 mb-4" />
          <h2 className="text-xl font-bold mb-2">Assign Bread to Store</h2>
          <p className="text-secondary text-sm">Designate fresh stock to your Store Keeper here.</p>
          <p className="text-xs text-primary mt-4 font-bold bg-primary/10 inline-block px-3 py-1 rounded-full">Coming Soon</p>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StockAssignment;
