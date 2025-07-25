"use server";

import type { ProfileData } from "@/types/user";
import { createClient } from "@/utils/supabase/server";

export const fetchProfileServer = async (
  userId: string
): Promise<ProfileData | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin, agreement_number, contract_number, user_number, seller_location, full_name, phone_number, telephone_number")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile from server action:", error);
      // Depending on your error handling strategy, you might want to throw the error
      // or return a specific error object instead of null.
      return null;
    }

    console.log("Profile data fetched from server action:", data);
    return data as ProfileData;
  } catch (error) {
    console.error("Exception in fetchProfileServer:", error);
    return null;
  }
}; 