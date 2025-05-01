"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { ProfileDropdown } from "./profile-dropdown"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-lg">
          Magic Net
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
} 