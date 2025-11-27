import React from "react";
import VoucherRegisterBase from "./VoucherRegisterBase";
import { ShoppingCart } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const SalesOrderRegister: React.FC = () => {
  const navigate = useNavigate(); // ✅ React router navigation

  const handleEdit = (voucher: any) => {
    navigate(`/app/vouchers/sales-order/edit/${voucher.id}`);
  };

  const handleDelete = async (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this Sales Order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/sales-orders/${id}`,
            { method: "DELETE" }
          );

          const json = await res.json();

          if (json.success) {
            // Remove deleted voucher from list (no reload)
            window.dispatchEvent(
              new CustomEvent("voucher-deleted", { detail: { id } })
            );

            Swal.fire("Deleted!", "Sales Order deleted successfully.", "success");
          } else {
            Swal.fire("Error!", json.message, "error");
          }
        } catch (error) {
          Swal.fire("Error!", "Failed to delete Sales Order", "error");
        }
      }
    });
  };

  return (
    <VoucherRegisterBase
      voucherType="sales_order"
      title="Sales Order Register"
      icon={<ShoppingCart className="w-5 h-5" />}
      color="bg-purple-500"
      description="Manage and view all sales order vouchers"
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default SalesOrderRegister;
