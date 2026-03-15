import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { Printer, ArrowLeft, Share2, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Receipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, products, customers, appSettings } = useAppContext();
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [tx, setTx] = useState(transactions.find(t => t.id === id));

  useEffect(() => {
    setTx(transactions.find(t => t.id === id));
  }, [id, transactions]);

  if (!tx) {
    return <div className="container mt-8 text-center">Receipt not found.</div>;
  }

  const customer = customers.find(c => c.id === tx.customerId);

  const handlePrint = () => {
    window.print();
  };

  const handleShareText = () => {
    let text = `*${appSettings.companyName} - Sales Receipt*\n`;
    text += `Date: ${dateStr} ${timeStr}\n`;
    text += `Ref: #${tx.id.slice(-6)}\n`;
    if (customer?.name) text += `Customer: ${customer.name}\n`;
    text += `\n*Items:*\n`;
    
    getTransactionItems(tx).forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      text += `- ${p?.name || 'Item'} x${item.quantity} @ ₦${item.unitPrice.toLocaleString()} = ₦${(item.quantity * item.unitPrice).toLocaleString()}\n`;
    });
    
    if (tx.discount && tx.discount > 0) {
      text += `\nDiscount: -₦${tx.discount.toLocaleString()}`;
    }
    
    text += `\n*Total: ₦${tx.totalPrice.toLocaleString()}*\n`;
    text += `Payment: ${tx.type}\n`;
    
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportAsImage = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, logging: false });
      const image = canvas.toDataURL("image/png", 1.0);
      
      if (navigator.share) {
        try {
          const blob = await (await fetch(image)).blob();
          const file = new File([blob], `sales_${id?.substring(0,8)}.png`, { type: 'image/png' });
          await navigator.share({ title: `Sales Receipt`, files: [file] });
          setIsExporting(false);
          return;
        } catch (err) { console.log(err); }
      }

      const link = document.createElement('a');
      link.download = `sales_${id?.substring(0,8)}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      alert("Failed to export image.");
    }
    setIsExporting(false);
  };

  const exportAsPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      
      if (navigator.share) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], `sales_${id?.substring(0,8)}.pdf`, { type: 'application/pdf' });
          await navigator.share({ title: `Sales Receipt`, files: [file] });
          setIsExporting(false);
          return;
        } catch (err) { console.log(err); }
      }

      pdf.save(`sales_${id?.substring(0,8)}.pdf`);
    } catch (error) {
      alert("Failed to create PDF.");
    }
    setIsExporting(false);
  };

  const d = new Date(tx.date);
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="container" style={{ maxWidth: '320px', margin: '0 auto', background: 'var(--surface-color)', minHeight: '100vh', paddingTop: '1rem' }}>
      
      {/* Hide controls when printing & optimize for 58mm POS */}
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
            margin: 0 !important; 
            max-width: 58mm !important; 
            width: 58mm !important;
            box-shadow: none !important; 
            background: transparent !important;
          }
          .receipt-box { 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            color: #000 !important;
            background: #fff !important;
            font-family: monospace !important;
            line-height: 1.2 !important;
          }
          .receipt-logo {
            max-width: 40px !important;
            max-height: 40px !important;
            margin: 0 auto 5px auto !important;
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
          .p-6 { padding: 5px !important; }
          .mb-6 { margin-bottom: 8px !important; }
          .mb-4 { margin-bottom: 5px !important; }
          .py-3 { padding-top: 3px !important; padding-bottom: 3px !important; }
          .p-3 { padding: 3px !important; }
        }
      `}</style>
      
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-icon">
           <ArrowLeft size={20} />
        </button>
        <button onClick={handlePrint} className="btn btn-primary" style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem' }}>
          <Printer size={18} className="mr-2" style={{marginRight: '0.5rem'}} /> Print
        </button>
      </div>

      {/* Printable Receipt Area */}
      <div ref={receiptRef} className="receipt-box p-6 border rounded" style={{ borderColor: 'var(--border-color)', background: '#fff', color: '#000' }}>
        <div className="text-center mb-6 border-b pb-4 border-dashed" style={{ borderColor: '#ddd' }}>
          {appSettings.logo && (
            <img 
              src={appSettings.logo} 
              alt="Logo" 
              className="receipt-logo"
              style={{ maxHeight: '60px', maxWidth: '80%', objectFit: 'contain', margin: '0 auto 10px auto' }} 
            />
          )}
          <h1 className="text-2xl font-bold mb-1 font-mono uppercase text-black">{appSettings.companyName}</h1>
          <p className="text-sm font-mono mt-1 text-gray-600 border border-gray-300 border-dashed inline-block p-1 uppercase">SALES RECEIPT</p>
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <div><strong>Date:</strong> {dateStr}</div>
            <div><strong>Time:</strong> {timeStr}</div>
          </div>
          <div className="text-right">
            <div><strong>Txn ID:</strong> #{tx.id.slice(-6)}</div>
          </div>
        </div>

        <div className="mb-6 p-3" style={{ background: '#f5f5f5', borderRadius: '4px' }}>
          <div className="text-sm font-bold mb-1">Customer:</div>
          <div className="text-lg">{customer?.name || 'Unknown'}</div>
          {customer?.phone && <div className="text-sm">{customer.phone}</div>}
        </div>

        <div className="text-sm opacity-80 mb-4">{new Date(tx.date).toLocaleString()}</div>
        
        <div className="border-t border-b py-3 mb-4" style={{ borderColor: 'var(--border-color)' }}>
          {getTransactionItems(tx).map((item, idx) => {
            const product = products.find(p => p.id === item.productId);
            return (
              <div key={idx} className="mb-2">
                <div className="flex justify-between font-bold">
                  <span>{product?.name || 'Item'}</span>
                  <span>₦{(item.quantity * item.unitPrice).toLocaleString()}</span>
                </div>
                <div className="text-sm opacity-80">
                  Qty: {item.quantity} @ ₦{item.unitPrice}
                </div>
              </div>
            );
          })}
          
          {tx.discount && tx.discount > 0 && (
            <div className="flex justify-between text-sm text-danger font-bold mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <span>Discount</span>
              <span>- ₦{tx.discount.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between text-xl font-bold mb-6">
          <span>TOTAL</span>
          <span>₦{tx.totalPrice.toLocaleString()}</span>
        </div>

        <div className="text-center mb-6">
          <div className="text-sm mb-1">Payment Method</div>
          <div className="font-bold text-lg uppercase" style={{ color: tx.type === 'Cash' ? '#16a34a' : '#000' }}>
            {tx.type}
          </div>
        </div>

        <div className="text-center text-sm border-t border-dashed pt-4" style={{ borderColor: '#aaa' }}>
          {appSettings.receiptFooter ? (
            <p style={{ whiteSpace: 'pre-line' }}>{appSettings.receiptFooter}</p>
          ) : (
            <p>Thank you for your business!</p>
          )}
          <p className="text-xs opacity-60 mt-2">System Generated Receipt</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4 mb-10 no-print">
        <button className="btn btn-outline w-full py-3 justify-center text-success border-success" onClick={handleShareText}>
          <Share2 size={18} className="mr-2" /> Share as Text (WhatsApp)
        </button>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1 py-3 justify-center text-sm" onClick={exportAsImage} disabled={isExporting}>
            <Download size={16} className="mr-2" /> {isExporting ? '...' : 'Save Image'}
          </button>
          <button className="btn btn-primary flex-1 py-3 justify-center text-sm" onClick={exportAsPDF} disabled={isExporting}>
            <FileText size={16} className="mr-2" /> {isExporting ? '...' : 'Save PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
