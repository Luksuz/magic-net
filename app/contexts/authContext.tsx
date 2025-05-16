"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import type { ProfileData } from "@/types/user";
import { set } from "date-fns";

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

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        setIsAdmin(Boolean(data.is_admin));
        setProfile(data);
      }
    };

    if (initialUser) {
      fetchProfile(initialUser.id).finally(() => setLoading(false));
    } else {
      setIsAdmin(false);
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialUser]);

  // Simplified fetch profile function
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin, agreement_number, activation_fees, user_number")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      console.log("Profile data:", data);
      return data as ProfileData;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state with new profile data
      setProfile((prev) => (prev ? { ...prev, ...profileData } : null));
      setIsAdmin(Boolean(profileData.is_admin ?? isAdmin));
      console.log("isAdmin set to:", Boolean(profileData.is_admin));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Simplified auth initialization
  const handleAuthChange = async (currentUser: User | null) => {
    setUser(currentUser);

    if (currentUser) {
      console.log("Fetching profile for user:", currentUser.id);
      const profileData = await fetchProfile(currentUser.id);
      console.log("Profile data:", profileData);
      setProfile(profileData);
      // Explicitly convert to boolean to avoid any truthy/falsy issues
      setIsAdmin(Boolean(profileData?.is_admin));
      console.log("isAdmin set to:", Boolean(profileData?.is_admin));
    } else {
      console.log("No user found");
      setProfile(null);
      setIsAdmin(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await handleAuthChange(session?.user || null);
      } catch (error) {
        console.error("Auth init error:", error);
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await handleAuthChange(session?.user || null);
    });

    initAuth();

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
