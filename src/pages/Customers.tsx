import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Customer } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { ImageCropper } from '../components/ImageCropper';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { Award, Star, Crown, Medal, MessageCircle, X, Camera } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';

export const getBadge = (points?: number) => {
  const p = points || 0;
  if (p >= 1000) return <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6'}}><Crown size={12}/> VIP</span>;
  if (p >= 500) return <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308'}}><Star size={12}/> Gold</span>;
  if (p >= 100) return <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8'}}><Award size={12}/> Silver</span>;
  if (p > 0) return <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: 'rgba(180, 83, 9, 0.15)', color: '#b45309'}}><Medal size={12}/> Bronze</span>;
  return null;
};

export const Customers: React.FC = () => {
  const { customers, addCustomer, recordDebtPayment } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const handleScan = (decodedId: string) => {
    setShowScanner(false);
    if (decodedId.startsWith('receipt:')) navigate(`/receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('payment:')) navigate(`/customer-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('bakery-receipt:')) navigate(`/bakery-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('inventory:')) navigate(`/inventory/receipt/${decodedId.split(':')[2]}`);
    else if (customers.find(c => c.id === decodedId)) navigate(`/customers/${decodedId}`);
  };
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');
  const [rawUpload, setRawUpload] = useState<string | null>(null);
  
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || 
                                 c.location.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Just store the raw file, let cropper handle the rest
        setRawUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedBase64: string) => {
    setImage(croppedBase64);
    setRawUpload(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      location,
      notes,
      debtBalance: 0,
      loyaltyPoints: 0,
      image: image || undefined
    };
    
    await addCustomer(newCustomer);
    
    // Reset
    setName(''); setPhone(''); setLocation(''); setNotes(''); setImage('');
    setIsAdding(false);
    
    // Auto navigate to the ID card / Cert generation page
    navigate(`/customer-docs/${newCustomer.id}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomerId) return;
    
    const amountStr = parseInt(paymentAmount);
    if (!amountStr || amountStr <= 0) return;
    
    const paymentId = Date.now().toString();
    await recordDebtPayment({
      id: paymentId,
      date: new Date().toISOString(),
      customerId: paymentCustomerId,
      amount: amountStr,
      method: paymentMethod
    });
    
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentCustomerId(null);
    navigate(`/customer-receipt/${paymentId}`); // Generate and view receipt
  };

  const handleWhatsAppReminder = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!customer.phone) {
      alert('Babu lambar wayar wannan mutumin (No phone number saved).');
      return;
    }
    
    // Format number to international if needed (assuming Nigerian +234 for now if it starts with 0)
    let phoneStr = customer.phone.replace(/\D/g, '');
    if (phoneStr.startsWith('0')) {
      phoneStr = '234' + phoneStr.substring(1);
    }
    
    const message = `Assalamu Alaikum ${customer.name},\n\nMuna tunatar da kai bashin ₦${customer.debtBalance.toLocaleString()} na Burodi. Mungode sosai da kasuwanci da mu.`;
    const url = `whatsapp://send?phone=${phoneStr}&text=${encodeURIComponent(message)}`;
    
    // Fallback if needed, but whatsapp:// usually works best on mobile devices
    window.open(url, '_blank');
  };

  return (
    <AnimatedPage>
      <div className="container">
        {/* Modern Header Area */}
        <div className="bg-gradient-to-br from-primary via-blue-800 to-indigo-900 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-shadow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div>
              <h1 className="text-3xl font-black mb-1">{t('cust.title')}</h1>
              <p className="text-white/70 text-sm font-medium">Manage your client routing and debt collection.</p>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
             <button 
               className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap"
               onClick={() => setIsAdding(!isAdding)}
             >
               {isAdding ? <X size={18} /> : <MessageCircle size={18} className="rotate-90 hidden" />}
               {isAdding ? t('sales.cancel') : `Add New Client`}
             </button>
             <button 
               className="bg-primary hover:bg-primary-hover text-white shadow-md border-2 border-primary-hover px-6 py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap"
               onClick={() => setShowScanner(true)}
             >
               <Camera size={18} /> Quick Scan ID
             </button>
          </div>
        </div>
      
      {isAdding && !rawUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdd} className="bg-surface w-full max-w-lg rounded-3xl border border-[var(--border-color)] shadow-2xl max-h-[90vh] overflow-y-auto filter drop-shadow-2xl animate-bounce-in-up m-0 relative">
            <div className="sticky top-0 bg-surface/80 backdrop-blur-md border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center z-10 rounded-t-3xl">
              <h2 className="text-xl font-black tracking-tight">{t('cust.addCustomer')}</h2>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <label 
                  className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 border border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:bg-black/10 transition-colors"
                >
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={24} className="text-secondary mb-1 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-secondary group-hover:text-primary text-center leading-tight">Add Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-70 mb-1 block">Full Market Name *</label>
                  <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors" value={name} onChange={e => setName(e.target.value)} required placeholder="Business or personal name" />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-70 mb-1 block">Direct Contact (WhatsApp/Phone)</label>
                  <input type="tel" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080... or +234..." />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-70 mb-1 block">Geographical Route</label>
                  <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors" value={location} onChange={e => setLocation(e.target.value)} placeholder="Shop address or specific route location" />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-70 mb-1 block">Operational Notes</label>
                  <textarea 
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={2}
                    placeholder="Details to remember about payment history or delivery quirks..."
                  />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-black text-sm py-4 rounded-xl shadow-md mt-6 transition-colors flex items-center justify-center gap-2">
                Commit & Print Digital ID
              </button>
            </div>
          </form>
        </div>
      )}

      {rawUpload && (
        <ImageCropper 
          imageSrc={rawUpload} 
          onCropComplete={onCropComplete} 
          onCancel={() => setRawUpload(null)} 
        />
      )}

      <div className="flex mb-6">
        <div className="relative flex-1">
          <input 
            type="text" 
            className="w-full bg-surface border border-[var(--border-color)] rounded-2xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-primary transition-colors shadow-sm" 
            placeholder="Search by name or route location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 opacity-50 border border-dashed rounded-3xl border-[var(--border-color)] mt-4">
             <div className="flex justify-center mb-3 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
             <p className="font-bold text-sm">No Client Records</p>
             <p className="text-xs mt-1">Try to refine your search.</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div 
              key={customer.id} 
              className="bg-surface p-5 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.debt-form')) return;
                navigate(`/customers/${customer.id}`);
              }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center font-black shadow-sm text-lg border shrink-0 bg-primary/10 text-primary border-primary/20">
                     {customer.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-0.5">
                       <h3 className="text-lg font-black tracking-tight">{customer.name}</h3>
                       {getBadge(customer.loyaltyPoints)}
                     </div>
                     <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
                       {customer.phone && <span>Ph: {customer.phone}</span>}
                       {customer.location && <span>Rt: {customer.location}</span>}
                     </div>
                   </div>
                </div>
                
                <div className={`text-left sm:text-right bg-black/5 dark:bg-white/5 p-3 rounded-xl sm:bg-transparent sm:w-auto w-full sm:p-0 ${customer.debtBalance > 0 ? 'text-danger' : 'text-success'}`}>
                  <div className="text-[9px] uppercase font-black opacity-50 mb-0.5 ml-1 sm:ml-0">Current Market Debt</div>
                  <div className="font-black text-xl tracking-tight">₦{customer.debtBalance.toLocaleString()}</div>
                </div>
              </div>
              
              {customer.debtBalance > 0 && (
                <div className="mt-5 pt-5 border-t border-[var(--border-color)] debt-form">
                  {paymentCustomerId === customer.id ? (
                    <form onSubmit={handleRecordPayment} className="flex flex-col gap-3 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-500 mb-1">Process Partial/Full Clearing</h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          className="bg-white dark:bg-surface border border-[var(--border-color)] rounded-xl px-4 py-3 font-bold text-sm focus:border-amber-500 transition-colors w-full sm:w-auto"
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                        >
                          <option value="Cash">Cash Transfer</option>
                          <option value="Transfer">Bank Transfer</option>
                        </select>
                        <input 
                          type="number" 
                          className="bg-white dark:bg-surface border border-[var(--border-color)] rounded-xl px-4 py-3 font-bold text-sm focus:border-amber-500 transition-colors flex-[2] w-full" 
                          placeholder="Amount Settled (₦)" 
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="submit" className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 rounded-xl transition-colors shadow-sm">Commit Clearance</button>
                        <button type="button" className="flex-1 bg-white dark:bg-surface border border-[var(--border-color)] hover:bg-black/5 font-bold text-xs py-3 rounded-xl transition-colors" onClick={() => setPaymentCustomerId(null)}>Back Out</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        className="flex-[2] bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 font-black text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentCustomerId(customer.id);
                        }}
                      >
                         Apply Collected Debt Cash
                      </button>
                      <button 
                        className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        onClick={(e) => handleWhatsAppReminder(customer, e)}
                      >
                        <MessageCircle size={16} /> Fast Remind
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>

      {showScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </AnimatedPage>
  );
};

export default Customers;
