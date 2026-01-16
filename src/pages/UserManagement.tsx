import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  FileText,
  Building2,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// টাইপ ডিফিনিশন
interface User {
  id: string;
  name: string;
  building: string;
  flat: string;
  room: string;
  paymentStatus: "Paid" | "Due" | "Overdue";
  isRestricted: boolean;
  joinDate: string;
  deadline: string;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // স্যাম্পল ডেটা
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "সাকিব হাসান",
      building: "এ-ব্লক",
      flat: "৩০২",
      room: "এ-১",
      paymentStatus: "Paid",
      isRestricted: false,
      joinDate: "২০২৫-১০-০১",
      deadline: "২০২৬-০১-৩১",
    },
    {
      id: "2",
      name: "তামিম ইকবাল",
      building: "বি-ব্লক",
      flat: "১০৪",
      room: "বি-৩",
      paymentStatus: "Overdue",
      isRestricted: true,
      joinDate: "২০২৫-১১-১৫",
      deadline: "২০২৬-০১-১০",
    },
  ]);

  const toggleRestriction = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isRestricted: !u.isRestricted } : u));
  };

  return (
    <div className="space-y-6">
      {/* Header & Add User */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> ইউজার ম্যানেজমেন্ট
          </h1>
          <p className="text-muted-foreground mt-1">সব আবাসিক মেম্বারদের তথ্য এবং এক্সেস কন্ট্রোল করুন।</p>
        </div>
        <Button className="bg-primary shadow-glow gap-2 h-12 px-6">
          <UserPlus className="w-4 h-4" /> নতুন ইউজার যোগ করুন
        </Button>
      </div>

      {/* Search & Advanced Filters */}
      <div className="glass p-4 rounded-2xl border border-border/50 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="নাম বা রুম দিয়ে খুঁজুন..."
              className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 outline-hidden transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 h-12 px-5 ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
          >
            <Filter className="w-4 h-4" /> ফিল্টার {showFilters ? 'বন্ধ করুন' : ''}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50 overflow-hidden"
            >
              <select className="bg-secondary/50 border border-border rounded-lg p-2 text-sm outline-hidden">
                <option>সব বিল্ডিং</option>
                <option>এ-ব্লক</option>
                <option>বি-ব্লক</option>
              </select>
              <select className="bg-secondary/50 border border-border rounded-lg p-2 text-sm outline-hidden">
                <option>সব ফ্ল্যাট</option>
                <option>১০১</option>
                <option>৩০২</option>
              </select>
              <select className="bg-secondary/50 border border-border rounded-lg p-2 text-sm outline-hidden">
                <option>সব পেমেন্ট স্ট্যাটাস</option>
                <option>Paid</option>
                <option>Due</option>
                <option>Overdue</option>
              </select>
              <Button variant="outline" className="text-xs h-10">ফিল্টার রিসেট</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">ইউজার ও লোকেশন</th>
                <th className="px-6 py-4">পেমেন্ট স্ট্যাটাস</th>
                <th className="px-6 py-4">ডেডলাইন</th>
                <th className="px-6 py-4">এক্সেস</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold group-hover:text-primary transition-colors">{user.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium mt-0.5">
                          <span className="flex items-center gap-1"><Building2 className="w-2.5 h-2.5"/> {user.building}</span>
                          <span className="flex items-center gap-1"><DoorOpen className="w-2.5 h-2.5"/> {user.flat}-{user.room}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      user.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      user.paymentStatus === 'Overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                      'bg-accent/10 text-accent border-accent/20'
                    }`}>
                      {user.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{user.deadline}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => toggleRestriction(user.id)}
                      className={`h-8 gap-2 text-[10px] font-bold rounded-lg ${
                        user.isRestricted ? 'text-destructive bg-destructive/5' : 'text-green-500 bg-green-500/5'
                      }`}
                    >
                      {user.isRestricted ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      {user.isRestricted ? "Blocked" : "Active"}
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <FileText className="w-4 h-4" /> {/* Documents */}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;