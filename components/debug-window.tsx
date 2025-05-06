"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "lucide-react"

export function DebugWindow() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Code className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <Card className="absolute bottom-12 right-0 w-80 max-h-96 overflow-auto shadow-xl">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">User Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <pre className="text-xs overflow-auto bg-secondary p-3 rounded-md">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 