import React, { useEffect, useState } from "react";

interface Props {
  caId: string;
  employeeId: number;
  employeeName: string;
  onClose: () => void;
  onAssigned: () => void; // Callback to refresh employee list
}

const AssignCompaniesModal: React.FC<Props> = ({
  caId,
  employeeId,
  employeeName,
  onClose,
  onAssigned,
}) => {
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/companies-by-ca?ca_id=${caId}`)
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies || []))
      .catch(console.error);
  }, [caId]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ca-employee-companies?ca_employee_id=${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        const ids = data.companies?.map((c: any) => c.id) || [];
        setAssignedIds(ids);
      })
      .catch(console.error);
  }, [employeeId]);

  const toggleCompanyId = (id: number) => {
    setAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assign-companies-to-ca-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca_employee_id: employeeId,
          company_ids: assignedIds,
        }),
      });
      if (!res.ok) throw new Error("Assignment failed");
      alert("Companies updated successfully");
      onAssigned();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error updating companies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20">
        <div className="p-8 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold">Assign Companies</h2>
          <p className="text-blue-100 mt-1">Select access for {employeeName}</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            {companies.length > 0 ? companies.map((c) => (
              <label
                key={c.id}
                className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-md group ${assignedIds.includes(c.id)
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                    : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={assignedIds.includes(c.id)}
                  onChange={() => toggleCompanyId(c.id)}
                  className="w-6 h-6 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                />
                <span className={`ml-4 font-semibold text-lg ${assignedIds.includes(c.id) ? 'text-blue-700' : 'text-gray-700'}`}>
                  {c.name}
                </span>
              </label>
            )) : (
              <p className="text-center py-8 text-gray-500 italic">No companies available to assign.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 border-t pt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignCompaniesModal;
