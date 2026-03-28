import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface UnifiedReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  appSettings: any;
  customerName: string;
}

export const UnifiedReceiptViewer: React.FC<UnifiedReceiptProps> = ({ isOpen, onClose, order, appSettings, customerName }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handleShare = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `order-receipt-${order.id}.png`, { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({ title: 'Order Receipt', files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `order-receipt-${order.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error('Error sharing receipt:', err);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />
        
        <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }}
          style={{ position: 'relative', width: '100%', maxWidth: '380px', background: '#f8fafc', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
             <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>Digital Receipt</h3>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleShare} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', padding: '6px', borderRadius: '10px', color: '#4f46e5' }}><Share2 size={16} /></button>
                <button onClick={onClose} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', padding: '6px', borderRadius: '10px', color: '#64748b' }}><X size={16} /></button>
             </div>
          </div>

          <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div ref={receiptRef} style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {appSettings?.logo && <img src={appSettings.logo} alt="Logo" style={{ width: '40px', height: '40px', margin: '0 auto 8px', objectFit: 'contain', filter: 'grayscale(100%)' }} />}
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{appSettings?.companyName || 'BAKERY'}</h2>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>ORDER RECEIPT</p>
              </div>

              {/* Meta */}
              <div style={{ fontSize: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Order No:</span>
                  <span style={{ fontWeight: 800 }}>#{order.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: 800 }}>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <span style={{ fontWeight: 800 }}>{customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ fontWeight: 800, color: order.status === 'PENDING' ? '#eab308' : '#10b981' }}>{order.status}</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Items Ordered</div>
                {order.items && Object.entries(order.items).map(([pid, qty]) => (
                   <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 700 }}>
                      <span>{String(qty)} x Product</span>
                      {/* Note: In a real app we'd map pid to real product name/price via context, but we might only have ID here in the raw order object unless populated. */}
                   </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '28px', fontWeight: 900 }}>₦{order.total_price?.toLocaleString()}</div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                {appSettings?.receiptFooter || 'Thank you for your patronage!'}
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
