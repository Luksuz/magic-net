"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ContractForm from "@/components/contract-form";
import ContractTableEditor from "@/components/contract-table-editor";
import type { ContractData } from "@/lib/supabase";
import type { TerminalEquipment } from "@/lib/pdf-generator";
import type { UserInformation } from "@/components/user-information-form";

interface Props {
  contract: ContractData;
  profile: { agreement_number: number };
}

export default function EditContractPageClient({ contract, profile }: Props) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [useTableView, setUseTableView] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
    sellerCode: 0,
    sellerPlace: "",
    sellerDate: new Date().toISOString().split("T")[0],
  });

  const [terminalEquipment, setTerminalEquipment] = useState<
    TerminalEquipment[]
  >([
    { id: 1, name: "WiFi router", quantity: "", price: "190,00" },
    {
      id: 2,
      name: "Svjetlovodno čvorište - FTTH",
      quantity: "",
      price: "25,00",
    },
    { id: 3, name: "Smart Card za prijemnike", quantity: "", price: "0,00" },
    { id: 4, name: "CAM modul za DVB/T2", quantity: "", price: "45,00" },
    { id: 5, name: "MESH", quantity: "", price: "65,00" },
  ]);

  const formDataRef = useRef<ContractData | null>(null);
  const formTerminalEquipmentRef =
    useRef<TerminalEquipment[]>(terminalEquipment);

  useEffect(() => {
    setContractData(contract);
  }, [contract]);

  useEffect(() => {
    if (isGeneratingPdf && !useTableView) {
      const timer = setTimeout(() => {
        setIsGeneratingPdf(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingPdf, useTableView]);

  const handlePdfFromTableView = (
    data: ContractData,
    equipmentData: TerminalEquipment[]
  ) => {
    formDataRef.current = data;
    formTerminalEquipmentRef.current = equipmentData;
    setIsGeneratingPdf(true);
    setUseTableView(false);
  };

  const handleUserInfoChange = (data: UserInformation) => {
    setUserInfo(data);
  };

  const handleTerminalEquipmentChange = (data: TerminalEquipment[]) => {
    setTerminalEquipment(data);
    formTerminalEquipmentRef.current = data;
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
  );
}
