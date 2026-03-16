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
        <section className="w-full max-w-sm">
          <div className="flex justify-between items-center mb-4 no-print">
            <div>
              <h2 className="text-lg font-bold">Official ID Card</h2>
              <p className="text-xs text-secondary">Modern Badge Design</p>
            </div>
            <button className="btn btn-sm btn-primary flex items-center gap-2 shadow-sm" onClick={() => handleShare(idCardRef, `${customer.name}-ID`)}>
              <Share2 size={16} /> Save / Share
            </button>
          </div>
          
          <div className="flex justify-center hide-scrollbar">
            {/* Standard Portrait CR80 ID Card (2.125" x 3.375") translated to pixels for reliable crisp rendering (roughly 204px x 324px depending on scale, but let's use fixed safe px) */}
            <div 
              ref={idCardRef}
              className="bg-white rounded-[1rem] shadow-2xl relative overflow-hidden flex flex-col id-card-print"
              style={{ width: '220px', height: '350px', flexShrink: 0, fontFamily: "'Inter', sans-serif" }}
            >
              {/* Premium Top Gradient Header */}
              <div className="h-[120px] bg-gradient-to-br from-primary to-indigo-800 w-full absolute top-0 left-0 z-0">
                 {/* Decorative circles */}
                 <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                 <div className="absolute top-10 -left-6 w-16 h-16 bg-white opacity-10 rounded-full blur-md"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center pt-5 px-4 h-full">
                {/* Header Logo or Name */}
                <h1 className="text-white font-bold text-[10px] tracking-widest uppercase mb-4 opacity-90 text-center w-full truncate">
                  {appSettings.companyName || 'BREAD APP'}
                </h1>

                {/* Passport Photo (Small and Premium) */}
                <div className="w-[80px] h-[80px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 mb-3 z-10">
                  {customer.image ? (
                    <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-[9px] text-center px-2 leading-tight">No Photo</span>
                  )}
                </div>

                {/* Customer Details */}
                <div className="text-center w-full flex-1 flex flex-col justify-center">
                  <h2 className="text-[#101828] font-black text-[15px] leading-tight mb-0.5 truncate w-full px-1">{customer.name}</h2>
                  <p className="text-primary font-bold text-[9px] tracking-widest uppercase mb-3">Authorized Partner</p>
                  
                  <div className="w-8 h-0.5 bg-gray-200 mx-auto mb-3"></div>

                  <div className="flex flex-col gap-1.5 w-full items-center">
                    <div>
                      <div className="text-[7px] text-gray-400 uppercase font-bold tracking-wider">ID Number</div>
                      <div className="font-mono text-[10px] font-bold text-[#344054]">CUST-{customer.id.slice(-5)}</div>
                    </div>
                    <div>
                      <div className="text-[7px] text-gray-400 uppercase font-bold tracking-wider">Phone</div>
                      <div className="text-[9px] font-bold text-[#344054]">{customer.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-6 w-full bg-gray-50 flex items-center justify-center border-t border-gray-100 mt-auto">
                    <span className="text-[6px] text-gray-400 font-bold tracking-widest uppercase">Valid & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border-color)] w-full no-print" />

        {/* CERTIFICATE SECTION */}
        <section className="w-full">
          <div className="flex justify-between items-center mb-4 no-print">
            <div>
              <h2 className="text-lg font-bold">Certificate of Partnership</h2>
              <p className="text-xs text-secondary">Premium Landscape A4</p>
            </div>
            <button className="btn btn-sm btn-primary flex items-center gap-2 shadow-sm" onClick={() => handleShare(certRef, `${customer.name}-Certificate`)}>
              <Share2 size={16} /> Save / Share
            </button>
          </div>
          
          <div className="flex justify-center overflow-x-auto pb-4 hide-scrollbar w-full">
            {/* Certificate Container (A4 Landscape aspect ratio) */}
            <div 
              ref={certRef}
              className="bg-white text-black shadow-2xl cert-print relative flex-shrink-0"
              style={{ width: '800px', height: '565px', boxSizing: 'border-box' }}
            >
              {/* Modern Minimalist Border Frame */}
              <div className="w-full h-full p-6 bg-[#f8fafc]">
                <div className="w-full h-full border-[1px] border-slate-200 bg-white shadow-sm p-1">
                  <div className="w-full h-full border-[3px] border-slate-800 p-8 flex flex-col relative overflow-hidden">
                    
                    {/* Subtle background abstract shapes */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50 rounded-bl-[400px] z-0 -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-50 rounded-tr-[300px] z-0 -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header row with Logos */}
                      <div className="flex justify-between items-start w-full">
                        {appSettings.logo ? (
                          <img src={appSettings.logo} alt="Company Logo" className="w-12 h-12 object-contain" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-400 text-center leading-tight">LOGO</div>
                        )}
                        
                        <div className="text-right flex flex-col items-end">
                           <h3 className="font-bold text-slate-800 text-[10px] tracking-widest uppercase">{appSettings.companyName || 'BREAD APP'}</h3>
                           <p className="text-[8px] text-slate-500 uppercase tracking-widest">Official Document</p>
                        </div>
                      </div>

                      {/* Main Title Area */}
                      <div className="text-center mt-8 mb-10 flex-1 flex flex-col justify-center">
                        <div className="flex justify-center mb-6">
                           <Award size={48} strokeWidth={1} className="text-slate-800" />
                        </div>
                        
                        <h1 className="text-[34px] font-serif font-medium text-slate-900 tracking-tight leading-none mb-4">
                          CERTIFICATE OF PARTNERSHIP
                        </h1>
                        <div className="w-12 h-[2px] bg-primary mx-auto mb-8"></div>
                        
                        <p className="text-[14px] text-slate-500 uppercase tracking-widest mb-4 font-medium">
                          PROUDLY PRESENTED TO
                        </p>
                        
                        <h2 className="text-[40px] font-serif font-bold text-slate-900 leading-none mb-8">
                          {customer.name}
                        </h2>
                        
                        <p className="text-[13px] text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
                          In recognition of your outstanding commitment and continuous trust. You are officially recognized as an authorized distributor and valuable partner of <strong>{appSettings.companyName || 'Our Company'}</strong>. We deeply appreciate your business.
                        </p>
                      </div>

                      {/* Footer Signatures */}
                      <div className="flex justify-between items-end mt-auto px-10">
                        <div className="text-center w-40">
                          <div className="border-b-[1.5px] border-slate-300 pb-1 mb-2 h-8 flex items-end justify-center font-bold text-xs text-slate-800 font-mono">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</span>
                        </div>
                        
                        <div className="text-center w-40">
                          <div className="border-b-[1.5px] border-slate-300 pb-1 mb-2 h-8 flex items-end justify-center">
                             <span className="font-[signature] italic text-xl text-slate-800">Management</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signature</span>
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
