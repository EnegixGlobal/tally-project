import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import VoucherRegisterBase from '../VoucherRegisterBase';
import { ShoppingCart } from 'lucide-react';
import Swal from "sweetalert2";
import { useCompany } from "../../../context/CompanyContext";
import { useAppContext } from "../../../context/AppContext";
import { generateSalesXmlContent, generateBulkSalesXmlContent } from "./salesXmlGenerator";

const SalesRegister: React.FC = () => {

  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const { ledgers } = useAppContext();
  const [previewXml, setPreviewXml] = useState<{ content: string; filename: string } | null>(null);

  const handleGenerateXml = async (voucher: any) => {
    try {
      const companyId = activeCompany?.id || localStorage.getItem("company_id") || "";
      const ownerType = localStorage.getItem("supplier") || "";
      const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || "";

      // Fetch the full voucher details
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales-vouchers/${voucher.id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch full voucher details");
      }
      
      const fullVoucher = await response.json();
      
      // Fetch DB ledgers instead of using AppContext defaults which might contain duplicate IDs
      let dbLedgers = ledgers;
      try {
        const ledgersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
        if (ledgersRes.ok) {
          dbLedgers = await ledgersRes.json();
        }
      } catch (err) {
        console.error("Failed to fetch ledgers", err);
      }
      
      const companyName = activeCompany?.name || "M P Traders";
      
      // Generate XML content using dbLedgers
      const xmlContent = generateSalesXmlContent(fullVoucher, companyName, dbLedgers);
      
      // Set state to show preview modal
      setPreviewXml({
        content: xmlContent,
        filename: `SalesVoucher_${voucher.number || voucher.id}.xml`
      });
      
    } catch (error) {
      console.error("XML Generation Error", error);
      Swal.fire("Error", "Failed to generate XML", "error");
    }
  };

  const handleGenerateAllXml = async (vouchers: any[]) => {
    if (vouchers.length === 0) {
      Swal.fire("Info", "No vouchers available to export.", "info");
      return;
    }

    try {
      Swal.fire({
        title: 'Generating XML...',
        text: 'Fetching details for all vouchers, please wait.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const companyId = activeCompany?.id || localStorage.getItem("company_id") || "";
      const ownerType = localStorage.getItem("supplier") || "";
      const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || "";

      // Fetch all vouchers details concurrently
      const fetchPromises = vouchers.map(voucher => 
        fetch(`${import.meta.env.VITE_API_URL}/api/sales-vouchers/${voucher.id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch full voucher details");
            return res.json();
          })
      );

      const fullVouchers = await Promise.all(fetchPromises);
      
      // Fetch DB ledgers instead of using AppContext defaults
      let dbLedgers = ledgers;
      try {
        const ledgersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
        if (ledgersRes.ok) {
          dbLedgers = await ledgersRes.json();
        }
      } catch (err) {
        console.error("Failed to fetch ledgers", err);
      }
      
      const companyName = activeCompany?.name || "M P Traders";
      
      // Generate bulk XML content
      const xmlContent = generateBulkSalesXmlContent(fullVouchers, companyName, dbLedgers);
      
      Swal.close();

      // Set state to show preview modal
      setPreviewXml({
        content: xmlContent,
        filename: `All_SalesVouchers_${new Date().toISOString().split('T')[0]}.xml`
      });
      
    } catch (error) {
      console.error("Bulk XML Generation Error", error);
      Swal.close();
      Swal.fire("Error", "Failed to generate XML for all vouchers. Some vouchers might be inaccessible.", "error");
    }
  };

  // ---- EDIT ---
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/sales/edit/${voucher.id}`);
  };

  // ---- VIEW ---
  const handleView = (voucher: any) => {
    navigate(`/app/vouchers/sales/view/${voucher.id}`);
  };

  // ---- COPY ---
  const handleCopy = (voucher: any) => {
    navigate(`/app/vouchers/sales/create`, { state: { copyId: voucher.id } });
  };

  // ---- DELETE ----
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This voucher will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-vouchers/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok) {
        Swal.fire("Deleted!", json.message || "Voucher removed.", "success");

        // Refresh list
        window.dispatchEvent(
          new CustomEvent("voucher-deleted", { detail: { id } })
        );
      } else {
        Swal.fire("Error!", json.message, "error");
      }
    } catch (err) {
      console.error("Delete failed", err);
      Swal.fire("Error!", "Something went wrong!", "error");
    }
  };

  return (
    <>
    <VoucherRegisterBase
      voucherType="sales"
      title="Sales Register"
      icon={<ShoppingCart className="w-6 h-6" />}
      color="blue"
      description="Manage all sales vouchers and invoices"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      onCopy={handleCopy}
      onGenerateXml={handleGenerateXml}
      onGenerateAllXml={handleGenerateAllXml}
    />

      {/* XML Preview Modal */}
      {previewXml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-4xl flex flex-col h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">XML Preview: {previewXml.filename}</h3>
              <button 
                onClick={() => setPreviewXml(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto bg-gray-50">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {previewXml.content}
              </pre>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-lg">
              <button
                onClick={() => setPreviewXml(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([previewXml.content], { type: "application/xml" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = previewXml.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setPreviewXml(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                Download XML
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesRegister;
