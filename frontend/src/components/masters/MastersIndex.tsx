import React from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Package,
  Truck,
  Briefcase,
  Building,
  CreditCard,
  DollarSign,
  FileText,
  BarChart2,
  ScanBarcode,
  Settings,
} from "lucide-react";

const MastersIndex: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const masterCategories = [
    {
      title: "Accounting Masters",
      items: [
        {
          icon: <BookOpen size={20} />,
          name: "Ledger",
          path: "/app/masters/ledger",
        },
        {
          icon: <Users size={20} />,
          name: "Group",
          path: "/app/masters/group",
        },
        {
          icon: <CreditCard size={20} />,
          name: "Currency",
          path: "/app/masters/currency",
        },
        {
          icon: <DollarSign size={20} />,
          name: "Budgets",
          path: "/app/masters/budgets",
        },
        {
          icon: <FileText size={20} />,
          name: "Scenarios",
          path: "/app/masters/scenarios",
        },
        {
          icon: <BarChart2 size={20} />,
          name: "Cost Centers",
          path: "/app/masters/cost-centers",
        },
      ],
    },
    {
      title: "Inventory Masters",
      items: [
        {
          icon: <Package size={20} />,
          name: "Stock Item",
          path: "/app/masters/stock-item",
        },
        {
          icon: <Users size={20} />,
          name: "Stock Group",
          path: "/app/masters/stock-group",
        },
        {
          icon: <Truck size={20} />,
          name: "Units",
          path: "/app/masters/units",
        },
        {
          icon: <Building size={20} />,
          name: "Godowns",
          path: "/app/masters/godowns",
        },
        {
          icon: <Briefcase size={20} />,
          name: "Stock Categories",
          path: "/app/masters/stock-categories",
        },
        {
          icon: <BarChart2 size={20} />,
          name: "Batch Managment",
          path: "/app/masters/stock-item/batches",
        },
        {
          icon: <ScanBarcode  size={20} />,
          name: "Barcode Managment",
          // path: "/app/masters/stock-item/batches",
        },
      ],
    },
    {
      title: "Voucher Types Management",
      items: [
        {
          icon: <Settings size={20} />,
          name: "Sales Types",
          path: "/app/masters/sales-types",
          color:
            theme === "dark"
              ? "bg-gray-900/50 hover:bg-gray-800/50"
              : "bg-gray-50 hover:bg-gray-100",
          iconBg: theme === "dark" ? "bg-gray-800/70" : "bg-gray-100",
          description: "Manage Sales Voucher types",
          category: "import",
        },
      ],
    },
  ];

  return (
    <div className="pt-[56px] px-4 ">
      <h1 className="text-2xl font-bold mb-6">Masters</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {masterCategories.map((category, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {category.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.path)}
                  className={`p-4 rounded-lg flex flex-col items-center text-center transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full mb-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-blue-50"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press Alt+F3 to
          quickly access Masters, or use Ctrl+C to create a new Master.
        </p>
      </div>
    </div>
  );
};

export default MastersIndex;
