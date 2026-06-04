// types.ts for Form 26Q sub-components

export interface DeductorDetails {
  // 1. Particulars of Statement
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  tan: string;
  financialYear: string;
  lastTan: string;
  assessmentYear: string;
  panOfDeductor: string;
  category: 'Company' | 'Individual/HUF' | 'Firm' | 'AOP/BOI' | 'Local Authority' | 'Artificial Juridical Person' | 'Govt' | 'Others';
  revisedReturn: 'Yes' | 'No';
  lastDeductorType: string;
  updateDeductorDetails: string;
  receiptNoOriginal: string;
  receiptNoPrevious: string;

  // 2. Particulars of Deductor (Employer)
  deductorName: string;
  branchSrlNo: string;
  paoCode: string;
  paoRegistrationNo: string;
  gstn: string;
  ministryDeptName: string;
  ministryDeptOthers: string;
  ddoCode: string;
  ddoRegistrationNo: string;
  ain: string;
  hasAddressChanged: 'Yes' | 'No';

  address: {
    flatNo: string;
    premisesName: string;
    roadStreet: string;
    area: string;
    town: string;
    state: string;
    country: string;
    pinCode: string;
  };
  stdCodeNo: string;
  telephoneNo: string;
  stdCodeNoAlternate: string;
  telephoneNoAlternate: string;
  email: string;
  alternateEmail: string;

  // 3. Details of Responsible Person
  responsiblePerson: {
    sameAsAbove: boolean;
    status: 'Deductor' | 'Representative Assessee' | 'Others';
    designation: string;
    name: string;
    fatherName: string;
    pan: string;
    address: {
      flatNo: string;
      premisesName: string;
      roadStreet: string;
      area: string;
      town: string;
      state: string;
      country: string;
      pinCode: string;
    };
    stdCodeNo: string;
    telephoneNo: string;
    email: string;
  };
}

export interface ChallanDetails {
  serialNo: number;
  updateMode: string;
  sectionCode: string;
  tax: number; // Column 4: TDS
  surcharge: number; // Column 5: Surcharge
  educationCess: number; // Column 6: Education Cess
  interest: number; // Column 7: Interest
  fee: number; // Column 8: Fee
  penalty: number; // Column 9: Penalty/Others
  lastTotalTaxDeposited: number; // Column 10
  total: number; // Column 11: Total Amount Deposited (4+5+6+7+8+9)
  chequeDDNo: string; // Column 12
  lastBSRCode: string; // Column 13
  bsrCode: string; // Column 14: BSR Code / Receipt Number
  lastDateOfDeposit: string; // Column 15
  dateOfDeposit: string; // Column 16: Date on which Tax Deposited
  lastChallanSerialNo: string; // Column 17
  challanSerialNo: string; // Column 18: Challan Serial No / DDO Serial No
  bookAdjustment: 'Yes' | 'No'; // Column 19: Mode of Deposit through Book Adjustment (Yes/No)
  interestAllocated: number; // Column 20
  other: number; // Column 21: Others
  minorHead: '200' | '400'; // Column 22: Minor Head of Challan 200/400
  challanBalance: number; // Column 23
  status?: 'Deposited' | 'Book Adjustment'; // For backward compatibility
  transferVoucherNo?: string;
}

export interface DeducteeDetails {
  rowNumber: number; // Column 1
  cashWithdrawal1cr: number; // Column 2
  cashWithdrawal20lto1crNonCoop: number; // Column 3
  cashWithdrawal1crNonCoop: number; // Column 4
  cashWithdrawal20lto1crCoop: number; // Column 5
  totalTaxDeducted: number; // Column 6 (calculated)
  lastTotalTaxDeducted: number; // Column 7
  taxDeposited: number; // Column 8: Total Tax Deposited
  lastTotalTaxDeposited: number; // Column 9
  dateOfDeduction: string; // Column 10
  remarkCode: string; // Column 11: Remarks
  deducteeCode: string; // Column 12: Deductee Code
  rateOfDeduction: number; // Column 13: Rate of Deduction
  paidByBookEntry: 'Yes' | 'No'; // Column 14
  certSerialNo: string; // Column 15: Certificate Number
  serialNo: number; // Column 16: Sr. No.
  deducteeRefNo: string; // Column 17
  lastPanOfDeductee: string; // Column 18
  panOfDeductee: string; // Column 19
  nameOfDeductee: string; // Column 20
  dateOfPayment: string; // Column 21
  amountPaid: number; // Column 22
  amountOfTax: number; // Column 23: TDS
  surcharge: number; // Column 24
  educationCess: number; // Column 25: Cess
  challanSerialNo: string; // Column 26
  updateMode: string; // Column 27: Update Mode
  bsrCode: string; // Column 28: BSR Code
  dateOfTaxDeposited: string; // Column 29: Date on which tax deposited
  transferVoucherSerialNo: string; // Column 30
  sectionUnderDeducted: string; // Column 31: Section Under Which Payment Made
  totalTdsAllocated: number; // Column 32
  interest: number; // Column 33
  others: number; // Column 34
  totalTax: number; // Column 35: Total (7+8+9)
  cashWithdrawal3crCoop: number; // Column 36
  cashWithdrawal20lto3crCoop: number; // Column 37
  cashWithdrawal3crCoopProviso: number; // Column 38

  // Optional fields for compatibility
  natureOfPayment?: string;
  dateOfTDSCertificate?: string;
  amountPaidCredited?: number;
  gstIdentificationNo?: string;
}

export interface AnnexureDetails {
  panOfDeductee: string;
  nameOfDedductee: string;
  detailsOfPANApplication: string;
  acknowledgeNo: string;
  gstIdentificationNo?: string;
}

export interface TaxDeductionDetails {
  totalAmountPaidCredited: number;
  totalTaxDeducted: number;
  totalTaxDeposited: number;
  aggregateAmountPaid: number;
  aggregateTaxDeducted: number;
  aggregateTaxDeposited: number;
}

export interface Verification {
  capacity: 'Deductor' | 'Authorized Representative';
  declarationPlace: string;
  declarationDate: string;
  fullName: string;
  designation: string;
  signature: string;
}

export interface QuarterlyReturn {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  assessmentYear: string;
  status: 'draft' | 'filed' | 'revised' | 'belated' | 'rectification';
  filingDate?: string;
  acknowledgmentNo?: string;
  receiptNo?: string;
  deductorDetails: DeductorDetails;
  challanDetails: ChallanDetails[];
  deducteeDetails: DeducteeDetails[];
  annexureDetails: AnnexureDetails[];
  taxDeductionDetails: TaxDeductionDetails;
  verification: Verification;
  summary: {
    totalDeductees: number;
    totalChallan: number;
    totalAmountPaid: number;
    totalTaxDeducted: number;
    totalTaxDeposited: number;
  };
}
