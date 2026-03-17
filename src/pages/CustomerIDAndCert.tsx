import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Share2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import QRCodeImport from 'react-qr-code';

const QRCode = (QRCodeImport as any).default || QRCodeImport;

export const CustomerIDAndCert: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, appSettings } = useAppContext();
  
  const customerIndex = customers.findIndex(c => c.id === id);
  const customer = customerIndex !== -1 ? customers[customerIndex] : undefined;
  // Calculate sequential serial number (1-based index)
  const serialNumber = customerIndex !== -1 ? (customerIndex + 1).toString().padStart(6, '0') : '000000';

  const idCardRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const certContainerRef = useRef<HTMLDivElement>(null);
  const certScaleWrapperRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (certContainerRef.current) {
        const containerWidth = certContainerRef.current.offsetWidth;
        if (containerWidth < 832) {
          setCertScale((containerWidth - 32) / 800);
        } else {
          setCertScale(1);
        }
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  if (!customer) {
    return (
      <div className="container p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Customer Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/customers')}>Back to Customers</button>
      </div>
    );
  }

  const handleShare = async (ref: React.RefObject<HTMLDivElement | null>, filename: string, isCert = false) => {
    if (!ref.current) return;
    
    // Temporarily reset scale for high-res capture
    if (isCert && certScaleWrapperRef.current) {
        certScaleWrapperRef.current.style.transform = 'scale(1)';
    }

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
    } finally {
      // Restore scale
      if (isCert && certScaleWrapperRef.current) {
         certScaleWrapperRef.current.style.transform = `scale(${certScale})`;
      }
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
              {/* Bakery Decor Accents */}
              <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', opacity: 0.3 }}>🥐</div>
              <div style={{ position: 'absolute', top: '40px', right: '12px', fontSize: '12px', opacity: 0.3 }}>🥖</div>
              <div style={{ position: 'absolute', bottom: '64px', left: '12px', fontSize: '10px', opacity: 0.3 }}>🥨</div>
              <div style={{ position: 'absolute', bottom: '32px', right: '8px', fontSize: '12px', opacity: 0.3 }}>🧁</div>
              <div style={{ position: 'absolute', top: '50%', left: '8px', fontSize: '10px', opacity: 0.3 }}>🍞</div>
              <div style={{ position: 'absolute', top: '40%', right: '8px', fontSize: '10px', opacity: 0.3 }}>🍪</div>

              {/* ID Card Watermark Logo */}
              {appSettings.logo && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
                   <img src={appSettings.logo} alt="Watermark" style={{ width: '130px', height: '130px', objectFit: 'contain' }} />
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px', height: '100%' }}>
                {/* Header Logo or Name */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                  {appSettings.logo && (
                    <img src={appSettings.logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', marginBottom: '4px' }} />
                  )}
                  <h1 style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appSettings.companyName || 'BAKERY & CO.'}
                  </h1>
                </div>

                {/* Passport Photo */}
                <div style={{ position: 'relative', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', width: '82px', height: '82px', backgroundColor: '#4e342e' }}>
                   <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#faeddb', clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}></div>
                   <div style={{ position: 'absolute', top: '3px', right: '3px', bottom: '3px', left: '3px', backgroundColor: '#4e342e', clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}></div>
                   <div style={{ width: '72px', height: '72px', position: 'relative', zIndex: 20, overflow: 'hidden', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}>
                    {customer.image ? (
                      <img src={customer.image} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '9px', textAlign: 'center', padding: '0 8px', lineHeight: 1.2 }}>No Photo</span>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{ textAlign: 'center', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '2px' }}>
                  <h2 style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: '15px', lineHeight: 1.1, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', padding: '0 4px' }}>{customer.name}</h2>
                  <p style={{ fontWeight: 'bold', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.8 }}>Job Position / Partner</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px', opacity: 0.6 }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#4e342e' }}></div>
                    <div style={{ width: '24px', height: '1px', backgroundColor: '#4e342e' }}></div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#4e342e' }}></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 8px', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(78,52,46,0.1)', paddingBottom: '2px' }}>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', opacity: 0.6 }}>S/N:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '8px', fontWeight: 'bold', color: '#4e342e' }}>{serialNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(78,52,46,0.1)', paddingBottom: '2px' }}>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', opacity: 0.6 }}>Phone:</span>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#4e342e' }}>{customer.phone || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(78,52,46,0.1)', paddingBottom: '2px' }}>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', opacity: 0.6 }}>Address:</span>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#4e342e', textAlign: 'right', maxWidth: '60px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.location || 'Local Customer'}</span>
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: '2px', borderRadius: '4px', border: '1px solid rgba(78,52,46,0.2)' }}>
                      <QRCode value={customer.id} size={36} level="L" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div style={{ height: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', borderTop: '1px solid rgba(78, 52, 46, 0.2)' }}>
                  <span style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Valid & Verified</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border-color)] w-full no-print my-16" />

        {/* CERTIFICATE SECTION */}
        <section style={{ width: '100%', paddingBottom: '40px' }} ref={certContainerRef}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Certificate of Partnership</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Premium Landscape A4</p>
            </div>
            <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }} onClick={() => handleShare(certRef, `${customer.name}-Certificate`, true)}>
              <Share2 size={16} /> Save / Share
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px', width: '100%' }}>
            {/* Certificate Scale Wrapper */}
            <div style={{ 
               width: `${800 * certScale}px`, 
               height: `${565 * certScale}px`, 
               position: 'relative', 
               overflow: 'visible' 
            }}>
              <div 
                ref={certScaleWrapperRef}
                style={{
                  transform: `scale(${certScale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '800px', 
                  height: '565px',
                  zIndex: 20
                }}
              >
                <div 
                  ref={certRef}
                  className="cert-print"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    color: 'black',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {/* Modern Minimalist Border Frame */}
                  <div style={{ width: '100%', height: '100%', padding: '24px', backgroundColor: '#f8fafc' }}>
                    <div style={{ width: '100%', height: '100%', border: '1px solid #e2e8f0', backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '4px' }}>
                      <div style={{ width: '100%', height: '100%', border: '3px solid #1e293b', padding: '32px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                        
                        {/* Subtle background abstract shapes */}
                        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '400px', height: '400px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '400px', zIndex: 0 }}></div>
                        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '300px', height: '300px', backgroundColor: '#f8fafc', borderTopRightRadius: '300px', zIndex: 0 }}></div>

                        {/* Large Watermark Logo */}
                        {appSettings.logo && (
                          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
                             <img src={appSettings.logo} alt="Watermark" style={{ width: '350px', height: '350px', objectFit: 'contain' }} />
                          </div>
                        )}

                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Header row with Logos */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        {appSettings.logo ? (
                          <img src={appSettings.logo} alt="Company Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>LOGO</div>
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
                        
                        <h2 style={{ fontSize: '32px', fontFamily: 'serif', fontWeight: 'bold', color: '#0f172a', lineHeight: 1, marginBottom: '32px' }}>
                          {customer.name}
                        </h2>
                        
                        <p style={{ fontSize: '13px', color: '#475569', maxWidth: '36rem', margin: '0 auto', lineHeight: 1.625, fontFamily: 'sans-serif' }}>
                          In recognition of your outstanding commitment and continuous trust. You are officially recognized as an authorized distributor and valuable partner of <strong style={{ fontWeight: 'bold' }}>{appSettings.companyName || 'Our Company'}</strong>. We deeply appreciate your business.
                        </p>
                      </div>

                      {/* Footer Signatures */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingLeft: '40px', paddingRight: '40px', paddingBottom: '20px' }}>
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
