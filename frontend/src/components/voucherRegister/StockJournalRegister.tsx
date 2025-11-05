import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { Package } from 'lucide-react';

const StockJournalRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="stock_journal"
      title="Stock Journal Register"
      icon={<Package className="w-5 h-5" />}
      color="bg-teal-500"
      description="Manage and view all stock journal vouchers"
    />
  );
};

export default StockJournalRegister;
