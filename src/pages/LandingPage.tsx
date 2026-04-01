import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, ShieldCheck, ArrowRight, Heart,
  MapPin, Clock, ChefHat, Award,
  Sparkles, TrendingUp, Users, Package,
  LogIn, UserPlus, CheckCircle2, Zap
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';

const T = {
  bg:           '#ffffff',
  bg2:          '#f8f7ff',
  bg3:          '#f1f0ff',
  white:        '#ffffff',
  border:       'rgba(99,91,255,0.10)',
  borderLight:  'rgba(0,0,0,0.06)',
  primary:      '#635bff',
  primaryLight: 'rgba(99,91,255,0.10)',
  primaryMid:   'rgba(99,91,255,0.18)',
  accent:       '#f59e0b',
  accentLight:  'rgba(245,158,11,0.10)',
  success:      '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  ink:          '#0f172a',
  txt:          '#1e293b',
  txt2:         '#475569',
  txt3:         '#94a3b8',
  radius:       '20px',
  shadow:       '0 4px 24px rgba(99,91,255,0.08)',
  shadowLg:     '0 12px 40px rgba(99,91,255,0.15)',
};

const feats = [
  { icon: Clock,      color: '#059669', bg: 'rgba(5,150,105,0.10)',   title: 'Always Fresh',     desc: 'Baked every morning with traditional recipes and modern standards.' },
  { icon: Award,      color: T.primary, bg: T.primaryLight,           title: 'Premium Quality',  desc: 'Organic flour, natural ingredients — superior taste every single time.' },
  { icon: TrendingUp, color: '#d97706', bg: 'rgba(217,119,6,0.10)',   title: 'Loyalty Rewards',  desc: 'Earn points on every order. Bronze, Silver, Gold, and Diamond tiers.' },
  { icon: Package,    color: '#e11d48', bg: 'rgba(225,29,72,0.10)',   title: 'Easy Ordering',    desc: 'Manage all your orders, receipts, and documents from one place.' },
  { icon: Users,      color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   title: '10k+ Members',     desc: 'Join thousands of happy customers who trust us daily for their bread.' },
  { icon: Sparkles,   color: '#a855f7', bg: 'rgba(168,85,247,0.10)', title: 'Digital Portal',   desc: 'Your ID card, certificates, and purchase history — always secured online.' },
];

const stats = [
  { value: '10k+',  label: 'Happy Customers' },
  { value: '5★',    label: 'Average Rating' },
  { value: '7yrs',  label: 'In Business' },
  { value: '100%',  label: 'Fresh Daily' },
];

