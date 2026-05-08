import React, { useEffect, useState, useMemo } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Calendar,
  Users,
  Utensils,
  Wallet,
  Plus,
  Building as BuildingIcon,
  Loader2,
} from "lucide-react";
import AddLockedMealModal from "@/components/dashboard/AddLockedMealModal";
import { formatDatePretty, todayLocalIso } from "@/lib/utils";
import {
  downloadLockedMealsExcel,
  ExcelBuildingSection,
  ExcelFlatRow,
} from "@/lib/lockedMealsExcel";

interface Order {
  _id: string;
  userId: { _id?: string; name?: string; phone?: string; email?: string } | any;
  buildingId?: { name?: string } | any;
  flatId?: { name?: string } | any;
  mealDate?: string;
  mealType?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: string;
  isLocked?: boolean;
  isPaid?: boolean;
  createdAt?: string;
}

interface UserMealSummary {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  building: string;
  flat: string;
  breakfast: { qty: number; price: number };
  lunch: { qty: number; price: number };
  dinner: { qty: number; price: number };
  totalQty: number;
  totalPrice: number;
  isPaid: boolean;
}

interface BuildingScreenSection {
  buildingName: string;
  users: UserMealSummary[];
  totals: {
    breakfast: number;
    lunch: number;
    dinner: number;
    totalQty: number;
    totalPrice: number;
  };
}

