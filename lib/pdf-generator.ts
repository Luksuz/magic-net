"use client"

import type { ContractData } from "./supabase"
import type { PdfStyleOptions } from "@/components/pdf-style-options"
import type { UserInformation } from "@/components/user-information-form"
import { getEditableTemplate } from "./template-service"
import type { ProfileData } from "@/types/user"

export type PdfTemplateContent = {
  id: number
  created_at: string
  updated_at: string
  html: string
}

// Define a type for terminal equipment
export type TerminalEquipment = {
  id: number
  name: string
  quantity: string
  price: string
}

const defaultStyleOptions: PdfStyleOptions = {
  theme: "classic",
  primaryColor: "#1a3c5e",
  secondaryColor: "#f2f2f2",
  fontFamily: "Arial",
  fontSize: 11,
  showLogo: true,
  logoPosition: "right",
  showPageNumbers: true,
  showHeaderOnAllPages: true,
  tableStyle: "bordered",
  pageSize: "a4",
  orientation: "portrait",
  margins: 10,
}

// Helper function to format currency
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0,00 EUR"
  return value.toFixed(2).replace(".", ",") + " EUR"
}

// Helper function to calculate discount amount
function calculateDiscountAmount(
  price: number | null | undefined,
  discountPercentage: number | null | undefined,
): number {
  if (!price) return 0
  if (!discountPercentage) return 0
  return (price * discountPercentage) / 100
}

// Helper function to calculate final price after discount
function calculateFinalPrice(price: number | null | undefined, discountPercentage: number | null | undefined): number {
  if (!price) return 0
  if (!discountPercentage) return price
  const discountAmount = calculateDiscountAmount(price, discountPercentage)
  return price - discountAmount
}

// Helper function to convert image URL to Base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url); // Default mode is 'cors'
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${url}: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("FileReader failed to read blob as Data URL."));
        }
      };
      reader.onerror = (error) => reject(new Error(`FileReader error: ${error.target?.error?.message || 'Unknown FileReader error'}`));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error in imageUrlToBase64 for ${url}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

