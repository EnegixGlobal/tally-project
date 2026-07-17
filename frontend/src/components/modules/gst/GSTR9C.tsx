import React, { useState, useEffect } from 'react';

const InputCell = ({ value = "", className = "", placeholder = "0.00" }) => (
  <td className={`p-1.5 border-b border-slate-200 ${className}`}>
    <input 
      type="text" 
      className="w-full min-h-[36px] px-3 text-right bg-slate-100 border border-slate-300 rounded-md shadow-inner hover:bg-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400" 
      defaultValue={value}
      placeholder={placeholder}
    />
  </td>
);

const TextInputCell = ({ value = "", className = "", placeholder = "Enter details..." }) => (
  <td className={`p-1.5 border-b border-slate-200 ${className}`}>
    <input 
      type="text" 
      className="w-full min-h-[36px] px-3 text-left bg-slate-100 border border-slate-300 rounded-md shadow-inner hover:bg-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-400" 
      defaultValue={value}
      placeholder={placeholder}
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

const GSTR9C = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const financialYear = month < 3 
    ? `${year - 1}-${year.toString().slice(2)}` 
    : `${year}-${(year + 1).toString().slice(2)}`;
    
  const todayFormatted = currentDate.toISOString().split('T')[0];

  const companyDataStr = localStorage.getItem("companyInfo");
  const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;
  
  const [companyInfo, setCompanyInfo] = useState({
    gstin: companyData?.gstNumber || companyData?.gst_number || "",
    legalName: companyData?.name || "",
  });

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
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1200px] mx-auto pb-20">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FORM GSTR-9C</h1>
              <p className="text-sm font-semibold text-blue-600 mt-1.5 uppercase tracking-widest">See rule 80(3)</p>
              <p className="text-lg font-bold text-slate-700 mt-2">PART – A - Reconciliation Statement</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Audit Reconciliation
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Pt. I Basic Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">1. Financial Year</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold" placeholder="e.g. 2017-18" defaultValue={financialYear} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">2. GSTIN</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="Enter GSTIN" value={companyInfo.gstin} onChange={(e) => setCompanyInfo(p => ({...p, gstin: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">4. Are you liable to audit under any Act?</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold" placeholder="<<Please specify>>" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Entity Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">3A. Legal Name</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="<Auto>" value={companyInfo.legalName} onChange={(e) => setCompanyInfo(p => ({...p, legalName: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">3B. Trade Name (if any)</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 shadow-inner rounded-md focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-800 font-semibold uppercase" placeholder="<Auto>" value={companyInfo.legalName} onChange={(e) => setCompanyInfo(p => ({...p, legalName: e.target.value}))} />
              </div>
            </div>
          </div>
        </div>

        {/* Part II */}
        <SectionCard title="Pt. II: Reconciliation of turnover declared in audited Annual Financial Statement with turnover declared in Annual Return (GSTR9)" badge="Gross Turnover">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell colSpan={4} className="text-right italic bg-slate-100/50">(Amount in ₹ in all tables)</HeaderCell>
              </tr>
              <tr>
                <HeaderCell className="w-12 text-center bg-blue-50 text-blue-700">5</HeaderCell>
                <HeaderCell colSpan={3} className="text-left bg-blue-50 text-blue-700">Reconciliation of Gross Turnover</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].map((char, idx) => {
                const labels = [
                  "Turnover (including exports) as per audited financial statements for the State / UT (For multi-GSTIN units under same PAN the turnover shall be derived from the audited Annual Financial Statement)",
                  "Unbilled revenue at the beginning of Financial Year",
                  "Unadjusted advances at the end of the Financial Year",
                  "Deemed Supply under Schedule I",
                  "Credit Notes issued after the end of the financial year but reflected in the annual return",
                  "Trade Discounts accounted for in the audited Annual Financial Statement but are not permissible under GST",
                  "Turnover from April 2017 to June 2017",
                  "Unbilled revenue at the end of Financial Year",
                  "Unadjusted Advances at the beginning of the Financial Year",
                  "Credit notes accounted for in the audited Annual Financial Statement but are not permissible under GST",
                  "Adjustments on account of supply of goods by SEZ units to DTA Units",
                  "Turnover for the period under composition scheme",
                  "Adjustments in turnover under section 15 and rules thereunder",
                  "Adjustments in turnover due to foreign exchange fluctuations",
                  "Adjustments in turnover due to reasons not listed above",
                  "Annual turnover after adjustments as above",
                  "Turnover as declared in Annual Return (GSTR9)",
                  "Un-Reconciled turnover (Q - P)"
                ];
                const modifier = ["", "(+)", "(+)", "(+)", "(-)", "(+)", "(-)", "(-)", "(-)", "(+)", "(-)", "(-)", "(+/-)", "(+/-)", "(+/-)", "", "", "AT1"];
                return (
                  <tr key={`5${char}`} className={`hover:bg-blue-50/30 transition-colors ${['P','Q','R'].includes(char) ? 'bg-slate-50' : ''}`}>
                    <TextCell className={`text-center font-bold ${['P','Q','R'].includes(char) ? 'text-slate-800' : 'text-slate-500'}`}>{char}</TextCell>
                    <TextCell className={`${['P','Q','R'].includes(char) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{labels[idx]}</TextCell>
                    <TextCell className="w-16 text-center font-bold text-slate-500">{modifier[idx]}</TextCell>
                    <InputCell />
                  </tr>
                );
              })}

              <tr>
                <HeaderCell className="text-center bg-red-50 text-red-700 border-t-2 border-slate-200">6</HeaderCell>
                <HeaderCell colSpan={3} className="text-left bg-red-50 text-red-700 border-t-2 border-slate-200">Reasons for Un - Reconciled difference in Annual Gross Turnover</HeaderCell>
              </tr>
              {['A', 'B', 'C'].map((char) => (
                <tr key={`6${char}`} className="hover:bg-red-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                  <TextCell className="text-slate-600">Reason {char === 'A' ? 1 : char === 'B' ? 2 : 3}</TextCell>
                  <TextInputCell colSpan={2} placeholder="<<Text>>" />
                </tr>
              ))}

              <tr>
                <HeaderCell className="text-center bg-blue-50 text-blue-700 border-t-2 border-slate-200">7</HeaderCell>
                <HeaderCell colSpan={3} className="text-left bg-blue-50 text-blue-700 border-t-2 border-slate-200">Reconciliation of Taxable Turnover</HeaderCell>
              </tr>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((char, idx) => {
                const labels = [
                  "Annual turnover after adjustments (from 5P above)",
                  "Value of Exempted, Nil Rated, Non-GST supplies, No-Supply turnover",
                  "Zero rated supplies without payment of tax",
                  "Supplies on which tax is to be paid by the recipient on reverse charge basis",
                  "Taxable turnover as per adjustments above (A-B-C-D)",
                  "Taxable turnover as per liability declared in Annual Return (GSTR9)",
                  "Unreconciled taxable turnover (F-E)"
                ];
                return (
                  <tr key={`7${char}`} className={`hover:bg-blue-50/30 transition-colors ${['A','E','F','G'].includes(char) ? 'bg-slate-50' : ''}`}>
                    <TextCell className={`text-center font-bold ${['A','E','F','G'].includes(char) ? 'text-slate-800' : 'text-slate-500'}`}>{char}</TextCell>
                    <TextCell colSpan={2} className={`${['A','E','F','G'].includes(char) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{labels[idx]}</TextCell>
                    <InputCell />
                  </tr>
                );
              })}

              <tr>
                <HeaderCell className="text-center bg-red-50 text-red-700 border-t-2 border-slate-200">8</HeaderCell>
                <HeaderCell colSpan={3} className="text-left bg-red-50 text-red-700 border-t-2 border-slate-200">Reasons for Un - Reconciled difference in taxable turnover</HeaderCell>
              </tr>
              {['A', 'B', 'C'].map((char) => (
                <tr key={`8${char}`} className="hover:bg-red-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                  <TextCell className="text-slate-600">Reason {char === 'A' ? 1 : char === 'B' ? 2 : 3}</TextCell>
                  <TextInputCell colSpan={2} placeholder="<<Text>>" />
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Part III */}
        <SectionCard title="Pt. III: Reconciliation of tax paid" badge="Tax Paid">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell className="w-12 text-center bg-blue-50 text-blue-700">9</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-blue-50 text-blue-700">Reconciliation of rate wise liability and amount payable thereon</HeaderCell>
              </tr>
              <tr>
                <HeaderCell rowSpan={2} colSpan={2} className="text-center">Description</HeaderCell>
                <HeaderCell rowSpan={2} className="text-right">Taxable Value</HeaderCell>
                <HeaderCell colSpan={4} className="text-center bg-slate-100 border-l border-white">Tax payable</HeaderCell>
              </tr>
              <tr>
                <HeaderCell className="text-right border-l border-white">Central tax</HeaderCell>
                <HeaderCell className="text-right border-l border-white">State / UT tax</HeaderCell>
                <HeaderCell className="text-right border-l border-white">Integrated Tax</HeaderCell>
                <HeaderCell className="text-right border-l border-white">Cess, if applicable</HeaderCell>
              </tr>
              <tr className="bg-slate-100/50">
                <HeaderCell colSpan={2} className="text-center">1</HeaderCell>
                <HeaderCell className="text-center">2</HeaderCell>
                <HeaderCell className="text-center">3</HeaderCell>
                <HeaderCell className="text-center">4</HeaderCell>
                <HeaderCell className="text-center">5</HeaderCell>
                <HeaderCell className="text-center">6</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'].map((char, idx) => {
                const labels = ["5%", "5% (RC)", "12%", "12% (RC)", "18%", "18% (RC)", "28%", "28% (RC)", "3%", "0.25%", "0.10%", "Interest", "Late Fee", "Penalty", "Others"];
                const isNonTaxable = ['L', 'M', 'N', 'O'].includes(char);
                return (
                  <tr key={`9${char}`} className="hover:bg-blue-50/30 transition-colors">
                    <TextCell className="text-center font-bold text-slate-500 w-12">{char}</TextCell>
                    <TextCell className="text-slate-600 font-semibold">{labels[idx]}</TextCell>
                    {isNonTaxable ? <td className="bg-slate-200/50 border-b border-slate-200"></td> : <InputCell />}
                    <InputCell />
                    <InputCell />
                    <InputCell />
                    <InputCell />
                  </tr>
                );
              })}
              {['P', 'Q', 'R'].map((char, idx) => {
                const labels = ["Total amount to be paid as per tables above", "Total amount paid as declared in Annual Return (GSTR 9)", "Un-reconciled payment of amount (PT1)"];
                return (
                  <tr key={`9${char}`} className="hover:bg-blue-50/30 transition-colors bg-slate-50">
                    <TextCell className="text-center font-bold text-slate-800">{char}</TextCell>
                    <TextCell className="text-slate-800 font-bold">{labels[idx]}</TextCell>
                    <td className="bg-slate-200/50 border-b border-slate-200"></td>
                    <InputCell placeholder="<Auto>" />
                    <InputCell placeholder="<Auto>" />
                    <InputCell placeholder="<Auto>" />
                    <InputCell placeholder="<Auto>" />
                  </tr>
                );
              })}

              <tr>
                <HeaderCell className="text-center bg-red-50 text-red-700 border-t-2 border-slate-200">10</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-red-50 text-red-700 border-t-2 border-slate-200">Reasons for un-reconciled payment of amount</HeaderCell>
              </tr>
              {['A', 'B', 'C'].map((char) => (
                <tr key={`10${char}`} className="hover:bg-red-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                  <TextCell className="text-slate-600">Reason {char === 'A' ? 1 : char === 'B' ? 2 : 3}</TextCell>
                  <TextInputCell colSpan={5} placeholder="<<Text>>" />
                </tr>
              ))}

              <tr>
                <HeaderCell className="text-center bg-orange-50 text-orange-700 border-t-2 border-slate-200">11</HeaderCell>
                <HeaderCell colSpan={6} className="text-left bg-orange-50 text-orange-700 border-t-2 border-slate-200">Additional amount payable but not paid (due to reasons specified under Tables 6,8 and 10 above)</HeaderCell>
              </tr>
              <tr>
                <HeaderCell colSpan={2} className="text-center">Description</HeaderCell>
                <HeaderCell className="text-right">Taxable Value</HeaderCell>
                <HeaderCell colSpan={4} className="text-center bg-slate-100 border-l border-white">To be paid through Cash</HeaderCell>
              </tr>
              <tr>
                <HeaderCell colSpan={2} className="text-center border-l border-white">1</HeaderCell>
                <HeaderCell className="text-center border-l border-white">2</HeaderCell>
                <HeaderCell className="text-center border-l border-white">3 (Central Tax)</HeaderCell>
                <HeaderCell className="text-center border-l border-white">4 (State/UT Tax)</HeaderCell>
                <HeaderCell className="text-center border-l border-white">5 (Integrated Tax)</HeaderCell>
                <HeaderCell className="text-center border-l border-white">6 (Cess)</HeaderCell>
              </tr>
              {["5%", "12%", "18%", "28%", "3%", "0.25%", "0.10%", "Interest", "Late Fee", "Penalty", "Others (please specify)"].map((item, idx) => {
                const isNonTaxable = ['Interest', 'Late Fee', 'Penalty', 'Others (please specify)'].includes(item);
                return (
                  <tr key={`11_${idx}`} className="hover:bg-orange-50/30 transition-colors">
                    <TextCell colSpan={2} className="font-semibold text-slate-700">{item}</TextCell>
                    {isNonTaxable ? <td className="bg-slate-200/50 border-b border-slate-200"></td> : <InputCell />}
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

        {/* Part IV */}
        <SectionCard title="Pt. IV: Reconciliation of Input Tax Credit (ITC)" badge="ITC">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell className="w-12 text-center bg-blue-50 text-blue-700">12</HeaderCell>
                <HeaderCell colSpan={2} className="text-left bg-blue-50 text-blue-700">Reconciliation of Net Input Tax Credit (ITC)</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C', 'D', 'E', 'F'].map((char, idx) => {
                const labels = [
                  "ITC availed as per audited Annual Financial Statement for the State/ UT (For multi-GSTIN units under same PAN this should be derived from books of accounts)",
                  "ITC booked in earlier Financial Years claimed in current Financial Year (+)",
                  "ITC booked in current Financial Year to be claimed in subsequent Financial Years (-)",
                  "ITC availed as per audited financial statements or books of account",
                  "ITC claimed in Annual Return (GSTR9)",
                  "Un-reconciled ITC"
                ];
                return (
                  <tr key={`12${char}`} className={`hover:bg-blue-50/30 transition-colors ${['D','E','F'].includes(char) ? 'bg-slate-50' : ''}`}>
                    <TextCell className={`text-center font-bold ${['D','E','F'].includes(char) ? 'text-slate-800' : 'text-slate-500'}`}>{char}</TextCell>
                    <TextCell className={`${['D','E','F'].includes(char) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{labels[idx]}</TextCell>
                    <InputCell placeholder={['D','E','F'].includes(char) ? '<Auto>' : '0.00'} />
                  </tr>
                );
              })}

              <tr>
                <HeaderCell className="text-center bg-red-50 text-red-700 border-t-2 border-slate-200">13</HeaderCell>
                <HeaderCell colSpan={2} className="text-left bg-red-50 text-red-700 border-t-2 border-slate-200">Reasons for un-reconciled difference in ITC</HeaderCell>
              </tr>
              {['A', 'B', 'C'].map((char) => (
                <tr key={`13${char}`} className="hover:bg-red-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                  <TextCell className="text-slate-600">Reason {char === 'A' ? 1 : char === 'B' ? 2 : 3}</TextCell>
                  <TextInputCell placeholder="<<Text>>" />
                </tr>
              ))}

              <tr>
                <HeaderCell className="text-center bg-blue-50 text-blue-700 border-t-2 border-slate-200">14</HeaderCell>
                <HeaderCell colSpan={3} className="text-left bg-blue-50 text-blue-700 border-t-2 border-slate-200">Reconciliation of ITC declared in Annual Return (GSTR9) with ITC availed on expenses as per audited Annual Financial Statement or books of account</HeaderCell>
              </tr>
              <tr>
                <HeaderCell colSpan={2} className="text-center">Description (1)</HeaderCell>
                <HeaderCell className="text-right w-40">Value (2)</HeaderCell>
                <HeaderCell className="text-right w-40">Amount of Total ITC (3)</HeaderCell>
                <HeaderCell className="text-right w-40">Amount of eligible ITC availed (4)</HeaderCell>
              </tr>
              {['A. Purchases', 'B. Freight / Carriage', 'C. Power and Fuel', 'D. Imported goods (Including received from SEZs)', 'E. Rent and Insurance', 'F. Goods lost, stolen, destroyed, written off or disposed of by way of gift or free samples', 'G. Royalties', 'H. Employees\' Cost (Salaries, wages, Bonus etc.)', 'I. Conveyance charges', 'J. Bank Charges', 'K. Entertainment charges', 'L. Stationery Expenses (including postage etc.)', 'M. Repair and Maintenance', 'N. Other Miscellaneous expenses', 'O. Capital goods', 'P. Any other expense 1', 'Q. Any other expense 2'].map((item) => (
                <tr key={item} className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500 w-12">{item.split('.')[0]}</TextCell>
                  <TextCell className="text-slate-600 font-medium">{item.split('.')[1].trim()}</TextCell>
                  <InputCell />
                  <InputCell />
                  <InputCell />
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <TextCell className="text-center text-slate-800">R</TextCell>
                <TextCell className="text-slate-800">Total amount of eligible ITC availed</TextCell>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <InputCell placeholder="<<Auto>>" />
              </tr>
              <tr className="bg-slate-50 font-bold">
                <TextCell className="text-center text-slate-800">S</TextCell>
                <TextCell className="text-slate-800">ITC claimed in Annual Return (GSTR9)</TextCell>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <InputCell />
              </tr>
              <tr className="bg-slate-50 font-bold">
                <TextCell className="text-center text-slate-800">T</TextCell>
                <TextCell className="text-slate-800">Un-reconciled ITC (ITC 2)</TextCell>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <td className="bg-slate-200/50 border-b border-slate-200"></td>
                <InputCell />
              </tr>

              <tr>
                <HeaderCell className="text-center bg-red-50 text-red-700 border-t-2 border-slate-200">15</HeaderCell>
                <HeaderCell colSpan={4} className="text-left bg-red-50 text-red-700 border-t-2 border-slate-200">Reasons for un - reconciled difference in ITC</HeaderCell>
              </tr>
              {['A', 'B', 'C'].map((char) => (
                <tr key={`15${char}`} className="hover:bg-red-50/30 transition-colors">
                  <TextCell className="text-center font-bold text-slate-500">{char}</TextCell>
                  <TextCell className="text-slate-600">Reason {char === 'A' ? 1 : char === 'B' ? 2 : 3}</TextCell>
                  <TextInputCell colSpan={3} placeholder="<<Text>>" />
                </tr>
              ))}

              <tr>
                <HeaderCell className="text-center bg-orange-50 text-orange-700 border-t-2 border-slate-200">16</HeaderCell>
                <HeaderCell colSpan={4} className="text-left bg-orange-50 text-orange-700 border-t-2 border-slate-200">Tax payable on un-reconciled difference in ITC (due to reasons specified in 13 and 15 above)</HeaderCell>
              </tr>
              <tr>
                <HeaderCell colSpan={2} className="text-center">Description</HeaderCell>
                <HeaderCell colSpan={3} className="text-right">Amount Payable</HeaderCell>
              </tr>
              {['Central Tax', 'State/UT Tax', 'Integrated Tax', 'Cess', 'Interest', 'Penalty'].map((item) => (
                <tr key={`16${item}`} className="hover:bg-orange-50/30 transition-colors">
                  <TextCell colSpan={2} className="font-semibold text-slate-700">{item}</TextCell>
                  <InputCell colSpan={3} />
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Part V */}
        <SectionCard title="Pt. V: Auditor's recommendation on additional Liability due to non-reconciliation" badge="Auditor Rec">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeaderCell className="text-left">Description (1)</HeaderCell>
                <HeaderCell className="text-right">Value (2)</HeaderCell>
                <HeaderCell colSpan={4} className="text-center bg-slate-100 border-l border-white">To be paid through Cash</HeaderCell>
              </tr>
              <tr>
                <HeaderCell className="border-l border-white"></HeaderCell>
                <HeaderCell className="border-l border-white"></HeaderCell>
                <HeaderCell className="text-right border-l border-white">Central tax (3)</HeaderCell>
                <HeaderCell className="text-right border-l border-white">State tax / UT tax (4)</HeaderCell>
                <HeaderCell className="text-right border-l border-white">Integrated tax (5)</HeaderCell>
                <HeaderCell className="text-right border-l border-white">Cess, if applicable (6)</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {["5%", "12%", "18%", "28%", "3%", "0.25%", "0.10%", "Input Tax Credit", "Interest", "Late Fee", "Penalty", "Any other amount paid for supplies not included in Annual Return (GSTR 9)", "Erroneous refund to be paid back", "Outstanding demands to be settled", "Other (Pl. specify)"].map((item) => (
                <tr key={item} className="hover:bg-blue-50/30 transition-colors">
                  <TextCell className="font-semibold text-slate-700">{item}</TextCell>
                  <InputCell />
                  <InputCell />
                  <InputCell />
                  <InputCell />
                  <InputCell />
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        {/* Verification */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-3xl shadow-lg border border-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification
          </h3>
          
          <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
            <p className="text-sm leading-relaxed text-blue-50">
              I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief and nothing has been concealed there from.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Place</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium placeholder:text-blue-200/50" placeholder="Enter Place" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Full address</label>
                <textarea rows={3} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium placeholder:text-blue-200/50" placeholder="Enter Full Address"></textarea>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Name of the signatory</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium uppercase placeholder:text-blue-200/50" placeholder="Enter Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Membership No.</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium uppercase placeholder:text-blue-200/50" placeholder="Enter Membership No." />
              </div>
              <div className="pt-6 border-t border-white/10 mt-6">
                <p className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-2 text-center">**(Signature and stamp/Seal of the Auditor)</p>
                <div className="h-24 bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white/30 text-sm">Upload / Draw Signature</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification of registered person */}
          <h3 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Verification of registered person
          </h3>
          <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
            <p className="text-sm leading-relaxed text-blue-50">
              I hereby solemnly affirm and declare that I am uploading the reconciliation statement in FORM GSTR-9C prepared and duly signed by the Auditor and nothing has been tampered or altered by me in the statement. I am also uploading other statements, as applicable, including financial statement, profit and loss account and balance sheet etc.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Place</label>
                <input type="text" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium placeholder:text-blue-200/50" placeholder="Enter Place" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2">Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:bg-white/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-all outline-none text-white font-medium" />
              </div>
            </div>
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-200 uppercase tracking-wider mb-2 text-left md:text-right">Name of Authorized Signatory</label>
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

export default GSTR9C;
