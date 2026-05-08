import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  Sun,
  Sunset,
  Moon,
  Clock,
  Save,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";

interface MealSetting {
  _id?: string;
  breakfastPrice: number;
  lunchPrice: number;
  dinnerPrice: number;
  cutoffHour: number;
  cutoffMinute: number;
  updatedAt?: string;
}

const formatCutoff12h = (hour: number, minute: number): string => {
  const safeHour = Math.max(0, Math.min(23, hour));
  const safeMinute = Math.max(0, Math.min(59, minute));
  const period = safeHour >= 12 ? "PM" : "AM";
  const h12 = safeHour % 12 === 0 ? 12 : safeHour % 12;
  return `${String(h12).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} ${period}`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const MealSettingsPage = () => {
  const axiosSecure = useAxiosSecure();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<MealSetting | null>(null);

  const [breakfastPrice, setBreakfastPrice] = useState<number>(40);
  const [lunchPrice, setLunchPrice] = useState<number>(80);
  const [dinnerPrice, setDinnerPrice] = useState<number>(80);
  const [cutoffHour, setCutoffHour] = useState<number>(21);
  const [cutoffMinute, setCutoffMinute] = useState<number>(0);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/meal-settings");
      const data: MealSetting = res.data?.data;
      if (data) {
        setOriginal(data);
        setBreakfastPrice(data.breakfastPrice);
        setLunchPrice(data.lunchPrice);
        setDinnerPrice(data.dinnerPrice);
        setCutoffHour(data.cutoffHour);
        setCutoffMinute(data.cutoffMinute);
      }
    } catch (err: any) {
      Swal.fire(
        "ত্রুটি",
        err?.response?.data?.message || "সেটিংস লোড করতে ব্যর্থ",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(() => {
    if (!original) return false;
    return (
      original.breakfastPrice !== breakfastPrice ||
      original.lunchPrice !== lunchPrice ||
      original.dinnerPrice !== dinnerPrice ||
      original.cutoffHour !== cutoffHour ||
      original.cutoffMinute !== cutoffMinute
    );
  }, [original, breakfastPrice, lunchPrice, dinnerPrice, cutoffHour, cutoffMinute]);

  const handleReset = () => {
    if (!original) return;
    setBreakfastPrice(original.breakfastPrice);
    setLunchPrice(original.lunchPrice);
    setDinnerPrice(original.dinnerPrice);
    setCutoffHour(original.cutoffHour);
    setCutoffMinute(original.cutoffMinute);
  };

  const validate = (): string | null => {
    if (
      [breakfastPrice, lunchPrice, dinnerPrice].some(
        (v) => Number.isNaN(v) || v < 0,
      )
    ) {
      return "মিল রেট ০ বা তার বেশি একটি সংখ্যা হতে হবে";
    }
    if (
      Number.isNaN(cutoffHour) ||
      cutoffHour < 0 ||
      cutoffHour > 23 ||
      !Number.isInteger(cutoffHour)
    ) {
      return "ঘন্টা ০ থেকে ২৩ এর মধ্যে হতে হবে";
    }
    if (
      Number.isNaN(cutoffMinute) ||
      cutoffMinute < 0 ||
      cutoffMinute > 59 ||
      !Number.isInteger(cutoffMinute)
    ) {
      return "মিনিট ০ থেকে ৫৯ এর মধ্যে হতে হবে";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Swal.fire("ভুল ইনপুট", err, "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "সেটিংস সেভ করবেন?",
      html: `
        <div style="text-align:left">
          <div><b>সকাল:</b> ৳${breakfastPrice}</div>
          <div><b>দুপুর:</b> ৳${lunchPrice}</div>
          <div><b>রাত:</b> ৳${dinnerPrice}</div>
          <div><b>কাটঅফ টাইম:</b> ${formatCutoff12h(cutoffHour, cutoffMinute)} (আগের দিন)</div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, সেভ করুন",
      cancelButtonText: "বাতিল",
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      const res = await axiosSecure.patch("/meal-settings", {
        breakfastPrice,
        lunchPrice,
        dinnerPrice,
        cutoffHour,
        cutoffMinute,
      });
      const data: MealSetting = res.data?.data;
      if (data) {
        setOriginal(data);
        setBreakfastPrice(data.breakfastPrice);
        setLunchPrice(data.lunchPrice);
        setDinnerPrice(data.dinnerPrice);
        setCutoffHour(data.cutoffHour);
        setCutoffMinute(data.cutoffMinute);
      }

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "সেটিংস সফলভাবে আপডেট হয়েছে",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err: any) {
      Swal.fire(
        "ত্রুটি",
        err?.response?.data?.message || "সেভ করতে ব্যর্থ",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const cutoffDisplay = formatCutoff12h(cutoffHour, cutoffMinute);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 md:px-4 py-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-gradient">
              মিল সেটিংস
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            মিলের রেট এবং অর্ডার কাটঅফ টাইম এখান থেকে পরিবর্তন করুন।
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          সর্বশেষ আপডেট: {formatDateTime(original?.updatedAt)}
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="glass border border-border/60 rounded-2xl p-4 md:p-5 flex gap-3"
      >
        <div className="w-9 h-9 shrink-0 rounded-xl bg-accent/15 flex items-center justify-center">
          <Info className="w-4 h-4 text-accent" />
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p className="text-foreground font-semibold mb-1">কীভাবে কাজ করে?</p>
          <p>
            আগামীকালের মিল অর্ডার করতে হলে ব্যবহারকারীকে{" "}
            <span className="text-primary font-bold">
              আজকের রাত {cutoffDisplay}
            </span>{" "}
            এর আগে অর্ডার করতে হবে। এই সময় পেরিয়ে গেলে অর্ডার লক হয়ে যাবে এবং
            পরিবর্তন করা যাবে না। আপনি যেকোনো সময় এই কাটঅফ টাইম পরিবর্তন করতে
            পারবেন।
          </p>
        </div>
      </motion.div>

      {/* Meal Prices Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass border border-border/60 rounded-3xl p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-lg">৳</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">মিল রেট</h2>
            <p className="text-xs text-muted-foreground">
              প্রতি মিলের ইউনিট প্রাইস (টাকায়)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Breakfast */}
          <div className="rounded-2xl border border-border/60 bg-linear-to-b from-card to-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Sun className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-sm">সকাল (Breakfast)</p>
                <p className="text-[11px] text-muted-foreground">
                  বর্তমান: ৳{original?.breakfastPrice ?? 0}
                </p>
              </div>
            </div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              মূল্য (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ৳
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                value={Number.isNaN(breakfastPrice) ? "" : breakfastPrice}
                onChange={(e) => setBreakfastPrice(Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>

          {/* Lunch */}
          <div className="rounded-2xl border border-border/60 bg-linear-to-b from-card to-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sunset className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">দুপুর (Lunch)</p>
                <p className="text-[11px] text-muted-foreground">
                  বর্তমান: ৳{original?.lunchPrice ?? 0}
                </p>
              </div>
            </div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              মূল্য (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ৳
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                value={Number.isNaN(lunchPrice) ? "" : lunchPrice}
                onChange={(e) => setLunchPrice(Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>

          {/* Dinner */}
          <div className="rounded-2xl border border-border/60 bg-linear-to-b from-card to-background p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-sm">রাত (Dinner)</p>
                <p className="text-[11px] text-muted-foreground">
                  বর্তমান: ৳{original?.dinnerPrice ?? 0}
                </p>
              </div>
            </div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              মূল্য (৳)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ৳
              </span>
              <Input
                type="number"
                min={0}
                step={1}
                value={Number.isNaN(dinnerPrice) ? "" : dinnerPrice}
                onChange={(e) => setDinnerPrice(Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cutoff Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="glass border border-border/60 rounded-3xl p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">কাটঅফ টাইম</h2>
            <p className="text-xs text-muted-foreground">
              আগামীকালের মিল অর্ডারের জন্য আজকের শেষ সময় (Bangladesh Time)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* Hour */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              ঘন্টা (০ - ২৩)
            </label>
            <Input
              type="number"
              min={0}
              max={23}
              step={1}
              value={Number.isNaN(cutoffHour) ? "" : cutoffHour}
              onChange={(e) => setCutoffHour(Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              উদাহরণ: রাত ৯টা = ২১, রাত ১০টা = ২২
            </p>
          </div>

          {/* Minute */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              মিনিট (০ - ৫৯)
            </label>
            <Input
              type="number"
              min={0}
              max={59}
              step={1}
              value={Number.isNaN(cutoffMinute) ? "" : cutoffMinute}
              onChange={(e) => setCutoffMinute(Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              মিনিট ০ থেকে ৫৯
            </p>
          </div>

          {/* Live preview */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-[11px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">
              বর্তমান কাটঅফ
            </p>
            <p className="text-2xl font-display font-bold text-primary">
              {cutoffDisplay}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              আগের দিন রাতের এই সময়ের মধ্যে অর্ডার দিতে হবে
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-5">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            দ্রুত প্রিসেট:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "রাত ৮:০০", h: 20, m: 0 },
              { label: "রাত ৯:০০", h: 21, m: 0 },
              { label: "রাত ৯:৩০", h: 21, m: 30 },
              { label: "রাত ১০:০০", h: 22, m: 0 },
              { label: "রাত ১১:০০", h: 23, m: 0 },
            ].map((p) => {
              const active = cutoffHour === p.h && cutoffMinute === p.m;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setCutoffHour(p.h);
                    setCutoffMinute(p.m);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="sticky bottom-2 glass border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="text-xs text-muted-foreground">
          {isDirty ? (
            <span className="text-amber-500 font-bold">
              • আপনার কিছু পরিবর্তন আছে যা সেভ করা হয়নি
            </span>
          ) : (
            <span>সব পরিবর্তন সেভ করা আছে</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty || saving}
          >
            <RotateCcw className="w-4 h-4" />
            রিসেট
          </Button>
          <Button
            variant="hero"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default MealSettingsPage;
