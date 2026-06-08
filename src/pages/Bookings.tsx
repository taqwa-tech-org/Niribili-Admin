import { useCallback, useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Trash2,
  BedDouble,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

interface Booking {
  _id: string;
  name: string;
  applicantPhone: string;
  applicantWhatsapp?: string;
  guardianPhone: string;
  email?: string;
  message?: string;
  hostelRef?: { _id: string; slug: string; nameBn: string; nameEn: string } | null;
  hostelSlug: string;
  hostelName?: string;
  roomTypeBn?: string;
  roomTypeEn?: string;
  roomPrice?: number;
  nidFrontUrl: string;
  nidBackUrl: string;
  consentGiven: boolean;
  status: "new" | "contacted" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  confirmed: number;
  cancelled: number;
}

const STATUS_LABELS: Record<Booking["status"], string> = {
  new: "নতুন",
  contacted: "যোগাযোগ করা হয়েছে",
  confirmed: "নিশ্চিত",
  cancelled: "বাতিল",
};

const STATUS_COLORS: Record<Booking["status"], string> = {
  new: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  contacted: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const Bookings = () => {
  const axiosSecure = useAxiosSecure();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    contacted: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Booking["status"] | "all">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const [bRes, sRes] = await Promise.all([
        axiosSecure.get(`/bookings${q}`),
        axiosSecure.get("/bookings/stats"),
      ]);
      setBookings(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
      setStats(
        sRes.data?.data || {
          total: 0,
          new: 0,
          contacted: 0,
          confirmed: 0,
          cancelled: 0,
        },
      );
    } catch (err) {
      console.error(err);
      Swal.fire("ত্রুটি", "বুকিং লোড ব্যর্থ", "error");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: Booking["status"]) => {
    try {
      await axiosSecure.patch(`/bookings/${id}`, { status });
      fetchData();
    } catch {
      Swal.fire("ত্রুটি", "স্ট্যাটাস আপডেট ব্যর্থ", "error");
    }
  };

  const deleteBooking = async (id: string) => {
    const result = await Swal.fire({
      title: "বুকিং মুছবেন?",
      text: "এতে আপলোড করা NID ছবিসহ রেকর্ডটি মুছে যাবে।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
    });
    if (!result.isConfirmed) return;
    try {
      await axiosSecure.delete(`/bookings/${id}`);
      fetchData();
    } catch {
      Swal.fire("ত্রুটি", "মুছতে ব্যর্থ", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-b from-card/60 to-transparent p-5 sm:p-8 rounded-[2rem] border border-border/40 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter">
            বুকিং রিকোয়েস্ট
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold tracking-widest uppercase">
            পোর্টফোলিও ওয়েবসাইট থেকে আসা বুকিং আবেদন
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          className="rounded-xl text-xs font-bold h-11"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> রিফ্রেশ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="মোট" value={stats.total} color="primary" />
        <StatCard label="নতুন" value={stats.new} color="emerald" />
        <StatCard label="যোগাযোগ" value={stats.contacted} color="amber" />
        <StatCard label="নিশ্চিত" value={stats.confirmed} color="primary" />
        <StatCard label="বাতিল" value={stats.cancelled} color="muted" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "confirmed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === s
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s === "all" ? "সব" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground font-bold">
          লোড হচ্ছে...
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-[2rem]">
          <p className="text-sm font-bold text-muted-foreground">
            কোন বুকিং রিকোয়েস্ট পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((bk) => (
            <div
              key={bk._id}
              className="bg-card border border-border/40 rounded-[1.5rem] p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base tracking-tight">{bk.name}</h3>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[bk.status]}`}
                    >
                      {STATUS_LABELS[bk.status]}
                    </span>
                    {bk.consentGiven && (
                      <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> সম্মতি দেওয়া
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold">
                    {new Date(bk.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {bk.status !== "contacted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(bk._id, "contacted")}
                      className="rounded-xl text-[10px] font-bold h-8"
                    >
                      <Check className="w-3 h-3 mr-1" /> Contacted
                    </Button>
                  )}
                  {bk.status !== "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(bk._id, "confirmed")}
                      className="rounded-xl text-[10px] font-bold h-8 text-primary"
                    >
                      <Check className="w-3 h-3 mr-1" /> Confirm
                    </Button>
                  )}
                  {bk.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(bk._id, "cancelled")}
                      className="rounded-xl text-[10px] font-bold h-8"
                    >
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBooking(bk._id)}
                    className="rounded-xl h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Contact + room */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${bk.applicantPhone}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" /> আবেদনকারী: {bk.applicantPhone}
                </a>
                {bk.applicantWhatsapp && (
                  <a
                    href={`https://wa.me/${bk.applicantWhatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp: {bk.applicantWhatsapp}
                  </a>
                )}
                <a
                  href={`tel:${bk.guardianPhone}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                >
                  <UserCircle2 className="w-3.5 h-3.5 text-primary" /> অভিভাবক: {bk.guardianPhone}
                </a>
                {bk.email && (
                  <a
                    href={`mailto:${bk.email}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> {bk.email}
                  </a>
                )}
                {(bk.roomTypeEn || bk.roomTypeBn) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 font-bold">
                    <BedDouble className="w-3.5 h-3.5 text-accent" />
                    রুম: {bk.roomTypeBn || bk.roomTypeEn}
                    {bk.roomTypeBn && bk.roomTypeEn ? ` (${bk.roomTypeEn})` : ""}
                    {typeof bk.roomPrice === "number" ? ` — ৳${bk.roomPrice}` : ""}
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 font-bold col-span-full">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {bk.hostelRef
                    ? `${bk.hostelRef.nameBn} (${bk.hostelRef.nameEn})`
                    : bk.hostelName || bk.hostelSlug}
                  {bk.hostelRef && (
                    <a
                      href={`/admin-dashboard/hostels/${bk.hostelRef._id}/edit`}
                      className="ml-auto text-[10px] flex items-center gap-1 text-primary hover:underline"
                    >
                      হোস্টেল দেখুন <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* NID images */}
              <div className="grid grid-cols-2 gap-3">
                <NidThumb label="NID — সামনে" url={bk.nidFrontUrl} />
                <NidThumb label="NID — পেছনে" url={bk.nidBackUrl} />
              </div>

              {bk.message && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/20 border border-border/40">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm whitespace-pre-wrap">{bk.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NidThumb = ({ label, url }: { label: string; url: string }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
      {label}
    </p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block group">
        <img
          src={url}
          alt={label}
          className="w-full h-40 object-cover rounded-xl border border-border group-hover:ring-2 group-hover:ring-primary/40 transition-all"
        />
      </a>
    ) : (
      <div className="w-full h-40 flex items-center justify-center rounded-xl border border-dashed border-border text-[10px] font-bold text-muted-foreground">
        নেই
      </div>
    )}
  </div>
);

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "emerald" | "amber" | "muted";
}) => {
  const colorClass = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    muted: "bg-muted/40 text-muted-foreground border-border",
  }[color];
  return (
    <div className={`p-4 rounded-2xl border ${colorClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  );
};

export default Bookings;
