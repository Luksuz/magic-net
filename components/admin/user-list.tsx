"use client";

import { useEffect, useState } from 'react';
import { fetchUsersAction, AuthUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { UserCircle, SettingsIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import Link from 'next/link';


export default function UserList() {
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsersAction();
      if (result.success && result.users) {
        setAllUsers(result.users);
        setDisplayedUsers(result.users); // Show all users, no hiding
      } else {
        setError(result.error || 'Failed to fetch users.');
        setAllUsers([]);
        setDisplayedUsers([]);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setAllUsers([]);
      setDisplayedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Učitavanje korisnika...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
          <p><b>Greška:</b> {error}</p>
        </div>
      )}
      {displayedUsers.length === 0 && allUsers.length > 0 && !error && (
        <p className="text-muted-foreground">
          Nema dodatnih korisnika za prikaz.
        </p>
      )}
      {displayedUsers.length === 0 && allUsers.length === 0 && !error && (
        <p className="text-muted-foreground">Nema registriranih korisnika.</p>
      )}
      {displayedUsers.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email / Identifikator</TableHead>
                <TableHead>Datum registracije</TableHead>
                <TableHead>Zadnja prijava</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{user.email || 'N/A'}</span>
                        <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/users/${user.id}${user.email ? `?email=${encodeURIComponent(user.email)}` : ''}`} passHref legacyBehavior={false}>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Upravljaj korisnikom"
                      >
                        <SettingsIcon className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Upravljaj</span>
                        <span className="sr-only">Upravljaj korisnikom {user.email || user.id}</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
} 