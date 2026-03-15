import localforage from 'localforage';
import type { Product, CompanyMetrics } from './types';

export const dbProducts = localforage.createInstance({ name: 'BreadAppDB', storeName: 'products' });
export const dbCustomers = localforage.createInstance({ name: 'BreadAppDB', storeName: 'customers' });
export const dbTransactions = localforage.createInstance({ name: 'BreadAppDB', storeName: 'transactions' });
export const dbDebtPayments = localforage.createInstance({ name: 'BreadAppDB', storeName: 'debt_payments' });
export const dbInventoryLogs = localforage.createInstance({ name: 'BreadAppDB', storeName: 'inventory_logs' });
export const dbCompanyMetrics = localforage.createInstance({ name: 'BreadAppDB', storeName: 'company_metrics' });
export const dbBakeryPayments = localforage.createInstance({ name: 'BreadAppDB', storeName: 'bakery_payments' });
export const dbExpenses = localforage.createInstance({ name: 'BreadAppDB', storeName: 'expenses' });
export const dbSettings = localforage.createInstance({ name: 'BreadAppDB', storeName: 'settings' });

export const initializeDB = async () => {
  const productsCount = await dbProducts.length();
  if (productsCount === 0) {
    const defaultProducts: Product[] = [
      { id: '100', name: '₦100 Bread', price: 100, active: true, stock: 0 },
      { id: '250', name: '₦250 Bread', price: 250, active: true, stock: 0 },
      { id: '300', name: '₦300 Bread', price: 300, active: true, stock: 0 },
      { id: '500', name: '₦500 Bread', price: 500, active: true, stock: 0 },
      { id: '900', name: '₦900 Bread', price: 900, active: true, stock: 0 }
    ];
    for (const p of defaultProducts) {
      await dbProducts.setItem(p.id, p);
    }
  }

  const metrics = await dbCompanyMetrics.getItem<CompanyMetrics>('main');
  if (!metrics) {
    await dbCompanyMetrics.setItem('main', { totalValueReceived: 0, totalMoneyPaid: 0 });
  }

  const settings = await dbSettings.getItem<{ companyName: string }>('app');
  if (!settings) {
    await dbSettings.setItem('app', { companyName: 'THE BEST SPECIAL BREAD' });
  }
};

export const getItems = async <T>(store: LocalForage): Promise<T[]> => {
  const items: T[] = [];
  await store.iterate((value: T) => {
    items.push(value);
  });
  return items;
};
