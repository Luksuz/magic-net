"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { getContractById } from "@/lib/supabase"
import ContractForm from "@/components/contract-form"
import ContractTableEditor from "@/components/contract-table-editor"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import type { UserInformation } from "@/components/user-information-form"
import type { ContractData } from "@/lib/supabase"
import type { TerminalEquipment } from "@/lib/pdf-generator"

export default function EditContractPage({ params }: { params: { id: string } }) {
  const [contractId] = useState(Number.parseInt(params.id))
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInformation>({
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
  })
  const [useTableView, setUseTableView] = useState(false)
  const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>([
    { id: 1, name: "WiFi router", quantity: "", price: "190,00" },
    { id: 2, name: "Svjetlovodno čvorište - FTTH", quantity: "", price: "25,00" },
    { id: 3, name: "Smart Card za prijemnike", quantity: "", price: "0,00" },
    { id: 4, name: "CAM modul za DVB/T2", quantity: "", price: "45,00" },
    { id: 5, name: "MESH", quantity: "", price: "65,00" }
  ])
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
  // Refs to store form data while switching views
  const formDataRef = useRef<ContractData | null>(null)
  const formTerminalEquipmentRef = useRef<TerminalEquipment[]>(terminalEquipment)

  // Fetch contract data on client side
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const data = await getContractById(contractId)
        setContractData(data)
      } catch (error) {
        console.error("Greška pri dohvaćanju ugovora:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [contractId])

  // Handle PDF generation request from table view
  const handlePdfFromTableView = (data: ContractData, equipmentData: TerminalEquipment[]) => {
    // Store the current form data temporarily
    formDataRef.current = data
    formTerminalEquipmentRef.current = equipmentData
    
    // Mark that we're generating PDF and switch to form view
    setIsGeneratingPdf(true)
    setUseTableView(false)
  }
  
  // When switching from table to form view for PDF generation
  useEffect(() => {
    // If we're in the process of generating PDF and have switched to form view
    if (isGeneratingPdf && !useTableView) {
      // Reset the flag after a short delay to allow form view to initialize
      const timer = setTimeout(() => {
        setIsGeneratingPdf(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isGeneratingPdf, useTableView])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Učitavanje...</h1>
      </div>
    )
  }

  if (!contractData) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Ugovor nije pronađen</h1>
        <p className="mb-6">Traženi ugovor nije moguće pronaći.</p>
        <Link href="/">
          <Button>Povratak na odabir paketa</Button>
        </Link>
      </div>
    )
  }

  const handleUserInfoChange = (data: UserInformation) => {
    setUserInfo(data)
  }
  
  const handleTerminalEquipmentChange = (data: TerminalEquipment[]) => {
    setTerminalEquipment(data)
    formTerminalEquipmentRef.current = data
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8 justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <Button variant="outline">← Natrag na pakete</Button>
          </Link>
          <h1 className="text-3xl font-bold">Uredi detalje ugovora</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="table-view" className="text-sm font-medium">
            Koristi tablični prikaz
          </Label>
          <Switch
            id="table-view"
            checked={useTableView}
            onCheckedChange={setUseTableView}
          />
        </div>
      </div>

      <div className="w-full">
        {useTableView ? (
          <ContractTableEditor 
            initialData={contractData} 
            userInfo={userInfo}
            onUserInfoChange={handleUserInfoChange}
            terminalEquipment={terminalEquipment}
            onTerminalEquipmentChange={handleTerminalEquipmentChange}
            onGeneratePdf={handlePdfFromTableView}
          />
        ) : (
          <ContractForm 
            initialData={formDataRef.current || contractData} 
            userInfoInitial={userInfo}
            onUserInfoChange={handleUserInfoChange}
            terminalEquipmentInitial={formTerminalEquipmentRef.current}
            onTerminalEquipmentChange={handleTerminalEquipmentChange}
            shouldGeneratePdf={isGeneratingPdf}
          />
        )}
      </div>
    </main>
  )
}
