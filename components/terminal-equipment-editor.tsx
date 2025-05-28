"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { TerminalEquipment } from "@/lib/pdf-generator"

interface TerminalEquipmentEditorProps {
  equipment: TerminalEquipment[]
  onChange: (equipment: TerminalEquipment[]) => void
  isOpen: boolean
  onClose: () => void
}

// Helper function to generate unique IDs
function generateId(): number {
  return Date.now() + Math.random()
}

export default function TerminalEquipmentEditor({
  equipment,
  onChange,
  isOpen,
  onClose
}: TerminalEquipmentEditorProps) {
  const [localEquipment, setLocalEquipment] = useState<TerminalEquipment[]>(equipment)

  useEffect(() => {
    setLocalEquipment(equipment)
  }, [equipment])

  if (!isOpen) return null

  const handleEquipmentChange = (id: number, field: keyof TerminalEquipment, value: string) => {
    const updatedEquipment = localEquipment.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
    setLocalEquipment(updatedEquipment)
  }

  const addEquipmentItem = () => {
    const newItem: TerminalEquipment = {
      id: generateId(),
      name: "",
      quantity: "1",
      price: "0,00"
    }
    setLocalEquipment([...localEquipment, newItem])
  }

  const removeEquipmentItem = (id: number) => {
    setLocalEquipment(localEquipment.filter(item => item.id !== id))
  }

  const handleSave = () => {
    // Filter out items with empty names
    const validEquipment = localEquipment.filter(item => item.name.trim() !== "")
    onChange(validEquipment)
    onClose()
  }

  const handleCancel = () => {
    // Reset to original equipment
    setLocalEquipment(equipment)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>Uredi terminalnu opremu</span>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Dodajte ili uredite terminalnu opremu za ovaj ugovor. Promjene će se primijeniti samo na trenutni PDF.
              </p>
              
              {localEquipment.map((item) => (
                <div key={item.id} className="flex items-end space-x-2 p-4 border rounded-md bg-gray-50">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name_${item.id}`}>Naziv opreme</Label>
                      <Input
                        id={`name_${item.id}`}
                        value={item.name}
                        onChange={(e) => handleEquipmentChange(item.id, 'name', e.target.value)}
                        placeholder="npr. WiFi router, MESH uređaj"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity_${item.id}`}>Količina</Label>
                      <Input
                        id={`quantity_${item.id}`}
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleEquipmentChange(item.id, 'quantity', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price_${item.id}`}>Cijena (EUR)</Label>
                      <Input
                        id={`price_${item.id}`}
                        value={item.price}
                        onChange={(e) => handleEquipmentChange(item.id, 'price', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEquipmentItem(item.id)}
                    className="text-red-500 hover:text-red-700 self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addEquipmentItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj opremu
              </Button>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Odustani
              </Button>
              <Button onClick={handleSave}>
                Spremi promjene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 