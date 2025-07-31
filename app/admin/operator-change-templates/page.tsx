import { OperatorChangeTemplateEditor } from '@/components/operator-change-template-editor'
import { Suspense } from 'react'

export default async function OperatorChangeTemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Predložak za promjenu operatera</h1>
        <p className="text-gray-600 mt-2">
          Upravljajte HTML predloškom koji se koristi za generiranje dokumenata za promjenu operatera.
        </p>
      </div>
      
      <Suspense fallback={<div>Učitavanje predloška...</div>}>
        <OperatorChangeTemplateEditor />
      </Suspense>
    </div>
  )
} 