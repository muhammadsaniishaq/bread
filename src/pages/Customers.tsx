import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import type { Customer } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { ImageCropper } from '../components/ImageCropper';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { useAuth } from '../store/AuthContext';
import { Award, Star, Crown, Medal, MessageCircle, X, Camera, Search, UserPlus, ChevronRight, Phone, MapPin, CreditCard, Check, QrCode, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';

/* ── Design Tokens ── */
const T = {
  bg:'#f2f3f7', surface:'#ffffff', surface2:'#f8f9fc', border:'#e8eaef',
  accent:'#4f46e5', accentLt:'#eef2ff',
  success:'#10b981', successLt:'#ecfdf5',
  danger:'#ef4444', dangerLt:'#fef2f2',
  warn:'#f59e0b',
  txt:'#0f172a', txt2:'#475569', txt3:'#94a3b8',
  shadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowMd:'0 4px 20px rgba(0,0,0,0.08)',
  radius:'16px', radiusLg:'24px',
};
const avatarPalette=[['#4f46e5','#e0e7ff'],['#0891b2','#e0f7fa'],['#059669','#d1fae5'],['#d97706','#fef3c7'],['#dc2626','#fee2e2'],['#7c3aed','#ede9fe']];
const getAvatar=(n:string)=>avatarPalette[n.charCodeAt(0)%avatarPalette.length];

export const getBadge = (points?: number) => {
  const p = points || 0;
  if (p >= 1000) return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'7px',background:'#ede9fe',color:'#7c3aed'}}><Crown size={10}/> VIP</span>;
  if (p >= 500)  return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'7px',background:'#fef9c3',color:'#a16207'}}><Star size={10}/> Gold</span>;
  if (p >= 100)  return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'7px',background:'#f1f5f9',color:'#64748b'}}><Award size={10}/> Silver</span>;
  if (p > 0)     return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 8px',borderRadius:'7px',background:'#fef3c7',color:'#b45309'}}><Medal size={10}/> Bronze</span>;
  return null;
};

