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

interface SendEmailPageProps {
  contractNumber?: string | null;
  serviceName?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  userInfo?: UserInformation;
}

// Email template definitions
const EMAIL_TEMPLATES = {
  template1: {
    name: "Predložak 1 - Mailom vlasniku",
    fields: ["Titula-Ime-Prezime", "Datum"],
    template: `Poštovani [Titula-Ime-Prezime],
nastavno na telefonski razgovor kojeg smo obavili dana [Datum] i prihvaćenu Magic NET ponudu, te s obzirom da smo tom prilikom dogovorili sklapanje ugovora na daljinu, dostavljamo Vam Sažetak ugovora i Obavijest o sklopljenom ugovoru.
U skladu s odredbama članka 9. Pravilnika o načinu i uvjetima obavljanja djelatnosti elektroničkih komunikacijskih mreža i usluga, ugovor se smatra sklopljenim na daljinu kada potvrdite svoju suglasnost za sklapanje istog. Svoju suglasnost za sklapanje ugovora možete dati na jedan od sljedećih načina:
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,
·         potpisom Obavijesti o sklopljenom ugovoru i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila i odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili
·         plaćanjem prvog mjesečnog računa.
 
S obzirom da ste se odlučili na sklapanje ugovora davanjem suglasnosti na dokumentaciju koju smo Vam poslali putem emaila te i dalje želite ponudu koju ste dogovorili putem telefona, molimo Vas da potpišete Obavijest o sklopljenom ugovoru u privitku ovog emaila, pošaljete presliku osobne iskaznice  i odgovorite kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte.
 
Budući ćete Ugovor sklopiti kanalima daljinske komunikacije i dalje zadržavate pravo, ne navodeći razloge, na raskid ugovora bez plaćanja naknade u roku 14 dana od dana davanja svoje suglasnosti na jedan od navedenih načina.
Više informacija o detaljima ponude možete pronaći u priloženoj dokumentaciji koja sadrži Sažetak ugovora i Obavijest o sklopljenom ugovoru. Uz to, u prilogu Vam šaljemo Opće uvjete poslovanja te aktualni cjenik.
Hvala Vam što ste se odlučili za naše usluge. U slučaju da imate bilo kakvo pitanje ili nedoumice uz sadržaj ugovorne dokumentacije, Usluga koje ugovarate ili samog postupka ugovaranja, dostupni smo za Vas na niže navedene kontakte.
 
Želimo Vam ugodan dan.
Vaš MAGIC NET
Srdačan pozdrav,
Matija Kučar
Marketing i prodaja
 
MAGIC NET d.o.o.
 
Sjedište:
Koprivnička 17c
42230 Ludbreg
Hrvatska
 
Tel:  +385 42 420 441
Mob: +385 95 309 2404

IZJAVA O ODRICANJU ODGOVORNOSTI Ova elektronička pošta može sadržavati povjerljive informacije i namijenjena je samo osobama na koje je naslovljena. Ukoliko Vi niste navedeni primatelj nije Vam dopušteno njen sadržaj koristiti, kopirati ili dalje prosljeđivati. Molimo Vas da ako ste greškom primili ovu elektroničku poštu o tome odmah obavijestite pošiljatelja i izbrišete ovu poruku.
 
DISCLAIMER This message may contain confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail-message by mistake and delete this e-mail-message from your system.
`
  },
  template2: {
    name: "Predložak 2 - Mailom vlasniku", 
    fields: ["Titula-Ime-Prezime", "Datum"],
    template: `Poštovani [Titula-Ime-Prezime],
nastavno na telefonski razgovor kojeg smo obavili dana [Datum] i prihvaćenu Magic NET ponudu, te s obzirom da smo tom prilikom dogovorili sklapanje ugovora na daljinu, dostavljamo Vam Sažetak ugovora i Obavijest o sklopljenom ugovoru te zahtjev za promjenu operatora.
U skladu s odredbama članka 9. Pravilnika o načinu i uvjetima obavljanja djelatnosti elektroničkih komunikacijskih mreža i usluga, ugovor se smatra sklopljenim na daljinu kada potvrdite svoju suglasnost za sklapanje istog. Svoju suglasnost za sklapanje ugovora možete dati na jedan od sljedećih načina:
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,
·         potpisom Obavijesti o sklopljenom ugovoru i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila i odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili
·         plaćanjem prvog mjesečnog računa.
 
S obzirom da ste se odlučili na sklapanje ugovora davanjem suglasnosti na dokumentaciju koju smo Vam poslali putem emaila te i dalje želite ponudu koju ste dogovorili putem telefona, molimo Vas da potpišete Obavijest o sklopljenom ugovoru u privitku ovog emaila, zahtjev za promjenu operatora, pošaljete presliku osobne iskaznice  i odgovorite kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte.
 
Budući ćete Ugovor sklopiti kanalima daljinske komunikacije i dalje zadržavate pravo, ne navodeći razloge, na raskid ugovora bez plaćanja naknade u roku 14 dana od dana davanja svoje suglasnosti na jedan od navedenih načina.
Više informacija o detaljima ponude možete pronaći u priloženoj dokumentaciji koja sadrži Sažetak ugovora i Obavijest o sklopljenom ugovoru. Uz to, u prilogu Vam šaljemo Opće uvjete poslovanja te aktualni cjenik.
Hvala Vam što ste se odlučili za naše usluge. U slučaju da imate bilo kakvo pitanje ili nedoumice uz sadržaj ugovorne dokumentacije, Usluga koje ugovarate ili samog postupka ugovaranja, dostupni smo za Vas na niže navedene kontakte.
 
Želimo Vam ugodan dan.
Vaš MAGIC NET
Srdačan pozdrav,
Matija Kučar
Marketing i prodaja
 
MAGIC NET d.o.o.
 
Sjedište:
Koprivnička 17c
42230 Ludbreg
Hrvatska
 
Tel:  +385 42 420 441
Mob: +385 95 309 2404
 

 
IZJAVA O ODRICANJU ODGOVORNOSTI Ova elektronička pošta može sadržavati povjerljive informacije i namijenjena je samo osobama na koje je naslovljena. Ukoliko Vi niste navedeni primatelj nije Vam dopušteno njen sadržaj koristiti, kopirati ili dalje prosljeđivati. Molimo Vas da ako ste greškom primili ovu elektroničku poštu o tome odmah obavijestite pošiljatelja i izbrišete ovu poruku.
 
DISCLAIMER This message may contain confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail-message by mistake and delete this e-mail-message from your system.
`
  },
  template3: {
    name: "Predložak 3 - Mailom kontakt osobi",
    fields: ["Kontakt-Osoba", "Datum", "Vlasnik-Ugovora", "Posvojni-Zamjenica"],
    template: `Poštovana [Kontakt-Osoba],
nastavno na telefonski razgovor kojeg smo obavili dana [Datum] i prihvaćenu Magic NET ponudu, te s obzirom da smo tom prilikom dogovorili sklapanje ugovora na daljinu, dostavljamo Vam Sažetak ugovora i Obavijest o sklopljenom ugovoru.
U skladu s odredbama članka 9. Pravilnika o načinu i uvjetima obavljanja djelatnosti elektroničkih komunikacijskih mreža i usluga, ugovor se smatra sklopljenim na daljinu kada potvrdite svoju suglasnost za sklapanje istog. Svoju suglasnost za sklapanje ugovora možete dati na jedan od sljedećih načina:
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,
·         potpisom Obavijesti o sklopljenom ugovoru i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila i odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili
·         plaćanjem prvog mjesečnog računa.
 
S obzirom da ste se odlučili na sklapanje ugovora davanjem suglasnosti na dokumentaciju koju smo Vam poslali putem emaila te i dalje želite ponudu koju ste dogovorili putem telefona, molimo Vas da g. [Vlasnik-Ugovora] potpiše Obavijest o sklopljenom ugovoru u privitku ovog emaila, pošaljete presliku [Posvojni-Zamjenica] osobne iskaznice  i odgovorite kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte.
 
Budući ćete Ugovor sklopiti kanalima daljinske komunikacije i dalje zadržavate pravo, ne navodeći razloge, na raskid ugovora bez plaćanja naknade u roku 14 dana od dana davanja svoje suglasnosti na jedan od navedenih načina.
Više informacija o detaljima ponude možete pronaći u priloženoj dokumentaciji koja sadrži Sažetak ugovora i Obavijest o sklopljenom ugovoru. Uz to, u prilogu Vam šaljemo Opće uvjete poslovanja te aktualni cjenik.
Hvala Vam što ste se odlučili za naše usluge. U slučaju da imate bilo kakvo pitanje ili nedoumice uz sadržaj ugovorne dokumentacije, Usluga koje ugovarate ili samog postupka ugovaranja, dostupni smo za Vas na niže navedene kontakte.
 
Želimo Vam ugodan dan.
Vaš MAGIC NET
Srdačan pozdrav,
Matija Kučar
Marketing i prodaja
 
MAGIC NET d.o.o.
 
Sjedište:
Koprivnička 17c
42230 Ludbreg
Hrvatska
 
Tel:  +385 42 420 441
Mob: +385 95 309 2404
 

 
IZJAVA O ODRICANJU ODGOVORNOSTI Ova elektronička pošta može sadržavati povjerljive informacije i namijenjena je samo osobama na koje je naslovljena. Ukoliko Vi niste navedeni primatelj nije Vam dopušteno njen sadržaj koristiti, kopirati ili dalje prosljeđivati. Molimo Vas da ako ste greškom primili ovu elektroničku poštu o tome odmah obavijestite pošiljatelja i izbrišete ovu poruku.
 
DISCLAIMER This message may contain confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail-message by mistake and delete this e-mail-message from your system.
`
  },
  template4: {
    name: "Predložak 4 - Mailom kontakt osobi",
    fields: ["Kontakt-Osoba", "Datum", "Vlasnik-Ugovora", "Posvojni-Zamjenica"],
    template: `Poštovana gđo. [Kontakt-Osoba],
nastavno na telefonski razgovor kojeg smo obavili dana [Datum] i prihvaćenu Magic NET ponudu, te s obzirom da smo tom prilikom dogovorili sklapanje ugovora na daljinu, dostavljamo Vam Sažetak ugovora i Obavijest o sklopljenom ugovoru te zahtjev za promjenu operatora.
U skladu s odredbama članka 9. Pravilnika o načinu i uvjetima obavljanja djelatnosti elektroničkih komunikacijskih mreža i usluga, ugovor se smatra sklopljenim na daljinu kada potvrdite svoju suglasnost za sklapanje istog. Svoju suglasnost za sklapanje ugovora možete dati na jedan od sljedećih načina:
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,
·         potpisom Obavijesti o sklopljenom ugovoru i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,
·         potpisom Obavijesti o sklopljenom ugovoru u privitku ovog emaila i odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili
·         plaćanjem prvog mjesečnog računa.
 
S obzirom da ste se odlučili na sklapanje ugovora davanjem suglasnosti na dokumentaciju koju smo Vam poslali putem emaila te i dalje želite ponudu koju ste dogovorili putem telefona, molimo Vas da g. [Vlasnik-Ugovora] potpiše Obavijest o sklopljenom ugovoru u privitku ovog emaila, zahtjev za promjenu operatora, pošaljete presliku [Posvojni-Zamjenica] osobne iskaznice  i odgovorite kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte.
 
Budući ćete Ugovor sklopiti kanalima daljinske komunikacije i dalje zadržavate pravo, ne navodeći razloge, na raskid ugovora bez plaćanja naknade u roku 14 dana od dana davanja svoje suglasnosti na jedan od navedenih načina.
Više informacija o detaljima ponude možete pronaći u priloženoj dokumentaciji koja sadrži Sažetak ugovora i Obavijest o sklopljenom ugovoru. Uz to, u prilogu Vam šaljemo Opće uvjete poslovanja te aktualni cjenik.
Hvala Vam što ste se odlučili za naše usluge. U slučaju da imate bilo kakvo pitanje ili nedoumice uz sadržaj ugovorne dokumentacije, Usluga koje ugovarate ili samog postupka ugovaranja, dostupni smo za Vas na niže navedene kontakte.
 
Želimo Vam ugodan dan.
Vaš MAGIC NET
Srdačan pozdrav,
Matija Kučar
Marketing i prodaja
 
MAGIC NET d.o.o.
 
Sjedište:
Koprivnička 17c
42230 Ludbreg
Hrvatska
 
Tel:  +385 42 420 441
Mob: +385 95 309 2404
 

 
IZJAVA O ODRICANJU ODGOVORNOSTI Ova elektronička pošta može sadržavati povjerljive informacije i namijenjena je samo osobama na koje je naslovljena. Ukoliko Vi niste navedeni primatelj nije Vam dopušteno njen sadržaj koristiti, kopirati ili dalje prosljeđivati. Molimo Vas da ako ste greškom primili ovu elektroničku poštu o tome odmah obavijestite pošiljatelja i izbrišete ovu poruku.
 
DISCLAIMER This message may contain confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail-message by mistake and delete this e-mail-message from your system.

`
  }
}

