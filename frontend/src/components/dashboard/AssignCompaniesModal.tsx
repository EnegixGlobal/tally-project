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
    fetch(`http://localhost:5000/api/companies-by-ca?ca_id=${caId}`)
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies || []))
      .catch(console.error);
  }, [caId]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/ca-employee-companies?ca_employee_id=${employeeId}`)
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
      const res = await fetch("http://localhost:5000/api/assign-companies-to-ca-employee", {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4">
          Assign Companies to {employeeName}
        </h2>

        <div className="max-h-48 overflow-y-auto mb-4">
          {companies.map((c) => (
            <label key={c.id} className="block cursor-pointer">
              <input
                type="checkbox"
                checked={assignedIds.includes(c.id)}
                onChange={() => toggleCompanyId(c.id)}
                className="mr-2"
              />
              {c.name}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="py-1 px-3 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white py-1 px-4 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCompaniesModal;
