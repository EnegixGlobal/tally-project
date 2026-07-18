import React, { useState, useEffect } from 'react';

const InputCell = ({ value = "", className = "" }) => (
  <td className={`p-1.5 border-b border-slate-200 ${className}`}>
    <input 
      type="text" 
      className="w-full min-h-[36px] px-3 text-right bg-slate-100 border border-slate-300 rounded-md shadow-inner hover:bg-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400" 
      defaultValue={value}
      placeholder="0.00"
    />
  </td>
);

const TextCell = ({ children, className = "", colSpan = 1, rowSpan = 1 }) => (
  <td colSpan={colSpan} rowSpan={rowSpan} className={`px-4 py-3 border-b border-slate-200 text-sm text-slate-700 font-medium ${className}`}>
    {children}
  </td>
);

const HeaderCell = ({ children, className = "", colSpan = 1, rowSpan = 1 }) => (
  <th colSpan={colSpan} rowSpan={rowSpan} className={`px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 ${className}`}>
    {children}
  </th>
);

const SectionCard = ({ title, badge = "", children }) => (
  <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 mb-8 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-center relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600"></div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {badge && <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-slate-100 text-slate-600 uppercase">{badge}</span>}
    </div>
    <div className="overflow-x-auto p-1">
      {children}
    </div>
  </div>
);

