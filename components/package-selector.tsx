"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, FileTextIcon, GridIcon, ListIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type Package = {
  id: number
  usluga: string | null
  fiksni_paket: string | null
  tv_paket: string | null
  tarifa: string | null
}

export default function PackageSelector({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const handleSelectPackage = (id: number) => {
    setSelectedPackage(id)
  }

  const handleContinue = () => {
    if (selectedPackage) {
      router.push(`/edit-contract/${selectedPackage}`)
    }
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid")
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Odaberi Internet Paket</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <GridIcon className={`h-5 w-5 ${viewMode === "grid" ? "text-primary" : "text-muted-foreground"}`} />
              <Switch checked={viewMode === "list"} onCheckedChange={toggleViewMode} id="view-mode" />
              <ListIcon className={`h-5 w-5 ${viewMode === "list" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
          <Link href="/add-package">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Dodaj Novi Paket
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${selectedPackage === pkg.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => handleSelectPackage(pkg.id)}
            >
              <CardHeader>
                <CardTitle>{pkg.usluga || "Neimenovani Paket"}</CardTitle>
                <CardDescription>ID: {pkg.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkg.fiksni_paket && (
                    <p>
                      <span className="font-medium">Fiksni Paket:</span> {pkg.fiksni_paket}
                    </p>
                  )}
                  {pkg.tv_paket && (
                    <p>
                      <span className="font-medium">TV Paket:</span> {pkg.tv_paket}
                    </p>
                  )}
                  {pkg.tarifa && (
                    <p>
                      <span className="font-medium">Tarifa:</span> {pkg.tarifa}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/edit-package/${pkg.id}`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Uredi Paket
                  </Button>
                </Link>
                <Link href={`/edit-contract/${pkg.id}`}>
                  <Button variant="outline" size="sm">
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Generiraj Ugovor
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Usluga</th>
                <th className="text-left p-3 font-medium">Fiksni Paket</th>
                <th className="text-left p-3 font-medium">TV Paket</th>
                <th className="text-left p-3 font-medium">Tarifa</th>
                <th className="text-right p-3 font-medium">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className={`border-t hover:bg-muted/50 cursor-pointer ${selectedPackage === pkg.id ? "bg-primary/10" : ""}`}
                  onClick={() => handleSelectPackage(pkg.id)}
                >
                  <td className="p-3">
                    <div className="font-medium">{pkg.usluga || "Neimenovani Paket"}</div>
                    <div className="text-xs text-muted-foreground">ID: {pkg.id}</div>
                  </td>
                  <td className="p-3">{pkg.fiksni_paket || "-"}</td>
                  <td className="p-3">{pkg.tv_paket || "-"}</td>
                  <td className="p-3">{pkg.tarifa || "-"}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/edit-package/${pkg.id}`}>
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Uredi</span>
                        </Button>
                      </Link>
                      <Link href={`/edit-contract/${pkg.id}`}>
                        <Button variant="ghost" size="sm">
                          <FileTextIcon className="h-4 w-4" />
                          <span className="sr-only">Ugovor</span>
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nije pronađen nijedan paket. Kreirajte svoj prvi paket za početak.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {packages.length === 0 && (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">Nije pronađen nijedan paket. Kreirajte svoj prvi paket za početak.</p>
          <Link href="/add-package">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Dodaj Novi Paket
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
