"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Mail, PackageIcon, FileText } from "lucide-react";
import NavItem from "./NavItem";
import { useAuth } from "@/app/contexts/authContext";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
}: NavigationDrawerProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const baseItems = [
    { title: "Početna", href: "/", icon: <Home className="h-5 w-5" /> },
    {
      title: "Izbor paketa",
      href: "/packages",
      icon: <PackageIcon className="h-5 w-5" />,
    },
    {
      title: "Pošalji email",
      href: "/send-email",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const adminItems = isAdmin
    ? [
        {
          title: "Uredi PDF predložak",
          href: "/admin/templates",
          icon: <FileText className="h-5 w-5" />,
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-full bg-card shadow-lg z-40 transition-all duration-300 ease-in-out w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      onMouseLeave={onClose}
    >
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold mb-6 text-center">Magic Net</h2>
        <nav className="space-y-1">
          {baseItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
        {isAdmin && adminItems.length > 0 && (
          <>
            <hr className="my-4 border-t border-border/60" />
            <h3 className="px-3 text-sm font-semibold text-muted-foreground mb-2">
              Admin
            </h3>
            {adminItems.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
