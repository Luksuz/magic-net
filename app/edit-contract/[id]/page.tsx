// "use client"

// import { Suspense, useState, useEffect, useRef, useCallback } from "react"
// import { getContractById } from "@/lib/supabase"
// import ContractForm from "@/components/contract-form"
// import ContractTableEditor from "@/components/contract-table-editor"
// import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch"
// import { Label } from "@/components/ui/label"
// import Link from "next/link"
// import type { UserInformation } from "@/components/user-information-form"
// import type { ContractData } from "@/lib/supabase"
// import type { TerminalEquipment } from "@/lib/pdf-generator"
// import { useAuth } from "@/app/contexts/authContext"
// import { useParams } from "next/navigation"

// export default function EditContractPage() {
//   const searchParams = useParams()
//   const contractId = searchParams.id
//   const [contractData, setContractData] = useState<ContractData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [dataFetched, setDataFetched] = useState(false)
//   const [userInfo, setUserInfo] = useState<UserInformation>({
//     userId: "",
//     userName: "",
//     legalEntity: "",
//     residenceAddress: "",
//     connectionAddress: "",
//     oib: "",
//     idCardNumber: "",
//     contactPhone: "",
//     email: "",
//     contactPersonName: "",
//     contactPersonPhone: "",
//     contactPersonEmail: "",
//     additionalServices: "",
//     activationCost: "",
//     externalWorksCost: "",
//     invoiceDeliveryMethod: "mail",
//     marketingContact: [],
//     generalTermsDelivery: "provided",
//     paymentMethod: "oneTime",
//     sellerCode: 0,
//     sellerPlace: "",
//     sellerDate: new Date().toISOString().split("T")[0],
//   })
//   const [useTableView, setUseTableView] = useState(false)
//   const [terminalEquipment, setTerminalEquipment] = useState<TerminalEquipment[]>([
//     { id: 1, name: "WiFi router", quantity: "", price: "190,00" },
//     { id: 2, name: "Svjetlovodno čvorište - FTTH", quantity: "", price: "25,00" },
//     { id: 3, name: "Smart Card za prijemnike", quantity: "", price: "0,00" },
//     { id: 4, name: "CAM modul za DVB/T2", quantity: "", price: "45,00" },
//     { id: 5, name: "MESH", quantity: "", price: "65,00" }
//   ])
//   const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

//   // Refs to store form data while switching views
//   const formDataRef = useRef<ContractData | null>(null)
//   const formTerminalEquipmentRef = useRef<TerminalEquipment[]>(terminalEquipment)

//   // Get auth context with loading state
//   const { profile, loading: authLoading } = useAuth()

//   // Fetch contract data on client side
//   const fetchData = useCallback(async () => {
//     if (!profile) {
//       // This check is a safeguard; the calling useEffect should ensure profile exists.
//       console.warn("fetchData called but profile is null, this should be guarded by useEffect.");
//       setContractData(null);
//       setLoading(false); // Page's own loading for contract
//       setDataFetched(true);
//       return;
//     }

//     setLoading(true); // For contract fetching
//     // setDataFetched(false); // Reset if you want to allow re-fetching based on more complex conditions

//     try {
//       const data = await getContractById(Number(contractId));
//       if (!data) {
//         setContractData(null);
//         return;
//       }

//       const currentDate = new Date();
//       const year = currentDate.getFullYear();
//       const month = String(currentDate.getMonth() + 1).padStart(2, '0');

//       // profile is guaranteed by useCallback dependency and useEffect guard
//       if (profile.agreement_number) {
//         data.broj_ugovora = `UG-${year}-${month}-${profile.agreement_number}`;
//       }

//       setContractData(data);
//     } catch (error) {
//       console.error("Greška pri dohvaćanju ugovora:", error);
//       setContractData(null);
//     } finally {
//       setLoading(false); // For contract fetching
//       setDataFetched(true); // Mark that an attempt to fetch has been made
//     }
//   }, [contractId, profile]); // Key dependencies for fetchData

//   useEffect(() => {
//     if (authLoading) {
//       // AuthContext is still loading user and profile.
//       // Optionally, set page loading: setLoading(true);
//       return;
//     }

