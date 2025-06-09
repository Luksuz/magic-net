"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ContractForm from "@/components/contract-form";
import ContractTableEditor from "@/components/contract-table-editor";
import SendEmailPage from "@/components/email-component";
import type { ContractData } from "@/lib/supabase";
import type { TerminalEquipment } from "@/lib/pdf-generator";
import type { UserInformation } from "@/components/user-information-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText } from "lucide-react";

// Helper to generate a somewhat unique ID (if needed for new items not from DB)
let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return Date.now() + idCounter; // Simple unique ID for client-side rendering
};

interface Props {
  contract: ContractData; // contract.terminalna_oprema will be the new array structure or old object
  profile: { agreement_number: number };
}

export default function EditContractPageClient({ contract, profile }: Props) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [useTableView, setUseTableView] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenerationMessage, setPdfGenerationMessage] = useState(false);
  const [contractConcludedOnPremises, setContractConcludedOnPremises] = useState(false);
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
    invoiceDeliveryMethod: ["mail"],
    marketingContact: [],
    generalTermsDelivery: "provided",
    paymentMethod: "oneTime",
    sellerCode: 0,
    sellerPlace: "",
    sellerDate: "",
    changeOperator: false,
  });

  // Default terminal equipment if none is loaded from contract (e.g., new contract from basic template)
  // This will be overridden by useEffect if contract.terminalna_oprema exists.
  const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>([]);

  const formDataRef = useRef<ContractData | null>(null);
  const formTerminalEquipmentRef = useRef<TerminalEquipment[]>([]); // Initialize with empty array

  useEffect(() => {
    if (contract) {
      setContractData(contract);
      let initialEquipment: TerminalEquipment[] = [];

      if (Array.isArray(contract.terminalna_oprema)) {
        // New structure: contract.terminalna_oprema is Array<{ name: string, quantity: number, price: number }>
        initialEquipment = contract.terminalna_oprema.map((item, index) => ({
          id: item.id || generateId(), // Use existing id or generate new one
          name: item.name || "",
          quantity: String(item.quantity || "1"), // Default to 1 if quantity is missing or 0
          price: typeof item.price === 'number' ? String(item.price.toFixed(2)).replace('.', ',') : "0,00",
        }));
      } else if (contract.terminalna_oprema && typeof contract.terminalna_oprema === 'object') {
        // Old structure: contract.terminalna_oprema is Record<string, price_number>
        // For backward compatibility or if data hasn't been migrated yet.
        initialEquipment = Object.entries(contract.terminalna_oprema).map(([name, price], index) => ({
          id: generateId(), // Old structure items won't have an ID
          name: name,
          quantity: "1", // Default quantity to 1 for old structure, as per user request
            price: typeof price === 'number' ? String(price.toFixed(2)).replace('.', ',') : "0,00",
        }));
      } else {
        // No terminal equipment defined in the contract, use a default empty list or pre-defined defaults if any.
        // For now, it defaults to what terminalEquipment was initialized with (empty array).
        // If you had default items for *all* new contracts, you could set them here.
      }
      setTerminalEquipment(initialEquipment);
      formTerminalEquipmentRef.current = initialEquipment;
    } else {
      setContractData(null);
      const emptyList: TerminalEquipment[] = [];
      setTerminalEquipment(emptyList);
      formTerminalEquipmentRef.current = emptyList;
    }
  }, [contract]);

  useEffect(() => {
    if (isGeneratingPdf && !useTableView) {
      // Show PDF generation message
      setPdfGenerationMessage(true);
      
      const timer = setTimeout(() => {
        setIsGeneratingPdf(false);
        // Hide the message after a short delay
        setTimeout(() => {
          setPdfGenerationMessage(false);
      }, 500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingPdf, useTableView]);

  const handlePdfFromTableView = (
    data: ContractData,
    equipmentData: TerminalEquipment[]
  ) => {
    formDataRef.current = data;
    formTerminalEquipmentRef.current = equipmentData;
    
    // Show PDF generation message
    setPdfGenerationMessage(true);
    
    // Set small delay before switching views to ensure message is visible
    setTimeout(() => {
    setIsGeneratingPdf(true);
    setUseTableView(false);
    }, 100);
  };

  const handleUserInfoChange = (data: UserInformation) => {
    setUserInfo(data);
  };

  const handleTerminalEquipmentChange = (updatedEquipment: TerminalEquipment[]) => {
    setTerminalEquipment(updatedEquipment); // Update local state for rendering
    formTerminalEquipmentRef.current = updatedEquipment; // Update ref for view switching

    // Convert to the new DB structure: Array<{ name: string; quantity: number; price: number; }>
    const newTerminalOpremaForDb = updatedEquipment
      .map(item => {
        const name = item.name.trim();
        const quantityStr = String(item.quantity || "").trim();
        const quantity = parseInt(quantityStr, 10);
        const price = parseFloat(String(item.price || "0").replace(',', '.'));

        return {
          name: name,
          // Ensure quantity is at least 1 if name is present, otherwise 0 (or skip item)
          quantity: name && (isNaN(quantity) || quantity <= 0) ? 1 : (isNaN(quantity) ? 0 : quantity),
          price: isNaN(price) ? 0 : price,
          // Include id if your DB schema for the array elements includes it, otherwise omit
          // id: item.id 
        };
      })
      .filter(item => item.name !== ""); // Filter out items with no name

    setContractData(prevContractData => 
      prevContractData ? 
      { 
        ...prevContractData, 
        terminalna_oprema: newTerminalOpremaForDb // Save in the new array format
      } : null
    );
  };

  if (!contractData) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Ugovor nije pronađen</h1>
        <p className="mb-6">Traženi ugovor nije moguće pronaći.</p>
        <Link href="/">
          <Button>Povratak na odabir paketa</Button>
        </Link>
      </div>
    );
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

      {/* PDF Generation Message */}
      {pdfGenerationMessage && (
        <Alert className="my-4 bg-blue-50 border-blue-200 text-blue-800">
          <FileText className="h-4 w-4 mr-2" />
          <AlertDescription>
            Priprema PDF dokumenta u tijeku...
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        {useTableView ? (
          <ContractTableEditor
            initialData={contractData} // This initialData.terminalna_oprema will be the new array from DB (or converted old)
            userInfo={userInfo}
            onUserInfoChange={handleUserInfoChange}
            terminalEquipment={terminalEquipment} // This is already TerminalEquipment[]
            onTerminalEquipmentChange={handleTerminalEquipmentChange}
            onGeneratePdf={handlePdfFromTableView}
            contractConcludedOnPremises={contractConcludedOnPremises}
            onContractConcludedOnPremisesChange={setContractConcludedOnPremises}
            contractNumber={contractData?.broj_ugovora}
          />
        ) : (
          <ContractForm
            initialData={formDataRef.current || contractData} // This initialData.terminalna_oprema will be new array
            userInfoInitial={userInfo}
            onUserInfoChange={handleUserInfoChange}
            terminalEquipmentInitial={formTerminalEquipmentRef.current} // This is already TerminalEquipment[]
            onTerminalEquipmentChange={handleTerminalEquipmentChange}
            shouldGeneratePdf={isGeneratingPdf}
            contractConcludedOnPremises={contractConcludedOnPremises}
            onContractConcludedOnPremisesChange={setContractConcludedOnPremises}
            contractNumber={contractData?.broj_ugovora}
          />
        )}
      </div>

      {/* Email Component Section */}
      <div className="mt-12 pt-8 border-t">
        <SendEmailPage 
          contractNumber={contractData?.broj_ugovora}
          serviceName={contractData?.usluga}
          recipientEmail={userInfo?.email}
          recipientName={userInfo?.userName}
        />
      </div>
    </main>
  );
}
