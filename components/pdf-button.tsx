"use client"

import { useState, useEffect, RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { ContractData } from "@/lib/supabase"
import { generatePDF, type TerminalEquipment } from "@/lib/pdf-generator"
import type { UserInformation } from "@/components/user-information-form"
import { useAuth } from "@/app/contexts/authContext"
import { toast } from "@/components/ui/use-toast"
import { getEditableTemplate } from "@/lib/template-service"

interface PdfButtonProps {
  formData: ContractData
  userInfo?: UserInformation | null
  setActiveTab: (tab: string) => void
  terminalEquipment?: TerminalEquipment[]
  buttonRef?: (button: HTMLButtonElement | null) => void
  contractConcludedOnPremises?: boolean
}

export default function PdfButton({ formData, userInfo, setActiveTab, terminalEquipment, buttonRef, contractConcludedOnPremises }: PdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false)
  const [showStyleOptions, setShowStyleOptions] = useState(false)
  const { profile, updateProfile } = useAuth()

  useEffect(() => {
    // Check if html2pdf is loaded
    const checkLibrary = () => {
      if (typeof window !== "undefined" && typeof window.html2pdf !== "undefined") {
        setIsLibraryLoaded(true)
        return true
      }
      return false
    }

    // If not loaded immediately, check again after a delay
    if (!checkLibrary()) {
      const timer = setTimeout(() => {
        if (checkLibrary()) {
          clearTimeout(timer)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  // Store profile data on window for PDF generation access
  useEffect(() => {
    if (typeof window !== "undefined" && profile) {
      (window as any).profileData = profile
    }
    
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).profileData
      }
    }
  }, [profile])


  // Deep clone function to avoid reference issues
  const deepClone = <T,>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    try {
      // Use JSON parse/stringify for a deep clone
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      console.error("Neuspjelo duboko kloniranje objekta:", e);
      // Fallback to a shallow copy if JSON serialization fails
      return { ...obj } as T;
    }
  };

  const handleExport = async () => {
    if (!isLibraryLoaded) {
      alert("Biblioteka za generiranje PDF-a se još učitava. Pokušajte ponovno za trenutak.")
      return
    }
    
    // Switch to basic tab before generating PDF
    setActiveTab("basic")
    
    // Wait for tab switch to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    setIsGenerating(true)
    try {
      // Create deep clones of the data to prevent reference issues
      const safeFormData = deepClone(formData);
      const safeUserInfo = userInfo ? deepClone(userInfo) : undefined;
      const safeTerminalEquipment = terminalEquipment ? deepClone(terminalEquipment) : undefined;
      
      console.log("Priprema za generiranje PDF-a s korisničkim informacijama:", !!safeUserInfo);
      
      // Add a longer delay to ensure content is fully prepared before generation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const editableTemplate = await getEditableTemplate();
      
      const success = await generatePDF(
        safeFormData, 
        safeUserInfo, 
        safeTerminalEquipment, 
        editableTemplate.html,
        contractConcludedOnPremises
      )
      
      // If PDF generation was successful and we have a profile with an agreement number
      if (success && profile && profile.agreement_number !== null && profile.agreement_number !== undefined) {
        try {
          // Increment the agreement number
          const newAgreementNumber = profile.agreement_number + 1
          
          // Update the user's profile with the new agreement number
          await updateProfile({
            agreement_number: newAgreementNumber,
            activation_fees: profile.activation_fees // Keep existing activation fees
          })
        } catch (error) {
          console.error("Greška pri generiranju PDF-a:", error)
          alert("Neuspjelo generiranje PDF-a. Molimo pokušajte ponovno.")
        }
      }
    } catch (error) {
      console.error("Greška pri generiranju PDF-a:", error)
      alert("Neuspjelo generiranje PDF-a. Molimo pokušajte ponovno.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleExport} 
        size="lg" 
        disabled={isGenerating || !isLibraryLoaded} 
        className="min-w-[200px]"
        ref={buttonRef ? (el) => buttonRef(el) : undefined}
      >
        {isGenerating ? "Generiranje PDF-a..." : isLibraryLoaded ? "Izvezi u PDF" : "Učitavanje PDF generatora..."}
      </Button>
    </div>
  )
}
