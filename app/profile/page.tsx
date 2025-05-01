import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from './actions'
import { ProfileEditor } from '@/components/profile-editor'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-10">
      <ProfileEditor />
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Korisnički profil</CardTitle>
          <CardDescription>Vaši podaci</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{data.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Korisnički ID</p>
              <p className="text-sm break-all">{data.user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Potvrđen email</p>
              <p>{data.user.email_confirmed_at ? 'Da' : 'Ne'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <form action={signOut}>
            <Button variant="outline" className="w-full">Odjava</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
} 