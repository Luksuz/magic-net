interface Html2PdfOptions {
  margin?: number | [number, number, number, number]
  filename?: string
  image?: {
    type?: string
    quality?: number
  }
  html2canvas?: {
    scale?: number
    [key: string]: any
  }
  jsPDF?: {
    unit?: string
    format?: string
    orientation?: string
    [key: string]: any
  }
  [key: string]: any
}

interface Html2PdfInstance {
  from(element: HTMLElement): Html2PdfInstance
  set(options: Html2PdfOptions): Html2PdfInstance
  save(): Promise<any>
  output(type: string, options?: any): Promise<any>
  [key: string]: any
}

interface Html2PdfStatic {
  (): Html2PdfInstance
  [key: string]: any
}

declare global {
  interface Window {
    html2pdf: Html2PdfStatic
  }
}

export {}
