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

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, agreement_number, activation_fees, user_number')
      .eq('user_id', userId)
      .single()
      
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    console.log('Profile data:', data)
    
    return data as ProfileData
  }

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
      
      console.log(error)
      if (error) throw error
      console.log("updated profile", profileData)
      
      // Update local state with new profile data
      setProfile(prev => prev ? { ...prev, ...profileData } : null)
      setIsAdmin(profileData.is_admin ?? isAdmin)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  useEffect(() => {
    // Initial auth check
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const profileData = await fetchProfile(user.id)
          setProfile(profileData)
          setIsAdmin(profileData?.is_admin === true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
          setIsAdmin(profileData?.is_admin === true)
        } else {
          setProfile(null)
          setIsAdmin(false)
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

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