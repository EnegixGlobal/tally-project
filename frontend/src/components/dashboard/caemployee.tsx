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
    const cachedCaId = caId || localStorage.getItem("user_id") || localStorage.getItem("employee_id");
    if (!cachedCaId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/companies-by-ca?ca_id=${cachedCaId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched companies for dropdown:", data.companies);
        setCompanies(data.companies || []);
      })
      .catch((err) => console.error("Error fetching CA companies:", err));
  }, [caId]);



  // Fetch only companies assigned to this CA
  //   useEffect(() => {
  //     fetch(`${import.meta.env.VITE_API_URL}/api/companies-by-employee?employee_id=${caId}`)
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

    // Ensure we have a valid caId
    let finalCaId = caId;
    if (!finalCaId) {
      finalCaId = localStorage.getItem("employee_id") || "";
      if (!finalCaId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            finalCaId = JSON.parse(storedUser).id || "";
          } catch (e) {
            console.error("Error parsing user from localStorage", e);
          }
        }
      }
    }

    try {
      // 1. Create CA Employee
      const payload = {
        ca_id: finalCaId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        adhar: form.adhar,
        password: form.password,
      };
      console.log("Submitting CA employee:", payload);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ca-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create CA employee");
      const ca_employee_id = data.ca_employee_id;

      // 2. Assign Companies
      const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/assign-companies-to-ca-employee`, {
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
      className="p-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl space-y-5 max-w-2xl mx-auto border border-white/20"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Add CA Employee
        </h3>
        <p className="text-sm text-gray-500 mt-1">Register a new employee and assign companies</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleInput}
            placeholder="Full Name *"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
        </div>

        <div className="relative">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleInput}
            placeholder="Email Address *"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleInput}
            placeholder="Phone Number"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
          <input
            name="adhar"
            type="text"
            value={form.adhar}
            onChange={handleInput}
            placeholder="Aadhaar Number"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
        </div>

        <div className="relative">
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleInput}
            placeholder="Password *"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 ml-1">Assign Companies *</label>
          <select
            multiple
            value={form.assignedCompanyIds.map(String)}
            onChange={handleCompanySelect}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-40 scrollbar-thin scrollbar-thumb-gray-300"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="py-2 px-1 rounded-lg my-1 hover:bg-blue-50">
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 ml-1 italic">Hold Ctrl/Cmd to select multiple companies</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Adding Employee...</span>
          </div>
        ) : (
          "Add Employee"
        )}
      </button>
    </form>
  );
};

export default AddCaEmployeeForm;
