import { supabase } from "@/utils/supabase/client"


export type ContractData = {
  id: number
  usluga: string | null
  broj_ugovora: string | null
  fiksni_paket: string | null
  fiksna_brzina: string | null
  fiksne_dodatne_usluge: string | null
  fiksna_oprema: string | null
  promo_price_fiksni?: number | null
  contract_price_fiksni?: number | null
  regular_price_fiksni?: number | null
  fiksni_naziv_ugovorene_usluge?: string | null
  tv_paket: string | null
  tv_dodatne_usluge: string | null
  tv_oprema: string | null
  promo_price_tv?: number | null
  contract_price_tv?: number | null
  regular_price_tv?: number | null
  tv_naziv_ugovorene_usluge?: string | null
  pretplatnicki_broj: string | null
  tarifa: string | null
  tel_dodatne_usluge: string | null
  tel_oprema: string | null
  promo_price_phone?: number | null
  contract_price_phone?: number | null
  regular_price_phone?: number | null
  tel_naziv_ugovorene_usluge?: string | null
  uredaj_proizvodac_model: string | null
  uredaj_cijena: number | null
  uredaj_popust: number | null
  uredaj_za_placanje: number | null
  uredaj_otplata_na_rate: boolean | null
  uredaj_broj_obroka: number | null
  uredaj_inicijalna_uplata: number | null
  uredaj_mjesecna_rata: number | null
  brzina_min_download: string | null
  brzina_min_upload: string | null
  brzina_obicna_download: string | null
  brzina_obicna_upload: string | null
  brzina_max_download: string | null
  brzina_max_upload: string | null
  cijena_prikljucenja_opis: string | null
  cijena_prikljucenja_naknada: number | null
  cijena_prikljucenja_popust: number | null
  cijena_prikljucenja_ukupno: number | null
  cijena_aktivacije_opis: string | null
  cijena_aktivacije_naknada: number | null
  cijena_aktivacije_popust: number | null
  cijena_aktivacije_ukupno: number | null
  terminalna_oprema: Array<{ id?: number; name: string; quantity: number; price: number; }> | Record<string, number> | null;
  created_at: string | null
}

export type MagicNetDevice = {
  id: number
  created_at: string
  updated_at: string | null
  device_model: string | null
  device_price: number | null
  device_discount: number | null
}

export async function getPackages() {
  const { data, error } = await supabase
    .from("magic_net_ugovori")
    .select("id, usluga, fiksni_paket, tv_paket, tarifa")
    .order("id", { ascending: true })

  if (error) {
    console.error("Error fetching packages:", error)
    return []
  }

  return data
}

export async function getContractById(id: number) {
  const { data, error } = await supabase.from("magic_net_ugovori").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching contract:", error)
    return null
  }

  return data as ContractData
}

/**
 * Gets the count of contracts created by a specific user within a month
 * @param userId The ID of the user to count contracts for
 * @param year The year to count in (defaults to current year)
 * @param month The month to count in (defaults to current month)
 * @returns Object with count information and any error
 */
export async function getMonthlyContractCount(userId: string, year?: number, month?: number) {
  // Use current date if not specified
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth() + 1; // JS months are 0-based
  
  // Create date ranges for the month
  const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString(); // Last day of month
  
  console.log(`Counting contracts for user ${userId} between ${startDate} and ${endDate}`);
  
  const { count, error } = await supabase
    .from("contracts_created")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  console.log(`Counted ${count} contracts for user ${userId} between ${startDate} and ${endDate}`);
  
  if (error) {
    console.error("Error counting monthly user contracts:", error);
    return { 
      success: false, 
      error: error.message,
      count: 0
    };
  }
  
  return { 
    success: true,
    error: null,
    count: count || 0
  };
}

/**
 * Generates a formatted contract number based on date, user code and sequence
 * @param userCode The user's code (e.g., "09" for user with ID 9)
 * @param sequenceNumber The sequential number for this user and month
 * @param date Optional date to use (defaults to current date)
 * @returns Formatted contract number (e.g., "2025-05-09-001")
 */
