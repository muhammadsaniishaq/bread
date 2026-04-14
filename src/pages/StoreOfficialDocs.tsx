import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { ArrowLeft, Award, ShieldCheck } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import html2canvas from 'html2canvas';

const T = {
  bg: '#f8fafc',
  ink: '#0f172a',
  border: 'rgba(0,0,0,0.05)',
  accent: '#2563eb'
};

export const StoreOfficialDocs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {  } = useAppContext();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const serialNumber = profile?.id?.slice(-6).toUpperCase() || 'SK-000';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const idCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
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
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontWeight: 900, background: '#f8fafc', color: T.accent }}>VALIDATING...</div>;

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', sans-serif" }}>
        
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253, 253, 253, 0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
           <button onClick={() => navigate('/store/more')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
             <ArrowLeft size={24} color={T.ink} />
           </button>
           <div>
             <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: T.ink, letterSpacing: '-0.02em' }}>Staff Identity</h1>
             <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, textTransform: 'uppercase' }}>Official Employee Badge</div>
           </div>
        </div>

        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
           
           <div style={{ width: '100%', maxWidth: '384px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: T.ink }}>Staff ID Card</h2>
                <button onClick={() => handleShare(idCardRef, `Staff-ID-${profile?.full_name}`)} style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                   Save Badge
                </button>
             </div>

             <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div ref={idCardRef} style={{ width: '280px', height: '180px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', borderRadius: '16px', padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                   <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '140px', height: '140px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                   
                   <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 10 }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                         {profile?.image ? <img src={profile.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Award size={32} style={{ margin: '24px auto', opacity: 0.3 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Employee</div>
                         <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>{profile?.full_name}</div>
                         <div style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{profile?.role || 'Staff'}</div>
                         <div style={{ marginTop: '12px', fontSize: '9px', opacity: 0.6, fontFamily: 'monospace' }}>ID: {serialNumber}</div>
                      </div>
                   </div>

                   <div style={{ position: 'absolute', bottom: '16px', right: '16px', textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Bakery System</div>
                      <ShieldCheck size={20} color="#10b981" />
                   </div>
                </div>
             </div>
           </div>

           <div style={{ textAlign: 'center', maxWidth: '300px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>This is your official digital badge. You can present this to verified partners to confirm your role within the system.</p>
           </div>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default StoreOfficialDocs;
