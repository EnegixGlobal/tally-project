import React from "react";
import VoucherRegisterBase from "./VoucherRegisterBase";
import { Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ReceiptRegister: React.FC = () => {
  const navigate = useNavigate();

  // ➤ EDIT Handler
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/receipt/edit/${voucher.id}`);
  };

  // ➤ VIEW Handler
  const handleView = (voucher: any) => {
    navigate(`/app/vouchers/receipt/view/${voucher.id}`);
  };

  // ➤ COPY Handler
  const handleCopy = (voucher: any) => {
    navigate(`/app/vouchers/receipt/create`, { state: { copyId: voucher.id } });
  };

  // ➤ DELETE Handler
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This voucher will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vouchers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire("Deleted!", data.message, "success");

        // 🔥 Force refresh UI
        window.dispatchEvent(new CustomEvent("voucher-deleted", { detail: { id } }));
      } else {
        Swal.fire("Error", data.message || "Deletion failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error while deleting", "error");
    }
  };

  return (
    <VoucherRegisterBase
      voucherType="receipt"
      title="Receipt Register"
      icon={<Receipt className="w-6 h-6" />}
      color="green"
      description="Manage all receipt vouchers and collections"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      onCopy={handleCopy}
    />
  );
};

export default ReceiptRegister;
