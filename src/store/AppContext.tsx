export {};
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Product, Customer, Transaction, DebtPayment, InventoryLog,
  CompanyMetrics,
  Expense,
  AppSettings,
  BakeryPayment
} from './types';
import { 
  dbProducts, 
  dbCustomers, 
  dbTransactions, 
  dbDebtPayments, 
  dbInventoryLogs, 
  dbCompanyMetrics,
  dbBakeryPayments,
  dbExpenses,
  dbSettings,
  getItems, 
  initializeDB 
} from './database';

interface AppContextType {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  debtPayments: DebtPayment[];
  inventoryLogs: InventoryLog[];
  bakeryPayments: BakeryPayment[];
  companyMetrics: CompanyMetrics;
  expenses: Expense[];
  loading: boolean;
  refreshData: () => Promise<void>;
  
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  updatePin: (newPin: string) => Promise<void>;
  
  // Mutations
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  recordSale: (transaction: Transaction) => Promise<void>;
  recordDebtPayment: (payment: DebtPayment) => Promise<void>;
  addInventory: (log: InventoryLog) => Promise<void>;
  returnInventory: (log: InventoryLog) => Promise<void>;
  processInventoryBatch: (logs: InventoryLog[], action: 'Receive' | 'Return') => Promise<void>;
  recordBakeryPayment: (payment: BakeryPayment) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  appSettings: AppSettings;
  updateSettings: (settings: AppSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [bakeryPayments, setBakeryPayments] = useState<BakeryPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics>({ totalValueReceived: 0, totalMoneyPaid: 0 });
  const [appSettings, setAppSettings] = useState<AppSettings>({ 
    companyName: 'THE BEST SPECIAL BREAD', 
    adminPin: '0018', 
    cashierPin: '0000', 
    receiptFooter: 'Thank you for your patronage!',
    adminEmail: 'muhammadsaniisyaku3@gmail.com',
    adminPassword: '12,Abumafhal'
  });
  const [loading, setLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const storedProducts = await getItems<Product>(dbProducts as any);
      const storedCustomers = await getItems<Customer>(dbCustomers as any);
      const storedTransactions = await getItems<Transaction>(dbTransactions as any);
      const storedDebtPayments = await getItems<DebtPayment>(dbDebtPayments as any);
      const storedInventoryLogs = await getItems<InventoryLog>(dbInventoryLogs as any);
      const storedBakeryPayments = await getItems<BakeryPayment>(dbBakeryPayments as any);
      const storedExpenses = await getItems<Expense>(dbExpenses as any);
      
      const metrics = await dbCompanyMetrics.getItem<CompanyMetrics>('main');
      const settings = await dbSettings.getItem<AppSettings>('app');

      setProducts(storedProducts);
      setCustomers(storedCustomers);
      setTransactions(storedTransactions);
      setDebtPayments(storedDebtPayments);
      setInventoryLogs(storedInventoryLogs);
      setBakeryPayments(storedBakeryPayments);
      setExpenses(storedExpenses);
      if (metrics) setCompanyMetrics(metrics);
      if (settings) {
        setAppSettings(prev => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error('Failed to load local data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('isAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }

    initializeDB().then(refreshData);
  }, []);

  const login = (pin: string) => {
    const adminPin = appSettings.adminPin || '0018';

    if (pin === adminPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
  };
  
  const updatePin = async (newPin: string) => {
    const updated = { ...appSettings, adminPin: newPin };
    await updateSettings(updated);
  };

  const addProduct = async (product: Product) => {
    await dbProducts.setItem(product.id, product);
    await refreshData();
  };

  const updateProduct = async (product: Product) => {
    await dbProducts.setItem(product.id, product);
    await refreshData();
  };

  const deleteProduct = async (id: string) => {
    await dbProducts.removeItem(id);
    await refreshData();
  };

  const addCustomer = async (customer: Customer) => {
    await dbCustomers.setItem(customer.id, customer);
    await refreshData();
  };

  const updateCustomer = async (customer: Customer) => {
    await dbCustomers.setItem(customer.id, customer);
    await refreshData();
  };

  const deleteCustomer = async (id: string) => {
    await dbCustomers.removeItem(id);
    await refreshData();
  };

  const recordSale = async (tx: Transaction) => {
    // 1. ALWAYS save transaction first — this is the most critical step
    await dbTransactions.setItem(tx.id, tx);
    
    // 2. Immediately update the in-memory state so UI reflects the new sale instantly
    //    This ensures history shows even before refreshData completes
    setTransactions(prev => [tx, ...prev]);

    // 3. Update company metrics
    try {
      const metrics = { ...companyMetrics };
      if (tx.type === 'Cash') {
        metrics.totalValueReceived += tx.totalPrice;
      }
      await dbCompanyMetrics.setItem('main', metrics);
      setCompanyMetrics(metrics);
    } catch (e) { console.error('Metrics update failed', e); }
    
    // 4. Update stock for each item in the sale
    try {
      const items = tx.items?.length ? tx.items : (tx.productId ? [{ productId: tx.productId, quantity: tx.quantity || 0, unitPrice: 0 }] : []);
      
      const updatedProducts = [...products];
      for (const item of items) {
        if (item.productId && item.quantity) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock: Math.max(0, Number(updatedProducts[productIndex].stock || 0) - Number(item.quantity))
            };
            await dbProducts.setItem(updatedProducts[productIndex].id, updatedProducts[productIndex]);
          }
        }
      }
      setProducts(updatedProducts);
    } catch (e) { console.error('Stock update failed', e); }

    // 5. Update customer debt/points if applicable
    try {
      if (tx.customerId) {
        const customer = customers.find(c => c.id === tx.customerId);
        if (customer) {
          const updatedCustomer = { ...customer };
          if (tx.type === 'Debt') {
            updatedCustomer.debtBalance += tx.totalPrice;
          }
          if (tx.pointsUsed) {
            updatedCustomer.loyaltyPoints = Math.max(0, (updatedCustomer.loyaltyPoints || 0) - tx.pointsUsed);
          }
          if (tx.pointsEarned) {
            updatedCustomer.loyaltyPoints = (updatedCustomer.loyaltyPoints || 0) + tx.pointsEarned;
          }
          await dbCustomers.setItem(customer.id, updatedCustomer);
          setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
        }
      }
    } catch (e) { console.error('Customer update failed', e); }
    
    // 6. Refresh full data from DB to ensure consistency (non-blocking)
    refreshData().catch(e => console.error('refreshData failed', e));
  };


