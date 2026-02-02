import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Lock } from "lucide-react";

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

const LockExpired: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosSecure.post("/meals/admin/lock-expired");
      if (res?.data?.success === true) {
        const data = res.data.data;
        // Check if there are locked orders and deduction results
        if (data?.lockedCount > 0 || data?.deductionResults?.length > 0) {
          // Navigate to locked-meals page after 2 second delay
          setTimeout(() => {
            navigate("/admin-dashboard/locked-meals");
          }, 2000);
        } else {
          setError("কোনো এক্সপায়ার্ড অর্ডার পাওয়া যায়নি (No expired orders found to lock)");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Request failed");
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">🔒 লক এক্সপায়ার্ড অর্ডার</h1>
            <p className="text-sm text-muted-foreground">Lock Expired Orders & Deduct Balance</p>
          </div>
          
          <Button onClick={handleLock} disabled={loading} variant="destructive" size="lg">
            <Lock className="w-5 h-5 mr-2" />
            {loading ? "Locking..." : "Lock Expired Orders"}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">লক করা হচ্ছে...</p>
          <p className="text-sm text-muted-foreground">Processing orders, please wait...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info Card */}
      {!loading && !error && (
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">📋 তথ্য</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• এই বাটনে ক্লিক করলে সকল এক্সপায়ার্ড অর্ডার লক হয়ে যাবে</li>
            <li>• ইউজারদের ওয়ালেট থেকে মিলের টাকা কেটে নেওয়া হবে</li>
            <li>• লক হওয়ার পর আপনাকে লক করা মিলের পেজে নিয়ে যাওয়া হবে</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LockExpired;
