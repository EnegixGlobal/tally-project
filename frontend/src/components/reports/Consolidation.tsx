import { useState, useEffect } from "react";

const formatINR = (value: number) => {
  if (value === undefined || value === null) return "-";
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

export default function ConsolidatedFinancialReport() {
  const employeeId = localStorage.getItem("employee_id");
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [balanceRows, setBalanceRows] = useState<any[]>([]);
  const [tradingRows, setTradingRows] = useState<any[]>([]);
  const [plRows, setPlRows] = useState<any[]>([]);

  const [detailedSections, setDetailedSections] = useState<{
    capitalAccounts: any;
    sundryCreditors: any;
    sundryPayables: any;
    cashBankBalances: any;
    sundryDebtors: any;
    loansAdvances: any;
  }>({
    capitalAccounts: {},
    sundryCreditors: {},
    sundryPayables: {},
    cashBankBalances: {},
    sundryDebtors: {},
    loansAdvances: {},
  });

  const [loading, setLoading] = useState(true);

  // Helper to flatten company-keyed sections into one array of rows
  const flattenSections = (sectionMap: { [companyId: string]: any[] }): any[] => {
    if (!sectionMap) return [];
    return Object.values(sectionMap).flat();
  };

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      setLoading(true);
      try {
        const [summaryRes, detailsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/employee-financial-report?employee_id=${employeeId}`),
          fetch(`http://localhost:5000/api/employee-financial-report-consolidated?employee_id=${employeeId}`),
        ]);
        const summaryData = await summaryRes.json();
        const detailsData = await detailsRes.json();

        setCompanies(summaryData.companies || []);
        setBalanceRows(summaryData.balanceRows || []);
        setTradingRows(summaryData.tradingRows || []);
        setPlRows(summaryData.plRows || []);

        setDetailedSections({
          capitalAccounts: detailsData.capitalAccounts || {},
          sundryCreditors: detailsData.sundryCreditors || {},
          sundryPayables: detailsData.sundryPayables || {},
          cashBankBalances: detailsData.cashBankBalances || {},
          sundryDebtors: detailsData.sundryDebtors || {},
          loansAdvances: detailsData.loansAdvances || {},
        });
      } catch {
        // optionally handle errors here or display message
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [employeeId]);

  if (loading) return <div>Loading report...</div>;
  if (!companies.length) return <div>No companies assigned or data found.</div>;

  const renderTable = (
  title: string,
  rows: Array<{ [key: string]: any }>,
  companies: { id: number; name: string }[],
  keyName = "name",
  isDetailedSection = false
) => {
  if (!rows || rows.length === 0) return null;

  const allNames = Array.from(
    new Set(rows.map((r) => r[keyName] || r.group_name || r.label))
  );

  let companyTotals: { [key: string]: number } = {};

  if (isDetailedSection) {
    // In detailed sections all rows relate to one company only as there is one array flattened from {companyId: rows[]}
    // So sum amount by company presence in each row or distribute if possible
    companies.forEach((c) => {
      companyTotals[c.id] = rows.reduce((sum, row) => {
        if (!row.companyId || row.companyId === c.id) {
          // Use row.amount directly
          return sum + Number(row.amount || 0);
        }
        return sum;
      }, 0);
    });
  } else {
    // For main reports
    companies.forEach((c) => {
      companyTotals[c.id] = rows.reduce(
        (sum, row) => sum + Number(row.companyTotals?.[String(c.id)] || 0),
        0
      );
    });
  }

  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold my-6 text-center tracking-wide underline">{title}</h2>
      <table className="w-full border-collapse text-sm md:text-base mb-8">
        <thead>
          <tr>
            <th className="border px-4 py-2 bg-gray-100 text-left">PARTICULARS</th>
            <th className="border px-4 py-2 bg-gray-100 text-left">NATURE</th>
            {companies.map((c) => (
              <th key={c.id} className="border px-4 py-2 bg-gray-50 text-right">
                {c.name}
              </th>
            ))}
            <th className="border px-4 py-2 bg-gray-50 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {allNames.map((name, idx) => {
            const row = rows.find(
              (r) => r[keyName] === name || r.group_name === name || r.label === name
            );

            const nature = row?.nature || "-";

            let cells;
            if (isDetailedSection) {
              // Use amount directly
              cells = companies.map(() =>
                Number(row?.amount || 0)
              );
            } else {
              cells = companies.map((c) =>
                Number(row?.companyTotals?.[String(c.id)] || 0)
              );
            }

            const rowTotal = cells.reduce((a, b) => a + b, 0);

            return (
              <tr key={idx}>
                <td className="border px-4 py-2">{name}</td>
                <td className="border px-4 py-2">{nature}</td>
                {cells.map((val, i) => (
                  <td key={i} className="border px-4 py-2 text-right">{formatINR(val)}</td>
                ))}
                <td className="border px-4 py-2 text-right font-bold">{formatINR(rowTotal)}</td>
              </tr>
            );
          })}
          <tr className="font-bold bg-blue-50">
            <td colSpan={2} className="border px-4 py-2 text-right">
              TOTAL
            </td>
            {companies.map((c) => (
              <td key={c.id} className="border px-4 py-2 text-right">{formatINR(companyTotals[c.id])}</td>
            ))}
            <td className="border px-4 py-2 text-right font-bold">
              {formatINR(Object.values(companyTotals).reduce((a, b) => a + b, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};


  return (
    <div className="p-4">
      {renderTable("Consolidated Balance Sheet", balanceRows, companies, "group_name")}

      {renderTable("Consolidated Trading Account", tradingRows, companies, "name")}
      {renderTable("Profit & Loss Account", plRows, companies, "label")}

      {renderTable(
  "Capital Account",
  flattenSections(detailedSections.capitalAccounts),
  companies,
  "name",
  true
)}
{renderTable(
  "Sundry Creditors",
  flattenSections(detailedSections.sundryCreditors),
  companies,
  "name",
  true
)}
{renderTable(
  "Sundry Payables",
  flattenSections(detailedSections.sundryPayables),
  companies,
  "name",
  true
)}
{renderTable(
  "Cash & Bank Balances",
  flattenSections(detailedSections.cashBankBalances),
  companies,
  "name",
  true
)}
{renderTable(
  "Sundry Debtors",
  flattenSections(detailedSections.sundryDebtors),
  companies,
  "name",
  true
)}
{renderTable(
  "Loans & Advances",
  flattenSections(detailedSections.loansAdvances),
  companies,
  "name",
  true
)}

    </div>
  );
}

