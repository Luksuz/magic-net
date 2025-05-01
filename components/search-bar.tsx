"use client"

import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ChangeEvent } from "react"
import { useAuth } from "@/app/contexts/authContext"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Pretraži...", 
  className = "" 
}: SearchBarProps) {
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`relative w-full ${className}`}>
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-8 w-full"
        value={value}
        onChange={handleInputChange}
      />
    </div>
  )
} 