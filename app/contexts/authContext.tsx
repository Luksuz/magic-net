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
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...profileData } : null));
      setIsAdmin(Boolean(profileData.is_admin ?? isAdmin));
      console.log("isAdmin set to:", Boolean(profileData.is_admin));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleAuthChange = async (currentUser: User | null) => {
    setUser(currentUser);

    if (currentUser) {
      console.log("Fetching profile for user:", currentUser.id);
      const profileData = await fetchProfileServer(currentUser.id);
      console.log("Profile data from server action:", profileData);
      setProfile(profileData);
      setIsAdmin(Boolean(profileData?.is_admin));
      console.log("isAdmin set to (in handleAuthChange):", Boolean(profileData?.is_admin));
    } else {
      console.log("No user found, clearing profile and admin status");
      setProfile(null);
      setIsAdmin(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthChange(session?.user || null);
      } catch (error) {
        console.error("Auth init error:", error);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed, event:", _event, "session:", session);
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
  console.log("useAuth called");
  const context = useContext(AuthContext);
  console.log("context:", context);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
