import React, { useEffect, useState, useMemo } from "react";

const Gstr2B2b = () => {
  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [saleData, setSaleData] = useState<any[]>([]);
  const [partyIds, setPartyIds] = useState<number[]>([]);

  const [ledger, setLedger] = useState<any[]>([]);
  const [matchedLedgers, setMatchedLedgers] = useState<any[]>([]);

  const [matchedSales, setMatchedSales] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const loadSalesVouchers = async () => {
      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const json = await res.json();
        console.log("salesvoucher", json);
        const vouchers = json?.data || json || [];

        const allPartyIds = vouchers
          .map((v: any) => v.partyId)
          .filter((id: any) => id !== null && id !== undefined);

        setSaleData(vouchers);
        setPartyIds(allPartyIds);
      } catch (err) {
        console.error("Failed to fetch sales vouchers:", err);
        setSaleData([]);
        setPartyIds([]);
      }
    };

    loadSalesVouchers();
  }, [companyId, ownerType, ownerId]);

  // ledger get

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const ledgerRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();
        console.log("ledgerdata", ledgerData);
        setLedger(ledgerData || []);
      } catch (err) {
        console.error("Ledger fetch failed:", err);
        setLedger([]);
      }
    };

    fetchLedger();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (!ledger.length || !saleData.length) return;

    // sirf GST wale ledgers
    const gstLedgers = ledger.filter(
      (l) => l.gstNumber && String(l.gstNumber).trim() !== ""
    );

    setMatchedLedgers(gstLedgers);

    // UI ke liye sales ko ledger se attach kar rahe
    const uiSales = saleData
      .map((s) => {
        const l = gstLedgers.find((gl) => gl.id === s.partyId);
        if (!l) return null;

        return {
          ...s,
          ledger: l,
        };
      })
      .filter(Boolean);

    setMatchedSales(uiSales);
  }, [ledger, saleData]);

  // 🔹 Ledger quick lookup (id → ledger)
  const ledgerMap = useMemo(() => {
    const map = new Map<number, any>();

    ledger.forEach((l: any) => {
      if (l.gstNumber && String(l.gstNumber).trim() !== "") {
        map.set(l.id, l); // id se map
      }
    });

    return map;
  }, [ledger]);

  //gst rate calculate function
  const getTaxRate = (taxAmount: any, taxableAmount: any) => {
    const tax = Number(taxAmount || 0);
    const base = Number(taxableAmount || 0);

    if (!base || !tax) return "0%";

    const rate = (tax / base) * 100;

    return `${Math.round(rate)}%`;
  };

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      <div className={`mb-6 rounded-lg `}>
        {/* Section Header */}
        <div
          className={`p-3  bg-blue-800 border-gray-300 text-white flex items-center justify-between `}
        >
          {/* LEFT SIDE */}
          <div>
            <h3 className="text-lg font-bold">4A - B2B Supplies</h3>
            <p className="text-sm opacity-90">
              Details of Outward Supplies made to Registered Persons
            </p>
          </div>

          {/* RIGHT SIDE – VIEW MORE */}
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
          >
            Download 
          </button>
        </div>

        {/* B2B Table */}
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border  border-gray-300">
              <thead className="bg-gray-300 font-bold text-gray-800">
                <tr>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    GSTIN of Recipient
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    Receiver Name
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    Invoice Number
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    Invoice Date
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    Invoice Value
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    Place of Supply
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                    Reverse Charge
                  </th>

                  <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                    E-Commerce GSTIN
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    Taxable Value
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                    IGST Rate
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    IGST Amount
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                    CGST Rate
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    CGST Amount
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                    SGST Rate
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    SGST Amount
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                    Cess Rate
                  </th>
                  <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                    Cess Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {matchedSales.map((row: any, index: number) => {
                  const ledger = row.ledger;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2 text-xs">
                        {ledger?.gstNumber || "-"}
                      </td>

                      <td className="border p-2 text-xs">
                        {ledger?.name || "-"}
                      </td>

                      <td className="border p-2 text-xs">{row.number}</td>

                      <td className="border p-2 text-xs">
                        {new Date(row.date).toLocaleDateString("en-GB")}
                      </td>

                      <td className="border p-2 text-xs text-right">
                        ₹{Number(row.total).toFixed(2)}
                      </td>

                      <td className="border p-2 text-xs">
                        {ledger?.state }
                      </td>

                      <td className="border p-2 text-xs text-center">No</td>

                      <td className="border p-2 text-xs"> </td>

                      <td className="border p-2 text-xs text-right">
                        ₹{Number(row.subtotal).toFixed(2)}
                      </td>

                      <td className="border p-2 text-xs text-center">
                        {getTaxRate(row.igstTotal, row.subtotal)}
                      </td>

                      <td className="border p-2 text-xs text-right">
                        ₹{Number(row.igstTotal).toFixed(2)}
                      </td>

                      <td className="border p-2 text-xs text-center">
                        {getTaxRate(row.cgstTotal, row.subtotal)}
                      </td>

                      <td className="border p-2 text-xs text-right">
                        ₹{Number(row.cgstTotal).toFixed(2)}
                      </td>

                      <td className="border p-2 text-xs text-center">
                        {getTaxRate(row.sgstTotal, row.subtotal)}
                      </td>

                      <td className="border p-2 text-xs text-right">
                        ₹{Number(row.sgstTotal).toFixed(2)}
                      </td>

                      <td className="border p-2 text-xs text-center">0%</td>

                      <td className="border p-2 text-xs text-right">₹0.00</td>
                    </tr>
                  );
                })}

                {/* TOTAL ROW */}
                <tr className="font-bold bg-gray-300">
                  {/* LABEL */}
                  <td colSpan={8} className="border p-2 text-xs text-right">
                    Total:
                  </td>

                  {/* TAXABLE VALUE */}
                  <td className="border p-2 text-xs text-right">
                    ₹
                    {matchedSales
                      .reduce((a, b) => a + Number(b.subtotal || 0), 0)
                      .toFixed(2)}
                  </td>

                  {/* IGST RATE (blank) */}
                  <td className="border p-2"></td>

                  {/* IGST AMOUNT */}
                  <td className="border p-2 text-xs text-right">
                    ₹
                    {matchedSales
                      .reduce((a, b) => a + Number(b.igstTotal || 0), 0)
                      .toFixed(2)}
                  </td>

                  {/* CGST RATE (blank) */}
                  <td className="border p-2"></td>

                  {/* CGST AMOUNT */}
                  <td className="border p-2 text-xs text-right">
                    ₹
                    {matchedSales
                      .reduce((a, b) => a + Number(b.cgstTotal || 0), 0)
                      .toFixed(2)}
                  </td>

                  {/* SGST RATE (blank) */}
                  <td className="border p-2"></td>

                  {/* SGST AMOUNT */}
                  <td className="border p-2 text-xs text-right">
                    ₹
                    {matchedSales
                      .reduce((a, b) => a + Number(b.sgstTotal || 0), 0)
                      .toFixed(2)}
                  </td>

                  {/* CESS RATE */}
                  <td className="border p-2"></td>

                  {/* CESS AMOUNT */}
                  <td className="border p-2 text-xs text-right">₹0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gstr2B2b;
