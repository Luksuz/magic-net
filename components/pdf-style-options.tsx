"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContractData } from "@/lib/supabase"

export type PdfStyleOptions = {
  theme: "classic" | "modern" | "minimal"
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: number
  showLogo: boolean
  logoPosition: "left" | "center" | "right"
  showPageNumbers: boolean
  showHeaderOnAllPages: boolean
  tableStyle: "bordered" | "striped" | "minimal"
  pageSize: "a4" | "letter" | "legal"
  orientation: "portrait" | "landscape"
  margins: number
}

const defaultStyleOptions: PdfStyleOptions = {
  theme: "classic",
  primaryColor: "#1a3c5e",
  secondaryColor: "#f2f2f2",
  fontFamily: "Arial",
  fontSize: 11,
  showLogo: true,
  logoPosition: "right",
  showPageNumbers: true,
  showHeaderOnAllPages: true,
  tableStyle: "bordered",
  pageSize: "a4",
  orientation: "portrait",
  margins: 10,
}

// Sample contract data for preview
const sampleContractData: Partial<ContractData> = {
  broj_ugovora: "MN-2023-1234",
  usluga: "Internet + TV",
  fiksni_paket: "Fiber Pro 200",
  fiksna_brzina: "200/100 Mbps",
  fiksne_dodatne_usluge: "Statička IP adresa",
  fiksna_oprema: "ONT uređaj, WiFi router",
  brzina_min_download: "100",
  brzina_min_upload: "50",
  brzina_obicna_download: "180",
  brzina_obicna_upload: "90",
  brzina_max_download: "200",
  brzina_max_upload: "100",
  uredaj_proizvodac_model: "Samsung Galaxy A53",
  uredaj_cijena: 399,
  uredaj_popust: 100,
  uredaj_za_placanje: 299,
  uredaj_otplata_na_rate: true,
  uredaj_broj_obroka: 24,
  uredaj_inicijalna_uplata: 29,
  uredaj_mjesecna_rata: 11.25,
}

interface PdfStyleOptionsProps {
  initialOptions?: Partial<PdfStyleOptions>
  onChange: (options: PdfStyleOptions) => void
  contractData?: ContractData
}

