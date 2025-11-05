import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { RotateCcw } from 'lucide-react';

const PurchaseReturnRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="purchase_return"
      title="Purchase Return Register"
      icon={<RotateCcw className="w-5 h-5" />}
      color="bg-pink-500"
      description="Manage and view all purchase return vouchers"
    />
  );
};

export default PurchaseReturnRegister;