const reviews = [
  { name: 'Amina R.', location: 'Lagos', text: 'The best bread I have ever tasted!', stars: 5 },
  { name: 'Kolade B.', location: 'Abuja', text: 'Delivery is always on time. Never disappoints.', stars: 5 },
  { name: 'Fatima M.', location: 'Kano', text: 'Very professional and the quality is top notch.', stars: 5 },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', -apple-system, sans-serif", color: T.txt }}>

        {/* ─── NAV ─── */}
        <nav style={{
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.borderLight}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>BEST SPECIAL BREAD</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '11px', background: T.primaryLight, border: 'none', color: T.primary, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              <LogIn size={13} /> Login
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '11px', background: T.primary, border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: T.shadow }}>
              <UserPlus size={13} /> Sign Up
            </motion.button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section style={{ padding: '60px 20px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: T.primaryLight, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: T.primaryLight, border: `1px solid ${T.border}`, marginBottom: '20px' }}>
              <Zap size={12} color={T.primary} fill={T.primary} />
              <span style={{ color: T.primary, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Award-Winning Bakery</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.1, color: T.ink, maxWidth: '700px', margin: '0 auto 16px', letterSpacing: '-0.04em' }}>
              Quality Bread Baked<br />
              with <span style={{ color: T.primary }}>Love & Tradition</span>
            </h1>

            <p style={{ fontSize: '14px', color: T.txt2, maxWidth: '480px', margin: '0 auto 28px', fontWeight: 500, lineHeight: 1.65 }}>
              Experience authentic freshly baked delights, delivered straight from our ovens. Join thousands of happy customers and enjoy exclusive rewards.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '14px', background: T.ink, color: '#fff', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(15,23,42,0.15)' }}>
                Order Fresh Now <ArrowRight size={16} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
                style={{ padding: '13px 24px', borderRadius: '14px', background: T.bg2, border: `1px solid ${T.border}`, color: T.ink, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                View Menu
              </motion.button>
            </div>

            {/* Trust line */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
              {['SSL Secured', 'Free Loyalty Points', 'Fast Delivery'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: T.txt3, fontSize: '12px', fontWeight: 600 }}>
                  <CheckCircle2 size={12} color={T.success} />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ margin: '40px auto 0', maxWidth: '560px', borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadowLg, position: 'relative', border: `1px solid ${T.border}` }}>
            <div style={{ height: '280px', background: `linear-gradient(135deg, ${T.primary} 0%, #a78bfa 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <ChefHat size={80} color="rgba(255,255,255,0.15)" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  style={{ fontSize: '64px' }}>🍞</motion.div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', fontWeight: 900 }}>The Best Special Bread</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>Fresh · Quality · Delivered Daily</span>
              </div>
            </div>

            {/* Floating review card */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(255,255,255,0.95)', borderRadius: '14px', padding: '12px 16px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '220px' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={12} color={T.accent} fill={T.accent} />)}
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>"{reviews[reviewIdx].text}"</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.txt3, fontWeight: 600 }}>— {reviews[reviewIdx].name}, {reviews[reviewIdx].location}</p>
            </div>

            {/* Stats pill */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '10px 14px', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: T.ink }}>10k+</div>
              <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 600 }}>Happy</div>
            </div>
          </motion.div>
        </section>

        {/* ─── STATS ROW ─── */}
        <section style={{ padding: '0 20px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px 8px', textAlign: 'center', boxShadow: T.shadow }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: T.primary, letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', marginTop: '3px', letterSpacing: '0.04em' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section style={{ padding: '40px 20px', background: T.bg2 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '100px', background: T.primaryLight, marginBottom: '10px' }}>
              <Sparkles size={11} color={T.primary} />
              <span style={{ color: T.primary, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why Choose Us</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: T.ink, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Everything You Need</h2>
            <p style={{ fontSize: '13px', color: T.txt2, margin: 0, fontWeight: 500 }}>Premium quality, digital management, and rewards — all in one place.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
            {feats.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                style={{ background: T.white, padding: '16px', borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.borderLight}` }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 6px', color: T.ink }}>{f.title}</h3>
                <p style={{ fontSize: '11px', color: T.txt2, margin: 0, lineHeight: 1.55, fontWeight: 500 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── REVIEWS CAROUSEL ─── */}
        <section style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '100px', background: T.accentLight, marginBottom: '12px' }}>
            <Star size={11} color={T.accent} fill={T.accent} />
            <span style={{ color: T.accent, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer Love</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: T.ink, margin: '0 0 24px', letterSpacing: '-0.03em' }}>What People Say</h2>

          <AnimatePresence mode="wait">
            <motion.div key={reviewIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '24px', maxWidth: '420px', margin: '0 auto', boxShadow: T.shadowLg }}>
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginBottom: '12px' }}>
                {[...Array(reviews[reviewIdx].stars)].map((_, i) => <Star key={i} size={14} color={T.accent} fill={T.accent} />)}
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: T.ink, margin: '0 0 12px', lineHeight: 1.5 }}>"{reviews[reviewIdx].text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: T.primary }}>
                  {reviews[reviewIdx].name[0]}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: T.ink }}>{reviews[reviewIdx].name}</div>
                  <div style={{ fontSize: '10px', color: T.txt3, display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={9} />{reviews[reviewIdx].location}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
            {reviews.map((_, i) => (
              <motion.div key={i} onClick={() => setReviewIdx(i)} whileTap={{ scale: 0.9 }}
                style={{ width: i === reviewIdx ? '20px' : '7px', height: '7px', borderRadius: '4px', background: i === reviewIdx ? T.primary : T.borderLight, cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section style={{ padding: '20px 20px 60px' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: T.ink, borderRadius: '28px', padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', background: T.primary, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4 }} />
            <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '160px', height: '160px', background: '#a855f7', borderRadius: '50%', filter: 'blur(70px)', opacity: 0.3 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍞</div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em' }}>Ready to join the family?</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', fontWeight: 500, lineHeight: 1.6 }}>
                Create your account today and get exclusive access to daily bakes, special discounts, and your very own digital ID.
              </p>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: '#fff', color: T.ink, border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
                Get Started Free <ArrowRight size={16} />
              </motion.button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
                {[
                  { icon: ShieldCheck, label: 'SSL Secured' },
                  { icon: Heart,       label: '10k+ Members' },
                  { icon: MapPin,      label: 'Nationwide' },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600 }}>
                    <Icon size={13} /> {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div style={{ textAlign: 'center', color: T.txt3, fontSize: '12px', fontWeight: 600, marginTop: '28px' }}>
            © {new Date().getFullYear()} THE BEST SPECIAL BREAD. All rights reserved.
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
};

export default LandingPage;
