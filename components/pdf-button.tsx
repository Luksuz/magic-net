"use client"

import { useState, useEffect, RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Settings2, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { ContractData } from "@/lib/supabase"
import { generatePDF, generateOperatorChangePDF, type TerminalEquipment } from "@/lib/pdf-generator"
import type { UserInformation, OperatorChangeData } from "@/components/user-information-form"
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
  operatorChangeData?: OperatorChangeData
  extraTelefonPackages?: any[]
  calculatedData?: {
    phoneServices?: string
    phonePromoPrice?: number
    phoneRegularPrice?: number
    phoneServiceName?: string
    tvServices?: string
    tvPromoPrice?: number
    tvRegularPrice?: number
    tvServiceName?: string
    internetServices?: string
    internetPromoPrice?: number
    internetRegularPrice?: number
    internetServiceName?: string
    meshServices?: string
    meshPromoPrice?: number
    meshRegularPrice?: number
    meshServiceName?: string
  }
}

export default function PdfButton({ formData, userInfo, setActiveTab, terminalEquipment, buttonRef, contractConcludedOnPremises, operatorChangeData, extraTelefonPackages, calculatedData }: PdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingOperatorChange, setIsGeneratingOperatorChange] = useState(false)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false)
  const [showStyleOptions, setShowStyleOptions] = useState(false)
  const { user, profile, updateProfile } = useAuth()

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
      // Make sure profile has user_id for tracking
      const profileWithId = { ...profile };
      if (!profileWithId.user_id && user && user.id) {
        profileWithId.user_id = user.id;
      }
      (window as any).profileData = profileWithId;
      console.log("Updated profileData on window:", (window as any).profileData);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).profileData;
      }
    }
  }, [profile, user]);


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
      const safeOperatorChangeData = operatorChangeData ? deepClone(operatorChangeData) : undefined;
      
      console.log("Priprema za generiranje PDF-a s korisničkim informacijama:", !!safeUserInfo);
      console.log("DEBUG: extraTelefonPackages being passed to PDF generation:", extraTelefonPackages);
      
      // Add a longer delay to ensure content is fully prepared before generation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const editableTemplate = await getEditableTemplate();
      
      let success = false;
      if (profile && profile.user_id) {
        success = await generatePDF(
          safeFormData, 
          safeUserInfo, 
          safeTerminalEquipment, 
          editableTemplate.html,
          contractConcludedOnPremises,
          safeOperatorChangeData,
          calculatedData,
          extraTelefonPackages
        )
      } else {
        console.error("Korisnički ID nije dostupan.")
      }
      
      // If PDF generation was successful and we have a profile with an agreement number
      if (success && profile && profile.agreement_number !== null && profile.agreement_number !== undefined) {
        try {
          // Increment the agreement number
          const newAgreementNumber = profile.agreement_number + 1
          
          // Update the user's profile with the new agreement number
          await updateProfile({
            agreement_number: newAgreementNumber,
            // activation_fees: profile.activation_fees // Keep existing activation fees
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

  const handleOperatorChangeExport = async () => {
    if (!isLibraryLoaded) {
      alert("Biblioteka za generiranje PDF-a se još učitava. Pokušajte ponovno za trenutak.")
      return
    }

    if (!userInfo?.changeOperator) {
      alert("Zahtjev za promjenu operatera nije označen. Molimo označite opciju u korisničkim informacijama.")
      return
    }
    
    // Switch to basic tab before generating PDF
    setActiveTab("basic")
    
    // Wait for tab switch to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    setIsGeneratingOperatorChange(true)
    try {
      // Create deep clones of the data to prevent reference issues
      const safeFormData = deepClone(formData);
      const safeUserInfo = userInfo ? deepClone(userInfo) : undefined;
      const safeOperatorChangeData = operatorChangeData ? deepClone(operatorChangeData) : undefined;
      
      console.log("Priprema za generiranje PDF-a promjene operatera:", !!safeOperatorChangeData);
      
      // Add a longer delay to ensure content is fully prepared before generation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let success = false;
      if (profile && profile.user_id) {
        success = await generateOperatorChangePDF(
          safeFormData, 
          safeUserInfo, 
          safeOperatorChangeData
        )
      } else {
        console.error("Korisnički ID nije dostupan.")
      }
      
      if (success) {
        toast({
          title: "Uspješno generirano",
          description: "PDF zahtjeva za promjenu operatera je uspješno generiran.",
        })
      } else {
        throw new Error("Neuspješno generiranje PDF-a")
      }
      
    } catch (error) {
      console.error("Greška pri generiranju PDF-a promjene operatera:", error)
      alert("Neuspjelo generiranje PDF-a promjene operatera. Molimo pokušajte ponovno.")
    } finally {
      setIsGeneratingOperatorChange(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleExport} 
        size="lg" 
        disabled={isGenerating || isGeneratingOperatorChange || !isLibraryLoaded} 
        className="min-w-[200px]"
        ref={buttonRef ? (el) => buttonRef(el) : undefined}
      >
        {isGenerating ? "Generiranje PDF-a..." : isLibraryLoaded ? "Izvezi u PDF" : "Učitavanje PDF generatora..."}
      </Button>
      
      {userInfo?.changeOperator && (
        <Button 
          onClick={handleOperatorChangeExport} 
          size="lg" 
          variant="outline"
          disabled={isGenerating || isGeneratingOperatorChange || !isLibraryLoaded} 
          className="min-w-[250px]"
        >
          <FileText className="mr-2 h-4 w-4" />
          {isGeneratingOperatorChange ? "Generiranje..." : "Izvezi Promjenu Operatera"}
        </Button>
      )}
    </div>
  )
}
