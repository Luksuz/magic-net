"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
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

// Helper to generate a somewhat unique ID without a UUID library
const generatePseudoUniqueId = (prefix: string = 'item') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

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
  terminalna_oprema: {},
}

export default function PackageForm({ initialData, isEditing = false }: PackageFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formState, setFormState] = useState<Partial<ContractData>>(initialData || emptyPackage)
  const [terminalEquipmentList, setTerminalEquipmentList] = useState<{ id: string; name: string; price: string | number }[]>([]);

  /*
  useEffect(() => {
    // This useEffect can cause formState to reset if initialData prop reference changes,
    // even if its content is the same, or if parent component re-renders.
    // Commenting out to preserve user edits in formState across tab switches and re-renders.
    // The form will now only initialize with initialData once.
    // If reactive updates to initialData are needed while editing, a more sophisticated
    // approach for merging initialData changes without losing user input would be required.
    setFormState(initialData || emptyPackage);
  }, [initialData]);
  */

  // Effect to initialize terminalEquipmentList from initialData.terminalna_oprema
  useEffect(() => {
    const initialTE = initialData?.terminalna_oprema;
    if (initialTE && typeof initialTE === 'object') {
      setTerminalEquipmentList(
        Object.entries(initialTE).map(([name, price]) => ({
          id: generatePseudoUniqueId('initial-te'),
          name,
          price: price === null || price === undefined ? "" : Number(price),
        }))
      );
    } else if (!initialData) { // If there's no initialData (e.g. create form), ensure list is empty
      setTerminalEquipmentList([]);
    }
    // Only run when initialData itself changes, not on every formState.terminalna_oprema change.
    // User modifications to terminalEquipmentList will be handled directly by its state setters.
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'number' && value !== '' ? parseFloat(value) : value,
    }));
  };

  const handleCheckboxChange = (name: keyof ContractData, checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handler for changes in terminal equipment item inputs
  const handleTerminalEquipmentChange = (id: string, field: 'name' | 'price', value: string) => {
    setTerminalEquipmentList(currentList =>
      currentList.map(item =>
        item.id === id
          ? { ...item, [field]: field === 'price' ? (value === '' ? '' : parseFloat(value) || '') : value }
          : item
      )
    );
  };

  // Handler to add a new terminal equipment item
  const addTerminalEquipmentItem = () => {
    setTerminalEquipmentList(currentList => [
      ...currentList,
      { id: generatePseudoUniqueId('new-te'), name: "", price: "" },
    ]);
  };

  // Handler to remove a terminal equipment item
  const removeTerminalEquipmentItem = (id: string) => {
    setTerminalEquipmentList(currentList => currentList.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Convert terminalEquipmentList back to object for formState
    const reconciledTerminalOprema: Record<string, number> = {};
    terminalEquipmentList.forEach(item => {
      if (item.name.trim() !== "") { // Only include items with a name
        const price = parseFloat(String(item.price)); // item.price could be string "" or number
        reconciledTerminalOprema[item.name.trim()] = isNaN(price) ? 0 : price; // Default to 0 if price is not valid
      }
    });

    // CRITICAL FIX: Update the actual component formState before preparing FormData
    const stateWithLatestTerminalOprema = {
      ...formState,
      terminalna_oprema: reconciledTerminalOprema,
    };
    setFormState(stateWithLatestTerminalOprema);

    // Now build FormData using the updated state
    const formDataToSubmit = new FormData();
    for (const key in stateWithLatestTerminalOprema) {
      if (key === 'terminalna_oprema') {
        const teValue = stateWithLatestTerminalOprema[key as keyof ContractData];
        if (teValue && typeof teValue === 'object') {
            formDataToSubmit.append(key, JSON.stringify(teValue));
        } else if (teValue === null || teValue === undefined) {
            // Send null as JSON if terminalna_oprema is empty/null after reconciliation
            formDataToSubmit.append(key, JSON.stringify(null)); 
        }
      } else {
        const value = stateWithLatestTerminalOprema[key as keyof ContractData];
        if (value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            formDataToSubmit.append(key, value ? 'on' : '');
          } else {
            formDataToSubmit.append(key, String(value));
          }
        }
      }
    }

    startTransition(async () => {
      try {
        let result

        if (isEditing && initialData?.id) {
          result = await updatePackage(initialData.id, formDataToSubmit)
        } else {
          result = await createPackage(formDataToSubmit)
        }

        if (result.success) {
          setSuccess(isEditing ? "Paket uspješno ažuriran!" : "Paket uspješno kreiran!")
          toast({
            title: isEditing ? "Paket ažuriran" : "Paket kreiran",
            description: isEditing
              ? "Paket je uspješno ažuriran."
              : "Paket je uspješno kreiran.",
          })
          if (!isEditing) {
             setFormState(emptyPackage);
          }
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
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="basic">Osnovne informacije</TabsTrigger>
            <TabsTrigger value="internet">Usluga i Internet</TabsTrigger>
            <TabsTrigger value="tv">TV</TabsTrigger>
            <TabsTrigger value="telephone">Telefon</TabsTrigger>
            <TabsTrigger value="terminal_equipment">Terminalna Oprema</TabsTrigger>
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
                    <Input id="usluga" name="usluga" value={formState.usluga || ""} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broj_ugovora">Broj ugovora</Label>
                    <Input id="broj_ugovora" name="broj_ugovora" value={formState.broj_ugovora || ""} onChange={handleInputChange} />
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
                    <Input id="usluga" name="fiksni_paket" value={formState.usluga || ""} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksna_brzina">Fiksna brzina</Label>
                    <Input id="fiksna_brzina" name="fiksna_brzina" value={formState.fiksna_brzina || ""} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksne_dodatne_usluge">Dodatne fiksne usluge</Label>
                    <Textarea
                      id="fiksne_dodatne_usluge"
                      name="fiksne_dodatne_usluge"
                      value={formState.fiksne_dodatne_usluge || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiksna_oprema">Fiksna oprema</Label>
                    <Textarea
                      id="fiksna_oprema"
                      name="fiksna_oprema"
                      value={formState.fiksna_oprema || ""}
                      onChange={handleInputChange}
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
                      value={formState.brzina_min_download || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_min_upload">Min brzina slanja</Label>
                    <Input
                      id="brzina_min_upload"
                      name="brzina_min_upload"
                      value={formState.brzina_min_upload || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_download">Uobičajena brzina preuzimanja</Label>
                    <Input
                      id="brzina_obicna_download"
                      name="brzina_obicna_download"
                      value={formState.brzina_obicna_download || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_upload">Uobičajena brzina slanja</Label>
                    <Input
                      id="brzina_obicna_upload"
                      name="brzina_obicna_upload"
                      value={formState.brzina_obicna_upload || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_download">Max brzina preuzimanja</Label>
                    <Input
                      id="brzina_max_download"
                      name="brzina_max_download"
                      value={formState.brzina_max_download || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_upload">Max brzina slanja</Label>
                    <Input
                      id="brzina_max_upload"
                      name="brzina_max_upload"
                      value={formState.brzina_max_upload || ""}
                      onChange={handleInputChange}
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
                    <Input id="tv_paket" name="tv_paket" value={formState.tv_paket || ""} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tv_dodatne_usluge">Dodatne TV usluge</Label>
                    <Textarea
                      id="tv_dodatne_usluge"
                      name="tv_dodatne_usluge"
                      value={formState.tv_dodatne_usluge || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tv_oprema">TV oprema</Label>
                    <Textarea
                      id="tv_oprema"
                      name="tv_oprema"
                      value={formState.tv_oprema || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
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
                      value={formState.pretplatnicki_broj || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tarifa">Tarifa</Label>
                    <Input id="tarifa" name="tarifa" value={formState.tarifa || ""} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel_dodatne_usluge">Dodatne telefonske usluge</Label>
                    <Textarea
                      id="tel_dodatne_usluge"
                      name="tel_dodatne_usluge"
                      value={formState.tel_dodatne_usluge || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tel_oprema">Telefonska oprema</Label>
                    <Textarea
                      id="tel_oprema"
                      name="tel_oprema"
                      value={formState.tel_oprema || ""}
                      onChange={handleInputChange}
                      rows={3}
                    />
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
                      value={formState.uredaj_proizvodac_model || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_cijena">Cijena uređaja</Label>
                    <Input
                      id="uredaj_cijena"
                      name="uredaj_cijena"
                      type="number"
                      step="0.01"
                      value={formState.uredaj_cijena === null ? "" : formState.uredaj_cijena}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_popust">Popust na uređaj</Label>
                    <Input
                      id="uredaj_popust"
                      name="uredaj_popust"
                      type="number"
                      step="0.01"
                      value={formState.uredaj_popust === null ? "" : formState.uredaj_popust}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_za_placanje">Iznos za plaćanje uređaja</Label>
                    <Input
                      id="uredaj_za_placanje"
                      name="uredaj_za_placanje"
                      type="number"
                      step="0.01"
                      value={formState.uredaj_za_placanje === null ? "" : formState.uredaj_za_placanje}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uredaj_otplata_na_rate"
                      name="uredaj_otplata_na_rate"
                      checked={formState.uredaj_otplata_na_rate || false}
                      onCheckedChange={(checked) => handleCheckboxChange('uredaj_otplata_na_rate', Boolean(checked))}
                    />
                    <Label htmlFor="uredaj_otplata_na_rate">Otplata na rate</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_broj_obroka">Broj rata</Label>
                    <Input
                      id="uredaj_broj_obroka"
                      name="uredaj_broj_obroka"
                      type="number"
                      value={formState.uredaj_broj_obroka === null ? "" : formState.uredaj_broj_obroka}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_inicijalna_uplata">Inicijalna uplata</Label>
                    <Input
                      id="uredaj_inicijalna_uplata"
                      name="uredaj_inicijalna_uplata"
                      type="number"
                      step="0.01"
                      value={formState.uredaj_inicijalna_uplata === null ? "" : formState.uredaj_inicijalna_uplata}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_mjesecna_rata">Mjesečna rata</Label>
                    <Input
                      id="uredaj_mjesecna_rata"
                      name="uredaj_mjesecna_rata"
                      type="number"
                      step="0.01"
                      value={formState.uredaj_mjesecna_rata === null ? "" : formState.uredaj_mjesecna_rata}
                      onChange={handleInputChange}
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
                      value={formState.cijena_prikljucenja_opis || ""}
                      onChange={handleInputChange}
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
                      value={formState.cijena_prikljucenja_naknada === null ? "" : formState.cijena_prikljucenja_naknada}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_popust">Popust na naknadu za priključenje</Label>
                    <Input
                      id="cijena_prikljucenja_popust"
                      name="cijena_prikljucenja_popust"
                      type="number"
                      step="0.01"
                      value={formState.cijena_prikljucenja_popust === null ? "" : formState.cijena_prikljucenja_popust}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_ukupno">Ukupna naknada za priključenje</Label>
                    <Input
                      id="cijena_prikljucenja_ukupno"
                      name="cijena_prikljucenja_ukupno"
                      type="number"
                      step="0.01"
                      value={formState.cijena_prikljucenja_ukupno === null ? "" : formState.cijena_prikljucenja_ukupno}
                      onChange={handleInputChange}
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
                      value={formState.cijena_aktivacije_opis || ""}
                      onChange={handleInputChange}
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
                      value={formState.cijena_aktivacije_naknada === null ? "" : formState.cijena_aktivacije_naknada}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_popust">Popust na naknadu za aktivaciju</Label>
                    <Input
                      id="cijena_aktivacije_popust"
                      name="cijena_aktivacije_popust"
                      type="number"
                      step="0.01"
                      value={formState.cijena_aktivacije_popust === null ? "" : formState.cijena_aktivacije_popust}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_ukupno">Ukupna naknada za aktivaciju</Label>
                    <Input
                      id="cijena_aktivacije_ukupno"
                      name="cijena_aktivacije_ukupno"
                      type="number"
                      step="0.01"
                      value={formState.cijena_aktivacije_ukupno === null ? "" : formState.cijena_aktivacije_ukupno}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terminal_equipment" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Terminalna Oprema</h3>
                {terminalEquipmentList.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2 mb-4 p-3 border rounded-md">
                    <div className="flex-grow grid grid-cols-2 gap-x-4">
                      <div className="space-y-1">
                        <Label htmlFor={`te_name_${item.id}`}>Naziv opreme</Label>
                        <Input
                          id={`te_name_${item.id}`}
                          name={`te_name_${item.id}`}
                          value={item.name}
                          onChange={(e) => handleTerminalEquipmentChange(item.id, 'name', e.target.value)}
                          placeholder="Npr. Modem X, Router Y"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`te_price_${item.id}`}>Cijena</Label>
                        <Input
                          id={`te_price_${item.id}`}
                          name={`te_price_${item.id}`}
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleTerminalEquipmentChange(item.id, 'price', e.target.value)}
                          placeholder="Npr. 10.99"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTerminalEquipmentItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Ukloni
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addTerminalEquipmentItem} className="mt-2">
                  Dodaj Opremu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-8">
          <Link href={isEditing && initialData?.id ? `/edit-package/${initialData.id}` : "/"}>
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
