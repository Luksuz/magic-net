import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PackageForm from "@/components/package-form"
import { getContractById } from "@/lib/supabase"

export default async function EditPackagePage({ params }: { params: { id: string } }) {
  const packageId = Number.parseInt(params.id)
  const packageData = await getContractById(packageId)

  if (!packageData) {
    notFound()
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Link href="/" className="mr-4">
          <Button variant="outline">← Natrag na pakete</Button>
        </Link>
        <h1 className="text-3xl font-bold">Uredi paket</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <PackageForm initialData={packageData} isEditing={true} />
      </div>
    </main>
  )
}
