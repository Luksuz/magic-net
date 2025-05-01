import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorPage() {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Došlo je do greške</h1>
      <p className="text-lg mb-8">
        Dogodila se greška prilikom potvrde vašeg računa. Molimo pokušajte ponovno.
      </p>
      <Link href="/login">
        <Button>Povratak na prijavu</Button>
      </Link>
    </div>
  )
} 