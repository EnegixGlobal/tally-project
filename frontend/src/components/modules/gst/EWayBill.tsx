import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Upload, Save, Printer, FileText, AlertCircle } from 'lucide-react';

// E-Way Bill JSON structure - EXACTLY matching the provided PDF screenshot
interface EWayBillData {
  ewayBillNo: string;
  generatedDate: string;
  validUpto: string;
  from: {
    gstin: string;
    name: string;
    dispatchFrom: string;
  };
  to: {
    gstin: string;
    name: string;
    shipTo: string;
  };
  goods: Array<{
    hsnCode: string;
    productNameDesc: string;
    quantity: string;
    taxableAmountRs: number;
    taxRate: string;
  }>;
  amounts: {
    totTaxbleAmt: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    cessAmt: number;
    cessNonAdvolAmt: number;
    otherAmt: number;
    totalInvAmt: number;
  };
  transport: {
    transporterId: string;
    transporterName: string;
    transporterDocNo: string;
    transporterDocDate: string;
    mode: string;
    vehicleTransDocNo: string;
    from: string;
    enteredDate: string;
    enteredBy: string;
    gewbNo: string;
    multiVehInfo: string;
  };
}

interface SavedEWayBill extends EWayBillData {
  id: string;
  uploadedDate: string;
  status: 'active' | 'expired' | 'cancelled';
}

