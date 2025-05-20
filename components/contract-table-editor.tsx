"use client"

import { useState, useEffect } from "react"
import type { ContractData } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { FileText } from "lucide-react"
import type { UserInformation } from "@/components/user-information-form"
import type { TerminalEquipment } from "@/lib/pdf-generator"

export default function ContractTableEditor({ 
  initialData, 
  userInfo, 
  onUserInfoChange,
  terminalEquipment: initialTerminalEquipment,
  onTerminalEquipmentChange,
  onGeneratePdf
}: { 
  initialData: ContractData
  userInfo: UserInformation
  onUserInfoChange: (data: UserInformation) => void
  terminalEquipment: TerminalEquipment[]
  onTerminalEquipmentChange: (data: TerminalEquipment[]) => void
  onGeneratePdf: (data: ContractData, equipmentData: TerminalEquipment[]) => void
}) {
  const [formData, setFormData] = useState<ContractData>(initialData)
  const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>(initialTerminalEquipment)
  
  // Calculate monthly payment when component mounts or relevant values change
  useEffect(() => {
    if (formData.uredaj_otplata_na_rate) {
      const updatedData = { ...formData };
      calculateMonthlyPayment(updatedData);
      setFormData(updatedData);
    }
  }, [formData.uredaj_otplata_na_rate, formData.uredaj_za_placanje, formData.uredaj_inicijalna_uplata, formData.uredaj_broj_obroka]);
  
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

  const handleEquipmentChange = (id: number, field: string, value: string) => {
    const updatedEquipment = terminalEquipment.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    )
    setTerminalEquipment(updatedEquipment)
    onTerminalEquipmentChange(updatedEquipment)
  }
  
  const handleGeneratePdf = () => {
    onGeneratePdf(formData, terminalEquipment)
  }

  // Group fields by category for better organization
  const fieldGroups = [
    {
      name: "Osnovne informacije",
      fields: [
        { key: "usluga", label: "Usluga", type: "text" },
        { key: "broj_ugovora", label: "Broj ugovora", type: "text" }
      ]
    },
    {
      name: "Internet usluga",
      fields: [
        { key: "fiksni_paket", label: "Fiksni paket", type: "text" },
        { key: "fiksna_brzina", label: "Fiksna brzina", type: "text" },
        { key: "fiksne_dodatne_usluge", label: "Dodatne fiksne usluge", type: "textarea" },
        { key: "fiksna_oprema", label: "Fiksna oprema", type: "textarea" },
        { key: "brzina_min_download", label: "Min. brzina downloada", type: "text" },
        { key: "brzina_min_upload", label: "Min. brzina uploada", type: "text" },
        { key: "brzina_obicna_download", label: "Uobičajena brzina downloada", type: "text" },
        { key: "brzina_obicna_upload", label: "Uobičajena brzina uploada", type: "text" },
        { key: "brzina_max_download", label: "Maks. brzina downloada", type: "text" },
        { key: "brzina_max_upload", label: "Maks. brzina uploada", type: "text" }
      ]
    },
    {
      name: "TV usluga",
      fields: [
        { key: "tv_paket", label: "TV paket", type: "text" },
        { key: "tv_dodatne_usluge", label: "Dodatne TV usluge", type: "textarea" },
        { key: "tv_oprema", label: "TV oprema", type: "textarea" }
      ]
    },
    {
      name: "Telefonska usluga",
      fields: [
        { key: "pretplatnicki_broj", label: "Pretplatnički broj", type: "text" },
        { key: "tarifa", label: "Tarifa", type: "text" },
        { key: "tel_dodatne_usluge", label: "Dodatne telefonske usluge", type: "textarea" },
        { key: "tel_oprema", label: "Telefonska oprema", type: "textarea" }
      ]
    },
    {
      name: "Informacije o uređaju",
      fields: [
        { key: "uredaj_proizvodac_model", label: "Proizvođač i model uređaja", type: "text" },
        { key: "uredaj_cijena", label: "Cijena uređaja", type: "number" },
        { key: "uredaj_popust", label: "Popust na uređaj (%)", type: "number" },
        { key: "uredaj_za_placanje", label: "Iznos za plaćanje", type: "number" },
        { key: "uredaj_otplata_na_rate", label: "Plaćanje na rate", type: "checkbox" },
        { key: "uredaj_broj_obroka", label: "Broj rata", type: "number" },
        { key: "uredaj_inicijalna_uplata", label: "Inicijalna uplata", type: "number" },
        { key: "uredaj_mjesecna_rata", label: "Mjesečna rata", type: "number", readOnly: true }
      ]
    },
    {
      name: "Naknade za priključenje i aktivaciju",
      fields: [
        { key: "cijena_prikljucenja_opis", label: "Opis naknade za priključenje", type: "text" },
        { key: "cijena_prikljucenja_naknada", label: "Naknada za priključenje", type: "number" },
        { key: "cijena_prikljucenja_popust", label: "Popust na priključenje (%)", type: "number" },
        { key: "cijena_prikljucenja_ukupno", label: "Ukupno za priključenje", type: "number" },
        { key: "cijena_aktivacije_opis", label: "Opis naknade za aktivaciju", type: "text" },
        { key: "cijena_aktivacije_naknada", label: "Naknada za aktivaciju", type: "number" },
        { key: "cijena_aktivacije_popust", label: "Popust na aktivaciju (%)", type: "number" },
        { key: "cijena_aktivacije_ukupno", label: "Ukupno za aktivaciju", type: "number" }
      ]
    }
  ]

  // Basic user information fields
  const userInfoGroups = [
    {
      name: "Osnovni podaci korisnika", 
      fields: [
        { key: "userId", label: "ID korisnika", type: "text" },
        { key: "userName", label: "Ime korisnika", type: "text" },
        { key: "legalEntity", label: "Pravna osoba", type: "text" },
        { key: "residenceAddress", label: "Adresa prebivališta", type: "text" },
        { key: "connectionAddress", label: "Adresa priključka", type: "text" },
        { key: "oib", label: "OIB", type: "text" },
        { key: "idCardNumber", label: "Broj osobne iskaznice", type: "text" },
        { key: "contactPhone", label: "Kontakt telefon", type: "text" },
        { key: "email", label: "Email", type: "text" }
      ]
    },
    {
      name: "Kontakt osoba",
      fields: [
        { key: "contactPersonName", label: "Ime kontakt osobe", type: "text" },
        { key: "contactPersonPhone", label: "Telefon kontakt osobe", type: "text" },
        { key: "contactPersonEmail", label: "Email kontakt osobe", type: "text" }
      ]
    },
    {
      name: "Dodatne usluge i troškovi",
      fields: [
        { key: "additionalServices", label: "Dodatne usluge", type: "text" },
        { key: "activationCost", label: "Trošak aktivacije", type: "text" },
        { key: "externalWorksCost", label: "Trošak vanjskih radova", type: "text" }
      ]
    },
    {
      name: "Podaci o prodajnom mjestu",
      fields: [
        { key: "sellerCode", label: "Kod prodavatelja", type: "text" },
        { key: "sellerPlace", label: "Mjesto", type: "text" },
        { key: "sellerDate", label: "Datum", type: "date" }
      ]
    }
  ]

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    onUserInfoChange({ ...userInfo, [name]: value })
  }

  return (
    <div className="space-y-6">
      {fieldGroups.map((group) => (
        <Card key={group.name} className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">{group.name}</h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left w-1/3">Polje</th>
                    <th className="border border-gray-300 px-4 py-2 text-left w-2/3">Vrijednost</th>
                  </tr>
                </thead>
                <tbody>
                  {group.fields.map((field) => (
                    <tr key={field.key} className="border-b hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{field.label}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {field.type === "textarea" ? (
                          <Textarea 
                            id={field.key}
                            name={field.key}
                            value={(formData as any)[field.key] || ""}
                            onChange={handleChange}
                            rows={2}
                            className="w-full"
                          />
                        ) : field.type === "number" ? (
                          <Input
                            id={field.key}
                            name={field.key}
                            type="number"
                            value={(formData as any)[field.key] || ""}
                            onChange={handleNumberChange}
                            className={`w-full ${field.readOnly ? "bg-gray-50" : ""}`}
                            readOnly={field.readOnly}
                          />
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-center">
                            <Checkbox 
                              id={field.key}
                              checked={!!(formData as any)[field.key]}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(field.key, checked === true)
                              }
                            />
                            <Label htmlFor={field.key} className="ml-2">
                              {(formData as any)[field.key] ? "Da" : "Ne"}
                            </Label>
                          </div>
                        ) : (
                          <Input
                            id={field.key}
                            name={field.key}
                            value={(formData as any)[field.key] || ""}
                            onChange={handleChange}
                            className="w-full"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4">Terminalna oprema</h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-center">Redni broj</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Naziv Terminalne opreme</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Količina</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Jedinična cijena po komadu Terminalne opreme</th>
                </tr>
              </thead>
              <tbody>
                {terminalEquipment.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.id}.</td>
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
            <p className="text-sm mt-4 italic">
              Napomena: ako bilo kada odlučite isključiti uslugu, dužni ste nam vratiti Terminalnu opremu koju smo Vam dali na korištenje. 
              Krajnji rok za povrat Terminalne opreme je 15 dana od dana zaprimanja računa na kojem će Vam biti naplaćena naknada za istu, 
              a koji ćemo stornirati u slučaju povrata Terminalne opreme.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4">Osnovne informacije o korisniku</h2>
          <div className="w-full overflow-x-auto">
            {userInfoGroups.map((group) => (
              <div key={group.name} className="mb-6">
                <h3 className="text-lg font-medium mb-3">{group.name}</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left w-1/3">Polje</th>
                      <th className="border border-gray-300 px-4 py-2 text-left w-2/3">Vrijednost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fields.map((field) => (
                      <tr key={field.key} className="border-b hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-medium">{field.label}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            id={field.key}
                            name={field.key}
                            type={field.type === "date" ? "date" : "text"}
                            value={(userInfo as any)[field.key] || ""}
                            onChange={handleUserInfoChange}
                            className="w-full"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleGeneratePdf} 
          size="lg" 
          className="min-w-[200px]"
        >
          <FileText className="mr-2 h-4 w-4" />
          Izvezi u PDF
        </Button>
      </div>
    </div>
  )
} 