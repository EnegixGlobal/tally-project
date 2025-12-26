import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";

const Payablesdetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const ledgerId = searchParams.get("ledgerId");
  const ledgerName = searchParams.get("ledgerName");

  const [purchase, setPurchase] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ledgerId) return;

    const fetchDetails = async () => {
      setLoading(true);

      const company_id = localStorage.getItem("company_id") || "";
      const owner_type = localStorage.getItem("supplier") || "";
      const owner_id =
        localStorage.getItem(
          owner_type === "employee" ? "employee_id" : "user_id"
        ) || "";

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/outstanding-receivables/${ledgerId}?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
      );

      const data = await res.json();

      setPurchase(Array.isArray(data.purchase) ? data.purchase : []);
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setLoading(false);
    };

    fetchDetails();
  }, [ledgerId]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n);

  const getTotals = (list: any[]) => ({
    subtotal: list.reduce((s, x) => s + Number(x.subtotal || 0), 0),
    total: list.reduce((s, x) => s + Number(x.total || 0), 0),
  });

  const purchaseTotals = getTotals(purchase);
  const salesTotals = getTotals(sales);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 pt-[56px] space-y-4 print-area">
      {/* 🔙 Back + Print */}
      <div className="flex justify-between items-center no-print">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">
          ← Back
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1 border rounded text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* 🔹 Header */}
      <div className="space-y-1">
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Payables Outstanding Details
        </h1>

        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-600">Party Name:</span>
          <span className="text-2xl font-semibold text-gray-900">
            {ledgerName}
          </span>
        </div>
      </div>

      {/* 🔹 TABLE */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Voucher Type</th>
              <th className="px-3 py-2 text-left">Voucher No</th>
              <th className="px-3 py-2 text-left">Party</th>
              <th className="px-3 py-2 text-left">Ref No</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {/* ================= PURCHASE ================= */}
            {purchase.length > 0 ? (
              purchase.map((tx, i) => (
                <tr key={`p-${i}`} className="border-t">
                  <td className="px-3 py-2">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-blue-600 font-medium">
                    purchase
                  </td>
                  <td className="px-3 py-2">{tx.number || "-"}</td>
                  <td className="px-3 py-2">{ledgerName}</td>
                  <td className="px-3 py-2">{tx.referenceNo || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(Number(tx.subtotal || 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(Number(tx.total || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td
                  colSpan={7}
                  className="px-3 py-4 text-center text-gray-400 italic"
                >
                  No Purchase data available
                </td>
              </tr>
            )}

            {purchase.length > 0 && (
              <tr className="font-semibold bg-gray-50 border-t">
                <td colSpan={5} className="px-3 py-2 text-right">
                  TOTAL (Purchase)
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(purchaseTotals.subtotal)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(purchaseTotals.total)}
                </td>
              </tr>
            )}

            {/* ================= SALES ================= */}
            {sales.length > 0 ? (
              sales.map((tx, i) => (
                <tr key={`s-${i}`} className="border-t">
                  <td className="px-3 py-2">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-green-600 font-medium">
                    sales
                  </td>
                  <td className="px-3 py-2">{tx.number || "-"}</td>
                  <td className="px-3 py-2">{ledgerName}</td>
                  <td className="px-3 py-2">{tx.referenceNo || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(Number(tx.subtotal || 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(Number(tx.total || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td
                  colSpan={7}
                  className="px-3 py-4 text-center text-gray-400 italic"
                >
                  No Sales data available
                </td>
              </tr>
            )}

            {sales.length > 0 && (
              <tr className="font-semibold bg-gray-50 border-t">
                <td colSpan={5} className="px-3 py-2 text-right">
                  TOTAL (Sales)
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(salesTotals.subtotal)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(salesTotals.total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payablesdetails;
