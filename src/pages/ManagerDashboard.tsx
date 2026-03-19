import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { LogOut, TrendingUp, Archive, ShoppingCart, Users, Package, Banknote, LayoutDashboard, Settings, FileBarChart, Shield, ArrowRightLeft, Scale } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { transactions, logout } = useAppContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // Calculate today's basic analytics from legacy local storage mapping
  const todaySales = transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString());
  const totalRevenue = todaySales.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const salesCount = todaySales.length;

  const quickLinks = [
    { name: 'Raw Materials', icon: <Package size={24} />, path: '/manager/raw-materials', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Staff Roles', icon: <Shield size={24} />, path: '/manager/staff', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { name: 'Assign Stock', icon: <ArrowRightLeft size={24} />, path: '/manager/stock-assignment', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Reconcile', icon: <Scale size={24} />, path: '/manager/reconciliation', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Daily Sales', icon: <ShoppingCart size={24} />, path: '/sales', color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Customers', icon: <Users size={24} />, path: '/customers', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Legacy Stock', icon: <Archive size={24} />, path: '/inventory', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Expenses', icon: <Banknote size={24} />, path: '/expenses', color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Full Reports', icon: <FileBarChart size={24} />, path: '/reports', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Settings', icon: <Settings size={24} />, path: '/settings', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <AnimatedPage>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <LayoutDashboard className="text-primary" size={28} /> Control Panel
            </h1>
            <p className="text-secondary text-sm font-medium mt-1">Welcome back, Manager.</p>
          </div>
          <button 
            className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all shadow-sm"
            onClick={async () => { logout(); await signOut(); }}
            title="Secure Logout"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Vibrant Finance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary to-indigo-700 text-white p-5 rounded-[var(--radius-xl)] shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="absolute -right-4 -top-4 opacity-10">
              <TrendingUp size={100} />
            </div>
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <TrendingUp size={16} strokeWidth={3} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Today's Revenue</h2>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">₦{totalRevenue.toLocaleString()}</div>
            <div className="text-xs mt-2 opacity-80 font-medium bg-black/20 inline-block px-2 py-1 rounded-full">{salesCount} Sales Today</div>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-5 rounded-[var(--radius-xl)] shadow-md border border-[var(--border-color)] relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-5 text-black dark:text-white">
              <Archive size={100} />
            </div>
            <div className="flex items-center gap-2 mb-2 text-secondary">
              <Archive size={16} strokeWidth={3} />
              <h2 className="font-bold text-sm uppercase tracking-wider">Total Vault</h2>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              ₦{transactions.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}
            </div>
            <div className="text-xs mt-2 text-success font-medium bg-success/10 inline-block px-2 py-1 rounded-full">Lifetime Gross</div>
          </div>
        </div>
        
        {/* Core System App Grid (iOS Style) */}
        <div className="mb-8">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2 tracking-tight">
            System Modules
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[var(--surface-color)] backdrop-blur-md rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${link.bg} ${link.color} mb-2 shadow-sm`}>
                  {link.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-center tracking-tight leading-tight opacity-80">{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerDashboard;
