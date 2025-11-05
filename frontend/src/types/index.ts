// Common types for the application

export type CompanyInfo = {
  id?: string; // Added for AppContext compatibility
  name: string;
  financialYear: string;
  booksBeginningYear: string;
  address: string;
  pin: string;
  phoneNumber: string;
  email: string;
  panNumber: string;
  gstNumber: string;
  vatNumber: string;
  cinNumber: string;
  state?: string;
  country?: string;
  taxType?: 'GST' | 'VAT';
  employeeId?: number;
  turnover?: number;
  registrationType?: string;
  assesseeOfOtherTerritory?: boolean;
  periodicityOfGstr1?: string;
  gstApplicableFrom?: string;
  eWayBillApplicable?: boolean;
  eWayBillThresholdLimit?: string;
  eWayBillIntrastate?: boolean;
  provideLutBond?: boolean;
  lutBondNumber?: string;
  lutBondValidity?: string;
  taxLiabilityOnAdvanceReceipts?: boolean;
  maintainBy?: 'self' | 'accountant';
  accountantName?: string;
  godowns?: Godown[];
};

export type LedgerType = 
  | 'capital' 
  | 'loans' 
  | 'fixed-assets'
  | 'current-assets'
  | 'current-liabilities'
  | 'purchase'
  | 'direct-expenses'
  | 'sales'
  | 'indirect-expenses'
  | 'indirect-income'
  | 'sundry-debtors'
  | 'sundry-creditors'
  | 'cash'
  | 'bank'
  | 'cgst'
  | 'sgst'
  | 'igst'
  | 'stock'
  | 'opening-stock'
  | 'closing-stock';

export type LedgerGroup = {
  id: string;
  name: string;
  parent?: string;
  type: LedgerType;
  alias?: string;
  behavesLikeSubLedger?: boolean;
  nettBalancesForReporting?: boolean;
  usedForCalculation?: boolean;
  allocationMethod?: 'Appropriate by Qty' | 'Appropriate by Value' | 'No Appropriation';
  gstDetails?: {
    setAlterHSNSAC?: boolean;
    hsnSacClassificationId?: string;
    hsnCode?: string;
    setAlterGST?: boolean;
    gstClassificationId?: string;
    typeOfSupply?: 'Goods' | 'Services';
    taxability?: 'Taxable' | 'Exempt' | 'Nil-rated';
    integratedTaxRate?: number;
    cess?: number;
  };
};

export type Ledger = {
  id: string;
  name: string;
  groupId: string;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
  address?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  type?: LedgerType;
  state?: string;
};
export interface LedgerWithGroup extends Ledger {
  groupName?: string;
  groupType?: string;
  groupNature?: string;
}
export type VoucherEntryLine = {
  // ledger_id: string | undefined;
  id: string;
  ledgerId?: string;
  itemId?: string;
  amount: number;
  type: 'debit' | 'credit' | 'source' | 'destination';
  quantity?: number;
  rate?: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  godownId?: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  discount?: number;
  hsnCode?: string;
  narration?: string;
  costCentreId?: string;
  bankName?: string;
  chequeNumber?: string;
};

export type VoucherEntry = {
  id: string;
  date: string;
  type: VoucherType;
  number: string;
  narration?: string;
  entries: VoucherEntryLine[];
  mode?: 'item-invoice' | 'accounting-invoice' | 'as-voucher' | 'transfer' | 'adjustment' | 'double-entry' | 'single-entry' | 'sales-order';
  referenceNo?: string;
  partyId?: string;
  salesLedgerId?: string;
  purchaseLedgerId?: string;
  supplierInvoiceDate?: string;
  dispatchDetails?: {
    docNo: string;
    through: string;
    destination: string;
  };
  orderRef?: string;
  termsOfDelivery?: string;
  isQuotation?: boolean;
};

export type StockItem = {
  id: string;
  name: string;
  unit: string;
  openingBalance: number;
  openingValue: number;
  stockGroupId?: string;
  gstRate?: number;
  hsnCode?: string;
  taxType?: 'Taxable' | 'Exempt' | 'Nil-rated';
  standardPurchaseRate?: number;
  standardSaleRate?: number;
  enableBatchTracking?: boolean;
  batchDetails?: BatchDetails[];
  godownAllocations?: GodownAllocation[];
  allowNegativeStock?: boolean;
  maintainInPieces?: boolean;
  secondaryUnit?: string;
};

