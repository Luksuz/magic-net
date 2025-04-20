"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ContractData } from "@/lib/supabase"
import { createPackage, updatePackage } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PackageFormProps {
  initialData?: ContractData
  isEditing?: boolean
}

const emptyPackage: Partial<ContractData> = {
  usluga: "",
  broj_ugovora: "",
  fiksni_paket: "",
  fiksna_brzina: "",
  fiksne_dodatne_usluge: "",
  fiksna_oprema: "",
  tv_paket: "",
  tv_dodatne_usluge: "",
  tv_oprema: "",
  pretplatnicki_broj: "",
  tarifa: "",
  tel_dodatne_usluge: "",
  tel_oprema: "",
  uredaj_proizvodac_model: "",
  uredaj_cijena: null,
  uredaj_popust: null,
  uredaj_za_placanje: null,
  uredaj_otplata_na_rate: false,
  uredaj_broj_obroka: null,
  uredaj_inicijalna_uplata: null,
  uredaj_mjesecna_rata: null,
  brzina_min_download: "",
  brzina_min_upload: "",
  brzina_obicna_download: "",
  brzina_obicna_upload: "",
  brzina_max_download: "",
  brzina_max_upload: "",
  cijena_prikljucenja_opis: "",
  cijena_prikljucenja_naknada: null,
  cijena_prikljucenja_popust: null,
  cijena_prikljucenja_ukupno: null,
  cijena_aktivacije_opis: "",
  cijena_aktivacije_naknada: null,
  cijena_aktivacije_popust: null,
  cijena_aktivacije_ukupno: null,
}

