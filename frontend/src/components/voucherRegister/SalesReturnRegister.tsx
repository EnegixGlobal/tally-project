import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { RotateCcw } from 'lucide-react';

const SalesReturnRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="sales_return"
      title="Sales Return Register"
      icon={<RotateCcw className="w-5 h-5" />}
      color="bg-orange-500"
      description="Manage and view all sales return vouchers"
    />
  );
};

export default SalesReturnRegister;
