'use client'

import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

// Extract the part that uses useSearchParams into a separate client component
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Prijava</CardTitle>
          <CardDescription>Prijavite se u Magic Net ili kreirajte novi račun</CardDescription>
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