export type UnitOfMeasurement = {
  id: string;
  name: string;
  symbol: string;
  type: 'Simple' | 'Compound';
  // Simple unit fields
  formalName?: string;
  decimalPlaces?: number;
  // Compound unit fields
  firstUnit?: string;
  conversionFactor?: number;
  secondUnit?: string;
};

export type Godown = {
  id: string;
  name: string;
};

export type LedgerEntry = {
  id: string;
  ledgerId: string;
  amount: number;
  type: 'debit' | 'credit';
  voucherId: string;
  date: string;
};

export type AppContextType = {
  theme: 'light' | 'dark';
  companyInfo?: CompanyInfo;
  stockItems?: StockItem[];
  ledgers?: Ledger[];
  ledgerGroups?: LedgerGroup[];
  godowns?: Godown[];
  vouchers?: VoucherEntry[];
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockItem: (id: string, item: Partial<StockItem>) => void;
  addLedger: (ledger: Omit<Ledger, 'id'>) => void;
  addLedgerGroup: (group: Omit<LedgerGroup, 'id'>) => void;
  addVoucher: (voucher: VoucherEntry) => void;
  updateVoucher: (id: string, voucher: Partial<VoucherEntry>) => void;
  addLedgerEntry: (entry: LedgerEntry) => void;
};

// Capital Gains Management Types
export type CapitalAsset = 'equity' | 'mutual_fund' | 'real_estate' | 'gold' | 'bonds' | 'other';

export type CapitalGain = {
  id: string;
    employeeId: string;

  assetType: CapitalAsset;
  gainType: 'short' | 'long';
  purchaseDate: string;
  saleDate: string;
  purchaseValue: number;
  saleValue: number;
  indexationBenefit: number;
  exemptionClaimed: number;
  gainAmount: number;
  taxableGain: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// TDS Management Types
export type TDSSection = '194A' | '194B' | '194C' | '194D' | '194G' | '194H' | '194I' | '194J' | '194K' | '194LA' | '194M' | '194N' | '194O' | '194P' | '194Q' | '194R' | '194S';

export type TDSEntry = {
  id: string;
  type: 'deducted' | 'collected';
  section: TDSSection;
  deductorName: string;
  deductorPAN: string;
  amount: number;
  tdsAmount: number;
  rate: number;
  assessmentYear: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dateOfDeduction: string;
  challanNumber: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Scenario Management Types
export type VoucherType = 
  | 'payment' 
  | 'receipt' 
  | 'contra' 
  | 'journal' 
  | 'sales' 
  | 'purchase'
  | 'debit-note' 
  | 'credit-note' 
  | 'stock-journal' 
  | 'delivery-note'
  | 'sales-order'
  | 'purchase-order'
  | 'quotation';

export type Scenario = {
  id: string;
  name: string;
  includeActuals: boolean;
  includedVoucherTypes: VoucherType[];
  excludedVoucherTypes: VoucherType[];
  fromDate: string;
  toDate: string;
  createdAt: string;
  updatedAt?: string;
};

// Stock Transaction Types for Reports
export type StockTransaction = {
  id: string;
  date: string;
  voucherId: string;
  voucherType: VoucherType;
  voucherNumber: string;
  stockItemId: string;
  stockItemName: string;
  stockGroupId: string;
  godownId?: string;
  quantity: number;
  rate: number;
  value: number;
  unit: string;
  type: 'in' | 'out';
  referenceId?: string;
  batchNumber?: string;
  expiryDate?: string;
  createdAt: string;
};

export type StockGroup = {
  id: string;
  name: string;
  hsnCode?: string;
  gstRate?: number;
  parent?: string;
  shouldQuantitiesBeAdded?: boolean;
  hsnSacDetails?: {
    setAlterHSNSAC: boolean;
    hsnSacClassificationId: string;
    hsnCode: string;
    description: string;
  };
  gstDetails?: {
    setAlterGST: boolean;
    gstClassificationId: string;
    taxability: string;
    integratedTaxRate: number;
    cess: number;
  };
};

export type StockCategory = {
  id: string;
  name: string;
  parent: string;
  description: string;
};


export type GstClassification = {
  id: string;
  name: string;
  hsnCode: string;
  gstRate: number;
  cess?: number;
};

export type BatchDetails = {
  id: string;
  name: string;
  expiryDate?: string;
  manufacturingDate?: string;
};

export type GodownAllocation = {
  godownId: string;
  quantity: number;
  value: number;
};