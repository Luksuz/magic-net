"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, FileTextIcon } from "lucide-react"
import { SearchBar } from "@/components/search-bar"

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
  const [searchQuery, setSearchQuery] = useState("")

  const handleSelectPackage = (id: number) => {
    setSelectedPackage(id)
  }

  const handleContinue = () => {
    if (selectedPackage) {
      router.push(`/edit-contract/${selectedPackage}`)
    }
  }
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }
  
  // Check if a text contains a keyword, considering diacritics
  const containsKeyword = (text: string, keyword: string): boolean => {
    // Simple direct match
    if (text.includes(keyword)) return true
    
    // Transform the keyword with possible diacritics
    let transformedKeyword = keyword
    
    // Replace letters with special character alternatives
    for (const [base, diacritics] of Object.entries({
      'z': ['ž'],
      'c': ['č', 'ć'],
      's': ['š'],
      'd': ['đ']
    })) {
      // If the keyword contains the base character
      if (keyword.includes(base)) {
        // Check each possible replacement
        for (const diacritic of diacritics) {
          const altKeyword = keyword.replace(new RegExp(base, 'g'), diacritic)
          if (text.includes(altKeyword)) return true
        }
      }
    }
    
    // Also check the reverse - if text with diacritics can be found with a non-diacritic search
    for (const [base, diacritics] of Object.entries({
      'z': ['ž'],
      'c': ['č', 'ć'],
      's': ['š'],
      'd': ['đ']
    })) {
      for (const diacritic of diacritics) {
        if (text.includes(diacritic)) {
          const normalizedText = text.replace(new RegExp(diacritic, 'g'), base)
          if (normalizedText.includes(keyword)) return true
        }
      }
    }
    
    return false
  }

  // Filter packages based on search query
  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) {
      return packages
    }
    
    // Split search query into keywords and filter out empty strings
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    
    return packages.filter(pkg => {
      // Combine all searchable fields into one string
      const searchableText = [
        pkg.usluga,
        pkg.fiksni_paket,
        pkg.tv_paket,
        pkg.tarifa
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      
      // Check if all keywords are present in the searchable text, considering diacritics
      return keywords.every(keyword => containsKeyword(searchableText, keyword))
    })
  }, [packages, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-semibold">Odaberi Internet Paket</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <SearchBar 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Pretraži pakete..."
            className="sm:w-64"
          />
          <Link href="/add-package" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusIcon className="mr-2 h-4 w-4" />
              Dodaj Novi Paket
            </Button>
          </Link>
        </div>
      </div>

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
            {filteredPackages.map((pkg) => (
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
            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {searchQuery.trim() 
                    ? `Nije pronađen nijedan paket koji odgovara upitu "${searchQuery}".` 
                    : "Nije pronađen nijedan paket. Kreirajte svoj prvi paket za početak."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredPackages.length === 0 && !searchQuery.trim() && (
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
