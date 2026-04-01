import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, ShieldCheck, ArrowRight, Heart,
  MapPin, Clock, ChefHat, Award,
  Sparkles, TrendingUp, Users, Package,
  LogIn, CheckCircle2, Crown,
  Wheat, Flame
} from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';

const C = {
  bg:        '#fffef9',
  white:     '#ffffff',
  primary:   '#7c3aed',          // deep violet
  pLight:    'rgba(124,58,237,0.08)',
  pMid:      'rgba(124,58,237,0.18)',
  amber:     '#d97706',
  amberL:    'rgba(217,119,6,0.10)',
  rose:      '#e11d48',
  roseL:     'rgba(225,29,72,0.08)',
  teal:      '#0d9488',
  tealL:     'rgba(13,148,136,0.10)',
  ink:       '#1a0a3b',
  txt:       '#2d1b69',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  border:    'rgba(124,58,237,0.12)',
  borderL:   'rgba(0,0,0,0.06)',
  radius:    '20px',
  shadow:    '0 4px 24px rgba(124,58,237,0.10)',
  shadowLg:  '0 16px 48px rgba(124,58,237,0.18)',
};

const feats = [
  { icon: Clock,      color: C.teal,   bg: C.tealL,   title: 'Always Fresh',    desc: 'Baked every morning. Traditional recipes, modern standards.' },
  { icon: Award,      color: C.primary,bg: C.pLight,   title: 'Premium Quality', desc: 'Organic flour & natural ingredients for a superior taste.' },
  { icon: TrendingUp, color: C.amber,  bg: C.amberL,   title: 'Loyalty Rewards', desc: 'Earn points every order. Bronze → Silver → Gold → Diamond.' },
  { icon: Package,    color: C.rose,   bg: C.roseL,    title: 'Easy Orders',     desc: 'Manage orders, receipts, and documents from one place.' },
  { icon: Users,      color: '#0891b2',bg: 'rgba(8,145,178,0.10)', title: '10k+ Members', desc: 'Thousands of happy customers who trust us daily.' },
  { icon: Sparkles,   color: '#9333ea',bg: 'rgba(147,51,234,0.10)', title: 'Digital Portal', desc: 'Your ID, certificates, and history — secured online.' },
];

const reviews = [
  { name: 'Amina R.',   city: 'Lagos',  text: '"The best bread I have ever tasted — and I have tried many!"', stars: 5 },
  { name: 'Kolade B.',  city: 'Abuja',  text: '"Delivery is always on time. Never disappointed once."', stars: 5 },
  { name: 'Fatima M.',  city: 'Kano',   text: '"Very professional team. The quality is truly top-notch."', stars: 5 },
];

// Floating decoration dot
const Dot: React.FC<{ x: string; y: string; size?: number; color?: string; delay?: number }> =
  ({ x, y, size = 8, color = C.primary, delay = 0 }) => (
  <motion.div
    animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
    transition={{ repeat: Infinity, duration: 3 + delay, delay, ease: 'easeInOut' }}
    style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: color, pointerEvents: 'none' }}
  />
);

