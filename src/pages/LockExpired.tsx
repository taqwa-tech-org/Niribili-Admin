import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

/* ================= TYPES ================= */

interface Meal {
  mealType: "breakfast" | "lunch" | "dinner";
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

/* ================= COMPONENT ================= */

const LockExpired: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LockResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* ========== LOCK EXPIRED ========== */
  const handleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosSecure.post("/meals/admin/lock-expired");
      if (res?.data?.success === true) {
        setResult(res.data?.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Request failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  /* ========== FETCH USER DETAILS ========== */
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!result?.deductionResults?.length) return;

      setLoadingUsers(true);

      const uniqueUserIds = [
        ...new Set(result.deductionResults.map((d) => d.userId)),
      ];

      const userMap: Record<string, UserData> = {};

      await Promise.all(
        uniqueUserIds.map(async (id) => {
          try {
            const res = await axiosSecure.get(`/user/${id}`);
            if (res?.data?.success) {
              userMap[id] = res.data.data;
            }
          } catch (err) {
            console.error("User fetch failed:", err);
          }
        })
      );

      setUsersData(userMap);
      setLoadingUsers(false);
    };

    fetchUserDetails();
  }, [result, axiosSecure]);

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Lock Expired Orders</h2>

      <Button onClick={handleLock} disabled={loading}>
        {loading ? "Locking..." : "Lock Expired Orders"}
      </Button>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {result && (
        <>
          {/* ===== SUMMARY ===== */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Summary</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">Locked Orders</p>
                <p className="text-xl font-bold">{result.lockedCount}</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">Total Deducted</p>
                <p className="text-xl font-bold text-red-600">
                  ৳{result.summary.totalDeducted}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">Success / Failed</p>
                <p className="text-xl font-bold">
                  <span className="text-green-600">
                    {result.summary.successCount}
                  </span>{" "}
                  /{" "}
                  <span className="text-red-600">
                    {result.summary.failedCount}
                  </span>
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-xl font-bold">
                  {result.summary.totalUsers}
                </p>
              </div>
            </div>
          </div>

          {/* ===== TABLE ===== */}
          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">
              Deduction Details (Next Day Meals)
            </h3>

            {loadingUsers && (
              <p className="text-sm text-gray-500">Loading user details...</p>
            )}

            <table className="min-w-full border rounded bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-center">Breakfast</th>
                  <th className="px-4 py-3 text-center">Lunch</th>
                  <th className="px-4 py-3 text-center">Dinner</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {result.deductionResults.map((d, i) => {
                  const user = usersData[d.userId];

                  const breakfast =
                    d.meals.find((m) => m.mealType === "breakfast")
                      ?.quantity ?? "-";
                  const lunch =
                    d.meals.find((m) => m.mealType === "lunch")?.quantity ??
                    "-";
                  const dinner =
                    d.meals.find((m) => m.mealType === "dinner")?.quantity ??
                    "-";

                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {user?.name || "Loading..."}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {user?.phone || "-"}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold">
                        {breakfast}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {lunch}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {dinner}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            d.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LockExpired;
