'use client'

import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

// Extract the part that uses useSearchParams into a separate client component
import { LoginForm } from './login-form'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('email_confirmed') === 'true') {
      setShowConfirmationMessage(true)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      {showConfirmationMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
          <p className="font-semibold">Dobrodošli natrag!</p>
          <p>Prijavite se svojom lozinkom.</p>
        </div>
      )}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Prijava</CardTitle>
          <CardDescription>Prijavite se u Magic Net.</CardDescription>
        </CardHeader>
        
        <Suspense fallback={
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded"></div>
              <div className="h-10 bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
        }>
          <LoginForm login={login} signup={signup} />
        </Suspense>
      </Card>
    </div>
  )
} 