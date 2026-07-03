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
                <ISDEEMEDPOSITIVE>${isDebit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <AMOUNT>${isDebit ? "-" : ""}${amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    });

    const narration = voucherData.narration || "Imported From Software";
    
    tallyMessages += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${vchTypeName}" ACTION="Create">
            <VOUCHERTYPENAME>${vchTypeName}</VOUCHERTYPENAME>
            <DATE>${voucherDate}</DATE>
            <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <PARTYNAME>${partyLedgerName}</PARTYNAME>
            <PARTYLEDGERNAME>${partyLedgerName}</PARTYLEDGERNAME>
            <NARRATION>${narration}</NARRATION>${ledgerEntriesXml}
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
        <REPORTNAME>Vouchers</REPORTNAME>
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
