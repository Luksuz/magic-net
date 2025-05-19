"use server"

import { revalidatePath } from "next/cache"
import { supabase } from '@/utils/supabase/client'
import { createClient } from '@/utils/supabase/server'

export async function createPackage(formData: FormData) {
  try {
    const packageData = Object.fromEntries(formData.entries()) as Record<string, any>

    // Convert numeric values
    const numericFields = [
      "uredaj_cijena",
      "uredaj_popust",
      "uredaj_za_placanje",
      "uredaj_broj_obroka",
      "uredaj_inicijalna_uplata",
      "uredaj_mjesecna_rata",
      "cijena_prikljucenja_naknada",
      "cijena_prikljucenja_popust",
      "cijena_prikljucenja_ukupno",
      "cijena_aktivacije_naknada",
      "cijena_aktivacije_popust",
      "cijena_aktivacije_ukupno",
    ]

    numericFields.forEach((field) => {
      if (packageData[field] && packageData[field] !== "") {
        packageData[field] = Number.parseFloat(packageData[field] as string)
      } else {
        packageData[field] = null
      }
    })

    // Handle boolean fields
    packageData.uredaj_otplata_na_rate = packageData.uredaj_otplata_na_rate === "on"

    // Parse terminalna_oprema if it exists and is a string
    if (packageData.terminalna_oprema && typeof packageData.terminalna_oprema === 'string') {
      try {
        packageData.terminalna_oprema = JSON.parse(packageData.terminalna_oprema);
      } catch (parseError) {
        console.error("Error parsing terminalna_oprema:", parseError);
        packageData.terminalna_oprema = null; // Or an empty object {}, depending on desired fallback
      }
    } else if (packageData.terminalna_oprema) {
      // If it exists but isn't a string, it might be an error or already an object (though FormData usually makes it string)
      // For safety, ensure it's an object or null. If it's unexpected, log it.
      if (typeof packageData.terminalna_oprema !== 'object') {
          console.warn("terminalna_oprema was not a string or object, setting to null. Value:", packageData.terminalna_oprema);
          packageData.terminalna_oprema = null;
      }
    }

    const { data, error } = await supabase.from("magic_net_ugovori").insert(packageData).select()

    if (error) {
      console.error("Error creating package:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error creating package:", error)
    return { success: false, error: "Failed to create package" }
  }
}

export async function updatePackage(id: number, formData: FormData) {
  try {
    const packageData = Object.fromEntries(formData.entries()) as Record<string, any>

    // Convert numeric values
    const numericFields = [
      "uredaj_cijena",
      "uredaj_popust",
      "uredaj_za_placanje",
      "uredaj_broj_obroka",
      "uredaj_inicijalna_uplata",
      "uredaj_mjesecna_rata",
      "cijena_prikljucenja_naknada",
      "cijena_prikljucenja_popust",
      "cijena_prikljucenja_ukupno",
      "cijena_aktivacije_naknada",
      "cijena_aktivacije_popust",
      "cijena_aktivacije_ukupno",
    ]

    numericFields.forEach((field) => {
      if (packageData[field] && packageData[field] !== "") {
        packageData[field] = Number.parseFloat(packageData[field] as string)
      } else {
        packageData[field] = null
      }
    })

    // Handle boolean fields
    packageData.uredaj_otplata_na_rate = packageData.uredaj_otplata_na_rate === "on"

    // Parse terminalna_oprema if it exists and is a string
    if (packageData.terminalna_oprema && typeof packageData.terminalna_oprema === 'string') {
      try {
        packageData.terminalna_oprema = JSON.parse(packageData.terminalna_oprema);
      } catch (parseError) {
        console.error("Error parsing terminalna_oprema for update:", parseError);
        packageData.terminalna_oprema = null; // Or an empty object {}
      }
    } else if (packageData.terminalna_oprema) {
      if (typeof packageData.terminalna_oprema !== 'object') {
          console.warn("terminalna_oprema (update) was not a string or object, setting to null. Value:", packageData.terminalna_oprema);
          packageData.terminalna_oprema = null;
      }
    }

    const { data, error } = await supabase.from("magic_net_ugovori").update(packageData).eq("id", id).select()

    if (error) {
      console.error("Error updating package:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath(`/edit-package/${id}`)
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating package:", error)
    return { success: false, error: "Failed to update package" }
  }
}

export async function deletePackage(id: number) {
  try {
    const { error } = await supabase.from("magic_net_ugovori").delete().eq("id", id)

    if (error) {
      console.error("Error deleting package:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting package:", error)
    return { success: false, error: "Failed to delete package" }
  }
}


interface ActionResult {
  success: boolean;
  error?: string | null;
}

export async function deletePackageAction(packageId: number): Promise<ActionResult> {
  if (!packageId) {
    return { success: false, error: "Package ID is required." };
  }

  console.log(`[ServerAction] Attempting to delete package with ID: ${packageId}`);

  try {
    const { error } = await supabase
      .from("magic_net_ugovori") // Ensure 'packages' is your correct table name
      .delete()
      .eq("id", packageId);

    if (error) {
      console.error("[ServerAction] Error deleting package:", error);
      return { success: false, error: error.message };
    }

    console.log(`[ServerAction] Package with ID: ${packageId} deleted successfully.`);
    
    // Revalidate the path where the packages are displayed. 
    // Adjust this path if your package selector is on a different page.
    revalidatePath("/"); // Or the specific path like '/dashboard/packages'

    return { success: true };
  } catch (e: any) {
    console.error("[ServerAction] Exception during package deletion:", e);
    return { success: false, error: e.message || "An unexpected error occurred." };
  }
}

// --- NEW USER MANAGEMENT ACTIONS ---

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
  // Add other fields as needed from Supabase auth.users
}

interface FetchUsersResult extends ActionResult {
  users?: AuthUser[];
}

export async function fetchUsersAction(): Promise<FetchUsersResult> {
  try {
    const supabaseAdmin = await createClient();
    const { data: { users: fetchedUsers }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust as needed
    });

    if (error) {
      console.error("[ServerAction] Error fetching users:", error);
      return { success: false, error: error.message, users: [] };
    }
    
    // Sort users by created_at: oldest first
    const sortedUsers = fetchedUsers.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB; // Ascending order
    });

    console.log(`[ServerAction] Fetched and sorted ${sortedUsers.length} users.`);
    return { success: true, users: sortedUsers as AuthUser[] };

  } catch (e: any) {
    console.error("[ServerAction] Exception during user fetch:", e);
    return { success: false, error: e.message || "An unexpected error occurred while fetching users.", users: [] };
  }
}

export async function adminDeleteUserAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: "User ID is required for deletion." };
  }
  const supabaseAdmin = await createClient();
  console.log(`[ServerAction] Attempting to delete user with ID: ${userId}`);
  try {
    const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deletionError) {
      console.error("[ServerAction] Error deleting user:", deletionError);
      return { success: false, error: deletionError.message };
    }

    console.log(`[ServerAction] User with ID: ${userId} deleted successfully from auth.`);
    revalidatePath("/admin");
    return { success: true };

  } catch (e: any) {
    console.error(`[ServerAction] Exception during user deletion for ID ${userId}:`, e);
    return { success: false, error: e.message || "An unexpected error occurred during user deletion." };
  }
}
