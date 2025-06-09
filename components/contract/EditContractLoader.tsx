import { getContractById } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditContractPageClient from "./EditContractPageClient";

interface Props {
  contractId: number;
}

export default async function EditContractLoader({ contractId }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agreement_number, user_number")
    .eq("user_id", user.id)
    .single();

  if (!profile) return notFound();

  const contract = await getContractById(contractId);

  if (!contract) return notFound();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  if (profile.agreement_number) {
    contract.broj_ugovora = `UG-${year}-${month}-${profile.agreement_number}`;
  }

  return <EditContractPageClient contract={contract} profile={profile} />;
}
