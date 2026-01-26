import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Calculator, 
  Download, 
  Send, 
  RefreshCcw, 
  Settings2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/hooks/useAxiosSecure";

// টাইপ ডিফিনিশন
interface BillingInput {
  month: string;
  mealRate: number;
  fixedCharge: number;
  utilityCharge: number;
}

const BillingGenerator: React.FC = () => {
  const [config, setConfig] = useState<BillingInput>({
    month: "জানুয়ারি ২০২৬",
    mealRate: 0,
    fixedCharge: 3000,
    utilityCharge: 500,
  });

  const axiosSecure = useAxiosSecure();
  const [date, setDate] = useState<string>("2026-01-27");
  const [summary, setSummary] = useState<Array<{ _id: string; totalQuantity: number; totalOrders: number; totalPrice: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (d: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosSecure.get(`/meals/admin/summary/date/${d}`);
      setSummary(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load summary");
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(date);
  }, [date]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> বিল জেনারেটর
          </h1>
          <p className="text-muted-foreground mt-1">সব ইউজারদের জন্য মাসিক বিল ক্যালকুলেট এবং পাবলিশ করুন।</p>
        </div>
        <Button className="bg-primary shadow-glow gap-2 h-12 px-6">
          <RefreshCcw className="w-4 h-4" /> ডাটা রিফ্রেশ করুন
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl border border-border/50 bg-linear-to-b from-card to-background">
            <h3 className="font-bold flex items-center gap-2 mb-6 text-primary">
              <Settings2 className="w-4 h-4" /> প্যারামিটার সেট করুন
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">বিল মাস</label>
                <select className="w-full mt-1.5 bg-secondary/50 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-hidden">
                  <option>জানুয়ারি ২০২৬</option>
                  <option>ডিসেম্বর ২০২৫</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">প্রতি মিল রেট (৳)</label>
                <input 
                  type="number" 
                  placeholder="যেমন: ৪৫"
                  className="w-full mt-1.5 bg-secondary/50 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-hidden"
                  onChange={(e) => setConfig({...config, mealRate: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">ফিক্সড সিট ভাড়া (৳)</label>
                <input 
                  type="number" 
                  defaultValue={3000}
                  className="w-full mt-1.5 bg-secondary/50 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase ml-1">ইউটিলিটি চার্জ (৳)</label>
                <input 
                  type="number" 
                  defaultValue={500}
                  className="w-full mt-1.5 bg-secondary/50 border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/50 outline-hidden"
                />
              </div>

              <div className="pt-4">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 rounded-xl">
                  <Calculator className="w-4 h-4 mr-2" /> ক্যালকুলেট করুন
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0" />
            <p className="text-xs text-accent-foreground leading-relaxed">
              <strong>সতর্কতা:</strong> বিল একবার জেনারেট হয়ে গেলে ইউজারের পোর্টালে নোটিফিকেশন চলে যাবে। দয়া করে ডেটা চেক করে নিন।
            </p>
          </div>
        </div>

        {/* Right: Preview Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl border border-border/50 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
              <h3 className="font-bold">বিল প্রিভিউ ({config.month})</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-secondary/50 border border-border rounded-xl p-2"
                />
                <Button variant="outline" size="sm" className="h-9" onClick={() => fetchSummary(date)}>
                  <RefreshCcw className="w-3.5 h-3.5 mr-2" /> রিফ্রেশ
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="w-3.5 h-3.5 mr-2" /> CSV
                </Button>
                <Button size="sm" className="h-9 bg-primary shadow-glow">
                  <Send className="w-3.5 h-3.5 mr-2" /> পাবলিশ অল
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 bg-linear-to-b from-card to-background/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">মিল টাইপ</th>
                    <th className="px-6 py-4 text-center">মোট পরিমাণ</th>
                    <th className="px-6 py-4 text-center">অর্ডার সংখ্যা</th>
                    <th className="px-6 py-4 text-center">মোট মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center">লোড হচ্ছে...</td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-destructive">{error}</td>
                    </tr>
                  )}
                  {!loading && !error && summary.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center">No summary for {date}</td>
                    </tr>
                  )}

                  {summary.map((s, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 font-bold capitalize">{s._id}</td>
                      <td className="px-6 py-4 text-center font-medium">{s.totalQuantity}</td>
                      <td className="px-6 py-4 text-center">{s.totalOrders}</td>
                      <td className="px-6 py-4 text-center font-bold">৳ {s.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-border/50 bg-secondary/10">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">মোট ইউজার সংখ্যা: ৮৬ জন</span>
                  <div className="text-right">
                    <span className="text-muted-foreground">সর্বমোট বিল পরিমাণ: </span>
                    <span className="text-xl font-bold text-gradient ml-2">৳ ৩,৪২,৫০০</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingGenerator;