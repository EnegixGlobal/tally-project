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
    
    // Find party ledger in ledgers array as fallback
    const partyLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.partyId));
    const partyName = voucherData.partyName || partyLedger?.name || voucherData.party?.name || "";
    
    const narration = voucherData.narration || "Imported From Software";
    const voucherNumber = voucherData.number || voucherData.id;

    // Let's build the ledger entries
    let ledgerEntriesXml = "";
    
    // Credit the party
    ledgerEntriesXml += `
            <!-- Party Ledger -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${partyName}</LEDGERNAME>
                <AMOUNT>${voucherData.total}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    // Detect mode and entries
    const rawEntries = voucherData.entries || voucherData.items || [];
    const isItemInvoice = voucherData.mode === "item-invoice" || (!voucherData.mode && rawEntries.some((e: any) => e.itemId));
    const items = isItemInvoice ? rawEntries : [];
    const accEntries = isItemInvoice ? [] : rawEntries;
    
    if (!isItemInvoice) {
      // Accounting Invoice mode: Use accEntries directly
      accEntries.forEach((entry: any) => {
        // Skip party ledger to avoid duplicate since we already generated it above
        if (String(entry.ledgerId) === String(voucherData.partyId)) {
          return;
        }
        
        if (entry.entryType === "debit" || Number(entry.amount) > 0) {
          const ledgerObj = ledgers.find((l: any) => String(l.id) === String(entry.ledgerId));
          const ledgerName = ledgerObj?.name || "Purchase A/c";
          const amt = Number(entry.amount) || 0;
          
          ledgerEntriesXml += `
            <!-- Purchase -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <AMOUNT>-${amt.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
        }
      });
    } else {
      // Item invoice mode
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
            <!-- Purchase -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${group.name}</LEDGERNAME>
                <AMOUNT>-${group.amount.toFixed(2)}</AMOUNT>${group.xml}
            </ALLLEDGERENTRIES.LIST>`;
          }
        }
      } else {
        // Fallback if no items but mode is item-invoice
        const pLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.purchaseLedgerId));
        const pLedgerName = pLedger?.name || "Purchase A/c";
        
        ledgerEntriesXml += `
            <!-- Purchase -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${pLedgerName}</LEDGERNAME>
                <AMOUNT>-${Number(voucherData.subtotal).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }
    }

    // Taxes (Only for item-invoice, as accounting-invoice handles it via entries)
    if (isItemInvoice && items.length > 0) {
      let cgstName = "Cgst";
      let sgstName = "Sgst";
      let igstName = "Igst";
      
      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;
      
      for (const item of items) {
        if (item.cgstRate) cgstRate = Number(item.cgstRate);
        if (item.sgstRate) sgstRate = Number(item.sgstRate);
        if (item.igstRate) igstRate = Number(item.igstRate);

        if (item.cgstLedgerId && cgstName === "Cgst") {
          const l = ledgers.find((ld: any) => String(ld.id) === String(item.cgstLedgerId));
          if (l) cgstName = l.name;
        }
        if (item.sgstLedgerId && sgstName === "Sgst") {
          const l = ledgers.find((ld: any) => String(ld.id) === String(item.sgstLedgerId));
          if (l) sgstName = l.name;
        }
        if (item.igstLedgerId && igstName === "Igst") {
          const l = ledgers.find((ld: any) => String(ld.id) === String(item.igstLedgerId));
          if (l) igstName = l.name;
        }
      }
      
      if (cgstRate === 0 && Number(voucherData.cgstTotal) > 0 && Number(voucherData.subtotal) > 0) {
        cgstRate = Math.round((Number(voucherData.cgstTotal) / Number(voucherData.subtotal)) * 100);
      }
      if (sgstRate === 0 && Number(voucherData.sgstTotal) > 0 && Number(voucherData.subtotal) > 0) {
        sgstRate = Math.round((Number(voucherData.sgstTotal) / Number(voucherData.subtotal)) * 100);
      }
      if (igstRate === 0 && Number(voucherData.igstTotal) > 0 && Number(voucherData.subtotal) > 0) {
        igstRate = Math.round((Number(voucherData.igstTotal) / Number(voucherData.subtotal)) * 100);
      }
      
      if (cgstName === "Cgst" && cgstRate > 0) {
        const match = ledgers.find((l: any) => l.name.toLowerCase().includes('cgst') && l.name.includes(String(cgstRate)));
        cgstName = match ? match.name : `${cgstRate}% Cgst`;
      }
      if (sgstName === "Sgst" && sgstRate > 0) {
        const match = ledgers.find((l: any) => l.name.toLowerCase().includes('sgst') && l.name.includes(String(sgstRate)));
        sgstName = match ? match.name : `${sgstRate}% Sgst`;
      }
      if (igstName === "Igst" && igstRate > 0) {
        const match = ledgers.find((l: any) => l.name.toLowerCase().includes('igst') && l.name.includes(String(igstRate)));
        igstName = match ? match.name : `${igstRate}% Igst`;
      }

      const cgst = Number(voucherData.cgstTotal) || 0;
      if (cgst > 0) {
        ledgerEntriesXml += `
            <!-- CGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${cgstName}</LEDGERNAME>
                <AMOUNT>-${cgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }

      const sgst = Number(voucherData.sgstTotal) || 0;
      if (sgst > 0) {
        ledgerEntriesXml += `
            <!-- SGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${sgstName}</LEDGERNAME>
                <AMOUNT>-${sgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }
      
      const igst = Number(voucherData.igstTotal) || 0;
      if (igst > 0) {
        ledgerEntriesXml += `
            <!-- IGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${igstName}</LEDGERNAME>
                <AMOUNT>-${igst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
      }
    } // Closes if (isItemInvoice && items.length > 0)
    // Duplicate narration declaration removed
    tallyMessages += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <DATE>${voucherDate}</DATE>
            <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <PARTYNAME>${partyName}</PARTYNAME>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
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

