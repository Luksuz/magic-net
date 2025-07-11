"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Plus } from "lucide-react"
import { getActionItems, createActionItem, updateActionItem, deleteActionItem, type MagicActionItem } from "@/lib/supabase"

export default function ManageActionsPage() {
  const [actionItems, setActionItems] = useState<MagicActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MagicActionItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    discount_percentage: ""
  })

  // Fetch action items
  const fetchActionItems = async () => {
    try {
      const result = await getActionItems()
      if (result.success) {
        setActionItems(result.data)
      } else {
        toast({
          title: "Greška",
          description: "Nije moguće dohvatiti akcijske stavke.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching action items:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti akcijske stavke.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActionItems()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Greška",
        description: "Naziv akcije je obavezan.",
        variant: "destructive"
      })
      return
    }

    const discountPercentage = parseFloat(formData.discount_percentage)
    if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      toast({
        title: "Greška",
        description: "Postotak popusta mora biti između 0 i 100.",
        variant: "destructive"
      })
      return
    }

    try {
      let result
      if (editingItem) {
        // Update existing item
        result = await updateActionItem(editingItem.id, {
          name: formData.name.trim(),
          discount_percentage: discountPercentage
        })
      } else {
        // Create new item
        result = await createActionItem({
          name: formData.name.trim(),
          discount_percentage: discountPercentage
        })
      }

      if (result.success) {
        toast({
          title: "Uspjeh!",
          description: editingItem ? "Akcijska stavka je ažurirana." : "Akcijska stavka je stvorena."
        })
        fetchActionItems()
        handleCloseDialog()
      } else {
        toast({
          title: "Greška",
          description: result.error || "Nije moguće spremiti akcijsku stavku.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving action item:", error)
      toast({
        title: "Greška",
        description: "Nije moguće spremiti akcijsku stavku.",
        variant: "destructive"
      })
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu akcijsku stavku?")) {
      return
    }

    try {
      const result = await deleteActionItem(id)
      if (result.success) {
        toast({
          title: "Uspjeh!",
          description: "Akcijska stavka je obrisana."
        })
        fetchActionItems()
      } else {
        toast({
          title: "Greška",
          description: result.error || "Nije moguće obrisati akcijsku stavku.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting action item:", error)
      toast({
        title: "Greška",
        description: "Nije moguće obrisati akcijsku stavku.",
        variant: "destructive"
      })
    }
  }

  // Handle edit
  const handleEdit = (item: MagicActionItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name || "",
      discount_percentage: item.discount_percentage?.toString() || ""
    })
    setDialogOpen(true)
  }

  // Handle close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData({ name: "", discount_percentage: "" })
  }

  // Handle create new
  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({ name: "", discount_percentage: "" })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Upravljanje akcijskim stavkama</h1>
          <p className="text-muted-foreground">
            Dodaj, uredi ili obriši akcijske stavke s postotkom popusta
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj akciju
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actionItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>
                Popust: {item.discount_percentage}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stvoreno: {new Date(item.created_at).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {actionItems.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Nema akcijskih stavki</CardTitle>
            <CardDescription>
              Dodajte prvu akcijsku stavku za početak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj akciju
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Uredi akcijsku stavku" : "Dodaj novu akcijsku stavku"}
            </DialogTitle>
            <DialogDescription>
              Unesite naziv akcije i postotak popusta (0-100%)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv akcije</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="npr. Zimska akcija"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Postotak popusta (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                  placeholder="npr. 15"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Otkaži
              </Button>
              <Button type="submit">
                {editingItem ? "Ažuriraj" : "Stvori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 