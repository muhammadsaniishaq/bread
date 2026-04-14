import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { ArrowLeft, Share2, Award, ShieldCheck } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import html2canvas from 'html2canvas';
import ReactQRCode from 'react-qr-code';

const QRCode: any = typeof ReactQRCode === 'function' ? ReactQRCode : (ReactQRCode as any).default || ReactQRCode;

const T = {
  bg: '#f8fafc',
  ink: '#0f172a',
  border: 'rgba(0,0,0,0.05)',
  accent: '#6366f1'
};

export const SupplierOfficialDocs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appSettings } = useAppContext();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const serialNumber = profile?.id?.slice(-6).toUpperCase() || 'SUP-000';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      setLoading(true);
      // Fetch full profile and optional customer link
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: cData } = await supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
      
      if (pData) {
        setProfile({ ...pData, ...cData });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

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
    
    setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [loading, profile]);

  const handleShare = async (ref: React.RefObject<HTMLDivElement | null>, filename: string, isCert = false) => {
    if (!ref.current) return;
    if (isCert && certScaleWrapperRef.current) certScaleWrapperRef.current.style.transform = 'scale(1)';

    try {
      const canvas = await html2canvas(ref.current, { scale: 3, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${filename}.png`, { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({ title: filename, files: [file] });
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
    } finally {
      if (isCert && certScaleWrapperRef.current) certScaleWrapperRef.current.style.transform = `scale(${certScale})`;
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontWeight: 900, background: '#f8fafc', color: T.accent }}>VERIFYING CREDENTIALS...</div>;

  if (!profile) return null;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', sans-serif" }}>
        
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
           <button onClick={() => navigate('/supplier')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
             <ArrowLeft size={24} color={T.ink} />
           </button>
           <div>
             <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>Partner Documents</h1>
             <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>Supplier Level Verified</div>
           </div>
        </div>

        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
          
          {/* ID CARD SECTION */}
          <section style={{ width: '100%', maxWidth: '384px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>Partner ID Card</h2>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Digital Validation Badge</p>
              </div>
              <button onClick={() => handleShare(idCardRef, `Supplier-ID-${profile.full_name}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: T.accent, color: '#fff', borderRadius: '10px', fontWeight: 800, fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', cursor: 'pointer' }}>
                <Share2 size={16} /> Save
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div 
                ref={idCardRef}
                style={{ 
                  width: '240px', 
                  height: '380px', 
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
                  color: '#fff', 
                  borderRadius: '20px',
                  boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', filter: 'blur(30px)' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', filter: 'blur(20px)' }}></div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', zIndex: 10 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
                      <ShieldCheck size={18} color="#10b981" />
                      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{appSettings?.companyName || 'BAKERY PARTNER'}</span>
                   </div>

                   <div style={{ width: '100px', height: '100px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', padding: '4px', marginBottom: '16px' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {profile.image ? <img src={profile.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Award size={40} color="rgba(255,255,255,0.2)" />}
                      </div>
                   </div>

                   <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '2px', letterSpacing: '-0.01em' }}>{profile.full_name || profile.name}</h2>
                      <div style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Authorized Supplier</div>
                   </div>

                   <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ID Number</span>
                         <span style={{ fontSize: '9px', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{serialNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</span>
                         <span style={{ fontSize: '9px', fontWeight: 800, color: '#10b981' }}>VERIFIED</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                         <div style={{ background: '#fff', padding: '4px', borderRadius: '8px' }}>
                            <QRCode value={profile.id} size={50} level="M" />
                         </div>
                      </div>
                   </div>
                </div>

                <div style={{ background: T.accent, padding: '8px', textAlign: 'center', marginTop: 'auto' }}>
                   <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Bread Cloud ID System</span>
                </div>
              </div>
            </div>
          </section>

          {/* PARTNERSHIP CERTIFICATE */}
          <section style={{ width: '100%', maxWidth: '800px' }} ref={certContainerRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>Partnership Certificate</h2>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>High-Fidelity Partner Accreditation</p>
              </div>
              <button onClick={() => handleShare(certRef, `Supplier-Cert-${profile.full_name}`, true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#10b981', color: '#fff', borderRadius: '10px', fontWeight: 800, fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', cursor: 'pointer' }}>
                <Share2 size={16} /> Save
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
              <div style={{ width: `${800 * certScale}px`, height: `${560 * certScale}px`, position: 'relative' }}>
                <div ref={certScaleWrapperRef} style={{ transform: `scale(${certScale})`, transformOrigin: 'top left', width: '800px', height: '560px' }}>
                   <div ref={certRef} style={{ width: '800px', height: '560px', background: '#fff', padding: '10px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                      <div style={{ width: '100%', height: '100%', border: '8px double #1e1b4b', padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         
                         {/* Watermark logo */}
                         {appSettings?.logo && (
                           <img src={appSettings.logo} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', opacity: 0.03, pointerEvents: 'none' }} />
                         )}

                         <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <Award size={64} color="#1e1b4b" strokeWidth={1} style={{ marginBottom: '16px' }} />
                            <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#1e1b4b', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>Certificate of Partnership</h1>
                            <div style={{ width: '100px', height: '3px', background: '#10b981', margin: '16px auto' }}></div>
                         </div>

                         <p style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '20px 0' }}>This serves to certify that</p>
                         <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#0f172a', margin: '0 0 24px', textAlign: 'center' }}>{profile.full_name || profile.name}</h2>
                         
                         <p style={{ fontSize: '15px', color: '#475569', textAlign: 'center', maxWidth: '600px', lineHeight: 1.6, marginBottom: '48px' }}>
                            Has been officially recognized as an <strong>Authorized Distribution Partner</strong>. 
                            Through exceptional performance and dedication to service excellence, this partner plays 
                            a vital role in our logistics ecosystem.
                         </p>

                         <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 'auto', paddingLeft: '80px', paddingRight: '80px' }}>
                            <div style={{ textAlign: 'center' }}>
                               <div style={{ borderBottom: '2px solid #1e1b4b', width: '180px', paddingBottom: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b4b', fontFamily: 'monospace' }}>{new Date().toLocaleDateString()}</span>
                               </div>
                               <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Date of Issuance</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                               <div style={{ borderBottom: '2px solid #1e1b4b', width: '180px', paddingBottom: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '18px', fontStyle: 'italic', fontWeight: 800, color: '#1e1b4b' }}>Management</span>
                               </div>
                               <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Authorized Signature</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default SupplierOfficialDocs;
