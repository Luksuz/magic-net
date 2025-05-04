import { getTemplates, saveTemplates } from '@/lib/template-service'
import { PdfTemplateEditor } from '@/components/pdf-template-editor'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TemplatesPage() {
  // const templates = await getTemplates()
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">PDF Templates</h1>
      
      <Suspense fallback={<div>Loading templates...</div>}>
        <PdfTemplateEditor 
          // initialTemplates={templates} 
          // onSave={saveTemplates} 
        />
      </Suspense>
    </div>
  )
} 