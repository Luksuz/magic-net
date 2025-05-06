import { supabase } from '@/utils/supabase/client'
import type { PdfTemplateContent, TerminalEquipment } from './pdf-generator'
import type { ContractData } from './supabase'
import type { UserInformation } from '@/components/user-information-form'
import { generatePDF } from './pdf-generator'


export async function getOriginalTemplate(): Promise<PdfTemplateContent> {
  
  const { data, error } = await supabase
    .from('original_ugovorna_spranca_html')
    .select('*')
    .eq('id', 1)
    .single()
  
  if (error) {
    throw new Error('Failed to get templates')
  }

  return data
}


export async function saveOriginalTemplate(html: string): Promise<boolean> {

  // Then insert new template
  const { error } = await supabase
    .from('original_ugovorna_spranca_html')
    .insert({
      html: html,
      updated_at: new Date().toISOString(),
    })
  
  if (error) {
    console.error('Error saving templates:', error)
    throw new Error('Failed to save templates')
  }

  return true
}



export async function getEditableTemplate(): Promise<{ html: string }> {

  const { data, error } = await supabase
    .from('promjenjiva_ugovorna_spranca_html')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    throw new Error('Failed to get templates')
  }
  // Return the data or a default object with empty html if no data is found
  return data;
}


export async function saveEditableTemplate(html: string): Promise<boolean> {

  // Ensure the HTML is properly formatted with styles preserved
  let templateToSave = html;
  
  // Make sure the template has the basic structure with pdf-container
  if (!templateToSave.includes('<div class="pdf-container"')) {
    // Extract style tag if present
    let styleTag = '';
    const styleTagMatch = templateToSave.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i);
    if (styleTagMatch) {
      styleTag = styleTagMatch[0];
      // Remove from content temporarily for proper wrapping
      templateToSave = templateToSave.replace(styleTag, '');
    } else {
      // Add default style if none exists
      styleTag = `<style>
    /* PDF Styles */
    body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        margin: 0;
        padding: 0;
    }
    table {
        border-collapse: collapse; 
        width: 100%; 
        margin-bottom: 15px; 
        table-layout: fixed;
    }
    th, td { 
        padding: 6px; 
        border: 1px solid #ddd; 
        line-height: 1.2;
    }
    th { 
        background-color: #f2f2f2; 
        text-align: center; 
        font-weight: bold;
    }
    td { 
        vertical-align: top;
    }
    </style>`;
    }
    
    // Create proper template structure like the original
    templateToSave = `${styleTag}
    
    <div class="pdf-container" style="font-family: Arial, sans-serif;
      font-size: 11px;
      color: #333;
      margin: 20px auto;
      padding: 15px;
      border: 1px solid #ccc;
      width: 210mm;
      max-width: 100%;
      box-sizing: border-box;
      position: relative;
      background-color: white;">
      <div class="pdf-content">
        ${templateToSave}
      </div>
    </div><!-- End pdf-content -->`;
  }

  const { error } = await supabase
    .from('promjenjiva_ugovorna_spranca_html')
    .update({
      html: templateToSave,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('Error saving templates:', error)
    throw new Error('Failed to save templates')
  }

  return true
}


export async function generatePdfFromTemplate(
  data: ContractData,
  userInfo?: UserInformation,
  terminalEquipment?: TerminalEquipment[]
): Promise<boolean> {
  try {
    // Get the template from the database
    const templateData = await getEditableTemplate();
    
    if (!templateData || !templateData.html) {
      throw new Error('No template found');
    }

    // Process template variables
    const processedHtml = processTemplateVariables(templateData.html, data, userInfo, terminalEquipment);
    
    // Generate PDF with the processed HTML
    return await generatePDF(data, userInfo, undefined, terminalEquipment, processedHtml);
  } catch (error) {
    console.error('Error generating PDF from template:', error);
    return false;
  }
}

