import React, { useState } from 'react';
import { AnimatedPage } from '../components/AnimatedPage';
import { Settings as SettingsIcon, ArrowLeft, Moon, Languages, Store, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useTranslation } from '../store/LanguageContext';

export const ManagerSettings: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, updateSettings } = useAppContext();
  const { language, setLanguage } = useTranslation();
  
  const [storeName, setStoreName] = useState(appSettings?.bakeryName || 'Central Bakery');
  const [isSaving, setIsSaving] = useState(false);

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
