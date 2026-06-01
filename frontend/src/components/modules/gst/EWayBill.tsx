import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { ArrowLeft, X, Settings } from "lucide-react";


// state list
const states = [
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "22", name: "Chhattisgarh" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
  { code: "07", name: "Delhi" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "38", name: "Ladakh" },
];


// Main E-Way Bill component
const EWayBill: React.FC = () => {
  const navigate = useNavigate()

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";


  // supplier form data
  const companyInfo = JSON.parse(
    localStorage.getItem("companyInfo") || "{}"
  );


  // state code genrate
  const extractStateCode = (stateValue: string) => {
    if (!stateValue) return "";

    // Case 1: Mizoram(15)
    const match = stateValue.match(/\((\d+)\)/);
    if (match) return match[1];

    // Case 2: Already code "15"
    if (/^\d+$/.test(stateValue)) return stateValue;

    // Case 3: State name "Jharkhand"
    const found = states.find(
      (s) => s.name.toLowerCase() === stateValue.toLowerCase()
    );
    return found ? found.code : "";
  };


  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showEWayForm, setShowEWayForm] = useState(false);
  const [generateEWay, setGenerateEWay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [combineView, setCombineView] = useState(false);
  const [showJSONPreview, setShowJSONPreview] = useState(false);
  const [jsonPreviewContent, setJsonPreviewContent] = useState("");



  const [supplier, setSupplier] = useState({
    gstin: "",
    legalName: "",
    tradeName: "",
    address1: "",
    address2: "",
    location: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    // 1. Initial populate from localStorage (instant UI response)
    if (companyInfo && Object.keys(companyInfo).length > 0) {
      setSupplier({
        gstin: companyInfo.gst_number || companyInfo.gstNumber || companyInfo.gstin || "",
        legalName: companyInfo.name || companyInfo.legalName || "",
        tradeName: companyInfo.name || companyInfo.tradeName || "",
        address1: companyInfo.address || companyInfo.address1 || "",
        address2: "",
        location: companyInfo.address || companyInfo.location || "",
        state: extractStateCode(companyInfo.state || ""),
        pincode: companyInfo.pin || companyInfo.pin_code || companyInfo.pincode || "",
        phone: companyInfo.phone_number || companyInfo.phoneNumber || companyInfo.phone || "",
        email: companyInfo.email || "",
      });
    }

    // 2. Fresh fetch from backend to guarantee latest, correct details
    if (!companyId) return;
    const fetchCompanyData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company/company/${companyId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSupplier(prev => ({
              ...prev,
              gstin: data.gstNumber || data.gst_number || data.gstin || prev.gstin,
              legalName: data.name || data.legalName || prev.legalName,
              tradeName: data.name || data.tradeName || prev.tradeName,
              address1: data.address || data.address1 || prev.address1,
              location: data.address || data.location || prev.location,
              state: extractStateCode(data.state || prev.state),
              pincode: data.pin || data.pin_code || data.pincode || prev.pincode,
              phone: data.phoneNumber || data.phone_number || data.phone || prev.phone,
              email: data.email || prev.email,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching company details in EWayBill:", err);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  // RecRecipient Masters
  const [recipient, setRecipient] = useState({
    gstin: "",
    legalName: "",
    tradeName: "",
    address1: "",
    address2: "",
    location: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });



  useEffect(() => {
    if (!selectedSale) return;

    setRecipient({
      gstin: selectedSale.gst_number || "",
      legalName: selectedSale.partyName || "",
      tradeName: selectedSale.partyName || "",
      address1: selectedSale.address || "",
      address2: "",
      location: selectedSale.district || "",
      state: extractStateCode(selectedSale.state),
      pincode: selectedSale.pincode || "",
      phone: selectedSale.phone || "",
      email: selectedSale.email || "",
    });
  }, [selectedSale]);

  //product data
  const [product, setProduct] = useState({
    description: "",
    isService: "",
    hsn: "",
    unit: "",
    unitPrice: 0,
    gst: "",
    qty: 0,
  });


  useEffect(() => {
    if (!selectedSale) return;

    // Calculate actual GST rate percentage
    const igstVal = Number(selectedSale.igstTotal || 0);
    const cgstVal = Number(selectedSale.cgstTotal || 0);
    const sgstVal = Number(selectedSale.sgstTotal || 0);
    const subtotalVal = Number(selectedSale.subtotal || 0);

    let calculatedGstRate = 0;
    if (subtotalVal > 0) {
      if (igstVal > 0) {
        calculatedGstRate = Math.round((igstVal / subtotalVal) * 100);
      } else if (cgstVal > 0 || sgstVal > 0) {
        calculatedGstRate = Math.round(((cgstVal + sgstVal) / subtotalVal) * 100);
      }
    }

    setProduct({
      description: selectedSale.itemName || "",
      isService: "No",

      hsn: selectedSale.hsnCode || "",
      unit: "PCS",

      // qtyChange is negative in DB → abs
      qty: Math.abs(Number(selectedSale.qtyChange || 0)),

      unitPrice: Number(selectedSale.rate || 0),

      gst: calculatedGstRate ? String(calculatedGstRate) : "18", // fallback to standard 18% if no tax specified
    });

  }, [selectedSale]);

  // transport data
  const [transport, setTransport] = useState({
    mode: "",
    vehicleType: "",
    vehicleNo: "",
    transporterId: "",
    transporterName: "",
    distance: "",
  });

  // transport data
  useEffect(() => {
    if (!selectedSale) return;

    setTransport({
      mode: "Road",
      vehicleType: "Regular",

      // MAP FROM DISPATCH
      vehicleNo: selectedSale.destination || "",
      transporterId: selectedSale.dispatchDocNo || "",
      transporterName: selectedSale.dispatchThrough || "",
      distance: selectedSale.approxDistance || "",
    });

  }, [selectedSale]);

  // shipping data
  const [shipping, setShipping] = useState({
    legalName: "",
    gstin: "",
    address: "",
    place: "",
    pincode: "",
    state: "",
  });

  useEffect(() => {
    if (!selectedSale) return;

    // Initialize shipping with recipient details by default
    setShipping({
      legalName: selectedSale.partyName || "",
      gstin: selectedSale.gst_number || "",
      address: selectedSale.address || "",
      place: selectedSale.district || "",
      pincode: selectedSale.pincode || "",
      state: extractStateCode(selectedSale.state),
    });

  }, [selectedSale]);







  const handleGenerateEWay = (row: any) => {
    setSelectedSale(row);
    setShowEWayForm(true);
  };


  const [salesData, setSalesData] = useState<any>([])

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ewailbill?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const json = await res.json();

        if (res.ok) {
          setSalesData(json.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN");

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });



  // json genrate
  // Generate JSON content and show in preview modal
  const handleGenerateJSONPreview = () => {
    // Utility to clean up newlines, extra spaces, carriage returns
    const cleanStr = (str: string) => {
      if (!str) return "";
      return str.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    };

    // Date formatting (DD/MM/YYYY)
    const formatDateGB = (dateStr: string) => {
      if (!dateStr) return new Date().toLocaleDateString("en-GB");
      const dateObj = new Date(dateStr);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const assVal = Number(product.unitPrice || 0) * Number(product.qty || 0);
    const gstRt = Number(product.gst || 0);
    const isInterstate = selectedSale?.igstTotal > 0;
    const igstVal = isInterstate ? Number((assVal * (gstRt / 100)).toFixed(2)) : 0;
    const cgstVal = !isInterstate ? Number((assVal * ((gstRt / 2) / 100)).toFixed(2)) : 0;
    const sgstVal = !isInterstate ? Number((assVal * ((gstRt / 2) / 100)).toFixed(2)) : 0;
    
    // Original discount total from sales voucher
    const discountVal = Number(selectedSale?.discountTotal || 0);
    
    // TotInvVal = AssVal + IgstVal + CgstVal + SgstVal - Discount
    const totInvVal = Number((assVal + igstVal + cgstVal + sgstVal - discountVal).toFixed(2));
    
    // Item TotVal (before overall discount) = AssVal + IgstVal + CgstVal + SgstVal
    const totItemVal = Number((assVal + igstVal + cgstVal + sgstVal).toFixed(2));

    const ewayBillJSON = [
      {
        Version: "1.1",

        TranDtls: {
          TaxSch: "GST",
          SupTyp: "B2B",
          IgstOnIntra: "N",
          RegRev: "N",
          EcmGstin: null,
        },

        DocDtls: {
          Typ: "INV",
          No: selectedSale?.number || "",
          Dt: formatDateGB(selectedSale?.date),
        },

        SellerDtls: {
          Gstin: cleanStr(supplier.gstin),
          LglNm: cleanStr(supplier.legalName),
          Addr1: cleanStr(supplier.address1),
          Addr2: cleanStr(supplier.address2 || ""),
          Loc: cleanStr(supplier.location),
          Pin: Number(supplier.pincode || 0),
          Stcd: cleanStr(supplier.state || ""),
          Ph: cleanStr(supplier.phone) || null,
          Em: cleanStr(supplier.email) || null,
        },

        BuyerDtls: {
          Gstin: cleanStr(recipient.gstin),
          LglNm: cleanStr(recipient.legalName),
          Addr1: cleanStr(recipient.address1),
          Addr2: cleanStr(recipient.address2 || ""),
          Loc: cleanStr(recipient.location),
          Pin: Number(recipient.pincode || 0),
          Pos: cleanStr(recipient.state || ""),
          Stcd: cleanStr(recipient.state || ""),
          Ph: cleanStr(recipient.phone) || null,
          Em: cleanStr(recipient.email) || null,
        },

        ValDtls: {
          AssVal: assVal,
          IgstVal: igstVal,
          CgstVal: cgstVal,
          SgstVal: sgstVal,
          CesVal: 0,
          StCesVal: 0,
          Discount: discountVal,
          OthChrg: 0,
          RndOffAmt: 0,
          TotInvVal: totInvVal,
        },

        EwbDtls: {
          TransId: transport.transporterId ? cleanStr(transport.transporterId) : null,
          TransName: transport.transporterName ? cleanStr(transport.transporterName) : null,
          TransMode: transport.mode === "Rail" ? "2" : transport.mode === "Air" ? "3" : transport.mode === "Ship" ? "4" : "1",
          Distance: Number(transport.distance || 0),
          TransDocNo: selectedSale?.number || "",
          TransDocDt: formatDateGB(selectedSale?.date),
          VehNo: transport.vehicleNo ? cleanStr(transport.vehicleNo) : null,
          VehType: transport.vehicleType === "Over Dimensnional Cargo" ? "O" : "R",
        },

        RefDtls: {
          InvRm: "NICGEPP2.0",
        },

        ItemList: [
          {
            SlNo: "1",
            PrdDesc: cleanStr(product.description),
            IsServc: product.isService == "Yes" ? "Y" : "N",
            HsnCd: cleanStr(product.hsn),
            Qty: Number(product.qty || 0),
            FreeQty: 0,
            Unit: cleanStr(product.unit),
            UnitPrice: Number(product.unitPrice || 0),
            TotAmt: assVal,
            Discount: 0,
            PreTaxVal: 0,
            AssAmt: assVal,
            GstRt: gstRt,
            IgstAmt: igstVal,
            CgstAmt: cgstVal,
            SgstAmt: sgstVal,
            CesRt: 0,
            CesAmt: 0,
            CesNonAdvlAmt: 0,
            StateCesRt: 0,
            StateCesAmt: 0,
            StateCesNonAdvlAmt: 0,
            OthChrg: 0,
            TotItemVal: totItemVal,
          },
        ],
      },
    ];

    setJsonPreviewContent(JSON.stringify(ewayBillJSON, null, 2));
    setShowJSONPreview(true);
  };

  // Download the generated JSON file
  const handleDownloadJSON = () => {
    if (!jsonPreviewContent) return;

    const blob = new Blob([jsonPreviewContent], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eway-bill-${selectedSale?.number || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowJSONPreview(false); // Close preview modal after download
  };



  // filter amount is more or less then 50000
  const eWayEligible = salesData.filter(
    (row: any) => Number(row.total) > 50000
  );

  const nonEWay = salesData.filter(
    (row: any) => Number(row.total) <= 50000
  );

  const combinedData = [...eWayEligible, ...nonEWay];




  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/app/gst")}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
            title="Back to GST Module"
            aria-label="Back to GST Module"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">E-Way Bill Management</h1>
        </div>
        {/* Settings Icon */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <Settings size={20} />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg p-4 z-50">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineView}
                  onChange={(e) => setCombineView(e.target.checked)}
                  className="h-4 w-4"
                />
                Mandatory E-Invoice View
              </label>

              <p className="text-xs text-gray-500 mt-1">
                Show all invoices together
              </p>
            </div>
          )}
        </div>

      </div>



      {/* Sales Voucher List amount >50000 */}


      {/* Combined View */}
      {combineView ? (
        <div className="bg-white mt-6 rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">
            All Sales (E-Invoice Mode)
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Date</th>
                  <th className="px-3 py-2 border">Invoice No</th>
                  <th className="px-3 py-2 border">Party ID</th>
                  <th className="px-3 py-2 border text-right">Subtotal</th>
                  <th className="px-3 py-2 border text-right">CGST</th>
                  <th className="px-3 py-2 border text-right">SGST</th>
                  <th className="px-3 py-2 border text-right">IGST</th>
                  <th className="px-3 py-2 border text-right font-semibold">Total</th>
                  <th className="px-3 py-2 border text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {combinedData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2 border">
                      {formatDate(row.date)}
                    </td>

                    <td className="px-3 py-2 border font-medium">
                      {row.number}
                    </td>

                    <td className="px-3 py-2 border">
                      {row.partyName || row.partyId}
                    </td>

                    <td className="px-3 py-2 border text-right">
                      ₹{formatAmount(row.subtotal)}
                    </td>

                    <td className="px-3 py-2 border text-right">
                      ₹{formatAmount(row.cgstTotal)}
                    </td>

                    <td className="px-3 py-2 border text-right">
                      ₹{formatAmount(row.sgstTotal)}
                    </td>

                    <td className="px-3 py-2 border text-right text-orange-600 font-semibold">
                      ₹{formatAmount(row.igstTotal)}
                    </td>

                    <td className="px-3 py-2 border text-right text-green-600 font-bold">
                      ₹{formatAmount(row.total)}
                    </td>

                    <td className="px-3 py-2 border text-center">
                      <button
                        onClick={() => handleGenerateEWay(row)}
                        className={`px-3 py-1 rounded text-white text-xs ${Number(row.total) > 50000
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-green-600 hover:bg-green-700"
                          }`}
                      >
                        {Number(row.total) > 50000 ? "Generate E-Way" : "Generate E-Invoice"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Yahan tumhara purana >50000 table */}
          <div className="bg-white mt-6 rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              E-Way Bill Eligible Sales (Amount &gt; ₹50,000)
            </h2>

            {eWayEligible.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border">Date</th>
                      <th className="px-3 py-2 border">Invoice No</th>
                      <th className="px-3 py-2 border">Party ID</th>
                      <th className="px-3 py-2 border text-right">Subtotal</th>
                      <th className="px-3 py-2 border text-right">CGST</th>
                      <th className="px-3 py-2 border text-right">SGST</th>
                      <th className="px-3 py-2 border text-right">IGST</th>
                      <th className="px-3 py-2 border text-right font-semibold">
                        Total
                      </th>
                      <th className="px-3 py-2 border text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {eWayEligible.map((row: any) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50 transition"
                      >
                        <td className="px-3 py-2 border">
                          {formatDate(row.date)}
                        </td>

                        <td className="px-3 py-2 border font-medium">
                          {row.number}
                        </td>



                        <td className="px-3 py-2 border">
                          {row.partyName || row.partyId}
                        </td>

                        <td className="px-3 py-2 border text-right">
                          ₹{formatAmount(row.subtotal)}
                        </td>

                        <td className="px-3 py-2 border text-right">
                          ₹{formatAmount(row.cgstTotal)}
                        </td>

                        <td className="px-3 py-2 border text-right">
                          ₹{formatAmount(row.sgstTotal)}
                        </td>

                        <td className="px-3 py-2 border text-right text-orange-600 font-semibold">
                          ₹{formatAmount(row.igstTotal)}
                        </td>

                        <td className="px-3 py-2 border text-right text-green-600 font-bold">
                          ₹{formatAmount(row.total)}
                        </td>

                        <td className="px-3 py-2 border text-center">
                          <button
                            onClick={() => handleGenerateEWay(row)}
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                          >
                            Generate E-Way
                          </button>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-6">
                No sales vouchers eligible for E-Way Bill
              </div>
            )}
          </div>



          {/* Sales Voucher List amount <= 50000 */}
          {combineView && (
            <div className="bg-white mt-6 rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Sales (Amount ≤ ₹50,000) – E-Invoice Only
              </h2>

              {nonEWay.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 border">Date</th>
                        <th className="px-3 py-2 border">Invoice No</th>
                        <th className="px-3 py-2 border">Party</th>
                        <th className="px-3 py-2 border text-right">Subtotal</th>
                        <th className="px-3 py-2 border text-right">CGST</th>
                        <th className="px-3 py-2 border text-right">SGST</th>
                        <th className="px-3 py-2 border text-right">IGST</th>
                        <th className="px-3 py-2 border text-right font-semibold">
                          Total
                        </th>
                        <th className="px-3 py-2 border text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {nonEWay.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 border">{formatDate(row.date)}</td>
                          <td className="px-3 py-2 border">{row.number}</td>
                          <td className="px-3 py-2 border">{row.partyName}</td>
                          <td className="px-3 py-2 border text-right">₹{formatAmount(row.subtotal)}</td>
                          <td className="px-3 py-2 border text-right">₹{formatAmount(row.cgstTotal)}</td>
                          <td className="px-3 py-2 border text-right">₹{formatAmount(row.sgstTotal)}</td>
                          <td className="px-3 py-2 border text-right">₹{formatAmount(row.igstTotal)}</td>
                          <td className="px-3 py-2 border text-right font-bold">₹{formatAmount(row.total)}</td>
                          <td className="px-3 py-2 border text-center">
                            <button className="px-3 py-1 bg-green-600 text-white rounded text-xs">
                              Generate E-Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                  No sales found below ₹50,000
                </div>
              )}
            </div>
          )}

        </>
      )}








      {/* supplier profile */}
      {showEWayForm && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-md p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl relative p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowEWayForm(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
              Generate E-Way Bill
            </h2>

            {/* supplier  */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Supplier Details
              </h2>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier GSTIN
                  </label>
                  <input
                    type="text"
                    value={supplier.gstin}
                    onChange={(e) =>
                      setSupplier({ ...supplier, gstin: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={supplier.legalName}
                    onChange={(e) =>
                      setSupplier({ ...supplier, legalName: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    value={supplier.tradeName}
                    onChange={(e) =>
                      setSupplier({ ...supplier, tradeName: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Address 1
                  </label>
                  <input
                    type="text"
                    value={supplier.address1}
                    onChange={(e) =>
                      setSupplier({ ...supplier, address1: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Address 2
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Landmark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Location
                  </label>
                  <input
                    type="text"
                    value={supplier.location}
                    onChange={(e) =>
                      setSupplier({ ...supplier, location: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <select
                    value={supplier.state}
                    onChange={(e) =>
                      setSupplier({ ...supplier, state: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={supplier.pincode}
                    onChange={(e) =>
                      setSupplier({ ...supplier, pincode: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={supplier.phone}
                    onChange={(e) =>
                      setSupplier({ ...supplier, phone: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={supplier.email}
                    onChange={(e) =>
                      setSupplier({ ...supplier, email: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>
            </div>

            {/* Recipient Master */}
            <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Recipient Masters
              </h2>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={recipient.gstin}
                    onChange={(e) =>
                      setRecipient({ ...recipient, gstin: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={recipient.legalName}
                    onChange={(e) =>
                      setRecipient({ ...recipient, legalName: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    value={recipient.tradeName}
                    onChange={(e) =>
                      setRecipient({ ...recipient, tradeName: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Address 1
                  </label>
                  <input
                    type="text"
                    value={recipient.address1}
                    onChange={(e) =>
                      setRecipient({ ...recipient, address1: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Address 2
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Landmark"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Supplier Location
                  </label>
                  <input
                    type="text"
                    value={recipient.location}
                    onChange={(e) =>
                      setRecipient({ ...recipient, location: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <select
                    value={recipient.state}
                    onChange={(e) =>
                      setRecipient({ ...recipient, state: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={recipient.pincode}
                    onChange={(e) =>
                      setRecipient({ ...recipient, pincode: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={recipient.phone}
                    onChange={(e) =>
                      setRecipient({ ...recipient, phone: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) =>
                      setRecipient({ ...recipient, email: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>
              </div>
            </div>


            {/* product master */}
            <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Product Masters
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Product Description
                  </label>
                  <input
                    type="text"
                    value={product.description}
                    onChange={(e) =>
                      setProduct({ ...product, description: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Is Service
                  </label>
                  <input
                    type="text"
                    value={product.isService}
                    onChange={(e) =>
                      setProduct({ ...product, isService: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    HSN
                  </label>
                  <input
                    type="text"
                    value={product.hsn}
                    onChange={(e) =>
                      setProduct({ ...product, hsn: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={product.unit}
                    onChange={(e) =>
                      setProduct({ ...product, unit: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit Price
                  </label>
                  <input type="text"
                    value={
                      Number(product.unitPrice || 0) * Math.abs(Number(product.qty || 0))
                    }
                    readOnly
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />


                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    GST
                  </label>
                  <input
                    type="text"
                    value={product.gst}
                    onChange={(e) =>
                      setProduct({ ...product, gst: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                </div>

              </div>
            </div>


            {/* genrate w bill */}
            <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={generateEWay}
                  onChange={(e) => setGenerateEWay(e.target.checked)}
                  className="h-4 w-4"
                />
                Generate E-Way Bill
              </label>
            </div>


            {/* Transport Details */}

            {generateEWay && (
              <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  Transport Details
                </h2>

                {/* pura transport form yahin rahega */}
                <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">
                    Transport Details
                  </h2>

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Transportation Mode *
                      </label>
                      <select
                        value={transport.mode}
                        onChange={(e) =>
                          setTransport({ ...transport, mode: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Mode</option>
                        <option>Rail</option>
                        <option>Air</option>
                        <option>Ship</option>
                        <option>Road</option>
                      </select>

                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Vehicle Type *
                      </label>
                      <select
                        value={transport.vehicleType}
                        onChange={(e) =>
                          setTransport({ ...transport, vehicleType: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Mode</option>
                        <option>Regular</option>
                        <option>Over Dimensnional Cargo</option>
                      </select>

                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={transport.vehicleNo}
                        onChange={(e) =>
                          setTransport({ ...transport, vehicleNo: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Transporter ID
                      </label>
                      <input
                        type="text"
                        value={transport.transporterId}
                        onChange={(e) =>
                          setTransport({ ...transport, transporterId: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Transporter Name
                      </label>
                      <input
                        type="text"
                        value={transport.transporterName}
                        onChange={(e) =>
                          setTransport({ ...transport, transporterName: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Transporter Name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Approximate Distance (KM)
                      </label>
                      <input
                        type="text"
                        value={transport.distance}
                        onChange={(e) =>
                          setTransport({ ...transport, distance: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* Shipping Address (if different from billing) */}
            {generateEWay && (
              <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  Shipping Address (if different billing)
                </h2>

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To Name
                    </label>
                    <input
                      type="text"
                      value={shipping.legalName}
                      onChange={(e) =>
                        setShipping({ ...shipping, legalName: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To GSTIN
                    </label>
                    <input
                      type="text"
                      value={shipping.gstin}
                      onChange={(e) =>
                        setShipping({ ...shipping, gstin: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To State Code
                    </label>
                    <select
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping({ ...shipping, state: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To Place
                    </label>
                    <input
                      type="text"
                      value={shipping.place}
                      onChange={(e) =>
                        setShipping({ ...shipping, place: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To Address
                    </label>
                    <input
                      type="text"
                      value={shipping.address}
                      onChange={(e) =>
                        setShipping({ ...shipping, address: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ship To PIN Code
                    </label>
                    <input
                      type="text"
                      value={shipping.pincode}
                      onChange={(e) =>
                        setShipping({ ...shipping, pincode: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}




            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEWayForm(false)}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={handleGenerateJSONPreview}
                className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Preview JSON
              </button>
            </div>



          </div>
        </div>
      )}

      {/* JSON Preview Modal */}
      {showJSONPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                JSON Preview - E-Way Bill ({selectedSale?.number})
              </h3>
              <button
                onClick={() => setShowJSONPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Code Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-950">
              <pre className="text-xs font-mono text-green-400 select-all overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {jsonPreviewContent}
              </pre>
            </div>

            {/* Footer / Buttons */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonPreviewContent);
                  alert("Copied to clipboard!");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-semibold transition"
              >
                Copy JSON
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJSONPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition"
                >
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default EWayBill;
