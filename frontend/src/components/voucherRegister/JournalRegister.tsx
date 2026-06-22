import React, { useState } from "react";
import VoucherRegisterBase from "./VoucherRegisterBase";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useCompany } from "../../context/CompanyContext";
import { useAppContext } from "../../context/AppContext";
import { generateJournalXmlContent, generateBulkJournalXmlContent } from "./journalXmlGenerator";

const JournalRegister: React.FC = () => {
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
        `${import.meta.env.VITE_API_URL}/api/vouchers/${voucher.id}?companyId=${companyId}&ownerType=${ownerType}&ownerId=${ownerId}&voucherType=journal`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch full voucher details");
      }
      
      const resData = await response.json();
      const fullVoucher = resData.data || resData;
      
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
      
      // Generate XML content using dbLedgers
      const xmlContent = generateJournalXmlContent(fullVoucher, companyName, dbLedgers);
      
      // Set state to show preview modal
      setPreviewXml({
        content: xmlContent,
        filename: `JournalVoucher_${voucher.number || voucher.id}.xml`
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
        fetch(`${import.meta.env.VITE_API_URL}/api/vouchers/${voucher.id}?companyId=${companyId}&ownerType=${ownerType}&ownerId=${ownerId}&voucherType=journal`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch full voucher details");
            return res.json();
          })
      );

      const fullVouchersRes = await Promise.all(fetchPromises);
      const fullVouchers = fullVouchersRes.map((res: any) => res.data || res);
      
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
      const xmlContent = generateBulkJournalXmlContent(fullVouchers, companyName, dbLedgers);
      
      Swal.close();

      // Set state to show preview modal
      setPreviewXml({
        content: xmlContent,
        filename: `All_JournalVouchers_${new Date().toISOString().split('T')[0]}.xml`
      });
      
    } catch (error) {
      console.error("Bulk XML Generation Error", error);
      Swal.close();
      Swal.fire("Error", "Failed to generate XML for all vouchers. Some vouchers might be inaccessible.", "error");
    }
  };

  // 🔹 EDIT Journal Voucher
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/journal/edit/${voucher.id}`);
  };

  // 🔹 VIEW Journal Voucher
  const handleView = (voucher: any) => {
    navigate(`/app/vouchers/journal/view/${voucher.id}`);
  };

  // 🔹 COPY Journal Voucher
  const handleCopy = (voucher: any) => {
    navigate(`/app/vouchers/journal/create`, { state: { copyId: voucher.id } });
  };

  // 🔹 DELETE Journal Voucher with SWEET ALERT + AUTO UI REFRESH
 const handleDelete = async (id: string) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This journal voucher will be deleted permanently.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete!",
    cancelButtonText: "Cancel",
  });

  if (!confirm.isConfirmed) return;

  Swal.fire({
    title: "Deleting...",
    text: "Please wait",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vouchers/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      Swal.fire("Error!", data.message || "Failed to delete.", "error");
      return;
    }

    // 🔥 UI update event for removing deleted voucher
    window.dispatchEvent(
      new CustomEvent("voucher-deleted", { detail: { id } })
    );

    Swal.fire("Deleted!", data.message, "success");
  } catch (err) {
    Swal.fire("Error!", "Network error occurred.", "error");
  }
};


  return (
    <>
      <VoucherRegisterBase
        itemsPerPage={20}
        voucherType="journal"
        title="Journal Register"
        icon={<BookOpen className="w-6 h-6" />}
        color="purple"
        description="Manage all journal vouchers and adjusting entries"
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

export default JournalRegister;
