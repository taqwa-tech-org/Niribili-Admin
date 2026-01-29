import React, { useEffect, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import {
  X,
  User,
  Phone,
  Mail,
  Shield,
  MapPin,
  Calendar,
  CreditCard,
  Info,
} from "lucide-react";

interface ProfileItem {
  _id: string;
  userId: any;
  profilePhoto?: string | null;
  nidPhoto?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;
  emergencyContact?: string | null;
  buildingId?: any;
  flatId?: any;
  room?: string | null;
  whatsappNumber?: string | null;
  accountStatus?: string | null;
  bio?: string | null;
  role?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const AllProfile: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "process" | "approve" | "deleted">(
    "pending",
  );
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(
    null,
  );

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosSecure.get("/profile");
      setProfiles(res.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load profiles",
      );
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filtered = profiles
    .filter((p) => {
      if (tab === "deleted") return !!p.isDeleted;
      const status = (p.accountStatus || "").toLowerCase();
      if (tab === "approve")
        return status === "approve" || status === "approved";
      return status === tab;
    })
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const userName = typeof p.userId === "object" ? p.userId?.name : p.userId;
      return (
        (userName || "").toLowerCase().includes(q) ||
        (p.guardianName || "").toLowerCase().includes(q) ||
        (p.whatsappNumber || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Resident Profiles
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage and verify all user profile details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone..."
            className="bg-secondary/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
          />
          <Button
            variant="default"
            onClick={fetchProfiles}
            className="rounded-xl"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl w-fit border border-border">
        {["pending", "process", "approve", "deleted"].map((t) => (
          <button
            key={t}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? "bg-card shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab(t as any)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-black tracking-widest border-b border-border">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Guardian</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center animate-pulse"
                  >
                    Loading profiles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold">
                      {typeof p.userId === "string"
                        ? p.userId
                        : p.userId?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {p.role || p.userId?.role || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.guardianName || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {p.whatsappNumber || p.userId?.phone || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          p.isDeleted
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {p.isDeleted ? "Deleted" : p.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedProfile(p)}
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Details Modal --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="bg-card w-full max-w-5xl rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <User size={20} />
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Profile Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Image Section (Left) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Profile Photo
                    </label>
                    <div className="aspect-square rounded-3xl overflow-hidden border-4 border-muted shadow-inner bg-secondary/30">
                      {console.log(
                        `selectedProfile.profilePhoto:`,
                        selectedProfile.profilePhoto,
                      )}
                      <img
                        src={
                          selectedProfile.profilePhoto ||
                          "https://github.com/shadcn.png"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      NID Verification Photo
                    </label>
                    <div className="relative group rounded-2xl overflow-hidden border border-border bg-secondary/20">
                      {selectedProfile.nidPhoto ? (
                        (console.log(selectedProfile.nidPhoto),
                        (
                          <img
                            src={selectedProfile.nidPhoto}
                            alt="NID"
                            className="w-full h-auto object-contain bg-black/5 min-h-[150px]"
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                          <CreditCard size={32} className="mb-2 opacity-20" />
                          <p className="text-xs">No NID Photo Uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Section (Right) */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <SectionTitle
                      icon={<Info size={14} />}
                      title="Personal Details"
                    />
                    <div className="space-y-4">
                      <DataField
                        label="Full Name"
                        value={
                          typeof selectedProfile.userId === "object"
                            ? selectedProfile.userId?.name
                            : selectedProfile.userId
                        }
                      />
                      <DataField
                        label="Email Address"
                        value={selectedProfile.userId?.email}
                        icon={<Mail size={12} />}
                      />
                      <DataField
                        label="Phone"
                        value={selectedProfile.userId?.phone}
                        icon={<Phone size={12} />}
                      />
                      <DataField
                        label="Role / Designation"
                        value={
                          selectedProfile.role || selectedProfile.userId?.role
                        }
                      />
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Biography
                        </label>
                        <p className="text-sm mt-1 leading-relaxed">
                          {selectedProfile.bio || "No bio available."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Status */}
                  <div className="space-y-6">
                    <SectionTitle
                      icon={<Shield size={14} />}
                      title="Security & Status"
                    />
                    <div className="space-y-4">
                      <DataField
                        label="Account Status"
                        value={
                          selectedProfile.isDeleted
                            ? "DELETED"
                            : selectedProfile.accountStatus
                        }
                        highlight
                      />
                      <DataField
                        label="WhatsApp"
                        value={selectedProfile.whatsappNumber}
                      />
                      <DataField
                        label="Guardian"
                        value={`${selectedProfile.guardianName || "-"} (${selectedProfile.guardianRelation || "N/A"})`}
                      />
                      <DataField
                        label="Guardian Phone"
                        value={selectedProfile.guardianPhone}
                      />
                    </div>

                    <SectionTitle
                      icon={<MapPin size={14} />}
                      title="Living Space"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <DataField
                        label="Building"
                        value={
                          selectedProfile.buildingId?.name ||
                          selectedProfile.buildingId
                        }
                      />
                      <DataField
                        label="Flat / Room"
                        value={`${selectedProfile.flatId?.name || "-"} / ${selectedProfile.room || "-"}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps Footer */}
              <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-8 justify-center">
                <TimeBox label="Created On" date={selectedProfile.createdAt} />
                <TimeBox
                  label="Last Updated"
                  date={selectedProfile.updatedAt}
                />
              </div>
            </div>

            <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedProfile(null)}
                className="rounded-xl px-8 font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- UI Helper Components --- */

const SectionTitle = ({ icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
    <span className="text-primary">{icon}</span>
    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">
      {title}
    </h4>
  </div>
);

const DataField = ({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value?: string | null;
  icon?: any;
  highlight?: boolean;
}) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
      {icon} {label}
    </p>
    <p
      className={`text-sm font-extrabold ${highlight ? "text-primary" : "text-foreground"}`}
    >
      {value || "—"}
    </p>
  </div>
);

const TimeBox = ({ label, date }: { label: string; date?: string }) => (
  <div className="text-center">
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
      {label}
    </p>
    <p className="text-xs font-bold">
      {date ? new Date(date).toLocaleString() : "N/A"}
    </p>
  </div>
);

export default AllProfile;
