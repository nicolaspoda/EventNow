/**
 * Déclaration minimale pour le module pdfkit lorsque @types/pdfkit
 * ou node_modules n'est pas résolu par l'IDE.
 */
declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string;
    margin?: number;
    bufferPages?: boolean;
  }

  interface PDFDocument {
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    save(): this;
    restore(): this;
    rect(x: number, y: number, w: number, h: number): this;
    fillColor(color: string): this;
    fill(): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: object): this;
    text(text: string, options?: object): this;
    moveDown(n?: number): this;
    strokeColor(color: string): this;
    lineWidth(w: number): this;
    roundedRect(x: number, y: number, w: number, h: number, r: number): this;
    stroke(): this;
    image(src: Buffer, x: number, y: number, options?: { width?: number; height?: number }): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    y: number;
    end(): void;
  }

  const PDFDocument: new (options?: PDFDocumentOptions) => PDFDocument;
  export default PDFDocument;
}
