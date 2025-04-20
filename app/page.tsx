import { Suspense } from "react"
import PackageSelector from "@/components/package-selector"
import { getPackages } from "@/lib/supabase"

export default async function Home() {
  const packages = await getPackages()

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Generator Ugovora za Internet Usluge</h1>

      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>Učitavanje paketa...</div>}>
          <PackageSelector packages={packages} />
        </Suspense>
      </div>
    </main>
  )
}
