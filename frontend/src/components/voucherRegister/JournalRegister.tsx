import React from "react";
import VoucherRegisterBase from "./VoucherRegisterBase";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const JournalRegister: React.FC = () => {
  const navigate = useNavigate();

  // 🔹 ADD Journal Voucher
  const handleAdd = () => {
    navigate("/app/vouchers/journal/create");
  };

  // 🔹 EDIT Journal Voucher
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/journal/edit/${voucher.id}`);
  };

  // 🔹 VIEW Journal Voucher
  const handleView = (voucher: any) => {
    navigate(`/app/vouchers/journal/view/${voucher.id}`);
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
    const res = await fetch(`http://localhost:5000/api/vouchers/${id}`, {
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
    <VoucherRegisterBase
      voucherType="journal"
      title="Journal Register"
      icon={<BookOpen className="w-6 h-6" />}
      color="purple"
      description="Manage all journal vouchers and adjusting entries"
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
    />
  );
};

export default JournalRegister;
