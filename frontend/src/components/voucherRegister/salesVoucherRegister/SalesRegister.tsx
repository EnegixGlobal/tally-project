import React from 'react';
import VoucherRegisterBase from '../VoucherRegisterBase';
import { ShoppingCart } from 'lucide-react';

const SalesRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="sales"
      title="Sales Register"
      icon={<ShoppingCart className="w-6 h-6" />}
      color="blue"
      description="Manage all sales vouchers and invoices"
    />
  );
};

export default SalesRegister;
