'use client'

import { useAuth } from '@/app/contexts/authContext'
import { redirect } from 'next/navigation'
import UserList from '@/components/admin/user-list'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeleteUserListPage() {
  const { isAdmin, loading: authLoading } = useAuth()

  if (authLoading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>
  }

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Natrag na administratorsku ploču
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Odaberi Korisnika za Brisanje
          </CardTitle>
          <CardDescription>
            Slijedeći korak će vas odvesti na stranicu za potvrdu brisanja odabranog korisnika.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
    </div>
  )
} 