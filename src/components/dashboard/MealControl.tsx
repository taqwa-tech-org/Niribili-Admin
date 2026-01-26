import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/hooks/useAxiosSecure";

// টাইপ ডিফিনিশন
interface MealStatus {
  id: string;
  name: string;
  room: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  lastUpdated: string;
}

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

const MealControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const axiosSecure = useAxiosSecure();

  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [date, setDate] = useState<string>("2026-01-27");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // স্যাম্পল টগল (অস্থায়ী)
  const toggleMeal = (id: string, type: 'breakfast' | 'lunch' | 'dinner') => {
    setOrders(prev => prev.map(o =>
      o._id === id ? { ...o, [type]: !((o as any)[type]) } as any : o,
    ));
  };

  const fetchOrders = async (d: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosSecure.get(`/meals/admin/orders/date/${d}`);
      setOrders(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(date);
  }, [date]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" /> মিল কন্ট্রোল প্যানেল
          </h1>
          <p className="text-muted-foreground mt-1">আজকের তারিখ: ১৬ জানুয়ারি, ২০২৬</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="w-4 h-4" /> তারিখ পরিবর্তন
          </Button>
          <Button className="gap-2 shadow-glow bg-primary">
            <Save className="w-4 h-4" /> সব সেভ করুন
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "সকালের নাস্তা", count: "৬৫", icon: Clock, color: "text-blue-500" },
          { label: "দুপুরের খাবার", count: "৭৮", icon: UtensilsCrossed, color: "text-orange-500" },
          { label: "রাতের খাবার", count: "৭২", icon: Clock, color: "text-purple-500" },
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-xl border border-border/50 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">{stat.count} জন</p>
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
            placeholder="নাম বা রুম নম্বর দিয়ে খুঁজুন..."
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
                <th className="px-6 py-4 text-center">মিল টাইপ</th>
                <th className="px-6 py-4 text-center">পরিমাণ</th>
                <th className="px-6 py-4 text-center">মোট মূল্য</th>
                <th className="px-6 py-4 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">লোড হচ্ছে...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-destructive">{error}</td>
                </tr>
              )}
              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">No orders for {date}</td>
                </tr>
              )}

              {orders
                .filter(o => {
                  const name = o.userId?.name || "";
                  const flat = typeof o.flatId === "string" ? o.flatId : o.flatId?.name || "";
                  return name.includes(searchTerm) || flat.includes(searchTerm) || o.mealType.includes(searchTerm);
                })
                .map((o) => (
                <motion.tr layout key={o._id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold group-hover:text-primary transition-colors">{o.userId?.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">{o.userId?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">{typeof o.flatId === 'string' ? o.flatId : o.flatId?.name}</td>
                  <td className="px-6 py-4 text-center capitalize">{o.mealType}</td>
                  <td className="px-6 py-4 text-center">{o.quantity}</td>
                  <td className="px-6 py-4 text-center">৳ {o.totalPrice}</td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">{o.status}</td>
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