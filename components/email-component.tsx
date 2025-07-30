"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { FileText, X, Paperclip, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserInformation } from "@/components/user-information-form"
import { getEmailTemplates, findMatchingEmailTemplate, type MagicEmailTemplate, getDocuments, downloadDocument } from "@/lib/supabase"
import { useAuth } from "@/app/contexts/authContext"

interface SendEmailPageProps {
  contractNumber?: string | null;
  serviceName?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  userInfo?: UserInformation;
  accessMethod?: string | null;
  onComponentReady?: (addAttachment: (file: File) => void) => void;
}

interface AdditionalDocument {
  name: string;
  file: File;
}


export default function SendEmailPage({
  contractNumber,
  serviceName,
  recipientEmail,
  recipientName,
  userInfo,
  accessMethod,
  onComponentReady
}: SendEmailPageProps) {
  const { profile } = useAuth()
  const [subject, setSubject] = useState("")
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  

  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [additionalDocuments, setAdditionalDocuments] = useState<AdditionalDocument[]>([])
  const [additionalDocsLoading, setAdditionalDocsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({})
  const [emailTemplates, setEmailTemplates] = useState<MagicEmailTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Fetch email templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await getEmailTemplates()
        if (result.success) {
          setEmailTemplates(result.data)
        } else {
          console.error("Error fetching email templates:", result.error)
          toast({
            title: "Greška",
            description: "Nije moguće dohvatiti email predloške.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching email templates:", error)
      } finally {
        setTemplatesLoading(false)
      }
    }
    
    fetchTemplates()
  }, [])

  // Fetch additional documents that will be automatically attached
  useEffect(() => {
    const fetchAdditionalDocuments = async () => {
      try {
        const documentsResult = await getDocuments()
        if (documentsResult.success && documentsResult.data.length > 0) {
          const documents: AdditionalDocument[] = []
          
          for (const doc of documentsResult.data) {
            try {
              const downloadResult = await downloadDocument(doc.name)
              if (downloadResult.success && downloadResult.data) {
                // Convert blob to File object
                const file = new File([downloadResult.data], doc.name, {
                  type: doc.metadata?.mimetype || 'application/octet-stream'
                })
                documents.push({ name: doc.name, file })
              }
            } catch (docError) {
              console.warn(`Failed to download document ${doc.name}:`, docError)
              // Continue with other documents even if one fails
            }
          }
          
          setAdditionalDocuments(documents)
        }
      } catch (error) {
        console.warn("Failed to fetch additional documents:", error)
      } finally {
        setAdditionalDocsLoading(false)
      }
    }
    
    fetchAdditionalDocuments()
  }, [])

  // Auto-select template based on user conditions
  useEffect(() => {
    if (userInfo && emailTemplates.length > 0) {
      const userConditions = {
        invoiceDeliveryMethod: userInfo.invoiceDeliveryMethod ? [userInfo.invoiceDeliveryMethod] : [],
        changeOperator: userInfo.changeOperator || false,
        accessMethod: accessMethod || undefined
      }

      const matchingTemplate = findMatchingEmailTemplate(userConditions, emailTemplates)
      
      if (matchingTemplate && selectedTemplate !== matchingTemplate.id.toString()) {
        handleTemplateChange(matchingTemplate.id.toString())
        
        // Auto-populate specific fields based on delivery method
        if (userInfo.invoiceDeliveryMethod === 'contactEmail') {
          // "Mailom kontakt osobi" 
          const contactPersonTitleName = `${userInfo.contactPersonTitle || 'g.'} ${userInfo.contactPersonName}`
          const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`
          const possessivePronoun = userInfo.userTitle === 'gđa.' ? 'njezine' : 'njegove'

          setTemplateFields({
            "Kontakt-Osoba": contactPersonTitleName,
            "Datum": '', // Leave empty for user to input
            "Vlasnik-Ugovora": userTitleName,
            "Posvojni-Zamjenica": possessivePronoun
          })

          // Set recipient to contact person's email
          if (userInfo.contactPersonEmail) {
            setRecipient(userInfo.contactPersonEmail)
          }
        } else if (userInfo.invoiceDeliveryMethod === 'email') {
          // "Mailom vlasniku"
          const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`
          setTemplateFields({
            "Titula-Ime-Prezime": userTitleName,
            "Datum": '' // Leave empty for user to input
          })

          // Set recipient to user's email
          if (userInfo.email) {
            setRecipient(userInfo.email)
          }
        }
      }
    }
  }, [userInfo?.invoiceDeliveryMethod, userInfo?.changeOperator, accessMethod, emailTemplates])

  // Update template fields when user title changes
  useEffect(() => {
    if (selectedTemplate && userInfo) {
      if (userInfo.invoiceDeliveryMethod === 'contactEmail') {
        const contactPersonTitleName = `${userInfo.contactPersonTitle || 'g.'} ${userInfo.contactPersonName}`
        const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`
        const possessivePronoun = userInfo.userTitle === 'gđa.' ? 'njezine' : 'njegove'

        setTemplateFields(prev => ({
          ...prev,
          "Kontakt-Osoba": contactPersonTitleName,
          "Vlasnik-Ugovora": userTitleName,
          "Posvojni-Zamjenica": possessivePronoun
        }))
      } else if (userInfo.invoiceDeliveryMethod === 'email') {
        const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`
        setTemplateFields(prev => ({
          ...prev,
          "Titula-Ime-Prezime": userTitleName
        }))
      }
    }
  }, [userInfo?.userTitle, userInfo?.userName, userInfo?.contactPersonTitle, userInfo?.contactPersonName, selectedTemplate])

  // Expose addAttachment function to parent component
  useEffect(() => {
    if (onComponentReady) {
      const addAttachment = (file: File) => {
        console.log("DEBUG: addAttachment called with file:", file.name, "Current timestamp:", Date.now())
        // Check for duplicate files by name
        setAttachments(prev => {
          console.log("DEBUG: setAttachments callback running, current attachments count:", prev.length)
          const isDuplicate = prev.some(existingFile => existingFile.name === file.name)
          if (!isDuplicate) {
            console.log("DEBUG: File is new, adding to attachments and showing toast")
            // Schedule toast to run after state update
            setTimeout(() => {
              toast({
                title: "📎 Prilog automatski dodan",
                description: `PDF ugovor "${file.name}" je automatski dodan u priloge.`,
                duration: 3000,
              })
            }, 0)
            return [...prev, file]
          } else {
            console.log("DEBUG: File already exists, skipping duplicate")
            return prev
          }
        })
      }
      console.log("DEBUG: Registering addAttachment function with parent")
      onComponentReady(addAttachment)
    }
  }, []) // Empty dependency array - only run once on mount

  useEffect(() => {
    if (recipientEmail) {
      setRecipient(recipientEmail);
    }
    if (contractNumber) {
      // Remove "UG" prefix if it exists and format as ime-prezime-broj ugovora
      const cleanContractNumber = contractNumber.replace(/^UG\s*/, '');
      if (recipientName) {
        setSubject(`${recipientName} - Aktivacija usluge`);
      } else {
        setSubject(cleanContractNumber);
      }
    }
  }, [contractNumber, serviceName, recipientEmail, recipientName]);



  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = emailTemplates.find(t => t.id.toString() === templateId);
      if (template && template.content) {
        setMessage(template.content);
        
        // Extract placeholders from template content
        const placeholderRegex = /\[([^\]]+)\]/g;
        const placeholders = Array.from(template.content.matchAll(placeholderRegex), match => match[1]);
        
        // Auto-populated placeholders that should not be included in templateFields
        const autoPopulatedPlaceholders = ['Tel', 'Mob', 'Operater-Ime'];
        
        const initialFields: Record<string, string> = {};
        placeholders.forEach(placeholder => {
          // Only add placeholders that are NOT auto-populated
          if (!autoPopulatedPlaceholders.includes(placeholder)) {
            initialFields[placeholder] = '';
          }
      });
      setTemplateFields(initialFields);
      }
    } else {
      setMessage("");
      setTemplateFields({});
    }
  };

  // Handle template field changes
  const handleTemplateFieldChange = (fieldName: string, value: string) => {
    setTemplateFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Update message when template fields change
  useEffect(() => {
    if (selectedTemplate && emailTemplates.length > 0) {
      const template = emailTemplates.find(t => t.id.toString() === selectedTemplate);
      if (template && template.content) {
        let updatedMessage = template.content;

        // Replace user-entered placeholders with actual values
      Object.entries(templateFields).forEach(([field, value]) => {
        updatedMessage = updatedMessage.replace(new RegExp(`\\[${field}\\]`, 'g'), value);
      });

        // Auto-populate Tel:, Mob:, and Operater-Ime placeholders from profile
        if (profile) {
          // Replace [Tel] with profile telephone_number
          if (profile.telephone_number) {
            updatedMessage = updatedMessage.replace(/\[Tel\]/g, profile.telephone_number);
          }
          
          // Replace [Mob] with profile phone_number  
          if (profile.phone_number) {
            updatedMessage = updatedMessage.replace(/\[Mob\]/g, profile.phone_number);
          }
          
          // Replace [Operater-Ime] with profile full_name
          if (profile.full_name) {
            updatedMessage = updatedMessage.replace(/\[Operater-Ime\]/g, profile.full_name);
          }
        }

      setMessage(updatedMessage);
      }
    }
  }, [templateFields, selectedTemplate, emailTemplates, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form fields
    if (!recipient.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite email primatelja.",
        variant: "destructive"
      })
      return
    }

    if (!subject.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite predmet poruke.",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)

    // Show starting toast
    toast({
      title: "📤 Šalje se email...",
      description: "Molimo pričekajte dok se email obrađuje i šalje.",
      duration: 3000,
    })

    try {
      // Create FormData for file uploads
      const formData = new FormData()

      // Combine user attachments with additional documents
      const allAttachments = [...attachments, ...additionalDocuments.map(doc => doc.file)]

      // First convert files to Base64 strings
      const filePromises = allAttachments.map(async (file) => {
        return new Promise<{ name: string, content: string }>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              name: file.name,
              content: reader.result as string
            })
          }
          reader.readAsDataURL(file)
        })
      })

      // Wait for all files to be converted
      const fileContents = await Promise.all(filePromises)

      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          subject,
          message,
          attachments: fileContents.map(file => ({
            name: file.name,
            url: file.content, // Send Base64 string instead of URL
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const responseData = await response.json()

      const totalAttachments = attachments.length + additionalDocuments.length
      toast({
        title: "📧 Email uspješno poslan!",
        description: `Poruka je poslana na ${recipient}${totalAttachments > 0 ? ` s ${totalAttachments} prilogom(a)` : ''}.`,
        duration: 5000,
      })

      // Reset form
      setSubject("")
      setRecipient("")
      setMessage("")
      setAttachments([])
      setSelectedTemplate("")
      setTemplateFields({})
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Nije uspjelo slanje emaila. Molimo pokušajte ponovno.",
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

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Odaberite predložak</Label>
                <Select onValueChange={handleTemplateChange} value={selectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite predložak poruke" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesLoading ? (
                      <SelectItem value="loading" disabled>Učitavanje predložaka...</SelectItem>
                    ) : (
                      emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Fields */}
              {selectedTemplate && Object.keys(templateFields).length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-semibold">Podaci za predložak:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(templateFields).map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="text-sm">
                          {field}
                        </Label>
                        <Input
                          id={field}
                          value={templateFields[field] || ''}
                          onChange={(e) => handleTemplateFieldChange(field, e.target.value)}
                          placeholder={`Unesite ${field.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                <Label>Prilozi</Label>
                <div
                  ref={dropZoneRef}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const files = Array.from(e.dataTransfer.files)
                    addNewFiles(files)
                  }}
                >
                  <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Povucite datoteke ovdje ili kliknite za odabir
                  </p>
                  <p className="text-xs text-gray-500">
                    Podržani formati: PDF, DOC, DOCX, JPG, PNG (maks. 25MB ukupno)
                  </p>

                  {attachments.length > 0 && (
                    <div className="mt-4 text-left">
                      <p className="text-sm font-semibold mb-2">Dodane datoteke ({formattedTotalSize}):</p>
                      <ul className="space-y-1">
                        {attachments.map((file, index) => (
                          <li key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{file.name}</span>
                              <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional documents section */}
                  {additionalDocuments.length > 0 && (
                    <div className="mt-4 text-left">
                      <p className="text-sm font-semibold mb-2 text-blue-600">
                        Dodatne datoteke (automatski dodane):
                      </p>
                      <ul className="space-y-1">
                        {additionalDocuments.map((doc, index) => (
                          <li key={index} className="flex items-center text-sm bg-blue-50 p-2 rounded border border-blue-200">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-700">{doc.name}</span>
                              <span className="text-xs text-blue-500">({formatFileSize(doc.file.size)})</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-blue-600 mt-2">
                        Ove datoteke su automatski dodane od strane administratora i bit će uključene u email.
                      </p>
                    </div>
                  )}

                  {additionalDocsLoading && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">Učitavam dodatne datoteke...</p>
                    </div>
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