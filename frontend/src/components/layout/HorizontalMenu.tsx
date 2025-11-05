// import React from 'react';
// import { useAppContext } from '../../context/AppContext';
// import { useNavigate, useLocation } from 'react-router-dom';

// const menuItems = [
//   { title: 'Dashboard', path: '/' },
//   { title: 'Masters', path: '/masters' },
//   { title: 'Vouchers', path: '/vouchers' },
//   { title: 'Reports', path: '/reports' },
//   { title: 'Accounting', path: '/accounting' },
//   { title: 'Inventory', path: '/inventory' },
//   { title: 'GST', path: '/gst' },
//   { title: 'TDS', path: '/tds' },
//   { title: 'Audit', path: '/audit' },
//   { title: 'Config', path: '/config' },
// ];

// const HorizontalMenu: React.FC = () => {
//   const { theme } = useAppContext();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const isActive = (path: string) =>
//     location.pathname === path || location.pathname.startsWith(`${path}/`);

//   return (
//     <div
//       className={`fixed top-14 left-60 right-0 z-40 border-b h-10 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-rounded ${
//         theme === 'dark'
//           ? 'bg-gray-900 text-gray-200 border-gray-700 scrollbar-thumb-gray-700'
//           : 'bg-blue-800 text-white border-blue-700 scrollbar-thumb-blue-700'
//       }`}
//     >
//       <div className="flex items-center h-full px-2 space-x-2 min-w-max">
//         {menuItems.map((item, index) => (
//           <button
//             key={index}
//             onClick={() => navigate(item.path)}
//             className={`px-3 py-1 rounded text-sm transition-colors flex-shrink-0 ${
//               isActive(item.path)
//                 ? theme === 'dark'
//                   ? 'bg-gray-700'
//                   : 'bg-blue-700'
//                 : 'hover:bg-blue-700 dark:hover:bg-gray-700'
//             }`}
//           >
//             {item.title}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default HorizontalMenu;





import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface HorizontalMenuProps {
  sidebarOpen: boolean;
}

const menuItems = [
  { title: 'Dashboard', path: '/app' },
  { title: 'Masters', path: '/app/masters' },
  { title: 'Vouchers', path: '/app/vouchers' },
  { title: 'Reports', path: '/app/reports' },
  // { title: 'Accounting', path: '/app/accounting' },
  // { title: 'Inventory', path: '/app/inventory' },
  { title: 'Vouchers Register', path: '/app/voucher-register' },
  // { title: 'Sales Order', path: '/app/sales-order' },
  { title: 'GST', path: '/app/gst' },
  { title: 'TDS', path: '/app/tds' },
  { title: 'Audit', path: '/app/audit' },
  { title: 'Config', path: '/app/config' },
];

const HorizontalMenu: React.FC<HorizontalMenuProps> = ({ sidebarOpen }) => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div
      className={`fixed top-14 z-40 h-10 overflow-x-auto whitespace-nowrap transition-all duration-300 ${
        sidebarOpen ? 'left-60' : 'left-16'
      } right-0 border-b scrollbar-thin scrollbar-thumb-rounded ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-200 border-gray-700 scrollbar-thumb-gray-700'
          : 'bg-blue-800 text-white border-blue-700 scrollbar-thumb-blue-700'
      }`}
    >
      <div className="flex items-center h-full px-2 space-x-2 min-w-max">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`px-3 py-1 rounded text-sm transition-colors flex-shrink-0 ${
              isActive(item.path)
                ? theme === 'dark'
                  ? 'bg-gray-700'
                  : 'bg-blue-700'
                : 'hover:bg-blue-700 dark:hover:bg-gray-700'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HorizontalMenu;
