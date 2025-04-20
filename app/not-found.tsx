import Link from "next/link"
import { Button } from "@/components/ui/button"
export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Stranica nije pronađena</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Stranica koju tražite ne postoji ili je premještena.
      </p>
      <Link href="/">
        <Button>Povratak na početnu</Button>
      </Link>
    </div>
  )
}