const inp:React.CSSProperties={background:T.surface2,border:`1.5px solid ${T.border}`,borderRadius:'12px',padding:'11px 14px',fontSize:'14px',fontWeight:500,color:T.txt,outline:'none',width:'100%',boxSizing:'border-box',transition:'all 0.2s'};
const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px',display:'block'};

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, recordDebtPayment, refreshData } = useAppContext();
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isSupplier = role === 'SUPPLIER';

  // ── For suppliers: find their customer record to get their ID ─────────────
  const mySupplierAccount = useMemo(() =>
    customers.find(c => c.profile_id === user?.id),
    [customers, user]);

  // ── Base list: suppliers only see THEIR assigned customers ────────────────
  const baseCustomers = useMemo(() => {
    if (!isSupplier) return customers;
    return customers.filter(c =>
      (user?.id && c.assignedSupplierId === user.id) ||
      (mySupplierAccount?.id && c.assignedSupplierId === mySupplierAccount.id)
    );
  }, [customers, isSupplier, user, mySupplierAccount]);

  const [isAdding, setIsAdding]       = useState(false);
  const [search, setSearch]           = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (decodedId: string) => {
    setShowScanner(false);
    if (decodedId.startsWith('receipt:'))         navigate(`/receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('payment:'))    navigate(`/customer-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('bakery-receipt:')) navigate(`/bakery-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('inventory:'))  navigate(`/inventory/receipt/${decodedId.split(':')[2]}`);
    else if (customers.find(c => c.id === decodedId)) navigate(`/customers/${decodedId}`);
  };

  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes]     = useState('');
  const [image, setImage]     = useState('');
  const [rawUpload, setRawUpload] = useState<string|null>(null);

  const [paymentCustomerId, setPaymentCustomerId] = useState<string|null>(null);
  const [paymentAmount, setPaymentAmount]         = useState('');
  const [paymentMethod, setPaymentMethod]         = useState<'Cash'|'Transfer'>('Cash');

  const filteredCustomers = useMemo(() =>
    baseCustomers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase())
    ),
  [baseCustomers, search]);

  const totalDebt   = baseCustomers.reduce((s,c) => s+(c.debtBalance||0), 0);
  const debtorCount = baseCustomers.filter(c => c.debtBalance > 0).length;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r=new FileReader(); r.onloadend=()=>setRawUpload(r.result as string); r.readAsDataURL(file); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name) return;
    const newCustomer: Customer = { id:Date.now().toString(), name, phone, location, notes, debtBalance:0, loyaltyPoints:0, image:image||undefined };
    await addCustomer(newCustomer);
    setName(''); setPhone(''); setLocation(''); setNotes(''); setImage('');
    setIsAdding(false);
    navigate(`/customer-docs/${newCustomer.id}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!paymentCustomerId) return;
    const amt = parseInt(paymentAmount); if (!amt||amt<=0) return;
    const pid = Date.now().toString();
    await recordDebtPayment({ id:pid, date:new Date().toISOString(), customerId:paymentCustomerId, amount:amt, method:paymentMethod });
    setPaymentAmount(''); setPaymentMethod('Cash'); setPaymentCustomerId(null);
    navigate(`/customer-receipt/${pid}`);
  };

  const handleWhatsApp = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer.phone) { alert('No phone number saved.'); return; }
    let p = customer.phone.replace(/\D/g,'');
    if (p.startsWith('0')) p = '234'+p.substring(1);
    const msg = `Assalamu Alaikum ${customer.name},\n\nReminder: You have an outstanding balance of ₦${customer.debtBalance.toLocaleString()} at our store. Please let us know when you plan to settle. Thank you!`;
    window.open(`whatsapp://send?phone=${p}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AnimatedPage>
      <div style={{background:T.bg,minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:'96px'}}>
        <div style={{padding:'20px 16px 0'}}>

          {/* HERO */}
          <div style={{background:'linear-gradient(135deg,#4f46e5 0%,#6366f1 55%,#818cf8 100%)',borderRadius:'28px',padding:'24px',marginBottom:'24px',position:'relative',overflow:'hidden',boxShadow:'0 8px 32px rgba(79,70,229,0.3)'}}>
            <div style={{position:'absolute',top:'-50px',right:'-50px',width:'180px',height:'180px',background:'rgba(255,255,255,0.07)',borderRadius:'50%',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',position:'relative',zIndex:1}}>
              <div>
                <p style={{color:'rgba(255,255,255,0.6)',fontSize:'11px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 4px'}}>{isSupplier ? 'My Clients' : t('cust.title')}</p>
                <div style={{display:'flex',alignItems:'flex-end',gap:'10px'}}>
                  <span style={{fontSize:'48px',fontWeight:900,color:'#fff',lineHeight:1,letterSpacing:'-0.04em'}}>{baseCustomers.length}</span>
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',fontWeight:700,marginBottom:'8px'}}>clients</span>
                </div>
              </div>
              <div style={{textAlign:'right',background:'rgba(0,0,0,0.15)',borderRadius:'14px',padding:'12px 16px',backdropFilter:'blur(10px)'}}>
                <p style={{color:'rgba(255,255,255,0.55)',fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Open Debt</p>
                <p style={{color:'#fde68a',fontWeight:900,fontSize:'16px',margin:'4px 0 0'}}>₦{totalDebt.toLocaleString()}</p>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:'10px',fontWeight:600,margin:'2px 0 0'}}>{debtorCount} debtors</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',position:'relative',zIndex:1}}>
              {!isSupplier && (
                <button onClick={()=>setIsAdding(!isAdding)}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:'14px',padding:'12px',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                  {isAdding?<X size={16}/>:<UserPlus size={16}/>} {isAdding?'Cancel':'Add Client'}
                </button>
              )}
              <button onClick={()=>setShowScanner(true)}
                style={{flex:isSupplier?1:undefined,display:'flex',alignItems:'center',gap:'7px',background:'rgba(255,255,255,0.92)',color:T.accent,border:'none',borderRadius:'14px',padding:'12px 18px',fontWeight:700,fontSize:'13px',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
                <QrCode size={16}/> Scan ID
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div style={{position:'relative',marginBottom:'18px'}}>
            <Search size={16} color={T.txt3} style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input style={{...inp,paddingLeft:'42px'}} placeholder="Search by name or location..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* ADD FORM MODAL */}
          {isAdding&&!rawUpload&&(
            <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(8px)',zIndex:50,display:'flex',alignItems:'flex-end'}}>
              <form onSubmit={handleAdd} style={{background:T.surface,width:'100%',maxHeight:'90vh',borderRadius:'28px 28px 0 0',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 16px',borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                  <h2 style={{color:T.txt,fontWeight:800,fontSize:'17px',margin:0}}>{t('cust.addCustomer')}</h2>
                  <button type="button" onClick={()=>setIsAdding(false)} style={{width:'36px',height:'36px',borderRadius:'10px',background:T.surface2,border:`1.5px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                    <X size={16} color={T.txt2}/>
                  </button>
                </div>
                <div style={{padding:'20px 24px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'14px'}}>
                  {/* Photo */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'4px'}}>
                    <label style={{width:'72px',height:'72px',borderRadius:'18px',background:T.surface2,border:`2px dashed ${T.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',position:'relative'}}>
                      {image?<img src={image} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<><Camera size={20} color={T.txt3}/><span style={{fontSize:'9px',fontWeight:700,color:T.txt3,marginTop:'3px',textTransform:'uppercase'}}>Photo</span></>}
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/>
                    </label>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div><label style={lbl}>Name *</label><input style={inp} value={name} onChange={e=>setName(e.target.value)} required placeholder="Full name"/></div>
                    <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="080..."/></div>
                  </div>
                  <div><label style={lbl}>Location / Route</label><input style={inp} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Shop address or route"/></div>
                  <div><label style={lbl}>Notes</label><textarea style={{...inp,resize:'none'} as React.CSSProperties} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes about this client..."/></div>
                  <button type="submit" style={{background:T.accent,color:'#fff',border:'none',borderRadius:'14px',padding:'15px',fontWeight:800,fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 14px rgba(79,70,229,0.3)'}}>
                    <UserPlus size={16}/> Create & Print ID Card
                  </button>
                </div>
              </form>
            </div>
          )}

          {rawUpload&&<ImageCropper imageSrc={rawUpload} onCropComplete={c=>{setImage(c);setRawUpload(null);}} onCancel={()=>setRawUpload(null)}/>}

          {/* LIST */}
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {filteredCustomers.length===0?(
              <div style={{textAlign:'center',padding:'56px 0',color:T.txt3,border:`1.5px dashed ${T.border}`,borderRadius:T.radiusLg}}>
                <UserPlus size={36} style={{margin:'0 auto 10px',opacity:0.2}}/>
                <p style={{fontWeight:700,fontSize:'14px',color:T.txt2}}>No Clients Found</p>
                <p style={{fontSize:'12px',margin:'4px 0 0'}}>Try a different search.</p>
              </div>
            ):filteredCustomers.map(customer=>{
              const [ac,lc]=getAvatar(customer.name);
              const isDebt=customer.debtBalance>0;
              const isPaying=paymentCustomerId===customer.id;
              return(
                <div key={customer.id}
                  style={{background:T.surface,border:`1.5px solid ${isDebt?'#fecaca':T.border}`,borderRadius:T.radiusLg,padding:'16px',boxShadow:T.shadow,cursor:'pointer',transition:'all 0.2s'}}
                  onClick={e=>{if((e.target as HTMLElement).closest('.no-nav'))return;navigate(`/customers/${customer.id}`);}}>

                  {/* Top row */}
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:isDebt?'14px':0}}>
                    <div style={{width:'48px',height:'48px',borderRadius:'14px',background:lc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,color:ac,flexShrink:0,overflow:'hidden',border:`1.5px solid ${ac}20`}}>
                      {customer.image?<img src={customer.image} alt={customer.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:customer.name.charAt(0)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
                        <span style={{color:T.txt,fontWeight:800,fontSize:'15px',letterSpacing:'-0.01em'}}>{customer.name}</span>
                        {getBadge(customer.loyaltyPoints)}
                        {(() => {
                           if (customer.is_verified) return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'7px',background:T.successLt,color:T.success}}><ShieldCheck size={10}/> Verified</span>;
                           if (customer.phone && customer.pin) return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'7px',background:T.warn+'20',color:T.warn}}><Shield size={10}/> Pending</span>;
                           return <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'7px',background:T.dangerLt,color:T.danger}}><ShieldAlert size={10}/> Unverified</span>;
                        })()}
                      </div>
                      <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                        {customer.phone&&<span style={{color:T.txt3,fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}><Phone size={10}/>{customer.phone}</span>}
                        {customer.location&&<span style={{color:T.txt3,fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}><MapPin size={10}/>{customer.location}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {isDebt?(
                        <div style={{background:T.dangerLt,borderRadius:'10px',padding:'8px 12px',border:`1px solid #fecaca`}}>
                          <p style={{color:T.txt3,fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 2px'}}>Debt</p>
                          <p style={{color:T.danger,fontWeight:900,fontSize:'15px',margin:0}}>₦{customer.debtBalance.toLocaleString()}</p>
                        </div>
                      ):(
                        <div style={{background:T.successLt,borderRadius:'10px',padding:'8px 12px',border:'1px solid #bbf7d0'}}>
                          <p style={{color:T.success,fontSize:'12px',fontWeight:800,margin:0}}>✓ Clear</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Verify for Suppliers (Phase 9) */}
                  {isSupplier && !customer.is_verified && (
                    <div className="no-nav" onClick={e=>e.stopPropagation()} 
                         style={{padding:'10px 16px', background:T.warn+'10', borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                       <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <ShieldAlert size={14} color={T.warn}/>
                          <span style={{fontSize:'12px', fontWeight:700, color:T.txt2}}>Allow Credit?</span>
                       </div>
                       <button 
                         onClick={async () => {
                           // Write to BOTH tables for 100% sync
                           await updateCustomer({ ...customer, is_verified: true });
                           await supabase.from('profiles').update({ is_verified: true }).eq('id', customer.profile_id || customer.id);
                           // Refresh so badge updates instantly
                           await refreshData();
                         }}
                         style={{background:T.success, color:'#fff', border:'none', borderRadius:'8px', padding:'6px 14px', fontSize:'11px', fontWeight:800, cursor:'pointer', boxShadow:'0 2px 8px rgba(16,185,129,0.3)'}}
                       >
                         Verify Now ✓
                       </button>
                    </div>
                  )}

                  {/* Debt Actions */}
                  {isDebt&&(
                    <div className="no-nav" onClick={e=>e.stopPropagation()}>
                      <div style={{height:'1px',background:T.border,marginBottom:'12px'}}/>
                      {isPaying?(
                        <form onSubmit={handleRecordPayment} style={{display:'flex',flexDirection:'column',gap:'10px',background:T.surface2,borderRadius:'14px',padding:'14px',border:`1.5px solid ${T.border}`}}>
                          <p style={{color:T.txt,fontWeight:800,fontSize:'13px',margin:0,display:'flex',alignItems:'center',gap:'7px'}}><CreditCard size={14} color={T.success}/> Record Payment</p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                            {(['Cash','Transfer'] as const).map(m=>(
                              <button key={m} type="button" onClick={()=>setPaymentMethod(m)}
                                style={{padding:'9px',borderRadius:'10px',fontSize:'12px',fontWeight:700,cursor:'pointer',border:`2px solid ${paymentMethod===m?T.success:T.border}`,background:paymentMethod===m?T.successLt:'transparent',color:paymentMethod===m?T.success:T.txt2,transition:'all 0.2s'}}>
                                {m}
                              </button>
                            ))}
                          </div>
                          <input type="number" placeholder={`Max ₦${customer.debtBalance.toLocaleString()}`} value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} required
                            style={{...inp,fontWeight:700,fontSize:'15px',color:T.success}}/>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button type="submit" style={{flex:2,background:'linear-gradient(135deg,#10b981,#047857)',color:'#fff',border:'none',borderRadius:'10px',padding:'11px',fontWeight:700,fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                              <Check size={14}/> Confirm
                            </button>
                            <button type="button" onClick={()=>setPaymentCustomerId(null)} style={{flex:1,background:T.surface2,border:`1.5px solid ${T.border}`,color:T.txt2,borderRadius:'10px',padding:'11px',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>Cancel</button>
                          </div>
                        </form>
                      ):(
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={()=>setPaymentCustomerId(customer.id)}
                            style={{flex:2,background:T.dangerLt,color:T.danger,border:`1.5px solid ${T.danger}20`,borderRadius:'12px',padding:'10px',fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                            <CreditCard size={14}/> Collect Payment
                          </button>
                          <button onClick={e=>handleWhatsApp(customer,e)}
                            style={{flex:1,background:'#25D366',color:'#fff',border:'none',borderRadius:'12px',padding:'10px',fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',boxShadow:'0 3px 10px rgba(37,211,102,0.25)'}}>
                            <MessageCircle size={14}/> WA
                          </button>
                          <button onClick={e=>{e.stopPropagation();navigate(`/customers/${customer.id}`);}}
                            style={{width:'40px',background:T.accentLt,color:T.accent,border:`1.5px solid ${T.accent}25`,borderRadius:'12px',padding:'10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <ChevronRight size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showScanner&&<QRScanner onScan={handleScan} onClose={()=>setShowScanner(false)}/>}
      </div>
    </AnimatedPage>
  );
};

export default Customers;
