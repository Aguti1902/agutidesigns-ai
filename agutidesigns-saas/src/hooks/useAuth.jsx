import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
  }

  async function checkPhoneAvailable(phone) {
    const normalized = phone.replace(/\s/g, '');
    const { data } = await supabase
      .from('used_trial_phones')
      .select('phone')
      .eq('phone', normalized)
      .single();
    return !data; // true if available
  }

  async function registerTrialPhone(phone, userId) {
    const normalized = phone.replace(/\s/g, '');
    const { data, error } = await supabase.rpc('register_trial_phone', {
      p_phone: normalized,
      p_user_id: userId,
    });
    if (error) throw error;
    return data; // true if registered, false if already exists
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      }
    });
    if (error) throw error;
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  const isTrialActive = profile?.subscription_status === 'trial' &&
    new Date(profile?.trial_ends_at) > new Date();
  const isSubscribed = profile?.subscription_status === 'active';
  const hasAccess = isTrialActive || isSubscribed;

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signUp, signIn, signOut, signInWithGoogle, updateProfile, fetchProfile,
      checkPhoneAvailable, registerTrialPhone, isTrialActive, isSubscribed, hasAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
