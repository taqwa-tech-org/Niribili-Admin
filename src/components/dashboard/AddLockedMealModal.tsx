import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";

interface WalletUserResult {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
}

interface MealPrices {
  breakfast: number;
  lunch: number;
  dinner: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD — pre-filled from the locked-meals date picker
  onSuccess: () => void; // called after a successful add so the parent can refetch
}

const SEARCH_DEBOUNCE_MS = 350;

const AddLockedMealModal: React.FC<Props> = ({
  open,
  onClose,
  defaultDate,
  onSuccess,
}) => {
  const axiosSecure = useAxiosSecure();

  // Search + selection state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<WalletUserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<WalletUserResult | null>(null);

  // Meal selections
  const [mealDate, setMealDate] = useState(defaultDate);
  const [breakfast, setBreakfast] = useState({ enabled: false, qty: 1 });
  const [lunch, setLunch] = useState({ enabled: false, qty: 1 });
  const [dinner, setDinner] = useState({ enabled: false, qty: 1 });

  // Prices pulled from MealSettings so the cost preview uses live prices
  const [prices, setPrices] = useState<MealPrices>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setMealDate(defaultDate);
      setSearchInput("");
      setDebouncedSearch("");
      setSearchResults([]);
      setSelectedUser(null);
      setBreakfast({ enabled: false, qty: 1 });
      setLunch({ enabled: false, qty: 1 });
      setDinner({ enabled: false, qty: 1 });
    }
  }, [open, defaultDate]);

  // Load current meal prices once when the modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosSecure.get("/meal-settings");
        const s = res.data?.data || res.data;
        if (cancelled || !s) return;
        setPrices({
          breakfast: Number(s.breakfastPrice) || 0,
          lunch: Number(s.lunchPrice) || 0,
          dinner: Number(s.dinnerPrice) || 0,
        });
      } catch {
        // Non-fatal — preview will just show 0 until prices load
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, axiosSecure]);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Hit the wallet endpoint for the user picker — it returns name/phone/email
  // *and* current wallet balance, which we need for the insufficient-balance check.
  useEffect(() => {
    if (!open) return;
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setSearching(true);
        const params = new URLSearchParams({
          page: "1",
          limit: "8",
          searchTerm: debouncedSearch,
        });
        const res = await axiosSecure.get(
          `/wallet/allUser/balance?${params.toString()}`
        );
        if (cancelled) return;
        setSearchResults(res.data?.data?.wallets || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, axiosSecure, open]);

  const selectedMeals = useMemo(() => {
    const list: { mealType: "breakfast" | "lunch" | "dinner"; quantity: number }[] = [];
    if (breakfast.enabled && breakfast.qty > 0)
      list.push({ mealType: "breakfast", quantity: breakfast.qty });
    if (lunch.enabled && lunch.qty > 0)
      list.push({ mealType: "lunch", quantity: lunch.qty });
    if (dinner.enabled && dinner.qty > 0)
      list.push({ mealType: "dinner", quantity: dinner.qty });
    return list;
  }, [breakfast, lunch, dinner]);

  const totalCost = useMemo(() => {
    let sum = 0;
    if (breakfast.enabled) sum += prices.breakfast * breakfast.qty;
    if (lunch.enabled) sum += prices.lunch * lunch.qty;
    if (dinner.enabled) sum += prices.dinner * dinner.qty;
    return sum;
  }, [prices, breakfast, lunch, dinner]);

  const balanceAfter = (selectedUser?.balance ?? 0) - totalCost;
  const insufficientBalance = !!selectedUser && totalCost > 0 && balanceAfter < 0;

  const canSubmit =
    !!selectedUser &&
    !!mealDate &&
    selectedMeals.length > 0 &&
    !insufficientBalance &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedUser) return;

    const summaryLines = selectedMeals.map(
      (m) =>
        `${
          m.mealType === "breakfast"
            ? "সকালের নাস্তা"
            : m.mealType === "lunch"
              ? "দুপুরের খাবার"
              : "রাতের খাবার"
        } × ${m.quantity}`,
    );

    const confirm = await Swal.fire({
      title: "নিশ্চিত করুন",
      html: `
        <div style="text-align:left">
          <p><strong>ইউজার:</strong> ${selectedUser.userId.name}</p>
          <p><strong>তারিখ:</strong> ${mealDate}</p>
          <p><strong>মিল:</strong><br/>${summaryLines.join("<br/>")}</p>
          <p><strong>মোট কাটা হবে:</strong> ৳${totalCost}</p>
          <p style="color:#666;font-size:12px;margin-top:8px">
            ব্যালেন্স থেকে এখনই কেটে নেওয়া হবে।
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, যোগ করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#0a8b5c",
    });
    if (!confirm.isConfirmed) return;

    try {
      setSubmitting(true);
      await axiosSecure.post("/meals/admin/add-locked-meal", {
        userId: selectedUser.userId._id,
        mealDate,
        meals: selectedMeals,
      });

      await Swal.fire({
        icon: "success",
        title: "সফল হয়েছে",
        text: `${selectedUser.userId.name}-এর জন্য মিল যোগ করা হয়েছে এবং ৳${totalCost} কেটে নেওয়া হয়েছে।`,
        confirmButtonColor: "#0a8b5c",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "ত্রুটি",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "মিল যোগ করতে সমস্যা হয়েছে।",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold">মিল যোগ করুন</h3>
            <p className="text-xs text-muted-foreground">
              লক করা মিল রিপোর্টে নতুন অর্ডার যোগ করুন
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: User search */}
          <div>
            <label className="text-sm font-medium block mb-2">
              ১. ইউজার খুঁজুন
            </label>
            {selectedUser ? (
              <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-semibold">
                    {selectedUser.userId.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedUser.userId.email} • {selectedUser.userId.phone}
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">বর্তমান ব্যালেন্স:</span>{" "}
                    <span className="font-bold text-green-700">
                      ৳{selectedUser.balance}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchInput("");
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  পরিবর্তন
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Results dropdown */}
                {debouncedSearch && (
                  <div className="mt-2 border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        খুঁজছি...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        কোনো ইউজার পাওয়া যায়নি
                      </div>
                    ) : (
                      searchResults.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => setSelectedUser(u)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-sm">
                            {u.userId.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>
                              {u.userId.email} • {u.userId.phone}
                            </span>
                            <span className="text-green-700 font-semibold">
                              ৳{u.balance}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 2: Date */}
          <div>
            <label className="text-sm font-medium block mb-2">
              ২. মিলের তারিখ
            </label>
            <Input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ডিফল্টরূপে রিপোর্টের নির্বাচিত তারিখ — চাইলে পরিবর্তন করতে পারেন
            </p>
          </div>

          {/* Step 3: Meal selection */}
          <div>
            <label className="text-sm font-medium block mb-2">
              ৩. মিল নির্বাচন করুন
            </label>
            <div className="space-y-2">
              {[
                { key: "breakfast" as const, label: "সকালের নাস্তা", state: breakfast, set: setBreakfast, color: "orange" },
                { key: "lunch" as const, label: "দুপুরের খাবার", state: lunch, set: setLunch, color: "green" },
                { key: "dinner" as const, label: "রাতের খাবার", state: dinner, set: setDinner, color: "indigo" },
              ].map((m) => (
                <div
                  key={m.key}
                  className={`flex items-center justify-between border rounded-lg p-3 transition-colors ${
                    m.state.enabled ? "bg-primary/5 border-primary/30" : ""
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={m.state.enabled}
                      onChange={(e) =>
                        m.set({ ...m.state, enabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground">
                        ৳{prices[m.key]} প্রতি প্লেট
                      </div>
                    </div>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={m.state.qty}
                    onChange={(e) =>
                      m.set({ ...m.state, qty: Math.max(1, Number(e.target.value) || 1) })
                    }
                    disabled={!m.state.enabled}
                    className="w-20 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cost summary + balance check */}
          {selectedUser && totalCost > 0 && (
            <div className="border rounded-lg p-3 bg-gray-50 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">মোট খরচ</span>
                <span className="font-bold">৳{totalCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ব্যালেন্স পরে হবে</span>
                <span
                  className={`font-bold ${
                    insufficientBalance ? "text-red-600" : "text-green-700"
                  }`}
                >
                  ৳{balanceAfter}
                </span>
              </div>
              {insufficientBalance && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    ইউজারের পর্যাপ্ত ব্যালেন্স নেই। মিল যোগ করার আগে অনুগ্রহ করে
                    ব্যালেন্স যোগ করুন।
                  </span>
                </div>
              )}
              {!insufficientBalance && (
                <div className="mt-2 flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    সাবমিট করার পর ব্যালেন্স থেকে ৳{totalCost} কেটে নেওয়া হবে।
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 sticky bottom-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            বাতিল
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            মিল যোগ করুন
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddLockedMealModal;
