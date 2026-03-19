import React from 'react';
import { useTranslation } from '../store/LanguageContext';
import { AnimatedPage } from '../components/AnimatedPage';
import { Link } from 'react-router-dom';
import UserManagement from '../components/UserManagement';

export const ManagerDashboard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AnimatedPage>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{t('nav.home') || 'Manager Dashboard'}</h1>
        <p className="text-secondary mb-6">Welcome to the central control panel. Here you will oversee all operations.</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h2 className="font-bold text-lg mb-2">System Tools</h2>
            <Link to="/settings" className="btn btn-outline w-full mb-2">App Settings & Products</Link>
            <Link to="/reports" className="btn btn-outline w-full text-accent border-accent">Company Reports</Link>
          </div>
          
          <div className="card">
            <h2 className="font-bold text-lg mb-2">System Analytics & Raw Materials (Coming Soon)</h2>
            <p className="text-sm opacity-70">Track flour, sugar, and bake output.</p>
          </div>
        </div>

        <UserManagement />

      </div>
    </AnimatedPage>
  );
};

export default ManagerDashboard;
