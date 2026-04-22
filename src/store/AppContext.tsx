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
  verifyCustomer: (customerId: string, isVerified: boolean) => Promise<void>;
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
  getPersonalStock: (productId: string, role?: string, profileId?: string) => number;
  personalStockMap: Record<string, number>;
  linkProfileToRecord: (userId: string, email?: string, phone?: string, fullName?: string) => Promise<any>;
}

// ─── Supabase row → App type mappers ─────────────────────────────────────────
const mapProduct = (r: any): Product => ({
  id: r.id, name: r.name, price: r.price, active: r.active,
  stock: r.stock || 0, category: r.category, image: r.image,
  description: r.description || '', ingredients: r.ingredients || '',
  costPrice: r.cost_price || 0, barcode: r.barcode || ''
});

const mapCustomer = (r: any): Customer => ({
  id: r.id, name: r.name, phone: r.phone || '', email: r.email || '',
  username: r.username || '', location: r.location || '', notes: r.notes || '',
  debtBalance: r.debt_balance || 0, loyaltyPoints: r.loyalty_points || 0,
  image: r.image, assignedSupplierId: r.assigned_supplier_id,
  pin: r.pin, password: r.password, profile_id: r.profile_id,
  is_verified: r.is_verified || false,
  supplierDetails: r.assigned_supplier ? {
    full_name: r.assigned_supplier.full_name,
    phone: r.assigned_supplier.phone,
    email: r.assigned_supplier.email,
    whatsapp_number: r.assigned_supplier.whatsapp_number,
  } : undefined,
});

const mapTransaction = (r: any): Transaction => {
  let parsedItems = r.items;
  if (typeof parsedItems === 'string') {
    try { parsedItems = JSON.parse(parsedItems); } catch(e) { parsedItems = []; }
  }
  return {
    id: r.id, date: r.date, type: r.type, status: r.status, origin: r.origin,
    items: parsedItems || [], productId: r.product_id, quantity: r.quantity,
    totalPrice: r.total_price, discount: r.discount || 0,
    customerId: r.customer_id, sellerId: r.seller_id,
    storeKeeperId: r.store_keeper_id,
  };
};

const mapDebtPay = (r: any): DebtPayment => ({
  id: r.id, date: r.date, customerId: r.customer_id,
  amount: r.amount, method: r.method, note: r.note,
});

