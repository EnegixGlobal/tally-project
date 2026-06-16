export const generatePurchaseXmlContent = (voucherData: any, companyName: string, ledgers: any[]) => {
  return generateBulkPurchaseXmlContent([voucherData], companyName, ledgers);
};

export const generateBulkPurchaseXmlContent = (vouchersData: any[], companyName: string, ledgers: any[]) => {
  // Format date correctly YYYYMMDD
  const formatTallyDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };

  let tallyMessages = "";

  for (const voucherData of vouchersData) {
    const voucherDate = formatTallyDate(voucherData.date);
    const guid = voucherData.guid || `voucher-${voucherData.id}`;
    
    // Find party ledger in ledgers array as fallback
    const partyLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.partyId));
    const partyName = voucherData.partyName || partyLedger?.name || voucherData.party?.name || "";
    
    const narration = voucherData.narration || "";
    const voucherNumber = voucherData.number || voucherData.id;

    // Let's build the ledger entries
    let ledgerEntriesXml = "";
    
    // Credit the party
    ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${partyName}</LEDGERNAME>
   <AMOUNT>${voucherData.total}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  `;

    // Debit the purchase ledger
    // Debit the purchase ledger
    const mode = voucherData.mode || "item-invoice";
    const entries = voucherData.entries || voucherData.items || [];
    
    if (mode === "accounting-invoice") {
      // In accounting mode, entries are ledger entries, not items
      entries.forEach((entry: any) => {
        if (entry.entryType === "debit" || Number(entry.amount) > 0) {
          const ledgerObj = ledgers.find((l: any) => String(l.id) === String(entry.ledgerId));
          const ledgerName = ledgerObj?.name || "Purchase A/c";
          const amt = Number(entry.amount) || 0;
          
          ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${ledgerName}</LEDGERNAME>
   <AMOUNT>-${amt.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
        }
      });
    } else {
      // Item invoice mode
      const items = entries;
      if (items.length > 0) {
        // Group items by purchase ledger
        const purchaseLedgerGroups: Record<string, { amount: number; xml: string; name: string }> = {};

        items.forEach((item: any) => {
          // Find purchase ledger name
          const pLedgerId = item.purchaseLedgerId || voucherData.purchaseLedgerId;
          const pLedger = ledgers.find((l: any) => String(l.id) === String(pLedgerId));
          const pLedgerName = pLedger?.name || "Purchase A/c";

          if (!purchaseLedgerGroups[pLedgerName]) {
            purchaseLedgerGroups[pLedgerName] = { amount: 0, xml: "", name: pLedgerName };
          }

          const amount = Number(item.amount) || 0;
          purchaseLedgerGroups[pLedgerName].amount += amount;
          const rate = item.rate || 0;
          const qty = item.quantity || 0;
          const unit = item.unit || "nos";
          
          purchaseLedgerGroups[pLedgerName].xml += `
   <INVENTORYALLOCATIONS.LIST>
    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
    <STOCKITEMNAME>${item.itemName || item.item?.name || item.name || ""}</STOCKITEMNAME>
    <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
    <ACTUALQTY> ${qty} ${unit}</ACTUALQTY>
    <BILLEDQTY> ${qty} ${unit}</BILLEDQTY>
    <RATE>${rate}/${unit}</RATE>
    <BATCHALLOCATIONS.LIST>
     <TRACKINGNUMBER/>
     <BATCHNAME>Primary Batch</BATCHNAME>
     <GODOWNNAME>Main Location</GODOWNNAME>
     <MFDON>${voucherDate}</MFDON>
     <EXPIRYPERIOD/>
     <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
     <ACTUALQTY> ${qty} ${unit}</ACTUALQTY>
     <BILLEDQTY> ${qty} ${unit}</BILLEDQTY>
     <ORDERNO/>
    </BATCHALLOCATIONS.LIST>
   </INVENTORYALLOCATIONS.LIST>`;
        });

        // Add ALLLEDGERENTRIES for each purchase ledger group
        for (const group of Object.values(purchaseLedgerGroups)) {
          if (group.amount > 0) {
            ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${group.name}</LEDGERNAME>
   <AMOUNT>-${group.amount.toFixed(2)}</AMOUNT>${group.xml}
  </ALLLEDGERENTRIES.LIST>`;
          }
        }
      } else {
        // If no items, just add ledger entry
        const pLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.purchaseLedgerId));
        const pLedgerName = pLedger?.name || "Purchase A/c";
        
        ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>${pLedgerName}</LEDGERNAME>
   <AMOUNT>-${Number(voucherData.subtotal).toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
      }
    }

    // Taxes
    const cgst = Number(voucherData.cgstTotal) || 0;
    if (cgst > 0) {
      ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>CGST</LEDGERNAME>
   <AMOUNT>-${cgst.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
    }

    const sgst = Number(voucherData.sgstTotal) || 0;
    if (sgst > 0) {
      ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>SGST</LEDGERNAME>
   <AMOUNT>-${sgst.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
    }
    
    const igst = Number(voucherData.igstTotal) || 0;
    if (igst > 0) {
      ledgerEntriesXml += `
  <ALLLEDGERENTRIES.LIST>
   <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
   <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
   <LEDGERFROMITEM>No</LEDGERFROMITEM>
   <LEDGERNAME>IGST</LEDGERNAME>
   <AMOUNT>-${igst.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>`;
    }

    tallyMessages += `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
 <VOUCHER REMOTEID="${guid}" VCHTYPE="Purchase" ACTION="Create">
  <ISOPTIONAL>No</ISOPTIONAL>
  <USEFORGAINLOSS>No</USEFORGAINLOSS>
  <USEFORCOMPOUND>No</USEFORCOMPOUND>
  <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
  <DATE>${voucherDate}</DATE>
  <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
  <ISCANCELLED>No</ISCANCELLED>
  <USETRACKINGNUMBER>No</USETRACKINGNUMBER>
  <ISPOSTDATED>No</ISPOSTDATED>
  <ISINVOICE>No</ISINVOICE>
  <DIFFACTUALQTY>No</DIFFACTUALQTY>
  <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
  <PARTYNAME>${partyName}</PARTYNAME>
  <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
  <NARRATION>${narration}</NARRATION>
  <ASPAYSLIP>No</ASPAYSLIP>
  <GUID>${guid}</GUID>
  <ALTERID> ${voucherData.id}</ALTERID>${ledgerEntriesXml}
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
