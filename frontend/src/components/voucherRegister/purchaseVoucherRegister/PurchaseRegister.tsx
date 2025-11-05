import React from 'react';
import VoucherRegisterBase from '../VoucherRegisterBase';
import { ShoppingBag } from 'lucide-react';

const PurchaseRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="purchase"
      title="Purchase Register"
      icon={<ShoppingBag className="w-6 h-6" />}
      color="indigo"
      description="Manage all purchase vouchers and bills"
    />
  );
};

export default PurchaseRegister;