export function generateContractNumber(userCode: string, sequenceNumber: number, date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // JS months are 0-based
  const sequence = String(sequenceNumber).padStart(3, '0');
  
  return `${year}-${month}-${userCode}-${sequence}`;
}

/**
 * Gets the user's code from their profile data
 * @param userProfile The profile data object
 * @returns The user code as a string, padded with leading zeros if needed
 */
export function getUserCode(userProfile: any): string {
  // Use user_number (correct field name from profile)
  if (userProfile && userProfile.user_number) {
    return String(userProfile.user_number).padStart(2, '0');
  }
  
  // Fallback: use the last part of the user_id
  if (userProfile && userProfile.user_id) {
    // Extract the last segment of the UUID or numeric ID
    const idParts = userProfile.user_id.split('-');
    const lastPart = idParts[idParts.length - 1];
    // Just take the numeric value if possible
    const numericValue = parseInt(lastPart, 16) % 100; // Get last 2 digits
    return String(numericValue).padStart(2, '0');
  }
  
  return '00'; // Default if no user information available
}

/**
 * Tracks the creation of a contract by adding a record to the contracts_created table
 * with a formatted contract number
 * @param userId The ID of the user who created the contract from auth context (required)
 * @param userCode The user's code (optional, will be derived from profile if not provided)
 * @returns Object with success status, contract_number and any error information
 */
export async function trackContractCreation(userId?: string, userCode?: string) {
  let contractNumber = '';
  
  // If we have a userId, generate a proper contract number
  if (userId) {
    // Get the current count for this month for this specific user_id
    const monthlyCount = await getMonthlyContractCount(userId);
    
    // Determine the user code
    let finalUserCode = userCode;
    if (!finalUserCode) {
      // Attempt to get user profile to determine code
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_number, user_id")
          .eq("user_id", userId)
          .single();
        
        if (profileData && profileData.user_number) {
          finalUserCode = String(profileData.user_number).padStart(2, '0');
          console.log(`Using user_number ${profileData.user_number} from profile as code`);
        } else {
          // Fallback: use last digits of user ID
          finalUserCode = userId.substring(userId.length - 2).padStart(2, '0');
          console.log(`No user_number found in profile, using fallback code: ${finalUserCode}`);
        }
      } catch (error) {
        console.error("Error getting user profile for code:", error);
        finalUserCode = '00';
      }
    }
    
    // Generate the contract number (current count + 1 for the new contract)
    const sequenceNumber = monthlyCount.count + 1;
    contractNumber = generateContractNumber(finalUserCode, sequenceNumber);
    console.log(`Generated contract number: ${contractNumber} (sequence #${sequenceNumber} for user code ${finalUserCode})`);
  }
  
  // If userId is provided, use it - otherwise the DB will use the default gen_random_uuid()
  // Do NOT try to save contract_number as the column doesn't exist
  const insertData = userId ? { user_id: userId } : {}
  
  const { data, error } = await supabase
    .from("contracts_created")
    .insert(insertData)
    .select("id")
  
  if (error) {
    console.error("Error tracking contract creation:", error)
    return { 
      success: false, 
      error: error.message,
      id: null,
      contract_number: contractNumber // Still return the generated number for use in PDF
    }
  }
  
  return { 
    success: true,
    error: null,
    id: data?.[0]?.id,
    contract_number: contractNumber // Return the generated number for use in PDF
  }
}

/**
 * Gets the count of contracts created by a specific user
 * @param userId The ID of the user to count contracts for
 * @returns Object with count information and any error
 */
export async function getContractCreationCount(userId: string) {
  const { count, error } = await supabase
    .from("contracts_created")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
  
  if (error) {
    console.error("Error counting user contracts:", error)
    return { 
      success: false, 
      error: error.message,
      count: 0
    }
  }
  
  return { 
    success: true,
    error: null,
    count: count || 0
  }
}

/**
 * Gets the total count of all created contracts
 * @returns Object with count information and any error
 */
