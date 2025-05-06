import { PdfTemplateEditor } from '@/components/pdf-template-editor'
import { Suspense } from 'react'

export default async function TemplatesPage() {
  // const templates = await getTemplates()
  
  return (
    <div className="container mx-auto py-6">
      
      <Suspense fallback={<div>Loading templates...</div>}>
        <PdfTemplateEditor 
          // initialTemplates={templates} 
          // onSave={saveTemplates} 
        />
      </Suspense>
    </div>
  )
} 