import React, { useState, useEffect } from "react";

type Company = {
  id: number;
  name: string;
};

interface AddCaEmployeeFormProps {
  caId: string;
  onSuccess?: () => void; // optional callback to refresh list or close modal
}

const AddCaEmployeeForm: React.FC<AddCaEmployeeFormProps> = ({ caId, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    adhar: "",
    password: "",
    assignedCompanyIds: [] as number[],
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
useEffect(() => {
    const caId = localStorage.getItem("employee_id");
    if (!caId) return;

    fetch(`http://localhost:5000/api/companies-by-ca?ca_id=${caId}`)
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies || []))
      .catch((err) => console.error("Error fetching CA companies:", err));
  }, []);

  

  // Fetch only companies assigned to this CA
//   useEffect(() => {
//     fetch(`http://localhost:5000/api/companies-by-employee?employee_id=${caId}`)
//       .then((res) => res.json())
//       .then((data) => setCompanies(data.companies || []))
//       .catch(console.error);
//   }, [caId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
  setForm((prev) => ({ ...prev, assignedCompanyIds: selectedOptions }));
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create CA Employee
      const res = await fetch("http://localhost:5000/api/ca-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca_id: caId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          adhar: form.adhar,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create CA employee");
      const ca_employee_id = data.ca_employee_id;

      // 2. Assign Companies
      const res2 = await fetch("http://localhost:5000/api/assign-companies-to-ca-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca_employee_id,
          company_ids: form.assignedCompanyIds,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.message || "Failed to assign companies");

      alert("Employee added and companies assigned!");
      setForm({
        name: "",
        email: "",
        phone: "",
        adhar: "",
        password: "",
        assignedCompanyIds: [],
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white rounded-xl shadow space-y-4 max-w-md mx-auto"
    >
      <h3 className="text-lg font-semibold mb-2">Add CA Employee & Assign Companies</h3>
      <input name="name" type="text" value={form.name} onChange={handleInput} placeholder="Name *" required className="border p-2 rounded w-full" />
      <input name="email" type="email" value={form.email} onChange={handleInput} placeholder="Email *" required className="border p-2 rounded w-full" />
      <input name="phone" type="text" value={form.phone} onChange={handleInput} placeholder="Phone" className="border p-2 rounded w-full" />
      <input name="adhar" type="text" value={form.adhar} onChange={handleInput} placeholder="Aadhaar" className="border p-2 rounded w-full" />
      <input name="password" type="password" value={form.password} onChange={handleInput} placeholder="Password *" required className="border p-2 rounded w-full" />
      <label className="block font-medium">Assign Companies *</label>
      <select
            multiple
            value={form.assignedCompanyIds.map(String)}
            onChange={handleCompanySelect}
            className="border p-2 rounded w-full h-28"
            >
            {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            </select>

      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-2">
        {loading ? "Adding..." : "Add Employee"}
      </button>
    </form>
  );
};

export default AddCaEmployeeForm;