export default function PdfStyleOptions({ initialOptions, onChange, contractData }: PdfStyleOptionsProps) {
  const [options, setOptions] = useState<PdfStyleOptions>({
    ...defaultStyleOptions,
    ...initialOptions,
  })
  const [previewSection, setPreviewSection] = useState<"header" | "services" | "device" | "pricing">("header")

  const handleChange = <K extends keyof PdfStyleOptions>(key: K, value: PdfStyleOptions[K]) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    onChange(newOptions)
  }

  const applyTheme = (theme: "classic" | "modern" | "minimal") => {
    let themeOptions: Partial<PdfStyleOptions> = {}

    switch (theme) {
      case "classic":
        themeOptions = {
          primaryColor: "#1a3c5e",
          secondaryColor: "#f2f2f2",
          fontFamily: "Arial",
          fontSize: 11,
          tableStyle: "bordered",
        }
        break
      case "modern":
        themeOptions = {
          primaryColor: "#2563eb",
          secondaryColor: "#f8fafc",
          fontFamily: "Helvetica",
          fontSize: 10,
          tableStyle: "striped",
        }
        break
      case "minimal":
        themeOptions = {
          primaryColor: "#374151",
          secondaryColor: "#ffffff",
          fontFamily: "Calibri",
          fontSize: 10,
          tableStyle: "minimal",
        }
        break
    }

    const newOptions = { ...options, ...themeOptions, theme }
    setOptions(newOptions)
    onChange(newOptions)
  }

  // Use provided contract data or sample data for preview
  const previewData = contractData || (sampleContractData as ContractData)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Opcije stila PDF-a</CardTitle>
          <CardDescription>Prilagodite izgled vaših generiranih PDF dokumenata</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="themes">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="themes">Teme</TabsTrigger>
              <TabsTrigger value="colors">Boje i fontovi</TabsTrigger>
              <TabsTrigger value="layout">Izgled</TabsTrigger>
              <TabsTrigger value="advanced">Napredno</TabsTrigger>
            </TabsList>

            <TabsContent value="themes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ThemePreview
                  title="Klasična"
                  description="Tradicionalni, profesionalni dizajn"
                  selected={options.theme === "classic"}
                  onClick={() => applyTheme("classic")}
                  primaryColor="#1a3c5e"
                />
                <ThemePreview
                  title="Moderna"
                  description="Čist, suvremeni stil"
                  selected={options.theme === "modern"}
                  onClick={() => applyTheme("modern")}
                  primaryColor="#2563eb"
                />
                <ThemePreview
                  title="Minimalna"
                  description="Jednostavan, pregledan izgled"
                  selected={options.theme === "minimal"}
                  onClick={() => applyTheme("minimal")}
                  primaryColor="#374151"
                />
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primarna boja</Label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border cursor-pointer"
                      style={{ backgroundColor: options.primaryColor }}
                    />
                    <Input
                      id="primaryColor"
                      type="text"
                      value={options.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Sekundarna boja</Label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border cursor-pointer"
                      style={{ backgroundColor: options.secondaryColor }}
                    />
                    <Input
                      id="secondaryColor"
                      type="text"
                      value={options.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font</Label>
                  <Select value={options.fontFamily} onValueChange={(value) => handleChange("fontFamily", value)}>
                    <SelectTrigger id="fontFamily">
                      <SelectValue placeholder="Odaberite font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Calibri">Calibri</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Veličina fonta: {options.fontSize}px</Label>
                  <Slider
                    id="fontSize"
                    min={8}
                    max={14}
                    step={0.5}
                    value={[options.fontSize]}
                    onValueChange={(value) => handleChange("fontSize", value[0])}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLogo">Prikaži logo</Label>
                    <Switch
                      id="showLogo"
                      checked={options.showLogo}
                      onCheckedChange={(checked) => handleChange("showLogo", checked)}
                    />
                  </div>
                </div>

                {options.showLogo && (
                  <div className="space-y-2">
                    <Label htmlFor="logoPosition">Pozicija loga</Label>
                    <Select
                      value={options.logoPosition}
                      onValueChange={(value: "left" | "center" | "right") => handleChange("logoPosition", value)}
                    >
                      <SelectTrigger id="logoPosition">
                        <SelectValue placeholder="Odaberite poziciju" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Lijevo</SelectItem>
                        <SelectItem value="center">Centar</SelectItem>
                        <SelectItem value="right">Desno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showPageNumbers">Prikaži brojeve stranica</Label>
                    <Switch
                      id="showPageNumbers"
                      checked={options.showPageNumbers}
                      onCheckedChange={(checked) => handleChange("showPageNumbers", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showHeaderOnAllPages">Zaglavlje na svim stranicama</Label>
                    <Switch
                      id="showHeaderOnAllPages"
                      checked={options.showHeaderOnAllPages}
                      onCheckedChange={(checked) => handleChange("showHeaderOnAllPages", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableStyle">Stil tablice</Label>
                  <Select
                    value={options.tableStyle}
                    onValueChange={(value: "bordered" | "striped" | "minimal") => handleChange("tableStyle", value)}
                  >
                    <SelectTrigger id="tableStyle">
                      <SelectValue placeholder="Odaberite stil tablice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bordered">S okvirom</SelectItem>
                      <SelectItem value="striped">Prugasto</SelectItem>
                      <SelectItem value="minimal">Minimalno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageSize">Veličina stranice</Label>
                  <Select
                    value={options.pageSize}
                    onValueChange={(value: "a4" | "letter" | "legal") => handleChange("pageSize", value)}
                  >
                    <SelectTrigger id="pageSize">
                      <SelectValue placeholder="Odaberite veličinu stranice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientation">Orijentacija</Label>
                  <Select
                    value={options.orientation}
                    onValueChange={(value: "portrait" | "landscape") => handleChange("orientation", value)}
                  >
                    <SelectTrigger id="orientation">
                      <SelectValue placeholder="Odaberite orijentaciju" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portret</SelectItem>
                      <SelectItem value="landscape">Pejzaž</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margins">Margine: {options.margins}mm</Label>
                  <Slider
                    id="margins"
                    min={5}
                    max={25}
                    step={1}
                    value={[options.margins]}
                    onValueChange={(value) => handleChange("margins", value[0])}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pregled uživo</CardTitle>
          <CardDescription>Pogledajte kako će izgledati vaš PDF s trenutnim postavkama stila</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Tabs defaultValue="header" onValueChange={(value) => setPreviewSection(value as any)}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="header">Zaglavlje</TabsTrigger>
                <TabsTrigger value="services">Usluge</TabsTrigger>
                <TabsTrigger value="device">Uređaj</TabsTrigger>
                <TabsTrigger value="pricing">Cijene</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ThemePreviewProps {
  title: string
  description: string
  selected: boolean
  onClick: () => void
  primaryColor: string
}

function ThemePreview({ title, description, selected, onClick, primaryColor }: ThemePreviewProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md relative",
        selected ? "ring-2 ring-primary border-primary" : "",
      )}
      onClick={onClick}
    >
      {selected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
      <div className="mb-3 h-24 border rounded overflow-hidden">
        <div className="h-8" style={{ backgroundColor: primaryColor }}></div>
        <div className="p-2">
          <div className="h-2 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 w-1/2 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
        </div>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
