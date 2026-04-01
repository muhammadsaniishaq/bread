import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, KeyRound, ChevronRight, Mail, MapPin, Sparkles, ChefHat, Stars } from 'lucide-react';
import './Login.css';

const T = {
  primary: '#4f46e5',
  ink: '#0f172a',
  txt3: '#94a3b8',
  border: 'rgba(0,0,0,0.06)'
};

export const Login: React.FC = () => {
  const { user, setManualUser } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // SHARED STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // REGISTRATION STATE
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
         if (!email || !password) throw new Error("Please enter your Email or Username and Password.");
         
         const loginInput = email.trim().toLowerCase();
         let finalEmail = loginInput;
         
         // 1. Try Standard Supabase Auth First
         try {
            // Detect if it's a Username and translate it to the real Email
            if (!finalEmail.includes('@')) {
               const { data: realEmail } = await supabase.rpc('get_email_for_username', { lookup_user: finalEmail });
               if (realEmail) finalEmail = realEmail;
            }

            const { error: authErr } = await supabase.auth.signInWithPassword({ 
               email: finalEmail, 
               password 
            });

            if (!authErr) return; // Success! AuthContext handles the redirect
            
            // If it's a "Email not confirmed" error, we still allow fallback check
            // if we want them to bypass email confirmation for manager-created accounts.
         } catch (e) {
            // Standard auth failed, proceed to fallback
         }

         // 2. Fallback: Call Secure Database Bridge (RPC)
         // This bypasses RLS safely to check manager-set credentials
         const { data: legacySession, error: rpcErr } = await supabase.rpc('verify_customer_credentials', { 
            val_input: loginInput,
            val_password: password.trim()
         });

         if (!rpcErr && legacySession) {
            // Success! Create a manual session
            // We use the ACTUAL role returned by the database (MANAGER, SUPPLIER, or CUSTOMER)
            const resolvedRole = (legacySession.role as UserRole) || 'CUSTOMER';

            const manualSession = {
               id: legacySession.id,
               email: legacySession.email,
               user_metadata: { 
                  full_name: legacySession.name, 
                  role: resolvedRole 
               },
               is_manual: true
            } as any;
            
            setManualUser(manualSession, resolvedRole);
            setSuccessMsg('Authentication successful! Welcome back.');
            return;
         }

         throw new Error("Invalid Username/Email or Password. Please try again or contact the manager.");
      } else {
        // Sign Up Flow - Real Email Used Here!
        if (!email || !fullName || !password) {
           throw new Error("Email, Full Name, and Password are required.");
        }

        const normalizedUsername = username ? username.trim().toLowerCase().replace(/\s+/g, '') : email.split('@')[0];

        // --- PRE-SIGNUP: UNIVERSE UNIQUENESS CHECK ---
        const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', { 
           chk_username: normalizedUsername, 
           chk_phone: phone.trim() 
        });
        if (availErr) throw new Error("Verification network error. Please try again.");
        if (avail?.username_taken) throw new Error("Bummer! This Username is already taken.");
        if (avail?.phone_taken) throw new Error("This Phone Number is already registered.");

        const metadata = { 
           role: 'CUSTOMER',
           full_name: fullName.trim(),
           username: normalizedUsername,
           phone: phone.trim(),
           location: address.trim()
        };

        const { error, data } = await supabase.auth.signUp({ 
          email: email.trim().toLowerCase(), 
          password,
          options: { data: metadata }
        });
        
        if (error) throw error;
        
        if (data?.session) {
           setSuccessMsg('Success! Account Created. Welcome to the portal.');
        } else {
           setSuccessMsg('Registration successful! Please check your email for the OTP / Confirmation Link.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT AREA: THE HERO VISUAL (Hidden on Small Screens) */}
      <div className="login-hero-section" style={{ flex: 1, position: 'relative', background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', display: 'flex', flexDirection: 'column', padding: '60px', overflow: 'hidden' }}>
         
         {/* Animated Background Blobs */}
         <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
         <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
         
         {/* Decorative Glass Card */}
         <div style={{ position: 'absolute', top: '20%', right: '10%', width: '280px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(5deg)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={20} color={T.primary} /></div>
               <div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>Verified Bakery</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Premium standard</div>
               </div>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '100%', marginBottom: '8px' }} />
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '60%' }} />
         </div>

         <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {appSettings?.logo ? <img src={appSettings.logo} alt="Company Logo" style={{ width: '40px', height: '40px' }} /> : <ChefHat size={32} color="#fff" />}
               </div>
               <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                  {appSettings?.companyName || 'Bakery Hub'}
               </h1>
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 24px', maxWidth: '500px' }}>
               Supply & Profile Management.
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
               Seamlessly track orders, settle supplier debts securely, and unlock digital rewards with industry-standard encryption.
            </p>
         </div>

         <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '24px', opacity: 0.6, fontSize: '13px', fontWeight: 700, color: '#fff' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Encrypted</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Stars size={14} /> Automated</span>
         </div>
      </div>

      {/* RIGHT AREA: THE GLASS VAULT FORM */}
      <div className="login-form-section" style={{ flex: 1, maxWidth: '600px', display: 'flex', flexDirection: 'column', background: '#ffffff', position: 'relative', zIndex: 20 }}>
         
         <div style={{ flex: 1, padding: '40px 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            <div style={{ marginBottom: '32px' }}>
               <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900, color: T.ink, letterSpacing: '-0.03em' }}>Welcome back</h2>
               <p style={{ margin: 0, fontSize: '14px', color: T.txt3, fontWeight: 500 }}>Please securely authenticate to proceed.</p>
            </div>

            {/* TAB SWITCHER */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '32px', position: 'relative' }}>
               <motion.div animate={{ x: activeTab === 'login' ? 0 : '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ position: 'absolute', top: '6px', bottom: '6px', left: '6px', width: 'calc(50% - 6px)', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
               <button onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 800, color: activeTab === 'login' ? T.ink : T.txt3, background: 'none', border: 'none', cursor: 'pointer', zIndex: 1, transition: 'color 0.2s' }}>Sign In</button>
               <button onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 800, color: activeTab === 'register' ? T.ink : T.txt3, background: 'none', border: 'none', cursor: 'pointer', zIndex: 1, transition: 'color 0.2s' }}>Create Account</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <AnimatePresence mode="wait">
                 {activeTab === 'login' ? (
                   <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="login-input-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Email or Username</label>
                        <div style={{ position: 'relative' }}>
                           <Mail size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: T.txt3 }} />
                           <input type="text" placeholder="name@email.com or @alias" value={email} onChange={e => setEmail(e.target.value)} required 
                             style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary, transition: 'all 0.2s' }} />
                        </div>
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="login-input-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Full Name *</label>
                        <div style={{ position: 'relative' }}>
                           <User size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: T.txt3 }} />
                           <input type="text" placeholder="First & Last Name" value={fullName} onChange={e => setFullName(e.target.value)} required 
                             style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary, transition: 'all 0.2s' }} />
                        </div>
                      </div>

                      <div className="login-input-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Email Address (Required for OTP) *</label>
                        <div style={{ position: 'relative' }}>
                           <Mail size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: T.txt3 }} />
                           <input type="email" placeholder="Secure Email for Login" value={email} onChange={e => setEmail(e.target.value)} required 
                             style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary, transition: 'all 0.2s' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                         <div className="login-input-group">
                           <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Username</label>
                           <input type="text" placeholder="@alias" value={username} onChange={e => setUsername(e.target.value)} 
                             style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary }} />
                         </div>
                         <div className="login-input-group">
                           <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Phone</label>
                           <input type="tel" placeholder="080..." value={phone} onChange={e => setPhone(e.target.value)} 
                             style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary }} />
                         </div>
                      </div>

                      <div className="login-input-group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Delivery Address</label>
                        <div style={{ position: 'relative' }}>
                           <MapPin size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: T.txt3 }} />
                           <input type="text" placeholder="Current address..." value={address} onChange={e => setAddress(e.target.value)} 
                             style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary, transition: 'all 0.2s' }} />
                        </div>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* PASSWORD INPUT SHARED */}
               <div className="login-input-group">
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password *</label>
                    {activeTab === 'login' && <button type="button" style={{ background: 'none', border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Reset?</button>}
                 </div>
                 <div style={{ position: 'relative' }}>
                    <KeyRound size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: T.txt3 }} />
                    <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '16px', border: `2px solid ${T.border}`, background: '#f8fafc', fontSize: '14px', fontWeight: 600, color: T.ink, outlineColor: T.primary, transition: 'all 0.2s' }} />
                 </div>
               </div>

               <AnimatePresence>
                 {errorMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', fontWeight: 700, border: '1px solid #fecaca', textAlign: 'center' }}>{errorMsg}</motion.div>}
                 {successMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', fontSize: '12px', fontWeight: 700, border: '1px solid #a7f3d0', textAlign: 'center' }}>{successMsg}</motion.div>}
               </AnimatePresence>

               <button type="submit" disabled={loading} 
                  style={{ marginTop: '16px', padding: '18px', borderRadius: '20px', background: T.primary, color: '#fff', border: 'none', fontWeight: 900, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)', cursor: 'pointer', transition: 'all 0.2s' }}>
                 {loading ? 'Authenticating...' : (activeTab === 'login' ? 'Secure Login' : 'Create Customer Account')} <ChevronRight size={18} />
               </button>

            </form>
         </div>

         <div style={{ textAlign: 'center', padding: '24px', borderTop: `1px solid ${T.border}`, color: T.txt3, fontSize: '12px', fontWeight: 600 }}>
            Powered by Hub Encrypted Systems
         </div>

      </div>

      {/* GLOBAL CSS FOR MEDIA QUERIES */}
      <style>{`
         @media (max-width: 900px) {
            .login-hero-section { display: none !important; }
            .login-form-section { max-width: 100% !important; border-radius: 0 !important; }
         }
      `}</style>
    </div>
  );
};

export default Login;
