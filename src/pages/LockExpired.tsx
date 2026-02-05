import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/hooks/useAxiosSecure";

interface Meal {
  mealType: string;
  quantity: number;
  price: number;
  date: string;
}

interface DeductionResult {
  userId: string;
  totalMealCost: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  meals: Meal[];
}

interface Summary {
  totalDeducted: number;
  successCount: number;
  failedCount: number;
  totalUsers: number;
}

interface LockResult {
  lockedCount: number;
  deductionResults: DeductionResult[];
  summary: Summary;
}

interface UserData {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
}

const LockExpired: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosSecure.post("/meals/admin/lock-expired");
      if (res?.data?.success === true) {
        setResult(res.data?.data);
      }
    } catch (err: unknown) {
      let msg = "Request failed";
      if (err && typeof err === "object") {
        const e = err as any;
        msg = e?.response?.data?.message || e?.message || msg;
      }
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details when result changes
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!result?.deductionResults?.length) return;

      setLoadingUsers(true);
      const userIds = result.deductionResults.map((d) => d.userId);
      const uniqueUserIds = [...new Set(userIds)];

      const userDataMap: Record<string, UserData> = {};

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const res = await axiosSecure.get(`/user/${userId}`);
            if (res?.data?.success && res?.data?.data) {
              userDataMap[userId] = res.data.data;
            }
          } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err);
          }
        })
      );

      setUsersData(userDataMap);
      setLoadingUsers(false);
    };

    fetchUserDetails();
  }, [result, axiosSecure]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Lock Expired Orders</h2>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleLock} className="bg-primary" disabled={loading}>
          {loading ? "Locking..." : "Lock Expired Orders"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Locked Orders</p>
                <p className="text-xl font-bold">{result.lockedCount}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Deducted</p>
                <p className="text-xl font-bold text-red-600">৳{result.summary.totalDeducted}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Success / Failed</p>
                <p className="text-xl font-bold">
                  <span className="text-green-600">{result.summary.successCount}</span> /{" "}
                  <span className="text-red-600">{result.summary.failedCount}</span>
                </p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-xl font-bold">{result.summary.totalUsers}</p>
              </div>
            </div>
          </div>

          {/* Deduction Results Table */}
          {result.deductionResults.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold mb-2">Deduction Details</h3>
              {loadingUsers && (
                <p className="text-sm text-gray-500 mb-2">Loading user details...</p>
              )}
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance Before
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance After
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Meals
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {result.deductionResults.map((deduction, index) => {
                    const user = usersData[deduction.userId];
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user?.name || "Loading..."}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user?.email || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {user?.phone || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-red-600">
                          ৳{deduction.totalMealCost}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          ৳{deduction.balanceBefore}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          ৳{deduction.balanceAfter}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              deduction.status === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {deduction.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {deduction.meals.map((meal, mealIndex) => (
                              <div
                                key={mealIndex}
                                className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded"
                              >
                                <span className="capitalize font-medium">{meal.mealType}</span>
                                <span className="mx-1">×</span>
                                <span>{meal.quantity}</span>
                                <span className="mx-1">-</span>
                                <span>৳{meal.price}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({meal.date})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result.deductionResults.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No deductions were made.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LockExpired;
