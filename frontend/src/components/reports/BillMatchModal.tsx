import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, Download, Loader2, CheckCircle, AlertCircle, XCircle, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { performBillMatch } from '../../utils/billMatchLogic';
import type { 
  LedgerTransactionData, 
  ExtractedBillData, 
  MatchResult 
} from '../../utils/billMatchLogic';

interface BillMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerName: string;
  ledgerTransactions: LedgerTransactionData[];
}

const BillMatchModal: React.FC<BillMatchModalProps> = ({
  isOpen,
  onClose,
  ledgerName,
  ledgerTransactions
}) => {
  const [extractedData, setExtractedData] = useState<ExtractedBillData[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // Fallback if invalid date
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional warning for large files
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Large File',
        text: 'This file is quite large and AI extraction might take up to a minute. Please be patient!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000
      });
    }

    setIsProcessing(true);

    try {
      // Send file to backend
      const formData = new FormData();
      formData.append('billImage', file);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/gemini/extract-bill`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to process document with AI');
      }

      const responseData = await response.json();
      if (!Array.isArray(responseData)) {
        throw new Error('AI extraction returned invalid data format.');
      }

      let parsedData: any[] = responseData;

      // Add IDs
      const formattedData: ExtractedBillData[] = parsedData.map((item, index) => ({
        id: `bill_${index}_${Date.now()}`,
        date: item.date || '',
        particulars: item.particulars || '',
        voucherType: item.voucherType || '',
        voucherNo: item.voucherNo || '',
        debit: Number(item.debit) || 0,
        credit: Number(item.credit) || 0,
        amount: Number(item.amount) || 0,
      }));

      setExtractedData(formattedData);
      
      // Run Matching
      const results = performBillMatch(ledgerTransactions, formattedData);
      setMatchResults(results);

      const matchedCount = results.filter(r => r.status === 'matched').length;
      Swal.fire({
        icon: 'success',
        title: 'Extraction Complete',
        text: `Extracted ${formattedData.length} records. Automatically matched ${matchedCount} records.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

    } catch (err: any) {
      console.error("Error processing file:", err);
      Swal.fire({
        icon: 'error',
        title: 'Extraction Failed',
        text: err.message || 'An unexpected error occurred.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    setExtractedData([]);
    setMatchResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadUnmatched = () => {
    const unmatched = matchResults.filter(r => r.status === 'unmatched');
    if (unmatched.length === 0) return;

    const exportData = unmatched.map(r => {
      const isLedger = r.ledgerEntry !== null;
      const entry = r.ledgerEntry || r.billEntry;
      return {
        'Source': isLedger ? 'Tally Ledger' : 'Uploaded Bill',
        'Date': entry?.date,
        'Particulars': entry?.particulars,
        'Voucher Type': entry?.voucherType,
        'Voucher No': entry?.voucherNo,
        'Debit': entry?.debit,
        'Credit': entry?.credit,
        'Amount': (entry as ExtractedBillData)?.amount || '',
        'Mismatch Reason': r.reason
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Unmatched Entries');
    XLSX.writeFile(workbook, `${ledgerName}_Unmatched_Entries.xlsx`);
  };

  const stats = useMemo(() => {
    return {
      total: matchResults.length,
      matched: matchResults.filter(r => r.status === 'matched').length,
      partial: matchResults.filter(r => r.status === 'partial').length,
      unmatched: matchResults.filter(r => r.status === 'unmatched').length,
    };
  }, [matchResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm text-black">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 text-black">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-sm border border-purple-200">
                <Sparkles size={20} className="text-purple-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-700">
                AI Bill Match
              </h2>
              <span className="text-xl font-bold text-gray-700 mx-1">-</span>
              <h2 className="text-xl font-semibold text-gray-800">{ledgerName}</h2>
            </div>
            {matchResults.length > 0 && (
              <div className="flex gap-4 mt-2 text-sm font-medium">
                <span className="text-gray-600">Total: {stats.total}</span>
                <span className="text-green-600">Matched: {stats.matched}</span>
                <span className="text-yellow-600">Partial: {stats.partial}</span>
                <span className="text-red-600">Unmatched: {stats.unmatched}</span>
                <span className="text-blue-600 border-l pl-4 border-gray-300">
                  Match Score: {stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {matchResults.length > 0 && (
              <button
                onClick={handleDownloadUnmatched}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Download Unmatched
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 text-black rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Ledger Transactions */}
          <div className="w-1/2 flex flex-col border-r border-gray-200">
            <div className="p-3 bg-gray-100 font-semibold text-center border-b border-gray-200 text-black">
              Tally Ledger Transactions
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white text-black">
              <table className="w-full text-sm text-black">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Particulars</th>
                    <th className="pb-2">Vch Type</th>
                    <th className="pb-2">Debit</th>
                    <th className="pb-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.map((t, idx) => {
                    const matchResult = matchResults.find(r => r.ledgerEntry?.id === t.id);
                    let bgColor = '';
                    if (matchResult) {
                      if (matchResult.status === 'matched') bgColor = 'bg-green-50';
                      else if (matchResult.status === 'partial') bgColor = 'bg-yellow-50';
                      else if (matchResult.status === 'unmatched') bgColor = 'bg-red-50';
                    }

                    return (
                      <tr key={idx} className={`border-b border-gray-200 ${bgColor || 'hover:bg-gray-50'} transition-all`}>
                        <td className="py-2">{formatDisplayDate(t.date)}</td>
                        <td className="py-2 max-w-[200px] truncate" title={t.particulars}>{t.particulars}</td>
                        <td className="py-2">{t.voucherType}</td>
                        <td className="py-2 text-red-500">{t.debit > 0 ? t.debit.toFixed(2) : ''}</td>
                        <td className="py-2 text-green-500">{t.credit > 0 ? t.credit.toFixed(2) : ''}</td>
                      </tr>
                    );
                  })}
                  {ledgerTransactions.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No ledger transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Upload & AI Results */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            <div className="p-3 bg-blue-50 text-blue-800 font-semibold text-center border-b border-blue-100 flex justify-between items-center px-4">
              <span>Extracted Bill Data (AI)</span>
              <div className="flex gap-2">
                {matchResults.length > 0 && (
                  <button 
                    onClick={handleClearData}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isProcessing ? 'Processing...' : 'Upload Bill'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 relative">
              {matchResults.length === 0 && !isProcessing && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Upload size={48} className="mb-4 opacity-50" />
                  <p>Upload a PDF or Image bill to extract and match data</p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="relative flex items-center justify-center mb-8">
                    {/* Outer animated rings */}
                    <div className="absolute w-32 h-32 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute w-24 h-24 border-4 border-purple-100 border-b-purple-600 rounded-full animate-[spin_2s_linear_reverse]"></div>
                    {/* Inner glowing icon */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-full shadow-lg shadow-purple-500/50 animate-pulse">
                      <Sparkles size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    AI Engine is Scanning...
                  </h3>
                  <p className="text-sm text-gray-500 font-medium animate-pulse">
                    Extracting tables & cross-referencing records. Please hold on.
                  </p>
                </div>
              )}

              {matchResults.length > 0 && (
                <table className="w-full text-sm text-black">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 w-8">Sts</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Particulars</th>
                      <th className="pb-2">Voucher Type</th>
                      <th className="pb-2 text-right">Debit</th>
                      <th className="pb-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.map((r, idx) => {
                      const entry = r.billEntry;
                      if (!entry) return null; // Skip unmatched Tally ledger rows on the right side
                      
                      let bgColor = '';
                      let Icon = AlertCircle;
                      let iconColor = '';
                      
                      if (r.status === 'matched') {
                        bgColor = 'bg-green-50';
                        iconColor = 'text-green-500';
                        Icon = CheckCircle;
                      } else if (r.status === 'partial') {
                        bgColor = 'bg-yellow-50';
                        iconColor = 'text-yellow-500';
                        Icon = AlertCircle;
                      } else {
                        bgColor = 'bg-red-50';
                        iconColor = 'text-red-500';
                        Icon = XCircle;
                      }

                      return (
                        <tr key={idx} className={`border-b border-gray-200 ${bgColor} hover:brightness-95 transition-all`}>
                          <td className="py-2 pl-1" title={r.reason}><Icon size={16} className={iconColor} /></td>
                          <td className="py-2">{formatDisplayDate(entry.date)}</td>
                          <td className="py-2 max-w-[150px] truncate" title={entry.particulars}>{entry.particulars}</td>
                          <td className="py-2">{entry.voucherType || '-'}</td>
                          <td className="py-2 text-right text-red-500">
                            {entry.debit > 0 ? entry.debit.toFixed(2) : ''}
                          </td>
                          <td className="py-2 text-right text-green-500">
                            {entry.credit > 0 ? entry.credit.toFixed(2) : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BillMatchModal;
