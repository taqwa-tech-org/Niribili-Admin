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
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

interface Inquiry {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  hostelRef?: { _id: string; slug: string; nameBn: string; nameEn: string } | null;
  hostelSlug?: string;
  source: "home" | "detail-page" | "contact-page" | "map-page";
  status: "new" | "contacted" | "closed";
  notes?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  closed: number;
}

const STATUS_LABELS: Record<Inquiry["status"], string> = {
  new: "নতুন",
  contacted: "যোগাযোগ করা হয়েছে",
  closed: "বন্ধ",
};

const STATUS_COLORS: Record<Inquiry["status"], string> = {
  new: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  contacted: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const Inquiries = () => {
  const axiosSecure = useAxiosSecure();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, contacted: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Inquiry["status"] | "all">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const [iRes, sRes] = await Promise.all([
        axiosSecure.get(`/inquiries${q}`),
        axiosSecure.get("/inquiries/stats"),
      ]);
      setInquiries(Array.isArray(iRes.data?.data) ? iRes.data.data : []);
      setStats(sRes.data?.data || { total: 0, new: 0, contacted: 0, closed: 0 });
    } catch (err) {
      console.error(err);
      Swal.fire("ত্রুটি", "ইনকোয়েরি লোড ব্যর্থ", "error");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: Inquiry["status"]) => {
    try {
      await axiosSecure.patch(`/inquiries/${id}`, { status });
      fetchData();
    } catch {
      Swal.fire("ত্রুটি", "স্ট্যাটাস আপডেট ব্যর্থ", "error");
    }
  };

  const deleteInquiry = async (id: string) => {
    const result = await Swal.fire({
      title: "ইনকোয়েরি মুছবেন?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
    });
    if (!result.isConfirmed) return;
    try {
      await axiosSecure.delete(`/inquiries/${id}`);
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
            ইনকোয়েরি (লিডস)
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold tracking-widest uppercase">
            পোর্টফোলিও ওয়েবসাইট থেকে আসা লিডস
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="মোট" value={stats.total} color="primary" />
        <StatCard label="নতুন" value={stats.new} color="emerald" />
        <StatCard label="যোগাযোগ হয়েছে" value={stats.contacted} color="amber" />
        <StatCard label="বন্ধ" value={stats.closed} color="muted" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "closed"] as const).map((s) => (
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
      ) : inquiries.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-[2rem]">
          <p className="text-sm font-bold text-muted-foreground">
            কোন ইনকোয়েরি পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((iq) => (
            <div
              key={iq._id}
              className="bg-card border border-border/40 rounded-[1.5rem] p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base tracking-tight">{iq.name}</h3>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[iq.status]}`}
                    >
                      {STATUS_LABELS[iq.status]}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                      {iq.source}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold">
                    {new Date(iq.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {iq.status !== "contacted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(iq._id, "contacted")}
                      className="rounded-xl text-[10px] font-bold h-8"
                    >
                      <Check className="w-3 h-3 mr-1" /> Contacted
                    </Button>
                  )}
                  {iq.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(iq._id, "closed")}
                      className="rounded-xl text-[10px] font-bold h-8"
                    >
                      <X className="w-3 h-3 mr-1" /> Close
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteInquiry(iq._id)}
                    className="rounded-xl h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${iq.phone}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" /> {iq.phone}
                </a>
                {iq.email && (
                  <a
                    href={`mailto:${iq.email}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary font-bold"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> {iq.email}
                  </a>
                )}
                {iq.hostelRef && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 font-bold col-span-full">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    {iq.hostelRef.nameBn} ({iq.hostelRef.nameEn})
                    <a
                      href={`/admin-dashboard/hostels/${iq.hostelRef._id}/edit`}
                      className="ml-auto text-[10px] flex items-center gap-1 text-primary hover:underline"
                    >
                      হোস্টেল দেখুন <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/20 border border-border/40">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm whitespace-pre-wrap">{iq.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

export default Inquiries;