export async function getTotalContractCreationCount() {
  const { count, error } = await supabase
    .from("contracts_created")
    .select("id", { count: "exact", head: true })
  
  if (error) {
    console.error("Error counting total contracts:", error)
    return { 
      success: false, 
      error: error.message,
      count: 0
    }
  }
  
  return { 
    success: true,
    error: null,
    count: count || 0
  }
}

/**
 * Gets contract creation statistics for a specific time period
 * @param startDate The start date of the period (ISO string format)
 * @param endDate The end date of the period (ISO string format)
 * @returns Object with count information and any error
 */
export async function getContractCreationStats(startDate: string, endDate: string) {
  // Get count for the specified period
  const { count, error } = await supabase
    .from("contracts_created")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate)
  
  if (error) {
    console.error("Error getting contract creation stats:", error)
    return { 
      success: false, 
      error: error.message,
      count: 0,
      byUser: []
    }
  }
  
  // Get breakdown by user
  const { data: userStats, error: userStatsError } = await supabase
    .from("contracts_created")
    .select("user_id, id")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
  
  if (userStatsError) {
    console.error("Error getting user contract stats:", userStatsError)
  }
  
  // Process the results to count by user
  const userCounts = userStats ? userStats.reduce((acc: {[key: string]: number}, contract) => {
    const userId = contract.user_id || 'anonymous';
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {}) : {};
  
  // Convert to array format
  const byUser = Object.entries(userCounts).map(([user_id, count]) => ({
    user_id,
    count
  })).sort((a, b) => b.count - a.count);
  
  return { 
    success: true,
    error: null,
    count: count || 0,
    byUser: byUser
  }
}

// Device management functions
export async function getDevices() {
  const { data, error } = await supabase
    .from("magic_net_devices")
    .select("*")
    .order("device_model", { ascending: true })
  
  if (error) {
    console.error("Error fetching devices:", error)
    return { success: false, error: error.message, data: [] }
  }
  
  return { success: true, error: null, data: data || [] }
}

export async function createDevice(device: Omit<MagicNetDevice, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from("magic_net_devices")
    .insert([device])
    .select()
    .single()
  
  if (error) {
    console.error("Error creating device:", error)
    return { success: false, error: error.message, data: null }
  }
  
  return { success: true, error: null, data }
}

export async function updateDevice(id: number, device: Partial<Omit<MagicNetDevice, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from("magic_net_devices")
    .update({ ...device, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating device:", error)
    return { success: false, error: error.message, data: null }
  }
  
  return { success: true, error: null, data }
}

export async function deleteDevice(id: number) {
  const { error } = await supabase
    .from("magic_net_devices")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting device:", error)
    return { success: false, error: error.message }
  }
  
  return { success: true, error: null }
}

// Document management functions for additional_docs folder in images bucket
export async function getDocuments() {
  const { data, error } = await supabase.storage
    .from("images")
    .list("additional_docs", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" }
    })
  
  if (error) {
    console.error("Error fetching documents:", error)
    return { success: false, error: error.message, data: [] }
  }
  
  return { success: true, error: null, data: data || [] }
}

export async function uploadDocument(file: File) {
  const fileName = `additional_docs/${file.name}`
  
  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    })
  
  if (error) {
    console.error("Error uploading document:", error)
    return { success: false, error: error.message, data: null }
  }
  
  return { success: true, error: null, data }
}

export async function deleteDocument(fileName: string) {
  const filePath = fileName.startsWith('additional_docs/') ? fileName : `additional_docs/${fileName}`
  
  const { error } = await supabase.storage
    .from("images")
    .remove([filePath])
  
  if (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: error.message }
  }
  
  return { success: true, error: null }
}

export function getDocumentUrl(fileName: string) {
  const filePath = fileName.startsWith('additional_docs/') ? fileName : `additional_docs/${fileName}`
  
  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export async function downloadDocument(fileName: string) {
  const filePath = fileName.startsWith('additional_docs/') ? fileName : `additional_docs/${fileName}`
  
  const { data, error } = await supabase.storage
    .from("images")
    .download(filePath)
  
  if (error) {
    console.error("Error downloading document:", error)
    return { success: false, error: error.message, data: null }
  }
  
  return { success: true, error: null, data }
}
