/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  dbProducts, dbCustomers, dbTransactions, 
  dbDebtPayments, dbInventoryLogs, dbExpenses, dbCompanyMetrics, getItems
} from './database';

export const exportData = async () => {
  try {
    const data = {
      products: await getItems(dbProducts as any),
      customers: await getItems(dbCustomers as any),
      transactions: await getItems(dbTransactions as any),
      debtPayments: await getItems(dbDebtPayments as any),
      inventoryLogs: await getItems(dbInventoryLogs as any),
      expenses: await getItems(dbExpenses as any),
      companyMetrics: await dbCompanyMetrics.getItem('main') || { totalValueReceived: 0, totalMoneyPaid: 0 },
      appPin: localStorage.getItem('appPin') || '1234',
      exportDate: new Date().toISOString(),
      version: '2.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breadapp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error('Export failed:', err);
    return false;
  }
};

export const importData = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.version || !data.products) {
          throw new Error('Invalid backup file format');
        }

        // Clear existing DBs
        await Promise.all([
          dbProducts.clear(), dbCustomers.clear(), dbTransactions.clear(),
          dbDebtPayments.clear(), dbInventoryLogs.clear(), dbExpenses.clear(), dbCompanyMetrics.clear()
        ]);

        // Restore Items
        for (const p of data.products) await dbProducts.setItem(p.id, p);
        for (const c of data.customers) await dbCustomers.setItem(c.id, c);
        for (const t of data.transactions) await dbTransactions.setItem(t.id, t);
        for (const dp of data.debtPayments) await dbDebtPayments.setItem(dp.id, dp);
        for (const il of data.inventoryLogs) await dbInventoryLogs.setItem(il.id, il);
        for (const exp of data.expenses) await dbExpenses.setItem(exp.id, exp);
        
        await dbCompanyMetrics.setItem('main', data.companyMetrics);
        localStorage.setItem('appPin', data.appPin || '1234');

        resolve(true);
      } catch (err) {
        console.error('Import failed:', err);
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};
