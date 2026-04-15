import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { 
  ShoppingBag, Search, Plus, Minus, X,
  Zap, ShieldCheck, Shield, CheckCircle2, ArrowRight,
  PackageX, CreditCard, Truck, MessageSquare, ChevronLeft,
  Sparkles, Tag, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { CustomerBottomNav } from '../components/CustomerBottomNav';
import { useNavigate } from 'react-router-dom';

/* ─── DESIGN TOKENS ─────────────────────────────────────── */
const T = {
  bg:        '#f0f2f8',
  surface:   '#ffffff',
  surface2:  '#f1f5f9',
  border:    'rgba(0,0,0,0.06)',
  accent:    '#4f46e5',
  accentGlow:'rgba(79,70,229,0.12)',
  accentDark:'#3730a3',
  success:   '#10b981',
  successLt: '#ecfdf5',
  danger:    '#ef4444',
  dangerLt:  '#fef2f2',
  warn:      '#f59e0b',
  ink:       '#0f172a',
  txt:       '#1e293b',
  txt2:      '#64748b',
  txt3:      '#94a3b8',
  shadow:    '0 4px 20px rgba(0,0,0,0.06)',
  shadowMd:  '0 10px 40px rgba(0,0,0,0.10)',
};

const fmtRaw = (v: number) => `₦${v.toLocaleString()}`;

const CATEGORIES = ['All', 'Bread', 'Cakes', 'Pastry', 'Drinks', 'Snacks'];

export const CustomerStore: React.FC = () => {
  const { user } = useAuth();
  const { products: contextProducts, getPersonalStock } = useAppContext();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'DELIVERY' | 'TRANSFER' | 'DEBT'>('DELIVERY');
  const [assignedSupplier, setAssignedSupplier] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const activeProducts = contextProducts.filter(p => p.active);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || (p.category || 'Bread').toLowerCase() === activeCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [activeProducts, search, activeCategory]);

  useEffect(() => { fetchCustomer(); }, [user]);

  const fetchCustomer = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('customers')
        .select('*, assigned_supplier:profiles!assigned_supplier_id(full_name, id, phone, bank_name, account_number, whatsapp_number)')
        .eq('profile_id', user.id)
        .maybeSingle();
      if (data) {
        setCustomer(data);
        if (data.assigned_supplier) setAssignedSupplier(data.assigned_supplier);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateCart = (pid: string, delta: number) => {
    const product = activeProducts.find(p => p.id === pid);
    if (!product) return;
    setCart(prev => {
      const current = prev[pid] || 0;
      const avail = assignedSupplier?.id ? getPersonalStock(pid, 'SUPPLIER', assignedSupplier.id) : product.stock;
      let next = Math.min(Math.max(0, current + delta), avail);
      if (next === 0) { const { [pid]: _, ...rest } = prev; return rest; }
      return { ...prev, [pid]: next };
    });
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = activeProducts.find(x => x.id === id);
    return sum + (p?.price || 0) * qty;
  }, 0);

  const isVerified = customer?.is_verified || false;

  const handlePlaceOrder = async () => {
    if (cartItemCount === 0 || !customer) return;
    setIsOrdering(true);
    try {
      const mappedItems = Object.entries(cart).map(([productId, quantity]) => ({
        productId, quantity,
        unitPrice: activeProducts.find(x => x.id === productId)?.price || 0
      }));
      const { error } = await supabase.from('orders').insert({
        customer_id: customer.id,
        supplier_id: assignedSupplier?.id || null,
        total_price: cartTotal,
        items: cart,
        details: mappedItems,
        payment_method: paymentMethod,
        status: 'PENDING',
        created_at: new Date().toISOString()
      });
      if (!error) {
        setShowCheckout(false);
        setShowSuccess(true);
        setCart({});
        setTimeout(() => { setShowSuccess(false); navigate('/customer/dashboard'); }, 3000);
      } else throw error;
    } catch { alert('Order failed. Please try again.'); }
    setIsOrdering(false);
  };

  if (loading) return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',gap:16}}>
      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}>
        <ShoppingBag size={36} color="#fff"/>
      </motion.div>
      <p style={{color:'rgba(255,255,255,0.8)',fontWeight:700,fontSize:'13px',letterSpacing:'0.1em'}}>LOADING STORE...</p>
    </div>
  );

  return (
    <AnimatedPage>
      <div style={{minHeight:'100vh',background:T.bg,paddingBottom:'130px',fontFamily:"'Inter',system-ui,sans-serif"}}>

        {/* ─── PREMIUM HERO HEADER ─────────────────────────────── */}
        <div style={{background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6d28d9 100%)',padding:'0 0 32px',position:'relative',overflow:'hidden'}}>
          {/* Decorative circles */}
          <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-40,left:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}/>

          {/* Top Bar */}
          <div style={{padding:'52px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:1}}>
            <motion.button whileTap={{scale:0.92}} onClick={()=>navigate(-1)}
              style={{width:38,height:38,borderRadius:'12px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
              <ChevronLeft size={18} color="#fff"/>
            </motion.button>
            <div style={{textAlign:'center'}}>
              <p style={{margin:0,fontSize:'11px',color:'rgba(255,255,255,0.6)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em'}}>Bakery Store</p>
              <h1 style={{margin:'2px 0 0',fontSize:'18px',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>Fresh Today 🍞</h1>
            </div>
            {/* Cart badge */}
            <div style={{position:'relative'}}>
              <motion.button whileTap={{scale:0.9}}
                onClick={()=>{ if(cartItemCount>0){setCheckoutStep('review');setShowCheckout(true);}}}
                style={{width:38,height:38,borderRadius:'12px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)'}}>
                <ShoppingBag size={18} color="#fff"/>
              </motion.button>
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                    style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'#f43f5e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,color:'#fff',boxShadow:'0 2px 8px rgba(244,63,94,0.5)'}}>
                    {cartItemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Customer info strip */}
          {customer && (
            <div style={{margin:'20px 20px 0',padding:'14px 16px',background:'rgba(255,255,255,0.12)',borderRadius:'18px',border:'1px solid rgba(255,255,255,0.15)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:1}}>
              <div>
                <p style={{margin:0,fontSize:'10px',color:'rgba(255,255,255,0.6)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>Shopping as</p>
                <p style={{margin:'2px 0 0',fontSize:'14px',fontWeight:800,color:'#fff'}}>{customer.name}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,background:isVerified?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.1)',padding:'6px 12px',borderRadius:'10px',border:`1px solid ${isVerified?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.15)'}`}}>
                {isVerified ? <ShieldCheck size={12} color="#34d399"/> : <Shield size={12} color="rgba(255,255,255,0.5)"/>}
                <span style={{fontSize:'11px',fontWeight:800,color:isVerified?'#34d399':'rgba(255,255,255,0.5)'}}>{isVerified?'Verified':'Unverified'}</span>
              </div>
            </div>
          )}

          {/* Search bar - overlapping */}
          <div style={{padding:'16px 20px 0',position:'relative',zIndex:1}}>
            <div style={{position:'relative'}}>
              <Search style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',color:T.txt3,pointerEvents:'none'}} size={16}/>
              <input type="text" placeholder="Search bread, cakes..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%',padding:'14px 16px 14px 44px',borderRadius:'16px',border:'none',background:'#fff',fontSize:'13px',fontWeight:600,color:T.ink,outline:'none',boxSizing:'border-box',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}/>
            </div>
          </div>
        </div>

        <div style={{padding:'20px 16px 0'}}>

          {/* ─── CATEGORY PILLS ─────────────────────────────────── */}
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:12,marginBottom:4}} className="hide-scrollbar">
            {CATEGORIES.map(cat => (
              <motion.button key={cat} whileTap={{scale:0.93}}
                onClick={()=>setActiveCategory(cat)}
                style={{flexShrink:0,padding:'8px 16px',borderRadius:'12px',border:'none',background:activeCategory===cat?T.accent:T.surface,color:activeCategory===cat?'#fff':T.txt2,fontSize:'12px',fontWeight:800,cursor:'pointer',boxShadow:activeCategory===cat?'0 4px 16px rgba(79,70,229,0.3)':T.shadow,transition:'all 0.2s'}}>
                {cat}
              </motion.button>
            ))}
          </div>

          {/* ─── PRODUCT GRID ─────────────────────────────────────── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginTop:8}}>
            {filteredProducts.map(p => {
              const avail = assignedSupplier?.id ? getPersonalStock(p.id,'SUPPLIER',assignedSupplier.id) : p.stock;
              const outOfStock = avail <= 0;
              const inCart = cart[p.id] || 0;

              return (
                <motion.div layout key={p.id} whileHover={{y:-3}}
                  style={{background:T.surface,borderRadius:'22px',overflow:'hidden',boxShadow:T.shadow,border:`1px solid ${T.border}`,display:'flex',flexDirection:'column',opacity:outOfStock?0.65:1,transition:'all 0.3s'}}>

                  {/* Image Zone */}
                  <div style={{height:150,background:`linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)`,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {p.image
                      ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <Sparkles size={36} color={T.txt3} opacity={0.4}/>
                    }
                    {/* Category pill */}
                    <div style={{position:'absolute',top:10,left:10,background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'3px 8px',borderRadius:'8px',fontSize:'9px',fontWeight:900,color:T.accent,textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',gap:4}}>
                      <Tag size={8}/>{p.category||'Bakery'}
                    </div>
                    {/* Stock badge */}
                    <div style={{position:'absolute',bottom:10,right:10,background:outOfStock?'rgba(239,68,68,0.9)':'rgba(16,185,129,0.9)',backdropFilter:'blur(8px)',padding:'3px 8px',borderRadius:'8px',fontSize:'9px',fontWeight:900,color:'#fff',display:'flex',alignItems:'center',gap:3}}>
                      {outOfStock ? <><PackageX size={9}/> OUT</> : <><Zap size={9} fill="#fff"/> {avail} left</>}
                    </div>
                    {/* Cart count overlay */}
                    <AnimatePresence>
                      {inCart > 0 && (
                        <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}
                          style={{position:'absolute',top:10,right:10,width:22,height:22,borderRadius:'50%',background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900,color:'#fff',boxShadow:'0 4px 12px rgba(79,70,229,0.4)'}}>
                          {inCart}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Info Zone */}
                  <div style={{padding:'14px',flex:1,display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <h3 style={{margin:0,fontSize:'14px',fontWeight:800,color:T.ink,lineHeight:1.3,letterSpacing:'-0.01em'}}>{p.name}</h3>
                      {p.description && <p style={{margin:'3px 0 0',fontSize:'10px',color:T.txt3,fontWeight:600,lineHeight:1.4}}>{p.description.slice(0,40)}...</p>}
                    </div>

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:'17px',fontWeight:900,color:T.ink,letterSpacing:'-0.02em'}}>{fmtRaw(p.price)}</span>

                      {inCart > 0 ? (
                        <div style={{display:'flex',alignItems:'center',gap:6,background:T.accentGlow,padding:'4px',borderRadius:'12px'}}>
                          <motion.button whileTap={{scale:0.85}} onClick={()=>updateCart(p.id,-1)}
                            style={{width:26,height:26,borderRadius:'8px',background:'#fff',border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,0.06)'}}>
                            <Minus size={12} color={T.ink}/>
                          </motion.button>
                          <span style={{fontSize:'14px',fontWeight:900,color:T.accent,minWidth:20,textAlign:'center'}}>{inCart}</span>
                          <motion.button whileTap={{scale:0.85}} onClick={()=>updateCart(p.id,1)} disabled={inCart>=avail}
                            style={{width:26,height:26,borderRadius:'8px',background:inCart>=avail?T.txt3:T.accent,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:inCart>=avail?'not-allowed':'pointer',boxShadow:inCart>=avail?'none':'0 4px 10px rgba(79,70,229,0.3)'}}>
                            <Plus size={12} color="#fff"/>
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button whileTap={{scale:0.92}} onClick={()=>!outOfStock&&updateCart(p.id,1)} disabled={outOfStock}
                          style={{padding:'8px 14px',borderRadius:'12px',background:outOfStock?T.surface2:T.ink,color:outOfStock?T.txt3:'#fff',border:'none',fontSize:'11px',fontWeight:900,cursor:outOfStock?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:5,boxShadow:outOfStock?'none':'0 6px 18px rgba(15,23,42,0.2)'}}>
                          {outOfStock?'Out':<><Plus size={12}/>Add</>}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{textAlign:'center',padding:'60px 20px',color:T.txt3}}>
              <PackageX size={40} style={{margin:'0 auto 12px',opacity:0.3}}/>
              <p style={{fontWeight:700,fontSize:'14px',color:T.txt2}}>No products found</p>
              <p style={{fontSize:'12px',margin:'4px 0 0'}}>{search ? `Try a different search for "${search}"` : `No items in "${activeCategory}" yet`}</p>
            </div>
          )}
        </div>

        {/* ─── STICKY CHECKOUT FLOAT BAR ──────────────────────────── */}
        <AnimatePresence>
          {cartItemCount > 0 && !showCheckout && (
            <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}} transition={{type:'spring',damping:22,stiffness:300}}
              style={{position:'fixed',bottom:'90px',left:16,right:16,zIndex:200}}>
              <motion.div whileTap={{scale:0.98}}
                onClick={()=>{setCheckoutStep('review');setShowCheckout(true);}}
                style={{background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,borderRadius:'20px',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 16px 40px rgba(79,70,229,0.35)',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:'12px',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:900,color:'#fff'}}>
                    {cartItemCount}
                  </div>
                  <div>
                    <p style={{margin:0,fontSize:'10px',color:'rgba(255,255,255,0.65)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>{cartItemCount} {cartItemCount===1?'item':'items'}</p>
                    <p style={{margin:0,fontSize:'17px',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>{fmtRaw(cartTotal)}</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.18)',padding:'10px 16px',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.2)'}}>
                  <span style={{fontSize:'13px',fontWeight:900,color:'#fff'}}>Checkout</span>
                  <ArrowRight size={15} color="#fff"/>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CHECKOUT SLIDE-UP SHEET ─────────────────────────────── */}
        <AnimatePresence>
          {showCheckout && (
            <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'flex-end'}}>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                onClick={()=>setShowCheckout(false)}
                style={{position:'absolute',inset:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(6px)'}}/>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:26,stiffness:260}}
                style={{position:'relative',width:'100%',background:'#fff',borderRadius:'28px 28px 0 0',maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 -20px 60px rgba(0,0,0,0.15)'}}>

                {/* Sheet Handle */}
                <div style={{width:36,height:4,background:'#e2e8f0',borderRadius:2,margin:'14px auto 0'}}/>

                {/* Sheet Header */}
                <div style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${T.border}`}}>
                  <div>
                    <h2 style={{margin:0,fontSize:'18px',fontWeight:900,color:T.ink}}>
                      {checkoutStep==='review'?'🛒 Your Order':'💳 Payment'}
                    </h2>
                    <p style={{margin:'2px 0 0',fontSize:'11px',color:T.txt2,fontWeight:600}}>
                      {checkoutStep==='review'?`${cartItemCount} items · ${fmtRaw(cartTotal)}`:'Choose how you\'ll pay'}
                    </p>
                  </div>
                  {/* Step indicator */}
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:T.accent}}/>
                    <div style={{width:20,height:2,background:checkoutStep==='payment'?T.accent:T.border,borderRadius:1,transition:'all 0.3s'}}/>
                    <div style={{width:8,height:8,borderRadius:'50%',background:checkoutStep==='payment'?T.accent:T.border,transition:'all 0.3s'}}/>
                  </div>
                </div>

                <div style={{flex:1,overflowY:'auto',padding:'20px'}} className="hide-scrollbar">

                  {checkoutStep === 'review' && (
                    <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}>
                      {/* Cart items */}
                      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                        {Object.entries(cart).map(([id,qty]) => {
                          const p = activeProducts.find(x=>x.id===id);
                          if (!p) return null;
                          return (
                            <div key={id} style={{display:'flex',alignItems:'center',gap:12,background:T.bg,padding:'12px 14px',borderRadius:'16px',border:`1px solid ${T.border}`}}>
                              <div style={{width:44,height:44,borderRadius:'12px',overflow:'hidden',background:T.surface2,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                {p.image?<img src={p.image} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Sparkles size={16} color={T.txt3}/>}
                              </div>
                              <div style={{flex:1}}>
                                <p style={{margin:0,fontSize:'13px',fontWeight:800,color:T.ink}}>{p.name}</p>
                                <p style={{margin:'2px 0 0',fontSize:'11px',color:T.txt2,fontWeight:600}}>{qty} × {fmtRaw(p.price)}</p>
                              </div>
                              <div style={{textAlign:'right',flexShrink:0}}>
                                <p style={{margin:0,fontSize:'14px',fontWeight:900,color:T.ink}}>{fmtRaw(p.price*qty)}</p>
                                <button onClick={()=>setCart(prev=>{const {[id]:_,...rest}=prev;return rest;})}
                                  style={{background:'none',border:'none',color:T.txt3,cursor:'pointer',padding:'2px',marginTop:2,display:'flex',alignItems:'center',justifyContent:'flex-end',width:'100%'}}>
                                  <X size={12}/>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order summary */}
                      <div style={{background:T.bg,borderRadius:'18px',padding:'16px',border:`1px solid ${T.border}`,marginBottom:20}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                          <span style={{fontSize:'13px',color:T.txt2,fontWeight:600}}>Subtotal</span>
                          <span style={{fontSize:'13px',color:T.ink,fontWeight:700}}>{fmtRaw(cartTotal)}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                          <span style={{fontSize:'13px',color:T.txt2,fontWeight:600}}>Delivery</span>
                          <span style={{fontSize:'13px',color:T.success,fontWeight:700}}>FREE</span>
                        </div>
                        <div style={{height:1,background:T.border,margin:'10px 0'}}/>
                        <div style={{display:'flex',justifyContent:'space-between'}}>
                          <span style={{fontSize:'14px',color:T.ink,fontWeight:800}}>Total</span>
                          <span style={{fontSize:'18px',color:T.accent,fontWeight:900}}>{fmtRaw(cartTotal)}</span>
                        </div>
                      </div>

                      <button onClick={()=>setCheckoutStep('payment')}
                        style={{width:'100%',padding:'16px',borderRadius:'16px',background:`linear-gradient(135deg,${T.accent},${T.accentDark})`,color:'#fff',border:'none',fontSize:'14px',fontWeight:900,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 8px 24px rgba(79,70,229,0.3)'}}>
                        Continue to Payment <ArrowRight size={16}/>
                      </button>
                    </motion.div>
                  )}

                  {checkoutStep === 'payment' && (
                    <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}>
                      {/* Payment methods */}
                      <p style={{fontSize:'11px',fontWeight:800,color:T.txt2,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 12px'}}>Select Payment Method</p>

                      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                        {/* On Delivery */}
                        {[
                          {key:'DELIVERY', icon:<Truck size={18}/>, label:'Pay on Delivery', sub:'Cash when your order arrives', color:'#0891b2'},
                          {key:'TRANSFER', icon:<CreditCard size={18}/>, label:'Bank Transfer', sub:'Send to supplier account', color:'#7c3aed'},
                        ].map(opt => (
                          <button key={opt.key} onClick={()=>setPaymentMethod(opt.key as any)}
                            style={{width:'100%',padding:'14px 16px',borderRadius:'16px',border:`2px solid ${paymentMethod===opt.key?opt.color:T.border}`,background:paymentMethod===opt.key?`${opt.color}12`:'#fff',display:'flex',alignItems:'center',gap:14,cursor:'pointer',textAlign:'left',transition:'all 0.2s'}}>
                            <div style={{width:40,height:40,borderRadius:'12px',background:paymentMethod===opt.key?`${opt.color}20`:T.surface2,display:'flex',alignItems:'center',justifyContent:'center',color:opt.color,flexShrink:0}}>
                              {opt.icon}
                            </div>
                            <div style={{flex:1}}>
                              <p style={{margin:0,fontSize:'14px',fontWeight:800,color:T.ink}}>{opt.label}</p>
                              <p style={{margin:'2px 0 0',fontSize:'11px',color:T.txt2,fontWeight:600}}>{opt.sub}</p>
                            </div>
                            <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${paymentMethod===opt.key?opt.color:T.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              {paymentMethod===opt.key && <div style={{width:8,height:8,borderRadius:'50%',background:opt.color}}/>}
                            </div>
                          </button>
                        ))}

                        {/* Debt option — verified only */}
                        <button onClick={()=>isVerified&&setPaymentMethod('DEBT')} disabled={!isVerified}
                          style={{width:'100%',padding:'14px 16px',borderRadius:'16px',border:`2px solid ${paymentMethod==='DEBT'?T.success:isVerified?T.border:'#e2e8f0'}`,background:paymentMethod==='DEBT'?T.successLt:isVerified?'#fff':'#fafafa',display:'flex',alignItems:'center',gap:14,cursor:isVerified?'pointer':'not-allowed',textAlign:'left',transition:'all 0.2s',opacity:isVerified?1:0.6}}>
                          <div style={{width:40,height:40,borderRadius:'12px',background:paymentMethod==='DEBT'?'#d1fae5':isVerified?T.surface2:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:isVerified?T.success:T.txt3,flexShrink:0}}>
                            {isVerified?<ShieldCheck size={18}/>:<Lock size={18}/>}
                          </div>
                          <div style={{flex:1}}>
                            <p style={{margin:0,fontSize:'14px',fontWeight:800,color:T.ink}}>Add to Credit Tab {!isVerified&&<span style={{fontSize:'10px',background:'#fef3c7',color:'#92400e',padding:'2px 6px',borderRadius:'6px',fontWeight:700,marginLeft:6}}>LOCKED</span>}</p>
                            <p style={{margin:'2px 0 0',fontSize:'11px',color:T.txt2,fontWeight:600}}>
                              {isVerified?`Current balance: ${fmtRaw(customer?.debt_balance||0)}`:'Only verified clients can use credit'}
                            </p>
                          </div>
                          <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${paymentMethod==='DEBT'?T.success:T.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            {paymentMethod==='DEBT' && <div style={{width:8,height:8,borderRadius:'50%',background:T.success}}/>}
                          </div>
                        </button>
                      </div>

                      {/* Transfer details */}
                      <AnimatePresence>
                        {paymentMethod==='TRANSFER' && (
                          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden',marginBottom:20}}>
                            <div style={{padding:'20px',borderRadius:'20px',background:'linear-gradient(135deg,#1e293b,#0f172a)',color:'#fff',boxShadow:'0 10px 30px rgba(15,23,42,0.2)'}}>
                              <p style={{margin:'0 0 14px',fontSize:'10px',color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em'}}>Transfer Details</p>
                              {[
                                {label:'Recipient',value:assignedSupplier?.full_name||'Bakery Admin'},
                                {label:'Bank',value:assignedSupplier?.bank_name||'Guaranty Trust Bank'},
                                {label:'Account',value:assignedSupplier?.account_number||'0422119034',big:true},
                              ].map(row=>(
                                <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px dashed rgba(255,255,255,0.08)',paddingBottom:10,marginBottom:10}}>
                                  <span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',fontWeight:600}}>{row.label}</span>
                                  <span style={{fontSize:row.big?'18px':'13px',fontWeight:900,color:row.big?T.success:'#fff',letterSpacing:row.big?'2px':'normal'}}>{row.value}</span>
                                </div>
                              ))}
                              {/* Upload proof */}
                              <label style={{display:'block',marginTop:4,padding:'12px',borderRadius:'14px',border:'1px dashed rgba(255,255,255,0.2)',cursor:'pointer',textAlign:'center'}}>
                                <input type="file" accept="image/*,application/pdf" onChange={e=>setPaymentProof(e.target.files?.[0]||null)} style={{display:'none'}}/>
                                <p style={{margin:0,fontSize:'12px',fontWeight:700,color:paymentProof?T.success:'rgba(255,255,255,0.6)'}}>
                                  {paymentProof?`✓ ${paymentProof.name}`:'📎 Upload Payment Proof (optional)'}
                                </p>
                              </label>
                              {/* WhatsApp notify */}
                              {assignedSupplier && (
                                <a href={`https://wa.me/${(assignedSupplier.whatsapp_number||assignedSupplier.phone||'').replace(/\D/g,'').replace(/^0/,'234')}?text=${encodeURIComponent(`Hello ${assignedSupplier.full_name}, I've paid ${fmtRaw(cartTotal)} for my order.`)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:12,padding:'13px',borderRadius:'14px',background:'#25D366',color:'#fff',textDecoration:'none',fontWeight:900,fontSize:'12px',boxShadow:'0 6px 20px rgba(37,211,102,0.3)'}}>
                                  <MessageSquare size={16}/> Notify Supplier on WhatsApp
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Order total recap */}
                      <div style={{background:T.bg,borderRadius:'16px',padding:'14px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'13px',fontWeight:700,color:T.txt2}}>Order Total</span>
                        <span style={{fontSize:'20px',fontWeight:900,color:T.ink,letterSpacing:'-0.02em'}}>{fmtRaw(cartTotal)}</span>
                      </div>

                      <div style={{display:'flex',gap:10}}>
                        <button onClick={()=>setCheckoutStep('review')}
                          style={{flex:1,padding:'15px',borderRadius:'14px',background:T.surface2,border:`1.5px solid ${T.border}`,color:T.txt2,fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                          Back
                        </button>
                        <button onClick={handlePlaceOrder} disabled={isOrdering}
                          style={{flex:2,padding:'15px',borderRadius:'14px',background:isOrdering?T.txt3:`linear-gradient(135deg,${T.accent},${T.accentDark})`,color:'#fff',border:'none',fontWeight:900,fontSize:'14px',cursor:isOrdering?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:isOrdering?'none':'0 8px 24px rgba(79,70,229,0.3)',transition:'all 0.2s'}}>
                          <CheckCircle2 size={16}/>
                          {isOrdering?'Placing Order...':'Confirm Order'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── SUCCESS OVERLAY ─────────────────────────────────────── */}
        <AnimatePresence>
          {showSuccess && (
            <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:'absolute',inset:0,background:'rgba(15,23,42,0.85)',backdropFilter:'blur(12px)'}}/>
              <motion.div initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',damping:14,stiffness:200}}
                style={{position:'relative',textAlign:'center'}}>
                <motion.div animate={{scale:[1,1.1,1]}} transition={{repeat:Infinity,duration:2}}
                  style={{width:90,height:90,borderRadius:'50%',background:T.success,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',boxShadow:'0 0 0 20px rgba(16,185,129,0.15),0 0 60px rgba(16,185,129,0.4)'}}>
                  <CheckCircle2 size={44} color="#fff"/>
                </motion.div>
                <h2 style={{color:'#fff',fontSize:'26px',fontWeight:900,margin:'0 0 8px',letterSpacing:'-0.03em'}}>Order Placed! 🎉</h2>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:'14px',fontWeight:600,margin:0}}>
                  Your fresh bakery items are on the way.<br/>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Payment: {paymentMethod==='DELIVERY'?'Cash on Delivery':paymentMethod==='TRANSFER'?'Bank Transfer':'Added to Credit Tab'}</span>
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CustomerBottomNav/>
      </div>
    </AnimatedPage>
  );
};

export default CustomerStore;
