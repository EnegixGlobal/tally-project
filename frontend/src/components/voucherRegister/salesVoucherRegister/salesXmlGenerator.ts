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
    
    // Find party ledger in ledgers array
    const partyLedger = ledgers.find((l: any) => String(l.id) === String(voucherData.partyId || voucherData.customerId));
    const partyName = voucherData.partyName || partyLedger?.name || voucherData.customerName || "Cash";
    
    // Find Sales Ledger
    const salesLedgerIdObj = ledgers.find((l: any) => String(l.id) === String(voucherData.salesLedgerId || voucherData.salesLedger));
    const salesLedgerName = salesLedgerIdObj?.name || "Sales A/c";

    const voucherNumber = voucherData.number || voucherData.id;
    const vchTypeName = voucherData.voucherTypeName || "Sales";

    // Party Debit Entry
    let ledgerEntriesXml = `
            <!-- Party Ledger -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${partyName}</LEDGERNAME>
                <AMOUNT>-${Number(voucherData.total).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;

    const rawEntries = voucherData.entries || [];
    const isItemInvoice = voucherData.mode === "item-invoice" || (!voucherData.mode && rawEntries.some((e: any) => e.itemId));
    const items = isItemInvoice ? rawEntries : [];
    const accEntries = isItemInvoice ? [] : rawEntries;

    // Tax Credit Entries
    let cgstName = "Cgst";
    let sgstName = "Sgst";
    let igstName = "Igst";
    
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    
    const allEntries = rawEntries;
    for (const item of allEntries) {
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
      
      // Also try to find by ledgerId for accounting mode
      if (item.ledgerId) {
        const l = ledgers.find((ld: any) => String(ld.id) === String(item.ledgerId));
        if (l) {
          if (l.name.toLowerCase().includes('cgst') && cgstName === "Cgst") cgstName = l.name;
          if (l.name.toLowerCase().includes('sgst') && sgstName === "Sgst") sgstName = l.name;
          if (l.name.toLowerCase().includes('igst') && igstName === "Igst") igstName = l.name;
        }
      }
    }
    
    // Fallback: calculate rate from amounts if still zero
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
    
    // Tax Credit Entries (Only for item-invoice, as accounting-invoice handles it via entries)
    if (items.length > 0) {
      const cgst = Number(voucherData.cgstTotal) || 0;
      if (cgst > 0) {
      ledgerEntriesXml += `
            <!-- CGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${cgstName}</LEDGERNAME>
                <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    }

    const sgst = Number(voucherData.sgstTotal) || 0;
    if (sgst > 0) {
      ledgerEntriesXml += `
            <!-- SGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${sgstName}</LEDGERNAME>
                <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    }
    
    const igst = Number(voucherData.igstTotal) || 0;
    if (igst > 0) {
      ledgerEntriesXml += `
            <!-- IGST -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${igstName}</LEDGERNAME>
                <AMOUNT>${igst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    }
    } // End of if (items.length > 0)

    // Inventory Entries
    let inventoryEntriesXml = "";
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
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
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
        // Accounting Invoice mode: Use accEntries directly
        accEntries.forEach((entry: any) => {
            const l = ledgers.find((ld: any) => String(ld.id) === String(entry.ledgerId));
            const lName = l?.name || "Unknown Ledger";
            if (lName === partyName) return; // Party is already handled

            const isDebit = entry.entryType === 'debit' || entry.type === 'debit';
            const amt = Number(entry.amount) || 0;
            
            ledgerEntriesXml += `
            <!-- Accounting Entry -->
            <ALLLEDGERENTRIES.LIST>
                <ISDEEMEDPOSITIVE>${isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
                <LEDGERNAME>${lName}</LEDGERNAME>
                <AMOUNT>${isDebit ? '-' : ''}${amt.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
        });
    }

    tallyMessages += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${vchTypeName}" ACTION="Create">
            <VOUCHERTYPENAME>${vchTypeName}</VOUCHERTYPENAME>
            <DATE>${voucherDate}</DATE>
            <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <PARTYNAME>${partyName}</PARTYNAME>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <NARRATION>Imported From Software</NARRATION>${ledgerEntriesXml}${inventoryEntriesXml}
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
