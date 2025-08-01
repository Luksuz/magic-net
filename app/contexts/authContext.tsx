"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import type { ProfileData } from "@/types/user";
import { fetchProfileServer } from "@/lib/userActions";


type AuthContextType = {
  user: User | null;
  profile: ProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user) {
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...profileData } : null));
      setIsAdmin(Boolean(profileData.is_admin ?? isAdmin));
    } catch (error) {
      throw error;
    }
  };

  const handleAuthChange = async (currentUser: User | null) => {
    setUser(currentUser);

    if (currentUser) {
      const profileData = await fetchProfileServer(currentUser.id);
      
      // Ensure user_id is setin profile data for PDF generation
      if (profileData && !profileData.user_id) {
        profileData.user_id = currentUser.id;
      }
      
      setProfile(profileData);
      setIsAdmin(Boolean(profileData?.is_admin));
    } else {
      setProfile(null);
      setIsAdmin(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      let sessionData = null;
      let sessionError = null;
      try {
        const { data, error } = await supabase.auth.getSession();
        sessionData = data;
        sessionError = error;

        if (sessionError) {
          // Potentially handle this error more gracefully, e.g., by not proceeding to handleAuthChange
        }
        await handleAuthChange(sessionData?.session?.user || null);
      } catch (error) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        await handleAuthChange(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
