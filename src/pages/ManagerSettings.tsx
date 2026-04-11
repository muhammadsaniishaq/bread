import React, { useState, useEffect } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Settings as SettingsIcon, ArrowLeft, Moon, Languages, Store, Save, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useTranslation } from '../store/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';

export const ManagerSettings: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, updateSettings } = useAppContext();
  const { language, setLanguage } = useTranslation();
  const { user } = useAuth();
  
  const [storeName, setStoreName] = useState(appSettings?.bakeryName || 'Central Bakery');
  const [isSaving, setIsSaving] = useState(false);

  // Manager Personal Profile State
  const [profile, setProfile] = useState<any>(null);
  const [personalForm, setPersonalForm] = useState({ full_name: '', username: '', phone: '' });
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({data}) => {
        if (data) {
          setProfile(data);
          setPersonalForm({ full_name: data.full_name || '', username: data.username || '', phone: data.phone || '' });
        }
      });
    }
  }, [user]);

  const handleSavePersonal = async () => {
    if (!user || !personalForm.full_name.trim()) return;
    setIsSavingPersonal(true);
    try {
      let unToCheck = (personalForm.username && personalForm.username.trim() && personalForm.username.trim().toLowerCase() !== profile?.username?.toLowerCase()) ? personalForm.username.trim().toLowerCase() : '';
      let phToCheck = (personalForm.phone && personalForm.phone.trim() && personalForm.phone.trim() !== profile?.phone) ? personalForm.phone.trim() : '';

      if (unToCheck || phToCheck) {
        const { data: avail, error: availErr } = await supabase.rpc('check_account_availability', { chk_username: unToCheck, chk_phone: phToCheck });
        if (availErr) throw new Error('Database Error: Unable to verify uniqueness.');
        if (avail?.username_taken) throw new Error('🚨 ALREADY EXISTS! This Username is currently taken by another user.');
        if (avail?.phone_taken) throw new Error('🚨 ALREADY EXISTS! This Phone Number is taken and cannot be duplicated.');
      }

      const { error } = await supabase.from('profiles').update({
        full_name: personalForm.full_name.trim(),
        username: personalForm.username.trim().toLowerCase().replace(/\s+/g, ''),
        phone: personalForm.phone.trim()
      }).eq('id', user.id);
      
      if (error) throw error;
      setProfile({ ...profile, ...personalForm });
      alert('Personal Profile Updated!');
    } catch (err: any) { alert(err.message); }
    setIsSavingPersonal(false);
  };

  const toggleTheme = () => {
    const newTheme = appSettings?.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ ...appSettings, theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({ ...appSettings, bakeryName: storeName });
    setIsSaving(false);
  };

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="text-gray-500" /> System Settings
          </h1>
        </div>

        <div className="grid gap-4">
          <div className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h2 className="text-xs font-bold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2">
              <UserIcon size={14} /> My Personal Account
            </h2>
            <div className="grid gap-3">
              <input 
                type="text" placeholder="Full Name"
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" 
                value={personalForm.full_name} 
                onChange={e => setPersonalForm({...personalForm, full_name: e.target.value})} 
              />
              <input 
                type="text" placeholder="Phone Number"
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" 
                value={personalForm.phone} 
                onChange={e => setPersonalForm({...personalForm, phone: e.target.value})} 
              />
              <input 
                type="text" placeholder="Username (Optional)"
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" 
                value={personalForm.username} 
                onChange={e => setPersonalForm({...personalForm, username: e.target.value.toLowerCase().replace(/\s+/g, '')})} 
              />
              <button onClick={handleSavePersonal} disabled={isSavingPersonal} className="bg-indigo-600 text-white font-bold text-sm p-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                {isSavingPersonal ? 'Saving...' : <><Save size={16}/> Save My Profile</>}
              </button>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h2 className="text-xs font-bold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Store size={14} /> Organization Profile
            </h2>
            <div className="grid gap-3">
              <input 
                type="text" 
                className="w-full bg-black/5 dark:bg-white/5 border-none rounded-lg p-3 text-sm font-medium" 
                value={storeName} 
                onChange={e => setStoreName(e.target.value)} 
              />
              <button onClick={handleSave} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm p-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                {isSaving ? 'Saving...' : <><Save size={16}/> Save Company Profile</>}
              </button>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h2 className="text-xs font-bold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Moon size={14} /> Display & Appearance
            </h2>
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl cursor-pointer hover:bg-black/10 transition-colors" onClick={toggleTheme}>
               <div className="font-bold text-sm">Dark Mode</div>
               <div className={`w-12 h-6 rounded-full p-1 transition-colors ${appSettings?.theme === 'dark' ? 'bg-success' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                 <div className={`w-4 h-4 rounded-full bg-white transition-transform ${appSettings?.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}/>
               </div>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
            <h2 className="text-xs font-bold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Languages size={14} /> Localization
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setLanguage('en')} 
                className={`p-3 rounded-xl font-bold text-sm transition-colors border ${language === 'en' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-black/5 border-transparent'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('ha')} 
                className={`p-3 rounded-xl font-bold text-sm transition-colors border ${language === 'ha' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-black/5 border-transparent'}`}
              >
                Hausa
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ManagerSettings;
