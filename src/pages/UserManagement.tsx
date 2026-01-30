import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Trash2,
  UserCheck,
  X,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";

// --- Interfaces ---
interface Building { _id: string; name: string; }
interface Flat { _id: string; name: string; buildingId: string; }
interface UserProfile {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    status?: string;
    isDeleted?: boolean;
  };
  accountStatus?: string;
  isDeleted?: boolean;
  buildingId?: string | { _id: string; name: string };
  flatId?: string | { _id: string; name: string };
  profilePhoto?: string;
}

const UserManagement = () => {
  const axiosSecure = useAxiosSecure();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [u, b, f] = await Promise.all([
        axiosSecure.get("/profile"),
        axiosSecure.get("/buildings"),
        axiosSecure.get("/flats"),
      ]);
      
      const allUsers: UserProfile[] = u.data?.data || u.data || [];
      
      // আপনার রিকোয়েস্ট অনুযায়ী: isDeleted: true এবং status: "Blocked" হলে দেখাবে না
      const activeUsers = allUsers.filter(user => {
        const isUserDeleted = user.isDeleted || user.userId?.isDeleted;
        const isUserBlocked = user.userId?.status === "Blocked";
        return !(isUserDeleted && isUserBlocked);
      });

      setUsers(activeUsers);
      setBuildings(b.data?.data || b.data || []);
      setFlats(f.data?.data || f.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Stats Calculation ---
  const stats = {
    total: users.length,
    pending: users.filter(u => u.accountStatus === "pending" || !u.accountStatus).length,
    process: users.filter(u => u.accountStatus === "process").length,
    approve: users.filter(u => u.accountStatus === "approve").length,
  };

  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "প্রোফাইলটি ডিলিট করা হবে!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল"
    });

    if (result.isConfirmed) {
      try {
        await axiosSecure.delete(`/profile/${id}`);
        setUsers((prev) => prev.filter((user) => user._id !== id));
        Swal.fire({ title: "সফল!", text: "ব্যবহারকারীকে সরানো হয়েছে।", icon: "success", timer: 1000, showConfirmButton: false });
      } catch (err) {
        Swal.fire("ভুল হয়েছে", "মুছে ফেলা সম্ভব হয়নি।", "error");
      }
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const status = formData.get("accountStatus") as string;

    try {
      await axiosSecure.patch(`/profile/${selectedUser._id}/status`, { accountStatus: status });
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, accountStatus: status } : u));
      Swal.fire({ icon: "success", title: "আপডেট সফল", timer: 1000, showConfirmButton: false });
      setStatusModal(false);
    } catch (err) {
      Swal.fire("ভুল হয়েছে", "আপডেট করা যায়নি", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const bId = typeof u.buildingId === "string" ? u.buildingId : u.buildingId?._id;
    const matchesBuilding = filterBuilding === "all" || bId === filterBuilding;
    const matchesStatus = filterStatus === "all" || (u.accountStatus || "pending") === filterStatus;
    const matchesSearch = u.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.userId?.phone?.includes(searchTerm);
    return matchesBuilding && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-6">
      
      {/* --- Responsive Stats --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "মোট বাসিন্দা", key: "all", count: stats.total, color: "text-blue-500", icon: Users },
          { label: "পেন্ডিং", key: "pending", count: stats.pending, color: "text-amber-500", icon: Clock },
          { label: "প্রসেসিং", key: "process", count: stats.process, color: "text-purple-500", icon: Loader2 },
          { label: "অনুমোদিত", key: "approve", count: stats.approve, color: "text-emerald-500", icon: CheckCircle2 },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            className={`p-3 sm:p-5 rounded-[1.5rem] border transition-all text-left flex flex-col justify-between h-full ${
              filterStatus === item.key 
                ? "bg-card border-primary shadow-md ring-2 ring-primary/10" 
                : "bg-card/40 border-border/40 hover:border-primary/30"
            }`}
          >
            <div className={`p-2 rounded-xl w-fit mb-3 ${item.color} bg-current/10`}>
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="text-xl sm:text-3xl font-black tracking-tighter">{item.count}</p>
            </div>
          </button>
        ))}
      </div>

      {/* --- Search & Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-b from-card/60 to-transparent p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] border border-border/40">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users className="text-primary w-5 h-5 sm:w-6 sm:h-6" /> বাসিন্দা পরিচালনা
          </h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">রেসিডেন্সিয়াল ডাটাবেস কন্ট্রোল</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="নাম, ফোন বা ইমেল দিয়ে খুঁজুন..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-secondary/50 border-none outline-hidden text-sm font-bold shadow-inner focus:ring-2 ring-primary/20 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* --- Sidebar --- */}
        <aside className="w-full lg:w-72 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-2">
            <Building2 className="w-4 h-4" /> বিল্ডিং ফিল্টার
          </h2>
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-2 no-scrollbar">
            <Button
              variant={filterBuilding === "all" ? "default" : "secondary"}
              className="rounded-2xl text-[11px] font-black uppercase h-11 px-6 flex-shrink-0"
              onClick={() => setFilterBuilding("all")}
            >
              সবগুলো
            </Button>
            {buildings.map((b) => (
              <Button
                key={b._id}
                variant={filterBuilding === b._id ? "default" : "secondary"}
                className="rounded-2xl text-[11px] font-black uppercase h-11 px-6 flex-shrink-0 lg:justify-start"
                onClick={() => setFilterBuilding(b._id)}
              >
                {b.name}
              </Button>
            ))}
          </div>
        </aside>

        {/* --- Main Content (Table) --- */}
        <main className="flex-1 min-w-0">
          <div className="bg-card border border-border/40 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-muted/30 text-[9px] sm:text-[10px] uppercase font-black text-muted-foreground border-b border-border/10">
                  <tr>
                    <th className="p-4 sm:p-6">বাসিন্দার প্রোফাইল</th>
                    <th className="p-4 sm:p-6">লোকেশন</th>
                    <th className="p-4 sm:p-6 text-center">স্ট্যাটাস</th>
                    <th className="p-4 sm:p-6 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => {
                        const bName = typeof u.buildingId === "object" ? u.buildingId?.name : buildings.find((b) => b._id === u.buildingId)?.name;
                        const fName = typeof u.flatId === "object" ? u.flatId?.name : flats.find((f) => f._id === u.flatId)?.name;

                        return (
                          <motion.tr
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={u._id}
                            className="hover:bg-primary/[0.03] transition-colors group"
                          >
                            <td className="p-4 sm:p-5">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <img
                                  src={u.profilePhoto || "https://github.com/shadcn.png"}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-background shadow-md"
                                  alt="profile"
                                />
                                <div>
                                  <p className="font-black text-xs sm:text-sm tracking-tight">{u.userId?.name || "নামহীন"}</p>
                                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" /> {u.userId?.phone || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 sm:p-5">
                              <p className="text-[9px] sm:text-[10px] font-black uppercase text-primary tracking-tighter">{bName || "বিল্ডিং নেই"}</p>
                              <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">ফ্ল্যাট: {fName || "N/A"}</p>
                            </td>
                            <td className="p-4 sm:p-5 text-center">
                              <span className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase border inline-flex items-center gap-1.5 ${
                                u.accountStatus === "approve"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : u.accountStatus === "process" 
                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}>
                                {u.accountStatus === "approve" ? "অনুমোদিত" : u.accountStatus === "process" ? "প্রসেসিং" : "পেন্ডিং"}
                              </span>
                            </td>
                            <td className="p-4 sm:p-5 text-right">
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 shadow-sm"
                                  onClick={() => { setSelectedUser(u); setStatusModal(true); }}
                                >
                                  <UserCheck className="w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 shadow-sm"
                                  onClick={() => handleDeleteUser(u._id)}
                                >
                                  <Trash2 className="w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">কোনো তথ্য পাওয়া যায়নি</td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- Responsive Update Modal (Bottom Drawer for Mobile) --- */}
      <AnimatePresence>
        {statusModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full max-w-sm p-8 rounded-t-[2.5rem] sm:rounded-[3rem] border border-border/60 shadow-2xl relative"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 sm:hidden" />
              <button onClick={() => setStatusModal(false)} className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-full hidden sm:block">
                <X size={20} />
              </button>

              <div className="mb-8 text-center sm:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">অ্যাক্সেস কন্ট্রোল</h3>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  বাসিন্দা: <span className="text-primary">{selectedUser.userId?.name}</span>
                </p>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">স্ট্যাটাস পরিবর্তন করুন</label>
                  <select
                    name="accountStatus"
                    defaultValue={selectedUser.accountStatus || "pending"}
                    className="w-full h-14 px-5 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary/50 outline-hidden font-black text-sm transition-all appearance-none"
                  >
                    <option value="pending">পেন্ডিং (Pending)</option>
                    <option value="process">প্রসেসিং (Processing)</option>
                    <option value="approve">অনুমোদিত (Approve)</option>
                  </select>
                </div>

                <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                  পরিবর্তন নিশ্চিত করুন
                </Button>
                <Button type="button" onClick={() => setStatusModal(false)} variant="ghost" className="w-full sm:hidden font-bold mb-4">বন্ধ করুন</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;