  const recordDebtPayment = async (payment: DebtPayment) => {
    await dbDebtPayments.setItem(payment.id, payment);
    
    // Reduce customer debt
    const customer = customers.find(c => c.id === payment.customerId);
    if (customer) {
      const updatedCustomer = { ...customer, debtBalance: customer.debtBalance - payment.amount };
      await dbCustomers.setItem(customer.id, updatedCustomer);
    }
    
    await refreshData();
  };

  const addInventory = async (log: InventoryLog) => {
    // Ensure legacy logs or implicitly added logs have type 'Receive'
    const finalLog = { ...log, type: log.type || 'Receive' as const };
    await dbInventoryLogs.setItem(finalLog.id, finalLog);
    
    // Add to stock
    const product = products.find(p => p.id === finalLog.productId);
    if (product) {
       const updatedProduct = { ...product, stock: Number(product.stock || 0) + Number(finalLog.quantityReceived) };
       await dbProducts.setItem(product.id, updatedProduct);
    }
    
    // Update company metrics (increase liability)
    const totalValue = finalLog.quantityReceived * finalLog.costPrice;
    const newMetrics = { 
      ...companyMetrics, 
      totalValueReceived: companyMetrics.totalValueReceived + totalValue 
    };
    await dbCompanyMetrics.setItem('main', newMetrics);
    
    await refreshData();
  };
  
