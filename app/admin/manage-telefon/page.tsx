"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  getExtraTelefonPackages, 
  createExtraTelefonPackage, 
  updateExtraTelefonPackage, 
  deleteExtraTelefonPackage,
  type MagicExtraTelefon 
} from "@/lib/supabase"

export default function ManageTelefonPage() {
  const [packages, setPackages] = useState<MagicExtraTelefon[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MagicExtraTelefon | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: ""
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const result = await getExtraTelefonPackages()
      if (result.success) {
        setPackages(result.data)
      } else {
        toast.error("Greška pri dohvaćanju paketa: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri dohvaćanju paketa")
      console.error("Error fetching packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price) {
      toast.error("Molimo unesite naziv i cijenu paketa")
      return
    }

    const packageData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price)
    }

    try {
      let result
      if (editingPackage) {
        result = await updateExtraTelefonPackage(editingPackage.id, packageData)
      } else {
        result = await createExtraTelefonPackage(packageData)
      }

      if (result.success) {
        toast.success(editingPackage ? "Paket je uspješno ažuriran" : "Paket je uspješno kreiran")
        setIsDialogOpen(false)
        resetForm()
        fetchPackages()
      } else {
        toast.error("Greška: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri spremanju paketa")
      console.error("Error saving package:", error)
    }
  }

  const handleEdit = (pkg: MagicExtraTelefon) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj paket?")) {
      return
    }

    try {
      const result = await deleteExtraTelefonPackage(id)
      if (result.success) {
        toast.success("Paket je uspješno obrisan")
        fetchPackages()
      } else {
        toast.error("Greška pri brisanju paketa: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri brisanju paketa")
      console.error("Error deleting package:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: ""
    })
    setEditingPackage(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upravljanje dodatnim telefonskim paketima</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              Dodaj novi paket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Uredi paket" : "Dodaj novi paket"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv paketa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="npr. Telefonski MIX 1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Opis paketa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljan opis paketa i usluga koje uključuje"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Cijena (EUR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Odustani
                </Button>
                <Button type="submit">
                  {editingPackage ? "Ažuriraj" : "Kreiraj"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Postojeći paketi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Učitavanje...</div>
          ) : packages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nema kreiranih paketa. Dodajte prvi paket klikom na "Dodaj novi paket".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-center">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="max-w-md">
                      {pkg.description ? (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {pkg.description}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Nema opisa</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {pkg.price.toFixed(2)} EUR
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                        >
                          Uredi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          Obriši
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 