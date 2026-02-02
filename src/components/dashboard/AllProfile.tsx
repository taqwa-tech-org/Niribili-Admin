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
  CreditCard,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";

interface ProfileItem {
  _id: string; // ✅ PROFILE ID (important)
  userId: any;
  profilePhoto?: string | null;
  nidPhoto?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;
  whatsappNumber?: string | null;
  accountStatus?: string | null;
  buildingId?: any;
  flatId?: any;
  room?: string | null;
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
  const [tab, setTab] =
    useState<"pending" | "process" | "approve" | "deleted">("pending");
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileItem | null>(null);
  const [updating, setUpdating] = useState(false);

  /* ================= FETCH ================= */
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/profile");
      setProfiles(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  /* ================= FILTER ================= */
  const filteredProfiles = profiles
    .filter((p) => {
      if (tab === "deleted") return p.isDeleted === true;

      const status = (p.accountStatus || "").toLowerCase();
      if (tab === "approve") return status === "approve";
      return status === tab && !p.isDeleted;
    })
    .filter((p) => {
      if (!search) return true;
      const name = p.userId?.name?.toLowerCase() || "";
      const phone = p.whatsappNumber || "";
      return (
        name.includes(search.toLowerCase()) ||
        phone.includes(search.toLowerCase())
      );
    });

  /* ================= APPROVE HANDLER ================= */
  const handleApproveUser = async () => {
    if (!selectedProfile) return;

    const profileId = selectedProfile._id; // ✅ CORRECT ID

    try {
      setUpdating(true);

      await axiosSecure.patch(`/profile/${profileId}/status`, {
        accountStatus: "approve",
      });

      Swal.fire({
        icon: "success",
        title: "Approved",
        text: "User approved successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      setSelectedProfile(null);
      fetchProfiles();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to approve",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold">Resident Profiles</h2>

        <input
          className="px-4 py-2 border rounded-xl"
          placeholder="Search name / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-2">
        {["pending", "process", "approve", "deleted"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-xl font-bold capitalize ${
              tab === t
                ? "bg-primary text-white"
                : "bg-muted text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  No data found
                </td>
              </tr>
            ) : (
              filteredProfiles.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-4 font-bold">{p.userId?.name}</td>
                  <td className="p-4 capitalize">{p.role}</td>
                  <td className="p-4">{p.whatsappNumber}</td>
                  <td className="p-4 font-bold capitalize">
                    {p.isDeleted ? "deleted" : p.accountStatus}
                  </td>
                  <td className="p-4 text-right">
                    <Button onClick={() => setSelectedProfile(p)}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 relative">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute right-4 top-4"
            >
              <X />
            </button>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Profile Details</h3>

              <div className="flex items-center gap-3">
                <span className="font-bold capitalize">
                  Status: {selectedProfile.accountStatus}
                </span>

                {selectedProfile.accountStatus === "process" && (
                  <Button
                    disabled={updating}
                    onClick={handleApproveUser}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-6">
              <DataField label="Name" value={selectedProfile.userId?.name} />
              <DataField label="Email" value={selectedProfile.userId?.email} />
              <DataField label="Phone" value={selectedProfile.userId?.phone} />
              <DataField
                label="Guardian"
                value={selectedProfile.guardianName}
              />
              <DataField label="Building" value={selectedProfile.buildingId?.name} />
              <DataField
                label="Flat / Room"
                value={`${selectedProfile.flatId?.name} / ${selectedProfile.room}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= HELPER ================= */
const DataField = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-bold">{value || "-"}</p>
  </div>
);

export default AllProfile;
