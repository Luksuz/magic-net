"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ContractData } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PdfButton from "@/components/pdf-button"
import UserInformationForm, { type UserInformation } from "@/components/user-information-form"
import type { TerminalEquipment } from "@/lib/pdf-generator"
import { Button } from "@/components/ui/button"

interface ContractFormProps {
  initialData: ContractData
  userInfoInitial?: UserInformation
  onUserInfoChange?: (data: UserInformation) => void
  terminalEquipmentInitial?: TerminalEquipment[]
  onTerminalEquipmentChange?: (data: TerminalEquipment[]) => void
  shouldGeneratePdf?: boolean
  contractConcludedOnPremises?: boolean
  onContractConcludedOnPremisesChange?: (value: boolean) => void
}

export default function ContractForm({ 
  initialData, 
  userInfoInitial,
  onUserInfoChange,
  terminalEquipmentInitial,
  onTerminalEquipmentChange,
  shouldGeneratePdf = false,
  contractConcludedOnPremises,
  onContractConcludedOnPremisesChange
}: ContractFormProps) {
  const [formData, setFormData] = useState<ContractData>(initialData)
  const [userInfo, setUserInfo] = useState<UserInformation>(userInfoInitial || {
    userId: "",
    userName: "",
    legalEntity: "",
    residenceAddress: "",
    connectionAddress: "",
    oib: "",
    idCardNumber: "",
    contactPhone: "",
    email: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    additionalServices: "",
    activationCost: "",
    externalWorksCost: "",
    invoiceDeliveryMethod: "mail",
    marketingContact: [],
    generalTermsDelivery: "provided",
    paymentMethod: "oneTime",
    sellerCode: 0,
    sellerPlace: "",
    sellerDate: new Date().toISOString().split("T")[0],
    changeOperator: false,
  })
  const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>(terminalEquipmentInitial || [
    { id: 1, name: "WiFi router", quantity: "", price: "190,00" },
    { id: 2, name: "Svjetlovodno čvorište - FTTH", quantity: "", price: "25,00" },
    { id: 3, name: "Smart Card za prijemnike", quantity: "", price: "0,00" },
    { id: 4, name: "CAM modul za DVB/T2", quantity: "", price: "45,00" },
    { id: 5, name: "MESH", quantity: "", price: "65,00" }
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const pdfButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const parsedValue = value === "" ? null : Number.parseFloat(value)
    
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: parsedValue }
      
      // Auto-calculate total connection fee
      if (name === "cijena_prikljucenja_naknada" || name === "cijena_prikljucenja_popust") {
        const naknada = name === "cijena_prikljucenja_naknada" 
          ? (parsedValue ?? 0) 
          : (updatedData.cijena_prikljucenja_naknada ?? 0)
        
        const popustPercentage = name === "cijena_prikljucenja_popust" 
          ? (parsedValue ?? 0) 
          : (updatedData.cijena_prikljucenja_popust ?? 0)
        
        // Calculate discount as percentage of the fee
        const popustAmount = (naknada * popustPercentage) / 100
        updatedData.cijena_prikljucenja_ukupno = naknada - popustAmount
      }
      
      // Auto-calculate total activation fee
      if (name === "cijena_aktivacije_naknada" || name === "cijena_aktivacije_popust") {
        const naknada = name === "cijena_aktivacije_naknada" 
          ? (parsedValue ?? 0) 
          : (updatedData.cijena_aktivacije_naknada ?? 0)
        
        const popustPercentage = name === "cijena_aktivacije_popust" 
          ? (parsedValue ?? 0) 
          : (updatedData.cijena_aktivacije_popust ?? 0)
        
        // Calculate discount as percentage of the fee
        const popustAmount = (naknada * popustPercentage) / 100
        updatedData.cijena_aktivacije_ukupno = naknada - popustAmount
      }
      
      // Auto-calculate device payment amount
      if (name === "uredaj_cijena" || name === "uredaj_popust") {
        const cijena = name === "uredaj_cijena"
          ? (parsedValue ?? 0)
          : (updatedData.uredaj_cijena ?? 0)
          
        const popustPercentage = name === "uredaj_popust"
          ? (parsedValue ?? 0)
          : (updatedData.uredaj_popust ?? 0)
          
        // Calculate discount as percentage of the price
        const popustAmount = (cijena * popustPercentage) / 100
        updatedData.uredaj_za_placanje = cijena - popustAmount
        
        // If payment in installments is enabled, also update the monthly payment amount
        if (updatedData.uredaj_otplata_na_rate) {
          calculateMonthlyPayment(updatedData);
        }
      }
      
      // Calculate monthly payment when number of installments or initial payment changes
      if ((name === "uredaj_broj_obroka" || name === "uredaj_inicijalna_uplata") && updatedData.uredaj_otplata_na_rate) {
        calculateMonthlyPayment(updatedData);
      }
      
      return updatedData
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: checked };
      
      // When installment payment is toggled, update the monthly payment calculation
      if (name === "uredaj_otplata_na_rate" && checked) {
        calculateMonthlyPayment(updatedData);
      }
      
      return updatedData;
    });
  }
  
  // Helper function to calculate the monthly payment amount
  const calculateMonthlyPayment = (data: ContractData) => {
    const totalPrice = data.uredaj_za_placanje ?? 0;
    const initialPayment = data.uredaj_inicijalna_uplata ?? 0;
    const installments = data.uredaj_broj_obroka ?? 1;
    
    if (installments > 0) {
      data.uredaj_mjesecna_rata = (totalPrice - initialPayment) / installments;
    } else {
      data.uredaj_mjesecna_rata = 0;
    }
  }

  const handleUserInfoChange = (data: UserInformation) => {
    setUserInfo(data)
    if (onUserInfoChange) {
      onUserInfoChange(data)
    }
  }
  
  const handleEquipmentChange = (id: number, field: string, value: string) => {
    const updatedEquipment = terminalEquipment.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    )
    setTerminalEquipment(updatedEquipment)
    if (onTerminalEquipmentChange) {
      onTerminalEquipmentChange(updatedEquipment)
    }
  }
  
  // Auto-generate PDF when shouldGeneratePdf is true
  useEffect(() => {
    if (shouldGeneratePdf && pdfButtonRef.current) {
      // Set active tab to basic first
      setActiveTab("basic")
      
      // Small delay to ensure tab switch completes
      const timer = setTimeout(() => {
        // Click the PDF button programmatically
        if (pdfButtonRef.current) {
          pdfButtonRef.current.click()
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [shouldGeneratePdf])

  // Calculate monthly payment when component mounts or relevant values change
  useEffect(() => {
    if (formData.uredaj_otplata_na_rate) {
      const updatedData = { ...formData };
      calculateMonthlyPayment(updatedData);
      setFormData(updatedData);
    }
  }, [formData.uredaj_otplata_na_rate, formData.uredaj_za_placanje, formData.uredaj_inicijalna_uplata, formData.uredaj_broj_obroka]);

  // Function to handle PDF button ref
  const setPdfRef = (el: HTMLButtonElement | null) => {
    pdfButtonRef.current = el
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full tabs-container" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="basic">Osnovne informacije</TabsTrigger>
          <TabsTrigger value="internet">Usluga i Internet</TabsTrigger>
          <TabsTrigger value="tv">TV</TabsTrigger>
          <TabsTrigger value="telephone">Telefon</TabsTrigger>
          <TabsTrigger value="equipment">Oprema</TabsTrigger>
          <TabsTrigger value="pricing">Cijene</TabsTrigger>
          <TabsTrigger value="user">Podaci korisnika</TabsTrigger>
        </TabsList>

        <div className="pdf-content">
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usluga">Usluga</Label>
                    <Input id="usluga" name="usluga" value={formData.usluga || ""} onChange={handleChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broj_ugovora">Broj ugovora</Label>
                    <Input
                      id="broj_ugovora"
                      name="broj_ugovora"
                      value={formData.broj_ugovora || ""}
                      onChange={handleChange}
                    />
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
                    <Input id="fiksni_paket" name="fiksni_paket" value={formData.fiksni_paket || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiksna_brzina">Fiksna brzina</Label>
                    <Input id="fiksna_brzina" name="fiksna_brzina" value={formData.fiksna_brzina || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fiksne_dodatne_usluge">Dodatne fiksne usluge</Label>
                    <Textarea
                      id="fiksne_dodatne_usluge"
                      name="fiksne_dodatne_usluge"
                      value={formData.fiksne_dodatne_usluge || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fiksna_oprema">Fiksna oprema</Label>
                    <Textarea
                      id="fiksna_oprema"
                      name="fiksna_oprema"
                      value={formData.fiksna_oprema || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  {/* Added Price Fields for Internet */}
                  <h4 className="text-md font-medium mt-6 mb-3">Periodična cijena</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo_price_fiksni">Promotivna mjesečna naknada (Internet)</Label>
                      <Input id="promo_price_fiksni" name="promo_price_fiksni" type="number" step="0.01" value={formData.promo_price_fiksni ?? ""} onChange={handleNumberChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regular_price_fiksni">Redovna mjesečna naknada (Internet)</Label>
                      <Input id="regular_price_fiksni" name="regular_price_fiksni" type="number" step="0.01" value={formData.regular_price_fiksni ?? ""} onChange={handleNumberChange} />
                    </div>
                  </div>

                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brzina_min_download">Min. brzina preuzimanja</Label>
                    <Input
                      id="brzina_min_download"
                      name="brzina_min_download"
                      value={formData.brzina_min_download || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_min_upload">Min. brzina slanja</Label>
                    <Input
                      id="brzina_min_upload"
                      name="brzina_min_upload"
                      value={formData.brzina_min_upload || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_download">Uobičajena brzina preuzimanja</Label>
                    <Input
                      id="brzina_obicna_download"
                      name="brzina_obicna_download"
                      value={formData.brzina_obicna_download || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_obicna_upload">Uobičajena brzina slanja</Label>
                    <Input
                      id="brzina_obicna_upload"
                      name="brzina_obicna_upload"
                      value={formData.brzina_obicna_upload || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_download">Maks. brzina preuzimanja</Label>
                    <Input
                      id="brzina_max_download"
                      name="brzina_max_download"
                      value={formData.brzina_max_download || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brzina_max_upload">Maks. brzina slanja</Label>
                    <Input
                      id="brzina_max_upload"
                      name="brzina_max_upload"
                      value={formData.brzina_max_upload || ""}
                      onChange={handleChange}
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
                    <Input id="tv_paket" name="tv_paket" value={formData.tv_paket || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tv_dodatne_usluge">Dodatne TV usluge</Label>
                    <Textarea
                      id="tv_dodatne_usluge"
                      name="tv_dodatne_usluge"
                      value={formData.tv_dodatne_usluge || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tv_oprema">TV oprema</Label>
                    <Textarea
                      id="tv_oprema"
                      name="tv_oprema"
                      value={formData.tv_oprema || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  {/* Added Price Fields for TV */}
                  <h4 className="text-md font-medium mt-6 mb-3">Periodična cijena</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo_price_tv">Promotivna mjesečna naknada (TV)</Label>
                      <Input id="promo_price_tv" name="promo_price_tv" type="number" step="0.01" value={formData.promo_price_tv ?? ""} onChange={handleNumberChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regular_price_tv">Redovna mjesečna naknada (TV)</Label>
                      <Input id="regular_price_tv" name="regular_price_tv" type="number" step="0.01" value={formData.regular_price_tv ?? ""} onChange={handleNumberChange} />
                    </div>
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
                      value={formData.pretplatnicki_broj || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarifa">Tarifa</Label>
                    <Input id="tarifa" name="tarifa" value={formData.tarifa || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tel_dodatne_usluge">Dodatne telefonske usluge</Label>
                    <Textarea
                      id="tel_dodatne_usluge"
                      name="tel_dodatne_usluge"
                      value={formData.tel_dodatne_usluge || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tel_oprema">Telefonska oprema</Label>
                    <Textarea
                      id="tel_oprema"
                      name="tel_oprema"
                      value={formData.tel_oprema || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  {/* Added Price Fields for Telephone */}
                  <h4 className="text-md font-medium mt-6 mb-3">Periodična cijena</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo_price_phone">Promotivna mjesečna naknada (Telefon)</Label>
                      <Input id="promo_price_phone" name="promo_price_phone" type="number" step="0.01" value={formData.promo_price_phone ?? ""} onChange={handleNumberChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regular_price_phone">Redovna mjesečna naknada (Telefon)</Label>
                      <Input id="regular_price_phone" name="regular_price_phone" type="number" step="0.01" value={formData.regular_price_phone ?? ""} onChange={handleNumberChange} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Terminalna oprema</h2>
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Naziv Terminalne opreme</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Količina</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Jedinična cijena po komadu Terminalne opreme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terminalEquipment.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleEquipmentChange(item.id, 'quantity', e.target.value)}
                              className="w-16 mx-auto text-center"
                              min="0"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.price} EUR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 
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
                      value={formData.uredaj_proizvodac_model || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_cijena">Cijena uređaja</Label>
                    <Input
                      id="uredaj_cijena"
                      name="uredaj_cijena"
                      type="number"
                      step="0.01"
                      value={formData.uredaj_cijena || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_popust">Popust na uređaj (%)</Label>
                    <Input
                      id="uredaj_popust"
                      name="uredaj_popust"
                      type="number"
                      step="0.01"
                      value={formData.uredaj_popust || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_za_placanje">Iznos za plaćanje uređaja</Label>
                    <Input
                      id="uredaj_za_placanje"
                      name="uredaj_za_placanje"
                      type="number"
                      step="0.01"
                      value={formData.uredaj_za_placanje || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uredaj_otplata_na_rate"
                      checked={formData.uredaj_otplata_na_rate || false}
                      onCheckedChange={(checked) => handleCheckboxChange("uredaj_otplata_na_rate", checked as boolean)}
                    />
                    <Label htmlFor="uredaj_otplata_na_rate">Otplata na rate</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_broj_obroka">Broj obroka</Label>
                    <Input
                      id="uredaj_broj_obroka"
                      name="uredaj_broj_obroka"
                      type="number"
                      value={formData.uredaj_broj_obroka || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_inicijalna_uplata">Inicijalna uplata</Label>
                    <Input
                      id="uredaj_inicijalna_uplata"
                      name="uredaj_inicijalna_uplata"
                      type="number"
                      step="0.01"
                      value={formData.uredaj_inicijalna_uplata || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uredaj_mjesecna_rata">Mjesečna rata</Label>
                    <Input
                      id="uredaj_mjesecna_rata"
                      name="uredaj_mjesecna_rata"
                      type="number"
                      step="0.01"
                      value={formData.uredaj_mjesecna_rata || ""}
                      onChange={handleNumberChange}
                      readOnly
                      className="w-full bg-gray-50"
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
                      value={formData.cijena_prikljucenja_opis || ""}
                      onChange={handleChange}
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
                      value={formData.cijena_prikljucenja_naknada || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_popust">Popust na priključenje (%)</Label>
                    <Input
                      id="cijena_prikljucenja_popust"
                      name="cijena_prikljucenja_popust"
                      type="number"
                      step="0.01"
                      value={formData.cijena_prikljucenja_popust || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_prikljucenja_ukupno">Ukupna cijena priključenja</Label>
                    <Input
                      id="cijena_prikljucenja_ukupno"
                      name="cijena_prikljucenja_ukupno"
                      type="number"
                      step="0.01"
                      value={formData.cijena_prikljucenja_ukupno || ""}
                      onChange={handleNumberChange}
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
                      value={formData.cijena_aktivacije_opis || ""}
                      onChange={handleChange}
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
                      value={formData.cijena_aktivacije_naknada || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_popust">Popust na aktivaciju (%)</Label>
                    <Input
                      id="cijena_aktivacije_popust"
                      name="cijena_aktivacije_popust"
                      type="number"
                      step="0.01"
                      value={formData.cijena_aktivacije_popust || ""}
                      onChange={handleNumberChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cijena_aktivacije_ukupno">Ukupna cijena aktivacije</Label>
                    <Input
                      id="cijena_aktivacije_ukupno"
                      name="cijena_aktivacije_ukupno"
                      type="number"
                      step="0.01"
                      value={formData.cijena_aktivacije_ukupno || ""}
                      onChange={handleNumberChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user" className="space-y-4 mt-4">
            <UserInformationForm
              initialData={userInfo}
              onChange={handleUserInfoChange}
              packageName={formData.fiksni_paket || formData.tv_paket || formData.tarifa || ""}
              subscriptionNumber={formData.pretplatnicki_broj || ""}
            />
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-between mt-8 items-center">
        <div className="flex items-center space-x-2">
          <div className="border rounded-md overflow-hidden flex">
            <Button
              type="button"
              variant={contractConcludedOnPremises ? "default" : "outline"}
              className={`px-4 py-2 rounded-none ${contractConcludedOnPremises ? "bg-blue-600 text-white" : ""}`}
              onClick={() => onContractConcludedOnPremisesChange?.(true)}
            >
              U poslovnom prostoru
            </Button>
            <Button
              type="button"
              variant={!contractConcludedOnPremises ? "default" : "outline"}
              className={`px-4 py-2 rounded-none ${!contractConcludedOnPremises ? "bg-blue-600 text-white" : ""}`}
              onClick={() => onContractConcludedOnPremisesChange?.(false)}
            >
              Izvan poslovnog prostora
            </Button>
          </div>
        </div>
        <div className="pdf-button-container">
          <PdfButton 
            formData={formData} 
            userInfo={userInfo} 
            setActiveTab={setActiveTab}
            terminalEquipment={terminalEquipment.filter(item => item.quantity && item.quantity !== "")}
            buttonRef={setPdfRef}
            contractConcludedOnPremises={contractConcludedOnPremises}
          />
        </div>
      </div>
    </div>
  )
}
