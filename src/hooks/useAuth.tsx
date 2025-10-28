import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserRole, getLatestPdfUrl, autoDownloadPdf } from '@/utils/pdfDownload';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage first (from direct API calls)
    const checkStoredSession = () => {
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          if (sessionData.access_token && sessionData.user) {
            setSession(sessionData);
            setUser(sessionData.user);
            setLoading(false);
            return true;
          }
        } catch (e) {
          localStorage.removeItem('supabase.auth.token');
        }
      }
      return false;
    };

    // If no stored session from direct API, check Supabase client
    if (!checkStoredSession()) {
      // Set up auth state listener for Supabase client
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // Check for existing Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Update last_login timestamp on successful login
    if (!error && data.user) {
      setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', data.user.id);

        // Check user role and auto-download PDF if subscribed_user or admin
        const roleData = await getUserRole(data.user.id);
        
        if (roleData && (roleData.role === "subscribed_user" || roleData.role === "admin")) {
          const pdfUrl = await getLatestPdfUrl(data.user.id);
          
          if (pdfUrl) {
            autoDownloadPdf(pdfUrl);
            
            const expiryText = roleData.planExpiry 
              ? ` until ${format(new Date(roleData.planExpiry), "dd/MM/yyyy")}`
              : "";
            
            toast({
              title: "🎉 Welcome back!",
              description: `Your ${roleData.role === "admin" ? "Admin" : "Pro"} plan is active${expiryText} — your PDF is downloading now.`
            });
          }
        }
      }, 0);
    }
    
    return { error };
  };

  const signOut = async () => {
    // Update last_login timestamp before logout (tracks logout time)
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.id);
    }
    
    // Clear localStorage session
    localStorage.removeItem('supabase.auth.token');
    
    // Also sign out from Supabase client
    const { error } = await supabase.auth.signOut();
    
    // Clear local state
    setSession(null);
    setUser(null);
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};