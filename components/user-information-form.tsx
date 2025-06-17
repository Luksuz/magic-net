"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/contexts/authContext"
import { getAgreementNumber } from "@/lib/utils"

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
  invoiceDeliveryMethod: string[]
  marketingContact: string[]
  generalTermsDelivery: "provided" | "selfDownload"
  paymentMethod: "oneTime" | "installments" | "noDevice"
  sellerCode: number
  sellerPlace: string
  sellerDate: string
  changeOperator: boolean
}

export interface OperatorChangeData {
  existingOperatorName: string
  contractOnDistance: boolean
  agreeToPayDebts: boolean
  numberTransfer: boolean
  notificationAgreement: boolean
  vpnSeries: boolean
  servicesToCancel: string[]
  servicesToKeep: string[]
  userAccountsToKeep: string[]
  wholesaleService: boolean
  userName: string
  legalEntity: string
  oib: string
  phoneNumber: string
  contactPhone: string
  email: string
  connectionAddress: string
  sellerPlace: string
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
  invoiceDeliveryMethod: ["mail"],
  marketingContact: ["email", "sms", "phone"],
  generalTermsDelivery: "provided",
  paymentMethod: "oneTime",
  sellerCode: 0,
  sellerPlace: "Koprivnička 17C, 42230 Ludbreg",
  sellerDate: "",
  changeOperator: false
}

interface UserInformationFormProps {
  initialData?: Partial<UserInformation>
  onChange: (data: UserInformation) => void
  packageName?: string
  subscriptionNumber?: string
  contractConcludedOnPremises?: boolean
}

