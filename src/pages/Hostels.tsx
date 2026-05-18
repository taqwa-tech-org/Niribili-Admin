import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Star,
  StarOff,
  MapPin,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

interface HostelListItem {
  _id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  area: string;
  coverPhoto: string;
  isPublished: boolean;
  isFeatured: boolean;
  rentRange: { min: number; max: number };
  displayOrder: number;
}

const Hostels = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<HostelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    try {
      const q = debouncedSearch ? `?searchTerm=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await axiosSecure.get(`/hostels${q}`);
      setHostels(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      Swal.fire("ত্রুটি", "হোস্টেল লোড করতে ব্যর্থ", "error");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, debouncedSearch]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const handleDelete = async (id: string, nameBn: string) => {
    const result = await Swal.fire({
      title: `"${nameBn}" মুছবেন?`,
      text: "এই হোস্টেল চিরতরে মুছে যাবে। এটি undo করা যাবে না।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
    });
    if (!result.isConfirmed) return;
    try {
      await axiosSecure.delete(`/hostels/${id}`);
      Swal.fire("মুছে ফেলা হয়েছে", "", "success");
      fetchHostels();
    } catch {
      Swal.fire("ত্রুটি", "মুছতে ব্যর্থ", "error");
    }
  };

  const togglePublish = async (h: HostelListItem) => {
    try {
      await axiosSecure.patch(`/hostels/${h._id}`, { isPublished: !h.isPublished });
      fetchHostels();
    } catch {
      Swal.fire("ত্রুটি", "আপডেট ব্যর্থ", "error");
    }
  };

  const toggleFeatured = async (h: HostelListItem) => {
    try {
      await axiosSecure.patch(`/hostels/${h._id}`, { isFeatured: !h.isFeatured });
      fetchHostels();
    } catch {
      Swal.fire("ত্রুটি", "আপডেট ব্যর্থ", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-background text-foreground space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-b from-card/60 to-transparent p-5 sm:p-8 rounded-[2rem] border border-border/40 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter">
            পোর্টফোলিও হোস্টেল
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold tracking-widest uppercase">
            পাবলিক ওয়েবসাইটে প্রদর্শিত হোস্টেল ব্যবস্থাপনা
          </p>
        </div>
        <Button
          onClick={() => navigate("/admin-dashboard/hostels/new")}
          className="rounded-xl font-bold bg-primary text-xs h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2" /> নতুন হোস্টেল
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="হোস্টেল খুঁজুন (নাম, এলাকা)..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-secondary/40 border border-border outline-hidden focus:ring-2 focus:ring-primary/20 font-bold text-sm"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-muted-foreground font-bold">
            লোড হচ্ছে...
          </div>
        ) : hostels.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-border/60 rounded-[2rem]">
            <p className="text-sm font-bold text-muted-foreground">
              কোন হোস্টেল পাওয়া যায়নি। নতুন একটি তৈরি করুন।
            </p>
          </div>
        ) : (
          hostels.map((h) => (
            <motion.div
              key={h._id}
              whileHover={{ y: -2 }}
              className="bg-card border border-border/60 rounded-[1.8rem] overflow-hidden hover:border-primary/40 transition-all"
            >
              <div className="relative h-44 bg-secondary">
                {h.coverPhoto && (
                  <img
                    src={h.coverPhoto}
                    alt={h.nameEn}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                      h.isPublished
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {h.isPublished ? "প্রকাশিত" : "খসড়া"}
                  </span>
                  {h.isFeatured && (
                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                      ফিচার্ড
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-black text-base tracking-tight">{h.nameBn}</h3>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    {h.nameEn}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {h.area}
                </div>
                <div className="text-xs font-bold">
                  ৳{h.rentRange.min.toLocaleString()} – ৳{h.rentRange.max.toLocaleString()} / মাস
                </div>
                <div className="flex gap-1.5 pt-2 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-9 rounded-xl text-[11px] font-bold"
                    onClick={() => togglePublish(h)}
                    title={h.isPublished ? "Unpublish" : "Publish"}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {h.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 rounded-xl p-0"
                    onClick={() => toggleFeatured(h)}
                    title={h.isFeatured ? "Remove featured" : "Make featured"}
                  >
                    {h.isFeatured ? (
                      <StarOff className="w-3.5 h-3.5" />
                    ) : (
                      <Star className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Link to={`/admin-dashboard/hostels/${h._id}/edit`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl p-0 hover:bg-primary/10"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 rounded-xl p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(h._id, h.nameBn)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Hostels;
