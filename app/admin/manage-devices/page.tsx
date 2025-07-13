'use client'

import { useAuth } from '../../contexts/authContext'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getDevices, createDevice, updateDevice, deleteDevice, type MagicNetDevice } from '@/lib/supabase'

export default function ManageDevicesPage() {
  const { isAdmin, loading } = useAuth()
  const [devices, setDevices] = useState<MagicNetDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<MagicNetDevice | null>(null)
  const [formData, setFormData] = useState({
    device_model: '',
    device_price: '',
    device_discount: ''
  })

  // Fetch devices
  const fetchDevices = async () => {
    setDevicesLoading(true)
    try {
      const result = await getDevices()
      if (result.success) {
        setDevices(result.data)
      } else {
        toast({
          title: "❌ Greška pri dohvaćanju",
          description: "Neuspjelo dohvaćanje uređaja: " + result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Greška pri dohvaćanju",
        description: "Neuspjelo dohvaćanje uređaja iz baze podataka.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setDevicesLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  // Show loading state
  if (loading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>
  }
  
  // Redirect if not admin
  if (!isAdmin) {
    redirect('/')
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      device_model: '',
      device_price: '',
      device_discount: ''
    })
  }

  // Handle add device
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.device_model.trim()) {
      toast({
        title: "⚠️ Nedostaju podaci",
        description: "Model uređaja je obavezan za dodavanje.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const deviceData = {
        device_model: formData.device_model.trim(),
        device_price: formData.device_price ? parseFloat(formData.device_price) : null,
        device_discount: formData.device_discount ? parseFloat(formData.device_discount) : null
      }

      const result = await createDevice(deviceData)
      
      if (result.success) {
        toast({
          title: "✅ Uređaj uspješno dodan!",
          description: `Uređaj "${deviceData.device_model}" je uspješno dodan u sustav.`,
          duration: 5000,
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchDevices()
      } else {
        toast({
          title: "❌ Greška pri dodavanju",
          description: "Neuspjelo dodavanje uređaja: " + result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo dodavanje uređaja",
        variant: "destructive"
      })
    }
  }

  // Handle edit device
  const handleEditDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingDevice || !formData.device_model.trim()) {
      toast({
        title: "⚠️ Nedostaju podaci",
        description: "Model uređaja je obavezan za ažuriranje.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const deviceData = {
        device_model: formData.device_model.trim(),
        device_price: formData.device_price ? parseFloat(formData.device_price) : null,
        device_discount: formData.device_discount ? parseFloat(formData.device_discount) : null
      }

      const result = await updateDevice(editingDevice.id, deviceData)
      
      if (result.success) {
        toast({
          title: "✏️ Uređaj uspješno ažuriran!",
          description: `Uređaj "${deviceData.device_model}" je uspješno ažuriran.`,
          duration: 5000,
        })
        setIsEditDialogOpen(false)
        setEditingDevice(null)
        resetForm()
        fetchDevices()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo ažuriranje uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo ažuriranje uređaja",
        variant: "destructive"
      })
    }
  }

  // Handle delete device
  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj uređaj?')) {
      return
    }

    try {
      const result = await deleteDevice(deviceId)
      
      if (result.success) {
        toast({
          title: "🗑️ Uređaj uspješno obrisan!",
          description: "Uređaj je uspješno uklonjen iz sustava.",
          duration: 5000,
        })
        fetchDevices()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo brisanje uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo brisanje uređaja",
        variant: "destructive"
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (device: MagicNetDevice) => {
    setEditingDevice(device)
    setFormData({
      device_model: device.device_model || '',
      device_price: device.device_price?.toString() || '',
      device_discount: device.device_discount?.toString() || ''
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Upravljanje Uređajima</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Uređaj
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj Novi Uređaj</DialogTitle>
              <DialogDescription>
                Unesite informacije o novom uređaju.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device_model">Model uređaja *</Label>
                <Input
                  id="device_model"
                  name="device_model"
                  value={formData.device_model}
                  onChange={handleInputChange}
                  placeholder="npr. iPhone 15 Pro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="device_price">Cijena (EUR)</Label>
                <Input
                  id="device_price"
                  name="device_price"
                  type="number"
                  step="0.01"
                  value={formData.device_price}
                  onChange={handleInputChange}
                  placeholder="npr. 999.99"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="device_discount">Popust (%)</Label>
                <Input
                  id="device_discount"
                  name="device_discount"
                  type="number"
                  step="0.01"
                  value={formData.device_discount}
                  onChange={handleInputChange}
                  placeholder="npr. 10"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">Dodaj Uređaj</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Uređaja</CardTitle>
          <CardDescription>
            Upravljajte uređajima koji su dostupni za odabir u ugovorima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="text-center py-8">Učitavanje uređaja...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nema dostupnih uređaja. Dodajte prvi uređaj klikom na "Dodaj Uređaj".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Cijena (EUR)</TableHead>
                  <TableHead>Popust (%)</TableHead>
                  <TableHead>Datum kreiranja</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.device_model}</TableCell>
                    <TableCell>
                      {device.device_price ? device.device_price.toFixed(2) : 'Nije definirano'}
                    </TableCell>
                    <TableCell>
                      {device.device_discount ? device.device_discount.toFixed(2) : 'Nije definirano'}
                    </TableCell>
                    <TableCell>
                      {new Date(device.created_at).toLocaleDateString('hr-HR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(device)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi Uređaj</DialogTitle>
            <DialogDescription>
              Uredite informacije o uređaju.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDevice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_device_model">Model uređaja *</Label>
              <Input
                id="edit_device_model"
                name="device_model"
                value={formData.device_model}
                onChange={handleInputChange}
                placeholder="npr. iPhone 15 Pro"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_device_price">Cijena (EUR)</Label>
              <Input
                id="edit_device_price"
                name="device_price"
                type="number"
                step="0.01"
                value={formData.device_price}
                onChange={handleInputChange}
                placeholder="npr. 999.99"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_device_discount">Popust (%)</Label>
              <Input
                id="edit_device_discount"
                name="device_discount"
                type="number"
                step="0.01"
                value={formData.device_discount}
                onChange={handleInputChange}
                placeholder="npr. 10"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Odustani
              </Button>
              <Button type="submit">Spremi Promjene</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 