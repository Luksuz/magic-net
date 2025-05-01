"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type Option = {
  value: number
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  selectedValues: Option[]
  onChange: (selectedValues: Option[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (option: Option) => {
    onChange(selectedValues.filter((item) => item.value !== option.value))
  }

  const handleSelect = (option: Option) => {
    const isSelected = selectedValues.some(item => item.value === option.value)
    
    if (isSelected) {
      onChange(selectedValues.filter(item => item.value !== option.value))
    } else {
      onChange([...selectedValues, option])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedValues.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedValues.slice(0, 2).map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(option)
                  }}
                >
                  {option.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {selectedValues.length > 2 && (
                <Badge variant="secondary">+{selectedValues.length - 2}</Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = selectedValues.some(
                (item) => item.value === option.value
              )
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option)}
                  className={cn(
                    "flex items-center gap-2",
                    isSelected ? "bg-accent" : ""
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}
                  >
                    {isSelected && <X className="h-3 w-3" />}
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 