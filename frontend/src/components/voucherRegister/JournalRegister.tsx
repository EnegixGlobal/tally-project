import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { BookOpen } from 'lucide-react';

const JournalRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="journal"
      title="Journal Register"
      icon={<BookOpen className="w-6 h-6" />}
      color="purple"
      description="Manage all journal vouchers and adjusting entries"
    />
  );
};

export default JournalRegister;
