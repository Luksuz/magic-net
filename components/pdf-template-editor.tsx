'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { ContractData } from '@/lib/supabase'
import { UserInformation } from '@/components/user-information-form'
import { TerminalEquipment } from '@/lib/pdf-generator'
import { getEditableTemplate, saveEditableTemplate, getOriginalTemplate, resetToOriginalTemplate } from '@/lib/template-service'



interface PdfTemplateEditorProps {
  initialFullTemplate: string
  onSave: (fullTemplate: string) => Promise<void>
}

  // --- Default Style Options (Hardcoded) ---
  export const options = {
    theme: "classic",
    primaryColor: "#1a3c5e",
    secondaryColor: "#f2f2f2",
    fontFamily: "Arial",
    fontSize: 11,
    showLogo: true,
    logoPosition: "right", // 'left', 'center', 'right'
    showPageNumbers: true,
    showHeaderOnAllPages: true, // This might not be fully applicable without page context
    tableStyle: "bordered", // 'bordered', 'striped', 'minimal'
    pageSize: "a4", // Not directly applicable in HTML preview
    orientation: "portrait", // Not directly applicable in HTML preview
    margins: 10, // Not directly applicable in HTML preview
  };


export function PdfTemplateEditor() { // ({ initialFullTemplate, onSave }: PdfTemplateEditorProps) {


  const [fullTemplate, setFullTemplate] = useState<string>('')
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [editMode, setEditMode] = useState<'html' | 'visual'>('visual')
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorCss, setEditorCss] = useState<string>('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)




  useEffect(() => {
    const baseStyles = `
      .editable-container {
        min-height: 300px;
        outline: none;
      }
      .editable-container:focus {
        box-shadow: 0 0 0 2px rgba(26, 60, 94, 0.2);
      }
      /* Add other base editor styles */
    `
    
    // Create an async function inside useEffect to fetch the template
    const fetchTemplate = async () => {
      try {
        const templateData = await getEditableTemplate();
        // Set the template HTML
        if (templateData && templateData.html) {
          setFullTemplate(templateData.html);
        } else {
          // Fallback to empty template
          setFullTemplate('');
        }
      } catch (error) {
        console.error('Failed to fetch template:', error);
        // Fallback to empty template
        setFullTemplate('');
      }
    };
    
    // Call the async function
    fetchTemplate();
    
    // Since the CSS is embedded in the HTML now, we only need the base styles
    setEditorCss(baseStyles);
    
  }, []);

  const handleTemplateChange = (value: string) => {
    setFullTemplate(value)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save the template to the server
      await saveEditableTemplate(fullTemplate);
      
      toast({
        title: 'Success',
        description: 'Template saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const processTemplateForPreview = (template: string) => {
    if (!template) return ''

    // Preserve the style tag if present - using a more flexible pattern to match style tags
    let styleTag = ''
    const styleMatch = template.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i)
    if (styleMatch) {
      styleTag = styleMatch[0]
      // Remove the style tag from the template for processing
      template = template.replace(styleTag, '')
    }

    // If the template is a full HTML with pdf-container, extract the inner content
    const containerMatch = template.match(/<div class="pdf-content">([\s\S]*?)<\/div><!-- End pdf-content -->/)
    if (containerMatch && containerMatch[1]) {
      template = containerMatch[1]
    } else {
      // Try another pattern if the first one doesn't match
      const containerMatch2 = template.match(/<div class="pdf-content">([\s\S]*)<\/div>\s*<\/div>/)
      if (containerMatch2 && containerMatch2[1]) {
        template = containerMatch2[1]
      }
    }

    let processed = template
    
    // In preview mode, we just keep the placeholders as they are
    // We don't have mock data to replace them with
    
    // Reapply the style tag if it was present
    if (styleTag) {
      processed = styleTag + processed
    }

    return processed
  }

  const convertToTemplate = (html: string) => {
    if (!html) return ''

    // Extract style tag if present to preserve it
    let styleTag = ''
    const styleMatch = html.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i)
    if (styleMatch) {
      styleTag = styleMatch[0]
      // Remove style tag temporarily for proper processing
      html = html.replace(styleTag, '')
    }
    
    // Create a template with proper structure
    let template = html
    
    template = styleTag + template
    
    // Preserve any existing handlebars syntax and placeholders
    // We're not trying to convert content to template variables anymore
    // as we don't have mock data to compare against
    
    return template
  }

  const handleEditorChange = () => {
    if (editorRef.current && editMode === 'visual') {
      const html = editorRef.current.innerHTML
      const template = convertToTemplate(html)
      setFullTemplate(template)
    }
  }

  const toggleEditMode = () => {
    setEditMode(prev => {
      if (prev === 'visual' && editorRef.current) {
        const html = editorRef.current.innerHTML
        const template = convertToTemplate(html)
        setFullTemplate(template)
      }
      return prev === 'html' ? 'visual' : 'html'
    })
  }

  const handleReset = async () => {
    try {
      setIsResetting(true);
      
      // Reset the template in the database
      await resetToOriginalTemplate();
      
      // Get the original template to update the editor
      const originalTemplate = await getOriginalTemplate();
      setFullTemplate(originalTemplate.html);
      
      toast({
        title: 'Success',
        description: 'Template reset to original version',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset to original template',
        variant: 'destructive',
      });
      console.error('Failed to reset to original template:', error);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit PDF Template</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleEditMode}>
            {editMode === 'html' ? 'Visual Editor' : 'HTML Editor'}
          </Button>
          
          <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="secondary" 
                disabled={isSaving || isResetting}
                title="Reset to the original template"
                className="ml-auto"
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Template</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the template to the original version. Any unsaved changes will be lost. 
                  Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isResetting}
            className="ml-2"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editMode === 'html' ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-slate-500">
                {`Edit the full HTML template. Use placeholder variables within square brackets like [USER_NAME], [FIKSNI_PAKET], etc.`}
              </p>
              <Textarea
                rows={25}
                value={fullTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="font-mono w-full"
              />
            </div>
          </div>
        ) : (
          <div className="border rounded-md bg-white mt-4 p-4">
            <style dangerouslySetInnerHTML={{ __html: editorCss }} />
            <div
              ref={editorRef}
              className="editable-container prose max-w-none"
              contentEditable
              onBlur={handleEditorChange}
              dangerouslySetInnerHTML={{
                __html: processTemplateForPreview(fullTemplate)
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
