"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "./supabase"

export async function createPackage(formData: FormData) {
  try {
    const packageData = Object.fromEntries(formData.entries())

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
    const packageData = Object.fromEntries(formData.entries())

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
