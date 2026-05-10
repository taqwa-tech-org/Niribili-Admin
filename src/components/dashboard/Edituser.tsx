import React, { useEffect, useState, useCallback } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

/* ─── Types ─────────────────────────────────────────────── */
interface UserInfo {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
}

interface Profile {
  _id: string;
  userId: UserInfo | null;
  profilePhoto: string | null;
  nidPhoto: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  emergencyContact: string | null;
  buildingId: string | { _id: string; name?: string } | null;
  flatId: string | { _id: string; name?: string } | null;
  room: string | null;
  whatsappNumber: string | null;
  accountStatus: string;
  bio: string | null;
  role: string;
  isDeleted: boolean;
  createdAt: string;
}

interface EditForm {
  // User-level fields (name + phone only — email is locked)
  name: string;
  phone: string;
  // Profile photo URLs (null = remove, string = current/new URL, "" = unchanged on initial state)
  profilePhoto: string | null;
  nidPhoto: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContact: string;
  buildingId: string;
  flatId: string;
  room: string;
  accountStatus: string;
  whatsappNumber: string;
  bio: string;
}

// Cloudinary config — same as user-side upload
const CLOUDINARY_CLOUD_NAME = "dehak09z6";
const CLOUDINARY_UPLOAD_PRESET = "Niribili_Image_info";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  if (!data.secure_url) throw new Error("Cloudinary returned no URL");
  return data.secure_url as string;
};

interface Building {
  _id: string;
  name: string;
}

interface Flat {
  _id: string;
  name: string;
  buildingId: string;
}

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  approve:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  process:  "bg-blue-50 text-blue-700 border border-blue-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
};

const ACCOUNT_STATUS_OPTIONS = ["pending", "process", "approve", "rejected"];

const blankForm = (): EditForm => ({
  name: "", phone: "",
  profilePhoto: "", nidPhoto: "",
  guardianName: "", guardianPhone: "",
  guardianRelation: "", emergencyContact: "", buildingId: "", flatId: "",
  room: "", accountStatus: "pending", whatsappNumber: "", bio: "",
});

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 placeholder:text-gray-300";
const selectCls = inputCls + " appearance-none cursor-pointer";

