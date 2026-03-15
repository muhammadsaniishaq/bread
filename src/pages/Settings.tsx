import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import type { Product } from '../store/types';
import { AnimatedPage } from '../components/AnimatedPage';
import { DownloadCloud, UploadCloud, LogOut, Check } from 'lucide-react';
import { exportData, importData } from '../store/backup';
import { useTranslation } from '../store/LanguageContext';

export const Settings: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, updatePin, refreshData, logout, appSettings, updateSettings } = useAppContext();
  const { t, language, setLanguage } = useTranslation();
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Round');
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [newPin, setNewPin] = useState('');
  const [companyName, setCompanyName] = useState(appSettings.companyName);
  const [receiptFooter, setReceiptFooter] = useState(appSettings.receiptFooter || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  
  // Security States
  const [securitySection, setSecuritySection] = useState<'none' | 'pin' | 'email' | 'password'>('none');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const handleToggleActive = async (product: Product) => {
    await updateProduct({ ...product, active: !product.active });
  };
  
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(newPrice);
    if (!price || price <= 0) return;
    
    const catName = newCategory.trim() || 'Round';
    const finalName = `₦${price} ${catName}`;
    
    if (editingProductId) {
      const existing = products.find(p => p.id === editingProductId);
      if (existing) {
        await updateProduct({
          ...existing,
          name: finalName,
          price,
          category: catName,
          image: newImage !== undefined ? newImage : existing.image
        });
      }
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: finalName,
        price: price,
        active: true,
        stock: 0,
        category: catName,
        image: newImage
      };
      await addProduct(newProduct);
    }
    
    resetProductForm();
  };

  const resetProductForm = () => {
    setNewPrice('');
    setNewCategory('Round');
    setNewImage(undefined);
    setIsAdding(false);
    setEditingProductId(null);
  };

  const handleEditClick = (product: Product) => {
    setNewPrice(product.price.toString());
    setNewCategory(product.category || 'Round');
    setNewImage(product.image);
    setEditingProductId(product.id);
    setIsAdding(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      await deleteProduct(id);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1MB for products.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      setNewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return alert('PIN must be at least 4 digits');
    await updatePin(newPin);
    setNewPin('');
    setSecuritySection('none');
    alert(`Master PIN changed successfully!`);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return alert('Please enter a valid email address');
    await updateSettings({ ...appSettings, adminEmail: newEmail.trim() });
    setNewEmail('');
    setSecuritySection('none');
    alert(`Account Email updated successfully!`);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert('Password must be at least 6 characters');
    await updateSettings({ ...appSettings, adminPassword: newPassword });
    setNewPassword('');
    setSecuritySection('none');
    alert(`Account Password updated successfully!`);
  };

  const handleUpdateCompanyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    await updateSettings({ ...appSettings, companyName: companyName.trim(), receiptFooter: receiptFooter.trim() });
    alert('Company Profile updated successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      await updateSettings({ ...appSettings, logo: base64String });
      alert("Logo successfully updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    const newSettings = { ...appSettings };
    delete newSettings.logo;
    await updateSettings(newSettings);
    alert("Logo removed.");
  };

  const handleExport = async () => {
    const success = await exportData();
    if (success) alert('Backup downloaded successfully!');
    else alert('Failed to create backup.');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (window.confirm('WARNING: Restoring a backup will erase ALL CURRENT DATA. Are you sure you want to proceed?')) {
      try {
        await importData(file);
        await refreshData();
        alert('Data restored successfully!');
      } catch (err) {
        alert('Invalid or corrupted backup file.');
      }
    }
    
    // Clear input
    e.target.value = '';
  };

  return (
    <AnimatedPage>
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('set.title')}</h1>
          <button className="btn btn-outline btn-icon border-danger text-danger" onClick={logout} title={t('set.logout')}>
            <LogOut size={20} />
          </button>
        </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-accent">{t('set.companyProfile')}</h2>
        
        {/* LOGO UPLOAD SECTION */}
        <div className="mb-6 flex flex-col items-center border border-dashed rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
          {appSettings.logo ? (
            <div className="flex flex-col items-center gap-3">
              <img src={appSettings.logo} alt="Company Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
              <button 
                type="button"
                className="btn btn-outline border-danger text-danger text-sm py-1"
                onClick={handleRemoveLogo}
              >
                Remove Logo
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm opacity-60 mb-2">No logo set</div>
              <button 
                type="button" 
                className="btn btn-outline text-sm py-1"
                onClick={() => logoInputRef.current?.click()}
              >
                Upload Logo
              </button>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={logoInputRef} 
            className="hidden" 
            onChange={handleLogoUpload} 
          />
        </div>

        <form onSubmit={handleUpdateCompanyName} className="flex flex-col gap-2 mb-2">
          <div className="form-group mb-2">
            <label className="form-label text-sm">{t('set.receiptHeader')}</label>
            <input 
              type="text" 
              className="form-input" 
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="THE BEST SPECIAL BREAD"
              required
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-sm">{t('set.receiptFooter')}</label>
            <input 
              type="text" 
              className="form-input" 
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              placeholder="Thank you for your patronage!"
            />
          </div>
          <button type="submit" className="btn btn-primary mt-2">{t('set.saveDetails')}</button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('set.appPreferences')}</h2>
        
        {/* Language Selection */}
        <div className="mb-6">
          <label className="form-label text-sm">{t('set.language')}</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setLanguage('en')}
              className={`flex justify-between items-center px-4 py-3 rounded-xl border ${language === 'en' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-[var(--border-color)] bg-black/5 dark:bg-white/5 opacity-80'}`}
            >
              <span>English</span>
              {language === 'en' && <Check size={16} />}
            </button>
            <button
              onClick={() => setLanguage('ha')}
              className={`flex justify-between items-center px-4 py-3 rounded-xl border ${language === 'ha' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-[var(--border-color)] bg-black/5 dark:bg-white/5 opacity-80'}`}
            >
              <span>Hausa</span>
              {language === 'ha' && <Check size={16} />}
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="form-label text-sm">{t('set.theme')}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');
                window.location.reload(); // Force app restart for layout sync
              }}
              className={`flex-1 py-2 rounded-lg border text-sm ${theme === 'light' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-[var(--border-color)] bg-black/5 dark:bg-white/5 opacity-80'}`}
            >
              {t('set.light')}
            </button>
            <button
               onClick={() => {
                localStorage.setItem('theme', 'dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                window.location.reload();
              }}
              className={`flex-1 py-2 rounded-lg border text-sm ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-[var(--border-color)] bg-black/5 dark:bg-white/5 opacity-80'}`}
            >
              {t('set.dark')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Features</h2>
        <Link to="/reports" className="btn btn-outline mb-2">View Sales History & Reports</Link>
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('set.products')}</h2>
          <button 
            className="btn btn-outline" 
            style={{ width: 'auto', minHeight: '2rem', padding: '0.25rem 0.75rem' }}
            onClick={() => setIsAdding(!isAdding)}
          >
            + Add
          </button>
        </div>
        
        {isAdding && (
          <form onSubmit={handleSaveProduct} className="mb-4 p-4 border rounded" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold mb-3">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="form-group mb-0">
                <label className="form-label">{t('set.price')} (₦)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={newPrice} 
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="e.g. 600"
                  required
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">{t('set.category')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Sliced"
                  required
                />
              </div>
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label">Product Image (Optional)</label>
              <div className="flex items-center gap-3">
                {newImage && <img src={newImage} alt="Preview" className="w-10 h-10 object-cover rounded border" />}
                <button 
                  type="button" 
                  className="btn btn-outline text-sm py-1 px-3"
                  onClick={() => productImageInputRef.current?.click()}
                >
                  {newImage ? 'Change Image' : 'Upload Image'}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={productImageInputRef} 
                  className="hidden" 
                  onChange={handleProductImageUpload} 
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" style={{ minHeight: '2.5rem', padding: '0.5rem' }}>{editingProductId ? 'Update' : 'Save'}</button>
              <button type="button" className="btn btn-outline" style={{ minHeight: '2.5rem', padding: '0.5rem' }} onClick={resetProductForm}>Cancel</button>
            </div>
          </form>
        )}
        
        <div className="flex flex-col gap-2">
          {[...products].sort((a, b) => {
            if (a.active !== b.active) return a.active ? -1 : 1;
            if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
            return a.price - b.price;
          }).map((product, index) => (
            <div key={product.id} className="flex justify-between items-center p-3 border rounded" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex gap-3 items-center">
                <div className="text-secondary font-bold text-lg opacity-50 w-6 text-center">{index + 1}.</div>
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {product.name.charAt(1)}
                  </div>
                )}
                <div>
                  <div className="font-bold">{product.name}</div>
                  <div className="text-sm text-secondary">₦{product.price} • {product.category || 'Standard'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button 
                  onClick={() => handleEditClick(product)}
                  className="btn btn-outline"
                  style={{ width: 'auto', minHeight: '2rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleToggleActive(product)}
                  className={`btn btn-outline ${product.active ? 'text-success' : 'text-secondary'}`}
                  style={{ width: 'auto', minHeight: '2rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {product.active ? 'Active' : 'Inactive'}
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="btn btn-outline border-danger text-danger"
                  style={{ width: 'auto', minHeight: '2rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
        
        <h2 className="text-lg font-semibold mb-4 mt-8">{t('set.security')}</h2>
        <div className="card mb-6">
          <div className="flex flex-col gap-3">
            {securitySection === 'email' ? (
              <form onSubmit={handleEmailChange} className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-[var(--border-color)]">
                <div className="form-group mb-3">
                  <label className="form-label text-xs uppercase font-bold tracking-wider opacity-70">New Account Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    placeholder="admin@breadapp.com"
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm max-h-[2.5rem] py-1">Save Email</button>
                  <button type="button" className="btn btn-outline text-sm max-h-[2.5rem] py-1" onClick={() => { setSecuritySection('none'); setNewEmail(''); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn btn-outline w-full justify-between" onClick={() => setSecuritySection('email')}>
                <span>{t('set.changeEmail')}</span>
                <span className="opacity-50 text-xs truncate max-w-[120px]">{appSettings.adminEmail || 'admin@breadapp.com'}</span>
              </button>
            )}

            {securitySection === 'password' ? (
              <form onSubmit={handlePasswordChange} className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-[var(--border-color)]">
                <div className="form-group mb-3">
                  <label className="form-label text-xs uppercase font-bold tracking-wider opacity-70">New Master Password</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Minimum 6 characters"
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm max-h-[2.5rem] py-1">Save Password</button>
                  <button type="button" className="btn btn-outline text-sm max-h-[2.5rem] py-1" onClick={() => { setSecuritySection('none'); setNewPassword(''); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn btn-outline w-full justify-between" onClick={() => setSecuritySection('password')}>
                <span>{t('set.changePassword')}</span>
                <span className="opacity-50 text-xs">********</span>
              </button>
            )}

            {securitySection === 'pin' ? (
              <form onSubmit={handlePinChange} className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-[var(--border-color)]">
                <div className="form-group mb-3">
                  <label className="form-label text-xs uppercase font-bold tracking-wider opacity-70">New 4-Digit PIN</label>
                  <input 
                    type="password" 
                    pattern="[0-9]*"
                    maxLength={4}
                    inputMode="numeric"
                    className="form-input" 
                    value={newPin} 
                    onChange={e => setNewPin(e.target.value)} 
                    placeholder="Enter 4 digits"
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary text-sm max-h-[2.5rem] py-1">Save PIN</button>
                  <button type="button" className="btn btn-outline text-sm max-h-[2.5rem] py-1" onClick={() => { setSecuritySection('none'); setNewPin(''); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn btn-outline w-full justify-between" onClick={() => setSecuritySection('pin')}>
                <span>{t('set.changePin')}</span>
                <span className="opacity-50 text-xs">****</span>
              </button>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 text-danger">{t('set.dataMgmt')}</h2>
        <div className="card border-danger mb-6">
          <p className="text-sm opacity-80 mb-4">Export your data regularly to keep it safe. You can restore it on a new device.</p>
          
          <div className="flex flex-col gap-3">
            <button className="btn btn-outline" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={handleExport}>
              <DownloadCloud size={20} className="mr-2" style={{marginRight: '0.5rem'}} /> {t('set.export')}
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />
            <button className="btn btn-danger" onClick={handleImportClick}>
              <UploadCloud size={20} className="mr-2" style={{marginRight: '0.5rem'}} /> {t('set.import')}
            </button>
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default Settings;
