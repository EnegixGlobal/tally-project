import type { LedgerGroup, Ledger } from '../types';

export const defaultLedgerGroups: LedgerGroup[] = [
  // Primary Groups
  { 
    id: '1', 
    name: 'Capital Account', 
    type: 'capital',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '2', 
    name: 'Loans (Liability)', 
    type: 'loans',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '3', 
    name: 'Current Liabilities', 
    type: 'current-liabilities',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '4', 
    name: 'Fixed Assets', 
    type: 'fixed-assets',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '5', 
    name: 'Current Assets', 
    type: 'current-assets',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '6', 
    name: 'Purchases', 
    type: 'purchase',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '7', 
    name: 'Direct Expenses', 
    type: 'direct-expenses',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '8', 
    name: 'Sales', 
    type: 'sales',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '9', 
    name: 'Indirect Expenses', 
    type: 'indirect-expenses',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '10', 
    name: 'Indirect Income', 
    type: 'indirect-income',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },

  // Sub-groups
  { 
    id: '11', 
    name: 'Bank Accounts', 
    parent: '5', 
    type: 'bank',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '12', 
    name: 'Cash-in-hand', 
    parent: '5', 
    type: 'cash',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '13', 
    name: 'Sundry Debtors', 
    parent: '5', 
    type: 'sundry-debtors',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '14', 
    name: 'Sundry Creditors', 
    parent: '3', 
    type: 'sundry-creditors',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '15', 
    name: 'Duties & Taxes', 
    parent: '3', 
    type: 'current-liabilities',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  // Stock-related groups
  { 
    id: '16', 
    name: 'Stock-in-Hand', 
    parent: '5', 
    type: 'stock',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '17', 
    name: 'Opening Stock', 
    parent: '8', 
    type: 'opening-stock',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
  { 
    id: '18', 
    name: 'Closing Stock', 
    parent: '8', 
    type: 'closing-stock',
    behavesLikeSubLedger: false,
    nettBalancesForReporting: true,
    usedForCalculation: false
  },
];

export const defaultLedgers: Ledger[] = [
  // Cash Accounts
  {
    id: '1',
    name: 'Cash',
    groupId: '12',
    openingBalance: 50000,
    balanceType: 'debit',
    type: 'cash'
  },
  {
    id: '2',
    name: 'Petty Cash',
    groupId: '12',
    openingBalance: 5000,
    balanceType: 'debit',
    type: 'cash'
  },
  {
    id: '3',
    name: 'Cash Counter 1',
    groupId: '12',
    openingBalance: 10000,
    balanceType: 'debit',
    type: 'cash'
  },
  {
    id: '4',
    name: 'Cash Counter 2',
    groupId: '12',
    openingBalance: 8000,
    balanceType: 'debit',
    type: 'cash'
  },
  
  // Bank Accounts
  {
    id: '5',
    name: 'State Bank of India - Current A/c',
    groupId: '11',
    openingBalance: 100000,
    balanceType: 'debit',
    type: 'bank'
  },
  {
    id: '6',
    name: 'HDFC Bank - Savings A/c',
    groupId: '11',
    openingBalance: 75000,
    balanceType: 'debit',
    type: 'bank'
  },
  {
    id: '7',
    name: 'ICICI Bank - Current A/c',
    groupId: '11',
    openingBalance: 120000,
    balanceType: 'debit',
    type: 'bank'
  },
  {
    id: '8',
    name: 'Axis Bank - Business A/c',
    groupId: '11',
    openingBalance: 85000,
    balanceType: 'debit',
    type: 'bank'
  },
  {
    id: '9',
    name: 'Punjab National Bank - Salary A/c',
    groupId: '11',
    openingBalance: 45000,
    balanceType: 'debit',
    type: 'bank'
  },
  
  // Capital & Other Accounts
  {
    id: '10',
    name: 'Capital',
    groupId: '1',
    openingBalance: 500000,
    balanceType: 'credit',
    type: 'capital'
  },
  
  // Loan Accounts (groupId: '2' - Loans Liability)
  {
    id: '21',
    name: 'Bank Loan - SBI',
    groupId: '2',
    openingBalance: 200000,
    balanceType: 'credit',
    type: 'loans'
  },
  {
    id: '22',
    name: 'Vehicle Loan - HDFC',
    groupId: '2',
    openingBalance: 150000,
    balanceType: 'credit',
    type: 'loans'
  },
  {
    id: '23',
    name: 'Machinery Loan',
    groupId: '2',
    openingBalance: 300000,
    balanceType: 'credit',
    type: 'loans'
  },
  
  // Current Liabilities (groupId: '3')
  {
    id: '24',
    name: 'Outstanding Expenses',
    groupId: '3',
    openingBalance: 45000,
    balanceType: 'credit',
    type: 'current-liabilities'
  },
  {
    id: '25',
    name: 'Salary Payable',
    groupId: '3',
    openingBalance: 85000,
    balanceType: 'credit',
    type: 'current-liabilities'
  },
  {
    id: '26',
    name: 'GST Payable',
    groupId: '3',
    openingBalance: 35000,
    balanceType: 'credit',
    type: 'current-liabilities'
  },
  {
    id: '27',
    name: 'TDS Payable',
    groupId: '3',
    openingBalance: 12000,
    balanceType: 'credit',
    type: 'current-liabilities'
  },
  
  {
    id: '11',
    name: 'Sales Account',
    groupId: '8',
    openingBalance: 0,
    balanceType: 'credit',
    type: 'sales'
  },
  {
    id: '12',
    name: 'Purchase Account',
    groupId: '6',
    openingBalance: 0,
    balanceType: 'debit',
    type: 'purchase'
  },
  
  // Party Ledgers (Suppliers/Customers)
  {
    id: '13',
    name: 'ABC Suppliers',
    groupId: '14',
    openingBalance: 25000,
    balanceType: 'credit',
    type: 'sundry-creditors',
    address: '123 Business Street, Mumbai',
    phone: '+91-9876543210',
    gstNumber: '27ABCDE1234F1Z5'
  },
  {
    id: '14',
    name: 'XYZ Trading Co.',
    groupId: '14',
    openingBalance: 15000,
    balanceType: 'credit',
    type: 'sundry-creditors',
    address: '456 Commerce Road, Delhi',
    phone: '+91-9876543211',
    gstNumber: '07XYZAB5678G1H2'
  },
  {
    id: '15',
    name: 'PQR Enterprises',
    groupId: '13',
    openingBalance: 30000,
    balanceType: 'debit',
    type: 'sundry-debtors',
    address: '789 Trade Lane, Bangalore',
    phone: '+91-9876543212',
    gstNumber: '29PQRST9012I3J4'
  },
  {
    id: '16',
    name: 'MNO Services Ltd.',
    groupId: '13',
    openingBalance: 18000,
    balanceType: 'debit',
    type: 'sundry-debtors',
    address: '321 Service Center, Chennai',
    phone: '+91-9876543213',
    gstNumber: '33MNOHI4567K5L6'
  },
  
  // Expense Accounts
  {
    id: '17',
    name: 'Office Rent',
    groupId: '9',
    openingBalance: 0,
    balanceType: 'debit',
    type: 'indirect-expenses'
  },
  {
    id: '18',
    name: 'Electricity Charges',
    groupId: '9',
    openingBalance: 0,
    balanceType: 'debit',
    type: 'indirect-expenses'
  },
  {
    id: '19',
    name: 'Telephone & Internet',
    groupId: '9',
    openingBalance: 0,
    balanceType: 'debit',
    type: 'indirect-expenses'
  },
  {
    id: '20',
    name: 'Transportation',
    groupId: '7',
    openingBalance: 0,
    balanceType: 'debit',
    type: 'direct-expenses'
  },

  // Stock Ledgers
  {
    id: '31',
    name: 'Opening Stock',
    groupId: '17',
    openingBalance: 125000,
    balanceType: 'debit',
    type: 'opening-stock'
  },
  {
    id: '32',
    name: 'Closing Stock',
    groupId: '18', 
    openingBalance: 150000,
    balanceType: 'credit',
    type: 'closing-stock'
  },
  {
    id: '33',
    name: 'Raw Materials',
    groupId: '16',
    openingBalance: 85000,
    balanceType: 'debit',
    type: 'stock'
  },
  {
    id: '34',
    name: 'Finished Goods',
    groupId: '16',
    openingBalance: 65000,
    balanceType: 'debit',
    type: 'stock'
  }
];

export const keyboardShortcuts = {
  'Alt+F1': 'Company Info',
  'Alt+F2': 'Date',
  'Alt+F3': 'Masters',
  'Alt+F4': 'Exit',
  'Alt+F5': 'Vouchers',
  'Alt+F9': 'Reports',
  'Alt+F10': 'Accounts',
  'Alt+F11': 'Inventory',
  'Alt+F12': 'Configuration',
  'Ctrl+A': 'Alter',
  'Ctrl+D': 'Delete',
  'Ctrl+C': 'Create',
  'Ctrl+N': 'New Voucher',
  'Ctrl+P': 'Print',
  'Ctrl+Q': 'Quit',
  'Ctrl+V': 'View',
  'Esc': 'Close/Back',
  'F1': 'Help',
  'F2': 'Change Period',
  'F5': 'Refresh',
  'F7': 'Show Ledger',
  'F8': 'Journal',
  'F9': 'Save',
  'F10': 'Calculator',
  'F11': 'Options',
  'F12': 'Configure'
};