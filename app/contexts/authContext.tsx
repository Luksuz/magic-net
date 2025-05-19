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
  console.log("[AuthProvider] Component rendering. Initial user:", initialUser);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user) {
      console.log("[AuthProvider] updateProfile: No user, returning.");
      return;
    }
    console.log("[AuthProvider] updateProfile: Updating with data:", profileData);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...profileData } : null));
      setIsAdmin(Boolean(profileData.is_admin ?? isAdmin));
      console.log("[AuthProvider] updateProfile: isAdmin set to:", Boolean(profileData.is_admin));
    } catch (error) {
      console.error("[AuthProvider] updateProfile: Error updating profile:", error);
      throw error;
    }
  };

  const handleAuthChange = async (currentUser: User | null) => {
    console.log("[AuthProvider] handleAuthChange: Current user:", currentUser?.id);
    setUser(currentUser);

    if (currentUser) {
      console.log("[AuthProvider] handleAuthChange: Fetching profile for user:", currentUser.id);
      const profileData = await fetchProfileServer(currentUser.id);
      console.log("[AuthProvider] handleAuthChange: Profile data from server action:", profileData);
      setProfile(profileData);
      setIsAdmin(Boolean(profileData?.is_admin));
      console.log("[AuthProvider] handleAuthChange: isAdmin set to:", Boolean(profileData?.is_admin));
    } else {
      console.log("[AuthProvider] handleAuthChange: No user found, clearing profile and admin status.");
      setProfile(null);
      setIsAdmin(false);
    }

    setLoading(false);
    console.log("[AuthProvider] handleAuthChange: Loading set to false.");
  };

  useEffect(() => {
    console.log("[AuthProvider] useEffect hook started.");
    const initAuth = async () => {
      console.log("[AuthProvider] initAuth started.");
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AuthProvider] initAuth: session from getSession():", session);
        await handleAuthChange(session?.user || null);
      } catch (error) {
        console.error("[AuthProvider] initAuth: Error:", error);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("[AuthProvider] onAuthStateChange: Event:", _event, "Session:", session);
        setLoading(true);
        await handleAuthChange(session?.user || null);
      }
    );

    return () => {
      console.log("[AuthProvider] useEffect cleanup: Unsubscribing from onAuthStateChange.");
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
  console.log("[useAuth] hook called.");
  const context = useContext(AuthContext);
  console.log("[useAuth] context value:", context);
  if (context === undefined) {
    console.error("[useAuth] Context is undefined. Ensure component is wrapped in AuthProvider.");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
