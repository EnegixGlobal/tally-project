import React from "react";
import VoucherRegisterBase from "./VoucherRegisterBase";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ContraRegister: React.FC = () => {
  const navigate = useNavigate();

  // ----------------------- EDIT -----------------------
  const handleEdit = (voucher: { id: string }) => {
    navigate(`/app/vouchers/contra/edit/${voucher.id}`);
  };

  // ----------------------- DELETE -----------------------
  const handleDelete = async (id: string) => {
    // Confirm Dialog
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This voucher will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // Loader
    Swal.fire({
      title: "Deleting...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`http://localhost:5000/api/vouchers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.message || "Failed to delete!", "error");
        return;
      }

      // 🔥 Remove from UI immediately (no refresh)
      window.dispatchEvent(
        new CustomEvent("voucher-deleted", { detail: { id } })
      );

      Swal.fire("Deleted!", "Voucher has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error", "Network error", "error");
    }
  };

  // ----------------------- VIEW -----------------------
  const handleView = (voucher: { id: string }) => {
    navigate(`/app/voucher-view/${voucher.id}`);
  };

  return (
    <VoucherRegisterBase
      voucherType="contra"
      title="Contra Register"
      icon={<ArrowLeftRight className="w-6 h-6" />}
      color="purple"
      description="Manage all contra vouchers and fund transfers"

      onEdit={handleEdit}
      onDelete={handleDelete}   // 👈 FIXED
      onView={handleView}
    />
  );
};

export default ContraRegister;
