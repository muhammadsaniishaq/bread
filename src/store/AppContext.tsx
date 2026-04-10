import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTransactionItems } from './types';
import type {
  Product, Customer, Transaction, DebtPayment, InventoryLog,
  CompanyMetrics, Expense, AppSettings, BakeryPayment
} from './types';
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

// ─── Supabase row → App type mappers ─────────────────────────────────────────
const mapProduct = (r: any): Product => ({
  id: r.id, name: r.name, price: r.price, active: r.active,
  stock: r.stock || 0, category: r.category, image: r.image,
});

const mapCustomer = (r: any): Customer => ({
  id: r.id, name: r.name, phone: r.phone || '', email: r.email || '',
  username: r.username || '', location: r.location || '', notes: r.notes || '',
  debtBalance: r.debt_balance || 0, loyaltyPoints: r.loyalty_points || 0,
  image: r.image, assignedSupplierId: r.assigned_supplier_id,
  pin: r.pin, password: r.password, profile_id: r.profile_id,
});

const mapTransaction = (r: any): Transaction => ({
  id: r.id, date: r.date, type: r.type, status: r.status, origin: r.origin,
  items: r.items || [], productId: r.product_id, quantity: r.quantity,
  totalPrice: r.total_price, discount: r.discount || 0,
  customerId: r.customer_id, sellerId: r.seller_id,
  storeKeeperId: r.store_keeper_id,
});

const mapDebtPay = (r: any): DebtPayment => ({
  id: r.id, date: r.date, customerId: r.customer_id,
  amount: r.amount, method: r.method, note: r.note,
});

const mapInvLog = (r: any): InventoryLog => ({
  id: r.id, batchId: r.batch_id, date: r.date, type: r.type,
  productId: r.product_id, quantityReceived: r.quantity_received,
  costPrice: r.cost_price, storeKeeper: r.store_keeper, profile_id: r.profile_id,
});

const mapBakeryPay = (r: any): BakeryPayment => ({
  id: r.id, date: r.date, amount: r.amount, method: r.method, receiver: r.receiver,
});

const mapExpense = (r: any): Expense => ({
  id: r.id, date: r.date, description: r.description, amount: r.amount, type: r.type,
});

// ─── App type → Supabase row helpers ─────────────────────────────────────────
const customerRow = (c: Customer) => ({
  id: c.id, name: c.name, phone: c.phone || '', email: (c as any).email || '',
  username: (c as any).username || '', location: c.location || '', notes: c.notes || '',
  profile_id: c.profile_id || null, debt_balance: c.debtBalance || 0,
  loyalty_points: c.loyaltyPoints || 0,
  assigned_supplier_id: c.assignedSupplierId || null,
  pin: c.pin || null, password: (c as any).password || null,
  image: c.image || null,
});

// ─── Settings (localStorage only — it is config, not data) ───────────────────
const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'THE BEST SPECIAL BREAD', adminPin: '0018', cashierPin: '0000',
  receiptFooter: 'Thank you for your patronage!',
  adminEmail: 'muhammadsaniisyaku3@gmail.com', adminPassword: '12,Abumafhal',
};

