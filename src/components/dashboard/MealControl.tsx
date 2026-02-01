import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Search,
  Filter,
  Save,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

interface MealOrder {
  _id: string;
  userId: { _id: string; name: string; phone?: string; email?: string };
  buildingId: string;
  flatId: { _id: string; name: string } | string;
  mealDate: string;
  mealType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface GroupedMealData {
  userId: string;
  userName: string;
  userEmail?: string;
  flatName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  status: string;
}

const getTomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const MealControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const axiosSecure = useAxiosSecure();
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [date, setDate] = useState<string>(getTomorrowISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealCount, setMealCount] = useState([]);

  useEffect(() => {
    const fetchOrders = async (d: string) => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosSecure.get(`/meals/admin/orders/date/${d}`);
        setOrders(res.data?.data || []);
      } catch (err: unknown) {
        let message = "Failed to load orders";
        if (err && typeof err === "object") {
          const e = err as any;
          message = e?.response?.data?.message || e?.message || message;
        }
        setError(message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders(date);
  }, [date, axiosSecure]);

  useEffect(() => {
    const fetchMealOrderData = async () => {
      try {
        const response = await axiosSecure.get(
          `meals/admin/summary/date/${date}`
        );
        setMealCount(response?.data?.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMealOrderData();
  }, [axiosSecure, date]);

  // Group orders by user
  const groupedMeals: GroupedMealData[] = React.useMemo(() => {
    const grouped = new Map<string, GroupedMealData>();

    orders.forEach((order) => {
      const userId = order.userId._id;
      
      if (!grouped.has(userId)) {
        grouped.set(userId, {
          userId: userId,
          userName: order.userId.name,
          userEmail: order.userId.email,
          flatName: typeof order.flatId === "string" ? order.flatId : order.flatId?.name || "",
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          status: order.status,
        });
      }

      const userMeal = grouped.get(userId)!;
      
      if (order.mealType === "breakfast") {
        userMeal.breakfast = order.quantity;
      } else if (order.mealType === "lunch") {
        userMeal.lunch = order.quantity;
      } else if (order.mealType === "dinner") {
        userMeal.dinner = order.quantity;
      }
    });

    return Array.from(grouped.values());
  }, [orders]);

  // Filter grouped meals
  const filteredMeals = groupedMeals.filter((meal) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      meal.userName.toLowerCase().includes(searchLower) ||
      meal.flatName.toLowerCase().includes(searchLower) ||
      (meal.userEmail && meal.userEmail.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" /> মিল কন্ট্রোল প্যানেল
          </h1>
          <p className="text-muted-foreground mt-1">
            তারিখ (YYYY-MM-DD): {date}{" "}
            <span className="text-xs text-muted-foreground ml-2">(আগামীকাল)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" /> তারিখ পরিবর্তন
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/admin-dashboard/lock-expired">Lock Expired</Link>
          </Button>
          <Button className="gap-2 shadow-glow bg-primary">
            <Save className="w-4 h-4" /> সব সেভ করুন
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mealCount.map((data: any, i) => (
          <div
            key={i}
            className="glass p-4 rounded-xl border border-border/50 flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg bg-secondary`}></div>
            <div>
              <p className="text-xs text-muted-foreground">{data._id}</p>
              <p className="text-xl font-bold">{data.totalQuantity} জন</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="glass p-4 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="নাম বা রুম নম্বর দিয়ে খুঁজুন..."
            className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-hidden focus:ring-2 focus:ring-primary/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="secondary" className="gap-2 flex-1 md:flex-none">
            <Filter className="w-4 h-4" /> ফিল্টার
          </Button>
        </div>
      </div>

      {/* Meal Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ইউজার</th>
                <th className="px-6 py-4 text-center">ফ্ল্যাট</th>
                <th className="px-6 py-4 text-center">সকালের নাস্তা</th>
                <th className="px-6 py-4 text-center">দুপুরের খাবার</th>
                <th className="px-6 py-4 text-center">রাতের খাবার</th>
                <th className="px-6 py-4 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">
                    লোড হচ্ছে...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredMeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">
                    No orders for {date}
                  </td>
                </tr>
              )}

              {filteredMeals.map((meal) => (
                <motion.tr
                  layout
                  key={meal.userId}
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold group-hover:text-primary transition-colors">
                        {meal.userName}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {meal.userEmail}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">{meal.flatName}</td>
                  <td className="px-6 py-4 text-center">
                    {meal.breakfast > 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-600 font-bold">
                        {meal.breakfast}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {meal.lunch > 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-600 font-bold">
                        {meal.lunch}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {meal.dinner > 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 font-bold">
                        {meal.dinner}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground capitalize">
                    {meal.status}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MealControl;