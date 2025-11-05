import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { FileText } from 'lucide-react';

const QuotationRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="quotation"
      title="Quotation Register"
      icon={<FileText className="w-5 h-5" />}
      color="bg-amber-500"
      description="Manage and view all quotation vouchers"
    />
  );
};

export default QuotationRegister;
