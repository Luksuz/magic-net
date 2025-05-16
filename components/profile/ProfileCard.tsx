"use client";

import { signOut } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileCard({ user }: { user: any }) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Korisnički profil</CardTitle>
        <CardDescription>Vaši podaci</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Korisnički ID
          </p>
          <p className="text-sm break-all">{user.id}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Potvrđen email
          </p>
          <p>{user.email_confirmed_at ? "Da" : "Ne"}</p>
        </div>
      </CardContent>
      <CardFooter>
        <form action={signOut} className="w-full">
          <Button variant="outline" className="w-full" type="submit">
            Odjava
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