const LockedMeals: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  // Use local-timezone date — toISOString() gives UTC, which is wrong after
  // midnight in BD timezone (UTC+6) and would default the page to yesterday.
  const [selectedDate, setSelectedDate] = useState(todayLocalIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const fetchData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosSecure.get(`/meals/admin/locked-meals/${date}`);
      setData(res.data.data || res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
    }
  }, [selectedDate]);

  // One row per user — used by both the building-grouped screen view and
  // (indirectly) for header counts.
  const userMealSummaries = useMemo((): UserMealSummary[] => {
    if (!data?.orders) return [];

    const userMap = new Map<string, UserMealSummary>();

    data.orders.forEach((order: Order) => {
      const oderId = order.userId?._id || order.userId;
      const existing = userMap.get(oderId);

      if (existing) {
        if (order.mealType === "breakfast") {
          existing.breakfast.qty += order.quantity || 0;
          existing.breakfast.price += order.totalPrice || 0;
        } else if (order.mealType === "lunch") {
          existing.lunch.qty += order.quantity || 0;
          existing.lunch.price += order.totalPrice || 0;
        } else if (order.mealType === "dinner") {
          existing.dinner.qty += order.quantity || 0;
          existing.dinner.price += order.totalPrice || 0;
        }
        existing.totalQty += order.quantity || 0;
        existing.totalPrice += order.totalPrice || 0;
      } else {
        const newEntry: UserMealSummary = {
          userId: oderId,
          userName: order.userId?.name || "-",
          userPhone: order.userId?.phone || "-",
          userEmail: order.userId?.email || "-",
          building: order.buildingId?.name || "-",
          flat: order.flatId?.name || "-",
          breakfast: { qty: 0, price: 0 },
          lunch: { qty: 0, price: 0 },
          dinner: { qty: 0, price: 0 },
          totalQty: order.quantity || 0,
          totalPrice: order.totalPrice || 0,
          isPaid: order.isPaid || false,
        };

        if (order.mealType === "breakfast") {
          newEntry.breakfast.qty = order.quantity || 0;
          newEntry.breakfast.price = order.totalPrice || 0;
        } else if (order.mealType === "lunch") {
          newEntry.lunch.qty = order.quantity || 0;
          newEntry.lunch.price = order.totalPrice || 0;
        } else if (order.mealType === "dinner") {
          newEntry.dinner.qty = order.quantity || 0;
          newEntry.dinner.price = order.totalPrice || 0;
        }

        userMap.set(oderId, newEntry);
      }
    });

    return Array.from(userMap.values());
  }, [data]);

  // Group users by building for the on-screen view (Q1 option b: stacked).
  // Use numeric-aware sort so "N2" comes before "N10".
  const buildingsForScreen = useMemo<BuildingScreenSection[]>(() => {
    const byBuilding = new Map<string, UserMealSummary[]>();
    for (const u of userMealSummaries) {
      if (!byBuilding.has(u.building)) byBuilding.set(u.building, []);
      byBuilding.get(u.building)!.push(u);
    }
    return Array.from(byBuilding.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
      )
      .map(([buildingName, users]) => {
        const sortedUsers = [...users].sort((a, b) =>
          a.flat.localeCompare(b.flat, undefined, { numeric: true }),
        );
        const totals = sortedUsers.reduce(
          (acc, u) => ({
            breakfast: acc.breakfast + u.breakfast.qty,
            lunch: acc.lunch + u.lunch.qty,
            dinner: acc.dinner + u.dinner.qty,
            totalQty: acc.totalQty + u.totalQty,
            totalPrice: acc.totalPrice + u.totalPrice,
          }),
          { breakfast: 0, lunch: 0, dinner: 0, totalQty: 0, totalPrice: 0 },
        );
        return { buildingName, users: sortedUsers, totals };
      });
  }, [userMealSummaries]);

  // For the Excel report — aggregate orders by building, then by flat
  // (one row per flat with combined meal counts). Matches how the manual
  // paper form is keyed. Orders missing a building or flat name are skipped.
  const buildingsForExcel = useMemo<ExcelBuildingSection[]>(() => {
    if (!data?.orders) return [];

    const byBuilding = new Map<string, Map<string, ExcelFlatRow>>();
    for (const order of data.orders as Order[]) {
      const buildingName = order.buildingId?.name?.trim();
      const flatName = order.flatId?.name?.trim();
      if (!buildingName || !flatName) continue; // data hygiene
      if (!byBuilding.has(buildingName)) byBuilding.set(buildingName, new Map());
      const flatMap = byBuilding.get(buildingName)!;
      if (!flatMap.has(flatName)) {
        flatMap.set(flatName, { flatName, breakfast: 0, lunch: 0, dinner: 0 });
      }
      const row = flatMap.get(flatName)!;
      const qty = order.quantity || 0;
      if (order.mealType === "breakfast") row.breakfast += qty;
      else if (order.mealType === "lunch") row.lunch += qty;
      else if (order.mealType === "dinner") row.dinner += qty;
    }

    return Array.from(byBuilding.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
      )
      .map(([buildingName, flatMap]) => {
        const rows = Array.from(flatMap.values()).sort((a, b) =>
          a.flatName.localeCompare(b.flatName, undefined, { numeric: true }),
        );
        const totals = rows.reduce(
          (acc, r) => ({
            breakfast: acc.breakfast + r.breakfast,
            lunch: acc.lunch + r.lunch,
            dinner: acc.dinner + r.dinner,
          }),
          { breakfast: 0, lunch: 0, dinner: 0 },
        );
        return { buildingName, rows, totals };
      });
  }, [data]);

  const grandTotalsForExcel = useMemo(() => {
    const totals = buildingsForExcel.reduce(
      (acc, b) => ({
        breakfast: acc.breakfast + b.totals.breakfast,
        lunch: acc.lunch + b.totals.lunch,
        dinner: acc.dinner + b.totals.dinner,
      }),
      { breakfast: 0, lunch: 0, dinner: 0 },
    );
    return {
      ...totals,
      totalMoney: data?.grandTotal ?? 0,
      totalUsers: userMealSummaries.length,
    };
  }, [buildingsForExcel, data, userMealSummaries.length]);

  // Generate and download a styled .xlsx report. ExcelJS produces real
  // spreadsheet files (sharp text, tiny size, native Bangla support) — much
  // better than the rasterized-HTML PDF approach we used before.
  const handleDownloadExcel = async () => {
    if (buildingsForExcel.length === 0) return;
    try {
      setDownloadingExcel(true);
      await downloadLockedMealsExcel({
        date: selectedDate,
        buildings: buildingsForExcel,
        grandTotals: grandTotalsForExcel,
      });
    } catch (err) {
      console.error("Excel download failed:", err);
      setError("Excel ডাউনলোড করতে সমস্যা হয়েছে");
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Date Picker + Actions */}
      <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-1">
              লক করা মিল রিপোর্ট
            </h1>
            <p className="text-sm text-muted-foreground">
              Locked Meals Report — {formatDatePretty(selectedDate)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 w-full sm:w-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(true)}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                মিল যোগ করুন
              </Button>
              <Button
                onClick={handleDownloadExcel}
                disabled={
                  downloadingExcel ||
                  loading ||
                  buildingsForExcel.length === 0
                }
              >
                {downloadingExcel ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Excel ডাউনলোড
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Data Display */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট ইউজার</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userMealSummaries.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট অর্ডার</div>
                  <div className="text-2xl font-bold text-green-600">
                    {data.totalOrders ?? 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Utensils className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট মিল</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {data.totalMeals ?? 0}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">সর্বমোট টাকা</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ৳{data.grandTotal ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {buildingsForScreen.length === 0 && (
            <div className="bg-card border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">
                এই তারিখে কোনো লক করা মিল নেই
              </p>
            </div>
          )}

          {/* Building-grouped sections (one section per building, stacked) */}
          {buildingsForScreen.map((section) => (
            <div
              key={section.buildingName}
              className="bg-card border rounded-lg shadow-sm overflow-hidden"
            >
              {/* Building header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <BuildingIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      বিল্ডিং: {section.buildingName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {section.users.length} জন ইউজার
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded">
                    🌅 {section.totals.breakfast}
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded">
                    🍛 {section.totals.lunch}
                  </span>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded">
                    🌙 {section.totals.dinner}
                  </span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded font-bold">
                    মোট ৳{section.totals.totalPrice}
                  </span>
                </div>
              </div>

              {/* Users table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Flat</th>
                      <th className="text-center p-3 font-medium">🌅 Breakfast</th>
                      <th className="text-center p-3 font-medium">🍛 Lunch</th>
                      <th className="text-center p-3 font-medium">🌙 Dinner</th>
                      <th className="text-center p-3 font-medium">Total Qty</th>
                      <th className="text-right p-3 font-medium">Total Price</th>
                      <th className="text-center p-3 font-medium">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.users.map((user, idx) => (
                      <tr
                        key={user.userId}
                        className={`${idx % 2 === 0 ? "bg-muted/20" : ""} hover:bg-muted/40 transition-colors`}
                      >
                        <td className="p-3">
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.userEmail}
                          </p>
                        </td>
                        <td className="p-3">{user.userPhone}</td>
                        <td className="p-3 font-semibold">{user.flat}</td>
                        <td className="p-3 text-center">
                          {user.breakfast.qty > 0 ? (
                            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded inline-block">
                              <span className="font-semibold">
                                {user.breakfast.qty}
                              </span>
                              <span className="text-xs ml-1">
                                (৳{user.breakfast.price})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {user.lunch.qty > 0 ? (
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded inline-block">
                              <span className="font-semibold">{user.lunch.qty}</span>
                              <span className="text-xs ml-1">
                                (৳{user.lunch.price})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {user.dinner.qty > 0 ? (
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded inline-block">
                              <span className="font-semibold">
                                {user.dinner.qty}
                              </span>
                              <span className="text-xs ml-1">
                                (৳{user.dinner.price})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-semibold">
                            {user.totalQty}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-primary">
                          ৳{user.totalPrice}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.isPaid
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {user.isPaid ? "✓ Paid" : "✗ Unpaid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-semibold">
                    <tr>
                      <td colSpan={3} className="p-3 text-right">
                        বিল্ডিং মোট:
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-orange-200 px-2 py-1 rounded">
                          {section.totals.breakfast}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-green-200 px-2 py-1 rounded">
                          {section.totals.lunch}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-indigo-200 px-2 py-1 rounded">
                          {section.totals.dinner}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-gray-200 px-2 py-1 rounded">
                          {section.totals.totalQty}
                        </span>
                      </td>
                      <td className="p-3 text-right text-primary">
                        ৳{section.totals.totalPrice}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Locked Meal modal */}
      <AddLockedMealModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultDate={selectedDate}
        onSuccess={() => fetchData(selectedDate)}
      />

    </div>
  );
};

export default LockedMeals;
