import { ExternalLink } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const LocationPicker = ({ lat, lng, onChange }: Props) => {
  // OpenStreetMap embed centered on the coordinates
  const bbox = `${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lng}`;
  const openLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-primary tracking-widest">
        ম্যাপ লোকেশন
      </label>

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
        OpenStreetMap-এ খুলুন (পয়েন্টার নির্বাচন করতে)
      </a>

      <p className="text-[10px] text-muted-foreground font-bold">
        টিপ: OpenStreetMap এ গিয়ে রাইট-ক্লিক করে "Show address" থেকে coordinates পেতে পারেন।
      </p>
    </div>
  );
};

export default LocationPicker;
