import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Share2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';

export const CustomerIDAndCert: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, appSettings } = useAppContext();
  
  const customer = customers.find(c => c.id === id);
  const idCardRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);

  if (!customer) {
    return (
      <div className="container p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Customer Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/customers')}>Back to Customers</button>
      </div>
    );
  }

  const handleShare = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, { scale: 3, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: filename,
            files: [file]
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Could not generate image.');
    }
  };

  return (
    <div className="container pb-20">
      <div className="flex justify-between items-center mb-6 no-print">
        <button className="btn btn-outline flex items-center gap-2" onClick={() => navigate('/customers')}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="space-y-12 flex flex-col items-center">
        {/* ID CARD SECTION */}
        <section style={{ width: '100%', maxWidth: '384px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Official ID Card</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Modern Badge Design</p>
            </div>
            <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)', padding: '8px 12px' }} onClick={() => handleShare(idCardRef, `${customer.name}-ID`)}>
              <Share2 size={16} /> Save / Share
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }} className="hide-scrollbar">
            {/* Standard Portrait CR80 ID Card (2.125" x 3.375") translated to pixels for reliable crisp rendering */}
            <div 
              ref={idCardRef}
              className="id-card-print"
              style={{ 
                width: '220px', 
                height: '350px', 
                flexShrink: 0, 
                fontFamily: "'Inter', sans-serif",
                background: '#faeddb', // base cream color
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  #faeddb,
                  #faeddb 20px,
                  #f5e0c8 20px,
                  #f5e0c8 40px
                )`,
                color: '#4e342e', // deep brown
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Bakery Decor Accents (Small icons scattered using absolute positioning simulating a pattern) */}
              <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', opacity: 0.3 }}>🥐</div>
              <div style={{ position: 'absolute', top: '40px', right: '12px', fontSize: '12px', opacity: 0.3 }}>🥖</div>
              <div style={{ position: 'absolute', bottom: '64px', left: '12px', fontSize: '10px', opacity: 0.3 }}>🥨</div>
              <div style={{ position: 'absolute', bottom: '32px', right: '8px', fontSize: '12px', opacity: 0.3 }}>🧁</div>
              <div style={{ position: 'absolute', top: '50%', left: '8px', fontSize: '10px', opacity: 0.3 }}>🍞</div>
              <div style={{ position: 'absolute', top: '40%', right: '8px', fontSize: '10px', opacity: 0.3 }}>🍪</div>

              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', paddingLeft: '16px', paddingRight: '16px', height: '100%' }}>
                {/* Header Logo or Name */}
                <h1 style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', opacity: 0.9, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {appSettings.companyName || 'BAKERY & CO.'}
                </h1>

                {/* Passport Photo (With Ornate Frame) */}
                <div style={{ position: 'relative', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', width: '90px', height: '90px', backgroundColor: '#4e342e' }}>
                   <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#faeddb', clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}></div>
                   <div style={{ position: 'absolute', top: '3px', right: '3px', bottom: '3px', left: '3px', backgroundColor: '#4e342e', clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}></div>
                   <div style={{ width: '78px', height: '78px', position: 'relative', zIndex: 20, overflow: 'hidden', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}>
                    {customer.image ? (
                      <img src={customer.image} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '9px', textAlign: 'center', padding: '0 8px', lineHeight: 1.2 }}>No Photo</span>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ textAlign: 'center', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '8px' }}>
                  <h2 style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: '20px', lineHeight: 1.2, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', padding: '0 4px' }}>{customer.name}</h2>
                  <p style={{ fontWeight: 'bold', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.8 }}>Job Position / Partner</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '12px', opacity: 0.6 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4e342e' }}></div>
                    <div style={{ width: '32px', height: '1px', backgroundColor: '#4e342e' }}></div>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4e342e' }}></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', opacity: 0.8 }}>ID: CUST-{customer.id.slice(-5)}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div style={{ height: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', borderTop: '1px solid rgba(78, 52, 46, 0.2)' }}>
                    <span style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Valid & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border-color)] w-full no-print my-16" />

        {/* CERTIFICATE SECTION */}
        <section style={{ width: '100%', paddingBottom: '40px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Certificate of Partnership</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Premium Landscape A4</p>
            </div>
            <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }} onClick={() => handleShare(certRef, `${customer.name}-Certificate`)}>
              <Share2 size={16} /> Save / Share
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', paddingBottom: '16px', width: '100%' }} className="hide-scrollbar">
            {/* Certificate Container (A4 Landscape aspect ratio) */}
            <div 
              ref={certRef}
              className="cert-print"
              style={{ 
                width: '800px', 
                height: '565px', 
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: 'black',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                flexShrink: 0
              }}
            >
              {/* Modern Minimalist Border Frame */}
              <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#f8fafc' }}>
                <div style={{ width: '100%', height: '100%', border: '1px solid #e2e8f0', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '4px' }}>
                  <div style={{ width: '100%', height: '100%', border: '3px solid #1e293b', padding: '32px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Subtle background abstract shapes */}
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '400px', height: '400px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '400px', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '300px', height: '300px', backgroundColor: '#f8fafc', borderTopRightRadius: '300px', zIndex: 0 }}></div>

                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Header row with Logos */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        {appSettings.logo ? (
                          <img src={appSettings.logo} alt="Company Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>LOGO</div>
                        )}
                        
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                           <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{appSettings.companyName || 'BREAD APP'}</h3>
                           <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Official Document</p>
                        </div>
                      </div>

                      {/* Main Title Area */}
                      <div style={{ textAlign: 'center', marginTop: '32px', marginBottom: '40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                           <Award size={48} strokeWidth={1} color="#1e293b" />
                        </div>
                        
                        <h1 style={{ fontSize: '34px', fontFamily: 'serif', fontWeight: 500, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1, marginBottom: '16px' }}>
                          CERTIFICATE OF PARTNERSHIP
                        </h1>
                        <div style={{ width: '48px', height: '2px', backgroundColor: 'var(--primary-color, #3b82f6)', margin: '0 auto 32px auto' }}></div>
                        
                        <p style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 500 }}>
                          PROUDLY PRESENTED TO
                        </p>
                        
                        <h2 style={{ fontSize: '40px', fontFamily: 'serif', fontWeight: 'bold', color: '#0f172a', lineHeight: 1, marginBottom: '32px' }}>
                          {customer.name}
                        </h2>
                        
                        <p style={{ fontSize: '13px', color: '#475569', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.625, fontFamily: 'sans-serif' }}>
                          In recognition of your outstanding commitment and continuous trust. You are officially recognized as an authorized distributor and valuable partner of <strong style={{ fontWeight: 'bold' }}>{appSettings.companyName || 'Our Company'}</strong>. We deeply appreciate your business.
                        </p>
                      </div>

                      {/* Footer Signatures */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingLeft: '40px', paddingRight: '40px' }}>
                        <div style={{ textAlign: 'center', width: '160px' }}>
                          <div style={{ borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px', height: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#1e293b', fontFamily: 'monospace' }}>
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date Issued</span>
                        </div>
                        
                        <div style={{ textAlign: 'center', width: '160px' }}>
                          <div style={{ borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px', height: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                             <span style={{ fontFamily: 'cursive', fontStyle: 'italic', fontSize: '20px', color: '#1e293b' }}>Management</span>
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authorized Signature</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .no-print { display: none !important; }
          
          .id-card-print, .cert-print, .id-card-print *, .cert-print * {
            visibility: visible;
          }
          
          .id-card-print {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cert-print {
            position: absolute;
            left: 0;
            top: 4in; /* Space it out from ID card */
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            transform-origin: top left;
          }
          
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerIDAndCert;
