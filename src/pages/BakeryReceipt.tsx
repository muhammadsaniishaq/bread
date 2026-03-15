import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import type { BakeryPayment } from '../store/types';
import { ArrowLeft, Printer, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export const BakeryReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bakeryPayments, appSettings, companyMetrics } = useAppContext();
  
  const [payment, setPayment] = useState<BakeryPayment | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const found = bakeryPayments.find(p => p.id === id);
      if (found) {
        setPayment(found);
      }
    }
  }, [id, bakeryPayments]);

  if (!payment) {
    return (
      <div className="container p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Receipt Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/inventory')}>Back to Inventory</button>
      </div>
    );
  }

  // To show an accurate "remaining balance", we calculate what the balance is now.
  // Note: this represents the CURRENT balance, which is usually exactly what they want on the receipt.
  const currentBalance = companyMetrics.totalValueReceived - companyMetrics.totalMoneyPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `bakery-receipt-${payment.id}.png`, { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: 'Bakery Payment Receipt',
            files: [file]
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bakery-receipt-${payment.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error('Error sharing receipt:', err);
      alert('Could not generate image for sharing.');
    }
  };

  return (
    <div className="container pb-20">
      <div className="flex justify-between items-center mb-6 no-print">
        <button className="btn btn-outline flex items-center gap-2" onClick={() => navigate('/inventory')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-2">
          <button className="btn btn-outline text-primary border-primary flex items-center gap-2" onClick={handleShare}>
            <Share2 size={18} /> Share
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={handlePrint}>
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div 
          ref={receiptRef}
          className="bg-white text-black p-8 rounded-lg shadow-sm"
          style={{ fontFamily: 'monospace' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            {appSettings.logo && (
              <img 
                src={appSettings.logo} 
                alt="Logo" 
                className="w-16 h-16 mx-auto mb-2 object-cover rounded"
                style={{ filter: 'grayscale(100%)' }}
              />
            )}
            <h1 className="text-xl font-bold uppercase">{appSettings.companyName || 'BREAD APP'}</h1>
            <p className="text-sm">SUPPLIER PAYMENT RECEIPT</p>
          </div>

          <div className="border-b border-dashed border-gray-400 pb-4 mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Receipt No:</span>
              <span className="font-bold">{payment.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Date:</span>
              <span>{new Date(payment.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Payment Method:</span>
              <span>{payment.method || 'Cash'}</span>
            </div>
            {payment.receiver && (
              <div className="flex justify-between">
                <span>Received By:</span>
                <span className="font-bold">{payment.receiver}</span>
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <div className="text-sm mb-1 uppercase tracking-wider">Amount Paid</div>
            <div className="text-3xl font-bold">₦{payment.amount.toLocaleString()}</div>
          </div>

          <div className="border-t border-dashed border-gray-400 pt-4 mb-6">
            <div className="flex justify-between text-sm">
              <span>Current Outstanding Balance:</span>
              <span className="font-bold">₦{currentBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-8">
            <p>{appSettings.receiptFooter || 'Thank you for your business!'}</p>
            <p className="mt-1">Generated by BreadApp</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .container { padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .max-w-md { max-width: 100% !important; }
          
          /* Show only the receipt content container and its children */
          .bg-white, .bg-white * {
            visibility: visible;
          }
          
          /* Position the receipt at the top left of the printed page */
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            width: 80mm; /* Standard thermal receipt width */
            padding: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BakeryReceipt;
