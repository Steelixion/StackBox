'use server';
/**
 * @file src/actions/invoices.ts
 * Server Actions for the Invoices (OCR) module.
 */

import {
  getInvoiceReviewQueue,
  getInvoiceLedger,
  syncInvoiceToLedger,
  addHighConfidenceInvoiceToLedger,
  addToInvoiceReviewQueue,
  readDB,
  writeDB,
  type InvoiceLedgerEntry,
  type InvoiceReviewItem,
  type InvoiceLineItem,
} from '@/lib/db';

export async function fetchReviewQueue(): Promise<InvoiceReviewItem[]> {
  return getInvoiceReviewQueue();
}

export async function fetchLedger(): Promise<InvoiceLedgerEntry[]> {
  return getInvoiceLedger();
}

/**
 * Simulates OCR processing of an uploaded invoice.
 * In production: replace the body with a call to AWS Textract / Google Document AI.
 * If confidence >= 85 it goes straight to the ledger, otherwise to the review queue.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processUploadedInvoice(
  formData: FormData
): Promise<{ destination: 'ledger' | 'queue'; data: InvoiceLedgerEntry | InvoiceReviewItem }> {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Use Gemini to extract text and structure it
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    
    const prompt = `As an expert invoice auditor, extract all data from this PDF with 100% precision.
    Rules:
    1. Extract 'invoiceId', 'vendor', 'date' (YYYY-MM-DD), and 'total' (include currency symbol like $).
    2. Extract all 'lineItems'. For each item, capture the full 'item' description, the 'qty', and the specific 'price' (unit price).
    3. If the vendor text contains '(OCR error)', preserve it.
    4. Return ONLY a raw JSON object. NO markdown, NO code blocks.

    Schema:
    {
      "invoiceId": "string",
      "vendor": "string",
      "date": "string",
      "total": "string",
      "lineItems": [
        { "item": "string", "qty": "string", "price": "string" }
      ]
    }`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      },
      prompt
    ]);

    const response = await result.response;
    let text = response.text().trim();
    // Clean up markdown code blocks if present
    if (text.includes('```')) {
      const parts = text.split('```');
      text = parts[1];
      if (text.startsWith('json')) text = text.substring(4);
    }
    const extracted = JSON.parse(text.trim());

    const invoiceId = extracted.invoiceId || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const vendor = extracted.vendor || "Unknown Vendor";

    // Always sync to ledger
    const db = await readDB();
    const entry: InvoiceLedgerEntry = {
      id: invoiceId,
      vendor,
      date: extracted.date || new Date().toISOString().split('T')[0],
      total: extracted.total || "$0.00",
      sync: true,
      lineItems: extracted.lineItems || [],
    };
    db.invoiceLedger.unshift(entry);
    await writeDB(db);
    
    return { destination: 'ledger', data: entry };
  } catch (error) {
    console.error("OCR/Extraction Error:", error);
    throw new Error("AI Extraction Failed: Model not available or file unreadable.");
  }
}

/**
 * Confirms manual review edits and syncs the invoice to the master ledger.
 */
export async function confirmAndSyncInvoice(
  invoiceId: string,
  vendor: string,
  lines: InvoiceLineItem[]
): Promise<InvoiceLedgerEntry> {
  return syncInvoiceToLedger(invoiceId, vendor, lines);
}
