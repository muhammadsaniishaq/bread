import React from 'react';
import { AnimatedPage } from '../components/AnimatedPage';

export const CustomerStorefront: React.FC = () => {
  return (
    <AnimatedPage>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-primary">Place an Order</h1>
        <p className="text-secondary mb-6">Select fresh bread and have it delivered by your assigned supplier.</p>
        <div className="card">
          <h2 className="font-bold text-lg mb-2">Available Stock (Coming Soon)</h2>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default CustomerStorefront;
