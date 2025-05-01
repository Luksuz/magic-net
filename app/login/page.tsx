'use client'

import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const [showMessage, setShowMessage] = useState<string | null>(null)

  useEffect(() => {
    if (error) {
      setShowMessage(error)
    } else if (message) {
      setShowMessage(message)
    } else {
      setShowMessage(null)
    }
  }, [error, message])

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Prijava</CardTitle>
          <CardDescription>Prijavite se u Magic Net ili kreirajte novi račun</CardDescription>
        </CardHeader>
        <form>
          <CardContent>
            {showMessage && (
              <div className={`p-3 mb-4 rounded text-sm ${showMessage.includes('Check') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {showMessage}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email adresa</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Lozinka</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full" formAction={login}>Prijava</Button>
            <Button className="w-full" variant="outline" formAction={signup}>Registracija</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 