export default function UserInformationForm({
  initialData = {},
  onChange,
  packageName,
  subscriptionNumber,
  contractConcludedOnPremises = true,
}: UserInformationFormProps) {
  const { profile } = useAuth()
  const [oibError, setOibError] = useState<string>("")
  const [userInfo, setUserInfo] = useState<UserInformation>(() => {
    // Initialize with defaultUserInfo and initialData
    // Then, if profile is available, merge sellerCode from it immediately.
    // This avoids an extra effect/render just for sellerCode initialization.
    const baseInfo = {
      ...defaultUserInfo,
      ...initialData,
    };
    if (profile && profile.user_number !== null) {
      baseInfo.sellerCode = profile.user_number;
    }
    
    // Set seller location from profile if available
    if (profile && profile.seller_location) {
      baseInfo.sellerPlace = profile.seller_location;
    }
    
    // Set today's date if contract is concluded on premises and no date is provided
    if (contractConcludedOnPremises && !baseInfo.sellerDate) {
      baseInfo.sellerDate = new Date().toISOString().split('T')[0];
    }
    
    return baseInfo;
  });

  // Handle contractConcludedOnPremises changes
  useEffect(() => {
    if (contractConcludedOnPremises) {
      // If contract is on premises and no date is set, set today's date
      if (!userInfo.sellerDate) {
        const updatedInfo = {
          ...userInfo,
          sellerDate: new Date().toISOString().split('T')[0]
        };
        setUserInfo(updatedInfo);
      }
    } else {
      // If contract is off premises, clear the date
      if (userInfo.sellerDate) {
        const updatedInfo = {
          ...userInfo,
          sellerDate: ""
        };
        setUserInfo(updatedInfo);
      }
    }
  }, [contractConcludedOnPremises]);

  useEffect(() => {
    // This effect now only syncs sellerCode if profile changes *after* initial mount
    // or if initialData didn't provide it and profile was initially null but became available.
    if (profile && profile.user_number !== null && userInfo.sellerCode !== profile.user_number) {
        // Only update if profile.user_number is different from current userInfo.sellerCode
        // to avoid unnecessary updates if it was already set during useState initialization.
        const updatedInfo = {
          ...userInfo,
          sellerCode: profile.user_number
        };
        setUserInfo(updatedInfo);
        // onChange will be called by the next effect if updatedInfo is different
    }
    
    // Sync seller location from profile
    if (profile && profile.seller_location && userInfo.sellerPlace !== profile.seller_location) {
        const updatedInfo = {
          ...userInfo,
          sellerPlace: profile.seller_location
        };
        setUserInfo(updatedInfo);
    }
  }, [profile, userInfo.sellerCode, userInfo.sellerPlace]); // Added userInfo.sellerPlace to dependencies

  const validateOib = (oib: string) => {
    if (oib.length === 0) {
      setOibError("")
      return true
    }
    
    // Check if OIB contains only digits
    if (!/^\d+$/.test(oib)) {
      setOibError("OIB može sadržavati samo brojeve")
      return false
    }
    
    // Check if OIB has exactly 11 digits
    if (oib.length !== 11) {
      setOibError("OIB mora imati točno 11 znamenaka")
      return false
    }
    
    setOibError("")
    return true
  }

  const handleChange = (field: keyof UserInformation, value: any) => {
    // Special handling for OIB validation
    if (field === "oib") {
      validateOib(value)
    }
    
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

  // Format activation fees for display
  const getActivationFeeOptions = () => {
    // Default options if no profile data is available
    if (!profile?.activation_fees?.length) {
      return [
        { value: "0,00", label: "0,00 EUR" },
        { value: "16,59", label: "16,59 EUR" },
        { value: "33,00", label: "33,00 EUR" }
      ]
    }
    
    // Format profile data for display
    return profile.activation_fees.map(fee => {
      const formattedFee = (fee / 100).toFixed(2).replace('.', ',')
      return {
        value: formattedFee,
        label: `${formattedFee} EUR`
      }
    })
  }

  useEffect(() => {
    onChange(userInfo)
  }, [onChange, userInfo])

  if (!profile) {
    return null
  }

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
              className={oibError ? "border-red-500" : ""}
            />
            {oibError && (
              <p className="text-sm text-red-500 mt-1">{oibError}</p>
            )}
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

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="changeOperator"
                checked={userInfo.changeOperator}
                onCheckedChange={(checked) => handleChange("changeOperator", Boolean(checked))}
              />
              <Label htmlFor="changeOperator" className="font-normal">
                Želim podnijeti zahtjev za promjenu operatera
              </Label>
            </div>
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
          <h3 className="text-lg font-medium mb-4">Način dostave i privole</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Način dostave računa</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invoiceMail"
                    checked={userInfo.invoiceDeliveryMethod.includes("mail")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("invoiceDeliveryMethod", "mail")
                      else handleCheckboxChange("invoiceDeliveryMethod", "mail")
                    }}
                  />
                  <Label htmlFor="invoiceMail" className="font-normal">
                    Poštom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invoiceEInvoice"
                    checked={userInfo.invoiceDeliveryMethod.includes("eInvoice")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("invoiceDeliveryMethod", "eInvoice")
                      else handleCheckboxChange("invoiceDeliveryMethod", "eInvoice")
                    }}
                  />
                  <Label htmlFor="invoiceEInvoice" className="font-normal">
                    eRačun
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invoiceEmail"
                    checked={userInfo.invoiceDeliveryMethod.includes("email")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("invoiceDeliveryMethod", "email")
                      else handleCheckboxChange("invoiceDeliveryMethod", "email")
                    }}
                  />
                  <Label htmlFor="invoiceEmail" className="font-normal">
                    Mailom vlasniku
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invoiceContactEmail"
                    checked={userInfo.invoiceDeliveryMethod.includes("contactEmail")}
                    onCheckedChange={(checked) => {
                      if (checked) handleCheckboxChange("invoiceDeliveryMethod", "contactEmail")
                      else handleCheckboxChange("invoiceDeliveryMethod", "contactEmail")
                    }}
                  />
                  <Label htmlFor="invoiceContactEmail" className="font-normal">
                    Mailom kontakt osobi
                  </Label>
                </div>
              </div>
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="noDevice" id="noDevice" />
                  <Label htmlFor="noDevice" className="font-normal">
                    Nema uređaja
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Podaci o prodajnom mjestu</h3>
          <div className={`grid grid-cols-1 gap-4 ${contractConcludedOnPremises ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="sellerCode">Kod prodavatelja</Label>
              <Input
                id="sellerCode"
                type="number"
                value={userInfo.sellerCode || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Convert to number or 0 if empty
                  const numericValue = value === '' ? 0 : parseInt(value, 10);
                  handleChange("sellerCode", numericValue);
                }}
                placeholder="npr. 09"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerPlace">Mjesto</Label>
              <Input
                id="sellerPlace"
                value={userInfo.sellerPlace}
                onChange={(e) => handleChange("sellerPlace", e.target.value)}
                placeholder="Mjesto"
              />
            </div>

            {contractConcludedOnPremises && (
              <div className="space-y-2">
                <Label htmlFor="sellerDate">Datum ugovora</Label>
                <Input
                  id="sellerDate"
                  type="date"
                  value={userInfo.sellerDate}
                  onChange={(e) => handleChange("sellerDate", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
