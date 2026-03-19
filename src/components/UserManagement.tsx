import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../store/AuthContext';
import { UserCog, Shield } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export const UserManagement: React.FC = () => {
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
    <div className="card mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-primary" />
        <h2 className="font-bold text-lg">Staff & Role Management</h2>
      </div>
      
      {errorMsg && <p className="text-danger mb-4">{errorMsg}</p>}

      <div className="flex flex-col gap-3">
        {profiles.map(profile => (
          <div key={profile.id} className="p-3 border rounded-lg bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <div className="font-bold flex items-center gap-2">
                <UserCog size={16} className="text-secondary" />
                {profile.full_name || 'No Name'}
              </div>
              <div className="text-sm opacity-70">{profile.email}</div>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs opacity-50 mb-1">Assign Role</label>
              <select 
                className="form-input py-1 text-sm bg-background"
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
  );
};

export default UserManagement;
