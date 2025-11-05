import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { ShoppingCart } from 'lucide-react';

const SalesOrderRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="sales_order"
      title="Sales Order Register"
      icon={<ShoppingCart className="w-5 h-5" />}
      color="bg-purple-500"
      description="Manage and view all sales order vouchers"
    />
  );
};

export default SalesOrderRegister;
