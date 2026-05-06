'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchLedger,
  processUploadedInvoice,
} from '@/actions/invoices';
import type { InvoiceLedgerEntry } from '@/lib/db';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export default function InvoicesOCRPage() {
  const [ledger, setLedger] = useState<InvoiceLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'ledger' | 'queue'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const l = await fetchLedger();
    setLedger(l);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      await runUpload(formData);
      // reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const runUpload = async (formData: FormData) => {
    setUploading(true);
    setUploadFeedback(null);
    try {
      const result = await processUploadedInvoice(formData);
      if (result.destination === 'ledger') {
        setLedger((prev) => [result.data as InvoiceLedgerEntry, ...prev]);
        setUploadFeedback({ type: 'ledger', message: `Invoice processed and synced to ledger as ${(result.data as InvoiceLedgerEntry).id}.` });
      }
    } catch (error: any) {
      console.error(error);
      setUploadFeedback({ type: 'queue', message: `Error: AI Extraction failed. Please check your model configuration.` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-ink tracking-tight">Invoices Hub</h1>
        <p className="text-steel text-sm mt-1 font-medium">Automated document intake and AI extraction pipeline.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-2xl shadow-sm border border-steel/10">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-jade border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-steel font-mono">Loading ledger data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upload Interface */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-steel/10">
            <div className="max-w-xl mx-auto">
              <h2 className="text-sm font-bold text-deep-ink mb-6 text-center uppercase tracking-widest opacity-60">Direct Invoice Intake</h2>

              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all relative ${isDragging ? 'border-jade bg-jade/5' : 'border-steel/30 bg-porcelain hover:bg-steel/5'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 border-4 border-jade border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-jade/20"></div>
                    <p className="text-sm font-bold text-jade animate-pulse">AI Agent Extracting Data...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-jade/10 text-jade rounded-2xl flex items-center justify-center mx-auto mb-4 border border-jade/20">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-lg text-deep-ink font-bold">Upload PDF Invoice</p>
                    <p className="text-xs text-steel mt-1 mb-6">Direct sync to Standardized Master Ledger</p>
                    <label className="bg-deep-ink text-white text-xs font-bold px-8 py-3 rounded-xl cursor-pointer hover:bg-jade hover:text-deep-ink transition-all shadow-xl hover:shadow-jade/20 uppercase tracking-widest">
                      Select PDF File
                      <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>

              {uploadFeedback && (
                <div className={`mt-6 p-4 rounded-xl text-xs font-bold animate-in zoom-in-95 duration-300 border text-center shadow-sm ${uploadFeedback.type === 'ledger' ? 'bg-jade/10 text-jade border-jade/20' : 'bg-cinnabar/10 text-cinnabar border-cinnabar/20'}`}>
                  {uploadFeedback.type === 'ledger' ? (
                    <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {uploadFeedback.message}
                </div>
              )}
            </div>
          </div>

          {/* Master Ledger Section */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-steel/10">
            <div className="p-8 flex justify-between items-center bg-white border-b border-steel/5">
              <div>
                <h2 className="text-xl font-bold text-deep-ink tracking-tight">Standardized Master Ledger</h2>
                <p className="text-xs text-steel mt-1 font-medium">Verified records extracted via StackBox AI interface.</p>
              </div>
              <span className="text-xs font-mono bg-jade text-deep-ink px-4 py-2 rounded-xl font-bold shadow-sm ring-1 ring-jade/20">{ledger.length} Verified Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-porcelain/30 text-[10px] font-bold text-steel/80 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Invoice ID</th>
                    <th className="px-8 py-5">Extracted Vendor</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Total Processed</th>
                    <th className="px-8 py-5 text-center">DB Sync</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/5">
                  {ledger.map((inv) => (
                    <tr key={inv.id} className="hover:bg-porcelain/30 transition-colors group">
                      <td className="px-8 py-6 font-bold text-deep-ink font-mono text-xs">{inv.id}</td>
                      <td className="px-8 py-6 font-semibold text-steel/80">{inv.vendor}</td>
                      <td className="px-8 py-6 text-steel text-xs font-mono">{inv.date}</td>
                      <td className="px-8 py-6 font-bold text-deep-ink font-mono">{inv.total}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center text-[10px] font-bold text-jade bg-jade/10 px-2.5 py-1 rounded-full border border-jade/20 shadow-sm">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          SYNCED
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => {
                            const doc = new jsPDF();
                            doc.setFontSize(22);
                            doc.setTextColor(11, 15, 25);
                            doc.text('StackBox Internal Invoice Ledger', 14, 20);

                            doc.setFontSize(12);
                            doc.setTextColor(148, 163, 184);
                            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

                            doc.setDrawColor(226, 232, 240);
                            doc.line(14, 32, 196, 32);

                            doc.setFontSize(14);
                            doc.setTextColor(11, 15, 25);
                            doc.text(`Invoice ID: ${inv.id}`, 14, 42);
                            doc.text(`Vendor: ${inv.vendor}`, 14, 50);
                            doc.text(`Date Processed: ${inv.date}`, 14, 58);
                            doc.text(`Status: SYNCED TO GLOBAL MASTER`, 14, 66);
                            doc.setFont('Ariel', 'bold');
                            doc.text(`Total Authorized: ${inv.total}`, 14, 76);
                            doc.setFont('Ariel', 'normal');

                            const tableData = inv.lineItems ? inv.lineItems.map(item => [item.item, item.qty, item.price]) : [];

                            // @ts-ignore
                            autoTable(doc, {
                              startY: 85,
                              head: [['Item Description', 'Quantity', 'Price']],
                              body: tableData,
                              theme: 'striped',
                              headStyles: { fillColor: [45, 212, 191] },
                              styles: { fontSize: 10, cellPadding: 4 }
                            });

                            doc.save(`${inv.id}_StackBox_Report.pdf`);
                          }}
                          className="p-2 text-steel hover:text-jade transition-all bg-porcelain rounded-lg hover:bg-jade/10 border border-steel/10"
                          title="Download Report PDF"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}