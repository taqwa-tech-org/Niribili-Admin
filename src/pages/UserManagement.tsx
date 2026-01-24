import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Building2, DoorOpen, X, Plus, Save, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { toast } from "sonner";

// --- Types ---
interface Building {
  _id: string;
  name: string;
}

interface Flat {
  _id: string;
  name: string;
  buildingId: string;
}

interface UserProfile {
  _id: string;
  guardianName: string;
  whatsappNumber: string;
  profilePhoto: string;
  accountStatus: 'process' | 'approved' | 'rejected';
  buildingId: string;
  flatId: string;
  room: string;
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
    } catch { toast.error("Failed to load data"); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleModal = (type: keyof typeof modals, data: any = null) => {
    setSelected(data);
    setModals((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleCreateFlat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      ...formData,
      monthlyRent: Number(formData.monthlyRent),
      occupantsCount: Number(formData.occupantsCount),
      electricity: Number(formData.electricity),
      water: Number(formData.water),
      paymentDeadline: new Date(formData.paymentDeadline as string).toISOString(),
    };
    try {
      await axiosSecure.post("/flats", payload);
      toast.success("Flat created!");
      fetchData(); toggleModal("flat");
    } catch { toast.error("Error creating flat"); }
  };

  const filteredUsers = filterBuilding === "all" 
    ? users 
    : users.filter(u => u.buildingId === filterBuilding);

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-background">
      
      {/* --- Action Buttons --- */}
      <div className="flex justify-end gap-3 bg-linear-to-b from-card to-transparent p-6 rounded-3xl border border-border/40">
        <Button onClick={() => toggleModal("building")} variant="outline" className="rounded-2xl h-12 border-primary/20 font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Building
        </Button>
        <Button onClick={() => toggleModal("flat")} className="rounded-2xl h-12 bg-primary font-bold">
          <DoorOpen className="w-4 h-4 mr-2" /> New Flat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- Sidebar: Building Filter & List --- */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 px-2 font-black text-xs uppercase tracking-widest text-muted-foreground">
            <Building2 className="w-4 h-4 text-primary"/> Filter by Buildings
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => setFilterBuilding("all")}
              className={`w-full p-4 rounded-2xl text-left transition-all border font-bold text-xs uppercase ${filterBuilding === "all" ? 'bg-primary text-white border-primary shadow-lg' : 'bg-card/50 border-border/50 hover:border-primary/50'}`}
            >
              All Residents
            </button>
            {buildings.map(b => (
              <div 
                key={b._id}
                onClick={() => setFilterBuilding(b._id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${filterBuilding === b._id ? 'bg-primary/10 border-primary/40 text-primary shadow-sm' : 'bg-card/50 border-border/50 hover:bg-card'}`}
              >
                <span className="text-xs font-bold uppercase">{b.name}</span>
                <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all" 
                      onClick={(e) => { e.stopPropagation(); toggleModal("building", b); }} />
              </div>
            ))}
          </div>
        </aside>

        {/* --- Resident Table --- */}
        <main className="lg:col-span-9 glass rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border/20 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              <tr>
                <th className="p-6">Resident Info</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-primary/5 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={u.profilePhoto} className="w-12 h-12 rounded-xl object-cover border border-border" onError={(e)=>(e.currentTarget.src="https://ui-avatars.com/api/?name=User")}/>
                      <div>
                        <p className="font-bold text-base leading-none mb-1">{u.guardianName}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                          <span className="text-primary">{buildings.find(b=>b._id === u.buildingId)?.name}</span>
                          <span>•</span>
                          <span>{flats.find(f=>f._id === u.flatId)?.name || "N/A"} (Room {u.room})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${u.accountStatus === 'process' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <Button onClick={() => toggleModal("user", u)} variant="ghost" size="icon" className="rounded-full hover:bg-primary/20"><Edit2 className="w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Building Modal (Create/Update) */}
      <AnimatePresence>
        {modals.building && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-sm p-8 rounded-[2.5rem] border border-border shadow-2xl relative">
              <h3 className="text-xl font-black mb-6">{selected ? "Edit Building" : "New Building"}</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const name = new FormData(e.currentTarget).get("name");
                selected ? await axiosSecure.patch(`/buildings/${selected._id}`, { name }) : await axiosSecure.post("/buildings", { name });
                fetchData(); toggleModal("building");
                toast.success("Success");
              }} className="space-y-4">
                <input name="name" defaultValue={selected?.name} required placeholder="Building Name" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none focus:ring-2 focus:ring-primary" />
                <Button type="submit" className="w-full h-14 bg-primary font-bold rounded-2xl shadow-glow">Save Building</Button>
                <Button type="button" onClick={() => toggleModal("building")} variant="ghost" className="w-full">Cancel</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Flat Modal (Create) */}
      <AnimatePresence>
        {modals.flat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card w-full max-w-xl p-8 rounded-[2.5rem] border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">Register New Flat</h3>
              <form onSubmit={handleCreateFlat} className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase">
                <div className="col-span-2 space-y-1">
                  <label className="ml-1">Select Building</label>
                  <select name="buildingId" required defaultValue={filterBuilding !== 'all' ? filterBuilding : ""} className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none">
                    <option value="">Choose Property</option>
                    {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="ml-1">Flat Name</label>
                  <input name="name" placeholder="e.g. A-101" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="ml-1">Monthly Rent</label>
                  <input name="monthlyRent" type="number" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="ml-1">Occupants</label>
                  <input name="occupantsCount" type="number" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="ml-1">Electricity (Base)</label>
                  <input name="electricity" type="number" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none" />
                </div>
                <div className="col-span-2 space-y-1">
                   <label className="ml-1">Payment Deadline</label>
                   <input name="paymentDeadline" type="date" className="w-full p-4 rounded-2xl bg-secondary/50 border border-border outline-none" required />
                </div>
                <Button type="submit" className="col-span-2 h-16 bg-primary text-base font-black rounded-2xl shadow-glow">Create Flat Record</Button>
                <Button type="button" onClick={() => toggleModal("flat")} variant="ghost" className="col-span-2">Close</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserManagement;