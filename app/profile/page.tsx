import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileEditorClient } from "@/components/profile/ProfileEditorClient";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, agreement_number, activation_fees, user_number, user_id, seller_location")
    .eq("user_id", user.id)
    .single();

  if (!profile) return notFound();

  return (
    <div className="container grid grid-cols-2 mx-auto py-5">
      <ProfileEditorClient profile={profile} />
      <ProfileCard user={user} />
    </div>
  );
}