const GSTR9 = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const initialFinancialYear = month < 3 
    ? `${year - 1}-${year.toString().slice(2)}` 
    : `${year}-${(year + 1).toString().slice(2)}`;
    
  const [financialYear, setFinancialYear] = useState(initialFinancialYear);

  const todayFormatted = currentDate.toISOString().split('T')[0];

  const companyDataStr = localStorage.getItem("companyInfo");
  const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
  
  const [companyInfo, setCompanyInfo] = useState({
    gstin: companyData?.gstNumber || companyData?.gst_number || "",
    legalName: companyData?.name || "",
  });

  const [gstr9Data, setGstr9Data] = useState<any>(null);

  useEffect(() => {
    const companyIdVal = localStorage.getItem("company_id") || "";
    if (!companyIdVal) return;
    const fetchCompanyInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company/company/${companyIdVal}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data) {
          setCompanyInfo((prev) => ({
            ...prev,
            gstin: data.gstNumber || data.gst_number || prev.gstin,
            legalName: data.name || prev.legalName,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch company details:", err);
      }
    };
    fetchCompanyInfo();

    const fetchGstr9Data = async () => {
      try {
        const token = localStorage.getItem("token");
        const owner_type = localStorage.getItem("supplier") || "";
        const owner_id = localStorage.getItem(owner_type === "employee" ? "employee_id" : "user_id") || "";

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gstr9/data?company_id=${companyIdVal}&owner_type=${owner_type}&owner_id=${owner_id}&financialYear=${financialYear}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setGstr9Data(data);
      } catch (err) {
        console.error("Failed to fetch GSTR-9 data:", err);
      }
    };
    fetchGstr9Data();
  }, [financialYear]);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1200px] mx-auto pb-20">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Form GSTR-9</h1>
              <p className="text-sm font-semibold text-blue-600 mt-1.5 uppercase tracking-widest">[See rule 80]</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Annual Return
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">1. Financial Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Financial Year</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold" placeholder="e.g. 2022-23" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">GSTIN</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="Enter GSTIN" value={companyInfo.gstin} onChange={(e) => setCompanyInfo(p => ({...p, gstin: e.target.value}))} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">3. Entity Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Legal name of the registered person</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="Enter Legal Name" value={companyInfo.legalName} onChange={(e) => setCompanyInfo(p => ({...p, legalName: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trade name, if any</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="Enter Trade Name" value={companyInfo.legalName} onChange={(e) => setCompanyInfo(p => ({...p, legalName: e.target.value}))} />
              </div>
            </div>
          </div>
        </div>

        {/* Part II */}
        <SectionCard title="Pt. II: Details of Outward and inward supplies made during the financial year" badge="Outward & Inward Supplies">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell rowSpan={2} className="w-12 text-center">Sr.No</HeaderCell>
                <HeaderCell rowSpan={2} className="w-[30%] text-left">Nature of Supplies</HeaderCell>
                <HeaderCell rowSpan={2} className="w-32 text-right">Taxable Value(₹)</HeaderCell>
                <HeaderCell colSpan={4} className="text-center bg-slate-100 border-l border-white">(Amount in ₹ in all tables)</HeaderCell>
              </tr>
              <tr>
                <HeaderCell className="w-32 text-right border-l border-white">Central Tax</HeaderCell>
                <HeaderCell className="w-32 text-right border-l border-white">State / UT Tax</HeaderCell>
                <HeaderCell className="w-32 text-right border-l border-white">Integrated Tax</HeaderCell>
                <HeaderCell className="w-32 text-right border-l border-white">Cess</HeaderCell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <HeaderCell className="text-center bg-white text-blue-600">4</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-white text-slate-800">Details of advances, inward and outward supplies made during the financial year on which tax is payable</HeaderCell>
              </tr>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].map((char, idx) => {
                const totalPurchase = gstr9Data ? {
                  taxableValue: (Number(gstr9Data.purchaseB2b.taxableValue) + Number(gstr9Data.purchaseB2c.taxableValue)).toFixed(2),
                  centralTax: (Number(gstr9Data.purchaseB2b.centralTax) + Number(gstr9Data.purchaseB2c.centralTax)).toFixed(2),
                  stateTax: (Number(gstr9Data.purchaseB2b.stateTax) + Number(gstr9Data.purchaseB2c.stateTax)).toFixed(2),
                  integratedTax: (Number(gstr9Data.purchaseB2b.integratedTax) + Number(gstr9Data.purchaseB2c.integratedTax)).toFixed(2),
                  cess: (Number(gstr9Data.purchaseB2b.cess) + Number(gstr9Data.purchaseB2c.cess)).toFixed(2)
                } : null;

                const labels = [
                  "Supplies made to un-registered persons (B2C)",
                  "Supplies made to registered persons (B2B)",
                  "Zero rated supply (Export) on payment of tax",
                  "Supplies to SEZs on payment of tax",
                  "Deemed Exports",
                  "Advances on which tax has been paid but invoice has not been issued",
                  "Inward supplies on which tax is to be paid on reverse charge basis",
                  "Sub-total (A to G above)",
                  "Credit notes issued in respect of transactions (-)",
                  "Debit notes issued in respect of transactions (+)",
                  "Supplies / tax declared through Amendments (+)",
                  "Supplies / tax reduced through Amendments (-)",
                  "Sub total (I to L above)",
                  "Supplies and advances on which tax is to be paid (H + M) above"
                ];
                const blockedC = char === 'C' || char === 'D';
                const rowData = char === 'A' ? gstr9Data?.b2c : 
                                char === 'B' ? gstr9Data?.b2b : 
                                char === 'G' ? totalPurchase : null;
                
                return (
                  <tr key={char} className="hover:bg-blue-50/30 transition-colors group">
                    <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                    <TextCell className="text-slate-600">{labels[idx]}</TextCell>
                    <InputCell value={rowData?.taxableValue || ""} />
                    {blockedC ? (
                      <>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                      </>
                    ) : (
                      <>
                        <InputCell value={rowData?.centralTax || ""} />
                        <InputCell value={rowData?.stateTax || ""} />
                      </>
                    )}
                    <InputCell value={rowData?.integratedTax || ""} />
                    <InputCell value={rowData?.cess || ""} />
                  </tr>
                );
              })}

              <tr>
                <HeaderCell className="text-center bg-white mt-4 border-t-2 border-slate-200 text-blue-600">5</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-white border-t-2 border-slate-200 text-slate-800">Details of Outward supplies made during the financial year on which tax is not payable</HeaderCell>
              </tr>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].map((char, idx) => {
                const labels = [
                  "Zero rated supply (Export) without payment of tax",
                  "Supply to SEZs without payment of tax",
                  "Supplies on which tax is to be paid by recipient on reverse charge",
                  "Exempted",
                  "Nil Rated",
                  "Non-GST supply (includes 'no supply')",
                  "Sub total (A to F above)",
                  "Credit Notes issued in respect of transactions (-)",
                  "Debit Notes issued in respect of transactions (+)",
                  "Supplies declared through Amendments (+)",
                  "Supplies reduced through Amendments (-)",
                  "Sub-Total (H to K above)",
                  "Turnover on which tax is not to be paid (G + L above)",
                  "Total Turnover (including advances) (4N + 5M - 4G above)"
                ];
                return (
                  <tr key={`5${char}`} className="hover:bg-blue-50/30 transition-colors group">
                    <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                    <TextCell className="text-slate-600">{labels[idx]}</TextCell>
                    <InputCell />
                    {char === 'N' ? (
                      <>
                        <InputCell />
                        <InputCell />
                        <InputCell />
                        <InputCell />
                      </>
                    ) : (
                      <>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                        <td className="bg-slate-100/50 border-b border-slate-200"></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionCard>

        {/* Part III */}
        <SectionCard title="Pt. III: Details of ITC for the financial year" badge="Input Tax Credit">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell className="w-12 text-center">Sr.No</HeaderCell>
                <HeaderCell className="w-[30%] text-left">Description</HeaderCell>
                <HeaderCell className="w-24 text-center">Type</HeaderCell>
                <HeaderCell className="w-32 text-right">Central Tax</HeaderCell>
                <HeaderCell className="w-32 text-right">State / UT Tax</HeaderCell>
                <HeaderCell className="w-32 text-right">Integrated Tax</HeaderCell>
                <HeaderCell className="w-32 text-right">Cess</HeaderCell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <HeaderCell className="text-center bg-white text-blue-600">6</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-white text-slate-800">Details of ITC availed during the financial year</HeaderCell>
              </tr>
              
              {(() => {
                const totalPurchase = gstr9Data ? {
                  centralTax: (Number(gstr9Data.purchaseB2b.centralTax) + Number(gstr9Data.purchaseB2c.centralTax)).toFixed(2),
                  stateTax: (Number(gstr9Data.purchaseB2b.stateTax) + Number(gstr9Data.purchaseB2c.stateTax)).toFixed(2),
                  integratedTax: (Number(gstr9Data.purchaseB2b.integratedTax) + Number(gstr9Data.purchaseB2c.integratedTax)).toFixed(2),
                  cess: (Number(gstr9Data.purchaseB2b.cess) + Number(gstr9Data.purchaseB2c.cess)).toFixed(2)
                } : null;

                return (
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <TextCell className="text-center font-bold text-slate-500">A</TextCell>
                    <TextCell colSpan={2} className="text-slate-600">Total amount of input tax credit availed through FORM GSTR-3B</TextCell>
                    <InputCell value={totalPurchase?.centralTax || ""} />
                    <InputCell value={totalPurchase?.stateTax || ""} />
                    <InputCell value={totalPurchase?.integratedTax || ""} />
                    <InputCell value={totalPurchase?.cess || ""} />
                  </tr>
                );
              })()}

              {['B', 'C', 'D'].map((char, idx) => {
                const desc = [
                  "Inward supplies (other than imports and inward supplies liable to reverse charge but includes services received from SEZs)",
                  "Inward supplies received from unregistered persons liable to reverse charge on which tax is paid & ITC availed",
                  "Inward supplies received from registered persons liable to reverse charge on which tax is paid and ITC availed"
                ];
                const rowData = char === 'C' ? gstr9Data?.purchaseB2c : 
                                char === 'D' ? gstr9Data?.purchaseB2b : null;
                return (
                  <React.Fragment key={char}>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <TextCell rowSpan={3} className="text-center font-bold text-slate-500 align-top pt-4">{char}</TextCell>
                      <TextCell rowSpan={3} className="text-slate-600 align-top pt-4">{desc[idx]}</TextCell>
                      <TextCell className="text-center text-xs font-bold text-slate-500 uppercase">Inputs</TextCell>
                      <InputCell value={rowData?.centralTax || ""} />
                      <InputCell value={rowData?.stateTax || ""} />
                      <InputCell value={rowData?.integratedTax || ""} />
                      <InputCell value={rowData?.cess || ""} />
                    </tr>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <TextCell className="text-center text-xs font-bold text-slate-500 uppercase">Capital Goods</TextCell>
                      <InputCell />
                      <InputCell />
                      <InputCell />
                      <InputCell />
                    </tr>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <TextCell className="text-center text-xs font-bold text-slate-500 uppercase border-b-2 border-slate-200">Input Services</TextCell>
                      <InputCell className="border-b-2 border-slate-200" />
                      <InputCell className="border-b-2 border-slate-200" />
                      <InputCell className="border-b-2 border-slate-200" />
                      <InputCell className="border-b-2 border-slate-200" />
                    </tr>
                  </React.Fragment>
                );
              })}

              <tr className="hover:bg-blue-50/30 transition-colors">
                <TextCell rowSpan={2} className="text-center font-bold text-slate-500 align-top pt-4">E</TextCell>
                <TextCell rowSpan={2} className="text-slate-600 align-top pt-4">Import of goods (including supplies from SEZs)</TextCell>
                <TextCell className="text-center text-xs font-bold text-slate-500 uppercase">Inputs</TextCell>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <InputCell />
                <InputCell />
              </tr>
              <tr className="hover:bg-blue-50/30 transition-colors">
                <TextCell className="text-center text-xs font-bold text-slate-500 uppercase">Capital Goods</TextCell>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <InputCell />
                <InputCell />
              </tr>

              <tr className="hover:bg-blue-50/30 transition-colors">
                <TextCell className="text-center font-bold text-slate-500">F</TextCell>
                <TextCell colSpan={2} className="text-slate-600">Import of services (excluding inward supplies from SEZs)</TextCell>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <td className="bg-slate-100/50 border-b border-slate-200"></td>
                <InputCell />
                <InputCell />
              </tr>

              {['G', 'H', 'I', 'J'].map((char, idx) => {
                const desc = [
                  "Input Tax credit received from ISD",
                  "Amount of ITC reclaimed (other than B above) under provisions of the Act",
                  "Sub-total (B to H above)",
                  "Difference (I - A above)"
                ];
                return (
                  <tr key={`6${char}`} className="hover:bg-blue-50/30 transition-colors">
                    <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                    <TextCell colSpan={2} className="text-slate-600">{desc[idx]}</TextCell>
                    <InputCell />
                    <InputCell />
                    <InputCell />
                    <InputCell />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionCard>

        {/* Part IV & V (Combined creatively) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SectionCard title="Pt. IV: Details of tax paid" badge="Tax Paid">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <HeaderCell className="text-left">Description</HeaderCell>
                  <HeaderCell className="text-right">Tax Payable</HeaderCell>
                  <HeaderCell className="text-right">Paid (Cash)</HeaderCell>
                  <HeaderCell className="text-right">Paid (ITC)</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalSales = gstr9Data ? {
                    integratedTax: (Number(gstr9Data.b2b.integratedTax) + Number(gstr9Data.b2c.integratedTax)).toFixed(2),
                    centralTax: (Number(gstr9Data.b2b.centralTax) + Number(gstr9Data.b2c.centralTax)).toFixed(2),
                    stateTax: (Number(gstr9Data.b2b.stateTax) + Number(gstr9Data.b2c.stateTax)).toFixed(2),
                    cess: (Number(gstr9Data.b2b.cess) + Number(gstr9Data.b2c.cess)).toFixed(2)
                  } : null;

                  return ['Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'Interest', 'Late Fees', 'Penalty', 'Other'].map((item) => {
                    let taxPayableValue = "";
                    if (item === 'Integrated Tax') taxPayableValue = totalSales?.integratedTax || "";
                    else if (item === 'Central Tax') taxPayableValue = totalSales?.centralTax || "";
                    else if (item === 'State/UT Tax') taxPayableValue = totalSales?.stateTax || "";
                    else if (item === 'Cess') taxPayableValue = totalSales?.cess || "";

                    return (
                      <tr key={item} className="hover:bg-blue-50/30 transition-colors">
                        <TextCell className="font-semibold text-slate-700">{item}</TextCell>
                        <InputCell value={taxPayableValue} />
                        <InputCell />
                        <InputCell />
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="Pt. V: Next FY declared transactions" badge="Next FY">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <HeaderCell className="text-left w-[60%]">Description</HeaderCell>
                  <HeaderCell className="text-right">Taxable Value</HeaderCell>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="text-slate-600">10. Supplies / tax declared through Amendments (+)</TextCell>
                  <InputCell />
                </tr>
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="text-slate-600">11. Supplies / tax reduced through Amendments (-)</TextCell>
                  <InputCell />
                </tr>
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="text-slate-600">12. Reversal of ITC availed during previous FY</TextCell>
                  <InputCell />
                </tr>
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="text-slate-600">13. ITC availed for the previous FY</TextCell>
                  <InputCell />
                </tr>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <TextCell className="font-bold text-slate-800 text-right">Total turnover(5N + 10 - 11)</TextCell>
                  <InputCell />
                </tr>
              </tbody>
            </table>
          </SectionCard>
        </div>

        {/* Verification */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-3xl shadow-lg border border-indigo-700 p-8 text-white relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification
          </h3>
          
          <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
            <p className="text-sm leading-relaxed text-blue-50">
              I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief and nothing has been concealed there from and in case of any reduction in output tax liability the benefit thereof has been/will be passed on to the recipient of supply.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Date</label>
              <input type="date" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium" defaultValue={todayFormatted} />
            </div>
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2 text-left md:text-right">Authorized Signatory Name</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium uppercase text-left md:text-right placeholder:text-blue-200/50" placeholder="Enter Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2 text-left md:text-right">Designation / Status</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium uppercase text-left md:text-right placeholder:text-blue-200/50" placeholder="Enter Designation" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GSTR9;