const mapInvLog = (r: any): InventoryLog => ({
  id: r.id, batchId: r.batch_id, date: r.date, type: r.type,
  category: r.category, // Added category mapping
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
  is_verified: c.is_verified || false,
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
  const { user, role } = useAuth();

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
  const [personalStockMap, setPersonalStockMap] = useState<Record<string, number>>({});

  // ─── Fetch all data from Supabase ──────────────────────────────────────────
  const refreshData = async () => {
    setLoading(true);
    try {
      const [
        { data: prod }, { data: cust }, { data: txns },
        { data: dPay }, { data: invL }, { data: bPay }, { data: exps },
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*, assigned_supplier:profiles!assigned_supplier_id(full_name, phone, email, whatsapp_number)').order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('debt_payments').select('*').order('date', { ascending: false }),
        supabase.from('inventory_logs').select('*').order('date', { ascending: false }),
        supabase.from('bakery_payments').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);

      const loadedTxns = (txns || []).map(mapTransaction);
      const loadedDPay = (dPay || []).map(mapDebtPay);
      const loadedBPay = (bPay || []).map(mapBakeryPay);
      const loadedInvL = (invL || []).map(mapInvLog);

      setProducts      ((prod || []).map(mapProduct));
      setCustomers     ((cust || []).map(mapCustomer));
      setTransactions  (loadedTxns);
      setDebtPayments  (loadedDPay);
      setInventoryLogs (loadedInvL);
      setBakeryPayments(loadedBPay);
      setExpenses      ((exps || []).map(mapExpense));

      // Derive company metrics from live Supabase data
      const totalValueReceived =
        loadedTxns.filter(t => t.status === 'COMPLETED' && t.type === 'Cash').reduce((s, t) => s + t.totalPrice, 0) +
        loadedDPay.reduce((s, p) => s + p.amount, 0);
      const totalMoneyPaid = loadedBPay.reduce((s, p) => s + p.amount, 0);
      setCompanyMetrics({ totalValueReceived, totalMoneyPaid });

      // Calculate Personal Stock Map for the current user
      // If role is undefined but we have a user, treat as Supplier for stock calculation
      if ((role === 'SUPPLIER' || role === 'STORE_KEEPER' || !role) && user?.id) {
        const uid = user.id;
        const userEmail = user.email || '';
        const userPhone = (user as any).user_metadata?.phone || '';
        const userFullName = ((user as any).user_metadata?.full_name || '').toLowerCase();
        console.log('refreshData → uid:', uid, 'cid (to be resolved later):', 'pending', 'role:', role);

        const mappedCust = (cust || []).map(mapCustomer);

        // 1st priority: matched by profile_id (permanent link)
        // 2nd priority: matched by email, phone, or name (soft link for unlinked accounts)
        const myAcc = mappedCust.find(c => c.profile_id === uid)
          || mappedCust.find(c =>
              !c.profile_id && (
                (userEmail && c.email?.toLowerCase() === userEmail.toLowerCase()) ||
                (userPhone && c.phone === userPhone) ||
                (userFullName && c.name?.toLowerCase() === userFullName)
              )
            );
        const cid = myAcc?.id;
        const stockMap: Record<string, number> = {};
        const validTxs = loadedTxns.filter(t => t.status === 'COMPLETED' || t.status === 'PENDING_SUPPLIER' || t.status === 'PENDING_STORE');
        
        (prod || []).forEach(p => {
          const productId = p.id;
          
          // 1️⃣ Incoming from Supplier requests (completed or pending‑store)
          const incoming = validTxs
            .filter(t => t.origin === 'SUPPLIER' && t.type !== 'Return' && (t.customerId === uid || (cid && t.customerId === cid)))
            .reduce((sum, t) => {
              const items = getTransactionItems(t);
              return sum + items
                .filter(i => i && i.productId === productId)
                .reduce((s, i) => s + (i.quantity || 0), 0);
            }, 0);

          // 2️⃣ Outgoing sales made by Supplier (POS_SUPPLIER)
          const sold = validTxs
            .filter(t => t.origin === 'POS_SUPPLIER' && (t.sellerId === uid || (cid && t.sellerId === cid)))
            .reduce((sum, t) => {
              const items = getTransactionItems(t);
              return sum + items
                .filter(i => i && i.productId === productId)
                .reduce((s, i) => s + (i.quantity || 0), 0);
            }, 0);

          // Pure transaction-based stock calculation
          stockMap[productId] = Math.max(0, incoming - sold);
        });
        setPersonalStockMap(stockMap);
      } else {
        setPersonalStockMap({});
      }
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
    const { error } = await supabase.from('products').upsert({
      id: p.id, name: p.name, price: p.price, active: p.active,
      stock: p.stock, category: p.category || null, image: p.image || null,
      description: p.description || null, ingredients: p.ingredients || null,
      cost_price: p.costPrice || null, barcode: p.barcode || null
    });
    if (error) { console.error('addProduct failed:', error); throw new Error(error.message); }
    await refreshData();
  };

  const updateProduct = async (p: Product) => {
    const { error } = await supabase.from('products').update({
      name: p.name, price: p.price, active: p.active,
      stock: p.stock, category: p.category || null, image: p.image || null,
      description: p.description || null, ingredients: p.ingredients || null,
      cost_price: p.costPrice || null, barcode: p.barcode || null
    }).eq('id', p.id);
    if (error) { console.error('updateProduct failed:', error); throw new Error(error.message); }
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

  const verifyCustomer = async (customerId: string, isVerified: boolean) => {
    // 1. Find customer to get profile_id
    const customer = customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    // 2. Primary Update: Customers Table (Manager/Supplier have access)
    const { error: custErr } = await supabase.from('customers').update({ is_verified: isVerified }).eq('id', customerId);
    if (custErr) {
      console.error('Core verification failed:', custErr);
      throw new Error(`Database Error: ${custErr.message}`);
    }

    // 3. Secondary Sync: Profiles Table (Might fail due to RLS)
    // We do this separately so it doesn't block the primary operation
    if (customer.profile_id) {
       const { error: profErr } = await supabase.from('profiles').update({ is_verified: isVerified }).eq('id', customer.profile_id);
       if (profErr) {
         console.warn('Profile sync failed (likely RLS):', profErr.message);
         // We DON'T throw here because the primary verification succeeded
       }
    }

    // 4. Refresh to update UI
    await refreshData();
  };

  const deleteCustomer = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    await refreshData();
  };

  // ─── Record Sale ─────────────────────────────────────────────────────────────
  const recordSale = async (tx: Transaction) => {
    // 1. Initial Transaction Insert (Primary Record)
    const { error: txErr } = await supabase.from('transactions').insert({
      id: tx.id, date: tx.date, type: tx.type, status: tx.status || 'COMPLETED',
      origin: tx.origin || 'STORE', total_price: tx.totalPrice,
      customer_id: tx.customerId || null, seller_id: tx.sellerId || null,
      store_keeper_id: tx.storeKeeperId || null,
      items: tx.items || null, discount: tx.discount || 0,
    });

    if (txErr) {
      console.error('Sale Sync Error:', txErr);
      throw new Error(`Cloud Sync Failed: ${txErr.message}`);
    }

    if (tx.status === 'PENDING_STORE') { await refreshData(); return; }

    // 2. Parallelize Side-Effect Updates (Ledgers & Stock)
    const updates: any[] = [];

    // Supplier & Retail Ledger Logic
    if (tx.origin === 'POS_SUPPLIER') {
      // Supplier's Ledger with Bakery (90% wholesale)
      if (tx.sellerId) {
        const supplier = customers.find(c => c.id === tx.sellerId);
        if (supplier) {
          const wholesaleValue = tx.totalPrice * 0.9;
          updates.push(
            supabase.from('customers')
              .update({ debt_balance: (supplier.debtBalance || 0) + wholesaleValue })
              .eq('id', supplier.id)
          );
        }
      }

      // Retail Customer's Ledger with Supplier
      if (tx.customerId) {
        const retailCustomer = customers.find(c => c.id === tx.customerId);
        if (retailCustomer) {
          const custUpdates: any = {};
          if (tx.type === 'Debt') {
            custUpdates.debt_balance = (retailCustomer.debtBalance || 0) + tx.totalPrice;
          }
          if (tx.status !== 'CANCELLED') {
            custUpdates.loyalty_points = (retailCustomer.loyaltyPoints || 0) + Math.floor(tx.totalPrice / 1000);
          }
          if (Object.keys(custUpdates).length > 0) {
             updates.push(supabase.from('customers').update(custUpdates).eq('id', retailCustomer.id));
          }
        }
      }
    } else {
      // Normal Store Sales Flow (Direct to Retail)
      if (tx.customerId) {
        const customer = customers.find(c => c.id === tx.customerId);
        if (customer) {
          const custUpdates: any = {};
          if (tx.type === 'Debt') {
            custUpdates.debt_balance = (customer.debtBalance || 0) + tx.totalPrice;
          }
          if (tx.status !== 'CANCELLED') {
            custUpdates.loyalty_points = (customer.loyaltyPoints || 0) + Math.floor(tx.totalPrice / 1000);
          }
          if (Object.keys(custUpdates).length > 0) {
             updates.push(supabase.from('customers').update(custUpdates).eq('id', customer.id));
          }
        }
      }
    }

    // Product Stock Updates (Batch parallelized)
    // ONLY for Manager/Admin sales. Supplier sales are local to their stock map.
    if (tx.origin !== 'POS_SUPPLIER') {
      const txItems = getTransactionItems(tx);
      for (const item of txItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          updates.push(
            supabase.from('products')
              .update({ stock: Math.max(0, (product.stock || 0) - item.quantity) })
              .eq('id', item.productId)
          );
        }
      }
    }

    // Await all updates in parallel
    if (updates.length > 0) {
      const results = await Promise.all(updates);
      // Check for individual update errors
      const failed = results.find(r => r.error);
      if (failed) console.error('One or more background updates failed:', failed.error);
    }

    // Final Sync
    await refreshData();
  };

  // ─── Approve / Cancel Supplier Request ───────────────────────────────────────
  const updateTransactionStatus = async (id: string, status: 'COMPLETED' | 'CANCELLED') => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.status === status) return;

    // 1. Update primary status
    const { error: statusErr } = await supabase.from('transactions').update({ status }).eq('id', id);
    if (statusErr) {
      console.error('Status update failed:', statusErr);
      throw new Error(statusErr.message);
    }

    if (status === 'COMPLETED') {
      const updates: any[] = [];
      const items = getTransactionItems(tx);
      
      for (const item of items) {
        // Update product stock (Main Store only)
        if (tx.origin !== 'POS_SUPPLIER') {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const delta = tx.type === 'Return' ? item.quantity : -item.quantity;
            updates.push(
              supabase.from('products')
                .update({ stock: Math.max(0, (product.stock || 0) + delta) })
                .eq('id', item.productId)
            );
          }
        }

        // Skip parallel inventory log push because Supplier personal stock is strictly mathematical via transactions
        // No explicit RLS violations will happen here anymore
      }

      // Update customer ledger
      if (tx.customerId) {
        const customer = customers.find(c => c.id === tx.customerId);
        if (customer) {
          let delta = 0;
          if (tx.type === 'Payment') delta = -tx.totalPrice;
          else if (tx.origin !== 'SUPPLIER') delta = tx.type === 'Return' ? -tx.totalPrice : tx.totalPrice;
          if (delta !== 0) {
            updates.push(
              supabase.from('customers')
                .update({ debt_balance: (customer.debtBalance || 0) + delta })
                .eq('id', customer.id)
            );
          }
        }
      }
      
      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const failed = results.find(r => r.error);
        if (failed) console.error('One or more transaction side-effects failed:', failed.error);
      }
    }

    // Absolutely guarantee front-end alignment immediately upon Accept/Reject
    await refreshData();
  };

  // ─── Debt Payment ─────────────────────────────────────────────────────────────
  const recordDebtPayment = async (payment: DebtPayment) => {
    const updates: any[] = [
      supabase.from('debt_payments').insert({
        id: payment.id, date: payment.date, amount: payment.amount,
        customer_id: payment.customerId, method: payment.method || null, note: payment.note || null,
      })
    ];
    
    const customer = customers.find(c => c.id === payment.customerId);
    if (customer) {
      updates.push(
        supabase.from('customers')
          .update({ debt_balance: (customer.debtBalance || 0) - payment.amount })
          .eq('id', customer.id)
      );
    }
    
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed) throw new Error(`Debt payment failed: ${failed.error?.message}`);
    
    await refreshData();
  };


  // ─── Inventory ────────────────────────────────────────────────────────────────
  const _insertInventoryLog = async (log: InventoryLog, type: 'Receive' | 'Return', batchId?: string) => {
    const cat = log.category || 'PRODUCTION';
    await supabase.from('inventory_logs').insert({
      id: log.id, batch_id: batchId || log.batchId || null,
      date: log.date, type, category: cat,
      product_id: log.productId, quantity_received: log.quantityReceived,
      cost_price: log.costPrice, store_keeper: log.storeKeeper || null,
      profile_id: log.profile_id || user?.id || null,
    });
    const product = products.find(p => p.id === log.productId);
    if (product) {
      let newStock = product.stock || 0;
      if (cat === 'PRODUCTION') {
        newStock = type === 'Receive' ? newStock + log.quantityReceived : Math.max(0, newStock - log.quantityReceived);
      } else {
        // ASSIGNMENT: Receive (Giving to staff) means SUBTRACT, Return means ADD
        newStock = type === 'Receive' ? Math.max(0, newStock - log.quantityReceived) : newStock + log.quantityReceived;
      }
      await supabase.from('products').update({ stock: newStock }).eq('id', log.productId);
    }
  };

  const addInventory    = async (log: InventoryLog) => { await _insertInventoryLog(log, 'Receive'); await refreshData(); };
  const returnInventory = async (log: InventoryLog) => { await _insertInventoryLog(log, 'Return');  await refreshData(); };

  const processInventoryBatch = async (logs: InventoryLog[], action: 'Receive' | 'Return') => {
    const batchId = Date.now().toString();
    
    // 1. Bulk insert inventory logs
    const logData = logs.map(l => ({
      id: l.id,
      batch_id: batchId,
      date: l.date,
      type: action,
      product_id: l.productId,
      quantity_received: l.quantityReceived,
      cost_price: l.costPrice,
      store_keeper: l.storeKeeper || null,
      profile_id: l.profile_id || user?.id || null,
    }));

    const { error: logErr } = await supabase.from('inventory_logs').insert(logData.map(l => ({ ...l, category: logs[0].category || 'PRODUCTION' })));
    if (logErr) {
      console.error('Batch Log Insert Error:', logErr);
      throw new Error(`Cloud Sync Failed: ${logErr.message}`);
    }

    // 2. Group stock updates by product ID to prevent race conditions within the batch
    const stockUpdates: Record<string, number> = {};
    const batchCategory = logs[0].category || 'PRODUCTION';

    for (const log of logs) {
      let delta = 0;
      if (batchCategory === 'PRODUCTION') {
        delta = action === 'Receive' ? log.quantityReceived : -log.quantityReceived;
      } else {
        // ASSIGNMENT: Receive means subtraction from main store
        delta = action === 'Receive' ? -log.quantityReceived : log.quantityReceived;
      }
      stockUpdates[log.productId] = (stockUpdates[log.productId] || 0) + delta;
    }

    // 3. Update each affected product's stock sequentially
    for (const [productId, delta] of Object.entries(stockUpdates)) {
      const product = products.find(p => p.id === productId);
      if (product) {
        const newStock = Math.max(0, (product.stock || 0) + delta);
        await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      }
    }

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
  const linkProfileToRecord = async (userId: string, email?: string, phone?: string, fullName?: string) => {
    const nameLower = fullName?.toLowerCase() || '';
    // Find a customer record matching email, phone, OR full name — with or without an existing profile_id
    const target = customers.find(c =>
      !c.profile_id && (
        (email && c.email?.toLowerCase() === email.toLowerCase()) ||
        (phone && c.phone === phone) ||
        (nameLower && c.name?.toLowerCase() === nameLower)
      )
    );

    if (!target) return null;

    // Link it
    const { error } = await supabase.from('customers').update({ profile_id: userId }).eq('id', target.id);
    if (error) { console.error('Failed to link profile:', error); return null; }

    await refreshData();
    return target;
  };

  const getPersonalStock = (productId: string, customRole?: string, profileId?: string) => {
    const currentRole = customRole || role;
    const uid = profileId || user?.id;
    
    // If it's a standard check for the active user, use the pre-calculated map
    if (!profileId && !customRole && (currentRole === 'SUPPLIER' || currentRole === 'STORE_KEEPER')) {
      return personalStockMap[productId] || 0;
    }

    if (currentRole !== 'SUPPLIER' && currentRole !== 'STORE_KEEPER') {
      return products.find(p => p.id === productId)?.stock || 0;
    }
    if (!uid) return 0;
    
    const myAccount = customers.find(c => c.profile_id === uid);
    const cid = myAccount?.id;

    // 1. Gather all Supplier assignments via transactions securely natively
    const txs = transactions.filter(t => t.status === 'COMPLETED');
    const recTxs = txs.filter(t => t.type !== 'Return' && t.type !== 'Payment' && (t.customerId === uid || (cid && t.customerId === cid)))
      .reduce((s, t) => { 
        const items = getTransactionItems(t);
        return s + items.filter(i => i && i.productId === productId).reduce((sum, item) => sum + (item.quantity || 0), 0);
      }, 0);
    const retTxs = txs.filter(t => t.type === 'Return' && (t.customerId === uid || (cid && t.customerId === cid)))
      .reduce((s, t) => { 
        const items = getTransactionItems(t);
        return s + items.filter(i => i && i.productId === productId).reduce((sum, item) => sum + (item.quantity || 0), 0);
      }, 0);
    
    // 2. Subtract direct POS sales from their ledger
    const sold = txs.filter(t => t.origin === 'POS_SUPPLIER' && (t.sellerId === uid || (cid && t.sellerId === cid) || (uid && t.sellerId === uid)))
      .reduce((s, t) => {
        const items = getTransactionItems(t);
        return s + items.filter(i => i && i.productId === productId).reduce((sum, item) => sum + (item.quantity || 0), 0);
      }, 0);
    return Math.max(0, recTxs - retTxs - sold);
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
      appSettings, updateSettings, getPersonalStock, verifyCustomer, personalStockMap,
      linkProfileToRecord
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
