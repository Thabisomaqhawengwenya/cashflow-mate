import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatMoney, STANDARD_CATEGORIES } from '@cashflow-mate/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  FileText
} from 'lucide-react';

export const ImportPage: React.FC = () => {
  const { business, setCurrentTab } = useAuth();
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedCsv, setPastedCsv] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [previewData, setPreviewData] = useState<any>(null);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [commitResult, setCommitResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile && !pastedCsv.trim()) {
      setError('Please select a CSV file or paste transaction CSV data.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('csvContent', pastedCsv);
      }
      formData.append('defaultCurrency', business?.currency || 'USD');

      const result = await api.previewCsv(formData);
      setPreviewData(result);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file. Ensure it has valid header columns.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.previewRows) return;
    setIsProcessing(true);
    try {
      const res = await api.commitImport({
        filename: selectedFile?.name || 'pasted_records.csv',
        rows: previewData.previewRows,
        skipDuplicates
      });
      setCommitResult(res);
      setStep('success');
    } catch (err: any) {
      alert(err.message || 'Failed to commit imported records');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    window.open('/api/imports/template', '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">Import Transactions</h1>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Safely import EcoCash statements, InnBucks records, or till spreadsheets with automatic categorization.
          </p>
        </div>
        <Button
          variant="tonal"
          size="sm"
          onClick={downloadSampleTemplate}
          icon={<Download size={14} />}
        >
          Download Sample Template
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-medium">
        <span
          className={`px-3 py-1 rounded-full ${
            step === 'upload'
              ? 'bg-md-primary text-md-on-primary font-semibold'
              : 'bg-md-surface-container text-md-on-surface-variant'
          }`}
        >
          1. Select File
        </span>
        <span className="text-md-outline-variant">&rarr;</span>
        <span
          className={`px-3 py-1 rounded-full ${
            step === 'review'
              ? 'bg-md-primary text-md-on-primary font-semibold'
              : 'bg-md-surface-container text-md-on-surface-variant'
          }`}
        >
          2. Review & Match
        </span>
        <span className="text-md-outline-variant">&rarr;</span>
        <span
          className={`px-3 py-1 rounded-full ${
            step === 'success'
              ? 'bg-md-primary text-md-on-primary font-semibold'
              : 'bg-md-surface-container text-md-on-surface-variant'
          }`}
        >
          3. Complete
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-md-error-container text-md-on-error-container text-xs font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
        <Card variant="elevated" shape="lg" padding="lg" className="space-y-6">
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-md-outline-variant/60 rounded-xl p-8 text-center hover:border-md-primary transition-colors flex flex-col items-center justify-center cursor-pointer relative bg-md-surface-container-low/50">
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-14 h-14 rounded-full bg-md-primary-container text-md-primary flex items-center justify-center mb-3">
              <UploadCloud size={28} />
            </div>
            <h3 className="font-bold text-base text-md-on-surface mb-1">
              {selectedFile ? selectedFile.name : 'Upload your transaction CSV file'}
            </h3>
            <p className="text-xs text-md-on-surface-variant max-w-sm">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB - Ready to parse`
                : 'Drag and drop your statement file here, or click to browse (up to 5MB)'}
            </p>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <span className="h-px bg-md-outline-variant/40 w-full" />
            <span className="px-3 bg-md-surface-container-lowest text-[11px] text-md-on-surface-variant uppercase font-semibold absolute">
              Or Paste CSV Text
            </span>
          </div>

          <div>
            <textarea
              className="w-full h-32 p-3 bg-md-surface-container-low border border-md-outline-variant text-md-on-surface text-xs font-mono rounded-md focus:outline-none focus:ring-2 focus:ring-md-primary"
              placeholder="Date,Description,Amount,Type&#10;2026-10-25,Bakers Inn delivery,30.00,Expense&#10;2026-10-25,Counter cash sales,65.00,Income"
              value={pastedCsv}
              onChange={(e) => {
                setPastedCsv(e.target.value);
                if (selectedFile) setSelectedFile(null);
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="filled"
              size="lg"
              onClick={handlePreview}
              isLoading={isProcessing}
              disabled={!selectedFile && !pastedCsv.trim()}
              icon={<ArrowRight size={16} />}
            >
              Parse & Preview Rows
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: REVIEW QUEUE */}
      {step === 'review' && previewData && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-md-surface-container rounded-lg border border-md-outline-variant/30">
              <span className="text-[11px] text-md-on-surface-variant block font-medium">Total Rows</span>
              <strong className="text-lg text-md-on-surface">{previewData.totalRows}</strong>
            </div>
            <div className="p-3 bg-finance-inflow-container/40 rounded-lg border border-finance-inflow/30">
              <span className="text-[11px] text-finance-inflow block font-medium">Ready to Import</span>
              <strong className="text-lg text-finance-inflow">{previewData.validRows}</strong>
            </div>
            <div className="p-3 bg-finance-review-container/40 rounded-lg border border-finance-review/30">
              <span className="text-[11px] text-finance-review block font-medium">Duplicates Flagged</span>
              <strong className="text-lg text-finance-review">{previewData.duplicateRows}</strong>
            </div>
            <div className="p-3 bg-finance-outflow-container/40 rounded-lg border border-finance-outflow/30">
              <span className="text-[11px] text-finance-outflow block font-medium">Invalid Lines</span>
              <strong className="text-lg text-finance-outflow">{previewData.invalidRows}</strong>
            </div>
          </div>

          {/* Duplicates Toggle */}
          <Card variant="elevated" shape="lg" padding="sm" className="p-3.5 flex items-center justify-between">
            <div className="text-xs">
              <strong className="text-md-on-surface block">Safe Import Protection:</strong>
              <span className="text-md-on-surface-variant">
                Automatically skip duplicate candidates to prevent double-counting.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-md-on-surface">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-md-primary"
              />
              <span>Skip Duplicates</span>
            </label>
          </Card>

          {/* Staged Rows Table */}
          <Card variant="elevated" shape="lg" padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-md-on-surface">
                <thead className="bg-md-surface-container-high text-md-on-surface-variant text-[11px] font-semibold border-b border-md-outline-variant/30">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Suggested Category</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline-variant/20">
                  {previewData.previewRows.map((row: any) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        !row.isValid
                          ? 'bg-md-error-container/20'
                          : row.isDuplicate
                          ? 'bg-finance-review-container/20'
                          : ''
                      }
                    >
                      <td className="py-2.5 px-3 text-md-on-surface-variant">{row.rowNumber}</td>
                      <td className="py-2.5 px-3 font-mono">{row.parsedDate || '-'}</td>
                      <td className="py-2.5 px-3 font-medium max-w-xs truncate">
                        {row.parsedDescription}
                        {row.duplicateReason && (
                          <span className="text-[10px] text-finance-review block">
                            {row.duplicateReason}
                          </span>
                        )}
                        {row.validationError && (
                          <span className="text-[10px] text-md-error block">
                            {row.validationError}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        {row.parsedAmount !== null ? formatMoney(row.parsedAmount, row.currency) : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-md-surface-container-high text-[11px]">
                          {STANDARD_CATEGORIES[row.category as keyof typeof STANDARD_CATEGORIES]?.label || row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!row.isValid ? (
                          <Badge variant="flagged" size="sm">Invalid</Badge>
                        ) : row.isDuplicate ? (
                          <Badge variant="review" size="sm">Duplicate</Badge>
                        ) : (
                          <Badge variant="inflow" size="sm">Ready</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outlined" size="md" onClick={() => setStep('upload')}>
              &larr; Back to File Selection
            </Button>
            <Button
              variant="filled"
              size="lg"
              onClick={handleCommit}
              isLoading={isProcessing}
              icon={<CheckCircle2 size={16} />}
            >
              Commit & Save Transactions
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS REPORT */}
      {step === 'success' && commitResult && (
        <Card variant="elevated" shape="lg" padding="lg" className="text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-finance-inflow-container text-finance-inflow flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-md-on-surface">Import Completed Successfully!</h2>
            <p className="text-xs text-md-on-surface-variant mt-1">
              Your financial records have been normalized, stored, and integrated into your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center">
            <div className="p-3 bg-md-surface-container rounded-lg">
              <span className="text-[11px] text-md-on-surface-variant block">Imported</span>
              <strong className="text-lg text-finance-inflow">{commitResult.importedCount}</strong>
            </div>
            <div className="p-3 bg-md-surface-container rounded-lg">
              <span className="text-[11px] text-md-on-surface-variant block">Duplicates Skipped</span>
              <strong className="text-lg text-finance-review">{commitResult.duplicateSkipped}</strong>
            </div>
            <div className="p-3 bg-md-surface-container rounded-lg">
              <span className="text-[11px] text-md-on-surface-variant block">Invalid Ignored</span>
              <strong className="text-lg text-md-on-surface-variant">{commitResult.skippedCount}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Button variant="tonal" size="md" onClick={() => setStep('upload')}>
              Import Another Statement
            </Button>
            <Button variant="filled" size="md" onClick={() => setCurrentTab('transactions')}>
              View Transactions
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
