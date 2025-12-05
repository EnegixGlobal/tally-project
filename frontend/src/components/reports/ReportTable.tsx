import React from "react";

interface Column<T = any> {
  header: string;
  accessor: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}

interface FooterCell {
  accessor: string;
  value: string | number;
}

interface ReportTableProps<T = any> {
  theme: "light" | "dark";
  columns: Column<T>[];
  data: T[];
  footer?: FooterCell[];
  onRowClick?: (row: T) => void;
}

const ReportTable = <T,>({
  theme,
  columns,
  data,
  footer,
  onRowClick,
}: ReportTableProps<T>) => {
  const isDark = theme === "dark";

  const tableBorder = isDark ? "border-gray-500" : "border-gray-400";
  const headBg = isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-black";
  const hoverBg = isDark ? "hover:bg-gray-600" : "hover:bg-gray-100";

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse`}>
        
        {/* ---------------- Header ---------------- */}
        <thead>
          <tr className={`${headBg}`}>
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`p-2 border ${tableBorder} text-${col.align || "left"} font-semibold`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ---------------- Body ---------------- */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`p-4 text-center opacity-70 border ${tableBorder}`}
              >
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`cursor-pointer ${hoverBg} ${isDark ? "text-white" : "text-black"}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className={`p-2 border ${tableBorder} text-${col.align || "left"}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as any)[col.accessor] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {/* ---------------- Footer ---------------- */}
        {footer && (
          <tfoot>
            <tr className={`${headBg} font-bold`}>
              {columns.map((col) => (
                <td
                  key={col.accessor}
                  className={`p-2 border ${tableBorder} text-${col.align || "left"}`}
                >
                  {footer.find((f) => f.accessor === col.accessor)?.value || ""}
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
