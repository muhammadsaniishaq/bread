import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { UserCog, Shield, ArrowLeft } from 'lucide-react';
import { AnimatedPage } from './AnimatedPage';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      setErrorMsg('Failed to fetch users: ' + error.message);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      alert('Failed to update role: ' + error.message);
    } else {
      alert('Role updated successfully! User needs to re-login specifying changes.');
      fetchProfiles();
    }
  };

  if (loading) return <div className="text-secondary p-4 animate-pulse">Loading Staff details...</div>;

  return (
    <AnimatedPage>
      <div className="container pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full shadow-sm hover:bg-black/5 transition-colors border border-[var(--border-color)]">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Shield className="text-primary" /> Staff Management
          </h1>
        </div>

        <div className="card mt-4">
          <div className="flex flex-col gap-3">
            {errorMsg && <p className="text-danger mb-4">{errorMsg}</p>}
            {profiles.map(profile => (
              <div key={profile.id} className="p-4 border rounded-2xl bg-black/5 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <UserCog size={18} className="text-primary" />
                    {profile.full_name || 'No Name'}
                  </div>
                  <div className="text-sm opacity-70 mb-2">{profile.email}</div>
                  <div className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block">
                    Current: {profile.role}
                  </div>
                </div>
                
                <div className="flex flex-col min-w-[140px]">
                  <label className="text-xs opacity-50 mb-1 font-bold">Assign New Role</label>
                  <select 
                    className="form-input py-2 text-sm bg-background cursor-pointer"
                    value={profile.role}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                  >
                    <option value="CUSTOMER">Customer (Standard)</option>
                    <option value="SUPPLIER">Supplier (Delivery)</option>
                    <option value="STORE_KEEPER">Store Keeper (Dispatch)</option>
                    <option value="MANAGER">Manager (Admin)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default UserManagement;
