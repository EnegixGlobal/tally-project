import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

const GSTAnalysis: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
  ];

  const monthMap: any = {
    4: "Apr", 5: "May", 6: "Jun", 7: "Jul",
    8: "Aug", 9: "Sep", 10: "Oct",
    11: "Nov", 12: "Dec", 1: "Jan",
    2: "Feb", 3: "Mar",
  };

  const purchaseIndex: any = {
    "0% gst purchase": 0,
    "3% gst purchase": 1,
    "5% gst purchase": 2,
    "12% gst purchase": 3,
    "18% gst purchase": 4,
    "28% gst purchase": 5,
  };

  const salesIndex: any = {
    // GST (CGST+SGST)
    "0% gst sales": 0,
    "3% gst sales": 1,
    "5% gst sales": 2,
    "12% gst sales": 3,
    "18% gst sales": 4,
    "28% gst sales": 5,

    // IGST
    "0% igst sales": 0,
    "3% igst sales": 1,
    "5% igst sales": 2,
    "12% igst sales": 3,
    "18% igst sales": 4,
    "28% igst sales": 5,
  };


  const debitNoteIndex: any = {
    "0% debit notes": 0,
    "3% debit notes": 1,
    "5% debit notes": 2,
    "12% debit notes": 3,
    "18% debit notes": 4,
    "28% debit notes": 5,
  };

  const creditNoteIndex: any = {
    "0% credit notes": 0,
    "3% credit notes": 1,
    "5% credit notes": 2,
    "12% credit notes": 3,
    "18% credit notes": 4,
    "28% credit notes": 5,
  };



  const [purchaseRows, setPurchaseRows] = useState<any[]>([]);
  const [salesRows, setSalesRows] = useState<any[]>([]);
  const [debitNoteRows, setDebitNoteRows] = useState<any[]>([]);
  const [creditNoteRows, setCreditNoteRows] = useState<any[]>([]);



  useEffect(() => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id =
      localStorage.getItem(
        owner_type === "employee" ? "employee_id" : "user_id"
      ) || "";

    if (!company_id || !owner_type || !owner_id) return;

    fetch(
      `${import.meta.env.VITE_API_URL}/api/gst-assessment/purchase?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
    )
      .then(r => r.json())
      .then(j => j.success && setPurchaseRows(j.data || []));

    fetch(
      `${import.meta.env.VITE_API_URL}/api/gst-assessment/sales?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
    )
      .then(r => r.json())
      .then(j => j.success && setSalesRows(j.data || []));

    fetch(
      `${import.meta.env.VITE_API_URL}/api/gst-assessment/debit-notes?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
    )
      .then(r => r.json())
      .then(j => j.success && setDebitNoteRows(j.data || []));

    fetch(
      `${import.meta.env.VITE_API_URL}/api/gst-assessment/credit-notes?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
    )
      .then(r => r.json())
      .then(j => j.success && setCreditNoteRows(j.data || []));


  }, []);

  const buildTableData = (rows: any[], slabMap: any) => {
    const data: any = {};
    months.forEach(m => {
      data[m] = { intra: Array(6).fill(0), inter: Array(6).fill(0) };
    });

    rows.forEach(r => {
      const monthName = monthMap[r.month];
      if (!monthName) return;

      const key = r.ledgerName?.toLowerCase();
      const idx = slabMap[key];
      if (idx === undefined) return;

      // 🔥 NEW LOGIC
      if (key.includes("igst")) {
        data[monthName].inter[idx] += Number(r.total || 0);
      } else {
        data[monthName].intra[idx] += Number(r.total || 0);
      }
    });

    return data;
  };


  const purchaseTable = useMemo(
    () => buildTableData(purchaseRows, purchaseIndex),
    [purchaseRows]
  );

  const salesTable = useMemo(
    () => buildTableData(salesRows, salesIndex),
    [salesRows]
  );

  const debitNoteTable = useMemo(
    () => buildTableData(debitNoteRows, debitNoteIndex),
    [debitNoteRows]
  );

  const creditNoteTable = useMemo(
    () => buildTableData(creditNoteRows, creditNoteIndex),
    [creditNoteRows]
  );




  const handlePrint = (title: string, elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const win = window.open("", "", "width=800,height=600");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { font-family: sans-serif; -webkit-print-color-adjust: exact; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid black; padding: 4px; text-align: right; }
              th { background-color: #f3f4f6; text-align: center; }
              h2 { text-align: center; margin-bottom: 20px; }
            }
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f3f4f6; text-align: center; }
            h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const renderGSTTable = (title: string, tableData: any) => {
    const tableId = `print-${title.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <>
        <div className="flex items-center justify-center my-6 relative">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={() => handlePrint(title, tableId)}
            className="absolute right-0 p-2 text-gray-600 hover:text-blue-600"
            title="Print Table"
          >
            <Printer size={20} />
          </button>
        </div>

        <div id={tableId} className="bg-white rounded-lg shadow border overflow-x-auto mb-10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}>
                <th rowSpan={2} className="border p-2">Month</th>
                <th colSpan={7} className="border p-2  border-gray-600">INTRA STATE</th>


                <th colSpan={7} className="border p-2">INTER STATE</th>
              </tr>
              <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"}>
                {[
                  "0% gst", "3% gst", "5% gst", "12% gst", "18% gst", "28% gst", "Total",
                  "0% igst", "3% igst", "5% igst", "12% igst", "18% igst", "28% igst", "Total"
                ].map((h, i) => (
                  <th key={i} className={`border p-2 min-w-[100px] ${i === 6 ? " border-gray-600" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {months.map(m => {
                const intraTotal = tableData[m].intra.reduce((a: number, b: number) => a + b, 0);
                const interTotal = tableData[m].inter.reduce((a: number, b: number) => a + b, 0);

                return (
                  <tr key={m}>
                    <td className="border p-2 text-center">{m}</td>

                    {tableData[m].intra.map((v: number, i: number) => (
                      <td key={i} className="border p-2 text-right">
                        {v ? v.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </td>
                    ))}
                    <td className="border p-2 text-right font-semibold  border-gray-600">
                      {intraTotal ? intraTotal.toLocaleString("en-IN") : ""}
                    </td>

                    {tableData[m].inter.map((v: number, i: number) => (
                      <td key={i} className="border p-2 text-right">
                        {v ? v.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                      </td>
                    ))}
                    <td className="border p-2 text-right font-semibold">
                      {interTotal ? interTotal.toLocaleString("en-IN") : ""}
                    </td>
                  </tr>
                );
              })}

              {/* GRAND TOTAL */}
              <tr className="font-bold bg-gray-100">
                <td className="border p-2 text-center">Total</td>
                {Array(14).fill(0).map((_, i) => {
                  let sum = 0;
                  months.forEach(m => {
                    if (i < 7) {
                      sum += i < 6
                        ? tableData[m].intra[i]
                        : tableData[m].intra.reduce((a: number, b: number) => a + b, 0);
                    } else {
                      const idx = i - 7;
                      sum += idx < 6
                        ? tableData[m].inter[idx]
                        : tableData[m].inter.reduce((a: number, b: number) => a + b, 0);
                    }
                  });
                  return (
                    <td key={i} className={`border p-2 text-right ${i === 6 ? " border-gray-600" : ""}`}>
                      {sum ? sum.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderTaxBreakdownTable = (title: string, tableData: any) => {
    const tableId = `print-${title.replace(/\s+/g, "-").toLowerCase()}`;
    const taxRates = [0, 0.03, 0.05, 0.12, 0.18, 0.28]; // Mapped to indices 0-5

    return (
      <>
        <div className="flex items-center justify-center my-6 relative">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={() => handlePrint(title, tableId)}
            className="absolute right-0 p-2 text-gray-600 hover:text-blue-600"
            title="Print Table"
          >
            <Printer size={20} />
          </button>
        </div>

        <div id={tableId} className="bg-white rounded-lg shadow border overflow-x-auto mb-10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}>
                <th rowSpan={2} className="border p-2">Month</th>
                <th colSpan={12} className="border p-2 border-gray-600">
                  GST Tax Breakup (CGST + SGST)
                </th>

              </tr>
              <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"}>
                {/* CGST headers */}
                {[3, 5, 12, 18, 28].map(rate => (
                  <th key={`cgst-${rate}`} className="border p-2 min-w-[90px]">
                    {rate / 2}% CGST
                  </th>
                ))}
                <th className="border p-2 font-semibold border-gray-600">
                  CGST Total
                </th>

                {/* SGST headers */}
                {[3, 5, 12, 18, 28].map(rate => (
                  <th key={`sgst-${rate}`} className="border p-2 min-w-[90px]">
                    {rate / 2}% SGST
                  </th>
                ))}
                <th className="border p-2 font-semibold">
                  SGST Total
                </th>
              </tr>


            </thead>

            <tbody>
              {months.map((m) => {
                let cgstTotal = 0;
                let sgstTotal = 0;

                return (
                  <React.Fragment key={m}>
                    <tr>
                      <td className="border p-2 text-center">{m}</td>

                      {/* ===== CGST ===== */}
                      {[1, 2, 3, 4, 5].map(idx => {
                        const cgst = tableData[m].intra[idx] / 2;
                        const sgst = tableData[m].intra[idx] / 2;

                        cgstTotal += cgst;

                        return (
                          <td key={`cgst-${idx}`} className="border p-2 text-right">
                            {cgst ? cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                          </td>
                        );
                      })}

                      <td className="border p-2 text-right font-semibold border-gray-600">
                        {cgstTotal ? cgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                      </td>

                      {/* ===== SGST ===== */}
                      {[1, 2, 3, 4, 5].map(idx => {
                        const cgst = tableData[m].intra[idx] / 2;
                        const sgst = tableData[m].intra[idx] / 2;

                        sgstTotal += sgst;

                        return (
                          <td key={`sgst-${idx}`} className="border p-2 text-right">
                            {sgst ? sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                          </td>
                        );
                      })}

                      <td className="border p-2 text-right font-semibold">
                        {sgstTotal ? sgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                    </tr>

                    {/* 🔹 HORIZONTAL DIVIDER LINE */}
                    <tr>
                      <td colSpan={12} className="border-t-2 border-gray-400"></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* ===== GRAND TOTAL ===== */}
              <tr className="font-bold bg-gray-100">
                <td className="border p-2 text-center">Total</td>

                {[1, 2, 3, 4, 5].map(idx => {
                  let total = 0;
                  months.forEach(m => {
                    total += (tableData[m].intra[idx] || 0) * taxRates[idx] / 2;
                  });
                  return (
                    <td key={`cgst-t-${idx}`} className="border p-2 text-right">
                      {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  );
                })}

                <td className="border p-2 text-right font-semibold border-gray-600">
                  {months.reduce((acc, m) =>
                    acc + [1, 2, 3, 4, 5].reduce(
                      (s, i) => s + (tableData[m].intra[i] || 0) * taxRates[i] / 2, 0
                    ), 0
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>

                {[1, 2, 3, 4, 5].map(idx => {
                  let total = 0;
                  months.forEach(m => {
                    total += (tableData[m].intra[idx] || 0) * taxRates[idx] / 2;
                  });
                  return (
                    <td key={`sgst-t-${idx}`} className="border p-2 text-right">
                      {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  );
                })}

                <td className="border p-2 text-right font-semibold">
                  {months.reduce((acc, m) =>
                    acc + [1, 2, 3, 4, 5].reduce(
                      (s, i) => s + (tableData[m].intra[i] || 0) * taxRates[i] / 2, 0
                    ), 0
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>



          </table>
        </div>
      </>
    );
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold">
          GST Analysis
        </h1>
      </div>

      <hr />

      {renderGSTTable("Purchase Detail", purchaseTable)}
      {renderTaxBreakdownTable("Purchase Tax Detail", purchaseTable)}

      {renderGSTTable("Debit Notes Detail", debitNoteTable)}
      {renderTaxBreakdownTable("Debit Notes Tax Detail", debitNoteTable)}

      {renderGSTTable("Credit Notes Detail", creditNoteTable)}
      {renderTaxBreakdownTable("Credit Notes Tax Detail", creditNoteTable)}

      {renderGSTTable("Sales Detail", salesTable)}
      {renderTaxBreakdownTable("Sales Tax Detail", salesTable)}

    </div>
  );
};

export default GSTAnalysis;
