import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Changed BrowserRouter to Router
import { AppProvider } from './store/AppContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { LanguageProvider } from './store/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { RoleGuard } from './components/RoleGuard';
import RoleRouter from './components/RoleRouter';

import ManagerDashboard from './pages/ManagerDashboard';
import StoreDashboard from './pages/StoreDashboard';
import StoreInventory from './pages/StoreInventory';
import StoreRecords from './pages/StoreRecords';
import StoreDispatch from './pages/StoreDispatch';
import StoreOrders from './pages/StoreOrders';
import StoreProfile from './pages/StoreProfile';
import StoreAccounting from './pages/StoreAccounting';
import StoreMore from './pages/StoreMore';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerStore from './pages/CustomerStore';
import LandingPage from './pages/LandingPage';
import CustomerProfileHub from './pages/CustomerProfileHub';
import CustomerOrders from './pages/CustomerOrders';
import CustomerHistory from './pages/CustomerHistory';
import CustomerOfficialDocs from './pages/CustomerOfficialDocs';

import RawMaterialsManager from './components/RawMaterialsManager';
import UserManagement from './components/UserManagement';
import { StockAssignment } from './pages/StockAssignment';
import { FinancialReconciliation } from './pages/FinancialReconciliation';
import ManagerExpenses from './pages/ManagerExpenses';
import ManagerReports from './pages/ManagerReports';
import ManagerSettings from './pages/ManagerSettings';
import ManagerCustomers from './pages/ManagerCustomers';
import ManagerProducts from './pages/ManagerProducts';
import ManagerRemissions from './pages/ManagerRemissions';
import ManagerPOS from './pages/ManagerPOS';
import ManagerTransactions from './pages/ManagerTransactions';
import ManagerAudit from './pages/ManagerAudit';
import ManagerStockLevels from './pages/ManagerStockLevels';
import ManagerCustomerIDs from './pages/ManagerCustomerIDs';
import ManagerCompanyInfo from './pages/ManagerCompanyInfo';
import ManagerStaffProfiles from './pages/ManagerStaffProfiles';
import ManagerAuditHistory from './pages/ManagerAuditHistory';

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
import StaffProfile from './pages/StaffProfile';

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

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* Landing Page for Unauthenticated / Root */}
          <Route path="/" element={
            isAuthenticated ? (
              <ProtectedRoute>
                <RoleRouter />
              </ProtectedRoute>
            ) : <LandingPage />
          } />

          <Route path="/login" element={<Login />} />
          
          {/* Role-Specific Dashboards wrapped in intelligent Layout */}
          
          <Route element={<Layout />}>
            <Route path="/manager" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerDashboard /></RoleGuard>} />
            <Route path="/manager/raw-materials" element={<RoleGuard allowedRoles={['MANAGER']}><RawMaterialsManager /></RoleGuard>} />
            <Route path="/manager/staff" element={<RoleGuard allowedRoles={['MANAGER']}><UserManagement /></RoleGuard>} />
            <Route path="/manager/stock-assignment" element={<RoleGuard allowedRoles={['MANAGER']}><StockAssignment /></RoleGuard>} />
            <Route path="/manager/reconciliation" element={<RoleGuard allowedRoles={['MANAGER']}><FinancialReconciliation /></RoleGuard>} />
            <Route path="/manager/expenses" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerExpenses /></RoleGuard>} />
            <Route path="/manager/reports" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerReports /></RoleGuard>} />
            <Route path="/manager/customers" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerCustomers /></RoleGuard>} />
            <Route path="/manager/settings" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerSettings /></RoleGuard>} />
            <Route path="/manager/products" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerProducts /></RoleGuard>} />
            <Route path="/manager/remissions" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerRemissions /></RoleGuard>} />
            <Route path="/manager/sales" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerPOS /></RoleGuard>} />
            <Route path="/manager/transactions" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerTransactions /></RoleGuard>} />
            <Route path="/manager/audit" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerAudit /></RoleGuard>} />
            <Route path="/manager/staff/:id" element={<RoleGuard allowedRoles={['MANAGER']}><StaffProfile /></RoleGuard>} />
            <Route path="/manager/stock-levels" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerStockLevels /></RoleGuard>} />
            <Route path="/manager/customer-ids" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerCustomerIDs /></RoleGuard>} />
            <Route path="/manager/company" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerCompanyInfo /></RoleGuard>} />
            <Route path="/manager/staff-profiles" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerStaffProfiles /></RoleGuard>} />
            <Route path="/manager/audit-history" element={<RoleGuard allowedRoles={['MANAGER']}><ManagerAuditHistory /></RoleGuard>} />
            
            <Route path="/supplier" element={<RoleGuard allowedRoles={['SUPPLIER']}><Dashboard /></RoleGuard>} />
          </Route>

            <Route path="/store" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreDashboard /></RoleGuard>} />
            <Route path="/store/dispatch" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreDispatch /></RoleGuard>} />
            <Route path="/store/orders" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreOrders /></RoleGuard>} />
            <Route path="/store/inventory" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreInventory /></RoleGuard>} />
            <Route path="/store/records" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreRecords /></RoleGuard>} />
            <Route path="/store/accounting" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreAccounting /></RoleGuard>} />
            <Route path="/store/profile" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreProfile /></RoleGuard>} />
            <Route path="/store/more" element={<RoleGuard allowedRoles={['STORE_KEEPER']}><StoreMore /></RoleGuard>} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/store" element={<CustomerStore />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
          <Route path="/customer/docs" element={<CustomerOfficialDocs />} />
          <Route path="/customer/profile" element={<CustomerProfileHub />} />
          <Route path="/customer" element={<CustomerDashboard />} />


          {/* Legacy App Routes - Protected and shared across Managers/Suppliers until fully migrated */}
          <Route element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['MANAGER', 'SUPPLIER', 'STORE_KEEPER', 'CUSTOMER']}>
                <Layout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route path="/legacy" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            <Route path="/customer-receipt/:id" element={<CustomerReceipt />} />
            <Route path="/customer-docs/:id" element={<CustomerIDAndCert />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/receipt/:id" element={<InventoryReceipt />} />
            <Route path="/bakery-receipt/:id" element={<BakeryReceipt />} />
            <Route path="/settings" element={<RoleGuard allowedRoles={['MANAGER']}><Settings /></RoleGuard>} />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="/reports" element={<RoleGuard allowedRoles={['MANAGER', 'SUPPLIER']}><Reports /></RoleGuard>} />
            <Route path="/expenses" element={<RoleGuard allowedRoles={['MANAGER', 'SUPPLIER']}><Expenses /></RoleGuard>} />
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
