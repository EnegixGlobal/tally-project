import React from 'react';
import { useNavigate } from "react-router-dom";
import VoucherRegisterBase from '../VoucherRegisterBase';
import { ShoppingCart } from 'lucide-react';
import Swal from "sweetalert2";

const SalesRegister: React.FC = () => {

  const navigate = useNavigate();

  // ---- EDIT ---
  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/sales/edit/${voucher.id}`);
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
      const res = await fetch(`http://localhost:5000/api/sales-vouchers/${id}`, {
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
    <VoucherRegisterBase
      voucherType="sales"
      title="Sales Register"
      icon={<ShoppingCart className="w-6 h-6" />}
      color="blue"
      description="Manage all sales vouchers and invoices"
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default SalesRegister;
