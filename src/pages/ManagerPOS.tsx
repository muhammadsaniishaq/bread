import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import type { TransactionItem } from '../store/types';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ShieldCheck, ArrowLeft, Camera } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { QRScanner } from '../components/QRScanner';

export const ManagerPOS: React.FC = () => {
  const { customers, products, recordSale } = useAppContext();
  const navigate = useNavigate();
  
  const [customerId, setCustomerId] = useState('');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Debt'>('Cash');
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (decodedId: string) => {
    setShowScanner(false);
    if (customers.find(c => c.id === decodedId)) setCustomerId(decodedId);
  };

  const activeProducts = products.filter(p => p.active);
  
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [cart]);

  const totalAmount = subtotal;

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
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateCartQty = (pid: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === pid) {
        const product = activeProducts.find(p => p.id === pid);
        const max = product?.stock || 0;
        const newQty = Math.max(1, Math.min(item.quantity + delta, max));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (pid: string) => {
    setCart(prev => prev.filter(item => item.productId !== pid));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (paymentType === 'Debt' && !customerId) return alert('Select customer for debt');

    try {
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: paymentType,
        items: cart,
        totalPrice: totalAmount,
        discount: 0,
        customerId: customerId || undefined,
      };

      await recordSale(newTx);
      alert('Sale Completed Successfully!');
      setCart([]);
      setCustomerId('');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  return (
    <AnimatedPage>
      <div className="container pb-24 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Executive POS
          </h1>
        </div>

        <div className="flex-1 grid md:grid-cols-2 gap-4">
          {/* Products Panel */}
          <div className="bg-surface p-4 rounded-3xl shadow-sm border border-[var(--border-color)] overflow-y-auto">
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
               {activeProducts.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => handleQuickAdd(p)}
                   className="p-4 rounded-2xl border border-[var(--border-color)] bg-white/50 dark:bg-black/20 hover:scale-[1.02] transition-transform text-left"
                 >
                   <div className="font-bold text-[15px] leading-tight mb-1">{p.name}</div>
                   <div className="text-emerald-500 font-black mb-2">₦{p.price}</div>
                   <div className="text-[10px] text-secondary font-bold uppercase">Stock: {p.stock}</div>
                 </button>
               ))}
             </div>
          </div>

          {/* Cart Panel */}
          <div className="bg-surface p-6 rounded-3xl shadow-sm border border-[var(--border-color)] flex flex-col bg-gradient-to-br from-emerald-500/5 to-transparent">
             <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
               <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Current Cart</h2>
               <div className="text-xs font-bold px-2 py-1 bg-emerald-500 text-white rounded-md">{cart.length} Items</div>
             </div>

             <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
               {cart.map(item => {
                 const p = activeProducts.find(x => x.id === item.productId);
                 return (
                   <div key={item.productId} className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                     <div className="flex-1">
                       <div className="font-bold">{p?.name || 'Unknown'}</div>
                       <div className="text-xs opacity-70">₦{item.unitPrice} each</div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="flex items-center bg-black/5 rounded-xl">
                         <button className="px-3 py-1 font-bold" onClick={() => updateCartQty(item.productId, -1)}>-</button>
                         <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                         <button className="px-3 py-1 font-bold" onClick={() => updateCartQty(item.productId, 1)}>+</button>
                       </div>
                       <button className="text-danger p-2 hover:bg-danger/10 rounded-full" onClick={() => removeFromCart(item.productId)}>
                         <Trash2 size={16}/>
                       </button>
                     </div>
                   </div>
                 );
               })}
               {cart.length === 0 && <div className="text-center py-10 opacity-40 font-bold">Cart is empty. Tap items to add.</div>}
             </div>

             <div className="mt-auto">
               <div className="flex justify-between items-center mb-4 p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-[var(--border-color)]">
                 <span className="font-bold opacity-70 uppercase tracking-widest text-xs">Total Amount</span>
                 <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₦{totalAmount.toLocaleString()}</span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 mb-4">
                 <select className="form-input py-3 font-bold bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md cursor-pointer text-sm" value={paymentType} onChange={e => setPaymentType(e.target.value as 'Cash'|'Debt')}>
                   <option value="Cash">Cash Sale</option>
                   <option value="Debt">Debt (Credit)</option>
                 </select>
                 
                 <div className="relative">
                   <select className="form-input w-full py-3 font-bold bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md cursor-pointer text-sm" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                     <option value="">Walk-in Customer</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/5 hover:bg-emerald-500 hover:text-white rounded-md transition-colors">
                     <Camera size={16}/>
                   </button>
                 </div>
               </div>

               <button 
                 onClick={handleCheckout} 
                 className={`w-full py-4 rounded-2xl font-black text-lg transition-transform ${cart.length === 0 ? 'bg-black/10 text-black/40 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'}`}
                 disabled={cart.length === 0}
               >
                 {cart.length === 0 ? 'No Items' : `Charge ₦${totalAmount.toLocaleString()}`}
               </button>
             </div>
          </div>
        </div>
      </div>
      
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col pt-10 px-4 pb-6 backdrop-blur-sm">
           <div className="flex justify-between items-center mb-6 text-white">
             <h2 className="font-bold text-xl">Scan Customer Barcode</h2>
             <button onClick={() => setShowScanner(false)} className="px-4 py-2 bg-white/20 rounded-full font-bold">CLOSE</button>
           </div>
           <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/20">
             <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
             <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/50 rounded-3xl z-10 m-4 shadow-[inset_0_0_20px_rgba(16,185,129,0.3)]"></div>
           </div>
           <p className="text-center text-white/50 text-sm mt-6 font-bold uppercase tracking-widest">Hold device steady</p>
        </div>
      )}
    </AnimatedPage>
  );
};

export default ManagerPOS;