export default function PackageForm({ initialData, isEditing = false }: PackageFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formData = initialData || emptyPackage

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formElement = e.currentTarget
    const formData = new FormData(formElement)

    startTransition(async () => {
      try {
        let result

        if (isEditing && initialData?.id) {
          result = await updatePackage(initialData.id, formData)
        } else {
          result = await createPackage(formData)
        }

        if (result.success) {
          setSuccess(isEditing ? "Paket uspješno ažuriran!" : "Paket uspješno kreiran!")
          toast({
            title: isEditing ? "Paket ažuriran" : "Paket kreiran",
            description: isEditing
              ? "Paket je uspješno ažuriran."
              : "Paket je uspješno kreiran.",
          })

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          setError(result.error || "Došlo je do pogreške")
          toast({
            variant: "destructive",
            title: "Greška",
            description: result.error || "Došlo je do pogreške",
          })
        }
      } catch (err) {
        console.error("Form submission error:", err)
        setError("Došlo je do neočekivane pogreške")
        toast({
          variant: "destructive",
          title: "Greška",
          description: "Došlo je do neočekivane pogreške",
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basic">Osnovne informacije</TabsTrigger>
            <TabsTrigger value="internet">Internet</TabsTrigger>
            <TabsTrigger value="tv">TV</TabsTrigger>
            <TabsTrigger value="telephone">Telefon</TabsTrigger>
            <TabsTrigger value="pricing">Cijene</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usluga">
                      Usluga <span className="text-red-500">*</span>
                    </Label>
                    <Input id="usluga" name="usluga" defaultValue={formData.usluga || ""} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broj_ugovora">Broj ugovora</Label>
                    <Input id="broj_ugovora" name="broj_ugovora" defaultValue={formData.broj_ugovora || ""} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internet" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiksni_paket">Fiksni paket</Label>
                    <Input id="fiksni_paket" name="fiksni_paket" defaultValue={formData.fiksni_paket || ""} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksna_brzina">Fiksna brzina</Label>
                    <Input id="fiksna_brzina" name="fiksna_brzina" defaultValue={formData.fiksna_brzina || ""} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksne_dodatne_usluge">Dodatne fiksne usluge</Label>
                    <Textarea
                      id="fiksne_dodatne_usluge"
                      name="fiksne_dodatne_usluge"
                      defaultValue={formData.fiksne_dodatne_usluge || ""}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksna_oprema">Fiksna oprema</Label>
                    <Textarea
                      id="fiksna_oprema"
                      name="fiksna_oprema"
                      defaultValue={formData.fiksna_oprema || ""}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brzina_min_download">Min brzina preuzimanja</Label>
                    <Input
                      id="brzina_min_download"
                      name="brzina_min_download"
                      defaultValue={formData.brzina_min_download || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_min_upload">Min brzina slanja</Label>
                    <Input
                      id="brzina_min_upload"
                      name="brzina_min_upload"
                      defaultValue={formData.brzina_min_upload || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_download">Uobičajena brzina preuzimanja</Label>
                    <Input
                      id="brzina_obicna_download"
                      name="brzina_obicna_download"
                      defaultValue={formData.brzina_obicna_download || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_upload">Uobičajena brzina slanja</Label>
                    <Input
                      id="brzina_obicna_upload"
                      name="brzina_obicna_upload"
                      defaultValue={formData.brzina_obicna_upload || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_download">Max brzina preuzimanja</Label>
                    <Input
                      id="brzina_max_download"
                      name="brzina_max_download"
                      defaultValue={formData.brzina_max_download || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_upload">Max brzina slanja</Label>
                    <Input
                      id="brzina_max_upload"
                      name="brzina_max_upload"
                      defaultValue={formData.brzina_max_upload || ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tv" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tv_paket">TV paket</Label>
                    <Input id="tv_paket" name="tv_paket" defaultValue={formData.tv_paket || ""} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tv_dodatne_usluge">Dodatne TV usluge</Label>
                    <Textarea
                      id="tv_dodatne_usluge"
                      name="tv_dodatne_usluge"
                      defaultValue={formData.tv_dodatne_usluge || ""}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tv_oprema">TV oprema</Label>
                    <Textarea id="tv_oprema" name="tv_oprema" defaultValue={formData.tv_oprema || ""} rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telephone" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pretplatnicki_broj">Pretplatnički broj</Label>
                    <Input
                      id="pretplatnicki_broj"
                      name="pretplatnicki_broj"
                      defaultValue={formData.pretplatnicki_broj || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tarifa">Tarifa</Label>
                    <Input id="tarifa" name="tarifa" defaultValue={formData.tarifa || ""} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel_dodatne_usluge">Dodatne telefonske usluge</Label>
                    <Textarea
                      id="tel_dodatne_usluge"
                      name="tel_dodatne_usluge"
                      defaultValue={formData.tel_dodatne_usluge || ""}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel_oprema">Telefonska oprema</Label>
                    <Textarea id="tel_oprema" name="tel_oprema" defaultValue={formData.tel_oprema || ""} rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Informacije o uređaju</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uredaj_proizvodac_model">Proizvođač/model uređaja</Label>
                    <Input
                      id="uredaj_proizvodac_model"
                      name="uredaj_proizvodac_model"
                      defaultValue={formData.uredaj_proizvodac_model || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_cijena">Cijena uređaja</Label>
                    <Input
                      id="uredaj_cijena"
                      name="uredaj_cijena"
                      type="number"
                      step="0.01"
                      defaultValue={formData.uredaj_cijena || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_popust">Popust na uređaj</Label>
                    <Input
                      id="uredaj_popust"
                      name="uredaj_popust"
                      type="number"
                      step="0.01"
                      defaultValue={formData.uredaj_popust || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_za_placanje">Iznos za plaćanje uređaja</Label>
                    <Input
                      id="uredaj_za_placanje"
                      name="uredaj_za_placanje"
                      type="number"
                      step="0.01"
                      defaultValue={formData.uredaj_za_placanje || ""}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uredaj_otplata_na_rate"
                      name="uredaj_otplata_na_rate"
                      defaultChecked={formData.uredaj_otplata_na_rate || false}
                    />
                    <Label htmlFor="uredaj_otplata_na_rate">Otplata na rate</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_broj_obroka">Broj rata</Label>
                    <Input
                      id="uredaj_broj_obroka"
                      name="uredaj_broj_obroka"
                      type="number"
                      defaultValue={formData.uredaj_broj_obroka || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_inicijalna_uplata">Inicijalna uplata</Label>
                    <Input
                      id="uredaj_inicijalna_uplata"
                      name="uredaj_inicijalna_uplata"
                      type="number"
                      step="0.01"
                      defaultValue={formData.uredaj_inicijalna_uplata || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_mjesecna_rata">Mjesečna rata</Label>
                    <Input
                      id="uredaj_mjesecna_rata"
                      name="uredaj_mjesecna_rata"
                      type="number"
                      step="0.01"
                      defaultValue={formData.uredaj_mjesecna_rata || ""}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium mt-8 mb-4">Naknade za priključenje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_opis">Opis naknade za priključenje</Label>
                    <Textarea
                      id="cijena_prikljucenja_opis"
                      name="cijena_prikljucenja_opis"
                      defaultValue={formData.cijena_prikljucenja_opis || ""}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_naknada">Naknada za priključenje</Label>
                    <Input
                      id="cijena_prikljucenja_naknada"
                      name="cijena_prikljucenja_naknada"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_prikljucenja_naknada || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_popust">Popust na naknadu za priključenje</Label>
                    <Input
                      id="cijena_prikljucenja_popust"
                      name="cijena_prikljucenja_popust"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_prikljucenja_popust || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_ukupno">Ukupna naknada za priključenje</Label>
                    <Input
                      id="cijena_prikljucenja_ukupno"
                      name="cijena_prikljucenja_ukupno"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_prikljucenja_ukupno || ""}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium mt-8 mb-4">Naknade za aktivaciju</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_opis">Opis naknade za aktivaciju</Label>
                    <Textarea
                      id="cijena_aktivacije_opis"
                      name="cijena_aktivacije_opis"
                      defaultValue={formData.cijena_aktivacije_opis || ""}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_naknada">Naknada za aktivaciju</Label>
                    <Input
                      id="cijena_aktivacije_naknada"
                      name="cijena_aktivacije_naknada"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_aktivacije_naknada || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_popust">Popust na naknadu za aktivaciju</Label>
                    <Input
                      id="cijena_aktivacije_popust"
                      name="cijena_aktivacije_popust"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_aktivacije_popust || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_ukupno">Ukupna naknada za aktivaciju</Label>
                    <Input
                      id="cijena_aktivacije_ukupno"
                      name="cijena_aktivacije_ukupno"
                      type="number"
                      step="0.01"
                      defaultValue={formData.cijena_aktivacije_ukupno || ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-8">
          <Link href="/">
            <Button type="button" variant="outline">
              Odustani
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Spremanje..." : isEditing ? "Ažuriraj paket" : "Kreiraj paket"}
          </Button>
        </div>
      </form>
    </div>
  )
}
