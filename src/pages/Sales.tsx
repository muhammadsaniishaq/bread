import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import type { Transaction, TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Camera } from 'lucide-react';
import { useTranslation } from '../store/LanguageContext';
import { QRScanner } from '../components/QRScanner';

export const Sales: React.FC = () => {
  const { customers, products, transactions, recordSale } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Debt'>('Cash');
  const [discountInput, setDiscountInput] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Shopping Cart State
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (decodedId: string) => {
    setShowScanner(false);
    if (decodedId.startsWith('receipt:')) navigate(`/receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('payment:')) navigate(`/customer-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('bakery-receipt:')) navigate(`/bakery-receipt/${decodedId.split(':')[1]}`);
    else if (decodedId.startsWith('inventory:')) navigate(`/inventory/receipt/${decodedId.split(':')[2]}`);
    else if (customers.find(c => c.id === decodedId)) setCustomerId(decodedId);
  };

  const activeProducts = products.filter(p => p.active);
  const categories = Array.from(new Set(activeProducts.map(p => p.category || 'Standard')));
  const filteredProducts = activeProducts
    .filter(p => selectedCategory === 'All' || (p.category || 'Standard') === selectedCategory)
    .sort((a, b) => {
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      return a.price - b.price;
    });
  
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const maxPointsAvailable = selectedCustomer?.loyaltyPoints || 0;
  
  useEffect(() => {
    setRedeemPoints(false);
  }, [customerId]);

  const discountAmount = useMemo(() => {
    if (!discountInput) return 0;
    if (discountInput.endsWith('%')) {
      const pct = parseFloat(discountInput) || 0;
      return Math.floor((pct / 100) * subtotal);
    }
    return parseInt(discountInput) || 0;
  }, [discountInput, subtotal]);

  // 1 Point = ₦10 Value
  const maxPointsToUse = Math.min(maxPointsAvailable, Math.ceil(Math.max(0, subtotal - discountAmount) / 10));
  const pointsDiscount = redeemPoints ? maxPointsToUse * 10 : 0;
  
  const totalDiscount = discountAmount + pointsDiscount;
  const totalAmount = Math.max(0, subtotal - totalDiscount);
  
  // ₦1000 spent = 1 Point Earned
  const pointsEarned = Math.floor(totalAmount / 1000);

  const handleQuickAdd = (product: typeof activeProducts[0]) => {
    if (product.stock <= 0) {
      alert(`Out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Not enough stock! Only ${product.stock} available.`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        quantity: 1,
        unitPrice: product.price
      }];
    });
  };

  const updateCartQty = (pid: string, delta: number) => {
    setCart(prev => {
      const product = products.find(p => p.id === pid);
      if (!product) return prev;
      
      return prev.map(item => {
        if (item.productId === pid) {
          const newQty = item.quantity + delta;
          if (newQty > product.stock) {
            alert(`Not enough stock!`);
            return item;
          }
          if (newQty <= 0) return item; // Will be handled by trash icon, don't auto-remove
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (pid: string) => {
    setCart(prev => prev.filter(item => item.productId !== pid));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || totalAmount < 0) return;
    if (paymentType === 'Debt' && !customerId) {
      alert('Please select a customer for debt issuance.');
      return;
    }
    
    const tx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customerId: paymentType === 'Debt' ? customerId : (customerId || undefined), 
      items: cart,
      // Leaving legacy fields blank for new transactions
      totalPrice: totalAmount,
      type: paymentType,
      discount: totalDiscount > 0 ? totalDiscount : undefined,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      pointsUsed: redeemPoints ? maxPointsToUse : undefined,
    };
    
    await recordSale(tx);
    
    setLastTxId(tx.id);
    setCustomerId('');
    setCart([]);
    setPaymentType('Cash');
    setDiscountInput('');
    setRedeemPoints(false);
    
    // Automatically navigate to receipt for printing/sharing
    navigate(`/receipt/${tx.id}`);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="container pb-20">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart /> {t('sales.title')}
      </h1>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        <button 
          type="button"
          className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === 'All' ? 'bg-primary text-white shadow-md' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
          onClick={() => setSelectedCategory('All')}
        >
          {t('sales.all')}
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            type="button"
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-[var(--surface-color)] text-secondary border border-transparent hover:border-primary/30 shadow-sm'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {filteredProducts.map(p => (
          <div 
            key={p.id}
            onClick={() => handleQuickAdd(p)}
            className={`cursor-pointer transition-all duration-300 flex flex-col items-center text-center p-5 relative overflow-hidden rounded-[var(--radius-xl)] ${p.stock > 0 ? 'hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.3)] hover:border-primary/50 border border-[var(--border-color)] bg-[var(--surface-color)] backdrop-blur-md' : 'opacity-40 grayscale bg-gray-100 dark:bg-zinc-900'}`}
            style={{ marginBottom: 0 }}
          >
            {p.image ? (
               <img src={p.image} style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded-full mb-3 shadow-sm transition-transform duration-300 hover:scale-110" alt={p.name} />
            ) : (
               <div style={{ width: '40px', height: '40px' }} className="rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-bold mb-3 shadow-sm text-[14px] transition-transform duration-300 hover:scale-110">
                 {p.name.charAt(1) === '₦' ? p.name.charAt(p.name.indexOf(' ')+1) : p.name.charAt(1)}
               </div>
            )}
            <div className="font-extrabold text-sm leading-tight mb-1 w-full truncate tracking-tight">{p.name}</div>
            <div className="text-sm text-primary font-bold mb-3 opacity-90">₦{p.price.toLocaleString()}</div>
            <div className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full w-full max-w-[110px] truncate ${p.stock > 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <form onSubmit={handleSubmit} className="sticky bottom-20 z-40 bg-[var(--surface-color)] backdrop-blur-xl border border-[var(--border-color)] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-3xl rounded-b-xl p-5 mt-8 transition-all animate-bounce-in-up">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 opacity-50"></div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 tracking-tight border-b border-[var(--border-color)] pb-3">
            <ShoppingCart size={20} className="text-primary" /> {t('sales.cart')}
          </h2>
          
          <div className="flex flex-col gap-3 mb-5 max-h-[30vh] overflow-y-auto pr-2 hide-scrollbar">
            {cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border-color)]">
                <div>
                  <div className="font-bold text-sm tracking-tight">{getProductName(item.productId)}</div>
                  <div className="text-xs text-secondary mt-0.5 font-medium">₦{item.unitPrice} each</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[var(--background-color)] rounded border border-[var(--border-color)] px-1">
                    <button type="button" onClick={() => updateCartQty(item.productId, -1)} className="p-1 font-bold text-lg leading-none hover:text-primary transition-colors" style={{ width: '2rem' }}>-</button>
                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                    <button type="button" onClick={() => updateCartQty(item.productId, 1)} className="p-1 font-bold text-lg leading-none hover:text-primary transition-colors" style={{ width: '2rem' }}>+</button>
                  </div>
                  <div className="font-bold w-16 text-right text-primary">₦{(item.quantity * item.unitPrice).toLocaleString()}</div>
                  <button type="button" onClick={() => removeFromCart(item.productId)} className="text-danger p-2 hover:bg-danger/10 rounded-full transition-colors ml-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group mb-4 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label mb-0">{t('sales.selectCustomer')}</label>
              <button 
                type="button" 
                onClick={() => setShowScanner(true)}
                className="btn btn-sm btn-outline text-primary border-primary flex items-center gap-1 px-3 py-2 shadow-sm whitespace-nowrap"
                style={{ flexShrink: 0, fontSize: '0.75rem' }}
              >
                <Camera size={16} /> Scan
              </button>
            </div>
            <select 
              className="form-select mb-2" 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)} 
            >
              <option value="">-- Walk-in Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.debtBalance > 0 ? `(Owes ₦${c.debtBalance})` : ''}</option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-200 rounded text-sm mb-2 border border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <span className="font-bold">{t('sales.loyaltyPoints')}: </span>
                  {selectedCustomer.loyaltyPoints || 0} pts (Value: ₦{((selectedCustomer.loyaltyPoints || 0) * 10).toLocaleString()})
                </div>
                {maxPointsAvailable > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input 
                      type="checkbox" 
                      checked={redeemPoints} 
                      onChange={e => setRedeemPoints(e.target.checked)} 
                      className="w-4 h-4 accent-indigo-600"
                    />
                    Redeem Points
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="form-group mb-5">
            <label className="form-label text-xs tracking-widest uppercase font-bold opacity-70">{t('sales.paymentType')}</label>
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
              <button 
                type="button" 
                className={`btn flex-1 min-h-[2.5rem] py-2 rounded-lg ${paymentType === 'Cash' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary' : 'bg-transparent border-transparent'}`}
                onClick={() => setPaymentType('Cash')}
                style={{ border: 'none' }}
              >
                {t('sales.cash')}
              </button>
              <button 
                type="button" 
                className={`btn flex-1 min-h-[2.5rem] py-2 rounded-lg ${paymentType === 'Debt' ? 'bg-danger text-white shadow-sm' : 'bg-transparent border-transparent opacity-70 hover:opacity-100'}`}
                onClick={() => setPaymentType('Debt')}
                style={{ border: 'none' }}
              >
                {t('sales.debt')}
              </button>
            </div>
          </div>

          <div className="form-group mb-4 mt-4">
            <label className="form-label">{t('sales.addDiscount')} (₦ or %)</label>
            <input 
              type="text" 
              className="form-input text-lg" 
              value={discountInput} 
              onChange={e => setDiscountInput(e.target.value)} 
              placeholder="e.g. 500 or 10%" 
            />
          </div>

          <div className="bg-gradient-to-br from-primary to-indigo-700 text-white mb-6 p-5 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)]">
            <div className="flex justify-between items-center mb-2 opacity-80 text-sm font-medium">
              <span>Subtotal:</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center mb-2 text-rose-300 font-bold text-sm bg-rose-900/20 px-2 py-1 rounded">
                <span>Direct Discount:</span>
                <span>- ₦{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between items-center mb-2 text-indigo-200 font-bold text-sm bg-black/20 px-2 py-1 rounded">
                <span>Points Redeemed ({maxPointsToUse}):</span>
                <span>- ₦{pointsDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-3xl mt-3 pt-3 border-t border-white/20 tracking-tight">
              <span>{t('sales.total')}:</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            {customerId && pointsEarned > 0 && (
              <div className="text-right text-xs mt-3 text-white/70 font-medium">
                +{pointsEarned} Loyalty Points Earned
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-success/90 to-emerald-600/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-2"
            disabled={cart.length === 0 || totalAmount < 0 || (paymentType === 'Debt' && !customerId)}
          >
            {t('sales.completeSale')}
          </button>
        </form>
      )}

      {lastTxId && (
        <button 
          type="button" 
          onClick={() => navigate(`/receipt/${lastTxId}`)}
          className="btn btn-outline mt-4 w-full"
        >
          📄 Print Receipt For Last Sale
        </button>
      )}

      {/* Recent Sales History */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Recent Sales (Today)</h3>
        <div className="flex flex-col gap-3">
          {transactions
            .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map(tx => {
              const customerName = customers.find(c => c.id === tx.customerId)?.name || 'Walk-in Customer';
              return (
                <div key={tx.id} className="card p-3 flex justify-between items-center mb-0 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/receipt/${tx.id}`)}>
                  <div>
                    <div className="font-bold text-sm">Sale to {customerName}</div>
                    <div className="text-xs text-secondary mt-1">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                      <span className={`ml-1 ${tx.type === 'Cash' ? 'text-success' : 'text-danger'}`}>{tx.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₦{tx.totalPrice.toLocaleString()}</div>
                    <button className="text-primary text-xs underline mt-1">View Receipt</button>
                  </div>
                </div>
              );
            })}
            
            {transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length === 0 && (
              <p className="text-center text-secondary text-sm py-4">No sales recorded today yet.</p>
            )}
        </div>
      </div>
      {showScanner && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

export default Sales;
