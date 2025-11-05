import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { ArrowLeftRight } from 'lucide-react';

const ContraRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="contra"
      title="Contra Register"
      icon={<ArrowLeftRight className="w-6 h-6" />}
      color="purple"
      description="Manage all contra vouchers and fund transfers"
    />
  );
};

export default ContraRegister;
