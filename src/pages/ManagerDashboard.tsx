import React from 'react';

import { AnimatedPage } from '../components/AnimatedPage';
import { Link } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import { RawMaterialsManager } from '../components/RawMaterialsManager';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { LogOut, TrendingUp, Archive } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { transactions, logout } = useAppContext();
  const { signOut } = useAuth();
  
  // Calculate today's basic analytics from legacy local storage mapping
  const todaySales = transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString());
  const totalRevenue = todaySales.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const salesCount = todaySales.length;
  return (
    <AnimatedPage>
      <div className="p-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <button className="btn btn-outline btn-icon border-danger text-danger" onClick={async () => { logout(); await signOut(); }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
        
        <p className="text-secondary mb-6">Welcome to the central control panel. Here you will oversee all operations.</p>
        
        {/* Global Analytics Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card border-primary" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <TrendingUp size={16} />
              <h2 className="font-bold text-sm opacity-80">Today's Revenue</h2>
            </div>
            <div className="text-xl md:text-2xl font-black text-primary">₦{totalRevenue.toLocaleString()}</div>
            <div className="text-xs mt-1 opacity-60 font-medium">{salesCount} Total Orders Today</div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Archive size={16} className="text-secondary" />
              <h2 className="font-bold text-sm opacity-80">Total Vault</h2>
            </div>
            <div className="text-xl md:text-2xl font-black">₦{transactions.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}</div>
            <div className="text-xs mt-1 opacity-60 font-medium">Lifetime Gross Revenue</div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="card">
            <h2 className="font-bold text-lg mb-2">Legacy System Tools</h2>
            <p className="text-sm opacity-70 mb-4">Access your existing offline-mapped records.</p>
            <div className="flex gap-2">
              <Link to="/settings" className="btn btn-outline flex-1 text-center text-sm py-2">App Settings & Products</Link>
              <Link to="/reports" className="btn btn-outline flex-1 text-center text-accent border-accent text-sm py-2">Full Reports</Link>
            </div>
          </div>
        </div>

        <RawMaterialsManager />
        
        <UserManagement />

      </div>
    </AnimatedPage>
  );
};

export default ManagerDashboard;
