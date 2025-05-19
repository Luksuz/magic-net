'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'

interface LoginFormProps {
  login: (formData: FormData) => Promise<void>
  signup: (formData: FormData) => Promise<void>
}

export function LoginForm({ login, signup }: LoginFormProps) {
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
    <form>
      <CardContent>
        {showMessage && (
          <div className={`p-3 mb-4 rounded text-sm ${showMessage.includes('Check your email') || showMessage.includes('account created successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
      </CardFooter>
    </form>
  )
} 