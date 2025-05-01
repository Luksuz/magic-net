
import { ProfileData } from "@/types/user"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

  // Get the formatted agreement number if available
export const getAgreementNumber = (profile: ProfileData) => {
  if (profile?.agreement_number) {
    return `${profile.agreement_number}`
  }
  return "Nije definiran"
} 
