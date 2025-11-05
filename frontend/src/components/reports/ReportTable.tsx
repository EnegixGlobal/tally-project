import React from 'react';

interface Column<T = unknown> {
  header: string;
  accessor: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode | string;
}

interface ReportTableProps<T = unknown> {
  theme: 'light' | 'dark';
  columns: Column<T>[];
  data: T[];
  footer?: { accessor: string; value: string | number }[];
  onRowClick?: (row: T) => void;
}

const ReportTable = <T,>({ theme, columns, data, footer, onRowClick }: ReportTableProps<T>) => {
 return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
            {columns.map(col => (
              <th key={col.accessor} className={`px-4 py-3 text-${col.align || 'left'}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center opacity-70">
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={`${
                  theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-600' : 'border-b border-gray-200 hover:bg-gray-50'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.accessor} className={`px-4 py-3 text-${col.align || 'left'} font-mono`}>
                    {col.render 
                      ? col.render(row) 
                      : String((row as Record<string, unknown>)[col.accessor] ?? '')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot>
            <tr className={`font-bold ${theme === 'dark' ? 'border-t-2 border-gray-600' : 'border-t-2 border-gray-300'}`}>
              {columns.map(col => (
                <td key={col.accessor} className={`px-4 py-3 text-${col.align || 'left'} font-mono`}>
                  {footer.find(f => f.accessor === col.accessor)?.value || ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default ReportTable;