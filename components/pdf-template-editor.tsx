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
      /* Page break placeholder styling */
      .page-break-placeholder {
        display: block;
        width: 100%;
        height: 20px;
        margin: 20px 0;
        background-color: #f0f0f0;
        border: 1px dashed #999;
        text-align: center;
        line-height: 20px;
        color: #666;
        position: relative;
      }
      .page-break-placeholder::before {
        content: "Prijelom stranice";
        font-size: 12px;
        font-family: sans-serif;
      }
      /* Placeholder styling */
      .template-placeholder {
        display: inline-block;
        background-color: #FFFF9E;
        padding: 0 4px;
        margin: 0 1px;
        border-radius: 3px;
        font-weight: bold;
        user-select: all;
        cursor: default;
        border: 1px dashed #e6ca00;
        color: #5c5c00;
      }
    `
    
    // Create an async function inside useEffect to fetch the template
    const fetchTemplate = async () => {
      try {
        console.log('Dohvaćanje predloška...')
        const templateData = await getEditableTemplate();
        console.log('Predložak dohvaćen:', templateData)
        // Set the template HTML
        if (templateData && templateData.html) {
          console.log("Predložak je pronađen")
          // Convert page-break to page-break-placeholder for editing
          const templateForEditing = templateData.html.replace(/class="page-break"/g, 'class="page-break-placeholder"');
          setFullTemplate(templateForEditing);
        } else {
          console.log("Predložak nije pronađen")
          // Fallback to empty template
          setFullTemplate('');
        }
      } catch (error) {
        console.error('Greška pri dohvaćanju predloška:', error);
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
      
      // Convert page-break-placeholder to page-break before saving
      let templateToSave = fullTemplate.replace(/class="page-break-placeholder"/g, 'class="page-break"');
      
      // Save the template to the server
      await saveEditableTemplate(templateToSave);
      
      toast({
        title: 'Uspjeh',
        description: 'Predložak je spremljen',
      });
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti predložak',
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
    
    // Replace placeholders with styled spans that are uneditable
    processed = processed.replace(/\[([A-Z0-9_]+)\]/g, '<span class="template-placeholder" contenteditable="false">[$1]</span>');
    
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
    
    // Convert the styled placeholders back to simple text placeholders
    template = template.replace(/<span class="template-placeholder"[^>]*>\[([A-Z0-9_]+)\]<\/span>/g, '[$1]');
    
    template = styleTag + template
    
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
      
      // Convert page-break to page-break-placeholder for editing
      const templateForEditing = originalTemplate.html.replace(/class="page-break"/g, 'class="page-break-placeholder"');
      setFullTemplate(templateForEditing);
      
      toast({
        title: 'Uspjeh',
        description: 'Predložak je vraćen na izvornu verziju',
      });
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće vratiti izvorni predložak',
        variant: 'destructive',
      });
      console.error('Failed to reset to original template:', error);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Check for Ctrl+B for inserting page break
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault(); // Prevent the default bold formatting
      insertPageBreak();
    }
    
    // Prevent deletion of placeholders
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Check if selection includes any placeholders
      let containsPlaceholder = false;
      
      // Check if range contains or starts/ends within a placeholder
      const checkNodeForPlaceholder = (node: Node): boolean => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if ((node as Element).classList?.contains('template-placeholder')) {
            return true;
          }
          
          // Check children
          const children = (node as Element).querySelectorAll('.template-placeholder');
          return children.length > 0;
        }
        return false;
      };
      
      // Check start container
      if (checkNodeForPlaceholder(range.startContainer) || 
          (range.startContainer.parentElement && checkNodeForPlaceholder(range.startContainer.parentElement))) {
        containsPlaceholder = true;
      }
      
      // Check end container
      if (!containsPlaceholder && (
          checkNodeForPlaceholder(range.endContainer) || 
          (range.endContainer.parentElement && checkNodeForPlaceholder(range.endContainer.parentElement)))) {
        containsPlaceholder = true;
      }
      
      // Check if any parent element contains placeholders within the range
      if (!containsPlaceholder && range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE) {
        const elementsInRange = Array.from((range.commonAncestorContainer as Element).querySelectorAll('*'));
        for (const element of elementsInRange) {
          if (checkNodeForPlaceholder(element)) {
            containsPlaceholder = true;
            break;
          }
        }
      }
      
      if (containsPlaceholder) {
        e.preventDefault(); // Prevent deletion
        toast({
          title: "Zaštićeni sadržaj",
          description: "Oznake [PLACEHOLDER] nije moguće izbrisati.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle paste events to preserve placeholders
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    if (editMode !== 'visual') return;
    
    // Only process if we're pasting into the editor
    if (e.target !== editorRef.current && !editorRef.current?.contains(e.target as Node)) return;
    
    // Get the current selection
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Check if we're pasting over a placeholder
    let containsPlaceholder = false;
    if (!range.collapsed) {
      // If there's a selection, check if it contains any placeholders
      const fragment = range.cloneContents();
      containsPlaceholder = !!fragment.querySelector('.template-placeholder');
    }
    
    if (containsPlaceholder) {
      e.preventDefault();
      toast({
        title: "Zaštićeni sadržaj",
        description: "Nije moguće lijepiti preko oznaka [PLACEHOLDER].",
        variant: "destructive"
      });
    }
  };

  const insertPageBreak = () => {
    if (!editorRef.current || editMode !== 'visual') return;

    // Get current selection
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Create a page break element
    const pageBreak = document.createElement('div');
    pageBreak.className = 'page-break-placeholder';
    
    // Insert the page break at cursor position
    range.insertNode(pageBreak);
    
    // Move cursor after the page break
    range.setStartAfter(pageBreak);
    range.setEndAfter(pageBreak);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update the template state
    handleEditorChange();
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Uredi PDF predložak</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleEditMode}>
            {editMode === 'html' ? 'Vizualni editor' : 'HTML editor'}
          </Button>
          
          <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="secondary" 
                disabled={isSaving || isResetting}
                title="Vrati na izvorni predložak"
                className="ml-auto"
              >
                {isResetting ? 'Vraćanje...' : 'Vrati izvorno'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vraćanje predloška</AlertDialogTitle>
                <AlertDialogDescription>
                  Ovo će vratiti predložak na izvornu verziju. Sve nesačuvane promjene bit će izgubljene. 
                  Jeste li sigurni da želite nastaviti?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Odustani</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Vrati</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isResetting}
            className="ml-2"
          >
            {isSaving ? 'Spremanje...' : 'Spremi predložak'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editMode === 'html' ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-slate-500">
                {`Uredi cijeli HTML predložak. Koristi varijable unutar uglatih zagrada poput [USER_NAME], [FIKSNI_PAKET], itd.`}
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
          <div className="space-y-4">
            <div className="flex flex-col gap-2 px-2 py-1 bg-muted/30 rounded border text-sm">
              <div className="flex items-center justify-between">
              <div className="flex gap-3">
                  <span className="text-muted-foreground">Prečaci u uređivaču:</span>
                  <span><kbd className="px-1.5 py-0.5 text-xs border rounded bg-background">Ctrl+B</kbd> Umetni prijelom stranice</span>
                </div>
                <Button variant="ghost" size="sm" onClick={insertPageBreak} className="h-7">
                  Umetni prijelom stranice
                </Button>
              </div>
              <div className="text-amber-600 flex items-center">
                <span className="bg-yellow-100 px-1 py-0.5 rounded text-xs font-bold mr-2 border border-yellow-300">[PLACEHOLDER]</span>
                <span>Oznake su zaštićene i ne mogu se izbrisati. Tekst možete dodati oko njih.</span>
              </div>
            </div>
            <div className="border rounded-md bg-white p-4">
              <style dangerouslySetInnerHTML={{ __html: editorCss }} />
              <div
                ref={editorRef}
                className="editable-container prose max-w-none"
                contentEditable
                onBlur={handleEditorChange}
                onKeyDown={handleEditorKeyDown}
                onPaste={handleEditorPaste}
                dangerouslySetInnerHTML={{
                  __html: processTemplateForPreview(fullTemplate)
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
