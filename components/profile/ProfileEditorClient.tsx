"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ProfileData } from "@/types/user";
import { useAuth } from "@/app/contexts/authContext";

interface Props {
  profile: ProfileData;
}

export function ProfileEditorClient({ profile }: Props) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    agreement_number: profile.agreement_number ?? null,
    activation_fees: profile.activation_fees ?? [],
    user_number: profile.user_number ?? null,
    seller_location: profile.seller_location ?? "",
  });

  useEffect(() => {
    setForm({
      agreement_number: profile.agreement_number ?? null,
      activation_fees: profile.activation_fees ?? [],
      user_number: profile.user_number ?? null,
      seller_location: profile.seller_location ?? "",
    });
  }, [profile]);

  const activationFeeOptions = [
    { value: 0, label: "0,00 EUR" },
    { value: 1659, label: "16,59 EUR" },
    { value: 3300, label: "33,00 EUR" },
    { value: 4000, label: "40,00 EUR" },
    { value: 10000, label: "100,00 EUR" },
  ];

  const handleSave = async () => {
    try {
      await updateProfile(form);
      toast({
        title: "Profil ažuriran",
        description: "Vaši podaci su spremljeni.",
      });
      setIsEditing(false);
    } catch {
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati profil.",
        variant: "destructive",
      });
    }
  };

  const handleInput = (
    field: keyof typeof form,
    value: number | null | number[] | string
  ) => {
    if (field === "activation_fees" && Array.isArray(value)) {
      setForm((prev) => ({ ...prev, activation_fees: value }));
    } else if (typeof value === "number" || value === null) {
      setForm((prev) => ({ ...prev, [field]: value }));
    } else if (typeof value === "string") {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  if (loading || !user) return null;

  return (
    <Card className="mb-0">
      <CardHeader>
        <CardTitle>Postavke ugovora</CardTitle>
        <CardDescription>Postavke za generiranje ugovora</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Number */}
        <div className="space-y-2">
          <Label>ID Korisnika</Label>
          {isEditing ? (
            <Input
              type="number"
              value={form.user_number ?? ""}
              onChange={(e) =>
                handleInput("user_number", parseInt(e.target.value) || null)
              }
            />
          ) : (
            <div className="p-2 border rounded">
              {form.user_number ?? "Nije postavljen"}
            </div>
          )}
        </div>

        {/* Seller Location */}
        <div className="space-y-2">
          <Label>Mjesto prodavatelja</Label>
          {isEditing ? (
            <Input
              type="text"
              value={form.seller_location}
              onChange={(e) => handleInput("seller_location", e.target.value)}
              placeholder="Unesite mjesto prodavatelja"
            />
          ) : (
            <div className="p-2 border rounded">
              {form.seller_location || "Nije postavljen"}
            </div>
          )}
        </div>

        {/* Agreement Number
        <div className="space-y-2">
          <Label>Broj ugovora</Label>
          {isEditing ? (
            <Input
              type="number"
              value={form.agreement_number ?? ""}
              onChange={(e) =>
                handleInput(
                  "agreement_number",
                  parseInt(e.target.value) || null
                )
              }
            />
          ) : (
            <div className="p-2 border rounded">
              {form.agreement_number ?? "Nije postavljen"}
            </div>
          )}
        </div> */}

        {/* Activation Fees */}
        <div className="space-y-2">
          <Label>Dostupne naknade</Label>
          {isEditing ? (
            <MultiSelect
              options={activationFeeOptions}
              selectedValues={form.activation_fees.map(
                (fee) =>
                  activationFeeOptions.find((opt) => opt.value === fee) || {
                    value: fee,
                    label: `${fee / 100} EUR`,
                  }
              )}
              onChange={(selected) =>
                handleInput(
                  "activation_fees",
                  selected.map((opt) => opt.value)
                )
              }
              placeholder="Odaberite dostupne naknade"
            />
          ) : (
            <div className="p-2 border rounded">
              {form.activation_fees.length > 0
                ? form.activation_fees
                    .map((f) => `${(f / 100).toFixed(2)} EUR`)
                    .join(", ")
                : "Nije postavljeno"}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Odustani
            </Button>
            <Button onClick={handleSave}>Spremi</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Uredi postavke</Button>
        )}
      </CardFooter>
    </Card>
  );
}
