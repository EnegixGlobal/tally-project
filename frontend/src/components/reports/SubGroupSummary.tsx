import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft } from "lucide-react";

interface Ledger {
    id: number;
    name: string;
    openingBalance: number;
    balanceType: "debit" | "credit";
}

interface Group {
    id: number;
    name: string;
    parent: number | null;
}

const SubGroupSummary: React.FC = () => {
    const { theme } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId } = useParams<{ groupId: string }>();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subGroups, setSubGroups] = useState<Group[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [groupName, setGroupName] = useState<string>(
        location.state?.groupName || `Group ${groupId}`
    );

    const companyId = localStorage.getItem("company_id") || "";
    const ownerType = localStorage.getItem("supplier") || "";
    const ownerId =
        localStorage.getItem(
            ownerType === "employee" ? "employee_id" : "user_id"
        ) || "";

    useEffect(() => {
        const fetchGroupData = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${import.meta.env.VITE_API_URL
                    }/api/balance-sheet/group?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&id=${groupId}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to load group data");
                const data = await res.json();

                if (data.success) {
                    setSubGroups(data.groups || []);
                    // Also fetch ledgers if any are directly associated
                    const rawLedgers = data.ledgers || [];
                    const normalizedLedgers = rawLedgers.map((l: any) => ({
                        id: l.id,
                        name: l.name,
                        openingBalance: parseFloat(l.opening_balance) || 0,
                        balanceType: l.balance_type,
                    }));
                    setLedgers(normalizedLedgers);
                }
            } catch (err: any) {
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        if (groupId) {
            fetchGroupData();
        }
    }, [groupId, companyId, ownerType, ownerId]);

    return (
        <div className="pt-[56px] px-4">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate("/app/reports/balance-sheet")}
                    className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">{groupName}</h1>
            </div>

            <div
                className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                    }`}
            >
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {!loading && !error && (
                    <>
                        {/* Subgroups Section */}
                        {subGroups.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 text-blue-600">
                                    Sub-Groups
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b dark:border-gray-700">
                                                <th className="py-3 px-4 font-semibold">Group Name</th>
                                                <th className="py-3 px-4 text-right">Debit</th>
                                                <th className="py-3 px-4 text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subGroups.map((group) => (
                                                <tr
                                                    key={group.id}
                                                    onClick={() =>
                                                        navigate(`/app/reports/group-summary/${group.id}`)
                                                    }
                                                    className={`border-b cursor-pointer transition-colors ${theme === "dark"
                                                        ? "border-gray-700 hover:bg-gray-700"
                                                        : "border-gray-200 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <td className="py-3 px-4 text-blue-600 font-medium">
                                                        {group.name}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                                                        View Details &rarr;
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                                                        View Details &rarr;
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}



                        {subGroups.length === 0 && ledgers.length === 0 && (
                            <p className="opacity-75 italic text-center py-10">
                                No subgroups or ledgers found in this group.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SubGroupSummary;
