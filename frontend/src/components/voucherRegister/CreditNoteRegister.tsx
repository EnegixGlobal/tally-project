import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { FileX } from 'lucide-react';

const CreditNoteRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="credit_note"
      title="Credit Note Register"
      icon={<FileX className="w-5 h-5" />}
      color="bg-red-500"
      description="Manage and view all credit note vouchers"
    />
  );
};

export default CreditNoteRegister;
