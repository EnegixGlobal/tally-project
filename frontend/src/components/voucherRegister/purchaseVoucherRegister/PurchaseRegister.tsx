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

          fetch(`${import.meta.env.VITE_API_URL}/api/purchase-vouchers/${id}`, {
            method: "DELETE",
          })
            .then(async (res) => {
              if (!res.ok) {
                throw new Error("Delete failed");
              }

              // response optional hai
              try {
                return await res.json();
              } catch {
                return {};
              }
            })
            .then(() => {
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
            })
            .catch(() => {
              Swal.fire("Error!", "Failed to delete voucher!", "error");
            });
        });
      }}
    />
  );
};

export default PurchaseRegister;