// Helper function to replace template variables with actual data
function processTemplateVariables(
  template: string, 
  data: ContractData, 
  userInfo?: UserInformation,
  terminalEquipment?: TerminalEquipment[]
): string {
  let processedHtml = template;
  
  // Replace data variables
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      processedHtml = processedHtml.replace(
        new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), 
        String(value)
      );
    }
  }
  
  // Replace user info variables
  if (userInfo) {
    for (const [key, value] of Object.entries(userInfo)) {
      if (value !== null && value !== undefined) {
        // Handle arrays like marketingContact specially
        if (Array.isArray(value)) {
          // For checkboxes in marketing contacts
          if (key === 'marketingContact') {
            processedHtml = processedHtml.replace(
              /\[MARKETING_CONTACT_PHONE\]/g, 
              value.includes("phone") ? "☒" : "☐"
            );
            processedHtml = processedHtml.replace(
              /\[MARKETING_CONTACT_SMS\]/g, 
              value.includes("sms") ? "☒" : "☐"
            );
            processedHtml = processedHtml.replace(
              /\[MARKETING_CONTACT_EMAIL\]/g, 
              value.includes("email") ? "☒" : "☐"
            );
          }
        } else {
          processedHtml = processedHtml.replace(
            new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), 
            String(value)
          );
        }
      }
    }
    
    // Special formatting for some user info fields
    processedHtml = processedHtml.replace(
      /\[INVOICE_DELIVERY_METHOD_FORMATTED\]/g,
      userInfo.invoiceDeliveryMethod === "mail" ? "Poštom" : 
      userInfo.invoiceDeliveryMethod === "eInvoice" ? "eRačun" : 
      userInfo.invoiceDeliveryMethod === "email" ? "Mailom vlasniku" : 
      userInfo.invoiceDeliveryMethod === "contactEmail" ? "Mailom kontakt osobi" : ""
    );
    
    processedHtml = processedHtml.replace(
      /\[GENERAL_TERMS_DELIVERY_FORMATTED\]/g,
      userInfo.generalTermsDelivery === "provided" ? "Uručeni korisniku" : "Sam će ih preuzeti"
    );
    
    processedHtml = processedHtml.replace(
      /\[PAYMENT_METHOD_FORMATTED\]/g,
      userInfo.paymentMethod === "oneTime" ? "Jednokratno" : "Na rate"
    );
    
    // Format marketing contact as a list
    const marketingContactFormatted = userInfo.marketingContact
      .map((method: string) => method === "phone" ? "Pozivom" : method === "sms" ? "SMS-om" : method === "email" ? "Mailom" : "")
      .filter(Boolean)
      .join(", ") || "Nema";
      
    processedHtml = processedHtml.replace(
      /\[MARKETING_CONTACT_FORMATTED\]/g,
      marketingContactFormatted
    );
  }
  
  // Replace terminal equipment variables
  if (terminalEquipment && terminalEquipment.length > 0) {
    terminalEquipment.forEach((item, index) => {
      processedHtml = processedHtml.replace(
        new RegExp(`\\[EQUIPMENT_NAME_${index + 1}\\]`, 'g'), 
        item.name || ""
      );
      processedHtml = processedHtml.replace(
        new RegExp(`\\[EQUIPMENT_QUANTITY_${index + 1}\\]`, 'g'), 
        item.quantity || ""
      );
      processedHtml = processedHtml.replace(
        new RegExp(`\\[EQUIPMENT_PRICE_${index + 1}\\]`, 'g'), 
        item.price ? `${item.price} EUR` : ""
      );
    });
  }
  
  // Replace current date
  processedHtml = processedHtml.replace(
    /\[CURRENT_DATE\]/g,
    new Date().toLocaleDateString()
  );
  
  return processedHtml;
}

export async function resetToOriginalTemplate(): Promise<boolean> {
  try {
    // Get the original template
    const originalTemplate = await getOriginalTemplate();
    console.log(originalTemplate)
    
    // Save it as the editable template
    const success = await saveEditableTemplate(originalTemplate.html);
    console.log(success)
    
    return success;
  } catch (error) {
    console.error('Error resetting to original template:', error);
    throw new Error('Failed to reset to original template');
  }
}


