import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuotationCreate: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to sales voucher with quotation mode
    navigate('/app/vouchers/sales/create?mode=quotation');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Quotation Creation...</p>
      </div>
    </div>
  );
};

export default QuotationCreate;
