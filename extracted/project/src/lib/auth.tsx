import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile, type UserRole } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  teacherExists: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherExists, setTeacherExists] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Profile fetch error:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  };

  const checkTeacherExists = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'teacher')
      .maybeSingle();
    if (error) {
      console.error('Teacher check error:', error.message);
      return;
    }
    setTeacherExists(!!data);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        checkTeacherExists();
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
        })();
      } else {
        setProfile(null);
        checkTeacherExists();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      if (role === 'teacher') {
        const { data: existingTeacher, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'teacher')
          .maybeSingle();
        if (checkError) return { error: 'Unable to verify teacher status. Please try again.' };
        if (existingTeacher) {
          return { error: 'A teacher account already exists. Only one teacher can register.' };
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Sign up failed. Please try again.' };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        role,
      });
      if (profileError) {
        if (profileError.code === '23505') {
          return { error: 'A teacher account already exists. Only one teacher can register.' };
        }
        return { error: 'Account created but profile setup failed: ' + profileError.message };
      }

      await supabase.auth.signInWithPassword({ email, password });
      setTeacherExists(role === 'teacher');
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    checkTeacherExists();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, teacherExists, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
