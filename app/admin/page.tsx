'use client'

import { useAuth } from '../contexts/authContext'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, UserPlus, Trash2Icon as DeleteUserIcon, Settings, PackagePlus, Edit3Icon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth()
  
  // Show loading state
  if (loading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje administratorske ploče...</div>
  }
  
  // Redirect if not admin
  if (!isAdmin) {
    redirect('/')
  }
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Administratorska ploča</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upravljanje Korisnicima</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/create-user" className="block h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-primary" />
                  Kreiraj Novog Korisnika
                </CardTitle>
                <CardDescription>
                  Dodajte novog korisnika u sustav.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Omogućuje administratorima kreiranje korisničkih računa.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/delete-user" className="block h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DeleteUserIcon className="mr-2 h-5 w-5 text-destructive" />
                  Obriši Korisnika
                </CardTitle>
                <CardDescription>
                  Pregledajte i odaberite korisnika za brisanje.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Vodi na stranicu za odabir i potvrdu brisanja korisnika.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Ostale Postavke</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/templates" className="block h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  PDF Predlošci
                </CardTitle>
                <CardDescription>
                  Uredi predloške za PDF ugovore.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Prilagodite izgled PDF ugovora.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/manage-documents" className="block h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Upravljaj Dokumentima
                </CardTitle>
                <CardDescription>
                  Upravljajte dokumentima koji se automatski priložuju u emailove.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  Dodajte, pregledajte ili obrišite dokumente koji se šalju uz svaki email.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
} 