//     // Auth is loaded. Now check if profile exists.
//     if (!profile) {
//       console.warn("EditContractPage: Auth loaded, but no profile. Cannot fetch contract.");
//       setContractData(null);
//       setLoading(false); // Page loading for contract data
//       setDataFetched(true); // Considered "attempted" or not possible
//       return;
//     }

//     // Auth is loaded, profile is available.
//     // Fetch data if contractId is present.
//     if (contractId) {
//       // dataFetched state can be used here if you want to prevent re-fetching
//       // for the same contractId and profile, but useEffect dependencies mostly handle this.
//       // Example: if (!dataFetched || previousContractId !== contractId) { fetchData(); }
//       fetchData();
//     } else {
//       // No contractId, so clear contract data and set loading states.
//       setContractData(null);
//       setLoading(false);
//       setDataFetched(true);
//     }
//   }, [authLoading, profile, contractId, fetchData]); // Dependencies for this effect

//   // Handle PDF generation request from table view
//   const handlePdfFromTableView = (data: ContractData, equipmentData: TerminalEquipment[]) => {
//     // Store the current form data temporarily
//     formDataRef.current = data
//     formTerminalEquipmentRef.current = equipmentData

//     // Mark that we're generating PDF and switch to form view
//     setIsGeneratingPdf(true)
//     setUseTableView(false)
//   }

//   // When switching from table to form view for PDF generation
//   useEffect(() => {
//     // If we're in the process of generating PDF and have switched to form view
//     if (isGeneratingPdf && !useTableView) {
//       // Reset the flag after a short delay to allow form view to initialize
//       const timer = setTimeout(() => {
//         setIsGeneratingPdf(false)
//       }, 500)

//       return () => clearTimeout(timer)
//     }
//   }, [isGeneratingPdf, useTableView])

//   if (!contractData) {
//     return (
//       <div className="container mx-auto py-8 px-4 text-center">
//         <h1 className="text-3xl font-bold mb-4">Ugovor nije pronađen</h1>
//         <p className="mb-6">Traženi ugovor nije moguće pronaći.</p>
//         <Link href="/">
//           <Button>Povratak na odabir paketa</Button>
//         </Link>
//       </div>
//     )
//   }

//   const handleUserInfoChange = (data: UserInformation) => {
//     setUserInfo(data)
//   }

//   const handleTerminalEquipmentChange = (data: TerminalEquipment[]) => {
//     setTerminalEquipment(data)
//     formTerminalEquipmentRef.current = data
//   }

//   return (
//     <main className="container mx-auto py-8 px-4">
//       <div className="flex items-center mb-8 justify-between">
//         <div className="flex items-center">
//         <Link href="/" className="mr-4">
//             <Button variant="outline">← Natrag na pakete</Button>
//         </Link>
//           <h1 className="text-3xl font-bold">Uredi detalje ugovora</h1>
//         </div>

//         <div className="flex items-center space-x-2">
//           <Label htmlFor="table-view" className="text-sm font-medium">
//             Koristi tablični prikaz
//           </Label>
//           <Switch
//             id="table-view"
//             checked={useTableView}
//             onCheckedChange={setUseTableView}
//           />
//         </div>
//       </div>

//       <div className="w-full">
//         {useTableView ? (
//           <ContractTableEditor
//             initialData={contractData}
//             userInfo={userInfo}
//             onUserInfoChange={handleUserInfoChange}
//             terminalEquipment={terminalEquipment}
//             onTerminalEquipmentChange={handleTerminalEquipmentChange}
//             onGeneratePdf={handlePdfFromTableView}
//           />
//         ) : (
//           <ContractForm
//             initialData={formDataRef.current || contractData}
//             userInfoInitial={userInfo}
//             onUserInfoChange={handleUserInfoChange}
//             terminalEquipmentInitial={formTerminalEquipmentRef.current}
//             onTerminalEquipmentChange={handleTerminalEquipmentChange}
//             shouldGeneratePdf={isGeneratingPdf}
//           />
//         )}
//       </div>
//     </main>
//   )
// }

import EditContractLoader from "@/components/contract/EditContractLoader";

interface Props {
  params: { id: string };
}

export default function EditContractPage({ params }: Props) {
  const contractId = Number(params.id);

  return <EditContractLoader contractId={contractId} />;
}
