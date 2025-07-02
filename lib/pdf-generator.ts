"use client"

import type { ContractData } from "@/lib/supabase"
import type { UserInformation, OperatorChangeData } from "@/components/user-information-form"
import { getEditableTemplate } from "@/lib/template-service"
import { trackContractCreation, getUserCode } from "@/lib/supabase"

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

interface PdfStyleOptions {
  theme: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: number
  showLogo: boolean
  logoPosition: string
  showPageNumbers: boolean
  showHeaderOnAllPages: boolean
  tableStyle: string
  pageSize: string,
  orientation: string,
  margins: number,
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
  terminalEquipment?: TerminalEquipment[],
  customHtml?: string,
  contractConcludedOnPremises?: boolean,
  operatorChangeData?: OperatorChangeData,
  calculatedData?: {
    phoneServices?: string
    phonePromoPrice?: number
    phoneRegularPrice?: number
    phoneServiceName?: string
    tvServices?: string
    tvPromoPrice?: number
    tvRegularPrice?: number
    tvServiceName?: string
    internetServices?: string
    internetPromoPrice?: number
    internetRegularPrice?: number
    internetServiceName?: string
    meshServices?: string
    meshPromoPrice?: number
    meshRegularPrice?: number
    meshServiceName?: string
  },
  extraTelefonPackages?: any[]
) {
  // Make sure html2pdf is available
  if (typeof window === "undefined" || !window.html2pdf) {
    throw new Error("html2pdf is not available")
  }

  // Hide UI elements temporarily (navigation bars, buttons, etc.)
  const hideUIForPdfGeneration = () => {
    // Store original styles to restore later
    const elementsToHide = [
      document.querySelector('nav'),
      document.querySelector('header'),
      ...Array.from(document.querySelectorAll('button:not(.pdf-content button)')),
      ...Array.from(document.querySelectorAll('.pdf-button-container')),
      document.querySelector('footer'),
      ...Array.from(document.querySelectorAll('.ui-element')), // Add class to any custom UI elements
      ...Array.from(document.querySelectorAll('[role="tablist"]')),
      ...Array.from(document.querySelectorAll('.tabs-container')),
      document.querySelector('.mt-12.pt-8.border-t') // Email section
    ];

    // Store original display values to restore later
    const originalStyles: Map<HTMLElement, string> = new Map();
    
    elementsToHide.forEach(el => {
      if (el && el instanceof HTMLElement) {
        originalStyles.set(el, el.style.display);
        el.style.display = 'none';
      }
    });

    return originalStyles;
  };

  // Restore UI elements after PDF generation
  const restoreUI = (originalStyles: Map<HTMLElement, string>) => {
    originalStyles.forEach((originalDisplay, element) => {
      if (element) {
        element.style.display = originalDisplay;
      }
    });
  };

  // Merge default options with provided options
  const options = { ...defaultStyleOptions }

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

  // Prepare the terminal equipment list for formatHtml
  let finalTerminalEquipmentList: TerminalEquipment[];

  if (terminalEquipment !== undefined) {
    // If terminalEquipment is explicitly passed, use it
    finalTerminalEquipmentList = terminalEquipment;
  } else if (data.terminalna_oprema) {
    if (Array.isArray(data.terminalna_oprema)) {
      // New format: Array of objects { name: string; quantity: number; price: number; id?: number }
      finalTerminalEquipmentList = data.terminalna_oprema.map((item, index) => ({
        id: item.id ?? index, // Use DB id if available, else index. id in TerminalEquipment is number.
        name: item.name || "", // Ensure name is string, default to empty if somehow null/undefined
        quantity: String(item.quantity ?? 1), // Convert number to string, default quantity 1
        price: String(item.price ?? 0),    // Convert number to string, default price 0
      }));
    } else if (typeof data.terminalna_oprema === 'object' && data.terminalna_oprema !== null) {
      // Old format: Record<string, number> (name: price)
      finalTerminalEquipmentList = Object.entries(data.terminalna_oprema).map(([name, priceValue], index) => ({
        id: index, // Use array index as id
        name: name,
        quantity: "1", // Default quantity for old format
        price: String(priceValue ?? 0), // Convert price (which is number) to string
      }));
    } else {
      // data.terminalna_oprema is of an unexpected type (should be array, object, or null)
      finalTerminalEquipmentList = [];
    }
  } else {
    // data.terminalna_oprema is null or undefined, and terminalEquipment param was not provided
    finalTerminalEquipmentList = [];
  }

  // Auto-add MESH devices to terminal equipment based on selected services
  const meshServices = calculatedData?.meshServices || data.fiksne_dodatne_usluge || '';
  console.log('PDF Generator - checking MESH services for terminal equipment:', meshServices);
  
  // Check for BESPLATAN MESH
  const hasFreeMesh = meshServices.toLowerCase().includes('besplatan mesh');
  if (hasFreeMesh) {
    // Check if MESH is already in terminal equipment
    const existingMeshIndex = finalTerminalEquipmentList.findIndex(item => 
      item.name.toLowerCase().includes('mesh')
    );
    
    if (existingMeshIndex >= 0) {
      // Update existing MESH entry
      const currentQuantity = parseInt(finalTerminalEquipmentList[existingMeshIndex].quantity) || 0;
      finalTerminalEquipmentList[existingMeshIndex].quantity = String(currentQuantity + 1);
      console.log('Updated existing MESH quantity in terminal equipment');
    } else {
      // Add new MESH entry
      finalTerminalEquipmentList.push({
        id: finalTerminalEquipmentList.length + 1,
        name: "MESH",
        quantity: "1",
        price: "65,00"
      });
      console.log('Added BESPLATAN MESH to terminal equipment');
    }
  }
  
  // Check for EXTRA MESH U NAJAM
  const rentalMeshMatch = meshServices.match(/extra mesh u najam \((\d+)\)/i);
  const rentalMeshCount = rentalMeshMatch ? parseInt(rentalMeshMatch[1], 10) : 
    (meshServices.toLowerCase().includes('extra mesh u najam') ? 1 : 0);
  
  if (rentalMeshCount > 0) {
    // Find existing MESH entry or create new one
    const existingMeshIndex = finalTerminalEquipmentList.findIndex(item => 
      item.name.toLowerCase().includes('mesh')
    );
    
    if (existingMeshIndex >= 0) {
      // Update existing MESH entry
      const currentQuantity = parseInt(finalTerminalEquipmentList[existingMeshIndex].quantity) || 0;
      finalTerminalEquipmentList[existingMeshIndex].quantity = String(currentQuantity + rentalMeshCount);
      console.log(`Updated existing MESH quantity (+${rentalMeshCount}) in terminal equipment`);
    } else {
      // Add new MESH entry
      finalTerminalEquipmentList.push({
        id: finalTerminalEquipmentList.length + 1,
        name: "MESH",
        quantity: String(rentalMeshCount),
        price: "65,00"
      });
      console.log(`Added ${rentalMeshCount} RENTAL MESH to terminal equipment`);
    }
  }

  // Create a container reference that will be accessible in finally block
  let container: HTMLDivElement | null = null;
  let originalStyles: Map<HTMLElement, string> | null = null;

  try {
    // Hide UI elements before generating PDF
    originalStyles = hideUIForPdfGeneration();

    // Get template HTML or use custom HTML if provided
    const templateData = customHtml ? { html: customHtml } : await getEditableTemplate();
    
    if (!templateData || !templateData.html) {
      throw new Error('No template found');
    }
    
    // First, track contract creation to get a proper contract number
    // This needs to happen BEFORE processing the HTML
    let contractNumber = '';
    
    try {
      // Get user_id directly from auth context
      let userId = null;
      let userCode = null;
      
      // Get profile data if available
      if (window.hasOwnProperty('profileData')) {
        const profileData = (window as any).profileData;
        console.log("Profile data:", profileData);
        
        // Always use the user_id from profileData which comes from auth context
        if (profileData && profileData.user_id) {
          userId = profileData.user_id;
          
          // Get user code for contract numbering - always use user_number
          if (profileData.user_number) {
            userCode = String(profileData.user_number).padStart(2, '0');
          } else {
            userCode = getUserCode(profileData);
          }
        }
      }

      console.log("User ID from auth context:", userId, "User Code:", userCode);
      
      // Track contract creation and get the generated contract number
      if (userId) {
        const result = await trackContractCreation(
          userId || undefined,
          userCode || undefined
        );
        console.log("Contract creation tracked in database:", result);
        
        // If successful, store the generated contract number
        if (result && result.success && result.contract_number) {
          contractNumber = result.contract_number;
          console.log("Using contract number:", contractNumber);
          
          // Store for future reference
          if (typeof window !== "undefined") {
            (window as any).lastContractNumber = contractNumber;
          }
        }
      }
    } catch (trackingError) {
      console.error("Error tracking contract creation:", trackingError);
      // Don't fail the entire operation if tracking fails
    }

    const response = await fetch('/promjena_operatera.html');
    const promjenaOperateraHtmlContent = await response.text();
    
    // Process template variables with actual data, passing the contractNumber to formatHtml
    const processedHtml = formatHtml(
      templateData.html, 
      data, 
      userInfo, 
      finalTerminalEquipmentList, 
      promjenaOperateraHtmlContent,
      contractConcludedOnPremises,
      contractNumber, // Pass the contract number to formatHtml
      operatorChangeData,
      calculatedData,
      extraTelefonPackages
    );
    
    // Start: Added logic to hide empty tables and their headings
    const tempHtmlDiv = document.createElement('div');
    tempHtmlDiv.innerHTML = processedHtml;
    const allTables = tempHtmlDiv.querySelectorAll('table');

    allTables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      let hasVisibleRows = false;
      let hasMeaningfulContent = false;

      for (const row of Array.from(rows)) {
        const cells = row.querySelectorAll('td');
        // If a row has no <td> elements (e.g., it's purely <th> for headers), skip it
        if (cells.length === 0) {
          continue;
        }

        let rowHasActualValue = false;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const trimmedCellText = cell.textContent?.trim() || '';
          
          // Skip the first column if it's just a row number (like "1.", "2.", etc.)
          if (i === 0) {
            const isRowNumber = /^\d+\.$/.test(trimmedCellText);
            if (isRowNumber) {
              continue; // Don't count row numbers as meaningful data
            }
          }
          
          // Check for meaningful content (not empty, not placeholder, not just labels)
          const isLikelyStaticLabel = /^[A-ZČĆŽŠĐa-zčćžšđ\s\d(),%/€.'"-À-ÖØ-öø-ÿ]+:$/.test(trimmedCellText);
          const isPlaceholderText = /^\[[A-Z0-9_]+\]$/.test(trimmedCellText); // Checks for unreplaced placeholders like [FOO_BAR]
          const isEmpty = trimmedCellText === '';
          const isZeroValue = trimmedCellText === '0' || trimmedCellText === '0,00' || trimmedCellText === '0.00' || trimmedCellText === '0,00 EUR' || trimmedCellText === '0.00 EUR';
          const isEmptyDash = trimmedCellText === '-' || trimmedCellText === '—' || trimmedCellText === 'N/A' || trimmedCellText === 'n/a';

          if (!isEmpty && !isLikelyStaticLabel && !isPlaceholderText && !isZeroValue && !isEmptyDash) {
            rowHasActualValue = true;
            hasMeaningfulContent = true;
            break; // Found a cell with meaningful data in this row
          }
        }

        // Hide the row if it doesn't have meaningful data
        if (!rowHasActualValue) {
          row.style.display = 'none';
        } else {
          hasVisibleRows = true;
        }
      }
      
      // If table has no visible data rows OR no meaningful content, hide the entire table and its heading
      if (!hasVisibleRows || !hasMeaningfulContent) {
        table.style.display = 'none';
        
        // Look for heading elements before this table and hide them too
        let currentElement = table.previousElementSibling;
        while (currentElement) {
          const tagName = currentElement.tagName.toLowerCase();
          const textContent = currentElement.textContent?.trim() || '';
          
          // Check if this is likely a table heading (h1-h6, or div/p with heading-like content)
          const isHeading = /^h[1-6]$/.test(tagName) || 
                           (tagName === 'div' && textContent.length > 0 && textContent.length < 100) ||
                           (tagName === 'p' && textContent.length > 0 && textContent.length < 100 && 
                            /^[A-ZČĆŽŠĐ][A-ZČĆŽŠĐa-zčćžšđ\s\d(),%/€.'"-À-ÖØ-öø-ÿ]*$/.test(textContent));
          
          if (isHeading && currentElement instanceof HTMLElement) {
            currentElement.style.display = 'none';
            break; // Only hide the immediate preceding heading
          }
          
          // Stop if we encounter another table or significant content
          if (tagName === 'table' || 
              (textContent.length > 100) || 
              (tagName === 'div' && currentElement.children.length > 0)) {
            break;
          }
          
          currentElement = currentElement.previousElementSibling;
        }
      } else {
        // Renumber visible rows
        const visibleDataRows = Array.from(table.querySelectorAll('tr')).filter(row => {
          const cells = row.querySelectorAll('td');
          return cells.length > 0 && row.style.display !== 'none';
        });
        
        // Renumber visible rows
        visibleDataRows.forEach((row, index) => {
          const firstCell = row.querySelector('td');
          if (firstCell) {
            const cellText = firstCell.textContent?.trim() || '';
            // Check if first cell contains a row number pattern
            const isRowNumber = /^\d+\.$/.test(cellText);
            if (isRowNumber) {
              firstCell.textContent = `${index + 1}.`;
            }
          }
        });
      }
    });

    const finalHtmlContent = tempHtmlDiv.innerHTML;
    // End: Added logic to hide empty tables, their headings, and renumber rows
    
    //save html to file

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
    

    // Create a container for the PDF content
    container = document.createElement("div");
    container.className = "pdf-content";
    
    // Set the processed HTML (now with potentially hidden tables and embedded logo) to the container
    container.innerHTML = htmlContentForPdf;
    
         // Contract creation is now handled earlier in the process
    
    // Temporarily append to document to render
    document.body.appendChild(container);
    
    // Generate PDF with proper contract numbering
    const ownerPassword = process.env.NEXT_PUBLIC_PDF_OWNER_PASSWORD
    
    // Create filename using same format as PDF contract number (base + access method)
    let filename = 'contract.pdf'; // fallback
    
    if (data.broj_ugovora) {
      // Extract base contract number and access method, removing user name
      // Format is: "BROJ ime prezime - način_pristupa"
      // We want: "BROJ - način_pristupa" for filename (same as PDF contract number)
      const contractParts = data.broj_ugovora.split(' ');
      const baseNumber = contractParts[0]; // Take only the first part (base number)
      
      // Look for access method after the last " - "
      const dashIndex = data.broj_ugovora.lastIndexOf(' - ');
      if (dashIndex !== -1) {
        const accessMethod = data.broj_ugovora.substring(dashIndex + 3); // Get everything after " - "
        filename = `${baseNumber} - ${accessMethod}.pdf`;
      } else {
        // No access method found, use just the base number
        filename = baseNumber + '.pdf';
      }
    } else {
      // Fallback if no contract number in form
      filename = 'contract.pdf';
    }
    
    // Use the contract number if available
    const pdfOptions = {
      filename: filename,
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
    
        // Contract creation is already tracked before PDF generation
    
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  } finally {
    // Clean up the container that was added to the body
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    
    // Restore UI elements
    if (originalStyles) {
      restoreUI(originalStyles);
    }
  }
}

function formatHtml(
  html: string, 
  data: ContractData, 
  userInfo?: UserInformation, 
  terminalEquipment?: TerminalEquipment[], 
  promjenaOperateraHtmlContent?: string,
  contractConcludedOnPremises?: boolean,
  contractNumber?: string,
  operatorChangeData?: OperatorChangeData,
  calculatedData?: {
    phoneServices?: string
    phonePromoPrice?: number
    phoneRegularPrice?: number
    phoneServiceName?: string
    tvServices?: string
    tvPromoPrice?: number
    tvRegularPrice?: number
    tvServiceName?: string
    internetServices?: string
    internetPromoPrice?: number
    internetRegularPrice?: number
    internetServiceName?: string
    meshServices?: string
    meshPromoPrice?: number
    meshRegularPrice?: number
    meshServiceName?: string
  },
  extraTelefonPackages?: any[]
): string {
  if (!html) throw new Error("HTML is required")
  
  // Check if "noDevice" payment method is selected or if there's no device data
  const hideDeviceSection = userInfo?.paymentMethod === 'noDevice' || 
    !(data.uredaj_proizvodac_model || data.uredaj_cijena || data.uredaj_popust || data.uredaj_za_placanje)
  
  // Remove device section if "noDevice" is selected or no device data exists
  if (hideDeviceSection) {
    // Remove the entire device section including the div wrapper
    html = html.replace(
      /<div style="margin-bottom: 8px;">\s*<h2 style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">Podaci o kupljenim uređajima<\/h2>[\s\S]*?<\/div>\s*$/m,
      ''
    )
    
    // Alternative approach - more comprehensive removal
    html = html.replace(
      /<div style="margin-bottom: 8px;">[^<]*<h2[^>]*>Podaci o kupljenim uređajima<\/h2>[\s\S]*?<\/table>\s*<\/div>\s*/g,
      ''
    )
  }

  if (!data) throw new Error("Data is required")

  // Define the note texts with new styling
  const onPremisesNote1 = `<p style="margin-bottom: 6px; color: red;">1.<br />U slučaju sklapanja ugovora u našim poslovnim prostorima, imate pravo na jednostrani raskid ugovora u roku od 3 dana od dana sklapanja ugovora.</p>`;
  const onPremisesNote2 = `<p style="margin-bottom: 6px; color: red;">2.<br />U slučaju da ste ugovorili i kupnju uređaja te preuzeli uređaj, a u roku od 3 dana od dana sklapanja ugovora zatražite raskid ugovora, možete vratiti preuzeti uređaj neoštećen i kompletan u originalnom pakiranju sa svom pripadajućom dokumentacijom. U protivnom Vam imamo pravo naplatiti maloprodajnu cijenu uređaja, umanjenu za inicijalno uplaćeni iznos.</p>`;

  const offPremisesNote1 = `<p style="margin-bottom: 6px; color: red;">U slučaju sklapanja ugovora putem sredstava daljinske komunikacije ili izvan naših poslovnih prostora, prema odredbama Zakona o zaštiti potrošača imate pravo na jednostrani raskid ugovora u roku od 14 dana od dana sklapanja ugovora. Ugovor sklopljen na daljinu smatra se sklopljenim kada nam nakon primitka dokumentacije o sklapanju dostavite potvrdu svoje suglasnosti o sklapanju ugovora, na jedan od sljedećih načina:<br /><br />
- potpisom ove obavijesti koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,<br />
- potpisom ove obavijesti i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,<br />
- odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili<br />
- plaćanjem prvog mjesečnog računa.</p>`;
  const offPremisesNote2 = `<p style="margin-bottom: 6px; color: red;">U slučaju da ste ugovorili i kupnju uređaja te preuzeli uređaj, a u roku od 14 dana od dana sklapanja ugovora zatražite raskid ugovora, u skladu s odredbama Zakona o zaštiti potrošača, možete vratiti preuzeti uređaj neoštećen i kompletan u originalnom pakiranju sa svom pripadajućom dokumentacijom. U protivnom Vam imamo pravo naplatiti maloprodajnu cijenu uređaja, umanjenu za inicijalno uplaćeni iznos.</p>`;

  // Add a style tag for hiding empty tables
  if (!html.includes('.hidden-section')) {
    html = html.replace('</head>', `<style>.hidden-section { display: none !important; }</style></head>`);
    // If there's no head tag, add it to the beginning
    if (!html.includes('</head>')) {
      html = `<style>.hidden-section { display: none !important; }</style>` + html;
    }
  }

  // Helper function to format currency values
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "0,00 EUR"
    return value.toFixed(2).replace(".", ",") + " EUR"
  }

  // Helper function to safely replace placeholders
  const safeReplace = (placeholder: string, value: string | number | null | undefined) => {
    const stringValue = value !== null && value !== undefined ? String(value) : ""
    html = html.replace(new RegExp(`\\[${placeholder}\\]`, 'g'), stringValue)
  }

  // Remove operator change content from main contract - now handled separately
    html = html.replace('<!-- ZAHTJEV_ZA_PROMJENU_OPERATERA -->', '');

  // Use contract number from form data, just remove user name for PDF display
  // Format should be "BASE_NUMBER - ACCESS_METHOD" (e.g. "025-06-09 - BS")
  let pdfContractNumber = data.broj_ugovora;
  if (pdfContractNumber) {
    // Extract base contract number and access method, removing user name
    // Format is: "BROJ ime prezime - način_pristupa"
    // We want: "BROJ - način_pristupa"
    const contractParts = pdfContractNumber.split(' ');
    const baseNumber = contractParts[0]; // Take only the first part (base number)
    
    // Look for access method after the last " - "
    const dashIndex = pdfContractNumber.lastIndexOf(' - ');
    if (dashIndex !== -1) {
      const accessMethod = pdfContractNumber.substring(dashIndex + 3); // Get everything after " - "
      pdfContractNumber = `${baseNumber} - ${accessMethod}`;
    } else {
      // No access method found, use just the base number
      pdfContractNumber = baseNumber;
    }
  } else {
    // Fallback if no contract number in form
    pdfContractNumber = `${data.id}`;
  }
  
  safeReplace('AGREEMENT_NUMBER', pdfContractNumber || `${data.id}`)
  safeReplace('CURRENT_DATE', data.contract_date || '')

  // Contract duration
  console.log('Package name:', (data as any).fiksni_paket)
  safeReplace('PACKAGE_NAME', (data as any).fiksni_paket || '')
  safeReplace('CONTRACT_DURATION', (data as any).contract_duration || '')

  // Internet service details
  safeReplace('INTERNET_SERVICE_NAME', 'Usluga fiksne mreže putem svjetlovodnog priključka')
  safeReplace('INTERNET_PACKAGE_NAME', data.fiksni_paket)
  safeReplace('INTERNET_SPEED', data.fiksna_brzina)
  safeReplace('INTERNET_ADDITIONAL_SERVICES', data.fiksne_dodatne_usluge)
  safeReplace('INTERNET_EQUIPMENT', data.fiksna_oprema)
  safeReplace('FIKSNI_NAZIV_USLUGE', data.fiksni_naziv_ugovorene_usluge)

  // TV service details
  safeReplace('TV_SERVICE_NAME', 'Usluga Televizije')
  safeReplace('TV_PACKAGE_NAME', data.tv_paket)
  safeReplace('TV_ADDITIONAL_SERVICES', calculatedData?.tvServices || data.tv_dodatne_usluge)
  safeReplace('TV_EQUIPMENT', data.tv_oprema)
  safeReplace('TV_NAZIV_USLUGE', calculatedData?.tvServiceName || data.tv_naziv_ugovorene_usluge)

  // Additional TV packages - FILMSKI
  const hasFilmskiPackage = calculatedData?.tvServices?.toLowerCase().includes('filmski') || data.tv_dodatne_usluge?.toLowerCase().includes('filmski')
  safeReplace('FILMSKI_SERVICE_NAME', hasFilmskiPackage ? 'FILMSKI paket' : '')
  safeReplace('FILMSKI_PROMO_PRICE', hasFilmskiPackage ? formatCurrency(5.00) : '')
  safeReplace('FILMSKI_REGULAR_PRICE', hasFilmskiPackage ? formatCurrency(5.00) : '')

  // Additional TV packages - ODRASLI
  const hasOdrasliPackage = calculatedData?.tvServices?.toLowerCase().includes('odrasli') || data.tv_dodatne_usluge?.toLowerCase().includes('odrasli')
  safeReplace('ODRASLI_SERVICE_NAME', hasOdrasliPackage ? 'ODRASLI paket' : '')
  safeReplace('ODRASLI_PROMO_PRICE', hasOdrasliPackage ? formatCurrency(5.00) : '')
  safeReplace('ODRASLI_REGULAR_PRICE', hasOdrasliPackage ? formatCurrency(5.00) : '')

  // Additional TV Card
  const hasAdditionalTvCard = calculatedData?.tvServices?.toLowerCase().includes('dodatna tv kartica') || data.tv_dodatne_usluge?.toLowerCase().includes('dodatna tv kartica')
  safeReplace('ADDITIONAL_TV_CARD_SERVICE_NAME', hasAdditionalTvCard ? 'Dodatna TV kartica' : '')
  safeReplace('ADDITIONAL_TV_CARD_PROMO_PRICE', hasAdditionalTvCard ? formatCurrency(3.98) : '')
  safeReplace('ADDITIONAL_TV_CARD_REGULAR_PRICE', hasAdditionalTvCard ? formatCurrency(3.98) : '')

  // MESH services using calculatedData or formData
  const meshServices = calculatedData?.meshServices || data.fiksne_dodatne_usluge || '';
  console.log('PDF Generator MESH debug:', {
    'calculatedData?.meshServices': calculatedData?.meshServices,
    'data.fiksne_dodatne_usluge': data.fiksne_dodatne_usluge,
    'final meshServices': meshServices
  })
  
  const hasFreeMesh = meshServices.toLowerCase().includes('besplatan mesh')
  safeReplace('FREE_MESH_SERVICE_NAME', hasFreeMesh ? 'BESPLATAN MESH' : '')
  safeReplace('FREE_MESH_PROMO_PRICE', hasFreeMesh ? formatCurrency(0.00) : '')
  safeReplace('FREE_MESH_REGULAR_PRICE', hasFreeMesh ? formatCurrency(3.00) : '')
  
  console.log('Free MESH detected:', hasFreeMesh)

  // Extract rental mesh count for pricing using calculatedData or formData
  const rentalMeshMatch = meshServices.match(/extra mesh u najam \((\d+)\)/i)
  const rentalMeshCount = rentalMeshMatch ? parseInt(rentalMeshMatch[1], 10) : 
    (meshServices.toLowerCase().includes('extra mesh u najam') ? 1 : 0)
  
  console.log('Rental MESH detected:', { rentalMeshMatch, rentalMeshCount })
  
  safeReplace('RENTAL_MESH_SERVICE_NAME', rentalMeshCount > 0 ? `EXTRA MESH U NAJAM (${rentalMeshCount})` : '')
  safeReplace('RENTAL_MESH_PROMO_PRICE', rentalMeshCount > 0 ? formatCurrency(rentalMeshCount * 3.00) : '')
  safeReplace('RENTAL_MESH_REGULAR_PRICE', rentalMeshCount > 0 ? formatCurrency(rentalMeshCount * 3.00) : '')

  // Phone service details
  safeReplace('PHONE_SERVICE_NAME', 'Usluga Telefona')
  safeReplace('PHONE_NUMBER', data.pretplatnicki_broj)
  safeReplace('PHONE_TARIFF', data.tarifa)
  safeReplace('PHONE_ADDITIONAL_SERVICES', calculatedData?.phoneServices || data.tel_dodatne_usluge)
  safeReplace('PHONE_EQUIPMENT', data.tel_oprema)
  safeReplace('TEL_NAZIV_USLUGE', calculatedData?.phoneServiceName || data.tel_naziv_ugovorene_usluge)

  // Dynamic additional phone services using extraTelefonPackages
  if (extraTelefonPackages && extraTelefonPackages.length > 0) {
    console.log('DEBUG: Extra telephone packages received:', extraTelefonPackages);
    console.log('DEBUG: Selected phone services:', calculatedData?.phoneServices);
    
    // Get selected services from calculatedData or form data
    const selectedPhoneServices = calculatedData?.phoneServices || data.tel_dodatne_usluge || '';

    // Filter packages to only include selected ones and populate placeholders
    let serviceIndex = 1;
    extraTelefonPackages.forEach((pkg: any) => {
      if (serviceIndex <= selectedPhoneServices.length && pkg.name) {
        // Check if this package is selected - handle both "Package Name" and "Package Name - Description" formats
        const isSelectedByName = selectedPhoneServices.toLowerCase().includes(pkg.name.toLowerCase());
        const isSelectedByFullFormat = pkg.description && 
          selectedPhoneServices.toLowerCase().includes(`${pkg.name.toLowerCase()} - ${pkg.description.toLowerCase()}`);
        
        if (isSelectedByName || isSelectedByFullFormat) {
          const serviceName = pkg.description ? `${pkg.name} - ${pkg.description}` : pkg.name;
          const servicePrice = pkg.price || 0;
          
          console.log(`DEBUG: Adding selected service ${serviceIndex}: ${serviceName} (${servicePrice} EUR)`);
          
          safeReplace(`TEL_EXTRA_SERVICE_${serviceIndex}_NAME`, serviceName)
          safeReplace(`TEL_EXTRA_SERVICE_${serviceIndex}_PROMO_PRICE`, formatCurrency(servicePrice))
          safeReplace(`TEL_EXTRA_SERVICE_${serviceIndex}_REGULAR_PRICE`, formatCurrency(servicePrice))
          
          serviceIndex++;
        }
      }
    })
    
    console.log(`DEBUG: Total selected telephone services added: ${serviceIndex - 1}`);
  } else {
    // Clear all dynamic telephone service placeholders if no packages available
    console.log('DEBUG: No extra telephone packages received, clearing placeholders');
    const maxTelephoneServices = 8;
    for (let i = 1; i <= maxTelephoneServices; i++) {
      safeReplace(`TEL_EXTRA_SERVICE_${i}_NAME`, '')
      safeReplace(`TEL_EXTRA_SERVICE_${i}_PROMO_PRICE`, '')
      safeReplace(`TEL_EXTRA_SERVICE_${i}_REGULAR_PRICE`, '')
    }
  }

  // Equipment details - conditionally remove section if no device data
  const hasDeviceData = !!(data.uredaj_proizvodac_model || data.uredaj_cijena || data.uredaj_popust || data.uredaj_za_placanje)
  
  safeReplace('EQUIPMENT__MODEL', data.uredaj_proizvodac_model)
  safeReplace('EQUIPMENT_PRICE', formatCurrency(data.uredaj_cijena))
  
  // Calculate equipment discount amount (not percentage)
  const equipmentPrice = data.uredaj_cijena || 0
  const equipmentDiscountPercent = data.uredaj_popust || 0
  const equipmentDiscountAmount = (equipmentPrice * equipmentDiscountPercent) / 100
  safeReplace('EQUIPMENT_DISCOUNT', formatCurrency(equipmentDiscountAmount))
  
  // Calculate payment amount if not provided
  const devicePaymentAmount = data.uredaj_za_placanje !== undefined && data.uredaj_za_placanje !== null
    ? data.uredaj_za_placanje
    : (data.uredaj_cijena || 0) - equipmentDiscountAmount
  
  safeReplace('EQUIPMENT_PAYMENT_AMOUNT', formatCurrency(devicePaymentAmount))
  safeReplace('EQUIPMENT_PAYMENT_ON_RATE', data.uredaj_otplata_na_rate ? "DA" : "NE")
  safeReplace('EQUIPMENT_PAYMENT_INSTALLMENTS', data.uredaj_broj_obroka)
  safeReplace('EQUIPMENT_INITIAL_PAYMENT', formatCurrency(data.uredaj_inicijalna_uplata))
  safeReplace('EQUIPMENT_MONTHLY_RATE', formatCurrency(data.uredaj_mjesecna_rata))
  

  // Terminal equipment
  console.log('DEBUG: Terminal equipment received:', terminalEquipment);
  console.log('DEBUG: Terminal equipment length:', terminalEquipment?.length);
  
  if (terminalEquipment && terminalEquipment.length > 0) {
    console.log('DEBUG: Processing terminal equipment:', terminalEquipment);
    
    // Equipment 1
    if (terminalEquipment.length >= 1) {
      console.log('DEBUG: Equipment 1:', terminalEquipment[0]);
      safeReplace('EQUIPMENT_NAME_1', terminalEquipment[0].name)
      safeReplace('EQUIPMENT_QUANTITY_1', terminalEquipment[0].quantity)
      safeReplace('EQUIPMENT_PRICE_1', formatCurrency(parseFloat(terminalEquipment[0].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_1', "")
      safeReplace('EQUIPMENT_QUANTITY_1', "")
      safeReplace('EQUIPMENT_PRICE_1', "")
    }

    // Equipment 2
    if (terminalEquipment.length >= 2) {
      safeReplace('EQUIPMENT_NAME_2', terminalEquipment[1].name)
      safeReplace('EQUIPMENT_QUANTITY_2', terminalEquipment[1].quantity)
      safeReplace('EQUIPMENT_PRICE_2', formatCurrency(parseFloat(terminalEquipment[1].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_2', "")
      safeReplace('EQUIPMENT_QUANTITY_2', "")
      safeReplace('EQUIPMENT_PRICE_2', "")
    }

    // Equipment 3
    if (terminalEquipment.length >= 3) {
      safeReplace('EQUIPMENT_NAME_3', terminalEquipment[2].name)
      safeReplace('EQUIPMENT_QUANTITY_3', terminalEquipment[2].quantity)
      safeReplace('EQUIPMENT_PRICE_3', formatCurrency(parseFloat(terminalEquipment[2].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_3', "")
      safeReplace('EQUIPMENT_QUANTITY_3', "")
      safeReplace('EQUIPMENT_PRICE_3', "")
    }

    if (terminalEquipment.length >= 4) {
      safeReplace('EQUIPMENT_NAME_4', terminalEquipment[3].name)
      safeReplace('EQUIPMENT_QUANTITY_4', terminalEquipment[3].quantity)
      safeReplace('EQUIPMENT_PRICE_4', formatCurrency(parseFloat(terminalEquipment[3].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_4', "")
      safeReplace('EQUIPMENT_QUANTITY_4', "")
      safeReplace('EQUIPMENT_PRICE_4', "")
    }
    if (terminalEquipment.length >= 5) {
      safeReplace('EQUIPMENT_NAME_5', terminalEquipment[4].name)
      safeReplace('EQUIPMENT_QUANTITY_5', terminalEquipment[4].quantity)
      safeReplace('EQUIPMENT_PRICE_5', formatCurrency(parseFloat(terminalEquipment[4].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_5', "")
      safeReplace('EQUIPMENT_QUANTITY_5', "")
      safeReplace('EQUIPMENT_PRICE_5', "")
    }
    
    if (terminalEquipment.length >= 6) {
      safeReplace('EQUIPMENT_NAME_6', terminalEquipment[5].name)
      safeReplace('EQUIPMENT_QUANTITY_6', terminalEquipment[5].quantity)
      safeReplace('EQUIPMENT_PRICE_6', formatCurrency(parseFloat(terminalEquipment[5].price)))
    } else {
      safeReplace('EQUIPMENT_NAME_6', "")
      safeReplace('EQUIPMENT_QUANTITY_6', "")
      safeReplace('EQUIPMENT_PRICE_6', "")
    }

    // Calculate total equipment price
    let totalEquipmentPrice = 0;
    console.log('DEBUG: Starting total price calculation');
    terminalEquipment.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price.replace(',', '.')) || 0; // Handle comma decimal separator
      const subtotal = quantity * price;
      totalEquipmentPrice += subtotal;
      console.log(`DEBUG Equipment: ${item.name}, Quantity: ${quantity}, Price: ${price}, Subtotal: ${subtotal}`);
    });
    
    console.log(`DEBUG: Total equipment price calculated: ${totalEquipmentPrice}`);
    console.log(`DEBUG: Formatted total price: ${formatCurrency(totalEquipmentPrice)}`);
    safeReplace('EQUIPMENT_TOTAL_PRICE', formatCurrency(totalEquipmentPrice))
    
  } else {
    console.log('DEBUG: No terminal equipment found, setting empty values');
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
    safeReplace('EQUIPMENT_NAME_4', "")
    safeReplace('EQUIPMENT_QUANTITY_4', "")
    safeReplace('EQUIPMENT_PRICE_4', "")
    safeReplace('EQUIPMENT_NAME_5', "")
    safeReplace('EQUIPMENT_QUANTITY_5', "")
    safeReplace('EQUIPMENT_PRICE_5', "")
    safeReplace('EQUIPMENT_NAME_6', "")
    safeReplace('EQUIPMENT_QUANTITY_6', "")
    safeReplace('EQUIPMENT_PRICE_6', "")
    
    // No equipment, total price is 0
    console.log('DEBUG: Setting total equipment price to 0');
    safeReplace('EQUIPMENT_TOTAL_PRICE', formatCurrency(0))
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
    : 0
  const connectionDiscountAmount = (connectionFee * connectionDiscountPercent) / 100
  const connectionFeeTotal = data.cijena_prikljucenja_ukupno !== undefined && data.cijena_prikljucenja_ukupno !== null
    ? data.cijena_prikljucenja_ukupno
    : connectionFee - connectionDiscountAmount

  // Activation fees
  const activationFee = data.cijena_aktivacije_naknada || 33.18
  const activationDiscountPercent = data.cijena_aktivacije_popust !== undefined && data.cijena_aktivacije_popust !== null
    ? data.cijena_aktivacije_popust
    : 0
  const activationDiscountAmount = (activationFee * activationDiscountPercent) / 100
  const activationFeeTotal = data.cijena_aktivacije_ukupno !== undefined && data.cijena_aktivacije_ukupno !== null
    ? data.cijena_aktivacije_ukupno
    : activationFee - activationDiscountAmount

  // Current date - use contract_date from data or leave empty
  safeReplace('CURRENT_DATE', data.contract_date || '')

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
  safeReplace('PROMO_PRICE_FIKSNI', formatCurrency((data as any).promo_price_fiksni))
  safeReplace('CONTRACT_PRICE_FIKSNI', formatCurrency((data as any).contract_price_fiksni))
  safeReplace('REGULAR_PRICE_FIKSNI', formatCurrency((data as any).regular_price_fiksni))
  
  safeReplace('TV_PAKET', data.tv_paket)
  safeReplace('TV_DODATNE_USLUGE', data.tv_dodatne_usluge)
  safeReplace('PROMO_PRICE_TV', formatCurrency((data as any).promo_price_tv))
  safeReplace('CONTRACT_PRICE_TV', formatCurrency((data as any).contract_price_tv))
  safeReplace('REGULAR_PRICE_TV', formatCurrency((data as any).regular_price_tv))
  
  safeReplace('TARIFA', data.tarifa)
  safeReplace('PRETPLATNICKI_BROJ', data.pretplatnicki_broj)
  safeReplace('PROMO_PRICE_PHONE', formatCurrency(calculatedData?.phonePromoPrice ?? (data as any).promo_price_phone))
  safeReplace('CONTRACT_PRICE_PHONE', formatCurrency(calculatedData?.phonePromoPrice ?? (data as any).contract_price_phone))
  safeReplace('REGULAR_PRICE_PHONE', formatCurrency(calculatedData?.phoneRegularPrice ?? (data as any).regular_price_phone))
  
  // Calculate and set total prices (moved to end to include all additional services)
  safeReplace('TOTAL_PROMO_PRICE', formatCurrency(calculateTotalPrice(data, 'promo', calculatedData, extraTelefonPackages)))
  safeReplace('TOTAL_CONTRACT_PRICE', formatCurrency(calculateTotalPrice(data, 'contract', calculatedData, extraTelefonPackages)))
  safeReplace('TOTAL_REGULAR_PRICE', formatCurrency(calculateTotalPrice(data, 'regular', calculatedData, extraTelefonPackages)))
  
  // User & Contract Information
  if (userInfo) {
    safeReplace('USER_ID', userInfo.userId)
    // If legal entity is provided, use it for display name, otherwise use user name
    const displayName = userInfo.legalEntity && userInfo.legalEntity.trim() !== '' 
      ? userInfo.legalEntity 
      : userInfo.userName;
    
    // For authorized person, only show user name if legal entity is provided
    const authorizedPersonName = userInfo.legalEntity && userInfo.legalEntity.trim() !== '' 
      ? userInfo.userName
      : '';
    
    safeReplace('DISPLAY_NAME', displayName)
    safeReplace('AUTHORIZED_PERSON_NAME', authorizedPersonName)
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
    safeReplace('INVOICE_DELIVERY_METHOD_MAIL', userInfo.invoiceDeliveryMethod.includes('mail') ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_EINVOICE', userInfo.invoiceDeliveryMethod.includes('eInvoice') ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_EMAIL', userInfo.invoiceDeliveryMethod.includes('email') ? '☑' : '☐')
    safeReplace('INVOICE_DELIVERY_METHOD_CONTACT_EMAIL', userInfo.invoiceDeliveryMethod.includes('contactEmail') ? '☑' : '☐')
    
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
    safeReplace('ACTIVATION_COST', formatCurrency(parseFloat(userInfo.activationCost || '0')))
    safeReplace('EXTERNAL_WORKS_COST', formatCurrency(parseFloat(userInfo.externalWorksCost || '0')))
    
    // Formatted methods
    const invoiceMethodMap: Record<string, string> = {
      'mail': 'poštom',
      'eInvoice': 'e-račun',
      'email': 'e-mailom',
      'contactEmail': 'e-mailom na kontakt osobu'
    }
    
    safeReplace('INVOICE_DELIVERY_METHOD_FORMATTED', 
      userInfo.invoiceDeliveryMethod ? invoiceMethodMap[userInfo.invoiceDeliveryMethod[0]] || userInfo.invoiceDeliveryMethod[0] : '')
    
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

  // Replace POSLOVNI_PROSTOR_NAPOMENA placeholders
  if (contractConcludedOnPremises) {
    html = html.replace('<!--POSLOVNI_PROSTOR_NAPOMENA_1-->', onPremisesNote1);
    html = html.replace('<!--POSLOVNI_PROSTOR_NAPOMENA_2-->', onPremisesNote2);
  } else {
    html = html.replace('<!--POSLOVNI_PROSTOR_NAPOMENA_1-->', offPremisesNote1);
    html = html.replace('<!--POSLOVNI_PROSTOR_NAPOMENA_2-->', offPremisesNote2);
  }

  return html
}

// Helper function to calculate total prices
function calculateTotalPrice(
  data: ContractData, 
  type: 'promo' | 'contract' | 'regular',
  calculatedData?: {
    phoneServices?: string
    phonePromoPrice?: number
    phoneRegularPrice?: number
    phoneServiceName?: string
    tvServices?: string
    tvPromoPrice?: number
    tvRegularPrice?: number
    tvServiceName?: string
    internetServices?: string
    internetPromoPrice?: number
    internetRegularPrice?: number
    internetServiceName?: string
    meshServices?: string
    meshPromoPrice?: number
    meshRegularPrice?: number
    meshServiceName?: string
  },
  extraTelefonPackages?: any[]
): number {
  const fiksniPrice = (data as any)[`${type}_price_fiksni`] || 0;
  const tvPrice = (data as any)[`${type}_price_tv`] || 0;
  const phonePrice = (data as any)[`${type}_price_phone`] || 0;
  
  console.log(`Calculating ${type} total:`, {
    fiksniPrice,
    tvPrice,
    phonePrice,
    tv_dodatne_usluge: data.tv_dodatne_usluge,
    fiksne_dodatne_usluge: data.fiksne_dodatne_usluge,
    tel_dodatne_usluge: data.tel_dodatne_usluge,
    calculatedData
  });
  
  let additionalServicesPrice = 0;
  
  // Use calculatedData for TV services if available, otherwise fall back to data fields
  const tvServices = calculatedData?.tvServices || data.tv_dodatne_usluge || '';
  const phoneServices = calculatedData?.phoneServices || data.tel_dodatne_usluge || '';
  const meshServices = calculatedData?.meshServices || data.fiksne_dodatne_usluge || '';
  
  // Add TV additional packages using calculatedData or formData
  if (tvServices.toLowerCase().includes('filmski')) {
    additionalServicesPrice += 5.00;
    console.log('Added FILMSKI: +5.00');
  }
  if (tvServices.toLowerCase().includes('odrasli')) {
    additionalServicesPrice += 5.00;
    console.log('Added ODRASLI: +5.00');
  }
  if (tvServices.toLowerCase().includes('dodatna tv kartica')) {
    additionalServicesPrice += 3.98;
    console.log('Added Dodatna TV kartica: +3.98');
  }
  
  // Add MESH services using calculatedData or formData
  if (meshServices.toLowerCase().includes('besplatan mesh')) {
    if (type === 'promo') {
      additionalServicesPrice += 0.00; // Free in promo period
      console.log('Added BESPLATAN MESH (promo): +0.00');
    } else {
      additionalServicesPrice += 3.00; // Regular price
      console.log('Added BESPLATAN MESH (regular): +3.00');
    }
  }
  
  // Add rental MESH services using calculatedData or formData
  const rentalMeshMatch = meshServices.match(/extra mesh u najam \((\d+)\)/i);
  const rentalMeshCount = rentalMeshMatch ? parseInt(rentalMeshMatch[1], 10) : 
    (meshServices.toLowerCase().includes('extra mesh u najam') ? 1 : 0);
  
  if (rentalMeshCount > 0) {
    additionalServicesPrice += rentalMeshCount * 3.00; // 3 EUR per unit for both promo and regular
    console.log(`Added ${rentalMeshCount} RENTAL MESH: +${rentalMeshCount * 3.00}`);
  }
  
  // Helper function to get package price by name from extraTelefonPackages
  const getPackagePrice = (packageName: string): number => {
    if (!extraTelefonPackages || extraTelefonPackages.length === 0) {
      // Fallback to hardcoded prices if no packages available
      const fallbackPrices: Record<string, number> = {
        'telefonski mix 1': 2.65,
        'telefonski mix 2': 4.65,
        'telefon europa 1 100': 5.18,
        'telefon europa 1 200': 9.95,
        'telefon europa 2 100': 7.30,
        'telefon europa 2 200': 13.14
      };
      return fallbackPrices[packageName.toLowerCase()] || 0;
    }
    
    const pkg = extraTelefonPackages.find((p: any) => 
      p.name && p.name.toLowerCase().includes(packageName.toLowerCase())
    );
    return pkg ? (pkg.price || 0) : 0;
  };

  // Add telephone services using extraTelefonPackages or calculatedData
  if (extraTelefonPackages && extraTelefonPackages.length > 0) {
    // Get selected services from calculatedData or form data
    const selectedPhoneServices = calculatedData?.phoneServices || data.tel_dodatne_usluge || '';
    
    extraTelefonPackages.forEach((pkg: any) => {
      if (pkg.name && selectedPhoneServices.toLowerCase().includes(pkg.name.toLowerCase())) {
        const servicePrice = pkg.price || 0;
        additionalServicesPrice += servicePrice;
        console.log(`Added telephone service ${pkg.name}: +${servicePrice}`);
      }
    });
  }
  
  const total = fiksniPrice + tvPrice + phonePrice + additionalServicesPrice;
  console.log(`Total ${type}: ${total} (base: ${fiksniPrice + tvPrice + phonePrice}, additional: ${additionalServicesPrice})`);
  
  return total;
}

export async function generateOperatorChangePDF(
  data: ContractData,
  userInfo?: UserInformation,
  operatorChangeData?: OperatorChangeData
) {
  // Make sure html2pdf is available
  if (typeof window === "undefined" || !window.html2pdf) {
    throw new Error("html2pdf is not available")
  }

  // Hide UI elements temporarily (navigation bars, buttons, etc.)
  const hideUIForPdfGeneration = () => {
    // Store original styles to restore later
    const elementsToHide = [
      document.querySelector('nav'),
      document.querySelector('header'),
      ...Array.from(document.querySelectorAll('button:not(.pdf-content button)')),
      ...Array.from(document.querySelectorAll('.pdf-button-container')),
      document.querySelector('footer'),
      ...Array.from(document.querySelectorAll('.ui-element')), // Add class to any custom UI elements
      ...Array.from(document.querySelectorAll('[role="tablist"]')),
      ...Array.from(document.querySelectorAll('.tabs-container')),
      document.querySelector('.mt-12.pt-8.border-t') // Email section
    ];

    // Store original display values to restore later
    const originalStyles: Map<HTMLElement, string> = new Map();
    
    elementsToHide.forEach(el => {
      if (el && el instanceof HTMLElement) {
        originalStyles.set(el, el.style.display);
        el.style.display = 'none';
      }
    });

    return originalStyles;
  };

  // Restore UI elements after PDF generation
  const restoreUI = (originalStyles: Map<HTMLElement, string>) => {
    originalStyles.forEach((originalDisplay, element) => {
      if (element) {
        element.style.display = originalDisplay;
      }
    });
  };

  // Merge default options with provided options
  const options = { ...defaultStyleOptions }

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
  let originalStyles: Map<HTMLElement, string> | null = null;

  try {
    // Hide UI elements before generating PDF
    originalStyles = hideUIForPdfGeneration();

    // Get the operator change HTML template
    const response = await fetch('/promjena_operatera.html');
    const promjenaOperateraHtmlContent = await response.text();
    
    if (!promjenaOperateraHtmlContent) {
      throw new Error('No operator change template found');
    }
    
    // Track contract creation to get a proper contract number
    let contractNumber = '';
    
    try {
      // Get user_id directly from auth context
      let userId = null;
      let userCode = null;
      
      // Get profile data if available
      if (window.hasOwnProperty('profileData')) {
        const profileData = (window as any).profileData;
        console.log("Profile data:", profileData);
        
        // Always use the user_id from profileData which comes from auth context
        if (profileData && profileData.user_id) {
          userId = profileData.user_id;
          
          // Get user code for contract numbering - always use user_number
          if (profileData.user_number) {
            userCode = String(profileData.user_number).padStart(2, '0');
          } else {
            userCode = getUserCode(profileData);
          }
        }
      }

      console.log("User ID from auth context:", userId, "User Code:", userCode);
      
      // Track contract creation and get the generated contract number
      if (userId) {
        const result = await trackContractCreation(
          userId || undefined,
          userCode || undefined
        );
        console.log("Contract creation tracked in database:", result);
        
        // If successful, store the generated contract number
        if (result && result.success && result.contract_number) {
          contractNumber = result.contract_number;
          console.log("Using contract number:", contractNumber);
          
          // Store for future reference
          if (typeof window !== "undefined") {
            (window as any).lastContractNumber = contractNumber;
          }
        }
      }
    } catch (trackingError) {
      console.error("Error tracking contract creation:", trackingError);
      // Don't fail the entire operation if tracking fails
    }
    
    // Process only the operator change template with actual data
    const processedHtml = formatOperatorChangeHtml(
      promjenaOperateraHtmlContent, 
      data, 
      userInfo, 
      contractNumber || agreementNumber,
      operatorChangeData
    );
    
    let htmlContentForPdf = processedHtml;
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
      // htmlContentForPdf remains processedHtml, html2pdf will attempt to fetch it using its own mechanisms.
    }
    

    // Create a container for the PDF content
    container = document.createElement("div");
    container.className = "pdf-content";
    
    // Set the processed HTML to the container
    container.innerHTML = htmlContentForPdf;
    
    // Temporarily append to document to render
    document.body.appendChild(container);
    
    // Generate PDF with proper contract numbering
    const ownerPassword = process.env.NEXT_PUBLIC_PDF_OWNER_PASSWORD
    
    // Create filename using same format as PDF contract number (base + access method)
    let filename = 'operator-change.pdf'; // fallback
    
    if (data.broj_ugovora) {
      // Extract base contract number and access method, removing user name
      // Format is: "BROJ ime prezime - način_pristupa"
      // We want: "BROJ - način_pristupa - operator-change" for filename
      const contractParts = data.broj_ugovora.split(' ');
      const baseNumber = contractParts[0]; // Take only the first part (base number)
      
      // Look for access method after the last " - "
      const dashIndex = data.broj_ugovora.lastIndexOf(' - ');
      if (dashIndex !== -1) {
        const accessMethod = data.broj_ugovora.substring(dashIndex + 3); // Get everything after " - "
        filename = `${baseNumber} - ${accessMethod} - operator-change.pdf`;
      } else {
        // No access method found, use just the base number
        filename = baseNumber + ' - operator-change.pdf';
      }
    } else if (contractNumber) {
      // Fallback to contract number if broj_ugovora is not available
      filename = 'operator-change-' + contractNumber + '.pdf';
    } else {
      // Fallback if no contract number in form
      filename = 'operator-change.pdf';
    }
    
    // Use the contract number if available
    const pdfOptions = {
      filename: filename,
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
    console.error("Error generating operator change PDF:", error)
    return false
  } finally {
    // Clean up the container that was added to the body
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    
    // Restore UI elements
    if (originalStyles) {
      restoreUI(originalStyles);
    }
  }
}

function formatOperatorChangeHtml(
  html: string, 
  data: ContractData, 
  userInfo?: UserInformation, 
  contractNumber?: string,
  operatorChangeData?: OperatorChangeData
): string {
  if (!html) throw new Error("HTML is required")
  if (!data) throw new Error("Data is required")

  // Helper function to safely replace placeholders
  const safeReplace = (placeholder: string, value: string | number | null | undefined) => {
    const stringValue = value !== null && value !== undefined ? String(value) : ""
    html = html.replace(new RegExp(`\\[${placeholder}\\]`, 'g'), stringValue)
  }

  // Replace basic placeholders
  // Use contract number from form data, just remove user name for PDF display
  // Format should be "BASE_NUMBER - ACCESS_METHOD" (e.g. "025-06-09 - BS")
  let pdfContractNumber = data.broj_ugovora;
  if (pdfContractNumber) {
    // Extract base contract number and access method, removing user name
    // Format is: "BROJ ime prezime - način_pristupa"
    // We want: "BROJ - način_pristupa"
    const contractParts = pdfContractNumber.split(' ');
    const baseNumber = contractParts[0]; // Take only the first part (base number)
    
    // Look for access method after the last " - "
    const dashIndex = pdfContractNumber.lastIndexOf(' - ');
    if (dashIndex !== -1) {
      const accessMethod = pdfContractNumber.substring(dashIndex + 3); // Get everything after " - "
      pdfContractNumber = `${baseNumber} - ${accessMethod}`;
    } else {
      // No access method found, use just the base number
      pdfContractNumber = baseNumber;
    }
  } else {
    // Fallback if no contract number in form
    pdfContractNumber = `${data.id}`;
  }
  
  safeReplace('AGREEMENT_NUMBER', pdfContractNumber || `${data.id}`)
  safeReplace('CURRENT_DATE', data.contract_date || '')

  // User information - use operatorChangeData fields if available, otherwise fall back to userInfo
  if (operatorChangeData) {
    // Determine display name: legal entity if provided, otherwise user name
    const operatorDisplayName = operatorChangeData.legalEntity && operatorChangeData.legalEntity.trim() !== '' 
      ? operatorChangeData.legalEntity 
      : (operatorChangeData.userName || (userInfo?.userName || ''));
    
    // For authorized person, only show user name if legal entity is provided
    const authorizedPersonName = operatorChangeData.legalEntity && operatorChangeData.legalEntity.trim() !== '' 
      ? (operatorChangeData.userName || (userInfo?.userName || ''))
      : '';
    
    safeReplace('DISPLAY_NAME', operatorDisplayName)
    safeReplace('AUTHORIZED_PERSON_NAME', authorizedPersonName)
    safeReplace('USER_NAME', operatorChangeData.userName || (userInfo?.userName || ''))  // Always show user name, not authorized person
    safeReplace('OIB', operatorChangeData.oib || (userInfo?.oib || ''))
    safeReplace('PHONE_NUMBER', operatorChangeData.phoneNumber || (data.pretplatnicki_broj || ''))
    safeReplace('CONTACT_PHONE', operatorChangeData.contactPhone || (userInfo?.contactPhone || ''))
    safeReplace('EMAIL', operatorChangeData.email || (userInfo?.email || ''))
    safeReplace('CONNECTION_ADDRESS', operatorChangeData.connectionAddress || (userInfo?.connectionAddress || ''))
    safeReplace('SELLER_PLACE', operatorChangeData.sellerPlace || (userInfo?.sellerPlace || ''))
  } else if (userInfo) {
    // Determine display name: legal entity if provided, otherwise user name
    const userDisplayName = userInfo.legalEntity && userInfo.legalEntity.trim() !== '' 
      ? userInfo.legalEntity 
      : userInfo.userName;
    
    // For authorized person, only show user name if legal entity is provided
    const authorizedPersonName = userInfo.legalEntity && userInfo.legalEntity.trim() !== '' 
      ? userInfo.userName
      : '';
    
    safeReplace('DISPLAY_NAME', userDisplayName)
    safeReplace('AUTHORIZED_PERSON_NAME', authorizedPersonName)
    safeReplace('USER_NAME', userInfo.userName)  // Always show user name, not authorized person
    safeReplace('OIB', userInfo.oib)
    safeReplace('PHONE_NUMBER', data.pretplatnicki_broj)
    safeReplace('CONTACT_PHONE', userInfo.contactPhone)
    safeReplace('EMAIL', userInfo.email)
    safeReplace('CONNECTION_ADDRESS', userInfo.connectionAddress)
    safeReplace('SELLER_PLACE', userInfo.sellerPlace)
  }

  // Process operator change data checkboxes if available
  if (operatorChangeData) {
    console.log('DEBUG: Processing operator change checkboxes with data:', operatorChangeData);
    
    // Log a portion of HTML to see the structure
    const htmlSample = html.substring(html.indexOf('OSNOVNI PODACI'), html.indexOf('OSNOVNI PODACI') + 500);
    console.log('DEBUG: HTML sample around OSNOVNI PODACI:', htmlSample);
    
    // Basic operator information
    html = html.replace(/____________________/g, operatorChangeData.existingOperatorName || '____________________');
    
    // Checkboxes for boolean values - use more robust patterns
    console.log('DEBUG: Contract on distance:', operatorChangeData.contractOnDistance);
    // Try multiple patterns for contract on distance
    html = html.replace(/(<input[^>]*id="daljina_da"[^>]*)/g, 
      `$1${operatorChangeData.contractOnDistance ? ' checked' : ''}`);
    html = html.replace(/(<input[^>]*id="daljina_ne"[^>]*)/g, 
      `$1${!operatorChangeData.contractOnDistance ? ' checked' : ''}`);
    
    // Fallback: completely replace the input tags if the above doesn't work
    if (operatorChangeData.contractOnDistance) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="daljina_da"\s+name="ugovor_daljina"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="daljina_da" name="ugovor_daljina" value="da" checked />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="daljina_ne"\s+name="ugovor_daljina"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="daljina_ne" name="ugovor_daljina" value="ne" />'
      );
    } else {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="daljina_da"\s+name="ugovor_daljina"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="daljina_da" name="ugovor_daljina" value="da" />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="daljina_ne"\s+name="ugovor_daljina"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="daljina_ne" name="ugovor_daljina" value="ne" checked />'
      );
    }
    
    console.log('DEBUG: Agree to pay debts:', operatorChangeData.agreeToPayDebts);
    html = html.replace(/(<input[^>]*id="podmiriti_dugovanja"[^>]*)/g, 
      `$1${operatorChangeData.agreeToPayDebts ? ' checked' : ''}`);
    
    // Fallback for podmiriti_dugovanja
    if (operatorChangeData.agreeToPayDebts) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="podmiriti_dugovanja"\s+name="podmiriti_dugovanja"\s*\/?>/g,
        '<input type="checkbox" id="podmiriti_dugovanja" name="podmiriti_dugovanja" checked />'
      );
    }
    
    console.log('DEBUG: Number transfer:', operatorChangeData.numberTransfer);
    html = html.replace(/(<input[^>]*id="prijenos_da"[^>]*)/g, 
      `$1${operatorChangeData.numberTransfer ? ' checked' : ''}`);
    html = html.replace(/(<input[^>]*id="prijenos_ne"[^>]*)/g, 
      `$1${!operatorChangeData.numberTransfer ? ' checked' : ''}`);
    
    // Fallback for number transfer
    if (operatorChangeData.numberTransfer) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="prijenos_da"\s+name="prijenos_broja"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="prijenos_da" name="prijenos_broja" value="da" checked />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="prijenos_ne"\s+name="prijenos_broja"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="prijenos_ne" name="prijenos_broja" value="ne" />'
      );
    } else {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="prijenos_da"\s+name="prijenos_broja"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="prijenos_da" name="prijenos_broja" value="da" />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="prijenos_ne"\s+name="prijenos_broja"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="prijenos_ne" name="prijenos_broja" value="ne" checked />'
      );
    }
    
    console.log('DEBUG: Notification agreement:', operatorChangeData.notificationAgreement);
    html = html.replace(/(<input[^>]*id="obavijest_datum"[^>]*)/g, 
      `$1${operatorChangeData.notificationAgreement ? ' checked' : ''}`);
    
    // Fallback for notification agreement
    if (operatorChangeData.notificationAgreement) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="obavijest_datum"\s+name="obavijest_datum"\s*\/?>/g,
        '<input type="checkbox" id="obavijest_datum" name="obavijest_datum" checked />'
      );
    }
    
    console.log('DEBUG: VPN series:', operatorChangeData.vpnSeries);
    html = html.replace(/(<input[^>]*id="vpn_da"[^>]*)/g, 
      `$1${operatorChangeData.vpnSeries ? ' checked' : ''}`);
    html = html.replace(/(<input[^>]*id="vpn_ne"[^>]*)/g, 
      `$1${!operatorChangeData.vpnSeries ? ' checked' : ''}`);
    
    // Fallback for VPN series
    if (operatorChangeData.vpnSeries) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="vpn_da"\s+name="vpn_serija"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="vpn_da" name="vpn_serija" value="da" checked />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="vpn_ne"\s+name="vpn_serija"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="vpn_ne" name="vpn_serija" value="ne" />'
      );
    } else {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="vpn_da"\s+name="vpn_serija"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="vpn_da" name="vpn_serija" value="da" />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="vpn_ne"\s+name="vpn_serija"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="vpn_ne" name="vpn_serija" value="ne" checked />'
      );
    }
    
    console.log('DEBUG: Wholesale service:', operatorChangeData.wholesaleService);
    html = html.replace(/(<input[^>]*id="veleprodaja_da"[^>]*)/g, 
      `$1${operatorChangeData.wholesaleService ? ' checked' : ''}`);
    html = html.replace(/(<input[^>]*id="veleprodaja_ne"[^>]*)/g, 
      `$1${!operatorChangeData.wholesaleService ? ' checked' : ''}`);
    
    // Fallback for wholesale service
    if (operatorChangeData.wholesaleService) {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="veleprodaja_da"\s+name="veleprodaja_usluga"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="veleprodaja_da" name="veleprodaja_usluga" value="da" checked />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="veleprodaja_ne"\s+name="veleprodaja_usluga"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="veleprodaja_ne" name="veleprodaja_usluga" value="ne" />'
      );
    } else {
      html = html.replace(
        /<input\s+type="checkbox"\s+id="veleprodaja_da"\s+name="veleprodaja_usluga"\s+value="da"\s*\/?>/g,
        '<input type="checkbox" id="veleprodaja_da" name="veleprodaja_usluga" value="da" />'
      );
      html = html.replace(
        /<input\s+type="checkbox"\s+id="veleprodaja_ne"\s+name="veleprodaja_usluga"\s+value="ne"\s*\/?>/g,
        '<input type="checkbox" id="veleprodaja_ne" name="veleprodaja_usluga" value="ne" checked />'
      );
    }
    
    // Services to cancel checkboxes - handle individual services only
    console.log('DEBUG: Services to cancel:', operatorChangeData.servicesToCancel);
    
    // Handle individual cancel service checkboxes
    const servicesToCancelServices = ['Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija'];
    const cancelServiceIds = ['cancel_pristup', 'cancel_govorna', 'cancel_internet', 'cancel_televizija'];
    
    servicesToCancelServices.forEach((service, index) => {
      const isChecked = operatorChangeData.servicesToCancel.includes(service) || operatorChangeData.cancelAllServices;
      const serviceId = cancelServiceIds[index];
      console.log(`DEBUG: Cancel service "${service}" (${serviceId}): ${isChecked}`);
      
      // Update by ID first
      html = html.replace(
        new RegExp(`(<input[^>]*id="${serviceId}"[^>]*)`, 'g'),
        `$1${isChecked ? ' checked' : ''}`
      );
      
      // Fallback: update by text pattern if ID method doesn't work
      const cancelSectionRegex = new RegExp(
        `(Usluge koje korisnik želi raskinuti s postojećim operatorom:[\\s\\S]*?)<input type="checkbox" />\\s*${service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'g'
      );
      html = html.replace(cancelSectionRegex, `$1<input type="checkbox"${isChecked ? ' checked' : ''} /> ${service}`);
    });
    
    // Services to keep checkboxes - handle individual services only
    console.log('DEBUG: Services to keep:', operatorChangeData.servicesToKeep);
    
    // Handle individual keep service checkboxes
    const servicesToKeepServices = ['Pristup mreži', 'Govorna usluga', 'Internet', 'Televizija'];
    const keepServiceIds = ['keep_pristup', 'keep_govorna', 'keep_internet', 'keep_televizija'];
    
    servicesToKeepServices.forEach((service, index) => {
      const isChecked = operatorChangeData.servicesToKeep.includes(service) || operatorChangeData.keepAllServices;
      const serviceId = keepServiceIds[index];
      console.log(`DEBUG: Keep service "${service}" (${serviceId}): ${isChecked}`);
      
      // Update by ID first
      html = html.replace(
        new RegExp(`(<input[^>]*id="${serviceId}"[^>]*)`, 'g'),
        `$1${isChecked ? ' checked' : ''}`
      );
      
      // Fallback: update by text pattern if ID method doesn't work
      const keepSectionRegex = new RegExp(
        `(Usluge koje korisnik želi zadržati s postojećim operatorom:[\\s\\S]*?)<input type="checkbox" />\\s*${service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'g'
      );
      html = html.replace(keepSectionRegex, `$1<input type="checkbox"${isChecked ? ' checked' : ''} /> ${service}`);
    });
    
    // User accounts to keep checkboxes
    console.log('DEBUG: User accounts to keep:', operatorChangeData.userAccountsToKeep);
    const accountsToKeepServices = ['web hosting', 'adrese elektroničke pošte', 'svi korisnički računi'];
    accountsToKeepServices.forEach(account => {
      const isChecked = operatorChangeData.userAccountsToKeep.includes(account);
      console.log(`DEBUG: Keep account "${account}": ${isChecked}`);
      // Find the section for user accounts and update checkboxes there
      const accountSectionRegex = new RegExp(
        `(Vezano uz uslugu pristupa internetu zadržavaju se korisnički računi:[\\s\\S]*?)<input type="checkbox" />\\s*${account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'g'
      );
      html = html.replace(accountSectionRegex, `$1<input type="checkbox"${isChecked ? ' checked' : ''} /> ${account}`);
    });
  }

  return html
}