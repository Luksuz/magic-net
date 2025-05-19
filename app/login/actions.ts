'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Login
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Invalid email or password')
  }

  return redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // 1. Check if the current user (the one calling this action) is an admin
  const { data: { user: callingUser } } = await supabase.auth.getUser()

  if (!callingUser) {
    return redirect('/login?error=You must be logged in to perform this action')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles') // Assuming your profiles table is named 'profiles'
    .select('is_admin')
    .eq('user_id', callingUser.id)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching calling user's profile:", profileError)
    return redirect('/login?error=Could not verify admin status')
  }

  if (!profile.is_admin) {
    return redirect('/login?error=You do not have permission to create new users')
  }

  // 2. If admin, proceed to create the new user
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return redirect('/login?error=Email and password are required for new user');
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
      // For admin-created users, you might not want/need email confirmation immediately,
      // or you might handle it differently. If so, you can skip emailRedirectTo.
      // If you still want confirmation, ensure the new user can access this link.
    },
  })

  if (signUpError) {
    console.error("Error during admin creating user (signUpError):", signUpError);
    return redirect(`/login?error=Could not create new user: ${signUpError.message}`)
  }

  // Instead of redirecting to /login?message=..., 
  // for an admin action, you might redirect to an admin page or show a success message differently.
  // For now, let's provide a clear success message, assuming this form might be on an admin page in future.
  return redirect('/admin?message=New user account created successfully. User needs to check email if confirmation is enabled.')
} 