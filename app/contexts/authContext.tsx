'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import type { ProfileData } from '@/types/user'

type AuthContextType = {
  user: User | null
  profile: ProfileData | null
  loading: boolean
  isAdmin: boolean
  updateProfile: (data: Partial<ProfileData>) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Simplified fetch profile function
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, agreement_number, activation_fees, user_number')
        .eq('user_id', userId)
        .single()
        
      if (error) throw error
      
      console.log('Profile data:', data)
      return data as ProfileData
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Update local state with new profile data
      setProfile(prev => prev ? { ...prev, ...profileData } : null)
      setIsAdmin(Boolean(profileData.is_admin ?? isAdmin))
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Simplified auth initialization
  const handleAuthChange = async (currentUser: User | null) => {
    setUser(currentUser)
    
    if (currentUser) {
      const profileData = await fetchProfile(currentUser.id)
      setProfile(profileData)
      // Explicitly convert to boolean to avoid any truthy/falsy issues
      setIsAdmin(Boolean(profileData?.is_admin))
      console.log('isAdmin set to:', Boolean(profileData?.is_admin))
    } else {
      setProfile(null)
      setIsAdmin(false)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    // Initial auth check
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        await handleAuthChange(user)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setLoading(false)
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleAuthChange(session?.user || null)
      }
    )

    initAuth()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}