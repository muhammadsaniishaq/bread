import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, KeyRound, ChevronRight, Mail, MapPin, Sparkles, Stars } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { user, setManualUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Shared state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');

  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    localStorage.removeItem('bakery_manual_session');
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email || !password) throw new Error('Please enter your Email or Username and Password.');

        const loginInput = email.trim().toLowerCase();
        let finalEmail = loginInput;

        try {
          if (!finalEmail.includes('@')) {
            const { data: realEmail } = await supabase.rpc('get_email_for_username', { lookup_user: finalEmail });
            if (realEmail) finalEmail = realEmail;
          }
          const { error: authErr } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
          if (!authErr) return;
        } catch (_) { /* fallback */ }

        const { data: legacySession, error: rpcErr } = await supabase.rpc('verify_customer_credentials', {
          val_input: loginInput, val_password: password.trim()
        });

        if (!rpcErr && legacySession) {
          const resolvedRole = (legacySession.role as UserRole) || 'CUSTOMER';
          const manualSession = {
            id: legacySession.id, email: legacySession.email,
            user_metadata: { full_name: legacySession.name, role: resolvedRole },
            is_manual: true
          } as any;
          localStorage.removeItem('bakery_manual_session');
          setManualUser(manualSession, resolvedRole);
          setSuccessMsg('Welcome back! Logging you in...');
          return;
        }

        throw new Error('Invalid Username/Email or Password. Please try again or contact the manager.');
      } else {
        if (!email || !fullName || !password) throw new Error('Email, Full Name, and Password are required.');

        const normalizedUsername = username ? username.trim().toLowerCase().replace(/\s+/g, '') : email.split('@')[0];

        const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', {
          chk_username: normalizedUsername, chk_phone: phone.trim()
        });
        if (availErr) throw new Error('Verification network error. Please try again.');
        if (avail?.username_taken) throw new Error('This Username is already taken.');
        if (avail?.phone_taken) throw new Error('This Phone Number is already registered.');

        const metadata = { role: 'CUSTOMER', full_name: fullName.trim(), username: normalizedUsername, phone: phone.trim(), location: address.trim() };
        const { error, data } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: metadata } });
        if (error) throw error;

        // ── Create a matching customers row so the user appears in the system ──
        if (data?.user?.id) {
          await supabase.from('customers').upsert({
            id:           data.user.id,
            profile_id:   data.user.id,
            name:         fullName.trim(),
            email:        email.trim().toLowerCase(),
            username:     normalizedUsername,
            phone:        phone.trim(),
            location:     address.trim(),
            debt_balance:   0,
            loyalty_points: 0,
            assigned_supplier_id: null,
          }, { onConflict: 'profile_id' });
        }

        if (data?.session) {
          setSuccessMsg('✅ Account created! Welcome to Best Special Bread.');
        } else {
          setSuccessMsg('✅ Account created! Please check your email to confirm, then log in.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 12px 12px 36px', borderRadius: '13px',
    border: '1.5px solid rgba(124,58,237,0.12)', background: '#fff',
    fontSize: '13px', fontWeight: 600, color: '#1a0a3b',
    outlineColor: '#7c3aed', boxSizing: 'border-box', fontFamily: 'inherit'
  };
  const inputStylePlain: React.CSSProperties = { ...inputStyle, paddingLeft: '12px' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── LEFT HERO PANEL ── */}
      <div className="login-hero-section" style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a0050 0%, #2d1b69 40%, #4c1d95 100%)',
        display: 'flex', flexDirection: 'column', padding: '48px 44px',
      }}>
        {/* Rotating blobs */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '-20%', left: '-15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: '-25%', right: '-20%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Animated decorative dots */}
        {[...Array(12)].map((_, i) => (
          <motion.div key={i}
            animate={{ y: [0, -8, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 + (i % 3), delay: i * 0.25 }}
            style={{
              position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
              width: i % 3 === 0 ? 6 : 4, height: i % 3 === 0 ? 6 : 4,
              background: i % 2 === 0 ? 'rgba(196,181,253,0.6)' : 'rgba(251,191,36,0.5)',
              top: `${8 + i * 7}%`, left: `${5 + (i * 8) % 80}%`,
            }} />
        ))}

        {/* Dashed rings */}
        {[[100,'10%','5%'],[60,'65%','75%'],[40,'38%','88%']].map(([sz,t,l], i) => (
          <div key={i} style={{ position:'absolute', width: sz as number, height: sz as number, borderRadius:'50%', border:'1.5px dashed rgba(196,181,253,0.2)', top: t as string, left: l as string, pointerEvents:'none' }} />
        ))}

        {/* Logo + Brand header */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '44px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <img src="/logo.png" alt="Logo" style={{ width:'34px', height:'34px', objectFit:'contain' }} />
          </div>
          <div>
            <div style={{ fontSize:'13px', fontWeight:900, color:'#fff', letterSpacing:'-0.01em' }}>BEST SPECIAL BREAD</div>
            <div style={{ fontSize:'10px', color:'rgba(196,181,253,0.8)', fontWeight:700, letterSpacing:'0.06em' }}>BAKERY MANAGEMENT</div>
          </div>
        </div>

        {/* Headline content */}
        <div style={{ position:'relative', zIndex:10, flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'100px', background:'rgba(196,181,253,0.15)', border:'1px solid rgba(196,181,253,0.25)', marginBottom:'16px' }}>
              <Sparkles size={11} color="#c4b5fd" />
              <span style={{ fontSize:'11px', fontWeight:800, color:'#c4b5fd', letterSpacing:'0.05em' }}>SECURE MANAGEMENT SUITE</span>
            </div>
            <h1 style={{ fontSize:'clamp(26px, 3vw, 40px)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:'-0.04em', margin:'0 0 16px', maxWidth:'360px' }}>
              Supply &amp; Profile<br />
              <span style={{ background:'linear-gradient(90deg, #c4b5fd, #f0abfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Management Hub.</span>
            </h1>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.7, fontWeight:500, maxWidth:'320px', margin:'0 0 28px' }}>
              Track orders, manage customer ledgers, settle supplier debts, and unlock digital rewards — with enterprise-grade security.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[
                { e: '🔐', t: 'End-to-end encrypted sessions' },
                { e: '📊', t: 'Real-time financial ledger sync' },
                { e: '🏆', t: 'Loyalty rewards & tier system' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3+i*0.12 }}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', borderRadius:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize:'16px' }}>{f.e}</span>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.78)', fontWeight:600 }}>{f.t}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div style={{ position:'relative', zIndex:10, display:'flex', gap:'20px', opacity:0.4, fontSize:'11px', fontWeight:700, color:'#fff' }}>
          <span><Lock size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }} />Encrypted</span>
          <span><Stars size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:'4px' }} />Automated</span>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="login-form-section" style={{ flex:1, maxWidth:'520px', display:'flex', flexDirection:'column', background:'#faf9ff', position:'relative' }}>
        {/* Top gradient accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }} />

        <div style={{ flex:1, padding:'44px 10% 28px', display:'flex', flexDirection:'column', justifyContent:'center', overflowY:'auto' }}>

          {/* Logo + greeting */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'15px', background:'linear-gradient(135deg, #7c3aed, #a855f7)', padding:'3px', boxShadow:'0 6px 20px rgba(124,58,237,0.28)', flexShrink:0 }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'12px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                <img src="/logo.png" alt="Logo" style={{ width:'32px', height:'32px', objectFit:'contain' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a0a3b', letterSpacing:'-0.02em' }}>Welcome back! 👋</div>
              <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:600 }}>Sign in to your account</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display:'flex', background:'#ede9fe', padding:'5px', borderRadius:'14px', marginBottom:'22px', position:'relative' }}>
            <motion.div animate={{ x: activeTab === 'login' ? 0 : '100%' }} transition={{ type:'spring', stiffness:300, damping:30 }}
              style={{ position:'absolute', top:'5px', bottom:'5px', left:'5px', width:'calc(50% - 5px)', background:'#fff', borderRadius:'10px', boxShadow:'0 2px 10px rgba(124,58,237,0.12)' }} />
            {(['login','register'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ flex:1, padding:'10px', fontSize:'12px', fontWeight:800, color: activeTab===tab ? '#1a0a3b' : '#94a3b8', background:'none', border:'none', cursor:'pointer', zIndex:1, transition:'color 0.2s', borderRadius:'10px', fontFamily:'inherit' }}>
                {tab === 'login' ? '🔑 Sign In' : '✨ Create Account'}
              </button>
            ))}
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.div key="login" initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Email or Username</label>
                  <div style={{ position:'relative' }}>
                    <Mail size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'13px', color:'#94a3b8' }} />
                    <input type="text" placeholder="name@email.com or @alias" value={email} onChange={e=>setEmail(e.target.value)} required style={inputStyle} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-12 }}
                  style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Full Name *</label>
                    <div style={{ position:'relative' }}>
                      <User size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'13px', color:'#94a3b8' }} />
                      <input type="text" placeholder="First & Last Name" value={fullName} onChange={e=>setFullName(e.target.value)} required style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Email Address *</label>
                    <div style={{ position:'relative' }}>
                      <Mail size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'13px', color:'#94a3b8' }} />
                      <input type="email" placeholder="Secure email for login" value={email} onChange={e=>setEmail(e.target.value)} required style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Username</label>
                      <input type="text" placeholder="@alias" value={username} onChange={e=>setUsername(e.target.value)} style={inputStylePlain} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Phone</label>
                      <input type="tel" placeholder="080..." value={phone} onChange={e=>setPhone(e.target.value)} style={inputStylePlain} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Delivery Address</label>
                    <div style={{ position:'relative' }}>
                      <MapPin size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'13px', color:'#94a3b8' }} />
                      <input type="text" placeholder="Your address..." value={address} onChange={e=>setAddress(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <label style={{ fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Password *</label>
                {activeTab === 'login' && <button type="button" style={{ background:'none', border:'none', color:'#7c3aed', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Forgot?</button>}
              </div>
              <div style={{ position:'relative' }}>
                <KeyRound size={15} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:'13px', color:'#94a3b8' }} />
                <input type="password" placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} style={inputStyle} />
              </div>
            </div>

            {/* Alert messages */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ padding:'10px 14px', borderRadius:'11px', background:'rgba(225,29,72,0.08)', color:'#e11d48', fontSize:'12px', fontWeight:700, border:'1px solid rgba(225,29,72,0.18)' }}>
                  ⚠️ {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ padding:'10px 14px', borderRadius:'11px', background:'rgba(5,150,105,0.08)', color:'#059669', fontSize:'12px', fontWeight:700, border:'1px solid rgba(5,150,105,0.18)' }}>
                  ✅ {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button whileTap={{ scale:0.97 }} type="submit" disabled={loading}
              style={{ marginTop:'4px', padding:'14px', borderRadius:'14px', background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color:'#fff', border:'none', fontWeight:900, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(124,58,237,0.28)', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              {loading ? (
                <>
                  <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.8, ease:'linear' }}
                    style={{ width:'14px', height:'14px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff' }} />
                  Authenticating...
                </>
              ) : (
                <>{activeTab === 'login' ? '🔑 Secure Login' : '✨ Create Account'} <ChevronRight size={16} /></>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(124,58,237,0.08)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          <img src="/logo.png" alt="" style={{ width:'16px', height:'16px', objectFit:'contain', opacity:0.4 }} />
          <span style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600 }}>Best Special Bread · Secured Systems</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .login-hero-section { display: none !important; }
          .login-form-section { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
