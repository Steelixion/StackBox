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
export async function processUploadedInvoice(
  fileName: string
): Promise<{ destination: 'ledger' | 'queue'; data: InvoiceLedgerEntry | InvoiceReviewItem }> {
  // Simulate OCR confidence (real implementation would call an AI service)
  const confidence = Math.floor(70 + Math.random() * 30); // 70–99
  const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const vendorNames = ['SupplierCo', 'GlobalParts Ltd.', 'IndustrialHub', 'TechSource'];
  const vendor = vendorNames[Math.floor(Math.random() * vendorNames.length)];

  if (confidence >= 85) {
    const entry = await addHighConfidenceInvoiceToLedger(vendor);
    return { destination: 'ledger', data: entry };
  } else {
    const reviewItem: InvoiceReviewItem = {
      id: invoiceId,
      vendor,
      confidence,
      raw: {
        vendor: vendor + (Math.random() > 0.5 ? ' (OCR error)' : ''),
        lines: [
          { item: 'Auto-extracted Item A', qty: `${Math.floor(Math.random() * 200)}`, price: `$${(Math.random() * 100).toFixed(2)}` },
        ],
      },
      image: `https://placehold.co/400x550/1E293B/94A3B8?text=INVOICE+OCR+${confidence}%25+Confidence`,
      createdAt: new Date().toISOString(),
    };
    await addToInvoiceReviewQueue(reviewItem);
    return { destination: 'queue', data: reviewItem };
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
