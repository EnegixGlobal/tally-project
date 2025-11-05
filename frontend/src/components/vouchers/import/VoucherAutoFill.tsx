import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Search } from 'lucide-react';
import './VoucherAutoFill.css';

interface VoucherAutoFillProps {
  importedData: Record<string, unknown>[];
  onDataMapped: (mappedData: Record<string, unknown>[]) => void;
}

interface LookupTable {
  parties: { name: string; id: string; gstNumber?: string }[];
  items: { name: string; id: string; hsnCode?: string; rate?: number }[];
  ledgers: { name: string; id: string; type: string }[];
}

const VoucherAutoFill: React.FC<VoucherAutoFillProps> = ({ importedData, onDataMapped }) => {
  const [lookupTables, setLookupTables] = useState<LookupTable>({
    parties: [],
    items: [],
    ledgers: []
  });
  const [autoMappingProgress, setAutoMappingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappingResults, setMappingResults] = useState<{
    matched: number;
    unmatched: number;
    errors: string[];
  }>({ matched: 0, unmatched: 0, errors: [] });

  // Sample lookup data (in real app, this would come from API)
  useEffect(() => {
    setLookupTables({
      parties: [
        { id: '1', name: 'ABC Electronics Ltd', gstNumber: '27ABC1234F1Z5' },
        { id: '2', name: 'XYZ Computers', gstNumber: '27XYZ5678G2A1' },
        { id: '3', name: 'Tech Solutions Pvt Ltd', gstNumber: '27TECH9012H3B2' },
        { id: '4', name: 'Mobile World Distributors', gstNumber: '27MOB3456I4C3' },
        { id: '5', name: 'Tech Suppliers Ltd', gstNumber: '27TECH7890J5D4' }
      ],
      items: [
        { id: '1', name: 'Laptop HP Pavilion', hsnCode: '8471', rate: 45000 },
        { id: '2', name: 'Mobile Samsung Galaxy', hsnCode: '8517', rate: 25000 },
        { id: '3', name: 'Printer Canon LaserJet', hsnCode: '8443', rate: 15000 },
        { id: '4', name: 'Laptop HP', hsnCode: '8471', rate: 42000 },
        { id: '5', name: 'Mobile Samsung', hsnCode: '8517', rate: 22000 }
      ],
      ledgers: [
        { id: '1', name: 'Sales - Electronics', type: 'sales' },
        { id: '2', name: 'Purchase - Electronics', type: 'purchase' },
        { id: '3', name: 'Office Rent', type: 'expense' },
        { id: '4', name: 'Electricity Bill', type: 'expense' },
        { id: '5', name: 'Cash', type: 'cash' },
        { id: '6', name: 'Bank', type: 'bank' }
      ]
    });
  }, []);

  const performAutoMapping = async () => {
    setIsProcessing(true);
    setAutoMappingProgress(0);
    
    const mappedData: Record<string, unknown>[] = [];
    const errors: string[] = [];
    let matched = 0;
    let unmatched = 0;

    for (let i = 0; i < importedData.length; i++) {
      const row = importedData[i];
      const mappedRow = { ...row };        try {
          const getString = (key: string): string => {
            const value = row[key];
            return typeof value === 'string' ? value : String(value || '');
          };
          
          const getNumber = (key: string): number => {
            const value = row[key];
            return typeof value === 'number' ? value : parseFloat(String(value || 0)) || 0;
          };

          // Auto-map party names
          const partyName = getString('Party Name') || getString('Supplier Name') || getString('Paid To') || getString('Received From');
          if (partyName) {
            const matchedParty = findBestMatch(partyName, lookupTables.parties, 'name');
            if (matchedParty) {
              mappedRow.partyId = matchedParty.id;
              mappedRow.partyGstNumber = matchedParty.gstNumber;
              matched++;
            } else {
              mappedRow.partyId = null;
              unmatched++;
              errors.push(`Row ${i + 1}: Party "${partyName}" not found in master data`);
            }
          }

          // Auto-map item names
          const itemName = getString('Item Name') || getString('item_name');
          if (itemName) {
            const matchedItem = findBestMatch(itemName, lookupTables.items, 'name');
            if (matchedItem) {
              mappedRow.itemId = matchedItem.id;
              mappedRow.itemHsnCode = matchedItem.hsnCode;
              mappedRow.itemRate = matchedItem.rate;
              matched++;
            } else {
              mappedRow.itemId = null;
              unmatched++;
              errors.push(`Row ${i + 1}: Item "${itemName}" not found in master data`);
            }
          }

          // Auto-map ledger names for payment/receipt vouchers
          const ledgerName = getString('Paid To') || getString('Received From');
          if (ledgerName) {
            const matchedLedger = findBestMatch(ledgerName, lookupTables.ledgers, 'name');
            if (matchedLedger) {
              mappedRow.ledgerId = matchedLedger.id;
              matched++;
            } else {
              mappedRow.ledgerId = null;
              unmatched++;
              errors.push(`Row ${i + 1}: Ledger "${ledgerName}" not found in master data`);
            }
          }

          // Auto-calculate amounts if missing
          const quantity = getNumber('Quantity');
          const rate = getNumber('Rate');
          if (!getString('Amount') && quantity && rate) {
            mappedRow.Amount = quantity * rate;
          }

          // Auto-format dates
          const dateValue = row['Date'];
          if (dateValue) {
            mappedRow.formattedDate = formatDateForSystem(dateValue);
          }

          mappedData.push(mappedRow);
        
      } catch (error) {
        errors.push(`Row ${i + 1}: Error processing data - ${error}`);
        mappedData.push(mappedRow);
        unmatched++;
      }

      // Update progress
      setAutoMappingProgress(Math.round(((i + 1) / importedData.length) * 100));
      
      // Add small delay to show progress
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setMappingResults({ matched, unmatched, errors });
    onDataMapped(mappedData);
    setIsProcessing(false);
  };

  const findBestMatch = (searchTerm: string, lookupData: Record<string, unknown>[], searchField: string) => {
    if (!searchTerm || !lookupData) return null;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Exact match
    let match = lookupData.find(item => {
      const fieldValue = item[searchField];
      return typeof fieldValue === 'string' && fieldValue.toLowerCase().trim() === searchTermLower;
    });
    
    if (match) return match;
    
    // Partial match
    match = lookupData.find(item => {
      const fieldValue = item[searchField];
      if (typeof fieldValue !== 'string') return false;
      const fieldLower = fieldValue.toLowerCase();
      return fieldLower.includes(searchTermLower) || searchTermLower.includes(fieldLower);
    });
    
    if (match) return match;
    
    // Fuzzy match (simple word matching)
    const searchWords = searchTermLower.split(' ');
    match = lookupData.find(item => {
      const fieldValue = item[searchField];
      if (typeof fieldValue !== 'string') return false;
      const itemWords = fieldValue.toLowerCase().split(' ');
      return searchWords.some(word => 
        itemWords.some((itemWord: string) => 
          itemWord.includes(word) || word.includes(itemWord)
        )
      );
    });
    
    return match || null;
  };

  const formatDateForSystem = (dateValue: unknown): string => {
    if (!dateValue) return '';
    
    try {
      // Handle DD/MM/YYYY format
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      
      // Handle Excel date numbers
      if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      return new Date(dateValue as string | number | Date).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const resetMapping = () => {
    setMappingResults({ matched: 0, unmatched: 0, errors: [] });
    setAutoMappingProgress(0);
    onDataMapped(importedData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Auto-Fill Data (Tally Style)</h3>
            <p className="text-sm text-gray-600">Automatically match and fill data from your master records</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetMapping}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={performAutoMapping}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>{isProcessing ? 'Auto-Filling...' : 'Auto-Fill Data'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Processing...</span>
              <span>{autoMappingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div
                className={`bg-blue-600 h-2 rounded-full transition-all duration-300 absolute top-0 left-0`}
                style={{width: `${Math.min(autoMappingProgress, 100)}%`}}
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        {(mappingResults.matched > 0 || mappingResults.unmatched > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Successfully Matched</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {mappingResults.matched}
              </div>
              <div className="text-sm text-green-700">
                Records auto-filled from master data
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">Needs Attention</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mt-2">
                {mappingResults.unmatched}
              </div>
              <div className="text-sm text-orange-700">
                Records require manual review
              </div>
            </div>
          </div>
        )}

        {/* Mapping Errors */}
        {mappingResults.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Auto-Fill Issues</h4>
            <div className="max-h-40 overflow-y-auto">
              <ul className="text-sm text-red-700 space-y-1">
                {mappingResults.errors.slice(0, 10).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {mappingResults.errors.length > 10 && (
                  <li className="text-red-600">... and {mappingResults.errors.length - 10} more issues</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Master Data Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Available Parties</div>
            <div className="text-xl font-bold text-gray-900">{lookupTables.parties.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Available Items</div>
            <div className="text-xl font-bold text-gray-900">{lookupTables.items.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Available Ledgers</div>
            <div className="text-xl font-bold text-gray-900">{lookupTables.ledgers.length}</div>
          </div>
        </div>
      </div>

      {/* Auto-Fill Features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🚀 Auto-Fill Features (Like Tally)</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✓ Automatic party name matching from customer/supplier master</li>
          <li>✓ Item name matching with HSN code and rate auto-fill</li>
          <li>✓ Ledger account matching for payment/receipt vouchers</li>
          <li>✓ Amount calculation from quantity × rate</li>
          <li>✓ Date format standardization</li>
          <li>✓ GST number auto-population from party master</li>
          <li>✓ Fuzzy matching for similar names</li>
          <li>✓ Error reporting for unmatched records</li>
        </ul>
      </div>
    </div>
  );
};

export default VoucherAutoFill;