export async function generatePDF(
  data: ContractData,
  userInfo?: UserInformation,
  styleOptions?: Partial<PdfStyleOptions>,
  terminalEquipment?: TerminalEquipment[],
  customHtml?: string,
) {
  // Make sure html2pdf is available
  if (typeof window === "undefined" || !window.html2pdf) {
    throw new Error("html2pdf is not available")
  }

  // Merge default options with provided options
  const options = { ...defaultStyleOptions, ...styleOptions }

  // Generate agreement number with user's agreement_number if available
  let agreementNumber = data.broj_ugovora || `${data.id}`
  
  // If userInfo has userId populated, use that with a hyphen and agreement_number from userInfo
  if (userInfo?.userId) {
    // Check if we should append agreement_number from profile
    if (userInfo.userId && window.hasOwnProperty('profileData')) {
      const profileData = (window as any).profileData
      if (profileData && profileData.agreement_number) {
        agreementNumber = `${userInfo.userId}-${profileData.agreement_number}`
      } else {
        agreementNumber = userInfo.userId
      }
    } else {
      agreementNumber = userInfo.userId
    }
  }

  // Create a container reference that will be accessible in finally block
  let container: HTMLDivElement | null = null;

  try {
    // Get template HTML or use custom HTML if provided
    const templateData = customHtml ? { html: customHtml } : await getEditableTemplate();
    
    if (!templateData || !templateData.html) {
      throw new Error('No template found');
    }
    

    const response = await fetch('/promjena_operatera.html');
    const promjenaOperateraHtmlContent = await response.text();
    // Process template variables with actual data
    const processedHtml = formatHtml(templateData.html, data, userInfo, terminalEquipment, promjenaOperateraHtmlContent);
    
    // Start: Added logic to hide empty tables
    const tempHtmlDiv = document.createElement('div');
    tempHtmlDiv.innerHTML = processedHtml;
    const allTables = tempHtmlDiv.querySelectorAll('table');

    allTables.forEach(table => {
      let tableHasMeaningfulData = false;
      const rows = table.querySelectorAll('tr');

      for (const row of Array.from(rows)) {
        const cells = row.querySelectorAll('td');
        // If a row has no <td> elements (e.g., it's purely <th> or empty), it doesn't have data cells.
        if (cells.length === 0) {
          continue;
        }

        let rowHasActualValue = false;
        for (const cell of Array.from(cells)) {
          const trimmedCellText = cell.textContent?.trim() || '';
          
          // Heuristic to identify common static label patterns.
          // This includes text ending with a colon (e.g., "Name:", "Price (EUR):")
          // or numbered items (e.g., "1.", "2.").
          // The character set includes common European characters, symbols, and punctuation.
          const isLikelyStaticLabel = /^[A-ZČĆŽŠĐa-zčćžšđ\s\d(),%/€.'"-À-ÖØ-öø-ÿ]+:$/.test(trimmedCellText) || /^\d+\.$/.test(trimmedCellText);
          const isPlaceholderText = /^\\[[A-Z0-9_]+\\]$/.test(trimmedCellText); // Checks for unreplaced placeholders like [FOO_BAR]

          if (trimmedCellText !== '' && !isLikelyStaticLabel && !isPlaceholderText) {
            rowHasActualValue = true;
            break; // Found a cell with meaningful data in this row
          }
        }

        if (rowHasActualValue) {
          tableHasMeaningfulData = true;
          break; // Found a row with meaningful data in this table
        }
      }

      if (!tableHasMeaningfulData) {
        table.style.display = 'none'; // Hide the table if no meaningful data was found
      }
    });

    const finalHtmlContent = tempHtmlDiv.innerHTML;
    // End: Added logic to hide empty tables
    
    //save html to file
    console.log("Original HTML content before logo embedding:", finalHtmlContent);

    let htmlContentForPdf = finalHtmlContent;
    const logoUrl = "https://qfpjbgjxkpwtsegtkaze.supabase.co/storage/v1/object/public/images//logo.png";

    try {
      console.log("Attempting to embed logo as Base64...");
      const base64Logo = await imageUrlToBase64(logoUrl);
      
      const tempRenderDiv = document.createElement('div');
      tempRenderDiv.innerHTML = htmlContentForPdf;
      
      const logoImgElement = tempRenderDiv.querySelector(`img[src="${logoUrl}"]`) as HTMLImageElement | null;
      
      if (logoImgElement) {
        logoImgElement.src = base64Logo;
        htmlContentForPdf = tempRenderDiv.innerHTML;
        console.log("Logo successfully embedded as Base64.");
      } else {
        // Fallback selector in case the URL has slight variations (e.g. normalized slashes)
        const genericLogoImgElement = tempRenderDiv.querySelector('img[src*="supabase.co/storage/v1/object/public/images"][src*="logo.png"]') as HTMLImageElement | null;
        if (genericLogoImgElement && genericLogoImgElement.src.includes("logo.png")) {
            console.warn(`Logo image tag not found with exact URL: ${logoUrl}. Found with generic selector: ${genericLogoImgElement.src}. Replacing this one.`);
            genericLogoImgElement.src = base64Logo;
            htmlContentForPdf = tempRenderDiv.innerHTML;
            console.log("Logo (found generically) embedded as Base64.");
        } else {
            console.warn(`Logo image tag not found with URL: ${logoUrl}. PDF might not render the logo correctly. The original URL will be used.`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch or convert logo to Base64. PDF will use the original URL:", error);
      // htmlContentForPdf remains finalHtmlContent, html2pdf will attempt to fetch it using its own mechanisms.
    }
    
    console.log("HTML content after attempting logo embedding (passed to html2pdf):", htmlContentForPdf);

    // Create a container for the PDF content
    container = document.createElement("div");
    
    // Set the processed HTML (now with potentially hidden tables and embedded logo) to the container
    container.innerHTML = htmlContentForPdf;
    
    // Temporarily append to document to render
    document.body.appendChild(container);
    
    // Generate PDF
    const ownerPassword = process.env.NEXT_PUBLIC_PDF_OWNER_PASSWORD
    const pdfOptions = {
      filename: `contract-${agreementNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: options.pageSize,
        orientation: options.orientation,
        compress: true,
        hotfixes: ["px_scaling"],
        autoPaging: 'text',
        encryption: userInfo?.oib && userInfo.oib.trim() !== '' ? {
          userPassword: userInfo.oib,
          ownerPassword: ownerPassword,
          userPermissions: ["print", "modify", "copy", "annot-forms"],
          ownerPermissions: ["print", "modify", "copy", "annot-forms"]
        } : {
          ownerPassword: ownerPassword,
          ownerPermissions: ["print", "modify", "copy", "annot-forms"]
        }
      },
      pagebreak: { mode: ["avoid", "css", "legacy"] },
    }

    // Use window.html2pdf instead of importing the library
    await window.html2pdf().from(container).set(pdfOptions).save()
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  } finally {
    // Clean up the container that was added to the body
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

function formatHtml(html: string, data: ContractData, userInfo?: UserInformation, terminalEquipment?: TerminalEquipment[], promjenaOperateraHtmlContent?: string): string {
  if (!html) throw new Error("HTML is required")
  if (!data) throw new Error("Data is required")

  // Helper function to format currency values
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "0,00 EUR"
    return value.toFixed(2).replace(".", ",") + " EUR"
  }

  // Helper function to safely replace placeholders
  const safeReplace = (placeholder: string, value: string | number | null | undefined) => {
    const stringValue = value !== null && value !== undefined ? String(value) : ""
    html = html.replace(new RegExp(`\\[${placeholder}\\]`, 'g'), stringValue)
  }

    // Conditionally include Zahtjev za promjenu operatera
  if (userInfo && userInfo.changeOperator && promjenaOperateraHtmlContent) {
    // Assuming promjenaOperateraHtmlContent is defined or fetched elsewhere and available here
    
    console.log(promjenaOperateraHtmlContent)
    html = html.replace('<!-- ZAHTJEV_ZA_PROMJENU_OPERATERA -->', promjenaOperateraHtmlContent);
  } else {
    html = html.replace('<!-- ZAHTJEV_ZA_PROMJENU_OPERATERA -->', '');
  }

  // Agreement number
  let agreementNumber = data.broj_ugovora || `${data.id}`
  if (userInfo?.userId) {
    agreementNumber = userInfo.userId
  }
  safeReplace('AGREEMENT_NUMBER', agreementNumber)

  // Internet service details
  safeReplace('INTERNET_SERVICE_NAME', 'Usluga fiksne mreže putem svjetlovodnog priključka')
  safeReplace('INTERNET_PACKAGE_NAME', data.fiksni_paket)
  safeReplace('INTERNET_SPEED', data.fiksna_brzina)
  safeReplace('INTERNET_ADDITIONAL_SERVICES', data.fiksne_dodatne_usluge)
  safeReplace('INTERNET_EQUIPMENT', data.fiksna_oprema)

  // TV service details
  safeReplace('TV_SERVICE_NAME', 'Usluga Televizije')
  safeReplace('TV_PACKAGE_NAME', data.tv_paket)
  safeReplace('TV_ADDITIONAL_SERVICES', data.tv_dodatne_usluge)
  safeReplace('TV_EQUIPMENT', data.tv_oprema)

  // Phone service details
  safeReplace('PHONE_SERVICE_NAME', 'Usluga Telefona')
  safeReplace('PHONE_NUMBER', data.pretplatnicki_broj)
  safeReplace('PHONE_TARIFF', data.tarifa)
  safeReplace('PHONE_ADDITIONAL_SERVICES', data.tel_dodatne_usluge)
  safeReplace('PHONE_EQUIPMENT', data.tel_oprema)

  // Equipment details
  safeReplace('EQUIPMENT__MODEL', data.uredaj_proizvodac_model)
  safeReplace('EQUIPMENT_PRICE', formatCurrency(data.uredaj_cijena))
  safeReplace('EQUIPMENT_DISCOUNT', formatCurrency(data.uredaj_popust))
  
  // Calculate payment amount if not provided
  const devicePaymentAmount = data.uredaj_za_placanje !== undefined && data.uredaj_za_placanje !== null
    ? data.uredaj_za_placanje
    : (data.uredaj_cijena || 0) - (data.uredaj_popust || 0)
  
  safeReplace('EQUIPMENT_PAYMENT_AMOUNT', formatCurrency(devicePaymentAmount))
  safeReplace('EQUIPMENT_PAYMENT_ON_RATE', data.uredaj_otplata_na_rate ? "DA" : "NE")
  safeReplace('EQUIPMENT_PAYMENT_INSTALLMENTS', data.uredaj_broj_obroka)
  safeReplace('EQUIPMENT_INITIAL_PAYMENT', formatCurrency(data.uredaj_inicijalna_uplata))
  safeReplace('EQUIPMENT_MONTHLY_RATE', formatCurrency(data.uredaj_mjesecna_rata))

  // Terminal equipment
  if (terminalEquipment && terminalEquipment.length > 0) {
    // Equipment 1
    if (terminalEquipment.length >= 1) {
      safeReplace('EQUIPMENT_NAME_1', terminalEquipment[0].name)
      safeReplace('EQUIPMENT_QUANTITY_1', terminalEquipment[0].quantity)
      safeReplace('EQUIPMENT_PRICE_1', terminalEquipment[0].price ? `${terminalEquipment[0].price} EUR` : "")
    } else {
      safeReplace('EQUIPMENT_NAME_1', "")
      safeReplace('EQUIPMENT_QUANTITY_1', "")
      safeReplace('EQUIPMENT_PRICE_1', "")
    }

    // Equipment 2
    if (terminalEquipment.length >= 2) {
      safeReplace('EQUIPMENT_NAME_2', terminalEquipment[1].name)
      safeReplace('EQUIPMENT_QUANTITY_2', terminalEquipment[1].quantity)
      safeReplace('EQUIPMENT_PRICE_2', terminalEquipment[1].price ? `${terminalEquipment[1].price} EUR` : "")
    } else {
      safeReplace('EQUIPMENT_NAME_2', "")
      safeReplace('EQUIPMENT_QUANTITY_2', "")
      safeReplace('EQUIPMENT_PRICE_2', "")
    }

    // Equipment 3
    if (terminalEquipment.length >= 3) {
      safeReplace('EQUIPMENT_NAME_3', terminalEquipment[2].name)
      safeReplace('EQUIPMENT_QUANTITY_3', terminalEquipment[2].quantity)
      safeReplace('EQUIPMENT_PRICE_3', terminalEquipment[2].price ? `${terminalEquipment[2].price} EUR` : "")
    } else {
      safeReplace('EQUIPMENT_NAME_3', "")
      safeReplace('EQUIPMENT_QUANTITY_3', "")
      safeReplace('EQUIPMENT_PRICE_3', "")
    }
  } else {
    // Empty equipment
    safeReplace('EQUIPMENT_NAME_1', "")
    safeReplace('EQUIPMENT_QUANTITY_1', "")
    safeReplace('EQUIPMENT_PRICE_1', "")
    safeReplace('EQUIPMENT_NAME_2', "")
    safeReplace('EQUIPMENT_QUANTITY_2', "")
    safeReplace('EQUIPMENT_PRICE_2', "")
    safeReplace('EQUIPMENT_NAME_3', "")
    safeReplace('EQUIPMENT_QUANTITY_3', "")
    safeReplace('EQUIPMENT_PRICE_3', "")
  }

  // Internet speeds
  safeReplace('BRZINA_MIN_DOWNLOAD', data.brzina_min_download)
  safeReplace('BRZINA_MIN_UPLOAD', data.brzina_min_upload)
  safeReplace('BRZINA_OBICNA_DOWNLOAD', data.brzina_obicna_download)
  safeReplace('BRZINA_OBICNA_UPLOAD', data.brzina_obicna_upload)
  safeReplace('BRZINA_MAX_DOWNLOAD', data.brzina_max_download)
  safeReplace('BRZINA_MAX_UPLOAD', data.brzina_max_upload)

  // Connection fees
  const connectionFee = data.cijena_prikljucenja_naknada || 40.0
  const connectionDiscountPercent = data.cijena_prikljucenja_popust !== undefined && data.cijena_prikljucenja_popust !== null
    ? data.cijena_prikljucenja_popust
    : 100
  const connectionDiscountAmount = (connectionFee * connectionDiscountPercent) / 100
  const connectionFeeTotal = data.cijena_prikljucenja_ukupno !== undefined && data.cijena_prikljucenja_ukupno !== null
    ? data.cijena_prikljucenja_ukupno
    : connectionFee - connectionDiscountAmount

  // Activation fees
  const activationFee = data.cijena_aktivacije_naknada || 33.18
  const activationDiscountPercent = data.cijena_aktivacije_popust !== undefined && data.cijena_aktivacije_popust !== null
    ? data.cijena_aktivacije_popust
    : 100
  const activationDiscountAmount = (activationFee * activationDiscountPercent) / 100
  const activationFeeTotal = data.cijena_aktivacije_ukupno !== undefined && data.cijena_aktivacije_ukupno !== null
    ? data.cijena_aktivacije_ukupno
    : activationFee - activationDiscountAmount

  // Current date
  safeReplace('CURRENT_DATE', new Date().toLocaleDateString())

  // --- Additional template variables ---
  
  // Connection & Activation Fees (already implemented above, but adding the variable names for completeness)
  safeReplace('CONNECTION_FEE', formatCurrency(connectionFee))
  safeReplace('CONNECTION_DISCOUNT_PERCENT', connectionDiscountPercent)
  safeReplace('CONNECTION_FEE_TOTAL', formatCurrency(connectionFeeTotal))
  safeReplace('ACTIVATION_FEE', formatCurrency(activationFee))
  safeReplace('ACTIVATION_DISCOUNT_PERCENT', activationDiscountPercent)
  safeReplace('ACTIVATION_FEE_TOTAL', formatCurrency(activationFeeTotal))

  // Periodic Pricing Section
  safeReplace('FIKSNI_PAKET', data.fiksni_paket)
  safeReplace('FIKSNA_BRZINA', data.fiksna_brzina)
  safeReplace('PROMO_PRICE_FIKSNI', (data as any).promo_price_fiksni ? formatCurrency((data as any).promo_price_fiksni) : "")
  safeReplace('CONTRACT_PRICE_FIKSNI', (data as any).contract_price_fiksni ? formatCurrency((data as any).contract_price_fiksni) : "")
  safeReplace('REGULAR_PRICE_FIKSNI', (data as any).regular_price_fiksni ? formatCurrency((data as any).regular_price_fiksni) : "")
  
  safeReplace('TV_PAKET', data.tv_paket)
  safeReplace('TV_DODATNE_USLUGE', data.tv_dodatne_usluge)
  safeReplace('PROMO_PRICE_TV', (data as any).promo_price_tv ? formatCurrency((data as any).promo_price_tv) : "")
  safeReplace('CONTRACT_PRICE_TV', (data as any).contract_price_tv ? formatCurrency((data as any).contract_price_tv) : "")
  safeReplace('REGULAR_PRICE_TV', (data as any).regular_price_tv ? formatCurrency((data as any).regular_price_tv) : "")
  
  safeReplace('TARIFA', data.tarifa)
  safeReplace('PRETPLATNICKI_BROJ', data.pretplatnicki_broj)
  safeReplace('PROMO_PRICE_PHONE', (data as any).promo_price_phone ? formatCurrency((data as any).promo_price_phone) : "")
  safeReplace('CONTRACT_PRICE_PHONE', (data as any).contract_price_phone ? formatCurrency((data as any).contract_price_phone) : "")
  safeReplace('REGULAR_PRICE_PHONE', (data as any).regular_price_phone ? formatCurrency((data as any).regular_price_phone) : "")
  
  // Total prices
  safeReplace('TOTAL_PROMO_PRICE', formatCurrency(calculateTotalPrice(data, 'promo')))
  safeReplace('TOTAL_CONTRACT_PRICE', formatCurrency(calculateTotalPrice(data, 'contract')))
  safeReplace('TOTAL_REGULAR_PRICE', formatCurrency(calculateTotalPrice(data, 'regular')))
  
  // User & Contract Information
  if (userInfo) {
    safeReplace('USER_ID', userInfo.userId)
    safeReplace('USER_NAME', userInfo.userName)
    safeReplace('LEGAL_ENTITY', userInfo.legalEntity)
    safeReplace('RESIDENCE_ADDRESS', userInfo.residenceAddress)
    safeReplace('CONNECTION_ADDRESS', userInfo.connectionAddress)
    safeReplace('OIB', userInfo.oib)
    safeReplace('ID_CARD_NUMBER', userInfo.idCardNumber)
    safeReplace('CONTACT_PHONE', userInfo.contactPhone)
    safeReplace('EMAIL', userInfo.email)
    safeReplace('CONTACT_PERSON_NAME', userInfo.contactPersonName)
    safeReplace('CONTACT_PERSON_PHONE', userInfo.contactPersonPhone)
    safeReplace('CONTACT_PERSON_EMAIL', userInfo.contactPersonEmail)
    
    // Invoice delivery method checkboxes
    safeReplace('INVOICE_DELIVERY_METHOD_MAIL', userInfo.invoiceDeliveryMethod === 'mail' ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_EINVOICE', userInfo.invoiceDeliveryMethod === 'eInvoice' ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_EMAIL', userInfo.invoiceDeliveryMethod === 'email' ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_CONTACT_EMAIL', userInfo.invoiceDeliveryMethod === 'contactEmail' ? '☑' : '☐')
    
    // Marketing contact checkboxes
    safeReplace('MARKETING_CONTACT_PHONE', userInfo.marketingContact?.includes('phone') ? '☑' : '☐')
    safeReplace('MARKETING_CONTACT_SMS', userInfo.marketingContact?.includes('sms') ? '☑' : '☐')
    safeReplace('MARKETING_CONTACT_EMAIL', userInfo.marketingContact?.includes('email') ? '☑' : '☐')
    
    // Seller Information
    safeReplace('SELLER_CODE', userInfo.sellerCode)
    safeReplace('SELLER_PLACE', userInfo.sellerPlace)
    safeReplace('SELLER_DATE_FORMATTED', userInfo.sellerDate)
    
    // Additional User Info formatted strings
    const servicesText = [
      data.fiksni_paket,
      data.tv_paket,
      data.tarifa
    ].filter(Boolean).join(', ')
    safeReplace('FIKSNI_PAKET_OR_TV_PAKET_OR_TARIFA', servicesText)
    
    safeReplace('ADDITIONAL_SERVICES', userInfo.additionalServices)
    safeReplace('ACTIVATION_COST', userInfo.activationCost)
    safeReplace('EXTERNAL_WORKS_COST', userInfo.externalWorksCost)
    
    // Formatted methods
    const invoiceMethodMap: Record<string, string> = {
      'mail': 'poštom',
      'eInvoice': 'e-račun',
      'email': 'e-mailom',
      'contactEmail': 'e-mailom na kontakt osobu'
    }
    
    safeReplace('INVOICE_DELIVERY_METHOD_FORMATTED', 
      userInfo.invoiceDeliveryMethod ? invoiceMethodMap[userInfo.invoiceDeliveryMethod] || userInfo.invoiceDeliveryMethod : '')
    
    const marketingContactText = userInfo.marketingContact?.map(method => {
      if (method === 'phone') return 'telefonom'
      if (method === 'sms') return 'SMS-om'
      if (method === 'email') return 'e-mailom'
      return method
    }).join(', ')
    safeReplace('MARKETING_CONTACT_FORMATTED', marketingContactText || '')
    
    const generalTermsMap: Record<string, string> = {
      'provided': 'uručeni',
      'download': 'preuzeti s web stranice'
    }
    safeReplace('GENERAL_TERMS_DELIVERY_FORMATTED',
      userInfo.generalTermsDelivery ? generalTermsMap[userInfo.generalTermsDelivery] || userInfo.generalTermsDelivery : '')
    
    const paymentMethodMap: Record<string, string> = {
      'oneTime': 'jednokratno',
      'installments': 'na rate'
    }
    safeReplace('PAYMENT_METHOD_FORMATTED',
      userInfo.paymentMethod ? paymentMethodMap[userInfo.paymentMethod] || userInfo.paymentMethod : '')
  }

  return html
}

// Helper function to calculate total prices
function calculateTotalPrice(data: ContractData, type: 'promo' | 'contract' | 'regular'): number {
  const fiksniPrice = (data as any)[`${type}_price_fiksni`] || 0;
  const tvPrice = (data as any)[`${type}_price_tv`] || 0;
  const phonePrice = (data as any)[`${type}_price_phone`] || 0;
  
  return fiksniPrice + tvPrice + phonePrice;
}