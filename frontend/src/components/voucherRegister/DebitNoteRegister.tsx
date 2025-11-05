import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { FilePlus } from 'lucide-react';

const DebitNoteRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="debit_note"
      title="Debit Note Register"
      icon={<FilePlus className="w-5 h-5" />}
      color="bg-orange-500"
      description="Manage and view all debit note vouchers"
    />
  );
};

export default DebitNoteRegister;
