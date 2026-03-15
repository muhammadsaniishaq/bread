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
        <div className="flex gap-2">
           {/* Mobile view standard buttons hidden, relying on individual section actions */}
        </div>
      </div>

      <div className="space-y-12">
        {/* ID CARD SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className="text-lg font-bold">ID Card</h2>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-outline text-primary border-primary flex items-center gap-1" onClick={() => handleShare(idCardRef, `${customer.name}-ID`)}>
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
          
          <div className="flex justify-center overflow-x-auto pb-4 hide-scrollbar">
            {/* ID Card Container */}
            <div 
              ref={idCardRef}
              className="bg-white text-black rounded-xl shadow-xl relative overflow-hidden flex flex-col printable-area id-card-print"
              style={{ width: '3.375in', height: '2.125in', flexShrink: 0, fontFamily: 'sans-serif' }}
            >
              {/* Header / Brand Color */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-primary flex items-center justify-center px-4">
                <h1 className="text-white font-bold text-sm tracking-widest uppercase">
                  {appSettings.companyName || 'BREAD APP'}
                </h1>
              </div>

              {/* Body */}
              <div className="flex-1 mt-10 p-3 pt-4 flex gap-3">
                {/* Photo */}
                <div className="w-[1.2in] h-[1.2in] flex-shrink-0 border-2 border-primary rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {customer.image ? (
                    <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center px-2">No Photo provided</span>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Customer Name</div>
                  <div className="font-bold text-sm leading-tight mb-2 text-primary">{customer.name}</div>
                  
                  <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">ID Number</div>
                  <div className="font-mono text-xs font-bold leading-tight mb-2">CUST-{customer.id.slice(-5)}</div>
                  
                  <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Phone</div>
                  <div className="text-xs font-bold leading-tight">{customer.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Footer Banner */}
              <div className="h-4 bg-gray-800 absolute bottom-0 left-0 right-0 flex justify-between items-center px-3">
                 <span className="text-[7px] text-gray-300">AUTHORIZED DISTRIBUTOR</span>
                 <span className="text-[7px] text-gray-300">valuable partner</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border-color)] no-print" />

        {/* CERTIFICATE SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className="text-lg font-bold">Certificate of Partnership</h2>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-outline text-primary border-primary flex items-center gap-1" onClick={() => handleShare(certRef, `${customer.name}-Certificate`)}>
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
          
          <div className="flex justify-center overflow-x-auto pb-4 hide-scrollbar">
            {/* Certificate Container */}
            <div 
              ref={certRef}
              className="bg-white text-black p-2 shadow-2xl printable-area cert-print relative flex-shrink-0"
              style={{ width: '11in', height: '8.5in', maxWidth: '800px', maxHeight: '600px', boxSizing: 'border-box' }}
            >
              {/* Outer Border */}
              <div className="w-full h-full border-[6px] border-[#c5a059] p-1 flex flex-col relative overflow-hidden bg-[#faf9f6]">
                {/* Inner Border */}
                <div className="w-full h-full border-2 border-[#1e293b] p-8 flex flex-col items-center justify-between relative z-10">
                  
                  {/* Watermark Logo */}
                  {appSettings.logo && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] z-0 pointer-events-none">
                       <img src={appSettings.logo} alt="Watermark" className="w-96 h-96 object-contain" />
                    </div>
                  )}

                  <div className="text-center z-10 w-full">
                    {appSettings.logo && (
                      <img src={appSettings.logo} alt="Company Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
                    )}
                    <h1 className="text-4xl font-serif font-bold text-[#1e293b] mb-2 tracking-wide uppercase">
                      Certificate of Partnership
                    </h1>
                    <div className="w-32 h-1 bg-[#c5a059] mx-auto mb-8"></div>
                    
                    <p className="text-lg italic text-gray-600 mb-6 font-serif">
                      This certificate is proudly presented to
                    </p>
                    
                    <h2 className="text-5xl font-bold text-primary mb-6 font-serif underline decoration-[3px] underline-offset-8 decoration-[#c5a059]">
                      {customer.name}
                    </h2>
                    
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mt-8 font-serif">
                      In recognition of outstanding commitment, trust, and continuous engagement as an authorized distributor and valuable partner of <strong>{appSettings.companyName || 'Our Bakery'}</strong>. We deeply appreciate your business.
                    </p>
                  </div>

                  <div className="w-full flex justify-between items-end px-12 z-10 mt-12 pb-8">
                    <div className="text-center w-48">
                      <div className="border-b border-gray-400 mb-2 h-8 flex items-end justify-center font-bold text-sm">
                        {new Date().toLocaleDateString()}
                      </div>
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Date</span>
                    </div>

                    <div className="flex flex-col items-center">
                       <Award size={64} className="text-[#c5a059] mb-2 drop-shadow-md" strokeWidth={1.5} />
                       <span className="text-[10px] font-bold tracking-widest text-[#1e293b] uppercase">Official Partner</span>
                    </div>
                    
                    <div className="text-center w-48">
                      <div className="border-b border-gray-400 mb-2 h-8 whitespace-nowrap">
                         <span className="font-[signature] italic text-xl">Management</span>
                      </div>
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Authorized Signature</span>
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
          
          /* Need to handle whichever area is currently being printed.
             Because window.print() prints the whole page, we might need a workaround for two different printable areas, 
             but typically users will share/save as image individually. This basic CSS shows both sequentially if printed. */
             
          .printable-area, .printable-area * {
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
            top: 2.5in;
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
