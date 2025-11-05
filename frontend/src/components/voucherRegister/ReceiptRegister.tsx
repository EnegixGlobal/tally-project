import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { Receipt } from 'lucide-react';

const ReceiptRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="receipt"
      title="Receipt Register"
      icon={<Receipt className="w-6 h-6" />}
      color="green"
      description="Manage all receipt vouchers and collections"
    />
  );
};

export default ReceiptRegister;
