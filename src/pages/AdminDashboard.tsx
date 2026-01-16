import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Users, 
  Utensils, 
  Wallet, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
  Bell
} from "lucide-react";

// ১. স্ট্যাট কার্ডের জন্য টাইপ ডিফিনিশন
interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: "up" | "down";
  trendValue: string;
  color: string;
}

// ২. টেবিল ডেটার জন্য ইন্টারফেস
interface PaymentActivity {
  name: string;
  month: string;
  amount: string;
  status: "Paid" | "Pending";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-2xl border border-border/50 bg-card/50"
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-destructive'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trendValue}
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  // স্যাম্পল ডেটা উইথ টাইপ
  const recentPayments: PaymentActivity[] = [
    { name: "সাকিব হাসান", month: "জানুয়ারি ২০২৬", amount: "৳ ৪,৫০০", status: "Paid" },
    { name: "তানভীর আহমেদ", month: "জানুয়ারি ২০২৬", amount: "৳ ৪,৫০০", status: "Pending" },
    { name: "মাহমুদ উল্লাহ", month: "ডিসেম্বর ২০২৫", amount: "৳ ৩,২০০", status: "Paid" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-display text-gradient">শুভ সকাল, এডমিন সাহেব!</h1>
        <p className="text-muted-foreground">আজকের নিরিবিলি হোমের সংক্ষিপ্ত রিপোর্ট এখানে দেখুন।</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="মোট আবাসিক" 
          value="৮৬ জন" 
          icon={Users} 
          trend="up" 
          trendValue="+৪ নতুন" 
          color="bg-primary" 
        />
        <StatCard 
          title="আজকের মিল" 
          value="১৫২টি" 
          icon={Utensils} 
          trend="up" 
          trendValue="+১২% বৃদ্ধি" 
          color="bg-accent" 
        />
        <StatCard 
          title="মাসিক কালেকশন" 
          value="৳ ৪২,৫০০" 
          icon={Wallet} 
          trend="down" 
          trendValue="-২% কম" 
          color="bg-green-500" 
        />
        <StatCard 
          title="বকেয়া বিল" 
          value="৳ ৮,২০০" 
          icon={AlertTriangle} 
          trend="up" 
          trendValue="৩ জন বাকি" 
          color="bg-destructive" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> সর্বশেষ পেমেন্ট আপডেট
            </h3>
            <button className="text-xs text-primary font-bold hover:underline">সব দেখুন</button>
          </div>
          <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-bold">ইউজার</th>
                  <th className="px-6 py-4 font-bold">বিল মাস</th>
                  <th className="px-6 py-4 font-bold">পরিমাণ</th>
                  <th className="px-6 py-4 font-bold text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentPayments.map((item, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-medium group-hover:text-primary transition-colors">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.month}</td>
                    <td className="px-6 py-4 font-bold">{item.amount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        item.status === 'Paid' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-accent/10 text-accent border-accent/20'
                      }`}>
                        {item.status === 'Paid' ? 'পরিশোধিত' : 'পেন্ডিং'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Menu */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-border/50 bg-linear-to-b from-primary/5 to-transparent">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> কুইক অ্যাকশন
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Button className="w-full justify-start gap-3 shadow-glow" variant="default">
                <Utensils className="w-4 h-4" /> মিল অফ/অন করুন
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline">
                <Wallet className="w-4 h-4" /> পেমেন্ট রিসিভ
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline">
                <Bell  className="w-4 h-4" /> নোটিশ পাঠান
              </Button>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-border/50 bg-linear-to-b from-accent/5 to-transparent">
            <h3 className="font-bold mb-3 text-accent flex items-center gap-2">
               আজকের মেনু
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-1 rounded">দুপুর</div>
                <span className="text-sm font-medium">মুরগির মাংস, ডাল, সবজি</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded">রাত</div>
                <span className="text-sm font-medium">রুই মাছ, ভর্তা, ডাল</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;