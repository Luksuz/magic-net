"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-lg">
          Magic Net
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
} 