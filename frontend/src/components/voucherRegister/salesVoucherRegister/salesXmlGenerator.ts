export const generateSalesXmlContent = (voucherData: any, companyName: string, ledgers: any[]) => {
  return generateBulkSalesXmlContent([voucherData], companyName, ledgers);
};

export const generateBulkSalesXmlContent = (vouchersData: any[], companyName: string, ledgers: any[]) => {
  const formatTallyDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatTallyDateTime = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} at ${hours}:${mins}`;
  };

  let tallyMessages = "";

  for (const voucherData of vouchersData) {
    const voucherDate = formatTallyDate(voucherData.date);
    const voucherDateTime = formatTallyDateTime(voucherData.date);
    const guid = voucherData.guid || `voucher-${voucherData.id}`;
    
    // Find party ledger in ledgers array
    const partyLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.partyId || voucherData.customerId));
    const partyName = partyLedger?.name || voucherData.partyName || voucherData.customerName || "Cash";
    
    // Find Sales Ledger
    const salesLedgerIdObj = ledgers.find((l: any) => String(l.id) === String(voucherData.salesLedgerId || voucherData.salesLedger));
    const salesLedgerName = salesLedgerIdObj?.name || "Sales A/c";

    const voucherNumber = voucherData.number || voucherData.id;
    const vchTypeName = voucherData.voucherTypeName || "Sales";

    // Party Debit Entry
    let ledgerEntriesXml = `
  <LEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${partyName}</LEDGERNAME>
   <AMOUNT>-${Number(voucherData.total).toFixed(2)}</AMOUNT>
  </LEDGERENTRIES.LIST>`;

    // Tax Credit Entries
    const cgst = Number(voucherData.cgstTotal) || 0;
    if (cgst > 0) {
      ledgerEntriesXml += `
  <LEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>CGST</LEDGERNAME>
   <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
  </LEDGERENTRIES.LIST>`;
    }

    const sgst = Number(voucherData.sgstTotal) || 0;
    if (sgst > 0) {
      ledgerEntriesXml += `
  <LEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>SGST</LEDGERNAME>
   <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
  </LEDGERENTRIES.LIST>`;
    }
    
    const igst = Number(voucherData.igstTotal) || 0;
    if (igst > 0) {
      ledgerEntriesXml += `
  <LEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>IGST</LEDGERNAME>
   <AMOUNT>${igst.toFixed(2)}</AMOUNT>
  </LEDGERENTRIES.LIST>`;
    }

    // Inventory Entries
    let inventoryEntriesXml = "";
    const items = voucherData.items || [];
    
    if (items.length > 0) {
      items.forEach((item: any) => {
        const amount = Number(item.amount) || 0;
        const rate = item.rate || 0;
        const qty = item.quantity || 0;
        const unit = item.unit || "nos";
        const itemName = item.itemName || item.item?.name || "";
        
        inventoryEntriesXml += `
  <ALLINVENTORYENTRIES.LIST>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <STOCKITEMNAME>${itemName}</STOCKITEMNAME>
   <AMOUNT>${amount.toFixed(2)}</AMOUNT>
   <ACTUALQTY> ${qty} ${unit}</ACTUALQTY>
   <BILLEDQTY> ${qty} ${unit}</BILLEDQTY>
   <RATE>${rate}/${unit}</RATE>
   <ACCOUNTINGALLOCATIONS.LIST>
    <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <LEDGERFROMITEM>No</LEDGERFROMITEM>
    <LEDGERNAME>${salesLedgerName}</LEDGERNAME>
    <AMOUNT>${amount.toFixed(2)}</AMOUNT>
   </ACCOUNTINGALLOCATIONS.LIST>
   <BATCHALLOCATIONS.LIST>
    <TRACKINGNUMBER/>
    <BATCHNAME>Primary Batch</BATCHNAME>
    <GODOWNNAME>Main Location</GODOWNNAME>
    <MFDON>${voucherDate}</MFDON>
    <EXPIRYPERIOD/>
    <AMOUNT>${amount.toFixed(2)}</AMOUNT>
    <ACTUALQTY> ${qty} ${unit}</ACTUALQTY>
    <BILLEDQTY> ${qty} ${unit}</BILLEDQTY>
    <ORDERNO/>
   </BATCHALLOCATIONS.LIST>
  </ALLINVENTORYENTRIES.LIST>`;
      });
    } else {
        // If no items, we must credit sales in ledger entries instead
        ledgerEntriesXml += `
  <LEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${salesLedgerName}</LEDGERNAME>
   <AMOUNT>${Number(voucherData.subtotal).toFixed(2)}</AMOUNT>
  </LEDGERENTRIES.LIST>`;
    }

    tallyMessages += `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
 <VOUCHER REMOTEID="${guid}" VCHTYPE="${vchTypeName}" ACTION="Create">
  <ISOPTIONAL>No</ISOPTIONAL>
  <USEFORGAINLOSS>No</USEFORGAINLOSS>
  <USEFORCOMPOUND>No</USEFORCOMPOUND>
  <VOUCHERTYPENAME>${vchTypeName}</VOUCHERTYPENAME>
  <DATE>${voucherDate}</DATE>
  <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
  <ISCANCELLED>No</ISCANCELLED>
  <USETRACKINGNUMBER>No</USETRACKINGNUMBER>
  <ISPOSTDATED>No</ISPOSTDATED>
  <ISINVOICE>Yes</ISINVOICE>
  <DIFFACTUALQTY>No</DIFFACTUALQTY>
  <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
  <PARTYNAME>${partyName}</PARTYNAME>
  <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
  <ASPAYSLIP>No</ASPAYSLIP>
  <GUID>${guid}</GUID>
  <ALTERID> ${voucherData.id}</ALTERID>
  <UDF:HARYANAVAT.LIST DESC="\`HARYANAVAT\`">
  </UDF:HARYANAVAT.LIST>${ledgerEntriesXml}${inventoryEntriesXml}
  <UDF:BUYERNAME.LIST DESC="\`BUYERNAME\`" ISLIST="YES">
    <UDF:BUYERNAME DESC="\`BUYERNAME\`">${partyName}</UDF:BUYERNAME>
  </UDF:BUYERNAME.LIST>
  <UDF:DATETIMEOFINVOICE.LIST DESC="\`DATETIMEOFINVOICE\`" ISLIST="YES">
    <UDF:DATETIMEOFINVOICE DESC="\`DATETIMEOFINVOICE\`">${voucherDateTime}</UDF:DATETIMEOFINVOICE>
  </UDF:DATETIMEOFINVOICE.LIST>
  <UDF:DATETIMEOFREMOVAL.LIST DESC="\`DATETIMEOFREMOVAL\`" ISLIST="YES">
    <UDF:DATETIMEOFREMOVAL DESC="\`DATETIMEOFREMOVAL\`">${voucherDateTime}</UDF:DATETIMEOFREMOVAL>
  </UDF:DATETIMEOFREMOVAL.LIST>
  <UDF:BASEPARTYNAME.LIST DESC="\`BASEPARTYNAME\`" ISLIST="YES">
    <UDF:BASEPARTYNAME DESC="\`BASEPARTYNAME\`">${partyName}</UDF:BASEPARTYNAME>
  </UDF:BASEPARTYNAME.LIST>
 </VOUCHER>
</TALLYMESSAGE>`;
  }

  return `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Import Data</TALLYREQUEST>
</HEADER>
<BODY>
<IMPORTDATA>
<REQUESTDESC>
<REPORTNAME>All Masters</REPORTNAME>
<STATICVARIABLES>
<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
</STATICVARIABLES>
</REQUESTDESC>
<REQUESTDATA>${tallyMessages}
</REQUESTDATA>
</IMPORTDATA>
</BODY>
</ENVELOPE>`;
};
