import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'MANAGER' | 'STORE_KEEPER' | 'SUPPLIER' | 'CUSTOMER';

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

  const fetchRoleFromProfile = async (u: User) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', u.id).single();
      if (error) throw error;
      
      if (data && data.role) {
        setRole(data.role as UserRole);
      } else {
        // Only fallback to metadata if profile is completely missing
        setRole((u.user_metadata?.role as UserRole) || 'CUSTOMER');
      }
    } catch (err: any) {
      console.error("AuthContext: Failed to fetch role", err);
      
      // If it's a real Auth user but their profile is missing or hidden by RLS
      if (err.message?.includes("PGRST116") || err.code === 'PGRST116') {
         console.warn("AuthContext: Profile row not found for this UID. Defaulting to metadata.");
         setRole((u.user_metadata?.role as UserRole) || 'CUSTOMER');
      } else {
         // Show a one-time structural alert for the developer/manager
         alert("Role Sync Error: " + (err.message || "RLS Policy Loop Detected"));
         setRole('CUSTOMER');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for Manual Session First (Local Storage)
      const manualData = localStorage.getItem('bakery_manual_session');
      if (manualData) {
        try {
          const { user: mUser, role: mRole } = JSON.parse(manualData);
          setUser(mUser);
          setRole(mRole);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('bakery_manual_session');
        }
      }

      // 2. Fallback to standard Supabase Session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleFromProfile(session.user);
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If we already have a manual session, don't let Supabase overwrite it unless it's a real login
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
         localStorage.removeItem('bakery_manual_session');
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
    localStorage.setItem('bakery_manual_session', JSON.stringify({ user: u, role: r }));
  };

  const signOut = async () => {
    localStorage.removeItem('bakery_manual_session');
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
