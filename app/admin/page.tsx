'use client'

import { useAuth } from '../contexts/authContext'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth()
  
  // Show loading state
  if (loading) {
    return <div className="container mx-auto py-10">Učitavanje...</div>
  }
  
  // Redirect if not admin
  if (!isAdmin) {
    redirect('/')
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administratorska ploča</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/templates">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                PDF Predlošci
              </CardTitle>
              <CardDescription>
                Uredi predloške za PDF dokumente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Prilagodite izgled i sadržaj PDF ugovora koji se generiraju za korisnike.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Add more admin links here */}
      </div>
    </div>
  )
} 