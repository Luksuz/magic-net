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
    contract_number: profile.contract_number ?? "",
    user_number: profile.user_number ?? "",
    seller_location: profile.seller_location ?? "",
  });

  useEffect(() => {
    setForm({
      agreement_number: profile.agreement_number ?? null,
      contract_number: profile.contract_number ?? "",
      user_number: profile.user_number ?? "",
      seller_location: profile.seller_location ?? "",
    });
  }, [profile]);

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
    value: number | null | string
  ) => {
    if (typeof value === "number" || value === null) {
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
          <Label>ID Prodavatelja</Label>
          {isEditing ? (
            <Input
              type="text"
              value={form.user_number}
              onChange={(e) => handleInput("user_number", e.target.value)}
              placeholder="Unesite ID prodavatelja"
            />
          ) : (
            <div className="p-2 border rounded">
              {form.user_number || "Nije postavljen"}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Ovaj ID će se koristiti kao identifikator prodavatelja u dokumentima.
          </p>
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

        {/* Contract Number Template */}
        <div className="space-y-2">
          <Label>Broj ugovora (template)</Label>
          {isEditing ? (
            <Input
              type="text"
              value={form.contract_number}
              onChange={(e) => handleInput("contract_number", e.target.value)}
              placeholder="npr. 2025-06-09-"
            />
          ) : (
            <div className="p-2 border rounded">
              {form.contract_number || "Nije postavljen"}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Ovaj template će se automatski upisati u polje broja ugovora. Prodavatelj će trebati samo dodati zadnje znamenke.
          </p>
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
