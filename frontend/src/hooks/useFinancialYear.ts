import { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";

export const getFinancialYearRange = (yearStr: string) => {
    const match = yearStr.match(/\d{4}/);
    const year = match ? parseInt(match[0], 10) : new Date().getFullYear();
    const startDate = new Date(year, 3, 1); // April 1 (Month is 0-indexed)
    const endDate = new Date(year + 1, 2, 31, 23, 59, 59, 999); // March 31 of next year
    return { startDate, endDate };
};

export const filterByFinancialYear = <T extends Record<string, any>>(
    data: T[],
    dateField: string,
    finYearStr: string | null
): T[] => {
    if (!finYearStr) return data;
    if (!Array.isArray(data)) return data;

    const { startDate, endDate } = getFinancialYearRange(finYearStr);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return data.filter((item) => {
        const dStr = item[dateField];
        if (!dStr) return false;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return false;
        return d.getTime() >= startTime && d.getTime() <= endTime;
    });
};

export const getAvailableFinYears = (startYear: string | number = 2020) => {
    const currentYear = new Date().getFullYear();
    const isPastMarch = new Date().getMonth() >= 3;
    const endFinYear = isPastMarch ? currentYear : currentYear - 1;
    const start = typeof startYear === 'string' ? parseInt(startYear.match(/\d{4}/)?.[0] || '2020', 10) : startYear;

    const years = [];
    for (let y = start; y <= endFinYear + 2; y++) {
        years.push(`${y}-${(y + 1).toString().slice(2)}`);
    }
    return years;
};

export const getFinancialYearDefaults = (finYearStr: string) => {
    const { startDate, endDate } = getFinancialYearRange(finYearStr || "2024-25");

    const today = new Date();
    let defaultDate = today;

    if (today < startDate) defaultDate = startDate;
    if (today > endDate) defaultDate = endDate;

    // Use local ISO format without timezone shift issues
    const formatDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    return {
        minDate: formatDate(startDate),
        maxDate: formatDate(endDate),
        defaultDate: formatDate(defaultDate)
    };
};

export const useFinancialYear = () => {
    const { companyInfo } = useCompany();
    const [selectedFinYear, setFinYear] = useState<string>(() => {
        return localStorage.getItem("selectedFinYear") || "";
    });

    useEffect(() => {
        if (!localStorage.getItem("selectedFinYear") && companyInfo?.financialYear) {
            setFinYear(companyInfo.financialYear);
            localStorage.setItem("selectedFinYear", companyInfo.financialYear);
        } else if (!localStorage.getItem("selectedFinYear")) {
            const currentYear = new Date().getFullYear();
            const isPastMarch = new Date().getMonth() >= 3;
            const y = isPastMarch ? currentYear : currentYear - 1;
            const fy = `${y}-${(y + 1).toString().slice(2)}`;
            setFinYear(fy);
            localStorage.setItem("selectedFinYear", fy);
        }
    }, [companyInfo]);

    const setSelectedFinYear = (year: string) => {
        setFinYear(year);
        localStorage.setItem("selectedFinYear", year);
        window.dispatchEvent(new Event("finYearChanged"));
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setFinYear(localStorage.getItem("selectedFinYear") || "");
        };
        window.addEventListener("finYearChanged", handleStorageChange);
        return () => window.removeEventListener("finYearChanged", handleStorageChange);
    }, []);

    return { selectedFinYear, setSelectedFinYear };
};
