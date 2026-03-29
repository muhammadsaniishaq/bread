import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck, Download } from 'lucide-react';
import ReactQRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

// Safely extract the component whether it's wrapped in { default } by Vite or not.
const QRCode: any = typeof ReactQRCode === 'function' ? ReactQRCode : (ReactQRCode as any).default || ReactQRCode;

interface IdCardProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  profile: any;
  appSettings: any;
}

export const DigitalIdCard: React.FC<IdCardProps> = ({ isOpen, onClose, customer, profile, appSettings }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!customer) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `digital-id-${customer.id.substring(0,6)}.png`;
      a.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const isVerified = customer.phone || customer.assignedSupplierId;
  const roleDisplay = isVerified ? 'Verified Member' : 'Guest Member';

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)' }} />
          
          <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }}
            style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }}>
               <button onClick={handleDownload} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px 16px', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 900, backdropFilter: 'blur(10px)', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><Download size={14} /> Download</button>
               <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div ref={cardRef} style={{ background: 'linear-gradient(145deg, #ffffff, #f1f5f9)', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
               
               {/* HEADER STRIP */}
               <div style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -50, right: -50, width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', bottom: -20, left: -20, width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{appSettings?.companyName || 'BAKERY HUB'}</h2>
                  <div style={{ marginTop: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, letterSpacing: '0.1em' }}>DIGITAL IDENTIFICATION</div>
               </div>

               {/* AVATAR OVERLAY */}
               <div style={{ marginTop: '-40px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#fff', padding: '4px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                     {customer.image ? (
                       <img src={customer.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Profile" />
                     ) : (
                       <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: 900 }}>
                          {(profile?.full_name || customer?.name || 'V').charAt(0)}
                       </div>
                     )}
                  </div>
               </div>

               {/* DETAILS */}
               <div style={{ padding: '16px 24px 24px', textAlign: 'center' }}>
                  <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{profile?.full_name || customer.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: isVerified ? '#10b981' : '#f43f5e', marginBottom: '24px' }}>
                     {isVerified && <BadgeCheck size={14} />}
                     <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleDisplay}</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.04)' }}>
                     <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Member ID</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b', fontFamily: 'monospace' }}>#{(customer?.id || 'VIP0000').substring(0,8).toUpperCase()}</div>
                        
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px', marginBottom: '4px' }}>Joined</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</div>
                     </div>
                     
                     <div style={{ padding: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                        {QRCode ? <QRCode value={customer?.id || '0000'} size={64} level="L" /> : <div style={{ width: 64, height: 64 }} />}
                     </div>
                  </div>
               </div>
               
               {/* FOOTER */}
               <div style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.03)', fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>
                  Present this card for fast checkout and rewards.
               </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
