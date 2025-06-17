"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  getAdditionalTvDevices, 
  createAdditionalTvDevice, 
  updateAdditionalTvDevice, 
  deleteAdditionalTvDevice,
  type MagicAdditionalTvDevice 
} from "@/lib/supabase"

export default function ManageAdditionalTvPage() {
  const [devices, setDevices] = useState<MagicAdditionalTvDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<MagicAdditionalTvDevice | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: ""
  })

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const result = await getAdditionalTvDevices()
      if (result.success) {
        setDevices(result.data)
      } else {
        toast.error("Greška pri dohvaćanju TV paketa: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri dohvaćanju TV paketa")
      console.error("Error fetching devices:", error)
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

    const deviceData = {
      name: formData.name.trim(),
      price: parseFloat(formData.price)
    }

    try {
      let result
      if (editingDevice) {
        result = await updateAdditionalTvDevice(editingDevice.id, deviceData)
      } else {
        result = await createAdditionalTvDevice(deviceData)
      }

      if (result.success) {
        toast.success(editingDevice ? "TV paket je uspješno ažuriran" : "TV paket je uspješno kreiran")
        setIsDialogOpen(false)
        resetForm()
        fetchDevices()
      } else {
        toast.error("Greška: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri spremanju TV paketa")
      console.error("Error saving device:", error)
    }
  }

  const handleEdit = (device: MagicAdditionalTvDevice) => {
    setEditingDevice(device)
    setFormData({
      name: device.name || "",
      price: device.price?.toString() || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj TV paket?")) {
      return
    }

    try {
      const result = await deleteAdditionalTvDevice(id)
      if (result.success) {
        toast.success("TV paket je uspješno obrisan")
        fetchDevices()
      } else {
        toast.error("Greška pri brisanju TV paketa: " + result.error)
      }
    } catch (error) {
      toast.error("Greška pri brisanju TV paketa")
      console.error("Error deleting device:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: ""
    })
    setEditingDevice(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upravljanje dodatnim TV paketima</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              Dodaj novi TV paket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDevice ? "Uredi TV paket" : "Dodaj novi TV paket"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv TV paketa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="npr. FILMSKI"
                  required
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
                  {editingDevice ? "Ažuriraj" : "Kreiraj"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Postojeći TV paketi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Učitavanje...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nema kreiranih TV paketa. Dodajte prvi paket klikom na "Dodaj novi TV paket".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead className="text-right">Cijena</TableHead>
                  <TableHead className="text-center">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {device.price?.toFixed(2)} EUR
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(device)}
                        >
                          Uredi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(device.id)}
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