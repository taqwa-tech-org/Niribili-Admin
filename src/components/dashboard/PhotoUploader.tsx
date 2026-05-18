import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, GripVertical, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";

export interface UploadedPhoto {
  url: string;
  publicId?: string;
  altBn?: string;
  altEn?: string;
}

interface Props {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  coverPhoto?: string;
  onCoverChange?: (url: string) => void;
  folder?: string;
}

const PhotoUploader = ({
  photos,
  onChange,
  coverPhoto,
  onCoverChange,
  folder = "niribili/hostels",
}: Props) => {
  const axiosSecure = useAxiosSecure();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploads: UploadedPhoto[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await axiosSecure.post(`/upload/image?folder=${folder}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploads.push({
          url: res.data.data.url,
          publicId: res.data.data.publicId,
          altBn: "",
          altEn: "",
        });
      }
      const next = [...photos, ...uploads];
      onChange(next);
      // Auto-set cover photo if none yet
      if (!coverPhoto && next[0] && onCoverChange) {
        onCoverChange(next[0].url);
      }
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "ছবি আপলোড ব্যর্থ। Cloudinary কনফিগারেশন চেক করুন।";
      Swal.fire("আপলোড ব্যর্থ", msg, "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    const result = await Swal.fire({
      title: "ছবি মুছবেন?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, মুছুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;
    if (photo.publicId) {
      try {
        await axiosSecure.delete(
          `/upload/image?publicId=${encodeURIComponent(photo.publicId)}`,
        );
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }
    }
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
    if (coverPhoto === photo.url && onCoverChange) {
      onCoverChange(next[0]?.url || "");
    }
  };

  const updateAlt = (i: number, key: "altBn" | "altEn", val: string) => {
    const next = photos.map((p, idx) => (idx === i ? { ...p, [key]: val } : p));
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase text-primary tracking-widest">
          হোস্টেলের ছবি
        </label>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl text-xs font-bold h-10"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? "আপলোড হচ্ছে..." : "ছবি যোগ করুন"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="w-full h-40 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-secondary/30 transition-all"
        >
          <ImagePlus className="w-8 h-8" />
          <p className="text-xs font-bold uppercase tracking-widest">
            ছবি আপলোড করুন (একাধিক নির্বাচন করতে পারেন)
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.url}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={`group relative bg-card border rounded-2xl overflow-hidden ${
                coverPhoto === photo.url ? "border-primary ring-2 ring-primary/30" : "border-border/60"
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-32 object-cover" />
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  value={photo.altBn || ""}
                  onChange={(e) => updateAlt(i, "altBn", e.target.value)}
                  placeholder="বাংলা alt text"
                  className="w-full px-2 py-1 text-[10px] rounded-md bg-secondary/40 border border-border focus:ring-1 focus:ring-primary/30 outline-none"
                />
                <input
                  type="text"
                  value={photo.altEn || ""}
                  onChange={(e) => updateAlt(i, "altEn", e.target.value)}
                  placeholder="English alt text"
                  className="w-full px-2 py-1 text-[10px] rounded-md bg-secondary/40 border border-border focus:ring-1 focus:ring-primary/30 outline-none"
                />
              </div>
              <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-foreground/80 text-background px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1">
                  <GripVertical className="w-3 h-3" /> drag
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="bg-destructive text-destructive-foreground p-1.5 rounded-md hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {onCoverChange && (
                <button
                  type="button"
                  onClick={() => onCoverChange(photo.url)}
                  className={`w-full px-2 py-1.5 text-[9px] font-black uppercase tracking-widest border-t transition-colors ${
                    coverPhoto === photo.url
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/40 hover:bg-primary/10"
                  }`}
                >
                  {coverPhoto === photo.url ? "✓ কভার ফটো" : "কভার সেট করুন"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
