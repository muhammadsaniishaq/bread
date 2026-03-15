import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Customer } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../store/LanguageContext';
import { Award, Star, Crown, Medal, MessageCircle } from 'lucide-react';

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
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || 
                                 c.location.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      location,
      notes,
      debtBalance: 0
    };
    
    await addCustomer(newCustomer);
    
    // Reset
    setName(''); setPhone(''); setLocation(''); setNotes('');
    setIsAdding(false);
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
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('cust.title')}</h1>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto', minHeight: '2.5rem', padding: '0.5rem 1rem' }}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? t('sales.cancel') : `+ ${t('cust.addCustomer')}`}
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleAdd} className="card border-primary">
          <h2 className="text-lg font-semibold mb-4">{t('cust.addCustomer')}</h2>
          
          <div className="form-group">
            <label className="form-label">{t('cust.name')} *</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('cust.phone')}</label>
            <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Location/Address</label>
            <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          
          <button type="submit" className="btn btn-primary mt-2">{t('cust.save')}</button>
        </form>
      )}

      <div className="form-group mb-4">
        <input 
          type="text" 
          className="form-input" 
          placeholder={t('cust.searchCustomer')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredCustomers.length === 0 ? (
          <p className="text-secondary text-center py-8">{t('cust.noCustomers')}</p>
        ) : (
          filteredCustomers.map(customer => (
            <div 
              key={customer.id} 
              className="card" 
              style={{ marginBottom: 0, paddingBottom: '1rem', cursor: 'pointer' }}
              onClick={(e) => {
                // Prevent navigation if clicking inside the pay debt form
                if ((e.target as HTMLElement).closest('.debt-form')) return;
                navigate(`/customers/${customer.id}`);
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">{customer.name}</h3>
                    {getBadge(customer.loyaltyPoints)}
                  </div>
                  {customer.phone && <p className="text-sm">{customer.phone}</p>}
                  {customer.location && <p className="text-sm text-secondary">{customer.location}</p>}
                </div>
                <div className={`text-right ${customer.debtBalance > 0 ? 'text-danger' : 'text-success'}`}>
                  <div className="text-sm">{t('cust.debt')}</div>
                  <div className="font-bold">₦{customer.debtBalance.toLocaleString()}</div>
                </div>
              </div>
              
              {customer.debtBalance > 0 && (
                <div className="mt-4 pt-4 border-t debt-form" style={{ borderColor: 'var(--border-color)' }}>
                  {paymentCustomerId === customer.id ? (
                    <form onSubmit={handleRecordPayment} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select
                          className="form-select flex-1"
                          style={{ padding: '0.5rem', minWidth: '100px' }}
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Transfer">Transfer</option>
                        </select>
                        <input 
                          type="number" 
                          className="form-input flex-[2]" 
                          placeholder="Amount (₦)" 
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          required
                          style={{ padding: '0.5rem' }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary flex-1" style={{ minHeight: 'auto', padding: '0.5rem 1rem' }}>{t('cust.save')}</button>
                        <button type="button" className="btn btn-outline flex-1" style={{ minHeight: 'auto', padding: '0.5rem 1rem' }} onClick={() => setPaymentCustomerId(null)}>{t('sales.cancel')}</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-outline flex-1 text-sm py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentCustomerId(customer.id);
                        }}
                      >
                        Record Payment
                      </button>
                      <button 
                        className="btn flex-1 text-sm py-2"
                        style={{ backgroundColor: '#25D366', color: '#fff', border: 'none' }}
                        onClick={(e) => handleWhatsAppReminder(customer, e)}
                      >
                        <MessageCircle size={16} className="mr-1 inline" /> Reminder
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
    </AnimatedPage>
  );
};

export default Customers;
