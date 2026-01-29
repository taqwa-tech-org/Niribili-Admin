import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Building2, DoorOpen, Plus, Edit2, Trash2, Users, ArrowRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";

// --- Types ---
interface Building { _id: string; name: string; }
interface Flat { _id: string; name: string; buildingId: string; }
interface UserProfile {
  _id: string;
  buildingId?: string | { _id: string; name?: string };
  flatId?: string | { _id: string; name?: string };
  guardianName?: string;
  accountStatus?: string;
  profilePhoto?: string;
  userId?: { name: string; email: string; phone?: string; };
}

const BuildingManagement = () => {
  const axiosSecure = useAxiosSecure();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [modals, setModals] = useState({ building: false, flat: false });
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [b, f, u] = await Promise.all([
        axiosSecure.get("/buildings"),
        axiosSecure.get("/flats"),
        axiosSecure.get("/profile"),
      ]);
      setBuildings(b.data?.data || b.data || []);
      setFlats(f.data?.data || f.data || []);
      setUsers(u.data?.data || u.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load property data", "error");
    }
  }, [axiosSecure]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getResidentCount = (bId: string) => {
    return users.filter((u) => {
      const id = typeof u.buildingId === "object" ? u.buildingId?._id : u.buildingId;
      return id === bId;
    }).length;
  };

  const getFlatResidents = () => {
    if (!selectedFlatId) return [];
    return users.filter((u) => {
      const id = typeof u.flatId === "object" ? u.flatId?._id : u.flatId;
      return id === selectedFlatId;
    });
  };

  const handleDelete = async (url: string, type: string) => {
    const result = await Swal.fire({
      title: `Delete ${type}?`,
      text: "All associated data will be affected!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });
    if (result.isConfirmed) {
      await axiosSecure.delete(url);
      fetchData();
      if (type === "Building") setSelectedBuildingId(null);
      if (type === "Flat") setSelectedFlatId(null);
      Swal.fire("Deleted!", "", "success");
    }
  };

  const handleBuildingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name");
    try {
      if (selectedItem) await axiosSecure.patch(`/buildings/${selectedItem._id}`, { name });
      else await axiosSecure.post("/buildings", { name });
      setModals({ ...modals, building: false });
      fetchData();
    } catch (err) { Swal.fire("Error", "Action failed", "error"); }
  };

  const handleFlatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = { buildingId: formData.get("buildingId"), name: formData.get("name") };
    try {
      if (selectedItem) await axiosSecure.patch(`/flats/${selectedItem._id}`, payload);
      else await axiosSecure.post("/flats", payload);
      setModals({ ...modals, flat: false });
      fetchData();
    } catch (err) { Swal.fire("Error", "Check all fields", "error"); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-6 lg:space-y-10">
      
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-b from-card/60 to-transparent p-5 sm:p-8 rounded-[2rem] border border-border/40 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter">Property Assets</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold tracking-widest uppercase">Inventory & Resident Management</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button onClick={() => { setSelectedItem(null); setModals({ ...modals, building: true }); }} variant="outline" className="flex-1 sm:flex-none rounded-xl font-bold text-xs h-11">
            <Plus className="w-4 h-4 mr-1 sm:mr-2" /> Building
          </Button>
          <Button onClick={() => { setSelectedItem(null); setModals({ ...modals, flat: true }); }} className="flex-1 sm:flex-none rounded-xl font-bold bg-primary text-xs h-11">
            <DoorOpen className="w-4 h-4 mr-1 sm:mr-2" /> New Flat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-10">
        
        {/* Building Section: 12 Col Mobile -> 5 Col Desktop */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-2">
            <Building2 className="w-4 h-4" /> Core Buildings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {buildings.map((b) => (
              <motion.div
                key={b._id}
                whileHover={{ y: -2 }}
                onClick={() => { setSelectedBuildingId(b._id); setSelectedFlatId(null); }}
                className={`p-5 rounded-[1.8rem] border cursor-pointer transition-all duration-300 ${selectedBuildingId === b._id ? "bg-primary/5 border-primary shadow-[0_10px_30px_-15px_rgba(var(--primary),0.3)]" : "bg-card border-border/60 hover:border-primary/40"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <h3 className={`font-black uppercase text-sm tracking-tight ${selectedBuildingId === b._id ? "text-primary" : ""}`}>{b.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full uppercase">
                        <Users className="w-3 h-3" /> {getResidentCount(b._id)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full uppercase">
                        <DoorOpen className="w-3 h-3" /> {flats.filter((f) => f.buildingId === b._id).length} Units
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); setSelectedItem(b); setModals({ ...modals, building: true }); }}>
                      <Edit2 className="w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(`/buildings/${b._id}`, "Building"); }}>
                      <Trash2 className="w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Flats Section: 12 Col Mobile -> 7 Col Desktop */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedBuildingId ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-2">
                  <ArrowRight className="w-4 h-4" /> Units in {buildings.find((b) => b._id === selectedBuildingId)?.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {flats.filter((f) => f.buildingId === selectedBuildingId).map((f) => (
                    <div
                      key={f._id}
                      onClick={() => setSelectedFlatId(f._id)}
                      className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center group transition-all ${selectedFlatId === f._id ? "bg-primary border-primary text-primary-foreground shadow-lg" : "bg-card border-border hover:border-primary/50"}`}
                    >
                      <span className="font-bold text-xs sm:text-sm uppercase tracking-tighter truncate mr-2">{f.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedItem(f); setModals({ ...modals, flat: true }); }} className="p-1 hover:bg-white/20 rounded-md"><Edit2 className="w-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(`/flats/${f._id}`, "Flat"); }} className="p-1 hover:bg-white/20 rounded-md text-red-300"><Trash2 className="w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-48 sm:h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-[2.5rem] text-muted-foreground bg-card/20">
                <Building2 className="w-10 h-10 mb-3 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest px-6 text-center">Select a building to explore available units</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Resident Table: Full Width */}
      <AnimatePresence>
        {selectedFlatId && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="space-y-4 pt-6">
            <div className="flex items-center gap-2 px-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Resident Roster: {flats.find((f) => f._id === selectedFlatId)?.name}</h2>
            </div>
            <div className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-muted/40 text-[9px] font-black uppercase text-muted-foreground border-b border-border/20">
                  <tr>
                    <th className="p-6">Resident Profile</th>
                    <th className="p-6">Contact & Outreach</th>
                    <th className="p-6">Verification</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {getFlatResidents().length > 0 ? (
                    getFlatResidents().map((u) => (
                      <tr key={u._id} className="hover:bg-primary/[0.01] transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <img src={u.profilePhoto || "https://github.com/shadcn.png"} className="w-11 h-11 rounded-2xl object-cover border-2 border-background shadow-sm" />
                            <div>
                              <p className="font-bold text-sm tracking-tight">{u.userId?.name || u.guardianName}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[150px]">{u.userId?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <p className="text-xs font-black text-foreground/80">{u.userId?.phone || "N/A"}</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border ${u.accountStatus === "approve" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
                            {u.accountStatus || "Pending Review"}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl shadow-sm"><Eye className="w-4" /></Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-16 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No assigned residents found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Modal Backdrop Component */}
      {(modals.building || modals.flat) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md p-8 sm:p-10 rounded-[3rem] border border-border/80 shadow-2xl relative">
            <button onClick={() => setModals({ building: false, flat: false })} className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-full transition-colors"><X size={20} /></button>
            
            {modals.building ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedItem ? "Modify" : "Establish"} Building</h3>
                  <p className="text-xs text-muted-foreground font-bold">Set the core identification for your property.</p>
                </div>
                <form onSubmit={handleBuildingSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary ml-1">Official Building Name</label>
                    <input name="name" defaultValue={selectedItem?.name} required placeholder="e.g. Sky Tower A" className="w-full h-14 px-5 rounded-2xl bg-secondary/40 border border-border outline-hidden focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all" />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/25 transition-transform active:scale-95">Synchronize Data</Button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedItem ? "Refine" : "Allocate"} Flat</h3>
                  <p className="text-xs text-muted-foreground font-bold">Assign units to their respective parent buildings.</p>
                </div>
                <form onSubmit={handleFlatSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary ml-1">Parent Asset</label>
                    <select name="buildingId" defaultValue={selectedItem?.buildingId || selectedBuildingId || ""} className="w-full h-14 px-5 rounded-2xl bg-secondary/40 border border-border outline-hidden focus:ring-2 focus:ring-primary/20 font-bold text-sm appearance-none">
                      <option value="" disabled>Select Building</option>
                      {buildings.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-primary ml-1">Unit Designation</label>
                    <input name="name" defaultValue={selectedItem?.name} required placeholder="e.g. Suite 402" className="w-full h-14 px-5 rounded-2xl bg-secondary/40 border border-border outline-hidden focus:ring-2 focus:ring-primary/20 font-bold text-sm" />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/25">Confirm Allocation</Button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BuildingManagement;