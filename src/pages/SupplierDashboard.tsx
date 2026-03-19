import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Link } from 'react-router-dom';

export const SupplierDashboard: React.FC = () => {
  return (
    <AnimatedPage>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Supplier Dashboard</h1>
        <p className="text-secondary mb-6">Deliver fresh bread to your assigned customers and register new walk-ins.</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h2 className="font-bold text-lg mb-2">My Deliveries (Coming Soon)</h2>
            <p className="text-sm opacity-70">Orders assigned to you.</p>
          </div>
          <div className="card">
            <h2 className="font-bold text-lg mb-2">My Customers</h2>
            <p className="text-sm opacity-70 mb-2">View and manage your assigned customers.</p>
            <Link to="/customers" className="btn btn-primary w-full text-center">Manage Customers</Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default SupplierDashboard;
