import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";

interface Props {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  googleMapUrl?: string;
  onGoogleMapUrlChange?: (url: string) => void;
}

// Extract lat/lng from common (full) Google Maps URL formats.
// Shortened links (maps.app.goo.gl / goo.gl/maps) redirect and can't be parsed
// in the browser — the user must open them first and copy the full URL.
export const extractLatLng = (
  url: string,
): { lat: number; lng: number } | null => {
  if (!url) return null;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // /@lat,lng,zoom
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // ...!3dlat!4dlng
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?q=lat,lng
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?ll=lat,lng
    /[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?destination=lat,lng
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
};

const LocationPicker = ({
  lat,
  lng,
  onChange,
  googleMapUrl = "",
  onGoogleMapUrlChange,
}: Props) => {
  const [linkInput, setLinkInput] = useState(googleMapUrl);

  // Free Google Maps embed (no API key) centered on the coordinates.
  const embedSrc = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  const openLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleExtract = () => {
    const trimmed = linkInput.trim();
    onGoogleMapUrlChange?.(trimmed);
    const coords = extractLatLng(trimmed);
    if (coords) {
      onChange(coords);
      Swal.fire({
        icon: "success",
        title: "স্থানাঙ্ক পাওয়া গেছে",
        html: `Lat: <b>${coords.lat}</b><br/>Lng: <b>${coords.lng}</b>`,
        timer: 1800,
        showConfirmButton: false,
      });
    } else {
      Swal.fire(
        "লিংক থেকে স্থানাঙ্ক পাওয়া যায়নি",
        "সংক্ষিপ্ত (maps.app.goo.gl) লিংক ব্রাউজারে খুলে সম্পূর্ণ লিংকটি কপি করুন, অথবা নিচে Latitude/Longitude হাতে দিন।",
        "warning",
      );
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-primary tracking-widest">
        ম্যাপ লোকেশন
      </label>

      {/* Google Maps link → extract lat/lng */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground font-bold ml-1">
          Google Maps লিংক (পেস্ট করে Extract চাপুন)
        </label>
        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onBlur={() => onGoogleMapUrlChange?.(linkInput.trim())}
            placeholder="https://www.google.com/maps/@23.81,90.41,16z"
            className="w-full h-12 px-4 rounded-xl bg-secondary/40 border border-border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleExtract}
            className="rounded-xl h-12 px-4 text-xs font-bold whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" /> Extract
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold ml-1">
          সংক্ষিপ্ত <span className="font-mono">maps.app.goo.gl</span> লিংক হলে আগে
          ব্রাউজারে খুলে সম্পূর্ণ লিংকটি কপি করুন।
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-bold ml-1">
            Latitude (অক্ষাংশ)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => onChange({ lat: Number(e.target.value), lng })}
            className="w-full h-12 px-4 rounded-xl bg-secondary/40 border border-border focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
            placeholder="23.7461"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-bold ml-1">
            Longitude (দ্রাঘিমাংশ)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => onChange({ lat, lng: Number(e.target.value) })}
            className="w-full h-12 px-4 rounded-xl bg-secondary/40 border border-border focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
            placeholder="90.3742"
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border">
        {lat && lng ? (
          <iframe
            title="Location preview"
            src={embedSrc}
            className="w-full h-64"
            style={{ border: 0 }}
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-secondary/30 text-xs font-bold text-muted-foreground">
            স্থানাঙ্ক প্রবেশ করালে ম্যাপ দেখাবে
          </div>
        )}
      </div>

      <a
        href={openLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Google Maps-এ খুলুন
      </a>

      <p className="text-[10px] text-muted-foreground font-bold">
        টিপ: Google Maps এ গিয়ে কাঙ্ক্ষিত স্থানে রাইট-ক্লিক করে coordinates কপি করুন, অথবা উপরের লিংক বক্সে পেস্ট করে Extract চাপুন।
      </p>
    </div>
  );
};

export default LocationPicker;
