export const generateJournalXmlContent = (voucherData: any, companyName: string, ledgers: any[]) => {
  return generateBulkJournalXmlContent([voucherData], companyName, ledgers);
};

export const generateBulkJournalXmlContent = (vouchersData: any[], companyName: string, ledgers: any[]) => {
  const formatTallyDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };

  let tallyMessages = "";

  for (const voucherData of vouchersData) {
    const voucherDate = formatTallyDate(voucherData.date);
    const guid = voucherData.guid || `voucher-${voucherData.id}`;
    const voucherNumber = voucherData.number || voucherData.id;
    const vchTypeName = voucherData.voucherTypeName || voucherData.type || "Journal";

    const entries = voucherData.entries || [];
    let ledgerEntriesXml = "";

    let partyLedgerName = "";
    
    // In Journal, we can pick the first credit entry as the party name, or the first debit if no credit
    const creditEntry = entries.find((e: any) => e.type === "credit");
    const debitEntry = entries.find((e: any) => e.type === "debit");
    const targetEntry = creditEntry || debitEntry;
    
    if (targetEntry) {
      const pLedger = ledgers.find((l: any) => String(l.id) === String(targetEntry.ledgerId || targetEntry.ledger_id));
      partyLedgerName = pLedger?.name || "Unknown Party";
    } else {
      partyLedgerName = "Unknown Party";
    }

    entries.forEach((entry: any) => {
      const isDebit = entry.type === "debit";
      const ledger = ledgers.find((l: any) => String(l.id) === String(entry.ledgerId || entry.ledger_id));
      const ledgerName = ledger?.name || "Unknown Ledger";
      const amount = Number(entry.amount) || 0;
      
      ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>${isDebit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${ledgerName}</LEDGERNAME>
   <AMOUNT>${isDebit ? "-" + amount.toFixed(2) : amount.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
    });

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
  <ISINVOICE>No</ISINVOICE>
  <DIFFACTUALQTY>No</DIFFACTUALQTY>
  <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
  <PARTYLEDGERNAME>${partyLedgerName}</PARTYLEDGERNAME>
  <ASPAYSLIP>No</ASPAYSLIP>
  <GUID>${guid}</GUID>
  <ALTERID> ${voucherData.id}</ALTERID>
  <UDF:HARYANAVAT.LIST DESC="\`HARYANAVAT\`">
  </UDF:HARYANAVAT.LIST>${ledgerEntriesXml}
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
