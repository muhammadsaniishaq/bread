import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { getTransactionItems } from '../store/types';
import { Printer, ArrowLeft, Share2, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

export const Receipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, products, customers, appSettings } = useAppContext();
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [tx, setTx] = useState(transactions.find(t => t.id === id));
  const [keeperName, setKeeperName] = useState<string | null>(null);

  useEffect(() => {
    const transaction = transactions.find(t => t.id === id);
    setTx(transaction);
    
    if (transaction?.storeKeeperId) {
       supabase.from('profiles').select('full_name').eq('id', transaction.storeKeeperId).single().then(({ data }) => {
          if (data) setKeeperName(data.full_name);
       });
    }
  }, [id, transactions]);

  if (!tx) {
    return <div className="container mt-8 text-center text-gray-500">Receipt not found.</div>;
  }

  const customer = customers.find(c => c.id === tx.customerId);
  const d = new Date(tx.date);
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = async () => {
    try {
      if (!(navigator as any).bluetooth) {
        window.print();
        return;
      }
      // Standard Bluetooth print logic (omitted for brevity but kept in structure if needed)
      window.print();
    } catch (error) {
      window.print();
    }
  };

  const handleShareText = () => {
    const title = tx.type === 'Payment' ? 'Payment Receipt' : (tx.type === 'Return' ? 'Return Slip' : 'Sales Receipt');
    let text = `*${appSettings.companyName} - ${title}*\n`;
    text += `Date: ${dateStr} ${timeStr}\n`;
    text += `Ref: #${tx.id.slice(-6)}\n`;
    if (customer?.name) text += `Customer: ${customer.name}\n`;
    
    if (tx.type === 'Payment') {
      text += `\n*Amount Paid: ₦${tx.totalPrice.toLocaleString()}*\n`;
      if (keeperName) text += `Received by: ${keeperName}\n`;
    } else {
      text += `\n*Items:*\n`;
      getTransactionItems(tx).forEach(item => {
        const p = products.find(prod => prod.id === item.productId);
        text += `- ${p?.name || 'Item'} x${item.quantity} @ ₦${item.unitPrice.toLocaleString()} = ₦${(item.quantity * item.unitPrice).toLocaleString()}\n`;
      });
      if ((tx.discount || 0) > 0) text += `\nDiscount: -₦${(tx.discount || 0).toLocaleString()}`;
      text += `\n*Total: ₦${tx.totalPrice.toLocaleString()}*\n`;
    }
    
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportAsImage = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `receipt_${tx.id.slice(-6)}.png`;
      link.href = image;
      link.click();
    } catch (e) { alert("Export failed"); }
    setIsExporting(false);
  };

  const exportAsPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`receipt_${tx.id.slice(-6)}.pdf`);
    } catch (e) { alert("PDF Export failed"); }
    setIsExporting(false);
  };

  return (
    <div className="container" style={{ maxWidth: '320px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingTop: '1rem', paddingBottom: '2rem' }}>
      
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          html, body { margin: 0; padding: 0; width: 58mm; background: #fff; }
          .no-print { display: none !important; }
          .receipt-view { box-shadow: none !important; border: none !important; width: 100% !important; padding: 10px !important; }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 no-print px-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600">
           <ArrowLeft size={20} />
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200">
          <Printer size={16} /> Print
        </button>
      </div>

      <div ref={receiptRef} className="receipt-view" style={{ background: '#fff', color: '#000', padding: '24px', fontFamily: 'monospace', fontSize: '11px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>{(appSettings.companyName || 'BREAD APP').toUpperCase()}</div>
          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#475569', display: 'inline-block' }}>
            {tx.type === 'Payment' ? 'Payment Receipt' : (tx.type === 'Return' ? 'Return Slip' : 'Sales Receipt')}
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px' }}>Official Receipt</div>
        </div>

        <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px', marginBottom: '10px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
             <span>DATE: {dateStr}</span>
             <span>TIME: {timeStr}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>REF: #{tx.id.slice(-6).toUpperCase()}</span>
             <span>TX: {tx.type.toUpperCase()}</span>
           </div>
           <div style={{ height: '8px' }} />
           {customer && <div style={{ fontWeight: 800 }}>CUSTOMER: {customer.name.toUpperCase()}</div>}
           {keeperName && <div style={{ fontWeight: 800 }}>STAFF: {keeperName.toUpperCase()}</div>}
        </div>

        {tx.type === 'Payment' ? (
          <div style={{ padding: '20px 0', textAlign: 'center', borderBottom: '1px dashed #cbd5e1' }}>
             <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>AMOUNT PAID</div>
             <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669' }}>₦{tx.totalPrice.toLocaleString()}</div>
             <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>Payment recorded successfully</div>
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', textAlign: 'left', fontSize: '10px' }}>
                  <th style={{ paddingBottom: '4px' }}>ITEM</th>
                  <th style={{ textAlign: 'center', paddingBottom: '4px' }}>QTY</th>
                  <th style={{ textAlign: 'right', paddingBottom: '4px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {getTransactionItems(tx).map((item, i) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return (
                    <tr key={i}>
                      <td style={{ paddingTop: '6px' }}>{(p?.name || 'Item').toUpperCase()}</td>
                      <td style={{ textAlign: 'center', paddingTop: '6px' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', paddingTop: '6px' }}>₦{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
              {(tx.discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DISCOUNT:</span>
                  <span>-₦{(tx.discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>₦{tx.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
           <div style={{ display: 'inline-block', padding: '6px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              <QRCode value={tx.id} size={80} />
           </div>
           <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '6px' }}>Verify at {window.location.host}</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '9px', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
           {appSettings.receiptFooter ? (
             <div style={{ whiteSpace: 'pre-line' }}>{appSettings.receiptFooter}</div>
           ) : (
             <div>Thank you for your patronage!</div>
           )}
           <div style={{ fontSize: '8px', marginTop: '10px', opacity: 0.5 }}>SYSTEM GENERATED RECEIPT</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6 no-print px-4">
        <button onClick={handleShareText} className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-green-500 text-green-600 rounded-xl font-bold text-sm">
          <Share2 size={18} /> WhatsApp
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportAsImage} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs">
            <Download size={14} /> Image
          </button>
          <button onClick={exportAsPDF} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Export default at the end
export default Receipt;
