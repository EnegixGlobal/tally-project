import React, { useEffect, useState } from "react";
import { useAuth } from "../../home/context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";

interface RequireSubscriptionProps {
  children?: React.ReactNode;
}

const RequireSubscription: React.FC<RequireSubscriptionProps> = ({
  children,
}) => {
  const { user, companyId } = useAuth();
  const navigate = useNavigate();

  // If user object has subscription info (isExpired, hasSubscription), we can use it immediately.
  // isChecking is true only if we're waiting for the first ever subscription check for this company.
  const hasSubInfo = user?.hasSubscription !== undefined;
  const [isChecking, setIsChecking] = useState(!hasSubInfo);
  const [isBlocked, setIsBlocked] = useState(!!user?.isExpired);
  const [message, setMessage] = useState<string | null>(
    user?.isExpired
      ? user?.isTrial
        ? "Your free trial has ended. To continue using the product, please renew your subscription."
        : "Your subscription has expired. Please renew or subscribe to continue using the service."
      : null
  );

  // Sync state with user object changes (from AuthContext background refresh)
  useEffect(() => {
    if (user?.hasSubscription !== undefined) {
      setIsChecking(false);
      setIsBlocked(!!user.isExpired);
      if (user.isExpired) {
        setMessage(
          user.isTrial
            ? "Your free trial has ended. To continue using the product, please renew your subscription."
            : "Your subscription has expired. Please renew or subscribe to continue using the service."
        );
      }
    }
  }, [user]);

  // Fallback: If for some reason user object is there but sub info isn't, 
  // and we really need to fetch (this handles edge cases where AuthContext might not have fetched yet)
  useEffect(() => {
    const check = async () => {
      if (!user || !companyId || hasSubInfo) {
        if (hasSubInfo) setIsChecking(false);
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

        const json = await res.json();
        const status = json?.data;

        if (status && status.isExpired) {
          setIsBlocked(true);
          setMessage(
            status.isTrial
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

    if (!hasSubInfo) {
      check();
    }
  }, [user, companyId, hasSubInfo]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">
          Checking subscription status...
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex i mt-10 items-center justify-center h-full px-4">
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

