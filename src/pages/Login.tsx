import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Mail, KeyRound, ChevronRight, UserPlus, Send } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { user } = useAuth();
  const { appSettings } = useAppContext();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setNeedsConfirmation(true);
          }
          throw error;
        }
      } else {
        // First user signed up should become MANAGER to preserve owner rights
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              role: 'CUSTOMER' 
            }
          }
        });
        if (error) throw error;
        setErrorMsg('Success! Logging you in shortly...');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setErrorMsg('Confirmation email resent! Please check your inbox including spam folder.');
      setNeedsConfirmation(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex flex-col items-center justify-center">
      <div className="login-bg-shape shape-top-right"></div>
      <div className="login-bg-shape shape-bottom-left"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-content w-full flex flex-col items-center z-10"
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
          {appSettings?.companyName || 'THE BEST SPECIAL BREAD'}
        </h1>
        <p className="text-center text-secondary mb-8 font-medium">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>
        
        <form onSubmit={handleSubmit} className="login-form w-full">
          <div className="form-group mb-4 relative">
            <div className="input-icon text-secondary">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              className="form-input login-input" 
              placeholder="Email Address" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group mb-6 relative">
            <div className="input-icon text-secondary">
              <KeyRound size={18} />
            </div>
            <input 
              type="password" 
              className="form-input login-input" 
              placeholder="Password (min 6 chars)" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>
          
          {errorMsg && <p className="text-danger text-sm mb-4 text-center font-bold px-4">{errorMsg}</p>}
          
          {needsConfirmation && (
            <button 
              type="button" 
              onClick={handleResend}
              disabled={loading} 
              className="btn btn-outline w-full flex items-center justify-center gap-2 mb-4 border-primary text-primary"
            >
              <Send size={18} /> Resend Confirmation Email
            </button>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2 login-btn">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')} <ChevronRight size={18} />
          </button>
        </form>

        <button 
          onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setNeedsConfirmation(false); }}
          className="mt-6 text-primary text-sm font-bold flex items-center gap-2 hover:underline z-10"
        >
          {isLogin ? <><UserPlus size={16}/> Need an account? Sign Up</> : 'Already have an account? Sign In'}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
