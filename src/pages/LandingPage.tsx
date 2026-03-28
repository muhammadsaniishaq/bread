import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Star, ShieldCheck, 
  ArrowRight, Heart, MapPin, 
  Clock, ChefHat, 
  Coffee, Award
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';

/* ─────────────────────────────────────────
   DESIGN TOKENS (Premium V4)
   ───────────────────────────────────────── */
const T = {
  primary:   '#4f46e5',
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  accent:    '#f59e0b',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  bg:        '#ffffff',
  bg2:       '#f8fafc',
  border:    'rgba(0,0,0,0.06)',
  txt3:      '#94a3b8',
  radius:    '32px',
  shadow:    '0 20px 50px -12px rgba(0,0,0,0.08)'
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', sans-serif", color: T.txt }}>
        
        {/* TOP NAVIGATION BAR */}
        <nav style={{ 
          padding: '24px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          zIndex: 1000,
          borderBottom: `1px solid ${T.border}`
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                 <ChefHat size={22} />
              </div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: T.ink, letterSpacing: '-0.03em' }}>THE BEST SPECIAL BREAD</h1>
           </div>
           <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <button 
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', fontWeight: 700, color: T.txt2, cursor: 'pointer' }}>
                Log In
              </button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                style={{ 
                  background: T.primary, 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '14px', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)'
                }}>
                Get Started
              </motion.button>
           </div>
        </nav>

        {/* HERO SECTION */}
        <section style={{ 
          padding: '100px 40px 140px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
           {/* Abstract Background Elements */}
           <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '400px', height: '400px', background: T.primaryGlow, borderRadius: '50%', filter: 'blur(100px)', zIndex: -1 }} />
           <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', filter: 'blur(80px)', zIndex: -1 }} />

           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
           >
              <span style={{ 
                background: T.primaryGlow, 
                color: T.primary, 
                padding: '8px 20px', 
                borderRadius: '100px', 
                fontSize: '13px', 
                fontWeight: 900, 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '24px',
                display: 'inline-block'
              }}>
                Award-Winning Bakery Excellence
              </span>
              <h2 style={{ 
                fontSize: '72px', 
                fontWeight: 900, 
                lineHeight: 1.1, 
                color: T.ink, 
                maxWidth: '900px', 
                margin: '0 auto 32px',
                letterSpacing: '-0.05em'
              }}>
                Quality Bread Baked with <span style={{ color: T.primary }}>Love & Tradition</span>
              </h2>
              <p style={{ 
                fontSize: '20px', 
                color: T.txt2, 
                maxWidth: '650px', 
                margin: '0 auto 48px', 
                fontWeight: 500,
                lineHeight: 1.6
              }}>
                Experience the authentic taste of freshly baked delights, delivered from our ovens straight to your table. Join thousands of happy customers today.
              </p>
              
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                 <motion.button 
                   whileHover={{ x: 5 }}
                   onClick={() => navigate('/login')}
                   style={{ 
                     background: T.ink, 
                     color: '#fff', 
                     border: 'none', 
                     padding: '20px 40px', 
                     borderRadius: '20px', 
                     fontSize: '18px',
                     fontWeight: 900, 
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '12px',
                     boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)'
                   }}>
                   Order Fresh Now <ArrowRight size={20} />
                 </motion.button>
                 <button style={{ 
                   background: '#fff', 
                   color: T.ink, 
                   border: `2px solid ${T.border}`, 
                   padding: '20px 40px', 
                   borderRadius: '20px', 
                   fontSize: '18px',
                   fontWeight: 800, 
                   cursor: 'pointer'
                 }}>
                   View Our Menu
                 </button>
              </div>
           </motion.div>

           {/* Hero Image / Illustration Showcase */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
             style={{ 
               width: '100%', 
               maxWidth: '1000px', 
               height: '500px', 
               marginTop: '80px', 
               borderRadius: T.radius,
               overflow: 'hidden',
               boxShadow: T.shadow,
               position: 'relative'
             }}
           >
              {/* Using a gradient placeholder since the image is hard to move, but I'll add an overlay to make it look premium */}
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChefHat size={120} color="rgba(255,255,255,0.2)" />
                <h3 style={{ position: 'absolute', color: '#fff', fontSize: '32px', fontWeight: 900 }}>The Best Special Bread Experience</h3>
              </div>
              <div style={{ position: 'absolute', bottom: '40px', right: '40px', background: 'rgba(255,255,255,0.9)', padding: '24px', borderRadius: '24px', backdropFilter: 'blur(10px)', textAlign: 'left', border: `1px solid ${T.border}` }}>
                 <div style={{ display: 'flex', color: T.accent, gap: '4px', marginBottom: '8px' }}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                 </div>
                 <p style={{ margin: 0, fontWeight: 800, fontSize: '15px' }}>"The best bread I've ever tasted!"</p>
                 <p style={{ margin: '4px 0 0', color: T.txt2, fontSize: '13px', fontWeight: 600 }}>— Amina R., Lagos</p>
              </div>
           </motion.div>
        </section>

        {/* FEATURES GRID */}
        <section style={{ padding: '100px 40px', background: T.bg2 }}>
           <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{ fontSize: '40px', fontWeight: 900, color: T.ink }}>Why Choose Our Bakery?</h2>
              <p style={{ color: T.txt2, fontSize: '18px', fontWeight: 500 }}>Only the finest ingredients for our premium customers.</p>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ background: '#fff', padding: '40px', borderRadius: T.radius, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                 <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Clock size={30} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '16px' }}>Always Fresh</h3>
                 <p style={{ color: T.txt2, lineHeight: 1.6, fontWeight: 500 }}>Baked every morning before the sun comes up. Traditional recipes, modern standards.</p>
              </div>

              <div style={{ background: '#fff', padding: '40px', borderRadius: T.radius, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                 <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(79, 70, 229, 0.1)', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Award size={30} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '16px' }}>Premium Quality</h3>
                 <p style={{ color: T.txt2, lineHeight: 1.6, fontWeight: 500 }}>We source only the best organic flour and natural ingredients for a superior taste experience.</p>
              </div>

              <div style={{ background: '#fff', padding: '40px', borderRadius: T.radius, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                 <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.1)', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Coffee size={30} />
                 </div>
                 <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '16px' }}>Crafted with Care</h3>
                 <p style={{ color: T.txt2, lineHeight: 1.6, fontWeight: 500 }}>Our master bakers pour passion into every loaf, ensuring consistency and excellence every time.</p>
              </div>

           </div>
        </section>

        {/* CTA FOOTER */}
        <section style={{ padding: '120px 40px', borderTop: `1px solid ${T.border}` }}>
           <div style={{ 
             background: T.ink, 
             padding: '80px 40px', 
             borderRadius: '48px', 
             color: '#fff', 
             textAlign: 'center',
             position: 'relative',
             overflow: 'hidden'
           }}>
              <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: T.primary, borderRadius: '50%', filter: 'blur(150px)', opacity: 0.3 }} />
              
              <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>Ready to experience perfection?</h2>
              <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', margin: '0 auto 48px', fontWeight: 500 }}>Create your account today and get exclusive access to our daily bakes and special discounts.</p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                style={{ 
                  background: '#fff', 
                  color: T.ink, 
                  border: 'none', 
                  padding: '24px 60px', 
                  borderRadius: '24px', 
                  fontSize: '20px', 
                  fontWeight: 900, 
                  cursor: 'pointer',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}>
                Join the Family
              </motion.button>
              
              <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', opacity: 0.5 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={20} /> SSL Secured</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={20} /> Loved by 10k+ Customers</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} /> Nationwide Delivery</div>
              </div>
           </div>
           
           <div style={{ marginTop: '60px', textAlign: 'center', color: T.txt3, fontSize: '14px', fontWeight: 600 }}>
              &copy; {new Date().getFullYear()} THE BEST SPECIAL BREAD. All rights reserved.
           </div>
        </section>

      </div>
    </AnimatedPage>
  );
};

export default LandingPage;
