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

/* ================= Types ================= */

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

/* ================= Status Helper ================= */

const getStatus = (profile: ProfileItem) => {
  if (profile.isDeleted) {
    return {
      key: "deleted",
      label: "ডিলিটেড",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    };
  }

  switch ((profile.accountStatus || "").toLowerCase()) {
    case "pending":
      return {
        key: "pending",
        label: "পেন্ডিং",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      };

    case "process":
      return {
        key: "process",
        label: "প্রসেসিং",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      };

    case "approve":
    case "approved":
      return {
        key: "approve",
        label: "অনুমোদিত",
        className:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };

    default:
      return {
        key: "unknown",
        label: "অজানা",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

/* ================= Component ================= */

const AllProfile: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "pending" | "process" | "approve" | "deleted"
  >("pending");
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileItem | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosSecure.get("/profile");
      setProfiles(res.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "ডাটা লোড করা যায়নি",
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
    .filter((p) => getStatus(p).key === tab)
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const name =
        typeof p.userId === "object" ? p.userId?.name : p.userId;
      return (
        (name || "").toLowerCase().includes(q) ||
        (p.guardianName || "").toLowerCase().includes(q) ||
        (p.whatsappNumber || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-6 space-y-6">
      {/* ================= Header ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold">
            সব প্রোফাইলসমূহ
          </h2>
          <p className="text-muted-foreground text-sm">
            সকল ব্যবহারকারীর প্রোফাইল যাচাই ও ব্যবস্থাপনা
          </p>
        </div>

        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ফোন খুঁজুন..."
            className="bg-secondary/40 border rounded-xl px-4 py-2 text-sm w-64"
          />
          <Button onClick={fetchProfiles}>রিফ্রেশ</Button>
        </div>
      </div>

      {/* ================= Tabs ================= */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl w-fit border">
        {[
          { key: "pending", label: "পেন্ডিং" },
          { key: "process", label: "প্রসেসিং" },
          { key: "approve", label: "অনুমোদিত" },
          { key: "deleted", label: "ডিলিটেড" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-6 py-2 rounded-xl text-sm font-bold ${
              tab === t.key
                ? "bg-card shadow text-primary"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= Table ================= */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">নাম</th>
              <th className="px-6 py-4">রোল</th>
              <th className="px-6 py-4">অভিভাবক</th>
              <th className="px-6 py-4">যোগাযোগ</th>
              <th className="px-6 py-4">স্ট্যাটাস</th>
              <th className="px-6 py-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  লোড হচ্ছে...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  কোনো তথ্য পাওয়া যায়নি
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const status = getStatus(p);
                return (
                  <tr key={p._id} className="border-t">
                    <td className="px-6 py-4 font-bold">
                      {p.userId?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      {p.role || p.userId?.role || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {p.guardianName || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {p.whatsappNumber || p.userId?.phone || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedProfile(p)}
                      >
                        বিস্তারিত
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= Modal ================= */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-card max-w-4xl w-full rounded-2xl p-6 relative">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute right-4 top-4"
            >
              <X />
            </button>

            <h3 className="text-xl font-bold mb-6">
              প্রোফাইল বিস্তারিত তথ্য
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <DataField
                label="নাম"
                value={selectedProfile.userId?.name}
                icon={<User size={12} />}
              />
              <DataField
                label="ইমেইল"
                value={selectedProfile.userId?.email}
                icon={<Mail size={12} />}
              />
              <DataField
                label="ফোন"
                value={selectedProfile.userId?.phone}
                icon={<Phone size={12} />}
              />
              <DataField
                label="হোয়াটসঅ্যাপ"
                value={selectedProfile.whatsappNumber}
              />
              <DataField
                label="অভিভাবক"
                value={`${selectedProfile.guardianName || "-"} (${selectedProfile.guardianRelation || "N/A"})`}
              />
              <DataField
                label="অ্যাকাউন্ট স্ট্যাটাস"
                value={getStatus(selectedProfile).label}
                highlight
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= UI Helpers ================= */

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
  <div>
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      {icon} {label}
    </p>
    <p
      className={`font-bold ${
        highlight ? "text-primary" : ""
      }`}
    >
      {value || "—"}
    </p>
  </div>
);

export default AllProfile;
