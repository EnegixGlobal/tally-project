import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
    "0% gst sales": 0,
    "3% gst sales": 1,
    "5% gst sales": 2,
    "12% gst sales": 3,
    "18% gst sales": 4,
    "28% gst sales": 5,
  };

  const [purchaseRows, setPurchaseRows] = useState<any[]>([]);
  const [salesRows, setSalesRows] = useState<any[]>([]);

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
  }, []);

  const buildTableData = (rows: any[], slabMap: any) => {
    const data: any = {};
    months.forEach(m => {
      data[m] = { intra: Array(6).fill(0), inter: Array(6).fill(0) };
    });

    rows.forEach(r => {
      const monthName = monthMap[r.month];
      if (!monthName) return;

      const idx = slabMap[r.ledgerName];
      if (idx === undefined) return;

      if (r.supplyType === "INTER") {
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

  const renderGSTTable = (title: string, tableData: any) => (
    <>
      <h2 className="text-xl font-semibold text-center my-6">{title}</h2>

      <div className="bg-white rounded-lg shadow border overflow-x-auto mb-10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}>
              <th rowSpan={2} className="border p-2">Month</th>
              <th colSpan={7} className="border p-2">INTRA STATE</th>
              <th colSpan={7} className="border p-2">INTER STATE</th>
            </tr>
            <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"}>
              {[...Array(2)].flatMap(() =>
                ["0%", "3%", "5%", "12%", "18%", "28%", "Total"]
              ).map((h, i) => (
                <th key={i} className="border p-2">{h}</th>
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
                  <td className="border p-2 text-right font-semibold">
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
                  <td key={i} className="border p-2 text-right">
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

      {renderGSTTable("Purchase Detail", purchaseTable)}
      {renderGSTTable("Sales Detail", salesTable)}
    </div>
  );
};

export default GSTAnalysis;
