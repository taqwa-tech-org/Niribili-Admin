import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Building2, DoorOpen, Plus, Trash2, Users, Zap, Droplets, Utensils, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import Swal from "sweetalert2";

// --- Types ---
interface Building { _id: string; name: string; }
interface Flat { 
  _id: string; 
  name: string; 
  buildingId: string; 
  monthlyRent: number; 
  occupantsCount: number;
  electricity: number;
  water: number;
  mealCost: number;
  serviceCharge: number;
  paymentDeadline: string; 
}
interface UserProfile {
  _id: string;
  guardianName: string;
  whatsappNumber: string;
  profilePhoto: string;
  accountStatus: "process" | "approved" | "rejected";
  buildingId: string;
  flatId: string;
  role: string;
}

const UserManagement = () => {
  const axiosSecure = useAxiosSecure();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [modals, setModals] = useState({ building: false, flat: false, user: false });
  const [selected, setSelected] = useState<any>(null);
  const [filterBuilding, setFilterBuilding] = useState<string>("all");

  const fetchData = async () => {
    try {
      const [u, b, f] = await Promise.all([
        axiosSecure.get("/profile"),
        axiosSecure.get("/buildings"),
        axiosSecure.get("/flats"),
      ]);
      setUsers(u.data?.data || u.data || []);
      setBuildings(b.data?.data || b.data || []);
      setFlats(f.data?.data || f.data || []);
    } catch {
      Swal.fire("Error!", "Failed to load data", "error");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = filterBuilding === "all" 
    ? users 
    : users.filter(u => u.buildingId === filterBuilding);

  const toggleModal = (type: keyof typeof modals, data: any = null) => {
    setSelected(data);
    setModals((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const successAlert = (msg: string) => {
    Swal.fire({
      title: "Success!",
      text: msg,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: 'rounded-[2rem]' }
    });
  };

  // --- Fixed Delete Helper ---
  const handleDelete = async (url: string, itemType: string) => {
    const result = await Swal.fire({
      title: `Delete ${itemType}?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        await axiosSecure.delete(url);
        successAlert(`${itemType} deleted successfully`);
        fetchData(); // Refresh data after delete
      } catch (err: any) {
        console.error("Delete Error:", err);
        Swal.fire("Error!", err.response?.data?.message || `Could not delete ${itemType}`, "error");
      }
    }
  };

  // --- Submit Handlers ---
  const handleBuildingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name");
    try {
      if (selected?._id) {
        await axiosSecure.patch(`/buildings/${selected._id}`, { name });
        successAlert("Building updated");
      } else {
        await axiosSecure.post("/buildings", { name });
        successAlert("Building created");
      }
      fetchData();
      toggleModal("building");
    } catch (err: any) { 
        Swal.fire("Error!", err.response?.data?.message || "Operation failed", "error"); 
    }
  };

  const handleFlatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      buildingId: formData.get("buildingId"),
      name: formData.get("name"),
      monthlyRent: Number(formData.get("monthlyRent")),
      occupantsCount: Number(formData.get("occupantsCount")),
      electricity: Number(formData.get("electricity")),
      water: Number(formData.get("water")),
      mealCost: Number(formData.get("mealCost")),
      serviceCharge: Number(formData.get("serviceCharge")),
      paymentDeadline: formData.get("paymentDeadline") 
        ? new Date(formData.get("paymentDeadline") as string).toISOString() 
        : new Date().toISOString(),
    };

    try {
      if (selected?._id) {
        await axiosSecure.patch(`/flats/${selected._id}`, payload);
        successAlert("Flat updated");
      } else {
        await axiosSecure.post("/flats", payload);
        successAlert("Flat created");
      }
      fetchData();
      toggleModal("flat");
    } catch (err: any) {
      Swal.fire("Validation Error", err.response?.data?.message || "Please check all fields", "error");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await axiosSecure.patch(`/profile/${selected._id}`, formData);
      successAlert("User updated");
      fetchData();
      toggleModal("user");
    } catch { Swal.fire("Error!", "Update failed", "error"); }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-background text-foreground">
      {/* Header Actions */}
      <div className="flex justify-end gap-2 mb-6 bg-linear-to-b from-card/50 to-transparent p-4 rounded-2xl border border-border/40">
        <Button onClick={() => toggleModal("building")} variant="outline" className="rounded-xl h-10 font-bold border-primary/20">
          <Plus className="w-4 h-4 mr-1.5" /> Building
        </Button>
        <Button onClick={() => toggleModal("flat")} className="rounded-xl h-10 bg-primary text-white font-bold shadow-md hover:bg-primary/90">
          <DoorOpen className="w-4 h-4 mr-1.5" /> New Flat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <h2 className="px-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Properties
          </h2>
          <div className="space-y-1.5">
            <button 
              onClick={() => setFilterBuilding("all")} 
              className={`w-full p-3 rounded-xl text-left transition-all border font-bold text-xs ${filterBuilding === "all" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card/40 border-border/50 hover:bg-card"}`}
            >
              All Residents
            </button>
            {buildings.map(b => (
              <div key={b._id} className="space-y-1">
                <div 
                  onClick={() => setFilterBuilding(b._id)} 
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${filterBuilding === b._id ? "bg-primary/10 border-primary/40 text-primary" : "bg-card/40 border-border/50 hover:bg-card"}`}
                >
                  <span className="text-xs font-bold uppercase truncate">{b.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Edit2 className="w-3.5 h-3.5 hover:text-primary" onClick={(e) => { e.stopPropagation(); toggleModal("building", b); }} />
                    <Trash2 className="w-3.5 h-3.5 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(`/buildings/${b._id}`, "Building"); }} />
                  </div>
                </div>
                {filterBuilding === b._id && (
                    <div className="ml-4 space-y-1 mt-1 border-l-2 border-border/30 pl-2">
                      {flats.filter(f => f.buildingId === b._id).map(f => (
                        <div key={f._id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                          <span className="text-[10px] font-bold text-muted-foreground">{f.name}</span>
                          <div className="flex gap-1">
                             <Edit2 className="w-3 h-3 cursor-pointer hover:text-primary" onClick={() => toggleModal("flat", f)} />
                             <Trash2 className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => handleDelete(`/flats/${f._id}`, "Flat")} />
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Resident Table */}
        <main className="lg:col-span-9">
          <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-border/20 text-[10px] uppercase font-black text-muted-foreground">
                  <tr><th className="p-5">Resident</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <img src={u.profilePhoto} className="w-10 h-10 rounded-lg object-cover" onError={(e) => e.currentTarget.src = 'https://github.com/shadcn.png'} />
                          <div>
                            <p className="font-bold text-sm leading-none mb-1">{u.guardianName}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                              {buildings.find(b => b._id === u.buildingId)?.name} • {flats.find(f => f._id === u.flatId)?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${u.accountStatus === "process" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}`}>
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button onClick={() => toggleModal("user", u)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Edit2 className="w-3.5" /></Button>
                          <Button onClick={() => handleDelete(`/profile/${u._id}`, "Resident")} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive"><Trash2 className="w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* Building Modal */}
      <AnimatePresence>
        {modals.building && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-sm p-6 rounded-[2rem] border border-border shadow-2xl">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">{selected ? "Edit Building" : "New Building"}</h3>
              <form onSubmit={handleBuildingSubmit} className="space-y-4">
                <input name="name" defaultValue={selected?.name || ""} placeholder="E.g. Green Villa" required className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border outline-none text-sm font-bold" />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 h-11 bg-primary text-white font-bold rounded-xl">Save</Button>
                  <Button type="button" onClick={() => toggleModal("building")} variant="ghost" className="h-11 px-4 rounded-xl font-bold">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flat Modal */}
      <AnimatePresence>
        {modals.flat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-lg p-8 rounded-[2.5rem] border border-border shadow-2xl my-10">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Flat Details</h3>
              <form onSubmit={handleFlatSubmit} className="space-y-4 text-[10px] font-black uppercase">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Building</label>
                    <select name="buildingId" defaultValue={selected?.buildingId || ""} required className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none">
                      <option value="">Select Building</option>
                      {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Flat Name</label>
                    <input name="name" defaultValue={selected?.name} required className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label>Rent</label><input name="monthlyRent" type="number" defaultValue={selected?.monthlyRent} required className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                  <div className="space-y-1"><label>Occupants</label><input name="occupantsCount" type="number" defaultValue={selected?.occupantsCount || 1} required className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><label>Electric</label><input name="electricity" type="number" defaultValue={selected?.electricity || 0} required className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                    <div className="space-y-1"><label>Water</label><input name="water" type="number" defaultValue={selected?.water || 0} required className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                    <div className="space-y-1"><label>Service</label><input name="serviceCharge" type="number" defaultValue={selected?.serviceCharge || 0} required className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label>Meal Cost</label><input name="mealCost" type="number" defaultValue={selected?.mealCost || 0} required className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                  <div className="space-y-1"><label>Deadline</label><input name="paymentDeadline" type="date" defaultValue={selected?.paymentDeadline ? new Date(selected.paymentDeadline).toISOString().split('T')[0] : ""} className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border outline-none" /></div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 h-12 bg-primary text-white font-black rounded-2xl uppercase text-xs">Save Flat</Button>
                  <Button type="button" onClick={() => toggleModal("flat")} variant="ghost" className="h-12 px-6 rounded-2xl font-black uppercase text-xs">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {modals.user && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card w-full max-w-lg p-6 rounded-[2.5rem] border border-border shadow-2xl">
              <h3 className="text-xl font-black mb-6 uppercase">Update Resident</h3>
              <form onSubmit={handleUpdateUser} className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase">
                <div className="space-y-1"><label>Guardian</label><input name="guardianName" defaultValue={selected.guardianName} className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border font-bold text-sm" /></div>
                <div className="space-y-1"><label>WhatsApp</label><input name="whatsappNumber" defaultValue={selected.whatsappNumber} className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border font-bold text-sm" /></div>
                <div className="space-y-1">
                  <label>Status</label>
                  <select name="accountStatus" defaultValue={selected.accountStatus} className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border font-bold">
                    <option value="process">Processing</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label>Role</label>
                  <select name="role" defaultValue={selected.role} className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border font-bold">
                    <option value="user">Resident</option><option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl">Save</Button>
                  <Button type="button" onClick={() => toggleModal("user")} variant="ghost" className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;