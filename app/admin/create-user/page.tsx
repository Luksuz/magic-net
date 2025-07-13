'use client'

import { useAuth } from '@/app/contexts/authContext' // Corrected path
import { redirect, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { signup } from '@/app/login/actions' // Use the existing admin-protected signup action
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Component to display messages from URL search params (like success/error after form submission)
function CreateUserMessages() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "❌ Greška pri kreiranju korisnika",
        description: error,
        duration: 5000,
      });
    } else if (message) {
      toast({
        title: "✅ Korisnik uspješno kreiran!",
        description: message,
        duration: 5000,
      });
    }
  }, [error, message]);

  return null; // No need to render anything since we're using toasts
}

export default function CreateUserPage() {
  const { isAdmin, loading: authLoading } = useAuth()

  const handleFormSubmit = () => {
    toast({
      title: "👤 Kreiranje korisnika...",
      description: "Molimo pričekajte dok se novi korisnik kreira.",
      duration: 3000,
    });
  };

  if (authLoading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>
  }

  if (!isAdmin) {
    redirect('/') // Or redirect to /login if preferred
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Natrag na administratorsku ploču
        </Link>
      </div>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Kreiraj Novog Korisnika</CardTitle>
          <CardDescription>
            Unesite email i lozinku za novog korisnika. Korisnik će moći promijeniti lozinku nakon prve prijave.
          </CardDescription>
        </CardHeader>
        <form action={signup} onSubmit={handleFormSubmit}>
          <CardContent className="space-y-4">
            <Suspense fallback={null}>
              <CreateUserMessages />
            </Suspense>
            <div className="space-y-2">
              <Label htmlFor="email">Email adresa novog korisnika</Label>
              <Input id="email" name="email" type="email" placeholder="korisnik@primjer.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Inicijalna lozinka</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              <p className="text-xs text-muted-foreground">
                Preporučuje se jaka lozinka. Korisnik bi trebao promijeniti ovu lozinku.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Kreiraj Korisnika</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 