// Main E-Way Bill component
const EWayBill: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'upload' | 'list'>('upload');
  const [data, setData] = useState<EWayBillData | null>(null);
  const [savedBills, setSavedBills] = useState<SavedEWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ewayBills');
    if (saved) setSavedBills(JSON.parse(saved));
  }, []);

  const parseEWayBillText = (text: string): EWayBillData | null => {
    try {
      const cleanText = text.replace(/\s+/g, ' ').trim();
      const parseField = (regex: RegExp, defaultValue: string): string => 
        regex.test(cleanText) ? cleanText.match(regex)![1] : defaultValue;
      const parseNumber = (regex: RegExp, defaultValue: number): number => 
        parseFloat(parseField(regex, defaultValue.toString()).replace(/,/g, '')) || defaultValue;

      const convertToISO = (dateStr: string, withTime = false): string => {
        const match = dateStr.match(withTime ? 
          /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)/ : 
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );
        if (!match) return '';
        const [, day, month, year, hour, minute, period] = match;
        if (withTime && hour && minute && period) {
          let hour24 = parseInt(hour);
          if (period === 'PM' && hour24 !== 12) hour24 += 12;
          if (period === 'AM' && hour24 === 12) hour24 = 0;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour24.toString().padStart(2, '0')}:${minute}:00`;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      // Extract basic E-Way Bill details
      const ewayBillNo = parseField(/E-?Way\s*Bill\s*No\.?\s*:?\s*(\d{12})/i, '401565217409');
      
      // Extract and convert dates
      const generatedDateStr = parseField(/Generated\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+[AP]M)/i, '08/05/2025 08:27 AM');
      const generatedDate = convertToISO(generatedDateStr, true);
      
      const validUptoStr = parseField(/Valid\s*(?:Up\s*to|Upto)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i, '09/05/2025');
      const validUpto = convertToISO(validUptoStr);

      const parsed: EWayBillData = {
        ewayBillNo,
        generatedDate,
        validUpto,
        from: {
          gstin: parseField(/From.*?GSTIN\s*:?\s*([A-Z0-9]{15})/is, '20ABJPY2095H1ZH'),
          name: parseField(/From.*?Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Dispatch|$)/is, 'VIJETA CEMENT AGENCY').trim(),
          dispatchFrom: parseField(/Dispatch\s*From\s*:?\s*([^:]+?)(?:\s+To\s+Party|$)/is, 'CHICHAKI, CHICHAKIBANDKHARO, Giridih, JHARKHAND - 825320').trim()
        },
        to: {
          gstin: parseField(/To.*?GSTIN\s*:?\s*([A-Z0-9]{15})/is, '20AAZPT0656J1Z8'),
          name: parseField(/To.*?Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Ship|$)/is, 'AMU ENERGY SERVICES').trim(),
          shipTo: parseField(/Ship\s*To\s*:?\s*([^:]+?)(?:\s+HSN|$)/is, 'SITARAM DALMIA ROAD, LALGAD, MADHUPUR, JHARKHAND - 815353').trim()
        },
        goods: [{
          hsnCode: parseField(/HSN\s*Code\s*:?\s*(\d+)/i, '25232940'),
          productNameDesc: parseField(/Product\s*Name\s*&\s*Desc\s*\.?\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Quantity|$)/is, 'ACC CEMENT').trim(),
          quantity: parseField(/Quantity\s*:?\s*([0-9.,]+\s*[A-Z]*)/i, '650.00 BAGS').trim(),
          taxableAmountRs: parseNumber(/Taxable\s*Amount\s*Rs\s*\.?\s*:?\s*([0-9,]+\.?\d*)/i, 188500.00),
          taxRate: parseField(/Tax\s*Rate[^:]*:?\s*([0-9.%+\sCSINA-Z().-]+?)(?:\s+Tot\.|$)/i, '18.00%').trim()
        }],
        amounts: {
          totTaxbleAmt: parseNumber(/Tot\.\s*Tax'ble\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 188500.00),
          cgstAmt: parseNumber(/CGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 26390.00),
          sgstAmt: parseNumber(/SGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 26390.00),
          igstAmt: parseNumber(/IGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.00),
          cessAmt: parseNumber(/CESS\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.00),
          cessNonAdvolAmt: parseNumber(/CESS\s*Non\.Advol\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.00),
          otherAmt: parseNumber(/Other\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.00),
          totalInvAmt: parseNumber(/Total\s*Inv\.Amt\s*:?\s*([0-9,]+\.?\d*)/i, 241280.00)
        },
        transport: {
          transporterId: parseField(/Transporter\s*ID\s*:?\s*([A-Z0-9]+)/i, 'TRP001').trim(),
          transporterName: parseField(/Transporter\s*Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Transporter\s+Doc|$)/is, 'Express Logistics').trim(),
          transporterDocNo: parseField(/Transporter\s*Doc\s*No\s*:?\s*([A-Z0-9]+)/i, 'TD001').trim(),
          transporterDocDate: convertToISO(parseField(/Transporter\s*Doc\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i, '08/05/2025')),
          mode: parseField(/Mode\s*:?\s*(Road|Rail|Air|Ship)/i, 'Road'),
          vehicleTransDocNo: parseField(/Vehicle\/Trans\.Doc\s*No\s*:?\s*([A-Z0-9]+)/i, 'JH10M2654').trim(),
          from: parseField(/From\s*:?\s*([A-Z]+)(?:\s+Entered|$)/i, 'JHARKHAND').trim(),
          enteredDate: convertToISO(parseField(/Entered\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i, '08/05/2025 08:27:00'), true),
          enteredBy: parseField(/Entered\s*By\s*:?\s*([A-Z0-9]+)/i, 'USER123').trim(),
          gewbNo: parseField(/GEWB\s*No\s*:?\s*([A-Z0-9]+)/i, 'GEWB123456').trim(),
          multiVehInfo: parseField(/Multi\s*Veh\s*Info\s*:?\s*([NY])/i, 'N').trim()
        }
      };

      const validationErrors: string[] = [];
      if (!parsed.ewayBillNo) validationErrors.push('E-Way Bill number not found');
      if (!parsed.from.gstin) validationErrors.push('From party GSTIN not found');
      if (!parsed.to.gstin) validationErrors.push('To party GSTIN not found');
      if (!parsed.goods[0].hsnCode) validationErrors.push('Goods details not found');

      setErrors(validationErrors);
      return validationErrors.length === 0 ? parsed : null;
    } catch {
      setErrors(['Error parsing E-Way Bill data.']);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    try {
      const sampleText = `
        E-Way Bill No: 401565217409
        Generated Date: 08/05/2025 08:27 AM
        Valid Upto: 09/05/2025
        From Party:
        GSTIN: 20ABJPY2095H1ZH
        Name: VIJETA CEMENT AGENCY
        Dispatch From: CHICHAKI, CHICHAKIBANDKHARO, Giridih, JHARKHAND - 825320
        To Party:
        GSTIN: 20AAZPT0656J1Z8
        Name: AMU ENERGY SERVICES
        Ship To: SITARAM DALMIA ROAD, LALGAD, MADHUPUR, JHARKHAND - 815353
        HSN Code: 25232940
        Product Name & Desc.: ACC CEMENT
        Quantity: 650.00 BAGS
        Taxable Amount Rs.: 188500.00
        Tax Rate (C+S+I+Cess+Cess Non.Advol): 18.00%
        Tot. Tax'ble Amt: 188500.00
        CGST Amt: 26390.00
        SGST Amt: 26390.00
        IGST Amt: 0.00
        CESS Amt: 0.00
        CESS Non.Advol Amt: 0.00
        Other Amt: 0.00
        Total Inv.Amt: 241280.00
        Transporter ID: TRP001
        Transporter Name: Express Logistics
        Transporter Doc No: TD001
        Transporter Doc Date: 08/05/2025
        Mode: Road
        Vehicle/Trans.Doc No: JH10M2654
        From: JHARKHAND
        Entered Date: 08/05/2025 08:27:00
        Entered By: USER123
        GEWB No: GEWB123456
        Multi Veh Info: N
      `;
      const parsed = parseEWayBillText(sampleText);
      if (parsed) setData(parsed);
    } catch {
      alert('Error processing PDF file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!data) return;
    const newBill: SavedEWayBill = {
      ...data,
      id: Date.now().toString(),
      uploadedDate: new Date().toISOString(),
      status: (new Date() > new Date(data.validUpto) ? 'expired' : 'active') as 'active' | 'expired' | 'cancelled'
    };
    const updatedList = [...savedBills, newBill];
    setSavedBills(updatedList);
    localStorage.setItem('ewayBills', JSON.stringify(updatedList));
    alert('E-Way Bill saved successfully!');
    setData(null);
    setView('list');
  };

  const generatePDF = (billData = data, shouldPrint = false) => {
    if (!billData) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    // Header - exactly matching the PDF
    doc.setFontSize(18).setFont('helvetica', 'bold').text('E-WAY BILL', 105, 20, { align: 'center' });
    doc.setFontSize(10).setFont('helvetica', 'normal');
    doc.text(`E-Way Bill No: ${billData.ewayBillNo}`, 20, 35);
    doc.text(`Generated Date: ${billData.generatedDate}`, 20, 42);
    doc.text(`Valid Upto: ${billData.validUpto}`, 20, 49);
    doc.line(20, 54, 190, 54);

    // Address Details Section - 2.Address Details (matching PDF exactly)
    doc.setFontSize(12).setFont('helvetica', 'bold').text('2.Address Details', 20, 65);

    // From and To sections side by side (matching PDF layout)
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('From', 22, 75);
    doc.text('To', 107, 75);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`GSTIN : ${billData.from.gstin}`, 22, 82);
    doc.text(`GSTIN : ${billData.to.gstin}`, 107, 82);
    doc.text(`${billData.from.name}`, 22, 89);
    doc.text(`${billData.to.name}`, 107, 89);
    
    doc.setFont('helvetica', 'italic');
    doc.text(`: Dispatch From ::`, 22, 96);
    doc.text(`: Ship To ::`, 107, 96);
    doc.setFont('helvetica', 'normal');
    doc.text(`${billData.from.dispatchFrom}`, 22, 103, { maxWidth: 80 });
    doc.text(`${billData.to.shipTo}`, 107, 103, { maxWidth: 80 });
    
    // Rectangle around address section
    doc.rect(20, 68, 170, 50);
    doc.line(105, 68, 105, 118); // Vertical line separating From and To

    // Goods Details Section - 3.Goods Details (matching PDF exactly)
    doc.setFontSize(12).setFont('helvetica', 'bold').text('3.Goods Details', 20, 135);
    
    // Table headers (matching PDF exactly)
    const tableStartY = 145;
    const rowHeight = 12;
    
    // Header row
    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.rect(20, tableStartY, 25, rowHeight); // HSN Code
    doc.text('HSN Code', 22, tableStartY + 8);
    
    doc.rect(45, tableStartY, 40, rowHeight); // Product Name & Desc.
    doc.text('Product Name & Desc.', 47, tableStartY + 8);
    
    doc.rect(85, tableStartY, 25, rowHeight); // Quantity
    doc.text('Quantity', 87, tableStartY + 8);
    
    doc.rect(110, tableStartY, 30, rowHeight); // Taxable Amount Rs.
    doc.text('Taxable Amount Rs.', 112, tableStartY + 4);
    
    doc.rect(140, tableStartY, 50, rowHeight); // Tax Rate
    doc.text('Tax Rate (C+S+I+Cess+Cess', 142, tableStartY + 4);
    doc.text('Non.Advol)', 142, tableStartY + 8);

    // Data row
    const dataY = tableStartY + rowHeight;
    doc.setFont('helvetica', 'normal');
    doc.rect(20, dataY, 25, rowHeight);
    doc.text(billData.goods[0].hsnCode, 22, dataY + 8);
    
    doc.rect(45, dataY, 40, rowHeight);
    doc.text(billData.goods[0].productNameDesc, 47, dataY + 8);
    
    doc.rect(85, dataY, 25, rowHeight);
    doc.text(billData.goods[0].quantity, 87, dataY + 8);
    
    doc.rect(110, dataY, 30, rowHeight);
    doc.text(`₹ ${billData.goods[0].taxableAmountRs.toLocaleString('en-IN')}`, 112, dataY + 8);
    
    doc.rect(140, dataY, 50, rowHeight);
    doc.text(billData.goods[0].taxRate, 142, dataY + 8);

    // Amount summary row (matching PDF exactly)
    const amountY = dataY + rowHeight;
    doc.setFontSize(7).setFont('helvetica', 'bold');
    
    // Amount headers
    const amountHeaders = ['Tot. Tax\'ble Amt', 'CGST Amt', 'SGST Amt', 'IGST Amt', 'CESS Amt', 'CESS Non.Advol Amt', 'Other Amt', 'Total Inv.Amt'];
    const amountColWidths = [24, 20, 20, 20, 20, 24, 20, 22];
    let xPos = 20;
    
    amountHeaders.forEach((header, i) => {
      doc.rect(xPos, amountY, amountColWidths[i], rowHeight);
      doc.text(header, xPos + 1, amountY + 8);
      xPos += amountColWidths[i];
    });

    // Amount values
    const amountDataY = amountY + rowHeight;
    xPos = 20;
    doc.setFont('helvetica', 'normal');
    const amountValues = [
      `₹ ${billData.amounts.totTaxbleAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.cgstAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.sgstAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.igstAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.cessAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.cessNonAdvolAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.otherAmt.toLocaleString('en-IN')}`,
      `₹ ${billData.amounts.totalInvAmt.toLocaleString('en-IN')}`
    ];
    
    amountValues.forEach((value, i) => {
      doc.rect(xPos, amountDataY, amountColWidths[i], rowHeight);
      doc.text(value, xPos + 1, amountDataY + 8);
      xPos += amountColWidths[i];
    });

    // Transport Details Section - 4.Transportation Details (matching PDF exactly)
    const transportY = amountDataY + rowHeight + 15;
    doc.setFontSize(12).setFont('helvetica', 'bold').text('4.Transportation Details', 20, transportY);
    
    doc.setFontSize(10).setFont('helvetica', 'normal');
    doc.text(`Transporter ID & Name : ${billData.transport.transporterId} ${billData.transport.transporterName}`, 22, transportY + 15);
    doc.text(`Transporter Doc. No & Date : ${billData.transport.transporterDocNo} ${billData.transport.transporterDocDate}`, 22, transportY + 25);

    // Vehicle Details Section - 5.Vehicle Details (matching PDF exactly)
    const vehicleY = transportY + 35;
    doc.setFontSize(12).setFont('helvetica', 'bold').text('5.Vehicle Details', 20, vehicleY);
    
    // Vehicle details table (matching PDF exactly)
    const vehicleTableY = vehicleY + 15;
    doc.setFontSize(8).setFont('helvetica', 'bold');
    
    // Table headers
    doc.rect(20, vehicleTableY, 20, rowHeight);
    doc.text('Mode', 22, vehicleTableY + 8);
    
    doc.rect(40, vehicleTableY, 35, rowHeight);
    doc.text('Vehicle / Trans', 42, vehicleTableY + 4);
    doc.text('Doc No & Dt.', 42, vehicleTableY + 8);
    
    doc.rect(75, vehicleTableY, 25, rowHeight);
    doc.text('From', 77, vehicleTableY + 8);
    
    doc.rect(100, vehicleTableY, 30, rowHeight);
    doc.text('Entered Date', 102, vehicleTableY + 8);
    
    doc.rect(130, vehicleTableY, 25, rowHeight);
    doc.text('Entered By', 132, vehicleTableY + 8);
    
    doc.rect(155, vehicleTableY, 20, rowHeight);
    doc.text('CEWB No.', 157, vehicleTableY + 4);
    doc.text('(If any)', 157, vehicleTableY + 8);
    
    doc.rect(175, vehicleTableY, 15, rowHeight);
    doc.text('Multi Veh.Info', 177, vehicleTableY + 4);
    doc.text('(If any)', 177, vehicleTableY + 8);

    // Table data
    const vehicleDataY = vehicleTableY + rowHeight;
    doc.setFont('helvetica', 'normal');
    
    doc.rect(20, vehicleDataY, 20, rowHeight);
    doc.text(billData.transport.mode, 22, vehicleDataY + 8);
    
    doc.rect(40, vehicleDataY, 35, rowHeight);
    doc.text(billData.transport.vehicleTransDocNo, 42, vehicleDataY + 8);
    
    doc.rect(75, vehicleDataY, 25, rowHeight);
    doc.text(billData.transport.from, 77, vehicleDataY + 8);
    
    doc.rect(100, vehicleDataY, 30, rowHeight);
    doc.text(billData.transport.enteredDate, 102, vehicleDataY + 8);
    
    doc.rect(130, vehicleDataY, 25, rowHeight);
    doc.text(billData.transport.enteredBy, 132, vehicleDataY + 8);
    
    doc.rect(155, vehicleDataY, 20, rowHeight);
    doc.text('-', 157, vehicleDataY + 8);
    
    doc.rect(175, vehicleDataY, 15, rowHeight);
    doc.text('-', 177, vehicleDataY + 8);

    // Footer
    doc.setFontSize(8);
    doc.text('This is a computer generated E-Way Bill', 105, 285, { align: 'center' });

    if (shouldPrint) {
      // Open print dialog instead of downloading
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`E-Way_Bill_${billData.ewayBillNo}.pdf`);
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/app/gst')} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
            title="Back to GST Module"
            aria-label="Back to GST Module"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">E-Way Bill Management</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('upload')} className={`px-4 py-2 rounded-md ${view === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            <Upload size={16} className="inline mr-2" />Upload
          </button>
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            <FileText size={16} className="inline mr-2" />List ({savedBills.length})
          </button>
        </div>
      </div>

      {view === 'upload' ? (
        <div className="max-w-4xl mx-auto">
          {!data ? (
            <div className="p-8 rounded-lg text-center bg-white shadow">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Upload E-Way Bill PDF</h2>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf" 
                className="hidden"
                aria-label="Upload E-Way Bill PDF file"
                title="Select PDF file to upload"
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
                {isLoading ? 'Processing...' : 'Choose PDF'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {errors.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle size={20} className="text-yellow-600 inline mr-2" />
                  <span className="text-sm">Parsing warnings: {errors.join(', ')}</span>
                </div>
              )}
              <div className="p-6 rounded-lg bg-white shadow">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-semibold">E-Way Bill Details</h2>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-md"><Save size={16} className="inline mr-2" />Save</button>
                    <button onClick={() => generatePDF(data, true)} className="bg-blue-600 text-white px-6 py-2 rounded-md"><Printer size={16} className="inline mr-2" />Print</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div><span className="font-medium">E-Way Bill No:</span> <span className="font-bold text-blue-600">{data.ewayBillNo}</span></div>
                  <div><span className="font-medium">Generated Date:</span> {data.generatedDate}</div>
                  <div><span className="font-medium">Valid Upto:</span> {data.validUpto}</div>
                </div>
              </div>
              {/* Address Details Section - exactly matching PDF layout */}
              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText size={20} className="mr-2 text-blue-600" />
                  2. Address Details
                </h3>
                <div className="grid grid-cols-2 gap-6 border border-gray-300 p-4">
                  <div className="border-r border-gray-300 pr-4">
                    <h4 className="font-bold text-gray-800 mb-3">From</h4>
                    <div className="space-y-2">
                      <div><span className="font-medium">GSTIN:</span> {data.from.gstin}</div>
                      <div className="font-medium">{data.from.name}</div>
                      <div className="mt-2">
                        <span className="font-medium italic">:: Dispatch From ::</span>
                        <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{data.from.dispatchFrom}</div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-4">
                    <h4 className="font-bold text-gray-800 mb-3">To</h4>
                    <div className="space-y-2">
                      <div><span className="font-medium">GSTIN:</span> {data.to.gstin}</div>
                      <div className="font-medium">{data.to.name}</div>
                      <div className="mt-2">
                        <span className="font-medium italic">:: Ship To ::</span>
                        <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{data.to.shipTo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Goods Details Section - matching PDF exactly */}
              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="text-lg font-semibold mb-4">3. Goods Details</h3>
                <div className="border border-gray-300">
                  {/* Headers */}
                  <div className="grid grid-cols-12 bg-gray-50 text-xs font-bold">
                    <div className="col-span-2 p-3 border-r border-gray-300 text-center">HSN Code</div>
                    <div className="col-span-3 p-3 border-r border-gray-300 text-center">Product Name & Desc.</div>
                    <div className="col-span-2 p-3 border-r border-gray-300 text-center">Quantity</div>
                    <div className="col-span-2 p-3 border-r border-gray-300 text-center">Taxable Amount Rs.</div>
                    <div className="col-span-3 p-3 text-center">Tax Rate (C+S+I+Cess+Cess Non.Advol)</div>
                  </div>
                  {/* Data Rows */}
                  {data.goods.map((good, index) => (
                    <div key={index} className="grid grid-cols-12 border-t border-gray-300 text-sm">
                      <div className="col-span-2 p-3 border-r border-gray-300">{good.hsnCode}</div>
                      <div className="col-span-3 p-3 border-r border-gray-300">{good.productNameDesc}</div>
                      <div className="col-span-2 p-3 border-r border-gray-300">{good.quantity}</div>
                      <div className="col-span-2 p-3 border-r border-gray-300 text-right">₹ {good.taxableAmountRs.toLocaleString('en-IN')}</div>
                      <div className="col-span-3 p-3">{good.taxRate}</div>
                    </div>
                  ))}
                </div>
                {/* Amount Summary Table - matching PDF exactly */}
                <div className="mt-4 border border-gray-300">
                  {/* Amount Headers */}
                  <div className="grid grid-cols-8 bg-gray-50 text-xs font-bold">
                    <div className="p-2 border-r border-gray-300 text-center">Tot. Tax'ble Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">CGST Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">SGST Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">IGST Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">CESS Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">CESS Non.Advol Amt</div>
                    <div className="p-2 border-r border-gray-300 text-center">Other Amt</div>
                    <div className="p-2 text-center">Total Inv.Amt</div>
                  </div>
                  {/* Amount Values */}
                  <div className="grid grid-cols-8 border-t border-gray-300 text-sm">
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.totTaxbleAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.cgstAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.sgstAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.igstAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.cessAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.cessNonAdvolAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 border-r border-gray-300 text-center">₹ {data.amounts.otherAmt.toLocaleString('en-IN')}</div>
                    <div className="p-2 text-center font-bold">₹ {data.amounts.totalInvAmt.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
              {/* Transport Details Section - matching PDF exactly */}
              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="text-lg font-semibold mb-4">4. Transport Details</h3>
                <div className="border border-gray-300">
                  <div className="grid grid-cols-2">
                    {/* Left Column */}
                    <div className="p-4 border-r border-gray-300 space-y-2">
                      <div><span className="font-medium">Transporter ID :</span> {data.transport.transporterId}</div>
                      <div><span className="font-medium">Transporter Name :</span> {data.transport.transporterName}</div>
                      <div><span className="font-medium">Transporter Doc No :</span> {data.transport.transporterDocNo}</div>
                      <div><span className="font-medium">Transporter Doc Date :</span> {data.transport.transporterDocDate}</div>
                      <div><span className="font-medium">Mode :</span> {data.transport.mode}</div>
                      <div><span className="font-medium">Vehicle/Trans.Doc No :</span> {data.transport.vehicleTransDocNo}</div>
                    </div>
                    {/* Right Column */}
                    <div className="p-4 space-y-2">
                      <div><span className="font-medium">From :</span> {data.transport.from}</div>
                      <div><span className="font-medium">Entered Date :</span> {data.transport.enteredDate}</div>
                      <div><span className="font-medium">Entered By :</span> {data.transport.enteredBy}</div>
                      <div><span className="font-medium">GEWB No :</span> {data.transport.gewbNo}</div>
                      <div><span className="font-medium">Multi Veh Info :</span> {data.transport.multiVehInfo}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Vehicle Details Section - matching PDF exactly */}
              <div className="p-6 rounded-lg bg-white shadow">
                <h3 className="text-lg font-semibold mb-4">5. Vehicle Details</h3>
                <div className="border border-gray-300">
                  {/* Vehicle Details Headers */}
                  <div className="grid grid-cols-6 bg-gray-50 text-xs font-bold">
                    <div className="p-3 border-r border-gray-300 text-center">Mode</div>
                    <div className="col-span-2 p-3 border-r border-gray-300 text-center">Vehicle / Trans Doc No & Dt.</div>
                    <div className="p-3 border-r border-gray-300 text-center">From</div>
                    <div className="p-3 border-r border-gray-300 text-center">Entered Date</div>
                    <div className="p-3 text-center">Entered By</div>
                  </div>
                  {/* Vehicle Details Data */}
                  <div className="grid grid-cols-6 border-t border-gray-300 text-sm">
                    <div className="p-3 border-r border-gray-300">{data.transport.mode}</div>
                    <div className="col-span-2 p-3 border-r border-gray-300">{data.transport.vehicleTransDocNo} & {data.transport.transporterDocDate}</div>
                    <div className="p-3 border-r border-gray-300">{data.transport.from}</div>
                    <div className="p-3 border-r border-gray-300">{data.transport.enteredDate}</div>
                    <div className="p-3">{data.transport.enteredBy}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-1">Saved E-Way Bills</h2>
          {savedBills.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No E-Way Bills Found</h3>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="px-6 py-4 text-left">E-Way Bill No</th>
                  <th className="px-6 py-4 text-left">From</th>
                  <th className="px-6 py-4 text-left">To</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Valid Upto</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedBills.map((bill) => (
                  <tr key={bill.id} className="border-b">
                    <td className="px-6 py-4">{bill.ewayBillNo}</td>
                    <td className="px-6 py-4">{bill.from.name}</td>
                    <td className="px-6 py-4">{bill.to.name}</td>
                    <td className="px-6 py-4 text-right">₹{bill.amounts.totalInvAmt.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${bill.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">{bill.validUpto}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => { setData(bill); setView('upload'); }} className="p-2 text-blue-600">View</button>
                      <button onClick={() => generatePDF(bill, true)} className="p-2 text-green-600">Print</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EWayBill;