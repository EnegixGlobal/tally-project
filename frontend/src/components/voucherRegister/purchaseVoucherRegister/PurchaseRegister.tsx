import React from "react";
import VoucherRegisterBase from "../VoucherRegisterBase";
import { ShoppingBag } from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const PurchaseRegister: React.FC = () => {
  const navigate = useNavigate();

  return (
    <VoucherRegisterBase
      voucherType="purchase"
      title="Purchase Register"
      icon={<ShoppingBag className="w-6 h-6" />}
      color="indigo"
      description="Manage all purchase vouchers and bills"
      onEdit={(voucher) =>
        navigate(`/app/vouchers/purchase/edit/${voucher.id}`)
      }
      onDelete={(id) => {
        Swal.fire({
          title: "Are you sure?",
          text: "This voucher will be permanently deleted!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
        }).then((result) => {
          if (!result.isConfirmed) return;

          fetch(`http://localhost:5000/api/purchase-vouchers/${id}`, {
            method: "DELETE",
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Delete Response:", data);

              if (data.message === "Voucher deleted successfully") {
                // 🔥 Notify Parent Component
                window.dispatchEvent(
                  new CustomEvent("voucher-deleted", { detail: { id } })
                );

                Swal.fire({
                  title: "Deleted!",
                  text: "Voucher has been deleted successfully.",
                  icon: "success",
                  timer: 1200,
                  showConfirmButton: false,
                });
              } else {
                Swal.fire("Error!", "Failed to delete voucher!", "error");
              }
            })
            .catch(() => {
              Swal.fire("Error!", "Server not responding!", "error");
            });
        });
      }}
    />
  );
};

export default PurchaseRegister;
