"use client"

import type { ContractData } from "./supabase"
import type { PdfStyleOptions } from "@/components/pdf-style-options"
import type { UserInformation } from "@/components/user-information-form"

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

export async function generatePDF(
  data: ContractData,
  userInfo?: UserInformation,
  styleOptions?: Partial<PdfStyleOptions>,
  terminalEquipment?: TerminalEquipment[],
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

  // Calculate payment amounts
  // Device payment calculation
  const devicePrice = data.uredaj_cijena || 0
  const deviceDiscount = data.uredaj_popust || 0
  const devicePaymentAmount = data.uredaj_za_placanje || devicePrice - deviceDiscount

  // Connection fee calculation
  const connectionFee = data.cijena_prikljucenja_naknada || 40.0 // Default to 40 EUR if not specified
  const connectionDiscountPercent = data.cijena_prikljucenja_popust || 100 // Default to 100% discount
  const connectionDiscountAmount = (connectionFee * connectionDiscountPercent) / 100
  const connectionFeeTotal = data.cijena_prikljucenja_ukupno || connectionFee - connectionDiscountAmount

  // Activation fee calculation
  const activationFee = data.cijena_aktivacije_naknada || 33.18 // Default to 33.18 EUR if not specified
  const activationDiscountPercent = data.cijena_aktivacije_popust || 100 // Default to 100% discount
  const activationDiscountAmount = (activationFee * activationDiscountPercent) / 100
  const activationFeeTotal = data.cijena_aktivacije_ukupno || activationFee - activationDiscountAmount

  // Create a container for the PDF content
  const container = document.createElement("div")
  container.className = "pdf-container"
  container.style.fontFamily = options.fontFamily
  container.style.fontSize = `${options.fontSize}px`
  container.style.color = "#333"
  container.style.margin = "0 auto" // Center the content
  container.style.width = "100%"
  container.style.maxWidth = "100%"
  container.style.boxSizing = "border-box"
  container.style.position = "relative"

  // Define table styles based on the selected style
  let tableStyle = ""
  switch (options.tableStyle) {
    case "bordered":
      tableStyle = `
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-bottom: 15px; 
          table-layout: fixed;
          max-width: 100%;
        }
        th, td { 
          padding: 6px; 
          border: 1px solid #ddd; 
          line-height: 1.2; 
          overflow: hidden; 
          word-wrap: break-word;
          max-width: 100%;
        }
        th { 
          background-color: ${options.secondaryColor}; 
          text-align: center; 
          font-weight: bold; 
        }
        td { vertical-align: top; }
      `
      break
    case "striped":
      tableStyle = `
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-bottom: 15px; 
          table-layout: fixed;
          max-width: 100%;
        }
        th, td { 
          padding: 6px; 
          border: none; 
          border-bottom: 1px solid #ddd; 
          line-height: 1.2; 
          overflow: hidden; 
          word-wrap: break-word;
          max-width: 100%;
        }
        th { 
          background-color: ${options.primaryColor}; 
          color: white; 
          text-align: center; 
          font-weight: bold; 
        }
        td { vertical-align: top; }
        tr:nth-child(even) { background-color: ${options.secondaryColor}; }
      `
      break
    case "minimal":
      tableStyle = `
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-bottom: 15px; 
          table-layout: fixed;
          max-width: 100%;
        }
        th, td { 
          padding: 6px; 
          border: none; 
          border-bottom: 1px solid #eee; 
          line-height: 1.2; 
          overflow: hidden; 
          word-wrap: break-word;
          max-width: 100%;
        }
        th { 
          border-bottom: 2px solid ${options.primaryColor}; 
          text-align: left; 
          font-weight: bold; 
        }
        td { vertical-align: top; }
      `
      break
  }

  // Create a style element for custom styles
  const styleElement = document.createElement("style")
  styleElement.textContent = `
  @page {
    size: ${options.pageSize} ${options.orientation};
    margin: ${options.margins}mm;
  }
  body { 
    font-family: ${options.fontFamily}, sans-serif; 
    font-size: ${options.fontSize}px;
    margin: 0;
    padding: 0;
  }
  .pdf-content {
    padding: 15px;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    margin: 0 auto;
  }
  h1, h2, h3, h4, h5, h6 { color: ${options.primaryColor}; margin-top: 15px; margin-bottom: 10px; }
  .page-header { color: ${options.primaryColor}; }
  .page-break { 
    page-break-after: always !important; 
    break-after: page !important;
    height: 0;
    display: block;
  }
  ${tableStyle}
  ${
    options.showPageNumbers
      ? `
    .page-number:before { content: "Page " counter(page); }
    @page { @bottom-right { content: counter(page); } }
  `
      : ""
  }
  table { 
    page-break-inside: avoid; 
    width: 100% !important; 
    max-width: 100% !important;
    table-layout: fixed !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  td, th { 
    word-break: break-word; 
    max-width: 100%;
    overflow-wrap: break-word;
  }
`

  // Add page numbers if enabled
  const pageNumbersHtml = options.showPageNumbers
    ? `
    <div class="page-numbers" style="position: absolute; bottom: 20px; right: 20px; font-size: 10px;">
      <span class="page-number"></span>
    </div>
  `
    : ""

  // Determine logo position style
  let logoStyle = ""
  switch (options.logoPosition) {
    case "left":
      logoStyle = "float: left; margin-right: 15px;"
      break
    case "center":
      logoStyle = "display: block; margin: 0 auto 15px auto;"
      break
    case "right":
      logoStyle = "float: right; margin-left: 15px;"
      break
  }

  // Generate user information HTML if provided
  const userInfoHtml = userInfo
    ? `
    <!-- User Information Section -->
    <div style="margin-bottom: 15px;">
      <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid ${options.primaryColor}; padding-bottom: 5px;">PODACI O KORISNIKU</h2>
      
      <table>
        <tr>
          <td style="width: 40%;">ID Korisnika:</td>
          <td>${userInfo.userId || ""}</td>
        </tr>
        <tr>
          <td>Ime i prezime Korisnika (fizička osoba/ovlaštena osoba):</td>
          <td>${userInfo.userName || ""}</td>
        </tr>
        <tr>
          <td>Pravna osoba:</td>
          <td>${userInfo.legalEntity || ""}</td>
        </tr>
        <tr>
          <td>Prebivalište/sjedište (ulica i kućni broj, kat, poštanski broj, mjesto):</td>
          <td>${userInfo.residenceAddress || ""}</td>
        </tr>
        <tr>
          <td>Adresa priključka (ulica i kućni broj, kat, poštanski broj, mjesto):</td>
          <td>${userInfo.connectionAddress || ""}</td>
        </tr>
        <tr>
          <td>OIB (fizička osoba/pravna osoba):</td>
          <td>${userInfo.oib || ""}</td>
        </tr>
        <tr>
          <td>Kontakt telefon/mobitel (fizička osoba/ovlaštena osoba):</td>
          <td>${userInfo.contactPhone || ""}</td>
        </tr>
        <tr>
          <td>E-mail adresa (fizička osoba/ovlaštena osoba):</td>
          <td>${userInfo.email || ""}</td>
        </tr>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px;">PODACI O KONTAKT OSOBI</h3>
      <table>
        <tr>
          <td style="width: 40%;">Ime i prezime kontakt osobe:</td>
          <td>${userInfo.contactPersonName || ""}</td>
        </tr>
        <tr>
          <td>Kontakt telefon/mobitel:</td>
          <td>${userInfo.contactPersonPhone || ""}</td>
        </tr>
        <tr>
          <td>E-mail adresa za kontakt:</td>
          <td>${userInfo.contactPersonEmail || ""}</td>
        </tr>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px;">DODATNE INFORMACIJE</h3>
      <table>
        <tr>
          <td style="width: 40%;">Paket:</td>
          <td>${data.fiksni_paket || data.tv_paket || data.tarifa || ""}</td>
        </tr>
        <tr>
          <td>Dodatne usluge:</td>
          <td>${userInfo.additionalServices || ""}</td>
        </tr>
        <tr>
          <td>Pretplatnički broj:</td>
          <td>${data.pretplatnicki_broj || ""}</td>
        </tr>
        <tr>
          <td>Trošak aktivacije usluge:</td>
          <td>${userInfo.activationCost || ""}</td>
        </tr>
        <tr>
          <td>Trošak Vanjskih radova:</td>
          <td>${userInfo.externalWorksCost || ""}</td>
        </tr>
        <tr>
          <td>Način dostave računa:</td>
          <td>${
            userInfo.invoiceDeliveryMethod === "mail"
              ? "Poštom"
              : userInfo.invoiceDeliveryMethod === "eInvoice"
                ? "eRačun"
                : userInfo.invoiceDeliveryMethod === "email"
                  ? "Mailom vlasniku"
                  : userInfo.invoiceDeliveryMethod === "contactEmail"
                    ? "Mailom kontakt osobi"
                    : ""
          }</td>
        </tr>
        <tr>
          <td>PRIVOLE za MARK.KONTAKTIRANJE:</td>
          <td>${
            userInfo.marketingContact
              .map((method) =>
                method === "phone" ? "Pozivom" : method === "sms" ? "SMS-om" : method === "email" ? "Mailom" : "",
              )
              .filter(Boolean)
              .join(", ") || "Nema"
          }</td>
        </tr>
        <tr>
          <td>Dostava općih uvjeta:</td>
          <td>${userInfo.generalTermsDelivery === "provided" ? "Uručeni korisniku" : "Sam će ih preuzeti"}</td>
        </tr>
        <tr>
          <td>Način otplate:</td>
          <td>${userInfo.paymentMethod === "oneTime" ? "Jednokratno" : "Na rate"}</td>
        </tr>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px;">PODACI O PRODAJNOM MJESTU I PRODAVATELJU</h3>
      <table>
        <tr>
          <td style="width: 30%;">Kod prodavatelja:</td>
          <td>${userInfo.sellerCode || ""}</td>
          <td style="width: 30%;">Potpis prodavatelja:</td>
          <td></td>
        </tr>
        <tr>
          <td>Mjesto:</td>
          <td>${userInfo.sellerPlace || ""}</td>
          <td colspan="2"></td>
        </tr>
        <tr>
          <td>Datum:</td>
          <td>${userInfo.sellerDate ? new Date(userInfo.sellerDate).toLocaleDateString() : ""}</td>
          <td>M.P.</td>
          <td></td>
        </tr>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; margin-top: 25px;">POTPIS KORISNIKA</h3>
      <table>
        <tr>
          <td style="width: 40%;">Ime i prezime (ovlaštena osoba):</td>
          <td>${userInfo.userName || ""}</td>
        </tr>
        <tr>
          <td>Potpis Korisnika:</td>
          <td></td>
        </tr>
      </table>
    </div>
    `
    : ""

  // Add content to the container
  const contentHtml = `
    <div class="pdf-content">
      <div style="text-align: left; margin-bottom: 15px;">
        ${
          options.showLogo
            ? `
          <div style="${logoStyle} width: 80px; height: 80px; border-radius: 50%; background-color: ${options.primaryColor}; display: flex; align-items: center; justify-content: center;">
            <div style="color: white; font-size: 24px;">M</div>
          </div>
        `
            : ""
        }
        <div>
          <p style="margin: 0; font-weight: bold;">MAGIC NET – d.o.o.</p>
          <p style="margin: 0;">Koprivnička 17 C, HR - 42230 Ludbreg</p>
          <p style="margin: 0;">OIB : 92188488799</p>
          <p style="margin: 0;"><a href="http://www.mtnet.hr" style="color: ${options.primaryColor}; text-decoration: none;">www.mtnet.hr</a></p>
          <p style="margin: 0;"><a href="mailto:info@mtnet.hr" style="color: ${options.primaryColor}; text-decoration: none;">info@mtnet.hr</a></p>
          <p style="margin: 0;">Služba za korisnike: 042 420 420</p>
          <p style="margin: 0;">Fax: 042 420 429</p>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="margin: 0; font-size: 14px; font-weight: bold;">Broj ugovora: ${data.broj_ugovora || "XXXXX"}</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold;">SAŽETAK UGOVORA</p>
      </div>

      <div style="margin-bottom: 15px;">
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li>U ovom su sažetku ugovora navedeni glavni elementi ove ponude usluge u skladu s pravom EU-a¹.</li>
          <li>Sažetak Ugovora olakšava usporedbu različitih ponuda usluge.</li>
          <li>Potpune informacije o usluzi navedene su u drugim dokumentima.</li>
        </ul>
      </div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid ${options.primaryColor}; padding-bottom: 5px;">Usluge i oprema</h2>
        <p style="font-weight: bold; margin-bottom: 3px;">Podaci o ugovorenim uslugama</p>
        
        <table>
          <tr>
            <td colspan="2">Usluga fiksne mreže putem svjetlovodnog priključka.</td>
          </tr>
          <tr>
            <td style="width: 30%;">1.</td>
            <td></td>
          </tr>
          <tr>
            <td>Paket:</td>
            <td>${data.fiksni_paket || ""}</td>
          </tr>
          <tr>
            <td>Brzina interneta:</td>
            <td>${data.fiksna_brzina || ""}</td>
          </tr>
          <tr>
            <td>Dodatne usluge:</td>
            <td>${data.fiksne_dodatne_usluge || ""}</td>
          </tr>
          <tr>
            <td>Oprema:</td>
            <td>${data.fiksna_oprema || ""}</td>
          </tr>
        </table>

        ${
          data.tv_paket
            ? `
        <table>
          <tr>
            <td colspan="2">Usluga Televizije</td>
          </tr>
          <tr>
            <td>Paket:</td>
            <td>${data.tv_paket || ""}</td>
          </tr>
          <tr>
            <td>Dodatne usluge:</td>
            <td>${data.tv_dodatne_usluge || ""}</td>
          </tr>
          <tr>
            <td>Oprema:</td>
            <td>${data.tv_oprema || ""}</td>
          </tr>
        </table>
        `
            : ""
        }

        ${
          data.tarifa
            ? `
        <table>
          <tr>
            <td colspan="2">Usluga Telefona</td>
          </tr>
          <tr>
            <td>Pretplatnički broj:</td>
            <td>${data.pretplatnicki_broj || "-"}</td>
          </tr>
          <tr>
            <td>Tarifa:</td>
            <td>${data.tarifa || ""}</td>
          </tr>
          <tr>
            <td>Dodatne usluge:</td>
            <td>${data.tel_dodatne_usluge || ""}</td>
          </tr>
          <tr>
            <td>Oprema:</td>
            <td>${data.tel_oprema || ""}</td>
          </tr>
        </table>
        `
            : ""
        }
      </div>

      ${
        data.uredaj_proizvodac_model
          ? `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Podaci o kupljenim uređajima</h2>
        <p style="font-weight: bold; margin-bottom: 3px;">Proizvođač i model: ${data.uredaj_proizvodac_model}</p>
        <table>
          <tr>
            <td style="width: 50%;">Maloprodajna cijena:</td>
            <td>${formatCurrency(devicePrice)}</td>
          </tr>
          <tr>
            <td>Popust na uređaj:</td>
            <td>${formatCurrency(deviceDiscount)}</td>
          </tr>
          <tr>
            <td>Iznos za plaćanje:</td>
            <td>${formatCurrency(devicePaymentAmount)}</td>
          </tr>
          <tr>
            <td>Otplata uređaja na rate:</td>
            <td>${data.uredaj_otplata_na_rate ? "DA" : "NE"}</td>
          </tr>
          ${
            data.uredaj_otplata_na_rate
              ? `
          <tr>
            <td>Broj obroka:</td>
            <td>${data.uredaj_broj_obroka || "0"}</td>
          </tr>
          <tr>
            <td>Inicijalna uplata za uređaj:</td>
            <td>${formatCurrency(data.uredaj_inicijalna_uplata)}</td>
          </tr>
          <tr>
            <td>Iznos mjesečne rate:</td>
            <td>${formatCurrency(data.uredaj_mjesecna_rata)}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>
      `
          : ""
      }

      ${
        terminalEquipment && terminalEquipment.length > 0
          ? `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Cijena opreme dane na korištenje (Terminalna oprema)</h2>
        <table>
          <tr style="background-color: ${options.secondaryColor};">
            <th>Redni broj</th>
            <th>Naziv Terminalne opreme</th>
            <th>Količina</th>
            <th>Jedinična cijena po komadu Terminalne opreme</th>
          </tr>
          ${terminalEquipment
            .filter(item => item.quantity && parseInt(item.quantity) > 0)
            .map(
              item => `
            <tr>
              <td style="text-align: center;">${item.id}.</td>
              <td>${item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.price} EUR</td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <p style="margin-top: 10px; margin-bottom: 6px;"><strong>Napomena: ako bilo kada odlučite isključiti uslugu, dužni ste nam vratiti Terminalnu opremu koju smo Vam dali na korištenje. Krajnji rok za povrat Terminalne opreme je 15 dana od dana zaprimanja računa na kojem će Vam biti naplaćena naknada za istu, a koji ćemo stornirati u slučaju povrata Terminalne opreme.</strong></p>
      </div>
      `
          : `
      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Cijena opreme dane na korištenje (Terminalna oprema)</h2>
        <table>
          <tr style="background-color: ${options.secondaryColor};">
            <th>Redni broj</th>
            <th>Naziv Terminalne opreme</th>
            <th>Količina</th>
            <th>Jedinična cijena po komadu Terminalne opreme</th>
          </tr>
          <tr>
            <td style="text-align: center;"></td>
            <td></td>
            <td style="text-align: center;"></td>
            <td style="text-align: center;"></td>
          </tr>
        </table>
        
        <p style="margin-bottom: 6px;"><strong>Napomena: ako bilo kada odlučite isključiti uslugu, dužni ste nam vratiti Terminalnu opremu koju smo Vam dali na korištenje. Krajnji rok za povrat Terminalne opreme je 15 dana od dana zaprimanja računa na kojem će Vam biti naplaćena naknada za istu, a koji ćemo stornirati u slučaju povrata Terminalne opreme.</strong></p>
      </div>
      `
      }

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Brzine internetske usluge</h2>
        <p style="margin-bottom: 3px;"><strong>Minimalna brzina</strong> Vašeg interneta za preuzimanje (download) jest ${data.brzina_min_download || ""} Mbit/s, a za upload (učitavanje) jest ${data.brzina_min_upload || ""} Mbit/s.</p>
        <p style="margin-bottom: 3px;"><strong>Uobičajeno dostupna brzina</strong> procijenjena je na ${data.brzina_obicna_download || ""} Mbit/s za preuzimanje (download) i ${data.brzina_obicna_upload || ""} Mbit/s za učitavanje (upload) tijekom 99% vremena.</p>
        <p style="margin-bottom: 3px;"><strong>Maksimalna brzina</strong> je ${data.brzina_max_download || ""} Mbit/s za preuzimanje (download) i ${data.brzina_max_upload || ""} Mbit/s za učitavanje (upload).</p>
      </div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Pravna sredstva u slučaju problema</h2>
        <p style="margin-bottom: 3px;">U slučaju podnošenja prigovora na brzinu pristupa internetu, potrebno je da priložite rezultate minimalno 3 mjerenja provedenih tijekom 5 uzastopnih dana (najviše jedno mjerenje po danu) putem certificiranog alata HAKOmetar, izrađenog od strane HAKOM-a. Bitno je da mjerenje napravite s računalom koje je žičano spojeno s modemom. Vaš prigovor možemo uzeti u obzir i provjeriti situaciju samo u slučaju kada su mjerenja odrađena na opisan način.</p>
        <p style="margin-bottom: 3px;">U slučaju da nismo osigurali minimalnu brzinu pristupa internetu, obvezni smo Vam ponuditi raskid ugovora bez plaćanja naknade zbog prijevremenog raskida ugovora, a dodatno Vam možemo omogućiti prelazak na paket koji je prikladniji stvarno ostvarivoj brzini pristupa internetu ili umanjenje mjesečne naknade.</p>
      </div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid ${options.primaryColor}; padding-bottom: 5px;">Cijena</h2>
        
        <p style="font-weight: bold; margin: 10px 0 3px 0;">Cijena priključenja na svjetlovodnu mrežu</p>
        <table>
          <tr style="background-color: ${options.secondaryColor};">
            <th>Redni broj</th>
            <th>Jednokratna naknada</th>
            <th>Cijena</th>
            <th>Popust</th>
            <th>Iznos za plaćanje</th>
          </tr>
          <tr>
            <td style="text-align: center;">1.</td>
            <td>Izvođenje radova vanjskog priključenja Korisnika na svjetlovodnu mrežu<br>(jedna svjetlovodna nit)²</td>
            <td style="text-align: center;">${formatCurrency(connectionFee)}</td>
            <td style="text-align: center;">${connectionDiscountPercent}%</td>
            <td style="text-align: center;">${formatCurrency(connectionFeeTotal)}</td>
          </tr>
        </table>

        <p style="font-weight: bold; margin: 10px 0 3px 0;">Cijena aktivacije usluge</p>
        <table>
          <tr style="background-color: ${options.secondaryColor};">
            <th>Redni broj</th>
            <th>Jednokratna naknada</th>
            <th>Cijena</th>
            <th>Popust</th>
            <th>Iznos za plaćanje</th>
          </tr>
          <tr>
            <td style="text-align: center;">1.</td>
            <td>Aktivacija usluge na svjetlovodnu mrežu</td>
            <td style="text-align: center;">${formatCurrency(activationFee)}</td>
            <td style="text-align: center;">${activationDiscountPercent}%</td>
            <td style="text-align: center;">${formatCurrency(activationFeeTotal)}</td>
          </tr>
        </table>

        <p style="font-weight: bold; margin: 10px 0 3px 0;">Periodična cijena</p>
  <table>
    <tr style="background-color: ${options.secondaryColor};">
      <th style="width: 5%;">R.br.</th>
      <th style="width: 40%;">Ugovorene usluge</th>
      <th style="width: 18%;">Promotivna mjesečna naknada*</th>
      <th style="width: 18%;">Mjesečna naknada za vrijeme obveznog trajanja ugovora</th>
      <th style="width: 19%;">Mjesečna naknada nakon isteka / bez obveznog trajanja ugovora</th>
    </tr>
    <tr>
      <td style="text-align: center;">1.</td>
      <td>${data.fiksni_paket || ""}</td>
      <td style="text-align: right;">${data.fiksna_brzina || ""}</td>
      <td style="text-align: right;"></td>
      <td style="text-align: right;"></td>
    </tr>
    ${
      data.tv_paket
        ? `
    <tr>
      <td style="text-align: center;">2.</td>
      <td>${data.tv_paket || ""}</td>
      <td style="text-align: right;">${data.tv_dodatne_usluge || ""}</td>
      <td style="text-align: right;"></td>
      <td style="text-align: right;"></td>
    </tr>
    `
        : ""
    }
    ${
      data.tarifa
        ? `
    <tr>
      <td style="text-align: center;">3.</td>
      <td>${data.tarifa || ""}</td>
      <td style="text-align: right;">${data.pretplatnicki_broj || ""}</td>
      <td style="text-align: right;"></td>
      <td style="text-align: right;"></td>
    </tr>
    `
        : ""
    }
    <tr>
      <td style="text-align: center;"></td>
      <td><strong>Ukupan iznos mjesečne naknade:</strong></td>
      <td style="text-align: right; font-weight: bold;">0,00 EUR</td>
      <td style="text-align: right; font-weight: bold;">0,00 EUR</td>
      <td style="text-align: right; font-weight: bold;">0,00 EUR</td>
    </tr>
  </table>
        <p style="font-size: 11px; font-style: italic; margin-bottom: 6px;">*Napomena: promotivna mjesečna naknada vrijedi za cijelo vrijeme do raskida ugovora ili ugovaranja novog paketa.</p>

        <p style="margin-bottom: 3px;"><strong>Naknade koje se naplaćuju nakon prekoračenja količine uključene u periodičnu cijenu</strong><br>
        Naknade koje će Vam biti naplaćene nakon prekoračenja količine minuta unutar ugovorene telefonske tarife, nalaze se u našem Cjeniku. Kako biste izbjegli dodatne nekontrolirane troškove, savjetujemo Vam da uz osnovnu telefonsku tarifu aktivirate i neki od naših telefonskih mixeva, u slučaju da Vam minute iz tarife nisu dovoljne.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        
        <p style="font-size: 11px; font-style: italic; margin-bottom: 3px;">²Cijena usluge vanjskog priključenja na svjetlovodnu mrežu može se razlikovati od navedenog iznosa, a prema određenom ITM-u.</p>
      </div>

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Trajanje, obnova i raskid</h2>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p style="margin-bottom: 6px;">Trajanje ugovora za 1 GIGA + Tel + PROŠIRENI TV : Neodređeno, s obveznim trajanjem - 1 mjesec.</p>
        
        <p style="margin-bottom: 6px;">U slučaju sklapanja ugovora putem sredstava daljinske komunikacije ili izvan naših poslovnih prostora, prema odredbama Zakona o zaštiti potrošača imate pravo na jednostrani raskid ugovora u roku od 14 dana od dana sklapanja ugovora.</p>
        
        <p style="margin-bottom: 6px;">Ugovor sklopljen na daljinu smatra se sklopljenim kada nam nakon primitka dokumentacije o sklapanju dostavite potvrdu svoje suglasnosti o sklapanju ugovora, na jedan od sljedećih načina:</p>
        <ul style="list-style-type: disc; padding-left: 20px;">
          <li>potpisom ove obavijesti koju trebate uručiti našem dostavljaču/predstavniku MAGIC NET – d.o.o.,</li>
          <li>potpisom ove obavijesti i slanjem poštom na adresu: MAGIC NET- d.o.o., Kratka 2, 42000 Varaždin, Hrvatska,</li>
          <li>odgovorom kako dajete suglasnost na sklapanje ugovora na ovu adresu elektroničke pošte, ili</li>
          <li>plaćanjem prvog mjesečnog računa.</li>
        </ul>
        
        <p style="margin-bottom: 6px;">Zahtjev za raskid ugovora nam možete dostaviti poštom, na adresu MAGIC NET – d.o.o., Kratka 2, 42000 Varaždin, elektroničkim putem na adresu info@mtnet.hr ili pozivom na broj 042/420-420. U zahtjevu ste obvezni navesti Vaše podatke, uslugu koju raskidate i dan kad je usluga ugovorena. Ako podnosite zahtjev u pisanom obliku obvezni ste isti potpisati. Ugovor će se smatrati raskinutim u trenutku kada zaprimimo Vaš zahtjev za raskid.</p>
        
        <p style="margin-bottom: 6px;">Za detalje o podnošenju zahtjeva za raskid ili dodatna pitanja u vezi s ugovorenom uslugom možete nam se obratiti na e-mail adresu: info@mtnet.hr ili pozivom na broj 042/420-420.</p>
        
        <p style="margin-bottom: 6px;">Ako raskinete ugovor prije aktivacije usluge, a nakon odrađenih radova vanjskog priključenja na svjetlovodnu mrežu, obvezni ste nadoknaditi troškove za odrađene radove prema Cjeniku.</p>
        
        <p style="margin-bottom: 6px;">Ako raskidate ugovor koji je sklopljen uz obvezno trajanje ugovora, te isti raskinete tijekom razdoblja obveznog trajanja, obvezni ste platiti mjesečnu naknadu za ostatak razdoblja obveznog trajanja ugovora ili drugu naknadu u visini popusta na proizvode i usluge koje ste ostvarili, ovisno koja naknada će za Vas biti povoljnija.</p>
        
        <p style="margin-bottom: 6px;">U slučaju da ste ugovorili i kupnju uređaja te preuzeli uređaj, a u roku od 14 dana od dana sklapanja ugovora zatražite raskid ugovora, u skladu s odredbama Zakona o zaštiti potrošača, možete vratiti preuzeti uređaj neoštećen i kompletan u originalnom pakiranju sa svom pripadajućom dokumentacijom. U protivnom Vam imamo pravo naplatiti maloprodajnu cijenu uređaja, umanjenu za inicijalno uplaćeni iznos. Ako vraćate kupljeni uređaj i želite povrat uplaćenog iznosa za uređaj, molimo Vas da nam uz Zahtjev za raskid ugovora pošaljete i podatke za povrat: Naziv banke i IBAN te ime i prezime vlasnika računa na koji ćemo izvršiti povrat novca.</p>
        
        <p style="margin-bottom: 6px;">U slučaju trajnog isključenja Usluge pružane preko infrastrukture drugog operatora i raskida Ugovora, bit će Vam naplaćena naknada za deaktivaciju usluge pružane preko infrastrukture drugog operatora u iznosu od 30,00 EUR. U navedenom slučaju, naknada za deaktivaciju usluge pružane preko infrastrukture drugog operatora naplaćuje se neovisno o tome postoji li ugovorna obveza ili ne. Naplata naknade za deaktivaciju usluge pružane preko infrastrukture drugog operatora ne isključuje naplatu naknade za prijevremeni raskid ugovora ukoliko postoji ugovorna obveza koja nije istekla. Također, u slučaju da odustanete od zatražene usluge prije uključenja usluge pružane preko infrastrukture drugog operatora, zadržavamo pravo naplatiti Vam naknadu u istom iznosu kao i deaktivaciju iz ovog stavka.</p>
        
        <p style="margin-bottom: 6px;">Nakon raskida Ugovora dužni ste vratiti Terminalnu opremu koja je u našem vlasništvu. U suprotnom, zadržavamo pravo naplatiti Vam iznos naknade za nevraćenu Terminalnu opremu prema našem Cjeniku. Iznos naknade za nevraćenu Terminalnu opremu ne smije prijeći njezinu vrijednost u trenutku sklapanja Ugovora, a dodatno se umanjuje za amortizaciju kroz period korištenja, sukladno našem Cjeniku.</p>
        
        <p style="margin-bottom: 6px;">Ako za vrijeme obveznog trajanja Ugovora aktivirate dodatnu Uslugu čije je korištenje uvjetovano pružanjem neke druge Usluge, ista prati pravnu sudbinu Usluge koja joj je preduvjet, što znači da u slučaju raskida osnovnog Ugovora nećete moći koristiti ni dodatnu Uslugu.</p>
        
        <p style="margin-bottom: 6px;">Podnošenje Zahtjeva za promjenu operatora istovremeno se smatra zahtjevom za raskid ugovora s Vašim postojećim operatorom. U tom slučaju bit ćete pravovremeno obaviješteni o svim daljnjim koracima oko postupka promjene operatora. Ako u postupku promjene operatora dođe do nepravovremene promjene operatora, imate pravo na naknadu u skladu s propisima iz područja elektroničkih komunikacija.</p>
        
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Mogućnost za korisnike s invaliditetom</h2>
        <hr style="border: none; border-top: 1px solid #ddd;">
        <p style="margin-bottom: 6px;">
        Na svim prodajnim mjestima kao i sredstvima daljinske komunikacije, omogućili smo Vam dvosmjernu tekstualnu komunikaciju s djelatnicima. Sva prodajna mjesta imaju pristup za invalidska kolica te su neka od njih dodatno prilagođena slijepim i slabovidnim osobama.</p>
        
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Druge važne informacije</h2>
        <hr style="border: none; border-top: 1px solid #ddd;">

        Sastavni dio ugovora čine Sažetak ugovora, Obavijest o sklopljenom ugovoru, Opći uvjeti poslovanja MAGIC NET - d.o.o., posebni uvjeti pružanja usluga i Cjenik usluga za koje se ugovor sklapa, a koji su dostupni na internetskoj stranici https://mtnet.hr/opci-dokumeti/.</p>
        
        <p style="margin-bottom: 6px;">Ugovor se smatra sklopljenim u trenutku kada potvrdite svoju suglasnost za sklapanje Ugovora davanjem suglasnosti na ovaj Sažetak ugovora te davanjem suglasnosti na Obavijest o sklopljenom ugovoru broj 2025-04-09-001 koja je prilog ovom Sažetku ugovora i čini njegov sastavni dio.</p>
        
        <p style="margin-bottom: 6px;">Prikazane cijene su s uključenim PDV-om.</p>
        
        <p style="margin-bottom: 6px;">I na kraju, ako imate bilo kakvo pitanje ili nedoumice uz sadržaj ovog Sažetka ugovora, Usluga koje ugovarate ili samog ugovaranja, dostupni smo za Vas na broj <strong>042/420-420</strong>.</p>
        
        <p style="margin-bottom: 6px;">Datum: </p>
      </div>

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 10px;">OBAVIJEST O SKLOPLJENOM UGOVORU</h2>
        
        <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 10px;">PODACI O KORISNIKU</h3>
        <table>
          <tr>
            <td style="width: 40%;">ID Korisnika:</td>
            <td>${userInfo?.userId || ""}</td>
          </tr>
          <tr>
            <td>Ime i prezime Korisnika (fizička osoba/ovlaštena osoba):</td>
            <td>${userInfo?.userName || ""}</td>
          </tr>
          <tr>
            <td>Pravna osoba:</td>
            <td>${userInfo?.legalEntity || ""}</td>
          </tr>
          <tr>
            <td>Prebivalište/sjedište (ulica i kućni broj, kat, poštanski broj, mjesto):</td>
            <td>${userInfo?.residenceAddress || ""}</td>
          </tr>
          <tr>
            <td>Adresa priključka (ulica i kućni broj, kat, poštanski broj, mjesto):</td>
            <td>${userInfo?.connectionAddress || ""}</td>
          </tr>
          <tr>
            <td>OIB (fizička osoba/pravna osoba):</td>
            <td>${userInfo?.oib || ""}</td>
          </tr>
          <tr>
            <td>Broj osobne iskaznice (fizička osoba/ovlaštena osoba):</td>
            <td>${userInfo?.idCardNumber || ""}</td>
          </tr>
          <tr>
            <td>Kontakt telefon/mobitel (fizička osoba/ovlaštena osoba):</td>
            <td>${userInfo?.contactPhone || ""}</td>
          </tr>
          <tr>
            <td>E-mail adresa (fizička osoba/ovlaštena osoba):</td>
            <td>${userInfo?.email || ""}</td>
          </tr>
        </table>
        
        <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 10px;">PODACI O KONTAKT OSOBI</h3>
        <table>
          <tr>
            <td style="width: 40%;">Ime i prezime kontakt osobe:</td>
            <td>${userInfo?.contactPersonName || ""}</td>
          </tr>
          <tr>
            <td>Kontakt telefon/mobitel:</td>
            <td>${userInfo?.contactPersonPhone || ""}</td>
          </tr>
          <tr>
            <td>E-mail adresa za kontakt:</td>
            <td>${userInfo?.contactPersonEmail || ""}</td>
          </tr>
          <tr>
            <td colspan="2" style="font-style: italic; font-size: 10px;">Navesti eventualno i ostale kontakte koje smatramo potrebnim.<br>U slučaju da je ovo sve prazno znači da se kontaktira direktno s vlasnikom i da ovo opće ne treba ispunjavati, čak se može i obrisati.</td>
          </tr>
        </table>
        
        <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 10px;">PODACI O NAČINU PLAĆANJA I DOSTAVE RAČUNA</h3>
        <table>
          <tr>
            <td style="width: 50%;">Uplata (opća uplatnica):</td>
            <td style="width: 50%;">${userInfo && userInfo.invoiceDeliveryMethod === "mail" ? "☒" : "☐"}</td>
          </tr>
          <tr>
            <td>e-račun bez papirnate verzije:</td>
            <td>${userInfo && userInfo.invoiceDeliveryMethod === "eInvoice" ? "☒" : "☐"}</td>
          </tr>
          <tr>
            <td>e-mailom:</td>
            <td>${userInfo && userInfo.invoiceDeliveryMethod === "email" ? "☒" : "☐"}</td>
          </tr>
          <tr>
            <td>e-mailom na drugu adresu:</td>
            <td>${userInfo && userInfo.invoiceDeliveryMethod === "contactEmail" ? "☒" : "☐"}</td>
          </tr>
        </table>
        
        <h3 style="font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 10px;">SUGLASNOST ZA OBRADU OSOBNIH PODATAKA I KONTAKTIRANJE ZA SVE KORISNIKOVE USLUGE KOD MAGIC NET - d.o.o.</h3>
        <p style="margin-bottom: 5px;"><strong>1. PRIVOLE ZA MARKETINŠKO KONTAKTIRANJE</strong></p>
        <p style="margin-bottom: 10px;">Želja nam je kontaktirati Vas na način na koji želite.</p>
        
        <table>
          <tr>
            <td style="width: 33%;">pozivom</td>
            <td>${userInfo && userInfo.marketingContact.includes("phone") ? "☒" : "☐"}</td>
          </tr>
          <tr>
            <td>SMS-om</td>
            <td>${userInfo && userInfo.marketingContact.includes("sms") ? "☒" : "☐"}</td>
          </tr>
          <tr>
            <td>e-mailom</td>
            <td>${userInfo && userInfo.marketingContact.includes("email") ? "☒" : "☐"}</td>
          </tr>
        </table>

         <p style="margin-bottom: 3px;">Davanjem suglasnosti na ovu Obavijest o sklopljenom ugovoru (dalje u tekstu: Obavijest) i Sažetak ugovora prihvaćate našu ponudu za sklapanje ugovora na daljinu ili izvan naših poslovnih prostora, pod uvjetima koji su navedeni u ovoj Obavijesti i Sažetku ugovora.</p>
        
        <p style="margin-bottom: 3px;">Davanjem suglasnosti na ovu Obavijest i Sažetak ugovora potvrđujete da su isti ispunjeni u skladu s Vašim željama i da se o svakoj odredbi pregovaralo.</p>
        
        <p style="margin-bottom: 3px;">Po isteku razdoblja obveznog trajanja Ugovora, pretplatnički odnos se nastavlja na neodređeno vrijeme do raskida s Vaše ili naše strane.</p>
        
        <p style="margin-bottom: 15px;">U slučaju da pretplatnički odnos bude raskinut iz bilo kojeg razloga prije otplate uređaja, preostale neplaćene rate obračunat ćemo Vam na prvom sljedećem računu.</p>
        
        <p style="margin-top: 10px; margin-bottom: 10px;">Vaše je pravo da u svakom trenutku povučete dane privole. Više o obradi osobnih podataka možete pronaći na <a href="https://mtnet.hr/politika-privatnosti/" style="color: ${options.primaryColor}; text-decoration: none;">https://mtnet.hr/politika-privatnosti/</a>.</p>

        <p style="margin-bottom: 6px;">I na kraju, ako imate bilo kakvo pitanje ili nedoumice uz sadržaj ovog Sažetka ugovora, Usluga koje ugovarate ili samog ugovaranja, dostupni smo za Vas na broj <strong>042/420-420</strong>.</p>
        
        <p style="margin-bottom: 3px;">Ovime potvrđujemo da je Vaš zahtjev za sklapanje ugovora prihvaćen. Obavijestit ćemo Vas u slučaju eventualnih promjena okolnosti koje su nastale nakon prihvata zahtjeva, a koje se nisu mogle predvidjeti u vrijeme prihvata zahtjeva.</p>
        
        <p style="margin-bottom: 3px;">Usluge u paketima nije moguće mijenjati. Uz usluge sadržane u paketu, moguće je uzeti dodatne opcije usluga koje se naplaćuju prema Cjeniku. Detaljan opis usluga i opcija nalaze se u Cjeniku.</p>
        
        <p style="margin-bottom: 3px;">Prihvaćanjem ove Obavijesti potvrđujete da Vam je uručen Sažetak ugovora i da ste suglasni sa svim uvjetima koji su navedeni u Sažetku ugovora i ovoj Obavijesti.</p>
      </div>

      <div style="margin-bottom: 15px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">PODACI O PRODAJNOM MJESTU I PRODAVATELJU</h2>
        <table>
          <tr>
            <td style="width: 30%;">Kod prodavatelja:</td>
            <td>Choose an item.</td>
            <td style="width: 30%;">Potpis prodavatelja:</td>
            <td></td>
          </tr>
          <tr>
            <td>Mjesto:</td>
            <td>Choose an item.</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td>Datum:</td>
            <td></td>
            <td>M.P.</td>
            <td></td>
          </tr>
        </table>
      </div>

      <!-- PAGE BREAK -->
      <div class="page-break"></div>

      ${userInfoHtml}

      ${pageNumbersHtml}

      <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
        <p style="text-align: center; font-size: 12px; color: #666;">Generirano na ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `

  // Add content to the container
  container.innerHTML = styleElement.outerHTML + contentHtml

  // Temporarily append to document to render
  document.body.appendChild(container)

  // Generate PDF
  const ownerPassword = process.env.NEXT_PUBLIC_PDF_OWNER_PASSWORD
  const pdfOptions = {
    margin: [options.margins, options.margins, options.margins, options.margins] as [number, number, number, number],
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

  try {
    // Create a promise and resolve after adding a delay
    await new Promise((resolve) => {
      // First add the container to the DOM
      document.body.appendChild(container);
      // Then wait for a moment to ensure everything renders properly
      setTimeout(resolve, 100);
    });
    
    // Use window.html2pdf instead of importing the library
    await window.html2pdf().from(container).set(pdfOptions).save()
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}
