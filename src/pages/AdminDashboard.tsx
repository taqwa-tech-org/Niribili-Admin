import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Utensils,
  Wallet,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

interface OverdueUser {
  name: string;
  room: string;
  amount: string;
  days: number; // টাইপ নম্বর, তাই ইংরেজি ডিজিট দিতে হবে
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-2xl border border-border/50 bg-card/50 relative overflow-hidden group"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color}`} />
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-primary`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{trend}</span>}
    </div>
    <div className="mt-4 relative z-10">
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-black mt-1">{value}</p>
        {subValue && <span className="text-xs text-muted-foreground font-medium">{subValue}</span>}
      </div>
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  // এখানে সংখ্যাগুলো ইংরেজি ডিজিটে (0-9) দেওয়া হয়েছে
  const overdueUsers: OverdueUser[] = [
    { name: "আরিফ আহমেদ", room: "৪০২", amount: "৳ ৪,৫০০", days: 12 },
    { name: "জাহিদ হাসান", room: "২০৫", amount: "৳ ৩,২০০", days: 8 },
    { name: "রাকিবুল ইসলাম", room: "১০১", amount: "৳ ৫,১০০", days: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient">অ্যাডমিন ওভারভিউ</h1>
          <p className="text-muted-foreground mt-1">আজ ১৬ জানুয়ারি, ২০২৬ - হোস্টেলের বর্তমান অবস্থা</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 p-2 rounded-xl border border-border">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg shadow-glow">LIVE</span>
          <span className="px-2">সিস্টেম স্ট্যাটাস: সচল</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="মোট আবাসিক" value="১২৪ জন" subValue="১০টি রুম খালি" icon={Users} color="bg-primary" />
        <StatCard title="অ্যাক্টিভ / রেস্ট্রিক্টেড" value="১১৮ / ০৬" icon={UserCheck} color="bg-blue-500" />
        <StatCard title="মাসিক আয়" value="৳ ২,৮৫,০০০" trend="+১৫%" icon={Wallet} color="bg-green-500" />
        <StatCard title="মোট বকেয়া" value="৳ ২৪,৫০০" icon={AlertCircle} color="bg-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-border/50 bg-linear-to-b from-card to-background h-full">
            <h3 className="font-bold flex items-center gap-2 mb-6 text-lg">
              <Utensils className="w-5 h-5 text-accent" /> আজকের মিল অর্ডার
            </h3>
            <div className="space-y-5">
              {[
                { label: "সকাল (Breakfast)", count: 98, color: "bg-orange-500" },
                { label: "দুপুর (Lunch)", count: 112, color: "bg-primary" },
                { label: "রাত (Dinner)", count: 105, color: "bg-indigo-500" },
              ].map((meal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{meal.label}</span>
                    <span className="text-primary">{meal.count} জন</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(meal.count / 124) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full ${meal.color} shadow-glow`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-3xl border border-border/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/10">
            <h3 className="font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" /> বকেয়া ইউজার লিস্ট
            </h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 hover:text-primary">
              সব দেখুন <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground uppercase font-black bg-muted/30">
                <tr>
                  <th className="px-6 py-4">আবাসিক</th>
                  <th className="px-6 py-4">রুম</th>
                  <th className="px-6 py-4">বকেয়া</th>
                  <th className="px-6 py-4">সময়</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {overdueUsers.map((user, i) => (
                  <tr key={i} className="hover:bg-destructive/5">
                    <td className="px-6 py-4 font-bold">{user.name}</td>
                    <td className="px-6 py-4 font-medium">{user.room}</td>
                    <td className="px-6 py-4 font-black text-destructive">{user.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-destructive/10 text-destructive text-[10px] font-bold rounded-lg">
                        {user.days} দিন বাকি
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold text-destructive">রিমাইন্ডার</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;