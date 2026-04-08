/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../lib/supabase';

export const exportData = async (): Promise<boolean> => {
  try {
    const [
      { data: products },   { data: customers },    { data: transactions },
      { data: debtPayments }, { data: inventoryLogs }, { data: expenses },
      { data: bakeryPayments },
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('debt_payments').select('*'),
      supabase.from('inventory_logs').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('bakery_payments').select('*'),
    ]);

    const blob = new Blob([JSON.stringify({
      products: products || [], customers: customers || [],
      transactions: transactions || [], debtPayments: debtPayments || [],
      inventoryLogs: inventoryLogs || [], expenses: expenses || [],
      bakeryPayments: bakeryPayments || [],
      exportDate: new Date().toISOString(), version: '3.0',
    }, null, 2)], { type: 'application/json' });

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
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.products) throw new Error('Invalid backup file format');

        if (data.products?.length)      await supabase.from('products').upsert(data.products);
        if (data.customers?.length)     await supabase.from('customers').upsert(data.customers);
        if (data.transactions?.length)  await supabase.from('transactions').upsert(data.transactions);
        if (data.debtPayments?.length)  await supabase.from('debt_payments').upsert(data.debtPayments);
        if (data.inventoryLogs?.length) await supabase.from('inventory_logs').upsert(data.inventoryLogs);
        if (data.expenses?.length)      await supabase.from('expenses').upsert(data.expenses);
        if (data.bakeryPayments?.length)await supabase.from('bakery_payments').upsert(data.bakeryPayments);

        resolve(true);
      } catch (err) { console.error('Import failed:', err); reject(err); }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};
