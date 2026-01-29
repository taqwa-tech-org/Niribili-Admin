import React, { useEffect, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";

interface ProfileItem {
  _id: string;
  userId: any; // can be string or populated user object
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
      return (
        (p.userId || "").toLowerCase().includes(q) ||
        (p.guardianName || "").toLowerCase().includes(q) ||
        (p.whatsappNumber || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Profiles</h2>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search userId, guardian, phone"
            className="bg-secondary/50 border border-border rounded-xl p-2"
          />
          <Button variant="outline" onClick={fetchProfiles}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${tab === "pending" ? "bg-primary text-white" : "bg-secondary/30"}`}
          onClick={() => setTab("pending")}
        >
          Pending
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "process" ? "bg-primary text-white" : "bg-secondary/30"}`}
          onClick={() => setTab("process")}
        >
          Process
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "approve" ? "bg-primary text-white" : "bg-secondary/30"}`}
          onClick={() => setTab("approve")}
        >
          Approve
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "deleted" ? "bg-primary text-white" : "bg-secondary/30"}`}
          onClick={() => setTab("deleted")}
        >
          Deleted
        </button>
      </div>

      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto bg-linear-to-b from-card to-background/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">UserId</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Guardian</th>
                <th className="px-6 py-4">Whatsapp</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Created</th>{" "}
                <th className="px-6 py-4">Actions</th>{" "}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-destructive"
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center">
                    No profiles
                  </td>
                </tr>
              )}

              {filtered.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold">
                    {typeof p.userId === "string"
                      ? p.userId
                      : p.userId?.name || p.userId?._id}
                  </td>
                  <td className="px-6 py-4">
                    {p.role || (p.userId && p.userId.role)}
                  </td>
                  <td className="px-6 py-4">{p.guardianName || "-"}</td>
                  <td className="px-6 py-4">
                    {p.whatsappNumber || (p.userId && p.userId.phone) || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {p.isDeleted ? "Deleted" : p.accountStatus}
                  </td>
                  <td className="px-6 py-4">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProfile(p)}
                      className="px-3 py-1 rounded bg-primary text-white text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Details Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-4xl p-6 rounded-[1rem] border border-border shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-xl font-bold">Profile Details</h3>
              <div className="flex items-center gap-2">
                <button
                  className="text-sm text-muted-foreground"
                  onClick={() => setSelectedProfile(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Left Column: Personal Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-lg mb-2">
                    Personal Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-bold">
                        {typeof selectedProfile.userId === "string"
                          ? selectedProfile.userId
                          : selectedProfile.userId?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-bold">
                        {selectedProfile.userId?.email || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-bold">
                        {selectedProfile.userId?.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-bold">
                        {selectedProfile.role || selectedProfile.userId?.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        User Status
                      </p>
                      <p className="font-bold">
                        {selectedProfile.userId?.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account Status
                      </p>
                      <p className="font-bold">
                        {selectedProfile.isDeleted
                          ? "Deleted"
                          : selectedProfile.accountStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="text-sm">{selectedProfile.bio || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Profile Photo */}
                <div>
                  <h4 className="font-bold text-lg mb-2">Profile Photo</h4>
                  <img
                    src={selectedProfile.profilePhoto || ""}
                    alt="profile"
                    className="w-32 h-32 object-cover rounded-lg bg-muted/20"
                  />
                </div>

                {/* NID Photo */}
                <div>
                  <h4 className="font-bold text-lg mb-2">NID Photo</h4>
                  <p className="text-sm">
                    {selectedProfile.nidPhoto || "No NID Photo"}
                  </p>
                </div>
              </div>

              {/* Right Column: Contact & Address */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-lg mb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Guardian Name
                      </p>
                      <p className="font-bold">
                        {selectedProfile.guardianName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Guardian Phone
                      </p>
                      <p className="font-bold">
                        {selectedProfile.guardianPhone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Guardian Relation
                      </p>
                      <p className="font-bold">
                        {selectedProfile.guardianRelation || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Emergency Contact
                      </p>
                      <p className="font-bold">
                        {selectedProfile.emergencyContact || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-bold">
                        {selectedProfile.whatsappNumber || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">
                    Address Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Building</p>
                      <p className="font-bold">
                        {selectedProfile.buildingId?.name ||
                          selectedProfile.buildingId ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flat</p>
                      <p className="font-bold">
                        {selectedProfile.flatId?.name ||
                          selectedProfile.flatId ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-bold">{selectedProfile.room || "-"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">Timestamps</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Created At
                      </p>
                      <p className="font-bold">
                        {selectedProfile.createdAt
                          ? new Date(selectedProfile.createdAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Updated At
                      </p>
                      <p className="font-bold">
                        {selectedProfile.updatedAt
                          ? new Date(selectedProfile.updatedAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 mt-6 border-t">
              <Button variant="ghost" onClick={() => setSelectedProfile(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProfile;
