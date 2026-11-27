import React, { useState } from "react";
import {
  Tag,
  IndianRupee,
  Save,
  Users,
  Bed,
  Sparkles,
  Percent,
  CheckCircle2,
  ArrowRight,
  Edit2,
  Plus,
  Trash2,
  X,
  Building,
  Check,
  Maximize2,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/hotel/pricing.js";
import {
  updateCategoryPrice,
  updateCategory,
  addCategoryAmenity,
  removeCategoryAmenity,
  addHotelFacility,
  removeHotelFacility,
  addHotelAmenity,
  removeHotelAmenity,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminPricingPage() {
  const state = useHotelState();
  const [editedPrices, setEditedPrices] = useState({});
  const taxRate = state.settings?.taxRate ?? 0.05;

  // Category Edit Modal State
  const [editCategoryModal, setEditCategoryModal] = useState(null);
  const [formName, setFormName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState(4999);
  const [formWeekendPrice, setFormWeekendPrice] = useState(5499);
  const [formExtraGuestPrice, setFormExtraGuestPrice] = useState(1200);
  const [formBed, setFormBed] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formMaxGuests, setFormMaxGuests] = useState(2);
  const [catAmenities, setCatAmenities] = useState([]);
  const [newAmenityInput, setNewAmenityInput] = useState("");

  // Facility management input
  const [newFacilityInput, setNewFacilityInput] = useState("");
  const [newMasterAmenityInput, setNewMasterAmenityInput] = useState("");

  const handlePriceChange = (id, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEditedPrices((prev) => ({ ...prev, [id]: num }));
  };

  const handleSavePrice = (cat) => {
    const newPrice = editedPrices[cat.id] ?? cat.price;
    updateCategoryPrice(cat.id, newPrice);
    toast.success(`Tariff for ${cat.name} updated to ${formatINR(newPrice)}/night! Synchronized across all booking engines.`);
  };

  const handleOpenEditCategory = (cat) => {
    setEditCategoryModal(cat);
    setFormName(cat.name);
    setFormTagline(cat.tagline || "");
    setFormDesc(cat.description || "");
    setFormPrice(cat.price);
    setFormWeekendPrice(cat.weekendPrice || cat.price + 500);
    setFormExtraGuestPrice(cat.extraGuestPrice || 1200);
    setFormBed(cat.bed || "1 King Bed");
    setFormSize(cat.size || "30 m²");
    setFormMaxGuests(cat.maxGuests || 2);
    setCatAmenities(cat.amenities || []);
    setNewAmenityInput("");
  };

  const handleAddAmenityToCat = () => {
    const trimmed = newAmenityInput.trim();
    if (!trimmed) return;
    if (catAmenities.includes(trimmed)) {
      toast.error(`"${trimmed}" is already assigned to this category.`);
      return;
    }
    setCatAmenities([...catAmenities, trimmed]);
    setNewAmenityInput("");
  };

  const handleRemoveAmenityFromCat = (am) => {
    setCatAmenities(catAmenities.filter((a) => a !== am));
  };

  const handleSaveCategoryModal = (e) => {
    e.preventDefault();
    if (!editCategoryModal) return;

    updateCategory(editCategoryModal.id, {
      name: formName.trim(),
      tagline: formTagline.trim(),
      description: formDesc.trim(),
      price: Number(formPrice),
      weekendPrice: Number(formWeekendPrice),
      extraGuestPrice: Number(formExtraGuestPrice),
      bed: formBed.trim(),
      size: formSize.trim(),
      maxGuests: Number(formMaxGuests),
      amenities: catAmenities,
    });

    toast.success(`${formName} updated! Amenities and rates updated live on Customer Website & Reception.`);
    setEditCategoryModal(null);
  };

  const handleAddFacility = (e) => {
    e.preventDefault();
    const clean = newFacilityInput.trim();
    if (!clean) return;
    addHotelFacility(clean);
    toast.success(`Facility "${clean}" added to hotel amenities directory.`);
    setNewFacilityInput("");
  };

  const handleRemoveFacility = (fac) => {
    removeHotelFacility(fac);
    toast.info(`Facility "${fac}" removed.`);
  };

  const handleAddMasterAmenity = (e) => {
    e.preventDefault();
    const clean = newMasterAmenityInput.trim();
    if (!clean) return;
    addHotelAmenity(clean);
    toast.success(`Amenity "${clean}" added to master room catalog.`);
    setNewMasterAmenityInput("");
  };

  const handleRemoveMasterAmenity = (am) => {
    removeHotelAmenity(am);
    toast.info(`Amenity "${am}" removed from master catalog.`);
  };

  const hotelFacilities = state.facilities || [];
  const masterAmenities = state.availableAmenities || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830]">
            Room Categories, Tariffs &amp; Amenities
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Centralized data source for room tiers, live nightly tariffs, specifications, in-room amenities, and property facilities.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs text-[#061830] shadow-sm">
          <Percent className="size-4 text-gold shrink-0" />
          <span>Statutory Room GST Tax: <strong className="text-gold font-bold">{(taxRate * 100).toFixed(0)}%</strong></span>
        </div>
      </div>

      {/* Category Cards in Luxury Light Theme */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {state.categories.map((cat) => {
          const currentPrice = editedPrices[cat.id] ?? cat.price;
          const gstAmount = Math.round(currentPrice * taxRate);
          const finalTotal = currentPrice + gstAmount;
          const isDirty = editedPrices[cat.id] !== undefined && editedPrices[cat.id] !== cat.price;

          return (
            <div
              key={cat.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-card hover:shadow-lift transition text-[#061830]"
            >
              {/* Card Header with Room Image */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(cat)}
                    className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#061830] shadow-md hover:bg-white cursor-pointer"
                  >
                    <Edit2 className="size-3 text-gold" /> Edit Tier
                  </button>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy-deep shadow-sm">
                    {cat.size || "Signature Tier"}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white mt-1">
                    {cat.name}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <p className="text-xs text-[#475569] leading-relaxed italic">
                  "{cat.tagline || cat.description}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#475569] border-y border-gold/15 py-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="size-3.5 text-gold shrink-0" />
                    <span>Max: {cat.maxGuests} Guests</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Bed className="size-3.5 text-gold shrink-0" />
                    <span className="truncate">{cat.bed}</span>
                  </div>
                </div>

                {/* Tariff Control */}
                <div className="space-y-2 rounded-xl bg-[#FAF7F2] p-3.5 border border-gold/20">
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block">
                    Base Nightly Tariff (INR)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-xs text-[#64748b] font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={currentPrice}
                        onChange={(e) => handlePriceChange(cat.id, e.target.value)}
                        className="w-full rounded-xl border border-gold/30 bg-white pl-7 pr-3 py-1.5 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none shadow-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSavePrice(cat)}
                      disabled={!isDirty}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        isDirty
                          ? "bg-gold text-gold-foreground shadow-gold hover:brightness-110"
                          : "border border-slate-200 text-[#94a3b8] cursor-not-allowed bg-slate-50"
                      }`}
                    >
                      <Save className="size-3.5" /> Save
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1">
                    <span>GST (5%): ₹{gstAmount}</span>
                    <span>Total with Tax: <strong className="text-gold font-bold">₹{finalTotal}</strong></span>
                  </div>
                </div>

                {/* Amenities List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                      Included Amenities ({cat.amenities.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="text-[10px] font-bold text-gold hover:underline"
                    >
                      + Manage
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.amenities.map((am) => (
                      <span
                        key={am}
                        className="rounded-full bg-[#FAF7F2] border border-gold/20 px-2.5 py-0.5 text-[10px] text-[#061830] font-medium"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centralized Facilities & Master Amenities Directory */}
      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {/* Hotel-wide Facilities Card */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/15 text-gold">
                <Building className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#061830]">
                  Hotel Facilities &amp; Property Features
                </h3>
                <p className="text-[11px] text-[#64748b]">Visible on public website and promotional materials</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddFacility} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 24-Hour Valet Parking, Rooftop Heated Pool..."
              value={newFacilityInput}
              onChange={(e) => setNewFacilityInput(e.target.value)}
              className="flex-1 rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
            >
              <Plus className="size-4" /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-1">
            {hotelFacilities.map((fac) => (
              <span
                key={fac}
                className="group inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-[#FAF7F2] px-3 py-1 text-xs text-[#061830] font-medium"
              >
                <Check className="size-3 text-emerald-600" />
                <span>{fac}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFacility(fac)}
                  title="Remove Facility"
                  className="size-3.5 rounded-full text-slate-400 hover:text-rose-600 ml-1 transition"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Master In-Room Amenities Catalog Card */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/15 text-gold">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#061830]">
                  Master Room Amenities Catalog
                </h3>
                <p className="text-[11px] text-[#64748b]">Available for assignment to suite categories &amp; rooms</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddMasterAmenity} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Nespresso Espresso Machine, Soaking Tub..."
              value={newMasterAmenityInput}
              onChange={(e) => setNewMasterAmenityInput(e.target.value)}
              className="flex-1 rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
            >
              <Plus className="size-4" /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto no-scrollbar">
            {masterAmenities.map((am) => (
              <span
                key={am}
                className="group inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-[#FAF7F2] px-3 py-1 text-xs text-[#061830] font-medium"
              >
                <span>{am}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMasterAmenity(am)}
                  title="Remove from Catalog"
                  className="size-3.5 rounded-full text-slate-400 hover:text-rose-600 ml-1 transition"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Category Specifications & Amenities Modal */}
      {editCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl border border-gold/30 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5">
            <div className="flex items-center justify-between border-b border-gold/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold font-bold">Category Configuration</span>
                <h2 className="font-display text-xl font-bold">Edit {editCategoryModal.name} Specifications</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditCategoryModal(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Base Nightly (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Weekend Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formWeekendPrice}
                    onChange={(e) => setFormWeekendPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Extra Guest (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formExtraGuestPrice}
                    onChange={(e) => setFormExtraGuestPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Bed Type
                  </label>
                  <input
                    type="text"
                    value={formBed}
                    onChange={(e) => setFormBed(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Room Size
                  </label>
                  <input
                    type="text"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Max Occupants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formMaxGuests}
                    onChange={(e) => setFormMaxGuests(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* In-Room Amenities Manager for this Category */}
              <div className="rounded-2xl border border-gold/25 bg-[#FAF7F2] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#061830]">
                    In-Room Amenities for {formName}
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    Changes reflect immediately on Customer Website
                  </span>
                </div>

                {/* Current Amenities as Dismissable Pills */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {catAmenities.map((am) => (
                    <span
                      key={am}
                      className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-white px-2.5 py-1 text-xs text-[#061830] font-semibold shadow-sm"
                    >
                      <span>{am}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenityFromCat(am)}
                        className="size-3.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition inline-flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {catAmenities.length === 0 && (
                    <span className="text-xs text-[#94a3b8] italic">No amenities assigned yet.</span>
                  )}
                </div>

                {/* Add Amenity to Category */}
                <div className="flex gap-2 pt-2 border-t border-gold/15">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewAmenityInput(e.target.value);
                      }
                    }}
                    value=""
                    className="rounded-xl border border-gold/30 bg-white px-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="">-- Choose from Master Catalog --</option>
                    {masterAmenities.map((am) => (
                      <option key={am} value={am}>
                        {am}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="or type custom amenity..."
                    value={newAmenityInput}
                    onChange={(e) => setNewAmenityInput(e.target.value)}
                    className="flex-1 rounded-xl border border-gold/30 bg-white px-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddAmenityToCat}
                    className="flex items-center gap-1 rounded-xl bg-gold px-3 py-1.5 text-xs font-bold uppercase text-navy-deep hover:brightness-110 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold/15">
                <button
                  type="button"
                  onClick={() => setEditCategoryModal(null)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-full bg-gold-gradient px-6 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
                >
                  <Save className="size-4" /> Save Category Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
