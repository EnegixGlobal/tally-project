import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const PurchaseInvoiceMatching: React.FC = () => {
  const { theme, ledgers } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [purchaseVouchers, setPurchaseVouchers] = React.useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = React.useState<any[]>([]);
  const [importedData, setImportedData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [matching, setMatching] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMatching(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Simulate processing time for animation
      setTimeout(() => {
        setImportedData(data);
        setMatching(false);
      }, 2000);
    };
    reader.readAsBinaryString(file);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId = localStorage.getItem("company_id");
        const ownerType = localStorage.getItem("supplier");
        const ownerId = localStorage.getItem(
          ownerType === "employee" ? "employee_id" : "user_id"
        );

        if (!companyId || !ownerType || !ownerId) {
          setLoading(false);
          return;
        }

        // Purchase Vouchers
        const vouchersRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const vouchersJson = await vouchersRes.json();
        setPurchaseVouchers(
          vouchersJson?.success && Array.isArray(vouchersJson.data)
            ? vouchersJson.data
            : Array.isArray(vouchersJson)
              ? vouchersJson
              : []
        );

        // Purchase History
        const historyRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const historyJson = await historyRes.json();
        setPurchaseHistory(
          historyJson?.success && Array.isArray(historyJson.data)
            ? historyJson.data
            : Array.isArray(historyJson)
              ? historyJson
              : []
        );

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge books and history, and match with imported excel (STRICT MODE)
  const { mergedData: mergedRows, matchStats } = React.useMemo(() => {
    // 1. Base Merge
    const baseRows = purchaseVouchers.map(voucher => {
      const historyItems = purchaseHistory.filter(h =>
        String(h.voucherNumber || '').trim().toLowerCase() === String(voucher.number || '').trim().toLowerCase()
      );
      const itemNames = historyItems.map(h => h.itemName).filter(Boolean).join(', ');

      // Resolve Party Name
      const historyPartyName = historyItems[0]?.partyName;
      const ledgerParty = ledgers.find((l: any) => String(l.id) === String(voucher.partyId));
      const resolvedPartyName = ledgerParty?.name || historyPartyName || voucher.partyId || '';

      return {
        ...voucher,
        itemName: itemNames || '-',
        resolvedPartyName,
        source: 'MERGED'
      };
    });

    if (importedData.length === 0) {
      return { mergedData: baseRows, matchStats: null };
    }

    // 2. Matching Logic
    const sample = importedData[0];
    const keys = Object.keys(sample || {});
    const findKey = (patterns: RegExp[]) => keys.find(k => patterns.some(p => p.test(k)));

    // Keys
    const vchKey = findKey([/voucher\s*no/i, /vch\s*no/i, /invoice\s*no/i, /^number$/i]);
    const partyKey = findKey([/party\s*name/i, /buyer\s*name/i, /customer\s*name/i, /ledger\s*name/i, /supplier\s*name/i]);
    const itemKey = findKey([/item\s*name/i, /product\s*name/i]);

    // Amounts
    const amtKey = findKey([/^total$/i, /^net\s*amount$/i, /^grand\s*total$/i, /^amount$/i]);
    const taxableKey = findKey([/taxable/i, /basic\s*value/i]);
    const cgstKey = findKey([/^cgst$/i]);
    const sgstKey = findKey([/^sgst$/i]);
    const igstKey = findKey([/^igst$/i]);

    // Date
    const dateKey = findKey([/^date$/i]);

    console.log("Strict Matching Keys:", { vchKey, partyKey, itemKey, amtKey, taxableKey, cgstKey, sgstKey, igstKey, dateKey });

    let matched = 0;

    // 3. Track Consumed Excel Rows
    const matchedExcelIndices = new Set<number>();

    const matchedRows = baseRows.map(row => {
      // 1. Voucher Number Match
      if (!vchKey) return { ...row, matchStatus: 'UNKNOWN_KEYS' };
      const bookVch = String(row.number || '').trim();

      // Find FIRST unused match in Excel
      const excelIndex = importedData.findIndex((ex, idx) =>
        !matchedExcelIndices.has(idx) &&
        String(ex[vchKey] || '').trim() === bookVch
      );

      const excelRow = excelIndex !== -1 ? importedData[excelIndex] : undefined;
      // Mark as matched if found
      if (excelIndex !== -1) matchedExcelIndices.add(excelIndex);

      let status = 'MISSING_IN_EXCEL';
      let failureReason = '';
      let excelAmt = 0;

      if (excelRow) {
        status = 'MATCHED';

        // Helper for strict checks
        const checkString = (key: string | undefined, bookVal: string, label: string) => {
          if (status !== 'MATCHED' || !key) return;
          const exVal = String(excelRow[key] || '').trim();
          if (exVal !== bookVal.trim()) {
            status = 'MISMATCH';
            failureReason = `${label}: "${exVal}" vs "${bookVal}"`;
          }
        };

        const checkNumber = (key: string | undefined, bookVal: number, label: string) => {
          if (status !== 'MATCHED' || !key) return;
          const exVal = Number(excelRow[key] || 0);
          if (Math.abs(exVal - bookVal) > 0.1) {
            status = 'MISMATCH';
            failureReason = `${label}: ${exVal} vs ${bookVal}`;
          }
        };

        // 2. Party Name
        checkString(partyKey, row.resolvedPartyName, 'Party');

        // 3. Item Name
        checkString(itemKey, row.itemName, 'Item');

        // 4. Amounts
        checkNumber(amtKey, Number(row.total || 0), 'Total');
        checkNumber(taxableKey, Number(row.subtotal || 0), 'Taxable');

        // 5. Taxes
        checkNumber(cgstKey, Number(row.cgstTotal || 0), 'CGST');
        checkNumber(sgstKey, Number(row.sgstTotal || 0), 'SGST');
        checkNumber(igstKey, Number(row.igstTotal || 0), 'IGST');

        // 6. Date (Simple string check if both formatted, otherwise skip complex date parsing for now or try basics)
        if (dateKey && status === 'MATCHED') {
          // Excel date often serial key. Book date is ISO.
          // If Excel is numeric (serial), we skip strict string match unless we parse.
          // UI shows `new Date(row.date).toLocaleDateString('en-IN')` -> "18/2/2026"
          // If Excel has "18/2/2026" text, we match.
          // If Excel has 46071, we can't strict match string "46071" vs "18/2/2026".
          // I'll try to match against formatted UI date.
          const uiDate = row.date ? new Date(row.date).toLocaleDateString('en-IN') : '-';
          let exDate = excelRow[dateKey];

          // Simple serial to date (approx)
          if (typeof exDate === 'number' && exDate > 20000) {
            // Serial date
            const dateObj = new Date(Math.round((exDate - 25569) * 864e5));
            exDate = dateObj.toLocaleDateString('en-IN');
          } else {
            exDate = String(exDate || '').trim();
          }

          // Normalize slashes/dashes
          const nUi = uiDate.replace(/-/g, '/');
          const nEx = String(exDate).replace(/-/g, '/');

          if (nEx !== nUi) {
            // Relaxed check: maybe D/M/YY vs DD/MM/YYYY?
            // If not exact string match, mark mismatch
            status = 'MISMATCH';
            failureReason = `Date: ${exDate} vs ${uiDate}`;
          }
        }

        if (status === 'MATCHED') matched++;
        if (amtKey) excelAmt = Number(excelRow[amtKey] || 0);
      }

      return { ...row, matchStatus: status, excelMatchAmount: excelAmt, matchFailureReason: failureReason };
    });

    // 4. Identify Extra Excel Rows (Missing in Books)
    const extraRows = importedData
      .map((row, index) => ({ row, index }))
      .filter(({ index }) => !matchedExcelIndices.has(index))
      .map(({ row }) => {
        // Map Excel row to table structure with robust fallback
        const dateRaw = row[dateKey];
        let dateVal = '-';

        // Try parsing Excel date (Serial or String)
        if (typeof dateRaw === 'number' && dateRaw > 20000) {
          try {
            const dateObj = new Date(Math.round((dateRaw - 25569) * 864e5));
            dateVal = dateObj.toISOString();
          } catch (e) { dateVal = String(dateRaw); }
        } else if (dateRaw) {
          // If string, keep it as is. The UI will try to format or show raw.
          // To make it compatible with table's "new Date(date)", if it's not a valid date string, table might show "Invalid Date".
          // Let's assume the table handles it or we pass a flag. 
          // Actually, we'll store the raw string if it's not a clear ISO.
          dateVal = String(dateRaw);
        }

        const voucherNo = row[vchKey];
        const partyName = row[partyKey];
        const itemName = row[itemKey];

        const taxable = taxableKey ? Number(row[taxableKey] || 0) : 0;
        const cgst = cgstKey ? Number(row[cgstKey] || 0) : 0;
        const sgst = sgstKey ? Number(row[sgstKey] || 0) : 0;
        const igst = igstKey ? Number(row[igstKey] || 0) : 0;
        const total = amtKey ? Number(row[amtKey] || 0) : 0;

        return {
          _id: `excel-extra-${Math.random()}`,
          date: dateVal,
          number: voucherNo,
          resolvedPartyName: partyName || 'Unknown (Excel)',
          itemName: itemName || '-',
          subtotal: taxable,
          cgstTotal: cgst,
          sgstTotal: sgst,
          igstTotal: igst,
          total: total,
          matchStatus: 'MISSING_IN_BOOKS',
          source: 'EXCEL'
        } as any;
      });

    const finalMerged = [...matchedRows, ...extraRows];

    return {
      mergedData: finalMerged,
      matchStats: {
        totalBooks: baseRows.length,
        totalExcel: importedData.length,
        matched,
        percentage: baseRows.length > 0 ? ((matched / baseRows.length) * 100).toFixed(1) : 0,
        extraInExcel: extraRows.length
      }
    };

  }, [purchaseVouchers, purchaseHistory, importedData, ledgers]);

  return (
    <div className={`min-h-screen pt-[56px] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/reports')}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Purchase Invoice Matching
                {matching && <Loader2 className="animate-spin text-blue-500" size={20} />}
              </h1>
              <p className="text-sm opacity-70">Strict Matching with Books Data</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              disabled={matching}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-95 shadow-md ${matching ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <FileSpreadsheet size={16} />
              {importedData.length > 0 ? 'Re-Upload Invoice' : 'Upload Invoice'}
            </button>
            <div className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-md border max-w-lg text-center shadow-sm ${theme === 'dark' ? 'bg-orange-900/20 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
              <span className="block mb-0.5 uppercase tracking-wider opacity-80">⚠ Required Excel Headers (Exact Match):</span>
              Date, Voucher No, Party Name, Item Name, Taxable, CGST, SGST, IGST, Total Tax, Total
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx, .xls"
          />
        </div>

        {/* Animated Summary Stats */}
        {!loading && !matching && matchStats && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-100'} shadow-sm transition-transform hover:scale-105 duration-300 cursor-default`}>
              <p className="text-xs opacity-70 uppercase font-bold tracking-wider">Total Vouchers</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black mt-1" title="Books">{matchStats.totalBooks}</p>
                <span className="text-xs opacity-50">/ {matchStats.totalExcel} Excel</span>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'} shadow-sm transition-transform hover:scale-105 duration-300 cursor-default`}>
              <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Matched</p>
              <p className="text-2xl font-black text-green-600 mt-1">{matchStats.matched} <span className="text-sm font-medium opacity-70">({matchStats.percentage}%)</span></p>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'} shadow-sm transition-transform hover:scale-105 duration-300 cursor-default`}>
              <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Mismatch</p>
              <p className="text-2xl font-black text-red-600 mt-1">{mergedRows.filter(r => r.matchStatus === 'MISMATCH').length}</p>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-100'} shadow-sm transition-transform hover:scale-105 duration-300 cursor-default`}>
              <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">Missing in Excel</p>
              <p className="text-2xl font-black text-orange-600 mt-1">{mergedRows.filter(r => r.matchStatus === 'MISSING_IN_EXCEL').length}</p>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'} shadow-sm transition-transform hover:scale-105 duration-300 cursor-default`}>
              <p className="text-xs text-purple-600 uppercase font-bold tracking-wider">Extra in Excel</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{matchStats.extraInExcel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse">Loading Books Data...</p>
          </div>
        ) : matching ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Matching Data...</h3>
              <p className="text-sm opacity-70">Comparing {importedData.length} excel rows with {purchaseVouchers.length} book vouchers.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-lg transition-opacity duration-500">
            <table className={`min-w-full text-sm text-center
              ${theme === 'dark'
                ? 'bg-gray-900 text-white divide-gray-700'
                : 'bg-white text-gray-900 divide-gray-200'
              } divide-y`}>

              {/* Header */}
              <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
                <tr>
                  {[
                    "Date",
                    "Voucher No",
                    "Party Name",
                    "Item Name",
                    "Taxable",
                    "CGST",
                    "SGST",
                    "IGST",
                    "Total Tax",
                    "Total",
                    ...(matchStats ? ["Matching Status"] : [])
                  ].map(h => (
                    <th key={h} className="px-6 py-4 font-extrabold uppercase text-xs tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y relative">
                {mergedRows.length > 0 ? mergedRows.map((row, idx) => {
                  const partyName = row.resolvedPartyName;
                  const date = row.date;
                  const voucherNo = row.number;
                  // Purchase vouchers often use subtotal/total same as sales
                  const taxable = Number(row.subtotal || 0);
                  const cgst = Number(row.cgstTotal || 0);
                  const sgst = Number(row.sgstTotal || 0);
                  const igst = Number(row.igstTotal || 0);
                  const totalTax = cgst + sgst + igst;
                  const total = Number(row.total || 0);

                  // Row Background based on status
                  let rowBg = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
                  if (matchStats) {
                    if (row.matchStatus === 'MISMATCH') rowBg = theme === 'dark' ? 'bg-red-900/10 hover:bg-red-900/20' : 'bg-red-200 hover:bg-red-100';
                    if (row.matchStatus === 'MATCHED') rowBg = theme === 'dark' ? 'bg-green-900/5 hover:bg-green-900/10' : 'bg-green-200 hover:bg-green-50';
                  }

                  return (
                    <tr
                      key={idx}
                      className={`${rowBg} transition-colors duration-200`}
                    >
                      <td className="px-6 py-4">
                        {(() => {
                          if (!date) return '-';
                          const d = new Date(date);
                          return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-IN');
                        })()}
                      </td>
                      <td className="px-6 py-4 font-semibold">{voucherNo || '-'}</td>
                      <td className="px-6 py-4 font-semibold">{partyName}</td>
                      <td className="px-6 py-4 text-xs opacity-80 max-w-[150px] truncate" title={row.itemName}>{row.itemName}</td>
                      <td className="px-6 py-4">{taxable.toFixed(2)}</td>
                      <td className="px-6 py-4">{cgst.toFixed(2)}</td>
                      <td className="px-6 py-4">{sgst.toFixed(2)}</td>
                      <td className="px-6 py-4">{igst.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold opacity-80">{totalTax.toFixed(2)}</td>
                      <td className="px-6 py-4 font-extrabold">{total.toFixed(2)}</td>

                      {matchStats && (
                        <td className="px-6 py-4 text-left">
                          {row.matchStatus === 'MATCHED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-bold shadow-sm">
                              <CheckCircle size={14} className="stroke-2" /> Exact Match
                            </span>
                          )}
                          {row.matchStatus === 'MISMATCH' && (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-sm">
                                <XCircle size={14} className="stroke-2" /> Mismatch
                              </span>
                              <span className="text-xs text-red-600 pl-2 font-medium">
                                {row.matchFailureReason}
                              </span>
                            </div>
                          )}
                          {row.matchStatus === 'MISSING_IN_EXCEL' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold shadow-sm">
                              <AlertTriangle size={14} className="stroke-2" /> Missing in Excel
                            </span>
                          )}
                          {row.matchStatus === 'MISSING_IN_BOOKS' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold shadow-sm">
                              <AlertTriangle size={14} className="stroke-2" /> Missing in Books
                            </span>
                          )}
                          {row.matchStatus === 'UNKNOWN_KEYS' && <span className="text-gray-500 text-xs text-center block">⚠ Keys Not Found</span>}
                        </td>
                      )}
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={matchStats ? 11 : 10} className="py-12 text-center opacity-50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet size={48} strokeWidth={1} />
                        <p>No data found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoiceMatching;