export default function SendEmailPage({ 
  contractNumber,
  serviceName,
  recipientEmail,
  recipientName,
  userInfo 
}: SendEmailPageProps) {
  const [subject, setSubject] = useState("")
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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

  // Auto-populate template based on invoice delivery method
  useEffect(() => {
    if (userInfo && userInfo.invoiceDeliveryMethod) {
      const deliveryMethod = userInfo.invoiceDeliveryMethod;
      
      // Check for contactEmail first (more specific)
      if (deliveryMethod.includes('contactEmail')) {
        // "Mailom kontakt osobi" - use template3
        setSelectedTemplate('template3');
        const contactPersonTitleName = `${userInfo.contactPersonTitle || 'g.'} ${userInfo.contactPersonName}`;
        const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`;
        const possessivePronoun = userInfo.userTitle === 'gđa.' ? 'njezine' : 'njegove';
        
        setTemplateFields({
          "Kontakt-Osoba": contactPersonTitleName,
          "Datum": '', // Leave empty for user to input
          "Vlasnik-Ugovora": userTitleName,
          "Posvojni-Zamjenica": possessivePronoun
        });
        
        // Set recipient to contact person's email
        if (userInfo.contactPersonEmail) {
          setRecipient(userInfo.contactPersonEmail);
        }
      } else if (deliveryMethod.includes('email')) {
        // "Mailom vlasniku" - use template1
        setSelectedTemplate('template1');
        const userTitleName = `${userInfo.userTitle || 'g.'} ${userInfo.userName}`;
        setTemplateFields({
          "Titula-Ime-Prezime": userTitleName,
          "Datum": '' // Leave empty for user to input
        });
        
        // Set recipient to user's email
        if (userInfo.email) {
          setRecipient(userInfo.email);
        }
      }
    }
  }, [userInfo]);

  // Handle template selection
  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES]) {
      const template = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES];
      setMessage(template.template);
      
      // Reset template fields
      const initialFields: Record<string, string> = {};
      template.fields.forEach(field => {
        initialFields[field] = '';
      });
      setTemplateFields(initialFields);
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
    if (selectedTemplate && EMAIL_TEMPLATES[selectedTemplate as keyof typeof EMAIL_TEMPLATES]) {
      let updatedMessage = EMAIL_TEMPLATES[selectedTemplate as keyof typeof EMAIL_TEMPLATES].template;
      
      // Replace placeholders with actual values
      Object.entries(templateFields).forEach(([field, value]) => {
        updatedMessage = updatedMessage.replace(new RegExp(`\\[${field}\\]`, 'g'), value);
      });
      
      setMessage(updatedMessage);
    }
  }, [templateFields, selectedTemplate]);

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
    
    try {
      // Create FormData for file uploads
      const formData = new FormData()
      
      // First convert files to Base64 strings
      const filePromises = attachments.map(async (file) => {
        return new Promise<{name: string, content: string}>((resolve) => {
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

      toast({
        title: "Uspjeh!",
        description: `Email je uspješno poslan${attachments.length ? ' s prilozima' : ''}.`,
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
                    {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Fields */}
              {selectedTemplate && EMAIL_TEMPLATES[selectedTemplate as keyof typeof EMAIL_TEMPLATES] && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-semibold">Podaci za predložak:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EMAIL_TEMPLATES[selectedTemplate as keyof typeof EMAIL_TEMPLATES].fields.map((field) => (
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