import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ContractData = {
  id: number
  usluga: string | null
  broj_ugovora: string | null
  fiksni_paket: string | null
  fiksna_brzina: string | null
  fiksne_dodatne_usluge: string | null
  fiksna_oprema: string | null
  tv_paket: string | null
  tv_dodatne_usluge: string | null
  tv_oprema: string | null
  pretplatnicki_broj: string | null
  tarifa: string | null
  tel_dodatne_usluge: string | null
  tel_oprema: string | null
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
  created_at: string | null
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
