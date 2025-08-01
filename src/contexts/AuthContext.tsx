'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabaseInterface } from '@/supabase/supabaseInterface';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
  hasHealthieKey: () => Promise<boolean>;
  getHealthieKey: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require authentication
  const publicPages = ['/login', '/signup', '/error'];

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await supabaseInterface.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabaseInterface.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        
        // Store user data in localStorage for app compatibility
        const userData = {
          email: session.user.email,
          clinicName: session.user.user_metadata?.name || 'Demo Clinic',
          emr: 'healthie',
          specialty: 'PCP',
          isLoggedIn: true,
          userId: session.user.id
        };
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('userData');
      }
      
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle authentication routing
  useEffect(() => {
    if (!loading) {
      const isPublicPage = publicPages.includes(pathname);
      
      if (!user && !isPublicPage) {
        // User is not authenticated and trying to access a protected page
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await supabaseInterface.signIn(email, password);
      return result;
    } catch (error) {
      console.error('Auth provider sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      const result = await supabaseInterface.signUp(email, password, name);
      return result;
    } catch (error) {
      console.error('Auth provider sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseInterface.signOut();
    } catch (error) {
      console.error('Auth provider sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasHealthieKey = async () => {
    return await supabaseInterface.hasHealthieKey();
  };

  const getHealthieKey = async () => {
    return await supabaseInterface.getHealthieKey();
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasHealthieKey,
    getHealthieKey,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}