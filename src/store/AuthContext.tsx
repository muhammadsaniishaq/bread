import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'MANAGER' | 'STORE_KEEPER' | 'SUPPLIER' | 'CUSTOMER';
const VALID_ROLES: UserRole[] = ['MANAGER', 'STORE_KEEPER', 'SUPPLIER', 'CUSTOMER'];

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setManualUser: (u: any, r: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * ROLE RESOLUTION PRIORITY:
   * 1. profiles table (most authoritative — set by manager)
   * 2. user_metadata.role (set at registration / manual session)
   * 3. Default = 'CUSTOMER' (only for confirmed auth users with no other signal)
   */
  const fetchRoleFromProfile = async (u: User) => {
    console.log(`AuthContext: Resolving role for ${u.email} (${u.id})...`);
    try {
      // --- Priority 1: try profiles table ---
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, phone, username')
        .eq('id', u.id)
        .maybeSingle();

      if (data?.role && VALID_ROLES.includes(data.role as UserRole)) {
        const resolvedRole = data.role as UserRole;
        console.log(`AuthContext: Level 1 Resolution (Profiles Table) -> ${resolvedRole}`);
        setRole(resolvedRole);

        // Auto-sync customers row only for CUSTOMER role
        if (resolvedRole === 'CUSTOMER') {
          await supabase.from('customers').upsert({
            id:             u.id,
            profile_id:     u.id,
            name:           data.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Customer',
            email:          u.email || '',
            username:       data.username || u.user_metadata?.username || '',
            phone:          data.phone || u.user_metadata?.phone || '',
            debt_balance:   0,
            loyalty_points: 0,
          }, { onConflict: 'profile_id' });
        }
        setLoading(false);
        return;
      }

      if (error) {
        console.error('AuthContext: profiles query error:', error.message);
      }

      // --- Priority 2: fall back to user_metadata ---
      const metaRole = u.user_metadata?.role as UserRole | undefined;
      console.log(`AuthContext: Metadata Role Signal -> ${metaRole}`);
      if (metaRole && VALID_ROLES.includes(metaRole)) {
        console.log(`AuthContext: Level 2 Resolution (User Metadata) -> ${metaRole}`);
        setRole(metaRole);

        // Auto-create profile row so next login hits Priority 1
        await supabase.from('profiles').upsert({
          id:        u.id,
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '',
          username:  u.user_metadata?.username  || u.email?.split('@')[0] || '',
          email:     u.email || '',
          role:      metaRole,
        }, { onConflict: 'id', ignoreDuplicates: false });

        setLoading(false);
        return;
      }

      // --- Priority 3: final fallback ---
      console.warn(`AuthContext: Level 3 Resolution (Fallback) -> CUSTOMER`);
      setRole('CUSTOMER');
    } catch (err: any) {
      console.error('AuthContext: Unexpected error resolving role:', err);
      const metaRole = u.user_metadata?.role as UserRole | undefined;
      setRole(VALID_ROLES.includes(metaRole as any) ? (metaRole as UserRole) : 'CUSTOMER');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoleFromProfile(session.user);
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          fetchRoleFromProfile(session.user);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setManualUser = (u: any, r: UserRole) => {
    setUser(u);
    setRole(r);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, setManualUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
