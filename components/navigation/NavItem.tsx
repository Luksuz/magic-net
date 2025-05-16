"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItemProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
}

export default function NavItem({ title, href, icon, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center p-3 rounded-md text-sm font-medium transition-colors w-full",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "mr-3",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      {title}
    </Link>
  );
}
