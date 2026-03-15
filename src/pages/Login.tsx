import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, Mail, KeyRound, ChevronRight } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { login, isAuthenticated, appSettings } = useAppContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(() => {
    return localStorage.getItem('emailLoginRemembered') === 'true' ? 2 : 1;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credError, setCredError] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step === 2 && pin.length === 4) {
      const success = login(pin);
      if (!success) {
        setPinError(true);
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 500);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [pin, login, step, navigate]);

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = appSettings?.adminEmail || 'muhammadsaniiyaku3@gmail.com';
    const targetPassword = appSettings?.adminPassword || '12,Abumafhal';
    
    if (email.toLowerCase().trim() === targetEmail.toLowerCase() && password === targetPassword) {
      setCredError('');
      localStorage.setItem('emailLoginRemembered', 'true');
      setStep(2);
    } else {
      setCredError('Invalid email or password');
    }
  };

  const handleNumpad = (num: string) => {
    if (pin.length < 4 && !pinError) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    if (!pinError) setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="login-container flex flex-col items-center justify-center">
      {/* Premium Background Blurs */}
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
          className="login-icon-wrapper flex items-center justify-center mb-4 text-primary overflow-hidden"
        >
          {appSettings?.logo ? (
            <img src={appSettings.logo} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <Lock size={20} />
          )}
        </motion.div>
        
        <h1 className="text-center mb-2 login-title">
          {appSettings?.companyName || 'BreadApp'}
        </h1>
        <p className="text-center text-secondary mb-8 font-medium">
          {step === 1 ? 'Sign in to your account' : 'Enter Master PIN to continue'}
        </p>
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCredentialSubmit}
              className="login-form w-full"
            >
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
                  placeholder="Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
              
              {credError && <p className="text-danger text-sm mb-4 text-center font-bold">{credError}</p>}
              
              <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2 login-btn">
                Continue <ChevronRight size={18} />
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="login-pin-card w-full flex flex-col items-center"
            >
              <div className="login-card-bg shape-top-left"></div>
              <div className="login-card-bg shape-bottom-right"></div>
              
              {/* PIN Dots */}
              <motion.div 
                className="flex justify-center gap-4 mb-8 items-center z-10 pin-dots-container"
                animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {[0, 1, 2, 3].map(i => {
                  const isFilled = pin.length > i;
                  return (
                    <motion.div 
                      key={i}
                      initial={false}
                      animate={{ 
                        scale: isFilled ? 1.2 : 1,
                        backgroundColor: pinError 
                          ? 'var(--danger-color)' 
                          : isFilled 
                            ? 'var(--primary-color)' 
                            : 'transparent',
                        borderColor: pinError
                          ? 'var(--danger-color)'
                          : isFilled
                            ? 'var(--primary-color)'
                            : 'var(--border-color)'
                      }}
                      className="pin-dot"
                      style={{
                        boxShadow: isFilled && !pinError ? '0 0 12px rgba(var(--primary-rgb), 0.6)' : 'none'
                      }}
                    />
                  );
                })}
              </motion.div>

              {/* iOS Style Numpad */}
              <div className="numpad-grid z-10">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <motion.button 
                    key={num} 
                    type="button" 
                    onClick={() => handleNumpad(num.toString())}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92, backgroundColor: 'var(--primary-color)', color: '#fff', borderColor: 'transparent' }}
                    className="numpad-btn"
                  >
                    {num}
                  </motion.button>
                ))}
                <div /> {/* Empty slot */}
                <motion.button 
                  type="button" 
                  onClick={() => handleNumpad('0')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92, backgroundColor: 'var(--primary-color)', color: '#fff', borderColor: 'transparent' }}
                  className="numpad-btn"
                >
                  0
                </motion.button>
                <motion.button 
                  type="button" 
                  onClick={handleDelete} 
                  whileHover={{ scale: 1.1, color: 'var(--danger-color)' }}
                  whileTap={{ scale: 0.9 }}
                  className="numpad-btn numpad-delete text-secondary"
                >
                  <Delete size={28} strokeWidth={1.5} />
                </motion.button>
              </div>
              
              <button 
                type="button"
                onClick={() => { setStep(1); setPin(''); }}
                className="mt-8 text-secondary text-sm font-semibold flex items-center gap-1 z-10 back-btn"
              >
                <ChevronRight size={16} style={{transform: 'rotate(180deg)'}} /> Back to Email Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
