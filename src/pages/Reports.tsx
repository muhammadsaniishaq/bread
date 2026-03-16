import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';

export const Reports: React.FC = () => {
  const { transactions, expenses, products, customers, inventoryLogs, appSettings } = useAppContext();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState<'All' | 'Today' | 'Week' | 'Month'>('Today');

  const filteredData = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filteredTxs = transactions;
    let filteredExps = expenses;
    let filteredLogs = inventoryLogs;

    if (period === 'Today') {
      filteredTxs = transactions.filter(t => t.date.startsWith(todayStr));
      filteredExps = expenses.filter(e => e.date.startsWith(todayStr));
      filteredLogs = inventoryLogs.filter(l => l.date.startsWith(todayStr));
    } else if (period === 'Week') {
      filteredTxs = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
      filteredExps = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
      filteredLogs = inventoryLogs.filter(l => new Date(l.date) >= oneWeekAgo);
    } else if (period === 'Month') {
      filteredTxs = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
      filteredExps = expenses.filter(e => new Date(e.date) >= oneMonthAgo);
      filteredLogs = inventoryLogs.filter(l => new Date(l.date) >= oneMonthAgo);
    }

    return { filteredTxs, filteredExps, filteredLogs };
  };

  const { filteredTxs, filteredExps, filteredLogs } = filteredData();

  const totalSalesValue = filteredTxs.reduce((acc, t) => acc + t.totalPrice, 0);
  const totalCash = filteredTxs.filter(t => t.type === 'Cash').reduce((acc, t) => acc + t.totalPrice, 0);
  const totalDebt = filteredTxs.filter(t => t.type === 'Debt').reduce((acc, t) => acc + t.totalPrice, 0);
  const breadCount = filteredTxs.reduce((acc, t) => acc + getTransactionItems(t).reduce((sum, item) => sum + item.quantity, 0), 0);
  
  const totalExpenses = filteredExps.reduce((acc, e) => acc + e.amount, 0);
  const grossProfit = totalSalesValue * 0.1;
  const netProfit = grossProfit - totalExpenses;

  // Advanced Metrics
  const stockRetailValue = products.filter(p => p.active).reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalReturns = filteredLogs.filter(l => l.type === 'Return').reduce((sum, l) => sum + (l.quantityReceived * l.costPrice), 0);
  const outstandingDebt = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);

  // Breakdown by Product
  const salesByProduct: Record<string, number> = {};
  filteredTxs.forEach(t => {
    getTransactionItems(t).forEach(item => {
      salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity;
    });
  });

  const returnsByProduct: Record<string, number> = {};
  filteredLogs.filter(l => l.type === 'Return').forEach(l => {
    returnsByProduct[l.productId] = (returnsByProduct[l.productId] || 0) + l.quantityReceived;
  });

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Item';
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`;
  };

  const sortedTxs = [...filteredTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePrint = async () => {
    try {
      if (!(navigator as any).bluetooth) {
        alert("This browser doesn't support direct Bluetooth printing. Falling back to standard print.");
        window.print();
        return;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'MTP' }, { namePrefix: 'PT' }, { namePrefix: 'RP' }, { namePrefix: 'Printer' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });

      if (!device.gatt) throw new Error("No GATT server found.");
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      if (services.length === 0) throw new Error("No services found.");
      const service = services[0];
      
      const characteristics = await service.getCharacteristics();
      const characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
      if (!characteristic) throw new Error("No writable characteristic.");

      // Build ESC/POS payload
      const title = (appSettings.companyName || 'BREAD APP').toUpperCase();
      let cmds = [
        "\\x1B" + "@", // Init
        "\\x1B" + "a" + "\\x01", // Center
        "\\x1B" + "E" + "\\x01", // Bold
        title + "\n",
        "\\x1B" + "E" + "\\x00", // Normal
        `REPORTS & ANALYTICS\n`,
        `Period: ${period.toUpperCase()}\n`,
        "--------------------------------\n", // 32 chars
        "\\x1B" + "a" + "\\x00", // Left
        `Net Profit : NGN ${netProfit.toLocaleString()}\n`,
        `Total Sales: NGN ${totalSalesValue.toLocaleString()}\n`,
        `10% Gross  : NGN ${grossProfit.toLocaleString()}\n`,
        `Expenses   : NGN ${totalExpenses.toLocaleString()}\n`,
        `Cash Recvd : NGN ${totalCash.toLocaleString()}\n`,
        `Debt Issued: NGN ${totalDebt.toLocaleString()}\n`,
        "--------------------------------\n",
        `Bread Sold : ${breadCount} units\n`,
        ...Object.entries(salesByProduct).map(([id, qty]) => ` - ${getProductName(id).substring(0, 16).padEnd(16)}: ${qty}\n`),
        "--------------------------------\n",
        `Returns    : NGN ${totalReturns.toLocaleString()}\n`,
        ...Object.entries(returnsByProduct).map(([id, qty]) => ` - ${getProductName(id).substring(0, 16).padEnd(16)}: ${qty}\n`),
        "--------------------------------\n",
        `Stock Val  : NGN ${stockRetailValue.toLocaleString()}\n`,
        `Unpaid Debt: NGN ${outstandingDebt.toLocaleString()}\n`,
        "--------------------------------\n",
        "\\x1B" + "a" + "\\x01", // Center
        "\n",
        `Printed: ${new Date().toLocaleString()}\n`,
        "Generated by BreadApp\n",
        "\n\n\n" // Feed paper
      ];

      const cmdStr = cmds.join("");
      const buffer = [];
      for (let i = 0; i < cmdStr.length; i++) {
        if (cmdStr[i] === '\\' && cmdStr[i+1] === 'x') {
           buffer.push(parseInt(cmdStr.substring(i+2, i+4), 16));
           i += 3;
        } else {
           buffer.push(cmdStr.charCodeAt(i));
        }
      }
      
      const payload = new Uint8Array(buffer);
      const chunkSize = 32; // Hyper-conservative for worst-case BLE thermal printers
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        if (characteristic.properties.writeWithoutResponse) {
           await characteristic.writeValueWithoutResponse(chunk);
        } else {
           await characteristic.writeValue(chunk);
        }
        await new Promise(r => setTimeout(r, 30));
      }

      await new Promise(r => setTimeout(r, 500));
      device.gatt.disconnect();

    } catch (error) {
      console.warn("Bluetooth print failed: ", error);
      window.print();
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      {/* Advanced 58mm styling for fallback print */}
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 58mm !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
          .container { 
            padding: 0 !important; 
            margin: 0 auto !important; 
            max-width: 58mm !important; 
            width: 58mm !important;
            box-shadow: none !important; 
            background: transparent !important;
          }
          * {
            font-family: monospace !important;
            color: #000 !important;
          }
          h1 { font-size: 14px !important; margin-bottom: 2px !important; }
          .text-2xl { font-size: 14px !important; }
          .text-xl { font-size: 13px !important; }
          .text-lg { font-size: 12px !important; }
          .text-sm { font-size: 10px !important; }
          .text-xs { font-size: 9px !important; }
          .card { border: none !important; padding: 2px !important; box-shadow: none !important; margin-bottom: 4px !important; }
          /* Enforce black text for thermal */
          .text-success, .text-danger, .text-primary, .text-secondary { color: #000 !important; }
        }
      `}</style>
      
      <div className="flex justify-between items-center mb-6 no-print bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[var(--border-color)]">
        <h1 className="text-lg font-bold">Advanced Reports</h1>
        <button className="btn btn-primary flex items-center justify-center gap-2 rounded-lg text-sm font-bold" style={{ width: 'auto', minHeight: '36px', padding: '0 1rem' }} onClick={handlePrint}>
          <Printer size={16} /> Print Repo
        </button>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-print">
        {['Today', 'Week', 'Month', 'All'].map(p => (
          <button 
            key={p}
            className={`btn flex-none ${period === p ? 'btn-primary' : 'btn-outline'}`} 
            style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
            onClick={() => setPeriod(p as any)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="card mb-6" style={{ background: netProfit >= 0 ? 'var(--primary-color)' : 'var(--danger-color)', color: 'white' }}>
        <h2 className="text-sm opacity-90 mb-1">Net Profit ({period})</h2>
        <div className="text-3xl font-bold">₦{netProfit.toLocaleString()}</div>
        <div className="flex justify-between mt-4 text-sm opacity-90 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <span>10% Gross: ₦{grossProfit.toLocaleString()}</span>
          <span>Expenses: ₦{totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Total Sales</div>
          <div className="text-xl font-bold mt-1">₦{totalSalesValue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Bread Sold (Total)</div>
          <div className="text-xl font-bold mt-1 mb-2">{breadCount} units</div>
          <div className="text-xs text-secondary mt-1 border-t border-[var(--border-color)] pt-2 max-h-24 overflow-y-auto">
            {Object.entries(salesByProduct).map(([id, qty]) => (
              <div key={id} className="flex justify-between py-1 border-b border-[var(--border-color)] last:border-0">
                <span className="truncate pr-2">{getProductName(id)}</span>
                <span className="font-bold">{qty}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Cash Received</div>
          <div className="text-xl font-bold text-success mt-1">₦{totalCash.toLocaleString()}</div>
        </div>
        <div className="card border-danger" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Debt Issued</div>
          <div className="text-xl font-bold text-danger mt-1">₦{totalDebt.toLocaleString()}</div>
        </div>
        
        {/* Advanced Feature Cards */}
        <div className="card border-warning" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Total Returns Breakdown</div>
          <div className="text-xl font-bold text-warning mt-1 mb-2">₦{totalReturns.toLocaleString()}</div>
          <div className="text-xs text-secondary mt-1 border-t border-[var(--border-color)] pt-2 max-h-24 overflow-y-auto">
            {Object.keys(returnsByProduct).length === 0 ? <div className="py-1">No returns.</div> : 
             Object.entries(returnsByProduct).map(([id, qty]) => (
              <div key={id} className="flex justify-between py-1 border-b border-[var(--border-color)] last:border-0">
                <span className="truncate pr-2">{getProductName(id)}</span>
                <span className="font-bold text-warning">{qty}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card border-primary" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Outstanding Debt</div>
          <div className="text-xl font-bold text-primary mt-1">₦{outstandingDebt.toLocaleString()}</div>
        </div>
        <div className="card col-span-2" style={{ marginBottom: 0 }}>
          <div className="text-sm text-secondary">Total Inventory Retail Value</div>
          <div className="text-xl font-bold mt-1">₦{stockRetailValue.toLocaleString()}</div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-3">Transaction History</h3>
      <div className="flex flex-col gap-2">
        {sortedTxs.length === 0 ? (
          <p className="text-center text-secondary py-4">No transactions found.</p>
        ) : (
          sortedTxs.map(t => (
            <div key={t.id} className="card flex justify-between items-center" style={{ marginBottom: 0, padding: '1rem' }} onClick={() => navigate(`/receipt/${t.id}`)}>
              <div>
                <div className="font-bold">{t.customerId ? getCustomerName(t.customerId) : 'Cash Walk-in'}</div>
                <div className="text-sm">
                  {getTransactionItems(t).map((item, idx) => (
                    <div key={idx} className="opacity-80 mt-1">
                      {item.quantity}x {getProductName(item.productId)}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-secondary mt-1">{formatDate(t.date)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">₦{t.totalPrice.toLocaleString()}</div>
                <div className={`text-xs font-bold uppercase ${t.type === 'Cash' ? 'text-success' : 'text-danger'}`}>
                  {t.type}
                </div>
                <div className="text-xs text-primary mt-1 no-print">View Receipt →</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
