import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useAuth } from '../store/AuthContext';
import { LogOut } from 'lucide-react';

export const CustomerStorefront: React.FC = () => {
  const { signOut } = useAuth();
  
  return (
    <AnimatedPage>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Place an Order</h1>
            <p className="text-secondary mt-1">Select fresh bread for delivery.</p>
          </div>
          <button 
            className="w-10 h-10 rounded-full bg-[var(--surface-color)] shadow-sm flex items-center justify-center text-secondary border border-[var(--border-color)] hover:bg-danger hover:text-white transition-all flex-shrink-0"
            onClick={signOut}
            title="Log Out"
          >
             <LogOut size={16} />
          </button>
        </div>
        <div className="card">
          <h2 className="font-bold text-lg mb-2">Available Stock (Coming Soon)</h2>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default CustomerStorefront;
