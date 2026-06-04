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
  bsrCode: string;
  dateOfDeposit: string;
  challanSerialNo: string;
  tax: number;
  surcharge: number;
  educationCess: number;
  other: number;
  interest: number;
  penalty: number;
  fee: number;
  total: number;
  transferVoucherNo?: string;
  status: 'Deposited' | 'Book Adjustment';
}

export interface DeducteeDetails {
  serialNo: number;
  panOfDeductee: string;
  nameOfDeductee: string;
  amountPaid: number;
  amountOfTax: number;
  taxDeposited: number;
  dateOfPayment: string;
  natureOfPayment: string;
  sectionUnderDeducted: string;
  rateOfDeduction: number;
  certSerialNo?: string;
  dateOfTDSCertificate?: string;
  amountPaidCredited: number;
  gstIdentificationNo?: string;
  remarkCode?: string;
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
