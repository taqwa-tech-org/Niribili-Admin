import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import PhotoUploader, {
  UploadedPhoto,
} from "@/components/dashboard/PhotoUploader";
import LocationPicker from "@/components/dashboard/LocationPicker";

interface RoomType {
  typeBn: string;
  typeEn: string;
  price: number;
  capacity: number;
}

interface HostelForm {
  slug: string;
  nameBn: string;
  nameEn: string;
  addressBn: string;
  addressEn: string;
  area: string;
  coordinates: { lat: number; lng: number };
  descriptionBn: string;
  descriptionEn: string;
  photos: UploadedPhoto[];
  coverPhoto: string;
  rentRange: { min: number; max: number; unit: "monthly" };
  amenitiesBn: string[];
  amenitiesEn: string[];
  roomTypes: RoomType[];
  contactPhone: string;
  contactWhatsapp: string;
  isPublished: boolean;
  isFeatured: boolean;
  seoMetaBn: { title: string; description: string; keywords: string[] };
  seoMetaEn: { title: string; description: string; keywords: string[] };
  displayOrder: number;
}

const emptyForm = (): HostelForm => ({
  slug: "",
  nameBn: "",
  nameEn: "",
  addressBn: "",
  addressEn: "",
  area: "Mirpur",
  coordinates: { lat: 23.8103, lng: 90.4125 },
  descriptionBn: "",
  descriptionEn: "",
  photos: [],
  coverPhoto: "",
  rentRange: { min: 6000, max: 12000, unit: "monthly" },
  amenitiesBn: [],
  amenitiesEn: [],
  roomTypes: [],
  contactPhone: "",
  contactWhatsapp: "",
  isPublished: false,
  isFeatured: false,
  seoMetaBn: { title: "", description: "", keywords: [] },
  seoMetaEn: { title: "", description: "", keywords: [] },
  displayOrder: 0,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const HostelEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();
  const [form, setForm] = useState<HostelForm>(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [amenityBnInput, setAmenityBnInput] = useState("");
  const [amenityEnInput, setAmenityEnInput] = useState("");
  const [keywordBnInput, setKeywordBnInput] = useState("");
  const [keywordEnInput, setKeywordEnInput] = useState("");

  const load = useCallback(async () => {
    if (!isEdit || !id) return;
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/hostels/${id}`);
      const data = res.data?.data;
      if (data) {
        setForm({
          ...emptyForm(),
          ...data,
          seoMetaBn: data.seoMetaBn || { title: "", description: "", keywords: [] },
          seoMetaEn: data.seoMetaEn || { title: "", description: "", keywords: [] },
        });
      }
    } catch (err) {
      Swal.fire("ত্রুটি", "হোস্টেল লোড করতে ব্যর্থ", "error");
    } finally {
      setLoading(false);
    }
  }, [axiosSecure, id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof HostelForm>(key: K, value: HostelForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const autoGenSlug = () => {
    if (form.nameEn) update("slug", slugify(form.nameEn));
  };

  const addAmenity = (lang: "bn" | "en") => {
    const input = lang === "bn" ? amenityBnInput.trim() : amenityEnInput.trim();
    if (!input) return;
    const key = lang === "bn" ? "amenitiesBn" : "amenitiesEn";
    if (form[key].includes(input)) return;
    update(key, [...form[key], input]);
    if (lang === "bn") setAmenityBnInput("");
    else setAmenityEnInput("");
  };

  const removeAmenity = (lang: "bn" | "en", idx: number) => {
    const key = lang === "bn" ? "amenitiesBn" : "amenitiesEn";
    update(
      key,
      form[key].filter((_, i) => i !== idx),
    );
  };

  const addKeyword = (lang: "bn" | "en") => {
    const input = lang === "bn" ? keywordBnInput.trim() : keywordEnInput.trim();
    if (!input) return;
    const seo = lang === "bn" ? form.seoMetaBn : form.seoMetaEn;
    if (seo.keywords.includes(input)) return;
    const next = { ...seo, keywords: [...seo.keywords, input] };
    update(lang === "bn" ? "seoMetaBn" : "seoMetaEn", next);
    if (lang === "bn") setKeywordBnInput("");
    else setKeywordEnInput("");
  };

  const removeKeyword = (lang: "bn" | "en", idx: number) => {
    const seo = lang === "bn" ? form.seoMetaBn : form.seoMetaEn;
    const next = { ...seo, keywords: seo.keywords.filter((_, i) => i !== idx) };
    update(lang === "bn" ? "seoMetaBn" : "seoMetaEn", next);
  };

  const addRoomType = () =>
    update("roomTypes", [
      ...form.roomTypes,
      { typeBn: "", typeEn: "", price: 0, capacity: 1 },
    ]);

  const removeRoomType = (idx: number) =>
    update(
      "roomTypes",
      form.roomTypes.filter((_, i) => i !== idx),
    );

  const updateRoomType = (idx: number, key: keyof RoomType, val: any) =>
    update(
      "roomTypes",
      form.roomTypes.map((rt, i) => (i === idx ? { ...rt, [key]: val } : rt)),
    );

  const valid = useMemo(() => {
    return (
      form.slug.length >= 2 &&
      form.nameBn &&
      form.nameEn &&
      form.addressBn &&
      form.addressEn &&
      form.area &&
      form.descriptionBn &&
      form.descriptionEn &&
      form.coverPhoto &&
      form.contactPhone &&
      form.contactWhatsapp
    );
  }, [form]);

  const handleSave = async () => {
    if (!valid) {
      Swal.fire(
        "অসম্পূর্ণ ডেটা",
        "Slug, name (Bn/En), address, description, cover photo, এবং contact ফিল্ডগুলো অবশ্যই পূরণ করুন।",
        "warning",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        // Drop empty SEO subdocs so server can leave them undefined
        seoMetaBn:
          form.seoMetaBn.title || form.seoMetaBn.description || form.seoMetaBn.keywords.length
            ? form.seoMetaBn
            : undefined,
        seoMetaEn:
          form.seoMetaEn.title || form.seoMetaEn.description || form.seoMetaEn.keywords.length
            ? form.seoMetaEn
            : undefined,
      };
      if (isEdit) {
        await axiosSecure.patch(`/hostels/${id}`, payload);
      } else {
        await axiosSecure.post("/hostels", payload);
      }
      Swal.fire({
        icon: "success",
        title: isEdit ? "আপডেট হয়েছে" : "তৈরি হয়েছে",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin-dashboard/hostels");
    } catch (err: any) {
      Swal.fire(
        "সংরক্ষণ ব্যর্থ",
        err?.response?.data?.message || "অজানা ত্রুটি",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold">
        লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-32 min-h-screen bg-background text-foreground space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin-dashboard/hostels")}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter">
            {isEdit ? "হোস্টেল সম্পাদনা" : "নতুন হোস্টেল"}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            বাংলা ও ইংরেজি দুই ভাষায় তথ্য প্রবেশ করুন
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Section title="মূল তথ্য / Basic Info">
        <Row>
          <Field label="Slug (URL) *">
            <div className="flex gap-2">
              <input
                value={form.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                placeholder="niribili-mirpur-2"
                className={inputCls}
              />
              <Button
                type="button"
                variant="outline"
                onClick={autoGenSlug}
                className="rounded-xl h-12 px-3 text-xs font-bold whitespace-nowrap"
                title="Generate slug from English name"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Auto
              </Button>
            </div>
          </Field>
          <Field label="Area / এলাকা *">
            <input
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              placeholder="Mirpur"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Name (বাংলা) *">
            <input
              value={form.nameBn}
              onChange={(e) => update("nameBn", e.target.value)}
              placeholder="নিরিবিলি ব্যাচেলর হোম — মিরপুর"
              className={inputCls}
            />
          </Field>
          <Field label="Name (English) *">
            <input
              value={form.nameEn}
              onChange={(e) => update("nameEn", e.target.value)}
              placeholder="Niribili Bachelor Home — Mirpur"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Address (বাংলা) *">
            <input
              value={form.addressBn}
              onChange={(e) => update("addressBn", e.target.value)}
              placeholder="হাউস ১২, রোড ৪, মিরপুর-১, ঢাকা"
              className={inputCls}
            />
          </Field>
          <Field label="Address (English) *">
            <input
              value={form.addressEn}
              onChange={(e) => update("addressEn", e.target.value)}
              placeholder="House 12, Road 4, Mirpur-1, Dhaka"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Description (বাংলা) *">
            <textarea
              value={form.descriptionBn}
              onChange={(e) => update("descriptionBn", e.target.value)}
              rows={4}
              className={textareaCls}
              placeholder="হোস্টেলের বিস্তারিত বাংলায়..."
            />
          </Field>
          <Field label="Description (English) *">
            <textarea
              value={form.descriptionEn}
              onChange={(e) => update("descriptionEn", e.target.value)}
              rows={4}
              className={textareaCls}
              placeholder="Full description in English..."
            />
          </Field>
        </Row>
      </Section>

      {/* Photos */}
      <Section title="ছবি / Photos">
        <PhotoUploader
          photos={form.photos}
          onChange={(photos) => update("photos", photos)}
          coverPhoto={form.coverPhoto}
          onCoverChange={(url) => update("coverPhoto", url)}
        />
        {!form.coverPhoto && form.photos.length > 0 && (
          <p className="text-xs font-bold text-amber-600">
            ⚠️ একটি ছবিকে "কভার ফটো" হিসেবে নির্বাচন করুন।
          </p>
        )}
      </Section>

      {/* Location */}
      <Section title="অবস্থান / Location">
        <LocationPicker
          lat={form.coordinates.lat}
          lng={form.coordinates.lng}
          onChange={(coords) => update("coordinates", coords)}
        />
      </Section>

      {/* Rent & Rooms */}
      <Section title="ভাড়া ও রুম / Rent & Rooms">
        <Row>
          <Field label="Min Rent (৳) *">
            <input
              type="number"
              value={form.rentRange.min}
              onChange={(e) =>
                update("rentRange", {
                  ...form.rentRange,
                  min: Number(e.target.value),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Max Rent (৳) *">
            <input
              type="number"
              value={form.rentRange.max}
              onChange={(e) =>
                update("rentRange", {
                  ...form.rentRange,
                  max: Number(e.target.value),
                })
              }
              className={inputCls}
            />
          </Field>
        </Row>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-primary tracking-widest">
              Room Types
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={addRoomType}
              className="rounded-xl text-xs font-bold h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add room type
            </Button>
          </div>
          {form.roomTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground font-bold">কোন রুম টাইপ যোগ করা হয়নি</p>
          ) : (
            form.roomTypes.map((rt, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-3 rounded-xl bg-secondary/30 border border-border/40"
              >
                <input
                  value={rt.typeBn}
                  onChange={(e) => updateRoomType(i, "typeBn", e.target.value)}
                  placeholder="সিঙ্গেল"
                  className={inputCls + " md:col-span-1"}
                />
                <input
                  value={rt.typeEn}
                  onChange={(e) => updateRoomType(i, "typeEn", e.target.value)}
                  placeholder="Single"
                  className={inputCls + " md:col-span-1"}
                />
                <input
                  type="number"
                  value={rt.price}
                  onChange={(e) => updateRoomType(i, "price", Number(e.target.value))}
                  placeholder="Price"
                  className={inputCls + " md:col-span-1"}
                />
                <input
                  type="number"
                  value={rt.capacity}
                  onChange={(e) =>
                    updateRoomType(i, "capacity", Number(e.target.value))
                  }
                  placeholder="Capacity"
                  className={inputCls + " md:col-span-1"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeRoomType(i)}
                  className="h-12 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Amenities */}
      <Section title="সুবিধাসমূহ / Amenities">
        <Row>
          <ChipField
            label="Amenities (বাংলা)"
            chips={form.amenitiesBn}
            input={amenityBnInput}
            onInput={setAmenityBnInput}
            onAdd={() => addAmenity("bn")}
            onRemove={(i) => removeAmenity("bn", i)}
            placeholder="তিন বেলা খাবার"
          />
          <ChipField
            label="Amenities (English)"
            chips={form.amenitiesEn}
            input={amenityEnInput}
            onInput={setAmenityEnInput}
            onAdd={() => addAmenity("en")}
            onRemove={(i) => removeAmenity("en", i)}
            placeholder="3 Daily Meals"
          />
        </Row>
      </Section>

      {/* Contact */}
      <Section title="যোগাযোগ / Contact">
        <Row>
          <Field label="Phone *">
            <input
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+8801700000000"
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp *">
            <input
              value={form.contactWhatsapp}
              onChange={(e) => update("contactWhatsapp", e.target.value)}
              placeholder="+8801700000000"
              className={inputCls}
            />
          </Field>
        </Row>
      </Section>

      {/* SEO */}
      <Section title="SEO Meta">
        <Row>
          <Field label="SEO Title (বাংলা)">
            <input
              value={form.seoMetaBn.title}
              onChange={(e) =>
                update("seoMetaBn", { ...form.seoMetaBn, title: e.target.value })
              }
              placeholder="মিরপুর ব্যাচেলর মেস | নিরিবিলি ব্যাচেলর হোম"
              className={inputCls}
            />
          </Field>
          <Field label="SEO Title (English)">
            <input
              value={form.seoMetaEn.title}
              onChange={(e) =>
                update("seoMetaEn", { ...form.seoMetaEn, title: e.target.value })
              }
              placeholder="Bachelor Mess in Mirpur | Niribili"
              className={inputCls}
            />
          </Field>
        </Row>
        <Row>
          <Field label="SEO Description (বাংলা)">
            <textarea
              value={form.seoMetaBn.description}
              onChange={(e) =>
                update("seoMetaBn", { ...form.seoMetaBn, description: e.target.value })
              }
              rows={2}
              className={textareaCls}
              placeholder="২০০ অক্ষরের মধ্যে..."
            />
          </Field>
          <Field label="SEO Description (English)">
            <textarea
              value={form.seoMetaEn.description}
              onChange={(e) =>
                update("seoMetaEn", { ...form.seoMetaEn, description: e.target.value })
              }
              rows={2}
              className={textareaCls}
              placeholder="Within 200 chars..."
            />
          </Field>
        </Row>
        <Row>
          <ChipField
            label="Keywords (বাংলা)"
            chips={form.seoMetaBn.keywords}
            input={keywordBnInput}
            onInput={setKeywordBnInput}
            onAdd={() => addKeyword("bn")}
            onRemove={(i) => removeKeyword("bn", i)}
            placeholder="মিরপুর মেস"
          />
          <ChipField
            label="Keywords (English)"
            chips={form.seoMetaEn.keywords}
            input={keywordEnInput}
            onInput={setKeywordEnInput}
            onAdd={() => addKeyword("en")}
            onRemove={(i) => removeKeyword("en", i)}
            placeholder="mirpur bachelor mess"
          />
        </Row>
      </Section>

      {/* Visibility */}
      <Section title="দৃশ্যমানতা / Visibility">
        <div className="flex flex-wrap gap-4">
          <Toggle
            label="প্রকাশিত (Published)"
            checked={form.isPublished}
            onChange={(v) => update("isPublished", v)}
          />
          <Toggle
            label="ফিচার্ড (Featured on home)"
            checked={form.isFeatured}
            onChange={(v) => update("isFeatured", v)}
          />
          <Field label="Display Order">
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => update("displayOrder", Number(e.target.value))}
              className={inputCls + " max-w-[160px]"}
            />
          </Field>
        </div>
      </Section>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 lg:left-24 right-0 bg-card/90 backdrop-blur-md border-t border-border p-4 flex items-center justify-end gap-3 z-30">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin-dashboard/hostels")}
          className="rounded-xl font-bold"
        >
          বাতিল
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !valid}
          className="rounded-xl font-bold bg-primary text-primary-foreground px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করুন" : "তৈরি করুন"}
        </Button>
      </div>
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-12 px-4 rounded-xl bg-secondary/40 border border-border outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm";

const textareaCls =
  "w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border/40 rounded-[1.8rem] p-5 sm:p-7 space-y-5">
    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
      {title}
    </h2>
    <div className="space-y-5">{children}</div>
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center gap-3 cursor-pointer bg-secondary/40 border border-border rounded-xl px-4 py-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-primary"
    />
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
  </label>
);

const ChipField = ({
  label,
  chips,
  input,
  onInput,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  chips: string[];
  input: string;
  onInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">
      {label}
    </label>
    <div className="flex gap-2">
      <input
        value={input}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className={inputCls}
      />
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="rounded-xl h-12 px-4 text-xs font-bold whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
        >
          {c}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="hover:text-destructive"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  </div>
);

export default HostelEditor;
