import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { todayLocalIso } from "@/lib/utils";
import { Lock, Calendar, CheckCircle2, Info } from "lucide-react";
import Swal from "sweetalert2";

/* ================= TYPES ================= */

interface Summary {
  totalDeducted: number;
  successCount: number;
  failedCount: number;
  totalUsers: number;
}

interface LockResult {
  alreadyLocked?: boolean;
  date?: string;
  lockedCount: number;
  summary?: Summary;
  message?: string;
}

const LockMeals: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const [date, setDate] = useState<string>(todayLocalIso());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LockResult | null>(null); // success summary
  const [info, setInfo] = useState<string | null>(null); // already-locked / no-pending
  const [error, setError] = useState<string | null>(null);

  const resetMessages = () => {
    setResult(null);
    setInfo(null);
    setError(null);
  };

  const handleLock = async () => {
    if (!date) {
      Swal.fire("তারিখ দিন", "অনুগ্রহ করে একটি তারিখ নির্বাচন করুন", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "মিল লক করবেন?",
      html: `<div style="text-align:left">
          <div><b>তারিখ:</b> ${date}</div>
          <div style="margin-top:6px">এই দিনের সব পেন্ডিং মিল লক হবে এবং ব্যবহারকারীদের ওয়ালেট থেকে টাকা কেটে নেওয়া হবে। লক হওয়ার পর ঐ দিনের জন্য আর অর্ডার করা যাবে না।</div>
        </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, লক করুন",
      cancelButtonText: "বাতিল",
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    resetMessages();
    try {
      const res = await axiosSecure.post("/meals/admin/lock-expired", {
        targetDate: date,
      });
      const data: LockResult = res?.data?.data ?? { lockedCount: 0 };

      if (data.alreadyLocked) {
        // Already locked previously — tell the admin, no action taken
        setInfo(
          data.message ||
            `এই দিনের (${date}) মিল আগে থেকেই লক করা আছে। নতুন করে কিছু করা হয়নি।`,
        );
      } else if (data.lockedCount > 0) {
        setResult(data);
      } else {
        // No pending orders — day is now marked locked
        setInfo(
          data.message ||
            `এই দিনের (${date}) কোনো পেন্ডিং অর্ডার ছিল না। দিনটি লক হিসেবে চিহ্নিত করা হলো।`,
        );
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "অনুরোধ ব্যর্থ হয়েছে (Request failed)");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🔒 মিল লক করুন</h1>
        <p className="text-sm text-muted-foreground">
          নির্দিষ্ট দিনের মিল লক করুন (যেকোনো দিন — আগের ভুলে যাওয়া দিন বা ভবিষ্যতের দিন)
        </p>
      </div>

      {/* Lock control */}
      <div className="bg-card rounded-lg shadow-sm border p-6 space-y-4">
        <label className="text-sm font-bold text-muted-foreground block">
          কোন দিনের মিল লক করবেন?
        </label>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="relative w-full sm:w-64">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                resetMessages();
              }}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleLock}
            disabled={loading}
            variant="destructive"
            size="lg"
          >
            <Lock className="w-5 h-5 mr-2" />
            {loading ? "লক করা হচ্ছে..." : `${date || "—"} এর মিল লক করুন`}
          </Button>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-4 mt-2">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• সাধারণত মিল প্রতিদিন স্বয়ংক্রিয়ভাবে (অটো-লক টাইমে) লক হয়।</li>
            <li>• এখান থেকে আপনি যেকোনো দিন হাতে লক করতে পারবেন — যেমন আগের কোনো দিন ভুলে গেলে।</li>
            <li>• লক করলে ওয়ালেট থেকে মিলের টাকা কেটে নেওয়া হবে এবং ঐ দিনের অর্ডার বন্ধ হয়ে যাবে।</li>
            <li>• দিনটি আগে থেকেই লক থাকলে কোনো পরিবর্তন হবে না — শুধু জানিয়ে দেওয়া হবে।</li>
          </ul>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-primary mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">লক করা হচ্ছে...</p>
          <p className="text-sm text-muted-foreground">Processing orders, please wait...</p>
        </div>
      )}

      {/* Success Summary */}
      {result && !loading && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold">
              {result.date} এর মিল সফলভাবে লক হয়েছে
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">লক হয়েছে</p>
              <p className="text-lg font-bold">{result.lockedCount}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">ইউজার</p>
              <p className="text-lg font-bold">{result.summary?.totalUsers ?? 0}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">কাটা হয়েছে</p>
              <p className="text-lg font-bold">৳{result.summary?.totalDeducted ?? 0}</p>
            </div>
            <div className="bg-card rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">ব্যর্থ (ব্যালেন্স নেই)</p>
              <p className="text-lg font-bold">{result.summary?.failedCount ?? 0}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin-dashboard/locked-meals")}
          >
            লক করা মিল দেখুন
          </Button>
        </div>
      )}

      {/* Info (already locked / no pending) */}
      {info && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg p-4 flex items-start gap-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{info}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-start gap-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default LockMeals;