  const returnInventory = async (log: InventoryLog) => {
    // Force type to return
    const finalLog = { ...log, type: 'Return' as const };
    await dbInventoryLogs.setItem(finalLog.id, finalLog);
    
    // Subtract from stock (preventing negative stock)
    const product = products.find(p => p.id === finalLog.productId);
    if (product) {
       const updatedProduct = { 
         ...product, 
         stock: Math.max(0, Number(product.stock || 0) - Number(finalLog.quantityReceived)) 
       };
       await dbProducts.setItem(product.id, updatedProduct);
    }
    
    // Update company metrics (decrease liability)
    const totalValue = finalLog.quantityReceived * finalLog.costPrice;
    const newMetrics = { 
      ...companyMetrics, 
      // Ensure we don't accidentally drive total value received negative if data is corrupted
      totalValueReceived: Math.max(0, companyMetrics.totalValueReceived - totalValue)
    };
    await dbCompanyMetrics.setItem('main', newMetrics);
    
    await refreshData();
  };
  
  const processInventoryBatch = async (logs: InventoryLog[], action: 'Receive' | 'Return') => {
    let totalValueDelta = 0;
    const updatedProducts = [...products];
    const batchId = Date.now().toString(); // Generate single batchId for the entire cart
    
    for (const log of logs) {
      const finalLog = { ...log, type: action, batchId }; // Attach batchId to each record
      await dbInventoryLogs.setItem(finalLog.id, finalLog);
      
      const productIndex = updatedProducts.findIndex(p => p.id === finalLog.productId);
      if (productIndex !== -1) {
        if (action === 'Receive') {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: Number(updatedProducts[productIndex].stock || 0) + Number(finalLog.quantityReceived)
          };
        } else {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: Math.max(0, Number(updatedProducts[productIndex].stock || 0) - Number(finalLog.quantityReceived))
          };
        }
        await dbProducts.setItem(updatedProducts[productIndex].id, updatedProducts[productIndex]);
      }
      
      totalValueDelta += (finalLog.quantityReceived * finalLog.costPrice);
    }
    
    // Update company metrics
    let newTotalReceived = companyMetrics.totalValueReceived;
    if (action === 'Receive') {
      newTotalReceived += totalValueDelta;
    } else {
      newTotalReceived = Math.max(0, newTotalReceived - totalValueDelta);
    }
    
    const newMetrics = { ...companyMetrics, totalValueReceived: newTotalReceived };
    await dbCompanyMetrics.setItem('main', newMetrics);
    
    await refreshData();
  };
  
  const recordBakeryPayment = async (payment: BakeryPayment) => {
    await dbBakeryPayments.setItem(payment.id, payment);
    
    // Increase total money paid to company
    const newMetrics = { 
      ...companyMetrics, 
      totalMoneyPaid: (companyMetrics.totalMoneyPaid || 0) + payment.amount 
    };
    await dbCompanyMetrics.setItem('main', newMetrics);
    
    await refreshData();
  };
  
  const addExpense = async (expense: Expense) => {
    await dbExpenses.setItem(expense.id, expense);
    setExpenses([...expenses, expense]);
  };

  const updateSettings = async (settings: AppSettings) => {
    await dbSettings.setItem('app', settings);
    setAppSettings(settings);
  };

  return (
    <AppContext.Provider value={{
      products, customers, transactions, debtPayments, inventoryLogs, bakeryPayments, companyMetrics, expenses, loading, refreshData,
      isAuthenticated, login, logout, updatePin,
      addProduct, updateProduct, deleteProduct, addCustomer, updateCustomer, deleteCustomer, recordSale, recordDebtPayment, addInventory, returnInventory, processInventoryBatch, recordBakeryPayment, addExpense,
      appSettings, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
