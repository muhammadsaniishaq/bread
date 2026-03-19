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
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="btn btn-outline btn-icon" style={{ padding: '0.6rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold m-0 flex-1 truncate">{customer.name}</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-icon border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100" style={{ padding: '0.6rem' }} title="Edit Customer">
              <Edit2 size={18} />
            </button>
            <button onClick={handleDelete} className="btn btn-outline btn-icon border-red-200 text-red-600 bg-red-50 hover:bg-red-100" style={{ padding: '0.6rem' }} title="Delete Customer">
              <Trash2 size={18} />
            </button>
            <button onClick={() => navigate(`/customer-docs/${customer.id}`)} className="btn btn-outline btn-icon" style={{ padding: '0.6rem' }} title="View ID & Certificate">
              <FileText size={20} className="text-primary" />
            </button>
          </div>
        </div>

        <div className="card bg-primary text-white mb-6">
          <div className="flex items-center gap-3 mb-2 opacity-90 text-sm">
            <Phone size={16} /> <span>{customer.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-3 opacity-90 text-sm">
            <MapPin size={16} /> <span>{customer.location || 'No location'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="text-sm text-secondary">Lifetime Value</div>
            <div className="text-xl font-bold mt-1 text-primary">₦{metrics.lifetimeValue.toLocaleString()}</div>
          </div>
          <div className="card" style={{ marginBottom: 0, borderColor: customer.debtBalance > 0 ? 'var(--danger-color)' : 'var(--border-color)' }}>
            <div className="text-sm text-secondary">Current Debt</div>
            <div className="text-xl font-bold mt-1" style={{ color: customer.debtBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
              ₦{customer.debtBalance.toLocaleString()}
            </div>
            {customer.debtBalance > 0 && (
              <button className="btn btn-sm btn-primary mt-3 w-full" onClick={() => setShowPaymentForm(true)}>
                Record Payment
              </button>
            )}
          </div>
          <div className="card" style={{ gridColumn: 'span 2', marginBottom: 0, background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.02))', borderColor: 'rgba(79, 70, 229, 0.2)' }}>
            <div className="text-sm text-indigo-800 dark:text-indigo-300 font-semibold mb-1">Loyalty Points Balance</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              ⭐ {customer.loyaltyPoints || 0} pts
              <span className="text-sm font-normal text-indigo-800/60 dark:text-indigo-300/60">
                (Value: ₦{((customer.loyaltyPoints || 0) * 10).toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {customer.debtBalance > 0 && customer.phone && (
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--secondary-rgb), 0.05))' }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare size={16} /> Send Debt Reminder
            </h3>
            <div className="flex gap-2">
              <a 
                href={`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${customer.name}, this is a friendly reminder regarding your outstanding balance of ₦${customer.debtBalance.toLocaleString()}. Please let us know when you plan to settle. Thank you!`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn text-white flex-1 flex justify-center items-center gap-2"
                style={{ backgroundColor: '#25D366', border: 'none' }}
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a 
                href={`sms:${customer.phone.replace(/\D/g, '')}?body=${encodeURIComponent(`Hello ${customer.name}, this is a friendly reminder regarding your outstanding balance of ₦${customer.debtBalance.toLocaleString()}. Please let us know when you plan to settle. Thank you!`)}`}
                className="btn btn-primary flex-1 flex justify-center items-center gap-2"
              >
                <MessageSquare size={18} /> SMS
              </a>
            </div>
          </div>
        )}

        {isEditing && !rawUpload && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-white border-2 border-primary max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Customer</h3>
                <button onClick={() => setIsEditing(false)} className="text-secondary hover:text-danger">
                  <ArrowLeft size={20} className="rotate-180" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                
                <div className="flex flex-col items-center mb-4">
                  <label 
                    className="w-20 h-20 rounded-full bg-[var(--surface-color)] border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                  >
                    {editImage ? (
                      <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className="text-primary/50 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] text-secondary mt-1">Photo</span>
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
                      className="text-xs text-danger mt-2 hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input w-full" value={editName} onChange={e => setEditName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input type="tel" className="form-input w-full" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Location/Address (Optional)</label>
                  <input type="text" className="form-input w-full" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea className="form-input w-full" rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)}></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : 'Save Changes'}
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
          <form onSubmit={handleRecordPayment} className="card border-primary mb-6">
            <h3 className="font-bold mb-3">Record Debt Payment</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="form-group flex-1">
                  <label className="text-xs text-secondary mb-1 block">Method</label>
                  <select
                    className="form-select w-full"
                    style={{ padding: '0.5rem' }}
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
                <div className="form-group flex-[2]">
                  <label className="text-xs text-secondary mb-1 block">Amount (₦)</label>
                  <input 
                    type="number" 
                    className="form-input w-full" 
                    placeholder="Enter amount" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    style={{ padding: '0.5rem' }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1" disabled={isProcessing}>
                  {isProcessing ? 'Saving...' : 'Save & Print Receipt'}
                </button>
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Activity size={20} className="text-primary" /> Activity History
        </h3>
        
        <div className="flex flex-col gap-3 relative before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-px before:bg-[var(--border-color)]">
          {metrics.history.length === 0 ? (
            <p className="text-center text-secondary py-4 pl-8">No activity recorded yet.</p>
          ) : (
            metrics.history.map((item: any) => {
              const dateStr = item._date.toLocaleDateString();
              
              if (item._type === 'sale') {
                const items = getTransactionItems(item);
                const qty = items.reduce((s, i) => s + i.quantity, 0);
                const types = Array.from(new Set(items.map(i => getProductName(i.productId)))).join(', ');
                
                return (
                  <div key={`sale-${item.id}`} className="card relative ml-10 p-3" style={{ marginBottom: 0 }}>
                    <div className="absolute w-3 h-3 rounded-full bg-primary" style={{ left: '-30px', top: '1.5rem', background: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--bg-gradient-end)' }} />
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm">
                          Purchased {qty} Items 
                          <span className="text-secondary text-xs block font-normal">{types}</span>
                        </div>
                        <div className="text-xs text-secondary mt-1">{dateStr}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₦{item.totalPrice.toLocaleString()}</div>
                        <div className={`text-xs uppercase font-bold mt-1 ${item.type === 'Cash' ? 'text-success' : 'text-danger'}`}>
                          {item.type}
                        </div>
                        <button 
                          className="text-xs text-primary underline mt-1 cursor-pointer block text-right w-full"
                          onClick={(e) => { e.stopPropagation(); navigate(`/receipt/${item.id}`); }}
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`pay-${item.id}`} className="card relative ml-10 p-3" style={{ marginBottom: 0, background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)' }}>
                    <div className="absolute w-3 h-3 rounded-full bg-success" style={{ left: '-30px', top: '1.5rem', background: 'var(--success-color)', boxShadow: '0 0 0 4px var(--bg-gradient-end)' }} />
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-success">Debt Repayment</div>
                        <div className="text-xs text-secondary mt-1">{dateStr}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-success">+ ₦{item.amount.toLocaleString()}</div>
                        <button 
                          className="text-xs text-primary underline mt-1 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); navigate(`/customer-receipt/${item.id}`); }}
                        >
                          View Receipt
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
    </AnimatedPage>
  );
};

export default CustomerProfile;
