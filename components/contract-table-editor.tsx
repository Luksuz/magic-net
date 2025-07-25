"use client"

import { useState, useEffect } from "react"
import type { ContractData, MagicMeshDevice } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { FileText } from "lucide-react"
import type { UserInformation, OperatorChangeData } from "@/components/user-information-form"
import type { TerminalEquipment } from "@/lib/pdf-generator"
import { getMeshDevices, getExtraTelefonPackages, type MagicExtraTelefon } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/authContext"

// Define types for field configuration
type FieldItem = {
  key: string;
  label: string;
  type: string;
  readOnly?: boolean;
};

type SubheadingItem = {
  subheading: string;
};

type FormField = FieldItem | SubheadingItem;

export default function ContractTableEditor({ 
  initialData, 
  userInfo, 
  onUserInfoChange,
  terminalEquipment: initialTerminalEquipment,
  onTerminalEquipmentChange,
  onGeneratePdf,
  contractConcludedOnPremises,
  onContractConcludedOnPremisesChange,
  contractNumber,
  operatorChangeDataInitial,
  onOperatorChangeDataChange,
  onContractDataChange
}: { 
  initialData: ContractData
  userInfo: UserInformation
  onUserInfoChange: (data: UserInformation) => void
  terminalEquipment: TerminalEquipment[]
  onTerminalEquipmentChange: (data: TerminalEquipment[]) => void
  onGeneratePdf: (data: ContractData, equipmentData: TerminalEquipment[], operatorChangeData?: OperatorChangeData) => void
  contractConcludedOnPremises?: boolean
  onContractConcludedOnPremisesChange?: (value: boolean) => void
  contractNumber?: string | null
  operatorChangeDataInitial?: OperatorChangeData
  onOperatorChangeDataChange?: (data: OperatorChangeData) => void
  onContractDataChange?: (data: ContractData) => void
}) {
  const [formData, setFormData] = useState<ContractData>(() => {
    // Clean contract number by removing UG prefix if it exists
    const cleanContractNumber = contractNumber ? contractNumber.replace(/^UG\s*/, '') : '';
    
    // Use contract_number from profile if available and no contract number provided
    let finalContractNumber = '';
    if (cleanContractNumber) {
      // New format: BROJ ime prezime - način_pristupa
      finalContractNumber = cleanContractNumber; // Start with the base number
    } else if (profile?.contract_number) {
      // If no contract number but we have a template, use it
      finalContractNumber = profile.contract_number;
    }
    
    return {
      ...initialData,
      broj_ugovora: finalContractNumber || initialData.broj_ugovora || ""
    };
  })
  const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>(initialTerminalEquipment)
  const [freeMeshEnabled, setFreeMeshEnabled] = useState(false)
  const [rentalMeshCount, setRentalMeshCount] = useState(0)
  const [meshDevices, setMeshDevices] = useState<MagicMeshDevice[]>([])
  const [meshDevicesLoading, setMeshDevicesLoading] = useState(true)
  // Add state for telephone packages
  const [extraTelefonPackages, setExtraTelefonPackages] = useState<MagicExtraTelefon[]>([])
  const [extraTelefonLoading, setExtraTelefonLoading] = useState(true)
  const [selectedTelefonPackages, setSelectedTelefonPackages] = useState<{ [key: number]: boolean }>({})
  const { profile } = useAuth()
  
  // Operator change data state
  const [operatorChangeData, setOperatorChangeData] = useState<OperatorChangeData>(operatorChangeDataInitial || {
    existingOperatorName: "",
    contractOnDistance: true,
    agreeToPayDebts: true,
    numberTransfer: true,
    notificationAgreement: true,
    vpnSeries: false,
    servicesToCancel: ["sve usluge"],
    servicesToKeep: [""],
    userAccountsToKeep: [""],
    wholesaleService: true,
    userName: userInfo?.userName || "",
    legalEntity: "",
    oib: userInfo?.oib || "",
    phoneNumber: initialData.pretplatnicki_broj || "",
    contactPhone: userInfo?.contactPhone || "",
    email: userInfo?.email || "",
    contactEmail: "",
    connectionAddress: userInfo?.connectionAddress || "",
    sellerPlace: userInfo?.sellerPlace || "",
  })
  
  // Calculate monthly payment when component mounts or relevant values change
  useEffect(() => {
    if (formData.uredaj_otplata_na_rate) {
      const updatedData = { ...formData };
      calculateMonthlyPayment(updatedData);
      setFormData(updatedData);
    }
  }, [formData.uredaj_otplata_na_rate, formData.uredaj_za_placanje, formData.uredaj_inicijalna_uplata, formData.uredaj_broj_obroka]);
  
  // Update contract number when user name or access method changes
  useEffect(() => {
    if (contractNumber) {
      const cleanContractNumber = contractNumber.replace(/^UG\s*/, '');
      
      // Build the new format: BROJ ime prezime - način_pristupa
      let finalContractNumber = cleanContractNumber;
      
      if (userInfo?.userName) {
        // Add user name (keep spaces)
        const cleanUserName = userInfo.userName.trim();
        finalContractNumber = `${cleanContractNumber} ${cleanUserName}`;
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
  }, [userInfo?.userName, formData.access_method, contractNumber]);

  // Notify parent when contract data changes
  useEffect(() => {
    if (onContractDataChange) {
      onContractDataChange(formData);
    }
  }, [formData, onContractDataChange]);
  
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

  // Handler for FREE MESH checkbox
  const handleFreeMeshChange = (checked: boolean) => {
    setFreeMeshEnabled(checked)
    updateMeshInEquipmentAndServices()
  }

  // Handler for RENTAL MESH count selector
  const handleRentalMeshCountChange = (count: number) => {
    setRentalMeshCount(count)
    updateMeshInEquipmentAndServices()
  }

  // Helper function to update MESH in equipment and services
  const updateMeshInEquipmentAndServices = () => {
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

    // Update MESH equipment quantity (assuming MESH has id 5)
    const updatedEquipment = terminalEquipment.map(item => 
      item.id === 5 ? { ...item, quantity: totalMeshQuantity > 0 ? totalMeshQuantity.toString() : "" } : item
    )
    setTerminalEquipment(updatedEquipment)
    onTerminalEquipmentChange(updatedEquipment)
    
    // Update additional services field
    const currentServices = formData.fiksne_dodatne_usluge || ""
    
    // Remove existing MESH services
    let updatedServices = currentServices
      .split(',')
      .map(service => service.trim())
      .filter(service => !service.toLowerCase().includes("mesh"))
      .filter(service => service !== "")
      .join(', ')
    
    // Add new MESH services
    if (meshServices.length > 0) {
      updatedServices = updatedServices ? `${updatedServices}, ${meshServices.join(', ')}` : meshServices.join(', ')
    }
    
    setFormData(prev => ({ ...prev, fiksne_dodatne_usluge: updatedServices }))
  }
  
  const handleGeneratePdf = () => {
    onGeneratePdf(formData, terminalEquipment, operatorChangeData)
  }

  // Group fields by category for better organization
  const fieldGroups: Array<{ name: string; fields: FormField[] }> = [
    {
      name: "Osnovne informacije",
      fields: [
        { key: "usluga", label: "Usluga", type: "text" },
        { key: "broj_ugovora", label: "Broj ugovora", type: "text" },
        { key: "contract_duration", label: "Trajanje ugovora", type: "select" },
        { key: "contract_date", label: "Datum ugovora (opcionalno)", type: "date" },
        { key: "access_method", label: "Način pristupa", type: "access_method" }
      ]
    },
    {
      name: "Internet usluga",
      fields: [
        { key: "fiksni_paket", label: "Fiksni paket", type: "text" },
        { key: "fiksna_brzina", label: "Fiksna brzina", type: "text" },
        { key: "fiksne_dodatne_usluge", label: "Dodatne fiksne usluge", type: "textarea" },
        { key: "fiksna_oprema", label: "Fiksna oprema", type: "textarea" },
        { subheading: "Periodična cijena" },
        { key: "fiksni_naziv_ugovorene_usluge", label: "Naziv ugovorene usluge", type: "text" },
        { key: "promo_price_fiksni", label: "Promotivna mj. naknada (Internet)", type: "number" },
        { key: "regular_price_fiksni", label: "Redovna mj. naknada (Internet)", type: "number" },
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
        { key: "tv_oprema", label: "TV oprema", type: "textarea" },
        { subheading: "Periodična cijena" },
        { key: "tv_naziv_ugovorene_usluge", label: "Naziv ugovorene usluge", type: "text" },
        { key: "promo_price_tv", label: "Promotivna mj. naknada (TV)", type: "number" },
        { key: "regular_price_tv", label: "Redovna mj. naknada (TV)", type: "number" }
      ]
    },
    {
      name: "Telefonska usluga",
      fields: [
        { key: "pretplatnicki_broj", label: "Pretplatnički broj", type: "text" },
        { key: "tarifa", label: "Tarifa", type: "text" },
        { key: "tel_dodatne_usluge", label: "Dodatne telefonske usluge", type: "textarea" },
        { key: "tel_oprema", label: "Telefonska oprema", type: "textarea" },
        { subheading: "Periodična cijena" },
        { key: "tel_naziv_ugovorene_usluge", label: "Naziv ugovorene usluge", type: "text" },
        { key: "promo_price_phone", label: "Promotivna mj. naknada (Telefon)", type: "number" },
        { key: "regular_price_phone", label: "Redovna mj. naknada (Telefon)", type: "number" }
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
        { key: "userTitle", label: "Titula", type: "text" },
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
        { key: "contactPersonTitle", label: "Titula kontakt osobe", type: "text" },
        { key: "contactPersonName", label: "Ime kontakt osobe", type: "text" },
        { key: "contactPersonPhone", label: "Telefon kontakt osobe", type: "text" },
        { key: "contactPersonEmail", label: "Email kontakt osobe", type: "text" }
      ]
    },
    // {
    //   name: "Dodatne usluge i troškovi",
    //   fields: [
    //     { key: "additionalServices", label: "Dodatne usluge", type: "text" },
    //     { key: "activationCost", label: "Trošak aktivacije", type: "text" },
    //     { key: "externalWorksCost", label: "Trošak vanjskih radova", type: "text" }
    //   ]
    // },
    {
      name: "Podaci o prodajnom mjestu",
      fields: [
        { key: "sellerCode", label: "Kod prodavatelja", type: "text" },
        { key: "sellerPlace", label: "Mjesto", type: "text" },
        ...(contractConcludedOnPremises ? [{ key: "sellerDate", label: "Datum ugovora", type: "date" }] : [])
      ]
    }
  ]

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedUserInfo = { ...userInfo, [name]: value }
    onUserInfoChange(updatedUserInfo)
  }

  const handleOperatorChangeDataChange = (data: OperatorChangeData) => {
    setOperatorChangeData(data)
    if (onOperatorChangeDataChange) {
      onOperatorChangeDataChange(data)
    }
  }

  // Initialize MESH states based on existing services
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

  const handleCheckboxToggle = () => {
    if (onContractConcludedOnPremisesChange) {
      onContractConcludedOnPremisesChange(!contractConcludedOnPremises);
    }
  };

  // Set today's date if contract is on premises and no date is set
  useEffect(() => {
    if (contractConcludedOnPremises && !userInfo.sellerDate) {
      onUserInfoChange({
        ...userInfo,
        sellerDate: new Date().toISOString().split('T')[0]
      });
    } else if (!contractConcludedOnPremises && userInfo.sellerDate) {
      onUserInfoChange({
        ...userInfo,
        sellerDate: ""
      });
    }
  }, [contractConcludedOnPremises, userInfo.sellerDate, onUserInfoChange]);

  // Set seller location from profile
  useEffect(() => {
    if (profile && profile.seller_location && userInfo.sellerPlace !== profile.seller_location) {
      onUserInfoChange({
        ...userInfo,
        sellerPlace: profile.seller_location
      });
    }
  }, [profile, userInfo.sellerPlace, onUserInfoChange]);

  // Handler for dynamic telefon package selection
  const handleTelefonPackageChange = (packageId: number, checked: boolean) => {
    setSelectedTelefonPackages(prev => ({
      ...prev,
      [packageId]: checked
    }))
  }

  // Helper function to update telephone services in form data
  const updateTelefonServicesInFormData = () => {
    const selectedServices: string[] = []
    
    extraTelefonPackages.forEach(pkg => {
      if (selectedTelefonPackages[pkg.id]) {
        const description = pkg.description || ""
        selectedServices.push(`${pkg.name} - ${description}`)
      }
    })
    
    setFormData(prev => ({
      ...prev,
      tel_dodatne_usluge: selectedServices.join(', ')
    }))
  }

  // Update telephone services when selection changes
  useEffect(() => {
    if (extraTelefonPackages.length > 0) {
      updateTelefonServicesInFormData()
    }
  }, [selectedTelefonPackages, extraTelefonPackages])

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
  }, [formData.tel_dodatne_usluge, extraTelefonPackages])

  // Effect to append "Dodatne fiksne usluge" content to "Fiksna oprema"
  useEffect(() => {
    const dodatneUsluge = formData.fiksne_dodatne_usluge || ""
    
    setFormData(prev => {
      const currentOprema = prev.fiksna_oprema || ""
      
      if (dodatneUsluge.trim()) {
        // Append additional services to existing equipment, avoid duplicates
        const existingParts = currentOprema.split(',').map(part => part.trim()).filter(part => part !== "")
        const newParts = dodatneUsluge.split(',').map(part => part.trim()).filter(part => part !== "")
        
        // Combine and remove duplicates
        const combinedParts = [...existingParts]
        newParts.forEach(newPart => {
          if (!existingParts.some(existing => existing.toLowerCase().includes(newPart.toLowerCase()) || newPart.toLowerCase().includes(existing.toLowerCase()))) {
            combinedParts.push(newPart)
          }
        })
        
        return {
          ...prev,
          fiksna_oprema: combinedParts.join(', ')
        }
      } else {
        // If no additional services, remove only mesh-related items but keep other equipment
        const equipmentParts = currentOprema.split(',').map(part => part.trim()).filter(part => part !== "")
        const filteredParts = equipmentParts.filter(part => 
          !part.toLowerCase().includes("mesh") && 
          !part.toLowerCase().includes("najam")
        )
        
        return {
          ...prev,
          fiksna_oprema: filteredParts.join(', ')
        }
      }
    })
  }, [formData.fiksne_dodatne_usluge])

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
                  {group.fields.map((field, index) => {
                    if ('subheading' in field) {
                      return (
                        <tr key={`subheading-${index}`} className="bg-gray-50">
                          <td colSpan={2} className="border border-gray-300 px-4 py-2 font-medium text-md">
                            {field.subheading}
                          </td>
                        </tr>
                      );
                    }
                    
                    return (
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
                          ) : field.type === "select" && field.key === "contract_duration" ? (
                            <select
                              id={field.key}
                              name={field.key}
                              value={(formData as any)[field.key] || ""}
                              onChange={handleChange}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Odaberite trajanje</option>
                              <option value="Neodređeno">Neodređeno</option>
                              <option value="s obveznim trajanjem - 1 mjesec/24 mjeseca">s obveznim trajanjem - 1 mjesec/24 mjeseca</option>
                            </select>
                          ) : field.type === "date" ? (
                            <Input
                              id={field.key}
                              name={field.key}
                              type="date"
                              value={(formData as any)[field.key] || ""}
                              onChange={handleChange}
                              className="w-full"
                            />
                          ) : field.type === "access_method" ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="access_method_bs"
                                  checked={(formData as any)[field.key] === "BS"}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleChange({ target: { name: field.key, value: "BS" } } as any)
                                    }
                                  }}
                                />
                                <Label htmlFor="access_method_bs" className="font-normal">BS</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="access_method_fa"
                                  checked={(formData as any)[field.key] === "FA"}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleChange({ target: { name: field.key, value: "FA" } } as any)
                                    }
                                  }}
                                />
                                <Label htmlFor="access_method_fa" className="font-normal">FA</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="access_method_infra"
                                  checked={(formData as any)[field.key] === "INFRA"}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleChange({ target: { name: field.key, value: "INFRA" } } as any)
                                    }
                                  }}
                                />
                                <Label htmlFor="access_method_infra" className="font-normal">INFRA</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="access_method_aeronet"
                                  checked={(formData as any)[field.key] === "AERONET"}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleChange({ target: { name: field.key, value: "AERONET" } } as any)
                                    }
                                  }}
                                />
                                <Label htmlFor="access_method_aeronet" className="font-normal">AERONET</Label>
                              </div>
                            </div>
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
                    );
                  })}
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
          <h2 className="text-xl font-bold mb-4">MESH uređaji konfiguracija</h2>
          <div className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4">Telefonski paketi konfiguracija</h2>
          <div className="space-y-4">
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

      <div className="flex justify-between mt-6 items-center">
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
        <Button 
          onClick={handleGeneratePdf} 
          size="lg" 
          className="min-w-[200px] "
        >
          <FileText className="mr-2 h-4 w-4" />
          Izvezi u PDF
        </Button>
      </div>
    </div>
  )
} 