const loadSettings = (): AppSettings => {
  try {
    const s = localStorage.getItem('appSettings');
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [products,       setProducts]       = useState<Product[]>([]);
  const [customers,      setCustomers]      = useState<Customer[]>([]);
  const [transactions,   setTransactions]   = useState<Transaction[]>([]);
  const [debtPayments,   setDebtPayments]   = useState<DebtPayment[]>([]);
  const [inventoryLogs,  setInventoryLogs]  = useState<InventoryLog[]>([]);
  const [bakeryPayments, setBakeryPayments] = useState<BakeryPayment[]>([]);
  const [expenses,       setExpenses]       = useState<Expense[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics>({ totalValueReceived: 0, totalMoneyPaid: 0 });
  const [appSettings,    setAppSettings]    = useState<AppSettings>(loadSettings);
  const [loading,        setLoading]        = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('isAuthenticated') === 'true');

  // ─── Fetch all data from Supabase ──────────────────────────────────────────
  const refreshData = async () => {
    setLoading(true);
    try {
      const [
        { data: prod }, { data: cust }, { data: txns },
        { data: dPay }, { data: invL }, { data: bPay }, { data: exps },
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('debt_payments').select('*').order('date', { ascending: false }),
        supabase.from('inventory_logs').select('*').order('date', { ascending: false }),
        supabase.from('bakery_payments').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);

      const loadedTxns = (txns || []).map(mapTransaction);
      const loadedDPay = (dPay || []).map(mapDebtPay);
      const loadedBPay = (bPay || []).map(mapBakeryPay);

      setProducts      ((prod || []).map(mapProduct));
      setCustomers     ((cust || []).map(mapCustomer));
      setTransactions  (loadedTxns);
      setDebtPayments  (loadedDPay);
      setInventoryLogs ((invL || []).map(mapInvLog));
      setBakeryPayments(loadedBPay);
      setExpenses      ((exps || []).map(mapExpense));

      // Derive company metrics from live Supabase data
      const totalValueReceived =
        loadedTxns.filter(t => t.status === 'COMPLETED' && t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0) +
        loadedDPay.reduce((s, p) => s + p.amount, 0);
      const totalMoneyPaid = loadedBPay.reduce((s, p) => s + p.amount, 0);
      setCompanyMetrics({ totalValueReceived, totalMoneyPaid });
    } catch (err) {
      console.error('refreshData failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, [user]);

  // ─── Legacy PIN auth ────────────────────────────────────────────────────────
  const login = (pin: string): boolean => {
    if (pin === (appSettings.adminPin || '0018')) {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };
  const logout = () => { setIsAuthenticated(false); sessionStorage.removeItem('isAuthenticated'); };
  const updatePin = async (newPin: string) => updateSettings({ ...appSettings, adminPin: newPin });

  // ─── Settings ───────────────────────────────────────────────────────────────
  const updateSettings = async (settings: AppSettings) => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setAppSettings(settings);
  };

  // ─── Products ───────────────────────────────────────────────────────────────
  const addProduct = async (p: Product) => {
    await supabase.from('products').upsert({
      id: p.id, name: p.name, price: p.price, active: p.active,
      stock: p.stock, category: p.category || null, image: p.image || null,
    });
    await refreshData();
  };

  const updateProduct = async (p: Product) => {
    await supabase.from('products').update({
      name: p.name, price: p.price, active: p.active,
      stock: p.stock, category: p.category || null, image: p.image || null,
    }).eq('id', p.id);
    await refreshData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await refreshData();
  };

  // ─── Customers ──────────────────────────────────────────────────────────────
  const addCustomer = async (c: Customer) => {
    const { error } = await supabase.from('customers').upsert(customerRow(c));
    if (error) { console.error('addCustomer failed:', error); throw new Error(error.message); }
    await refreshData();
  };
  const updateCustomer = async (c: Customer) => {
    const { error } = await supabase.from('customers').update(customerRow(c)).eq('id', c.id);
    if (error) { console.error('updateCustomer failed:', error); throw new Error(error.message); }
    await refreshData();
  };
  const deleteCustomer = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    await refreshData();
  };

  // ─── Record Sale ─────────────────────────────────────────────────────────────
  const recordSale = async (tx: Transaction) => {
    const { error } = await supabase.from('transactions').insert({
      id: tx.id, date: tx.date, type: tx.type, status: tx.status || 'COMPLETED',
      origin: tx.origin || 'STORE', total_price: tx.totalPrice,
      customer_id: tx.customerId || null, seller_id: tx.sellerId || null,
      store_keeper_id: tx.storeKeeperId || null,
      items: tx.items || null, discount: tx.discount || 0,
    });

    if (error) {
      console.error('Sale Sync Error:', error);
      throw new Error(`Cloud Sync Failed: ${error.message}`);
    }

    if (tx.status === 'PENDING_STORE') { await refreshData(); return; }

    // Update customer debt balance and loyalty points
    const targetId = tx.origin === 'POS_SUPPLIER' ? tx.sellerId : tx.customerId;
    const customer = customers.find(c => c.id === targetId);
    if (customer) {
      const updates: any = {};
      
      // Update Debt
      if (tx.type === 'Debt' || tx.origin === 'POS_SUPPLIER') {
        const debtDelta = tx.origin === 'POS_SUPPLIER' ? tx.totalPrice * 0.9 : tx.totalPrice;
        updates.debt_balance = (customer.debtBalance || 0) + debtDelta;
      }
      
      // Update Loyalty (1 point per 1000 Naira)
      if (tx.status !== 'CANCELLED') {
        const pointsDelta = Math.floor(tx.totalPrice / 1000);
        updates.loyalty_points = (customer.loyaltyPoints || 0) + pointsDelta;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('customers').update(updates).eq('id', customer.id);
      }
    }

    // Update product stock for immediate (non-pending) sales
    const items = getTransactionItems(tx);
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await supabase.from('products')
          .update({ stock: Math.max(0, (product.stock || 0) - item.quantity) })
          .eq('id', item.productId);
      }
    }

    await refreshData();
  };

  // ─── Approve / Cancel Supplier Request ───────────────────────────────────────
  const updateTransactionStatus = async (id: string, status: 'COMPLETED' | 'CANCELLED') => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.status === status) return;

    await supabase.from('transactions').update({ status }).eq('id', id);

    if (status === 'COMPLETED') {
      const items = getTransactionItems(tx);

      for (const item of items) {
        // Update product stock
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const delta = tx.type === 'Return' ? item.quantity : -item.quantity;
          await supabase.from('products')
            .update({ stock: Math.max(0, (product.stock || 0) + delta) })
            .eq('id', item.productId);
        }

        // Create inventory log for SUPPLIER-origin transactions
        if (tx.origin === 'SUPPLIER') {
          await supabase.from('inventory_logs').insert({
            id: `${Date.now()}${Math.random().toString(36).slice(2)}`,
            batch_id: null, date: new Date().toISOString(),
            type: tx.type === 'Return' ? 'Return' : 'Receive',
            product_id: item.productId, quantity_received: item.quantity,
            cost_price: item.unitPrice || 0,
            store_keeper: tx.storeKeeperId || null,
            profile_id: tx.customerId || null,
          });
        }
      }

      // Update customer ledger
      if (tx.customerId) {
        const customer = customers.find(c => c.id === tx.customerId);
        if (customer) {
          let delta = 0;
          if (tx.type === 'Payment') delta = -tx.totalPrice;
          else if (tx.origin !== 'SUPPLIER') delta = tx.type === 'Return' ? -tx.totalPrice : tx.totalPrice;
          if (delta !== 0) {
            await supabase.from('customers')
              .update({ debt_balance: (customer.debtBalance || 0) + delta })
              .eq('id', customer.id);
          }
        }
      }
    }

    await refreshData();
  };

  // ─── Debt Payment ─────────────────────────────────────────────────────────────
  const recordDebtPayment = async (payment: DebtPayment) => {
    await supabase.from('debt_payments').insert({
      id: payment.id, date: payment.date, amount: payment.amount,
      customer_id: payment.customerId, method: payment.method || null, note: payment.note || null,
    });
    const customer = customers.find(c => c.id === payment.customerId);
    if (customer) {
      await supabase.from('customers')
        .update({ debt_balance: (customer.debtBalance || 0) - payment.amount })
        .eq('id', customer.id);
    }
    await refreshData();
  };

  // ─── Inventory ────────────────────────────────────────────────────────────────
  const _insertInventoryLog = async (log: InventoryLog, type: 'Receive' | 'Return', batchId?: string) => {
    await supabase.from('inventory_logs').insert({
      id: log.id, batch_id: batchId || log.batchId || null,
      date: log.date, type,
      product_id: log.productId, quantity_received: log.quantityReceived,
      cost_price: log.costPrice, store_keeper: log.storeKeeper || null,
      profile_id: log.profile_id || user?.id || null,
    });
    const product = products.find(p => p.id === log.productId);
    if (product) {
      const newStock = type === 'Receive'
        ? (product.stock || 0) + log.quantityReceived
        : Math.max(0, (product.stock || 0) - log.quantityReceived);
      await supabase.from('products').update({ stock: newStock }).eq('id', log.productId);
    }
  };

  const addInventory    = async (log: InventoryLog) => { await _insertInventoryLog(log, 'Receive'); await refreshData(); };
  const returnInventory = async (log: InventoryLog) => { await _insertInventoryLog(log, 'Return');  await refreshData(); };

  const processInventoryBatch = async (logs: InventoryLog[], action: 'Receive' | 'Return') => {
    const batchId = Date.now().toString();
    for (const log of logs) await _insertInventoryLog(log, action, batchId);
    await refreshData();
  };

  // ─── Bakery Payments & Expenses ───────────────────────────────────────────────
  const recordBakeryPayment = async (payment: BakeryPayment) => {
    await supabase.from('bakery_payments').insert({
      id: payment.id, date: payment.date, amount: payment.amount,
      method: payment.method || null, receiver: payment.receiver || null,
    });
    await refreshData();
  };

  const addExpense = async (expense: Expense) => {
    await supabase.from('expenses').insert({
      id: expense.id, date: expense.date, description: expense.description,
      amount: expense.amount, type: expense.type || 'SUPPLIER',
      profile_id: user?.id || null,
    });
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      products, customers, transactions, debtPayments, inventoryLogs,
      bakeryPayments, companyMetrics, expenses, loading, refreshData,
      isAuthenticated, login, logout, updatePin,
      addProduct, updateProduct, deleteProduct,
      addCustomer, updateCustomer, deleteCustomer,
      recordSale, updateTransactionStatus, recordDebtPayment,
      addInventory, returnInventory, processInventoryBatch,
      recordBakeryPayment, addExpense,
      appSettings, updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
