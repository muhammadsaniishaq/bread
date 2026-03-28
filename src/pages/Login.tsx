import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, KeyRound, ChevronRight, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { user } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  
  // LOGIN STATE
  const [loginId, setLoginId] = useState(''); // Handles both username and email

  // REGISTRATION STATE
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // SHARED STATE
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // ALIAS CONVERTER: If they type 'sani', we treat it as 'sani@hub.local'
  const getFormattedIdentity = (id: string) => {
     const clean = id.trim().toLowerCase();
     if (!clean.includes('@')) {
        return `${clean.replace(/\s+/g, '')}@hub.local`;
     }
     return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const finalEmail = getFormattedIdentity(loginId);
        const { error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
        if (error) throw error;
      } else {
        // Sign Up Flow
        if (!regUsername || !regFullName || !password) {
           throw new Error("Please fill in all required fields.");
        }

        const usernameFormatted = regUsername.trim().toLowerCase().replace(/\s+/g, '');
        const finalAuthEmail = `${usernameFormatted}@hub.local`;

        const metadata = { 
           role: 'CUSTOMER',
           full_name: regFullName,
           username: usernameFormatted,
           contact_email: regEmail,
           phone: regPhone,
           location: regAddress
        };

        const { error } = await supabase.auth.signUp({ 
          email: finalAuthEmail, 
          password,
          options: { data: metadata }
        });
        
        if (error) throw error;
        setErrorMsg('Success! Logging you in shortly...');
      }
    } catch (err: any) {
      // Clean up Supabase's strict email error message if they typed a username
      let publicMsg = err.message || 'Authentication failed';
      if (publicMsg.toLowerCase().includes('invalid login credentials')) {
         publicMsg = 'Incorrect Username or Password.';
      }
      setErrorMsg(publicMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex flex-col items-center justify-center" style={{ padding: '20px' }}>
      <div className="login-bg-shape shape-top-right"></div>
      <div className="login-bg-shape shape-bottom-left"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-content w-full flex flex-col items-center z-10"
        style={{ maxWidth: '400px', padding: '30px 24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
          className="login-icon-wrapper flex items-center justify-center mb-4 text-primary overflow-hidden bg-surface"
        >
          {appSettings?.logo ? (
            <img src={appSettings.logo} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <Lock size={20} />
          )}
        </motion.div>
        
        <h1 className="text-center mb-2 login-title" style={{color: 'var(--text-primary)'}}>
          {appSettings?.companyName || 'BAKERY HUB'}
        </h1>
        <p className="text-center text-secondary mb-6 font-medium" style={{ fontSize: '13px' }}>
          {isLogin ? 'Sign in with Username or Email' : 'Create your member account'}
        </p>
        
        <form onSubmit={handleSubmit} className="login-form w-full">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="form-group mb-4 relative">
                   <div className="input-icon text-secondary"><User size={18} /></div>
                   <input type="text" className="form-input login-input" placeholder="Username or Email" value={loginId} onChange={e => setLoginId(e.target.value)} required />
                 </div>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                 
                 <div className="form-group relative">
                   <div className="input-icon text-secondary"><User size={18} /></div>
                   <input type="text" className="form-input login-input" placeholder="Full Name (E.g. Musa Sani)" value={regFullName} onChange={e => setRegFullName(e.target.value)} required />
                 </div>

                 <div className="form-group relative">
                   <div className="input-icon text-secondary"><User size={18} style={{color: '#4f46e5'}} /></div>
                   <input type="text" className="form-input login-input" placeholder="Username (Required for Login)" value={regUsername} onChange={e => setRegUsername(e.target.value)} required />
                 </div>

                 <div className="form-group relative">
                   <div className="input-icon text-secondary"><Phone size={18} /></div>
                   <input type="text" className="form-input login-input" placeholder="Phone Number" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                 </div>

                 <div className="form-group relative">
                   <div className="input-icon text-secondary"><MapPin size={18} /></div>
                   <input type="text" className="form-input login-input" placeholder="Delivery Address" value={regAddress} onChange={e => setRegAddress(e.target.value)} required />
                 </div>

                 <div className="form-group relative">
                   <div className="input-icon text-secondary"><Mail size={18} /></div>
                   <input type="email" className="form-input login-input" placeholder="Email (Optional)" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                 </div>

              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group mb-6 relative">
            <div className="input-icon text-secondary"><KeyRound size={18} /></div>
            <input type="password" className="form-input login-input" placeholder="Password (Min 6 Chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          
          {errorMsg && <p className="text-danger text-sm mb-4 text-center font-bold px-4">{errorMsg}</p>}

          {!isLogin && (
            <p className="text-secondary text-xs mb-4 text-center px-4" style={{lineHeight: 1.4}}>
              By registering, you agree to secure your username. Your username will be permanently locked after creation.
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2 login-btn">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')} <ChevronRight size={18} />
          </button>
        </form>

        <button 
          onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setPassword(''); }}
          className="mt-6 text-primary text-sm font-bold flex items-center gap-2 hover:underline z-10"
        >
          {isLogin ? <><UserPlus size={16}/> Need an account? Sign Up</> : 'Already have an account? Sign In'}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
