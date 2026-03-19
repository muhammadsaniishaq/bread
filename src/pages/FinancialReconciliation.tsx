import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Scale, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FinancialReconciliation: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-amber-500" /> Reconciliation
          </h1>
        </div>
        
        <div className="card text-center p-8">
          <Scale size={48} className="mx-auto text-secondary opacity-50 mb-4" />
          <h2 className="text-xl font-bold mb-2">End of Day Accounting</h2>
          <p className="text-secondary text-sm">Reconcile cash collected by Store Keepers and Suppliers against baked stock.</p>
          <p className="text-xs text-amber-500 mt-4 font-bold bg-amber-500/10 inline-block px-3 py-1 rounded-full">Coming Soon</p>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default FinancialReconciliation;
