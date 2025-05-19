'use client'

import { useEffect, useState, startTransition } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/authContext';
import { adminDeleteUserAction, fetchUsersAction, AuthUser } from '@/lib/actions'; // Assuming fetchUsersAction can fetch a single user if needed or we add a new one
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Trash2Icon, AlertTriangle } from 'lucide-react';

// Helper to fetch a single user's details. 
// For now, this is a placeholder. Ideally, you'd have a dedicated server action 
// like `fetchUserByIdAction(userId: string)` if you need more than what's in AuthUser.
// Or, we can pass basic info via router state if appropriate, but less robust.
// For simplicity in this step, we'll rely on the ID from the URL and optionally show an email if passed via searchParam for confirmation.

export default function ManageUserPage() {
  const router = useRouter();
  const params = useParams();
  const searchParamsHook = useSearchParams(); // Renamed to avoid conflict with window.searchParams
  const { isAdmin, loading: authLoading } = useAuth();

  const userId = typeof params.userId === 'string' ? params.userId : null;
  const userEmailForDisplay = searchParamsHook.get('email'); // Optional: pass email via query for display

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [user, setUser] = useState<AuthUser | null>(null); // If fetching full user details
  // const [userLoading, setUserLoading] = useState(true); // If fetching full user details

  // useEffect(() => {
  //   if (userId) {
  //     const loadUserDetails = async () => {
  //       setUserLoading(true);
  //       // Replace with a dedicated action: const result = await fetchUserByIdAction(userId);
  //       // For now, we are not fetching full details on this page to keep it simple.
  //       // If you have a `fetchUserByIdAction`, use it here.
  //       setUserLoading(false);
  //     };
  //     loadUserDetails();
  //   }
  // }, [userId]);

  if (authLoading) { // || userLoading if fetching user details
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>;
  }

  if (!isAdmin) {
    router.replace('/'); // Use replace to not add to history
    return null;
  }

  if (!userId) {
    return (
      <div className="container mx-auto py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">ID korisnika nije pronađen.</p>
        <p className="text-muted-foreground mb-6">Nije moguće upravljati korisnikom bez važećeg ID-a.</p>
        <Link href="/admin">
          <Button variant="outline">Natrag na popis korisnika</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    const userName = userEmailForDisplay || `ID ${userId}`;
    const confirmed = window.confirm(
      `JESTE LI APSOLUTNO SIGURNI?\n\nŽelite li trajno obrisati korisnika: ${userName}?\n\nOva akcija se ne može poništiti i obrisat će korisnika iz sustava autentifikacije. Povezani podaci u drugim tablicama (npr. profili) OSTAT ĆE osim ako nemate postavljene 'ON DELETE CASCADE' relacije u bazi podataka.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await adminDeleteUserAction(userId);
      if (result.success) {
        window.alert(`Korisnik ${userName} uspješno obrisan.`);
        router.push('/admin?message=Korisnik uspješno obrisan'); // Redirect to admin page with a success message
      } else {
        setError(result.error || 'Došlo je do pogreške prilikom brisanja korisnika.');
        window.alert(`Greška: ${result.error || 'Došlo je do pogreške prilikom brisanja korisnika.'}`);
      }
    } catch (e: any) {
      setError(e.message || 'Došlo je do neočekivane pogreške.');
      window.alert(`Greška: ${e.message || 'Došlo je do neočekivane pogreške.'}`);
    } finally {
      setIsDeleting(false);
    }
  };

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
          <CardTitle className="text-2xl font-bold">Obriši Korisnika</CardTitle>
          <CardDescription>
            Potvrda brisanja korisnika. Ova akcija je nepovratna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 mb-4 rounded text-sm bg-red-100 text-red-800">
              {error}
            </div>
          )}
          <div className="p-4 border border-dashed rounded-md bg-muted/50">
            <p className="font-medium">Korisnik za brisanje:</p>
            <p className="text-sm"><span className="font-semibold">ID:</span> {userId}</p>
            {userEmailForDisplay && (
              <p className="text-sm"><span className="font-semibold">Email:</span> {userEmailForDisplay}</p>
            )}
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold">Upozorenje o brisanju!</h3>
                        <p className="text-xs">
                        Brisanjem korisnika iz sustava autentifikacije <strong className="font-bold">neće</strong> se automatski obrisati povezani podaci 
                        (npr. profilne informacije, zapisi o aktivnostima) iz drugih tablica, osim ako su u bazi podataka 
                        postavljene 'ON DELETE CASCADE' relacije za strane ključeve. Provjerite svoju bazu podataka.
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
          <Link href="/admin">
            <Button variant="outline" disabled={isDeleting}>Odustani</Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? (
                <><span className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full"></span>Brisanje...</>
            ) : (
                <><Trash2Icon className="mr-2 h-4 w-4" /> Potvrdi Brisanje</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 