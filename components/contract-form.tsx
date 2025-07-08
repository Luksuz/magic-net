"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { ContractData, MagicNetDevice, MagicMeshDevice, MagicAdditionalTvDevice } from "@/lib/supabase"
import { getDevices, getMeshDevices, getExtraTelefonPackages, getAdditionalTvDevices, type MagicExtraTelefon } from "@/lib/supabase"
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
import { useAuth } from "@/app/contexts/authContext"

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
  const { profile } = useAuth()
  
  const [formData, setFormData] = useState<ContractData>(() => {
    // Clean contract number by removing UG prefix if it exists

    return {
      ...initialData,
      broj_ugovora: profile?.contract_number || ""
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
  // Replace individual telephone service states with dynamic selection
  const [selectedTelefonPackages, setSelectedTelefonPackages] = useState<{ [key: number]: boolean }>({})
  const [basePhonePrice, setBasePhonePrice] = useState(0)
  const pdfButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isEquipmentEditorOpen, setIsEquipmentEditorOpen] = useState(false)
  const [devices, setDevices] = useState<MagicNetDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [meshDevices, setMeshDevices] = useState<MagicMeshDevice[]>([])
  const [meshDevicesLoading, setMeshDevicesLoading] = useState(true)
  const [extraTelefonPackages, setExtraTelefonPackages] = useState<MagicExtraTelefon[]>([])
  const [extraTelefonLoading, setExtraTelefonLoading] = useState(true)
  const [additionalTvDevices, setAdditionalTvDevices] = useState<MagicAdditionalTvDevice[]>([])
  const [additionalTvLoading, setAdditionalTvLoading] = useState(true)
  const [selectedTvPackages, setSelectedTvPackages] = useState<{ [key: number]: boolean }>({})
  const [operatorChangeData, setOperatorChangeData] = useState<OperatorChangeData>(operatorChangeDataInitial || {
    existingOperatorName: "",
    contractOnDistance: true,
    agreeToPayDebts: false,
    numberTransfer: false,
    notificationAgreement: true,
    vpnSeries: true,
    servicesToCancel: ["Govorna usluga"],
    servicesToKeep: ["Internet"],
    userAccountsToKeep: ["adrese elektroničke pošte"],
    wholesaleService: true,
    // cancelAllServices: false,
    // keepAllServices: false,
    // Initialize with user data but allow independent editing
    userName: "", //userInfoInitial?.userName || "",
    legalEntity: "", //userInfoInitial?.legalEntity || "",
    oib: "", //userInfoInitial?.oib || "",
    phoneNumber: "", //formData.pretplatnicki_broj || "",
    contactPhone: "", //userInfoInitial?.contactPhone || "",
    email: "", //userInfoInitial?.email || "",
    contactEmail: "", // New field for email when "adrese elektroničke pošte" is selected
    connectionAddress: "", //userInfoInitial?.connectionAddress || "",
    sellerPlace: "", //userInfoInitial?.sellerPlace || "",
  })
  
  // Track manual edits to prevent auto-sync from overriding them
  const [operatorChangeManualEdits, setOperatorChangeManualEdits] = useState({
    legalEntity: false,
    // contactPhone and email are no longer auto-synced, so no need to track manual edits
    // contactPhone: false,
    // email: false,
    contactEmail: false,
  })
  
  // State for operator dropdown selection
  const [selectedOperatorType, setSelectedOperatorType] = useState<string>('custom')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    // Check if any manually tracked fields have changed
    const newEdits = { ...operatorChangeManualEdits }
    
    if (data.legalEntity !== operatorChangeData.legalEntity) {
      newEdits.legalEntity = true
    }
    // contactPhone and email are no longer tracked since they're not auto-synced
    // if (data.contactPhone !== operatorChangeData.contactPhone) {
    //   newEdits.contactPhone = true
    // }
    // if (data.email !== operatorChangeData.email) {
    //   newEdits.email = true
    // }
    if (data.contactEmail !== operatorChangeData.contactEmail) {
      newEdits.contactEmail = true
    }
    
    setOperatorChangeManualEdits(newEdits)
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
  
  // Handler for FREE MESH checkbox
  const handleFreeMeshChange = (checked: boolean) => {
    setFreeMeshEnabled(checked)
  }

  // Handler for RENTAL MESH count selector
  const handleRentalMeshCountChange = (count: number) => {
    setRentalMeshCount(count)
  }

  // Handler for dynamic TV package selection
  const handleTvPackageChange = (deviceId: number, checked: boolean) => {
    setSelectedTvPackages(prev => ({
      ...prev,
      [deviceId]: checked
    }))
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

  // Handler for dynamic telefon package selection
  const handleTelefonPackageChange = (packageId: number, checked: boolean) => {
    setSelectedTelefonPackages(prev => ({
      ...prev,
      [packageId]: checked
    }))
  }

  // Handler for "select all" cancel services
  // Removed - "Sve usluge" is now treated as a regular service option

  // Handler for "select all" keep services  
  // Removed - "Sve usluge" is now treated as a regular service option

  // Calculate current TV services and price (no state updates)
  const getCurrentTvData = () => {
    const selectedPackages: string[] = []
    const selectedPackageNames: string[] = []
    let additionalPrice = 0

    // Use dynamic packages from database instead of hardcoded values
    additionalTvDevices.forEach(device => {
      if (selectedTvPackages[device.id]) {
        selectedPackages.push(device.name || "")
        selectedPackageNames.push(device.name || "")
        additionalPrice += device.price || 0
      }
    })

    const basePromoPrice = baseTvPrice || formData.promo_price_tv || 0
    const baseRegularPrice = formData.regular_price_tv || 0
    
    // Create service name from base service only (additional packages shown separately)
    let serviceName = formData.tv_paket || "TV usluga"
    
    return {
      services: selectedPackages.join(', '),
      serviceName: serviceName,
      promoPrice: basePromoPrice, // Promotional price from form or baseTvPrice
      regularPrice: baseRegularPrice // Regular price from form data
    }
  }

  // Calculate current phone services and price (no state updates)
  const getCurrentPhoneData = () => {
    const selectedServices: string[] = []
    const selectedServiceNames: string[] = []
    let additionalPrice = 0

    // Use dynamic packages from database
    extraTelefonPackages.forEach(pkg => {
      if (selectedTelefonPackages[pkg.id]) {
        const description = pkg.description || ""
        selectedServices.push(`${pkg.name} - ${description}`)
        selectedServiceNames.push(pkg.name || "")
        additionalPrice += pkg.price || 0
      }
    })

    const basePromoPrice = basePhonePrice || formData.promo_price_phone || 0
    const baseRegularPrice = formData.regular_price_phone || 0
    
    // Create service name from base service only (additional services shown separately)
    let serviceName = formData.tarifa || "Telefonska usluga"
    
    const result = {
      services: selectedServices.join(', '),
      serviceName: serviceName, // Only base service name, not including additional services
      promoPrice: basePromoPrice, // Promotional price from form or basePhonePrice
      regularPrice: baseRegularPrice // Regular price from form data
    }
        
    return result
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
    
    // Initialize dynamic TV packages based on existing service data
    if (additionalTvDevices.length > 0) {
      const newSelectedPackages: { [key: number]: boolean } = {}
      additionalTvDevices.forEach(device => {
        if (device.name && tvServices.toLowerCase().includes(device.name.toLowerCase())) {
          newSelectedPackages[device.id] = true
        }
      })
      setSelectedTvPackages(newSelectedPackages)
    }
    
    // Initialize base TV price
    if (formData.promo_price_tv && baseTvPrice === 0) {
      setBaseTvPrice(formData.promo_price_tv)
    }
  }, [formData.tv_dodatne_usluge, formData.promo_price_tv, baseTvPrice, additionalTvDevices])

  // Initialize telephone service states based on existing data
  useEffect(() => {
    const telServices = formData.tel_dodatne_usluge || ""
    
    // Initialize dynamic telefon packages based on existing service data
    if (extraTelefonPackages.length > 0) {
      const newSelectedPackages: { [key: number]: boolean } = {}
      extraTelefonPackages.forEach(pkg => {
        if (pkg.name && telServices.toLowerCase().includes(pkg.name.toLowerCase())) {
          newSelectedPackages[pkg.id] = true
        }
      })
      setSelectedTelefonPackages(newSelectedPackages)
    }
    
    // Initialize base phone price
    if (formData.promo_price_phone && basePhonePrice === 0) {
      setBasePhonePrice(formData.promo_price_phone)
    }
  }, [formData.tel_dodatne_usluge, formData.promo_price_phone, basePhonePrice, extraTelefonPackages])

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

  // Fetch additional TV devices on component mount
  useEffect(() => {
    const fetchAdditionalTvDevices = async () => {
      setAdditionalTvLoading(true)
      try {
        const result = await getAdditionalTvDevices()
        if (result.success) {
          setAdditionalTvDevices(result.data)
        } else {
          console.error("Error fetching additional TV devices:", result.error)
        }
      } catch (error) {
        console.error("Error fetching additional TV devices:", error)
      } finally {
        setAdditionalTvLoading(false)
      }
    }

    fetchAdditionalTvDevices()
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

  // Update contract number when user name or access method changes
  useEffect(() => {
    if (profile?.contract_number) {
      const baseContractNumber = profile.contract_number;
      
      // Build the new format: BROJ ime prezime - način_pristupa
      let finalContractNumber = baseContractNumber;
      
      if (userInfo?.userName) {
        // Add user name (keep spaces)
        const cleanUserName = userInfo.userName.trim();
        finalContractNumber = `${baseContractNumber} ${cleanUserName}`;
      }
      
      if (formData.access_method) {
        // Add access method
        finalContractNumber = `${finalContractNumber} - ${formData.access_method.toUpperCase()}`;
      }
      
      // Only update if the current contract number is different
      const currentNumber = formData.broj_ugovora || '';
      if (currentNumber !== finalContractNumber) {
        setFormData(prev => ({
          ...prev,
          broj_ugovora: finalContractNumber
        }));
      }
    }
  }, [userInfo?.userName, formData.access_method, profile?.contract_number]);

  // Debug operator change data
  useEffect(() => {
    console.log('DEBUG: operatorChangeData state:', operatorChangeData);
  }, [operatorChangeData]);

  // Sync operator change data with user data changes (only if not manually modified)
  useEffect(() => {
    if (userInfo.changeOperator) {
      setOperatorChangeData(prev => ({
        ...prev,
        // Always update with current user info data (one-way sync from user info to operator change)
        userName: userInfo.userName || "",
        // Only update if not manually edited
        legalEntity: operatorChangeManualEdits.legalEntity ? prev.legalEntity : (userInfo.legalEntity || ""),
        oib: userInfo.oib || "",
        phoneNumber: formData.pretplatnicki_broj || "",
        // contactPhone and email are excluded from auto-sync - they remain empty initially
        // contactPhone: operatorChangeManualEdits.contactPhone ? prev.contactPhone : (userInfo.contactPhone || ""),
        // email: operatorChangeManualEdits.email ? prev.email : (userInfo.email || ""),
        connectionAddress: userInfo.connectionAddress || "",
        sellerPlace: userInfo.sellerPlace || "",
      }));
    }
  }, [userInfo, formData.pretplatnicki_broj, operatorChangeManualEdits.legalEntity]);

  // Handler for operator selection
  const handleOperatorSelection = (operatorType: string) => {
    setSelectedOperatorType(operatorType)
    
    if (operatorType !== 'custom') {
      // Set predefined operator name
      handleOperatorChangeDataChange({ 
        ...operatorChangeData, 
        existingOperatorName: operatorType 
      })
    }
    // If custom, keep the current value or clear it
  }

  // Initialize operator type based on existing data
  useEffect(() => {
    const predefinedOperators = [
      'Hrvatski telekom d.d.',
      'Telemach Hrvatska d.o.o.',
      'A1 Hrvatska d.o.o.'
    ]
    
    if (operatorChangeData.existingOperatorName && 
        predefinedOperators.includes(operatorChangeData.existingOperatorName)) {
      setSelectedOperatorType(operatorChangeData.existingOperatorName)
    } else {
      setSelectedOperatorType('custom')
    }
  }, [operatorChangeData.existingOperatorName])

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
                    <select
                      id="contract_duration"
                      name="contract_duration"
                      value={formData.contract_duration || ""}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Odaberite trajanje</option>
                      <option value="Neodređeno, s obveznim trajanjem - 1 mjesec">Neodređeno, s obveznim trajanjem - 1 mjesec</option>
                      <option value="Neodređeno, s obveznim trajanjem - 24 mjeseca">Neodređeno, s obveznim trajanjem - 24 mjeseca</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_date">Datum ugovora (opcionalno)</Label>
                    <Input
                      type="date"
                      id="contract_date"
                      name="contract_date"
                      value={formData.contract_date || ""}
                      onChange={handleChange}
                      placeholder="Ostavite prazno za automatski datum"
                    />
                    <p className="text-sm text-muted-foreground">
                      Ako se ostavi prazno, datum neće biti prikazan u ugovoru. U većini slučajeva se ostavlja prazno.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Način pristupa</Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="access_method_bs"
                          checked={formData.access_method === "BS"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, access_method: "BS" }))
                            }
                          }}
                        />
                        <Label htmlFor="access_method_bs" className="font-normal">BS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="access_method_fa"
                          checked={formData.access_method === "FA"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, access_method: "FA" }))
                            }
                          }}
                        />
                        <Label htmlFor="access_method_fa" className="font-normal">FA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="access_method_infra"
                          checked={formData.access_method === "INFRA"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, access_method: "INFRA" }))
                            }
                          }}
                        />
                        <Label htmlFor="access_method_infra" className="font-normal">INFRA</Label>
                      </div>
                    </div>
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
                    {additionalTvLoading ? (
                      <div className="text-center py-4">Učitavanje TV paketa...</div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        {additionalTvDevices.map((device) => (
                          <div key={device.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tvPackage-${device.id}`}
                              checked={selectedTvPackages[device.id] || false}
                              onCheckedChange={(checked) => handleTvPackageChange(device.id, checked as boolean)}
                            />
                            <Label htmlFor={`tvPackage-${device.id}`} className="font-normal">
                              {device.name} ({device.price?.toFixed(2)} EUR)
                            </Label>
                          </div>
                        ))}
                        {additionalTvDevices.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            Nema dostupnih TV paketa. Kontaktirajte administratora.
                          </div>
                        )}
                      </div>
                    )}
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
                        {extraTelefonPackages.map((pkg) => (
                          <div key={pkg.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`telefonPkg-${pkg.id}`}
                              checked={selectedTelefonPackages[pkg.id] || false}
                              onCheckedChange={(checked) => handleTelefonPackageChange(pkg.id, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label htmlFor={`telefonPkg-${pkg.id}`} className="font-normal text-sm leading-tight">
                                <span className="font-medium">{pkg.name}</span> ({pkg.price?.toFixed(2) || '0,00'} EUR/mj.)<br />
                                <span className="text-xs text-gray-600">
                                  {pkg.description || "Nema opisa"}
                                </span>
                              </Label>
                            </div>
                          </div>
                        ))}
                        {extraTelefonPackages.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            Nema dostupnih telefonskih paketa. Kontaktirajte administratora.
                          </div>
                        )}
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
                      step="1"
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
                          value={operatorChangeData.userName || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, userName: e.target.value })}
                          placeholder="Ime i prezime korisnika"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorLegalEntity">Pravna osoba</Label>
                        <Input
                          id="operatorLegalEntity"
                          value={operatorChangeData.legalEntity || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, legalEntity: e.target.value })}
                          placeholder="Naziv pravne osobe"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorOib">OIB</Label>
                        <Input
                          id="operatorOib"
                          value={operatorChangeData.oib || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, oib: e.target.value })}
                          placeholder="OIB korisnika"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorPhoneNumber">Pretplatnički broj</Label>
                        <Input
                          id="operatorPhoneNumber"
                          value={operatorChangeData.phoneNumber || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, phoneNumber: e.target.value })}
                          placeholder="Pretplatnički broj"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorContactPhone">Kontakt telefon</Label>
                        <Input
                          id="operatorContactPhone"
                          value={operatorChangeData.contactPhone || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, contactPhone: e.target.value })}
                          placeholder="Kontakt telefon"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorEmail">Email</Label>
                        <Input
                          id="operatorEmail"
                          type="email"
                          value={operatorChangeData.email || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, email: e.target.value })}
                          placeholder="Email adresa"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="operatorConnectionAddress">Adresa priključka</Label>
                        <Input
                          id="operatorConnectionAddress"
                          value={operatorChangeData.connectionAddress || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, connectionAddress: e.target.value })}
                          placeholder="Adresa priključka"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="operatorSellerPlace">Mjesto</Label>
                        <Input
                          id="operatorSellerPlace"
                          value={operatorChangeData.sellerPlace || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, sellerPlace: e.target.value })}
                          placeholder="Mjesto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="existingOperatorName">Naziv davatelja broja/postojećeg operatera</Label>
                      
                      <div className="space-y-3">
                        <select
                          value={selectedOperatorType}
                          onChange={(e) => handleOperatorSelection(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Hrvatski telekom d.d.">Hrvatski telekom d.d.</option>
                          <option value="Telemach Hrvatska d.o.o.">Telemach Hrvatska d.o.o.</option>
                          <option value="A1 Hrvatska d.o.o.">A1 Hrvatska d.o.o.</option>
                          <option value="custom">Ostalo (ručni unos)</option>
                        </select>
                        
                        {selectedOperatorType === 'custom' && (
                          <Input
                            id="existingOperatorName"
                            value={operatorChangeData.existingOperatorName || ""}
                            onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, existingOperatorName: e.target.value })}
                            placeholder="Unesite naziv postojećeg operatera"
                          />
                        )}
                      </div>
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
                      {['Sve usluge', 'Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija'].map((service) => (
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
                      {['Sve usluge', 'Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija'].map((service) => (
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
                    
                    {/* Contact Email input - shown when "adrese elektroničke pošte" is selected */}
                    {operatorChangeData.userAccountsToKeep.includes('adrese elektroničke pošte') && (
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="contactEmail">Kontakt email za adrese elektroničke pošte</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={operatorChangeData.contactEmail || ""}
                          onChange={(e) => handleOperatorChangeDataChange({ ...operatorChangeData, contactEmail: e.target.value })}
                          placeholder="Unesite kontakt email adresu"
                          className="max-w-md"
                        />
                      </div>
                    )}
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
            extraTelefonPackages={extraTelefonPackages}
            additionalTvDevices={additionalTvDevices}
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
