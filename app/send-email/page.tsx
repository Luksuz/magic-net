"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { FileText, X, Paperclip, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendEmail } from "@/lib/sendEmail"

export default function SendEmailPage() {
  const [subject, setSubject] = useState("")
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    sendEmail(recipient, subject, message, attachments)
    
    setIsSending(true)
    
    try {
      // Here you would implement your email sending logic with attachments
      // For now, we'll just simulate a delay and log the attachments
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log("Would send email with attachments:", attachments)
      
      toast({
        title: "Uspjeh!",
        description: `Email je uspješno poslan${attachments.length ? ' s prilozima' : ''}.`,
      })
      
      // Reset form
      setSubject("")
      setRecipient("")
      setMessage("")
      setAttachments([])
    } catch (error) {
      toast({
        title: "Greška",
        description: "Nije uspjelo slanje emaila. Molimo pokušajte ponovno.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and append to existing attachments
      const newFiles = Array.from(e.target.files)
      addNewFiles(newFiles)
      
      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }
  
  const addNewFiles = (files: File[]) => {
    // Check for duplicate files by name
    const newFiles = files.filter(file => 
      !attachments.some(existingFile => existingFile.name === file.name)
    )
    
    if (newFiles.length > 0) {
      setAttachments(prev => [...prev, ...newFiles])
    }
    
    if (newFiles.length !== files.length) {
      toast({
        title: "Napomena",
        description: "Neke datoteke su već dodane i preskočene.",
      })
    }
  }
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }
  
  // Calculate total size of attachments
  const totalSize = attachments.reduce((total, file) => total + file.size, 0)
  const formattedTotalSize = formatFileSize(totalSize)
  
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i]
  }
  
  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set isDragging to false if we're leaving the dropzone and not entering a child element
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      addNewFiles(newFiles)
    }
  }, [attachments])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Slanje Email Poruke</h1>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nova Email Poruka</CardTitle>
            <CardDescription>Pošaljite email korisniku ili prodajnom timu</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Primatelj</Label>
                <Input 
                  id="recipient" 
                  type="email" 
                  placeholder="email@example.com" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Predmet</Label>
                <Input 
                  id="subject" 
                  placeholder="Unesite predmet poruke" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Poruka</Label>
                <Textarea 
                  id="message" 
                  placeholder="Unesite tekst poruke..." 
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              
              {/* File attachments section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="attachments">Prilozi</Label>
                  {attachments.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Ukupno: {attachments.length} {attachments.length === 1 ? 'datoteka' : 'datoteka'} ({formattedTotalSize})
                    </span>
                  )}
                </div>
                
                <div 
                  ref={dropZoneRef}
                  className={cn(
                    "border border-dashed rounded-md p-2 min-h-[100px] relative transition-colors duration-200",
                    isDragging ? "border-primary bg-primary/5" : "border-input"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {attachments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                      {isDragging ? (
                        <>
                          <Upload className="h-8 w-8 mb-2 text-primary animate-pulse" />
                          <p className="text-sm text-center">Ispustite datoteke ovdje za prijenos</p>
                        </>
                      ) : (
                        <>
                          <Paperclip className="h-6 w-6 mb-2" />
                          <p className="text-sm text-center">Povucite datoteke ovdje ili kliknite za odabir</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {attachments.map((file, index) => (
                        <li 
                          key={`${file.name}-${index}`} 
                          className="flex items-center justify-between bg-accent/50 rounded-md p-2"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="mt-2 flex justify-end">
                    <Input
                      id="attachments"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "text-xs",
                        attachments.length > 0 ? "w-auto" : "w-full"
                      )}
                    >
                      <Paperclip className="h-3.5 w-3.5 mr-1" />
                      Dodaj prilog
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSending}
              >
                {isSending ? "Slanje..." : "Pošalji Email"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 