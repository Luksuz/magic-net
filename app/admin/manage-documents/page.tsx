'use client'

import { useAuth } from '../../contexts/authContext'
import { redirect } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Download, Upload, FileText, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getDocuments, uploadDocument, deleteDocument, getDocumentUrl, downloadDocument } from '@/lib/supabase'

interface DocumentFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

export default function ManageDocumentsPage() {
  const { isAdmin, loading } = useAuth()
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents
  const fetchDocuments = async () => {
    setDocumentsLoading(true)
    try {
      const result = await getDocuments()
      if (result.success) {
        setDocuments(result.data)
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo dohvaćanje dokumenata: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo dohvaćanje dokumenata",
        variant: "destructive"
      })
    } finally {
      setDocumentsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  // Show loading state
  if (loading) {
    return <div className="container mx-auto py-10 text-center">Učitavanje...</div>
  }
  
  // Redirect if not admin
  if (!isAdmin) {
    redirect('/')
  }

  // Handle file processing
  const processFiles = async (files: FileList | File[]) => {
    setUploading(true)
    
    try {
      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Greška",
            description: `Datoteka ${file.name} je prevelika. Maksimalna veličina je 10MB.`,
            variant: "destructive"
          })
          continue
        }

        const result = await uploadDocument(file)
        
        if (!result.success) {
          toast({
            title: "Greška",
            description: `Neuspjelo učitavanje datoteke ${file.name}: ${result.error}`,
            variant: "destructive"
          })
        }
      }
      
      toast({
        title: "Uspjeh",
        description: "Dokumenti su uspješno učitani"
      })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh documents list
      fetchDocuments()
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo učitavanje dokumenata",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    await processFiles(files)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFiles(files)
    }
  }

  // Handle click to upload
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle document deletion
  const handleDeleteDocument = async (fileName: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati dokument "${fileName}"?`)) {
      return
    }

    try {
      const result = await deleteDocument(fileName)
      
      if (result.success) {
        toast({
          title: "Uspjeh",
          description: "Dokument je uspješno obrisan"
        })
        fetchDocuments()
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo brisanje dokumenta: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo brisanje dokumenta",
        variant: "destructive"
      })
    }
  }

  // Handle document download
  const handleDownloadDocument = async (fileName: string) => {
    try {
      const result = await downloadDocument(fileName)
      
      if (result.success && result.data) {
        // Create blob URL and trigger download
        const blob = result.data
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        toast({
          title: "Greška",
          description: "Neuspjelo preuzimanje dokumenta: " + result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Neuspjelo preuzimanje dokumenta",
        variant: "destructive"
      })
    }
  }

  // Handle document preview
  const handlePreviewDocument = (fileName: string) => {
    const url = getDocumentUrl(fileName)
    window.open(url, '_blank')
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on mimetype
  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('image')) return '🖼️'
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝'
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊'
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📈'
    return '📁'
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Upravljanje Dokumentima</h1>
          <p className="text-muted-foreground mt-2">
            Upravljajte dokumentima koji se automatski priložuju uz svaki email
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          />
          <Button 
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Učitavanje...' : 'Učitaj Dokumente'}
          </Button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-12">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Povucite i ispustite datoteke ovdje
            </h3>
            <p className="text-muted-foreground mb-4">
              ili kliknite gumb "Učitaj Dokumente" za odabir datoteka
            </p>
            <p className="text-sm text-muted-foreground">
              Podržani formati: PDF, Word, Excel, PowerPoint, slike • Maks. 10MB po datoteci
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista Dokumenata</CardTitle>
          <CardDescription>
            Ovi dokumenti će se automatski priložiti uz svaki email koji se šalje iz sustava.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="text-center py-8">Učitavanje dokumenata...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nema učitanih dokumenata.</p>
              <p className="text-sm">Učitajte prvi dokument klikom na "Učitaj Dokumente".</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Veličina</TableHead>
                  <TableHead>Datum učitavanja</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFileIcon(doc.metadata?.mimetype || 'application/octet-stream')}</span>
                        <span>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.metadata?.mimetype || 'Nepoznato'}</TableCell>
                    <TableCell>{formatFileSize(doc.metadata?.size || 0)}</TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewDocument(doc.name)}
                          title="Pregled"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.name)}
                          title="Preuzmi"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.name)}
                          title="Obriši"
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

      <Card>
        <CardHeader>
          <CardTitle>Informacije</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Maksimalna veličina datoteke: 10MB
          </p>
          <p className="text-sm text-muted-foreground">
            • Podržani formati: PDF, Word, Excel, PowerPoint, slike (JPG, PNG, GIF), tekstualne datoteke
          </p>
          <p className="text-sm text-muted-foreground">
            • Svi učitani dokumenti će se automatski priložiti uz svaki email koji se šalje iz sustava
          </p>
          <p className="text-sm text-muted-foreground">
            • Dokumenti se čuvaju sigurno u Supabase Storage
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 