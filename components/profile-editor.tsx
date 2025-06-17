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
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "@/components/ui/use-toast";
import { ProfileData } from "@/types/user";

export function ProfileEditor({ profile }: { profile: ProfileData | null }) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [agreementNumber, setAgreementNumber] = useState<number | null>(
    profile?.agreement_number || null
  );
  const [activationFees, setActivationFees] = useState<number[]>(
    profile?.activation_fees || []
  );
  const [userNumber, setUserNumber] = useState<number | null>(
    profile?.user_number || null
  );
  const [sellerLocation, setSellerLocation] = useState<string>(
    profile?.seller_location || ""
  );

  // Update state when profile changes
  useEffect(() => {
    if (profile) {
      setAgreementNumber(profile.agreement_number);
      setActivationFees(profile.activation_fees || []);
      setUserNumber(profile.user_number);
      setSellerLocation(profile.seller_location || "");
    }
  }, [profile]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const activationFeeOptions = [
    { value: 0, label: "0,00 EUR" },
    { value: 1659, label: "16,59 EUR" },
    { value: 3300, label: "33,00 EUR" },
    { value: 4000, label: "40,00 EUR" },
    { value: 10000, label: "100,00 EUR" },
  ];

  const handleSave = async () => {
    try {
      await updateProfile({
        agreement_number: agreementNumber,
        activation_fees: activationFees,
        user_number: userNumber,
        seller_location: sellerLocation,
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

  // Handle user number input with validation
  const handleUserNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value === "") {
      setUserNumber(null);
    } else {
      const parsed = parseInt(value, 10);
      setUserNumber(isNaN(parsed) ? null : parsed);
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
            <Label htmlFor="user-number">ID Korisnika</Label>
            {isEditing ? (
              <Input
                id="user-number"
                type="number"
                value={userNumber === null ? "" : userNumber}
                onChange={handleUserNumberChange}
                placeholder="Unesite ID korisnika"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.user_number ?? "Nije postavljen"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ovaj ID će se koristiti kao korisnički broj u dokumentima.
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

          <div className="space-y-2">
            <Label htmlFor="activation-fees">
              Dostupne naknade za aktivaciju
            </Label>
            {isEditing ? (
              <MultiSelect
                options={activationFeeOptions}
                selectedValues={activationFees.map(
                  (fee) =>
                    activationFeeOptions.find(
                      (option) => option.value === fee
                    ) || { value: fee, label: `${fee / 100} EUR` }
                )}
                onChange={(selected) =>
                  setActivationFees(selected.map((item) => item.value))
                }
                placeholder="Odaberite dostupne naknade"
              />
            ) : (
              <div className="p-2 border rounded">
                {profile.activation_fees?.length
                  ? profile.activation_fees
                      .map((fee) => `${(fee / 100).toFixed(2)} EUR`)
                      .join(", ")
                  : "Nije postavljeno"}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ove naknade će biti dostupne za odabir prilikom kreiranja novog
              ugovora.
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
