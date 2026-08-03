'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDownload, FiFileText, FiGrid, FiFile, FiCheck } from 'react-icons/fi';
import type { Split, SplitUser } from '@/types';
import { cn } from '@/lib/utils/cn';

export interface SplitFilters {
  search?: string;
  scope?: 'all' | 'own' | 'owe' | 'owed';
  status?: 'All' | 'Pending' | 'Partially Paid' | 'Completed' | 'Closed';
  category?: string;
  memberId?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  from?: string;
  to?: string;
}

interface SplitExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  splits: Split[];
  activeFilters?: SplitFilters;
  allSplits?: Split[];
  userEmail?: string;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';
type ExportScope = 'filtered' | 'all';

function getSplitUserName(value: SplitUser | string): string {
  return typeof value === 'string' ? 'Unknown' : value.name;
}

function getSplitUserEmail(value: SplitUser | string): string {
  return typeof value === 'string' ? '' : value.email;
}

export function SplitExportReportModal({
  isOpen,
  onClose,
  splits,
  allSplits = splits,
  userEmail = '',
}: SplitExportReportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('filtered');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const targetSplits = scope === 'filtered' ? splits : allSplits;
  const totalRecords = targetSplits.length;

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        if (format === 'csv') {
          downloadCSV(targetSplits, userEmail);
        } else if (format === 'excel') {
          downloadExcel(targetSplits, userEmail);
        } else if (format === 'pdf') {
          downloadPDF(targetSplits, userEmail);
        }
      } finally {
        setIsGenerating(false);
        onClose();
      }
    }, 200);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-surface text-foreground rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <FiDownload size={16} />
            </div>
            <h2 className="text-lg font-bold">Download Split Report</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 text-muted hover:text-foreground transition-all"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Format Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">
              Select Export Format
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {/* CSV */}
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all',
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'border-border bg-surface-2/40 text-muted hover:text-foreground hover:bg-surface-2'
                )}
              >
                <FiFileText size={22} className={format === 'csv' ? 'text-emerald-500' : 'text-muted'} />
                <span>CSV</span>
              </button>

              {/* Excel */}
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all',
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'border-border bg-surface-2/40 text-muted hover:text-foreground hover:bg-surface-2'
                )}
              >
                <FiGrid size={22} className={format === 'excel' ? 'text-emerald-500' : 'text-muted'} />
                <span>Excel (.xlsx)</span>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all',
                  format === 'pdf'
                    ? 'border-emerald-500 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'border-border bg-surface-2/40 text-muted hover:text-foreground hover:bg-surface-2'
                )}
              >
                <FiFile size={22} className={format === 'pdf' ? 'text-emerald-500' : 'text-muted'} />
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          {/* Scope Options */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">
              Filter Options Scope
            </label>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left',
                  scope === 'filtered'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-border bg-surface hover:bg-surface-2/50 text-foreground'
                )}
              >
                <span>Current Filtered Splits ({splits.length} items)</span>
                {scope === 'filtered' && <FiCheck size={14} className="text-emerald-500" />}
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left',
                  scope === 'all'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-border bg-surface hover:bg-surface-2/50 text-foreground'
                )}
              >
                <span>All Splits Record History ({allSplits.length} items)</span>
                {scope === 'all' && <FiCheck size={14} className="text-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Record Summary Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/60 border border-border/80 text-xs">
            <span className="text-muted font-medium">Included Records:</span>
            <span className="font-bold text-emerald-500">{totalRecords} Splits</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-border bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-bold transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isGenerating || totalRecords === 0}
            onClick={handleDownload}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <FiDownload size={15} />
            <span>{isGenerating ? 'Generating...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Helpers & Downloaders
function downloadCSV(items: Split[], myEmail: string) {
  if (!items.length) return;
  const rows = [
    ['Record ID', 'Title', 'Total Amount', 'Paid By', 'Split Mode', 'Members Count', 'Status', 'Date'],
    ...items.map((s) => [
      s.recordId,
      s.title,
      String(s.amount),
      getSplitUserName(s.paidBy),
      s.splitMode,
      String(s.members.length),
      s.status,
      new Date(s.createdAt).toLocaleDateString(),
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `splits-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(items: Split[], myEmail: string) {
  if (!items.length) return;
  let excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="Header">
    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#10B981" ss:Pattern="Solid"/>
  </Style>
</Styles>
<Worksheet ss:Name="Splits Report">
<Table>
  <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Record ID</Data></Cell>
    <Cell><Data ss:Type="String">Title</Data></Cell>
    <Cell><Data ss:Type="String">Total Amount</Data></Cell>
    <Cell><Data ss:Type="String">Paid By</Data></Cell>
    <Cell><Data ss:Type="String">Split Mode</Data></Cell>
    <Cell><Data ss:Type="String">Members</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Date</Data></Cell>
  </Row>`;

  items.forEach((s) => {
    excelXml += `
  <Row>
    <Cell><Data ss:Type="String">${escapeXml(s.recordId)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.title)}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(getSplitUserName(s.paidBy))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.splitMode)}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.members.length}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${new Date(s.createdAt).toLocaleDateString()}</Data></Cell>
  </Row>`;
  });

  excelXml += `
</Table>
</Worksheet>
</Workbook>`;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `splits-report-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(items: Split[], myEmail: string) {
  if (!items.length) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let youOwe = 0;
  let owedToYou = 0;
  const lowerMyEmail = myEmail.toLowerCase();

  items.forEach((s) => {
    if (s.status === 'Completed') return;
    const payerEmail = getSplitUserEmail(s.paidBy).toLowerCase();
    const iAmPayer = lowerMyEmail ? payerEmail === lowerMyEmail : false;

    if (iAmPayer) {
      s.members.forEach((m) => {
        if (getSplitUserEmail(m.userId).toLowerCase() !== payerEmail && !m.paid) {
          owedToYou += m.shareAmount;
        }
      });
    } else {
      const myMember = s.members.find((m) => getSplitUserEmail(m.userId).toLowerCase() === lowerMyEmail);
      if (myMember && !myMember.paid) {
        youOwe += myMember.shareAmount;
      }
    }
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Splits Report - Expense Tracker</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
    h1 { margin-bottom: 4px; font-size: 24px; color: #10B981; }
    p.subtitle { color: #666; font-size: 12px; margin-top: 0; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .card { flex: 1; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .card-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th { background: #10B981; color: white; text-align: left; padding: 10px; font-weight: bold; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .owe { color: #EF4444; font-weight: bold; }
    .owed { color: #10B981; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Splits Summary & Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleString()} | Total Records: ${items.length}</p>

  <div class="stats">
    <div class="card">
      <div class="card-title">You Owe</div>
      <div class="card-value owe">₹${youOwe.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="card-title">Owed To You</div>
      <div class="card-value owed">₹${owedToYou.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Records</div>
      <div class="card-value">${items.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Record ID</th>
        <th>Title</th>
        <th>Total Amount</th>
        <th>Paid By</th>
        <th>Members</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (s) => `
        <tr>
          <td>${escapeXml(s.recordId)}</td>
          <td>${escapeXml(s.title)}</td>
          <td>₹${s.amount.toLocaleString('en-IN')}</td>
          <td>${escapeXml(getSplitUserName(s.paidBy))}</td>
          <td>${s.members.length} members</td>
          <td>${escapeXml(s.status)}</td>
          <td>${new Date(s.createdAt).toLocaleDateString()}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
