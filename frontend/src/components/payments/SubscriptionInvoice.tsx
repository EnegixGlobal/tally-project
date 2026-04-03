import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ShieldCheck } from 'lucide-react';

interface SubscriptionInvoiceProps {
  data: {
    txnid: string;
    orderId: string;
    amount: number | string; // Final paid amount
    originalAmount?: number | string;
    discountAmount?: number | string;
    duration?: string;
    planName: string;
    date: string;
  };
  buyerInfo: {
    name: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    phoneNumber?: string;
    tanNumber?: string;
    cinNumber?: string;
    state?: string;
    pin?: string;
    email?: string;
  };
}

const SubscriptionInvoice: React.FC<SubscriptionInvoiceProps> = ({ data, buyerInfo }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${data.orderId}`,
  });

  const finalAmount = Number(data.amount);
  const originalAmount = Number(data.originalAmount || finalAmount);
  const discountAmount = Number(data.discountAmount || 0);

  const amountInWords = (num: number) => {
    return "INR " + num.toLocaleString('en-IN') + " Only";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-3 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Printer size={18} />
          Print Official Bill
        </button>
      </div>

      <div className="bg-white border-2 border-black p-0 max-w-[210mm] mx-auto text-black font-sans leading-tight shadow-2xl overflow-hidden" ref={componentRef}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            @media print {
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; font-family: 'Inter', sans-serif !important; }
              @page { size: A4; margin: 5mm; }
              .invoice-container { border: 2px solid black !important; width: 100% !important; margin: 0 !important; }
            }
            * { font-family: 'Inter', sans-serif !important; }
          `}
        </style>
        
        {/* Header */}
        <div className="text-center border-b-2 border-black bg-gray-50 py-4">
          <h1 className="text-2xl font-black tracking-[0.3em] uppercase underline underline-offset-4 decoration-black">Subscription Bill</h1>
          <p className="text-[11px] mt-1 text-gray-700 font-extrabold uppercase tracking-widest">(Official Payment Receipt)</p>
        </div>

        {/* Invoice Info Row */}
        <div className="flex border-b-2 border-black divide-x-2 divide-black">
          <div className="w-1/2 p-4 space-y-3">
            <div className="flex items-center gap-4">
              <img src="/apnapng.jpeg" alt="APNA" className="h-12 w-auto object-contain" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">Seller Details</h2>
            </div>
            <div className="text-[12px] space-y-1.5">
              <p className="font-extrabold text-lg text-black leading-none">APNA SOFTWARE SOLUTION</p>
              <p className="font-semibold">Email: support@apnasoftware.com</p>
              <p className="font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded inline-block">GSTIN: 20AVBPB8286H1ZU</p>
              <p className="font-black text-gray-900 block">PAN: AVBPB8286H</p>
            </div>
          </div>
          <div className="w-1/2 p-4 space-y-3 bg-white">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-gray-500 uppercase">Bill No</p>
                <p className="text-sm font-black text-black">BILL/{data.orderId?.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[11px] font-black text-gray-500 uppercase">Date</p>
                <p className="text-sm font-black text-black">{new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="pt-1 flex justify-between gap-4">
              <div className="flex-1">
                <p className="text-[11px] font-black text-gray-500 uppercase">Transaction ID</p>
                <p className="text-[10px] font-mono font-black break-all text-black mt-1">{data.txnid}</p>
              </div>
              <div className="text-right min-w-[90px] bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-700 uppercase leading-none mb-1">Validity</p>
                <p className="text-sm font-black text-indigo-900 uppercase italic tracking-tighter">{data.duration || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="p-4 border-b-2 border-black bg-gray-50/50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black mb-3 flex items-center gap-2">
            <span className="w-2 h-4 bg-black rounded-full"></span>
            Billed To
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-[12px] space-y-1">
              <p className="font-black text-base text-black uppercase tracking-tight underline decoration-gray-300 underline-offset-4">{buyerInfo.name}</p>
              <div className="text-black font-semibold leading-relaxed mt-2 text-sm">
                <p className="italic">{buyerInfo.address || 'Address not available'}</p>
                <p className="font-bold">{buyerInfo.state}{buyerInfo.pin ? ` - ${buyerInfo.pin}` : ''}</p>
              </div>
              <p className="pt-3 font-black text-xs uppercase"><span className="text-gray-500 mr-2">Contact:</span> {buyerInfo.phoneNumber || 'N/A'}</p>
            </div>
            <div className="text-[12px] space-y-2 text-right">
              {buyerInfo.gstNumber && (
                <div className="bg-black text-white p-2 rounded inline-block text-right shadow-md">
                  <p className="font-black text-xs leading-none uppercase">Buyer GSTIN</p>
                  <p className="font-black text-sm mt-1">{buyerInfo.gstNumber}</p>
                </div>
              )}
              <div className="space-y-1.5 font-bold text-gray-900">
                {buyerInfo.panNumber && <p><span className="text-gray-500 uppercase text-[10px] mr-1">PAN NO:</span> {buyerInfo.panNumber}</p>}
                {buyerInfo.tanNumber && <p><span className="text-gray-500 uppercase text-[10px] mr-1">TAN NO:</span> {buyerInfo.tanNumber}</p>}
                {buyerInfo.cinNumber && <p><span className="text-gray-500 uppercase text-[10px] mr-1">CIN NO:</span> {buyerInfo.cinNumber}</p>}
                <p><span className="text-gray-500 uppercase text-[10px] mr-1">Email:</span> {buyerInfo.email || 'N/A'}</p>
              </div>
              <p className="text-[11px] text-gray-600 uppercase font-black mt-4 border-t border-gray-200 pt-2">Place of Supply: <span className="text-black ml-1">{buyerInfo.state || 'N/A'}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="min-h-[280px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white border-b-2 border-black text-[11px] font-black uppercase">
                <th className="p-3 border-r border-white/20 text-center w-12">#</th>
                <th className="p-3 border-r border-white/20">Service Description</th>
                <th className="p-3 border-r border-white/20 text-center w-12">Qty</th>
                <th className="p-3 border-r border-white/20 text-right w-32">Base Unit Price</th>
                <th className="p-3 text-right w-40">Total Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-black divide-y divide-black/10">
              <tr className="bg-white">
                <td className="p-4 border-r-2 border-black text-center text-lg">1</td>
                <td className="p-4 border-r-2 border-black">
                  <p className="font-black text-lg uppercase tracking-tight text-black">{data.planName}</p>
                  <p className="text-[11px] text-gray-600 font-bold italic mt-2 leading-tight">Software License Activation with Cloud Management Features</p>
                </td>
                <td className="p-4 border-r-2 border-black text-center text-base">1</td>
                <td className="p-4 border-r-2 border-black text-right text-base font-black">₹{originalAmount.toLocaleString('en-IN')}</td>
                <td className="p-4 text-right text-lg font-black">₹{originalAmount.toLocaleString('en-IN')}</td>
              </tr>
              {/* Padding rows */}
              {Array(6).fill(0).map((_, i) => (
                <tr key={i} className="h-8">
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td className="border-r-2 border-black"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="border-t-2 border-black flex divide-x-2 divide-black">
          <div className="w-[60%] p-4 text-xs flex flex-col justify-between">
            <div>
              <p className="font-black uppercase text-[11px] text-gray-400 mb-2">Amount in Words</p>
              <p className="font-extrabold italic text-sm text-black leading-snug">{amountInWords(finalAmount)}</p>
            </div>
            <div className="mt-6 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center gap-3 text-[11px] text-gray-600 font-bold">
                <ShieldCheck size={18} className="text-green-600" />
                <span>OFFICIAL DOCUMENT: Computer generated bill, no physical signature required.</span>
              </div>
            </div>
          </div>
          <div className="w-[40%] divide-y divide-black/20">
            <div className="flex justify-between p-3 text-sm font-black text-gray-500 uppercase tracking-tighter">
              <span>Subtotal</span>
              <span>₹{originalAmount.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between p-3 text-sm font-black text-red-600 bg-red-50/50">
                <span className="uppercase">Discount (-)</span>
                <span>₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between p-4 bg-black text-white font-black text-xl lg:text-2xl">
              <span className="uppercase tracking-tighter self-center">Net Payable</span>
              <span className="text-2xl">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t-2 border-black p-4 flex justify-between items-end bg-gray-50">
          <div className="text-[10px] text-gray-600 font-black uppercase space-y-1.5 w-1/2">
            <p className="underline decoration-gray-300 underline-offset-4 mb-2">Terms & Conditions:</p>
            <p>1. Subscription period starts from the date of activation.</p>
            <p>2. Non-refundable software service fee.</p>
            <p>3. Subject to jurisdiction of Ranchi, Jharkhand.</p>
          </div>
          <div className="text-center w-1/2 flex flex-col items-end">
            <div className="h-16 w-56 mb-2 flex items-end justify-center border-b-2 border-black/20 pb-1">
              <p className="text-[11px] font-black italic text-black/40">Authorized Digital Signature</p>
            </div>
            <p className="text-sm font-black uppercase text-black">APNA SOFTWARE SOLUTION</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionInvoice;
