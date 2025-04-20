"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface UserInformation {
  userId: string
  userName: string
  legalEntity: string
  residenceAddress: string
  connectionAddress: string
  oib: string
  idCardNumber: string
  contactPhone: string
  email: string
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  additionalServices: string
  activationCost: string
  externalWorksCost: string
  invoiceDeliveryMethod: "mail" | "email" | "eInvoice" | "contactEmail"
  marketingContact: string[]
  generalTermsDelivery: "provided" | "selfDownload"
  paymentMethod: "oneTime" | "installments"
  sellerCode: string
  sellerPlace: string
  sellerDate: string
}

const defaultUserInfo: UserInformation = {
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
  sellerCode: "",
  sellerPlace: "",
  sellerDate: new Date().toISOString().split("T")[0],
}

interface UserInformationFormProps {
  initialData?: Partial<UserInformation>
  onChange: (data: UserInformation) => void
  packageName?: string
  subscriptionNumber?: string
}

export default function UserInformationForm({
  initialData = {},
  onChange,
  packageName,
  subscriptionNumber,
}: UserInformationFormProps) {
  const [userInfo, setUserInfo] = useState<UserInformation>({
    ...defaultUserInfo,
    ...initialData,
  })

  const handleChange = (field: keyof UserInformation, value: any) => {
    const updatedInfo = { ...userInfo, [field]: value }
    setUserInfo(updatedInfo)
    onChange(updatedInfo)
  }

  const handleCheckboxChange = (field: keyof UserInformation, value: string) => {
    const currentValues = userInfo[field] as string[]
    let newValues: string[]

    if (currentValues.includes(value)) {
      newValues = currentValues.filter((v) => v !== value)
    } else {
      newValues = [...currentValues, value]
    }

    handleChange(field, newValues)
  }

  useEffect(() => {
    onChange(userInfo)
  }, [onChange, userInfo])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Podaci o korisniku</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userId">ID Korisnika</Label>
            <Input
              id="userId"
              value={userInfo.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
              placeholder="npr. 200300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Ime i prezime Korisnika (fizička osoba/ovlaštena osoba)</Label>
            <Input
              id="userName"
              value={userInfo.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              placeholder="npr. PERO PERIĆ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalEntity">Pravna osoba</Label>
            <Input
              id="legalEntity"
              value={userInfo.legalEntity}
              onChange={(e) => handleChange("legalEntity", e.target.value)}
              placeholder="Naziv pravne osobe (ako je primjenjivo)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="residenceAddress">Prebivalište/sjedište</Label>
            <Textarea
              id="residenceAddress"
              value={userInfo.residenceAddress}
              onChange={(e) => handleChange("residenceAddress", e.target.value)}
              placeholder="Ulica i kućni broj, kat, poštanski broj, mjesto"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="connectionAddress">Adresa priključka</Label>
            <Textarea
              id="connectionAddress"
              value={userInfo.connectionAddress}
              onChange={(e) => handleChange("connectionAddress", e.target.value)}
              placeholder="Ulica i kućni broj, kat, poštanski broj, mjesto"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oib">OIB (fizička osoba/pravna osoba)</Label>
            <Input
              id="oib"
              value={userInfo.oib}
              onChange={(e) => handleChange("oib", e.target.value)}
              placeholder="npr. 12345678910"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idCardNumber">Broj osobne iskaznice</Label>
            <Input
              id="idCardNumber"
              value={userInfo.idCardNumber}
              onChange={(e) => handleChange("idCardNumber", e.target.value)}
              placeholder="npr. 123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Kontakt telefon/mobitel</Label>
            <Input
              id="contactPhone"
              value={userInfo.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              placeholder="npr. 091/234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail adresa</Label>
            <Input
              id="email"
              type="email"
              value={userInfo.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="npr. pero.peric@gmail.com"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">PODACI O KONTAKT OSOBI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPersonName">Ime i prezime kontakt osobe</Label>
              <Input
                id="contactPersonName"
                value={userInfo.contactPersonName}
                onChange={(e) => handleChange("contactPersonName", e.target.value)}
                placeholder="npr. HRVOJE HORVAT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonPhone">Kontakt telefon/mobitel</Label>
              <Input
                id="contactPersonPhone"
                value={userInfo.contactPersonPhone}
                onChange={(e) => handleChange("contactPersonPhone", e.target.value)}
                placeholder="npr. 092/345-6789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPersonEmail">E-mail adresa za kontakt</Label>
              <Input
                id="contactPersonEmail"
                type="email"
                value={userInfo.contactPersonEmail}
                onChange={(e) => handleChange("contactPersonEmail", e.target.value)}
                placeholder="npr. hrvoje.horvat@gmail.com"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Podaci o paketu i uslugama</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paket</Label>
              <div className="p-2 border rounded-md bg-muted/20">{packageName || "Nije odabran"}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalServices">Dodatne usluge</Label>
              <Textarea
                id="additionalServices"
                value={userInfo.additionalServices}
                onChange={(e) => handleChange("additionalServices", e.target.value)}
                placeholder="npr. 1 MESH (na prodaju ili u najam), 2 MIX1, 3. MIX2, 4 EUROPA 1"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Pretplatnički broj</Label>
              <div className="p-2 border rounded-md bg-muted/20">{subscriptionNumber || "Nije definiran"}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationCost">Trošak aktivacije usluge</Label>
              <Input
                id="activationCost"
                value={userInfo.activationCost}
                onChange={(e) => handleChange("activationCost", e.target.value)}
                placeholder="npr. 1)0,00, 2)16,59 EUR, 3) 33,00 EUR"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalWorksCost">Trošak Vanjskih radova</Label>
              <Input
                id="externalWorksCost"
                value={userInfo.externalWorksCost}
                onChange={(e) => handleChange("externalWorksCost", e.target.value)}
                placeholder="npr. 1)0,00 EUR, 2)40,00 EUR, 3)100,00 EUR"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Način dostave i privole</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Način dostave računa</Label>
              <RadioGroup
                value={userInfo.invoiceDeliveryMethod}
                onValueChange={(value) => handleChange("invoiceDeliveryMethod", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mail" id="mail" />
                  <Label htmlFor="mail" className="font-normal">
                    Poštom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eInvoice" id="eInvoice" />
                  <Label htmlFor="eInvoice" className="font-normal">
                    eRačun
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="font-normal">
                    Mailom vlasniku
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contactEmail" id="contactEmail" />
                  <Label htmlFor="contactEmail" className="font-normal">
                    Mailom kontakt osobi
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>PRIVOLE za MARK.KONTAKTIRANJE</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingPhone"
                    checked={userInfo.marketingContact.includes("phone")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("marketingContact", "phone")
                      else handleCheckboxChange("marketingContact", "phone")
                    }}
                  />
                  <Label htmlFor="marketingPhone" className="font-normal">
                    Pozivom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingSms"
                    checked={userInfo.marketingContact.includes("sms")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("marketingContact", "sms")
                      else handleCheckboxChange("marketingContact", "sms")
                    }}
                  />
                  <Label htmlFor="marketingSms" className="font-normal">
                    SMS-om
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingEmail"
                    checked={userInfo.marketingContact.includes("email")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("marketingContact", "email")
                      else handleCheckboxChange("marketingContact", "email")
                    }}
                  />
                  <Label htmlFor="marketingEmail" className="font-normal">
                    Mailom
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dostava općih uvjeta</Label>
              <RadioGroup
                value={userInfo.generalTermsDelivery}
                onValueChange={(value) => handleChange("generalTermsDelivery", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="provided" id="provided" />
                  <Label htmlFor="provided" className="font-normal">
                    Uručeni korisniku
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selfDownload" id="selfDownload" />
                  <Label htmlFor="selfDownload" className="font-normal">
                    Sam će ih preuzeti
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Način otplate</Label>
              <RadioGroup
                value={userInfo.paymentMethod}
                onValueChange={(value) => handleChange("paymentMethod", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oneTime" id="oneTime" />
                  <Label htmlFor="oneTime" className="font-normal">
                    Jednokratno
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="installments" id="installments" />
                  <Label htmlFor="installments" className="font-normal">
                    Na rate
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Podaci o prodajnom mjestu</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellerCode">Kod prodavatelja</Label>
              <Input
                id="sellerCode"
                value={userInfo.sellerCode}
                onChange={(e) => handleChange("sellerCode", e.target.value)}
                placeholder="npr. 09"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerPlace">Mjesto</Label>
              <Input
                id="sellerPlace"
                value={userInfo.sellerPlace}
                onChange={(e) => handleChange("sellerPlace", e.target.value)}
                placeholder="npr. TRNOVEC BARTOLOVEČKI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerDate">Datum</Label>
              <Input
                id="sellerDate"
                type="date"
                value={userInfo.sellerDate}
                onChange={(e) => handleChange("sellerDate", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
