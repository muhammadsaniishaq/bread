import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Changed BrowserRouter to Router
import { AppProvider } from './store/AppContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { LanguageProvider } from './store/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Receipt from './pages/Receipt';
import CustomerProfile from './pages/CustomerProfile';
import CustomerReceipt from './pages/CustomerReceipt';
import CustomerIDAndCert from './pages/CustomerIDAndCert';
import { InventoryReceipt } from './pages/InventoryReceipt';
import BakeryReceipt from './pages/BakeryReceipt';

import { SplashScreen } from './components/SplashScreen';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const isAuthenticated = !!user;
  const [showSplash, setShowSplash] = React.useState(true);
  
  const theme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-Lock Inactivity Timer (5 Minutes)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (isAuthenticated) {
        timeoutId = setTimeout(() => {
          signOut();
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    if (isAuthenticated) {
      events.forEach(event => document.addEventListener(event, resetTimer));
      resetTimer(); // Start immediately
    }

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, signOut]);

  if (loading) {
    return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'var(--background-color)', color:'var(--primary-color)'}}>Loading App Data...</div>;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // The isAuthenticated check is now handled by ProtectedRoute for most routes
  // Login page is explicitly rendered if not authenticated
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="customer-receipt/:id" element={<CustomerReceipt />} />
            <Route path="customer-docs/:id" element={<CustomerIDAndCert />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/receipt/:id" element={<InventoryReceipt />} />
            <Route path="bakery-receipt/:id" element={<BakeryReceipt />} />
            <Route path="settings" element={<Settings />} />
            <Route path="receipt/:id" element={<Receipt />} /> {/* Updated path for receipt */}
            <Route path="reports" element={<Reports />} />
            <Route path="expenses" element={<Expenses />} />
          </Route>
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
