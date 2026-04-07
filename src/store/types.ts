export interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  stock: number;
  category?: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;       // Unified login email
  username?: string;    // App login username
  location: string;
  notes: string;
  debtBalance: number;
  loyaltyPoints?: number;
  image?: string;
  assignedSupplierId?: string; // Links a customer permanently to a specific supplier
  pin?: string; // App login PIN
  password?: string; // App login password (manager set)
  profile_id?: string; // Links to Supabase profiles.id
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Cash' | 'Debt' | 'Return' | 'Payment'; // Added Return and Payment
  status?: 'PENDING_SUPPLIER' | 'PENDING_STORE' | 'COMPLETED' | 'CANCELLED'; // Added statuses
  origin?: 'STORE' | 'SUPPLIER' | 'POS_SUPPLIER'; // Where the transaction was initiated
  items?: TransactionItem[]; // V3 Shopping Cart
  productId?: string;        // Legacy
  quantity?: number;         // Legacy
  totalPrice: number;
  discount?: number;
  customerId?: string; // For debt
  sellerId?: string; // ID of the profile that made the sale (for Suppliers)
  storeKeeperId?: string; // Store Keeper responsible for the request
  pointsEarned?: number;
  pointsUsed?: number;
}

// Utility to normalize legacy vs new transactions
export const getTransactionItems = (tx: Transaction): TransactionItem[] => {
  if (tx.items && tx.items.length > 0) return tx.items;
  if (tx.productId && tx.quantity) {
    // Reconstruct unit price (gross estimate including potential discounts applied to the whole thing)
    // Actually, price could just be derived from mapping, but storing here as fallback
    return [{
      productId: tx.productId,
      quantity: tx.quantity,
      unitPrice: (tx.totalPrice + (tx.discount || 0)) / tx.quantity
    }];
  }
  return [];
};

export interface DebtPayment {
  id: string;
  date: string;
  customerId: string;
  amount: number;
  method?: 'Cash' | 'Transfer';
  note?: string;
}

export interface BakeryPayment {
  id: string;
  date: string;
  amount: number;
  method?: 'Cash' | 'Transfer';
  receiver?: string;
}

export interface InventoryLog {
  id: string;
  batchId?: string; // Groups multiple items into a single receipt
  date: string;
  type?: 'Receive' | 'Return'; // Added for tracking returns vs receiving
  productId: string;
  quantityReceived: number; // For returns, this represents the quantity returned
  costPrice: number;
  storeKeeper?: string; // Who gave or received the items
  profile_id?: string; // ID of the person who initiated this log (Supplier or SK)
}

export interface CompanyMetrics {
  totalValueReceived: number;
  totalMoneyPaid: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  type?: 'MANAGER' | 'SUPPLIER';
}

export interface AppSettings {
  companyName: string;
  adminPin: string;
  cashierPin: string;
  receiptFooter: string;
  logo?: string;
  adminEmail?: string;
  adminPassword?: string;
  role?: 'Admin' | 'Cashier' | 'MANAGER' | 'SUPPLIER' | 'STORE_KEEPER';
  theme?: 'dark' | 'light';
  bakeryName?: string;
}
