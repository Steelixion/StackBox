'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchReviewQueue,
  fetchLedger,
  processUploadedInvoice,
  confirmAndSyncInvoice,
} from '@/actions/invoices';
import type { InvoiceReviewItem, InvoiceLedgerEntry, InvoiceLineItem } from '@/lib/db';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

export default function InvoicesOCRPage() {
  const [reviewQueue, setReviewQueue] = useState<InvoiceReviewItem[]>([]);
  const [ledger, setLedger] = useState<InvoiceLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'ledger' | 'queue'; message: string } | null>(null);

  // Manual Review Modal State
  const [editingInvoice, setEditingInvoice] = useState<InvoiceReviewItem | null>(null);
  const [formData, setFormData] = useState<{ vendor: string; lines: InvoiceLineItem[] }>({ vendor: '', lines: [] });
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [q, l] = await Promise.all([fetchReviewQueue(), fetchLedger()]);
    setReviewQueue(q);
    setLedger(l);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await runUpload(e.target.files[0].name);
      // reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const runUpload = async (fileName: string) => {
    setUploading(true);
    setUploadFeedback(null);
    const result = await processUploadedInvoice(fileName);
    if (result.destination === 'ledger') {
      setLedger((prev) => [result.data as InvoiceLedgerEntry, ...prev]);
      setUploadFeedback({ type: 'ledger', message: `High-confidence scan synced directly to ledger as ${(result.data as InvoiceLedgerEntry).id}.` });
    } else {
      setReviewQueue((prev) => [result.data as InvoiceReviewItem, ...prev]);
      setUploadFeedback({ type: 'queue', message: `Low confidence (${(result.data as InvoiceReviewItem).confidence}%) — added to Manual Review Queue.` });
    }
    setUploading(false);
  };

  const openReviewModal = (invoice: InvoiceReviewItem) => {
    setEditingInvoice(invoice);
    setFormData({
      vendor: invoice.raw.vendor,
      lines: invoice.raw.lines.map((l) => ({ ...l })),
    });
  };

  const handleLineChange = (index: number, field: keyof InvoiceLineItem, value: string) => {
    const updated = [...formData.lines];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, lines: updated });
  };

  const handleConfirmSync = async () => {
    if (!editingInvoice) return;
    setIsSyncing(true);
    const entry = await confirmAndSyncInvoice(editingInvoice.id, formData.vendor, formData.lines);
    setReviewQueue((prev) => prev.filter((i) => i.id !== editingInvoice.id));
    setLedger((prev) => [entry, ...prev]);
    setEditingInvoice(null);
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-ink">Invoices (OCR) Hub</h1>
        <p className="text-steel text-sm mt-1">Automated document intake, AI extraction, and verification pipeline.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-2xl shadow-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-jade border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-steel font-mono">Loading invoice data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Upload & Queue */}
          <div className="lg:col-span-1 space-y-8">

            {/* Upload Interface */}
            <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col justify-center">
              <h2 className="text-sm font-bold text-deep-ink mb-6">Direct Upload</h2>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${isDragging ? 'border-jade bg-jade/5' : 'border-steel/30 bg-porcelain hover:bg-steel/5'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); runUpload('dropped-file'); }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-jade border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-bold text-jade">Running OCR Models...</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-steel mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <p className="text-sm text-deep-ink font-medium">Drag & Drop Invoice Images</p>
                    <p className="text-xs text-steel mt-1 mb-4">PDF, JPG, or PNG (Max 10MB)</p>
                    <label className="bg-deep-ink text-white text-xs font-bold px-4 py-2 rounded cursor-pointer hover:bg-jade hover:text-deep-ink transition-colors">
                      BROWSE FILES
                      <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>

              {/* Upload Feedback */}
              {uploadFeedback && (
                <div className={`mt-4 p-3 rounded-xl text-xs font-medium animate-in fade-in duration-300 ${uploadFeedback.type === 'ledger' ? 'bg-jade/10 text-jade border border-jade/20' : 'bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20'
                  }`}>
                  {uploadFeedback.message}
                </div>
              )}
            </div>

            {/* Manual Review Queue */}
            <div className="bg-cinnabar/5 rounded-2xl shadow-sm overflow-hidden relative group/alert">
              <div className="absolute top-0 left-0 w-full h-1 bg-cinnabar" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)' }}></div>
              <div className="p-8 flex justify-between items-center">
                <h2 className="text-lg font-bold text-cinnabar-dark">Manual Review <span className="text-sm font-normal">(&lt;85% Confidence)</span></h2>
                <span className="bg-cinnabar text-white text-xs font-bold px-2 py-0.5 rounded-full">{reviewQueue.length}</span>
              </div>

              <div className="p-0">
                {reviewQueue.length === 0 ? (
                  <div className="p-8 text-center text-steel/60">
                    <p className="text-sm font-medium">Queue is empty!</p>
                  </div>
                ) : (
                  <ul className="space-y-4 px-8 pb-8">
                    {reviewQueue.map((inv) => (
                      <li key={inv.id} className="p-6 bg-white/40 rounded-xl hover:bg-white/60 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold text-deep-ink">{inv.id}</span>
                          <span className="text-xs font-bold bg-[#EAB308]/20 text-[#EAB308] px-2 py-1 rounded">{inv.confidence}% CF</span>
                        </div>
                        <p className="text-xs text-steel mb-4 line-clamp-1">Extracted: {inv.raw.vendor}</p>
                        <button
                          onClick={() => openReviewModal(inv)}
                          className="w-full bg-white border border-cinnabar/30 text-cinnabar text-xs font-bold py-2 rounded hover:bg-cinnabar hover:text-white transition-colors"
                        >
                          REVIEW AND SYNC
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Verified Database Ledger */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-8 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-deep-ink">Standardized Master Ledger</h2>
                  <p className="text-xs text-steel mt-1">Successfully scanned and database synchronized invoices.</p>
                </div>
                <span className="text-xs font-mono bg-jade/10 text-jade px-3 py-1.5 rounded-lg border border-jade/20 font-bold">{ledger.length} Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-porcelain/30 text-xs font-bold text-steel/80 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Invoice ID</th>
                      <th className="px-8 py-4">Extracted Vendor</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Total Processed</th>
                      <th className="px-8 py-4 text-center">DB Sync</th>
                      <th className="px-8 py-4 text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((inv) => (
                      <tr key={inv.id} className="hover:bg-porcelain/30 transition-colors">
                        <td className="px-8 py-6 font-bold text-deep-ink font-mono">{inv.id}</td>
                        <td className="px-8 py-6 font-medium text-steel">{inv.vendor}</td>
                        <td className="px-8 py-6 text-steel text-xs font-mono">{inv.date}</td>
                        <td className="px-8 py-6 font-mono text-steel">{inv.total}</td>
                        <td className="px-8 py-6 text-center">
                          {inv.sync ? (
                            <span className="inline-flex items-center text-xs font-bold text-jade bg-jade/10 px-2 py-1 rounded border border-jade/20">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              SYNCED
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-bold text-[#EAB308] bg-[#EAB308]/10 px-2 py-1 rounded border border-[#EAB308]/20">PENDING</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => {
                              const doc = new jsPDF();
                              doc.setFontSize(22);
                              doc.setTextColor(11, 15, 25); // deep-ink
                              doc.text('StackBox Internal Invoice Ledger', 14, 20);

                              doc.setFontSize(12);
                              doc.setTextColor(148, 163, 184); // steel
                              doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

                              doc.setDrawColor(226, 232, 240); // line color
                              doc.line(14, 32, 196, 32);

                              doc.setFontSize(14);
                              doc.setTextColor(11, 15, 25);
                              doc.text(`Invoice ID: ${inv.id}`, 14, 42);
                              doc.text(`Vendor: ${inv.vendor}`, 14, 50);
                              doc.text(`Date Processed: ${inv.date}`, 14, 58);
                              doc.text(`Status: ${inv.sync ? 'SYNCED TO GLOBAL MASTER' : 'PENDING SYNC'}`, 14, 66);
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
                                headStyles: { fillColor: [45, 212, 191] }, // jade
                                styles: { fontSize: 10, cellPadding: 4 }
                              });

                              doc.save(`${inv.id}_StackBox_Report.pdf`);
                            }}
                            className="text-jade hover:text-deep-ink transition-colors group relative"
                            title="Download Full Report PDF"
                          >
                            <svg className="w-5 h-5 inline-block group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Review Side-by-Side Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-deep-ink/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="px-8 py-6 flex justify-between items-center bg-porcelain/30">
              <div>
                <h2 className="text-xl font-bold text-deep-ink">Manual Review: {editingInvoice.id}</h2>
                <p className="text-xs text-cinnabar font-bold mt-1">Confidence Score: {editingInvoice.confidence}% — Attention Required</p>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="text-steel hover:text-cinnabar transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Side-by-Side Split */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">

              {/* Left Side: Original Image */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col lg:border-r lg:border-steel/5">
                <p className="text-xs font-bold text-steel uppercase mb-6">Scanned Original</p>
                <div className="flex-1 bg-porcelain/30 rounded-2xl flex items-center justify-center overflow-hidden p-4">
                  <img src={editingInvoice.image} alt="Original Invoice" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              </div>

              {/* Right Side: Editable Form */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col">
                <p className="text-xs font-bold text-steel uppercase mb-6">Extracted Data Verification</p>

                <div className="space-y-8 flex-1 mt-2">
                  {/* Vendor Name */}
                  <div>
                    <label className="block text-xs font-semibold text-deep-ink mb-2">Vendor Name</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full bg-white border border-steel/30 rounded-lg px-3 py-2.5 text-sm text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade"
                    />
                  </div>

                  {/* Line Items List */}
                  <div>
                    <label className="block text-xs font-semibold text-deep-ink mb-4">Line Items, Quantities & Prices</label>
                    <div className="space-y-6">
                      {formData.lines.map((line, idx) => (
                        <div key={idx} className="bg-porcelain/30 p-5 rounded-2xl flex space-x-4 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-steel mb-1.5">Item Description</label>
                            <input
                              type="text"
                              value={line.item}
                              onChange={(e) => handleLineChange(idx, 'item', e.target.value)}
                              className="w-full bg-white border border-steel/20 rounded-lg px-2.5 py-2 text-xs text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade"
                            />
                          </div>
                          <div className="w-20">
                            <label className="block text-xs text-steel mb-1.5">Qty</label>
                            <input
                              type="text"
                              value={line.qty}
                              onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                              className="w-full bg-white border border-steel/20 rounded-lg px-2.5 py-2 text-xs text-deep-ink focus:outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-steel mb-1.5">Price</label>
                            <input
                              type="text"
                              value={line.price}
                              onChange={(e) => handleLineChange(idx, 'price', e.target.value)}
                              className="w-full bg-white border border-steel/20 rounded-lg px-2.5 py-2 text-xs text-deep-ink focus:outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-8 flex justify-end space-x-4 mt-auto pt-4">
                  <button onClick={() => setEditingInvoice(null)} className="px-4 py-2 text-sm font-bold text-steel hover:text-deep-ink transition-colors">
                    CANCEL
                  </button>
                  <button
                    onClick={handleConfirmSync}
                    disabled={isSyncing}
                    className="bg-jade text-deep-ink px-6 py-2 rounded-lg text-sm font-bold hover:shadow-[var(--drop-shadow-glow-jade)] flex items-center transition-all disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-deep-ink border-t-transparent rounded-full animate-spin mr-2" />
                        SYNCING...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        CONFIRM & SYNC DATABASES
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}