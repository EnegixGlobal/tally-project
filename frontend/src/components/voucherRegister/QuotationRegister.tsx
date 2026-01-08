import React from 'react';
import { useNavigate } from "react-router-dom";
import VoucherRegisterBase from './VoucherRegisterBase';
import { FileText } from 'lucide-react';
import Swal from "sweetalert2";

const QuotationRegister: React.FC = () => {
  const navigate = useNavigate();

  // ---- EDIT ---
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/sales/edit/${voucher.id}`);
  };

  // ---- DELETE ----
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This quotation will be permanently deleted!",
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
        Swal.fire("Deleted!", json.message || "Quotation removed.", "success");

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
    <VoucherRegisterBase
      voucherType="quotation"
      title="Quotation Register"
      icon={<FileText className="w-5 h-5" />}
      color="bg-amber-500"
      description="Manage and view all quotation vouchers"
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default QuotationRegister;