/* ─── Spinner ──────────────────────────────────────────── */
const Spinner = ({ size = 16, light = false }: { size?: number; light?: boolean }) => (
  <svg
    style={{ width: size, height: size, animation: "spin 0.65s linear infinite", flexShrink: 0 }}
    viewBox="0 0 24 24" fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke={light ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"} strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={light ? "#fff" : "hsl(168,80%,32%)"} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ✅ Field এবং Section কে বাইরে নিয়ে আসা হয়েছে */
const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={`flex flex-col gap-1.5 ${full ? "col-span-2" : ""}`}>
    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>
    {children}
  </div>
);

const Section = ({ label }: { label: string }) => (
  <div className="col-span-2 flex items-center gap-3 mt-2">
    <span
      className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
      style={{ background: "linear-gradient(135deg, hsl(168,80%,32%) 0%, hsl(168,60%,45%) 100%)" }}
    >{label}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

/* ─── Photo Field ──────────────────────────────────────────
 * Three states for each slot:
 *   • currentUrl is a string and no preview      → show existing image
 *   • previewUrl is set                          → show local preview of newly-selected file
 *   • currentUrl is null (explicit remove)       → show "No image" placeholder
 *   • currentUrl is "" (never had one)           → show "No image" placeholder
 */
const PhotoField = ({
  label,
  currentUrl,
  previewUrl,
  hasPendingFile,
  originalUrl,
  onSelect,
  onRemove,
  onUndo,
}: {
  label: string;
  currentUrl: string | null;
  previewUrl: string | null;
  hasPendingFile: boolean;
  originalUrl: string | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onUndo: () => void;
}) => {
  const inputId = `photo-${label.replace(/\s+/g, "-").toLowerCase()}`;

  // What to display
  const displayUrl = previewUrl ?? (currentUrl || null);
  const isMarkedForRemoval = currentUrl === null && !previewUrl;
  const hasChanged = hasPendingFile || isMarkedForRemoval || (currentUrl !== originalUrl);

  return (
    <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex flex-col gap-3">
        <div className="w-full aspect-[4/3] rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center text-xs text-gray-400">
          {displayUrl ? (
            <img src={displayUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span>{isMarkedForRemoval ? "Will be removed on save" : "No image uploaded"}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="cursor-pointer px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-600 hover:text-white hover:border-teal-600 transition"
          >
            {displayUrl ? "Change" : "Upload"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={onSelect}
            className="hidden"
          />

          {displayUrl && (
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition"
            >
              Remove
            </button>
          )}

          {hasChanged && (
            <button
              type="button"
              onClick={onUndo}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-bold hover:bg-gray-100 transition"
              title="Discard pending change"
            >
              Undo
            </button>
          )}

          {hasPendingFile && (
            <span className="text-xs text-amber-600 font-semibold">• new image pending save</span>
          )}
          {isMarkedForRemoval && (
            <span className="text-xs text-red-500 font-semibold">• removal pending save</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const Edituser: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [profiles, setProfiles]     = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm]       = useState<EditForm>(blankForm());
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Pending file uploads (selected but not yet uploaded — uploaded on Save)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [nidPhotoFile, setNidPhotoFile]         = useState<File | null>(null);
  // Local preview URLs for newly selected files (created with URL.createObjectURL)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [nidPhotoPreview, setNidPhotoPreview]         = useState<string | null>(null);

  const [buildings, setBuildings]               = useState<Building[]>([]);
  const [flats, setFlats]                       = useState<Flat[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [flatsLoading, setFlatsLoading]         = useState(false);

  const fetchProfiles = useCallback(async (pg: number, searchQuery: string = "") => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string | number> = {
        page: pg,
        limit: 50,
      };

      const trimmedSearch = searchQuery.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
        params.searchTerm = trimmedSearch;
      }

      const res = await axiosSecure.get("/profile", { params });
      const meta    = res.data?.data?.meta ?? res.data?.meta ?? {};
      const results: Profile[] =
        res.data?.data?.profiles ?? res.data?.data?.results ?? res.data?.data?.result ??
        res.data?.profiles       ?? res.data?.results       ?? res.data?.result       ?? [];
      setProfiles(results);
      setTotalPages(meta.totalPages ?? 1);
      setTotal(meta.total ?? results.length);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load profiles");
      setProfiles([]);
    } finally { setLoading(false); }
  }, [axiosSecure]);

  useEffect(() => { fetchProfiles(page, search); }, [page, search, fetchProfiles]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const fetchBuildings = useCallback(async () => {
    if (buildings.length > 0) return;
    setBuildingsLoading(true);
    try {
      const res = await axiosSecure.get("/buildings");
      const list: Building[] = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.data?.buildings ?? res.data?.buildings ?? [];
      setBuildings(list);
    } catch (err) {
      console.error("Failed to load buildings:", err);
    }
    finally { setBuildingsLoading(false); }
  }, [axiosSecure, buildings.length]);

  const fetchFlats = useCallback(async (buildingId: string) => {
    if (!buildingId) { setFlats([]); return; }
    setFlatsLoading(true); setFlats([]);
    try {
      const res = await axiosSecure.get(`/flats?buildingId=${buildingId}`);
      const list: Flat[] = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.data?.flats ?? res.data?.flats ?? [];
      setFlats(list);
    } catch (err) {
      console.error("Failed to load flats:", err);
    }
    finally { setFlatsLoading(false); }
  }, [axiosSecure]);

  const openEdit = (p: Profile) => {
    setSaveMsg(null); setFlats([]); setEditing(p);
    const buildingId =
      typeof p.buildingId === "string" ? p.buildingId : p.buildingId?._id || "";
    const flatId =
      typeof p.flatId === "string" ? p.flatId : p.flatId?._id || "";
    setForm({
      name:             p.userId?.name     ?? "",
      phone:            p.userId?.phone    ?? "",
      profilePhoto:     p.profilePhoto     ?? "",
      nidPhoto:         p.nidPhoto         ?? "",
      guardianName:     p.guardianName     ?? "",
      guardianPhone:    p.guardianPhone    ?? "",
      guardianRelation: p.guardianRelation ?? "",
      emergencyContact: p.emergencyContact ?? "",
      buildingId,
      flatId,
      room:             p.room             ?? "",
      accountStatus:    p.accountStatus    ?? "pending",
      whatsappNumber:   p.whatsappNumber   ?? "",
      bio:              p.bio              ?? "",
    });
    setProfilePhotoFile(null);
    setNidPhotoFile(null);
    setProfilePhotoPreview(null);
    setNidPhotoPreview(null);
    fetchBuildings();
    if (buildingId) fetchFlats(buildingId);
  };

  const closeEdit = () => {
    setEditing(null); setSaveMsg(null); setFlats([]);
    setProfilePhotoFile(null); setNidPhotoFile(null);
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    if (nidPhotoPreview) URL.revokeObjectURL(nidPhotoPreview);
    setProfilePhotoPreview(null); setNidPhotoPreview(null);
  };

  // ── Photo handlers ──────────────────────────────────────────────────────
  const handlePhotoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "nidPhoto",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveMsg({ ok: false, text: "Please select an image file." });
      return;
    }
    const url = URL.createObjectURL(file);
    if (field === "profilePhoto") {
      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoFile(file);
      setProfilePhotoPreview(url);
    } else {
      if (nidPhotoPreview) URL.revokeObjectURL(nidPhotoPreview);
      setNidPhotoFile(file);
      setNidPhotoPreview(url);
    }
    // Clear the input so the same file can be re-selected later
    e.target.value = "";
  };

  const handlePhotoRemove = (field: "profilePhoto" | "nidPhoto") => {
    if (field === "profilePhoto") {
      setProfilePhotoFile(null);
      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoPreview(null);
      // null = explicit remove (vs. "" which means "unchanged")
      setForm(f => ({ ...f, profilePhoto: null }));
    } else {
      setNidPhotoFile(null);
      if (nidPhotoPreview) URL.revokeObjectURL(nidPhotoPreview);
      setNidPhotoPreview(null);
      setForm(f => ({ ...f, nidPhoto: null }));
    }
  };

  const handlePhotoUndoChange = (field: "profilePhoto" | "nidPhoto") => {
    // Restore the original DB value and discard the pending file/removal
    if (!editing) return;
    if (field === "profilePhoto") {
      setProfilePhotoFile(null);
      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoPreview(null);
      setForm(f => ({ ...f, profilePhoto: editing.profilePhoto ?? "" }));
    } else {
      setNidPhotoFile(null);
      if (nidPhotoPreview) URL.revokeObjectURL(nidPhotoPreview);
      setNidPhotoPreview(null);
      setForm(f => ({ ...f, nidPhoto: editing.nidPhoto ?? "" }));
    }
  };

  const setField = (key: keyof EditForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  const onBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bid = e.target.value;
    setForm(f => ({ ...f, buildingId: bid, flatId: "" }));
    fetchFlats(bid);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true); setSaveMsg(null);

    try {
      // 1) Upload any newly-selected photos to Cloudinary first
      let nextProfilePhoto: string | null | undefined = undefined; // undefined = no change
      let nextNidPhoto: string | null | undefined = undefined;

      if (profilePhotoFile) {
        nextProfilePhoto = await uploadToCloudinary(profilePhotoFile);
      } else if (form.profilePhoto === null) {
        nextProfilePhoto = null; // explicit remove
      }

      if (nidPhotoFile) {
        nextNidPhoto = await uploadToCloudinary(nidPhotoFile);
      } else if (form.nidPhoto === null) {
        nextNidPhoto = null;
      }

      // 2) Build profile-level payload (everything except name/phone)
      const profilePayload: Record<string, unknown> = {};
      const profileFieldKeys: (keyof EditForm)[] = [
        "guardianName", "guardianPhone", "guardianRelation", "emergencyContact",
        "buildingId", "flatId", "room", "accountStatus", "whatsappNumber", "bio",
      ];
      profileFieldKeys.forEach(k => {
        const v = form[k];
        if (typeof v === "string" && v !== "") profilePayload[k] = v;
      });
      if (nextProfilePhoto !== undefined) profilePayload.profilePhoto = nextProfilePhoto;
      if (nextNidPhoto !== undefined) profilePayload.nidPhoto = nextNidPhoto;

      // 3) Build user-level payload (name + phone — only if changed)
      const userPayload: Record<string, string> = {};
      const originalName = editing.userId?.name ?? "";
      const originalPhone = editing.userId?.phone ?? "";
      if (form.name.trim() && form.name !== originalName) userPayload.name = form.name.trim();
      if (form.phone.trim() && form.phone !== originalPhone) userPayload.phone = form.phone.trim();

      // 4) Fire requests. User update first so a profile-only error doesn't block name fix.
      const userId = editing.userId?._id;
      if (Object.keys(userPayload).length > 0 && userId) {
        await axiosSecure.patch(`/user/admin-edit/${userId}`, userPayload);
      }
      if (Object.keys(profilePayload).length > 0) {
        await axiosSecure.patch(`/profile/${editing._id}`, profilePayload);
      }

      setSaveMsg({ ok: true, text: "Profile updated successfully!" });
      fetchProfiles(page, search);
      setTimeout(closeEdit, 1400);
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err?.response?.data?.message ?? err?.message ?? "Update failed." });
    } finally { setSaving(false); }
  };

  const initials = (name?: string) =>
    name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const statusClass = (s: string) =>
    STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600 border border-gray-200";

  const filtered = profiles;

  /* ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ap-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .ap-animate { animation: fadeUp .3s ease both; }
        .ap-overlay-anim { animation: overlayIn .2s ease both; }
        .ap-modal-anim { animation: modalIn .25s cubic-bezier(.22,1,.36,1) both; }
        .ap-row:hover td { background: #f0fdfb !important; }
        .teal-gradient { background: linear-gradient(135deg, hsl(168,80%,32%) 0%, hsl(168,60%,45%) 100%); }
        .teal-text { background: linear-gradient(135deg, hsl(168,80%,28%) 0%, hsl(168,60%,38%) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f8fafc; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      <div className="ap-root min-h-screen bg-white p-6 md:p-10">

        {/* ── Header ── */}
        <div className="ap-animate mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-8 rounded-full teal-gradient" />
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="teal-text">Profile</span>{" "}
                <span className="text-gray-900">Directory</span>
              </h1>
            </div>
            <p className="ml-3.5 text-sm text-gray-400 pl-0.5">Approved residents · manage and update records</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 h-10 w-56 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-50 transition">
              <svg className="text-gray-400 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Name, email, phone…"
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-300 w-full"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-teal-300 transition disabled:opacity-40"
            >
              Search
            </button>

            <button
              onClick={() => fetchProfiles(page, search)}
              disabled={loading}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-teal-300 transition disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                style={loading ? { animation: "spin 0.65s linear infinite" } : {}}>
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="ap-animate mb-7 flex gap-4 flex-wrap" style={{ animationDelay: ".05s" }}>
          {[
            { label: "Total Profiles", value: total, icon: "👥" },
            { label: "Showing", value: filtered.length, icon: "📋" },
            { label: "Page", value: `${page} / ${totalPages}`, icon: "📄" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</div>
                <div className="text-xl font-extrabold text-gray-800">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="ap-animate rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: ".1s" }}>
          <div className="h-1 w-full teal-gradient" />
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Resident", "Contact", "Room", "Status", "Joined", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 120, 80, 70, 80, 55].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 rounded-lg bg-gray-100 animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-400">
                    <span className="text-3xl">⚠️</span>
                    <span className="text-sm">{error}</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
                    <span className="text-3xl">🔍</span>
                    <span className="text-sm font-medium">No approved profiles found.</span>
                  </div>
                </td></tr>
              ) : filtered.map(p => {
                const u = p.userId;
                return (
                  <tr key={p._id} className="ap-row transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "linear-gradient(135deg, hsl(168,80%,32%) 0%, hsl(168,60%,45%) 100%)" }}>
                          {p.profilePhoto
                            ? <img src={p.profilePhoto} alt={u?.name} className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            : initials(u?.name)
                          }
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{u?.name ?? <span className="text-gray-300 italic">Unknown</span>}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{u?.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-700 text-sm">{u?.phone ?? <span className="text-gray-300 italic">—</span>}</div>
                      {p.whatsappNumber && <div className="text-xs text-teal-500 mt-0.5">WA: {p.whatsappNumber}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.room
                        ? <span className="text-sm text-gray-700">{p.room}</span>
                        : <span className="text-xs text-gray-300 italic">Not assigned</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusClass(p.accountStatus)}`}>
                        {p.accountStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-teal-300 hover:text-teal-700 transition disabled:opacity-30"
            >← Prev</button>
            <span className="text-sm text-gray-400 font-medium px-2">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-teal-300 hover:text-teal-700 transition disabled:opacity-30"
            >Next →</button>
          </div>
        )}
      </div>

      {/* ══════════════ EDIT MODAL ══════════════ */}
      {editing && (
        <div
          className="ap-overlay-anim fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,30,25,0.55)", backdropFilter: "blur(10px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="ap-modal-anim bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100 px-7 py-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full teal-gradient" />
                  <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-3">{editing.userId?.name ?? "Unknown"} · <span className="font-mono">{editing._id}</span></p>
              </div>
              <button
                onClick={closeEdit}
                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition flex items-center justify-center text-sm font-bold"
              >✕</button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-6">
              <div className="grid grid-cols-2 gap-4">

                <Section label="User Info" />

                <Field label="Name">
                  <input className={inputCls} value={form.name} onChange={setField("name")} placeholder="Full name" />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} value={form.phone} onChange={setField("phone")} placeholder="+8801…" />
                </Field>
                <Field label="Email (locked)" full>
                  <input
                    className={inputCls + " bg-gray-100 text-gray-400 cursor-not-allowed"}
                    value={editing.userId?.email ?? "—"}
                    disabled
                    readOnly
                    title="Email cannot be changed because it is the user's identity. To change email, delete the account and let the user re-register."
                  />
                </Field>

                <Section label="Photos" />

                <PhotoField
                  label="Profile Photo"
                  currentUrl={form.profilePhoto}
                  previewUrl={profilePhotoPreview}
                  hasPendingFile={!!profilePhotoFile}
                  originalUrl={editing.profilePhoto}
                  onSelect={e => handlePhotoSelect(e, "profilePhoto")}
                  onRemove={() => handlePhotoRemove("profilePhoto")}
                  onUndo={() => handlePhotoUndoChange("profilePhoto")}
                />
                <PhotoField
                  label="NID Photo"
                  currentUrl={form.nidPhoto}
                  previewUrl={nidPhotoPreview}
                  hasPendingFile={!!nidPhotoFile}
                  originalUrl={editing.nidPhoto}
                  onSelect={e => handlePhotoSelect(e, "nidPhoto")}
                  onRemove={() => handlePhotoRemove("nidPhoto")}
                  onUndo={() => handlePhotoUndoChange("nidPhoto")}
                />

                <Section label="Personal Info" />

                <Field label="Bio" full>
                  <textarea className={inputCls + " resize-y min-h-[70px]"} value={form.bio} onChange={setField("bio")} placeholder="Short bio…" />
                </Field>

                <Section label="Guardian Info" />

                <Field label="Guardian Name">
                  <input className={inputCls} value={form.guardianName} onChange={setField("guardianName")} placeholder="Full name" />
                </Field>
                <Field label="Guardian Relation">
                  <input className={inputCls} value={form.guardianRelation} onChange={setField("guardianRelation")} placeholder="Father / Mother / Spouse…" />
                </Field>
                <Field label="Guardian Phone">
                  <input className={inputCls} value={form.guardianPhone} onChange={setField("guardianPhone")} placeholder="+8801…" />
                </Field>
                <Field label="Emergency Contact">
                  <input className={inputCls} value={form.emergencyContact} onChange={setField("emergencyContact")} placeholder="+8801…" />
                </Field>
                <Field label="WhatsApp Number">
                  <input className={inputCls} value={form.whatsappNumber} onChange={setField("whatsappNumber")} placeholder="+8801…" />
                </Field>

                <Section label="Building & Flat Assignment" />

                <Field label="Building">
                  <div className="relative">
                    <select className={selectCls} value={form.buildingId} onChange={onBuildingChange} disabled={buildingsLoading}>
                      <option value="">{buildingsLoading ? "Loading buildings…" : "— Select Building —"}</option>
                      {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    {buildingsLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={14} /></div>}
                  </div>
                </Field>

                <Field label="Flat">
                  <div className="relative">
                    <select
                      className={selectCls}
                      value={form.flatId}
                      onChange={e => setForm(f => ({ ...f, flatId: e.target.value }))}
                      disabled={!form.buildingId || flatsLoading}
                    >
                      <option value="">
                        {!form.buildingId ? "← Select building first" : flatsLoading ? "Loading flats…" : flats.length === 0 ? "No flats found" : "— Select Flat —"}
                      </option>
                      {flats.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                    {flatsLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size={14} /></div>}
                  </div>
                  <span className="text-xs text-gray-300 mt-1">
                    {form.buildingId ? `${flats.length} flat${flats.length !== 1 ? "s" : ""} available` : "Select building to load flats"}
                  </span>
                </Field>

                <Field label="Room">
                  <input className={inputCls} value={form.room} onChange={setField("room")} placeholder="Master Bed Room…" />
                </Field>

                <Field label="Account Status">
                  <select className={selectCls} value={form.accountStatus} onChange={setField("accountStatus")}>
                    {ACCOUNT_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </Field>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-gray-100 px-7 py-4 flex items-center gap-3 flex-wrap">
              {saveMsg && (
                <span className={`mr-auto text-sm font-semibold ${saveMsg.ok ? "text-teal-600" : "text-red-500"}`}>
                  {saveMsg.ok ? "✓ " : "✕ "}{saveMsg.text}
                </span>
              )}
              <button
                onClick={closeEdit}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, hsl(168,80%,32%) 0%, hsl(168,60%,45%) 100%)" }}
              >
                {saving ? <><Spinner size={14} light /> Saving…</> : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Edituser;