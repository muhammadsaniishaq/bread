import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { ImageCropper } from '../components/ImageCropper';
import {
  ArrowLeft, Phone, MapPin, MessageCircle, MessageSquare,
  FileText, Edit2, Trash2, Camera, Star, TrendingUp,
  CreditCard, X, Check, AlertTriangle, Activity, BadgeCheck
} from 'lucide-react';

const T = {
  bg:'#f2f3f7', surface:'#ffffff', surface2:'#f8f9fc', border:'#e8eaef',
  accent:'#4f46e5', accentLt:'#eef2ff',
  success:'#10b981', successLt:'#ecfdf5',
  danger:'#ef4444', dangerLt:'#fef2f2',
  warn:'#f59e0b', warnLt:'#fffbeb',
  txt:'#0f172a', txt2:'#475569', txt3:'#94a3b8',
  shadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  radius:'16px', radiusLg:'24px',
};
const avatarPalette=[['#4f46e5','#e0e7ff'],['#0891b2','#e0f7fa'],['#059669','#d1fae5'],['#d97706','#fef3c7'],['#dc2626','#fee2e2'],['#7c3aed','#ede9fe']];
const getAvatar=(n:string)=>avatarPalette[n.charCodeAt(0)%avatarPalette.length];
const inp:React.CSSProperties={background:T.surface2,border:`1.5px solid ${T.border}`,borderRadius:'12px',padding:'12px 14px',fontSize:'14px',fontWeight:500,color:T.txt,outline:'none',width:'100%',boxSizing:'border-box',transition:'all 0.2s'};
const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px',display:'block'};

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, transactions, debtPayments, products, recordDebtPayment, updateCustomer, deleteCustomer } = useAppContext();
  const customer = customers.find(c => c.id === id);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash'|'Transfer'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer?.name||'');
  const [editPhone, setEditPhone] = useState(customer?.phone||'');
  const [editLocation, setEditLocation] = useState(customer?.location||'');
  const [editNotes, setEditNotes] = useState(customer?.notes||'');
  const [editImage, setEditImage] = useState(customer?.image||'');
  const [rawUpload, setRawUpload] = useState<string|null>(null);

  const handleImageUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(file){const r=new FileReader();r.onloadend=()=>setRawUpload(r.result as string);r.readAsDataURL(file);}
  };
  const handleEditSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();if(!customer||!editName.trim())return;
    setIsProcessing(true);
    await updateCustomer({...customer,name:editName.trim(),phone:editPhone.trim(),location:editLocation.trim(),notes:editNotes.trim(),image:editImage});
    setIsEditing(false);setIsProcessing(false);
  };
  const handleDelete=async()=>{
    if(!customer)return;
    if(window.confirm(`Delete ${customer.name}?`)){await deleteCustomer(customer.id);navigate('/customers');}
  };
  const handleRecordPayment=async(e:React.FormEvent)=>{
    e.preventDefault();if(!customer)return;
    const n=parseInt(amount);if(!n||n<=0)return;
    setIsProcessing(true);
    const pid=Date.now().toString();
    await recordDebtPayment({id:pid,date:new Date().toISOString(),customerId:customer.id,amount:n,method:paymentMethod});
    setAmount('');setPaymentMethod('Cash');setShowPaymentForm(false);setIsProcessing(false);
    navigate(`/customer-receipt/${pid}`);
  };

  const metrics=useMemo(()=>{
    if(!customer)return null;
    const txs=transactions.filter(t=>t.customerId===customer.id);
    const pays=debtPayments.filter(p=>p.customerId===customer.id);
    return {
      lifetimeValue:txs.reduce((s,t)=>s+t.totalPrice,0),
      totalDebtIssued:txs.filter(t=>t.type==='Debt').reduce((s,t)=>s+t.totalPrice,0),
      totalDebtPaid:pays.reduce((s,p)=>s+p.amount,0),
      txCount:txs.length,
      history:[...txs.map(t=>({...t,_type:'sale',_date:new Date(t.date)})),...pays.map(p=>({...p,_type:'payment',_date:new Date(p.date)}))]
        .sort((a,b)=>b._date.getTime()-a._date.getTime()),
    };
  },[customer,transactions,debtPayments]);

  if(!customer||!metrics)return(
    <AnimatedPage><div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'16px'}}>
      <p style={{color:T.txt2}}>Customer not found.</p>
      <button onClick={()=>navigate(-1)} style={{background:T.accent,color:'#fff',border:'none',borderRadius:'12px',padding:'12px 24px',fontWeight:700,cursor:'pointer'}}>Go Back</button>
    </div></AnimatedPage>
  );

  const getProductName=(pid:string)=>products.find(p=>p.id===pid)?.name||'Unknown';
  const isVIP=(customer.loyaltyPoints||0)>100;
  const [ac,lc]=getAvatar(customer.name);

  return (
    <AnimatedPage>
      <div style={{background:T.bg,minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:'96px'}}>
        <div style={{padding:'20px 16px 0'}}>

          {/* HERO */}
          <div style={{background:'linear-gradient(135deg,#4f46e5 0%,#6366f1 60%,#818cf8 100%)',borderRadius:'28px',padding:'24px',marginBottom:'24px',position:'relative',overflow:'hidden',boxShadow:'0 8px 32px rgba(79,70,229,0.3)'}}>
            <div style={{position:'absolute',top:'-50px',right:'-50px',width:'180px',height:'180px',background:'rgba(255,255,255,0.07)',borderRadius:'50%',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',position:'relative',zIndex:1}}>
              <button onClick={()=>navigate(-1)} style={{width:'40px',height:'40px',borderRadius:'12px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <ArrowLeft size={18} color="#fff"/>
              </button>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setIsEditing(true)} style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:'10px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                  <Edit2 size={13}/> Edit
                </button>
                <button onClick={()=>navigate(`/customer-docs/${customer.id}`)} style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:'10px',padding:'8px 14px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                  <FileText size={13}/> Docs
                </button>
                <button onClick={handleDelete} style={{background:'rgba(239,68,68,0.25)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',borderRadius:'10px',padding:'8px 12px',fontSize:'12px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center'}}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'16px',position:'relative',zIndex:1}}>
              <div style={{width:'64px',height:'64px',borderRadius:'18px',background:lc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:900,color:ac,boxShadow:'0 4px 16px rgba(0,0,0,0.2)',flexShrink:0,overflow:'hidden'}}>
                {customer.image?<img src={customer.image} alt={customer.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:customer.name.charAt(0)}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                  <h1 style={{color:'#fff',fontWeight:900,fontSize:'22px',margin:0,letterSpacing:'-0.02em'}}>{customer.name}</h1>
                  {isVIP&&<span style={{background:'rgba(251,191,36,0.25)',color:'#fde68a',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:900,textTransform:'uppercase',display:'flex',alignItems:'center',gap:'3px'}}><Star size={9} fill="#fde68a"/> VIP</span>}
                  {customer.pin&&<span style={{background:'rgba(52,211,153,0.2)',color:'#a7f3d0',border:'1px solid rgba(52,211,153,0.3)',borderRadius:'8px',padding:'2px 8px',fontSize:'10px',fontWeight:900,textTransform:'uppercase',display:'flex',alignItems:'center',gap:'3px'}}><BadgeCheck size={9}/> Auth</span>}
                </div>
                <div style={{display:'flex',gap:'14px',marginTop:'6px',flexWrap:'wrap'}}>
                  {customer.phone&&<span style={{color:'rgba(255,255,255,0.75)',fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',gap:'5px'}}><Phone size={12}/>{customer.phone}</span>}
                  {customer.location&&<span style={{color:'rgba(255,255,255,0.75)',fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',gap:'5px'}}><MapPin size={12}/>{customer.location}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 4 STAT CARDS */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'20px'}}>
            <div style={{background:T.surface,borderRadius:T.radiusLg,padding:'18px',border:`1.5px solid ${T.border}`,boxShadow:T.shadow}}>
              <p style={{fontSize:'10px',fontWeight:700,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>Lifetime Value</p>
              <p style={{fontSize:'20px',fontWeight:900,color:T.success,margin:0}}>₦{metrics.lifetimeValue.toLocaleString()}</p>
              <p style={{fontSize:'11px',color:T.txt3,margin:'5px 0 0'}}>{metrics.txCount} orders total</p>
            </div>
            <div style={{background:customer.debtBalance>0?T.dangerLt:T.successLt,borderRadius:T.radiusLg,padding:'18px',border:`1.5px solid ${customer.debtBalance>0?'#fecaca':'#bbf7d0'}`,boxShadow:T.shadow}}>
              <p style={{fontSize:'10px',fontWeight:700,color:customer.debtBalance>0?T.danger:T.success,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>Active Debt</p>
              <p style={{fontSize:'20px',fontWeight:900,color:customer.debtBalance>0?T.danger:T.success,margin:0}}>₦{customer.debtBalance.toLocaleString()}</p>
              {customer.debtBalance>0
                ?<button onClick={()=>setShowPaymentForm(true)} style={{marginTop:'8px',background:T.danger,color:'#fff',border:'none',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',fontWeight:700,cursor:'pointer',width:'100%'}}>Settle Now</button>
                :<p style={{fontSize:'11px',color:T.success,margin:'6px 0 0',fontWeight:700}}>✓ Clear</p>}
            </div>
            <div style={{background:T.surface,borderRadius:T.radiusLg,padding:'18px',border:`1.5px solid ${T.border}`,boxShadow:T.shadow}}>
              <p style={{fontSize:'10px',fontWeight:700,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>Debt Paid</p>
              <p style={{fontSize:'20px',fontWeight:900,color:T.accent,margin:0}}>₦{metrics.totalDebtPaid.toLocaleString()}</p>
              <p style={{fontSize:'11px',color:T.txt3,margin:'5px 0 0'}}>of ₦{metrics.totalDebtIssued.toLocaleString()}</p>
            </div>
            <div style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)',borderRadius:T.radiusLg,padding:'18px',border:'1.5px solid #fde68a',boxShadow:T.shadow}}>
              <p style={{fontSize:'10px',fontWeight:700,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 8px'}}>Rewards</p>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'9px',background:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center'}}><Star size={16} color="#fff" fill="#fff"/></div>
                <div>
                  <p style={{fontSize:'20px',fontWeight:900,color:'#b45309',margin:0}}>{customer.loyaltyPoints||0}</p>
                  <p style={{fontSize:'10px',color:'#b45309',margin:0}}>≈ ₦{((customer.loyaltyPoints||0)*10).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DEBT ALERT */}
          {customer.debtBalance>0&&customer.phone&&(
            <div style={{background:T.warnLt,border:`1.5px solid #fde68a`,borderRadius:T.radiusLg,padding:'18px',marginBottom:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#fef3c7',border:'1.5px solid #fde68a',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <AlertTriangle size={18} color={T.warn}/>
                </div>
                <div>
                  <p style={{color:'#92400e',fontWeight:800,fontSize:'13px',margin:0}}>Outstanding Debt Alert</p>
                  <p style={{color:'#a16207',fontSize:'12px',margin:'2px 0 0'}}>₦{customer.debtBalance.toLocaleString()} — send a reminder</p>
                </div>
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <a href={`https://wa.me/${customer.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${customer.name}, reminder about your outstanding balance of ₦${customer.debtBalance.toLocaleString()}. Thank you!`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{flex:1,background:'#25D366',color:'#fff',borderRadius:'12px',padding:'11px',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',textDecoration:'none',boxShadow:'0 4px 12px rgba(37,211,102,0.3)'}}>
                  <MessageCircle size={14}/> WhatsApp
                </a>
                <a href={`sms:${customer.phone.replace(/\D/g,'')}?body=${encodeURIComponent(`Hello ${customer.name}, please settle ₦${customer.debtBalance.toLocaleString()}. Thank you!`)}`}
                  style={{flex:1,background:T.surface,color:T.txt2,border:`1.5px solid ${T.border}`,borderRadius:'12px',padding:'11px',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',textDecoration:'none'}}>
                  <MessageSquare size={14}/> SMS
                </a>
              </div>
            </div>
          )}

          {/* PAYMENT FORM */}
          {showPaymentForm&&(
            <div style={{background:T.surface,borderRadius:T.radiusLg,border:`2px solid ${T.accent}25`,padding:'22px',marginBottom:'20px',boxShadow:'0 8px 32px rgba(79,70,229,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <p style={{color:T.txt,fontWeight:800,fontSize:'15px',margin:0,display:'flex',alignItems:'center',gap:'8px'}}><CreditCard size={16} color={T.success}/> Settle Payment</p>
                <button onClick={()=>setShowPaymentForm(false)} style={{background:T.surface2,border:`1.5px solid ${T.border}`,borderRadius:'8px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <X size={14} color={T.txt2}/>
                </button>
              </div>
              <form onSubmit={handleRecordPayment} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {(['Cash','Transfer'] as const).map(m=>(
                    <button key={m} type="button" onClick={()=>setPaymentMethod(m)}
                      style={{padding:'11px',borderRadius:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',border:`2px solid ${paymentMethod===m?T.success:T.border}`,background:paymentMethod===m?T.successLt:'transparent',color:paymentMethod===m?T.success:T.txt2,transition:'all 0.2s'}}>
                      {m}
                    </button>
                  ))}
                </div>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:T.txt3,fontWeight:700}}>₦</span>
                  <input type="number" max={customer.debtBalance} placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} required
                    style={{...inp,paddingLeft:'30px',fontSize:'18px',fontWeight:900,color:T.success}}/>
                </div>
                <button type="submit" disabled={isProcessing}
                  style={{background:'linear-gradient(135deg,#10b981,#047857)',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontWeight:700,fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 16px rgba(5,150,105,0.3)'}}>
                  <Check size={16}/> {isProcessing?'Processing...':'Confirm & Print Receipt'}
                </button>
              </form>
            </div>
          )}

          {/* NOTES */}
          {customer.notes&&(
            <div style={{background:T.surface,borderRadius:T.radius,border:`1.5px solid ${T.border}`,padding:'16px 18px',marginBottom:'20px',boxShadow:T.shadow}}>
              <p style={{fontSize:'11px',fontWeight:700,color:T.txt3,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 6px'}}>Notes</p>
              <p style={{color:T.txt2,fontSize:'14px',margin:0,lineHeight:1.6}}>{customer.notes}</p>
            </div>
          )}

          {/* TIMELINE */}
          <p style={{fontSize:'12px',fontWeight:800,color:T.txt,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
            <Activity size={15} color={T.accent}/> Transaction Ledger
          </p>
          {metrics.history.length===0?(
            <div style={{textAlign:'center',padding:'48px 0',color:T.txt3,border:`1.5px dashed ${T.border}`,borderRadius:T.radiusLg}}>
              <FileText size={36} style={{margin:'0 auto 10px',opacity:0.2}}/>
              <p style={{fontWeight:700,fontSize:'14px',color:T.txt2}}>No History Yet</p>
            </div>
          ):(
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:'19px',top:'8px',bottom:'8px',width:'2px',background:T.border}}/>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {metrics.history.map((item:any)=>{
                  const d=item._date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
                  const isSale=item._type==='sale';
                  const isPaid=item.type==='Cash'||item.type==='Transfer';
                  if(isSale){
                    const items=getTransactionItems(item);
                    const qty=items.reduce((s:number,i:any)=>s+i.quantity,0);
                    const types=Array.from(new Set(items.map((i:any)=>getProductName(i.productId)))).join(', ');
                    return(
                      <div key={`sale-${item.id}`} style={{display:'flex',gap:'14px',paddingLeft:'8px'}}>
                        <div style={{width:'22px',height:'22px',borderRadius:'50%',background:isPaid?T.accentLt:T.dangerLt,border:`2.5px solid ${isPaid?T.accent:T.danger}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'14px',position:'relative',zIndex:1}}>
                          <TrendingUp size={9} color={isPaid?T.accent:T.danger}/>
                        </div>
                        <div style={{flex:1,background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:T.radius,padding:'14px',boxShadow:T.shadow,display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                          <div>
                            <p style={{color:T.txt,fontWeight:800,fontSize:'14px',margin:0}}>Sale Issued</p>
                            <p style={{color:T.txt3,fontSize:'12px',margin:'3px 0 0'}}>{qty} items · {types}</p>
                            <p style={{color:T.txt3,fontSize:'11px',margin:'2px 0 0'}}>{d}</p>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <p style={{color:T.txt,fontWeight:900,fontSize:'16px',margin:0}}>₦{item.totalPrice.toLocaleString()}</p>
                            <span style={{background:isPaid?T.successLt:T.dangerLt,color:isPaid?T.success:T.danger,fontSize:'10px',fontWeight:900,padding:'2px 8px',borderRadius:'6px',display:'inline-block',marginTop:'4px',textTransform:'uppercase'}}>{item.type}</span>
                            <button onClick={()=>navigate(`/receipt/${item.id}`)} style={{display:'block',marginTop:'5px',color:T.accent,fontSize:'11px',fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'right'}}>View Receipt →</button>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return(
                      <div key={`pay-${item.id}`} style={{display:'flex',gap:'14px',paddingLeft:'8px'}}>
                        <div style={{width:'22px',height:'22px',borderRadius:'50%',background:T.successLt,border:`2.5px solid ${T.success}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'14px',position:'relative',zIndex:1}}>
                          <Check size={9} color={T.success}/>
                        </div>
                        <div style={{flex:1,background:T.successLt,border:'1.5px solid #bbf7d0',borderRadius:T.radius,padding:'14px',boxShadow:T.shadow,display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                          <div>
                            <p style={{color:T.success,fontWeight:800,fontSize:'14px',margin:0}}>Payment Received</p>
                            <p style={{color:'#059669',fontSize:'11px',margin:'3px 0 0'}}>{d}</p>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <p style={{color:T.success,fontWeight:900,fontSize:'16px',margin:0}}>+₦{item.amount.toLocaleString()}</p>
                            <button onClick={()=>navigate(`/customer-receipt/${item.id}`)} style={{display:'block',marginTop:'5px',color:T.success,fontSize:'11px',fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'right'}}>View Receipt →</button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>

        {/* EDIT MODAL */}
        {isEditing&&!rawUpload&&(
          <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(8px)',zIndex:50,display:'flex',alignItems:'flex-end'}}>
            <div style={{background:T.surface,width:'100%',maxHeight:'90vh',borderRadius:'28px 28px 0 0',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 16px',borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <h3 style={{color:T.txt,fontWeight:800,fontSize:'17px',margin:0}}>Edit Profile</h3>
                <button onClick={()=>setIsEditing(false)} style={{width:'36px',height:'36px',borderRadius:'10px',background:T.surface2,border:`1.5px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                  <X size={16} color={T.txt2}/>
                </button>
              </div>
              <form onSubmit={handleEditSubmit} style={{padding:'20px 24px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'14px'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'4px'}}>
                  <label style={{width:'72px',height:'72px',borderRadius:'18px',background:T.surface2,border:`2px dashed ${T.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden'}}>
                    {editImage?<img src={editImage} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<><Camera size={20} color={T.txt3}/><span style={{fontSize:'9px',fontWeight:700,color:T.txt3,marginTop:'3px',textTransform:'uppercase'}}>Photo</span></>}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleImageUpload}/>
                  </label>
                  {editImage&&<button type="button" onClick={()=>setEditImage('')} style={{marginTop:'6px',color:T.danger,fontSize:'12px',fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>Remove</button>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div><label style={lbl}>Name *</label><input style={inp} value={editName} onChange={e=>setEditName(e.target.value)} required/></div>
                  <div><label style={lbl}>Phone</label><input style={inp} type="tel" value={editPhone} onChange={e=>setEditPhone(e.target.value)}/></div>
                </div>
                <div><label style={lbl}>Location</label><input style={inp} value={editLocation} onChange={e=>setEditLocation(e.target.value)}/></div>
                <div><label style={lbl}>Notes</label><textarea style={{...inp,resize:'none'} as React.CSSProperties} rows={3} value={editNotes} onChange={e=>setEditNotes(e.target.value)}/></div>
                <div style={{display:'flex',gap:'10px',paddingTop:'4px'}}>
                  <button type="button" onClick={()=>setIsEditing(false)} style={{flex:1,background:T.surface2,border:`1.5px solid ${T.border}`,color:T.txt2,borderRadius:'12px',padding:'13px',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>Cancel</button>
                  <button type="submit" disabled={isProcessing} style={{flex:2,background:T.accent,color:'#fff',border:'none',borderRadius:'12px',padding:'13px',fontWeight:700,fontSize:'13px',cursor:'pointer',boxShadow:'0 4px 14px rgba(79,70,229,0.3)'}}>
                    {isProcessing?'Saving...':'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {rawUpload&&(
          <div style={{position:'fixed',inset:0,zIndex:60,background:'#000'}}>
            <ImageCropper imageSrc={rawUpload} onCropComplete={c=>{setEditImage(c);setRawUpload(null);}} onCancel={()=>setRawUpload(null)}/>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default CustomerProfile;
