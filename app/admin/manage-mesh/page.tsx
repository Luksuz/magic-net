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
import { getMeshDevices, createMeshDevice, updateMeshDevice, deleteMeshDevice, type MagicMeshDevice } from '@/lib/supabase'

export default function ManageMeshDevicesPage() {
  const { isAdmin, loading } = useAuth()
  const [meshDevices, setMeshDevices] = useState<MagicMeshDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<MagicMeshDevice | null>(null)
  const [formData, setFormData] = useState({
    price: '',
    promo_price: '',
    regular_price: ''
  })

  // Fetch mesh devices
  const fetchMeshDevices = async () => {
    setDevicesLoading(true)
    try {
      const result = await getMeshDevices()
      if (result.success) {
        setMeshDevices(result.data)
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo dohvaćanje MESH uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo dohvaćanje MESH uređaja",
        variant: "destructive"
      })
    } finally {
      setDevicesLoading(false)
    }
  }

  useEffect(() => {
    fetchMeshDevices()
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
      price: '',
      promo_price: '',
      regular_price: ''
    })
  }

  // Handle add mesh device
  const handleAddMeshDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const meshDeviceData = {
        price: formData.price ? parseFloat(formData.price) : null,
        promo_price: formData.promo_price ? parseFloat(formData.promo_price) : null,
        regular_price: formData.regular_price ? parseFloat(formData.regular_price) : null
      }

      const result = await createMeshDevice(meshDeviceData)
      
      if (result.success) {
        toast({
          title: "Uspjeh",
          description: "MESH uređaj je uspješno dodan"
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchMeshDevices()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo dodavanje MESH uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo dodavanje MESH uređaja",
        variant: "destructive"
      })
    }
  }

  // Handle edit mesh device
  const handleEditMeshDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingDevice) {
      toast({
        title: "Greška",
        description: "Nema uređaja za uređivanje",
        variant: "destructive"
      })
      return
    }

    try {
      const meshDeviceData = {
        price: formData.price ? parseFloat(formData.price) : null,
        promo_price: formData.promo_price ? parseFloat(formData.promo_price) : null,
        regular_price: formData.regular_price ? parseFloat(formData.regular_price) : null
      }

      const result = await updateMeshDevice(editingDevice.id, meshDeviceData)
      
      if (result.success) {
        toast({
          title: "Uspjeh",
          description: "MESH uređaj je uspješno ažuriran"
        })
        setIsEditDialogOpen(false)
        setEditingDevice(null)
        resetForm()
        fetchMeshDevices()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo ažuriranje MESH uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo ažuriranje MESH uređaja",
        variant: "destructive"
      })
    }
  }

  // Handle delete mesh device
  const handleDeleteMeshDevice = async (deviceId: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj MESH uređaj?')) {
      return
    }

    try {
      const result = await deleteMeshDevice(deviceId)
      
      if (result.success) {
        toast({
          title: "Uspjeh",
          description: "MESH uređaj je uspješno obrisan"
        })
        fetchMeshDevices()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo brisanje MESH uređaja: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo brisanje MESH uređaja",
        variant: "destructive"
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (device: MagicMeshDevice) => {
    setEditingDevice(device)
    setFormData({
      price: device.price?.toString() || '',
      promo_price: device.promo_price?.toString() || '',
      regular_price: device.regular_price?.toString() || ''
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Upravljanje MESH Uređajima</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj MESH Uređaj
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj Novi MESH Uređaj</DialogTitle>
              <DialogDescription>
                Unesite cijene za novi MESH uređaj.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMeshDevice} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Osnovna cijena (EUR)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="npr. 65.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promo_price">Promotivna cijena (EUR)</Label>
                <Input
                  id="promo_price"
                  name="promo_price"
                  type="number"
                  step="0.01"
                  value={formData.promo_price}
                  onChange={handleInputChange}
                  placeholder="npr. 0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="regular_price">Redovna cijena (EUR)</Label>
                <Input
                  id="regular_price"
                  name="regular_price"
                  type="number"
                  step="0.01"
                  value={formData.regular_price}
                  onChange={handleInputChange}
                  placeholder="npr. 3.00"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">Dodaj MESH Uređaj</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista MESH Uređaja</CardTitle>
          <CardDescription>
            Upravljajte cijenama MESH uređaja koji su dostupni u ugovorima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="text-center py-8">Učitavanje MESH uređaja...</div>
          ) : meshDevices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nema dostupnih MESH uređaja. Dodajte prvi MESH uređaj klikom na "Dodaj MESH Uređaj".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Osnovna cijena (EUR)</TableHead>
                  <TableHead>Promotivna cijena (EUR)</TableHead>
                  <TableHead>Redovna cijena (EUR)</TableHead>
                  <TableHead>Datum kreiranja</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meshDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.id}</TableCell>
                    <TableCell>
                      {device.price ? device.price.toFixed(2) : 'Nije definirano'}
                    </TableCell>
                    <TableCell>
                      {device.promo_price ? device.promo_price.toFixed(2) : 'Nije definirano'}
                    </TableCell>
                    <TableCell>
                      {device.regular_price ? device.regular_price.toFixed(2) : 'Nije definirano'}
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
                          onClick={() => handleDeleteMeshDevice(device.id)}
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
            <DialogTitle>Uredi MESH Uređaj</DialogTitle>
            <DialogDescription>
              Uredite cijene MESH uređaja.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMeshDevice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_price">Osnovna cijena (EUR)</Label>
              <Input
                id="edit_price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="npr. 65.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_promo_price">Promotivna cijena (EUR)</Label>
              <Input
                id="edit_promo_price"
                name="promo_price"
                type="number"
                step="0.01"
                value={formData.promo_price}
                onChange={handleInputChange}
                placeholder="npr. 0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_regular_price">Redovna cijena (EUR)</Label>
              <Input
                id="edit_regular_price"
                name="regular_price"
                type="number"
                step="0.01"
                value={formData.regular_price}
                onChange={handleInputChange}
                placeholder="npr. 3.00"
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