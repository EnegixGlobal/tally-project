import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface PermissionsModalProps {
    employeeId: number;
    employeeName: string;
    onClose: () => void;
}

const MODULES = [
    { id: 'payment', name: 'Payment Voucher', category: 'Accounting' },
    { id: 'receipt', name: 'Receipt Voucher', category: 'Accounting' },
    { id: 'contra', name: 'Contra Voucher', category: 'Accounting' },
    { id: 'journal', name: 'Journal Voucher', category: 'Accounting' },
    { id: 'sales', name: 'Sales Voucher', category: 'Trading' },
    { id: 'purchase', name: 'Purchase Voucher', category: 'Trading' },
    { id: 'sales-order', name: 'Sales Order', category: 'Trading' },
    { id: 'purchase-order', name: 'Purchase Order', category: 'Trading' },
    { id: 'quotation', name: 'Quotation', category: 'Trading' },
    { id: 'debit-note', name: 'Debit Note', category: 'Notes' },
    { id: 'credit-note', name: 'Credit Note', category: 'Notes' },
    { id: 'stock-journal', name: 'Stock Journal', category: 'Inventory' },
    { id: 'delivery-note', name: 'Delivery Note', category: 'Inventory' },
    { id: 'import-vouchers', name: 'Import Vouchers', category: 'Import' },
    { id: 'ledger', name: 'Ledger Master', category: 'Masters' },
    { id: 'item', name: 'Item Master', category: 'Masters' },
    { id: 'reports', name: 'All Reports', category: 'Reports' },
];

const PermissionsModal: React.FC<PermissionsModalProps> = ({ employeeId, employeeName, onClose }) => {
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/ca-employee-permissions?ca_employee_id=${employeeId}`)
            .then(res => res.json())
            .then(data => {
                setPermissions(data.permissions || {});
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching permissions:", err);
                setLoading(false);
            });
    }, [employeeId]);

    const handleToggle = (moduleId: string) => {
        setPermissions(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/update-ca-employee-permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ca_employee_id: employeeId,
                    permissions
                })
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Permissions updated successfully',
                    timer: 1500
                });
                onClose();
            } else {
                throw new Error("Failed to update permissions");
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update permissions'
            });
        }
    };

    const categories = Array.from(new Set(MODULES.map(m => m.category)));

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div>
                        <h2 className="text-xl font-bold">Manage Permissions</h2>
                        <p className="text-blue-100 text-sm">Assign access for {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors text-2xl leading-none">
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        categories.map(category => (
                            <div key={category} className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-1">{category}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {MODULES.filter(m => m.category === category).map(module => (
                                        <label
                                            key={module.id}
                                            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all hover:shadow-md ${permissions[module.id] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                                checked={!!permissions[module.id]}
                                                onChange={() => handleToggle(module.id)}
                                            />
                                            <span className={`font-medium ${permissions[module.id] ? 'text-blue-700' : 'text-gray-600'}`}>
                                                {module.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Save Permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionsModal;
