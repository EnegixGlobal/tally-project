import React, { useEffect, useState } from "react";
import { useAuth } from "../../home/context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";

interface RequireSubscriptionProps {
  children?: React.ReactNode;
}

const RequireSubscription: React.FC<RequireSubscriptionProps> = ({ children }) => {
  const { user, companyId } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      // If no user or no company, let existing guards handle it
      if (!user || !companyId) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/company-subscription/status/${companyId}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          setIsChecking(false);
          return;
        }

        const data = await res.json();
        const status = data?.data;

        if (!status || status.isExpired) {
          setIsBlocked(true);
          setMessage(
              status?.isTrial
                ? "Your free trial has ended. To continue using the product, please renew your subscription."
                : "Your subscription has expired. Please renew or subscribe to continue using the service."
            );
        }
      } catch (err) {
        console.error("Error checking subscription status:", err);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [user, companyId]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">Checking subscription status...</div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="max-w-md rounded-lg border border-red-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Subscription Required
          </h2>
          <p className="text-sm text-gray-700 mb-4">{message}</p>
          <button
            onClick={() => navigate("/app/pricing")}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View Plans / Renew Now
          </button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RequireSubscription;

