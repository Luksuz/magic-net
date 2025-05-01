import { Suspense } from "react"
import PackageSelector from "@/components/package-selector"
import { getPackages } from "@/lib/supabase"

export default async function PackagesPage() {
  const packages = await getPackages()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Izbor Internet Paketa</h1>
      
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>Učitavanje paketa...</div>}>
          <PackageSelector packages={packages} />
        </Suspense>
      </div>
    </div>
  )
} 