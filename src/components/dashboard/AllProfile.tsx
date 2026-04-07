import React, { useEffect, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProfileItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
  };
  profilePhoto?: string | null;
  nidPhoto?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;
  emergencyContact?: string | null;
  whatsappNumber?: string | null;
  accountStatus?: string | null;
  buildingId?: string | { _id: string; name?: string } | null;
  flatId?: string | { _id: string; name?: string } | null;
  room?: string | null;
  bio?: string | null;
  role?: string | null;
  isDeleted?: boolean;
}

interface Building {
  _id: string;
  name: string;
}

interface Flat {
  _id: string;
  name: string;
  buildingId?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type TabKey = "pending" | "process" | "approve" | "deleted";

// ─── Constants ───────────────────────────────────────────────────────────────
const LIMIT = 50;

const TAB_CONFIG: { key: TabKey; label: string; desc: string; color: string }[] = [
  { key: "pending", label: "Pending",    desc: "Awaiting review",    color: "text-yellow-600" },
  { key: "process", label: "In Process", desc: "Under verification", color: "text-blue-600"   },
  { key: "approve", label: "Approved",   desc: "Active residents",   color: "text-green-600"  },
  { key: "deleted", label: "Deleted",    desc: "Removed accounts",   color: "text-red-500"    },
];

const resolveName = (
  value: string | { _id: string; name?: string } | null | undefined,
  list: { _id: string; name: string }[]
) => {
  if (!value) return undefined;
  if (typeof value === "object") {
    return value.name || list.find((item) => item._id === value._id)?.name;
  }
  return list.find((item) => item._id === value)?.name;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AllProfile: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [profiles, setProfiles]           = useState<ProfileItem[]>([]);
  const [meta, setMeta]                   = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [loading, setLoading]             = useState(false);
  const [buildings, setBuildings]         = useState<Building[]>([]);
  const [flats, setFlats]                 = useState<Flat[]>([]);
  const [tab, setTab]                     = useState<TabKey>("approve");
  const [search, setSearch]               = useState("");
  const [searchInput, setSearchInput]     = useState("");
  const [page, setPage]                   = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);
  const [updating, setUpdating]           = useState(false);

