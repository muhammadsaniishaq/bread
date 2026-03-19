import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';

export const StoreDashboard: React.FC = () => {
  return (
    <AnimatedPage>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Store Keeper Dashboard</h1>
        <p className="text-secondary mb-6">Manage incoming orders, assign suppliers, and track stock.</p>
        <div className="card">
          <h2 className="font-bold text-lg mb-2">Incoming Orders (Coming Soon)</h2>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default StoreDashboard;
