import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Trash2,
  UserCheck,
  X,
  Users,
  Search
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
  };
  accountStatus?: string;
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
      setUsers(u.data?.data || u.data || []);
      setBuildings(b.data?.data || b.data || []);
      setFlats(f.data?.data || f.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Instant UI Removal logic ---
  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: "This resident profile will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      // 1. UI থেকে সাথে সাথে রিমুভ করা (Optimistic Update)
      const previousUsers = [...users];
      setUsers((prev) => prev.filter((user) => user._id !== id));

      try {
        await axiosSecure.delete(`/profile/${id}`);
        Swal.fire({
          title: "Deleted!",
          text: "User profile has been removed.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        // যদি সার্ভারে ডিলিট না হয়, তবে UI তে আবার ফিরিয়ে আনা
        setUsers(previousUsers);
        Swal.fire("Error", "Could not remove user from server.", "error");
      }
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const status = formData.get("accountStatus") as string;

    try {
      await axiosSecure.patch(`/profile/${selectedUser._id}/status`, {
        accountStatus: status,
      });
      
      // UI তে স্ট্যাটাস আপডেট করা (Without re-fetching everything)
      setUsers(prev => prev.map(u => 
        u._id === selectedUser._id ? { ...u, accountStatus: status } : u
      ));
      
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        timer: 1000,
        showConfirmButton: false
      });
      setStatusModal(false);
    } catch (err) {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  // --- Filtering Logic ---
  const filteredUsers = users.filter((u) => {
    const bId = typeof u.buildingId === "string" ? u.buildingId : u.buildingId?._id;
    const matchesBuilding = filterBuilding === "all" || bId === filterBuilding;
    const matchesSearch = u.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBuilding && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-b from-card/50 to-transparent p-6 rounded-[2rem] border border-border/40">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Resident Directory
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manage User access and status</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/30 border-none outline-hidden text-sm font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Sticky on Desktop */}
        <aside className="w-full lg:w-64 space-y-2 lg:sticky lg:top-8 h-fit">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-4 px-2">
            <Building2 className="w-4 h-4" /> Filter Buildings
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            <Button
              variant={filterBuilding === "all" ? "default" : "outline"}
              className="justify-start rounded-xl text-[11px] font-black uppercase h-11"
              onClick={() => setFilterBuilding("all")}
            >
              All Residents
            </Button>
            {buildings.map((b) => (
              <Button
                key={b._id}
                variant={filterBuilding === b._id ? "default" : "outline"}
                className="justify-start rounded-xl text-[11px] font-black uppercase h-11 truncate"
                onClick={() => setFilterBuilding(b._id)}
              >
                {b.name}
              </Button>
            ))}
          </div>
        </aside>

        {/* User Content Area */}
        <main className="flex-1">
          <div className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 text-[9px] uppercase font-black text-muted-foreground border-b border-border/10">
                  <tr>
                    <th className="p-6">Resident Identity</th>
                    <th className="p-6">Property Assignment</th>
                    <th className="p-6">Current Status</th>
                    <th className="p-6 text-right">Management</th>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            key={u._id}
                            className="hover:bg-primary/[0.02] transition-colors group"
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <img
                                  src={u.profilePhoto || "https://github.com/shadcn.png"}
                                  className="w-11 h-11 rounded-2xl object-cover border-2 border-background shadow-sm"
                                  alt="profile"
                                />
                                <div>
                                  <p className="font-bold text-sm tracking-tight">{u.userId?.name || "Unregistered User"}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">{u.userId?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-primary tracking-tighter">
                                  {bName || "Building Unset"}
                                </p>
                                <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                  <X className="w-2.5 h-2.5 rotate-45" /> Unit: {fName || "N/A"}
                                </p>
                              </div>
                            </td>
                            <td className="p-5">
                              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                u.accountStatus === "approve"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}>
                                {u.accountStatus || "Pending"}
                              </span>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10"
                                  onClick={() => { setSelectedUser(u); setStatusModal(true); }}
                                >
                                  <UserCheck className="w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
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
                        <td colSpan={4} className="p-20 text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                          No residents found in this category
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Status Update Modal */}
      <AnimatePresence>
        {statusModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card w-full max-w-sm p-8 rounded-[3rem] border border-border/60 shadow-2xl relative"
            >
              <button 
                onClick={() => setStatusModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Access Control</h3>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  Modify status for: <span className="text-foreground">{selectedUser.userId?.name}</span>
                </p>
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-primary ml-1">Selection</label>
                  <select
                    name="accountStatus"
                    defaultValue={selectedUser.accountStatus}
                    className="w-full h-12 px-4 rounded-2xl bg-secondary/40 border border-border outline-hidden font-bold text-sm appearance-none"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="process">Processing</option>
                    <option value="approve">Approve Access</option>
                  </select>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/20">
                  Update Residency
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;