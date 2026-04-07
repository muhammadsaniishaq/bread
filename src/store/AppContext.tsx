import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getTransactionItems 
} from './types';
import type { 
  Product, Customer, Transaction, DebtPayment, InventoryLog,
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
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  updateTransactionStatus: (id: string, status: 'COMPLETED' | 'CANCELLED') => Promise<void>;
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
  const { user, role } = useAuth();
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

      // MASTER SYNC: Pull official data from Supabase for Suppliers to restore ledger and stock
      // This transition moves all phone-based data to a Cloud-First model for Muhammad Sani's account.
      const userId = user?.id;
      if (userId && (role === 'SUPPLIER' || user?.email === 'muhammadsaniisyaku3@gmail.com')) {
        try {
          // 1. Sync Official Debt Balance
          const { data: remoteCust } = await supabase.from('customers').select('*').eq('profile_id', userId).maybeSingle();
          if (remoteCust) {
            const mappedCust: Customer = { 
               ...remoteCust, 
               debtBalance: remoteCust.debt_balance 
            };
            await dbCustomers.setItem(mappedCust.id, mappedCust);
            const idx = storedCustomers.findIndex(c => c.id === mappedCust.id);
            if (idx !== -1) storedCustomers[idx] = mappedCust;
            else storedCustomers.push(mappedCust);
          }

          // 2. Sync Inventory Logs (The 'Receive/Return' History)
          const { data: remoteLogs } = await supabase.from('inventory_logs')
            .select('*').eq('profile_id', userId).order('date', { ascending: false }).limit(500);
          if (remoteLogs) {
            for (const rLog of remoteLogs) {
              const finalLog: InventoryLog = {
                ...rLog,
                quantityReceived: rLog.quantity_received,
                costPrice: rLog.cost_price,
                storeKeeper: rLog.store_keeper
              };
              await dbInventoryLogs.setItem(finalLog.id, finalLog);
              if (!storedInventoryLogs.find(l => l.id === finalLog.id)) {
                 storedInventoryLogs.push(finalLog);
              }
            }
          }

          // 3. Sync & MIGRATION: Transactions (The 'Sales' History)
          // We fetch sales (sellerId) and historical warehouse movements (customerId)
          const { data: remoteTxs } = await supabase.from('transactions')
            .select('*').or(`seller_id.eq.${userId},customer_id.eq.${userId}`).order('date', { ascending: false }).limit(500);
          
          if (remoteTxs) {
            // A. Sync Cloud-to-Local
            for (const rTx of remoteTxs) {
              const finalTx: Transaction = {
                ...rTx,
                totalPrice: rTx.total_price,
                customerId: rTx.customer_id,
                sellerId: rTx.seller_id,
                storeKeeperId: rTx.store_keeper_id,
                items: rTx.items
              };
              await dbTransactions.setItem(finalTx.id, finalTx);
              const exists = storedTransactions.findIndex(t => t.id === finalTx.id);
              if (exists !== -1) storedTransactions[exists] = finalTx;
              else storedTransactions.push(finalTx);
            }

            // B. MIGRATION: Sync Local-to-Cloud (Muhammad Sani Edition)
            const missingFromCloud = storedTransactions.filter(lt => !remoteTxs.find(rt => rt.id === lt.id));
            if (missingFromCloud.length > 0) {
              for (const lTx of missingFromCloud) {
                await supabase.from('transactions').insert({
                  id: lTx.id,
                  date: lTx.date,
                  type: lTx.type,
                  status: lTx.status,
                  origin: lTx.origin,
                  total_price: lTx.totalPrice,
                  customer_id: lTx.customerId,
                  seller_id: lTx.sellerId,
                  store_keeper_id: lTx.storeKeeperId,
                  items: lTx.items
                });
              }
            }
          }

          // 4. Sync & MIGRATION: Expenses
          const { data: remoteExpenses } = await supabase.from('expenses')
             .select('*').eq('profile_id', userId).limit(500);
          
          if (remoteExpenses) {
            // A. Sync Cloud-to-Local
            for (const rExp of remoteExpenses) {
              const finalExp: Expense = { ...rExp, profileId: rExp.profile_id };
              await dbExpenses.setItem(finalExp.id, finalExp);
              if (!storedExpenses.find(e => e.id === finalExp.id)) {
                 storedExpenses.push(finalExp);
              }
            }

            // B. MIGRATION: Sync Local-to-Cloud
            const missingExp = storedExpenses.filter(le => !remoteExpenses.find(re => re.id === le.id));
            for (const lExp of missingExp) {
              await supabase.from('expenses').insert({
                id: lExp.id,
                date: lExp.date,
                description: lExp.description,
                amount: lExp.amount,
                type: lExp.type,
                profile_id: userId
              });
            }
          }

          // 5. MIGRATION: Inventory Logs (Muhammad Sani Edition)
          if (remoteLogs) {
             const missingLogs = storedInventoryLogs.filter(ll => !remoteLogs.find(rl => rl.id === ll.id));
             for (const lLog of missingLogs) {
                await supabase.from('inventory_logs').insert({
                  id: lLog.id,
                  batch_id: lLog.batchId,
                  date: lLog.date,
                  type: lLog.type,
                  product_id: lLog.productId,
                  quantity_received: lLog.quantityReceived,
                  cost_price: lLog.costPrice,
                  store_keeper: lLog.storeKeeper,
                  profile_id: userId
                });
             }
          }
        } catch (syncErr) {
          console.error("MasterSync: Failed to sync", syncErr);
        }
      }

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

  /**
   * MANAGE SALES & SUPPLIER REQUESTS
   * --------------------------------------------------
   * This handles both immediate sales (Cash/Debt) and 
   * Supplier-initiated requests which start as 'PENDING_STORE'.
   */
  const recordSale = async (tx: Transaction) => {
    // 1. Primary persistence: Save to DB immediately (Local & Cloud)
    await dbTransactions.setItem(tx.id, tx);
    setTransactions(prev => [tx, ...prev]);

    if (user?.id) {
      try {
        await supabase.from('transactions').insert({
          id: tx.id,
          date: tx.date,
          type: tx.type,
          status: tx.status || 'COMPLETED',
          origin: tx.origin || 'STORE',
          total_price: tx.totalPrice,
          customer_id: tx.customerId,
          seller_id: tx.sellerId,
          store_keeper_id: tx.storeKeeperId,
          items: tx.items // JSONB
        });
      } catch (err) {
        console.error("Cloud Sync Error: Sale failed", err);
      }
    }

    // 2. Logic Gate: If status is PENDING, we stop here.
    if (tx.status === 'PENDING_STORE') {
       await refreshData();
       return;
    }

    // 3. Update financial metrics (for immediate Cash sales)
    try {
      const metrics = { ...companyMetrics };
      if (tx.type === 'Cash') {
        metrics.totalValueReceived += tx.totalPrice;
      }
      await dbCompanyMetrics.setItem('main', metrics);
      setCompanyMetrics(metrics);
    } catch (e) { console.error('AppContext: Metrics update failed', e); }

    // 4. Update Ledger Balances (Debt)
    try {
      if (tx.customerId || tx.sellerId) {
        const targetId = tx.origin === 'POS_SUPPLIER' ? tx.sellerId : tx.customerId;
        const customer = (customers || []).find(c => c.id === targetId);
        
        if (customer) {
          const updatedCustomer = { ...customer };
          if (tx.type === 'Debt' || tx.type === 'Cash') {
            const debtDelta = tx.origin === 'POS_SUPPLIER' ? tx.totalPrice * 0.9 : (tx.type === 'Debt' ? tx.totalPrice : 0);
            updatedCustomer.debtBalance = (updatedCustomer.debtBalance || 0) + debtDelta;
          }
          await dbCustomers.setItem(updatedCustomer.id, updatedCustomer);
          
          if (user?.id) {
             await supabase.from('customers').update({ debt_balance: updatedCustomer.debtBalance }).eq('id', updatedCustomer.id);
          }
          setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
        }
      }
    } catch (e) { console.error('AppContext: Customer update failed', e); }
    
    await refreshData();
  };

  /**
   * CONFIRM/APPROVE SUPPLIER REQUESTS
   * --------------------------------------------------
   * This transitions a PENDING request to COMPLETED and
   * finally applies the stock and financial changes.
   */
  const updateTransactionStatus = async (id: string, status: 'COMPLETED' | 'CANCELLED') => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.status === status) return;

    // 1. Mark status in DB (Local & Cloud)
    const updatedTx = { ...tx, status };
    await dbTransactions.setItem(id, updatedTx);
    
    if (user?.id) {
       await supabase.from('transactions').update({ status }).eq('id', id);
    }

    // 2. If transitioning to COMPLETED, apply physical & financial effects
    if (status === 'COMPLETED') {
      
      // A. Adjust Inventory levels and Create Logs
      const items = getTransactionItems(tx);
      const updatedProducts = [...products];
      for (const item of items) {
        // 1. Physical Stock Update (Global)
        const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIdx !== -1) {
          const delta = tx.type === 'Return' ? item.quantity : -item.quantity;
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: Math.max(0, Number(updatedProducts[pIdx].stock || 0) + delta)
          };
          await dbProducts.setItem(updatedProducts[pIdx].id, updatedProducts[pIdx]);
        }

        // 2. Create Inventory Log for Supplier Tracking
        if (tx.origin === 'SUPPLIER') {
           const log: InventoryLog = {
             id: Date.now().toString() + Math.random().toString(36).substring(7),
             date: new Date().toISOString(),
             type: tx.type === 'Return' ? 'Return' : 'Receive',
             productId: item.productId,
             quantityReceived: item.quantity,
             costPrice: item.unitPrice || 0,
             storeKeeper: tx.storeKeeperId,
             profile_id: tx.customerId // Crucial for filtering 'Personal Stock'
           };
           await dbInventoryLogs.setItem(log.id, log);
        }
      }

      // B. Adjust Ledger balance
      if (tx.customerId) {
        const customer = customers.find(c => c.id === tx.customerId);
        if (customer) {
          let delta = 0;
          const isWarehouseMovement = tx.origin === 'SUPPLIER';
          
          if (tx.type === 'Payment') {
            delta = -tx.totalPrice;
          } else if (isWarehouseMovement) {
            // IMPORTANT: Receiving/Returning inventory no longer creates financial debt.
            // Debt is only created when the item is SOLD to a customer (handled in recordSale).
            delta = 0; 
          } else {
            // Normal Customer Debt
            delta = tx.type === 'Return' ? -tx.totalPrice : tx.totalPrice;
          }
          
          if (delta !== 0) {
            const updatedCustomer = { ...customer, debtBalance: (customer.debtBalance || 0) + delta };
            await dbCustomers.setItem(customer.id, updatedCustomer);
            setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
          }
        }
      }
          
      // C. Update Metrics for Payments
      if (tx.type === 'Payment') {
        try {
          const metrics = { ...companyMetrics };
          metrics.totalValueReceived += tx.totalPrice;
          await dbCompanyMetrics.setItem('main', metrics);
          setCompanyMetrics(metrics);
        } catch (e) {
          console.error('AppContext: Metrics update failed during payment approval', e);
        }
      }
    }

    await refreshData();
  };

  const recordDebtPayment = async (payment: DebtPayment) => {
    // 1. Save payment record (Local & Cloud)
    await dbDebtPayments.setItem(payment.id, payment);
    if (user?.id) {
       await supabase.from('debt_payments').insert({
         id: payment.id,
         date: payment.date,
         amount: payment.amount,
         customer_id: payment.customerId,
         method: payment.method,
         note: payment.note
       });
    }
    setDebtPayments(prev => [payment, ...prev]);
    
    // 2. Reduce supplier debt balance
    const customer = (customers || []).find(c => c.id === payment.customerId);
    if (customer) {
      const updatedCustomer = { ...customer, debtBalance: (customer.debtBalance || 0) - payment.amount };
      await dbCustomers.setItem(customer.id, updatedCustomer);
      if (user?.id) {
         await supabase.from('customers').update({ debt_balance: updatedCustomer.debtBalance }).eq('id', updatedCustomer.id);
      }
    }
    
    // 3. Update financial metrics
    try {
      const metrics = { ...companyMetrics };
      metrics.totalValueReceived += payment.amount;
      await dbCompanyMetrics.setItem('main', metrics);
      setCompanyMetrics(metrics);
    } catch (e) { console.error('AppContext: Metrics update during payment failed', e); }

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
    const batchId = Date.now().toString(); 
    
    for (const log of logs) {
      const finalLog = { ...log, type: action, batchId }; 
      await dbInventoryLogs.setItem(finalLog.id, finalLog);
      
      if (user?.id) {
         await supabase.from('inventory_logs').insert({
           id: finalLog.id,
           batch_id: finalLog.batchId,
           date: finalLog.date,
           type: finalLog.type,
           product_id: finalLog.productId,
           quantity_received: finalLog.quantityReceived,
           cost_price: finalLog.costPrice,
           store_keeper: finalLog.storeKeeper,
           profile_id: finalLog.profile_id || user.id
         });
      }

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
    
    const newTotalReceived = action === 'Receive' 
      ? companyMetrics.totalValueReceived + totalValueDelta 
      : Math.max(0, companyMetrics.totalValueReceived - totalValueDelta);
    
    const newMetrics = { ...companyMetrics, totalValueReceived: newTotalReceived };
    await dbCompanyMetrics.setItem('main', newMetrics);
    
    await refreshData();
  };
  
  const recordBakeryPayment = async (payment: BakeryPayment) => {
    await dbBakeryPayments.setItem(payment.id, payment);
    
    if (user?.id) {
       await supabase.from('bakery_payments').insert({
         id: payment.id,
         date: payment.date,
         amount: payment.amount,
         method: payment.method,
         receiver: payment.receiver
       });
    }

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
    if (user?.id) {
       await supabase.from('expenses').insert({
         id: expense.id,
         date: expense.date,
         description: expense.description,
         amount: expense.amount,
         type: expense.type,
         profile_id: user.id
       });
    }
    setExpenses([...expenses, expense]);
    await refreshData();
  };

  const updateSettings = async (settings: AppSettings) => {
    await dbSettings.setItem('app', settings);
    setAppSettings(settings);
  };

  return (
    <AppContext.Provider value={{
      products, customers, transactions, debtPayments, inventoryLogs, bakeryPayments, companyMetrics, expenses, loading, refreshData,
      isAuthenticated, login, logout, updatePin,
      addProduct, updateProduct, deleteProduct, addCustomer, updateCustomer, deleteCustomer, recordSale, updateTransactionStatus, recordDebtPayment, addInventory, returnInventory, processInventoryBatch, recordBakeryPayment, addExpense,
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
