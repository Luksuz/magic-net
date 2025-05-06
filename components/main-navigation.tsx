"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PackageIcon, Mail, Home, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useAuth } from "@/app/contexts/authContext"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function MainNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    // Create the hover trigger area
    const createHoverTrigger = () => {
      const trigger = document.createElement('div');
      // Position the trigger in the middle 30% of the screen height and left 10% width
      trigger.className = 'fixed left-0 w-[10vw] z-30 pointer-events-auto';
      trigger.style.top = '35vh';
      trigger.style.height = '30vh';
      trigger.style.pointerEvents = 'auto';
      
      // Add event listeners for hover
      trigger.addEventListener('mouseenter', () => {
        setIsOpen(true);
      });
      
      document.body.appendChild(trigger);
      return trigger;
    };
    
    const trigger = createHoverTrigger();
    
    // Cleanup function
    return () => {
      if (document.body.contains(trigger)) {
        document.body.removeChild(trigger);
      }
    };
  }, []);
  
  const navItems: NavItem[] = [
    {
      title: "Početna",
      href: "/",
      icon: <Home className="h-5 w-5" />
    },
    {
      title: "Izbor paketa",
      href: "/packages",
      icon: <PackageIcon className="h-5 w-5" />
    },
    {
      title: "Pošalji email",
      href: "/send-email",
      icon: <Mail className="h-5 w-5" />
    }
  ]
  
  // Get user to check if they're an admin
  const { isAdmin } = useAuth()
  
  // Add admin links if user is admin
  const adminNavItems: NavItem[] = isAdmin ? [
    // {
    //   title: "Administracija",
    //   href: "/admin",
    //   icon: <Settings className="h-5 w-5" />
    // },
    {
      title: "Uredi PDF predložak",
      href: "/admin/templates",
      icon: <FileText className="h-5 w-5" />
    }
  ] : []
  
  // Combined navigation items
  const allNavItems = [...navItems, ...adminNavItems]
  
  return (
    <>
      {/* Side menu - shown on hover */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full bg-card shadow-lg z-40 transition-all duration-300 ease-in-out",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="px-4 py-6">
          <h2 className="text-xl font-bold mb-6 text-center">Magic Net</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-md text-sm font-medium transition-colors w-full",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <span className={cn("mr-3", isActive ? "text-primary" : "text-muted-foreground")}>
                    {item.icon}
                  </span>
                  {item.title}
                </Link>
              )
            })}
            
            {isAdmin && adminNavItems.length > 0 && (
              <>
                <hr className="my-4 border-t border-border/60" />
                <h3 className="px-3 text-sm font-semibold text-muted-foreground mb-2">Admin</h3>
                
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center p-3 rounded-md text-sm font-medium transition-colors w-full",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      <span className={cn("mr-3", isActive ? "text-primary" : "text-muted-foreground")}>
                        {item.icon}
                      </span>
                      {item.title}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      </div>
      
      {/* Visualization of the hover area - optional, remove in production */}
      <div className="fixed top-[35vh] left-0 w-[10vw] h-[30vh] border border-dashed border-primary/20 pointer-events-none z-20 opacity-30 md:flex hidden"></div>
    </>
  )
} 