// Dashed orbit ring
const Ring: React.FC<{ size: number; top: string; left: string; color?: string }> =
  ({ size, top, left, color = C.primary }) => (
  <div style={{ position: 'absolute', top, left, width: size, height: size, borderRadius: '50%', border: `1.5px dashed ${color}30`, pointerEvents: 'none' }} />
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviewIdx, setReviewIdx] = useState(0);
  // Auto-rotate reviews
  useEffect(() => {
    const t = setInterval(() => {
      setReviewIdx(i => (i + 1) % reviews.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

        {/* ─── STICKY NAV ─── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 200,
          padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,254,249,0.88)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Logo */}
          <motion.div whileTap={{ scale: 0.96 }} style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'default' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${C.pMid}` }}>
              <ChefHat size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: C.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>BEST SPECIAL</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bakery</div>
            </div>
          </motion.div>

          {/* Nav actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/login')}
              style={{ padding: '8px 14px', borderRadius: '11px', background: C.pLight, border: `1px solid ${C.border}`, color: C.primary, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              <LogIn size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              Login
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/login')}
              style={{ padding: '8px 16px', borderRadius: '11px', background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer', boxShadow: `0 4px 14px ${C.pMid}` }}>
              Get Started →
            </motion.button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section style={{ padding: '56px 20px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow blobs */}
          <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: C.pLight, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '10%', width: '200px', height: '200px', background: C.amberL, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '20px', right: '5%', width: '180px', height: '180px', background: 'rgba(147,51,234,0.07)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Decorative dots */}
          <Dot x="8%" y="15%" size={7} color={C.primary} delay={0} />
          <Dot x="92%" y="20%" size={5} color={C.amber} delay={1} />
          <Dot x="5%" y="65%" size={6} color="#a855f7" delay={0.5} />
          <Dot x="95%" y="60%" size={8} color={C.teal} delay={1.5} />
          <Ring size={80} top="-20px" left="10%" />
          <Ring size={50} top="40%" left="85%" color={C.amber} />

          {/* Pill badge */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.shadow, marginBottom: '18px' }}>
            <Crown size={12} color={C.amber} fill={C.amber} />
            <span style={{ color: C.ink, fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em' }}>Award-Winning Nigerian Bakery</span>
            <span style={{ background: `linear-gradient(90deg, ${C.primary}, #a855f7)`, color: '#fff', fontSize: '9px', fontWeight: 900, padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.04em' }}>NEW</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: 'clamp(26px, 6vw, 48px)', fontWeight: 900, lineHeight: 1.1, color: C.ink, maxWidth: '640px', margin: '0 auto 14px', letterSpacing: '-0.04em' }}>
            Quality Bread Baked{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with Love
            </span>
            <br />&amp; Tradition 🍞
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ fontSize: '13px', color: C.txt2, maxWidth: '420px', margin: '0 auto 26px', lineHeight: 1.7, fontWeight: 500 }}>
            Experience freshly baked delights delivered straight from our ovens. Join thousands of happy customers and earn exclusive loyalty rewards.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '14px', background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, color: '#fff', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: `0 8px 24px ${C.pMid}` }}>
              Order Fresh Now <ArrowRight size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
              style={{ padding: '13px 22px', borderRadius: '14px', background: C.white, border: `1.5px solid ${C.border}`, color: C.ink, fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              View Menu 👀
            </motion.button>
          </motion.div>

          {/* Trust strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {['SSL Secured', 'Free Loyalty Rewards', 'Daily Fresh Delivery'].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.txt3, fontSize: '11px', fontWeight: 600 }}>
                <CheckCircle2 size={11} color={C.teal} /> {x}
              </div>
            ))}
          </motion.div>

          {/* ─── HERO CARD ─── */}
          <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
            style={{ margin: '36px auto 0', maxWidth: '520px', borderRadius: '28px', overflow: 'hidden', boxShadow: C.shadowLg, position: 'relative', border: `1.5px solid ${C.border}` }}>

            {/* Gradient header */}
            <div style={{ height: '260px', background: `linear-gradient(135deg, ${C.primary} 0%, #a855f7 60%, #ec4899 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Pattern dots */}
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', top: `${10 + (i % 4) * 25}%`, left: `${8 + i * 8}%` }} />
              ))}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                  style={{ fontSize: '72px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>🍞</motion.div>
                <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.02em' }}>The Best Special Bread</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} color="#fde68a" fill="#fde68a" />)}
                </div>
              </div>
            </div>

            {/* Card bottom bar */}
            <div style={{ background: C.white, padding: '14px 20px', display: 'flex', gap: '8px' }}>
              {[
                { emoji: '🥖', label: 'Special Bread' },
                { emoji: '🧁', label: 'Sweet Cakes' },
                { emoji: '🍩', label: 'Donuts' },
                { emoji: '🥐', label: 'Croissants' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '12px', background: C.pLight, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '18px', marginBottom: '3px' }}>{item.emoji}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: C.primary }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Float review badge */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              style={{ position: 'absolute', top: '20px', left: '16px', background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '10px 13px', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={10} color={C.amber} fill={C.amber} />)}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: C.ink }}>10,000+ Reviews</div>
              <div style={{ fontSize: '9px', color: C.txt3, fontWeight: 600 }}>Across Nigeria</div>
            </motion.div>

            {/* Float stats badge */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}
              style={{ position: 'absolute', top: '20px', right: '16px', background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, borderRadius: '14px', padding: '10px 13px', boxShadow: `0 8px 20px ${C.pMid}` }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>7+</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Years Fresh</div>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── STATS ROW ─── */}
        <section style={{ padding: '0 20px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxWidth: '560px', margin: '0 auto' }}>
            {[
              { val: '10k+', label: 'Customers',  color: C.primary, bg: C.pLight },
              { val: '5.0★', label: 'Rating',      color: C.amber,   bg: C.amberL },
              { val: '7yrs', label: 'Experience',  color: C.teal,    bg: C.tealL },
              { val: '100%', label: 'Fresh Daily', color: C.rose,    bg: C.roseL },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ background: s.bg, border: `1.5px solid ${s.color}20`, borderRadius: '16px', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '19px', fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: C.txt3, textTransform: 'uppercase', marginTop: '3px', letterSpacing: '0.04em' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── WHY CHOOSE US ─── */}
        <section style={{ padding: '36px 20px 44px', background: '#faf9ff', position: 'relative', overflow: 'hidden' }}>
          <Ring size={200} top="-80px" left="-80px" />
          <Ring size={120} top="60%" left="80%" color={C.amber} />

          <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 13px', borderRadius: '100px', background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.shadow, marginBottom: '10px' }}>
              <Flame size={11} color={C.rose} fill={C.rose} />
              <span style={{ color: C.primary, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Why Choose Us</span>
            </div>
            <h2 style={{ fontSize: '21px', fontWeight: 900, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.03em' }}>Everything in One Place</h2>
            <p style={{ fontSize: '12px', color: C.txt2, margin: 0, fontWeight: 500 }}>Premium quality, digital management, and rewards — for every customer.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '540px', margin: '0 auto' }}>
            {feats.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                style={{ background: C.white, padding: '16px', borderRadius: '18px', boxShadow: C.shadow, border: `1px solid ${C.borderL}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '50px', height: '50px', borderRadius: '50%', background: f.bg, filter: 'blur(12px)', pointerEvents: 'none' }} />
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 5px', color: C.ink }}>{f.title}</h3>
                <p style={{ fontSize: '11px', color: C.txt2, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── REVIEWS ─── */}
        <section style={{ padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Dot x="5%" y="20%" size={6} color={C.primary} />
          <Dot x="93%" y="60%" size={5} color={C.amber} delay={1} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', background: C.amberL, border: `1px solid ${C.amber}25`, marginBottom: '10px' }}>
            <Star size={11} color={C.amber} fill={C.amber} />
            <span style={{ color: C.amber, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer Love</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.ink, margin: '0 0 22px', letterSpacing: '-0.03em' }}>What People Say</h2>

          <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div key={reviewIdx}
                initial={{ opacity: 0, x: 30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: '22px', padding: '24px', boxShadow: C.shadowLg }}>

                {/* Big quote mark */}
                <div style={{ fontSize: '48px', lineHeight: 1, color: C.pLight, fontWeight: 900, textAlign: 'left', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>"</div>

                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '12px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} color={C.amber} fill={C.amber} />)}
                </div>

                <p style={{ fontSize: '14px', fontWeight: 700, color: C.ink, margin: '0 0 16px', lineHeight: 1.55, fontStyle: 'italic' }}>
                  {reviews[reviewIdx].text}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                    {reviews[reviewIdx].name[0]}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: C.ink }}>{reviews[reviewIdx].name}</div>
                    <div style={{ fontSize: '11px', color: C.txt3, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={9} /> {reviews[reviewIdx].city}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: C.pLight, borderRadius: '8px', padding: '4px 8px' }}>
                    <span style={{ color: C.primary, fontSize: '9px', fontWeight: 800 }}>VERIFIED</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
              {reviews.map((_, i) => (
                <motion.div key={i} onClick={() => setReviewIdx(i)} whileTap={{ scale: 0.85 }}
                  style={{ height: '6px', width: i === reviewIdx ? '22px' : '6px', borderRadius: '3px', background: i === reviewIdx ? C.primary : C.border, cursor: 'pointer', transition: 'all 0.3s ease' }} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── LOYALTY TEASER ─── */}
        <section style={{ padding: '0 20px 40px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ maxWidth: '540px', margin: '0 auto', background: C.white, borderRadius: '24px', border: `1.5px solid ${C.border}`, boxShadow: C.shadow, padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', background: C.amberL, borderRadius: '50%', filter: 'blur(30px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: C.amberL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏆</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: C.ink }}>Loyalty Tiers</div>
                <div style={{ fontSize: '11px', color: C.txt2, fontWeight: 600 }}>Earn rewards on every purchase</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { icon: '🥉', name: 'Bronze', desc: 'Starter', color: '#92400e', bg: 'rgba(146,64,14,0.08)' },
                { icon: '🥈', name: 'Silver', desc: '₦50k+', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
                { icon: '🥇', name: 'Gold',   desc: '₦150k+', color: C.amber, bg: C.amberL },
                { icon: '💎', name: 'Diamond',desc: '₦500k+', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
              ].map((tier, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: '13px', background: tier.bg, border: `1px solid ${tier.color}20` }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{tier.icon}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: tier.color }}>{tier.name}</div>
                  <div style={{ fontSize: '9px', color: C.txt3, fontWeight: 600 }}>{tier.desc}</div>
                </div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')}
              style={{ marginTop: '14px', width: '100%', padding: '13px', borderRadius: '14px', background: `linear-gradient(135deg, ${C.amber}, #f97316)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(217,119,6,0.25)' }}>
              Start Earning Points Today 🎉
            </motion.button>
          </motion.div>
        </section>

        {/* ─── CTA FOOTER ─── */}
        <section style={{ padding: '0 20px 56px' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: `linear-gradient(135deg, ${C.ink} 0%, #2d1b69 60%, #1a0050 100%)`, borderRadius: '28px', padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', maxWidth: '560px', margin: '0 auto' }}>

            {/* Glows */}
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '180px', height: '180px', background: C.primary, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.35, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '160px', height: '160px', background: '#ec4899', borderRadius: '50%', filter: 'blur(70px)', opacity: 0.3, pointerEvents: 'none' }} />
            {/* Dots */}
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', top: `${15 + i * 11}%`, left: `${5 + i * 12}%`, pointerEvents: 'none' }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🍞✨</div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                Ready to join<br />our bread family?
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '0 0 22px', fontWeight: 500, lineHeight: 1.65 }}>
                Create your account today. Get exclusive access to daily bakes, special discounts, and your digital ID card.
              </p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: '#fff', color: C.ink, border: 'none', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}>
                Join the Family <ArrowRight size={16} />
              </motion.button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '22px', flexWrap: 'wrap' }}>
                {[
                  { icon: ShieldCheck, text: 'SSL Secured' },
                  { icon: Heart,       text: '10k+ Members' },
                  { icon: Wheat,       text: 'Fresh Daily' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600 }}>
                    <Icon size={12} /> {text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div style={{ textAlign: 'center', color: C.txt3, fontSize: '11px', fontWeight: 600, marginTop: '24px' }}>
            © {new Date().getFullYear()} THE BEST SPECIAL BREAD. All rights reserved.
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
};

export default LandingPage;