  // ── Fetch Buildings/Flats ───────────────────────────────────────────────
  useEffect(() => {
    const fetchBuildingsAndFlats = async () => {
      try {
        const [bRes, fRes] = await Promise.all([
          axiosSecure.get("/buildings"),
          axiosSecure.get("/flats"),
        ]);
        setBuildings(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
        setFlats(Array.isArray(fRes.data?.data) ? fRes.data.data : []);
      } catch (err) {
        console.error("Fetch buildings/flats error:", err);
        setBuildings([]);
        setFlats([]);
      }
    };

    fetchBuildingsAndFlats();
  }, [axiosSecure]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProfiles = async (currentPage: number, currentTab: TabKey, currentSearch: string) => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: LIMIT,
      };

      if (currentSearch.trim()) {
        const searchValue = currentSearch.trim();
        params.search = searchValue;
        params.searchTerm = searchValue;
      }

      if (currentTab === "deleted") {
        const res = await axiosSecure.get("/user/deleted/all", { params });

        if (res.data?.success) {
          const users = res.data.data.users || [];
          const mappedResults: ProfileItem[] = users.map((u: any) => {
            const profile = u.profile || {};
            return {
              _id: profile._id || u._id,
              userId: {
                _id: u._id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role,
              },
              isDeleted: u.isDeleted,
              profilePhoto: profile.profilePhoto,
              nidPhoto: profile.nidPhoto,
              guardianName: profile.guardianName,
              guardianPhone: profile.guardianPhone,
              guardianRelation: profile.guardianRelation,
              emergencyContact: profile.emergencyContact,
              whatsappNumber: profile.whatsappNumber,
              accountStatus: profile.accountStatus,
              buildingId: profile.buildingId,
              flatId: profile.flatId,
              room: profile.room,
              bio: profile.bio,
              role: profile.role || u.role,
            };
          });

          setProfiles(mappedResults);
          setMeta(res.data.data.meta || { total: 0, page: 1, limit: LIMIT, totalPages: 1 });
        } else {
          setProfiles([]);
        }
      } else {
        params.accountStatus = currentTab; // "pending" | "process" | "approve"
        params.isDeleted = false;

        const res = await axiosSecure.get("/profile", { params });

        if (res.data?.success) {
          const results: ProfileItem[] = res.data.data.profiles || res.data.data.results || [];

          setProfiles(results);
          setMeta(res.data.data.meta || { total: 0, page: 1, limit: LIMIT, totalPages: 1 });
        } else {
          setProfiles([]);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Effect ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfiles(page, tab, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, search]);

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = (newTab: TabKey) => {
    if (newTab === tab) return;
    // Reset all, then change tab — React batches into one render → one fetch
    setSearchInput("");
    setSearch("");
    setPage(1);
    setTab(newTab);
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApproveUser = async () => {
    if (!selectedProfile) return;
    try {
      setUpdating(true);
      await axiosSecure.patch(`/profile/${selectedProfile._id}/status`, {
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
      fetchProfiles(page, tab, search);
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to approve", "error");
    } finally {
      setUpdating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-extrabold">Resident Profiles</h2>
        <div className="flex gap-2">
          <input
            className="px-4 py-2 border rounded-xl text-sm"
            placeholder="Search name / phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <Button onClick={handleSearch} variant="outline">Search</Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {TAB_CONFIG.map(({ key, label, desc, color }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex flex-col items-start px-4 py-2.5 rounded-xl text-sm transition-all border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-muted text-foreground border-transparent hover:border-border hover:bg-muted/80"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                {label}
                {isActive && meta.total > 0 && (
                  <span className="bg-white/25 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                    {/* {meta.total} */}
                  </span>
                )}
              </span>
              <span className={`text-xs mt-0.5 ${isActive ? "text-white/70" : color}`}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Contact</th>
              <th className="p-4 text-left">Building / Flat</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No{" "}
                  <span className="font-semibold">
                    {TAB_CONFIG.find((t) => t.key === tab)?.label}
                  </span>{" "}
                  profiles found.
                </td>
              </tr>
            ) : (
              profiles.map((p, idx) => {
                const buildingName = resolveName(p.buildingId, buildings);
                const flatName = resolveName(p.flatId, flats);
                return (
                <tr
                  key={p._id}
                  className={`border-t transition-colors ${
                    p.isDeleted
                      ? "bg-red-50/50 hover:bg-red-50"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <td className="p-4 text-muted-foreground text-xs">
                    {(page - 1) * LIMIT + idx + 1}
                  </td>

                  {/* User */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.profilePhoto ? (
                        <img
                          src={p.profilePhoto}
                          alt={p.userId?.name}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {p.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <p className={`font-bold ${p.isDeleted ? "line-through text-muted-foreground" : ""}`}>
                          {p.userId?.name || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.userId?.email || "-"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 capitalize">{p.role || p.userId?.role || "-"}</td>
                  <td className="p-4">{p.whatsappNumber || p.userId?.phone || "-"}</td>

                  {/* Building / Flat */}
                  <td className="p-4">
                    {buildingName ? (
                      <span>
                        {buildingName}
                        {flatName && (
                          <span className="text-muted-foreground"> / {flatName}</span>
                        )}
                      </span>
                    ) : flatName ? (
                      <span>{flatName}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not assigned</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <StatusBadge isDeleted={p.isDeleted} accountStatus={p.accountStatus} />
                  </td>

                  <td className="p-4 text-right">
                    <Button size="sm" variant={p.isDeleted ? "outline" : "default"} onClick={() => setSelectedProfile(p)}>
                      View Details
                    </Button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && meta.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, meta.total)} of {meta.total} profiles
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === meta.totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "...")[]>((acc, n, i, arr) => {
                  if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "..." ? (
                    <span key={`dots-${i}`} className="px-2 py-1 text-muted-foreground text-sm">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === n ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
            </div>

            <Button
              variant="outline" size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">

            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute right-4 top-4 hover:bg-muted rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-center mb-6 pr-8">
              <div>
                <h3 className="text-xl font-bold">Profile Details</h3>
                <p className="text-sm text-muted-foreground">{selectedProfile.userId?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  isDeleted={selectedProfile.isDeleted}
                  accountStatus={selectedProfile.accountStatus}
                />
                {selectedProfile.accountStatus === "process" && !selectedProfile.isDeleted && (
                  <Button disabled={updating} onClick={handleApproveUser}>
                    {updating ? "Approving..." : "Approve User"}
                  </Button>
                )}
              </div>
            </div>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <ImageBlock label="Profile Photo" src={selectedProfile.profilePhoto} />
              <ImageBlock label="NID Photo"     src={selectedProfile.nidPhoto} />
            </div>

            <Section title="Personal Information">
              <DataField label="Full Name"  value={selectedProfile.userId?.name} />
              <DataField label="Email"      value={selectedProfile.userId?.email} />
              <DataField label="Phone"      value={selectedProfile.userId?.phone} />
              <DataField label="WhatsApp"   value={selectedProfile.whatsappNumber} />
              <DataField label="Role"       value={selectedProfile.role || selectedProfile.userId?.role} />
              <DataField label="Bio"        value={selectedProfile.bio} />
            </Section>

            <Section title="Guardian Information">
              <DataField label="Guardian Name"     value={selectedProfile.guardianName} />
              <DataField label="Guardian Phone"    value={selectedProfile.guardianPhone} />
              <DataField label="Relation"          value={selectedProfile.guardianRelation} />
              <DataField label="Emergency Contact" value={selectedProfile.emergencyContact} />
            </Section>

            <Section title="Residence Information" last>
              <DataField label="Building" value={resolveName(selectedProfile.buildingId, buildings)} />
              <DataField label="Flat"     value={resolveName(selectedProfile.flatId, flats)} />
              <DataField label="Room"     value={selectedProfile.room} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
/**
 * isDeleted=true on the PROFILE takes priority over accountStatus.
 * A deleted profile might still have accountStatus="process" — we show "Deleted".
 */
const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending",    className: "bg-yellow-100 text-yellow-700" },
  process: { label: "In Process", className: "bg-blue-100 text-blue-700"    },
  approve: { label: "Approved",   className: "bg-green-100 text-green-700"  },
  deleted: { label: "Deleted",    className: "bg-red-100 text-red-600"      },
};

const StatusBadge = ({
  isDeleted,
  accountStatus,
}: {
  isDeleted?: boolean;
  accountStatus?: string | null;
}) => {
  const key    = isDeleted ? "deleted" : (accountStatus?.toLowerCase() ?? "");
  const config = statusStyles[key] ?? {
    label: accountStatus || "-",
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({
  title, children, last,
}: {
  title: string; children: React.ReactNode; last?: boolean;
}) => (
  <div className={last ? "mt-4" : "mb-6"}>
    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
      {title}
    </h4>
    <div className="grid grid-cols-2 gap-4">{children}</div>
  </div>
);

// ─── Data Field ───────────────────────────────────────────────────────────────
const DataField = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className="font-semibold text-sm">{value || "-"}</p>
  </div>
);

// ─── Image Block ──────────────────────────────────────────────────────────────
const ImageBlock = ({ label, src }: { label: string; src?: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-2">{label}</p>
    {src ? (
      <img src={src} alt={label} className="w-full h-56 object-cover rounded-xl border" />
    ) : (
      <div className="w-full h-56 rounded-xl border bg-muted flex items-center justify-center text-muted-foreground text-sm">
        No image uploaded
      </div>
    )}
  </div>
);

export default AllProfile;