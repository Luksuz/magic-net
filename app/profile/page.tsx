import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "./actions";
import { ProfileEditor } from "@/components/profile-editor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <ProfileEditor profile={profile} />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Korisnički profil</CardTitle>
          <CardDescription>Vaši podaci</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
          </div>
        </CardContent>
        <CardFooter>
          <form action={signOut}>
            <Button variant="outline" className="w-full">
              Odjava
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
