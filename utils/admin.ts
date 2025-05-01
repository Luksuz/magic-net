import { createClient } from '@/utils/supabase/server'

export async function isAdmin() {
  const supabase = await createClient()
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return false
  }
  
  // Query the profiles table to check if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()
  
  if (profileError || !profile) {
    return false
  }
  
  return profile.is_admin === true
}

export async function requireAdmin() {
  const isUserAdmin = await isAdmin()
  
  if (!isUserAdmin) {
    throw new Error('Unauthorized access: Admin privileges required')
  }
  
  return true
} 