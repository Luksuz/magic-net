"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Plus } from "lucide-react"
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, type MagicEmailTemplate } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/authContext"
import { redirect } from "next/navigation"

export default function ManageEmailTemplatesPage() {
  const { isAdmin, loading } = useAuth()
  const [templates, setTemplates] = useState<MagicEmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MagicEmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    content: ""
  })

  // Fetch email templates
  const fetchTemplates = async () => {
    try {
      const result = await getEmailTemplates()
      if (result.success) {
        setTemplates(result.data)
      } else {
        toast({
          title: "Greška",
          description: "Nije moguće dohvatiti email predloške.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching email templates:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti email predloške.",
        variant: "destructive"
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Show loading state
  if (loading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>
  }
  
  // Redirect if not admin
  if (!isAdmin) {
    redirect('/')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      content: ""
    })
    setEditingTemplate(null)
  }

  const handleCreateNew = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (template: MagicEmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name || "",
      content: template.content || ""
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite naziv i sadržaj predloška.",
        variant: "destructive"
      })
      return
    }

    try {
      let result
      if (editingTemplate) {
        result = await updateEmailTemplate(editingTemplate.id, formData)
      } else {
        result = await createEmailTemplate(formData)
      }

      if (result.success) {
        toast({
          title: "Uspjeh",
          description: editingTemplate ? "Predložak je uspješno ažuriran." : "Predložak je uspješno kreiran."
        })
        setDialogOpen(false)
        resetForm()
        fetchTemplates()
      } else {
        toast({
          title: "Greška",
          description: result.error || "Nije moguće spremiti predložak.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Greška",
        description: "Nije moguće spremiti predložak.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj predložak?")) {
      return
    }

    try {
      const result = await deleteEmailTemplate(id)
      if (result.success) {
        toast({
          title: "Uspjeh",
          description: "Predložak je uspješno obrisan."
        })
        fetchTemplates()
      } else {
        toast({
          title: "Greška",
          description: result.error || "Nije moguće obrisati predložak.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Greška",
        description: "Nije moguće obrisati predložak.",
        variant: "destructive"
      })
    }
  }

  if (templatesLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Učitavanje email predložaka...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Upravljanje email predlošcima</h1>
          <p className="text-muted-foreground">
            Dodaj, uredi ili obriši email predloške za slanje korisnicima
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj predložak
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>
                Kreiran: {new Date(template.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {template.content?.substring(0, 150)}...
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(template)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nema kreiranih email predložaka.</p>
          <Button onClick={handleCreateNew} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Kreiraj prvi predložak
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Uredi email predložak" : "Kreiraj novi email predložak"}
            </DialogTitle>
            <DialogDescription>
              Email predlošci mogu koristiti placeholdere poput [Titula-Ime-Prezime], [Datum], [Tel], [Mob], [Operater-Ime] koji će se automatski zamijeniti prilikom slanja.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Naziv predloška</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="npr. Predložak 1 - Mailom vlasniku"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Sadržaj predloška</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Unesite sadržaj email predloška..."
                rows={20}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Dostupni placeholderi:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>[Titula-Ime-Prezime] - Titula, ime i prezime korisnika</li>
                <li>[Datum] - Datum razgovora</li>
                <li>[Kontakt-Osoba] - Ime kontakt osobe</li>
                <li>[Vlasnik-Ugovora] - Vlasnik ugovora</li>
                <li>[Posvojni-Zamjenica] - Posvojna zamjenica (njegova/njezina)</li>
                <li>[Tel] - Broj telefona operatera</li>
                <li>[Mob] - Broj mobitela operatera</li>
                <li>[Operater-Ime] - Ime operatera iz profila</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Odustani
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? "Ažuriraj" : "Kreiraj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 