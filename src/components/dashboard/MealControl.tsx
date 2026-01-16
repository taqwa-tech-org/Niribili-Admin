import React, { useState } from "react";
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

const MealControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // স্যাম্পল ডেটা
  const [mealData, setMealData] = useState<MealStatus[]>([
    { id: "1", name: "সাকিব হাসান", room: "৩০১", breakfast: true, lunch: true, dinner: true, lastUpdated: "০৯:৩০ AM" },
    { id: "2", name: "তানভীর আহমেদ", room: "৩০৪", breakfast: true, lunch: false, dinner: true, lastUpdated: "০৮:১৫ AM" },
    { id: "3", name: "মাহমুদ উল্লাহ", room: "২০২", breakfast: false, lunch: true, dinner: true, lastUpdated: "১০:০০ AM" },
    { id: "4", name: "মুশফিকুর রহিম", room: "১০৫", breakfast: true, lunch: true, dinner: false, lastUpdated: "০৭:৪৫ AM" },
  ]);

  // মিল টগল করার ফাংশন
  const toggleMeal = (id: string, type: 'breakfast' | 'lunch' | 'dinner') => {
    setMealData(prev => prev.map(item => 
      item.id === id ? { ...item, [type]: !item[type] } : item
    ));
  };

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
                <th className="px-6 py-4">আবাসিক মেম্বার</th>
                <th className="px-6 py-4 text-center">নাস্তা</th>
                <th className="px-6 py-4 text-center">দুপুর</th>
                <th className="px-6 py-4 text-center">রাত</th>
                <th className="px-6 py-4 text-right">শেষ আপডেট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mealData
                .filter(item => item.name.includes(searchTerm) || item.room.includes(searchTerm))
                .map((user) => (
                <motion.tr 
                  layout
                  key={user.id} 
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold group-hover:text-primary transition-colors">{user.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">রুম: {user.room}</span>
                    </div>
                  </td>
                  
                  {/* Meal Toggles */}
                  {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                    <td key={meal} className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleMeal(user.id, meal)}
                        className={`p-2 rounded-full transition-all transform active:scale-90 ${
                          user[meal] 
                            ? "bg-green-500/10 text-green-500 shadow-sm" 
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {user[meal] ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>
                    </td>
                  ))}

                  <td className="px-6 py-4 text-right text-muted-foreground text-xs font-medium">
                    {user.lastUpdated}
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