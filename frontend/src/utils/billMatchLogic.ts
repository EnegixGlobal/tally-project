export interface LedgerTransactionData {
  id: string;
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
}

export interface ExtractedBillData {
  id: string; // generated
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  amount: number;
}

export type MatchStatus = 'matched' | 'partial' | 'unmatched';

export interface MatchResult {
  ledgerEntry: LedgerTransactionData | null;
  billEntry: ExtractedBillData | null;
  status: MatchStatus;
  reason: string;
}

// Helper to normalize dates for comparison (DD-MM-YYYY or similar)
const normalizeDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  return dateStr.trim();
};

export const performBillMatch = (
  ledgerData: LedgerTransactionData[],
  billData: ExtractedBillData[]
): MatchResult[] => {
  const results: MatchResult[] = [];
  const usedBillIds = new Set<string>();

  // 1. Try to match each ledger entry
  for (const ledger of ledgerData) {
    let bestMatch: MatchResult | null = null;
    let highestScore = -1;

    for (const bill of billData) {
      if (usedBillIds.has(bill.id)) continue;

      let score = 0;
      let reasons: string[] = [];
      let isExactAmount = false;
      
      // Cross-match amounts: Ledger Debit == Bill Credit, or Ledger Credit == Bill Debit
      // Sometimes OCR just extracts 'Amount' and doesn't know Debit/Credit
      const billAmount = bill.amount > 0 ? bill.amount : Math.max(bill.debit, bill.credit);
      const ledgerAmount = Math.max(ledger.debit, ledger.credit);

      if (ledgerAmount === billAmount) {
        score += 50;
        isExactAmount = true;
      } else {
        reasons.push(`Amount diff: ${Math.abs(ledgerAmount - billAmount)}`);
      }

      // Date match
      if (normalizeDate(ledger.date) === normalizeDate(bill.date)) {
        score += 30;
      } else {
        reasons.push(`Date mismatch: ${ledger.date} vs ${bill.date}`);
      }

      // Particulars match (simple include or exact)
      const lp = (ledger.particulars || '').toLowerCase();
      const bp = (bill.particulars || '').toLowerCase();
      if (lp === bp && lp !== '') {
        score += 20;
      } else if ((lp.includes(bp) || bp.includes(lp)) && lp !== '' && bp !== '') {
        score += 10;
        reasons.push('Partial name match');
      } else {
        reasons.push('Name mismatch');
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          ledgerEntry: ledger,
          billEntry: bill,
          status: score === 100 ? 'matched' : (isExactAmount ? 'partial' : 'unmatched'),
          reason: score === 100 ? 'Exact Match' : reasons.join(' | ')
        };
      }
    }

    if (bestMatch && bestMatch.status !== 'unmatched') {
      results.push(bestMatch);
      usedBillIds.add(bestMatch.billEntry!.id);
    } else {
      // Unmatched ledger entry
      results.push({
        ledgerEntry: ledger,
        billEntry: null,
        status: 'unmatched',
        reason: 'No matching bill entry found'
      });
    }
  }

  // 2. Add remaining unmatched bill entries
  for (const bill of billData) {
    if (!usedBillIds.has(bill.id)) {
      results.push({
        ledgerEntry: null,
        billEntry: bill,
        status: 'unmatched',
        reason: 'No matching ledger entry found in Tally'
      });
    }
  }

  return results;
};
