import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { getTransactionItems } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { ImageCropper } from '../components/ImageCropper';
import { ArrowLeft, Phone, MapPin, Activity, MessageCircle, MessageSquare, FileText, Edit2, Trash2, Camera } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, transactions, debtPayments, products, recordDebtPayment, updateCustomer, deleteCustomer } = useAppContext();

  const customer = customers.find(c => c.id === id);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer?.name || '');
  const [editPhone, setEditPhone] = useState(customer?.phone || '');
  const [editLocation, setEditLocation] = useState(customer?.location || '');
  const [editNotes, setEditNotes] = useState(customer?.notes || '');
  const [editImage, setEditImage] = useState(customer?.image || '');
  const [rawUpload, setRawUpload] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedBase64: string) => {
    setEditImage(croppedBase64);
    setRawUpload(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (!editName.trim()) return;

    setIsProcessing(true);
    await updateCustomer({
      ...customer,
      name: editName.trim(),
      phone: editPhone.trim(),
      location: editLocation.trim(),
      notes: editNotes.trim(),
      image: editImage,
    });
    setIsEditing(false);
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (window.confirm(`Are you absolutely sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      await deleteCustomer(customer.id);
      navigate('/customers');
    }
  };
  
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) return;
    
    setIsProcessing(true);
    const paymentId = Date.now().toString();
    
    await recordDebtPayment({
      id: paymentId,
      date: new Date().toISOString(),
      customerId: customer.id,
      amount: amountNum,
      method: paymentMethod
    });
    
    setAmount('');
    setPaymentMethod('Cash');
    setShowPaymentForm(false);
    setIsProcessing(false);
    navigate(`/customer-receipt/${paymentId}`); // Generate and view receipt
  };

  const metrics = useMemo(() => {
    if (!customer) return null;
    
    const customerTxs = transactions.filter(t => t.customerId === customer.id);
    const customerPayments = debtPayments.filter(p => p.customerId === customer.id);
    
    const lifetimeValue = customerTxs.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalDebtIssued = customerTxs.filter(t => t.type === 'Debt').reduce((sum, t) => sum + t.totalPrice, 0);
    const totalDebtPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Merge and sort history chronologically (newest first)
    const history = [
      ...customerTxs.map(t => ({ ...t, _type: 'sale', _date: new Date(t.date) })),
      ...customerPayments.map(p => ({ ...p, _type: 'payment', _date: new Date(p.date) }))
    ].sort((a, b) => b._date.getTime() - a._date.getTime());

    return { lifetimeValue, totalDebtIssued, totalDebtPaid, history };
  }, [customer, transactions, debtPayments]);

  if (!customer || !metrics) {
    return (
      <AnimatedPage>
        <div className="container mt-8 text-center text-secondary">
          Customer not found.
          <button className="btn btn-outline mt-4" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </AnimatedPage>
    );
  }

  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || 'Unknown';

  return (
    <AnimatedPage>
      <div className="container">
        {/* Beautiful Gradient Header Area */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-600 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
           
           <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
             <button onClick={() => navigate(-1)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-colors text-white shrink-0">
               <ArrowLeft size={22} className="shrink-0" />
             </button>
             <div className="min-w-0 flex-1">
               <h1 className="text-3xl font-black mb-1 flex items-center gap-3 flex-wrap">
                 <span className="truncate max-w-full">{customer.name}</span>
                 {(customer.loyaltyPoints || 0) > 100 && (
                   <span className="text-[10px] bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 px-3 py-1 rounded-full uppercase tracking-widest font-black shadow-sm shrink-0">VIP Member</span>
                 )}
               </h1>
               <div className="flex items-center gap-4 text-sm font-medium opacity-80 flex-wrap">
                 {customer.phone && (
                   <span className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</span>
                 )}
                 {customer.location && (
                   <span className="flex items-center gap-1.5"><MapPin size={14} /> {customer.location}</span>
                 )}
               </div>
             </div>
           </div>

           <div className="flex gap-2 relative z-10 self-start md:self-center shrink-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
             <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-colors text-xs whitespace-nowrap">
               <Edit2 size={16} /> Edit Profile
             </button>
             <button onClick={() => navigate(`/customer-docs/${customer.id}`)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-colors text-xs whitespace-nowrap">
               <FileText size={16} /> Documents
             </button>
             <button onClick={handleDelete} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 border border-red-500/30 px-4 py-2.5 rounded-xl font-bold transition-colors text-xs whitespace-nowrap">
               <Trash2 size={16} /> Delete
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 text-black dark:text-white">
          <div className="bg-surface p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-full w-24 h-24 transition-colors"></div>
            <div className="text-[10px] uppercase font-black tracking-widest text-secondary mb-1">Lifetime Pipeline</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₦{metrics.lifetimeValue.toLocaleString()}</div>
            <div className="mt-4 text-xs font-semibold text-secondary">Total historic transactions</div>
          </div>
          
          <div className={`bg-surface p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${customer.debtBalance > 0 ? 'border-red-500/30' : 'border-[var(--border-color)]'}`}>
            <div className={`absolute -right-4 -bottom-4 rounded-full w-24 h-24 transition-colors ${customer.debtBalance > 0 ? 'bg-red-500/5 group-hover:bg-red-500/10' : 'bg-success/5 group-hover:bg-success/10'}`}></div>
            <div className="text-[10px] uppercase font-black tracking-widest text-secondary mb-1">Current Active Debt</div>
            <div className={`text-3xl font-black ${customer.debtBalance > 0 ? 'text-red-500' : 'text-success'}`}>
              ₦{customer.debtBalance.toLocaleString()}
            </div>
            {customer.debtBalance > 0 ? (
              <button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm" onClick={() => setShowPaymentForm(true)}>
                Record Fast Payment
              </button>
            ) : (
              <div className="mt-4 text-xs font-bold text-success bg-success/10 px-3 py-2 rounded-xl text-center">In Good Standing</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-white dark:to-surface p-6 rounded-3xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm relative overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Reward Points</div>
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                 <Activity size={24} />
               </div>
               <div>
                 <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{customer.loyaltyPoints || 0}</div>
                 <div className="text-[11px] font-bold text-indigo-500/80 uppercase tracking-wider">Points Evaluated (₦{((customer.loyaltyPoints || 0) * 10).toLocaleString()})</div>
               </div>
            </div>
          </div>
        </div>

        {customer.debtBalance > 0 && customer.phone && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                <MessageSquare size={16} /> Immediate Action
              </h3>
              <p className="text-xs text-secondary font-medium">Send a fast reminder for the ₦{customer.debtBalance.toLocaleString()} debt.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <a 
                href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customer.name}, this is an automated reminder regarding your outstanding balance of ₦${customer.debtBalance.toLocaleString()}. Please let us know when you plan to settle. Thank you!`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a 
                href={`sms:${customer.phone.replace(/\D/g, '')}?body=${encodeURIComponent(`Hello ${customer.name}, this is an automated reminder regarding your outstanding balance of ₦${customer.debtBalance.toLocaleString()}. Please let us know when you plan to settle. Thank you!`)}`}
                className="flex-1 sm:flex-none bg-surface border border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm text-secondary"
              >
                <MessageSquare size={16} /> SMS
              </a>
            </div>
          </div>
        )}

        {isEditing && !rawUpload && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-lg rounded-3xl border border-[var(--border-color)] shadow-2xl max-h-[90vh] overflow-y-auto filter drop-shadow-2xl animate-bounce-in-up">
              <div className="sticky top-0 bg-surface/80 backdrop-blur-md border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center z-10 rounded-t-3xl">
                <h3 className="text-xl font-black tracking-tight">Modify Client Data</h3>
                <button onClick={() => setIsEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                
                <div className="flex flex-col items-center">
                  <label 
                    className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 border border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:bg-black/10 transition-colors"
                  >
                    {editImage ? (
                      <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                         <div className="text-secondary group-hover:text-primary transition-colors flex flex-col items-center gap-1">
                           <Camera size={24} />
                           <span className="text-[9px] uppercase font-bold tracking-widest mt-1">Upload Photo</span>
                         </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                  {editImage && (
                    <button 
                      type="button" 
                      onClick={() => setEditImage('')}
                      className="text-xs text-red-500 font-bold mt-3 hover:text-red-600 transition-colors"
                    >
                      Remove Photo Reference
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1 block">Legal Name</label>
                    <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-primary transition-colors" value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1 block">Phone Number</label>
                    <input type="tel" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-primary transition-colors" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1 block">Geographic Location</label>
                    <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-primary transition-colors" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1 block">Operational Notes</label>
                    <textarea className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-primary transition-colors" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}></textarea>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button type="button" className="flex-1 bg-surface border border-[var(--border-color)] font-bold text-sm py-3 rounded-xl hover:bg-black/5 transition-colors" onClick={() => setIsEditing(false)}>Cancel Edit</button>
                  <button type="submit" className="flex-[2] bg-primary text-white font-bold text-sm py-3 rounded-xl shadow-md hover:bg-primary-hover transition-colors" disabled={isProcessing}>
                    {isProcessing ? 'Saving Pipeline...' : 'Commit Changes to Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rawUpload && (
          <div className="fixed inset-0 z-[60] bg-black">
            <ImageCropper 
              imageSrc={rawUpload}
              onCropComplete={onCropComplete}
              onCancel={() => setRawUpload(null)}
            />
          </div>
        )}

        {showPaymentForm && (
          <form onSubmit={handleRecordPayment} className="bg-surface p-6 rounded-3xl border-2 border-primary/40 mb-8 shadow-lg shadow-primary/10 animate-bounce-in-up">
            <h3 className="font-black text-xl tracking-tight mb-5 flex items-center gap-2">
              Record Financial Offset
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-black opacity-70 mb-1 block">Deposit Type</label>
                  <select
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="text-[10px] uppercase font-black opacity-70 mb-1 block">Amount Offset (₦)</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface border-2 border-[var(--border-color)] rounded-xl py-3 px-4 font-black text-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="E.g 50000" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 bg-surface border border-[var(--border-color)] font-bold text-sm py-3 rounded-xl hover:bg-black/5 transition-colors" onClick={() => setShowPaymentForm(false)}>
                  Abort
                </button>
                <button type="submit" className="flex-[2] bg-primary text-white font-bold text-sm py-3 rounded-xl shadow-md hover:bg-primary-hover transition-colors flex items-center justify-center gap-2" disabled={isProcessing}>
                  {isProcessing ? 'Authorizing...' : 'Commit Transaction Ledger'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
            <Activity size={18} /> Operational Ledger
          </h3>
          
          <div className="flex flex-col gap-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-4 before:w-0.5 before:bg-[var(--border-color)]">
            {metrics.history.length === 0 ? (
              <div className="text-center py-12 opacity-50 border border-dashed rounded-3xl border-[var(--border-color)] ml-12">
                 <FileText size={48} className="mx-auto mb-3 opacity-20" />
                 <p className="font-bold text-sm">No History Established</p>
                 <p className="text-xs mt-1">This user's ledger is completely blank.</p>
              </div>
            ) : (
              metrics.history.map((item: any) => {
                const dateStr = item._date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                
                if (item._type === 'sale') {
                  const items = getTransactionItems(item);
                  const qty = items.reduce((s, i) => s + i.quantity, 0);
                  const types = Array.from(new Set(items.map(i => getProductName(i.productId)))).join(', ');
                  
                  return (
                    <div key={`sale-${item.id}`} className="relative pl-14">
                      <div className="absolute left-3.5 top-5 w-3 h-3 rounded-full bg-primary outline outline-4 outline-[var(--bg-color)] z-10" />
                      <div className="bg-surface border border-[var(--border-color)] p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <div className="font-black text-sm text-primary mb-0.5">Commercial Invoice Issued</div>
                          <div className="text-xs font-bold opacity-70 mb-1">Items Dispatched: {qty} ({types})</div>
                          <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">{dateStr}</div>
                        </div>
                        <div className="text-left sm:text-right bg-black/5 dark:bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                          <div className="font-black text-lg">₦{item.totalPrice.toLocaleString()}</div>
                          <div className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full inline-block mt-1 border ${item.type === 'Cash' || item.type === 'Transfer' ? 'bg-success/10 text-success border-success/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {item.type}
                          </div>
                          <button 
                            className="text-[10px] uppercase font-bold text-primary hover:underline mt-2 block w-full text-left sm:text-right"
                            onClick={(e) => { e.stopPropagation(); navigate(`/receipt/${item.id}`); }}
                          >
                            Access e-Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={`pay-${item.id}`} className="relative pl-14">
                      <div className="absolute left-3.5 top-5 w-3 h-3 rounded-full bg-success outline outline-4 outline-[var(--bg-color)] z-10" />
                      <div className="bg-success/5 border border-success/20 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <div className="font-black text-sm text-success mb-0.5">Debt Obligation Offset</div>
                          <div className="text-xs font-bold opacity-70 text-success mb-1">Fund Reception Logged</div>
                          <div className="text-[10px] font-bold text-success/70 uppercase tracking-wider">{dateStr}</div>
                        </div>
                        <div className="text-left sm:text-right bg-success/10 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                          <div className="font-black text-lg text-success">+ ₦{item.amount.toLocaleString()}</div>
                          <button 
                            className="text-[10px] uppercase font-bold text-success hover:underline mt-2 block w-full text-left sm:text-right"
                            onClick={(e) => { e.stopPropagation(); navigate(`/customer-receipt/${item.id}`); }}
                          >
                            Access e-Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default CustomerProfile;
