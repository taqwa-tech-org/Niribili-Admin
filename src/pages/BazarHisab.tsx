import React, { useEffect, useMemo, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Pencil,
  Trash2,
  Wallet,
  Utensils,
  TrendingUp,
  PiggyBank,
  ShoppingBasket,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BazarEntry {
  _id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt?: string;
}

interface SummaryData {
  period: {
    startDate: string;
    endDate: string;
    mode: "last30" | "month";
    daysInRange: number;
  };
  totals: {
    totalBazar: number;
    totalMeals: number;
    totalRevenue: number;
    entryCount: number;
  };
  mealBreakdown: { breakfast: number; lunch: number; dinner: number };
  rate: {
    avgCostPerMeal: number | null;
    profit: number | null;
    isAvailable: boolean;
    reason: string | null;
  };
  today: string;
}

interface AvailableMonth {
  year: number;
  month: number;
  total: number;
  entries: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewMode = "last30" | "month";

const LIMIT = 20;

const todayString = () => new Date().toISOString().slice(0, 10);

const fmtBDT = (n: number | null | undefined) =>
  n == null ? "—" : `৳ ${Number(n).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

const fmtDate = (yyyymmdd: string) => {
  const d = new Date(`${yyyymmdd}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const monthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

// ─── Main component ──────────────────────────────────────────────────────────
const BazarHisab: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [view, setView] = useState<ViewMode>("last30");
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [entries, setEntries] = useState<BazarEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // ── Form state (for both Add and Edit) ──────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(todayString());
  const [formAmount, setFormAmount] = useState<string>("");
  const [formNote, setFormNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // ── Period derived from view ────────────────────────────────────────────
  const periodRange = useMemo(() => {
    if (view === "last30") {
      const end = todayString();
      const d = new Date(`${end}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - 29);
      return { startDate: d.toISOString().slice(0, 10), endDate: end };
    }
    const mm = String(selectedMonth).padStart(2, "0");
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return {
      startDate: `${selectedYear}-${mm}-01`,
      endDate: `${selectedYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [view, selectedYear, selectedMonth]);

  // ── Fetch summary ───────────────────────────────────────────────────────
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const url =
        view === "last30"
          ? "/bazar-expense/summary/last-30-days"
          : `/bazar-expense/summary/month?year=${selectedYear}&month=${selectedMonth}`;
      const res = await axiosSecure.get(url);
      if (res.data?.success) setSummary(res.data.data);
    } catch (err) {
      console.error("Summary fetch error:", err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  // ── Fetch entries (paginated, filtered by current period) ───────────────
  const fetchEntries = async (currentPage: number) => {
    try {
      setEntriesLoading(true);
      const res = await axiosSecure.get("/bazar-expense", {
        params: {
          page: currentPage,
          limit: LIMIT,
          startDate: periodRange.startDate,
          endDate: periodRange.endDate,
        },
      });
      if (res.data?.success) {
        setEntries(res.data.data.items || []);
        setMeta(res.data.data.meta || { total: 0, page: 1, limit: LIMIT, totalPages: 1 });
      }
    } catch (err) {
      console.error("Entries fetch error:", err);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  // ── Fetch available months (for the picker) ─────────────────────────────
  const fetchAvailableMonths = async () => {
    try {
      const res = await axiosSecure.get("/bazar-expense/months");
      if (res.data?.success) setAvailableMonths(res.data.data || []);
    } catch (err) {
      console.error("Months fetch error:", err);
    }
  };

  useEffect(() => {
    fetchAvailableMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    fetchSummary();
    fetchEntries(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchEntries(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ── Form handlers ───────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setFormDate(todayString());
    setFormAmount("");
    setFormNote("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (entry: BazarEntry) => {
    setEditingId(entry._id);
    setFormDate(entry.date);
    setFormAmount(String(entry.amount));
    setFormNote(entry.note || "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async () => {
    const amt = Number(formAmount);
    if (!formDate || !Number.isFinite(amt) || amt < 0) {
      Swal.fire("Invalid input", "Please enter a valid date and amount.", "warning");
      return;
    }
    try {
      setSubmitting(true);
      const payload = { date: formDate, amount: amt, note: formNote.trim() || undefined };
      if (editingId) {
        await axiosSecure.patch(`/bazar-expense/${editingId}`, payload);
        Swal.fire({ icon: "success", title: "Updated", timer: 1200, showConfirmButton: false });
      } else {
        await axiosSecure.post("/bazar-expense", payload);
        Swal.fire({ icon: "success", title: "Added", timer: 1200, showConfirmButton: false });
      }
      closeForm();
      fetchSummary();
      fetchEntries(page);
      fetchAvailableMonths();
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to save", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: BazarEntry) => {
    const confirm = await Swal.fire({
      title: "Delete this entry?",
      html: `<p>${fmtDate(entry.date)} — <b>${fmtBDT(entry.amount)}</b></p>${
        entry.note ? `<p class="text-sm text-gray-500 mt-1">${entry.note}</p>` : ""
      }`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axiosSecure.delete(`/bazar-expense/${entry._id}`);
      Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
      fetchSummary();
      fetchEntries(page);
      fetchAvailableMonths();
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to delete", "error");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const periodTitle =
    view === "last30"
      ? `Last 30 days (${fmtDate(periodRange.startDate)} – ${fmtDate(periodRange.endDate)})`
      : monthLabel(selectedYear, selectedMonth);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-2">
            <ShoppingBasket className="w-7 h-7 text-primary" />
            বাজার হিসাব
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            প্রতিদিনের বাজার খরচ ইনপুট দিন এবং প্রতি মিলের গড় খরচ ও প্রফিট দেখুন।
          </p>
        </div>
        <Button onClick={openAdd} className="self-start md:self-auto">
          <PlusCircle className="w-4 h-4 mr-2" />
          নতুন এন্ট্রি
        </Button>
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="inline-flex rounded-xl border bg-muted p-1">
          <button
            onClick={() => setView("last30")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              view === "last30" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            গত ৩০ দিন
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              view === "month" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            মাস ভিত্তিক
          </button>
        </div>

        {view === "month" && (
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 border rounded-xl text-sm bg-background"
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
            >
              {/* Always include current month even if no entries yet */}
              {(() => {
                const opts = [...availableMonths];
                const currentExists = opts.some(
                  (o) => o.year === now.getFullYear() && o.month === now.getMonth() + 1,
                );
                if (!currentExists) {
                  opts.unshift({
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    total: 0,
                    entries: 0,
                  });
                }
                return opts.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {monthLabel(m.year, m.month)}
                    {m.entries > 0 ? ` — ${m.entries} entries` : ""}
                  </option>
                ));
              })()}
            </select>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {periodTitle}
        </h3>
        {summaryLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading summary...</div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Wallet className="w-5 h-5" />}
                label="মোট বাজার খরচ"
                value={fmtBDT(summary.totals.totalBazar)}
                sub={`${summary.totals.entryCount} টি এন্ট্রি`}
                tone="amber"
              />
              <StatCard
                icon={<Utensils className="w-5 h-5" />}
                label="মোট সার্ভ করা মিল"
                value={`${summary.totals.totalMeals}`}
                sub={`B:${summary.mealBreakdown.breakfast} • L:${summary.mealBreakdown.lunch} • D:${summary.mealBreakdown.dinner}`}
                tone="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="প্রতি মিলের গড় খরচ"
                value={
                  summary.rate.isAvailable
                    ? fmtBDT(summary.rate.avgCostPerMeal)
                    : "৩০ দিন পর"
                }
                sub={
                  summary.rate.isAvailable
                    ? "বাজার ÷ মিল"
                    : `${summary.period.daysInRange} / 30 দিন`
                }
                tone="violet"
              />
              <StatCard
                icon={<PiggyBank className="w-5 h-5" />}
                label="প্রফিট"
                value={
                  summary.rate.isAvailable
                    ? fmtBDT(summary.rate.profit)
                    : "৩০ দিন পর"
                }
                sub={
                  summary.rate.isAvailable
                    ? `Revenue: ${fmtBDT(summary.totals.totalRevenue)}`
                    : "যথেষ্ট ডাটা নেই"
                }
                tone={
                  summary.rate.isAvailable && (summary.rate.profit ?? 0) < 0
                    ? "red"
                    : "green"
                }
              />
            </div>

            {!summary.rate.isAvailable && summary.rate.reason && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-xs">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{summary.rate.reason}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">No data</div>
        )}
      </div>

      {/* HISTORY TABLE */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-muted flex items-center justify-between">
          <h3 className="font-bold">এই পিরিয়ডের বাজার এন্ট্রি</h3>
          <span className="text-xs text-muted-foreground">{meta.total} entries</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">তারিখ</th>
              <th className="p-4 text-left">পরিমাণ</th>
              <th className="p-4 text-left">নোট</th>
              <th className="p-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {entriesLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  এই পিরিয়ডে কোনো বাজার এন্ট্রি নেই।
                </td>
              </tr>
            ) : (
              entries.map((e, idx) => (
                <tr key={e._id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-xs text-muted-foreground">
                    {(page - 1) * LIMIT + idx + 1}
                  </td>
                  <td className="p-4 font-medium">{fmtDate(e.date)}</td>
                  <td className="p-4 font-bold">{fmtBDT(e.amount)}</td>
                  <td className="p-4 text-muted-foreground">{e.note || "-"}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? "এন্ট্রি এডিট করুন" : "নতুন বাজার এন্ট্রি"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  তারিখ
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  পরিমাণ (BDT)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 1500"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  নোট (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. ৩ দিনের মাছ-সবজি"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={closeForm} disabled={submitting}>
                বাতিল
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "আপডেট" : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const toneStyles: Record<string, string> = {
  amber: "bg-amber-50 border-amber-100 text-amber-900",
  blue: "bg-blue-50 border-blue-100 text-blue-900",
  violet: "bg-violet-50 border-violet-100 text-violet-900",
  green: "bg-green-50 border-green-100 text-green-900",
  red: "bg-red-50 border-red-100 text-red-900",
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: keyof typeof toneStyles;
}> = ({ icon, label, value, sub, tone }) => (
  <div className={`p-4 rounded-2xl border ${toneStyles[tone]}`}>
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
      {icon}
      {label}
    </div>
    <p className="text-2xl font-extrabold mt-2">{value}</p>
    {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
  </div>
);

export default BazarHisab;
