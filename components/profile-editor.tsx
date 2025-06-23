"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/contexts/authContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ProfileData } from "@/types/user";

export function ProfileEditor({ profile }: { profile: ProfileData | null }) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [agreementNumber, setAgreementNumber] = useState<number | null>(
    profile?.agreement_number || null
  );
  const [userNumber, setUserNumber] = useState<string>(
    String(profile?.user_number || "")
  );
  const [sellerLocation, setSellerLocation] = useState<string>(
    profile?.seller_location || ""
  );
  const [contractNumberTemplate, setContractNumberTemplate] = useState<string>(
    profile?.contract_number || ""
  );

  // Update state when profile changes
  useEffect(() => {
    if (profile) {
      setAgreementNumber(profile.agreement_number);
      setUserNumber(String(profile.user_number || ""));
      setSellerLocation(profile.seller_location || "");
      setContractNumberTemplate(profile.contract_number || "");
    }
  }, [profile]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        agreement_number: agreementNumber,
        user_number: userNumber,
        seller_location: sellerLocation,
        contract_number: contractNumberTemplate,
      });
      toast({
        title: "Profil ažuriran",
        description: "Vaši podaci su uspješno spremljeni.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati profil. Pokušajte ponovno.",
        variant: "destructive",
      });
    }
  };

  // Handle agreement number input with validation
  const handleAgreementNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.trim();
    if (value === "") {
      setAgreementNumber(null);
    } else {
      const parsed = parseInt(value, 10);
      setAgreementNumber(isNaN(parsed) ? null : parsed);
    }
  };

  if (!user || !profile) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Postavke ugovora</CardTitle>
        <CardDescription>Postavke za generiranje ugovora</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-number">ID Prodavatelja</Label>
            {isEditing ? (
              <Input
                id="user-number"
                type="text"
                value={userNumber}
                onChange={(e) => setUserNumber(e.target.value)}
                placeholder="Unesite ID prodavatelja"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.user_number || "Nije postavljen"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ovaj ID će se koristiti kao identifikator prodavatelja u dokumentima.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-number-template">Broj ugovora (template)</Label>
            {isEditing ? (
              <Input
                id="contract-number-template"
                type="text"
                value={contractNumberTemplate}
                onChange={(e) => setContractNumberTemplate(e.target.value)}
                placeholder="npr. 2025-06-09-"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.contract_number || "Nije postavljen"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ovaj template će se automatski upisati u polje broja ugovora. Prodavatelj će trebati samo dodati zadnje znamenke.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agreement-number">Broj ugovora</Label>
            {isEditing ? (
              <Input
                id="agreement-number"
                type="number"
                value={agreementNumber === null ? "" : agreementNumber}
                onChange={handleAgreementNumberChange}
                placeholder="Unesite broj ugovora"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.agreement_number ?? "Nije postavljen"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ovaj broj će se koristiti kao zadnji broj u nazivu i naslovu
              ugovora.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seller-location">Mjesto prodavatelja</Label>
            {isEditing ? (
              <Input
                id="seller-location"
                type="text"
                value={sellerLocation}
                onChange={(e) => setSellerLocation(e.target.value)}
                placeholder="Unesite mjesto prodavatelja"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.seller_location || "Nije postavljen"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ovo mjesto će se koristiti u dokumentima kao lokacija prodavatelja.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="w-full"
            >
              Odustani
            </Button>
            <Button onClick={handleSave} className="w-full">
              Spremi
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="w-full">
            Uredi postavke
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
