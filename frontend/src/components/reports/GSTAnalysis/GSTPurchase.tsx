import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const GSTPurchase: React.FC = () => {

  const navigate = useNavigate();

  const company_id = localStorage.getItem("company_id");
  const owner_type = localStorage.getItem("supplier");
  const owner_id = localStorage.getItem("employee_id");

  // Financial Year Months
  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
  ];

  // Purchase Ledgers
  const [intraPurchaseLedgers, setIntraPurchaseLedgers] = useState<any[]>([]);
  const [interPurchaseLedgers, setInterPurchaseLedgers] = useState<any[]>([]);
  const [igstLedgers, setIgstLedgers] = useState<any[]>([]);
  const [cgstLedgers, setCgstLedgers] = useState<any[]>([]);
  const [sgstLedgers, setSgstLedgers] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>({});


  // ================================
  // Fetch Purchase Ledgers
  // ================================
  useEffect(() => {

    if (!company_id || !owner_type || !owner_id) return;

    const fetchPurchaseLedgers = async () => {
      try {

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/gst-assessment/purchase?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );

        const data = await res.json();

        if (data.success) {
          setIntraPurchaseLedgers(data.data.ledgers.intraPurchase || []);
          setInterPurchaseLedgers(data.data.ledgers.interPurchase || []);
          setIgstLedgers(data.data.ledgers.igst || []);
          setCgstLedgers(data.data.ledgers.cgst || []);
          setSgstLedgers(data.data.ledgers.sgst || []);
          setMonthlyData(data.data.monthlyData || {});
        }

      } catch (err) {
        console.error("Purchase Ledger Fetch Error:", err);
      }
    };

    fetchPurchaseLedgers();

  }, [company_id, owner_type, owner_id]);
  return (
    <>
   

        {/* ================= Purchase Table ================= */}

        <div className="mt-6 overflow-x-auto shadow-lg rounded-lg bg-white">

          <table className="w-full border-collapse text-center text-sm">

            {/* ================= HEADER ================= */}

            <thead className="bg-gray-800 text-white">

              {/* Row 1 */}
              <tr>

                {/* Month */}
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-3 py-2"
                >
                  Month
                </th>


                {/* Intra State Purchase Group */}
                <th
                  colSpan={intraPurchaseLedgers.length || 1}
                  className="border border-gray-600 px-3 py-2"
                >
                  Purchase (Intra State)
                </th>

                {/* Inter State Purchase Group */}
                <th
                  colSpan={interPurchaseLedgers.length || 1}
                  className="border border-gray-600 px-3 py-2"
                >
                  Purchase (Inter State)
                </th>


                {/* Total Purchase */}
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-3 py-2"
                >
                  Total
                </th>

              </tr>


              {/* Row 2 */}
              <tr>

                {/* Intra Purchase Ledgers */}
                {intraPurchaseLedgers.length > 0 ? (
                  intraPurchaseLedgers.map((ledger) => (
                    <th
                      key={ledger.id}
                      className="border border-gray-600 px-3 py-2 whitespace-nowrap"
                    >
                      {ledger.name}
                    </th>
                  ))
                ) : (
                  <th className="border border-gray-600 px-3 py-2">-</th>
                )}

                {/* Inter Purchase Ledgers */}
                {interPurchaseLedgers.length > 0 ? (
                  interPurchaseLedgers.map((ledger) => (
                    <th
                      key={ledger.id}
                      className="border border-gray-600 px-3 py-2 whitespace-nowrap"
                    >
                      {ledger.name}
                    </th>
                  ))
                ) : (
                  <th className="border border-gray-600 px-3 py-2">-</th>
                )}

              </tr>
            </thead>
            {/* ================= BODY ================= */}

            <tbody>

              {months.map((month) => {
                const mData = monthlyData[month] || {};
                const intraData = mData.intraPurchase || {};
                const interData = mData.interPurchase || {};

                return (
                  <tr key={month} className="odd:bg-white even:bg-gray-50 hover:bg-gray-200 transition-colors">

                    {/* Month */}
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {month}
                    </td>


                    {/* Intra Purchase Columns */}
                    {intraPurchaseLedgers.length > 0 ? (
                      intraPurchaseLedgers.map((ledger) => {
                        const val = intraData[ledger.id] ? Number(intraData[ledger.id]) : 0;
                        return (
                          <td
                            key={ledger.id}
                            className="border border-gray-300 px-3 py-2"
                          >
                            {val ? val.toFixed(2) : ""}
                          </td>
                        )
                      })
                    ) : (
                      <td className="border border-gray-300 px-3 py-2">-</td>
                    )}

                    {/* Inter Purchase Columns */}
                    {interPurchaseLedgers.length > 0 ? (
                      interPurchaseLedgers.map((ledger) => {
                        const val = interData[ledger.id] ? Number(interData[ledger.id]) : 0;
                        return (
                          <td
                            key={ledger.id}
                            className="border border-gray-300 px-3 py-2"
                          >
                            {val ? val.toFixed(2) : ""}
                          </td>
                        )
                      })
                    ) : (
                      <td className="border border-gray-300 px-3 py-2">-</td>
                    )}


                    {/* Total Purchase (Intra + Inter) */}
                    <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">
                      {(() => {
                        const total = (Number(mData.totalIntraPurchase) || 0) + (Number(mData.totalInterPurchase) || 0);
                        return total ? total.toFixed(2) : "";
                      })()}
                    </td>

                  </tr>
                );
              })}

            </tbody>

            {/* ================= FOOTER ================= */}
            <tfoot className="bg-gray-800 text-white font-bold">
              <tr>
                <td className="border border-gray-600 px-3 py-2">Grand Total</td>

                {/* Intra Purchase Vertical Totals */}
                {intraPurchaseLedgers.length > 0 ? (
                  intraPurchaseLedgers.map((ledger) => {
                    const total = months.reduce((acc, month) => {
                      const val = monthlyData[month]?.intraPurchase?.[ledger.id] || 0;
                      return acc + Number(val);
                    }, 0);
                    return (
                      <td key={ledger.id} className="border border-gray-600 px-3 py-2">
                        {total ? total.toFixed(2) : ""}
                      </td>
                    );
                  })
                ) : (
                  <td className="border border-gray-600 px-3 py-2">-</td>
                )}

                {/* Inter Purchase Vertical Totals */}
                {interPurchaseLedgers.length > 0 ? (
                  interPurchaseLedgers.map((ledger) => {
                    const total = months.reduce((acc, month) => {
                      const val = monthlyData[month]?.interPurchase?.[ledger.id] || 0;
                      return acc + Number(val);
                    }, 0);
                    return (
                      <td key={ledger.id} className="border border-gray-600 px-3 py-2">
                        {total ? total.toFixed(2) : ""}
                      </td>
                    );
                  })
                ) : (
                  <td className="border border-gray-600 px-3 py-2">-</td>
                )}

                {/* Total Purchase Grand Total */}
                <td className="border border-gray-600 px-3 py-2">
                  {(() => {
                    const total = months.reduce((acc, month) => {
                      const mData = monthlyData[month] || {};
                      const monthTotal = (Number(mData.totalIntraPurchase) || 0) + (Number(mData.totalInterPurchase) || 0);
                      return acc + monthTotal;
                    }, 0);
                    return total ? total.toFixed(2) : "";
                  })()}
                </td>

              </tr>
            </tfoot>


          </table>
        </div>




        {/* ================= Purchase Tax Detail ================= */}

        <div className="mt-10 overflow-x-auto shadow-lg rounded-lg bg-white">

          <h2 className="text-xl font-semibold p-4 text-center bg-gray-50 border-b">
            Purchase Tax Detail
          </h2>

          <table className="w-full border-collapse text-center text-sm">

            {/* ================= HEADER ================= */}

            <thead className="bg-gray-800 text-white">

              {/* Row 1 */}
              <tr>

                {/* Month */}
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-3 py-2"
                >
                  Month
                </th>


                {/* CGST Group */}
                <th
                  colSpan={cgstLedgers.length + 1 || 1}
                  className="border border-gray-600 px-3 py-2"
                >
                  CGST
                </th>


                {/* SGST Group */}
                <th
                  colSpan={sgstLedgers.length + 1 || 1}
                  className="border border-gray-600 px-3 py-2"
                >
                  SGST
                </th>



              </tr>


              {/* Row 2 */}
              <tr>

                {/* CGST Ledgers */}
                {cgstLedgers.length > 0 ? (
                  cgstLedgers.map((ledger) => (
                    <th
                      key={ledger.id}
                      className="border border-gray-600 px-3 py-2 whitespace-nowrap"
                    >
                      {ledger.name}
                    </th>
                  ))
                ) : (
                  <th className="border border-gray-600 px-3 py-2">-</th>
                )}


                {/* CGST Total */}
                <th className="border border-gray-600 px-3 py-2 font-semibold">
                  Total
                </th>


                {/* SGST Ledgers */}
                {sgstLedgers.length > 0 ? (
                  sgstLedgers.map((ledger) => (
                    <th
                      key={ledger.id}
                      className="border border-gray-600 px-3 py-2 whitespace-nowrap"
                    >
                      {ledger.name}
                    </th>
                  ))
                ) : (
                  <th className="border border-gray-600 px-3 py-2">-</th>
                )}


                {/* SGST Total */}
                <th className="border border-gray-600 px-3 py-2 font-semibold">
                  Total
                </th>



              </tr>

            </thead>


            {/* ================= BODY ================= */}

            <tbody>

              {months.map((month) => {
                const mData = monthlyData[month] || {};
                const cData = mData.cgst || {};
                const sData = mData.sgst || {};
                return (
                  <tr key={month} className="odd:bg-white even:bg-gray-50 hover:bg-gray-200 transition-colors">

                    {/* Month */}
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {month}
                    </td>
                    {/* CGST Columns */}
                    {cgstLedgers.length > 0 ? (
                      cgstLedgers.map((ledger) => {
                        const val = cData[ledger.id] ? Number(cData[ledger.id]) : 0;
                        return (
                          <td
                            key={ledger.id}
                            className="border border-gray-300 px-3 py-2"
                          >
                            {val ? val.toFixed(2) : ""}
                          </td>
                        )
                      })
                    ) : (
                      <td className="border border-gray-300 px-3 py-2">-</td>
                    )}
                    {/* CGST Total */}
                    <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">
                      {mData.totalCGST ? Number(mData.totalCGST).toFixed(2) : ""}
                    </td>
                    {/* SGST Columns */}
                    {sgstLedgers.length > 0 ? (
                      sgstLedgers.map((ledger) => {
                        const val = sData[ledger.id] ? Number(sData[ledger.id]) : 0;
                        return (
                          <td
                            key={ledger.id}
                            className="border border-gray-300 px-3 py-2"
                          >
                            {val ? val.toFixed(2) : ""}
                          </td>
                        )
                      })
                    ) : (
                      <td className="border border-gray-300 px-3 py-2">-</td>
                    )}
                    {/* SGST Total */}
                    <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">
                      {mData.totalSGST ? Number(mData.totalSGST).toFixed(2) : ""}
                    </td>


                  </tr>
                )
              })}
            </tbody>

            {/* ================= FOOTER ================= */}
            <tfoot className="bg-gray-800 text-white font-bold">
              <tr>
                <td className="border border-gray-600 px-3 py-2">Grand Total</td>

                {/* CGST Vertical Totals */}
                {cgstLedgers.length > 0 ? (
                  cgstLedgers.map((ledger) => {
                    const total = months.reduce((acc, month) => {
                      const val = monthlyData[month]?.cgst?.[ledger.id] || 0;
                      return acc + Number(val);
                    }, 0);
                    return (
                      <td key={ledger.id} className="border border-gray-600 px-3 py-2">
                        {total ? total.toFixed(2) : ""}
                      </td>
                    );
                  })
                ) : (
                  <td className="border border-gray-600 px-3 py-2">-</td>
                )}

                {/* Total CGST Grand Total */}
                <td className="border border-gray-600 px-3 py-2">
                  {(() => {
                    const total = months.reduce((acc, month) => acc + (monthlyData[month]?.totalCGST || 0), 0);
                    return total ? total.toFixed(2) : "";
                  })()}
                </td>


                {/* SGST Vertical Totals */}
                {sgstLedgers.length > 0 ? (
                  sgstLedgers.map((ledger) => {
                    const total = months.reduce((acc, month) => {
                      const val = monthlyData[month]?.sgst?.[ledger.id] || 0;
                      return acc + Number(val);
                    }, 0);
                    return (
                      <td key={ledger.id} className="border border-gray-600 px-3 py-2">
                        {total ? total.toFixed(2) : ""}
                      </td>
                    );
                  })
                ) : (
                  <td className="border border-gray-600 px-3 py-2">-</td>
                )}

                {/* Total SGST Grand Total */}
                <td className="border border-gray-600 px-3 py-2">
                  {(() => {
                    const total = months.reduce((acc, month) => acc + (monthlyData[month]?.totalSGST || 0), 0);
                    return total ? total.toFixed(2) : "";
                  })()}
                </td>



              </tr>
            </tfoot>

          </table>

        </div>

        {/* ================= IGST Detail ================= */}

        <div className="mt-10 mb-10 overflow-x-auto shadow-lg rounded-lg bg-white">

          <h2 className="text-xl font-semibold p-4 text-center bg-gray-50 border-b">
            IGST Detail
          </h2>

          <table className="w-full border-collapse text-center text-sm">

            {/* ================= HEADER ================= */}

            <thead className="bg-gray-800 text-white">

              {/* Row 1 */}
              <tr>

                {/* Month */}
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-3 py-2"
                >
                  Month
                </th>


                {/* IGST Group */}
                <th
                  colSpan={igstLedgers.length || 1}
                  className="border border-gray-600 px-3 py-2"
                >
                  IGST
                </th>


                {/* Total IGST */}
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-3 py-2"
                >
                  Total
                </th>

              </tr>


              {/* Row 2 */}
              <tr>

                {/* IGST Ledgers */}
                {igstLedgers.length > 0 ? (
                  igstLedgers.map((ledger) => (
                    <th
                      key={ledger.id}
                      className="border border-gray-600 px-3 py-2 whitespace-nowrap"
                    >
                      {ledger.name}
                    </th>
                  ))
                ) : (
                  <th className="border border-gray-600 px-3 py-2">-</th>
                )}

              </tr>
            </thead>
            {/* ================= BODY ================= */}

            <tbody>

              {months.map((month) => {
                const mData = monthlyData[month] || {};
                const iData = mData.igst || {};

                return (
                  <tr key={month} className="odd:bg-white even:bg-gray-50 hover:bg-gray-200 transition-colors">

                    {/* Month */}
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {month}
                    </td>


                    {/* IGST Columns */}
                    {igstLedgers.length > 0 ? (
                      igstLedgers.map((ledger) => {
                        const val = iData[ledger.id] ? Number(iData[ledger.id]) : 0;
                        return (
                          <td
                            key={ledger.id}
                            className="border border-gray-300 px-3 py-2"
                          >
                            {val ? val.toFixed(2) : ""}
                          </td>
                        )
                      })
                    ) : (
                      <td className="border border-gray-300 px-3 py-2">-</td>
                    )}


                    {/* Total IGST */}
                    <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">
                      {mData.totalIGST ? Number(mData.totalIGST).toFixed(2) : ""}
                    </td>

                  </tr>
                );
              })}

            </tbody>

            {/* ================= FOOTER ================= */}
            <tfoot className="bg-gray-800 text-white font-bold">
              <tr>
                <td className="border border-gray-600 px-3 py-2">Grand Total</td>

                {/* IGST Vertical Totals */}
                {igstLedgers.length > 0 ? (
                  igstLedgers.map((ledger) => {
                    const total = months.reduce((acc, month) => {
                      const val = monthlyData[month]?.igst?.[ledger.id] || 0;
                      return acc + Number(val);
                    }, 0);
                    return (
                      <td key={ledger.id} className="border border-gray-600 px-3 py-2">
                        {total ? total.toFixed(2) : ""}
                      </td>
                    );
                  })
                ) : (
                  <td className="border border-gray-600 px-3 py-2">-</td>
                )}

                {/* Total IGST Grand Total */}
                <td className="border border-gray-600 px-3 py-2">
                  {(() => {
                    const total = months.reduce((acc, month) => acc + (monthlyData[month]?.totalIGST || 0), 0);
                    return total ? total.toFixed(2) : "";
                  })()}
                </td>

              </tr>
            </tfoot>

          </table>
        </div>
      

    </>
  );
};

export default GSTPurchase;
