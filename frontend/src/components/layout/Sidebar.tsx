import React from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../home/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BarChart2,
  BookOpen,
  FileText,
  Settings,
  Database,
  ShoppingCart,
  Truck,
  BookKey,
  Wallet,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { theme } = useAppContext();
  const { logout, hasCompany, checkPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: any[] = [
    { icon: <Home size={18} />, title: "Dashboard", path: "/app" },
    { icon: <Database size={18} />, title: "Masters", path: "/app/masters", permissionId: ['ledger', 'item'] },
    { icon: <FileText size={18} />, title: "Vouchers", path: "/app/vouchers", permissionId: ['payment', 'receipt', 'contra', 'journal', 'sales', 'purchase', 'sales-order', 'purchase-order', 'quotation', 'debit-note', 'credit-note', 'stock-journal', 'delivery-note'] },
    { icon: <BookKey size={18} />, title: "Vouchers Register", path: "/app/voucher-register", permissionId: 'payment' }, // Using payment as proxy for general voucher access
    { icon: <BarChart2 size={18} />, title: "Reports", path: "/app/reports", permissionId: 'reports' },
    { icon: <ShoppingCart size={18} />, title: "GST", path: "/app/gst", permissionId: 'reports' },
    { icon: <Truck size={18} />, title: "TDS", path: "/app/tds", permissionId: 'reports' },
    { icon: <Wallet size={18} />, title: "Income Tax", path: "/app/income-tax", permissionId: 'reports' },
    { icon: <BookOpen size={18} />, title: "Audit", path: "/app/audit", permissionId: 'reports' },
    { icon: <Settings size={18} />, title: "Configuration", path: "/app/config" },
  ];

  const allowedWhenNoCompany = ["/app", "/app/company"];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div
      className={`${isOpen ? "w-60" : "w-16"
        } transition-width duration-300 ease-in-out h-full ${theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-blue-800 text-white"
        } border-r ${theme === "dark" ? "border-gray-700" : "border-blue-700"
        } fixed top-12 left-0 z-10`}
    >
      <nav className="p-2 pb-16">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            // Check if user has permission for this item
            let hasPermission = true;
            if (item.permissionId) {
              if (Array.isArray(item.permissionId)) {
                hasPermission = item.permissionId.some((pid: string) => checkPermission(pid));
              } else {
                hasPermission = checkPermission(item.permissionId);
              }
            }

            const disabled =
              (!hasCompany && !allowedWhenNoCompany.includes(item.path)) || !hasPermission;

            return (
              <li key={index}>
                <button
                  onClick={() => !disabled && navigate(item.path)}
                  disabled={disabled}
                  title={
                    !hasPermission
                      ? "You don't have permission to access this module"
                      : !hasCompany && !allowedWhenNoCompany.includes(item.path)
                        ? "Create a company first to access this"
                        : undefined
                  }
                  className={`w-full flex items-center p-2 rounded-md ${isActive(item.path)
                    ? theme === "dark"
                      ? "bg-gray-700"
                      : "bg-blue-700"
                    : "hover:bg-opacity-20 hover:bg-blue-700 dark:hover:bg-gray-700"
                    } transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <div className="ml-3 flex flex-grow justify-between items-center">
                      <span className="flex items-center gap-2">
                        {item.title}
                        {!hasPermission && <Lock size={12} className="text-red-400" />}
                      </span>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 🔥 Logout Button - Bottom Fixed */}
      <div className="absolute  bottom-15 left-0 w-full px-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 cursor-pointer bg-black  text-white p-2 rounded-md transition-colors"
        >
          <LogOut size={18} />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
