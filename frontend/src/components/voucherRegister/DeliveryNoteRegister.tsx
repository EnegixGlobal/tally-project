import React from 'react';
import VoucherRegisterBase from './VoucherRegisterBase';
import { Truck } from 'lucide-react';

const DeliveryNoteRegister: React.FC = () => {
  return (
    <VoucherRegisterBase
      voucherType="delivery_note"
      title="Delivery Note Register"
      icon={<Truck className="w-5 h-5" />}
      color="bg-cyan-500"
      description="Manage and view all delivery note vouchers"
    />
  );
};

export default DeliveryNoteRegister;
