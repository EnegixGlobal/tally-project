import React from 'react';
import { useAppContext } from '../../../context/AppContext';

export type ReportFilters = {
  assessmentYear: string;
  fromDate: string;
  toDate: string;
  assesseeType: string;
};

interface ReportViewerProps {
  reportId: string;
  filters: ReportFilters;
}

const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useAppContext();
  return (
    <div className={`mb-6 rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-lg">{title}</h4>
      </div>
      <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
        {children}
      </div>
    </div>
  );
};

const Empty: React.FC<{ message?: string }> = ({ message }) => (
  <div className="text-sm text-gray-500">{message || 'No data available for the selected filters.'}</div>
);

const ITRSummaryReport: React.FC<{ filters: ReportFilters }>= ({ filters }) => {
  return (
    <div>
      <Section title="Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded bg-blue-50 text-blue-700">
            <div className="text-xs">Assessment Year</div>
            <div className="text-lg font-semibold">{filters.assessmentYear}</div>
          </div>
          <div className="p-3 rounded bg-purple-50 text-purple-700">
            <div className="text-xs">Date Range</div>
            <div className="text-lg font-semibold">{filters.fromDate || '—'} to {filters.toDate || '—'}</div>
          </div>
          <div className="p-3 rounded bg-emerald-50 text-emerald-700">
            <div className="text-xs">Assessee Type</div>
            <div className="text-lg font-semibold">{filters.assesseeType}</div>
          </div>
        </div>
      </Section>
      <Section title="Filed Returns Summary">
        <Empty message="No ITR filings found for the selected filters." />
      </Section>
      <Section title="Breakdown by Status">
        <Empty />
      </Section>
    </div>
  );
};

const TaxComputationReport: React.FC<{ filters: ReportFilters }>= ({ filters }) => {
  return (
    <div>
      <Section title="Computation Summary">
        <Empty message={`No computation available for AY ${filters.assessmentYear}.`} />
      </Section>
      <Section title="Income Heads">
        <ul className="list-disc pl-6 space-y-1">
          <li>Salaries</li>
          <li>House Property</li>
          <li>Capital Gains</li>
          <li>Business/Profession</li>
          <li>Other Sources</li>
        </ul>
      </Section>
      <Section title="Deductions & Rebates">
        <ul className="list-disc pl-6 space-y-1">
          <li>Chapter VI-A (80C/80D/...)</li>
          <li>Rebate u/s 87A</li>
        </ul>
      </Section>
    </div>
  );
};

const TDSSummaryReport: React.FC<{ filters: ReportFilters }>= ({ filters }) => {
  return (
    <div>
      <Section title="TDS Overview">
        <Empty message={`No TDS records found for AY ${filters.assessmentYear}.`} />
      </Section>
      <Section title="Quarter-wise Summary">
        <Empty />
      </Section>
      <Section title="Deductor-wise Summary">
        <Empty />
      </Section>
    </div>
  );
};

const CapitalGainsReport: React.FC<{ filters: ReportFilters }>= ({ filters }) => {
  type Txn = {
    date: string;
    asset: string;
    category: 'Equity' | 'Debt' | 'Property' | 'Gold';
    holdingDays: number;
    saleValue: number;
    cost: number;
    indexedCost?: number;
    expenses?: number;
  };

  // Simple dummy dataset – varies a bit by AY so it looks dynamic
  const data: Txn[] = React.useMemo(() => {
    const yearSeed = Number((filters.assessmentYear || '2024-25').slice(0, 4));
    const rnd = (n: number) => Math.round((n + (yearSeed % 7) * 111) / 10) * 10;
    return [
      { date: `${yearSeed - 1}-06-15`, asset: 'ABC Ltd', category: 'Equity', holdingDays: 420, saleValue: rnd(225000), cost: rnd(120000) },
      { date: `${yearSeed - 1}-08-10`, asset: 'XYZ Ltd', category: 'Equity', holdingDays: 180, saleValue: rnd(140000), cost: rnd(110000) },
      { date: `${yearSeed - 1}-11-05`, asset: 'Sovereign Gold Bond', category: 'Gold', holdingDays: 1500, saleValue: rnd(310000), cost: rnd(180000), indexedCost: rnd(210000) },
      { date: `${yearSeed - 1}-12-20`, asset: 'Residential Plot', category: 'Property', holdingDays: 2200, saleValue: rnd(1250000), cost: rnd(800000), indexedCost: rnd(960000), expenses: rnd(25000) },
      { date: `${yearSeed - 1}-04-09`, asset: 'Corporate Bond Fund', category: 'Debt', holdingDays: 300, saleValue: rnd(200000), cost: rnd(175000) },
    ];
  }, [filters.assessmentYear]);

  const rows = data.map((t) => {
    const isEquity = t.category === 'Equity';
    const isLongTerm = isEquity ? t.holdingDays > 365 : t.holdingDays > 1095; // simplified thresholds
    const useIndexed = !isEquity && isLongTerm && typeof t.indexedCost === 'number';
    const baseCost = useIndexed ? (t.indexedCost as number) : t.cost;
    const expenses = t.expenses || 0;
    const gain = t.saleValue - baseCost - expenses;
    const type = isLongTerm ? 'LTCG' : 'STCG';
    const taxNote = isEquity
      ? isLongTerm
        ? 'LTCG 10% (above ₹1L)' 
        : 'STCG 15%'
      : isLongTerm
        ? 'LTCG 20% (indexed)'
        : 'STCG (slab)';
    return { ...t, type, isLongTerm, useIndexed, baseCost, expenses, gain, taxNote };
  });

  const totalSTCG = rows.filter(r => r.type === 'STCG').reduce((s, r) => s + r.gain, 0);
  const totalLTCG = rows.filter(r => r.type === 'LTCG').reduce((s, r) => s + r.gain, 0);
  const netGain = totalSTCG + totalLTCG;

  const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const { theme } = useAppContext();
  const tableCls = `w-full text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`;
  const thCls = `${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-700'} px-3 py-2 text-left`;
  const tdCls = `px-3 py-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`;

  return (
    <div>
      <Section title="Capital Gains Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded bg-blue-50 text-blue-700">
            <div className="text-xs">Assessment Year</div>
            <div className="text-lg font-semibold">{filters.assessmentYear}</div>
          </div>
          <div className="p-3 rounded bg-amber-50 text-amber-700">
            <div className="text-xs">Total STCG</div>
            <div className="text-lg font-semibold">{currency(totalSTCG)}</div>
          </div>
          <div className="p-3 rounded bg-emerald-50 text-emerald-700">
            <div className="text-xs">Total LTCG</div>
            <div className="text-lg font-semibold">{currency(totalLTCG)}</div>
          </div>
        </div>
      </Section>

      <Section title="STCG / LTCG Details">
        <div className={`rounded overflow-x-auto ${theme === 'dark' ? 'border border-gray-700' : 'border border-gray-200'}`}>
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Asset</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Holding</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Sale Value</th>
                <th className={thCls}>Cost{` `}<span className="text-xs">(indexed if LTCG)</span></th>
                <th className={thCls}>Expenses</th>
                <th className={thCls}>Gain/Loss</th>
                <th className={thCls}>Tax Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className={tdCls}>{r.date}</td>
                  <td className={tdCls}>{r.asset}</td>
                  <td className={tdCls}>{r.category}</td>
                  <td className={tdCls}>{r.holdingDays} days</td>
                  <td className={tdCls}>{r.type}</td>
                  <td className={tdCls}>{currency(r.saleValue)}</td>
                  <td className={tdCls}>{currency(r.baseCost)}</td>
                  <td className={tdCls}>{currency(r.expenses)}</td>
                  <td className={tdCls}>
                    <span className={r.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {currency(r.gain)}
                    </span>
                  </td>
                  <td className={tdCls}>{r.taxNote}</td>
                </tr>
              ))}
              <tr>
                <td className={tdCls} colSpan={8}><strong>Totals</strong></td>
                <td className={tdCls}><strong>{currency(netGain)}</strong></td>
                <td className={tdCls}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Exemptions & Set-off">
        <ul className="list-disc pl-6 space-y-1">
          <li>Section 54/54F/54EC exemptions can be applied on eligible LTCG (not reflected in dummy data).</li>
          <li>Capital losses can be set-off per Income Tax rules (carry-forward not shown in dummy view).</li>
        </ul>
      </Section>
    </div>
  );
};

const FallbackReport: React.FC = () => {
  return (
    <div>
      <Section title="Report">
        <Empty />
      </Section>
    </div>
  );
};

const ReportViewer: React.FC<ReportViewerProps> = ({ reportId, filters }) => {
  switch (reportId) {
    case 'itr-summary':
      return <ITRSummaryReport filters={filters} />;
    case 'tax-computation':
      return <TaxComputationReport filters={filters} />;
    case 'tds-summary':
      return <TDSSummaryReport filters={filters} />;
    case 'capital-gains':
      return <CapitalGainsReport filters={filters} />;
    default:
      return <FallbackReport />;
  }
};

export default ReportViewer;
