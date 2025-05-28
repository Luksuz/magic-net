import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { ProfileDropdown } from "./profile-dropdown";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="https://qfpjbgjxkpwtsegtkaze.supabase.co/storage/v1/object/public/images//logo.png" 
            alt="Magic Net Logo" 
            className="h-8 w-auto"
          />
          <span className="font-bold text-lg">Magic Net</span>
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
