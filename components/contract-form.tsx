"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ContractData, MagicNetDevice, MagicMeshDevice } from "@/lib/supabase"
import { getDevices, getMeshDevices, getExtraTelefonPackages, type MagicExtraTelefon } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PdfButton from "@/components/pdf-button"
import UserInformationForm, { type UserInformation, type OperatorChangeData } from "@/components/user-information-form"
import type { TerminalEquipment } from "@/lib/pdf-generator"
import { Button } from "@/components/ui/button"
import TerminalEquipmentEditor from "@/components/terminal-equipment-editor"

interface ContractFormProps {
  initialData: ContractData
  userInfoInitial?: UserInformation
  onUserInfoChange?: (data: UserInformation) => void
  terminalEquipmentInitial?: TerminalEquipment[]
  onTerminalEquipmentChange?: (data: TerminalEquipment[]) => void
  shouldGeneratePdf?: boolean
  contractConcludedOnPremises?: boolean
  onContractConcludedOnPremisesChange?: (value: boolean) => void
  operatorChangeDataInitial?: OperatorChangeData
  onOperatorChangeDataChange?: (data: OperatorChangeData) => void
  contractNumber?: string | null
}

export default function ContractForm({ 
  initialData, 
  userInfoInitial,
  onUserInfoChange,
  terminalEquipmentInitial,
  onTerminalEquipmentChange,
  shouldGeneratePdf = false,
  contractConcludedOnPremises,
  onContractConcludedOnPremisesChange,
  operatorChangeDataInitial,
  onOperatorChangeDataChange,
  contractNumber
}: ContractFormProps) {
  const [formData, setFormData] = useState<ContractData>(() => {
    // Clean contract number by removing UG prefix if it exists
    const cleanContractNumber = contractNumber ? contractNumber.replace(/^UG\s*/, '') : '';
    
    // If we have both user name and contract number, format with seller code before last segment
    let finalContractNumber = '';
    if (cleanContractNumber) {
      if (userInfoInitial?.userName) {
        // Replace spaces with hyphens in user name
        const formattedUserName = userInfoInitial.userName.trim().replace(/\s+/g, '-');
        
        // Format seller code (pad with zeros if needed)  
        const sellerCode = userInfoInitial.sellerCode ? String(userInfoInitial.sellerCode).padStart(2, '0') : '00';
        
        // Split contract number to insert seller code before last segment
        const parts = cleanContractNumber.split('-');
        if (parts.length > 1) {
          // Insert seller code before the last part
          const lastPart = parts.pop(); // Remove and get last part
          const baseParts = parts.join('-'); // Rejoin remaining parts
          finalContractNumber = `${formattedUserName}-${baseParts}-${sellerCode}-${lastPart}`;
        } else {
          // Simple number, just add seller code before it
          finalContractNumber = `${formattedUserName}-${sellerCode}-${cleanContractNumber}`;
        }
      } else if (userInfoInitial?.sellerCode) {
        // If no userName but we have sellerCode, still insert seller code
        const sellerCode = String(userInfoInitial.sellerCode).padStart(2, '0');
        const parts = cleanContractNumber.split('-');
        if (parts.length > 1) {
          // Insert seller code before the last part
          const lastPart = parts.pop(); // Remove and get last part
          const baseParts = parts.join('-'); // Rejoin remaining parts
          finalContractNumber = `${baseParts}-${sellerCode}-${lastPart}`;
        } else {
          // Simple number, just add seller code before it
          finalContractNumber = `${sellerCode}-${cleanContractNumber}`;
        }
      } else {
        // No userName and no sellerCode, use clean contract number as-is
        finalContractNumber = cleanContractNumber;
      }
    }
    
    return {
      ...initialData,
      broj_ugovora: finalContractNumber || initialData.broj_ugovora || ""
    };
  })
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
    invoiceDeliveryMethod: [],
    marketingContact: [],
    generalTermsDelivery: "provided",
    paymentMethod: "oneTime",
    sellerCode: 0,
    sellerPlace: "",
    sellerDate: "",
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
  const [freeMeshEnabled, setFreeMeshEnabled] = useState(false)
  const [rentalMeshCount, setRentalMeshCount] = useState(0) // Changed from rentalMeshEnabled and extraRentalMeshCount
  const [filmskiPackageEnabled, setFilmskiPackageEnabled] = useState(false)
  const [odrasliPackageEnabled, setOdrasliPackageEnabled] = useState(false)
  const [additionalTvCardEnabled, setAdditionalTvCardEnabled] = useState(false)
  const [baseTvPrice, setBaseTvPrice] = useState(0)
  const [telMix1Enabled, setTelMix1Enabled] = useState(false)
  const [telMix2Enabled, setTelMix2Enabled] = useState(false)
  const [telEuropa1_100Enabled, setTelEuropa1_100Enabled] = useState(false)
  const [telEuropa1_200Enabled, setTelEuropa1_200Enabled] = useState(false)
  const [telEuropa2_100Enabled, setTelEuropa2_100Enabled] = useState(false)
  const [telEuropa2_200Enabled, setTelEuropa2_200Enabled] = useState(false)
  const [basePhonePrice, setBasePhonePrice] = useState(0)
  const pdfButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isEquipmentEditorOpen, setIsEquipmentEditorOpen] = useState(false)
  const [devices, setDevices] = useState<MagicNetDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [meshDevices, setMeshDevices] = useState<MagicMeshDevice[]>([])
  const [meshDevicesLoading, setMeshDevicesLoading] = useState(true)
  const [extraTelefonPackages, setExtraTelefonPackages] = useState<MagicExtraTelefon[]>([])
  const [extraTelefonLoading, setExtraTelefonLoading] = useState(true)
  const [operatorChangeData, setOperatorChangeData] = useState<OperatorChangeData>(operatorChangeDataInitial || {
    existingOperatorName: "",
    contractOnDistance: true,
    agreeToPayDebts: true,
    numberTransfer: true,
    notificationAgreement: true,
    vpnSeries: false,
    servicesToCancel: [],
    servicesToKeep: [],
    userAccountsToKeep: ["e-mail"],
    wholesaleService: false,
    // Initialize with user data but allow independent editing
    userName: "", //userInfoInitial?.userName || "",
    legalEntity: "", //userInfoInitial?.legalEntity || "",
    oib: "", //userInfoInitial?.oib || "",
    phoneNumber: "", //initialData.pretplatnicki_broj || "",
    contactPhone: "", //userInfoInitial?.contactPhone || "",
    email: "", //userInfoInitial?.email || "",
    connectionAddress: "", //userInfoInitial?.connectionAddress || "",
    sellerPlace: "", //userInfoInitial?.sellerPlace || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      // Auto-sync fiksni_paket and fiksni_naziv_ugovorene_usluge for consistency
      if (name === 'fiksni_paket' && value) {
        newData.fiksni_naziv_ugovorene_usluge = value
      } else if (name === 'fiksni_naziv_ugovorene_usluge' && value) {
        newData.fiksni_paket = value
      }
      
      return newData
    })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const parsedValue = value === "" ? null : Number.parseFloat(value)
    
    // Track base TV price when manually changed
    if (name === "promo_price_tv" && parsedValue !== null) {
      setBaseTvPrice(parsedValue)
    }
    
    // Track base phone price when manually changed
    if (name === "promo_price_phone" && parsedValue !== null) {
      setBasePhonePrice(parsedValue)
    }
    
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
  
  const handleOperatorChangeDataChange = (data: OperatorChangeData) => {
    setOperatorChangeData(data)
    if (onOperatorChangeDataChange) {
      onOperatorChangeDataChange(data)
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
  
  // Handler for extra MESH checkbox - REMOVED (now using new MESH system)

  // Handler for FREE MESH checkbox
  const handleFreeMeshChange = (checked: boolean) => {
    setFreeMeshEnabled(checked)
  }

  // Handler for RENTAL MESH count selector
  const handleRentalMeshCountChange = (count: number) => {
    setRentalMeshCount(count)
  }

  // Effect to update MESH in equipment and services when MESH states change
  useEffect(() => {
    console.log('MESH useEffect triggered with states:', { 
      freeMeshEnabled, 
      rentalMeshCount
    })
    
    // Calculate total MESH quantity
    let totalMeshQuantity = 0
    let meshServices = []
    
    if (freeMeshEnabled) {
      totalMeshQuantity += 1
      meshServices.push("BESPLATAN MESH")
    }
    
    if (rentalMeshCount > 0) {
      totalMeshQuantity += rentalMeshCount
      meshServices.push(`EXTRA MESH U NAJAM (${rentalMeshCount})`)
    }

    console.log('Calculated MESH data:', { totalMeshQuantity, meshServices })
    console.log('Terminal equipment before update:', terminalEquipment)

    // Update MESH equipment quantity
    const updatedEquipment = terminalEquipment.map(item => 
      item.id === 5 ? { ...item, quantity: totalMeshQuantity.toString() } : item
    )
    
    console.log('Terminal equipment after update:', updatedEquipment)
    setTerminalEquipment(updatedEquipment)

    // Update services in formData
    const servicesText = meshServices.join(', ')
    console.log('Services before update:', formData.fiksne_dodatne_usluge)
    console.log('Services after update:', servicesText)
    
    setFormData(prev => ({
      ...prev,
      fiksne_dodatne_usluge: servicesText
    }))

    if (onTerminalEquipmentChange) {
      onTerminalEquipmentChange(updatedEquipment)
    }
  }, [freeMeshEnabled, rentalMeshCount])

  // Handler for FILMSKI package checkbox
  const handleFilmskiPackageChange = (checked: boolean) => {
    setFilmskiPackageEnabled(checked)
  }

  // Handler for ODRASLI package checkbox
  const handleOdrasliPackageChange = (checked: boolean) => {
    setOdrasliPackageEnabled(checked)
  }

  // Handler for additional TV card checkbox
  const handleAdditionalTvCardChange = (checked: boolean) => {
    setAdditionalTvCardEnabled(checked)
  }

  // Handlers for telephone services
  const handleTelMix1Change = (checked: boolean) => {
    setTelMix1Enabled(checked)
  }

  const handleTelMix2Change = (checked: boolean) => {
    setTelMix2Enabled(checked)
  }

  const handleTelEuropa1_100Change = (checked: boolean) => {
    setTelEuropa1_100Enabled(checked)
  }

  const handleTelEuropa1_200Change = (checked: boolean) => {
    setTelEuropa1_200Enabled(checked)
  }

  const handleTelEuropa2_100Change = (checked: boolean) => {
    setTelEuropa2_100Enabled(checked)
  }

  const handleTelEuropa2_200Change = (checked: boolean) => {
    setTelEuropa2_200Enabled(checked)
  }

  // Calculate current TV services and price (no state updates)
  const getCurrentTvData = () => {
    const selectedPackages = []
    const selectedPackageNames = []
    let additionalPrice = 0

    if (filmskiPackageEnabled) {
      selectedPackages.push("FILMSKI")
      selectedPackageNames.push("FILMSKI")
      additionalPrice += 5
    }
    if (odrasliPackageEnabled) {
      selectedPackages.push("ODRASLI")
      selectedPackageNames.push("ODRASLI")
      additionalPrice += 5
    }
    if (additionalTvCardEnabled) {
      selectedPackages.push("Dodatna TV kartica")
      selectedPackageNames.push("Dodatna TV kartica")
      additionalPrice += 3.98
    }

    const basePrice = baseTvPrice || 0
    
    // Create service name from base service only (additional packages shown separately)
    let serviceName = formData.tv_paket || "TV usluga"
    
    return {
      services: selectedPackages.join(', '),
      serviceName: serviceName,
      promoPrice: basePrice + additionalPrice,
      regularPrice: basePrice + additionalPrice
    }
  }

  // Calculate current phone services and price (no state updates)
  const getCurrentPhoneData = () => {
    const selectedServices = []
    const selectedServiceNames = []
    let additionalPrice = 0

    // Helper function to get package price by name
    const getPackagePrice = (packageName: string): number => {
      const pkg = extraTelefonPackages.find(p => 
        p.name.toLowerCase().includes(packageName.toLowerCase())
      )
      return pkg ? pkg.price : 0
    }

    if (telMix1Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 1'))
      const description = pkg?.description || "300 minuta pozivi prema nacionalnim mobilnim mrežama, 500 minuta telefonskih poziva prema nacionalnim fiksnim mrežama, Neograničeni fiksni pozivi unutar MagicNet mreže"
      selectedServices.push(`Telefonski MIX 1 - ${description}`)
      selectedServiceNames.push("Telefonski MIX 1")
      additionalPrice += getPackagePrice("telefonski mix 1")
    }
    if (telMix2Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 2'))
      const description = pkg?.description || "500 minuta pozivi prema nacionalnim mobilnim mrežama, 1000 minuta telefonskih poziva prema nacionalnim fiksnim mrežama, Neograničeni fiksni pozivi unutar MagicNet mreže"
      selectedServices.push(`Telefonski MIX 2 - ${description}`)
      selectedServiceNames.push("Telefonski MIX 2")
      additionalPrice += getPackagePrice("telefonski mix 2")
    }
    if (telEuropa1_100Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('100'))
      const description = pkg?.description || "100 minuta telefonskih poziva prema fiksnim međunarodnim Europa 1 destinacijama"
      selectedServices.push(`Telefon Europa 1 / 100 FIX - ${description}`)
      selectedServiceNames.push("Telefon Europa 1 / 100 FIX")
      additionalPrice += getPackagePrice("telefon europa 1") || getPackagePrice("europa 1 100")
    }
    if (telEuropa1_200Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('200'))
      const description = pkg?.description || "200 minuta telefonskih poziva prema fiksnim međunarodnim Europa 1 destinacijama"
      selectedServices.push(`Telefon Europa 1 / 200 FIX - ${description}`)
      selectedServiceNames.push("Telefon Europa 1 / 200 FIX")
      additionalPrice += getPackagePrice("telefon europa 1") || getPackagePrice("europa 1 200")
    }
    if (telEuropa2_100Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('100'))
      const description = pkg?.description || "100 minuta telefonskih poziva prema fiksnim međunarodnim Europa 2 destinacijama"
      selectedServices.push(`Telefon Europa 2 / 100 FIX - ${description}`)
      selectedServiceNames.push("Telefon Europa 2 / 100 FIX")
      additionalPrice += getPackagePrice("telefon europa 2") || getPackagePrice("europa 2 100")
    }
    if (telEuropa2_200Enabled) {
      const pkg = extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('200'))
      const description = pkg?.description || "200 minuta telefonskih poziva prema fiksnim međunarodnim Europa 2 destinacijama"
      selectedServices.push(`Telefon Europa 2 / 200 FIX - ${description}`)
      selectedServiceNames.push("Telefon Europa 2 / 200 FIX")
      additionalPrice += getPackagePrice("telefon europa 2") || getPackagePrice("europa 2 200")
    }

    const basePrice = basePhonePrice || 0
    
    // Create service name from base service only (additional services shown separately)
    let serviceName = formData.tarifa || "Telefonska usluga"
    
    return {
      services: selectedServices.join(', '),
      serviceName: serviceName, // Only base service name, not including additional services
      promoPrice: basePrice, // Only base price, additional services shown separately
      regularPrice: basePrice // Only base price, additional services shown separately
    }
  }

  // Calculate current Internet services and price including MESH
  const getCurrentInternetData = () => {
    let additionalServices: string[] = []
    
    // MESH services are handled separately in getMeshServiceData
    // Internet base services only
    const basePrice = formData.promo_price_fiksni || 0
    
    // Create service name
    let serviceName = formData.fiksni_naziv_ugovorene_usluge || "Internet usluga"
    
    return {
      services: additionalServices.join(', '),
      serviceName: serviceName,
      promoPrice: basePrice, // Internet base price only
      regularPrice: basePrice // Internet base price only
    }
  }

  // Calculate MESH service pricing separately
  const getMeshServiceData = () => {
    let meshServices = []
    let totalPromoPrice = 0
    let totalRegularPrice = 0
    
    console.log('getMeshServiceData called:', { freeMeshEnabled, rentalMeshCount })
    
    // Get prices from first MESH device or use defaults
    const meshPricing = meshDevices.length > 0 ? meshDevices[0] : {
      price: 65.00,
      promo_price: 0.00,
      regular_price: 3.00
    }
    
    if (freeMeshEnabled) {
      meshServices.push("BESPLATAN MESH")
      totalPromoPrice += meshPricing.promo_price || 0 // Free promo price
      totalRegularPrice += meshPricing.regular_price || 3.00 // Regular price for free MESH
      console.log('Added BESPLATAN MESH to services')
    }
    
    if (rentalMeshCount > 0) {
      meshServices.push(`EXTRA MESH U NAJAM (${rentalMeshCount})`)
      totalPromoPrice += rentalMeshCount * (meshPricing.regular_price || 3.00) // Rental uses regular price for both promo and regular
      totalRegularPrice += rentalMeshCount * (meshPricing.regular_price || 3.00)
      console.log(`Added EXTRA MESH U NAJAM (${rentalMeshCount}) to services`)
    }
    
    const result = {
      hasServices: meshServices.length > 0,
      serviceName: meshServices.join(', '),
      services: meshServices.join(', '),
      promoPrice: totalPromoPrice,
      regularPrice: totalRegularPrice
    }
    
    console.log('getMeshServiceData result:', result)
    return result
  }

  // Auto-generate PDF when shouldGeneratePdf is true
  useEffect(() => {
    if (shouldGeneratePdf && pdfButtonRef.current) {
      // Set active tab to basic first
      setActiveTab("basic")
      
      // Small delay to ensure tab switch completes
      const timer = setTimeout(() => {
        // Check if we should generate operator change PDF
        const shouldGenerateOperatorChange = (initialData as any)?._generateOperatorChange
        
        // Find the appropriate button to click
        const pdfButtonContainer = pdfButtonRef.current?.parentElement
        if (pdfButtonContainer && shouldGenerateOperatorChange) {
          // Look for the operator change button
          const operatorChangeButton = pdfButtonContainer.querySelector('button[data-type="operator-change"]') as HTMLButtonElement
          if (operatorChangeButton) {
            operatorChangeButton.click()
          } else {
            // Fallback to main button if operator change button not found
            pdfButtonRef.current?.click()
          }
        } else {
          // Click the main PDF button
          if (pdfButtonRef.current) {
            pdfButtonRef.current.click()
          }
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [shouldGeneratePdf, initialData])

  // Initialize new MESH states based on existing services
  useEffect(() => {
    const fiksneServices = formData.fiksne_dodatne_usluge || ""
    
    // Check for free MESH
    setFreeMeshEnabled(fiksneServices.toLowerCase().includes("besplatan mesh"))
    
    // Check for rental MESH
    const rentalMeshMatch = fiksneServices.match(/extra mesh u najam \((\d+)\)/i)
    if (rentalMeshMatch) {
      const totalRentalCount = parseInt(rentalMeshMatch[1], 10)
      setRentalMeshCount(totalRentalCount)
    } else {
      setRentalMeshCount(0)
    }
  }, [formData.fiksne_dodatne_usluge])

  // Initialize TV package states based on existing data
  useEffect(() => {
    const tvServices = formData.tv_dodatne_usluge || ""
    setFilmskiPackageEnabled(tvServices.toLowerCase().includes("filmski"))
    setOdrasliPackageEnabled(tvServices.toLowerCase().includes("odrasli"))
    setAdditionalTvCardEnabled(tvServices.toLowerCase().includes("dodatna tv kartica"))
    
    // Initialize base TV price
    if (formData.promo_price_tv && baseTvPrice === 0) {
      setBaseTvPrice(formData.promo_price_tv)
    }
  }, [formData.tv_dodatne_usluge, formData.promo_price_tv, baseTvPrice])

  // Initialize telephone service states based on existing data
  useEffect(() => {
    const telServices = formData.tel_dodatne_usluge || ""
    setTelMix1Enabled(telServices.toLowerCase().includes("telefonski mix 1"))
    setTelMix2Enabled(telServices.toLowerCase().includes("telefonski mix 2"))
    setTelEuropa1_100Enabled(telServices.toLowerCase().includes("telefon europa 1 / 100 fix"))
    setTelEuropa1_200Enabled(telServices.toLowerCase().includes("telefon europa 1 / 200 fix"))
    setTelEuropa2_100Enabled(telServices.toLowerCase().includes("telefon europa 2 / 100 fix"))
    setTelEuropa2_200Enabled(telServices.toLowerCase().includes("telefon europa 2 / 200 fix"))
    
    // Initialize base phone price
    if (formData.promo_price_phone && basePhonePrice === 0) {
      setBasePhonePrice(formData.promo_price_phone)
    }
  }, [formData.tel_dodatne_usluge, formData.promo_price_phone, basePhonePrice])

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      setDevicesLoading(true)
      try {
        const result = await getDevices()
        if (result.success) {
          setDevices(result.data)
        } else {
          console.error("Error fetching devices:", result.error)
        }
      } catch (error) {
        console.error("Error fetching devices:", error)
      } finally {
        setDevicesLoading(false)
      }
    }

    fetchDevices()
  }, [])

  // Fetch MESH devices on component mount
  useEffect(() => {
    const fetchMeshDevices = async () => {
      setMeshDevicesLoading(true)
      try {
        const result = await getMeshDevices()
        if (result.success) {
          setMeshDevices(result.data)
        } else {
          console.error("Error fetching MESH devices:", result.error)
        }
      } catch (error) {
        console.error("Error fetching MESH devices:", error)
      } finally {
        setMeshDevicesLoading(false)
      }
    }

    fetchMeshDevices()
  }, [])

  // Fetch extra telefon packages on component mount
  useEffect(() => {
    const fetchExtraTelefonPackages = async () => {
      setExtraTelefonLoading(true)
      try {
        const result = await getExtraTelefonPackages()
        if (result.success) {
          setExtraTelefonPackages(result.data)
        } else {
          console.error("Error fetching extra telefon packages:", result.error)
        }
      } catch (error) {
        console.error("Error fetching extra telefon packages:", error)
      } finally {
        setExtraTelefonLoading(false)
      }
    }

    fetchExtraTelefonPackages()
  }, [])

  // Handler for device selection
  const handleDeviceSelection = (deviceId: string) => {
    if (deviceId === "") {
      // Clear device fields
      setFormData(prev => ({
        ...prev,
        uredaj_proizvodac_model: "",
        uredaj_cijena: null,
        uredaj_popust: null,
        uredaj_za_placanje: null,
        uredaj_mjesecna_rata: null
      }))
      return
    }

    const selectedDevice = devices.find(device => device.id.toString() === deviceId)
    if (selectedDevice) {
      const devicePrice = selectedDevice.device_price || 0
      const deviceDiscount = selectedDevice.device_discount || 0
      
      // Calculate discount amount and final payment amount
      const discountAmount = (devicePrice * deviceDiscount) / 100
      const paymentAmount = devicePrice - discountAmount
      
      setFormData(prev => {
        const updatedData = {
          ...prev,
          uredaj_proizvodac_model: selectedDevice.device_model || "",
          uredaj_cijena: devicePrice,
          uredaj_popust: deviceDiscount,
          uredaj_za_placanje: paymentAmount
        }
        
        // If installment payment is enabled, recalculate monthly payment
        if (updatedData.uredaj_otplata_na_rate) {
          calculateMonthlyPayment(updatedData)
        }
        
        return updatedData
      })
    }
  }

  // Function to handle PDF button ref
  const setPdfRef = (el: HTMLButtonElement | null) => {
    pdfButtonRef.current = el
  }

  // Update contract number when user name changes
  useEffect(() => {
    if (contractNumber) {
      const cleanContractNumber = contractNumber.replace(/^UG\s*/, '');
      
      let finalContractNumber = '';
      if (userInfo?.userName) {
        // Format with userName and sellerCode
        const formattedUserName = userInfo.userName.trim().replace(/\s+/g, '-');
        const sellerCode = userInfo.sellerCode ? String(userInfo.sellerCode).padStart(2, '0') : '00';
        
        // Split contract number to insert seller code before last segment
        const parts = cleanContractNumber.split('-');
        if (parts.length > 1) {
          // Insert seller code before the last part
          const lastPart = parts.pop(); // Remove and get last part
          const baseParts = parts.join('-'); // Rejoin remaining parts
          finalContractNumber = `${formattedUserName}-${baseParts}-${sellerCode}-${lastPart}`;
        } else {
          // Simple number, just add seller code before it
          finalContractNumber = `${formattedUserName}-${sellerCode}-${cleanContractNumber}`;
        }
      } else if (userInfo?.sellerCode) {
        // No userName but we have sellerCode, still insert seller code
        const sellerCode = String(userInfo.sellerCode).padStart(2, '0');
        const parts = cleanContractNumber.split('-');
        if (parts.length > 1) {
          // Insert seller code before the last part
          const lastPart = parts.pop(); // Remove and get last part
          const baseParts = parts.join('-'); // Rejoin remaining parts
          finalContractNumber = `${baseParts}-${sellerCode}-${lastPart}`;
        } else {
          // Simple number, just add seller code before it
          finalContractNumber = `${sellerCode}-${cleanContractNumber}`;
        }
      } else {
        // No userName and no sellerCode, use clean contract number as-is
        finalContractNumber = cleanContractNumber;
      }
      
      // Only update if the current contract number is empty or matches our expected format
      const currentNumber = formData.broj_ugovora || '';
      const shouldUpdate = !currentNumber || 
                          currentNumber === cleanContractNumber || 
                          currentNumber !== finalContractNumber;
      
      if (shouldUpdate) {
        setFormData(prev => ({
          ...prev,
          broj_ugovora: finalContractNumber
        }));
      }
    }
  }, [userInfo?.userName, userInfo?.sellerCode, contractNumber]);

  // Sync operator change data with user data changes (only if not manually modified)
  useEffect(() => {
    if (userInfo.changeOperator) {
      setOperatorChangeData(prev => ({
        ...prev,
        // Only update if the field is empty (hasn't been manually modified)
        userName: prev.userName || userInfo.userName || "",
        legalEntity: prev.legalEntity || userInfo.legalEntity || "",
        oib: prev.oib || userInfo.oib || "",
        phoneNumber: prev.phoneNumber || formData.pretplatnicki_broj || "",
        contactPhone: prev.contactPhone || userInfo.contactPhone || "",
        email: prev.email || userInfo.email || "",
        connectionAddress: prev.connectionAddress || userInfo.connectionAddress || "",
        sellerPlace: prev.sellerPlace || userInfo.sellerPlace || "",
      }));
    }
  }, [userInfo, formData.pretplatnicki_broj]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full tabs-container" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="flex w-full">
          <TabsTrigger className="flex-1" value="basic">Osnovne informacije</TabsTrigger>
          <TabsTrigger className="flex-1" value="internet">Usluga i Internet</TabsTrigger>
          <TabsTrigger className="flex-1" value="tv">TV</TabsTrigger>
          <TabsTrigger className="flex-1" value="telephone">Telefon</TabsTrigger>
          <TabsTrigger className="flex-1" value="equipment">Oprema</TabsTrigger>
          <TabsTrigger className="flex-1" value="pricing">Cijene</TabsTrigger>
          {userInfo.changeOperator && (
            <TabsTrigger className="flex-1" value="operator-change">Promjena operatera</TabsTrigger>
          )}
          <TabsTrigger className="flex-1" value="user">Podaci korisnika</TabsTrigger>
        </TabsList>

        <div className="pdf-content">
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Osnovni podaci</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usluga">Usluga</Label>
                    <Input id="usluga" name="usluga" value={formData.usluga || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="broj_ugovora">Broj ugovora</Label>
                    <Input id="broj_ugovora" name="broj_ugovora" value={formData.broj_ugovora || ""} onChange={handleChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_duration">Trajanje ugovora</Label>
                    <Input id="contract_duration" name="contract_duration" value={formData.contract_duration || ""} onChange={handleChange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internet" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Osnovni podaci</h3>
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
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="text-md font-medium">MESH uređaji</h4>
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="freeMesh"
                          checked={freeMeshEnabled}
                          onCheckedChange={(checked) => handleFreeMeshChange(checked as boolean)}
                        />
                        <Label htmlFor="freeMesh" className="font-normal">
                          {meshDevicesLoading ? (
                            "Učitavanje MESH opcija..."
                          ) : meshDevices.length > 0 ? (
                            `Dodaj BESPLATAN MESH uređaj (${meshDevices[0]?.price?.toFixed(2) || '65,00'} EUR) - Promotivna naknada: ${meshDevices[0]?.promo_price?.toFixed(2) || '0,00'} EUR/mj, Redovna naknada: ${meshDevices[0]?.regular_price?.toFixed(2) || '3,00'} EUR/mj`
                          ) : (
                            "Dodaj BESPLATAN MESH uređaj (65,00 EUR) - Promotivna naknada: 0,00 EUR/mj, Redovna naknada: 3,00 EUR/mj"
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="rentalMeshCount" className="font-normal whitespace-nowrap">
                          {meshDevicesLoading ? (
                            "Učitavanje MESH opcija..."
                          ) : meshDevices.length > 0 ? (
                            `Broj EXTRA MESH U NAJAM uređaja (${meshDevices[0]?.price?.toFixed(2) || '65,00'} EUR) - Naknada: ${meshDevices[0]?.regular_price?.toFixed(2) || '3,00'} EUR/mj:`
                          ) : (
                            "Broj EXTRA MESH U NAJAM uređaja (65,00 EUR) - Naknada: 3,00 EUR/mj:"
                          )}
                        </Label>
                        <select
                          id="rentalMeshCount"
                          value={rentalMeshCount}
                          onChange={(e) => handleRentalMeshCountChange(parseInt(e.target.value, 10))}
                          className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          disabled={meshDevicesLoading}
                        >
                          {Array.from({ length: 11 }, (_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Periodična cijena</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fiksni_naziv_ugovorene_usluge">Naziv ugovorene usluge</Label>
                      <Input id="fiksni_naziv_ugovorene_usluge" name="fiksni_naziv_ugovorene_usluge" value={formData.fiksni_paket || ""} onChange={handleChange} />
                    </div>
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
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Brzine preuzimanja</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tv" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Osnovni podaci</h3>
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
                      value={getCurrentTvData().services}
                      onChange={handleChange}
                      rows={3}
                      readOnly
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
                  
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="text-md font-medium">Dodatni ONE TV paketi</h4>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filmskiPackage"
                          checked={filmskiPackageEnabled}
                          onCheckedChange={(checked) => handleFilmskiPackageChange(checked as boolean)}
                        />
                        <Label htmlFor="filmskiPackage" className="font-normal">
                          FILMSKI (5,00 EUR)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="odrasliPackage"
                          checked={odrasliPackageEnabled}
                          onCheckedChange={(checked) => handleOdrasliPackageChange(checked as boolean)}
                        />
                        <Label htmlFor="odrasliPackage" className="font-normal">
                          ODRASLI (5,00 EUR)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="additionalTvCard"
                          checked={additionalTvCardEnabled}
                          onCheckedChange={(checked) => handleAdditionalTvCardChange(checked as boolean)}
                        />
                        <Label htmlFor="additionalTvCard" className="font-normal">
                          Dodatna TV kartica (3,98 EUR)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Periodična cijena</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tv_naziv_ugovorene_usluge">Naziv ugovorene usluge</Label>
                      <Input id="tv_naziv_ugovorene_usluge" name="tv_naziv_ugovorene_usluge" value={getCurrentTvData().serviceName} onChange={handleChange} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="promo_price_tv">Promotivna mjesečna naknada (TV)</Label>
                        <Input id="promo_price_tv" name="promo_price_tv" type="number" step="0.01" value={getCurrentTvData().promoPrice} onChange={handleNumberChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regular_price_tv">Redovna mjesečna naknada (TV)</Label>
                        <Input id="regular_price_tv" name="regular_price_tv" type="number" step="0.01" value={getCurrentTvData().regularPrice} onChange={handleNumberChange} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telephone" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Osnovni podaci</h3>
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
                      value={getCurrentPhoneData().services}
                      onChange={handleChange}
                      rows={3}
                      readOnly
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
                  
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="text-md font-medium">Dodatne telefonske usluge</h4>
                    {extraTelefonLoading ? (
                      <div className="text-center py-4">Učitavanje telefonskih paketa...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telMix1"
                              checked={telMix1Enabled}
                              onCheckedChange={(checked) => handleTelMix1Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telMix1" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefonski MIX 1</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 1'))?.price?.toFixed(2) || '2,65'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 1'))?.description || 
                                   "300 minuta pozivi prema nacionalnim mobilnim mrežama. 500 minuta telefonskih poziva prema nacionalnim fiksnim mrežama. Neograničeni fiksni pozivi unutar MagicNet mreže."}
                                </span>
                              </Label>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telMix2"
                              checked={telMix2Enabled}
                              onCheckedChange={(checked) => handleTelMix2Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telMix2" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefonski MIX 2</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 2'))?.price?.toFixed(2) || '4,65'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefonski mix 2'))?.description || 
                                   "500 minuta pozivi prema nacionalnim mobilnim mrežama. 1000 minuta telefonskih poziva prema nacionalnim fiksnim mrežama. Neograničeni fiksni pozivi unutar MagicNet mreže."}
                                </span>
                              </Label>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telEuropa1_100"
                              checked={telEuropa1_100Enabled}
                              onCheckedChange={(checked) => handleTelEuropa1_100Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telEuropa1_100" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefon Europa 1 / 100 FIX</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('100'))?.price?.toFixed(2) || '5,18'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('100'))?.description || 
                                   "100 minuta telefonskih poziva prema fiksnim međunarodnim Europa 1 destinacijama."}
                                </span>
                              </Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telEuropa1_200"
                              checked={telEuropa1_200Enabled}
                              onCheckedChange={(checked) => handleTelEuropa1_200Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telEuropa1_200" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefon Europa 1 / 200 FIX</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('200'))?.price?.toFixed(2) || '9,95'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 1') && p.name.toLowerCase().includes('200'))?.description || 
                                   "200 minuta telefonskih poziva prema fiksnim međunarodnim Europa 1 destinacijama."}
                                </span>
                              </Label>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telEuropa2_100"
                              checked={telEuropa2_100Enabled}
                              onCheckedChange={(checked) => handleTelEuropa2_100Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telEuropa2_100" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefon Europa 2 / 100 FIX</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('100'))?.price?.toFixed(2) || '7,30'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('100'))?.description || 
                                   "100 minuta telefonskih poziva prema fiksnim međunarodnim Europa 2 destinacijama."}
                                </span>
                              </Label>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="telEuropa2_200"
                              checked={telEuropa2_200Enabled}
                              onCheckedChange={(checked) => handleTelEuropa2_200Change(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor="telEuropa2_200" className="font-normal text-sm leading-tight">
                                <span className="font-medium">Telefon Europa 2 / 200 FIX</span> ({extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('200'))?.price?.toFixed(2) || '13,14'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {extraTelefonPackages.find(p => p.name.toLowerCase().includes('telefon europa 2') && p.name.toLowerCase().includes('200'))?.description || 
                                   "200 minuta telefonskih poziva prema fiksnim međunarodnim Europa 2 destinacijama."}
                                </span>
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Periodična cijena</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tel_naziv_ugovorene_usluge">Naziv ugovorene usluge</Label>
                      <Input id="tel_naziv_ugovorene_usluge" name="tel_naziv_ugovorene_usluge" value={getCurrentPhoneData().serviceName} onChange={handleChange} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="promo_price_phone">Promotivna mjesečna naknada (Telefon)</Label>
                        <Input id="promo_price_phone" name="promo_price_phone" type="number" step="0.01" value={getCurrentPhoneData().promoPrice} onChange={handleNumberChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regular_price_phone">Redovna mjesečna naknada (Telefon)</Label>
                        <Input id="regular_price_phone" name="regular_price_phone" type="number" step="0.01" value={getCurrentPhoneData().regularPrice} onChange={handleNumberChange} />
                      </div>
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
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEquipmentEditorOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Uredi opremu
                    </Button>
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="device_selection">Odaberite uređaj iz liste</Label>
                    <select
                      id="device_selection"
                      onChange={(e) => handleDeviceSelection(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={devicesLoading}
                    >
                      <option value="">
                        {devicesLoading ? "Učitavanje uređaja..." : "Odaberite uređaj ili unesite ručno"}
                      </option>
                      {devices.map((device) => (
                        <option key={device.id} value={device.id.toString()}>
                          {device.device_model} - {device.device_price ? `${device.device_price.toFixed(2)} EUR` : 'Bez cijene'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
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

          {userInfo.changeOperator && (
            <TabsContent value="operator-change" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Zahtjev za promjenu operatera</h3>
                  
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-md font-medium mb-2 text-blue-800">Podaci za zahtjev za promjenu operatera:</h4>
                    <p className="text-xs text-blue-600 mb-4">
                      Ova polja možete prilagoditi specifično za zahtjev za promjenu operatera. Inicijalno su popunjena podacima iz glavnog ugovora.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="operatorUserName">Ime i prezime</Label>
                        <Input
                          id="operatorUserName"
                          value={operatorChangeData.userName}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, userName: e.target.value })}
                          placeholder="Ime i prezime korisnika"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorLegalEntity">Pravna osoba</Label>
                        <Input
                          id="operatorLegalEntity"
                          value={operatorChangeData.legalEntity}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, legalEntity: e.target.value })}
                          placeholder="Naziv pravne osobe"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorOib">OIB</Label>
                        <Input
                          id="operatorOib"
                          value={operatorChangeData.oib}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, oib: e.target.value })}
                          placeholder="OIB korisnika"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorPhoneNumber">Pretplatnički broj</Label>
                        <Input
                          id="operatorPhoneNumber"
                          value={operatorChangeData.phoneNumber}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, phoneNumber: e.target.value })}
                          placeholder="Pretplatnički broj"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorContactPhone">Kontakt telefon</Label>
                        <Input
                          id="operatorContactPhone"
                          value={operatorChangeData.contactPhone}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, contactPhone: e.target.value })}
                          placeholder="Kontakt telefon"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorEmail">Email</Label>
                        <Input
                          id="operatorEmail"
                          type="email"
                          value={operatorChangeData.email}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, email: e.target.value })}
                          placeholder="Email adresa"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="operatorConnectionAddress">Adresa priključka</Label>
                        <Input
                          id="operatorConnectionAddress"
                          value={operatorChangeData.connectionAddress}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, connectionAddress: e.target.value })}
                          placeholder="Adresa priključka"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorSellerPlace">Mjesto</Label>
                        <Input
                          id="operatorSellerPlace"
                          value={operatorChangeData.sellerPlace}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, sellerPlace: e.target.value })}
                          placeholder="Mjesto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="existingOperatorName">Naziv davatelja broja/postojećeg operatera</Label>
                      <Input
                        id="existingOperatorName"
                        value={operatorChangeData.existingOperatorName}
                        onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, existingOperatorName: e.target.value })}
                        placeholder="Unesite naziv postojećeg operatera"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium">Osnovni podaci</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contractOnDistance"
                        checked={operatorChangeData.contractOnDistance}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, contractOnDistance: checked as boolean })}
                      />
                      <Label htmlFor="contractOnDistance" className="font-normal">
                        Ugovor sklopljen na daljinu
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agreeToPayDebts"
                        checked={operatorChangeData.agreeToPayDebts}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, agreeToPayDebts: checked as boolean })}
                      />
                      <Label htmlFor="agreeToPayDebts" className="font-normal">
                        Korisnik je upoznat i pristaje podmiriti dugovanja postojećem/im operatoru/ima zbog prijevremenog raskida ugovora
                      </Label>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium">Usluge u nepokretnoj mreži</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="numberTransfer"
                        checked={operatorChangeData.numberTransfer}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, numberTransfer: checked as boolean })}
                      />
                      <Label htmlFor="numberTransfer" className="font-normal">
                        Prijenos broja
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notificationAgreement"
                        checked={operatorChangeData.notificationAgreement}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, notificationAgreement: checked as boolean })}
                      />
                      <Label htmlFor="notificationAgreement" className="font-normal">
                        Korisnik je upoznat da će u roku od 15 dana biti obaviješten o datumu promjene operatora
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vpnSeries"
                        checked={operatorChangeData.vpnSeries}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, vpnSeries: checked as boolean })}
                      />
                      <Label htmlFor="vpnSeries" className="font-normal">
                        VPN serija ili niz na priključku
                      </Label>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium">Usluge koje korisnik želi raskinuti s postojećim operatorom</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {['Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija', 'Sve usluge'].map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cancel-${service}`}
                            checked={operatorChangeData.servicesToCancel.includes(service)}
                            onCheckedChange={(checked) => {
                              const updatedServices = checked
                                ? [...operatorChangeData.servicesToCancel, service]
                                : operatorChangeData.servicesToCancel.filter(s => s !== service)
                              handleOperatorChangeDataChange({ ...operatorChangeData, servicesToCancel: updatedServices })
                            }}
                          />
                          <Label htmlFor={`cancel-${service}`} className="font-normal text-sm">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium">Usluge koje korisnik želi zadržati s postojećim operatorom</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {['Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija', 'Sve usluge'].map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={`keep-${service}`}
                            checked={operatorChangeData.servicesToKeep.includes(service)}
                            onCheckedChange={(checked) => {
                              const updatedServices = checked
                                ? [...operatorChangeData.servicesToKeep, service]
                                : operatorChangeData.servicesToKeep.filter(s => s !== service)
                              handleOperatorChangeDataChange({ ...operatorChangeData, servicesToKeep: updatedServices })
                            }}
                          />
                          <Label htmlFor={`keep-${service}`} className="font-normal text-sm">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-medium">Vezano uz uslugu pristupa internetu zadržavaju se korisnički računi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {['web hosting', 'adrese elektroničke pošte', 'svi korisnički računi'].map((account) => (
                        <div key={account} className="flex items-center space-x-2">
                          <Checkbox
                            id={`account-${account}`}
                            checked={operatorChangeData.userAccountsToKeep.includes(account)}
                            onCheckedChange={(checked) => {
                              const updatedAccounts = checked
                                ? [...operatorChangeData.userAccountsToKeep, account]
                                : operatorChangeData.userAccountsToKeep.filter(a => a !== account)
                              handleOperatorChangeDataChange({ ...operatorChangeData, userAccountsToKeep: updatedAccounts })
                            }}
                          />
                          <Label htmlFor={`account-${account}`} className="font-normal text-sm">
                            {account}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wholesaleService"
                        checked={operatorChangeData.wholesaleService}
                        onCheckedChange={(checked) => handleOperatorChangeDataChange({ ...operatorChangeData, wholesaleService: checked as boolean })}
                      />
                      <Label htmlFor="wholesaleService" className="font-normal">
                        Zahtjev za promjenu operatora je vezan za veleprodajnu uslugu
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="user" className="space-y-4 mt-4">
            <UserInformationForm
              initialData={userInfo}
              onChange={handleUserInfoChange}
              packageName={formData.fiksni_paket || formData.tv_paket || formData.tarifa || ""}
              subscriptionNumber={formData.pretplatnicki_broj || ""}
              contractConcludedOnPremises={contractConcludedOnPremises}
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
            operatorChangeData={operatorChangeData}
            calculatedData={{
              phoneServices: getCurrentPhoneData().services,
              phonePromoPrice: getCurrentPhoneData().promoPrice,
              phoneRegularPrice: getCurrentPhoneData().regularPrice,
              phoneServiceName: getCurrentPhoneData().serviceName,
              tvServices: getCurrentTvData().services,
              tvPromoPrice: getCurrentTvData().promoPrice,
              tvRegularPrice: getCurrentTvData().regularPrice,
              tvServiceName: getCurrentTvData().serviceName,
              internetServices: getCurrentInternetData().services,
              internetPromoPrice: getCurrentInternetData().promoPrice,
              internetRegularPrice: getCurrentInternetData().regularPrice,
              internetServiceName: getCurrentInternetData().serviceName,
              meshServices: getMeshServiceData().services,
              meshPromoPrice: getMeshServiceData().promoPrice,
              meshRegularPrice: getMeshServiceData().regularPrice,
              meshServiceName: getMeshServiceData().serviceName
            }}
          />
        </div>
      </div>
      
      <TerminalEquipmentEditor
        equipment={terminalEquipment}
        onChange={(updatedEquipment) => {
          setTerminalEquipment(updatedEquipment)
          if (onTerminalEquipmentChange) {
            onTerminalEquipmentChange(updatedEquipment)
          }
        }}
        isOpen={isEquipmentEditorOpen}
        onClose={() => setIsEquipmentEditorOpen(false)}
      />
    </div>
  )
}
