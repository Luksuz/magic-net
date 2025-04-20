import Link from "next/link"
import { Button } from "@/components/ui/button"
import PackageForm from "@/components/package-form"

export default function AddPackagePage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Link href="/" className="mr-4">
          <Button variant="outline">← Natrag na pakete</Button>
        </Link>
        <h1 className="text-3xl font-bold">Dodaj novi paket</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <PackageForm />
      </div>
    </main>
  )
}
